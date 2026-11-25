import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Background, Vignette} from './ui';
import {Subtitles} from './Subtitles';
import {Hook} from './scenes/Hook';
import {Single} from './scenes/Single';
import {Twins} from './scenes/Twins';
import {Reveal} from './scenes/Reveal';
import {Meaning} from './scenes/Meaning';
import {Outro} from './scenes/Outro';

export const Video: React.FC = () => (
  <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
    <Background />
    <Hook />
    <Single />
    <Twins />
    <Reveal />
    <Meaning />
    <Outro />
    <Vignette />
    <Subtitles />
  </AbsoluteFill>
);
