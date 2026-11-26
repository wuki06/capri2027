import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {useCurrentFrame} from 'remotion';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {COIN, COINS, EV, FPS, at, ageAt, clamp, line, scene, smooth} from './model';

const R = 0.1;
const TH = 0.034;
const PILE_X = [-0.42, 0.42];
const STACK = [[-0.105, -0.105], [0.105, -0.105], [-0.105, 0.105], [0.105, 0.105]];
const coinPos = (p: number, k: number) => {
  const [dx, dz] = STACK[k % 4];
  const lvl = Math.floor(k / 4);
  const jitter = Math.sin(k * 12.9898) * 0.006;
  return [PILE_X[p] + dx + jitter, TH / 2 + lvl * TH, dz + Math.cos(k * 4.1) * 0.006, (k * 0.7) % 6.28] as const;
};

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
const faceTex = (gold: boolean) =>
  canvasTex(256, 256, (c) => {
    const g = c.createRadialGradient(128, 128, 20, 128, 128, 128);
    g.addColorStop(0, gold ? '#ffe08a' : '#f2f4f6');
    g.addColorStop(1, gold ? '#b8862a' : '#9aa0a8');
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 256);
    c.strokeStyle = gold ? '#8a6418' : '#70767e';
    c.lineWidth = 10;
    c.beginPath();
    c.arc(128, 128, 112, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = gold ? '#7a5410' : '#5a6068';
    c.font = "900 120px 'Inter Display', 'Inter', sans-serif";
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('€', 128, 134);
  });
const plateTex = (name: string, col: string) =>
  canvasTex(512, 160, (c) => {
    c.fillStyle = '#0c0d10';
    c.fillRect(0, 0, 512, 160);
    c.strokeStyle = col;
    c.lineWidth = 8;
    c.strokeRect(6, 6, 500, 148);
    c.fillStyle = '#fff';
    c.font = "900 96px 'Inter Display', 'Inter', sans-serif";
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.shadowColor = col;
    c.shadowBlur = 20;
    c.fillText(name, 256, 86);
  });

const Rig: React.FC = () => {
  const frame = useCurrentFrame();
  const {camera, gl, scene: sc} = useThree();
  useLayoutEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    const pm = new THREE.PMREMGenerator(gl);
    sc.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    sc.environmentIntensity = 0.6;
    sc.background = new THREE.Color('#07080b');
  }, [gl, sc]);
  useLayoutEffect(() => {
    const t = frame / FPS;
    const pc = camera as THREE.PerspectiveCamera;
    // Kamera fährt mit der Höhe der Türme mit
    const h = Math.max(0.25, Math.max(at(0, ageAt(t)).value, at(1, ageAt(t)).value) / COIN / 4 * TH);
    const orbit = Math.sin(t * 0.12) * 0.22;
    const dist = 2.6 + h * 1.2;
    pc.position.set(Math.sin(orbit) * dist, 0.55 + h * 0.75, Math.cos(orbit) * dist);
    pc.lookAt(0, 0.12 + h * 0.5, 0);
    pc.fov = 40;
    pc.near = 0.02;
    pc.far = 30;
    pc.updateProjectionMatrix();
  }, [frame, camera]);
  return null;
};

