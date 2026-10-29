"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// ===== Cấu hình =====
const PLANET_COLOR = "#1a1a1a"; // màu đường kinh vĩ của thân hành tinh
const PLANET_OPACITY = 0.2; // trong suốt 80%
const PLANET_BODY_COLOR = "#ffffff"; // thân hành tinh màu trắng đục
const PLANET_BODY_OPACITY = 0.4; // trong suốt 60%
const CAMERA_Z = 8.35; // giữ kích thước hành tinh khi khung canvas lớn hơn
const BACKDROP_H = 3.9; // giảm khoảng 23% so với trước // chiều cao ảnh nền trong cảnh 3D (đơn vị hành tinh)
const GRID_MERIDIANS = 16; // số đường kinh tuyến
const GRID_PARALLELS = 9; // số đường vĩ tuyến
const GRID_SEGMENTS = 64; // số đoạn thẳng cho mỗi đường tròn
const PLANET_SCALE = 0.45; // kích thước quả cầu so với bản gốc
const RING_SCALE = 0.91; // 0.7 × 1.3 // kích thước vòng hành tinh so với bản gốc
const TILT = 0.35; // nghiêng trục quay của hành tinh (rad)

// Vòng hành tinh: mặt vòng vuông góc với trục quay của hành tinh
const RING_COUNT = 14;
const RING_MIN = 1.3;
const RING_MAX = 1.85; // nằm trong khung canvas
const RING_COLOR = "#1a1a1a";
const DUST_COUNT = 2500;
const FRAME_FPS = 24; // tốc độ vẽ lại của Canvas, giảm để tiết kiệm CPU/GPU

// Các vòng hành tinh: nhiều dải mảnh có độ sáng khác nhau, cộng thêm lớp bụi hạt
const buildRings = () => {
  const group = new THREE.Group();

  // Gộp tất cả dải vòng thành một mesh. Độ đậm của mỗi dải được tính sẵn thành màu
  // trộn với nền trắng, nên không cần transparent và chỉ tốn một lần vẽ
  const base = new THREE.Color(RING_COLOR);
  const bands: THREE.BufferGeometry[] = [];
  for (let i = 0; i < RING_COUNT; i++) {
    const inner = RING_MIN + Math.random() * (RING_MAX - RING_MIN);
    const width = 0.003 + Math.random() * 0.008;
    const opacity = 0.25 + Math.random() * 0.6;
    const geo = new THREE.RingGeometry(inner, inner + width, 96);
    const count = geo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    for (let v = 0; v < count; v++) {
      colors[v * 3] = 1 - opacity * (1 - base.r);
      colors[v * 3 + 1] = 1 - opacity * (1 - base.g);
      colors[v * 3 + 2] = 1 - opacity * (1 - base.b);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    bands.push(geo);
  }
  const merged = mergeGeometries(bands, false);
  bands.forEach((geo) => geo.dispose());
  group.add(new THREE.Mesh(merged, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })));

  const dustPos = new Float32Array(DUST_COUNT * 3);
  for (let i = 0; i < DUST_COUNT; i++) {
    const r = RING_MIN + Math.random() * (RING_MAX - RING_MIN);
    const a = Math.random() * Math.PI * 2;
    dustPos[i * 3] = Math.cos(a) * r;
    dustPos[i * 3 + 1] = Math.sin(a) * r;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  group.add(
    new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({ color: RING_COLOR, size: 0.012, transparent: true, opacity: 0.8, depthWrite: false })
    )
  );

  return group;
};

// Điểm trên mặt cầu bán kính 1 theo vĩ độ và kinh độ (rad)
const onSphere = (lat: number, lon: number) =>
  [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)];

