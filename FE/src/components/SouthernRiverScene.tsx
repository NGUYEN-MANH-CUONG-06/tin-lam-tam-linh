import { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Water } from "three/examples/jsm/objects/Water.js";
import { AppDialog } from "./AppDialog";
import { Button } from "./ui/button";
import {
  Sparkles,
  Send,
  RotateCcw,
  Compass,
  Eye,
  Heart,
  Volume2,
  Moon,
  Flower2,
} from "lucide-react";
import {
  getDemoRoyalLanternStock,
  useRoyalLantern,
} from "../data/inventoryService";
import { isDemoMode } from "../data/demoMode";
import { DemoCommercePurchaseDialog } from "./DemoCommercePurchaseDialog";
import { disposeThreeScene } from "./threeSceneUtils";
import type { ReleasedLanternWish } from "../data/wishReleaseSession";

interface FloatingLantern {
  group: THREE.Group;
  flowerMount: THREE.Group;
  light: THREE.PointLight;
  flame: THREE.Mesh;
  glow: THREE.Sprite;
  reflection: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  ripples: Array<{
    mesh: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
    phase: number;
  }>;
  initialX: number;
  speed: number;
  bobPhase: number;
  message: string;
  royal: boolean;
  revealStartedAt: number;
  revealDuration: number;
  rippleMaxOpacity: number;
}

interface RoyalRevealBurst {
  points: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  origin: THREE.Vector3;
  startTime: number;
  phases: Float32Array;
}

interface LanternSpawnPosition {
  x: number;
  z: number;
}

const lanternSpawnPositions: LanternSpawnPosition[] = [];
let lanternSpawnSeed = 0x5eed1234;

function nextLanternSpawnRandom() {
  lanternSpawnSeed = (lanternSpawnSeed + 0x6d2b79f5) >>> 0;
  let value = lanternSpawnSeed;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

function resetLanternSpawnLayout() {
  lanternSpawnPositions.length = 0;
  lanternSpawnSeed = (Math.random() * 4294967296) >>> 0;
}

function getLanternSpawnPosition(index: number): LanternSpawnPosition {
  while (lanternSpawnPositions.length <= index) {
    let position: LanternSpawnPosition | null = null;
    let minSpacing = 5.25;

    while (!position && minSpacing >= 4.6) {
      for (let attempt = 0; attempt < 240; attempt++) {
        const downriverDepth = 14 + Math.floor(lanternSpawnPositions.length / 6) * 8;
        const candidate = {
          x: (nextLanternSpawnRandom() - 0.5) * 10.8,
          z: 19 - nextLanternSpawnRandom() * downriverDepth,
        };
        const minSpacingSquared = minSpacing * minSpacing;
        const overlaps = lanternSpawnPositions.some((placed) => {
          const dx = candidate.x - placed.x;
          const dz = candidate.z - placed.z;
          return dx * dx + dz * dz < minSpacingSquared;
        });

        if (!overlaps) {
          position = candidate;
          break;
        }
      }

      minSpacing -= 0.2;
    }

    if (!position) {
      position = {
        x: (nextLanternSpawnRandom() - 0.5) * 10,
        z: -16 - lanternSpawnPositions.length * 4.8,
      };
    }

    lanternSpawnPositions.push(position);
  }

  return lanternSpawnPositions[index];
}

function LanternStylePreview({ royal }: { royal: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let frameId = 0;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 30);
    camera.position.set(0, 1.75, 3.75);
    const root = new THREE.Group();
    scene.add(root);
    scene.add(new THREE.HemisphereLight("#fff1d1", "#263b38", 2.1));
    const keyLight = new THREE.DirectionalLight("#fff0ca", 3.1);
    keyLight.position.set(-2.5, 4, 3);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(
      royal ? "#ffbf55" : "#ff98bd",
      royal ? 18 : 8,
      8,
    );
    rimLight.position.set(0, 1.1, 0.2);
    scene.add(rimLight);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.44, 0.09, 40),
      new THREE.MeshStandardMaterial({
        color: royal ? "#718344" : "#2f754b",
        roughness: 0.42,
        metalness: royal ? 0.12 : 0.02,
      }),
    );
    base.position.y = -0.02;
    root.add(base);
    const candle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.105, 0.06, 20),
      new THREE.MeshStandardMaterial({
        color: royal ? "#e8b94e" : "#f3d68b",
        roughness: 0.36,
        metalness: 0.18,
      }),
    );
    candle.position.y = 0.12;
    root.add(candle);

    if (royal) {
      const circlet = new THREE.Mesh(
        new THREE.TorusGeometry(0.54, 0.035, 8, 56),
        new THREE.MeshStandardMaterial({
          color: "#ffd15a",
          metalness: 0.72,
          roughness: 0.24,
          emissive: "#8a4711",
          emissiveIntensity: 0.25,
        }),
      );
      circlet.rotation.x = Math.PI / 2;
      circlet.position.y = 0.035;
      root.add(circlet);
      const crownGeometry = new THREE.ConeGeometry(0.045, 0.24, 10);
      const crownMaterial = new THREE.MeshStandardMaterial({
        color: "#ffda72",
        metalness: 0.5,
        roughness: 0.24,
        emissive: "#a94c0d",
        emissiveIntensity: 0.28,
      });
      for (let index = 0; index < 5; index++) {
        const angle = (index / 5) * Math.PI * 2;
        const point = new THREE.Mesh(crownGeometry, crownMaterial);
        point.position.set(Math.cos(angle) * 0.13, 0.3, Math.sin(angle) * 0.13);
        root.add(point);
      }
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.25, 0);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    controls.autoRotateSpeed = 1.05;
    controls.minPolarAngle = 0.55;
    controls.maxPolarAngle = 2.3;
    controls.update();

    const loader = new GLTFLoader();
    loader.load("/models/pink-lotus.glb?v=3", (gltf) => {
      if (disposed) {
        gltf.scene.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.geometry.dispose();
          (Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material]
          ).forEach((material) => material.dispose());
        });
        return;
      }

      const lotus = gltf.scene;
      lotus.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(lotus);
      const size = bounds.getSize(new THREE.Vector3());
      const scale = 0.8 / Math.max(size.x, size.z, 0.001);
      lotus.scale.setScalar(scale);
      lotus.position.set(
        -((bounds.min.x + bounds.max.x) * 0.5) * scale,
        -bounds.min.y * scale + 0.04,
        -((bounds.min.z + bounds.max.z) * 0.5) * scale,
      );
      if (royal) {
        lotus.scale.multiplyScalar(1.12);
        lotus.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (!mesh.isMesh) return;
          const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];
          const tintedMaterials = materials.map((source) => {
            const material = source.clone();
            if (material instanceof THREE.MeshStandardMaterial) {
              material.color.lerp(new THREE.Color("#ffc247"), 0.72);
              material.emissive.set("#b95208");
              material.emissiveIntensity = 0.24;
              material.metalness = Math.max(material.metalness, 0.26);
              material.roughness = Math.min(material.roughness, 0.38);
            }
            return material;
          });
          mesh.material = Array.isArray(mesh.material)
            ? tintedMaterials
            : tintedMaterials[0];
        });
      }
      root.add(lotus);
    });

    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      disposeThreeScene(scene);
      renderer.dispose();
      if (host.contains(renderer.domElement))
        host.removeChild(renderer.domElement);
    };
  }, [royal]);

  return (
    <div
      ref={hostRef}
      className="h-32 w-full touch-pan-y"
      aria-label={
        royal
          ? "Xem trước hoa đăng hoàng gia 3D, kéo để xoay"
          : "Xem trước hoa đăng an yên 3D, kéo để xoay"
      }
    />
  );
}

interface SouthernRiverSceneProps {
  initialWishes?: ReleasedLanternWish[];
  currentUserEmail?: string;
  onWishReleased?: (wish: ReleasedLanternWish) => void;
}

