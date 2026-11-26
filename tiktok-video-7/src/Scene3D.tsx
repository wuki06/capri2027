import React, {useLayoutEffect, useMemo} from 'react';
import {staticFile, useCurrentFrame} from 'remotion';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {BOARD, CARDS, FPS, HEILBRONN, HELIX, MAP, SWAB, camAt, clamp, line, proj, rand, scene, smooth, wordAt} from './model';

export type Geo = Record<string, number[][][]>; // Land -> Polygone (äußere Ringe) [lon, lat]

const canvasTex = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};
const F = "'Inter Display', 'Inter', sans-serif";
const SERIF = "'DejaVu Serif', serif";

const paper = (c: CanvasRenderingContext2D, w: number, h: number, base = '#e9e2d0') => {
  c.fillStyle = base;
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 2500; i++) {
    c.fillStyle = `rgba(120,100,70,${rand(i) * 0.06})`;
    c.fillRect(rand(i + 1) * w, rand(i + 2) * h, 2 + rand(i + 3) * 6, 1 + rand(i + 4) * 3);
  }
  const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(80,60,30,0.35)');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
};
const textLines = (c: CanvasRenderingContext2D, x: number, y: number, w: number, n: number, gap = 22) => {
  c.fillStyle = 'rgba(40,40,40,0.55)';
  for (let i = 0; i < n; i++) c.fillRect(x, y + i * gap, w * (0.75 + rand(i + y) * 0.25), 7);
};

