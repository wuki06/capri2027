import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {useCurrentFrame} from 'remotion';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {FPS, depthAt, ev, headlightsAt, line, rand, sunAt, waterColor} from './model';

type V3 = [number, number, number];
const canvasTex = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
const noiseTex = (base: string, spots: string[], n = 3000, w = 512) =>
  canvasTex(w, w, (c) => {
    c.fillStyle = base;
    c.fillRect(0, 0, w, w);
    for (let i = 0; i < n; i++) {
      c.fillStyle = spots[i % spots.length];
      c.globalAlpha = 0.08 + rand(i * 3) * 0.25;
      c.beginPath();
      c.ellipse(rand(i) * w, rand(i + 7) * w, 2 + rand(i + 1) * 14, 1 + rand(i + 2) * 8, rand(i + 4) * 3, 0, Math.PI * 2);
      c.fill();
    }
  });
const glowTex = () =>
  canvasTex(128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.3, 'rgba(160,240,255,0.5)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
  });

const D = (id: string) => line(id).depth;

// ---------------------------------------------------------------- Kamera & Umgebung
export const camPose = (t: number) => {
  const d = depthAt(t);
  const bob = Math.sin(t * 0.9) * 0.08;
  const sway = Math.sin(t * 0.37) * 0.25;
  const atBottom = t > ev.reveal - 2.5;
  const pos = new THREE.Vector3(sway, -d + bob, atBottom ? 1.2 : 0);
  const look = new THREE.Vector3(sway * 0.3, -d - (atBottom ? 2.6 : 1.3), -8);
  const m = new THREE.Matrix4().lookAt(pos, look, new THREE.Vector3(0, 1, 0));
  const q = new THREE.Quaternion().setFromRotationMatrix(m);
  return {pos, look, q, d};
};
const Rig: React.FC = () => {
  const frame = useCurrentFrame();
  const {camera, scene} = useThree();
  useLayoutEffect(() => {
    const t = frame / FPS;
    const {pos, look, d} = camPose(t);
    const pc = camera as THREE.PerspectiveCamera;
    pc.position.copy(pos);
    pc.lookAt(look);
    pc.fov = 52;
    pc.near = 0.05;
    pc.far = 400;
    pc.updateProjectionMatrix();
    const col = new THREE.Color(waterColor(d));
    scene.background = col;
    const dens = d < 900 ? 0.022 + d * 0.00002 : 0.034;
    scene.fog = new THREE.FogExp2(col, dens);
  }, [frame, camera, scene]);
  return null;
};

const MarineSnow: React.FC<{t: number; d: number}> = ({t, d}) => {
  const N = 1400;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    return g;
  }, []);
  const camY = -d;
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < N; i++) {
    const cell = 14;
    const yWorld = -rand(i * 3 + 1) * cell - t * 0.06;
    let off = ((yWorld - camY) % cell + cell) % cell - cell / 2;
    pos.setXYZ(i, (rand(i * 3) - 0.5) * 14 + Math.sin(t * 0.3 + i) * 0.1, camY + off, -rand(i * 3 + 2) * 14 + 2);
  }
  pos.needsUpdate = true;
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial size={0.035} color="#dfefff" transparent opacity={0.75} depthWrite={false} />
    </points>
  );
};

// ---------------------------------------------------------------- Tiere & Objekte
const Diver: React.FC<{p: V3; t: number}> = ({p, t}) => {
  const suit = useMemo(() => new THREE.MeshStandardMaterial({color: '#1b1d22', roughness: 0.6}), []);
  const tank = useMemo(() => new THREE.MeshStandardMaterial({color: '#d8d0b8', metalness: 0.6, roughness: 0.3}), []);
  const kick = Math.sin(t * 2.4) * 0.35;
  return (
    <group position={p} rotation={[0.15, 0.6, -1.25]}>
      <mesh material={suit} castShadow>
        <capsuleGeometry args={[0.2, 0.7, 8, 16]} />
      </mesh>
      <mesh position={[0, 0.62, 0]} material={suit}>
        <sphereGeometry args={[0.13, 20, 20]} />
      </mesh>
      <mesh position={[0, 0.64, 0.1]}>
        <boxGeometry args={[0.18, 0.08, 0.05]} />
        <meshStandardMaterial color="#9fd8ff" metalness={0.9} roughness={0.05} />
      </mesh>
      <mesh position={[0, 0.1, -0.24]} material={tank}>
        <capsuleGeometry args={[0.1, 0.55, 6, 14]} />
      </mesh>
      {[-0.1, 0.1].map((x, i) => (
        <group key={x} position={[x, -0.45, 0]} rotation-x={i ? kick : -kick}>
          <mesh position={[0, -0.3, 0]} material={suit}>
            <capsuleGeometry args={[0.07, 0.5, 6, 10]} />
          </mesh>
          <mesh position={[0, -0.72, 0.05]} rotation-x={-0.3}>
            <boxGeometry args={[0.14, 0.4, 0.02]} />
            <meshStandardMaterial color="#e0c020" roughness={0.5} />
          </mesh>
        </group>
      ))}
      <pointLight position={[0, 0.7, 0.2]} intensity={2} distance={4} color="#fff4d0" />
    </group>
  );
};

