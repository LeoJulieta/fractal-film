import React from 'react';
import {AbsoluteFill} from 'remotion';

export const CardFinal: React.FC<{frame: number}> = ({frame}) => {
  const opacity = Math.min(1, Math.max(0, (frame - 1230) / 60));
  return (
    <AbsoluteFill style={{
      background: 'radial-gradient(circle at 50% 40%, #140a28 0%, #030205 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity,
    }}>
      <div style={{
        textAlign: 'center', color: '#f7f0ff',
        fontFamily: '"Playfair Display", "Cinzel", Georgia, serif',
        letterSpacing: '0.35em',
      }}>
        <div style={{fontSize: 72, fontWeight: 300, opacity: 0.9, textShadow: '0 0 60px rgba(220,180,255,0.35)'}}>INFINITO</div>
        <div style={{fontSize: 14, letterSpacing: '0.5em', marginTop: 22, color: '#c4b0e8', fontFamily: 'sans-serif', textTransform: 'uppercase'}}>
          un filme generado por fórmulas
        </div>
      </div>
    </AbsoluteFill>
  );
};
