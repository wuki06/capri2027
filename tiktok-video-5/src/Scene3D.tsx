import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {useCurrentFrame} from 'remotion';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {BALL_R, FPS, TL, TUBE_R, TUBE_X, ballPos, camAt, coverY, doorAngles} from './model';

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
const textTex = (txt: string, color: string, bg = 'rgba(0,0,0,0)', w = 512, h = 256, size = 170) =>
  canvasTex(w, h, (c) => {
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);
    c.font = `900 ${size}px 'Inter Display', 'Inter', sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.shadowColor = color;
    c.shadowBlur = 30;
    c.fillStyle = color;
    c.fillText(txt, w / 2, h / 2 + 6);
    c.shadowBlur = 0;
    c.fillStyle = '#fff8e0';
    c.globalAlpha = 0.5;
    c.fillText(txt, w / 2, h / 2 + 6);
  });

const Rig: React.FC = () => {
  const frame = useCurrentFrame();
  const {camera, gl, scene} = useThree();
  useLayoutEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.45;
    scene.background = new THREE.Color('#05060a');
    scene.fog = new THREE.Fog('#05060a', 12, 30);
  }, [gl, scene]);
  useLayoutEffect(() => {
    const c = camAt(frame / FPS);
    const pc = camera as THREE.PerspectiveCamera;
    pc.position.set(c.pos[0], c.pos[1], c.pos[2]);
    pc.lookAt(c.look[0], c.look[1], c.look[2]);
    pc.fov = c.fov;
    pc.near = 0.05;
    pc.far = 80;
    pc.updateProjectionMatrix();
  }, [frame, camera]);
  return null;
};

// ---------------------------------------------------------------- Modelle
const Car: React.FC<{position: [number, number, number]}> = ({position}) => {
  const paint = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#d4141c', metalness: 0.4, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.05}), []);
  const glass = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#0b1220', metalness: 0.2, roughness: 0.05, clearcoat: 1}), []);
  const tire = useMemo(() => new THREE.MeshStandardMaterial({color: '#111', roughness: 0.8}), []);
  const rim = useMemo(() => new THREE.MeshStandardMaterial({color: '#cfd5de', metalness: 1, roughness: 0.2}), []);
  return (
    <group position={position}>
      <mesh position={[0, 0.36, 0]} material={paint} castShadow>
        <boxGeometry args={[0.86, 0.32, 1.85]} />
      </mesh>
      <mesh position={[0, 0.62, -0.08]} material={glass} castShadow>
        <boxGeometry args={[0.74, 0.26, 0.95]} />
      </mesh>
      <mesh position={[0, 0.76, -0.1]} material={paint}>
        <boxGeometry args={[0.72, 0.03, 0.7]} />
      </mesh>
      {[
        [-0.44, 0.6],
        [0.44, 0.6],
        [-0.44, -0.62],
        [0.44, -0.62],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0.19, z]} rotation-z={Math.PI / 2}>
          <mesh material={tire} castShadow>
            <cylinderGeometry args={[0.19, 0.19, 0.14, 28]} />
          </mesh>
          <mesh material={rim} position={[0, x > 0 ? 0.071 : -0.071, 0]}>
            <cylinderGeometry args={[0.11, 0.11, 0.01, 20]} />
          </mesh>
        </group>
      ))}
      {[-0.3, 0.3].map((x) => (
        <mesh key={x} position={[x, 0.4, 0.93]}>
          <boxGeometry args={[0.18, 0.06, 0.02]} />
          <meshBasicMaterial color="#fffbe0" toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, 0.3, 0.93]}>
        <boxGeometry args={[0.4, 0.08, 0.02]} />
        <meshStandardMaterial color="#111" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
};

const Goat: React.FC<{position: [number, number, number]; rot?: number; t: number}> = ({position, rot = 0, t}) => {
  const fur = useMemo(() => new THREE.MeshStandardMaterial({color: '#e9e2d3', roughness: 0.95}), []);
  const dark = useMemo(() => new THREE.MeshStandardMaterial({color: '#5a4a3a', roughness: 0.7}), []);
  const nod = Math.sin(t * 2.2 + position[0]) * 0.08;
  return (
    <group position={position} rotation-y={rot}>
      <mesh position={[0, 0.62, 0]} rotation-z={Math.PI / 2} material={fur} castShadow>
        <capsuleGeometry args={[0.2, 0.5, 8, 16]} />
      </mesh>
      {[
        [-0.25, 0.1],
        [0.25, 0.1],
        [-0.25, -0.1],
        [0.25, -0.1],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.24, z]} material={fur} castShadow>
          <cylinderGeometry args={[0.04, 0.035, 0.48, 10]} />
        </mesh>
      ))}
      <group position={[0.46, 0.86, 0]} rotation-z={-0.4 + nod}>
        <mesh position={[0.08, 0, 0]} rotation-z={Math.PI / 2} material={fur} castShadow>
          <capsuleGeometry args={[0.09, 0.16, 6, 12]} />
        </mesh>
        {[-0.05, 0.05].map((z) => (
          <mesh key={z} position={[-0.02, 0.13, z]} rotation-z={0.5} material={dark}>
            <coneGeometry args={[0.025, 0.2, 8]} />
          </mesh>
        ))}
        {[-0.1, 0.1].map((z) => (
          <mesh key={z} position={[0, 0.03, z * 1.2]} rotation-x={z > 0 ? 1.1 : -1.1} material={fur}>
            <capsuleGeometry args={[0.022, 0.08, 4, 8]} />
          </mesh>
        ))}
        <mesh position={[0.17, -0.12, 0]} material={fur}>
          <coneGeometry args={[0.03, 0.1, 8]} />
        </mesh>
        {[-0.045, 0.045].map((z) => (
          <mesh key={z} position={[0.13, 0.04, z]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshBasicMaterial color="#111" />
          </mesh>
        ))}
      </group>
      <mesh position={[-0.5, 0.74, 0]} rotation-z={0.8} material={fur}>
        <coneGeometry args={[0.04, 0.12, 8]} />
      </mesh>
    </group>
  );
};

const DOOR_X = [-1.6, 0, 1.6];
const DW = 1.16;
const DH = 2.36;

// ---------------------------------------------------------------- Szene
export const Scene3D: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const ang = doorAngles(t);
  const nums = useMemo(() => [1, 2, 3].map((n) => textTex(String(n), '#ffc94a')), []);
  const lblStay = useMemo(() => textTex('BLEIBEN', '#2fa4ff', 'rgba(0,0,0,0)', 1024, 256, 150), []);
  const lblSwap = useMemo(() => textTex('WECHSELN', '#ff2bd6', 'rgba(0,0,0,0)', 1024, 256, 150), []);
  const qTex = useMemo(() => textTex('?', '#ffffff', 'rgba(40,44,56,1)', 512, 512, 380), []);
  const doorMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#7a0f1c', roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.1}), []);
  const gold = useMemo(() => new THREE.MeshStandardMaterial({color: '#c99a3a', metalness: 1, roughness: 0.25}), []);
  const wall = useMemo(() => new THREE.MeshStandardMaterial({color: '#141a2e', roughness: 0.6}), []);
  const room = useMemo(() => new THREE.MeshStandardMaterial({color: '#2a2f3d', roughness: 0.8}), []);
  const glassMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#cfe8ff', transparent: true, opacity: 0.14, roughness: 0.02, metalness: 0, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false}), []);
  const coverMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#2a2e3a', roughness: 0.5, metalness: 0.3}), []);
  const coverFace = useMemo(() => new THREE.MeshStandardMaterial({map: qTex, roughness: 0.5}), [qTex]);
  const ballGeo = useMemo(() => new THREE.SphereGeometry(BALL_R, 14, 10), []);
  const ballMats = useMemo(
    () => [
      new THREE.MeshPhysicalMaterial({color: '#1f8fff', roughness: 0.15, clearcoat: 1, emissive: '#0a3a8a', emissiveIntensity: 0.6}),
      new THREE.MeshPhysicalMaterial({color: '#ff2bd6', roughness: 0.15, clearcoat: 1, emissive: '#7a0a66', emissiveIntensity: 0.6}),
    ],
    [],
  );
  const inst = [useRef<THREE.InstancedMesh>(null), useRef<THREE.InstancedMesh>(null)];
  const counts = [TL.result.stay, TL.result.swap];

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
    const idx = [0, 0];
    for (const [tg, tube, k] of TL.balls) {
      const p = ballPos(t, tg, tube, k);
      const im = inst[tube].current;
      if (!im) continue;
      if (p) im.setMatrixAt(idx[tube], m.makeTranslation(p[0], p[1], p[2]));
      else im.setMatrixAt(idx[tube], hidden);
      idx[tube]++;
    }
    for (const r of inst) if (r.current) r.current.instanceMatrix.needsUpdate = true;
  }, [t]);

  const cy = coverY(t);

  return (
    <>
      <Rig />
      <hemisphereLight args={['#9fb6ff', '#1a1410', 0.35]} />
      {/* Studio-Licht vorne */}
      <spotLight position={[0, 6, 6]} angle={0.55} penumbra={0.6} intensity={60} color="#fff1dc" castShadow shadow-mapSize={[1024, 1024]} target-position={[0, 1, 0]} />
      {/* Licht in den Räumen hinter den Türen */}
      {DOOR_X.map((x) => (
        <pointLight key={x} position={[x, 2.2, -1.0]} intensity={4} distance={4} color="#ffe2b0" />
      ))}
      {/* Röhren-Set */}
      <spotLight position={[30, 6.5, 4]} angle={0.6} penumbra={0.7} intensity={70} color="#ffffff" castShadow shadow-mapSize={[1024, 1024]} target-position={[30, 0.8, 0]} />
      <pointLight position={[TUBE_X[0], 0.25, 0.9]} intensity={3} distance={3} color="#2fa4ff" />
      <pointLight position={[TUBE_X[1], 0.25, 0.9]} intensity={3} distance={3} color="#ff2bd6" />

      {/* Boden */}
      <mesh rotation-x={-Math.PI / 2} position={[15, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 40]} />
        <meshStandardMaterial color="#14161c" roughness={0.22} metalness={0.3} />
      </mesh>

      {/* Türwand mit drei Öffnungen */}
      <group>
        <mesh position={[-3.35, 1.6, 0]} material={wall}>
          <boxGeometry args={[2.3, 3.2, 0.2]} />
        </mesh>
        <mesh position={[3.35, 1.6, 0]} material={wall}>
          <boxGeometry args={[2.3, 3.2, 0.2]} />
        </mesh>
        {[-0.8, 0.8].map((x) => (
          <mesh key={x} position={[x, 1.6, 0]} material={wall}>
            <boxGeometry args={[0.44, 3.2, 0.2]} />
          </mesh>
        ))}
        <mesh position={[0, DH + 0.42, 0]} material={wall}>
          <boxGeometry args={[4.6, 0.84, 0.2]} />
        </mesh>
        {/* Neonleisten */}
        {[0.06, 3.15].map((y) => (
          <mesh key={y} position={[0, y, 0.11]}>
            <boxGeometry args={[9, 0.035, 0.02]} />
            <meshBasicMaterial color={y < 1 ? '#19f7ff' : '#ff2bd6'} toneMapped={false} />
          </mesh>
        ))}
        {/* Räume hinter den Türen */}
        <mesh position={[0, 1.6, -2.2]} material={room}>
          <boxGeometry args={[5.2, 3.2, 0.1]} />
        </mesh>
        {[-2.4, -0.8, 0.8, 2.4].map((x) => (
          <mesh key={x} position={[x, 1.6, -1.1]} material={room}>
            <boxGeometry args={[0.08, 3.2, 2.2]} />
          </mesh>
        ))}
        <mesh position={[0, 3.2, -1.1]} material={room}>
          <boxGeometry args={[5.2, 0.08, 2.2]} />
        </mesh>
      </group>

      {/* Türen */}
      {DOOR_X.map((x, i) => (
        <group key={i}>
          {/* Goldrahmen */}
          {[
            [x - DW / 2 - 0.04, DH / 2, 0.08, DH + 0.08],
            [x + DW / 2 + 0.04, DH / 2, 0.08, DH + 0.08],
          ].map(([px, py, w, h], j) => (
            <mesh key={j} position={[px, py, 0.12]} material={gold}>
              <boxGeometry args={[w, h, 0.06]} />
            </mesh>
          ))}
          <mesh position={[x, DH + 0.04, 0.12]} material={gold}>
            <boxGeometry args={[DW + 0.16, 0.08, 0.06]} />
          </mesh>
          <group position={[x - DW / 2, 0, 0.08]} rotation-y={-ang[i]}>
            <mesh position={[DW / 2, DH / 2, 0]} material={doorMat} castShadow>
              <boxGeometry args={[DW, DH, 0.06]} />
            </mesh>
            {/* Kassetten */}
            {[0.62, 1.68].map((y) => (
              <mesh key={y} position={[DW / 2, y, 0.035]} material={doorMat}>
                <boxGeometry args={[DW * 0.72, 0.8, 0.02]} />
              </mesh>
            ))}
            <mesh position={[DW / 2, 1.68, 0.047]}>
              <planeGeometry args={[0.9, 0.45]} />
              <meshBasicMaterial map={nums[i]} transparent toneMapped={false} />
            </mesh>
            <mesh position={[DW - 0.12, 1.15, 0.06]} material={gold}>
              <sphereGeometry args={[0.045, 16, 16]} />
            </mesh>
          </group>
        </group>
      ))}
      {/* Hinter den Türen: Ziege – Auto – Ziege */}
      <Goat position={[DOOR_X[0], 0, -1.1]} rot={0.5} t={t} />
      <Car position={[DOOR_X[1], 0, -1.15]} />
      <Goat position={[DOOR_X[2], 0, -1.1]} rot={2.6} t={t} />

      {/* Röhren */}
      {TUBE_X.map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.16, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[TUBE_R + 0.12, TUBE_R + 0.16, 0.32, 48]} />
            <meshStandardMaterial color="#1b1f2a" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[x, 0.33, 0]}>
            <torusGeometry args={[TUBE_R + 0.08, 0.018, 12, 64]} />
            <meshBasicMaterial color={i ? '#ff2bd6' : '#2fa4ff'} toneMapped={false} />
          </mesh>
          <mesh position={[x, 1.47, 0]} material={glassMat}>
            <cylinderGeometry args={[TUBE_R, TUBE_R, 2.3, 48, 1, true]} />
          </mesh>
          <mesh position={[x, 2.62, 0]}>
            <torusGeometry args={[TUBE_R, 0.014, 10, 64]} />
            <meshStandardMaterial color="#d8dde6" metalness={1} roughness={0.2} />
          </mesh>
          <mesh position={[x, 0.16, TUBE_R + 0.17]}>
            <planeGeometry args={[1.05, 0.26]} />
            <meshBasicMaterial map={i ? lblSwap : lblStay} transparent toneMapped={false} />
          </mesh>
          <instancedMesh ref={inst[i]} args={[ballGeo, ballMats[i], counts[i]]} castShadow frustumCulled={false} />
          {/* Abdeckung */}
          <group position={[x, cy, 0]}>
            <mesh material={coverMat} castShadow>
              <boxGeometry args={[1.18, 2.5, 1.18]} />
            </mesh>
            <mesh position={[0, 0.2, 0.595]} material={coverFace}>
              <planeGeometry args={[1.0, 1.0]} />
            </mesh>
          </group>
        </group>
      ))}
    </>
  );
};