const Angler: React.FC<{p: V3; t: number; glow: THREE.Texture}> = ({p, t, glow}) => {
  const skin = useMemo(() => new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 0.55, map: noiseTex('#2a2622', ['#3c342c', '#191512'])}), []);
  const tooth = useMemo(() => new THREE.MeshStandardMaterial({color: '#e8e4d4', roughness: 0.3}), []);
  const jaw = Math.sin(t * 1.3) * 0.12;
  return (
    <group position={p} rotation-y={0.5 + Math.sin(t * 0.4) * 0.15}>
      <mesh material={skin} scale={[1.2, 0.9, 0.85]}>
        <sphereGeometry args={[0.45, 32, 24]} />
      </mesh>
      <mesh position={[-0.6, 0, 0]} rotation-z={Math.PI / 2} material={skin} scale={[1, 1, 0.3]}>
        <coneGeometry args={[0.3, 0.5, 16]} />
      </mesh>
      <group position={[0.45, -0.12, 0]} rotation-z={-0.25 - jaw}>
        <mesh material={skin} scale={[1, 0.35, 0.9]}>
          <sphereGeometry args={[0.32, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        </mesh>
        {Array.from({length: 9}, (_, i) => (
          <mesh key={i} position={[0.12 + Math.cos(i * 0.35 - 1.4) * 0.18, 0.02, Math.sin(i * 0.35 - 1.4) * 0.24]} material={tooth} rotation-z={Math.PI}>
            <coneGeometry args={[0.018, 0.13, 6]} />
          </mesh>
        ))}
      </group>
      {Array.from({length: 8}, (_, i) => (
        <mesh key={i} position={[0.52 + Math.cos(i * 0.4 - 1.4) * 0.12, 0.02, Math.sin(i * 0.4 - 1.4) * 0.22]} material={tooth}>
          <coneGeometry args={[0.015, 0.11, 6]} />
        </mesh>
      ))}
      <mesh position={[0.25, 0.18, 0.3]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color="#cfe0e0" roughness={0.1} />
      </mesh>
      {/* Angel mit Leuchtköder */}
      <mesh position={[0.35, 0.62, 0]} rotation-z={-0.6}>
        <cylinderGeometry args={[0.008, 0.012, 0.55, 6]} />
        <meshStandardMaterial color="#3a332c" />
      </mesh>
      <mesh position={[0.6, 0.82, 0]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color="#c8fbff" toneMapped={false} />
      </mesh>
      <sprite position={[0.6, 0.82, 0]} scale={[0.6 + 0.1 * Math.sin(t * 4), 0.6 + 0.1 * Math.sin(t * 4), 1]}>
        <spriteMaterial map={glow} blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.9} />
      </sprite>
      <pointLight position={[0.6, 0.82, 0.1]} intensity={1.5} distance={2.5} color="#9ff6ff" />
    </group>
  );
};

const WhaleAndSquid: React.FC<{p: V3; t: number}> = ({p, t}) => {
  const skin = useMemo(() => new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 0.7, map: noiseTex('#4a4a4e', ['#5b5b60', '#3a3a3d', '#6a6a6a'], 4000)}), []);
  const squid = useMemo(() => new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 0.45, map: noiseTex('#a8402e', ['#c85a40', '#7a2a1c'])}), []);
  const swim = Math.sin(t * 0.8);
  return (
    <group position={p}>
      <group rotation-y={-0.5}>
        <mesh material={skin} position={[2.2, 0, 0]} scale={[1, 0.85, 0.75]}>
          <boxGeometry args={[4.4, 2.6, 2.4, 6, 6, 6]} />
        </mesh>
        <mesh material={skin} position={[-1.5, -0.1, 0]} rotation-z={Math.PI / 2} scale={[1, 1, 0.8]}>
          <capsuleGeometry args={[1.0, 4.2, 10, 20]} />
        </mesh>
        <mesh material={skin} position={[-5.0, 0, 0]} rotation-z={Math.PI / 2}>
          <coneGeometry args={[0.7, 2.4, 16]} />
        </mesh>
        <mesh material={skin} position={[-6.4, 0.1 + swim * 0.3, 0]} rotation-x={Math.PI / 2} scale={[0.6, 2.2, 0.08]}>
          <sphereGeometry args={[1, 16, 12]} />
        </mesh>
        <mesh position={[3.6, -0.75, 0]} material={skin} scale={[1.3, 0.25, 0.5]}>
          <boxGeometry args={[1.6, 0.6, 0.8]} />
        </mesh>
        <mesh position={[2.6, 0.15, 0.95]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#111" roughness={0.1} />
        </mesh>
      </group>
      {/* Riesenkalmar */}
      <group position={[4.5, -1.6, 2.2]} rotation={[0.2, 0.9, 0.4]}>
        <mesh material={squid} rotation-z={Math.PI / 2}>
          <coneGeometry args={[0.45, 2.4, 18]} />
        </mesh>
        <mesh material={squid} position={[-1.3, 0, 0]}>
          <sphereGeometry args={[0.42, 18, 14]} />
        </mesh>
        {Array.from({length: 10}, (_, i) => {
          const a = (i / 10) * Math.PI * 2;
          const long = i < 2 ? 2.2 : 1;
          return (
            <group key={i} position={[-1.6, Math.sin(a) * 0.25, Math.cos(a) * 0.25]} rotation={[a, 0, Math.PI / 2 + Math.sin(t * 2 + i) * 0.25]}>
              <mesh material={squid} position={[0, 1.1 * long, 0]}>
                <cylinderGeometry args={[0.025, 0.07, 2.2 * long, 8]} />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
};

const Titanic: React.FC<{p: V3}> = ({p}) => {
  const rust = useMemo(() => new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 0.9, map: noiseTex('#4a2a1c', ['#7a3a1a', '#2a1a12', '#9a5a2a', '#3a2a22'], 6000, 1024)}), []);
  const hull = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.quadraticCurveTo(4, -6, 6, -40);
    s.lineTo(-6, -40);
    s.quadraticCurveTo(-4, -6, 0, 0);
    const g = new THREE.ExtrudeGeometry(s, {depth: 14, bevelEnabled: false, curveSegments: 24});
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  return (
    <group position={p} rotation-y={Math.PI + 0.55}>
      <pointLight position={[-3, 24, 3]} intensity={30} distance={50} decay={1} color="#ffe2b8" />
      <mesh geometry={hull} material={rust} />
      {/* Reling am Bug */}
      {Array.from({length: 26}, (_, i) => {
        const k = i / 25;
        const side = i % 2 ? 1 : -1;
        const z = k * 16;
        const x = side * (Math.min(1, k * 4) * 4 + 0.2);
        return (
          <mesh key={i} position={[x * 0.9, 14.6, z]} material={rust}>
            <cylinderGeometry args={[0.05, 0.05, 1.2, 6]} />
          </mesh>
        );
      })}
      <mesh position={[0, 20, 24]} rotation-x={0.35} material={rust}>
        <cylinderGeometry args={[0.35, 0.45, 14, 10]} />
      </mesh>
      {/* Rostzapfen */}
      {Array.from({length: 40}, (_, i) => (
        <mesh key={i} position={[(rand(i) - 0.5) * 9, 2 + rand(i + 3) * 11, 2 + rand(i + 5) * 20]} material={rust} rotation-z={Math.PI}>
          <coneGeometry args={[0.1 + rand(i) * 0.15, 0.6 + rand(i + 1) * 1.2, 6]} />
        </mesh>
      ))}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.2, 10]}>
        <circleGeometry args={[60, 32]} />
        <meshStandardMaterial color="#3a3a36" roughness={1} map={noiseTex('#3a3a36', ['#4a4a44', '#2e2e2a'])} />
      </mesh>
    </group>
  );
};

const Dumbo: React.FC<{p: V3; t: number}> = ({p, t}) => {
  const body = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#ffb0a0', roughness: 0.4, transmission: 0, transparent: true, opacity: 0.92, emissive: '#4a1a14', emissiveIntensity: 0.3}), []);
  const flap = Math.sin(t * 3) * 0.6;
  return (
    <group position={[p[0], p[1] + Math.sin(t * 1.5) * 0.15, p[2]]} rotation-z={0.2}>
      <mesh material={body} scale={[1, 1.15, 1]}>
        <sphereGeometry args={[0.35, 28, 20]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.33, 0.18, 0]} rotation-z={s * (0.6 + flap)} material={body} scale={[0.32, 0.18, 0.05]}>
          <sphereGeometry args={[1, 16, 12]} />
        </mesh>
      ))}
      <mesh position={[0, -0.32, 0]} material={body} rotation-x={Math.PI}>
        <coneGeometry args={[0.42, 0.35, 16, 1, true]} />
      </mesh>
      {[-0.12, 0.12].map((x) => (
        <mesh key={x} position={[x, 0.05, 0.31]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color="#111" roughness={0.1} />
        </mesh>
      ))}
    </group>
  );
};

