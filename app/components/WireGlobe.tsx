"use client";

import { useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";

// ===== Cấu hình =====
const DETAIL = 3; // độ chi tiết lưới: lớn hơn = nhiều tam giác nhỏ hơn
const LAND_SCALE = 1.6; // tần số nhiễu địa hình: nhỏ hơn = lục địa to hơn
const LAND_HEIGHT = 0.09; // độ nhô của vùng đất so với mặt cầu
const TILT = 0.35; // nghiêng trục quay (rad)
const LINE_COLOR = "#1a1a1a";

const noise = new ImprovedNoise();

// Nhiễu nhiều tầng cho địa hình tự nhiên hơn
const fbm = (x: number, y: number, z: number) => {
  let v = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < 4; i++) {
    v += a * noise.noise(x * f, y * f, z * f);
    f *= 2;
    a *= 0.5;
  }
  return v;
};

// Icosphere, rồi đẩy các đỉnh lên ở chỗ nhiễu dương để tạo đất liền gồ ghề
const buildGeometry = () => {
  const geo = new THREE.IcosahedronGeometry(1, DETAIL);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const h = fbm(v.x * LAND_SCALE, v.y * LAND_SCALE, v.z * LAND_SCALE);
    const r = 1 + Math.max(0, h) * LAND_HEIGHT;
    pos.setXYZ(i, v.x * r, v.y * r, v.z * r);
  }

  return geo;
};

function Globe({ spinRef }: { spinRef: MutableRefObject<number> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useMemo(buildGeometry, []);

  // Góc quay lấy từ IeltsOverview, nên kéo thẻ nào thì quả cầu cũng xoay theo
  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y = spinRef.current;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[TILT, 0, 0]}>
      <meshBasicMaterial color={LINE_COLOR} wireframe />
    </mesh>
  );
}

export default function WireGlobe({ spinRef, size }: { spinRef: MutableRefObject<number>; size: number }) {
  return (
    <div style={{ width: size, height: size }}>
      <Canvas camera={{ position: [0, 0, 3.2], fov: 35 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
        <Globe spinRef={spinRef} />
      </Canvas>
    </div>
  );
}