// Tạo Procedural Normal Map cho dòng sông trôi êm ả
function createRiverNormalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.createImageData(512, 512);
  const data = imgData.data;

  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const idx = (y * 512 + x) * 4;
      // Tỉ lệ sóng sông lăn tăn thuôn dài theo chiều dòng chảy (trục v)
      const u = (x / 512) * Math.PI * 8;
      const v = (y / 512) * Math.PI * 2;

      // Long, low-contrast wave bands run with the river instead of forming circular swirls.
      const dx =
        Math.cos(u + v) * 0.46 +
        Math.sin(u * 2 - v) * 0.24 +
        Math.cos(u * 3 + v * 2) * 0.14 +
        Math.sin(u * 5 - v * 3) * 0.08 +
        Math.cos(u * 7 + v * 4) * 0.05;
      const dy =
        Math.sin(u + v) * 0.28 +
        Math.cos(u * 2 - v) * 0.18 +
        Math.sin(u * 4 + v * 3) * 0.08 +
        Math.sin(u * 4 - v * 3) * 0.04;

      let nx = -dx * 0.21;
      let ny = -dy * 0.21;
      let nz = 1.0;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= len;
      ny /= len;
      nz /= len;

      data[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
      data[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
      data[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function SouthernRiverScene({
  initialWishes = [],
  currentUserEmail,
  onWishReleased,
}: SouthernRiverSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [sessionWishes, setSessionWishes] = useState<string[]>([]);
  const [customWish, setCustomWish] = useState("");
  const [showInputModal, setShowInputModal] = useState(false);
  const [showLanternPurchase, setShowLanternPurchase] = useState(false);
  const [royalLanternStock, setRoyalLanternStock] = useState(() =>
    isDemoMode() ? getDemoRoyalLanternStock() : 0,
  );

  const [lanternStyle, setLanternStyle] = useState<"standard" | "royal">(
    "standard",
  );

  const [usingRoyal, setUsingRoyal] = useState(false);
  const [royalError, setRoyalError] = useState("");

  const royalLockRef = useRef(false);
  const aliveRef = useRef(false);

  useEffect(() => {
    aliveRef.current = true;

    return () => {
      aliveRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isDemoMode()) return;
    const refreshDemoStock = () =>
      setRoyalLanternStock(getDemoRoyalLanternStock());
    window.addEventListener("tltl-demo-inventory-change", refreshDemoStock);
    return () =>
      window.removeEventListener(
        "tltl-demo-inventory-change",
        refreshDemoStock,
      );
  }, []);

  const releaseLanternRef = useRef<
    | ((
        message: string,
        royal?: boolean,
        focusCamera?: boolean,
        spawnX?: number,
        spawnZ?: number,
      ) => void)
    | null
  >(null);
  const resetSceneRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !host.clientWidth || !host.clientHeight) return;
    resetLanternSpawnLayout();
    let disposed = false;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      setError("Thiết bị chưa hỗ trợ WebGL.");
      return;
    }

    setError("");

    // Water reflections need a second render pass, so cap high-DPI rendering
    // before the pixel cost gets too high on laptops and mobile devices.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    host.appendChild(canvas);

    // Không gian đêm Cửu Long huyền ảo
    const scene = new THREE.Scene();
    const skyCanvas = document.createElement("canvas");
    skyCanvas.width = 512;
    skyCanvas.height = 256;
    const skyContext = skyCanvas.getContext("2d")!;
    const skyGradient = skyContext.createLinearGradient(
      0,
      0,
      0,
      skyCanvas.height,
    );
    skyGradient.addColorStop(0, "#10253d");
    skyGradient.addColorStop(0.28, "#213b56");
    skyGradient.addColorStop(0.43, "#172f49");
    skyGradient.addColorStop(0.47, "#28465e");
    skyGradient.addColorStop(0.5, "#526b7a");
    skyGradient.addColorStop(0.53, "#9a8278");
    skyGradient.addColorStop(0.55, "#d39a77");
    skyGradient.addColorStop(0.57, "#a76f66");
    skyGradient.addColorStop(0.62, "#607b81");
    skyGradient.addColorStop(0.82, "#365768");
    skyGradient.addColorStop(1, "#1b3449");
    skyContext.fillStyle = skyGradient;
    skyContext.fillRect(0, 0, skyCanvas.width, skyCanvas.height);
    // Soft cloud bands break up the flat sunset without overpowering the river scene.
    skyContext.save();
    skyContext.filter = "blur(8px)";
    skyContext.fillStyle = "rgba(243, 186, 145, 0.15)";
    skyContext.beginPath();
    skyContext.moveTo(0, 126);
    skyContext.quadraticCurveTo(74, 119, 154, 128);
    skyContext.quadraticCurveTo(202, 133, 255, 125);
    skyContext.quadraticCurveTo(340, 119, 414, 128);
    skyContext.quadraticCurveTo(468, 133, 512, 124);
    skyContext.lineTo(512, 137);
    skyContext.quadraticCurveTo(435, 142, 365, 136);
    skyContext.quadraticCurveTo(286, 129, 211, 139);
    skyContext.quadraticCurveTo(116, 146, 0, 137);
    skyContext.closePath();
    skyContext.fill();
    skyContext.restore();
    const skyTexture = new THREE.CanvasTexture(skyCanvas);
    skyTexture.colorSpace = THREE.SRGBColorSpace;
    skyTexture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = skyTexture;
    scene.environment = skyTexture;
    scene.environmentIntensity = 0.42;
    scene.fog = new THREE.FogExp2("#89969b", 0.0046);

    // Camera
    const riverHorizontalFov = 52;
    const verticalFovForAspect = (aspect: number) =>
      THREE.MathUtils.radToDeg(
        2 *
          Math.atan(
            Math.tan(THREE.MathUtils.degToRad(riverHorizontalFov / 2)) / aspect,
          ),
      );
    const cameraAspect = host.clientWidth / host.clientHeight;
    const camera = new THREE.PerspectiveCamera(
      verticalFovForAspect(cameraAspect),
      cameraAspect,
      0.1,
      1000,
    );
    // Bring the waterline closer to eye level and frame the usual lantern spawn area.
    camera.position.set(0, 3.2, 34.5);

    // Controls
    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.minDistance = 8;
    controls.maxDistance = 58;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minPolarAngle = 0.2;
    controls.enableDamping = true;
    controls.autoRotate = false;

    controls.target.set(0, 0.6, 8.4);
    controls.update();
    controls.saveState();

    let sceneElapsedTime = 0;
    let royalCameraReveal: {
      startTime: number;
      originalPosition: THREE.Vector3;
      originalTarget: THREE.Vector3;
      focusPosition: THREE.Vector3;
      focusTarget: THREE.Vector3;
    } | null = null;

    resetSceneRef.current = () => {
      controls.reset();
    };

    // ==========================================
    // 1. ÁNH TRĂNG RẰM & BẦU TRỜI ĐÊM HUYỀN ẢO
    // ==========================================
    const ambientLight = new THREE.HemisphereLight("#d7e3df", "#6d604b", 1.42);
    scene.add(ambientLight);

    // Ánh trăng chiếu rọi từ trên cao
    const moonLight = new THREE.DirectionalLight("#ffd0a0", 1.65);
    moonLight.position.set(-10, 11, -18);
    scene.add(moonLight);

    // Vầng trăng và quầng sáng dịu trên mặt sông.
    const moonTextureCanvas = document.createElement("canvas");
    moonTextureCanvas.width = 256;
    moonTextureCanvas.height = 128;
    const moonContext = moonTextureCanvas.getContext("2d");
    if (moonContext) {
      const lunarGradient = moonContext.createRadialGradient(128, 64, 8, 128, 64, 132);
      lunarGradient.addColorStop(0, "#fff7dc");
      lunarGradient.addColorStop(1, "#d4c9ac");
      moonContext.fillStyle = lunarGradient;
      moonContext.fillRect(0, 0, 256, 128);
      [
        [55, 40, 10],
        [91, 78, 7],
        [142, 42, 13],
        [184, 71, 8],
        [224, 48, 11],
      ].forEach(([x, y, radius], index) => {
        const crater = moonContext.createRadialGradient(
          x - radius * 0.25,
          y - radius * 0.25,
          radius * 0.1,
          x,
          y,
          radius,
        );
        crater.addColorStop(0, `rgba(130, 126, 111, ${0.11 + index * 0.012})`);
        crater.addColorStop(1, "rgba(130, 126, 111, 0)");
        moonContext.fillStyle = crater;
        moonContext.beginPath();
        moonContext.arc(x, y, radius, 0, Math.PI * 2);
        moonContext.fill();
      });
    }
    const moonTexture = new THREE.CanvasTexture(moonTextureCanvas);
    moonTexture.colorSpace = THREE.SRGBColorSpace;
    const moonGeo = new THREE.SphereGeometry(1.05, 32, 32);
    const moonMat = new THREE.MeshBasicMaterial({
      map: moonTexture,
      color: "#fff0c7",
    });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(-7, 5, -62);
    moon.scale.setScalar(1.25);
    scene.add(moon);

    const moonHaloCanvas = document.createElement("canvas");
    moonHaloCanvas.width = 128;
    moonHaloCanvas.height = 128;
    const moonHaloContext = moonHaloCanvas.getContext("2d");
    if (moonHaloContext) {
      const haloGradient = moonHaloContext.createRadialGradient(64, 64, 5, 64, 64, 64);
      haloGradient.addColorStop(0, "rgba(255, 224, 164, 0.3)");
      haloGradient.addColorStop(0.3, "rgba(255, 224, 164, 0.12)");
      haloGradient.addColorStop(1, "rgba(255, 224, 164, 0)");
      moonHaloContext.fillStyle = haloGradient;
      moonHaloContext.fillRect(0, 0, 128, 128);
    }
    const moonHaloTexture = new THREE.CanvasTexture(moonHaloCanvas);
    const moonHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: moonHaloTexture,
        color: "#ffe8bd",
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    moonHalo.position
      .copy(moon.position)
      .add(
        new THREE.Vector3()
          .subVectors(camera.position, moon.position)
          .normalize()
          .multiplyScalar(1.4),
      );
    moonHalo.scale.set(8, 8, 1);
    scene.add(moonHalo);

    const starCount = 90;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 60;
      starPositions[i * 3 + 1] = 6 + Math.random() * 25;
      starPositions[i * 3 + 2] = -10 - Math.random() * 35;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(starPositions, 3),
    );
    scene.add(
      new THREE.Points(
        starGeometry,
        new THREE.PointsMaterial({
          color: "#e0f2fe",
          size: 0.1,
          transparent: true,
          opacity: 0.45,
        }),
      ),
    );

    // ==========================================
    // 2. DÒNG NƯỚC SÔNG CỬU LONG QUANG HỌC (WATER SHADER)
    // ==========================================
    const riverWidth = 26;
    const shorelineBendAt = (z: number, side: number) =>
      Math.sin(z * 0.022 + side * 0.9) * 3.3 +
      Math.sin(z * 0.061 - side * 1.7) * 1.05 +
      Math.sin(z * 0.14 + side * 0.4) * 0.22 +
      Math.sin(z * 0.017 + side * 2.2) * 1.15 +
      Math.sin(z * 0.043 - side * 1.3) * 0.52 +
      Math.sin(z * 0.39 + side * 1.8) * 0.16 +
      Math.sin(z * 0.83 - side * 2.4) * 0.075 +
      Math.exp(-Math.pow((z + 108 + side * 12) / 21, 2)) * 3.6 -
      Math.exp(-Math.pow((z + 62 - side * 19) / 16, 2)) * 2.7 +
      Math.exp(-Math.pow((z + 16 + side * 13) / 13, 2)) * 2.8 -
      Math.exp(-Math.pow((z - 16 - side * 9) / 22, 2)) * 2.15;
    const bankWidthVariationAt = (z: number, side: number) =>
      Math.sin(z * 0.095 + side * 2.1) * 0.5 +
      Math.sin(z * 0.21 - side * 0.7) * 0.16 +
      Math.sin(z * 0.047 + side) * 0.52;
    const waterlineHalfWidthAt = (z: number, side: number) =>
      riverWidth / 2 -
      0.55 +
      shorelineBendAt(z, side) * 0.938 +
      bankWidthVariationAt(z, side) * 0.261 +
      0.24;
    const waterGeometry = new THREE.PlaneGeometry(30, 420, 1, 420);
    const waterPositions = waterGeometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    for (let vertex = 0; vertex < waterPositions.count; vertex++) {
      const localX = waterPositions.getX(vertex);
      const worldZ = -waterPositions.getY(vertex);
      const side = localX < 0 ? -1 : 1;
      waterPositions.setX(vertex, side * waterlineHalfWidthAt(worldZ, side));
    }
    waterPositions.needsUpdate = true;
    waterGeometry.computeVertexNormals();
    const riverNormals = createRiverNormalTexture();

    const sunDir = new THREE.Vector3(-10, 5.5, -18).normalize();

    const water = new Water(waterGeometry, {
    textureWidth: 320,
    textureHeight: 320,
      waterNormals: riverNormals,
      sunDirection: sunDir,
      sunColor: 0xd8c4a4,
      waterColor: 0x65898e,
      distortionScale: 1.9,
      fog: scene.fog !== undefined,
    });
    water.material.fragmentShader = water.material.fragmentShader
      .replace(
        "vec2 uv0 = ( uv / 103.0 ) + vec2(time / 17.0, time / 29.0);",
        "vec2 uv0 = ( uv / vec2( 82.0, 230.0 ) ) + vec2(time / 17.0, time / 29.0);",
      )
      .replace(
        "vec2 uv1 = uv / 107.0-vec2( time / -19.0, time / 31.0 );",
        "vec2 uv1 = uv / vec2( 126.0, 315.0 )-vec2( time / -19.0, time / 31.0 );",
      )
      .replace(
        "vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( time / 101.0, time / 97.0 );",
        "vec2 uv2 = uv / vec2( 6400.0, 13200.0 ) + vec2( time / 101.0, time / 97.0 );",
      )
      .replace(
        "vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( time / 109.0, time / -113.0 );",
        "vec2 uv3 = uv / vec2( 1480.0, 3900.0 ) - vec2( time / 109.0, time / -113.0 );",
      )
      .replace(
        "vec3 reflectionSample = vec3( texture2D( mirrorSampler, mirrorCoord.xy / mirrorCoord.w + distortion ) );",
        [
          "vec2 reflectionUv = mirrorCoord.xy / mirrorCoord.w + distortion;",
          "vec3 reflectionSample = texture2D( mirrorSampler, reflectionUv ).rgb * 0.82",
          "+ texture2D( mirrorSampler, reflectionUv + vec2( 0.0032, 0.0014 ) ).rgb * 0.09",
          "+ texture2D( mirrorSampler, reflectionUv + vec2( -0.0032, -0.0014 ) ).rgb * 0.09;",
        ].join("\n"),
      );
    water.material.fragmentShader = water.material.fragmentShader
      .replace(
        "float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );",
        "float reflectance = min( rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 ), 0.34 );",
      )
      .replace(
        "vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );",
        [
          "float nearRippleAmount = smoothstep( -85.0, -8.0, worldPosition.z );",
          "float nearRippleScale = 1.5 + nearRippleAmount * 0.65;",
          "vec3 surfaceNormal = normalize( noise.xzy * vec3( nearRippleScale, 1.0, nearRippleScale ) );",
        ].join("\n"),
      )
      .replace(
        "sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );",
        "sunLight( surfaceNormal, eyeDirection, 88.0, 1.6, 0.5, diffuseLight, specularLight );",
      );
    water.material.needsUpdate = true;
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0;
    scene.add(water);

    const reflectionCanvas = document.createElement("canvas");
    reflectionCanvas.width = 256;
    reflectionCanvas.height = 96;
    const reflectionContext = reflectionCanvas.getContext("2d")!;
    const reflectionGradient = reflectionContext.createRadialGradient(
      128,
      48,
      3,
      128,
      48,
      118,
    );
    reflectionGradient.addColorStop(0, "rgba(255, 230, 165, 0.72)");
    reflectionGradient.addColorStop(0.2, "rgba(255, 176, 84, 0.38)");
    reflectionGradient.addColorStop(0.62, "rgba(255, 145, 62, 0.12)");
    reflectionGradient.addColorStop(1, "rgba(255, 145, 62, 0)");
    reflectionContext.fillStyle = reflectionGradient;
    reflectionContext.fillRect(0, 0, 256, 96);
    const reflectionTexture = new THREE.CanvasTexture(reflectionCanvas);
    reflectionTexture.colorSpace = THREE.SRGBColorSpace;

    const lanternReflectionCanvas = document.createElement("canvas");
    lanternReflectionCanvas.width = 96;
    lanternReflectionCanvas.height = 256;
    const lanternReflectionContext = lanternReflectionCanvas.getContext("2d")!;
    const lanternReflectionGradient =
      lanternReflectionContext.createRadialGradient(48, 128, 2, 48, 128, 124);
    lanternReflectionGradient.addColorStop(0, "rgba(255, 226, 162, 0.58)");
    lanternReflectionGradient.addColorStop(0.22, "rgba(255, 190, 105, 0.3)");
    lanternReflectionGradient.addColorStop(0.62, "rgba(244, 160, 82, 0.08)");
    lanternReflectionGradient.addColorStop(1, "rgba(244, 160, 82, 0)");
    lanternReflectionContext.fillStyle = lanternReflectionGradient;
    lanternReflectionContext.fillRect(0, 0, 96, 256);
    const lanternReflectionTexture = new THREE.CanvasTexture(
      lanternReflectionCanvas,
    );
    lanternReflectionTexture.colorSpace = THREE.SRGBColorSpace;

    // Xuồng ba lá gỗ thả neo sát bờ, thân mở lòng và nằm ngang mặt nước.
    const sampanGroup = new THREE.Group();
    const lampGroup = new THREE.Group();
    lampGroup.visible = false;
    const lanternGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.11, 0.2, 16),
      new THREE.MeshStandardMaterial({
        color: "#ffc96d",
        emissive: "#d87820",
        emissiveIntensity: 0.8,
        roughness: 0.35,
      }),
    );
    lanternGlass.position.y = 0.24;
    lampGroup.add(lanternGlass);
    const lampCap = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.09, 16),
      new THREE.MeshStandardMaterial({
        color: "#b88642",
        metalness: 0.45,
        roughness: 0.42,
      }),
    );
    lampCap.position.y = 0.385;
    lampGroup.add(lampCap);
    const lampFlame = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 10, 8),
      new THREE.MeshBasicMaterial({ color: "#fff0b0" }),
    );
    lampFlame.scale.y = 1.7;
    lampFlame.position.y = 0.25;
    lampGroup.add(lampFlame);
    lampGroup.position.set(0, 0, 0);
    sampanGroup.add(lampGroup);
    const sampanLight = new THREE.PointLight("#ffad57", 18, 3.5, 2);
    sampanLight.visible = false;
    sampanLight.position.set(0, 0.5, 0);
    sampanGroup.add(sampanLight);
    // Keep the sampan clearly larger than a single floating lantern in the wide view.
    sampanGroup.scale.setScalar(1.5);
    sampanGroup.position.set(4.2, 0, -1.5);
    sampanGroup.rotation.y = -0.12;
    scene.add(sampanGroup);
    let sceneSetupFinished = false;
    let boatAssetSettled = false;
    let lotusAssetSettled = false;
    let palmAssetSettled = false;
    let foliageAssetsSettled = false;
    let sceneCompileStarted = false;
    const boatReflectionRef: { current: THREE.Mesh | null } = { current: null };
    const updateSceneReady = () => {
      if (
        sceneSetupFinished &&
        boatAssetSettled &&
        lotusAssetSettled &&
        palmAssetSettled &&
        foliageAssetsSettled
      ) {
        if (sceneCompileStarted) return;
        sceneCompileStarted = true;
        // Compile the final asset set behind the loading cover to avoid a
        // partially loaded scene and the shader-compilation hitch on reveal.
        void renderer
          .compileAsync(scene, camera)
          .catch(() => undefined)
          .then(() => {
            if (!disposed) setReady(true);
          });
      }
    };
    const boatLoader = new GLTFLoader();
    boatLoader.load(
      "/models/mekong-rowboat.glb?v=2",
      (gltf) => {
        if (disposed) return;

        const boatModel = gltf.scene;
        boatModel.traverse((object) => {
          if (
            object instanceof THREE.Mesh &&
            /rowboat_oar/i.test(object.name)
          ) {
            object.visible = false;
          }
        });
        boatModel.updateMatrixWorld(true);
        let bounds = new THREE.Box3().setFromObject(boatModel);
        const rawSize = bounds.getSize(new THREE.Vector3());
        if (rawSize.z > rawSize.x) boatModel.rotation.y = Math.PI / 2;
        boatModel.updateMatrixWorld(true);
        bounds = new THREE.Box3().setFromObject(boatModel);
        const size = bounds.getSize(new THREE.Vector3());
        const modelScale = 5.45 / Math.max(size.x, size.z, 0.001);
        boatModel.scale.setScalar(modelScale);
        boatModel.position.set(
          -((bounds.min.x + bounds.max.x) * 0.5) * modelScale,
          -bounds.min.y * modelScale - 0.02,
          -((bounds.min.z + bounds.max.z) * 0.5) * modelScale,
        );
        boatModel.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        });
        sampanGroup.add(boatModel);
        lampGroup.visible = true;
        sampanLight.visible = true;
        if (boatReflectionRef.current) boatReflectionRef.current.visible = true;
        boatAssetSettled = true;
        updateSceneReady();
      },
      undefined,
      () => {
        setError("ChÆ°a táº£i Ä‘Æ°á»£c mÃ´ hÃ¬nh thuyá»n. HÃ£y táº£i láº¡i trang Ä‘á»ƒ thá»­ láº¡i.");
        boatAssetSettled = true;
        updateSceneReady();
      },
    );
    const boatReflectionMaterial = new THREE.MeshBasicMaterial({
      map: reflectionTexture,
      color: "#ffbb70",
      transparent: true,
      opacity: 0.065,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const boatReflection = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 0.52),
      boatReflectionMaterial,
    );
    boatReflection.visible = false;
    boatReflectionRef.current = boatReflection;
    boatReflection.rotation.x = -Math.PI / 2;
    boatReflection.rotation.y = sampanGroup.rotation.y;
    boatReflection.position.set(
      sampanGroup.position.x,
      0.014,
      sampanGroup.position.z,
    );
    scene.add(boatReflection);

    // Bờ đất phù sa và thảm cây thấp dọc mép sông.
    const palmPlacements: Array<{
      x: number;
      z: number;
      y: number;
      height: number;
      rotation: number;
    }> = [];
    const bankTextureCanvas = document.createElement("canvas");
    bankTextureCanvas.width = 256;
    bankTextureCanvas.height = 256;
    const bankTextureContext = bankTextureCanvas.getContext("2d");
    if (bankTextureContext) {
      const bankPixels = bankTextureContext.createImageData(256, 256);
      for (let y = 0; y < 256; y++) {
        for (let x = 0; x < 256; x++) {
          const broadNoise =
            Math.sin(x * 0.052 + Math.sin(y * 0.031) * 2.4) * 0.5 +
            Math.sin(y * 0.046 + Math.sin(x * 0.027) * 1.8) * 0.3;
          const fineNoise = (Math.random() - 0.5) * 20;
          const value = broadNoise * 13 + fineNoise;
          const pixel = (y * 256 + x) * 4;
          bankPixels.data[pixel] = 124 + value;
          bankPixels.data[pixel + 1] = 116 + value * 0.92;
          bankPixels.data[pixel + 2] = 96 + value * 0.7;
          bankPixels.data[pixel + 3] = 255;
        }
      }
      bankTextureContext.putImageData(bankPixels, 0, 0);
      for (let streak = 0; streak < 34; streak++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        bankTextureContext.strokeStyle =
          streak % 3 === 0
            ? "rgba(57, 69, 48, 0.13)"
            : "rgba(153, 140, 105, 0.09)";
        bankTextureContext.lineWidth = 1 + Math.random() * 3;
        bankTextureContext.beginPath();
        bankTextureContext.moveTo(x, y);
        bankTextureContext.quadraticCurveTo(
          x + (Math.random() - 0.5) * 24,
          y + 8 + Math.random() * 20,
          x + (Math.random() - 0.5) * 34,
          y + 18 + Math.random() * 36,
        );
        bankTextureContext.stroke();
      }
    }
    const bankTexture = new THREE.CanvasTexture(bankTextureCanvas);
    bankTexture.colorSpace = THREE.SRGBColorSpace;
    bankTexture.wrapS = THREE.RepeatWrapping;
    bankTexture.wrapT = THREE.RepeatWrapping;
    bankTexture.repeat.set(1.2, 1);
    bankTexture.anisotropy = 4;
    [-1, 1].forEach((side) => {
      // Uneven bank profile: a submerged toe, a gentle muddy slope, then
      // a low shore. The mesh has no end caps, so it cannot cut across the river.
      const bankStartZ = -250;
      const bankLength = 380;
      const bankRows = 420;
      const bankSections = [
        { offset: -0.8, height: -0.48 },
        { offset: -0.5, height: -0.31 },
        { offset: -0.22, height: -0.12 },
        { offset: 0.08, height: -0.035 },
        { offset: 0.38, height: 0.015 },
        { offset: 0.78, height: 0.065 },
        { offset: 1.22, height: 0.13 },
        { offset: 1.75, height: 0.2 },
        { offset: 2.35, height: 0.28 },
        { offset: 3.05, height: 0.36 },
        { offset: 3.8, height: 0.43 },
        { offset: 4.65, height: 0.49 },
        { offset: 5.55, height: 0.54 },
        { offset: 6.5, height: 0.57 },
        { offset: 7.5, height: 0.55 },
      ];
      const bankPositions = new Float32Array(
        (bankRows + 1) * bankSections.length * 3,
      );
      const bankColors = new Float32Array(
        (bankRows + 1) * bankSections.length * 3,
      );
      const bankUvs = new Float32Array(
        (bankRows + 1) * bankSections.length * 2,
      );
      const bankIndices: number[] = [];
      for (let row = 0; row <= bankRows; row++) {
        const z = bankStartZ + (row / bankRows) * bankLength;
        const shorelineBend = shorelineBendAt(z, side);
        const bankWidthVariation = bankWidthVariationAt(z, side);
        bankSections.forEach((section, column) => {
          const vertex = (row * bankSections.length + column) * 3;
          const sectionWeight = column / (bankSections.length - 1);
          const innerEdgeWander = shorelineBend * (column < 2 ? 0.64 : 1);
          bankPositions[vertex] =
            side *
            (riverWidth / 2 -
              0.55 +
              innerEdgeWander +
              bankWidthVariation * sectionWeight +
              section.offset);
          const highBankUndulation =
            column >= 4
              ? Math.sin(z * 0.041 + side * 1.2) * 0.44 +
                Math.sin(z * 0.11 + side) * 0.22
              : 0;
          const groundRipple =
            Math.sin(z * 0.11 + column * 0.7 + side) * 0.04 +
            Math.sin(z * 0.047 + column * 1.9 + side * 2) *
              (column >= 3 ? 0.11 : 0.03) +
            Math.sin(z * 0.19 - column * 0.8 + side) * 0.018 +
            Math.sin(z * 0.29 + column * 1.4 - side * 1.3) * 0.012;
          bankPositions[vertex + 1] =
            section.height + highBankUndulation + groundRipple +
            Math.sin(z * 0.23 + section.offset * 3.7 + side * 1.6) *
              (column >= 4 ? 0.055 : 0.024);
          bankPositions[vertex + 2] = z;
          const mottling =
            0.86 +
            Math.sin(z * 0.21 + column * 1.7 + side) * 0.07 +
            Math.sin(z * 0.073 - side) * 0.07 +
            Math.sin(z * 0.51 + column * 0.9) * 0.025 +
            Math.sin(z * 0.037 + column * 2.6 + side * 3) * 0.035 +
            Math.sin(z * 0.14 + column * 2.9 + side * 1.4) * 0.04 +
            Math.cos(z * 0.31 - column * 1.8 + side * 0.7) * 0.018 +
            Math.sin(z * 0.083 + section.offset * 0.49 + side) * 0.045 +
            Math.cos(z * 0.19 - section.offset * 0.87 + side * 1.7) * 0.028 +
            Math.sin(z * 0.37 + section.offset * 1.31) * 0.014 +
            Math.sin(z * 0.052 + section.offset * 0.16 + side) * 0.032 +
            Math.cos(z * 0.031 - section.offset * 0.21) * 0.022;
          const upperBankBlend = column / (bankSections.length - 1);
          const dampShore = THREE.MathUtils.smoothstep(
            section.offset,
            -0.5,
            1.6,
          );
          const dryGrassBlend = THREE.MathUtils.smoothstep(
            section.offset,
            3.5,
            7.5,
          );
          bankColors[vertex] =
            mottling * (0.72 + dampShore * 0.14 + dryGrassBlend * 0.08);
          bankColors[vertex + 1] =
            mottling * (0.7 + dampShore * 0.18 + dryGrassBlend * 0.15);
          bankColors[vertex + 2] =
            mottling * (0.56 + dampShore * 0.22 + dryGrassBlend * 0.16);
          const uv = (row * bankSections.length + column) * 2;
          bankUvs[uv] = (section.offset + 0.8) / 8.3;
          bankUvs[uv + 1] = (row / bankRows) * 3.5;
        });
      }
      for (let row = 0; row < bankRows; row++) {
        for (let column = 0; column < bankSections.length - 1; column++) {
          const a = row * bankSections.length + column;
          const b = a + 1;
          const c = a + bankSections.length;
          const d = c + 1;
          if (side > 0) bankIndices.push(a, c, b, b, c, d);
          else bankIndices.push(a, b, c, b, d, c);
        }
      }
      const bankGeo = new THREE.BufferGeometry();
      bankGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(bankPositions, 3),
      );
      bankGeo.setAttribute("color", new THREE.BufferAttribute(bankColors, 3));
      bankGeo.setAttribute("uv", new THREE.BufferAttribute(bankUvs, 2));
      bankGeo.setIndex(bankIndices);
      bankGeo.computeVertexNormals();
      const bank = new THREE.Mesh(
        bankGeo,
        new THREE.MeshStandardMaterial({
          color: "#ffffff",
          map: bankTexture,
          vertexColors: true,
          roughness: 0.98,
          side: THREE.DoubleSide,
        }),
      );
      scene.add(bank);

      // Place complete palm pairs as sparse landmarks instead of generating
      // repeated flat leaf shapes for every tree.
      const palmClusters =
        side < 0
          ? [-214, -186, -157, -128, -99, -70, -41, -12]
          : [-200, -171, -142, -113, -84, -55, -26, 2];
      palmClusters.forEach((clusterZ, index) => {
        const z = clusterZ + (Math.random() - 0.5) * 15;
        const bankOffset = 2.5 + Math.random() * 3.0;
        const x =
          side *
          (riverWidth / 2 -
            0.55 +
            shorelineBendAt(z, side) +
            bankWidthVariationAt(z, side) * 0.35 +
            bankOffset);
        const targetHeight =
          z > -58
            ? 5.8 + Math.random() * 0.65
            : z > -125
              ? 5.0 + Math.random() * 0.6
              : 4.4 + Math.random() * 0.5;
        palmPlacements.push({
          x,
          y: 0.22 + Math.min(bankOffset * 0.045, 0.22),
          z,
          height: targetHeight,
          rotation: Math.random() * Math.PI * 2 + index * 0.18,
        });
      });
    });

    const palmLoader = new GLTFLoader();
    palmLoader.load(
      "/assets/river/coconut-palm-twin.glb?v=1",
      (gltf) => {
        if (!disposed) {
          const prototype = gltf.scene;
          prototype.updateMatrixWorld(true);
          const sourceMeshes: THREE.Mesh[] = [];
          prototype.traverse((object) => {
            if (object instanceof THREE.Mesh) sourceMeshes.push(object);
          });
          const sourceMesh = sourceMeshes[0];
          if (sourceMesh && palmPlacements.length > 0) {
            const bounds = new THREE.Box3().setFromObject(prototype);
            const size = bounds.getSize(new THREE.Vector3());
            const center = bounds.getCenter(new THREE.Vector3());
            const pivot = new THREE.Matrix4().makeTranslation(
              -center.x,
              -bounds.min.y,
              -center.z,
            );
            const sourceWorld = sourceMesh.matrixWorld.clone();
            const brightenPalmMaterial = (source: THREE.Material) => {
              const material = source.clone();
              if (material instanceof THREE.MeshStandardMaterial) {
                material.color.set("#8fa96f");
                material.emissive.set("#52653b");
                material.emissiveIntensity = 0.18;
                material.roughness = 0.86;
                material.metalness = 0.02;
                material.needsUpdate = true;
              }
              return material;
            };
            const palmMaterial = Array.isArray(sourceMesh.material)
              ? sourceMesh.material.map(brightenPalmMaterial)
              : brightenPalmMaterial(sourceMesh.material);
            const instances = new THREE.InstancedMesh(
              sourceMesh.geometry,
              palmMaterial,
              palmPlacements.length,
            );
            const matrix = new THREE.Matrix4();
            const position = new THREE.Vector3();
            const rotation = new THREE.Quaternion();
            const scale = new THREE.Vector3();
            palmPlacements.forEach((placement, index) => {
              position.set(placement.x, placement.y, placement.z);
              rotation.setFromAxisAngle(
                new THREE.Vector3(0, 1, 0),
                placement.rotation,
              );
              const uniformScale = placement.height / Math.max(size.y, 0.001);
              scale.setScalar(uniformScale);
              matrix.compose(position, rotation, scale);
              matrix.multiply(pivot).multiply(sourceWorld);
              instances.setMatrixAt(index, matrix);
            });
            instances.instanceMatrix.needsUpdate = true;
            instances.computeBoundingSphere();
            scene.add(instances);
          }
        }
        palmAssetSettled = true;
        updateSceneReady();
      },
      undefined,
      (loadError) => {
        console.warn("[SouthernRiverScene] Coconut palm asset failed to load", loadError);
        palmAssetSettled = true;
        updateSceneReady();
      },
    );
    const grassLocations: Array<{
      side: number;
      z: number;
      offset: number;
      scale: number;
      rotation: number;
    }> = [];
    const reedLocations: typeof grassLocations = [];
    const reedMixers: THREE.AnimationMixer[] = [];
    [-1, 1].forEach((side) => {
      // Scatter small groups along the wet edge and the inner bank. Patches
      // are irregular so the shoreline does not read as a planted hedge.
      for (let patch = 0; patch < 20; patch++) {
        const centerZ = 7 - Math.random() * 224;
        const reedsInPatch = 1 + Math.floor(Math.random() * 2);
        for (let index = 0; index < reedsInPatch; index++) {
          reedLocations.push({
            side,
            z: centerZ + (Math.random() - 0.5) * 5,
            offset: 0.22 + Math.random() * 1.25,
            scale: 1.05 + Math.random() * 0.7,
            rotation: Math.random() * Math.PI * 2,
          });
        }
      }
      for (let patch = 0; patch < 50; patch++) {
        const centerZ = 8 - Math.random() * 225;
        const grassInPatch = 2 + Math.floor(Math.random() * 3);
        for (let index = 0; index < grassInPatch; index++) {
          const z = centerZ + (Math.random() - 0.5) * 6;
          const distance = z > -45 ? 2.1 : z > -105 ? 1.45 : 0.9;
          grassLocations.push({
            side,
            z,
            offset: 0.65 + Math.random() * 5.2,
            scale: distance * (0.82 + Math.random() * 0.38),
            rotation: Math.random() * Math.PI * 2,
          });
        }
      }
    });

    const placeBankFoliage = (
      gltf: { scene: THREE.Group; animations: THREE.AnimationClip[] },
      placements: typeof grassLocations,
    ) => {
      const prototype = gltf.scene;
      prototype.updateMatrixWorld(true);
      const prototypeMeshes: THREE.Mesh[] = [];
      prototype.traverse((object) => {
        if (object instanceof THREE.Mesh) prototypeMeshes.push(object);
      });

      const placementMatrix = new THREE.Matrix4();
      const placementPosition = new THREE.Vector3();
      const placementRotation = new THREE.Quaternion();
      const placementScale = new THREE.Vector3();
      const morphAnimated = prototypeMeshes.some((mesh) =>
        Object.values(mesh.geometry.morphAttributes).some(
          (targets) => targets.length > 0,
        ),
      );

      const setPlacementTransform = (placement: (typeof grassLocations)[number]) => {
        const shoreline =
          riverWidth / 2 -
          0.55 +
          shorelineBendAt(placement.z, placement.side) +
          bankWidthVariationAt(placement.z, placement.side) * 0.35;
        placementPosition.set(
          placement.side * (shoreline + placement.offset),
          0.08 +
            Math.min(placement.offset * 0.055, 0.34) +
            Math.sin(placement.z * 0.11 + placement.side) * 0.045,
          placement.z,
        );
        placementRotation.setFromEuler(
          new THREE.Euler(0, placement.rotation, 0),
        );
        placementScale.setScalar(placement.scale);
        placementMatrix.compose(
          placementPosition,
          placementRotation,
          placementScale,
        );
      };

      if (morphAnimated) {
        placements.forEach((placement) => {
          setPlacementTransform(placement);
          const root = prototype.clone(true);
          const plant = new THREE.Group();
          plant.position.copy(placementPosition);
          plant.quaternion.copy(placementRotation);
          plant.scale.copy(placementScale);
          plant.add(root);
          root.traverse((object) => {
            const mesh = object as THREE.Mesh;
            if (!mesh.isMesh) return;
            mesh.castShadow = false;
            mesh.receiveShadow = false;
          });
          scene.add(plant);

          const sway = gltf.animations[0];
          if (sway) {
            const mixer = new THREE.AnimationMixer(root);
            mixer.clipAction(sway).play();
            reedMixers.push(mixer);
          }
        });
        return;
      }

      prototypeMeshes.forEach((mesh) => {
        const instances = new THREE.InstancedMesh(
          mesh.geometry,
          mesh.material,
          placements.length,
        );
        placements.forEach((placement, index) => {
          setPlacementTransform(placement);
          instances.setMatrixAt(
            index,
            placementMatrix.clone().multiply(mesh.matrixWorld),
          );
        });
        instances.instanceMatrix.needsUpdate = true;
        instances.castShadow = false;
        instances.receiveShadow = false;
        scene.add(instances);
      });
    };

    let foliageLoadsRemaining = 2;
    const settleFoliageLoad = () => {
      foliageLoadsRemaining -= 1;
      if (foliageLoadsRemaining === 0) {
        foliageAssetsSettled = true;
        updateSceneReady();
      }
    };
    const vegetationLoader = new GLTFLoader();
    vegetationLoader.load(
      "/assets/river/grass-clump.glb?v=1",
      (gltf) => {
        if (!disposed) placeBankFoliage(gltf, grassLocations);
        settleFoliageLoad();
      },
      undefined,
      () => settleFoliageLoad(),
    );
    vegetationLoader.load(
      "/assets/river/reeds.glb?v=1",
      (gltf) => {
        if (!disposed) placeBankFoliage(gltf, reedLocations);
        settleFoliageLoad();
      },
      undefined,
      () => settleFoliageLoad(),
    );
    const waterHyacinthCount = 6;
    const leavesPerHyacinth = 6;
    const waterHyacinths: Array<{
      x: number;
      y: number;
      z: number;
      speed: number;
      side: number;
      phase: number;
    }> = [];
    const hyacinthLeafGeometry = new THREE.SphereGeometry(0.12, 8, 6);
    hyacinthLeafGeometry.scale(1, 0.2, 1.3);
    const hyacinthLeafMaterial = new THREE.MeshStandardMaterial({
      color: "#166534",
      roughness: 0.68,
    });
    const hyacinthLeaves = new THREE.InstancedMesh(
      hyacinthLeafGeometry,
      hyacinthLeafMaterial,
      waterHyacinthCount * leavesPerHyacinth,
    );
    hyacinthLeaves.frustumCulled = false;
    const hyacinthFlowerGeometry = new THREE.ConeGeometry(0.08, 0.22, 6);
    const hyacinthFlowerMaterial = new THREE.MeshStandardMaterial({
      color: "#b27bc9",
      roughness: 0.66,
    });
    const hyacinthFlowers = new THREE.InstancedMesh(
      hyacinthFlowerGeometry,
      hyacinthFlowerMaterial,
      waterHyacinthCount,
    );
    hyacinthFlowers.frustumCulled = false;
    const hyacinthDummy = new THREE.Object3D();
    for (let index = 0; index < waterHyacinthCount; index++) {
      const side = index % 2 === 0 ? -1 : 1;
      const item = {
        x:
          side < 0
            ? -(7.0 + Math.random() * 1.6)
            : 10.6 + Math.random() * 1.2,
        y: 0.02,
        z: -17 + Math.random() * 25,
        speed: 0.15 + Math.random() * 0.1,
        side,
        phase: Math.random() * Math.PI * 2,
      };
      waterHyacinths.push(item);
      for (let leafIndex = 0; leafIndex < leavesPerHyacinth; leafIndex++) {
        const angle = (leafIndex / leavesPerHyacinth) * Math.PI * 2;
        hyacinthDummy.position.set(
          item.x + Math.cos(angle) * 0.18,
          item.y + 0.03,
          item.z + Math.sin(angle) * 0.18,
        );
        hyacinthDummy.rotation.set(0, Math.PI / 2 - angle, 0);
        hyacinthDummy.updateMatrix();
        hyacinthLeaves.setMatrixAt(
          index * leavesPerHyacinth + leafIndex,
          hyacinthDummy.matrix,
        );
      }
      hyacinthDummy.position.set(item.x, item.y + 0.14, item.z);
      hyacinthDummy.rotation.set(0, 0, 0);
      hyacinthDummy.updateMatrix();
      hyacinthFlowers.setMatrixAt(index, hyacinthDummy.matrix);
    }
    hyacinthLeaves.instanceMatrix.needsUpdate = true;
    hyacinthFlowers.instanceMatrix.needsUpdate = true;
    scene.add(hyacinthLeaves, hyacinthFlowers);

    // ==========================================
    // 5. ĐOM ĐÓM LẬP LÒE TRÊN MẶT SÔNG
    // ==========================================
    const fireflyCount = 20;
    const fireflies: Array<{
      mesh: THREE.Mesh;
      baseX: number;
      baseY: number;
      baseZ: number;
      speed: number;
      phase: number;
    }> = [];

    const fireflyGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const fireflyMat = new THREE.MeshBasicMaterial({ color: "#bef264" });

    for (let i = 0; i < fireflyCount; i++) {
      const mesh = new THREE.Mesh(fireflyGeo, fireflyMat);
      mesh.scale.setScalar(0.65);
      const bx = (Math.random() - 0.5) * 8;
      const by = 0.4 + Math.random() * 1.8;
      const bz = (Math.random() - 0.5) * 20;
      mesh.position.set(bx, by, bz);
      scene.add(mesh);
      fireflies.push({
        mesh,
        baseX: bx,
        baseY: by,
        baseZ: bz,
        speed: 0.6 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // ==========================================
    // 6. DÒNG HOA ĐĂNG HOA SEN PHÁT SÁNG LUNG LINH
    // ==========================================
    const lanterns: FloatingLantern[] = [];
    const maxVisibleLanterns = 18;
    const maxLanternPointLights = 4;
    const retireLanternVisual = (lantern: FloatingLantern) => {
      scene.remove(lantern.group, lantern.reflection);
      lantern.ripples.forEach(({ mesh }) => {
        scene.remove(mesh);
        mesh.material.dispose();
      });
      lantern.reflection.geometry.dispose();
      lantern.reflection.material.dispose();

      const sharedLotus = lantern.group.getObjectByName("downloaded-lotus-model");
      const sharedLotusIds = new Set<string>();
      sharedLotus?.traverse((object) => sharedLotusIds.add(object.uuid));
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      const clonedLotusMaterials = new Set<THREE.Material>();
      lantern.group.traverse((object) => {
        const renderable = object as THREE.Mesh;
        if (sharedLotusIds.has(object.uuid)) {
          if (lantern.royal) {
            const lotusMaterials = Array.isArray(renderable.material)
              ? renderable.material
              : renderable.material
                ? [renderable.material]
                : [];
            lotusMaterials.forEach((material) =>
              clonedLotusMaterials.add(material),
            );
          }
          return;
        }
        if (renderable.geometry) geometries.add(renderable.geometry);
        const objectMaterials = Array.isArray(renderable.material)
          ? renderable.material
          : renderable.material
            ? [renderable.material]
            : [];
        objectMaterials.forEach((material) => materials.add(material));
      });
      materials.forEach((material) => {
        Object.values(material).forEach((value) => {
          if (
            value instanceof THREE.Texture &&
            value !== lanternReflectionTexture
          )
            value.dispose();
        });
        material.dispose();
      });
      clonedLotusMaterials.forEach((material) => material.dispose());
      geometries.forEach((geometry) => geometry.dispose());
    };
    let lotusTemplate: THREE.Group | null = null;
    const attachLotusModel = (mount: THREE.Group, royal = false) => {
      if (!lotusTemplate) return;
      const lotus = lotusTemplate.clone(true);
      lotus.visible = true;
      lotus.name = "downloaded-lotus-model";
      if (royal) {
        lotus.scale.multiplyScalar(1.15);
        lotus.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (!mesh.isMesh) return;
          const sourceMaterials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];
          const royalMaterials = sourceMaterials.map((source) => {
            const material = source.clone();
            if (material instanceof THREE.MeshStandardMaterial) {
              material.color.lerp(new THREE.Color("#ffc247"), 0.72);
              material.emissive.set("#b95208");
              material.emissiveIntensity = 0.24;
              material.metalness = Math.max(material.metalness, 0.26);
              material.roughness = Math.min(material.roughness, 0.38);
              material.needsUpdate = true;
            }
            return material;
          });
          mesh.material = Array.isArray(mesh.material)
            ? royalMaterials
            : royalMaterials[0];
        });

        const circlet = new THREE.Mesh(
          new THREE.TorusGeometry(0.55, 0.032, 8, 56),
          new THREE.MeshStandardMaterial({
            color: "#f4c75e",
            emissive: "#8a5a18",
            emissiveIntensity: 0.2,
            metalness: 0.72,
            roughness: 0.3,
          }),
        );
        circlet.name = "royal-lotus-gold-circlet";
        circlet.rotation.x = Math.PI / 2;
        circlet.position.y = 0.09;
        mount.add(circlet);

        const goldBeadGeometry = new THREE.SphereGeometry(0.038, 16, 12);
        const goldBeadMaterial = new THREE.MeshStandardMaterial({
          color: "#ffe18a",
          emissive: "#b36a18",
          emissiveIntensity: 0.35,
          metalness: 0.55,
          roughness: 0.24,
        });
        for (let index = 0; index < 8; index++) {
          const angle = (index / 8) * Math.PI * 2;
          const bead = new THREE.Mesh(goldBeadGeometry, goldBeadMaterial);
          bead.name = "royal-lotus-circlet-bead";
          bead.position.set(
            Math.cos(angle) * 0.55,
            0.09,
            Math.sin(angle) * 0.55,
          );
          mount.add(bead);
        }

        const goldPetalMaterial = new THREE.MeshPhysicalMaterial({
          color: "#ffd15a",
          emissive: "#c45a0b",
          emissiveIntensity: 0.24,
          metalness: 0.32,
          roughness: 0.26,
          clearcoat: 0.8,
          clearcoatRoughness: 0.18,
          side: THREE.DoubleSide,
        });
        const rubyPetalMaterial = new THREE.MeshPhysicalMaterial({
          color: "#a92e49",
          emissive: "#541027",
          emissiveIntensity: 0.18,
          roughness: 0.27,
          clearcoat: 0.85,
          clearcoatRoughness: 0.16,
          side: THREE.DoubleSide,
        });
        const crownPetalGeometry = new THREE.SphereGeometry(1, 20, 14);
        for (let index = 0; index < 8; index++) {
          const angle = (index / 8) * Math.PI * 2;
          const petal = new THREE.Mesh(
            crownPetalGeometry,
            index % 2 === 0 ? goldPetalMaterial : rubyPetalMaterial,
          );
          petal.name = "royal-lotus-crown-petal";
          const targetScale = new THREE.Vector3(0.14, 0.07, 0.32);
          const targetPosition = new THREE.Vector3(
            Math.cos(angle) * 0.18,
            0.19,
            Math.sin(angle) * 0.18,
          );
          const startPosition = new THREE.Vector3(
            Math.cos(angle) * 0.035,
            0.13,
            Math.sin(angle) * 0.035,
          );
          petal.scale.copy(targetScale).multiplyScalar(0.18);
          petal.position.copy(startPosition);
          petal.rotation.set(-0.2, angle, Math.cos(angle * 2) * 0.06);
          petal.userData.lanternBloom = {
            fromPosition: startPosition,
            toPosition: targetPosition,
            fromScale: petal.scale.clone(),
            toScale: targetScale,
          };
          mount.add(petal);
        }

        const centerJewel = new THREE.Mesh(
          new THREE.SphereGeometry(0.085, 20, 16),
          new THREE.MeshPhysicalMaterial({
            color: "#ffe28b",
            emissive: "#f2a92e",
            emissiveIntensity: 0.58,
            metalness: 0.18,
            roughness: 0.2,
            clearcoat: 1,
          }),
        );
        centerJewel.name = "royal-lotus-center-jewel";
        centerJewel.position.y = 0.26;
        mount.add(centerJewel);

        const crownPointGeometry = new THREE.ConeGeometry(0.035, 0.19, 10);
        const crownPointMaterial = new THREE.MeshStandardMaterial({
          color: "#ffd46b",
          emissive: "#ad5410",
          emissiveIntensity: 0.2,
          metalness: 0.48,
          roughness: 0.28,
        });
        for (let index = 0; index < 5; index++) {
          const angle = (index / 5) * Math.PI * 2;
          const point = new THREE.Mesh(crownPointGeometry, crownPointMaterial);
          point.name = "royal-lotus-crown-point";
          point.position.set(
            Math.cos(angle) * 0.12,
            0.31,
            Math.sin(angle) * 0.12,
          );
          mount.add(point);
        }
      }
      mount.add(lotus);
    };

    const lotusLoader = new GLTFLoader();
    lotusLoader.load(
      "/models/pink-lotus.glb?v=3",
      (gltf) => {
        if (disposed) return;
        lotusTemplate = gltf.scene;
        lotusTemplate.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(lotusTemplate);
        const size = bounds.getSize(new THREE.Vector3());
        const horizontalSpan = Math.max(size.x, size.z, 0.001);
        const modelScale = 0.78 / horizontalSpan;
        lotusTemplate.scale.setScalar(modelScale);
        lotusTemplate.position.set(
          -((bounds.min.x + bounds.max.x) * 0.5) * modelScale,
          -bounds.min.y * modelScale + 0.045,
          -((bounds.min.z + bounds.max.z) * 0.5) * modelScale,
        );
        lotusTemplate.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (!mesh.isMesh) return;
          const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];
          materials.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
              material.metalness = 0.04;
              material.roughness = 0.58;
              material.needsUpdate = true;
            }
          });
        });
        lanterns.forEach(({ group }) => {
          const mount = group.getObjectByName("lotus-flower-mount");
          if (mount instanceof THREE.Group)
            attachLotusModel(mount, group.userData.royal === true);
        });
        lotusAssetSettled = true;
        updateSceneReady();
      },
      undefined,
      () => {
        setError("ChÆ°a táº£i Ä‘Æ°á»£c mÃ´ hÃ¬nh hoa sen. HÃ£y táº£i láº¡i trang Ä‘á»ƒ thá»­ láº¡i.");
        lotusAssetSettled = true;
        updateSceneReady();
      },
    );

    const renderWaterReflection = water.onBeforeRender.bind(water);
    let lastWaterReflectionAt = Number.NEGATIVE_INFINITY;
    water.onBeforeRender = (
      renderer,
      activeScene,
      activeCamera,
      geometry,
      material,
      group,
    ) => {
      const now = performance.now();
      if (now - lastWaterReflectionAt < 1000 / 24) return;
      lastWaterReflectionAt = now;

      const boatReflectionVisibility = boatReflection.visible;
      const lanternWaterEffects = lanterns.map(({ reflection, ripples }) => ({
        reflection: reflection.visible,
        ripples: ripples.map(({ mesh }) => mesh.visible),
      }));
      lanterns.forEach(({ reflection, ripples }) => {
        reflection.visible = false;
        ripples.forEach(({ mesh }) => {
          mesh.visible = false;
        });
      });
      boatReflection.visible = false;
      try {
        renderWaterReflection(
          renderer,
          activeScene,
          activeCamera,
          geometry,
          material,
          group,
        );
      } finally {
        lanterns.forEach(({ reflection, ripples }, index) => {
          reflection.visible = lanternWaterEffects[index].reflection;
          ripples.forEach(({ mesh }, rippleIndex) => {
            mesh.visible = lanternWaterEffects[index].ripples[rippleIndex];
          });
        });
        boatReflection.visible = boatReflectionVisibility;
      }
    };

    const waterRippleGeometry = new THREE.TorusGeometry(1, 0.022, 6, 56);
    const royalRevealBursts: RoyalRevealBurst[] = [];
    const createLotusLantern = (
      message: string,
      posX: number,
      posZ: number,
      royal = false,
    ): FloatingLantern => {
      const group = new THREE.Group();

      // Đế lá sen xanh biếc
      const baseGeo = new THREE.CylinderGeometry(0.43, 0.39, 0.055, 32);
      const baseMat = new THREE.MeshStandardMaterial({
        color: royal ? "#42663a" : "#245d3d",
        roughness: 0.48,
      });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.02;
      group.add(base);

      const leafGeo = new THREE.SphereGeometry(1, 16, 10);
      const leafMaterial = new THREE.MeshStandardMaterial({
        color: "#39754a",
        roughness: 0.42,
      });
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const leaf = new THREE.Mesh(leafGeo, leafMaterial);
        leaf.scale.set(0.2, 0.035, 0.34);
        leaf.position.set(
          Math.cos(angle) * 0.28,
          0.035,
          Math.sin(angle) * 0.28,
        );
        leaf.rotation.y = angle - Math.PI / 2;
        group.add(leaf);
      }

      const flowerMount = new THREE.Group();
      flowerMount.name = "lotus-flower-mount";
      flowerMount.scale.setScalar(0.025);
      group.add(flowerMount);
      if (lotusTemplate) attachLotusModel(flowerMount, royal);

      const candleGeo = new THREE.CylinderGeometry(0.105, 0.12, 0.055, 20);
      const candleMat = new THREE.MeshStandardMaterial({
        color: royal ? "#e9bf72" : "#f2d78c",
        roughness: 0.38,
        metalness: 0.18,
      });
      const candle = new THREE.Mesh(candleGeo, candleMat);
      candle.position.y = 0.19;
      group.add(candle);

      const glowCanvas = document.createElement("canvas");
      glowCanvas.width = 128;
      glowCanvas.height = 128;
      const glowContext = glowCanvas.getContext("2d")!;
      const glowGradient = glowContext.createRadialGradient(
        64,
        64,
        2,
        64,
        64,
        64,
      );
      glowGradient.addColorStop(0, "rgba(255, 245, 195, 0.9)");
      glowGradient.addColorStop(0.2, "rgba(255, 176, 70, 0.42)");
      glowGradient.addColorStop(1, "rgba(255, 115, 35, 0)");
      glowContext.fillStyle = glowGradient;
      glowContext.fillRect(0, 0, 128, 128);
      const glowTexture = new THREE.CanvasTexture(glowCanvas);
      glowTexture.colorSpace = THREE.SRGBColorSpace;
      const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTexture,
          color: royal ? "#ffd477" : "#ffc16c",
          transparent: true,
          opacity: royal ? 0.48 : 0.34,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      glow.position.y = 0.31;
      glow.scale.setScalar(royal ? 1.18 : 0.86);
      group.add(glow);

      const flameGeo = new THREE.SphereGeometry(0.055, 16, 12);
      const flameMat = new THREE.MeshBasicMaterial({
        color: royal ? "#fff0b0" : "#fff4cf",
      });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.scale.set(0.72, 1.65, 0.72);
      flame.position.y = 0.34;
      group.add(flame);

      const light = new THREE.PointLight(
        royal ? "#ffcf70" : "#ffad57",
        royal ? 3.1 : 2.1,
        royal ? 7 : 5.5,
        1.8,
      );
      light.position.y = 0.32;
      group.add(light);

      const reflectionMaterial = new THREE.MeshBasicMaterial({
        map: lanternReflectionTexture,
        color: royal ? "#ffe19b" : "#ffb76c",
        transparent: true,
        opacity: royal ? 0.36 : 0.28,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const reflection = new THREE.Mesh(
        new THREE.PlaneGeometry(1.05, 4.2),
        reflectionMaterial,
      );
      reflection.rotation.x = -Math.PI / 2;
      reflection.position.set(posX, 0.008, posZ);
      reflection.renderOrder = 1;
      scene.add(reflection);

      const ripples = [0, 1].map((index) => {
        const ripple = new THREE.Mesh(
          waterRippleGeometry,
          new THREE.MeshBasicMaterial({
            color: royal ? "#ffd89a" : "#f5c98d",
            transparent: true,
            opacity: 0.035,
            depthWrite: false,
            side: THREE.DoubleSide,
          }),
        );
        ripple.rotation.x = -Math.PI / 2;
        ripple.position.set(posX, 0.006 - index * 0.001, posZ);
        ripple.scale.setScalar((index === 0 ? 0.42 : 0.72) * 1.92);
        scene.add(ripple);
        return { mesh: ripple, phase: index * 0.52 };
      });

      group.scale.setScalar(royal ? 1.72 : 1.58);
      group.position.set(posX, 0.05, posZ);
      group.userData = { message, royal };
      scene.add(group);

      return {
        group,
        flowerMount,
        light,
        flame,
        glow,
        reflection,
        ripples,
        initialX: posX,
        speed: 0.3 + Math.random() * 0.04,
        bobPhase: Math.random() * Math.PI * 2,
        message,
        royal,
        revealStartedAt: sceneElapsedTime,
        revealDuration: window.matchMedia("(prefers-reduced-motion: reduce)")
          .matches
          ? 0.15
          : royal
            ? 1.9
            : 1.1,
        rippleMaxOpacity: royal ? 0.045 : 0.028,
      };
    };

    releaseLanternRef.current = (
      message: string,
      royal = false,
      focusCamera = true,
      spawnXOverride?: number,
      spawnZOverride?: number,
    ) => {
      const lanternIndex = lanterns.length;
      const spawnPosition = getLanternSpawnPosition(lanternIndex);
      const spawnX =
        spawnXOverride ?? spawnPosition.x + (Math.random() - 0.5) * 0.12;
      const spawnZ = spawnZOverride ?? spawnPosition.z;

      const newLantern = createLotusLantern(message, spawnX, spawnZ, royal);

      lanterns.unshift(newLantern);
      lanterns.forEach((lantern, index) => {
        lantern.light.visible = index < maxLanternPointLights;
      });
      if (lanterns.length > maxVisibleLanterns) {
        const oldestLantern = lanterns.pop();
        if (oldestLantern) retireLanternVisual(oldestLantern);
      }
      setSessionWishes((wishes) => [...wishes, message]);
      if (
        royal &&
        focusCamera &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        royalCameraReveal = {
          startTime: sceneElapsedTime,
          originalPosition: camera.position.clone(),
          originalTarget: controls.target.clone(),
          focusPosition: new THREE.Vector3(spawnX * 0.72, 3.3, spawnZ + 11.5),
          focusTarget: new THREE.Vector3(spawnX, 0.42, spawnZ),
        };

        const count = 28;
        const phases = new Float32Array(count);
        const positions = new Float32Array(count * 3);
        for (let index = 0; index < count; index++) {
          phases[index] = (index / count) * Math.PI * 2 + Math.random() * 0.45;
          positions[index * 3] = spawnX;
          positions[index * 3 + 1] = 0.22;
          positions[index * 3 + 2] = spawnZ;
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(positions, 3),
        );
        const material = new THREE.PointsMaterial({
          color: "#ffd36d",
          size: 0.1,
          transparent: true,
          opacity: 0.75,
          depthWrite: false,
          sizeAttenuation: true,
        });
        const points = new THREE.Points(geometry, material);
        points.name = "royal-lantern-release-sparks";
        scene.add(points);
        royalRevealBursts.push({
          points,
          origin: new THREE.Vector3(spawnX, 0.22, spawnZ),
          startTime: sceneElapsedTime,
          phases,
        });
      } else if (focusCamera) {
        controls.target.set(spawnX * 0.18, 0.4, spawnZ - 1.8);
      }
    };
    sceneSetupFinished = true;
    updateSceneReady();
    // ==========================================
    // ==========================================

    // ==========================================
    // 7. ANIMATION LOOP: WATER SHADER & CHUYỂN ĐỘNG DÒNG CHẢY
    // ==========================================
    let animationFrameId: number;
    let renderFailed = false;
    const clock = new THREE.Timer();
    clock.connect(document);

    const animate = () => {
      if (renderFailed) return;
      animationFrameId = requestAnimationFrame(animate);

      clock.update();
      const delta = Math.min(clock.getDelta(), 0.05);
      const time = clock.getElapsed();
      sceneElapsedTime = time;

      // 1. Chuyển động sóng nước quang học Physical Water Shader
      water.material.uniforms["time"].value += delta;
      reedMixers.forEach((mixer) => mixer.update(delta));

      // 2. Xuồng ba lá nhấp nhô theo con nước.
      sampanGroup.position.y = 0.05 + Math.sin(time * 1.5) * 0.04;
      sampanGroup.rotation.z = Math.sin(time * 1.2) * 0.012;
      sampanGroup.rotation.x = Math.cos(time * 1.1) * 0.008;
      sampanLight.intensity = 30 + Math.sin(time * 8.5) * 4;
      lampFlame.scale.y = 1.45 + Math.sin(time * 11) * 0.18;
      boatReflection.position.x = sampanGroup.position.x;
      boatReflection.position.z = sampanGroup.position.z;
      boatReflection.rotation.y = sampanGroup.rotation.y;

      // 3. Hoa lục bình trôi dạt lững lờ
      waterHyacinths.forEach((item, index) => {
        item.z -= item.speed * delta;
        if (item.z < -16) {
          item.z = 8 + Math.random() * 8;
          item.x =
            item.side < 0
              ? -(7.0 + Math.random() * 1.6)
              : 10.6 + Math.random() * 1.2;
        }
        item.y = 0.02 + Math.sin(time * 2.0 + item.phase) * 0.02;
        for (let leafIndex = 0; leafIndex < leavesPerHyacinth; leafIndex++) {
          const angle = (leafIndex / leavesPerHyacinth) * Math.PI * 2;
          hyacinthDummy.position.set(
            item.x + Math.cos(angle) * 0.18,
            item.y + 0.03,
            item.z + Math.sin(angle) * 0.18,
          );
          hyacinthDummy.rotation.set(0, Math.PI / 2 - angle, 0);
          hyacinthDummy.updateMatrix();
          hyacinthLeaves.setMatrixAt(
            index * leavesPerHyacinth + leafIndex,
            hyacinthDummy.matrix,
          );
        }
        hyacinthDummy.position.set(item.x, item.y + 0.14, item.z);
        hyacinthDummy.rotation.set(0, 0, 0);
        hyacinthDummy.updateMatrix();
        hyacinthFlowers.setMatrixAt(index, hyacinthDummy.matrix);
      });
      hyacinthLeaves.instanceMatrix.needsUpdate = true;
      hyacinthFlowers.instanceMatrix.needsUpdate = true;

      // 4. Hoa đăng trôi xuôi dòng & Ánh nến lung linh
      lanterns.forEach((lantern, index) => {
        lantern.light.visible = index < maxLanternPointLights;
        lantern.group.position.z -= lantern.speed * delta;

        if (lantern.group.position.z < -16) {
          lantern.group.position.z = -16;
          lantern.group.position.x = lantern.initialX;
        }

        const revealProgress = THREE.MathUtils.clamp(
          (time - lantern.revealStartedAt) / lantern.revealDuration,
          0,
          1,
        );
        const bloomEase = 1 - Math.pow(1 - revealProgress, 3);
        lantern.flowerMount.scale.setScalar(Math.max(0.025, bloomEase));
        if (lantern.royal) {
          lantern.flowerMount.traverse((object) => {
            const bloom = object.userData.lanternBloom as
              | {
                  fromPosition: THREE.Vector3;
                  toPosition: THREE.Vector3;
                  fromScale: THREE.Vector3;
                  toScale: THREE.Vector3;
                }
              | undefined;
            if (!bloom) return;
            object.position.lerpVectors(
              bloom.fromPosition,
              bloom.toPosition,
              bloomEase,
            );
            object.scale.lerpVectors(bloom.fromScale, bloom.toScale, bloomEase);
          });
        }
        lantern.group.position.y =
          0.05 +
          Math.sin(time * 2.4 + lantern.bobPhase) * 0.035 +
          (lantern.royal ? 0.42 : 0.18) * (1 - bloomEase);
        lantern.group.rotation.y += delta * 0.18;
        lantern.group.rotation.z =
          Math.sin(time * 1.9 + lantern.bobPhase) * 0.03;

        // Ánh lửa nến nhấp nháy tự nhiên
      const royalFlicker =
        Math.sin(time * 9 + lantern.bobPhase) * (lantern.royal ? 0.4 : 0.28);
        lantern.light.intensity = (lantern.royal ? 3.1 : 2.1) + royalFlicker;
        lantern.flame.scale.y =
          1.55 + (Math.sin(time * 11 + lantern.bobPhase) + 1) * 0.12;
        lantern.reflection.material.opacity =
          (lantern.royal ? 0.26 : 0.19) +
          (Math.sin(time * 9 + lantern.bobPhase) + 1) *
            (lantern.royal ? 0.025 : 0.02);
        const glowMaterial = lantern.glow.material as THREE.SpriteMaterial;
        const glowPulse =
          1 +
          Math.sin(time * 2.7 + lantern.bobPhase) *
            (lantern.royal ? 0.05 : 0.035);
        glowMaterial.opacity =
          (lantern.royal ? 0.48 : 0.34) * (0.22 + bloomEase * 0.78);
        lantern.glow.scale.setScalar((lantern.royal ? 1.18 : 0.86) * glowPulse);
        lantern.reflection.position.x = lantern.group.position.x;
        lantern.reflection.position.z = lantern.group.position.z;
        lantern.reflection.rotation.y = lantern.group.rotation.y;
        lantern.ripples.forEach(({ mesh, phase }) => {
          const progress = (time * 0.24 + lantern.bobPhase + phase) % 1;
          const ringScale = 0.42 + progress * 0.86;
          mesh.position.x = lantern.group.position.x;
          mesh.position.z = lantern.group.position.z;
          mesh.scale.setScalar(ringScale * 1.35);
          mesh.material.opacity = lantern.rippleMaxOpacity * (1 - progress);
        });
      });

      for (let index = royalRevealBursts.length - 1; index >= 0; index--) {
        const burst = royalRevealBursts[index];
        const age = time - burst.startTime;
        if (age >= 1.9) {
          scene.remove(burst.points);
          burst.points.geometry.dispose();
          burst.points.material.dispose();
          royalRevealBursts.splice(index, 1);
          continue;
        }

        const positions = burst.points.geometry.getAttribute(
          "position",
        ) as THREE.BufferAttribute;
        for (let particle = 0; particle < burst.phases.length; particle++) {
          const phase =
            burst.phases[particle] + age * (1.5 + (particle % 4) * 0.25);
          const radius = 0.1 + age * (0.24 + (particle % 3) * 0.05);
          positions.setXYZ(
            particle,
            burst.origin.x + Math.cos(phase) * radius,
            burst.origin.y + age * (0.48 + (particle % 5) * 0.08),
            burst.origin.z + Math.sin(phase) * radius,
          );
        }
        positions.needsUpdate = true;
        burst.points.material.opacity = Math.max(0, 0.75 * (1 - age / 1.9));
      }

      if (royalCameraReveal) {
        const duration = 2.8;
        const progress = THREE.MathUtils.clamp(
          (time - royalCameraReveal.startTime) / duration,
          0,
          1,
        );
        const easeInOut = (value: number) => value * value * (3 - 2 * value);
        if (progress < 0.34) {
          const amount = easeInOut(progress / 0.34);
          camera.position.lerpVectors(
            royalCameraReveal.originalPosition,
            royalCameraReveal.focusPosition,
            amount,
          );
          controls.target.lerpVectors(
            royalCameraReveal.originalTarget,
            royalCameraReveal.focusTarget,
            amount,
          );
        } else if (progress < 0.56) {
          camera.position.copy(royalCameraReveal.focusPosition);
          controls.target.copy(royalCameraReveal.focusTarget);
        } else {
          const amount = easeInOut((progress - 0.56) / 0.44);
          camera.position.lerpVectors(
            royalCameraReveal.focusPosition,
            royalCameraReveal.originalPosition,
            amount,
          );
          controls.target.lerpVectors(
            royalCameraReveal.focusTarget,
            royalCameraReveal.originalTarget,
            amount,
          );
          if (progress >= 1) royalCameraReveal = null;
        }
      }

      // 5. Đom đóm bay lượn
      fireflies.forEach((ff) => {
        ff.mesh.position.x =
          ff.baseX + Math.sin(time * ff.speed + ff.phase) * 0.5;
        ff.mesh.position.y =
          ff.baseY + Math.cos(time * ff.speed * 1.3 + ff.phase) * 0.25;
        ff.mesh.position.z =
          ff.baseZ + Math.sin(time * ff.speed * 0.8 + ff.phase) * 0.4;
      });

      controls.update();
      try {
        renderer.render(scene, camera);
      } catch (renderError) {
        renderFailed = true;
        cancelAnimationFrame(animationFrameId);
        releaseLanternRef.current = null;
        setReady(false);
        setError("Cảnh 3D gặp lỗi khi dựng hình. Hãy tải lại trang để thử lại.");
        console.error("[SouthernRiverScene] WebGL render failed", renderError);
      }
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      releaseLanternRef.current = null;
      setReady(false);
      setError("Cảnh 3D đã bị gián đoạn. Hãy tải lại trang để mở lại cảnh.");
    };

    canvas.addEventListener("webglcontextlost", handleContextLost);

    animate();

    const handleResize = () => {
      if (!host || !host.clientWidth || !host.clientHeight) return;
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.fov = verticalFovForAspect(camera.aspect);
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(host);
    handleResize();

    return () => {
      disposed = true;
      releaseLanternRef.current = null;
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      clock.disconnect();
      controls.dispose();
      disposeThreeScene(scene);
      skyTexture.dispose();
      renderer.dispose();
      if (host.contains(canvas)) {
        host.removeChild(canvas);
      }
    };
  }, []);

  const autoReleasedWishRef = useRef(false);

  useLayoutEffect(() => {
    if (!ready || autoReleasedWishRef.current) return;
    if (!releaseLanternRef.current) return;

    autoReleasedWishRef.current = true;
    initialWishes.forEach(({ text, royal }, index) => {
      const spawnPosition = getLanternSpawnPosition(index);
      releaseLanternRef.current?.(
        text.trim(),
        royal,
        false,
        spawnPosition.x,
        spawnPosition.z,
      );
    });
  }, [initialWishes, ready]);

  const handleRelease = async () => {
    const text = customWish.trim();

    if (!text || !ready || !releaseLanternRef.current || royalLockRef.current) {
      return;
    }

    setRoyalError("");

    if (lanternStyle === "standard") {
      releaseLanternRef.current(text);
      onWishReleased?.({ text, royal: false });
      setCustomWish("");
      setShowInputModal(false);
      return;
    }

    if (!currentUserEmail && !isDemoMode()) {
      setRoyalError(
        "Hãy đăng nhập để dùng đèn trong kho. Đèn thường vẫn miễn phí.",
      );
      return;
    }

    royalLockRef.current = true;
    setUsingRoyal(true);

    const accountEmail = currentUserEmail ?? "demo@tinlamtamlinh.local";
    const storageKey = `tltl-royal-lantern-request:${accountEmail.trim().toLowerCase()}`;

    try {
      // Chỉ lưu mã thao tác; không lưu lời viết.
      // Nếu không giữ được mã thì chưa gọi API trừ lượt.
      let requestId = sessionStorage.getItem(storageKey);

      if (
        !requestId ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          requestId,
        )
      ) {
        requestId = crypto.randomUUID();
      }

      sessionStorage.setItem(storageKey, requestId);

      await useRoyalLantern(requestId);
      if (isDemoMode()) setRoyalLanternStock(getDemoRoyalLanternStock());

      if (!aliveRef.current) return;

      if (!releaseLanternRef.current) {
        throw new Error(
          "Lượt dùng đã được ghi nhận nhưng cảnh bị gián đoạn. Tải lại trang và thử dùng đèn lần nữa trong cùng tab để khôi phục bằng mã cũ.",
        );
      }

      releaseLanternRef.current(text, true);
      onWishReleased?.({ text, royal: true });

      // Chỉ bỏ mã khi đã thêm đèn vào cảnh.
      sessionStorage.removeItem(storageKey);

      setCustomWish("");
      setShowInputModal(false);
    } catch (reason) {
      if (!aliveRef.current) return;

      setRoyalError(
        reason instanceof Error
          ? reason.message
          : "Chưa hoàn tất lượt đèn. Hãy thử lại trong cùng tab.",
      );
    } finally {
      royalLockRef.current = false;

      if (aliveRef.current) {
        setUsingRoyal(false);
      }
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-amber-500/30 bg-[#040a14] shadow-2xl group">
      {/* 3D Canvas Host */}
      <div
        ref={hostRef}
        className="w-full h-80 sm:h-96 md:h-[430px] cursor-grab active:cursor-grabbing"
      />

      {!ready && !error && (
        <div
          role="status"
          className="absolute inset-0 z-20 flex items-center justify-center bg-[#07111b] text-amber-100"
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-amber-200/25 border-t-amber-300" />
            <p className="text-sm font-medium">&#272;ang chu&#7849;n b&#7883; c&#7843;nh s&#244;ng hoa &#273;&#259;ng&#8230;</p>
          </div>
        </div>
      )}

      {/* Top HUD Badge */}
      <div className="absolute top-3.5 left-4 pointer-events-none flex flex-wrap items-center gap-2">
        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider bg-black/60 text-amber-200 border border-amber-400/30 backdrop-blur-md flex items-center gap-2 shadow-md">
          <Moon className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>SÔNG NƯỚC HOA ĐĂNG NAM BỘ</span>
        </span>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-3.5 right-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (resetSceneRef.current) resetSceneRef.current();
          }}
          title="Đặt lại góc nhìn camera"
          className="p-2.5 rounded-xl bg-black/60 hover:bg-black/80 text-amber-200/80 hover:text-amber-100 border border-amber-400/20 backdrop-blur-md transition-all cursor-pointer shadow-md"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Add-lantern action stays visible without a backing bar. */}
      <div className="absolute bottom-4 right-4 z-10">
        <Button
          type="button"
          size="sm"
          onClick={() => setShowInputModal(true)}
          className="min-h-11 rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 px-5 text-xs font-bold text-white shadow-xl hover:brightness-110 cursor-pointer gap-2 border border-amber-300/40"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-100" />
          <span>Thả thêm hoa đăng 🪷</span>
        </Button>
      </div>

      {/* Modal Popup Nhập lời nguyện thả hoa đăng */}
      {showInputModal && (
        <AppDialog
          labelledBy="lantern-dialog-title"
          onClose={() => {
            if (!usingRoyal) setShowInputModal(false);
          }}
          className="max-w-lg p-6 sm:p-7 border-amber-500/30 rounded-2xl shadow-2xl [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-amber-500/20 [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-line/60">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-accent text-[#fde8c4] flex items-center justify-center font-bold text-base shadow-xs border border-amber-300/40 select-none">
                  燈
                </span>
                <div>
                  <h2
                    id="lantern-dialog-title"
                    className="font-display text-base sm:text-lg font-bold text-ink leading-tight"
                  >
                    Thả hoa đăng cầu an
                  </h2>
                  <p className="text-xs text-muted font-sans mt-0.5">
                    Nghi thức sông nước Nam Bộ • Phiên riêng tư
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Đóng hộp thoại thả hoa đăng"
                onClick={() => {
                  if (!usingRoyal) setShowInputModal(false);
                }}
                className="w-9 h-9 rounded-full text-muted hover:bg-surface-soft hover:text-ink flex items-center justify-center text-sm cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Gửi gắm ước nguyện thiện lành xuôi theo con nước. Lời viết được
              giữ tạm trong tab hiện tại để dựng lại cảnh, không gửi lên máy
              chủ.
            </p>

            <fieldset
              disabled={usingRoyal}
              className="space-y-3 border-0 p-0 m-0"
            >
              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_190px] items-center gap-3 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-50/80 to-rose-50/70 p-2.5 dark:from-amber-950/20 dark:to-rose-950/20">
                <div className="relative overflow-hidden rounded-lg bg-[#11222b]">
                  <LanternStylePreview royal={lanternStyle === "royal"} />
                </div>
                <div className="px-1 py-1">
                  <p className="mb-1 text-xs font-bold text-ink">
                    {lanternStyle === "royal" ? "Sen hoàng gia" : "Sen an yên"}
                  </p>
                  <p className="text-[11px] leading-relaxed text-muted">
                    {lanternStyle === "royal"
                      ? "Cánh sen đỏ ánh vàng, vòng kim loại và nghi thức khai hoa riêng."
                      : "Cánh sen hồng, ánh nến dịu và chuyển động trôi nhẹ nhàng."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Card 1: Standard Lantern */}
                <label
                  className={`flex flex-col justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    lanternStyle === "standard"
                      ? "border-accent bg-accent/5 ring-1 ring-accent/30 shadow-xs"
                      : "border-line bg-surface hover:bg-surface-soft/60"
                  }`}
                >
                  <input
                    type="radio"
                    name="lantern-style"
                    checked={lanternStyle === "standard"}
                    onChange={() => setLanternStyle("standard")}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-ink flex items-center gap-1.5 font-display">
                      <span>🪷</span>
                      <span>Đèn An Yên</span>
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                      Miễn phí
                    </span>
                  </div>
                  <div
                    aria-hidden="true"
                    className="relative mb-3 flex h-16 items-center justify-center overflow-hidden rounded-lg border border-emerald-900/10 bg-gradient-to-r from-emerald-50 to-amber-50 dark:from-emerald-950/30 dark:to-amber-950/20"
                  >
                    <span className="absolute h-12 w-12 rounded-full bg-amber-200/70 blur-md" />
                    <Flower2 className="relative h-9 w-9 text-rose-500 drop-shadow-[0_2px_5px_rgba(190,24,93,0.35)]" />
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    Sen hồng mộc mạc, ánh nến ấm và gợn sóng nhẹ.
                  </p>
                </label>

                {/* Card 2: Royal Lantern */}
                <label
                  className={`flex flex-col justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    lanternStyle === "royal"
                      ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/40 shadow-xs"
                      : "border-line bg-surface hover:bg-surface-soft/60"
                  }`}
                >
                  <input
                    type="radio"
                    name="lantern-style"
                    checked={lanternStyle === "royal"}
                    onChange={() => setLanternStyle("royal")}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 font-display">
                      <span>👑</span>
                      <span>Đèn Hoàng Gia</span>
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold border border-amber-400/30">
                      Thượng phẩm
                    </span>
                  </div>
                  <div
                    aria-hidden="true"
                    className="relative mb-3 flex h-16 items-center justify-center overflow-hidden rounded-lg border border-amber-300/50 bg-gradient-to-r from-rose-950 via-amber-900 to-rose-950"
                  >
                    <span className="absolute h-12 w-12 rounded-full bg-amber-300/80 blur-md" />
                    <Flower2 className="relative h-9 w-9 text-amber-300 drop-shadow-[0_0_9px_rgba(255,208,90,0.9)]" />
                    <span className="absolute right-3 top-2 text-amber-200 drop-shadow-[0_0_6px_rgba(255,205,82,0.9)]">
                      ♛
                    </span>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    Sen đỏ ánh vàng, viền hạt vàng; có hiệu ứng khai hoa và cận
                    cảnh riêng.
                  </p>
                </label>
              </div>

              {lanternStyle === "royal" && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 dark:text-amber-200 mt-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="font-medium">
                      {isDemoMode()
                        ? `Số dư kho: ${royalLanternStock} hoa đăng Thượng phẩm`
                        : "Đèn hoàng gia dùng 1 lượt trong kho hội viên Tâm An."}
                    </span>
                  </div>
                  {isDemoMode() && (
                    <button
                      type="button"
                      className="font-bold text-accent hover:underline text-xs shrink-0 cursor-pointer px-2 py-1 rounded-md hover:bg-amber-500/10 transition-colors"
                      onClick={() => {
                        setShowInputModal(false);
                        setShowLanternPurchase(true);
                      }}
                    >
                      + Thỉnh thêm
                    </button>
                  )}
                </div>
              )}
            </fieldset>

            {royalError && (
              <p role="alert" className="text-sm text-danger font-medium">
                {royalError}
              </p>
            )}

            <div className="pt-3">
              <label
                htmlFor="lantern-wish-content"
                className="text-xs font-bold uppercase tracking-wider text-ink flex items-center justify-between mb-2.5"
              >
                <span>Lời chúc hoặc tâm nguyện</span>
                <span className="text-[11px] text-muted font-normal lowercase font-mono tracking-normal">
                  {customWish.length}/280 ký tự
                </span>
              </label>

              {/* Gợi ý tâm nguyện 1 chạm (Mùa thi, vượt khó, gia đạo) phục vụ thuyết trình nhanh */}
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {[
                  { tag: "🎓 Thi cử đỗ đạt", wish: "Cầu cho tâm trí sáng suốt, tự tin làm bài, kỳ thi thuận lợi đạt kết quả như ý." },
                  { tag: "📚 Vượt vũ môn", wish: "Nguyện chúc bản thân và bạn bè vững tâm, bình tĩnh vượt qua mùa thi hanh thông." },
                  { tag: "🌸 Bình an gia đạo", wish: "Cầu cho gia đạo bình an, cha mẹ mạnh khỏe, vạn sự thuận hòa tốt lành." },
                  { tag: "💼 Công danh hanh thông", wish: "Cầu cho công việc suôn sẻ, sự nghiệp hanh thông, sớm gặt hái thành quả." },
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    disabled={usingRoyal}
                    onClick={() => setCustomWish(item.wish)}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-amber-300/60 bg-amber-50/80 text-amber-900 hover:bg-amber-100 hover:border-amber-400 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-700/50"
                  >
                    {item.tag}
                  </button>
                ))}
              </div>

              <textarea
                id="lantern-wish-content"
                rows={3}
                maxLength={280}
                value={customWish}
                disabled={usingRoyal}
                onChange={(e) => setCustomWish(e.target.value)}
                placeholder="VD: Cầu cho gia đạo bình an, cha mẹ mạnh khỏe, vạn sự hanh thông thuận lợi…"
                className="w-full rounded-xl border border-line bg-surface p-4 text-sm text-ink placeholder:text-muted/70 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 leading-relaxed disabled:cursor-not-allowed disabled:bg-surface-soft font-sans transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-5 pt-5 border-t border-line/70">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!usingRoyal) setShowInputModal(false);
                }}
                className="h-11 rounded-full px-5 text-sm font-semibold text-muted hover:bg-surface-soft hover:text-ink cursor-pointer transition-colors"
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleRelease()}
                disabled={usingRoyal || !ready || !customWish.trim()}
                className="h-11 rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 px-7 text-sm font-bold text-white shadow-md hover:brightness-110 cursor-pointer gap-2 disabled:cursor-not-allowed disabled:opacity-50 border border-amber-300/40 inline-flex items-center justify-center"
              >
                <Flower2 className="w-4 h-4" />
                <span>
                  {usingRoyal
                    ? "Đang thắp đèn…"
                    : lanternStyle === "royal"
                      ? "Thả đèn hoàng gia · 1 lượt kho"
                      : "Thả hoa đăng miễn phí 🪷"}
                </span>
              </Button>
            </div>
          </div>
        </AppDialog>
      )}

      {showLanternPurchase && isDemoMode() && (
        <DemoCommercePurchaseDialog
          sku="ROYAL_LANTERN_BUNDLE"
          onClose={() => setShowLanternPurchase(false)}
          onPurchaseComplete={(state) =>
            setRoyalLanternStock(state.inventory.royalLanterns)
          }
        />
      )}

      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/90 text-xs text-stone-200 p-4 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
