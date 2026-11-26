import React, {useLayoutEffect, useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {FPS, NIGHT, RIVER, ROOM, camAt, carZ, clamp, liftAt, line, rand, scene, smooth, wordAt} from './model';

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
const noise = (base: string, spots: string[], n = 6000, w = 512, rep = 1) =>
  canvasTex(w, w, (c) => {
    c.fillStyle = base;
    c.fillRect(0, 0, w, w);
    for (let i = 0; i < n; i++) {
      c.fillStyle = spots[i % spots.length];
      c.globalAlpha = 0.05 + rand(i * 3) * 0.2;
      c.fillRect(rand(i) * w, rand(i + 7) * w, 1 + rand(i + 1) * 5, 1 + rand(i + 2) * 5);
    }
  }, rep);
const F = "'Inter Display', 'Inter', sans-serif";
const SERIF = "'DejaVu Serif', serif";

const Rig: React.FC = () => {
  const frame = useCurrentFrame();
  const {camera, gl, scene: sc} = useThree();
  useLayoutEffect(() => {
    gl.shadowMap.enabled = true;
    const pm = new THREE.PMREMGenerator(gl);
    sc.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    sc.environmentIntensity = 0.15;
  }, [gl, sc]);
  useLayoutEffect(() => {
    const t = frame / FPS;
    const c = camAt(t);
    const pc = camera as THREE.PerspectiveCamera;
    pc.position.set(c.pos[0], c.pos[1], c.pos[2]);
    pc.lookAt(c.look[0], c.look[1], c.look[2]);
    pc.fov = c.fov;
    pc.near = 0.03;
    pc.far = 120;
    pc.updateProjectionMatrix();
    const atRiver = t >= scene('river').start && t < scene('epilog').start;
    const atRoom = (t >= scene('interrogation').start && t < scene('river').start) || t >= scene('outro').start;
    const dawn = t >= scene('epilog').start && t < scene('outro').start;
    const col = atRiver ? '#5a646c' : atRoom ? '#050506' : dawn ? '#2a3240' : '#06080c';
    sc.background = new THREE.Color(col);
    sc.fog = atRoom ? new THREE.Fog(col, 6, 18) : new THREE.FogExp2(col, atRiver ? 0.035 : dawn ? 0.03 : 0.055);
  }, [frame, camera, sc]);
  return null;
};

// ---------------------------------------------------------------- Auto (Limousine)
const Car: React.FC<{position: number[]; rot?: number; lights?: boolean; wet?: number; t: number}> = ({position, rot = 0, lights = true, wet = 0, t}) => {
  const paint = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#2a3340', metalness: 0.55, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12}), []);
  const mud = useMemo(() => new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 0.9, map: noise('#6a6650', ['#7a7458', '#4a4636', '#8a8466'])}), []);
  const glass = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#05070a', roughness: 0.05, metalness: 0.3, clearcoat: 1, transparent: true, opacity: 0.9}), []);
  const tire = useMemo(() => new THREE.MeshStandardMaterial({color: '#111', roughness: 0.85}), []);
  const body = wet > 0 ? mud : paint;
  return (
    <group position={position as any} rotation-y={rot}>
      <mesh position={[0, 0.5, 0]} material={body} castShadow>
        <boxGeometry args={[1.75, 0.55, 4.6]} />
      </mesh>
      <mesh position={[0, 0.98, -0.2]} material={glass} castShadow>
        <boxGeometry args={[1.55, 0.45, 2.3]} />
      </mesh>
      <mesh position={[0, 1.22, -0.2]} material={body}>
        <boxGeometry args={[1.5, 0.04, 1.9]} />
      </mesh>
      {[
        [-0.85, 1.45],
        [0.85, 1.45],
        [-0.85, -1.45],
        [0.85, -1.45],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.33, z]} rotation-z={Math.PI / 2} material={tire}>
          <cylinderGeometry args={[0.33, 0.33, 0.22, 24]} />
        </mesh>
      ))}
      {/* Rücklichter (+z = hinten) */}
      {[-0.65, 0.65].map((x) => (
        <mesh key={x} position={[x, 0.62, 2.31]}>
          <boxGeometry args={[0.35, 0.12, 0.02]} />
          <meshBasicMaterial color={lights ? '#ff1a1a' : '#3a0a0a'} toneMapped={false} />
        </mesh>
      ))}
      {[-0.6, 0.6].map((x) => (
        <mesh key={'h' + x} position={[x, 0.6, -2.31]}>
          <boxGeometry args={[0.38, 0.14, 0.02]} />
          <meshBasicMaterial color={lights ? '#fff8e0' : '#444'} toneMapped={false} />
        </mesh>
      ))}
      {lights && (
        <>
          <pointLight position={[0, 0.7, 2.6]} intensity={2.5} distance={6} color="#ff2020" />
          {[-0.6, 0.6].map((x) => (
            <spotLight key={x} position={[x, 0.65, -2.4]} intensity={60} distance={40} angle={0.45} penumbra={0.6} decay={1.3} color="#fff4d8" target-position={[x * 3, 0, -30]} />
          ))}
        </>
      )}
      {/* Fahrer-Silhouette (nur beim Fund) */}
      {wet > 0 && (
        <mesh position={[-0.38, 0.98, -0.25]}>
          <capsuleGeometry args={[0.2, 0.35, 6, 12]} />
          <meshStandardMaterial color="#141414" roughness={1} />
        </mesh>
      )}
      {/* abfließendes Wasser */}
      {wet > 0 &&
        Array.from({length: 50}, (_, i) => {
          const ph = (t * 1.4 + rand(i)) % 1;
          return (
            <mesh key={'w' + i} position={[(rand(i + 1) - 0.5) * 1.9, 0.2 - ph * 1.6, (rand(i + 2) - 0.5) * 4.4]}>
              <boxGeometry args={[0.02, 0.18, 0.02]} />
              <meshBasicMaterial color="#b8c8d0" transparent opacity={0.5 * wet * (1 - ph)} />
            </mesh>
          );
        })}
    </group>
  );
};

