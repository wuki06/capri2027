import React, {useLayoutEffect, useRef} from 'react';
import {useCurrentFrame} from 'remotion';

export const W = 1080;
export const H = 1920;

/**
 * Canvas mit physikalisch plausiblem "Bloom": Das scharfe Bild wird zusätzlich
 * in 1/4 und 1/8 Auflösung weichgezeichnet und additiv darübergelegt.
 */
export const NeonCanvas: React.FC<{
  draw: (ctx: CanvasRenderingContext2D, frame: number) => void;
  bloom?: number;
  style?: React.CSSProperties;
}> = ({draw, bloom = 1, style}) => {
  const frame = useCurrentFrame();
  const main = useRef<HTMLCanvasElement>(null);
  const b1 = useRef<HTMLCanvasElement>(null);
  const b2 = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const c = main.current!;
    const ctx = c.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);
    draw(ctx, frame);
    for (const [ref, scale, blur] of [
      [b1, 4, 3],
      [b2, 10, 4],
    ] as const) {
      const bc = ref.current!;
      const bctx = bc.getContext('2d')!;
      bctx.clearRect(0, 0, bc.width, bc.height);
      bctx.filter = `blur(${blur}px)`;
      bctx.drawImage(c, 0, 0, W / scale, H / scale);
      bctx.filter = 'none';
    }
  }, [frame, draw]);

  const layer: React.CSSProperties = {position: 'absolute', inset: 0, width: W, height: H};
  return (
    <div style={{...layer, ...style}}>
      <canvas ref={main} width={W} height={H} style={layer} />
      <canvas
        ref={b1}
        width={W / 4}
        height={H / 4}
        style={{...layer, mixBlendMode: 'screen', opacity: 0.95 * bloom}}
      />
      <canvas
        ref={b2}
        width={W / 10}
        height={H / 10}
        style={{...layer, mixBlendMode: 'screen', opacity: 0.85 * bloom}}
      />
    </div>
  );
};
