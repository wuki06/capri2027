import React, {useLayoutEffect, useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {EV, FPS, METHODS, ST, camAt, clamp, line, rand, simAt, smooth, tempAt, wordAt} from './model';

const canvasTex = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, rep = 1) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep, rep);
  return t;
};
const F = "'Inter Display', 'Inter', sans-serif";
const CAN_COLS = ['#d8262c', '#1f8a4c', '#1f5fd8', '#f2b705'];
const CAN_R = 0.033;
const CAN_H = 0.115;

const labelTex = (i: number) =>
  canvasTex(1024, 512, (c) => {
    c.fillStyle = CAN_COLS[i];
    c.fillRect(0, 0, 1024, 512);
    const g = c.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, 'rgba(255,255,255,0.25)');
    g.addColorStop(0.5, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.25)');
    c.fillStyle = g;
    c.fillRect(0, 0, 1024, 512);
    c.fillStyle = '#fff';
    c.font = `900 300px ${F}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (const x of [256, 768]) c.fillText(String(i + 1), x, 270);
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.fillRect(0, 60, 1024, 10);
    c.fillRect(0, 442, 1024, 10);
  });
const frostTex = () =>
  canvasTex(512, 512, (c) => {
    c.clearRect(0, 0, 512, 512);
    for (let i = 0; i < 4000; i++) {
      c.fillStyle = `rgba(235,245,255,${0.2 + rand(i) * 0.6})`;
      c.beginPath();
      c.arc(rand(i + 1) * 512, rand(i + 2) * 512, 1 + rand(i + 3) * 4, 0, Math.PI * 2);
      c.fill();
    }
  });

/** Dose mit Kondenswasser / Reif je nach Temperatur */
const Can: React.FC<{i: number; temp: number; label: THREE.Texture; frost: THREE.Texture}> = ({i, temp, label, frost}) => {
  const cold = clamp((14 - temp) / 10);
  const alu = useMemo(() => new THREE.MeshStandardMaterial({color: '#d9dde2', metalness: 1, roughness: 0.22}), []);
  return (
    <group>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[CAN_R, CAN_R, CAN_H * 0.86, 48, 1, true]} />
        <meshPhysicalMaterial map={label} metalness={0.55} roughness={0.25 + cold * 0.3} clearcoat={1} clearcoatRoughness={0.1 + cold * 0.4} />
      </mesh>
      <mesh scale={1.004}>
        <cylinderGeometry args={[CAN_R, CAN_R, CAN_H * 0.86, 48, 1, true]} />
        <meshStandardMaterial map={frost} transparent opacity={cold * 0.6} roughness={0.6} depthWrite={false} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, (s * CAN_H * 0.86) / 2 + s * 0.006, 0]} material={alu}>
          <cylinderGeometry args={[CAN_R * (s > 0 ? 0.88 : 0.9), CAN_R, 0.012, 48]} />
        </mesh>
      ))}
      <mesh position={[0, CAN_H / 2 + 0.002, 0.008]} rotation-x={-Math.PI / 2} material={alu}>
        <ringGeometry args={[0.004, 0.009, 24]} />
      </mesh>
    </group>
  );
};

const IceCubes: React.FC<{n: number; r: number; seed: number; y: number}> = ({n, r, seed, y}) => {
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#cfe8f6', roughness: 0.1, transparent: true, opacity: 0.55, clearcoat: 1}), []);
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const a = rand(seed + i) * Math.PI * 2;
        const rr = (0.35 + rand(seed + i + 50) * 0.6) * r;
        return (
          <mesh key={i} position={[Math.cos(a) * rr, y + rand(seed + i + 9) * 0.02, Math.sin(a) * rr]} rotation={[rand(i) * 3, rand(i + 1) * 3, rand(i + 2) * 3]} material={mat}>
            <boxGeometry args={[0.024, 0.024, 0.024]} />
          </mesh>
        );
      })}
    </>
  );
};

const Bowl: React.FC<{salt?: boolean; t: number}> = ({salt, t}) => {
  const glass = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#eef6ff', roughness: 0.05, transparent: true, opacity: 0.25, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false}), []);
  const water = useMemo(() => new THREE.MeshPhysicalMaterial({color: salt ? '#cfe6f2' : '#a8d4ee', roughness: 0.05, transparent: true, opacity: 0.55, clearcoat: 1, depthWrite: false}), [salt]);
  const saltK = salt ? smooth((t - wordAt('p3', 'Salz') + 0.2) / 1.2) : 0;
  return (
    <group>
      <mesh position={[0, 0.045, 0]} material={glass}>
        <cylinderGeometry args={[0.14, 0.11, 0.09, 64, 1, true]} />
      </mesh>
      <mesh position={[0, 0.002, 0]} rotation-x={-Math.PI / 2} material={glass}>
        <circleGeometry args={[0.11, 48]} />
      </mesh>
      <mesh position={[0, 0.072, 0]} rotation-x={-Math.PI / 2} material={water}>
        <circleGeometry args={[0.134, 64]} />
      </mesh>
      <mesh position={[0, 0.036, 0]} material={water}>
        <cylinderGeometry args={[0.133, 0.108, 0.07, 48, 1, true]} />
      </mesh>
      <IceCubes n={salt ? 12 : 14} r={0.11} seed={salt ? 300 : 100} y={0.07} />
      {/* Salzkörner */}
      {salt &&
        Array.from({length: 160}, (_, i) => {
          const a = rand(i + 900) * Math.PI * 2;
          const rr = rand(i + 901) * 0.12;
          const fall = clamp((t - wordAt('p3', 'Salz') + 0.4 - rand(i + 902) * 0.6) / 0.5);
          if (fall <= 0) return null;
          return (
            <mesh key={i} position={[Math.cos(a) * (0.05 + rr * 0.6), 0.073 + (1 - fall) * 0.25, Math.sin(a) * (0.05 + rr * 0.6)]} scale={saltK > 0 ? 1 : 0}>
              <boxGeometry args={[0.0014, 0.0014, 0.0014]} />
              <meshStandardMaterial color="#ffffff" roughness={0.4} />
            </mesh>
          );
        })}
    </group>
  );
};

const Cabinet: React.FC<{freezer?: boolean}> = ({freezer}) => {
  const body = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#b8bec6', roughness: 0.35, clearcoat: 0.8}), []);
  const inner = useMemo(() => new THREE.MeshStandardMaterial({color: freezer ? '#dbe9f6' : '#eef2f5', roughness: 0.6, emissive: freezer ? '#5a7ea8' : '#8aa0b0', emissiveIntensity: 0.12}), [freezer]);
  const frost = useMemo(() => (freezer ? frostTex() : null), [freezer]);
  return (
    <group>
      {/* Gehäuse (offen nach vorn) */}
      <mesh position={[0, 0.19, -0.15]} material={body}>
        <boxGeometry args={[0.3, 0.38, 0.02]} />
      </mesh>
      {[-0.15, 0.15].map((x) => (
        <mesh key={x} position={[x, 0.19, 0]} material={body}>
          <boxGeometry args={[0.02, 0.38, 0.3]} />
        </mesh>
      ))}
      {[0, 0.38].map((y) => (
        <mesh key={y} position={[0, y, 0]} material={body}>
          <boxGeometry args={[0.3, 0.02, 0.3]} />
        </mesh>
      ))}
      <mesh position={[0, 0.19, -0.139]} material={inner}>
        <planeGeometry args={[0.28, 0.36]} />
      </mesh>
      {frost && (
        <mesh position={[0, 0.19, -0.137]}>
          <planeGeometry args={[0.28, 0.36]} />
          <meshStandardMaterial map={frost} transparent opacity={0.9} />
        </mesh>
      )}
      {/* Glastür */}
      <mesh position={[0, 0.19, 0.151]}>
        <planeGeometry args={[0.28, 0.36]} />
        <meshPhysicalMaterial color="#e8f4ff" transparent opacity={0.12} roughness={0.02} clearcoat={1} depthWrite={false} />
      </mesh>
      <mesh position={[0.12, 0.19, 0.16]}>
        <boxGeometry args={[0.012, 0.2, 0.012]} />
        <meshStandardMaterial color="#9aa2aa" metalness={1} roughness={0.25} />
      </mesh>
      <pointLight position={[0, 0.34, 0.02]} intensity={0.25} distance={0.6} color={freezer ? '#a8d0ff' : '#e8f4ff'} />
    </group>
  );
};

const Rig: React.FC = () => {
  const frame = useCurrentFrame();
  const {camera, gl, scene: sc} = useThree();
  useLayoutEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    const pm = new THREE.PMREMGenerator(gl);
    sc.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    sc.environmentIntensity = 0.35;
    sc.background = new THREE.Color('#1c1f24');
  }, [gl, sc]);
  useLayoutEffect(() => {
    const c = camAt(frame / FPS);
    const pc = camera as THREE.PerspectiveCamera;
    pc.position.set(c.pos[0], c.pos[1], c.pos[2]);
    pc.lookAt(c.look[0], c.look[1], c.look[2]);
    pc.fov = c.fov;
    pc.near = 0.01;
    pc.far = 20;
    pc.updateProjectionMatrix();
  }, [frame, camera]);
  return null;
};

export const Scene3D: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const sim = simAt(t);
  const labels = useMemo(() => [0, 1, 2, 3].map(labelTex), []);
  const frost = useMemo(frostTex, []);
  const marble = useMemo(
    () =>
      canvasTex(1024, 1024, (c) => {
        c.fillStyle = '#7a6a5c';
        c.fillRect(0, 0, 1024, 1024);
        for (let i = 0; i < 60; i++) {
          c.strokeStyle = `rgba(40,30,22,${0.1 + rand(i) * 0.25})`;
          c.lineWidth = 1 + rand(i + 1) * 3;
          c.beginPath();
          c.moveTo(rand(i + 2) * 1024, 0);
          c.bezierCurveTo(rand(i + 3) * 1024, 340, rand(i + 4) * 1024, 680, rand(i + 5) * 1024, 1024);
          c.stroke();
        }
      }),
    [],
  );
  const temps = METHODS.map((m) => tempAt(m, sim));
  // Dose 4 dreht sich (liegend) ab der Erklärung "drehen"
  const spinOn = t >= wordAt('p3', 'drehen') - 0.3;
  const spin = spinOn ? (t - wordAt('p3', 'drehen')) * 9 : 0;
  return (
    <>
      <Rig />
      <hemisphereLight args={['#fff4e8', '#3a3028', 0.25]} />
      <directionalLight position={[0.8, 2.2, 1.4]} intensity={1.5} color="#fff1e0" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-0.8} shadow-camera-right={0.8} shadow-camera-top={0.8} shadow-camera-bottom={-0.8} shadow-bias={-0.0005} />
      <pointLight position={[-1, 0.8, 0.6]} intensity={0.6} distance={4} color="#ffd8b0" />
      {/* Arbeitsplatte + Fliesenwand */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[3, 2]} />
        <meshPhysicalMaterial map={marble} roughness={0.25} clearcoat={0.6} />
      </mesh>
      <mesh position={[0, 0.6, -0.55]} receiveShadow>
        <planeGeometry args={[3, 1.2]} />
        <meshStandardMaterial color="#1e2228" roughness={0.6} />
      </mesh>
      {/* Stationen */}
      <group position={ST.fridge as any}>
        <Cabinet />
        <group position={[0, 0.01 + CAN_H / 2 + 0.01, 0]}>
          <Can i={0} temp={temps[0]} label={labels[0]} frost={frost} />
        </group>
      </group>
      <group position={ST.freezer as any}>
        <Cabinet freezer />
        <group position={[0, 0.01 + CAN_H / 2 + 0.01, 0]}>
          <Can i={1} temp={temps[1]} label={labels[1]} frost={frost} />
        </group>
      </group>
      <group position={ST.ice as any}>
        <Bowl t={t} />
        <group position={[0.01, CAN_H / 2 + 0.004, 0]} rotation-z={0.05}>
          <Can i={2} temp={temps[2]} label={labels[2]} frost={frost} />
        </group>
      </group>
      <group position={ST.salt as any}>
        <Bowl salt t={t} />
        <group position={[0, CAN_R + 0.012, 0]} rotation-z={Math.PI / 2}>
          <group rotation-y={spin}>
            <Can i={3} temp={temps[3]} label={labels[3]} frost={frost} />
          </group>
        </group>
        {/* Salzstreuer */}
        <group position={[0.17, 0, -0.06]}>
          <mesh position={[0, 0.05, 0]} castShadow>
            <cylinderGeometry args={[0.022, 0.025, 0.1, 32]} />
            <meshPhysicalMaterial color="#ffffff" transparent opacity={0.5} roughness={0.05} clearcoat={1} />
          </mesh>
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.02, 0.023, 0.06, 24]} />
            <meshStandardMaterial color="#fbfbfb" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.107, 0]}>
            <cylinderGeometry args={[0.019, 0.023, 0.016, 32]} />
            <meshStandardMaterial color="#c8ccd2" metalness={1} roughness={0.25} />
          </mesh>
        </group>
      </group>
      {/* "Ziel erreicht"-Glanz um Dose 4 */}
      {t > EV.saltDone - 0.05 && t < EV.saltDone + 1.5 && (
        <mesh position={[ST.salt[0], 0.06, ST.salt[2]]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.15 + (t - EV.saltDone) * 0.1, 0.16 + (t - EV.saltDone) * 0.1, 64]} />
          <meshBasicMaterial color="#7cff4f" transparent opacity={Math.max(0, 1 - (t - EV.saltDone) / 1.5)} toneMapped={false} />
        </mesh>
      )}
    </>
  );
};

export const _l = line;
