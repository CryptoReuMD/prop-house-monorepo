import {
  Proposal,
  StoredAuction,
  StoredProposal,
  StoredVote,
} from '@nouns/prop-house-wrapper/dist/builders';
import { Row, Col } from 'react-bootstrap';
import ProposalCard from '../ProposalCard';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { PropHouseWrapper } from '@nouns/prop-house-wrapper';
import { useEffect, useRef, useState } from 'react';
import { auctionStatus, AuctionStatus } from '../../utils/auctionStatus';
import { cardStatus } from '../../utils/cardStatus';
import { setActiveProposals } from '../../state/slices/propHouse';
import { useEthers } from '@usedapp/core';
import countNumVotesForProposal from '../../utils/countNumVotesForProposal';
import extractAllVotes from '../../utils/extractAllVotes';
import { Direction, Vote } from '@nouns/prop-house-wrapper/dist/builders';
import { refreshActiveProposals } from '../../utils/refreshActiveProposal';
import Modal, { ModalData } from '../Modal';

export interface VoteAllotment {
  proposalId: number;
  votes: number;
}

const updateAllotmentVote = (
  v: VoteAllotment,
  support: boolean
): VoteAllotment => ({
  proposalId: v.proposalId,
  votes: support ? v.votes + 1 : v.votes === 0 ? 0 : v.votes - 1,
});

export const votesForProp = (
  voteAllotments: VoteAllotment[],
  proposalId: number
) => {
  const a = voteAllotments.find((a) => a.proposalId === proposalId);
  return a ? a.votes : 0;
};

const ProposalCards: React.FC<{
  auction: StoredAuction;
  showAllProposals: boolean;
}> = (props) => {
  const { auction, showAllProposals } = props;

  const dispatch = useAppDispatch();
  const { account, library: provider } = useEthers();
  const host = useAppSelector((state) => state.configuration.backendHost);
  const client = useRef(new PropHouseWrapper(host));

  const [voteAllotments, setVoteAllotments] = useState<VoteAllotment[]>([]);
  const [userVotes, setUserVotes] = useState<StoredVote[]>();
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<ModalData>();

  const proposals = useAppSelector((state) => state.propHouse.activeProposals);
  const delegatedVotes = useAppSelector(
    (state) => state.propHouse.delegatedVotes
  );

  useEffect(() => {
    client.current = new PropHouseWrapper(host, provider?.getSigner());
  }, [provider, host]);

  // fetch proposals
  useEffect(() => {
    const fetchAuctionProposals = async () => {
      const proposals = await client.current.getAuctionProposals(auction.id);
      dispatch(setActiveProposals(proposals));
      setUserVotes(extractAllVotes(proposals, account ? account : ''));
    };
    fetchAuctionProposals();
  }, [auction.id, dispatch, account]);

  // update user votes on proposal updates
  useEffect(() => {
    if (!proposals) return;
    setUserVotes(extractAllVotes(proposals, account ? account : ''));
  }, [proposals, account]);

  const canAllotVotes = () => {
    if (!delegatedVotes || !userVotes) return false;

    const numAllotedVotes = voteAllotments.reduce(
      (counter, allotment) => counter + allotment.votes,
      0
    );
    return userVotes.length < numAllotedVotes;
  };

  // manage alloting
  const handleVoteAllotment = (proposalId: number, support: boolean) => {
    setVoteAllotments((prev) => {
      // if not votes have been allotted yet, add new
      if (prev.length === 0) return [{ proposalId, votes: 1 }];

      const preexistingVoteAllotment = prev.find(
        (allotment) => allotment.proposalId === proposalId
      );

      // if not already alloted to proposal,  add new allotment
      if (!preexistingVoteAllotment) return [...prev, { proposalId, votes: 1 }];

      // if already allotted, add one vote to allotment
      const updated = prev.map((a) =>
        a.proposalId === preexistingVoteAllotment.proposalId
          ? updateAllotmentVote(a, support)
          : a
      );

      return updated;
    });
  };

  const handleUserVote = async (direction: Direction, proposalId: number) => {
    if (!delegatedVotes || !userVotes) return;

    setShowModal(true);
    try {
      setModalData({
        title: 'Voting',
        content:
          direction === Direction.Up
            ? `Please sign the message to vote for proposal #${proposalId}`
            : `Please sign the message to remove your vote on proposal #${proposalId}`,
        onDismiss: () => setShowModal(false),
      });

      await client.current.logVote(new Vote(direction, proposalId));

      setModalData({
        title: 'Success',
        content:
          direction === Direction.Up
            ? `You have successfully voted for proposal #${proposalId}`
            : `You have successfully removed a vote for proposal #${proposalId}`,
        onDismiss: () => setShowModal(false),
      });

      refreshActiveProposals(client.current, auction.id, dispatch);
    } catch (e) {
      setModalData({
        title: 'Error',
        content:
          direction === Direction.Up
            ? `Failed to vote on proposal #${proposalId}.\n\nError message: ${e}`
            : `Failed to remove vote on proposal #${proposalId}.\n\nError message: ${e}`,
        onDismiss: () => setShowModal(false),
      });
    }
  };

  const handleResubmission = async (
    proposal: StoredProposal,
    auctionIdToSubmitTo: number,
    callback: () => void
  ) => {
    await client.current.createProposal(
      new Proposal(
        proposal.title,
        proposal.who,
        proposal.what,
        proposal.tldr,
        proposal.links,
        auctionIdToSubmitTo
      )
    );
    callback();
  };

  return (
    <>
      {showModal && modalData && <Modal data={modalData} />}
      <Row>
        {proposals &&
          proposals
            .slice(0, showAllProposals ? proposals.length : 6)
            .map((proposal, index) => {
              return (
                <Col key={index} xl={4}>
                  <ProposalCard
                    proposal={proposal}
                    auctionStatus={auctionStatus(auction)}
                    cardStatus={cardStatus(
                      delegatedVotes ? delegatedVotes > 0 : false,
                      auction
                    )}
                    showResubmissionBtn={
                      auctionStatus(auction) === AuctionStatus.AuctionEnded &&
                      account === proposal.address
                    }
                    votesFor={countNumVotesForProposal(
                      userVotes ? userVotes : [],
                      proposal.id
                    )}
                    handleResubmission={handleResubmission}
                    canAllotVotes={canAllotVotes}
                    voteAllotments={voteAllotments}
                    handleVoteAllotment={handleVoteAllotment}
                  />
                </Col>
              );
            })}
      </Row>
    </>
  );
};
export default ProposalCards;