const cardTex = {
  phantom: () =>
    canvasTex(600, 780, (c) => {
      paper(c, 600, 780, '#d8d4cc');
      c.fillStyle = '#2a2a2e';
      c.fillRect(40, 40, 520, 560);
      c.fillStyle = '#0c0c0e';
      c.beginPath();
      c.ellipse(300, 260, 120, 150, 0, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.ellipse(300, 600, 230, 160, 0, Math.PI, 0);
      c.fill();
      c.font = `900 220px ${F}`;
      c.textAlign = 'center';
      c.fillStyle = '#e8e8e8';
      c.fillText('?', 300, 335);
      c.font = `900 40px ${F}`;
      c.fillStyle = '#b01818';
      c.fillText('UNBEKANNTE TÄTERIN', 300, 670);
      c.font = `600 28px ${F}`;
      c.fillStyle = '#333';
      c.fillText('DNA-Profil: weiblich · ~40 Tatorte', 300, 720);
    }),
  headline: () =>
    canvasTex(700, 520, (c) => {
      paper(c, 700, 520);
      c.fillStyle = '#111';
      c.font = `700 30px ${SERIF}`;
      c.fillText('DIE TAGESZEITUNG', 30, 50);
      c.fillRect(30, 62, 640, 3);
      c.font = `900 62px ${F}`;
      c.fillText('DAS PHANTOM', 30, 140);
      c.fillText('VON HEILBRONN', 30, 210);
      textLines(c, 30, 250, 300, 10);
      c.fillStyle = '#555';
      c.fillRect(360, 245, 310, 230);
    }),
  noface: () =>
    canvasTex(620, 460, (c) => {
      paper(c, 620, 460, '#efe9da');
      c.fillStyle = '#111';
      c.font = `900 58px ${F}`;
      c.fillText('Die Frau', 28, 85);
      c.fillText('ohne Gesicht', 28, 150);
      textLines(c, 28, 190, 560, 10);
    }),
  reward: () =>
    canvasTex(560, 760, (c) => {
      paper(c, 560, 760, '#f2ece0');
      c.fillStyle = '#b01818';
      c.fillRect(0, 0, 560, 130);
      c.fillStyle = '#fff';
      c.font = `900 70px ${F}`;
      c.textAlign = 'center';
      c.fillText('BELOHNUNG', 280, 92);
      c.fillStyle = '#111';
      c.font = `900 96px ${F}`;
      c.fillText('300.000 €', 280, 260);
      c.font = `600 30px ${F}`;
      c.fillText('für Hinweise zur Täterin', 280, 320);
      textLines(c, 50, 380, 460, 12);
      c.font = `900 34px ${F}`;
      c.fillText('POLIZEI', 280, 720);
    }),
  dna: () =>
    canvasTex(520, 640, (c) => {
      paper(c, 520, 640, '#f4f4f2');
      c.fillStyle = '#111';
      c.font = `800 34px ${F}`;
      c.fillText('DNA-ANALYSE', 30, 55);
      for (let lane = 0; lane < 6; lane++) {
        for (let b = 0; b < 16; b++) {
          if (rand(lane * 40 + b) > 0.45) {
            c.fillStyle = `rgba(20,20,60,${0.4 + rand(b + lane) * 0.6})`;
            c.fillRect(40 + lane * 75, 90 + b * 30 + rand(b * lane) * 10, 55, 8);
          }
        }
      }
      c.fillStyle = '#b01818';
      c.font = `900 30px ${F}`;
      c.fillText('TREFFER: IDENTISCH', 30, 610);
    }),
  map: () =>
    canvasTex(600, 440, (c) => {
      paper(c, 600, 440, '#dfe6e0');
      c.strokeStyle = '#557';
      c.lineWidth = 2;
      for (let i = 0; i < 18; i++) {
        c.beginPath();
        c.moveTo(rand(i) * 600, rand(i + 1) * 440);
        c.lineTo(rand(i + 2) * 600, rand(i + 3) * 440);
        c.stroke();
      }
      for (let i = 0; i < 25; i++) {
        c.fillStyle = '#c01818';
        c.beginPath();
        c.arc(60 + rand(i + 9) * 480, 50 + rand(i + 19) * 340, 8, 0, Math.PI * 2);
        c.fill();
      }
    }),
  wende: () =>
    canvasTex(620, 460, (c) => {
      paper(c, 620, 460, '#fff6c8');
      c.fillStyle = '#111';
      c.font = `900 70px ${F}`;
      c.fillText('2009', 30, 90);
      c.font = `800 40px ${F}`;
      c.fillText('Ihre DNA bei einem', 30, 160);
      c.fillText('toten MANN?!', 30, 210);
      c.fillStyle = '#b01818';
      c.font = `900 52px ${F}`;
      c.fillText('UNMÖGLICH', 30, 300);
      c.strokeStyle = '#b01818';
      c.lineWidth = 8;
      c.beginPath();
      c.ellipse(170, 285, 165, 55, -0.05, 0, Math.PI * 2);
      c.stroke();
    }),
  nsu: () =>
    canvasTex(700, 360, (c) => {
      paper(c, 700, 360, '#e6e6e6');
      c.fillStyle = '#111';
      c.font = `900 56px ${F}`;
      c.fillText('2011', 30, 80);
      c.font = `700 36px ${F}`;
      c.fillText('Mord an der Polizistin', 30, 150);
      c.fillText('wird der Terrorgruppe', 30, 200);
      c.fillText('NSU zugeordnet.', 30, 250);
    }),
};

const corkTex = () =>
  canvasTex(1024, 1024, (c) => {
    c.fillStyle = '#9a6a3e';
    c.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 30000; i++) {
      c.fillStyle = rand(i) > 0.5 ? 'rgba(70,40,15,0.35)' : 'rgba(200,150,90,0.3)';
      c.fillRect(rand(i + 1) * 1024, rand(i + 2) * 1024, 2 + rand(i + 3) * 3, 2 + rand(i + 4) * 3);
    }
  });
const glowTex = (col: string) =>
  canvasTex(128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.3, col);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
  });

