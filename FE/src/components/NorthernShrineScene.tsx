import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Button } from "./ui/button";
import { Flame, RotateCcw, Sparkles, Volume2, ShieldCheck, Eye } from "lucide-react";

// 1. Texture Gạch Bát Tràng nung thủ công với mạch vôi cổ kính
function createBatTrangTileTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#832e20"; // Màu đỏ gạch nung Bát Tràng
  ctx.fillRect(0, 0, 512, 512);

  const tileSize = 128;
  const gutter = 4;

  for (let y = 0; y < 512; y += tileSize) {
    for (let x = 0; x < 512; x += tileSize) {
      const shade = Math.floor((Math.sin(x * 12.3 + y * 45.6) * 0.5 + 0.5) * 26);
      const r = 138 + shade;
      const g = 48 + Math.floor(shade * 0.5);
      const b = 34 + Math.floor(shade * 0.35);

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x + gutter / 2, y + gutter / 2, tileSize - gutter, tileSize - gutter);

      // Vân xước cổ gạch nung
      ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
      for (let i = 0; i < 6; i++) {
        const sx = x + Math.random() * tileSize;
        const sy = y + Math.random() * tileSize;
        ctx.fillRect(sx, sy, Math.random() * 22, 2);
      }
    }
  }

  // Mạch vôi trắng ngà rêu phong
  ctx.strokeStyle = "rgba(225, 215, 200, 0.85)";
  ctx.lineWidth = gutter;
  for (let i = 0; i <= 512; i += tileSize) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// 2. Texture Hoành Phi "VẠN CỔ ANH LINH" thếp vàng sơn son lộng lẫy
function createHoanhPhiTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext("2d")!;

  // Nền đỏ thắm sơn son
  ctx.fillStyle = "#690f0b";
  ctx.fillRect(0, 0, 512, 160);

  // Viền hoa văn vàng kim đôi
  ctx.strokeStyle = "#eab308";
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 492, 140);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#fef08a";
  ctx.strokeRect(18, 18, 476, 124);

  // Đại tự thư pháp thếp vàng
  ctx.fillStyle = "#fef08a";
  ctx.font = "bold 34px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
  ctx.shadowBlur = 8;
  ctx.fillText("VẠN  CỔ  ANH  LINH", 256, 80);

  return new THREE.CanvasTexture(canvas);
}

// 3. Texture Câu Đối sơn son thiếp vàng
function createCauDoiTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 120;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#5d0e09";
  ctx.fillRect(0, 0, 120, 512);

  ctx.strokeStyle = "#eab308";
  ctx.lineWidth = 5;
  ctx.strokeRect(6, 6, 108, 500);

  ctx.fillStyle = "#fef08a";
  ctx.font = "bold 21px serif";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
  ctx.shadowBlur = 6;

  const chars = text.split("");
  const startY = 42;
  const step = 44;
  chars.forEach((c, idx) => {
    ctx.fillText(c, 60, startY + idx * step);
  });

  return new THREE.CanvasTexture(canvas);
}

// 4. Texture Hạt khói trầm hương mềm mại (Volumetric Feathered Smoke Puff)
function createSmokePuffTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(240, 235, 225, 0.85)");
  gradient.addColorStop(0.35, "rgba(220, 212, 200, 0.45)");
  gradient.addColorStop(0.7, "rgba(180, 172, 160, 0.14)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 5. Texture Đốm sáng linh khí / Tàn nhang vàng bay bổng (Golden Sparkle Texture)
function createGoldenSparkleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255, 245, 200, 1)");
  gradient.addColorStop(0.3, "rgba(245, 180, 60, 0.7)");
  gradient.addColorStop(0.7, "rgba(215, 120, 30, 0.2)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  return new THREE.CanvasTexture(canvas);
}

