import {Composition} from 'remotion';
import {Video} from './Video';
import {TL} from './timeline';

export const RemotionRoot: React.FC = () => (
  <Composition id="ErdTunnel" component={Video} durationInFrames={TL.durationInFrames} fps={TL.fps} width={1080} height={1920} />
);