// ---------------------------------------------------------------- Nacht: Landstraße & Gaststätte
const Night: React.FC<{t: number}> = ({t}) => {
  const asphalt = useMemo(() => noise('#1c1d20', ['#2a2b2f', '#121315', '#34353a'], 9000, 512, 1), []);
  const field = useMemo(() => noise('#11160f', ['#1c2418', '#0a0d08'], 6000, 512, 30), []);
  const windowTex = useMemo(
    () =>
      canvasTex(256, 256, (c) => {
        const g = c.createLinearGradient(0, 0, 0, 256);
        g.addColorStop(0, '#ffcf7a');
        g.addColorStop(1, '#d88a30');
        c.fillStyle = g;
        c.fillRect(0, 0, 256, 256);
        c.fillStyle = '#3a2410';
        c.fillRect(122, 0, 12, 256);
        c.fillRect(0, 122, 256, 12);
      }),
    [],
  );
  const sign = useMemo(
    () =>
      canvasTex(512, 128, (c) => {
        c.fillStyle = '#2a1a0c';
        c.fillRect(0, 0, 512, 128);
        c.fillStyle = '#ffd890';
        c.font = `700 64px ${SERIF}`;
        c.textAlign = 'center';
        c.fillText('Gaststätte', 256, 85);
      }),
    [],
  );
  const wall = useMemo(() => new THREE.MeshStandardMaterial({color: '#8a8070', roughness: 0.9, map: noise('#8a8070', ['#6a6252', '#9a9080'])}), []);
  const roof = useMemo(() => new THREE.MeshStandardMaterial({color: '#4a2a22', roughness: 0.8}), []);
  asphalt.repeat.set(2, 40);
  const dawn = t >= scene('epilog').start && t < scene('outro').start;
  const z = carZ(t);
  const showCar = t < scene('night').end + 0.5 && t < scene('interrogation').start;
  const fade = t < scene('hook').end ? 1 - smooth((t - 6) / 4) : 1;
  return (
    <group position={NIGHT as any}>
      <hemisphereLight args={[dawn ? '#6a7a9a' : '#25304a', '#050505', dawn ? 0.9 : 0.35]} />
      <directionalLight position={[-6, 10, 6]} intensity={dawn ? 0.8 : 0.25} color={dawn ? '#b0c0ff' : '#8090c0'} />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -80]} receiveShadow>
        <planeGeometry args={[7, 200]} />
        <meshStandardMaterial map={asphalt} roughness={0.25} metalness={0.2} color="#9a9aa0" />
      </mesh>
      {/* Mittellinie */}
      {Array.from({length: 40}, (_, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[0, 0.01, 8 - i * 5]}>
          <planeGeometry args={[0.12, 2.5]} />
          <meshStandardMaterial color="#d8d8d0" roughness={0.5} />
        </mesh>
      ))}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, -80]}>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial map={field} roughness={1} />
      </mesh>
      {/* Leitpfosten */}
      {Array.from({length: 30}, (_, i) =>
        [-4, 4].map((x) => (
          <group key={i + '_' + x} position={[x, 0, 6 - i * 7]}>
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[0.1, 1, 0.1]} />
              <meshStandardMaterial color="#e8e8e0" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.85, 0.051]}>
              <boxGeometry args={[0.06, 0.12, 0.005]} />
              <meshBasicMaterial color={x < 0 ? '#ff8030' : '#ffffff'} toneMapped={false} />
            </mesh>
          </group>
        )),
      )}
      {/* Gaststätte */}
      <group position={[-6, 0, 4]}>
        <mesh position={[0, 2, 0]} material={wall} castShadow>
          <boxGeometry args={[7, 4, 6]} />
        </mesh>
        <mesh position={[0, 4.9, 0]} rotation-z={Math.PI / 4} scale={[1, 1, 1]} material={roof}>
          <boxGeometry args={[4.4, 4.4, 6.2]} />
        </mesh>
        {[-2, 0, 2].map((x) => (
          <mesh key={x} position={[3.51, 1.9, x]} rotation-y={Math.PI / 2}>
            <planeGeometry args={[1.1, 1.2]} />
            <meshBasicMaterial map={windowTex} toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[3.52, 3.3, 0]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[3, 0.75]} />
          <meshBasicMaterial map={sign} toneMapped={false} />
        </mesh>
        <pointLight position={[4.6, 2, 0]} intensity={dawn ? 0 : 14} distance={10} decay={1.2} color="#ffb860" />
        <pointLight position={[4.2, 3.6, 0]} intensity={dawn ? 0 : 6} distance={8} color="#ffd890" />
      </group>
      {/* Bauernhof in der Ferne */}
      <group position={[14, 0, -60]}>
        <mesh position={[0, 3, 0]} material={wall}>
          <boxGeometry args={[10, 6, 8]} />
        </mesh>
        <mesh position={[0, 7.2, 0]} rotation-z={Math.PI / 4} material={roof}>
          <boxGeometry args={[6.4, 6.4, 8.2]} />
        </mesh>
        <mesh position={[-5.01, 2.5, 1]} rotation-y={-Math.PI / 2}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={windowTex} toneMapped={false} />
        </mesh>
      </group>
      {showCar && (
        <group visible={fade > 0.02}>
          <Car position={[0.9, 0, z]} t={t} />
        </group>
      )}
    </group>
  );
};

