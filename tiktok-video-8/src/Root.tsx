import {Composition} from 'remotion';
import {Video} from './Video';
import {TL} from './model';

export const RemotionRoot: React.FC = () => (
  <Composition id="Donau" component={Video} durationInFrames={TL.durationInFrames} fps={TL.fps} width={1080} height={1920} />
);