const Rig: React.FC = () => {
  const frame = useCurrentFrame();
  const {camera, gl, scene: sc} = useThree();
  useLayoutEffect(() => {
    gl.shadowMap.enabled = true;
    const pm = new THREE.PMREMGenerator(gl);
    sc.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    sc.environmentIntensity = 0.25;
    sc.background = new THREE.Color('#040406');
    sc.fog = new THREE.Fog('#040406', 6, 22);
  }, [gl, sc]);
  useLayoutEffect(() => {
    const c = camAt(frame / FPS);
    const pc = camera as THREE.PerspectiveCamera;
    pc.position.set(c.pos[0], c.pos[1], c.pos[2]);
    pc.lookAt(c.look[0], c.look[1], c.look[2]);
    pc.fov = c.fov;
    pc.near = 0.02;
    pc.far = 60;
    pc.updateProjectionMatrix();
  }, [frame, camera]);
  return null;
};

// ---------------------------------------------------------------- DNA-Helix
const Helix: React.FC<{t: number}> = ({t}) => {
  const red = useMemo(() => new THREE.MeshStandardMaterial({color: '#ff2a3a', emissive: '#ff1a2a', emissiveIntensity: 1.4, roughness: 0.3}), []);
  const white = useMemo(() => new THREE.MeshStandardMaterial({color: '#ffffff', emissive: '#aab8ff', emissiveIntensity: 0.9, roughness: 0.3}), []);
  const rung = useMemo(() => new THREE.MeshStandardMaterial({color: '#888', emissive: '#553', emissiveIntensity: 0.4, roughness: 0.4, transparent: true, opacity: 0.8}), []);
  const N = 34;
  return (
    <group position={HELIX as any} rotation-y={t * 0.6} rotation-z={0.35}>
      {Array.from({length: N}, (_, i) => {
        const y = (i - N / 2) * 0.13;
        const a = i * 0.42;
        const p1: [number, number, number] = [Math.cos(a) * 0.55, y, Math.sin(a) * 0.55];
        const p2: [number, number, number] = [-Math.cos(a) * 0.55, y, -Math.sin(a) * 0.55];
        return (
          <group key={i}>
            <mesh position={p1} material={red}>
              <sphereGeometry args={[0.075, 16, 12]} />
            </mesh>
            <mesh position={p2} material={white}>
              <sphereGeometry args={[0.075, 16, 12]} />
            </mesh>
            <mesh position={[0, y, 0]} rotation-y={-a} rotation-z={Math.PI / 2} material={rung}>
              <cylinderGeometry args={[0.018, 0.018, 1.1, 8]} />
            </mesh>
          </group>
        );
      })}
      <pointLight intensity={3} distance={6} color="#ff3040" />
    </group>
  );
};