// ---------------------------------------------------------------- Verhörraum / Gericht
const Room: React.FC<{t: number}> = ({t}) => {
  const metal = useMemo(() => new THREE.MeshStandardMaterial({color: '#7a7e84', metalness: 0.8, roughness: 0.35}), []);
  const wood = useMemo(() => new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 0.55, map: canvasTex(512, 512, (c) => {
    c.fillStyle = '#5a3a22';
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 120; i++) {
      c.strokeStyle = `rgba(${40 + rand(i) * 40},${25 + rand(i + 1) * 20},10,0.5)`;
      c.lineWidth = 1 + rand(i + 2) * 3;
      c.beginPath();
      c.moveTo(0, rand(i + 3) * 512);
      c.bezierCurveTo(170, rand(i + 4) * 512, 340, rand(i + 5) * 512, 512, rand(i + 6) * 512);
      c.stroke();
    }
  })}), []);
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 0.95, map: noise('#3a3e3a', ['#4a4e48', '#2a2e2a'], 9000, 512, 2)}), []);
  const paper = (title: string, sub: string, red = false) =>
    canvasTex(420, 594, (c) => {
      c.fillStyle = '#f1ede2';
      c.fillRect(0, 0, 420, 594);
      c.fillStyle = '#111';
      c.font = `700 22px ${F}`;
      c.fillText('POLIZEIPRÄSIDIUM', 30, 50);
      c.font = `900 44px ${F}`;
      c.fillStyle = red ? '#a01010' : '#111';
      c.fillText(title, 30, 120);
      c.font = `600 22px ${F}`;
      c.fillStyle = '#333';
      c.fillText(sub, 30, 160);
      c.fillStyle = 'rgba(30,30,30,0.5)';
      for (let i = 0; i < 16; i++) c.fillRect(30, 200 + i * 22, 300 + rand(i) * 60, 7);
      c.strokeStyle = '#123';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(40, 560);
      for (let x = 0; x < 160; x += 8) c.lineTo(40 + x, 555 + Math.sin(x * 0.3) * 10);
      c.stroke();
    });
  const docs = useMemo(() => ({g: paper('GESTÄNDNIS', 'Vernehmungsprotokoll'), w: paper('WIDERRUF', 'Erklärung der Beschuldigten', true), u: paper('URTEIL', 'Landgericht · 2005')}), []);
  const swing = Math.sin(t * 1.1) * 0.12;
  const court = t >= scene('court').start && t < scene('river').start;
  const hammer = wordAt('b4', 'Verurteilt');
  const hk = t - hammer;
  const hammerRot = hk > -0.4 && hk < 0 ? -0.9 * smooth((hk + 0.4) / 0.4) : hk >= 0 && hk < 0.25 ? -0.9 + 0.9 * smooth(hk / 0.12) : 0;
  const doc = court ? docs.u : t >= line('b3').start ? docs.w : docs.g;
  return (
    <group position={ROOM as any}>
      <ambientLight intensity={0.05} />
      {/* Hängelampe */}
      <group position={[0, 3.2, 0]} rotation-z={swing}>
        <mesh position={[0, -0.6, 0]} material={metal}>
          <cylinderGeometry args={[0.008, 0.008, 1.2, 6]} />
        </mesh>
        <mesh position={[0, -1.25, 0]} material={metal}>
          <coneGeometry args={[0.32, 0.3, 32, 1, true]} />
        </mesh>
        <mesh position={[0, -1.3, 0]}>
          <sphereGeometry args={[0.08, 16, 12]} />
          <meshBasicMaterial color="#fff4d0" toneMapped={false} />
        </mesh>
        <spotLight position={[0, -1.3, 0]} angle={0.9} penumbra={0.5} intensity={18} distance={8} decay={1.2} color="#fff0d0" castShadow target-position={[0, -4, 0]} />
      </group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#26282a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 2, -3]} material={wallMat}>
        <planeGeometry args={[12, 4]} />
      </mesh>
      <mesh position={[-3.5, 2, 0]} rotation-y={Math.PI / 2} material={wallMat}>
        <planeGeometry args={[12, 4]} />
      </mesh>
      {/* Tisch */}
      <mesh position={[0, 0.76, 0]} material={court ? wood : metal} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.05, 1.0]} />
      </mesh>
      {[
        [-0.85, -0.45],
        [0.85, -0.45],
        [-0.85, 0.45],
        [0.85, 0.45],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.38, z]} material={metal}>
          <boxGeometry args={[0.04, 0.76, 0.04]} />
        </mesh>
      ))}
      {/* Stühle */}
      {[-1, 1].map((s) => (
        <group key={s} position={[0, 0, s * 0.95]} rotation-y={s > 0 ? 0 : Math.PI}>
          <mesh position={[0, 0.45, 0]} material={metal} castShadow>
            <boxGeometry args={[0.45, 0.04, 0.45]} />
          </mesh>
          <mesh position={[0, 0.72, 0.21]} material={metal}>
            <boxGeometry args={[0.45, 0.5, 0.03]} />
          </mesh>
        </group>
      ))}
      {/* Akte */}
      <mesh position={[-0.15, 0.79, 0.05]} rotation-x={-Math.PI / 2} rotation-z={0.12} castShadow>
        <planeGeometry args={[0.42, 0.594]} />
        <meshStandardMaterial map={doc} roughness={0.9} />
      </mesh>
      {/* Tonbandgerät */}
      {!court && (
        <group position={[0.55, 0.79, -0.15]}>
          <mesh castShadow>
            <boxGeometry args={[0.36, 0.08, 0.24]} />
            <meshStandardMaterial color="#1a1a1c" roughness={0.4} metalness={0.4} />
          </mesh>
          {[-0.08, 0.08].map((x) => (
            <mesh key={x} position={[x, 0.045, -0.02]} rotation-y={t * 3}>
              <cylinderGeometry args={[0.055, 0.055, 0.01, 20]} />
              <meshStandardMaterial color="#5a4a3a" roughness={0.5} />
            </mesh>
          ))}
          <mesh position={[0.13, 0.045, 0.09]}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshBasicMaterial color={Math.floor(t * 2) % 2 ? '#ff2020' : '#400'} toneMapped={false} />
          </mesh>
        </group>
      )}
      {/* Richterhammer */}
      {court && (
        <group position={[0.55, 0.79, -0.1]}>
          <mesh material={wood} castShadow>
            <cylinderGeometry args={[0.1, 0.11, 0.035, 32]} />
          </mesh>
          <group position={[-0.25, 0.08, 0]} rotation-z={hammerRot}>
            <mesh position={[0.22, 0, 0]} rotation-z={Math.PI / 2} material={wood}>
              <cylinderGeometry args={[0.012, 0.014, 0.32, 10]} />
            </mesh>
            <mesh position={[0.38, 0.0, 0]} material={wood} castShadow>
              <cylinderGeometry args={[0.045, 0.045, 0.13, 20]} />
            </mesh>
          </group>
        </group>
      )}
      {/* Kaffeebecher */}
      <mesh position={[-0.6, 0.83, -0.25]} castShadow>
        <cylinderGeometry args={[0.045, 0.04, 0.1, 20]} />
        <meshStandardMaterial color="#d8d4c8" roughness={0.5} />
      </mesh>
      <pointLight position={[2.5, 1.5, 2]} intensity={0.6} distance={6} color="#4a6aa0" />
    </group>
  );
};

