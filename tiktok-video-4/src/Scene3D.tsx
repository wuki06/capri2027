import React, {useLayoutEffect, useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {DOM, FPS, NDOM, anglesAt, camAt, ev, focusF, hAt, rand, simAt, xAt} from './model';

const canvasTex = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, srgb = true) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

const PIPS: Record<number, [number, number][]> = {
  0: [],
  1: [[0.5, 0.5]],
  2: [[0.25, 0.25], [0.75, 0.75]],
  3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
  4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
  5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
  6: [[0.25, 0.2], [0.75, 0.2], [0.25, 0.5], [0.75, 0.5], [0.25, 0.8], [0.75, 0.8]],
};
const dominoFace = (a: number, b: number) =>
  canvasTex(256, 512, (c) => {
    c.fillStyle = '#0b0b0d';
    c.fillRect(0, 0, 256, 512);
    c.fillStyle = '#d9d4c7';
    c.fillRect(28, 252, 200, 8);
    for (const [half, n] of [
      [0, a],
      [1, b],
    ] as const) {
      for (const [px, py] of PIPS[n]) {
        const x = 30 + px * 196;
        const y = half * 256 + 30 + py * 196;
        const g = c.createRadialGradient(x - 4, y - 4, 2, x, y, 22);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(1, '#bdb6a6');
        c.fillStyle = g;
        c.beginPath();
        c.arc(x, y, 20, 0, Math.PI * 2);
        c.fill();
      }
    }
  });

const windowsTex = () =>
  canvasTex(256, 1024, (c) => {
    c.fillStyle = '#0d1016';
    c.fillRect(0, 0, 256, 1024);
    for (let y = 0; y < 100; y++)
      for (let x = 0; x < 16; x++) {
        const lit = rand(x * 131 + y * 17) > 0.55;
        c.fillStyle = lit ? `rgba(255,${200 + rand(x + y) * 40},140,${0.6 + rand(y * 3 + x) * 0.4})` : '#1a2030';
        c.fillRect(x * 16 + 3, y * 10.24 + 2, 10, 6);
      }
  });

const dustTex = () =>
  canvasTex(128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(200,195,185,0.9)');
    g.addColorStop(0.5, 'rgba(160,150,140,0.35)');
    g.addColorStop(1, 'rgba(120,110,100,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
  });

const Rig: React.FC = () => {
  const frame = useCurrentFrame();
  const {camera, gl, scene} = useThree();
  useLayoutEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.55;
    scene.background = new THREE.Color('#06070b');
  }, [gl, scene]);
  useLayoutEffect(() => {
    const t = frame / FPS;
    const c = camAt(t);
    const pc = camera as THREE.PerspectiveCamera;
    pc.position.set(c.pos[0], c.pos[1], c.pos[2]);
    pc.lookAt(c.look[0], c.look[1], c.look[2]);
    pc.fov = c.fov;
    const dist = pc.position.distanceTo(new THREE.Vector3(c.look[0], c.look[1], c.look[2]));
    pc.near = dist / 400;
    pc.far = dist * 60;
    pc.updateProjectionMatrix();
    scene.fog = new THREE.FogExp2('#06070b', 0.22 / dist);
  }, [frame, camera, scene]);
  return null;
};