// ---------------------------------------------------------------- Karte
const MapTable: React.FC<{t: number; geo: Geo}> = ({t, geo}) => {
  const shapes = useMemo(() => {
    const out: {key: string; geom: THREE.ExtrudeGeometry; line: THREE.BufferGeometry; col: string}[] = [];
    const cols: Record<string, string> = {DEU: '#4a5670', AUT: '#55496a', FRA: '#425062', CHE: '#2a2d36'};
    for (const [k, polys] of Object.entries(geo)) {
      polys.forEach((ring, j) => {
        const s = new THREE.Shape(ring.map(([lon, lat]) => {
          const [x, z] = proj(lon, lat);
          return new THREE.Vector2(x, -z);
        }));
        const g = new THREE.ExtrudeGeometry(s, {depth: 0.05, bevelEnabled: false});
        g.rotateX(-Math.PI / 2);
        const pts = ring.map(([lon, lat]) => {
          const [x, z] = proj(lon, lat);
          return new THREE.Vector3(x, 0.055, z);
        });
        out.push({key: k + j, geom: g, line: new THREE.BufferGeometry().setFromPoints(pts), col: cols[k] ?? '#222'});
      });
    }
    return out;
  }, [geo]);
  // Tatorte: zufällige Punkte in DE/AT/FR (Bayern blieb spurlos – dort nutzte die Polizei andere Stäbchen)
  const pins = useMemo(() => {
    const inside = (x: number, y: number, ring: number[][]) => {
      let c = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
      }
      return c;
    };
    const out: [number, number][] = [];
    let i = 0;
    while (out.length < 39 && i < 5000) {
      const lon = -2 + rand(i * 2) * 19;
      const lat = 43 + rand(i * 2 + 1) * 11;
      i++;
      const bavaria = lon > 10.1 && lat < 50.4 && lon < 13.8 && lat > 47.3;
      const ok = ['DEU', 'AUT', 'FRA'].some((k) => geo[k]?.some((r) => inside(lon, lat, r)));
      if (ok && !bavaria) out.push(proj(lon, lat));
    }
    return out;
  }, [geo]);
  const p1 = line('p1').start + 1.2;
  const p3 = line('p3').end;
  const hb = wordAt('p4', 'Heilbronn');
  const pinMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#e01b24', roughness: 0.3, metalness: 0.2, emissive: '#5a0000', emissiveIntensity: 0.6}), []);
  const steel = useMemo(() => new THREE.MeshStandardMaterial({color: '#cfd3d8', metalness: 1, roughness: 0.25}), []);
  const policeOn = t > hb - 0.2 && t < scene('heilbronn').end + 0.2;
  const blue = policeOn ? Math.max(0, Math.sin(t * 14)) : 0;
  const redL = policeOn ? Math.max(0, Math.sin(t * 14 + Math.PI)) : 0;
  const pin = (x: number, z: number, k: number, big = 1) => (
    <group position={[x, 0.05 + (1 - k) * 0.6, z]} scale={2 * big * Math.max(0.001, k)}>
      <mesh position={[0, 0.16, 0]} material={pinMat} castShadow>
        <sphereGeometry args={[0.06, 16, 12]} />
      </mesh>
      <mesh position={[0, 0.06, 0]} material={steel}>
        <cylinderGeometry args={[0.008, 0.004, 0.2, 6]} />
      </mesh>
    </group>
  );
  return (
    <group position={MAP as any}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1a1512" roughness={0.6} metalness={0.1} />
      </mesh>
      {shapes.map((s) => (
        <group key={s.key}>
          <mesh geometry={s.geom} receiveShadow>
            <meshStandardMaterial color={s.col} roughness={0.7} />
          </mesh>
          <lineLoop geometry={s.line}>
            <lineBasicMaterial color="#c8d6f0" />
          </lineLoop>
        </group>
      ))}
      {pins.map(([x, z], i) => {
        const at = p1 + (i / pins.length) ** 1.3 * (p3 - p1);
        const k = smooth((t - at) / 0.25);
        return <React.Fragment key={i}>{k > 0 && pin(x, z, k)}</React.Fragment>;
      })}
      {t > hb - 0.1 && pin(HEILBRONN[0], HEILBRONN[1], smooth((t - hb + 0.1) / 0.3), 1.8)}
      <spotLight position={[0, 9, 2]} angle={0.9} penumbra={0.6} intensity={90} color="#ffe0b0" castShadow target-position={MAP as any} />
      <pointLight position={[HEILBRONN[0] - 0.6, 0.8, HEILBRONN[1] + 0.3]} intensity={8 * blue} distance={6} color="#2050ff" />
      <pointLight position={[HEILBRONN[0] + 0.6, 0.8, HEILBRONN[1] + 0.3]} intensity={8 * redL} distance={6} color="#ff2020" />
    </group>
  );
};