const Snailfish: React.FC<{p: V3; t: number}> = ({p, t}) => {
  const body = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#f4d6d0', roughness: 0.25, transparent: true, opacity: 0.85, emissive: '#3a2020', emissiveIntensity: 0.25}), []);
  const w = Math.sin(t * 4) * 0.3;
  return (
    <group position={[p[0] + Math.sin(t * 0.5) * 0.4, p[1], p[2]]} rotation-y={0.3}>
      <mesh material={body} scale={[1.4, 0.8, 0.7]}>
        <sphereGeometry args={[0.18, 24, 18]} />
      </mesh>
      <mesh material={body} position={[-0.35, 0, 0]} rotation-z={Math.PI / 2} rotation-y={w} scale={[0.5, 1, 0.25]}>
        <coneGeometry args={[0.16, 0.5, 12]} />
      </mesh>
      <mesh position={[0.16, 0.04, 0.09]}>
        <sphereGeometry args={[0.022, 10, 10]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
};

const Bottom: React.FC<{p: V3; t: number}> = ({p, t}) => {
  const mud = useMemo(() => {
    const tx = noiseTex('#5c5446', ['#6e6452', '#4a4236', '#7a705c'], 8000, 1024);
    tx.repeat.set(4, 4);
    return new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 1, map: tx});
  }, []);
  const bag = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(0.55, 5);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      const n = 1 + 0.18 * Math.sin(v.x * 9) * Math.cos(v.y * 11) + 0.1 * Math.sin(v.z * 17 + v.x * 5);
      v.multiplyScalar(n);
      v.y *= 0.45;
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const bagMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#f2f2ee', roughness: 0.35, transparent: true, opacity: 0.88, side: THREE.DoubleSide, sheen: 1, clearcoat: 0.6}), []);
  const amph = useMemo(() => new THREE.MeshStandardMaterial({color: '#f0e6d6', roughness: 0.4, transparent: true, opacity: 0.9}), []);
  return (
    <group position={p}>
      <mesh rotation-x={-Math.PI / 2} material={mud}>
        <planeGeometry args={[60, 60, 1, 1]} />
      </mesh>
      {Array.from({length: 30}, (_, i) => (
        <mesh key={i} position={[(rand(i) - 0.5) * 16, 0.05, -rand(i + 9) * 14]} material={mud} scale={[1, 0.3, 1]}>
          <sphereGeometry args={[0.2 + rand(i + 2) * 0.5, 10, 8]} />
        </mesh>
      ))}
      <group position={[0.1, 0.18, -3.4]} rotation={[0.1, 0.7, 0.15]}>
        <mesh geometry={bag} material={bagMat} />
        {[-0.18, 0.18].map((x) => (
          <mesh key={x} position={[x, 0.28, 0.2]} rotation={[1.1, 0, 0]} material={bagMat}>
            <torusGeometry args={[0.14, 0.03, 8, 20, Math.PI]} />
          </mesh>
        ))}
      </group>
      {/* Flohkrebse (Amphipoden) */}
      {Array.from({length: 14}, (_, i) => {
        const a = t * (0.4 + rand(i) * 0.4) + i;
        return (
          <mesh key={i} position={[Math.cos(a) * (0.8 + rand(i + 1) * 1.6), 0.15 + rand(i + 2) * 0.6, -3 + Math.sin(a) * (0.8 + rand(i + 3) * 1.2)]} rotation-y={-a} material={amph} scale={[1, 0.5, 0.4]}>
            <capsuleGeometry args={[0.03, 0.08, 4, 8]} />
          </mesh>
        );
      })}
    </group>
  );
};

