import React, {useEffect, useLayoutEffect, useMemo, useState} from 'react';
import {continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {FPS, TL} from './timeline';
import {capsuleY, simAt, depthAt, camAt, earthSpin, cutAt, rand} from './model';

// ---------------------------------------------------------------- Texturen
export type Tex = {map: THREE.Texture; normal: THREE.Texture; spec: THREE.Texture; clouds: THREE.Texture; lights: THREE.Texture};
let texCache: Tex | null = null;
export const useEarthTextures = () => {
  const [tex, setTex] = useState<Tex | null>(texCache);
  const [h] = useState(() => (texCache ? null : delayRender('Erd-Texturen')));
  useEffect(() => {
    if (texCache) return;
    const L = new THREE.TextureLoader();
    const load = (f: string, srgb = true) =>
      new Promise<THREE.Texture>((res) =>
        L.load(staticFile('tex/' + f), (t) => {
          if (srgb) t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = 8;
          res(t);
        }),
      );
    Promise.all([
      load('earth_atmos_2048.jpg'),
      load('earth_normal_2048.jpg', false),
      load('earth_specular_2048.jpg', false),
      load('earth_clouds_1024.png'),
      load('earth_lights_2048.png'),
    ]).then(([map, normal, spec, clouds, lights]) => {
      texCache = {map, normal, spec, clouds, lights};
      setTex(texCache);
      if (h !== null) continueRender(h);
    });
  }, [h]);
  return tex;
};

// ---------------------------------------------------------------- Canvas-Texturen
const canvasTex = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/** Querschnitt der Erde: Kruste, oberer/unterer Mantel, äußerer (flüssiger) und innerer Kern */
const makeCrossSection = () =>
  canvasTex(2048, 2048, (c) => {
    const R = 1024;
    c.translate(R, R);
    const ring = (r: number, inner: string, outer: string) => {
      const g = c.createRadialGradient(0, 0, 0, 0, 0, r * R);
      g.addColorStop(0, inner);
      g.addColorStop(1, outer);
      c.fillStyle = g;
      c.beginPath();
      c.arc(0, 0, r * R, 0, Math.PI * 2);
      c.fill();
    };
    // Radien (Anteil am Erdradius) – Kruste optisch etwas verdickt
    ring(1.0, '#5a4636', '#3a2c22');
    ring(0.988, '#8a2a12', '#4c1408'); // oberer Mantel
    ring(0.894, '#c4421a', '#7a1e0c'); // unterer Mantel
    // Konvektionsströmungen im Mantel
    for (let i = 0; i < 2600; i++) {
      const a = rand(i) * Math.PI * 2;
      const r = (0.56 + rand(i + 9) * 0.42) * R;
      c.fillStyle = `rgba(${200 + rand(i + 3) * 55},${60 + rand(i + 4) * 70},20,${0.05 + rand(i + 5) * 0.08})`;
      c.beginPath();
      c.ellipse(Math.cos(a) * r, Math.sin(a) * r, 6 + rand(i + 6) * 26, 3 + rand(i + 7) * 8, a + Math.PI / 2, 0, Math.PI * 2);
      c.fill();
    }
    ring(0.546, '#ffb020', '#ff5a00'); // äußerer Kern (flüssig)
    for (let i = 0; i < 1400; i++) {
      const a = rand(i + 500) * Math.PI * 2;
      const r = (0.2 + rand(i + 501) * 0.34) * R;
      c.fillStyle = `rgba(255,${180 + rand(i + 502) * 75},${60 + rand(i + 503) * 80},${0.06 + rand(i + 504) * 0.1})`;
      c.beginPath();
      c.ellipse(Math.cos(a) * r, Math.sin(a) * r, 8 + rand(i + 505) * 30, 2 + rand(i + 506) * 6, a + Math.PI / 2 + 0.4, 0, Math.PI * 2);
      c.fill();
    }
    ring(0.1917, '#ffffff', '#ffd860'); // innerer Kern
    // weiche Übergänge an den Grenzen
    for (const [r, col] of [
      [0.546, 'rgba(255,220,120,0.6)'],
      [0.1917, 'rgba(255,255,230,0.7)'],
      [0.988, 'rgba(120,80,60,0.6)'],
    ] as const) {
      c.strokeStyle = col;
      c.lineWidth = 3;
      c.beginPath();
      c.arc(0, 0, r * R, 0, Math.PI * 2);
      c.stroke();
    }
  });

const glowTex = (inner: string, outer: string) =>
  canvasTex(256, 256, (c) => {
    const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, inner);
    g.addColorStop(0.25, outer);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 256);
  });

