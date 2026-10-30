import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import { getDemoRoyalLanternStock, useRoyalLantern } from "../data/inventoryService";
import { isDemoMode } from "../data/demoMode";
import { DemoCommercePurchaseDialog } from "./DemoCommercePurchaseDialog";
import { disposeThreeScene } from "./threeSceneUtils";

interface FloatingLantern {
  group: THREE.Group;
  light: THREE.PointLight;
  flame: THREE.Mesh;
  reflection: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  ripples: Array<{ mesh: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>; phase: number }>;
  initialX: number;
  speed: number;
  bobPhase: number;
  message: string;
}

interface SouthernRiverSceneProps {
  initialWish?: string;
  currentUserEmail?: string;
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

      let nx = -dx * 0.27;
      let ny = -dy * 0.27;
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

function createPalmBarkTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d")!;
  const image = context.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      const grain = Math.sin((x / size) * Math.PI * 18 + Math.sin((y / size) * Math.PI * 6) * 0.7) * 12
        + Math.sin((x / size) * Math.PI * 42 + (y / size) * Math.PI * 4) * 5
        + Math.sin((y / size) * Math.PI * 16) * 4;
      image.data[index] = 102 + grain;
      image.data[index + 1] = 74 + grain * 0.76;
      image.data[index + 2] = 45 + grain * 0.48;
      image.data[index + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

function createPalmLeafTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const context = canvas.getContext("2d")!;
  const gradient = context.createLinearGradient(0, 8, 0, 56);
  gradient.addColorStop(0, "#54794b");
  gradient.addColorStop(0.52, "#8ca35d");
  gradient.addColorStop(1, "#42683e");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "rgba(224, 215, 151, 0.62)";
  context.lineWidth = 1.4;
  context.beginPath();
  context.moveTo(5, 32);
  context.lineTo(251, 32);
  context.stroke();
  context.lineWidth = 0.65;
  context.strokeStyle = "rgba(224, 225, 171, 0.42)";
  for (let x = 24; x < 246; x += 18) {
    const spread = 8 + (x / 256) * 17;
    context.beginPath();
    context.moveTo(x, 32);
    context.quadraticCurveTo(x + 8, 32 - spread * 0.7, Math.min(255, x + 16), 32 - spread);
    context.moveTo(x, 32);
    context.quadraticCurveTo(x + 8, 32 + spread * 0.7, Math.min(255, x + 16), 32 + spread);
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createTaperedTubeGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  tubularSegments: number,
  radialSegments: number,
  baseRadius: number,
  tipRadius: number
): THREE.BufferGeometry {
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const positions = new Float32Array((tubularSegments + 1) * (radialSegments + 1) * 3);
  const uvs = new Float32Array((tubularSegments + 1) * (radialSegments + 1) * 2);
  const indices: number[] = [];

  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    const point = curve.getPointAt(t);
    const radius = THREE.MathUtils.lerp(baseRadius, tipRadius, t);
    for (let j = 0; j <= radialSegments; j++) {
      const angle = (j / radialSegments) * Math.PI * 2;
      const normal = frames.normals[i].clone().multiplyScalar(Math.cos(angle))
        .addScaledVector(frames.binormals[i], Math.sin(angle));
      const vertex = (i * (radialSegments + 1) + j) * 3;
      positions[vertex] = point.x + normal.x * radius;
      positions[vertex + 1] = point.y + normal.y * radius;
      positions[vertex + 2] = point.z + normal.z * radius;
      const uv = (i * (radialSegments + 1) + j) * 2;
      uvs[uv] = j / radialSegments;
      uvs[uv + 1] = t;
    }
  }

  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = a + radialSegments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function SouthernRiverScene({
  initialWish,
  currentUserEmail,
}: SouthernRiverSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [lanternCount, setLanternCount] = useState(0);
  const [sessionWishes, setSessionWishes] = useState<string[]>([]);
  const [customWish, setCustomWish] = useState("");
  const [showInputModal, setShowInputModal] = useState(false);
  const [showLanternPurchase, setShowLanternPurchase] = useState(false);
  const [royalLanternStock, setRoyalLanternStock] = useState(() => isDemoMode() ? getDemoRoyalLanternStock() : 0);
  const [selectedLanternWish, setSelectedLanternWish] = useState<string | null>(null);

  const [lanternStyle, setLanternStyle] =
    useState<"standard" | "royal">("standard");

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
    const refreshDemoStock = () => setRoyalLanternStock(getDemoRoyalLanternStock());
    window.addEventListener("tltl-demo-inventory-change", refreshDemoStock);
    return () => window.removeEventListener("tltl-demo-inventory-change", refreshDemoStock);
  }, []);

