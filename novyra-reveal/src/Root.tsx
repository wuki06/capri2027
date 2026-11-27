import {Composition} from 'remotion';
import {Video} from './Video';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="NovyraReveal" component={Video} durationInFrames={540} fps={30} width={1080} height={1920} />
    <Composition id="Thumbnail" component={Video} durationInFrames={540} fps={30} width={1080} height={1920} defaultProps={{thumb: true}} />
  </>
);
