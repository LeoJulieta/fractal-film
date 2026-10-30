import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {GLCanvas} from './components/GLCanvas';
import {CardFinal} from './components/CardFinal';
import {filmScene} from './lib/filmScene';
// staticFile funciona en local, Colab, Kaggle y GitHub Actions (sin servidor local)
const M = staticFile('music.wav');

export type MainProps = {
  /** Resolución interna del raymarch (1 = 1080p completo). */
  quality?: number;
};

export const Main: React.FC<MainProps> = ({quality = 1}) => {
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <GLCanvas scene={filmScene} scale={quality} />
      <CardFinal frame={1350} />
      <Audio src={M} volume={0.95} />
    </AbsoluteFill>
  );
};