export const Scene3D: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const sim = simAt(t);
  const th = anglesAt(sim);

  const faces = useMemo(() => DOM.map((_, i) => dominoFace(Math.floor(rand(i * 7) * 7), Math.floor(rand(i * 7 + 3) * 7))), []);
  const side = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#0b0b0d', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08}), []);
  const mats = useMemo(
    () => faces.map((f) => {
      const face = new THREE.MeshPhysicalMaterial({map: f, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08});
      return [face, face, side, side, side, side];
    }),
    [faces, side],
  );
  const win = useMemo(windowsTex, []);
  const dust = useMemo(dustTex, []);
  const clay = useMemo(() => new THREE.MeshStandardMaterial({color: '#b9b4ab', roughness: 0.85}), []);

  // Licht folgt dem Fokus (Schattenkamera skaliert mit der Steingröße)
  const f = Math.min(30.5, Math.max(1, t < ev.chainStart ? (t > 20 ? 30 : 2) : focusF(t)));
  const H = hAt(f);
  const X = xAt(Math.min(29, f));
  const lightPos: [number, number, number] = [X - 3 * H, 6 * H, 4 * H];

  const camNow = camAt(t);
  const camDist = Math.hypot(camNow.pos[0] - camNow.look[0], camNow.pos[1] - camNow.look[1], camNow.pos[2] - camNow.look[2]);
  const floorS = camDist * 120;
  const last = DOM[NDOM - 1];
  const impactK = t - ev.impact;

  return (
    <>
      <Rig />
      <hemisphereLight args={['#bcd3ff', '#1a140e', 0.35]} />
      <directionalLight
        position={lightPos}
        intensity={2.6}
        color="#fff3e2"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-5 * H}
        shadow-camera-right={5 * H}
        shadow-camera-top={5 * H}
        shadow-camera-bottom={-5 * H}
        shadow-camera-near={0.1 * H}
        shadow-camera-far={20 * H}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02 * H}
        target-position={[X, 0, 0]}
      />
      <directionalLight position={[X + 4 * H, 2 * H, -3 * H]} intensity={0.8} color="#8fb4ff" />
      {/* Boden */}
      <mesh rotation-x={-Math.PI / 2} position={[camNow.pos[0], 0, camNow.pos[2]]} scale={[floorS, floorS, 1]} receiveShadow>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial color="#202228" roughness={0.38} metalness={0.1} />
      </mesh>
      {/* Dominosteine */}
      {DOM.map((d, i) => (
        <group key={i} position={[d.pivot, 0, 0]} rotation-z={-th[i]}>
          <mesh position={[-d.t / 2, d.h / 2, 0]} material={mats[i]} castShadow receiveShadow>
            <boxGeometry args={[d.t, d.h, d.w]} />
          </mesh>
        </group>
      ))}
      {/* Vergleichsobjekte */}
      {/* Münze (2,3 cm) */}
      <mesh position={[DOM[4].pivot, 0.0012, -(DOM[4].w / 2 + 0.02)]} castShadow receiveShadow>
        <cylinderGeometry args={[0.0116, 0.0116, 0.0023, 48]} />
        <meshStandardMaterial color="#d4a94a" metalness={1} roughness={0.25} />
      </mesh>
      {/* Mensch (1,80 m) */}
      <group position={[DOM[14].pivot - 0.4, 0, -(DOM[14].w / 2 + 0.7)]}>
        <mesh position={[0, 1.15, 0]} material={clay} castShadow>
          <capsuleGeometry args={[0.2, 0.55, 8, 16]} />
        </mesh>
        <mesh position={[0, 1.66, 0]} material={clay} castShadow>
          <sphereGeometry args={[0.12, 24, 24]} />
        </mesh>
        {[-0.1, 0.1].map((z) => (
          <mesh key={z} position={[0, 0.42, z]} material={clay} castShadow>
            <capsuleGeometry args={[0.075, 0.7, 6, 12]} />
          </mesh>
        ))}
        {[-0.27, 0.27].map((z) => (
          <mesh key={z} position={[0, 1.1, z]} material={clay} castShadow>
            <capsuleGeometry args={[0.055, 0.55, 6, 12]} />
          </mesh>
        ))}
      </group>
      {/* Haus (≈ 10 m) */}
      <group position={[DOM[19].pivot - 4, 0, -(DOM[19].w / 2 + 7)]}>
        <mesh position={[0, 3.5, 0]} material={clay} castShadow receiveShadow>
          <boxGeometry args={[9, 7, 8]} />
        </mesh>
        <mesh position={[0, 8.6, 0]} rotation-y={Math.PI / 4} material={clay} castShadow>
          <coneGeometry args={[6.6, 3.6, 4]} />
        </mesh>
      </group>
      {/* Kirchturm (≈ 80 m) */}
      <group position={[DOM[24].pivot - 20, 0, -(DOM[24].w / 2 + 25)]}>
        <mesh position={[0, 27, 0]} material={clay} castShadow>
          <boxGeometry args={[12, 54, 12]} />
        </mesh>
        <mesh position={[0, 66, 0]} rotation-y={Math.PI / 4} material={clay} castShadow>
          <coneGeometry args={[8.5, 26, 4]} />
        </mesh>
      </group>
      {/* Wolkenkratzer (443 m inkl. Antenne) */}
      <group position={[last.pivot - 120, 0, -(last.w / 2 + 110)]}>
        <mesh position={[0, 160, 0]} castShadow>
          <boxGeometry args={[70, 320, 55]} />
          <meshStandardMaterial map={win} emissiveMap={win} emissive="#ffffff" emissiveIntensity={0.55} roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh position={[0, 350, 0]} castShadow>
          <boxGeometry args={[40, 60, 32]} />
          <meshStandardMaterial map={win} emissiveMap={win} emissive="#ffffff" emissiveIntensity={0.55} roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh position={[0, 412, 0]}>
          <cylinderGeometry args={[1.5, 3, 62, 12]} />
          <meshStandardMaterial color="#9aa3b3" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 444, 0]}>
          <sphereGeometry args={[2.5, 12, 12]} />
          <meshBasicMaterial color="#ff3b3b" />
        </mesh>
      </group>
      {/* Staubwolke beim Aufprall des letzten Steins */}
      {impactK > -0.2 &&
        impactK < 6 &&
        Array.from({length: 70}, (_, i) => {
          const k = Math.max(0, impactK);
          const along = rand(i) * last.h;
          const ang = rand(i + 50) * Math.PI * 2;
          const spread = (20 + rand(i + 9) * 90) * (1 - Math.exp(-k * 1.4));
          const x = last.pivot + along + Math.cos(ang) * spread * 0.5;
          const z = Math.sin(ang) * spread + (rand(i + 3) - 0.5) * last.w;
          const y = 8 + rand(i + 7) * 30 + k * (6 + rand(i + 11) * 10);
          const s = (40 + rand(i + 13) * 70) * (0.6 + k * 0.35);
          const op = Math.min(1, (impactK + 0.2) * 4) * Math.max(0, 1 - k / 6) * 0.55;
          return (
            <sprite key={i} position={[x, y, z]} scale={[s, s, 1]}>
              <spriteMaterial map={dust} transparent depthWrite={false} opacity={op} />
            </sprite>
          );
        })}
    </>
  );
};