const Headlight: React.FC<{x: number; k: number}> = ({x, k}) => {
  const light = useRef<THREE.SpotLight>(null);
  const target = useRef<THREE.Object3D>(null);
  useLayoutEffect(() => {
    if (light.current && target.current) light.current.target = target.current;
  }, []);
  return (
    <>
      <spotLight ref={light} position={[x, -0.3, 0]} intensity={16 * k} distance={60} angle={0.55} penumbra={0.55} decay={1.0} color="#eef6ff" />
      <object3D ref={target} position={[x * 0.2, -1.4, -10]} />
    </>
  );
};

// ---------------------------------------------------------------- Szene
export const Scene3D: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const d = depthAt(t);
  const pose = camPose(t);
  const glow = useMemo(glowTex, []);
  const sun = sunAt(d);
  const head = headlightsAt(t, d);
  const near = (depth: number, range = 260) => Math.abs(d - depth) < range;

  return (
    <>
      <Rig />
      <hemisphereLight args={['#7fd0ff', '#06223a', 0.25 + 1.6 * sun]} />
      <directionalLight position={[2, -d + 30, 6]} intensity={2.5 * sun} color="#cfefff" />
      <ambientLight intensity={0.04 + 0.03 * head} color="#9fc4e8" />
      {/* Scheinwerfer des Tauchboots */}
      <group position={pose.pos} quaternion={pose.q}>
        <Headlight x={-0.6} k={head} />
        <Headlight x={0.6} k={head} />
        <pointLight position={[0, 0.3, -1]} intensity={1.2 * head} distance={30} decay={1.0} color="#cfe6ff" />
      </group>
      {/* Wasseroberfläche & Lichtstrahlen */}
      {d < 220 && (
        <>
          <mesh position={[0, 0, -10]} rotation-x={Math.PI / 2}>
            <planeGeometry args={[200, 200]} />
            <meshBasicMaterial color="#bff4ff" transparent opacity={0.85} side={THREE.DoubleSide} />
          </mesh>
          {Array.from({length: 14}, (_, i) => (
            <mesh key={i} position={[(rand(i) - 0.5) * 24, -20 - rand(i + 1) * 10, -6 - rand(i + 2) * 18]} rotation={[0.1, rand(i + 3) * 3, 0.18 + (rand(i + 4) - 0.5) * 0.2]}>
              <planeGeometry args={[0.6 + rand(i + 5) * 1.6, 60]} />
              <meshBasicMaterial color="#d9fbff" transparent opacity={(0.05 + 0.08 * Math.sin(t * 0.8 + i) ** 2) * Math.exp(-d / 70)} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </>
      )}
      <MarineSnow t={t} d={d} />
      {near(D('d1')) && <Diver p={[0.6, -D('d1') - 1.6, -5]} t={t} />}
      {near(D('d3')) && <Angler p={[0.1, -D('d3') - 1.5, -4]} t={t} glow={glow} />}
      {near(D('d4'), 350) && <WhaleAndSquid p={[-1.2, -D('d4') - 3.5, -15]} t={t} />}
      {near(D('d5'), 400) && <Titanic p={[3.5, -D('d5') - 17, -18]} />}
      {near(D('d6')) && <Dumbo p={[0.2, -D('d6') - 1.5, -3.6]} t={t} />}
      {near(D('d7')) && <Snailfish p={[0.1, -D('d7') - 1.3, -2.8]} t={t} />}
      {d > 10600 && <Bottom p={[0, -10898 - 2.2, 0]} t={t} />}
    </>
  );
};
