import { Row, Col } from 'react-bootstrap';
import classes from './RoundHeader.module.css';
import clsx from 'clsx';
import sanitizeHtml from 'sanitize-html';
import Markdown from 'markdown-to-jsx';
import { useNavigate } from 'react-router-dom';
import ReadMore from '../ReadMore';
import { ForceOpenInNewTab } from '../ForceOpenInNewTab';
import { isLongName } from '../../utils/isLongName';
import dayjs from 'dayjs';
import formatTime from '../../utils/formatTime';
import { House, Round } from '@prophouse/sdk-react';
import { getDateFromTimestamp } from '../../utils/getDateFromTimestamp';
import RoundAwardsDisplay from '../RoundAwardsDisplay';
import { isMobile } from 'web3modal';

const RoundHeader: React.FC<{
  round: Round;
  house: House;
}> = props => {
  const { round, house } = props;

  const navigate = useNavigate();

  const roundDescription = (
    <>
      {/* support both markdown & html links in community's description.  */}
      <Markdown
        options={{
          overrides: {
            a: {
              component: ForceOpenInNewTab,
              props: {
                target: '_blank',
                rel: 'noreferrer',
              },
            },
          },
        }}
      >
        {sanitizeHtml(round.description as any, {
          allowedAttributes: {
            a: ['href', 'target'],
          },
        })}
      </Markdown>
    </>
  );

  return (
    <Row className={classes.roundHeaderRow}>
      <Col lg={12}>
        <div className={classes.backToHouse} onClick={() => navigate(`/${house.address}`)}>
          <img
            src={house.imageURI?.replace(/prophouse.mypinata.cloud/g, 'cloudflare-ipfs.com')}
            alt="community profile"
            className={classes.profImg}
          />
          <div className={classes.commTitle}>{house.name}</div>
        </div>
      </Col>
      <Row>
        <Col lg={7} className={classes.communityInfoCol}>
          <div className={classes.date}>
            {`${
              dayjs().isBefore(round.config.proposalPeriodStartTimestamp) ? `Starts` : `Started`
            } ${formatTime(getDateFromTimestamp(round.config.proposalPeriodStartTimestamp))}`}
          </div>
          <Col className={clsx(classes.titleRow, isLongName(house.name!) && classes.longName)}>
            <div className={classes.title}>{`${round.title}`}</div>
          </Col>

          <Col className={classes.communityDescriptionRow}>
            <ReadMore description={roundDescription} />
          </Col>
        </Col>

        <Col lg={5} className={classes.awardsCol}>
          <div className={classes.awardsTitle}>Awards</div>
          <div className={classes.awardsSubtitle}>Props with the most votes win awards.</div>
          <RoundAwardsDisplay
            round={round}
            breakout={isMobile()}
            slidesOffsetBefore={isMobile() ? 12 : 0}
            showNav={!isMobile()}
          />
        </Col>
      </Row>
    </Row>
  );
};

export default RoundHeader;