const Pile: React.FC<{p: number; t: number}> = ({p, t}) => {
  const geo = useMemo(() => new THREE.CylinderGeometry(R, R, TH * 0.96, 48), []);
  const gold = useMemo(() => [new THREE.MeshStandardMaterial({color: '#e0b040', metalness: 1, roughness: 0.22}), new THREE.MeshStandardMaterial({map: faceTex(true), metalness: 1, roughness: 0.28})], []);
  const silver = useMemo(() => [new THREE.MeshStandardMaterial({color: '#cfd4da', metalness: 1, roughness: 0.2}), new THREE.MeshStandardMaterial({map: faceTex(false), metalness: 1, roughness: 0.25})], []);
  const times = COINS[p];
  const paidCoins = Math.floor(at(p, ageAt(t)).paid / COIN);
  const goldRef = useRef<THREE.InstancedMesh>(null);
  const silverRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
    let gi = 0;
    let si = 0;
    times.forEach((tc, k) => {
      const [x, y, z, rot] = coinPos(p, k);
      const isSilver = k < paidCoins;
      const target = isSilver ? silverRef.current : goldRef.current;
      const other = isSilver ? goldRef.current : silverRef.current;
      const idx = isSilver ? si++ : gi++;
      if (!target) return;
      if (t < tc) target.setMatrixAt(idx, hidden);
      else {
        const k2 = clamp((t - tc) / 0.22);
        const drop = (1 - k2 * k2) * 0.5 + Math.abs(Math.sin(k2 * 9)) * 0.02 * (1 - k2);
        q.setFromEuler(new THREE.Euler(0, rot, 0));
        m.compose(new THREE.Vector3(x, y + drop, z), q, new THREE.Vector3(1, 1, 1));
        target.setMatrixAt(idx, m);
      }
      void other;
    });
    for (let i = gi; i < times.length; i++) goldRef.current?.setMatrixAt(i, hidden);
    for (let i = si; i < times.length; i++) silverRef.current?.setMatrixAt(i, hidden);
    if (goldRef.current) goldRef.current.instanceMatrix.needsUpdate = true;
    if (silverRef.current) silverRef.current.instanceMatrix.needsUpdate = true;
  }, [t, paidCoins, p, times]);
  return (
    <>
      <instancedMesh ref={goldRef} args={[geo, [gold[0], gold[1], gold[1]], times.length]} castShadow receiveShadow frustumCulled={false} />
      <instancedMesh ref={silverRef} args={[geo, [silver[0], silver[1], silver[1]], times.length]} castShadow receiveShadow frustumCulled={false} />
    </>
  );
};

export const Scene3D: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const plates = useMemo(() => [plateTex('ANNA', '#19f7ff'), plateTex('BEN', '#ff2bd6')], []);
  const desk = useMemo(
    () =>
      canvasTex(1024, 1024, (c) => {
        c.fillStyle = '#1a120c';
        c.fillRect(0, 0, 1024, 1024);
        for (let i = 0; i < 160; i++) {
          c.strokeStyle = `rgba(${70 + (i % 5) * 8},${40 + (i % 3) * 6},20,0.35)`;
          c.lineWidth = 1 + (i % 4);
          c.beginPath();
          const y = (i * 37) % 1024;
          c.moveTo(0, y);
          c.bezierCurveTo(300, y + Math.sin(i) * 30, 700, y - Math.cos(i) * 30, 1024, y + Math.sin(i * 2) * 20);
          c.stroke();
        }
      }),
    [],
  );
  const winGlow = t > EV.end && t < scene('explain').end ? 1 : 0;
  return (
    <>
      <Rig />
      <hemisphereLight args={['#c8d0ff', '#1a120c', 0.25]} />
      <spotLight position={[0.6, 3.5, 2.2]} angle={0.55} penumbra={0.6} intensity={45} color="#fff1dc" castShadow shadow-mapSize={[2048, 2048]} target-position={[0, 0.3, 0]} />
      <pointLight position={[-1.6, 1.2, 0.8]} intensity={2.5} distance={5} color="#19f7ff" />
      <pointLight position={[1.6, 1.2, 0.8]} intensity={2.5} distance={5} color="#ff2bd6" />
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshPhysicalMaterial map={desk} roughness={0.25} clearcoat={1} clearcoatRoughness={0.08} />
      </mesh>
      <Pile p={0} t={t} />
      <Pile p={1} t={t} />
      {[0, 1].map((p) => (
        <mesh key={p} position={[PILE_X[p], 0.07, 0.34]} rotation-x={-0.35}>
          <planeGeometry args={[0.42, 0.13]} />
          <meshStandardMaterial map={plates[p]} emissiveMap={plates[p]} emissive="#ffffff" emissiveIntensity={0.6} roughness={0.4} />
        </mesh>
      ))}
      {winGlow > 0 && (
        <mesh position={[PILE_X[0], 0.005, 0]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.3, 0.34, 64]} />
          <meshBasicMaterial color="#7cff4f" transparent opacity={0.6 + 0.4 * Math.sin(t * 6)} toneMapped={false} />
        </mesh>
      )}
    </>
  );
};