const labelTex = (text: string, color: string, sub?: string) =>
  canvasTex(1024, 256, (c) => {
    c.font = `900 96px 'Inter Display', 'Inter', sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.shadowColor = color;
    c.shadowBlur = 24;
    c.fillStyle = '#fff';
    c.fillText(text, 512, sub ? 95 : 128);
    if (sub) {
      c.font = `700 54px 'Inter Display', 'Inter', sans-serif`;
      c.fillStyle = color;
      c.fillText(sub, 512, 190);
    }
  });

// ---------------------------------------------------------------- Geo-Hilfen
const latLon = (lat: number, lon: number) => {
  const la = (lat * Math.PI) / 180;
  const phi = ((lon + 180) / 360) * Math.PI * 2;
  return new THREE.Vector3(-Math.cos(phi) * Math.cos(la), Math.sin(la), Math.sin(phi) * Math.cos(la));
};
const BERLIN = latLon(52.52, 13.4);
/** Ausrichtung: Berlin oben (+y), Afrika Richtung Kamera */
const EARTH_Q = (() => {
  const q1 = new THREE.Quaternion().setFromUnitVectors(BERLIN, new THREE.Vector3(0, 1, 0));
  const s = latLon(5, 15).applyQuaternion(q1);
  const ang = Math.atan2(s.x, s.z);
  const q2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -ang);
  return q2.multiply(q1);
})();
const NORTH_LOCAL = new THREE.Vector3(0, 1, 0);

// ---------------------------------------------------------------- Atmosphäre (Fresnel-Shader)
const atmosphereMat = () =>
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    uniforms: {},
    vertexShader: `varying vec3 vN; varying vec3 vP;
      void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vP = mv.xyz; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec3 vN; varying vec3 vP;
      void main(){ float f = pow(clamp(0.72 + dot(normalize(vP), vN), 0.0, 1.0), 2.6);
        gl_FragColor = vec4(vec3(0.30,0.62,1.0) * f * 1.6, f); }`,
  });

// ---------------------------------------------------------------- Kamera
const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const {camera} = useThree();
  useLayoutEffect(() => {
    const t = frame / FPS;
    const {pos, look, fov} = camAt(t);
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.lookAt(look[0], look[1], look[2]);
    (camera as THREE.PerspectiveCamera).fov = fov;
    camera.updateProjectionMatrix();
  }, [frame, camera]);
  return null;
};

const EnvSetup: React.FC = () => {
  const {gl, scene} = useThree();
  useLayoutEffect(() => {
    gl.localClippingEnabled = true;
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.35;
  }, [gl, scene]);
  return null;
};

// ---------------------------------------------------------------- Szene
export const EarthScene: React.FC<{tex: Tex}> = ({tex}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const ev = TL.events;

  const cross = useMemo(makeCrossSection, []);
  const coreGlow = useMemo(() => glowTex('rgba(255,250,220,1)', 'rgba(255,170,40,0.55)'), []);
  const capGlow = useMemo(() => glowTex('rgba(200,250,255,1)', 'rgba(40,200,255,0.5)'), []);
  const heatGlow = useMemo(() => glowTex('rgba(255,230,180,1)', 'rgba(255,90,20,0.5)'), []);
  const pinGlow = useMemo(() => glowTex('rgba(255,255,255,1)', 'rgba(255,40,90,0.6)'), []);
  const lblDE = useMemo(() => labelTex('DEUTSCHLAND', '#ff3b5c', 'START'), []);
  const lblNZ = useMemo(() => labelTex('PAZIFIK', '#19f7ff', 'bei Neuseeland'), []);
  const atmo = useMemo(atmosphereMat, []);
  const stars = useMemo(() => {
    const n = 2500;
    const p = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = rand(i * 3) * 2 - 1;
      const a = rand(i * 3 + 1) * Math.PI * 2;
      const r = 40;
      p[i * 3] = r * Math.sqrt(1 - u * u) * Math.cos(a);
      p[i * 3 + 1] = r * u;
      p[i * 3 + 2] = r * Math.sqrt(1 - u * u) * Math.sin(a);
      const w = 0.5 + rand(i * 3 + 2) * 0.5;
      col[i * 3] = w * (0.85 + 0.15 * rand(i));
      col[i * 3 + 1] = w * 0.9;
      col[i * 3 + 2] = w;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, []);

  const cut = cutAt(t); // 0 = geschlossen, 1 = halbe Erde aufgeschnitten
  const planeC = 1.06 - 1.06 * cut;
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, -1), 1.06), []);
  plane.constant = planeC;
  const capR = Math.sqrt(Math.max(0, 1 - Math.min(1, planeC) ** 2));

  const sim = simAt(t);
  const cy = capsuleY(sim);
  const depth = depthAt(sim);
  const speed = Math.abs(TL.fall.v[Math.min(TL.fall.v.length - 1, Math.floor(sim))] ?? 0);
  const showCapsule = t >= TL.lines.find((l) => l.id === 'd3')!.start - 0.2;
  const heat = Math.min(1, depth / 3000);
  const tunnelOn = Math.min(1, Math.max(0, (t - ev.cut - 0.6) / 0.8));
  const spin = earthSpin(t);
  const pinPulse = 0.8 + 0.2 * Math.sin(t * 6);
  const nzOn = Math.min(1, Math.max(0, (t - TL.lines.find((l) => l.id === 'd2')!.start) * 2));
  const deOn = Math.min(1, Math.max(0, (t - TL.lines.find((l) => l.id === 'd1')!.start) * 2)) * (t < ev.jump + 2 ? 1 : 0.6);

  const surfaceMat = useMemo(
    () =>
      tex &&
      new THREE.MeshPhongMaterial({
        map: tex.map,
        normalMap: tex.normal,
        normalScale: new THREE.Vector2(0.9, 0.9),
        specularMap: tex.spec,
        specular: new THREE.Color('#4a5a70'),
        shininess: 22,
        emissiveMap: tex.lights,
        emissive: new THREE.Color('#ffcf8a'),
        emissiveIntensity: 0.35,
        clippingPlanes: [plane],
        clipShadows: true,
      }),
    [tex, plane],
  );
  const cloudMat = useMemo(
    () => tex && new THREE.MeshPhongMaterial({map: tex.clouds, transparent: true, opacity: 0.85, depthWrite: false, clippingPlanes: [plane]}),
    [tex, plane],
  );

  return (
    <>
      <EnvSetup />
      <CameraRig />
      <ambientLight intensity={0.06} />
      <directionalLight position={[-4, 2.5, 5]} intensity={3.2} color="#fff6e8" />
      <points geometry={stars}>
        <pointsMaterial size={1.6} sizeAttenuation={false} vertexColors />
      </points>
      {tex && surfaceMat && cloudMat && (
        <group quaternion={EARTH_Q}>
          <group rotation={[0, 0, 0]}>
            <mesh rotation-y={spin} material={surfaceMat}>
              <sphereGeometry args={[1, 192, 192]} />
            </mesh>
            <mesh rotation-y={spin + t * 0.01} material={cloudMat} scale={1.008}>
              <sphereGeometry args={[1, 128, 128]} />
            </mesh>
          </group>
        </group>
      )}
      {/* Atmosphäre */}
      <mesh material={atmo} scale={1.045}>
        <sphereGeometry args={[1, 96, 96]} />
      </mesh>
      {/* Querschnitt */}
      {cut > 0.001 && (
        <group position={[0, 0, planeC + 0.0005]}>
          <mesh scale={capR}>
            <circleGeometry args={[1, 256]} />
            <meshBasicMaterial map={cross} toneMapped={false} />
          </mesh>
          <sprite scale={[0.9 * capR, 0.9 * capR, 1]} position={[0, 0, 0.002]}>
            <spriteMaterial map={coreGlow} blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.3 * cut * (0.9 + 0.1 * Math.sin(t * 3))} />
          </sprite>
          {/* Tunnel */}
          <mesh position={[0, 0, 0.003]} scale={[1, tunnelOn, 1]}>
            <planeGeometry args={[0.014, 2.0]} />
            <meshBasicMaterial color="#05070a" transparent opacity={0.92 * tunnelOn} />
          </mesh>
          {[-0.008, 0.008].map((x) => (
            <mesh key={x} position={[x, 0, 0.004]} scale={[1, tunnelOn, 1]}>
              <planeGeometry args={[0.0028, 2.0]} />
              <meshBasicMaterial color="#7ff4ff" transparent opacity={0.9 * tunnelOn} toneMapped={false} />
            </mesh>
          ))}
        </group>
      )}
      {/* Start-Markierung Deutschland */}
      {deOn > 0 && (
        <>
          <sprite position={[0, 1.005, 0.02]} scale={[0.12 * pinPulse, 0.12 * pinPulse, 1]}>
            <spriteMaterial map={pinGlow} blending={THREE.AdditiveBlending} depthWrite={false} opacity={deOn} />
          </sprite>
          <sprite position={[0, 1.2, 0.05]} scale={[0.6, 0.15, 1]}>
            <spriteMaterial map={lblDE} transparent depthWrite={false} depthTest={false} opacity={deOn * (t < TL.lines.find((l) => l.id === 'd3')!.start ? 1 : 0)} />
          </sprite>
        </>
      )}
      {nzOn > 0 && t < ev.twistStart && (
        <>
          <sprite position={[0, -1.005, 0.02]} scale={[0.12 * pinPulse, 0.12 * pinPulse, 1]}>
            <spriteMaterial map={capGlow} blending={THREE.AdditiveBlending} depthWrite={false} opacity={nzOn} />
          </sprite>
          <sprite position={[0, -1.2, 0.05]} scale={[0.6, 0.15, 1]}>
            <spriteMaterial map={lblNZ} transparent depthWrite={false} depthTest={false} opacity={nzOn * (t < ev.jump || t > ev.rushStart ? 1 : 0)} />
          </sprite>
        </>
      )}
      {/* Kapsel */}
      {showCapsule && (
        <group position={[0, cy, 0.02]}>
          <sprite scale={[0.09, 0.09, 1]} position={[0, 0, 0.01]}>
            <spriteMaterial map={heatGlow} blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.2 + 0.35 * heat} />
          </sprite>
          <sprite scale={[0.06, 0.06, 1]} position={[0, 0, 0.012]}>
            <spriteMaterial map={capGlow} blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.55} />
          </sprite>
          {/* Bewegungsspur */}
          {speed > 500 && (
            <mesh position={[0, (TL.fall.x[Math.floor(sim)] ?? 0) > (TL.fall.x[Math.floor(sim) + 1] ?? 0) ? Math.min(0.35, speed / 100000) / 2 : -Math.min(0.35, speed / 100000) / 2, 0.008]}>
              <planeGeometry args={[0.012, Math.min(0.35, speed / 100000)]} />
              <meshBasicMaterial color="#9ff6ff" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
            </mesh>
          )}
          <mesh rotation-y={t * 0.8} rotation-z={sim > 1100 && sim < 1200 ? Math.sin(t * 0.7) * 0.6 : 0}>
            <capsuleGeometry args={[0.0085, 0.022, 8, 24]} />
            <meshStandardMaterial color="#d8dde6" metalness={0.85} roughness={0.25} emissive="#ff6a20" emissiveIntensity={heat * 0.6} />
          </mesh>
          <mesh position={[0, 0.006, 0.0075]} rotation-y={t * 0.8}>
            <sphereGeometry args={[0.0035, 16, 16]} />
            <meshBasicMaterial color="#7ff4ff" toneMapped={false} />
          </mesh>
        </group>
      )}
    </>
  );
};

export const _north = NORTH_LOCAL;