// ---------------------------------------------------------------- Donau
const River: React.FC<{t: number}> = ({t}) => {
  const water = useMemo(() => {
    const tex = noise('#3a4a44', ['#4a5a52', '#2a3a34', '#5a6a60'], 12000, 512, 8);
    return new THREE.MeshPhysicalMaterial({color: '#ffffff', map: tex, roughness: 0.15, metalness: 0.1, clearcoat: 1, transparent: true, opacity: 0.9});
  }, []);
  const steel = useMemo(() => new THREE.MeshStandardMaterial({color: '#d4a020', roughness: 0.5, metalness: 0.4}), []);
  const bank = useMemo(() => new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 1, map: noise('#4a4a3a', ['#5a5a44', '#3a3a2c', '#6a6650'], 9000, 512, 4)}), []);
  const lift = liftAt(t);
  const flashes = t > line('r1').start - 0.3 && t < line('r2').end ? (Math.sin(t * 9) > 0.93 || Math.sin(t * 13.7 + 1) > 0.95 ? 1 : 0) : 0;
  const ripple = 0.03 * Math.sin(t * 2);
  return (
    <group position={RIVER as any}>
      <hemisphereLight args={['#b8c4cc', '#2a2a24', 1.1]} />
      <directionalLight position={[-8, 12, 6]} intensity={1.2} color="#dde4ea" castShadow />
      <mesh rotation-x={-Math.PI / 2} position={[0, ripple, 0]}>
        <planeGeometry args={[80, 60]} />
        <primitive object={water} attach="material" />
      </mesh>
      <mesh position={[0, -3, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[80, 60]} />
        <meshStandardMaterial color="#1a201c" />
      </mesh>
      {/* Ufer */}
      <mesh position={[9, 0.4, 0]} rotation-z={0.12} material={bank}>
        <boxGeometry args={[8, 1.2, 60]} />
      </mesh>
      {/* Kran am Ufer */}
      <group position={[7.5, 1, -1]}>
        <mesh position={[0, 0.6, 0]} material={steel}>
          <boxGeometry args={[2.4, 1.2, 2.4]} />
        </mesh>
        <mesh position={[-3.6, 4.0, 0]} rotation-z={0.55} material={steel}>
          <boxGeometry args={[9.5, 0.35, 0.35]} />
        </mesh>
        <mesh position={[-7.5 + 0.0, 4.0 - 1.4 + lift * 0.5, 1]} material={steel}>
          <cylinderGeometry args={[0.02, 0.02, Math.max(0.5, 5.2 - lift), 6]} />
        </mesh>
      </group>
      {/* Wasserring um das auftauchende Auto */}
      {lift > -1.8 && lift < 0.6 && (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.04, 0]}>
          <ringGeometry args={[2.2 + (t % 1) * 0.6, 2.35 + (t % 1) * 0.6, 48]} />
          <meshBasicMaterial color="#e0eaee" transparent opacity={0.4 * (1 - (t % 1))} />
        </mesh>
      )}
      <Car position={[0, lift, 0]} rot={0.4} lights={false} wet={1} t={t} />
      <pointLight position={[-2, 3, 3]} intensity={60 * flashes} distance={12} color="#ffffff" />
      <pointLight position={[-3, 3.5, 4]} intensity={8} distance={14} decay={1} color="#e8eef2" />
    </group>
  );
};

export const Scene3D: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const room = (t >= scene('interrogation').start - 0.5 && t < scene('river').start + 0.5) || t >= scene('outro').start - 0.5;
  const river = t >= scene('river').start - 0.5 && t < scene('epilog').start + 0.5;
  const night = t < scene('interrogation').start + 0.5 || (t >= scene('epilog').start - 0.5 && t < scene('outro').start + 0.5);
  return (
    <>
      <Rig />
      {night && <Night t={t} />}
      {room && <Room t={t} />}
      {river && <River t={t} />}
    </>
  );
};

export const _c = clamp;