// ---------------------------------------------------------------- Pinnwand
const Board: React.FC<{t: number}> = ({t}) => {
  const cork = useMemo(corkTex, []);
  const tex = useMemo(() => Object.fromEntries(Object.entries(cardTex).map(([k, f]) => [k, f()])) as unknown as Record<keyof typeof CARDS, THREE.Texture>, []);
  const sizes: Record<keyof typeof CARDS, [number, number]> = {
    phantom: [1.5, 1.95],
    headline: [1.75, 1.3],
    noface: [1.55, 1.15],
    reward: [1.2, 1.63],
    dna: [1.1, 1.35],
    map: [1.4, 1.03],
    wende: [1.5, 1.11],
    nsu: [1.9, 0.98],
  };
  const appear: Partial<Record<keyof typeof CARDS, number>> = {
    wende: line('r1').start + 0.2,
    nsu: scene('epilog').start + 0.3,
  };
  const burn = clamp((t - wordAt('r2', 'nie') - 0.1) / 1.0);
  const pinMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#e01b24', roughness: 0.3}), []);
  const thread = useMemo(() => new THREE.MeshStandardMaterial({color: '#c8101a', roughness: 0.6, emissive: '#400', emissiveIntensity: 0.5}), []);
  const links: [keyof typeof CARDS, keyof typeof CARDS][] = [
    ['phantom', 'headline'],
    ['phantom', 'noface'],
    ['phantom', 'reward'],
    ['phantom', 'dna'],
    ['phantom', 'map'],
    ['dna', 'map'],
  ];
  const pinPos = (k: keyof typeof CARDS) => [CARDS[k][0], CARDS[k][1] + sizes[k][1] / 2 - 0.08] as const;
  const dim = t > scene('epilog').start ? 0.55 : 1;
  return (
    <group position={BOARD as any}>
      <mesh position={[0, 0, -0.03]} receiveShadow>
        <boxGeometry args={[6.4, 8.2, 0.06]} />
        <meshStandardMaterial map={cork} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0, -0.1]}>
        <boxGeometry args={[6.7, 8.5, 0.1]} />
        <meshStandardMaterial color="#2a1a10" roughness={0.6} />
      </mesh>
      {(Object.keys(CARDS) as (keyof typeof CARDS)[]).map((k, i) => {
        const at = appear[k];
        if (at !== undefined && t < at) return null;
        const pop = at !== undefined ? smooth((t - at) / 0.35) : 1;
        const isPh = k === 'phantom';
        const op = isPh ? 1 - burn : 1;
        if (op <= 0.01) return null;
        return (
          <group key={k} position={[CARDS[k][0], CARDS[k][1], 0.01 + i * 0.002]} rotation-z={(rand(i) - 0.5) * 0.12} scale={(0.6 + 0.4 * pop) * (isPh ? 1 + burn * 0.15 : 1)}>
            <mesh castShadow>
              <planeGeometry args={sizes[k]} />
              <meshStandardMaterial map={tex[k]} roughness={0.85} transparent opacity={op} emissive={isPh && burn > 0 ? '#ff5a10' : '#000'} emissiveIntensity={burn * 2} />
            </mesh>
          </group>
        );
      })}
      {links.map(([a, b], i) => {
        if (burn > 0.5 && (a === 'phantom' || b === 'phantom')) return null;
        const [x1, y1] = pinPos(a);
        const [x2, y2] = pinPos(b);
        const len = Math.hypot(x2 - x1, y2 - y1);
        return (
          <mesh key={i} position={[(x1 + x2) / 2, (y1 + y2) / 2, 0.06]} rotation-z={Math.atan2(y2 - y1, x2 - x1) - Math.PI / 2} material={thread}>
            <cylinderGeometry args={[0.012, 0.012, len, 6]} />
          </mesh>
        );
      })}
      {(Object.keys(CARDS) as (keyof typeof CARDS)[]).map((k) => {
        if ((appear[k] !== undefined && t < appear[k]!) || (k === 'phantom' && burn > 0.5)) return null;
        const [x, y] = pinPos(k);
        return (
          <mesh key={'p' + k} position={[x, y, 0.07]} material={pinMat}>
            <sphereGeometry args={[0.05, 14, 10]} />
          </mesh>
        );
      })}
      <spotLight position={[0, 3.5, 5]} angle={0.7} penumbra={0.7} intensity={70 * dim} color="#ffe3c0" castShadow target-position={BOARD as any} />
      <pointLight position={[0, 1.2, 1.2]} intensity={burn > 0 && burn < 1 ? 6 * (1 - burn) : 0} distance={4} color="#ff6a20" />
    </group>
  );
};

