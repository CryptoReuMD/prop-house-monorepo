import { StoredReply } from '@nouns/prop-house-wrapper/dist/builders';
import classes from './Reply.module.css';
import EthAddress from '../EthAddress';
import dayjs from 'dayjs';

const Reply: React.FC<{ reply: StoredReply }> = props => {
  const { reply } = props;

  return (
    <div className={classes.replyContainer}>
      <div className={classes.replyHeader}>
        <div className={classes.address}>
          {
            <EthAddress
              className={classes.ethAddress}
              address={reply.address}
              addAvatar={true}
              avatarDiameter={14}
            />
          }
        </div>
        <div className={classes.timestamp}>{dayjs(reply.createdAt).fromNow()}</div>
      </div>
      <div className={classes.replyBody}>{reply.content}</div>
    </div>
  );
};

export default Reply;