  const releaseLanternRef = useRef<
    ((message: string, royal?: boolean, focusCamera?: boolean) => void) | null
  >(null);
  const resetSceneRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !host.clientWidth || !host.clientHeight) return;
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

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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
    const skyGradient = skyContext.createLinearGradient(0, 0, 0, skyCanvas.height);
    skyGradient.addColorStop(0, "#1d2b43");
    skyGradient.addColorStop(0.28, "#394e63");
    skyGradient.addColorStop(0.45, "#687f85");
    skyGradient.addColorStop(0.52, "#d39b78");
    skyGradient.addColorStop(0.57, "#bd8872");
    skyGradient.addColorStop(0.64, "#758582");
    skyGradient.addColorStop(0.82, "#4e6d77");
    skyGradient.addColorStop(1, "#304d5c");
    skyContext.fillStyle = skyGradient;
    skyContext.fillRect(0, 0, skyCanvas.width, skyCanvas.height);
    const skyTexture = new THREE.CanvasTexture(skyCanvas);
    skyTexture.colorSpace = THREE.SRGBColorSpace;
    skyTexture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = skyTexture;
    scene.fog = new THREE.FogExp2("#81918a", 0.0102);

    // Camera
    const riverHorizontalFov = 52;
    const verticalFovForAspect = (aspect: number) => THREE.MathUtils.radToDeg(
      2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(riverHorizontalFov / 2)) / aspect)
    );
    const cameraAspect = host.clientWidth / host.clientHeight;
    const camera = new THREE.PerspectiveCamera(
      verticalFovForAspect(cameraAspect),
      cameraAspect,
      0.1,
      1000
    );
    camera.position.set(0, 14.67, 41.84);

    // Controls
    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.minDistance = 8;
    controls.maxDistance = 58;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minPolarAngle = 0.2;
    controls.enableDamping = true;
    controls.autoRotate = false;
    
    controls.target.set(0, 1, -3);
    controls.update();
    controls.saveState();

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
    const moonGeo = new THREE.SphereGeometry(1.05, 32, 32);
    const moonMat = new THREE.MeshBasicMaterial({ color: "#fff0c7" });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(-12, 17, -62);
    scene.add(moon);

    const starCount = 90;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 60;
      starPositions[i * 3 + 1] = 6 + Math.random() * 25;
      starPositions[i * 3 + 2] = -10 - Math.random() * 35;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({
      color: "#e0f2fe",
      size: 0.1,
      transparent: true,
      opacity: 0.45,
    })));

    // ==========================================
    // 2. DÒNG NƯỚC SÔNG CỬU LONG QUANG HỌC (WATER SHADER)
    // ==========================================
    const riverWidth = 26;
    const shorelineBendAt = (z: number, side: number) => Math.sin(z * 0.022 + side * 0.9) * 3.3
      + Math.sin(z * 0.061 - side * 1.7) * 1.05
      + Math.sin(z * 0.14 + side * 0.4) * 0.22
      + Math.sin(z * 0.017 + side * 2.2) * 1.15
      + Math.sin(z * 0.043 - side * 1.3) * 0.52
      + Math.exp(-Math.pow((z + 108 + side * 12) / 21, 2)) * 3.6
      - Math.exp(-Math.pow((z + 62 - side * 19) / 16, 2)) * 2.7
      + Math.exp(-Math.pow((z + 16 + side * 13) / 13, 2)) * 2.8
      - Math.exp(-Math.pow((z - 16 - side * 9) / 22, 2)) * 2.15;
    const bankWidthVariationAt = (z: number, side: number) => Math.sin(z * 0.095 + side * 2.1) * 0.5
      + Math.sin(z * 0.21 - side * 0.7) * 0.16
      + Math.sin(z * 0.047 + side) * 0.52;
    const waterlineHalfWidthAt = (z: number, side: number) => riverWidth / 2 - 0.55
      + shorelineBendAt(z, side) * 0.938
      + bankWidthVariationAt(z, side) * 0.261
      + 0.24;
    const waterGeometry = new THREE.PlaneGeometry(30, 300, 1, 300);
    const waterPositions = waterGeometry.getAttribute("position") as THREE.BufferAttribute;
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
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: riverNormals,
      sunDirection: sunDir,
      sunColor: 0xd8c4a4,
      waterColor: 0x4b8089,
      distortionScale: 4.15,
      fog: scene.fog !== undefined,
    });
    water.material.fragmentShader = water.material.fragmentShader.replace(
      "vec2 uv0 = ( uv / 103.0 ) + vec2(time / 17.0, time / 29.0);",
      "vec2 uv0 = ( uv / vec2( 82.0, 230.0 ) ) + vec2(time / 17.0, time / 29.0);"
    ).replace(
      "vec2 uv1 = uv / 107.0-vec2( time / -19.0, time / 31.0 );",
      "vec2 uv1 = uv / vec2( 126.0, 315.0 )-vec2( time / -19.0, time / 31.0 );"
    ).replace(
      "vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( time / 101.0, time / 97.0 );",
      "vec2 uv2 = uv / vec2( 6400.0, 13200.0 ) + vec2( time / 101.0, time / 97.0 );"
    ).replace(
      "vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( time / 109.0, time / -113.0 );",
      "vec2 uv3 = uv / vec2( 1480.0, 3900.0 ) - vec2( time / 109.0, time / -113.0 );"
    ).replace(
      "vec3 reflectionSample = vec3( texture2D( mirrorSampler, mirrorCoord.xy / mirrorCoord.w + distortion ) );",
      [
        "vec2 reflectionUv = mirrorCoord.xy / mirrorCoord.w + distortion;",
        "vec3 reflectionSample = texture2D( mirrorSampler, reflectionUv ).rgb * 0.52",
        "+ texture2D( mirrorSampler, reflectionUv + vec2( 0.008, 0.003 ) ).rgb * 0.12",
        "+ texture2D( mirrorSampler, reflectionUv + vec2( -0.008, -0.003 ) ).rgb * 0.12",
        "+ texture2D( mirrorSampler, reflectionUv + vec2( 0.003, -0.008 ) ).rgb * 0.12",
        "+ texture2D( mirrorSampler, reflectionUv + vec2( -0.003, 0.008 ) ).rgb * 0.12;",
      ].join("\n")
    );
    water.material.fragmentShader = water.material.fragmentShader.replace(
      "float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );",
      "float reflectance = min( rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 ), 0.24 );"
    ).replace(
      "vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );",
      [
        "float nearRippleAmount = smoothstep( -85.0, -8.0, worldPosition.z );",
        "float nearRippleScale = 1.5 + nearRippleAmount * 0.65;",
        "vec3 surfaceNormal = normalize( noise.xzy * vec3( nearRippleScale, 1.0, nearRippleScale ) );",
      ].join("\n")
    ).replace(
      "sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );",
      "sunLight( surfaceNormal, eyeDirection, 78.0, 2.3, 0.5, diffuseLight, specularLight );"
    );
    water.material.needsUpdate = true;
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0;
    scene.add(water);

    const reflectionCanvas = document.createElement("canvas");
    reflectionCanvas.width = 256;
    reflectionCanvas.height = 96;
    const reflectionContext = reflectionCanvas.getContext("2d")!;
    const reflectionGradient = reflectionContext.createRadialGradient(128, 48, 3, 128, 48, 118);
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
    const lanternReflectionGradient = lanternReflectionContext.createRadialGradient(48, 128, 2, 48, 128, 124);
    lanternReflectionGradient.addColorStop(0, "rgba(255, 226, 162, 0.76)");
    lanternReflectionGradient.addColorStop(0.22, "rgba(255, 190, 105, 0.43)");
    lanternReflectionGradient.addColorStop(0.62, "rgba(244, 160, 82, 0.12)");
    lanternReflectionGradient.addColorStop(1, "rgba(244, 160, 82, 0)");
    lanternReflectionContext.fillStyle = lanternReflectionGradient;
    lanternReflectionContext.fillRect(0, 0, 96, 256);
    const lanternReflectionTexture = new THREE.CanvasTexture(lanternReflectionCanvas);
    lanternReflectionTexture.colorSpace = THREE.SRGBColorSpace;

    const barkTexture = createPalmBarkTexture();
    const palmLeafTexture = createPalmLeafTexture();
    const bambooMat = new THREE.MeshStandardMaterial({ map: barkTexture, roughness: 0.9 });

    // Xuồng ba lá gỗ thả neo sát bờ, thân mở lòng và nằm ngang mặt nước.
    const sampanGroup = new THREE.Group();
    const sampanShape = new THREE.Shape();
    sampanShape.moveTo(-2.65, 0);
    sampanShape.quadraticCurveTo(-2.15, -0.43, -0.85, -0.52);
    sampanShape.lineTo(1.35, -0.43);
    sampanShape.quadraticCurveTo(2.45, -0.25, 2.8, 0);
    sampanShape.quadraticCurveTo(2.45, 0.25, 1.35, 0.43);
    sampanShape.lineTo(-0.85, 0.52);
    sampanShape.quadraticCurveTo(-2.15, 0.43, -2.65, 0);
    const sampanGeo = new THREE.ExtrudeGeometry(sampanShape, {
      depth: 0.24,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.045,
      bevelThickness: 0.04,
    });
    sampanGeo.rotateX(-Math.PI / 2);
    const woodMat = new THREE.MeshStandardMaterial({ color: "#50311f", roughness: 0.78 });
    const sampanHull = new THREE.Mesh(sampanGeo, woodMat);
    sampanHull.position.y = -0.14;
    sampanGroup.add(sampanHull);
    const boatFloor = new THREE.Mesh(
      new THREE.BoxGeometry(3.65, 0.065, 0.72),
      new THREE.MeshStandardMaterial({ color: "#70452a", roughness: 0.86 })
    );
    boatFloor.position.set(0.05, 0.085, 0);
    sampanGroup.add(boatFloor);
    for (let rib = 0; rib < 5; rib++) {
      const seat = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.08, 0.82),
        new THREE.MeshStandardMaterial({ color: rib % 2 ? "#8a5a35" : "#694127", roughness: 0.82 })
      );
      seat.position.set(-1.45 + rib * 0.72, 0.16, 0);
      sampanGroup.add(seat);
    }
    const gunwaleMaterial = new THREE.MeshStandardMaterial({ color: "#a0744a", roughness: 0.72 });
    for (const side of [-1, 1]) {
      const railCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.35, 0.12, 0),
        new THREE.Vector3(-1.7, 0.15, side * 0.38),
        new THREE.Vector3(0.4, 0.15, side * 0.37),
        new THREE.Vector3(2.2, 0.12, side * 0.2),
      ]);
      sampanGroup.add(new THREE.Mesh(new THREE.TubeGeometry(railCurve, 16, 0.035, 6, false), gunwaleMaterial));
    }
    const paddleGeo = new THREE.CylinderGeometry(0.025, 0.025, 2.25, 8);
    paddleGeo.rotateX(Math.PI / 2);
    const paddle = new THREE.Mesh(paddleGeo, gunwaleMaterial);
    paddle.position.set(0.3, 0.22, 0.17);
    paddle.rotation.z = 0.05;
    sampanGroup.add(paddle);
    const paddleBlade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.045, 0.38), woodMat);
    paddleBlade.position.set(0.41, 0.2, 1.22);
    paddleBlade.rotation.x = -0.12;
    sampanGroup.add(paddleBlade);
    const lampGroup = new THREE.Group();
    const lanternGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.11, 0.2, 16),
      new THREE.MeshStandardMaterial({ color: "#ffc96d", emissive: "#d87820", emissiveIntensity: 0.8, roughness: 0.35 })
    );
    lanternGlass.position.y = 0.24;
    lampGroup.add(lanternGlass);
    const lampCap = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.09, 16),
      new THREE.MeshStandardMaterial({ color: "#b88642", metalness: 0.45, roughness: 0.42 })
    );
    lampCap.position.y = 0.385;
    lampGroup.add(lampCap);
    const lampFlame = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 10, 8),
      new THREE.MeshBasicMaterial({ color: "#fff0b0" })
    );
    lampFlame.scale.y = 1.7;
    lampFlame.position.y = 0.25;
    lampGroup.add(lampFlame);
    lampGroup.position.set(-2, 0, 0);
    sampanGroup.add(lampGroup);
    const sampanLight = new THREE.PointLight("#ffad57", 35, 5, 2);
    sampanLight.position.set(-2, 0.5, 0);
    sampanGroup.add(sampanLight);
    sampanGroup.scale.setScalar(1.1);
    sampanGroup.position.set(5.4, 0, -4.5);
    sampanGroup.rotation.y = -0.38;
    scene.add(sampanGroup);
    const boatReflectionMaterial = new THREE.MeshBasicMaterial({
      map: reflectionTexture,
      color: "#ffbb70",
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const boatReflection = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.58), boatReflectionMaterial);
    boatReflection.rotation.x = -Math.PI / 2;
    boatReflection.rotation.y = -0.38;
    boatReflection.position.set(6.5, 0.014, -7.5);
    scene.add(boatReflection);

    // Bờ đất phù sa và dừa nước dọc mép sông.
    const shorelinePalms: Array<{ group: THREE.Group; phase: number }> = [];
    const realPalmBatches: Array<{
      mesh: THREE.InstancedMesh;
      placements: Array<{
        position: THREE.Vector3;
        rotationY: number;
        scale: THREE.Vector3;
        phase: number;
      }>;
    }> = [];
    const palmWindDummy = new THREE.Object3D();
    const bankNormalMap = new THREE.TextureLoader().load("/assets/river/mud_forest_nor_gl_1k.jpg");
    const bankRoughnessMap = new THREE.TextureLoader().load("/assets/river/mud_forest_rough_1k.jpg");
    [bankNormalMap, bankRoughnessMap].forEach((texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
    });
    [-1, 1].forEach((side) => {
      // Uneven bank profile: a submerged toe, a gentle muddy slope, then
      // a low shore. The mesh has no end caps, so it cannot cut across the river.
      const bankStartZ = -190;
      const bankLength = 300;
      const bankRows = 300;
      const bankSections = [
        { offset: -0.8, height: -0.48 },
        { offset: -0.22, height: -0.12 },
        { offset: 0.28, height: 0.025 },
        { offset: 0.85, height: 0.12 },
        { offset: 1.65, height: 0.24 },
        { offset: 2.55, height: 0.36 },
        { offset: 3.35, height: 0.44 },
        { offset: 4.25, height: 0.39 },
      ];
      const bankPositions = new Float32Array((bankRows + 1) * bankSections.length * 3);
      const bankColors = new Float32Array((bankRows + 1) * bankSections.length * 3);
      const bankUvs = new Float32Array((bankRows + 1) * bankSections.length * 2);
      const bankIndices: number[] = [];
      const bankTints = ["#746e50", "#827956", "#90845e", "#999069", "#928a64", "#85865c", "#758052", "#68764c"].map((color) => new THREE.Color(color));
      for (let row = 0; row <= bankRows; row++) {
        const z = bankStartZ + (row / bankRows) * bankLength;
        const shorelineBend = shorelineBendAt(z, side);
        const bankWidthVariation = bankWidthVariationAt(z, side);
        bankSections.forEach((section, column) => {
          const vertex = (row * bankSections.length + column) * 3;
          const sectionWeight = column / (bankSections.length - 1);
          const innerEdgeWander = shorelineBend * (column < 2 ? 0.64 : 1);
          bankPositions[vertex] = side * (riverWidth / 2 - 0.55 + innerEdgeWander + bankWidthVariation * sectionWeight + section.offset);
          const highBankUndulation = column >= 4
            ? Math.sin(z * 0.041 + side * 1.2) * 0.38 + Math.sin(z * 0.11 + side) * 0.18
            : 0;
          const groundRipple = Math.sin(z * 0.11 + column * 0.7 + side) * 0.04
            + Math.sin(z * 0.047 + column * 1.9 + side * 2) * (column >= 3 ? 0.11 : 0.03)
            + Math.sin(z * 0.19 - column * 0.8 + side) * 0.018
            + Math.sin(z * 0.29 + column * 1.4 - side * 1.3) * 0.012;
          bankPositions[vertex + 1] = section.height + highBankUndulation + groundRipple;
          bankPositions[vertex + 2] = z;
          const uv = (row * bankSections.length + column) * 2;
          bankUvs[uv] = z / 2.3;
          bankUvs[uv + 1] = section.offset / 2.3;
          const tint = bankTints[column];
          const lateral = bankPositions[vertex];
          const mottling = 0.86 + Math.sin(z * 0.21 + column * 1.7 + side) * 0.07
            + Math.sin(z * 0.073 - side) * 0.07
            + Math.sin(z * 0.51 + column * 0.9) * 0.025
            + Math.sin(z * 0.037 + column * 2.6 + side * 3) * 0.035
            + Math.sin(z * 0.14 + column * 2.9 + side * 1.4) * 0.04
            + Math.cos(z * 0.31 - column * 1.8 + side * 0.7) * 0.018
            + Math.sin(z * 0.083 + lateral * 0.49 + side) * 0.045
            + Math.cos(z * 0.19 - lateral * 0.87 + side * 1.7) * 0.028
            + Math.sin(z * 0.37 + lateral * 1.31) * 0.014
            + Math.sin(z * 0.052 + lateral * 0.16 + side) * 0.032
            + Math.cos(z * 0.031 - lateral * 0.21) * 0.022;
          const dampShore = column === 0 ? 0.82 : column === 1 ? 0.9 : column === 2 ? 0.96 : 1;
          bankColors[vertex] = tint.r * mottling * dampShore;
          bankColors[vertex + 1] = tint.g * mottling * dampShore;
          bankColors[vertex + 2] = tint.b * mottling * dampShore;
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
      bankGeo.setAttribute("position", new THREE.BufferAttribute(bankPositions, 3));
      bankGeo.setAttribute("color", new THREE.BufferAttribute(bankColors, 3));
      bankGeo.setAttribute("uv", new THREE.BufferAttribute(bankUvs, 2));
      bankGeo.setIndex(bankIndices);
      bankGeo.computeVertexNormals();
      const bank = new THREE.Mesh(
        bankGeo,
        new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.98,
          roughnessMap: bankRoughnessMap,
          normalMap: bankNormalMap,
          normalScale: new THREE.Vector2(0.14, 0.14),
          side: THREE.DoubleSide,
        })
      );
      scene.add(bank);

      // Low, irregular riverbank shrubs fill the gaps between taller palms.
      const shrubLeafShape = new THREE.Shape();
      shrubLeafShape.moveTo(0, 0);
      shrubLeafShape.quadraticCurveTo(-0.24, 0.16, -0.3, 0.58);
      shrubLeafShape.quadraticCurveTo(-0.18, 0.96, 0.015, 1.08);
      shrubLeafShape.quadraticCurveTo(0.28, 0.73, 0.22, 0.3);
      shrubLeafShape.quadraticCurveTo(0.12, 0.08, 0, 0);
      const shrubLeafGeometry = new THREE.ShapeGeometry(shrubLeafShape, 5);
      const shrubMaterial = new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.92,
        side: THREE.DoubleSide,
      });
      const shrubCount = 18 * 8;
      const bankShrubs = new THREE.InstancedMesh(shrubLeafGeometry, shrubMaterial, shrubCount);
      const shrubDummy = new THREE.Object3D();
      let shrubIndex = 0;
      for (let patch = 0; patch < 18; patch++) {
        const patchZ = -174 + (patch / 17) * 204 + (Math.random() - 0.5) * 8;
        const surfaceOffset = 1.9 + Math.random() * 1.45;
        const sectionIndex = Math.max(1, bankSections.findIndex((section) => section.offset >= surfaceOffset));
        const lowerSection = bankSections[sectionIndex - 1];
        const upperSection = bankSections[sectionIndex];
        const blend = THREE.MathUtils.clamp(
          (surfaceOffset - lowerSection.offset) / (upperSection.offset - lowerSection.offset),
          0,
          1
        );
        const sectionProgress = sectionIndex - 1 + blend;
        const sectionWeight = sectionProgress / (bankSections.length - 1);
        const patchX = riverWidth / 2 - 0.55
          + shorelineBendAt(patchZ, side)
          + bankWidthVariationAt(patchZ, side) * sectionWeight
          + surfaceOffset;
        const bankUndulation = (Math.sin(patchZ * 0.041 + side * 1.2) * 0.38
          + Math.sin(patchZ * 0.11 + side) * 0.18)
          * THREE.MathUtils.clamp(sectionProgress - 4, 0, 1);
        const baseY = THREE.MathUtils.lerp(lowerSection.height, upperSection.height, blend) + bankUndulation;
        for (let leaf = 0; leaf < 8; leaf++) {
          const angle = (leaf / 8) * Math.PI * 2 + Math.random() * 0.55;
          const scale = 0.56 + Math.random() * 0.28;
          shrubDummy.position.set(
            side * (patchX + Math.cos(angle) * 0.18),
            baseY + 0.03,
            patchZ + Math.sin(angle) * 0.18
          );
          shrubDummy.rotation.set((Math.random() - 0.5) * 0.38, angle, (Math.random() - 0.5) * 0.55);
          shrubDummy.scale.set(scale * (0.82 + Math.random() * 0.3), scale, 1);
          shrubDummy.updateMatrix();
          bankShrubs.setMatrixAt(shrubIndex, shrubDummy.matrix);
          bankShrubs.setColorAt(shrubIndex, new THREE.Color().setHSL(
            0.25 + Math.random() * 0.09,
            0.38 + Math.random() * 0.2,
            0.3 + Math.random() * 0.14
          ));
          shrubIndex++;
        }
      }
      bankShrubs.count = shrubIndex;
      bankShrubs.instanceMatrix.needsUpdate = true;
      if (bankShrubs.instanceColor) bankShrubs.instanceColor.needsUpdate = true;
      scene.add(bankShrubs);

      // Nipa palm clumps: curved fronds with paired narrow leaflets and
      // varied spacing/height, rather than identical bare arches.
      const leafShape = new THREE.Shape();
      leafShape.moveTo(0, 0);
      leafShape.quadraticCurveTo(0.32, 0.19, 0.94, 0.025);
      leafShape.quadraticCurveTo(1.02, 0.005, 1.08, 0);
      leafShape.quadraticCurveTo(0.61, -0.105, 0.12, -0.17);
      leafShape.quadraticCurveTo(0.035, -0.08, 0, 0);
      const leafletGeometry = new THREE.ShapeGeometry(leafShape);
      const leafletMaterial = new THREE.MeshStandardMaterial({
        map: palmLeafTexture,
        color: "#ffffff",
        roughness: 0.86,
        side: THREE.DoubleSide,
      });
      const frondMaterial = new THREE.MeshStandardMaterial({ color: "#71865c", roughness: 0.9 });
      const leafletDummy = new THREE.Object3D();
      const palmClusters = side < 0
        ? [{ z: -166, count: 2 }, { z: -128, count: 3 }, { z: -91, count: 2 }, { z: -62, count: 3 }, { z: -35, count: 2 }, { z: -14, count: 2 }]
        : [{ z: -154, count: 3 }, { z: -119, count: 2 }, { z: -84, count: 3 }, { z: -48, count: 2 }, { z: -29, count: 3 }, { z: -11, count: 2 }];
      const palmPlacements = palmClusters.flatMap((cluster) =>
        Array.from({ length: cluster.count }, (_, memberIndex) => ({
          centerZ: cluster.z,
          memberIndex,
          clusterSize: cluster.count,
        }))
      );
      const palmCount = palmPlacements.length;

      for (let palmIndex = 0; palmIndex < palmCount; palmIndex++) {
        const palm = new THREE.Group();
        const placement = palmPlacements[palmIndex];
        const palmZ = placement.centerZ
          + (placement.memberIndex - (placement.clusterSize - 1) / 2) * 4.5
          + (Math.random() - 0.5) * 8.5
          + side * (0.8 + Math.random() * 2.8);
        const frondsPerPalm = 7 + Math.floor(Math.random() * 3);
        const pairsPerFrond = 9 + Math.floor(Math.random() * 5);
        const leavesPerPalm = frondsPerPalm * pairsPerFrond * 2;
        const leaflets = new THREE.InstancedMesh(leafletGeometry, leafletMaterial, leavesPerPalm);
        let leafletIndex = 0;
        const height = 2.9 + Math.random() * 1.45;
        const lean = side * (0.1 + Math.random() * 0.34);
        const trunkCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(lean * 0.35, height * 0.42, 0),
          new THREE.Vector3(lean, height, 0),
        ]);
        palm.add(new THREE.Mesh(createTaperedTubeGeometry(trunkCurve, 16, 10, 0.2, 0.075), bambooMat));

        for (let frondIndex = 0; frondIndex < frondsPerPalm; frondIndex++) {
          const angle = (frondIndex / frondsPerPalm) * Math.PI * 2 + Math.random() * 0.55;
          const length = 2.45 + Math.random() * 1.35;
          const end = new THREE.Vector3(
            Math.cos(angle) * length,
            height - 0.7 - Math.random() * 0.35,
            Math.sin(angle) * length
          );
          const frondCurve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(lean, height, 0),
            new THREE.Vector3(end.x * 0.4, height + 1.05, end.z * 0.4),
            end
          );
          palm.add(new THREE.Mesh(new THREE.TubeGeometry(frondCurve, 14, 0.035, 5, false), frondMaterial));

          for (let pairIndex = 0; pairIndex < pairsPerFrond; pairIndex++) {
            const t = 0.1 + pairIndex * (0.72 / pairsPerFrond);
            const base = frondCurve.getPoint(t);
            const tangent = frondCurve.getTangent(t);
            const lateral = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
            for (const sideSign of [-1, 1]) {
              const leafDirection = lateral.clone().multiplyScalar(sideSign * 0.78)
                .add(tangent.clone().multiplyScalar(0.62)).normalize();
              leafletDummy.position.copy(base).addScaledVector(leafDirection, 0.12);
              leafletDummy.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), leafDirection);
              leafletDummy.rotateX((Math.random() - 0.5) * 0.35);
              leafletDummy.scale.setScalar(0.52 + Math.random() * 0.3);
              leafletDummy.updateMatrix();
              leaflets.setMatrixAt(leafletIndex++, leafletDummy.matrix);
              leaflets.setColorAt(leafletIndex - 1, new THREE.Color().setHSL(0.27 + Math.random() * 0.07, 0.3 + Math.random() * 0.2, 0.24 + Math.random() * 0.13));
            }
          }
        }

        leaflets.count = leafletIndex;
        leaflets.instanceMatrix.needsUpdate = true;
        if (leaflets.instanceColor) leaflets.instanceColor.needsUpdate = true;
        palm.add(leaflets);
        palm.position.set(
          side * (riverWidth / 2 - 0.3 + Math.random() * 2.4 + shorelineBendAt(palmZ, side)),
          0.34 + Math.random() * 0.16,
          palmZ
        );
        const foregroundScale = palmZ > -52
          ? 0.72 + Math.random() * 0.12
          : palmZ > -110
            ? 0.66 + Math.random() * 0.12
            : 0.58 + Math.random() * 0.12;
        palm.scale.set(foregroundScale, foregroundScale * (0.95 + Math.random() * 0.12), foregroundScale * (0.9 + Math.random() * 0.18));
        palm.rotation.y = (Math.random() - 0.5) * 0.72;
        scene.add(palm);
        shorelinePalms.push({ group: palm, phase: Math.random() * Math.PI * 2 });
      }

      const coverClusterCount = 196;
      const leavesPerCluster = 18;
      const grassShape = new THREE.Shape();
      grassShape.moveTo(0, 0);
      grassShape.quadraticCurveTo(-0.1, 0.24, -0.045, 0.7);
      grassShape.quadraticCurveTo(0, 0.98, 0.07, 1.12);
      grassShape.quadraticCurveTo(0.16, 0.72, 0.1, 0.27);
      grassShape.quadraticCurveTo(0.055, 0.08, 0, 0);
      const coverGeometry = new THREE.ShapeGeometry(grassShape, 5);
      const sedgeShape = new THREE.Shape();
      sedgeShape.moveTo(0, 0);
      sedgeShape.quadraticCurveTo(-0.24, 0.2, -0.25, 0.56);
      sedgeShape.quadraticCurveTo(-0.12, 0.92, 0.04, 0.98);
      sedgeShape.quadraticCurveTo(0.3, 0.68, 0.2, 0.28);
      sedgeShape.quadraticCurveTo(0.1, 0.08, 0, 0);
      const sedgeGeometry = new THREE.ShapeGeometry(sedgeShape, 5);
      const coverMaterial = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.94, side: THREE.DoubleSide });
      const bankCover = new THREE.InstancedMesh(coverGeometry, coverMaterial, coverClusterCount * leavesPerCluster);
      const bankSedges = new THREE.InstancedMesh(sedgeGeometry, coverMaterial, coverClusterCount * leavesPerCluster);
      let coverIndex = 0;
      let sedgeIndex = 0;
      for (let cluster = 0; cluster < coverClusterCount; cluster++) {
        const centerZ = -174 + (cluster / (coverClusterCount - 1)) * 196 + (Math.random() - 0.5) * 8;
        const broadPatch = 0.5 + 0.5 * Math.sin(centerZ * 0.057 + 1.6);
        const smallPatch = 0.5 + 0.5 * Math.sin(centerZ * 0.13 - 2.0);
        const patchDensity = 0.24 + broadPatch * 0.42 + smallPatch * 0.2;
        const patchHash = Math.sin(cluster * 127.1 + 311.7) * 43758.5453;
        const patchRoll = patchHash - Math.floor(patchHash);
        if (patchRoll > patchDensity) continue;
        const speciesHash = Math.sin(cluster * 269.5 + 183.3) * 24634.6345;
        const speciesRoll = speciesHash - Math.floor(speciesHash);
        const isSedgePatch = speciesRoll < 0.28;
        const surfaceOffset = isSedgePatch
          ? 0.45 + Math.random() * 1.25
          : 0.28 + 0.35 + Math.random() * 3.1;
        const upperSectionIndex = Math.max(1, bankSections.findIndex((section) => section.offset >= surfaceOffset));
        const lowerSection = bankSections[upperSectionIndex - 1];
        const upperSection = bankSections[upperSectionIndex];
        const sectionBlend = THREE.MathUtils.clamp(
          (surfaceOffset - lowerSection.offset) / (upperSection.offset - lowerSection.offset),
          0,
          1
        );
        const sectionProgress = upperSectionIndex - 1 + sectionBlend;
        const sectionWeight = sectionProgress / (bankSections.length - 1);
        const centerX = riverWidth / 2 - 0.55
          + shorelineBendAt(centerZ, side)
          + bankWidthVariationAt(centerZ, side) * sectionWeight
          + surfaceOffset;
        const highBankUndulation = sectionProgress >= 4
          ? (Math.sin(centerZ * 0.041 + side * 1.2) * 0.3 + Math.sin(centerZ * 0.11 + side) * 0.14)
            * THREE.MathUtils.clamp(sectionProgress - 4, 0, 1)
          : 0;
        const groundRipple = Math.sin(centerZ * 0.11 + sectionProgress * 0.7 + side) * 0.025
          + Math.sin(centerZ * 0.047 + sectionProgress * 1.9 + side * 2) * (sectionProgress >= 3 ? 0.065 : 0.022)
          + Math.sin(centerZ * 0.19 - sectionProgress * 0.8 + side) * 0.012;
        const bankSurfaceY = THREE.MathUtils.lerp(lowerSection.height, upperSection.height, sectionBlend)
          + highBankUndulation
          + groundRipple;
        const plantLeafCount = isSedgePatch ? 10 : leavesPerCluster;
        for (let leafIndex = 0; leafIndex < plantLeafCount; leafIndex++) {
          const angle = (leafIndex / plantLeafCount) * Math.PI * 2 + Math.random() * 0.85;
          leafletDummy.position.set(side * (centerX + (Math.random() - 0.5) * 1.25), bankSurfaceY + 0.035, centerZ + (Math.random() - 0.5) * 1.5);
          leafletDummy.rotation.set((Math.random() - 0.5) * 0.2, angle, (Math.random() - 0.5) * 0.34);
          const nearScale = centerZ > -42
            ? 0.5 + Math.random() * 0.18
            : centerZ > -86
              ? 0.82 + Math.random() * 0.2
              : 0.9 + Math.random() * 0.34;
          leafletDummy.scale.set(
            isSedgePatch ? 0.72 + Math.random() * 0.2 : 0.78 + Math.random() * 0.36,
            isSedgePatch ? 0.52 + Math.random() * 0.14 : nearScale,
            1
          );
          leafletDummy.updateMatrix();
          const targetCover = isSedgePatch ? bankSedges : bankCover;
          const targetIndex = isSedgePatch ? sedgeIndex++ : coverIndex++;
          targetCover.setMatrixAt(targetIndex, leafletDummy.matrix);
          targetCover.setColorAt(targetIndex, new THREE.Color().setHSL(
            isSedgePatch ? 0.25 + Math.random() * 0.06 : 0.22 + Math.random() * 0.11,
            0.34 + Math.random() * 0.2,
            isSedgePatch ? 0.34 + Math.random() * 0.12 : 0.31 + Math.random() * 0.13
          ));
        }
      }
      bankCover.count = coverIndex;
      bankCover.instanceMatrix.needsUpdate = true;
      if (bankCover.instanceColor) bankCover.instanceColor.needsUpdate = true;
      scene.add(bankCover);
      bankSedges.count = sedgeIndex;
      bankSedges.instanceMatrix.needsUpdate = true;
      if (bankSedges.instanceColor) bankSedges.instanceColor.needsUpdate = true;
      scene.add(bankSedges);

      // Low, arching nipa-palm fans break up the taller palms along the waterline.
      const nipaClusterCount = 6;
      const nipaFrondsPerCluster = 5;
      const nipaPairsPerFrond = 11;
      const nipaLeaflets = new THREE.InstancedMesh(
        leafletGeometry,
        leafletMaterial,
        nipaClusterCount * nipaFrondsPerCluster * nipaPairsPerFrond * 2
      );
      const nipaStemGeometries: THREE.BufferGeometry[] = [];
      const nipaDummy = new THREE.Object3D();
      const nipaXDirection = new THREE.Vector3(1, 0, 0);
      let nipaLeafIndex = 0;
      const nipaClusterCenters = side < 0
        ? [-176, -140, -103, -68, -35, -13]
        : [-158, -125, -88, -51, -26, -8];
      for (let cluster = 0; cluster < nipaClusterCount; cluster++) {
        const clusterZ = nipaClusterCenters[cluster] + (Math.random() - 0.5) * 15;
        const surfaceOffset = 0.9 + Math.random() * 1.8;
        const upperSectionIndex = Math.max(1, bankSections.findIndex((section) => section.offset >= surfaceOffset));
        const lowerSection = bankSections[upperSectionIndex - 1];
        const upperSection = bankSections[upperSectionIndex];
        const sectionBlend = THREE.MathUtils.clamp(
          (surfaceOffset - lowerSection.offset) / (upperSection.offset - lowerSection.offset),
          0,
          1
        );
        const sectionProgress = upperSectionIndex - 1 + sectionBlend;
        const sectionWeight = sectionProgress / (bankSections.length - 1);
        const centerX = side * (riverWidth / 2 - 0.55
          + shorelineBendAt(clusterZ, side)
          + bankWidthVariationAt(clusterZ, side) * sectionWeight
          + surfaceOffset);
        const bankUndulation = (Math.sin(clusterZ * 0.041 + side * 1.2) * 0.3
          + Math.sin(clusterZ * 0.11 + side) * 0.14)
          * THREE.MathUtils.clamp(sectionProgress - 4, 0, 1);
        const centerY = THREE.MathUtils.lerp(lowerSection.height, upperSection.height, sectionBlend) + bankUndulation;

        for (let frondIndex = 0; frondIndex < nipaFrondsPerCluster; frondIndex++) {
          const angle = (frondIndex / nipaFrondsPerCluster) * Math.PI * 2 + Math.random() * 0.7;
          const length = 2.15 + Math.random() * 0.9;
          const endX = Math.cos(angle) * length;
          const endZ = Math.sin(angle) * length;
          const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(centerX, centerY + 0.08, clusterZ),
            new THREE.Vector3(centerX + endX * 0.43, centerY + 1.9 + Math.random() * 0.35, clusterZ + endZ * 0.43),
            new THREE.Vector3(centerX + endX, centerY + 0.72 + Math.random() * 0.35, clusterZ + endZ)
          );
          nipaStemGeometries.push(new THREE.TubeGeometry(curve, 14, 0.025, 5, false));

          for (let pairIndex = 0; pairIndex < nipaPairsPerFrond; pairIndex++) {
            const t = 0.12 + pairIndex * (0.72 / nipaPairsPerFrond);
            const base = curve.getPoint(t);
            const tangent = curve.getTangent(t);
            const lateral = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
            for (const sideSign of [-1, 1]) {
              const direction = lateral.clone().multiplyScalar(sideSign * 0.78)
                .add(tangent.clone().multiplyScalar(0.38))
                .add(new THREE.Vector3(0, -0.14, 0))
                .normalize();
              nipaDummy.position.copy(base).addScaledVector(direction, 0.1);
              nipaDummy.quaternion.setFromUnitVectors(nipaXDirection, direction);
              nipaDummy.rotateX((Math.random() - 0.5) * 0.26);
              nipaDummy.scale.set(0.34 + Math.random() * 0.2, 0.76, 0.72);
              nipaDummy.updateMatrix();
              nipaLeaflets.setMatrixAt(nipaLeafIndex, nipaDummy.matrix);
              nipaLeaflets.setColorAt(nipaLeafIndex, new THREE.Color().setHSL(
                0.27 + Math.random() * 0.045,
                0.28 + Math.random() * 0.12,
                0.27 + Math.random() * 0.12
              ));
              nipaLeafIndex++;
            }
          }
        }
      }
      nipaLeaflets.count = nipaLeafIndex;
      nipaLeaflets.instanceMatrix.needsUpdate = true;
      if (nipaLeaflets.instanceColor) nipaLeaflets.instanceColor.needsUpdate = true;
      scene.add(nipaLeaflets);
      const mergedNipaStems = mergeGeometries(nipaStemGeometries, false);
      nipaStemGeometries.forEach((geometry) => geometry.dispose());
      if (mergedNipaStems) scene.add(new THREE.Mesh(mergedNipaStems, frondMaterial));
    });

    // Load a detailed palm once, merge static parts by material, and instance it
    // at the existing shoreline positions so the scene stays within a few draw calls.
    const palmLoader = new GLTFLoader();
    palmLoader.load(
      "/assets/river/mature-date-palm-tree.glb",
      (gltf) => {
        if (disposed) {
          gltf.scene.traverse((object) => {
            const mesh = object as THREE.Mesh;
            mesh.geometry?.dispose();
            const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
            materials.forEach((material) => {
              Object.values(material).forEach((value) => {
                if (value instanceof THREE.Texture) value.dispose();
              });
              material.dispose();
            });
          });
          return;
        }

        const palmRoot = gltf.scene;
        palmRoot.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(palmRoot);
        const modelHeight = Math.max(0.001, bounds.max.y - bounds.min.y);
        const modelScale = 5.2 / modelHeight;
        palmRoot.scale.setScalar(modelScale);
        palmRoot.position.set(
          -((bounds.min.x + bounds.max.x) * 0.5) * modelScale,
          -bounds.min.y * modelScale,
          -((bounds.min.z + bounds.max.z) * 0.5) * modelScale
        );
        palmRoot.updateMatrixWorld(true);

        const geometryGroups = new Map<string, { material: THREE.Material; geometries: THREE.BufferGeometry[] }>();
        palmRoot.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (!mesh.isMesh || !mesh.geometry || !mesh.material || Array.isArray(mesh.material)) return;
          const geometry = mesh.geometry.clone();
          geometry.applyMatrix4(mesh.matrixWorld);
          const attributes = Object.keys(geometry.attributes).sort().join(",");
          const key = `${mesh.material.uuid}:${attributes}:${geometry.index ? "indexed" : "flat"}`;
          const group = geometryGroups.get(key) ?? { material: mesh.material, geometries: [] };
          group.geometries.push(geometry);
          geometryGroups.set(key, group);
        });

        const placements = shorelinePalms.map(({ group, phase }) => ({
          position: group.position.clone(),
          rotationY: group.rotation.y,
          scale: group.scale.clone(),
          phase,
        }));
        let loadedBatchCount = 0;
        geometryGroups.forEach(({ material, geometries }) => {
          const mergedGeometry = mergeGeometries(geometries, false);
          geometries.forEach((geometry) => geometry.dispose());
          if (!mergedGeometry) return;
          const mesh = new THREE.InstancedMesh(mergedGeometry, material, placements.length);
          mesh.frustumCulled = false;
          const dummy = new THREE.Object3D();
          placements.forEach((placement, index) => {
            dummy.position.copy(placement.position);
            dummy.rotation.set(0, placement.rotationY, 0);
            dummy.scale.copy(placement.scale);
            dummy.updateMatrix();
            mesh.setMatrixAt(index, dummy.matrix);
          });
          mesh.instanceMatrix.needsUpdate = true;
          scene.add(mesh);
          realPalmBatches.push({ mesh, placements });
          loadedBatchCount++;
        });

        if (loadedBatchCount > 0) {
          shorelinePalms.forEach(({ group }) => {
            group.visible = false;
          });
        }
        palmRoot.traverse((object) => {
          const mesh = object as THREE.Mesh;
          mesh.geometry?.dispose();
        });
      },
      undefined,
      () => {
        // Keep procedural palms visible if the external model cannot load.
      }
    );

    // Cụm hoa lục bình trôi bồng bềnh
    const waterHyacinths: Array<{ hyGroup: THREE.Group; speed: number; side: number }> = [];
    for (let i = 0; i < 6; i++) {
      const hyGroup = new THREE.Group();
      // Lá lục bình tròn xòe
      for (let j = 0; j < 6; j++) {
        const leafAngle = (j / 6) * Math.PI * 2;
        const leafGeo = new THREE.SphereGeometry(0.12, 8, 6);
        leafGeo.scale(1, 0.2, 1.3);
        const leafMat = new THREE.MeshStandardMaterial({ color: "#166534", roughness: 0.6 });
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(Math.cos(leafAngle) * 0.18, 0.03, Math.sin(leafAngle) * 0.18);
        hyGroup.add(leaf);
      }
      // Nụ hoa tím biếc
      const flowerGeo = new THREE.ConeGeometry(0.08, 0.22, 6);
      const flowerMat = new THREE.MeshStandardMaterial({ color: "#c084fc", roughness: 0.5 });
      const flower = new THREE.Mesh(flowerGeo, flowerMat);
      flower.position.y = 0.14;
      hyGroup.add(flower);

      const hyacinthSide = i % 2 === 0 ? -1 : 1;
      const hyacinthX = hyacinthSide < 0
        ? -(7.0 + Math.random() * 1.6)
        : 10.6 + Math.random() * 1.2;
      hyGroup.position.set(
        hyacinthX,
        0.02,
        -17 + Math.random() * 25
      );
      scene.add(hyGroup);
      waterHyacinths.push({ hyGroup, speed: 0.15 + Math.random() * 0.1, side: hyacinthSide });
    }

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

    const renderWaterReflection = water.onBeforeRender.bind(water);
    water.onBeforeRender = (renderer, activeScene, activeCamera, geometry, material, group) => {
      const lanternVisibility = lanterns.map(({ group }) => group.visible);
      const moonVisibility = moon.visible;
      const sampanVisibility = sampanGroup.visible;
      const boatReflectionVisibility = boatReflection.visible;
      const hyacinthVisibility = waterHyacinths.map(({ hyGroup }) => hyGroup.visible);
      lanterns.forEach(({ group }) => { group.visible = false; });
      moon.visible = false;
      waterHyacinths.forEach(({ hyGroup }) => { hyGroup.visible = false; });
      sampanGroup.visible = false;
      boatReflection.visible = false;
      try {
        renderWaterReflection(renderer, activeScene, activeCamera, geometry, material, group);
      } finally {
        lanterns.forEach(({ group }, index) => { group.visible = lanternVisibility[index]; });
        moon.visible = moonVisibility;
        waterHyacinths.forEach(({ hyGroup }, index) => { hyGroup.visible = hyacinthVisibility[index]; });
        sampanGroup.visible = sampanVisibility;
        boatReflection.visible = boatReflectionVisibility;
      }
    };

    const waterRippleGeometry = new THREE.TorusGeometry(1, 0.022, 6, 56);
    const createLotusLantern = (
      message: string,
      posX: number,
      posZ: number,
      royal = false
    ): FloatingLantern => {
      const group = new THREE.Group();

      // Đế lá sen xanh biếc
      const baseGeo = new THREE.CylinderGeometry(0.43, 0.39, 0.055, 32);
      const baseMat = new THREE.MeshStandardMaterial({ color: royal ? "#42663a" : "#245d3d", roughness: 0.48 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.02;
      group.add(base);

      const leafGeo = new THREE.SphereGeometry(1, 16, 10);
      const leafMaterial = new THREE.MeshStandardMaterial({ color: "#39754a", roughness: 0.42 });
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const leaf = new THREE.Mesh(leafGeo, leafMaterial);
        leaf.scale.set(0.2, 0.035, 0.34);
        leaf.position.set(Math.cos(angle) * 0.28, 0.035, Math.sin(angle) * 0.28);
        leaf.rotation.y = angle - Math.PI / 2;
        group.add(leaf);
      }

      const petalGeo = new THREE.SphereGeometry(1, 18, 12);
      const petalLayers = [
        { count: 9, radius: 0.25, y: 0.105, sx: 0.18, sy: 0.065, sz: 0.34, color: royal ? "#f6c85f" : "#e95d9a", emissive: royal ? "#6a3216" : "#641b43" },
        { count: 8, radius: 0.18, y: 0.145, sx: 0.15, sy: 0.06, sz: 0.29, color: royal ? "#ffe18a" : "#f58ab6", emissive: royal ? "#8a4a16" : "#7e2450" },
        { count: 6, radius: 0.105, y: 0.18, sx: 0.115, sy: 0.05, sz: 0.22, color: royal ? "#fff0b5" : "#ffc0d5", emissive: royal ? "#a76a20" : "#8b3158" },
      ];
      petalLayers.forEach((layer, layerIndex) => {
        const material = new THREE.MeshPhysicalMaterial({
          color: layer.color,
          emissive: layer.emissive,
          emissiveIntensity: 0.16,
          roughness: 0.3,
          clearcoat: 0.42,
          clearcoatRoughness: 0.24,
          side: THREE.DoubleSide,
        });
        for (let i = 0; i < layer.count; i++) {
          const angle = (i / layer.count) * Math.PI * 2 + layerIndex * 0.2;
          const petal = new THREE.Mesh(petalGeo, material);
          petal.scale.set(layer.sx, layer.sy, layer.sz);
          petal.position.set(Math.cos(angle) * layer.radius, layer.y, Math.sin(angle) * layer.radius);
          petal.rotation.set(-0.24 - layerIndex * 0.07, angle - Math.PI / 2, Math.cos(angle * 2) * 0.08);
          group.add(petal);
        }
      });

      const candleGeo = new THREE.CylinderGeometry(0.105, 0.12, 0.055, 20);
      const candleMat = new THREE.MeshStandardMaterial({ color: royal ? "#e9bf72" : "#f2d78c", roughness: 0.38, metalness: 0.18 });
      const candle = new THREE.Mesh(candleGeo, candleMat);
      candle.position.y = 0.19;
      group.add(candle);

      const glowCanvas = document.createElement("canvas");
      glowCanvas.width = 128;
      glowCanvas.height = 128;
      const glowContext = glowCanvas.getContext("2d")!;
      const glowGradient = glowContext.createRadialGradient(64, 64, 2, 64, 64, 64);
      glowGradient.addColorStop(0, "rgba(255, 245, 195, 0.9)");
      glowGradient.addColorStop(0.2, "rgba(255, 176, 70, 0.42)");
      glowGradient.addColorStop(1, "rgba(255, 115, 35, 0)");
      glowContext.fillStyle = glowGradient;
      glowContext.fillRect(0, 0, 128, 128);
      const glowTexture = new THREE.CanvasTexture(glowCanvas);
      glowTexture.colorSpace = THREE.SRGBColorSpace;
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: royal ? "#ffd477" : "#ffc16c", transparent: true, opacity: 0.84, depthWrite: false, blending: THREE.AdditiveBlending }));
      glow.position.y = 0.31;
      glow.scale.set(1.34, 1.34, 1);
      group.add(glow);

      const flameGeo = new THREE.SphereGeometry(0.055, 16, 12);
      const flameMat = new THREE.MeshBasicMaterial({ color: royal ? "#fff0b0" : "#fff4cf" });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.scale.set(0.72, 1.65, 0.72);
      flame.position.y = 0.34;
      group.add(flame);

      const light = new THREE.PointLight(royal ? "#ffcf70" : "#ffad57", 4.6, 8.5, 1.8);
      light.position.y = 0.32;
      group.add(light);

      const reflectionMaterial = new THREE.MeshBasicMaterial({
        map: lanternReflectionTexture,
        color: royal ? "#ffe19b" : "#ffb76c",
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const reflection = new THREE.Mesh(
        new THREE.PlaneGeometry(0.72, 3.1),
        reflectionMaterial
      );
      reflection.rotation.x = -Math.PI / 2;
      reflection.position.y = -0.012;
      reflection.renderOrder = 1;
      group.add(reflection);

      const ripples = [0, 1].map((index) => {
        const ripple = new THREE.Mesh(
          waterRippleGeometry,
          new THREE.MeshBasicMaterial({
            color: royal ? "#ffd89a" : "#f5c98d",
            transparent: true,
            opacity: 0.018,
            depthWrite: false,
            side: THREE.DoubleSide,
          })
        );
        ripple.rotation.x = -Math.PI / 2;
        ripple.position.y = -0.012 - index * 0.001;
        ripple.scale.setScalar(index === 0 ? 0.42 : 0.72);
        group.add(ripple);
        return { mesh: ripple, phase: index * 0.52 };
      });

      group.scale.setScalar(1.68);
      group.position.set(posX, 0.05, posZ);
      group.userData = { message };
      scene.add(group);

      return {
        group,
        light,
        flame,
        reflection,
        ripples,
        initialX: posX,
        speed: 0.28 + Math.random() * 0.18,
        bobPhase: Math.random() * Math.PI * 2,
        message,
      };
    };

    releaseLanternRef.current = (
      message: string,
      royal = false,
      focusCamera = true
    ) => {
      const spawnX = (Math.random() - 0.5) * 4.2;
      const spawnZ = 9.5;

      const newLantern = createLotusLantern(
        message,
        spawnX,
        spawnZ,
        royal
      );

      lanterns.unshift(newLantern);
      setLanternCount(lanterns.length);
      setSessionWishes((wishes) => [...wishes, message]);
      if (focusCamera) controls.target.set(spawnX * 0.18, 0.4, spawnZ - 1.8);
    };
    setReady(true);

    // ==========================================
    // 7. RAYCASTER NHẤP HOA ĐĂNG XEM LỜI NGUYỆN
    // ==========================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(
        lanterns.map((l) => l.group),
        true
      );

      if (intersects.length > 0) {
        let parentGroup: THREE.Object3D | null = intersects[0].object;
        while (parentGroup && !parentGroup.userData.message && parentGroup.parent) {
          parentGroup = parentGroup.parent;
        }
        if (parentGroup && parentGroup.userData.message) {
          setSelectedLanternWish(parentGroup.userData.message);
        }
      }
    };

    canvas.addEventListener("click", handleCanvasClick);

    // ==========================================
    // 8. ANIMATION LOOP: WATER SHADER & CHUYỂN ĐỘNG DÒNG CHẢY
    // ==========================================
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.05);
      const time = clock.elapsedTime;

      // 1. Chuyển động sóng nước quang học Physical Water Shader
      water.material.uniforms["time"].value += delta;

      // 2. Xuồng ba lá nhấp nhô theo con nước.
      sampanGroup.position.y = 0.05 + Math.sin(time * 1.5) * 0.04;
      sampanGroup.rotation.z = Math.sin(time * 1.2) * 0.012;
      sampanGroup.rotation.x = Math.cos(time * 1.1) * 0.008;
      sampanLight.intensity = 30 + Math.sin(time * 8.5) * 4;
      lampFlame.scale.y = 1.45 + Math.sin(time * 11) * 0.18;
      boatReflection.position.x = sampanGroup.position.x;
      boatReflection.position.z = sampanGroup.position.z;

      // Hàng dừa nước đung đưa rất nhẹ theo gió bờ sông.
      shorelinePalms.forEach(({ group, phase }) => {
        group.rotation.z = Math.sin(time * 0.55 + phase) * 0.012;
      });
      realPalmBatches.forEach(({ mesh, placements }) => {
        placements.forEach((placement, index) => {
          palmWindDummy.position.copy(placement.position);
          palmWindDummy.rotation.set(0, placement.rotationY, Math.sin(time * 0.55 + placement.phase) * 0.012);
          palmWindDummy.scale.copy(placement.scale);
          palmWindDummy.updateMatrix();
          mesh.setMatrixAt(index, palmWindDummy.matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
      });

      // 3. Hoa lục bình trôi dạt lững lờ
      waterHyacinths.forEach((item) => {
        item.hyGroup.position.z -= item.speed * delta;
        if (item.hyGroup.position.z < -16) {
          item.hyGroup.position.z = 8 + Math.random() * 8;
          item.hyGroup.position.x = item.side < 0
            ? -(7.0 + Math.random() * 1.6)
            : 10.6 + Math.random() * 1.2;
        }
        item.hyGroup.position.y = 0.02 + Math.sin(time * 2.0) * 0.02;
      });

      // 4. Hoa đăng trôi xuôi dòng & Ánh nến lung linh
      lanterns.forEach((lantern) => {
        lantern.group.position.z -= lantern.speed * delta;

        if (lantern.group.position.z < -16) {
          lantern.group.position.z = -16;
          lantern.group.position.x = lantern.initialX;
        }

        lantern.group.position.y =
          0.05 + Math.sin(time * 2.4 + lantern.bobPhase) * 0.035;
        lantern.group.rotation.y += delta * 0.18;
        lantern.group.rotation.z = Math.sin(time * 1.9 + lantern.bobPhase) * 0.03;

        // Ánh lửa nến nhấp nháy tự nhiên
        lantern.light.intensity = 4.4 + Math.sin(time * 9 + lantern.bobPhase) * 0.5;
        lantern.flame.scale.y = 1.55 + (Math.sin(time * 11 + lantern.bobPhase) + 1) * 0.12;
        lantern.reflection.material.opacity = 0.48 + (Math.sin(time * 9 + lantern.bobPhase) + 1) * 0.05;
        lantern.ripples.forEach(({ mesh, phase }) => {
          const progress = (time * 0.24 + lantern.bobPhase + phase) % 1;
          const ringScale = 0.42 + progress * 0.86;
          mesh.scale.setScalar(ringScale);
          mesh.material.opacity = 0.02 * (1 - progress);
        });
      });

      // 5. Đom đóm bay lượn
      fireflies.forEach((ff) => {
        ff.mesh.position.x = ff.baseX + Math.sin(time * ff.speed + ff.phase) * 0.5;
        ff.mesh.position.y = ff.baseY + Math.cos(time * ff.speed * 1.3 + ff.phase) * 0.25;
        ff.mesh.position.z = ff.baseZ + Math.sin(time * ff.speed * 0.8 + ff.phase) * 0.4;
      });

      controls.update();
      renderer.render(scene, camera);
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      releaseLanternRef.current = null;
      setReady(false);
      setError(
        "Cảnh 3D đã bị gián đoạn. Hãy tải lại trang để mở lại cảnh."
      );
    };

    canvas.addEventListener(
      "webglcontextlost",
      handleContextLost
    );

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

      canvas.removeEventListener(
        "webglcontextlost",
        handleContextLost
      );
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvas.removeEventListener("click", handleCanvasClick);
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

  useEffect(() => {
    const message = initialWish?.trim();
    if (!ready || !message || autoReleasedWishRef.current) return;
    if (!releaseLanternRef.current) return;

    releaseLanternRef.current(message, false, false);
    autoReleasedWishRef.current = true;
  }, [initialWish, ready]);

  const handleRelease = async () => {
    const text = customWish.trim();

    if (
      !text ||
      !ready ||
      !releaseLanternRef.current ||
      royalLockRef.current
    ) {
      return;
    }

    setRoyalError("");

    if (lanternStyle === "standard") {
      releaseLanternRef.current(text);
      setCustomWish("");
      setShowInputModal(false);
      return;
    }

    if (!currentUserEmail && !isDemoMode()) {
      setRoyalError(
        "Hãy đăng nhập để dùng đèn trong kho. Đèn thường vẫn miễn phí."
      );
      return;
    }

    royalLockRef.current = true;
    setUsingRoyal(true);

    const accountEmail = currentUserEmail ?? "demo@tinlamtamlinh.local";
    const storageKey =
      `tltl-royal-lantern-request:${accountEmail.trim().toLowerCase()}`;

    try {
      // Chỉ lưu mã thao tác; không lưu lời viết.
      // Nếu không giữ được mã thì chưa gọi API trừ lượt.
      let requestId = sessionStorage.getItem(storageKey);

      if (
        !requestId ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          requestId
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
          "Lượt dùng đã được ghi nhận nhưng cảnh bị gián đoạn. Tải lại trang và thử dùng đèn lần nữa trong cùng tab để khôi phục bằng mã cũ."
        );
      }

      releaseLanternRef.current(text, true);

      // Chỉ bỏ mã khi đã thêm đèn vào cảnh.
      sessionStorage.removeItem(storageKey);

      setCustomWish("");
      setShowInputModal(false);
    } catch (reason) {
      if (!aliveRef.current) return;

      setRoyalError(
        reason instanceof Error
          ? reason.message
          : "Chưa hoàn tất lượt đèn. Hãy thử lại trong cùng tab."
      );
    } finally {
      royalLockRef.current = false;

      if (aliveRef.current) {
        setUsingRoyal(false);
      }
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-emerald-500/40 bg-[#040a14] shadow-xl group">
      {/* 3D Canvas Host */}
      <div
        ref={hostRef}
        className="w-full h-80 sm:h-96 md:h-[430px] cursor-grab active:cursor-grabbing"
      />

      {/* Top HUD Badge */}
      <div className="absolute top-3.5 left-4 pointer-events-none flex items-center gap-2">
        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-black/65 text-emerald-300 border border-emerald-500/40 backdrop-blur-md flex items-center gap-2 shadow-sm">
          <Moon className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>CẢNH QUAN 3D LẤY CẢM HỨNG TỪ SÔNG NƯỚC NAM BỘ</span>
        </span>
        <span className="hidden sm:inline-block text-[11px] text-stone-300 bg-black/50 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
          {lanternCount === 0
            ? "Chưa thắp hoa đăng trong phiên này"
            : `${lanternCount} hoa đăng đã thắp trong phiên này`}
        </span>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-3.5 right-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (resetSceneRef.current) resetSceneRef.current();
          }}
          title="Đặt lại góc nhìn"
          className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-stone-300 hover:text-white border border-white/10 backdrop-blur-md transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Modal Tooltip khi nhấp vào hoa đăng */}
      {selectedLanternWish && (
        <div role="status" className="absolute inset-x-4 top-16 max-w-md mx-auto p-4 rounded-2xl bg-black/85 border border-emerald-500/50 text-white backdrop-blur-md shadow-2xl animate-fade-in z-20">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
              <span>🌸</span>
              <span>LỜI NGUYỆN BẠN ĐÃ THẮP TRONG PHIÊN NÀY</span>
            </span>
            <button
              type="button"
              aria-label="Đóng lời nguyện đang xem"
              onClick={() => setSelectedLanternWish(null)}
              className="text-stone-400 hover:text-white text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
          <p className="font-display italic text-sm text-emerald-100 leading-relaxed">
            “{selectedLanternWish}”
          </p>
          <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center text-[10px] text-stone-400">
            <span>Chỉ hiển thị trong cảnh đang mở</span>
            <button
              type="button"
              onClick={() => setSelectedLanternWish(null)}
              className="text-emerald-400 hover:underline cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Add-lantern action stays visible without a backing bar. */}
      <div className="absolute bottom-4 right-4 z-10">
        <Button
          type="button"
          size="sm"
          onClick={() => setShowInputModal(true)}
          className="min-h-11 rounded-xl bg-gradient-to-r from-emerald-700 to-amber-600 px-4 text-xs font-semibold text-white shadow-lg hover:from-emerald-600 hover:to-amber-500 cursor-pointer gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
          <span>Thả thêm hoa đăng</span>
        </Button>
      </div>

      {/* Modal Popup Nhập lời nguyện thả hoa đăng */}
      {showInputModal && (
        <AppDialog
          labelledBy="lantern-dialog-title"
          onClose={() => {
            if (!usingRoyal) setShowInputModal(false);
          }}
          className="max-w-sm p-5"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 id="lantern-dialog-title" className="font-display text-base font-bold text-accent flex items-center gap-1.5">
                <span>🏮</span>
                <span>Thả hoa đăng cầu an trên sông</span>
              </h2>
              <button
                type="button"
                aria-label="Đóng hộp thoại thả hoa đăng"
                onClick={() => {
                  if (!usingRoyal) setShowInputModal(false);
                }}
                className="min-h-11 min-w-11 rounded-full text-muted hover:bg-surface-soft hover:text-ink text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-muted leading-relaxed">
              Viết lời chúc lành hoặc tâm nguyện của riêng bạn. Nội dung chỉ hiển thị trong cảnh đang mở, không được lưu hoặc chia sẻ công khai.
            </p>

            <fieldset
              disabled={usingRoyal}
              className="space-y-2 text-sm text-ink"
            >
              <legend className="mb-2 font-semibold">
                Chọn loại đèn
              </legend>

              <label className="flex min-h-11 items-center gap-2">
                <input
                  type="radio"
                  name="lantern-style"
                  checked={lanternStyle === "standard"}
                  onChange={() => setLanternStyle("standard")}
                  className="accent-accent"
                />
                Đèn thường — miễn phí
              </label>

              <label className="flex min-h-11 items-center gap-2">
                <input
                  type="radio"
                  name="lantern-style"
                  checked={lanternStyle === "royal"}
                  onChange={() => setLanternStyle("royal")}
                  className="accent-accent"
                />
                Đèn hoàng gia — dùng 1 lượt trong kho
              </label>
            </fieldset>

            {lanternStyle === "royal" && (
              <div className="space-y-1 text-xs leading-relaxed text-muted">
                <p>{isDemoMode()
                  ? `Demo Mode · còn ${royalLanternStock} hoa đăng xịn trong kho; mỗi lần thả trừ một chiếc.`
                  : "Đèn hoàng gia dùng một lượt trong kho hội viên. Mỗi năm hội viên Tâm An được tặng một lượt."}</p>
                {isDemoMode() && (
                  <button
                    type="button"
                    className="min-h-11 font-semibold text-accent underline underline-offset-2"
                    onClick={() => { setShowInputModal(false); setShowLanternPurchase(true); }}
                  >
                    Mua thêm hoa đăng xịn
                  </button>
                )}
              </div>
            )}

            {royalError && (
              <p role="alert" className="text-sm text-danger">
                {royalError}
              </p>
            )}

            <label htmlFor="lantern-wish-content" className="block text-sm font-semibold text-ink">
              Lời chúc hoặc tâm nguyện
            </label>
            <textarea
              id="lantern-wish-content"
              rows={3}
              maxLength={280}
              value={customWish}
              disabled={usingRoyal}
              onChange={(e) => setCustomWish(e.target.value)}
              placeholder="VD: Cầu cho gia đạo bình an, cha mẹ mạnh khỏe, mọi sự hanh thông thuận lợi…"
              className="w-full rounded-xl border border-line bg-white p-3 text-sm text-ink placeholder:text-muted/80 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 leading-relaxed disabled:cursor-not-allowed disabled:bg-surface-soft"
            />
            <p className="text-right text-xs text-muted" aria-live="polite">
              {customWish.length}/280 ký tự
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!usingRoyal) setShowInputModal(false);
                }}
                className="min-h-11 rounded-lg px-3 text-sm text-muted hover:bg-surface-soft hover:text-ink cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleRelease()}
                disabled={
                  usingRoyal ||
                  !ready ||
                  !customWish.trim()
                }
                className="text-xs rounded-xl bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-white font-semibold cursor-pointer gap-1.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                <span>
                  {usingRoyal ? "Đang xác nhận lượt…" : "Thả đèn"}
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
          onPurchaseComplete={(state) => setRoyalLanternStock(state.inventory.royalLanterns)}
        />
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-xs text-stone-400 p-4 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
