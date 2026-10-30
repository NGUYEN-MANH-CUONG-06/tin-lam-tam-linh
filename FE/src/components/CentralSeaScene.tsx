import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Water } from "three/examples/jsm/objects/Water.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { disposeThreeScene } from "./threeSceneUtils";
import {
  Waves,
  RotateCcw,
  Sun,
  Sunset,
  Volume2,
  VolumeX,
  Anchor,
} from "lucide-react";

type TimeMode = "dawn" | "day" | "sunset";
type ViewPreset = "overview" | "boat" | "basket";

// Tạo Procedural Normal Map cho sóng biển chuyển động tự nhiên
function createProceduralWaterNormalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.createImageData(512, 512);
  const data = imgData.data;

  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const idx = (y * 512 + x) * 4;
      const u = (x / 512) * Math.PI * 12;
      const v = (y / 512) * Math.PI * 12;

      // Sóng biển phức hợp đa tầng (Trochoidal wave approximation)
      const dx =
        Math.cos(u * 1.2 + v * 0.7) * 1.5 -
        Math.sin(v * 2.2 - u * 0.8) * 1.2 +
        Math.cos(u * 3.5 - v * 2.1) * 1.8;
      const dy =
        Math.cos(u * 1.2 + v * 0.7) * 0.8 +
        Math.cos(v * 2.2 - u * 0.8) * 2.0 -
        Math.sin(u * 3.5 - v * 2.1) * 1.1;

      let nx = -dx * 0.18;
      let ny = -dy * 0.18;
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