// Lưới kinh vĩ bằng đoạn thẳng: các kinh tuyến chạy từ cực này sang cực kia, các vĩ tuyến là vòng tròn
const buildGrid = () => {
  const pts: number[] = [];

  for (let i = 0; i < GRID_MERIDIANS; i++) {
    const lon = (i / GRID_MERIDIANS) * Math.PI * 2;
    for (let s = 0; s < GRID_SEGMENTS; s++) {
      const lat0 = -Math.PI / 2 + (s / GRID_SEGMENTS) * Math.PI;
      const lat1 = -Math.PI / 2 + ((s + 1) / GRID_SEGMENTS) * Math.PI;
      pts.push(...onSphere(lat0, lon), ...onSphere(lat1, lon));
    }
  }

  for (let j = 0; j < GRID_PARALLELS; j++) {
    const lat = -Math.PI / 2 + ((j + 1) / (GRID_PARALLELS + 1)) * Math.PI;
    for (let s = 0; s < GRID_SEGMENTS; s++) {
      const lon0 = (s / GRID_SEGMENTS) * Math.PI * 2;
      const lon1 = ((s + 1) / GRID_SEGMENTS) * Math.PI * 2;
      pts.push(...onSphere(lat, lon0), ...onSphere(lat, lon1));
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return geo;
};

// Ảnh nền đặt trong cảnh 3D ở mặt phẳng tâm: vòng phía trước vẫn nằm trên ảnh, vòng phía sau nằm dưới ảnh
function Backdrop({ src }: { src: string }) {
  const texture = useLoader(THREE.TextureLoader, src);
  texture.colorSpace = THREE.SRGBColorSpace;
  const image = texture.image as HTMLImageElement;
  const aspect = image.width / image.height;

  // Bóng đổ: bản làm mờ, tô màu xanh đậm của ảnh, rồi lệch xuống dưới và sang phải
  const shadowTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.filter = `blur(${Math.round(image.width * 0.026)}px)`;
    ctx.drawImage(image, 0, 0);
    ctx.filter = "none";
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = "rgba(20, 60, 60, 0.35)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return new THREE.CanvasTexture(canvas);
  }, [image]);

  return (
    <>
      {shadowTexture && (
        <mesh position={[0, -0.08, -0.02]} renderOrder={0} scale={[BACKDROP_H * aspect * 1.02, BACKDROP_H * 1.02, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={shadowTexture} transparent depthWrite={false} />
        </mesh>
      )}

      <mesh renderOrder={1} scale={[BACKDROP_H * aspect, BACKDROP_H, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>
    </>
  );
}

function Scene({
  spinRef,
  active,
  backdropSrc,
  showPlanet,
}: {
  spinRef: MutableRefObject<number>;
  active: boolean;
  backdropSrc?: string;
  showPlanet: boolean;
}) {
  const pivotRef = useRef<THREE.Group>(null);
  const grid = useMemo(buildGrid, []);
  const rings = useMemo(buildRings, []);
  const invalidate = useThree((state) => state.invalidate);

  // Chế độ demand: chỉ vẽ khi được yêu cầu, nên ta tự gọi vẽ lại đúng FRAME_FPS
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(invalidate, 1000 / FRAME_FPS);
    return () => window.clearInterval(id);
  }, [active, invalidate]);

  // Hành tinh và vòng quay cùng một trục theo góc của các thẻ
  useFrame(() => {
    if (pivotRef.current) pivotRef.current.rotation.y = spinRef.current;
  });

  return (
    <>
      {backdropSrc && (
        <Suspense fallback={null}>
          <Backdrop src={backdropSrc} />
        </Suspense>
      )}

    <group ref={pivotRef} rotation={[TILT, 0, 0]}>
      {showPlanet && (
        <>
          {/* Thân hành tinh màu trắng đục, trong suốt 60% */}
          <mesh scale={PLANET_SCALE}>
            <sphereGeometry args={[1, 48, 32]} />
            <meshBasicMaterial color={PLANET_BODY_COLOR} transparent opacity={PLANET_BODY_OPACITY} depthWrite={false} />
          </mesh>

          <lineSegments geometry={grid} scale={PLANET_SCALE}>
            <lineBasicMaterial color={PLANET_COLOR} transparent opacity={PLANET_OPACITY} depthWrite={false} />
          </lineSegments>
        </>
      )}

      {/* Mặt vòng nằm ngang (xoay 90° quanh X), vuông góc với trục Y của hành tinh */}
      <group rotation={[Math.PI / 2, 0, 0]} scale={RING_SCALE}>
        <primitive object={rings} />
      </group>
    </group>
    </>
  );
}

// Khung canvas rộng hơn hành tinh để vòng và ảnh nền không bị cắt
// active = false khi section ra khỏi màn hình: Canvas ngừng vẽ
export default function WireGlobe({
  spinRef,
  size,
  active,
  backdropSrc,
  showPlanet = true,
}: {
  spinRef: MutableRefObject<number>;
  size: number;
  active: boolean;
  backdropSrc?: string;
  showPlanet?: boolean; // false: chỉ giữ vòng hành tinh
}) {
  return (
    <div className="[&_canvas]:h-full [&_canvas]:w-full" style={{ width: size, height: size }}>
      <Canvas
        camera={{ position: [0, 0, CAMERA_Z], fov: 35 }}
        dpr={[1, 1.5]}
        frameloop="demand"
        resize={{ offsetSize: true }}
        gl={{ alpha: true, antialias: true }}
      >
        <Scene spinRef={spinRef} active={active} backdropSrc={backdropSrc} showPlanet={showPlanet} />
      </Canvas>
    </div>
  );
}