// ---------------------------------------------------------------- Wattestäbchen
const Swab: React.FC<{t: number}> = ({t}) => {
  const cotton = useMemo(() => {
    const g = new THREE.CapsuleGeometry(0.07, 0.16, 12, 24);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      const n = 1 + 0.08 * Math.sin(v.x * 90) * Math.cos(v.y * 70) + 0.05 * Math.sin(v.z * 120);
      pos.setXYZ(i, v.x * n, v.y, v.z * n);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const glow = useMemo(() => glowTex('rgba(255,40,60,0.6)'), []);
  const label = useMemo(
    () =>
      canvasTex(512, 256, (c) => {
        c.fillStyle = '#f4f4f4';
        c.fillRect(0, 0, 512, 256);
        c.fillStyle = '#1a4aa0';
        c.fillRect(0, 0, 512, 60);
        c.fillStyle = '#fff';
        c.font = `900 40px ${F}`;
        c.fillText('STERIL', 20, 45);
        c.fillStyle = '#111';
        c.font = `700 30px ${F}`;
        c.fillText('Abstrichtupfer', 20, 120);
        c.fillStyle = '#b01818';
        c.font = `800 26px ${F}`;
        c.fillText('nicht DNA-frei', 20, 190);
      }),
    [],
  );
  const reveal = smooth((t - wordAt('r3', 'Wattestäbchen')) / 0.6);
  const touch = smooth((t - wordAt('r3', 'Arbeiterin')) / 0.8);
  return (
    <group position={SWAB as any} rotation-z={0.25}>
      <mesh position={[0, -0.32, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#d8dde2" roughness={0.35} metalness={0.05} />
      </mesh>
      <group rotation-z={-0.25} position={[0, -0.2, 0]} rotation-x={0.0}>
        <group rotation-z={1.25}>
          <mesh position={[0, -0.35, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.75, 12]} />
            <meshStandardMaterial color="#f8f8f4" roughness={0.4} />
          </mesh>
          <mesh geometry={cotton} position={[0, 0.1, 0]}>
            <meshStandardMaterial color="#fbfbf8" roughness={1} />
          </mesh>
          {/* Röhrchen */}
          <mesh position={[0, -0.18, 0]}>
            <cylinderGeometry args={[0.105, 0.105, 0.95, 32, 1, true]} />
            <meshPhysicalMaterial color="#e8f2ff" transparent opacity={0.22} roughness={0.05} clearcoat={1} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <mesh position={[0, -0.25, 0.106]}>
            <planeGeometry args={[0.2, 0.1]} />
            <meshStandardMaterial map={label} roughness={0.6} />
          </mesh>
          {/* DNA-Spuren auf der Watte */}
          {Array.from({length: 36}, (_, i) => {
            const a = rand(i) * Math.PI * 2;
            const y = 0.02 + rand(i + 1) * 0.18;
            const r = 0.075 + Math.sin(t * 2 + i) * 0.004;
            const s = (0.025 + rand(i + 2) * 0.03) * (reveal * 0.5 + touch * 0.8);
            return (
              <sprite key={i} position={[Math.cos(a) * r, y, Math.sin(a) * r]} scale={[s, s, 1]}>
                <spriteMaterial map={glow} blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.9} />
              </sprite>
            );
          })}
        </group>
      </group>
      <spotLight position={[0.8, 2.2, 1.6]} angle={0.5} penumbra={0.8} intensity={30} color="#ffffff" castShadow target-position={SWAB as any} />
      <pointLight position={[-1, 0.4, -0.6]} intensity={2} distance={4} color="#5070ff" />
    </group>
  );
};

export const Scene3D: React.FC<{geo: Geo}> = ({geo}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <>
      <Rig />
      <ambientLight intensity={0.08} />
      <Helix t={t} />
      <MapTable t={t} geo={geo} />
      <Board t={t} />
      <Swab t={t} />
    </>
  );
};

export const geoUrl = (c: string) => staticFile(`geo/${c}.json`);