// Tạo texture đan nan tre cho thuyền thúng
function createWovenBambooTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#8a6538";
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = "#5a3f20";
  ctx.lineWidth = 3;
  for (let i = 0; i <= 256; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }

  // Lớp dầu rái (hắc ín) chống thấm truyền thống vùng biển
  ctx.fillStyle = "rgba(40, 26, 12, 0.4)";
  for (let y = 0; y < 256; y += 32) {
    for (let x = 0; x < 256; x += 32) {
      if ((x + y) % 64 === 0) {
        ctx.fillRect(x, y, 32, 32);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

export default function CentralSeaScene() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [timeMode, setTimeMode] = useState<TimeMode>("dawn");
  const [currentView, setCurrentView] = useState<ViewPreset>("overview");
  const [soundEnabled, setSoundEnabled] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const birdTimerRef = useRef<number | null>(null);

  const resetRef = useRef<() => void>(() => {});
  const switchTimeRef = useRef<((mode: TimeMode) => void) | null>(null);
  const setCameraViewRef = useRef<((view: ViewPreset) => void) | null>(null);

  // Âm thanh sóng biển vỗ & hải âu kêu xa
  const handleToggleSound = () => {
    if (audioContextRef.current) {
      if (birdTimerRef.current !== null) window.clearInterval(birdTimerRef.current);
      birdTimerRef.current = null;
      void audioContextRef.current.close();
      audioContextRef.current = null;
      setSoundEnabled(false);
      return;
    }

    const context = new AudioContext();
    audioContextRef.current = context;
    const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * 0.45;

    const waves = context.createBufferSource();
    waves.buffer = buffer;
    waves.loop = true;
    const lowPass = context.createBiquadFilter();
    lowPass.type = "lowpass";
    lowPass.frequency.value = 520;
    const waveGain = context.createGain();
    waveGain.gain.value = 0.028;
    waves.connect(lowPass).connect(waveGain).connect(context.destination);
    waves.start();

    const swell = context.createOscillator();
    const swellDepth = context.createGain();
    swell.frequency.value = 0.11;
    swellDepth.gain.value = 0.018;
    swell.connect(swellDepth).connect(waveGain.gain);
    swell.start();

    const chirp = () => {
      for (let note = 0; note < 3; note++) {
        const start = context.currentTime + note * 0.18;
        const bird = context.createOscillator();
        const envelope = context.createGain();
        bird.type = "sine";
        bird.frequency.setValueAtTime(1550 + note * 110, start);
        bird.frequency.exponentialRampToValueAtTime(2450 + note * 90, start + 0.07);
        bird.frequency.exponentialRampToValueAtTime(1750 + note * 70, start + 0.18);
        envelope.gain.setValueAtTime(0.0001, start);
        envelope.gain.exponentialRampToValueAtTime(0.022, start + 0.025);
        envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.19);
        bird.connect(envelope).connect(context.destination);
        bird.start(start);
        bird.stop(start + 0.2);
      }
    };
    chirp();
    birdTimerRef.current = window.setInterval(chirp, 7400);
    void context.resume();
    setSoundEnabled(true);
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

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

    setReady(true);
    setError("");

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMappingExposure = 0.95;

    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0e2f3d, 0.0065);

    // Ánh sáng môi trường
    const hemiLight = new THREE.HemisphereLight("#fff3dc", "#17414a", 1.9);
    scene.add(hemiLight);

    const sunlight = new THREE.DirectionalLight("#ffe8c8", 2.4);
    sunlight.position.set(-20, 30, 18);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.set(1024, 1024);
    sunlight.shadow.camera.near = 1;
    sunlight.shadow.camera.far = 140;
    sunlight.shadow.bias = -0.00015;
    scene.add(sunlight);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      38,
      host.clientWidth / host.clientHeight,
      0.1,
      2000
    );
    camera.position.set(0, 10, 16);

    // Orbit Controls
    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.minDistance = 6;
    controls.maxDistance = 65;
    controls.maxPolarAngle = 1.42;
    controls.minPolarAngle = 0.45;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 1.5, -12);
    controls.update();

    // Hệ thống chuyển góc nhìn mượt mà (smooth camera transition)
    let targetCameraPos = camera.position.clone();
    let targetControlsTarget = controls.target.clone();
    let isTransitioningCamera = false;

    setCameraViewRef.current = (view: ViewPreset) => {
      setCurrentView(view);
      isTransitioningCamera = true;
      if (view === "overview") {
        targetCameraPos.set(0, 10, 16);
        targetControlsTarget.set(0, 1.5, -12);
      } else if (view === "boat") {
        targetCameraPos.set(6.2, 3.2, -1.8);
        targetControlsTarget.set(4, 1.2, -5);
      } else if (view === "basket") {
        targetCameraPos.set(-6.2, 2.0, 5.8);
        targetControlsTarget.set(-8, 0.8, 3);
      }
    };

    resetRef.current = () => {
      setCameraViewRef.current?.("overview");
    };

    // ==========================================
    // 1. BẦU TRỜ CHÂN THỰC VỚI SKY SHADER & RAYLEIGH
    // ==========================================
    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);

    const skyUniforms = sky.material.uniforms;
    skyUniforms["turbidity"].value = 6;
    skyUniforms["rayleigh"].value = 2.0;
    skyUniforms["mieCoefficient"].value = 0.005;
    skyUniforms["mieDirectionalG"].value = 0.82;

    const sun = new THREE.Vector3();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    let environmentTarget: THREE.WebGLRenderTarget | null = null;

    const updateSun = (elevation: number, azimuth: number) => {
      const phi = THREE.MathUtils.degToRad(90 - elevation);
      const theta = THREE.MathUtils.degToRad(azimuth);
      sun.setFromSphericalCoords(1, phi, theta);

      sky.material.uniforms["sunPosition"].value.copy(sun);
      water.material.uniforms["sunDirection"].value.copy(sun).normalize();
      environmentTarget?.dispose();
      environmentTarget = pmremGenerator.fromScene(sky as any);
      scene.environment = environmentTarget.texture;
    };

    // ==========================================
    // 2. MẶT BIỂN LƯỢN SÓNG VỚI WATER SHADER
    // ==========================================
    const waterGeometry = new THREE.PlaneGeometry(1400, 1400);
    const waterNormals = createProceduralWaterNormalTexture();

    const water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: waterNormals,
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffe2b8,
      waterColor: 0x0a3f55,
      distortionScale: 2.1,
      fog: scene.fog !== undefined,
    });
    water.rotation.x = -Math.PI / 2;
    scene.add(water);

    // Xử lý chuyển đổi thời gian: Bình minh / Ban ngày / Hoàng hôn
    const applyTimeMode = (mode: TimeMode) => {
      if (mode === "dawn") {
        updateSun(5.5, 175);
        water.material.uniforms["sunColor"].value.setHex(0xffb066);
        water.material.uniforms["waterColor"].value.setHex(0x0c394d);
        hemiLight.color.set("#ffeedd");
        hemiLight.groundColor.set("#153644");
        sunlight.color.set("#ffcaa0");
        sunlight.intensity = 2.2;
        renderer.toneMappingExposure = 0.95;
        if (scene.fog) (scene.fog as THREE.FogExp2).color.set(0x0e2f3d);
      } else if (mode === "day") {
        updateSun(32, 175);
        water.material.uniforms["sunColor"].value.setHex(0xffffff);
        water.material.uniforms["waterColor"].value.setHex(0x024563);
        hemiLight.color.set("#ffffff");
        hemiLight.groundColor.set("#1a4f5c");
        sunlight.color.set("#fffdfa");
        sunlight.intensity = 2.6;
        renderer.toneMappingExposure = 1.05;
        if (scene.fog) (scene.fog as THREE.FogExp2).color.set(0x134659);
      } else {
        // Sunset
        updateSun(2.0, 180);
        water.material.uniforms["sunColor"].value.setHex(0xff6b35);
        water.material.uniforms["waterColor"].value.setHex(0x082433);
        hemiLight.color.set("#fca5a5");
        hemiLight.groundColor.set("#111827");
        sunlight.color.set("#f97316");
        sunlight.intensity = 1.8;
        renderer.toneMappingExposure = 0.88;
        if (scene.fog) (scene.fog as THREE.FogExp2).color.set(0x1a1a2e);
      }
    };

    switchTimeRef.current = (mode: TimeMode) => {
      setTimeMode(mode);
      applyTimeMode(mode);
    };

    // Khởi tạo ở chế độ Bình minh biển Trung Bộ
    applyTimeMode("dawn");

    // ==========================================
    // 3. THUYỀN GỖ ĐÁNH CÁ TRUYỀN THỐNG MIỀN TRUNG
    // ==========================================
    const boatGroup = new THREE.Group();

    // Thân thuyền nan gỗ uốn lượn
    const hullShape = new THREE.Shape();
    hullShape.moveTo(-3, -0.62);
    hullShape.quadraticCurveTo(-2.8, -0.84, -2.2, -0.82);
    hullShape.lineTo(1.65, -0.49);
    hullShape.quadraticCurveTo(2.65, -0.27, 3, 0);
    hullShape.quadraticCurveTo(2.65, 0.27, 1.65, 0.49);
    hullShape.lineTo(-2.2, 0.82);
    hullShape.quadraticCurveTo(-2.8, 0.84, -3, 0.62);
    hullShape.closePath();

    const hullGeo = new THREE.ExtrudeGeometry(hullShape, {
      depth: 0.58,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.08,
    });
    hullGeo.rotateX(-Math.PI / 2);
    const woodMaterial = new THREE.MeshStandardMaterial({
      color: "#5c3d26",
      roughness: 0.65,
      metalness: 0.05,
    });
    woodMaterial.name = "hull-wood";
    const hullMesh = new THREE.Mesh(hullGeo, woodMaterial);
    hullMesh.position.y = 0.1;
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    boatGroup.add(hullMesh);

    // Boong thuyền gỗ
    const deck = new THREE.Mesh(
      new THREE.ShapeGeometry(hullShape),
      new THREE.MeshStandardMaterial({
        color: "#9c7348",
        roughness: 0.75,
        side: THREE.DoubleSide,
      })
    );
    deck.geometry.rotateX(-Math.PI / 2);
    deck.position.y = 0.68;
    deck.receiveShadow = true;
    boatGroup.add(deck);

    // Cột buồm chính
    const mastMaterial = new THREE.MeshStandardMaterial({
      color: "#422a18",
      roughness: 0.8,
    });
    const mastMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.11, 3.8, 10),
      mastMaterial
    );
    mastMesh.position.set(-0.35, 2.58, 0);
    mastMesh.castShadow = true;
    boatGroup.add(mastMesh);

    // Cờ đỏ sao vàng / Cờ vạn chài trên đỉnh cột buồm
    const flagGeo = new THREE.PlaneGeometry(0.48, 0.3);
    const flagMat = new THREE.MeshStandardMaterial({
      color: "#dc2626",
      side: THREE.DoubleSide,
      roughness: 0.7,
    });
    const flagMesh = new THREE.Mesh(flagGeo, flagMat);
    flagMesh.position.set(-0.1, 4.35, 0);
    flagMesh.rotation.y = 0.2;
    boatGroup.add(flagMesh);

    // Mắt thuyền truyền thống (Văn hóa vạn chài miền Trung bảo vệ ngư dân)
    const eyeWhiteGeo = new THREE.CircleGeometry(0.12, 16);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: "#ffffff", side: THREE.DoubleSide });
    const eyeBlackGeo = new THREE.CircleGeometry(0.06, 16);
    const eyeBlackMat = new THREE.MeshBasicMaterial({ color: "#111827", side: THREE.DoubleSide });

    // Mắt mạn trái
    const eyeLeftWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    eyeLeftWhite.position.set(2.4, 0.45, 0.32);
    eyeLeftWhite.rotation.y = Math.PI / 2;
    const eyeLeftBlack = new THREE.Mesh(eyeBlackGeo, eyeBlackMat);
    eyeLeftBlack.position.set(2.4, 0.45, 0.33);
    eyeLeftBlack.rotation.y = Math.PI / 2;
    boatGroup.add(eyeLeftWhite);
    boatGroup.add(eyeLeftBlack);

    // Mắt mạn phải
    const eyeRightWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    eyeRightWhite.position.set(2.4, 0.45, -0.32);
    eyeRightWhite.rotation.y = -Math.PI / 2;
    const eyeRightBlack = new THREE.Mesh(eyeBlackGeo, eyeBlackMat);
    eyeRightBlack.position.set(2.4, 0.45, -0.33);
    eyeRightBlack.rotation.y = -Math.PI / 2;
    boatGroup.add(eyeRightWhite);
    boatGroup.add(eyeRightBlack);

    // Cánh buồm vải thô màu nâu nhạt
    const sailMat = new THREE.MeshStandardMaterial({
      color: "#e8d29b",
      roughness: 0.88,
      side: THREE.DoubleSide,
    });
    sailMat.name = "sail-canvas";
    const addSail = (vertices: number[], material = sailMat) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setIndex([0, 1, 2, 0, 2, 3]);
      geometry.computeVertexNormals();
      const sail = new THREE.Mesh(geometry, material);
      sail.castShadow = true;
      boatGroup.add(sail);
    };
    addSail([-0.3, 4.1, 0.08, 1.45, 3.8, 0.08, 2.1, 1.05, 0.08, -0.3, 1.05, 0.08]);

    // Cột buồm đuôi thuyền
    const aftMast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.08, 2.7, 8),
      mastMaterial
    );
    aftMast.position.set(-1.9, 2.05, 0);
    aftMast.castShadow = true;
    boatGroup.add(aftMast);
    const aftSailMat = sailMat.clone();
    aftSailMat.name = "aft-sail-canvas";
    aftSailMat.color.set("#d8bd7e");
    addSail([-1.9, 3.3, -0.07, -0.8, 3.05, -0.07, -0.5, 1.05, -0.07, -1.9, 1.05, -0.07], aftSailMat);

    // Lưới đánh cá vắt ngang đuôi thuyền
    const netGeo = new THREE.TorusGeometry(0.42, 0.16, 8, 16);
    netGeo.scale(1.2, 0.7, 1);
    const netMat = new THREE.MeshStandardMaterial({
      color: "#1e5b53",
      roughness: 0.95,
      wireframe: true,
    });
    const netMesh = new THREE.Mesh(netGeo, netMat);
    netMesh.position.set(-2.2, 0.85, 0);
    netMesh.rotation.x = Math.PI / 2;
    boatGroup.add(netMesh);

    // Đèn bão treo mũi thuyền phát ánh sáng vàng ấm
    const lanternGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const lanternMat = new THREE.MeshBasicMaterial({ color: "#fef08a" });
    const lanternMesh = new THREE.Mesh(lanternGeo, lanternMat);
    lanternMesh.position.set(2.7, 0.85, 0);
    boatGroup.add(lanternMesh);

    const lanternLight = new THREE.PointLight("#ffaa33", 2.2, 14);
    lanternLight.position.set(2.7, 0.85, 0);
    boatGroup.add(lanternLight);

    boatGroup.position.set(4, 0, -5);
    boatGroup.rotation.y = -0.4;
    boatGroup.scale.setScalar(1.25);
    scene.add(boatGroup);

    const fishingBoats: Array<{ group: THREE.Group; phase: number; amplitude: number }> = [
      { group: boatGroup, phase: 0, amplitude: 0.35 },
    ];

    // Đoàn thuyền đánh cá ngoài khơi xa
    [
      { x: -11, z: 0, scale: 0.92, rotation: 0.35, phase: 1.4 },
      { x: 12, z: -9, scale: 0.84, rotation: -0.65, phase: 2.7 },
      { x: -3, z: -18, scale: 0.72, rotation: 0.8, phase: 4.2 },
      { x: 17, z: -29, scale: 0.66, rotation: -0.4, phase: 5.3 },
      { x: -17, z: -34, scale: 0.62, rotation: 0.7, phase: 2.2 },
      { x: 8, z: 8, scale: 0.58, rotation: -0.8, phase: 3.5 },
    ].forEach(({ x, z, scale, rotation, phase }) => {
      const boat = boatGroup.clone(true);
      boat.scale.setScalar(scale);
      boat.position.set(x, 0, z);
      boat.rotation.y = rotation;
      boat.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.material && !Array.isArray(mesh.material)) {
          mesh.material = mesh.material.clone();
          if (mesh.material instanceof THREE.MeshStandardMaterial && mesh.material.name.includes("sail-canvas")) {
            mesh.material.color.set(x < 0 ? "#e6d49f" : "#c9d2c1");
          } else if (mesh.material instanceof THREE.MeshStandardMaterial && mesh.material.name === "hull-wood") {
            mesh.material.color.set(x < 0 ? "#755239" : "#493b30");
          }
        }
      });
      scene.add(boat);
      fishingBoats.push({ group: boat, phase, amplitude: 0.22 * scale });
    });

    // ==========================================
    // 4. THUYỀN THÚNG TRE TRUYỀN THỐNG XỨ TRUNG
    // ==========================================
    const basketBoat = new THREE.Group();
    const basketGeo = new THREE.SphereGeometry(1.65, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    basketGeo.scale(1, 0.62, 1);
    const wovenBambooTexture = createWovenBambooTexture();
    const basketMat = new THREE.MeshStandardMaterial({
      map: wovenBambooTexture,
      bumpMap: wovenBambooTexture,
      bumpScale: 0.06,
      color: "#946f48",
      roughness: 0.88,
      side: THREE.DoubleSide,
    });
    const basketMesh = new THREE.Mesh(basketGeo, basketMat);
    basketMesh.rotation.x = Math.PI;
    basketMesh.position.y = 0.72;
    basketMesh.castShadow = true;
    basketMesh.receiveShadow = true;
    basketBoat.add(basketMesh);

    // Vành tre bao quanh miệng thúng
    const rimGeo = new THREE.TorusGeometry(1.66, 0.09, 8, 28);
    rimGeo.rotateX(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({ color: "#6e4b25", roughness: 0.9 });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.y = 0.72;
    rimMesh.castShadow = true;
    basketBoat.add(rimMesh);

    // Mái chèo tre gác ngang thuyền thúng
    const oarPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 2.6, 8),
      new THREE.MeshStandardMaterial({ color: "#a17849", roughness: 0.8 })
    );
    oarPole.rotation.z = Math.PI / 3;
    oarPole.rotation.y = 0.4;
    oarPole.position.set(0.3, 0.78, 0);
    basketBoat.add(oarPole);

    basketBoat.position.set(-8, 0, 3);
    scene.add(basketBoat);

    // ==========================================
    // 5. ĐÈN HOA ĐĂNG NGUYỆN CẦU TRÔI TRÊN SÓNG BIỂN
    // Tương ứng nghi thức "Thả lời chúc lành vào lòng biển mẹ"
    // ==========================================
    const lanterns: Array<{
      group: THREE.Group;
      baseX: number;
      baseZ: number;
      phase: number;
      driftSpeed: number;
      candleLight: THREE.PointLight;
    }> = [];

    const lanternColors = ["#f472b6", "#fb7185", "#fde047", "#fed7aa", "#fbcfe8"];
    const petalGeo = new THREE.ConeGeometry(0.24, 0.32, 4);
    petalGeo.rotateX(Math.PI);

    for (let i = 0; i < 16; i++) {
      const lanternGroup = new THREE.Group();

      // Cánh hoa sen bằng giấy hoa đăng
      const flowerColor = lanternColors[i % lanternColors.length];
      const petalMat = new THREE.MeshStandardMaterial({
        color: flowerColor,
        roughness: 0.6,
        side: THREE.DoubleSide,
      });

      for (let p = 0; p < 6; p++) {
        const petal = new THREE.Mesh(petalGeo, petalMat);
        const angle = (p / 6) * Math.PI * 2;
        petal.position.set(Math.cos(angle) * 0.22, 0.12, Math.sin(angle) * 0.22);
        petal.rotation.y = angle;
        petal.rotation.z = 0.35;
        lanternGroup.add(petal);
      }

      // Đế hoa đăng nổi
      const baseGeo = new THREE.CylinderGeometry(0.28, 0.24, 0.08, 8);
      const baseMat = new THREE.MeshStandardMaterial({ color: "#3d2b1f", roughness: 0.9 });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.y = 0.04;
      lanternGroup.add(baseMesh);

      // Ngọn nến phát sáng lung linh
      const candleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.18, 8);
      const candleMat = new THREE.MeshStandardMaterial({ color: "#fef08a" });
      const candle = new THREE.Mesh(candleGeo, candleMat);
      candle.position.y = 0.15;
      lanternGroup.add(candle);

      const flameGeo = new THREE.ConeGeometry(0.045, 0.12, 6);
      const flameMat = new THREE.MeshBasicMaterial({ color: "#f59e0b" });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.y = 0.28;
      lanternGroup.add(flame);

      // Đèn nến hoa đăng tỏa sáng lấp lánh trên mặt nước
      const candleLight = new THREE.PointLight("#f59e0b", 1.8, 5);
      candleLight.position.y = 0.3;
      lanternGroup.add(candleLight);

      // Vị trí các hoa đăng trôi dập dềnh quanh thuyền và bờ nước
      const angle = (i / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const radius = 6 + (i % 4) * 3.8 + Math.random() * 2;
      const baseX = Math.cos(angle) * radius - 1;
      const baseZ = Math.sin(angle) * (radius * 0.7) - 3;

      lanternGroup.position.set(baseX, 0, baseZ);
      lanternGroup.scale.setScalar(0.95);
      scene.add(lanternGroup);

      lanterns.push({
        group: lanternGroup,
        baseX,
        baseZ,
        phase: i * 0.75,
        driftSpeed: 0.02 + Math.random() * 0.025,
        candleLight,
      });
    }

    // ==========================================
    // 6. ĐẢO ĐÁ VÙNG DUYÊN HẢI VỚI CÂY CỎ & RẶNG ĐÁ
    // ==========================================
    const terrainTextureCanvas = document.createElement("canvas");
    terrainTextureCanvas.width = 512;
    terrainTextureCanvas.height = 512;
    const terrainTextureContext = terrainTextureCanvas.getContext("2d")!;
    const terrainImage = terrainTextureContext.createImageData(512, 512);
    let textureSeed = 82371;
    for (let i = 0; i < terrainImage.data.length; i += 4) {
      textureSeed = (textureSeed * 1664525 + 1013904223) >>> 0;
      const grain = 190 + (textureSeed % 58);
      terrainImage.data[i] = grain;
      terrainImage.data[i + 1] = grain;
      terrainImage.data[i + 2] = grain;
      terrainImage.data[i + 3] = 255;
    }
    terrainTextureContext.putImageData(terrainImage, 0, 0);
    const terrainTexture = new THREE.CanvasTexture(terrainTextureCanvas);
    terrainTexture.colorSpace = THREE.SRGBColorSpace;
    terrainTexture.wrapS = THREE.RepeatWrapping;
    terrainTexture.wrapT = THREE.RepeatWrapping;
    terrainTexture.repeat.set(3, 2);

    const terrainWidth = 58;
    const terrainDepth = 20;
    const segmentsX = 112;
    const segmentsZ = 48;
    const terrainPositions: number[] = [];
    const terrainColors: number[] = [];
    const terrainUvs: number[] = [];
    const terrainIndices: number[] = [];
    const shoreColor = new THREE.Color("#77786c");
    const scrubColor = new THREE.Color("#52684a");
    const forestColor = new THREE.Color("#35563a");
    const summitColor = new THREE.Color("#53664b");

    const terrainHeightAt = (x: number, z: number) => {
      const nx = x / (terrainWidth * 0.5);
      const nz = z / (terrainDepth * 0.5);
      const edge = Math.max(0, 1 - nx * nx - nz * nz * 0.92);
      const ridge =
        0.68 +
        0.26 * Math.exp(-(((x + 9) / 8) ** 2)) +
        0.34 * Math.exp(-(((x - 5) / 7) ** 2)) +
        0.15 * Math.exp(-(((x - 17) / 5) ** 2));
      const roughness =
        0.28 * Math.sin(x * 0.72 + z * 0.38) +
        0.16 * Math.sin(x * 1.41 - z * 0.83) +
        0.1 * Math.cos(z * 1.8 + x * 0.5);
      return -1.6 + 10.5 * Math.pow(edge, 0.68) * ridge + roughness * Math.sqrt(edge);
    };

    for (let row = 0; row <= segmentsZ; row++) {
      const z = (row / segmentsZ - 0.5) * terrainDepth;
      for (let column = 0; column <= segmentsX; column++) {
        const x = (column / segmentsX - 0.5) * terrainWidth;
        const height = terrainHeightAt(x, z);
        terrainPositions.push(x, height, z);
        terrainUvs.push(column / segmentsX, row / segmentsZ);

        const color =
          height < 0.55
            ? shoreColor.clone().lerp(scrubColor, THREE.MathUtils.smoothstep(height, -0.2, 1.2))
            : scrubColor.clone().lerp(height > 6.4 ? summitColor : forestColor, THREE.MathUtils.smoothstep(height, 0.5, 5.4));
        const fleck = 0.94 + 0.1 * Math.sin(x * 4.3 + z * 5.1);
        terrainColors.push(color.r * fleck, color.g * fleck, color.b * fleck);
      }
    }

    for (let row = 0; row < segmentsZ; row++) {
      for (let column = 0; column < segmentsX; column++) {
        const a = row * (segmentsX + 1) + column;
        const b = a + 1;
        const c = a + segmentsX + 1;
        const d = c + 1;
        terrainIndices.push(a, c, b, b, c, d);
      }
    }

    const terrainGeometry = new THREE.BufferGeometry();
    terrainGeometry.setAttribute("position", new THREE.Float32BufferAttribute(terrainPositions, 3));
    terrainGeometry.setAttribute("color", new THREE.Float32BufferAttribute(terrainColors, 3));
    terrainGeometry.setAttribute("uv", new THREE.Float32BufferAttribute(terrainUvs, 2));
    terrainGeometry.setIndex(terrainIndices);
    terrainGeometry.computeVertexNormals();

    const terrainMaterial = new THREE.MeshStandardMaterial({
      map: terrainTexture,
      bumpMap: terrainTexture,
      bumpScale: 0.08,
      vertexColors: true,
      roughness: 0.94,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    const island = new THREE.Mesh(terrainGeometry, terrainMaterial);
    island.position.set(0, 0, -54);
    island.receiveShadow = true;
    scene.add(island);

    // Mỏm đá hoa cương ven biển
    const rockMaterial = new THREE.MeshStandardMaterial({ color: "#8b8370", map: terrainTexture, roughness: 0.9 });
    const rockGeometry = new THREE.IcosahedronGeometry(1, 1);
    for (let i = 0; i < 34; i++) {
      const seed = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      const random = seed - Math.floor(seed);
      const x = -25 + random * 50;
      const z = 4.7 + Math.sin(i * 1.71) * 2.2 + (random - 0.5) * 1.8;
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(x, Math.max(-0.1, terrainHeightAt(x, z) + 0.05), -54 + z);
      const size = 0.42 + random * 0.68;
      rock.scale.set(size * (0.8 + random * 0.5), size * (0.48 + random * 0.28), size * (0.72 + random * 0.45));
      rock.rotation.set(i * 0.17, i * 0.41, i * 0.13);
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
    }

    // Rặng cây xanh trên sườn núi đảo
    const treeTrunkMaterial = new THREE.MeshStandardMaterial({ color: "#574538", roughness: 0.96 });
    const canopyMaterials = ["#34553b", "#3f6342", "#496943", "#526c45"].map((color) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.98 })
    );
    const canopyGeometry = new THREE.IcosahedronGeometry(0.8, 1);
    for (let i = 0; i < 17; i++) {
      const x = -19 + i * 2.35;
      const localZ = -1.8 + Math.sin(i * 2.2) * 3.4;
      const ground = terrainHeightAt(x, localZ);
      if (ground < 1.3) continue;
      const tree = new THREE.Group();
      const height = 1.1 + (i % 4) * 0.24;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.15, height, 7), treeTrunkMaterial);
      trunk.position.y = height * 0.5;
      tree.add(trunk);
      for (let crown = 0; crown < 3; crown++) {
        const foliage = new THREE.Mesh(canopyGeometry, canopyMaterials[(i + crown) % canopyMaterials.length]);
        foliage.position.set((crown - 1) * 0.38, height + (crown === 1 ? 0.42 : 0.12), (crown % 2 ? 0.24 : -0.18));
        foliage.scale.set(0.68 + (i % 3) * 0.1, 0.56 + (crown % 2) * 0.16, 0.62 + (i % 2) * 0.12);
        tree.add(foliage);
      }
      tree.position.set(x, ground - 0.05, -54 + localZ);
      tree.rotation.y = i * 0.71;
      scene.add(tree);
    }

    // ==========================================
    // 7. ĐÀN HẢI ÂU BAY LƯỢN TRÊN MẶT BIỂN
    // ==========================================
    const gulls: Array<{
      group: THREE.Group;
      radius: number;
      speed: number;
      angle: number;
      height: number;
      wingL: THREE.Mesh;
      wingR: THREE.Mesh;
    }> = [];

    for (let i = 0; i < 14; i++) {
      const gullGroup = new THREE.Group();
      const wingMat = new THREE.MeshBasicMaterial({
        color: "#f8fafc",
        side: THREE.DoubleSide,
      });

      const makeWing = (side: -1 | 1) => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute([
          0, 0, 0,
          side * 0.8, 0.19, 0,
          side * 0.48, -0.13, 0.025,
          side * 0.18, -0.08, 0.02,
        ], 3));
        geometry.setIndex([0, 1, 2, 0, 2, 3]);
        geometry.computeVertexNormals();
        const wing = new THREE.Mesh(geometry, wingMat);
        gullGroup.add(wing);
        return wing;
      };
      const wingL = makeWing(-1);
      const wingR = makeWing(1);
      const birdBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 10, 8),
        new THREE.MeshBasicMaterial({ color: "#e2e8f0" })
      );
      birdBody.scale.set(0.72, 0.72, 1.8);
      gullGroup.add(birdBody);
      gullGroup.scale.setScalar(1.2);

      scene.add(gullGroup);

      gulls.push({
        group: gullGroup,
        radius: 12 + Math.random() * 12,
        speed: 0.1 + Math.random() * 0.09,
        angle: (i / 14) * Math.PI * 2,
        height: 9 + Math.random() * 7,
        wingL,
        wingR,
      });
    }

    // ==========================================
    // 8. ANIMATION LOOP
    // ==========================================
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.05);
      const time = clock.elapsedTime;

      // Xử lý chuyển động camera mượt mà
      if (isTransitioningCamera) {
        camera.position.lerp(targetCameraPos, 0.06);
        controls.target.lerp(targetControlsTarget, 0.06);
        if (
          camera.position.distanceTo(targetCameraPos) < 0.05 &&
          controls.target.distanceTo(targetControlsTarget) < 0.05
        ) {
          camera.position.copy(targetCameraPos);
          controls.target.copy(targetControlsTarget);
          isTransitioningCamera = false;
        }
      }

      // 1. Chuyển động sóng biển Water Shader
      water.material.uniforms["time"].value += delta;

      // 2. Thuyền gỗ nhấp nhô theo sóng biển
      fishingBoats.forEach(({ group, phase, amplitude }) => {
        group.position.y = Math.sin(time * 1.6 + phase) * amplitude;
        group.rotation.z = Math.sin(time * 1.2 + phase) * 0.045;
        group.rotation.x = -0.4 + Math.cos(time * 1.4 + phase) * 0.025;
      });

      // Thuyền thúng dập dềnh
      basketBoat.position.y = Math.sin(time * 2.1 + 1) * 0.25;
      basketBoat.rotation.z = Math.sin(time * 1.8 + 1) * 0.08;
      basketBoat.rotation.x = Math.cos(time * 1.5 + 1) * 0.06;

      // 3. Đèn hoa đăng dập dềnh và ánh lửa lung linh
      lanterns.forEach((lan) => {
        lan.group.position.y = Math.sin(time * 2.2 + lan.phase) * 0.14 + 0.04;
        lan.group.position.x = lan.baseX + Math.sin(time * 0.4 + lan.phase) * 0.35;
        lan.group.position.z = lan.baseZ + Math.cos(time * 0.35 + lan.phase) * 0.25;
        lan.group.rotation.z = Math.sin(time * 1.8 + lan.phase) * 0.08;
        lan.group.rotation.x = Math.cos(time * 1.6 + lan.phase) * 0.06;

        // Nhịp lửa bập bùng
        lan.candleLight.intensity =
          1.7 + Math.sin(time * 10 + lan.phase * 3) * 0.35 + (Math.random() - 0.5) * 0.15;
      });

      // 4. Hải âu bay lượn & đập cánh
      gulls.forEach((g) => {
        g.angle += g.speed * delta;
        g.group.position.x = Math.cos(g.angle) * g.radius;
        g.group.position.z = Math.sin(g.angle) * (g.radius * 0.7) - 23;
        g.group.position.y = g.height + Math.sin(g.angle * 3) * 1.5;

        g.group.rotation.y = -g.angle + Math.PI / 2;

        const flap = Math.sin(time * 8 + g.radius) * 0.38;
        g.wingL.rotation.z = flap;
        g.wingR.rotation.z = -flap;
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!host || !host.clientWidth || !host.clientHeight) return;
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(host);
    handleResize();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (birdTimerRef.current !== null) window.clearInterval(birdTimerRef.current);
      birdTimerRef.current = null;
      if (audioContextRef.current) void audioContextRef.current.close();
      audioContextRef.current = null;
      resizeObserver.disconnect();
      controls.dispose();
      environmentTarget?.dispose();
      pmremGenerator.dispose();
      disposeThreeScene(scene);
      renderer.dispose();
      if (host.contains(canvas)) {
        host.removeChild(canvas);
      }
    };
  }, []);

  const handleToggleTimeMode = () => {
    const next: TimeMode = timeMode === "dawn" ? "day" : timeMode === "day" ? "sunset" : "dawn";
    setTimeMode(next);
    if (switchTimeRef.current) {
      switchTimeRef.current(next);
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-rose-500/40 bg-[#0c1f30] shadow-xl group">
      {/* 3D Canvas Host */}
      <div
        ref={hostRef}
        className="w-full h-80 sm:h-96 md:h-[450px] cursor-grab active:cursor-grabbing"
      />

      {/* Top HUD Badge */}
      <div className="absolute top-3.5 left-4 pointer-events-none flex items-center gap-2">
        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-black/70 text-amber-300 border border-amber-500/40 backdrop-blur-md flex items-center gap-2 shadow-sm">
          <Waves className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>BIỂN MIỀN TRUNG 3D · SÓNG BIỂN & THUYỀN VẠN CHÀI</span>
        </span>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-3.5 right-4 flex items-center gap-2">
        {/* Toggle Sound */}
        <button
          type="button"
          aria-label={soundEnabled ? "Tắt âm thanh sóng biển" : "Bật âm thanh sóng biển và hải âu"}
          aria-pressed={soundEnabled}
          onClick={handleToggleSound}
          title={soundEnabled ? "Tắt âm thanh biển" : "Bật tiếng sóng biển và chim hải âu"}
          className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-amber-200 hover:text-white border border-white/10 backdrop-blur-md transition-all cursor-pointer"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Toggle Time Mode */}
        <button
          type="button"
          onClick={handleToggleTimeMode}
          title={
            timeMode === "dawn"
              ? "Đang là Bình minh (Bấm để chuyển Ban ngày)"
              : timeMode === "day"
              ? "Đang là Ban ngày (Bấm để chuyển Hoàng hôn)"
              : "Đang là Hoàng hôn (Bấm để chuyển Bình minh)"
          }
          className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-amber-300 hover:text-white border border-white/10 backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium"
        >
          {timeMode === "dawn" ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Bình minh</span>
            </>
          ) : timeMode === "day" ? (
            <>
              <Sun className="w-3.5 h-3.5 text-yellow-300" />
              <span>Ban ngày</span>
            </>
          ) : (
            <>
              <Sunset className="w-3.5 h-3.5 text-orange-400" />
              <span>Hoàng hôn</span>
            </>
          )}
        </button>

        

        {/* Reset Camera */}
        <button
          type="button"
          onClick={() => resetRef.current()}
          title="Đặt lại góc nhìn"
          className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-stone-300 hover:text-white border border-white/10 backdrop-blur-md transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-xs text-stone-400 p-4 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