// Hàm phát thanh âm chuông đồng thiêng liêng (528Hz Harmonic Bell Chime)
function playSacredBellSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Tần số chuông thiền Solfeggio 528Hz (Tần số chuyển hóa & an tĩnh tâm thức)
    const baseFreq = 528;
    const harmonics = [
      { freq: baseFreq, gain: 0.35, decay: 4.5 },
      { freq: baseFreq * 1.5, gain: 0.15, decay: 3.2 },
      { freq: baseFreq * 2.05, gain: 0.08, decay: 2.4 },
      { freq: baseFreq * 2.76, gain: 0.04, decay: 1.8 },
    ];

    harmonics.forEach(({ freq, gain, decay }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      gainNode.gain.setValueAtTime(gain, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + decay);
    });
  } catch {
    // Không làm gián đoạn nếu trình duyệt chặn audio tự động
  }
}

export default function NorthernShrineScene() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [incenseLit, setIncenseLit] = useState(true);
  const [error, setError] = useState("");

  const resetRef = useRef<() => void>(() => {});
  const toggleIncenseRef = useRef<() => void>(() => {});
  const focusAltarRef = useRef<() => void>(() => {});

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
    renderer.toneMappingExposure = 1.25;

    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    host.appendChild(canvas);

    // Không gian phủ điện thâm nghiêm ấm cúng
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0d0704");
    scene.fog = new THREE.FogExp2("#0d0704", 0.045);

    // Camera phối cảnh nghệ thuật
    const camera = new THREE.PerspectiveCamera(
      40,
      host.clientWidth / host.clientHeight,
      0.1,
      40
    );
    camera.position.set(0, 2.2, 5.2);

    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.minDistance = 2.6;
    controls.maxDistance = 8.0;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minPolarAngle = 0.2;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.25;
    controls.target.set(0, 1.35, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.update();

    resetRef.current = () => {
      camera.position.set(0, 2.2, 5.2);
      controls.target.set(0, 1.35, 0);
      controls.update();
    };

    focusAltarRef.current = () => {
      camera.position.set(0, 1.65, 2.9);
      controls.target.set(0, 1.35, 0.2);
      controls.update();
    };

    // ==========================================
    // 1. HỆ THỐNG ÁNH SÁNG ẤM CÚNG & NẾN LUNG LINH
    // ==========================================
    const ambientLight = new THREE.AmbientLight("#452312", 2.2);
    scene.add(ambientLight);

    // Ánh sáng vàng ấm từ trên rọi xuống án thờ
    const topSpotLight = new THREE.SpotLight("#fff1d0", 3.2, 14, Math.PI / 4, 0.45, 1);
    topSpotLight.position.set(0, 4.8, 2.4);
    topSpotLight.target.position.set(0, 1.3, 0);
    topSpotLight.castShadow = true;
    topSpotLight.shadow.mapSize.width = 1024;
    topSpotLight.shadow.mapSize.height = 1024;
    topSpotLight.shadow.bias = -0.0005;
    scene.add(topSpotLight);
    scene.add(topSpotLight.target);

    // 2 ngọn đèn nến bàn thờ nhấp nháy ánh cam ấm áp
    const candleLeft = new THREE.PointLight("#ff9922", 2.2, 4.8, 1.2);
    candleLeft.position.set(-1.1, 1.95, 0.22);
    scene.add(candleLeft);

    const candleRight = new THREE.PointLight("#ff9922", 2.2, 4.8, 1.2);
    candleRight.position.set(1.1, 1.95, 0.22);
    scene.add(candleRight);

    // ==========================================
    // 2. SÀN GẠCH BÁT TRÀNG CỔ & TƯỜNG GỖ LIM
    // ==========================================
    const floorGeo = new THREE.PlaneGeometry(14, 14);
    floorGeo.rotateX(-Math.PI / 2);
    const floorTexture = createBatTrangTileTexture();
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.58,
      metalness: 0.18,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.receiveShadow = true;
    scene.add(floor);

    // Vách hậu gỗ lim sẫm bóng
    const backWallGeo = new THREE.PlaneGeometry(11, 6.0);
    const woodWallMat = new THREE.MeshStandardMaterial({
      color: "#240f07",
      roughness: 0.7,
      metalness: 0.12,
    });
    const backWall = new THREE.Mesh(backWallGeo, woodWallMat);
    backWall.position.set(0, 3.0, -2.4);
    scene.add(backWall);

    // Bốn Cột Gỗ Lim tròn vân bóng vững chãi
    const woodPillarMat = new THREE.MeshStandardMaterial({
      color: "#38150c",
      roughness: 0.48,
      metalness: 0.2,
    });

    [
      [-2.4, -2.2],
      [2.4, -2.2],
      [-2.4, 2.0],
      [2.4, 2.0],
    ].forEach(([x, z]) => {
      const colGeo = new THREE.CylinderGeometry(0.19, 0.23, 6.0, 24);
      const col = new THREE.Mesh(colGeo, woodPillarMat);
      col.position.set(x, 3.0, z);
      col.castShadow = true;
      scene.add(col);

      // Chân tảng đá xanh kê cột chạm hoa sen cổ
      const baseGeo = new THREE.CylinderGeometry(0.29, 0.33, 0.22, 16);
      const stoneMat = new THREE.MeshStandardMaterial({ color: "#474747", roughness: 0.85 });
      const base = new THREE.Mesh(baseGeo, stoneMat);
      base.position.set(x, 0.11, z);
      scene.add(base);
    });

    // ==========================================
    // 3. HOÀNH PHI & CÂU ĐỐI SƠN SON THẾP VÀNG
    // ==========================================
    // Hoành phi treo chính giữa: "VẠN CỔ ANH LINH"
    const hoanhPhiTex = createHoanhPhiTexture();
    const hoanhPhiGeo = new THREE.PlaneGeometry(3.0, 0.92);
    const hoanhPhiMat = new THREE.MeshStandardMaterial({
      map: hoanhPhiTex,
      roughness: 0.35,
      metalness: 0.3,
    });
    const hoanhPhi = new THREE.Mesh(hoanhPhiGeo, hoanhPhiMat);
    hoanhPhi.position.set(0, 4.0, -2.35);
    scene.add(hoanhPhi);

    // Câu đối bên trái: "CÔNG ĐỨC LƯU TRUYỀN"
    const cauDoiLeftTex = createCauDoiTexture("CÔNGĐỨCLƯUTRUYỀN");
    const cauDoiGeo = new THREE.PlaneGeometry(0.44, 2.7);
    const cauDoiLeftMat = new THREE.MeshStandardMaterial({
      map: cauDoiLeftTex,
      roughness: 0.35,
      metalness: 0.25,
    });
    const cauDoiLeft = new THREE.Mesh(cauDoiGeo, cauDoiLeftMat);
    cauDoiLeft.position.set(-2.0, 2.5, -2.35);
    scene.add(cauDoiLeft);

    // Câu đối bên phải: "HIẾU ĐỄ KẾ THẾ VINH"
    const cauDoiRightTex = createCauDoiTexture("HIẾUĐỄKẾTHẾVINH");
    const cauDoiRightMat = new THREE.MeshStandardMaterial({
      map: cauDoiRightTex,
      roughness: 0.35,
      metalness: 0.25,
    });
    const cauDoiRight = new THREE.Mesh(cauDoiGeo, cauDoiRightMat);
    cauDoiRight.position.set(2.0, 2.5, -2.35);
    scene.add(cauDoiRight);

    // ==========================================
    // 4. ÁN THỜ TAM CẤP SƠN SON THẾP VÀNG & BỘ NGŨ SỰ
    // ==========================================
    const altarGroup = new THREE.Group();

    // Cấp 1 (Bàn tiền tế chính)
    const tableMat = new THREE.MeshStandardMaterial({
      color: "#5e150f", // Sơn son cánh gián cổ
      roughness: 0.4,
      metalness: 0.2,
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: "#eab308",
      metalness: 0.92,
      roughness: 0.25,
    });

    const tableTopGeo = new THREE.BoxGeometry(3.1, 0.12, 1.45);
    const tableTop = new THREE.Mesh(tableTopGeo, tableMat);
    tableTop.position.set(0, 1.15, 0);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    altarGroup.add(tableTop);

    // Nẹp viền vàng kim quanh bàn
    const goldTrimGeo = new THREE.BoxGeometry(3.14, 0.02, 1.49);
    const goldTrim = new THREE.Mesh(goldTrimGeo, goldTrimMat);
    goldTrim.position.set(0, 1.14, 0);
    altarGroup.add(goldTrim);

    // Y môn vải gấm đỏ viền vàng buông trước bàn thờ
    const apronGeo = new THREE.PlaneGeometry(2.9, 0.98);
    const apronMat = new THREE.MeshStandardMaterial({
      color: "#851212",
      roughness: 0.55,
      side: THREE.DoubleSide,
    });
    const apron = new THREE.Mesh(apronGeo, apronMat);
    apron.position.set(0, 0.62, 0.73);
    altarGroup.add(apron);

    // 4 chân bàn quỳ chạm trổ
    const legGeo = new THREE.CylinderGeometry(0.09, 0.08, 1.15, 12);
    [
      [-1.42, 0.6],
      [1.42, 0.6],
      [-1.42, -0.6],
      [1.42, -0.6],
    ].forEach(([x, z]) => {
      const leg = new THREE.Mesh(legGeo, tableMat);
      leg.position.set(x, 0.58, z);
      leg.castShadow = true;
      altarGroup.add(leg);
    });

    // Cấp 2 (Bàn hậu tế cao hơn)
    const upperTableGeo = new THREE.BoxGeometry(2.5, 0.38, 0.68);
    const upperTable = new THREE.Mesh(upperTableGeo, tableMat);
    upperTable.position.set(0, 1.4, -0.38);
    upperTable.castShadow = true;
    altarGroup.add(upperTable);

    // Đồng hun cổ cao cấp (Antique Bronze với Specular lấp lánh)
    const bronzeMat = new THREE.MeshStandardMaterial({
      color: "#995e14",
      metalness: 0.9,
      roughness: 0.28,
    });

    // --- ĐỈNH ĐỒNG CỔ NGHÊ CHẦU ---
    const urnGroup = new THREE.Group();
    // Bụng đỉnh đồng hình cầu dẹt
    const urnBodyGeo = new THREE.SphereGeometry(0.29, 24, 20);
    urnBodyGeo.scale(1.1, 0.85, 1);
    const urnBody = new THREE.Mesh(urnBodyGeo, bronzeMat);
    urnBody.position.y = 0.34;
    urnBody.castShadow = true;
    urnGroup.add(urnBody);

    // Đế đỉnh tam cúc
    const urnBaseGeo = new THREE.CylinderGeometry(0.24, 0.29, 0.12, 16);
    const urnBase = new THREE.Mesh(urnBaseGeo, bronzeMat);
    urnBase.position.y = 0.06;
    urnGroup.add(urnBase);

    // Nắp đỉnh nghê vờn ngọc
    const urnCoverGeo = new THREE.ConeGeometry(0.26, 0.22, 16);
    const urnCover = new THREE.Mesh(urnCoverGeo, bronzeMat);
    urnCover.position.y = 0.56;
    urnGroup.add(urnCover);

    const ngheHeadGeo = new THREE.SphereGeometry(0.065, 12, 12);
    const ngheHead = new THREE.Mesh(ngheHeadGeo, bronzeMat);
    ngheHead.position.y = 0.7;
    urnGroup.add(ngheHead);

    urnGroup.position.set(0, 1.59, -0.38);
    altarGroup.add(urnGroup);

    // --- ĐÔI HẠC NGỰ LƯNG RÙA CHẦU HAI BÊN ---
    [-0.88, 0.88].forEach((sideX) => {
      const craneGroup = new THREE.Group();

      // Rùa đồng đội hạc
      const turtleGeo = new THREE.SphereGeometry(0.15, 14, 10);
      turtleGeo.scale(1.4, 0.5, 1.1);
      const turtle = new THREE.Mesh(turtleGeo, bronzeMat);
      turtle.position.y = 0.05;
      turtle.castShadow = true;
      craneGroup.add(turtle);

      // Chân hạc mảnh mai
      const legGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.46, 8);
      const leg = new THREE.Mesh(legGeo, bronzeMat);
      leg.position.y = 0.29;
      craneGroup.add(leg);

      // Mình hạc thanh thoát
      const bodyGeo = new THREE.SphereGeometry(0.095, 14, 10);
      bodyGeo.scale(1.2, 0.8, 0.9);
      const body = new THREE.Mesh(bodyGeo, bronzeMat);
      body.position.set(0, 0.54, 0);
      body.castShadow = true;
      craneGroup.add(body);

      // Cổ hạc ngậm hoa sen
      const neckGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.34, 8);
      neckGeo.rotateZ(sideX > 0 ? -0.15 : 0.15);
      const neck = new THREE.Mesh(neckGeo, bronzeMat);
      neck.position.set(sideX > 0 ? -0.05 : 0.05, 0.74, 0);
      craneGroup.add(neck);

      craneGroup.position.set(sideX, 1.59, -0.38);
      altarGroup.add(craneGroup);
    });

    // --- LƯ HƯƠNG ĐỒNG CHÍNH ĐẶT PHÍA TRƯỚC ---
    const mainIncenseBurner = new THREE.Group();
    const burnerBowlGeo = new THREE.CylinderGeometry(0.25, 0.19, 0.28, 24);
    const burnerBowl = new THREE.Mesh(burnerBowlGeo, bronzeMat);
    burnerBowl.position.y = 0.14;
    burnerBowl.castShadow = true;
    mainIncenseBurner.add(burnerBowl);

    // Tai rồng hai bên lư hương
    [-0.27, 0.27].forEach((x) => {
      const earGeo = new THREE.TorusGeometry(0.065, 0.022, 8, 14, Math.PI);
      earGeo.rotateZ(x > 0 ? -Math.PI / 2 : Math.PI / 2);
      const ear = new THREE.Mesh(earGeo, bronzeMat);
      ear.position.set(x, 0.16, 0);
      mainIncenseBurner.add(ear);
    });

    // Tro hương bên trong
    const ashGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.02, 20);
    const ashMat = new THREE.MeshStandardMaterial({ color: "#d1d5db", roughness: 0.95 });
    const ash = new THREE.Mesh(ashGeo, ashMat);
    ash.position.y = 0.27;
    mainIncenseBurner.add(ash);

    mainIncenseBurner.position.set(0, 1.21, 0.22);
    altarGroup.add(mainIncenseBurner);

    // --- ĐÔI ĐÈN NẾN ĐỒNG THẮP SÁNG ---
    [-1.1, 1.1].forEach((x) => {
      const standGroup = new THREE.Group();
      const standGeo = new THREE.CylinderGeometry(0.05, 0.12, 0.52, 14);
      const stand = new THREE.Mesh(standGeo, bronzeMat);
      stand.position.y = 0.26;
      stand.castShadow = true;
      standGroup.add(stand);

      // Thân nến sáp đỏ truyền thống
      const candleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.25, 12);
      const candleMat = new THREE.MeshStandardMaterial({ color: "#dc2626", roughness: 0.25 });
      const candle = new THREE.Mesh(candleGeo, candleMat);
      candle.position.y = 0.58;
      standGroup.add(candle);

      // Ngọn lửa nến nhấp nháy phát sáng rực rỡ
      const flameGeo = new THREE.SphereGeometry(0.04, 14, 14);
      flameGeo.scale(0.7, 1.6, 0.7);
      const flameMat = new THREE.MeshBasicMaterial({ color: "#fef08a" });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.y = 0.73;
      standGroup.add(flame);

      standGroup.position.set(x, 1.21, 0.22);
      altarGroup.add(standGroup);
    });

    // --- MÂM NGŨ QUẢ VÀ KỶ BA CHÉN NƯỚC THANH TỊNH ---
    const plateGeo = new THREE.CylinderGeometry(0.25, 0.09, 0.08, 18);
    const ceramicMat = new THREE.MeshStandardMaterial({ color: "#0369a1", roughness: 0.2 });
    const plate = new THREE.Mesh(plateGeo, ceramicMat);
    plate.position.set(-0.62, 1.25, 0.2);
    altarGroup.add(plate);

    // Quả dâng Thánh Mẫu
    const fruitMat1 = new THREE.MeshStandardMaterial({ color: "#ea580c", roughness: 0.35 });
    const fruitMat2 = new THREE.MeshStandardMaterial({ color: "#f59e0b", roughness: 0.3 });
    const fruitMat3 = new THREE.MeshStandardMaterial({ color: "#16a34a", roughness: 0.3 });

    const fruit1 = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 14), fruitMat1);
    fruit1.position.set(-0.62, 1.35, 0.2);
    altarGroup.add(fruit1);

    const fruit2 = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), fruitMat2);
    fruit2.position.set(-0.55, 1.34, 0.24);
    altarGroup.add(fruit2);

    const fruit3 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), fruitMat3);
    fruit3.position.set(-0.68, 1.33, 0.22);
    altarGroup.add(fruit3);

    // Kỷ ba chén nước ngọc thanh tịnh
    const waterTrayGeo = new THREE.BoxGeometry(0.4, 0.04, 0.13);
    const waterTray = new THREE.Mesh(waterTrayGeo, tableMat);
    waterTray.position.set(0.62, 1.23, 0.2);
    altarGroup.add(waterTray);

    [-0.1, 0, 0.1].forEach((cx) => {
      const cupGeo = new THREE.CylinderGeometry(0.026, 0.019, 0.055, 14);
      const cupMat = new THREE.MeshStandardMaterial({ color: "#f8fafc", roughness: 0.12 });
      const cup = new THREE.Mesh(cupGeo, cupMat);
      cup.position.set(0.62 + cx, 1.28, 0.2);
      altarGroup.add(cup);
    });

    scene.add(altarGroup);

    // ==========================================
    // 5. BA NÉN TÂM HƯƠNG & KHÓI TRẦM THỰC THẾ
    // ==========================================
    const incenseGroup = new THREE.Group();
    const stickGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.46, 8);
    const stickMat = new THREE.MeshStandardMaterial({ color: "#78350f" });

    const tipGeo = new THREE.SphereGeometry(0.014, 8, 8);
    const tipMat = new THREE.MeshBasicMaterial({ color: "#ff6600" });

    [-0.045, 0, 0.045].forEach((x, i) => {
      const stick = new THREE.Mesh(stickGeo, stickMat);
      stick.position.set(x, 0.22, i === 1 ? -0.015 : 0.015);
      incenseGroup.add(stick);

      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.position.set(x, 0.45, i === 1 ? -0.015 : 0.015);
      incenseGroup.add(tip);
    });

    // Đốm sáng đỏ từ tàn nhang
    const emberLight = new THREE.PointLight("#ff6600", 1.4, 1.6);
    emberLight.position.set(0, 0.46, 0);
    incenseGroup.add(emberLight);

    incenseGroup.position.set(0, 1.45, 0.22);
    scene.add(incenseGroup);

    // KHÓI TRẦM MỀM MẠI (Volumetric Billboard Sprites)
    const smokeCount = 36;
    const smokePuffTex = createSmokePuffTexture();
    const smokeSprites: THREE.Sprite[] = [];
    const smokeData: { speedY: number; swaySpeed: number; swayOffset: number }[] = [];

    for (let i = 0; i < smokeCount; i++) {
      const material = new THREE.SpriteMaterial({
        map: smokePuffTex,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
        blending: THREE.NormalBlending,
      });

      const sprite = new THREE.Sprite(material);
      const startY = 1.9 + (i / smokeCount) * 1.8;
      sprite.position.set(
        (Math.random() - 0.5) * 0.04,
        startY,
        0.22 + (Math.random() - 0.5) * 0.04
      );
      const scaleInit = 0.12 + (i / smokeCount) * 0.28;
      sprite.scale.set(scaleInit, scaleInit, 1);

      scene.add(sprite);
      smokeSprites.push(sprite);
      smokeData.push({
        speedY: 0.0075 + Math.random() * 0.003,
        swaySpeed: 1.8 + Math.random() * 0.8,
        swayOffset: Math.random() * Math.PI * 2,
      });
    }

    // ==========================================
    // 6. BỤI LINH KHÍ / TÀN NHANG VÀNG BAY BỔNG (Golden Sparks)
    // ==========================================
    const sparkCount = 45;
    const sparkTex = createGoldenSparkleTexture();
    const sparkSprites: THREE.Sprite[] = [];
    const sparkData: { vx: number; vy: number; vz: number; life: number }[] = [];

    for (let i = 0; i < sparkCount; i++) {
      const sparkMat = new THREE.SpriteMaterial({
        map: sparkTex,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const spark = new THREE.Sprite(sparkMat);
      spark.position.set(
        (Math.random() - 0.5) * 2.4,
        1.2 + Math.random() * 2.0,
        (Math.random() - 0.5) * 1.5 + 0.1
      );
      const size = 0.035 + Math.random() * 0.04;
      spark.scale.set(size, size, 1);

      scene.add(spark);
      sparkSprites.push(spark);
      sparkData.push({
        vx: (Math.random() - 0.5) * 0.002,
        vy: 0.002 + Math.random() * 0.003,
        vz: (Math.random() - 0.5) * 0.002,
        life: Math.random() * Math.PI * 2,
      });
    }

    // Toggle Incense with Bell Sound
    let isIncenseLit = true;
    toggleIncenseRef.current = () => {
      isIncenseLit = !isIncenseLit;
      setIncenseLit(isIncenseLit);
      incenseGroup.visible = isIncenseLit;
      smokeSprites.forEach((s) => (s.visible = isIncenseLit));
      if (isIncenseLit) {
        playSacredBellSound();
      }
    };

    // ==========================================
    // 7. ANIMATION LOOP: KHÓI, NẾN & LINH KHÍ
    // ==========================================
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const time = clock.getElapsedTime();

      // Ánh nến lung linh nhấp nháy chân thực
      candleLeft.intensity = 2.0 + Math.sin(time * 12.5) * 0.35 + Math.cos(time * 7.2) * 0.25;
      candleRight.intensity = 2.0 + Math.cos(time * 11.8) * 0.35 + Math.sin(time * 8.7) * 0.25;

      // Đốm than tàn nhang nhấp nháy đỏ ấm
      if (isIncenseLit) {
        emberLight.intensity = 1.3 + Math.sin(time * 6) * 0.3;
      }

      // Khói trầm uốn lượn mềm mại chân thực
      if (isIncenseLit) {
        smokeSprites.forEach((sprite, idx) => {
          const data = smokeData[idx];
          sprite.position.y += data.speedY;

          // Lượn sóng hình sin lan tỏa tự nhiên
          const swayX = Math.sin(time * data.swaySpeed + data.swayOffset + idx * 0.2) * (0.05 + idx * 0.006);
          const swayZ = Math.cos(time * 1.5 + data.swayOffset) * (0.04 + idx * 0.005);
          sprite.position.x = swayX;
          sprite.position.z = 0.22 + swayZ;

          // Càng lên cao khói càng nở rộng và tan dần
          const heightProgress = (sprite.position.y - 1.9) / 1.85;
          const currentScale = 0.12 + heightProgress * 0.45;
          sprite.scale.set(currentScale, currentScale, 1);

          // Độ trong suốt phai dần khi bay lên cao
          const spriteMat = sprite.material as THREE.SpriteMaterial;
          if (heightProgress < 0.2) {
            spriteMat.opacity = heightProgress * 1.8;
          } else {
            spriteMat.opacity = Math.max(0, (1 - heightProgress) * 0.38);
          }

          if (sprite.position.y > 3.75) {
            sprite.position.y = 1.9;
          }
        });
      }

      // Bụi vàng linh khí lững lờ trôi bồng bềnh
      sparkSprites.forEach((spark, idx) => {
        const d = sparkData[idx];
        d.life += 0.03;
        spark.position.x += d.vx + Math.sin(d.life) * 0.001;
        spark.position.y += d.vy;
        spark.position.z += d.vz;

        const sparkMat = spark.material as THREE.SpriteMaterial;
        sparkMat.opacity = 0.3 + (Math.sin(d.life * 2) * 0.5 + 0.5) * 0.45;

        if (spark.position.y > 3.4) {
          spark.position.y = 1.25;
          spark.position.x = (Math.random() - 0.5) * 2.2;
          spark.position.z = (Math.random() - 0.5) * 1.4 + 0.1;
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!host) return;
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      renderer.dispose();
      if (host.contains(canvas)) {
        host.removeChild(canvas);
      }
    };
  }, []);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-amber-500/40 bg-[#0d0704] shadow-2xl group">
      {/* 3D Canvas Host */}
      <div
        ref={hostRef}
        className="w-full h-80 sm:h-96 md:h-[460px] cursor-grab active:cursor-grabbing"
      />

      {/* Top HUD Badge */}
      <div className="absolute top-3.5 left-4 pointer-events-none flex items-center gap-2">
        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-black/70 text-amber-300 border border-amber-500/50 backdrop-blur-md flex items-center gap-2 shadow-sm">
          <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>PHỦ ĐIỆN 3D · ÁN THỜ TAM CẤP & KHÓI TRẦM LINH THIÊNG</span>
        </span>
      </div>

      {/* Top Right Actions */}
      <div className="absolute top-3.5 right-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => focusAltarRef.current()}
          title="Góc nhìn cận cảnh án thờ"
          className="px-2.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-stone-200 hover:text-white border border-white/10 backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
        >
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Cận cảnh</span>
        </button>

        <button
          type="button"
          onClick={() => resetRef.current()}
          title="Đặt lại góc nhìn bao quát"
          className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-stone-300 hover:text-white border border-white/10 backdrop-blur-md transition-all cursor-pointer shadow-xs"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Floating Bar */}
      <div className="absolute bottom-3.5 inset-x-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-black/65 border border-white/15 p-2.5 sm:px-4 rounded-2xl backdrop-blur-md shadow-lg">
        

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            onClick={() => toggleIncenseRef.current()}
            className={`rounded-xl text-xs h-9 px-4 font-semibold cursor-pointer gap-2 transition-all shadow-md ${
              incenseLit
                ? "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-amber-900/40"
                : "border border-amber-500/40 text-amber-300 bg-black/40 hover:bg-black/60"
            }`}
          >
            <Flame className="w-4 h-4 text-amber-200 animate-pulse" />
            <span>{incenseLit ? "✦ Đang thắp hương (Chuông ngân)" : "Thắp nén tâm hương"}</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-xs text-stone-400 p-4 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
