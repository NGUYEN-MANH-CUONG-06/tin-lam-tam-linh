import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Flame,
  RotateCcw,
  Compass,
} from "lucide-react";
import {
  createDigitalDecoration,
  disposeDigitalDecoration,
  type DecorationId,
} from "./createDigitalDecoration";

interface SanctuarySceneProps {
  decoration?: DecorationId | null;
  children?: React.ReactNode;
}

export const SanctuaryScene: React.FC<SanctuarySceneProps> = ({
  decoration = null,
  children,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const resetRef = useRef<(() => void) | null>(null);
  const viewRef = useRef<{
    rotate: (angle: number) => void;
    zoom: (factor: number) => void;
  } | null>(null);
  const decorationControllerRef = useRef<{
    set: (id: DecorationId | null) => void;
  } | null>(null);
  const [error, setError] = useState("");
  const [sceneLoading, setSceneLoading] = useState(true);
  const [textureFallbackUsed, setTextureFallbackUsed] = useState(false);
  const [incenseLit, setIncenseLit] = useState(false);
  const [incenseLighting, setIncenseLighting] = useState(false);

  const incenseRef = useRef<{
    light: (onComplete: () => void) => void;
  } | null>(null);

  const handleLightIncense = () => {
    const controller = incenseRef.current;

    if (!controller || error || incenseLit || incenseLighting) return;

    setIncenseLighting(true);
    controller.light(() => {
      setIncenseLighting(false);
      setIncenseLit(true);
    });
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      setError(
        "Thiết bị chưa mở được cảnh 3D. Bạn vẫn có thể dùng các mục bên dưới.",
      );
      return;
    }

    let contextLost = false;
    let disposed = false;
    let sceneReady = false;
    let texturesReady = false;
    let textureLoadFailed = false;
    let renderScene: (() => void) | null = null;

    const revealSceneWhenReady = () => {
      if (!sceneReady || !texturesReady || contextLost || disposed) return;

      renderer.domElement.style.visibility = "visible";
      setSceneLoading(false);
      if (textureLoadFailed) setTextureFallbackUsed(true);
      renderScene?.();
    };

    const textureLoadingManager = new THREE.LoadingManager();
    textureLoadingManager.onLoad = () => {
      texturesReady = true;
      revealSceneWhenReady();
    };
    textureLoadingManager.onError = () => {
      textureLoadFailed = true;
    };
    const textureLoader = new THREE.TextureLoader(textureLoadingManager);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Bàn, lư hương và đèn tạo bóng đều đứng yên.
    // Chỉ cần tạo lại shadow map khi chúng thay đổi.
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    renderer.domElement.setAttribute(
      "aria-label",
      "Cảnh 3D góc tri ân: bàn gỗ và lư hương mẫu",
    );
    renderer.domElement.style.visibility = "hidden";
    host.appendChild(renderer.domElement);
    host.style.backgroundColor = "#eee9df";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#d9d4ca");

    const roomEnvironment = new RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);

    const environmentTarget = pmremGenerator.fromScene(
      roomEnvironment,
      0.04,
    );

    scene.environment = environmentTarget.texture;
    scene.environmentIntensity = 0.48;

    roomEnvironment.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
    camera.position.set(0.75, 2.55, 4.6);

    scene.add(
      new THREE.HemisphereLight("#fffaf1", "#6d6258", 0.88),
    );
    scene.add(new THREE.AmbientLight("#fff8ed", 0.38));

    const light = new THREE.DirectionalLight("#fff8ec", 1.0);
    light.position.set(-2.2, 6, 6);
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    light.shadow.camera.left = -6;
    light.shadow.camera.right = 6;
    light.shadow.camera.top = 6;
    light.shadow.camera.bottom = -1;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 18;
    light.shadow.bias = -0.00015;
    light.shadow.normalBias = 0.025;
    light.shadow.radius = 3.2;
    light.shadow.intensity = 0.27;
    scene.add(light);

    const fillLight = new THREE.DirectionalLight("#f1eee7", 0.45);
    fillLight.position.set(3.5, 3.5, 5.5);
    scene.add(fillLight);

    const roomFillLight = new THREE.DirectionalLight("#fff9f0", 0.42);
    roomFillLight.position.set(0, 3, 8);
    scene.add(roomFillLight);

    const altarAccent = new THREE.SpotLight(
      "#ffddb5",
      36,
      6.5,
      Math.PI / 5,
      0.72,
      2,
    );
    altarAccent.position.set(0.25, 4.1, 3.2);
    altarAccent.target.position.set(0, 1.75, 0.25);
    scene.add(altarAccent.target, altarAccent);

    // Soft side bounce keeps the room warm without flattening the altar's contrast.
    for (const side of [-1, 1]) {
      const sideFill = new THREE.DirectionalLight("#fff4e6", 0.18);
      sideFill.position.set(0, 2.7, 2.4);
      sideFill.target.position.set(side * 4.8, 2.7, 2.4);
      scene.add(sideFill.target, sideFill);
    }

    let woodMaterialForFallback: THREE.MeshPhysicalMaterial | null = null;
    let doorMaterialForFallback: THREE.MeshPhysicalMaterial | null = null;
    const woodTexture = textureLoader.load(
      "/textures/altar-walnut-v1.png",
      undefined,
      undefined,
      () => {
        if (disposed) return;
        if (woodMaterialForFallback) {
          woodMaterialForFallback.map = null;
          woodMaterialForFallback.color.set("#76563f");
          woodMaterialForFallback.needsUpdate = true;
        }
        if (doorMaterialForFallback) {
          doorMaterialForFallback.map = null;
          doorMaterialForFallback.color.set("#674b37");
          doorMaterialForFallback.needsUpdate = true;
        }
      },
    );
    woodTexture.colorSpace = THREE.SRGBColorSpace;
    woodTexture.wrapS = THREE.RepeatWrapping;
    woodTexture.wrapT = THREE.RepeatWrapping;

    woodTexture.anisotropy = Math.min(
      4,
      renderer.capabilities.getMaxAnisotropy(),
    );

    const wood = new THREE.MeshPhysicalMaterial({
      map: woodTexture,
      color: "#ffffff",
      roughness: 0.55,
      metalness: 0,
      clearcoat: 0.1,
      clearcoatRoughness: 0.56,
    });
    woodMaterialForFallback = wood;

    // Keep the same grain direction on the cabinet doors.
    const doorTexture = woodTexture.clone();

    const doorMaterial = new THREE.MeshPhysicalMaterial({
      map: doorTexture,
      color: "#ffffff",
      roughness: 0.58,
      metalness: 0,
      clearcoat: 0.08,
      clearcoatRoughness: 0.58,
    });
    doorMaterialForFallback = doorMaterial;

    const bronze = new THREE.MeshStandardMaterial({
      color: "#a47c45",
      metalness: 0.8,
      roughness: 0.42,
    });

    const porcelainCanvas = document.createElement("canvas");
    porcelainCanvas.width = 256;
    porcelainCanvas.height = 256;
    const porcelainContext = porcelainCanvas.getContext("2d");
    if (porcelainContext) {
      porcelainContext.fillStyle = "#f3eee3";
      porcelainContext.fillRect(0, 0, 256, 256);
      porcelainContext.strokeStyle = "#244c73";
      porcelainContext.fillStyle = "#244c73";
      porcelainContext.lineWidth = 3;

      for (const centerX of [0, 128, 256]) {
        for (const centerY of [0, 128, 256]) {
          porcelainContext.beginPath();
          porcelainContext.arc(centerX, centerY, 28, 0, Math.PI * 2);
          porcelainContext.stroke();
          for (let petal = 0; petal < 6; petal += 1) {
            porcelainContext.save();
            porcelainContext.translate(centerX, centerY);
            porcelainContext.rotate((petal / 6) * Math.PI * 2);
            porcelainContext.beginPath();
            porcelainContext.ellipse(0, -15, 6, 12, 0, 0, Math.PI * 2);
            porcelainContext.fill();
            porcelainContext.restore();
          }
          porcelainContext.beginPath();
          porcelainContext.arc(centerX, centerY, 4, 0, Math.PI * 2);
          porcelainContext.fill();
        }
      }

      porcelainContext.lineWidth = 5;
      porcelainContext.beginPath();
      porcelainContext.moveTo(0, 12);
      porcelainContext.lineTo(256, 12);
      porcelainContext.moveTo(0, 244);
      porcelainContext.lineTo(256, 244);
      porcelainContext.stroke();
    }
    const porcelainTexture = new THREE.CanvasTexture(porcelainCanvas);
    porcelainTexture.colorSpace = THREE.SRGBColorSpace;
    porcelainTexture.wrapS = THREE.RepeatWrapping;
    porcelainTexture.wrapT = THREE.RepeatWrapping;

    const porcelainMaterial = new THREE.MeshPhysicalMaterial({
      map: porcelainTexture,
      color: "#ffffff",
      roughness: 0.24,
      metalness: 0,
      clearcoat: 0.42,
      clearcoatRoughness: 0.18,
    });

    const blueMaterial = new THREE.MeshStandardMaterial({
      color: "#315478",
      roughness: 0.4,
      metalness: 0,
    });

    const branchMaterial = new THREE.MeshStandardMaterial({
      color: "#766044",
      roughness: 1,
      metalness: 0,
    });

    const candleFlameMaterial = new THREE.MeshStandardMaterial({
      color: "#ffb33f",
      emissive: "#ff7b19",
      emissiveIntensity: 1.8,
      roughness: 0.35,
    });

    const rugMaterial = new THREE.MeshStandardMaterial({
      color: "#6d292b",
      roughness: 0.92,
      metalness: 0,
    });

    const fruitSkinTextures: THREE.CanvasTexture[] = [];
    const createFruitSkinTexture = (
      base: string,
      highlight: string,
      shadow: string,
      seed: number,
    ) => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 128;
      const context = canvas.getContext("2d");

      if (context) {
        const colorWash = context.createLinearGradient(0, 0, 0, 128);
        colorWash.addColorStop(0, highlight);
        colorWash.addColorStop(0.48, base);
        colorWash.addColorStop(1, shadow);
        context.fillStyle = colorWash;
        context.fillRect(0, 0, 256, 128);

        let noiseSeed = seed;
        const random = () => {
          noiseSeed = (noiseSeed * 1664525 + 1013904223) >>> 0;
          return noiseSeed / 4294967296;
        };

        for (let patch = 0; patch < 24; patch += 1) {
          const x = random() * 256;
          const y = random() * 128;
          const radius = 10 + random() * 34;
          const wash = context.createRadialGradient(x, y, 1, x, y, radius);
          wash.addColorStop(
            0,
            patch % 2 === 0
              ? "rgba(255, 246, 216, 0.12)"
              : "rgba(48, 31, 18, 0.09)",
          );
          wash.addColorStop(1, "rgba(255, 255, 255, 0)");
          context.fillStyle = wash;
          context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        }

        for (let speckle = 0; speckle < 1150; speckle += 1) {
          const radius = 0.25 + random() * 0.7;
          context.fillStyle = speckle % 3 === 0
            ? "rgba(255, 242, 208, 0.16)"
            : "rgba(47, 28, 16, 0.09)";
          context.beginPath();
          context.arc(random() * 256, random() * 128, radius, 0, Math.PI * 2);
          context.fill();
        }
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(
        4,
        renderer.capabilities.getMaxAnisotropy(),
      );
      fruitSkinTextures.push(texture);
      return texture;
    };

    const fruitSkins = [
      { base: "#9d4436", highlight: "#c86c52", shadow: "#71352f", seed: 1481 },
      { base: "#c09548", highlight: "#e0bd69", shadow: "#936332", seed: 2963 },
      { base: "#71864d", highlight: "#a2a96b", shadow: "#485f39", seed: 4577 },
      { base: "#c9763c", highlight: "#e8a557", shadow: "#96522e", seed: 6181 },
      { base: "#ae4d3e", highlight: "#d67b5d", shadow: "#7d3932", seed: 7793 },
    ];
    const fruitMaterials = fruitSkins.map((skin, index) => new THREE.MeshPhysicalMaterial({
      map: createFruitSkinTexture(
        skin.base,
        skin.highlight,
        skin.shadow,
        skin.seed,
      ),
      color: "#ffffff",
      roughness: [0.58, 0.66, 0.8, 0.76, 0.62][index],
      metalness: 0,
      clearcoat: [0.07, 0.045, 0.015, 0.015, 0.05][index],
      clearcoatRoughness: [0.62, 0.68, 0.82, 0.84, 0.68][index],
    }));

    const leafMaterial = new THREE.MeshStandardMaterial({
      color: "#3e6536",
      roughness: 0.9,
      metalness: 0,
    });

    const borderMaterial = new THREE.MeshStandardMaterial({
      color: "#ad8549",
      roughness: 0.45,
      metalness: 0.55,
    });

    let floorMaterialForFallback: THREE.MeshStandardMaterial | null = null;
    const floorTexture = textureLoader.load(
      "/textures/floor-walnut-v1.png",
      undefined,
      undefined,
      () => {
        if (disposed || !floorMaterialForFallback) return;
        floorMaterialForFallback.map = null;
        floorMaterialForFallback.color.set("#785b43");
        floorMaterialForFallback.needsUpdate = true;
      },
    );
    floorTexture.colorSpace = THREE.SRGBColorSpace;
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(2, 6);
    floorTexture.anisotropy = Math.min(
      8,
      renderer.capabilities.getMaxAnisotropy(),
    );

    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture,
      color: "#ffffff",
      roughness: 0.86,
      metalness: 0,
    });
    floorMaterialForFallback = floorMaterial;

    const geometries: THREE.BufferGeometry[] = [];

    const addBox = (
      width: number,
      height: number,
      depth: number,
      x: number,
      y: number,
      z: number,
      material: THREE.Material,
    ) => {
      const geometry = new THREE.BoxGeometry(width, height, depth);
      geometries.push(geometry);

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      scene.add(mesh);
      return mesh;
    };

    // Sàn và bàn mẫu.
    addBox(10, 0.12, 10, 0, -0.06, 0.35, floorMaterial);
    const addRoundedWood = (
      width: number,
      height: number,
      depth: number,
      x: number,
      y: number,
      z: number,
      radius: number,
    ) => {
      const geometry = new RoundedBoxGeometry(width, height, depth, 3, radius);
      geometries.push(geometry);

      const mesh = new THREE.Mesh(geometry, wood);
      mesh.position.set(x, y, z);
      scene.add(mesh);

      return mesh;
    };

    // Tủ thờ mẫu: mặt trên vẫn ở độ cao 1.3,
    // để các đồ thờ hiện tại không bị thay đổi độ cao.

    // Mặt tủ và hai lớp chỉ bên dưới.
    addRoundedWood(3.9, 0.16, 1.95, 0, 1.22, 0, 0.025);
    addRoundedWood(3.72, 0.065, 1.85, 0, 1.1075, 0, 0.012);
    addRoundedWood(3.64, 0.045, 1.77, 0, 1.0525, 0, 0.01);

    // Hai vách bên.
    for (const x of [-1.72, 1.72]) {
      addRoundedWood(
        0.14, 0.86, 1.68,
        x, 0.6, 0,
        0.012,
      );
    }

    // Vách sau.
    addRoundedWood(
      3.25, 0.86, 0.1,
      0, 0.6, -0.72,
      0.01,
    );

    // Đáy tủ và bệ chân.
    addRoundedWood(3.56, 0.1, 1.72, 0, 0.17, 0, 0.014);
    addRoundedWood(3.68, 0.12, 1.82, 0, 0.06, 0, 0.018);

    // Khung mặt trước.
    for (const x of [-1.72, -0.53, 0.53, 1.72]) {
      addRoundedWood(
        0.085, 0.8, 0.09,
        x, 0.61, 0.765,
        0.008,
      );
    }

    for (const y of [0.235, 0.985]) {
      addRoundedWood(
        3.45, 0.075, 0.09,
        0, y, 0.765,
        0.008,
      );
    }

    // Ba cánh tủ đóng, có pano lõm và chỉ nổi.
    for (const centerX of [-1.05, 0, 1.05]) {
      // Tấm cánh có vân đứng, nằm lùi sau đường viền.
      const doorPanel = addRoundedWood(
        0.94, 0.66, 0.055,
        centerX, 0.61, 0.72,
        0.008,
      );

      doorPanel.material = doorMaterial;

      // Hai thanh chỉ đứng.
      for (const offsetX of [-0.405, 0.405]) {
        addRoundedWood(
          0.028, 0.56, 0.025,
          centerX + offsetX, 0.61, 0.758,
          0.005,
        );
      }

      // Hai thanh chỉ ngang.
      for (const y of [0.345, 0.875]) {
        addRoundedWood(
          0.81, 0.028, 0.025,
          centerX, y, 0.758,
          0.005,
        );
      }
    }

    // Chỉ đồng nhỏ trên cánh tủ và hoa văn tròn ở chính giữa.
    const cabinetKnobGeometry = new THREE.SphereGeometry(0.028, 12, 10);
    const cabinetCarvingGeometry = new THREE.TorusGeometry(0.085, 0.009, 8, 32);
    const carvingPetalGeometry = new THREE.SphereGeometry(0.025, 10, 8);
    geometries.push(cabinetKnobGeometry, cabinetCarvingGeometry, carvingPetalGeometry);

    for (const centerX of [-1.05, 0, 1.05]) {
      for (const offsetX of [-0.29, 0.29]) {
        const knob = new THREE.Mesh(cabinetKnobGeometry, borderMaterial);
        knob.position.set(centerX + offsetX, 0.61, 0.795);
        scene.add(knob);
      }
    }

    for (const centerX of [-1.05, 0, 1.05]) {
      const scale = centerX === 0 ? 1 : 0.72;
      const carving = new THREE.Group();
      carving.position.set(centerX, 0.61, 0.792);
      carving.scale.setScalar(scale);
      carving.add(new THREE.Mesh(cabinetCarvingGeometry, borderMaterial));

      for (const angle of [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2]) {
        const petal = new THREE.Mesh(carvingPetalGeometry, borderMaterial);
        petal.position.set(Math.cos(angle) * 0.048, Math.sin(angle) * 0.048, 0.002);
        petal.scale.set(1, 1.35, 0.5);
        carving.add(petal);
      }

      const carvingCenter = new THREE.Mesh(carvingPetalGeometry, borderMaterial);
      carvingCenter.position.z = 0.005;
      carvingCenter.scale.set(0.8, 0.8, 0.5);
      carving.add(carvingCenter);
      scene.add(carving);
    }

    // Chỉ đồng mảnh chạy dọc mép mặt tủ, giúp phân lớp gỗ rõ hơn.
    addBox(3.35, 0.018, 0.014, 0, 1.12, 0.82, borderMaterial);
    addBox(3.25, 0.012, 0.014, 0, 1.035, 0.82, borderMaterial);

    // Fine, neutral limewash avoids the coarse orange grain of the first wall pass.
    let wallMaterialForFallback: THREE.MeshPhysicalMaterial | null = null;
    const wallTexture = textureLoader.load(
      "/textures/wall-limewash-v2.png",
      undefined,
      undefined,
      () => {
        if (disposed || !wallMaterialForFallback) return;
        wallMaterialForFallback.map = null;
        wallMaterialForFallback.color.set("#d6cdbf");
        wallMaterialForFallback.needsUpdate = true;
      },
    );
    wallTexture.colorSpace = THREE.SRGBColorSpace;
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(4, 2);
    wallTexture.anisotropy = Math.min(
      8,
      renderer.capabilities.getMaxAnisotropy(),
    );

    const wallMaterial = new THREE.MeshPhysicalMaterial({
      map: wallTexture,
      color: "#d6cdbf",
      roughness: 0.98,
      metalness: 0,
      clearcoat: 0,
      clearcoatRoughness: 1,
    });
    wallMaterialForFallback = wallMaterial;

    // Tường bắt đầu từ sàn, nằm sau tủ.
    // Extend well beyond the camera frustum so the wall never ends inside the shot.
    addBox(10, 5.2, 0.12, 0, 2.6, -1.25, wallMaterial);

    // A low walnut skirting board gives the wall and floor a finished junction.
    const roomSkirting = addRoundedWood(
      10,
      0.16,
      0.08,
      0,
      0.08,
      -1.155,
      0.016,
    );
    roomSkirting.userData.excludeFromAltarBounds = true;

    // Two matching side walls turn the backdrop into a quiet, enclosed room.
    for (const x of [-4.94, 4.94]) {
      addBox(0.12, 5.2, 6.5, x, 2.6, 2.06, wallMaterial);

      const sideSkirting = addRoundedWood(
        0.16,
        0.16,
        6.5,
        x < 0 ? -4.84 : 4.84,
        0.08,
        2.06,
        0.016,
      );
      sideSkirting.userData.excludeFromAltarBounds = true;
    }

    // Hậu cung gỗ có trụ, đầu cột và hai lớp mái đỡ bài vị.
    for (const x of [-1.08, 1.08]) {
      addRoundedWood(0.16, 2.28, 0.16, x, 2.43, -1.08, 0.018);
      addRoundedWood(0.25, 0.13, 0.24, x, 3.59, -1.08, 0.02);
      addRoundedWood(0.25, 0.13, 0.24, x, 1.28, -1.08, 0.02);

      for (const offsetX of [-0.045, 0.045]) {
        addBox(0.012, 1.94, 0.012, x + offsetX, 2.43, -0.986, borderMaterial);
      }
    }

    addRoundedWood(2.45, 0.14, 0.24, 0, 3.58, -1.08, 0.025);
    addRoundedWood(2.72, 0.075, 0.3, 0, 3.69, -1.08, 0.025);
    addBox(2.62, 0.018, 0.012, 0, 3.63, -0.91, borderMaterial);

    // Thảm lễ nhỏ đặt trước tủ, có đường viền và họa tiết hình thoi.
    const rugGeometry = new THREE.BoxGeometry(2.75, 0.025, 0.82);
    geometries.push(rugGeometry);
    const rug = new THREE.Mesh(rugGeometry, rugMaterial);
    rug.position.set(0, 0.0125, 1.5);
    scene.add(rug);

    addBox(2.61, 0.009, 0.018, 0, 0.03, 1.11, borderMaterial);
    addBox(2.61, 0.009, 0.018, 0, 0.03, 1.89, borderMaterial);
    addBox(0.018, 0.009, 0.74, -1.34, 0.03, 1.5, borderMaterial);
    addBox(0.018, 0.009, 0.74, 1.34, 0.03, 1.5, borderMaterial);

    const rugMotifGeometry = new THREE.BoxGeometry(0.09, 0.01, 0.09);
    geometries.push(rugMotifGeometry);
    for (const x of [-0.84, -0.42, 0, 0.42, 0.84]) {
      const motif = new THREE.Mesh(rugMotifGeometry, borderMaterial);
      motif.position.set(x, 0.03, 1.5);
      motif.rotation.y = Math.PI / 4;
      scene.add(motif);
    }


    // Hai bình gốm đặt ở hai bên, gần phía sau mặt bàn.
    const vaseProfile = [
      [0.001, 0],
      [0.10, 0],
      [0.16, 0.04],
      [0.21, 0.15],
      [0.20, 0.27],
      [0.13, 0.38],
      [0.075, 0.43],
      [0.065, 0.56],
      [0.095, 0.60],
      [0.075, 0.60],
      [0.050, 0.55],
      [0.055, 0.43],
      [0.11, 0.37],
      [0.175, 0.26],
      [0.185, 0.15],
      [0.14, 0.06],
      [0.001, 0.03],
    ].map(([radius, height]) => new THREE.Vector2(radius, height));

    const vaseGeometry = new THREE.LatheGeometry(vaseProfile, 48);
    geometries.push(vaseGeometry);

    // Vòng hoa văn ở chân và cổ bình.
    const footRingGeometry = new THREE.TorusGeometry(
      0.125, 0.007, 8, 40,
    );

    const neckRingGeometry = new THREE.TorusGeometry(
      0.068, 0.005, 8, 32,
    );

    geometries.push(footRingGeometry, neckRingGeometry);

    // Họa tiết cánh hoa dạng hình học.
    const petalGeometry = new THREE.SphereGeometry(1, 16, 10);
    geometries.push(petalGeometry);

    // Dựng cành bằng đoạn nối giữa hai điểm.
    const addBranch = (
      group: THREE.Group,
      start: THREE.Vector3,
      end: THREE.Vector3,
      radius: number,
    ) => {
      const direction = end.clone().sub(start);
      const length = direction.length();

      const geometry = new THREE.CylinderGeometry(
        radius * 0.65,
        radius,
        length,
        6,
      );

      geometries.push(geometry);

      const branch = new THREE.Mesh(geometry, branchMaterial);

      branch.position.copy(start).add(end).multiplyScalar(0.5);
      branch.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.normalize(),
      );

      group.add(branch);
    };

    const flowerMaterial = new THREE.MeshStandardMaterial({
      color: "#ddcfb3",
      roughness: 0.86,
      metalness: 0,
    });

    const flowerCenterMaterial = new THREE.MeshStandardMaterial({
      color: "#c49a4a",
      roughness: 0.9,
      metalness: 0,
    });

    const blossomGeometry = new THREE.SphereGeometry(1, 20, 12);
    geometries.push(blossomGeometry);

    for (const side of [-1, 1]) {
      const vaseGroup = new THREE.Group();
      vaseGroup.position.set(
        side * (side < 0 ? 1.31 : 1.26),
        1.3,
        side < 0 ? -0.4 : -0.35,
      );
      vaseGroup.rotation.z = side * 0.018;

      const vase = new THREE.Mesh(vaseGeometry, porcelainMaterial);
      vaseGroup.add(vase);

      const footRing = new THREE.Mesh(footRingGeometry, blueMaterial);
      footRing.rotation.x = Math.PI / 2;
      footRing.position.y = 0.025;
      vaseGroup.add(footRing);

      const neckRing = new THREE.Mesh(neckRingGeometry, blueMaterial);
      neckRing.rotation.x = Math.PI / 2;
      neckRing.position.y = 0.53;
      vaseGroup.add(neckRing);

      // Ba cụm hoa xanh chạy quanh thân bình.
      for (let flower = 0; flower < 3; flower += 1) {
        const angle = (flower / 3) * Math.PI * 2;

        const flowerGroup = new THREE.Group();
        flowerGroup.position.set(
          Math.sin(angle) * 0.203,
          0.20,
          Math.cos(angle) * 0.203,
        );

        flowerGroup.rotation.y = angle;

        for (let petal = 0; petal < 5; petal += 1) {
          const petalAngle = (petal / 5) * Math.PI * 2;

          const mesh = new THREE.Mesh(petalGeometry, blueMaterial);

          mesh.position.set(
            Math.sin(petalAngle) * 0.032,
            Math.cos(petalAngle) * 0.032,
            0,
          );

          mesh.scale.set(0.018, 0.030, 0.004);
          mesh.rotation.z = -petalAngle;

          flowerGroup.add(mesh);
        }

        vaseGroup.add(flowerGroup);
      }

      // Các cành tỏa ra từ trong cổ bình.
      // Tọa độ tính theo nhóm bình.
      const flowerTips = [
        [-0.25, 0.95, 0.02],
        [-0.16, 1.14, -0.04],
        [0.02, 1.30, -0.06],
        [0.19, 1.16, 0],
        [0.28, 0.98, 0.04],
        [-0.20, 0.79, 0.17],
        [-0.07, 0.94, 0.19],
        [0.10, 1.05, 0.14],
        [0.22, 0.80, 0.18],
        [0.03, 0.75, 0.23],
        [-0.08, 1.08, -0.16],
        [0.17, 0.90, -0.14],
      ];
      const sideXShifts =
        side < 0
          ? [-0.025, 0, 0.015, 0, -0.025, 0, 0.015, 0, -0.025, 0, 0.015, 0]
          : [0, 0.024, 0, -0.014, 0, 0.024, 0, -0.014, 0, 0.024, 0, -0.014];
      const flowerYShifts = [0.02, 0, -0.015, 0.02, 0, -0.015, 0.02, 0, -0.015, 0.02, 0, -0.015];

      const bouquetLeafGeometry = new THREE.SphereGeometry(1, 16, 10);
      geometries.push(bouquetLeafGeometry);

      for (const [flowerIndex, [x, y, z]] of flowerTips.entries()) {
        const flowerX = x + (sideXShifts[flowerIndex] ?? 0);
        const flowerY = y + (flowerYShifts[flowerIndex] ?? 0);
        const flowerZ = z + (side < 0 ? -0.008 : 0.008);

        addBranch(
          vaseGroup,
          new THREE.Vector3(0, 0.48, 0),
          new THREE.Vector3(flowerX, flowerY, flowerZ),
          0.006,
        );

        const blossom = new THREE.Group();
        blossom.position.set(flowerX, flowerY, flowerZ);
        blossom.rotation.set(
          -0.15 + flowerZ * 1.2,
          flowerX * 1.5,
          flowerX * 0.6,
        );

        // Ba lớp cánh ngắn, xếp chồng thành bông.
        const petalLayers = [
          { count: 14, radius: 0.045, width: 0.022, length: 0.032 },
          { count: 12, radius: 0.030, width: 0.019, length: 0.027 },
          { count: 9, radius: 0.016, width: 0.014, length: 0.021 },
        ];

        for (const [layer, config] of petalLayers.entries()) {
          for (let index = 0; index < config.count; index += 1) {
            const angle =
              (index / config.count) * Math.PI * 2 + layer * 0.3;

            const petal = new THREE.Mesh(
              blossomGeometry,
              flowerMaterial,
            );

            petal.position.set(
              Math.sin(angle) * config.radius,
              Math.cos(angle) * config.radius,
              layer * 0.012,
            );

            petal.scale.set(
              config.width,
              config.length,
              0.014,
            );

            petal.rotation.set(
              0.12 * Math.cos(angle),
              0.12 * Math.sin(angle),
              -angle,
            );

            blossom.add(petal);
          }
        }

        // Thay đổi kích thước nhẹ giữa các bông.
        blossom.scale.setScalar(
          0.9 + (Math.abs(flowerX) / 0.28) * 0.15,
        );

        const center = new THREE.Mesh(
          blossomGeometry,
          flowerCenterMaterial,
        );

        center.scale.set(0.013, 0.013, 0.012);
        center.position.z = 0.038;
        blossom.add(center);

        // Hai lá nằm dọc mỗi cành.
        const stemStart = new THREE.Vector3(0, 0.48, 0);
        const stemEnd = new THREE.Vector3(flowerX, flowerY, flowerZ);
        const stemDirection = stemEnd.clone().sub(stemStart).normalize();

        for (const [index, fraction] of [0.45, 0.7].entries()) {
          const side = index === 0 ? -1 : 1;

          const leafDirection = new THREE.Vector3(
            side * 0.8,
            0.45,
            0.2,
          )
            .addScaledVector(stemDirection, 0.3)
            .normalize();

          const leaf = new THREE.Mesh(
            bouquetLeafGeometry,
            leafMaterial,
          );

          leaf.scale.set(0.025, 0.09, 0.008);

          // Đặt một đầu lá gần cành.
          leaf.position
            .copy(stemStart)
            .lerp(stemEnd, fraction)
            .addScaledVector(leafDirection, 0.075);

          leaf.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            leafDirection,
          );

          vaseGroup.add(leaf);
        }

        vaseGroup.add(blossom);
      }

      scene.add(vaseGroup);
    }

    // Hai đĩa trái cây mô phỏng theo bố cục ảnh tham chiếu.
    const plateProfile = [
      [0.001, 0.015],
      [0.13, 0.015],
      [0.22, 0.025],
      [0.29, 0.055],
      [0.31, 0.075],
      [0.30, 0.09],
      [0.27, 0.065],
      [0.20, 0.045],
      [0.001, 0.04],
    ].map(([radius, height]) => new THREE.Vector2(radius, height));

    const plateGeometry = new THREE.LatheGeometry(plateProfile, 64);
    type FruitShape = "apple" | "pear" | "lime" | "orange" | "persimmon";
    const createFruitGeometry = (shape: FruitShape) => {
      const radius = 0.105;
      const geometry = new THREE.SphereGeometry(radius, 40, 32);
      const positions = geometry.attributes.position;

      for (let index = 0; index < positions.count; index += 1) {
        const x = positions.getX(index) / radius;
        const y = positions.getY(index) / radius;
        const z = positions.getZ(index) / radius;
        const angle = Math.atan2(z, x);
        const latitude = Math.abs(y);
        let radialScale = 1;
        let verticalScale = 1;

        if (shape === "apple") {
          radialScale = 1 - 0.07 * latitude + 0.025 * Math.cos(angle * 5) * latitude;
          verticalScale = 0.98;
        } else if (shape === "pear") {
          radialScale = 1 - 0.2 * y + 0.025 * Math.cos(angle * 3) * (1 - latitude);
          verticalScale = 1.08;
        } else if (shape === "lime") {
          radialScale = 1 + 0.018 * Math.cos(angle * 8) * latitude;
          verticalScale = 0.86;
        } else if (shape === "orange") {
          radialScale = 1 + 0.014 * Math.cos(angle * 9) * latitude;
          verticalScale = 0.92;
        } else {
          radialScale = 1 - 0.06 * latitude + 0.035 * Math.cos(angle * 5) * latitude;
          verticalScale = 0.86;
        }

        const radial = Math.sqrt(x * x + z * z);
        const topDimple = Math.max(0, (y - 0.72) / 0.28)
          * Math.exp(-radial * radial * 28)
          * 0.12;
        const bottomDimple = Math.max(0, (-y - 0.78) / 0.22)
          * Math.exp(-radial * radial * 30)
          * 0.07;

        positions.setXYZ(
          index,
          x * radius * radialScale,
          radius * (y * verticalScale - topDimple + bottomDimple),
          z * radius * radialScale,
        );
      }

      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      return geometry;
    };
    const fruitGeometries = [
      createFruitGeometry("apple"),
      createFruitGeometry("pear"),
      createFruitGeometry("lime"),
      createFruitGeometry("orange"),
      createFruitGeometry("persimmon"),
    ];
    const leafGeometry = new THREE.SphereGeometry(1, 12, 8);
    const stemGeometry = new THREE.CylinderGeometry(
      0.008,
      0.01,
      0.045,
      6,
    );

    geometries.push(
      plateGeometry,
      ...fruitGeometries,
      leafGeometry,
      stemGeometry,
    );

    for (const side of [-1, 1]) {
      const offeringGroup = new THREE.Group();
      offeringGroup.position.set(side * 1.5, 1.3, side < 0 ? 0.13 : 0.17);
      offeringGroup.rotation.y = side < 0 ? -0.035 : 0.025;
      offeringGroup.scale.setScalar(side < 0 ? 1.24 : 1.26);

      const plate = new THREE.Mesh(plateGeometry, porcelainMaterial);
      offeringGroup.add(plate);

      // Bốn quả ở dưới và một quả phía trên.
      const fruitPositions = [
        [-0.11, 0.15, -0.08],
        [0.11, 0.15, -0.08],
        [-0.11, 0.15, 0.10],
        [0.11, 0.15, 0.10],
        [0, 0.31, 0],
      ];

      for (const [index, [x, y, z]] of fruitPositions.entries()) {
        const fruit = new THREE.Mesh(fruitGeometries[index], fruitMaterials[index]);
        fruit.position.set(x, y, z);
        fruit.scale.set(
          index % 2 === 0 ? 0.92 : 1,
          index === 4 ? 1.08 : 0.94,
          index % 2 === 0 ? 0.96 : 0.9,
        );
        offeringGroup.add(fruit);

        const stem = new THREE.Mesh(stemGeometry, branchMaterial);
        stem.position.set(x, y + 0.105, z);
        offeringGroup.add(stem);

        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        leaf.scale.set(0.045, 0.009, 0.018);
        leaf.position.set(x + 0.028, y + 0.108, z);
        leaf.rotation.z = -0.3;
        offeringGroup.add(leaf);

        if (index === 4) {
          // Small green sepals break up the persimmon's otherwise smooth crown.
          for (let sepalIndex = 0; sepalIndex < 5; sepalIndex += 1) {
            const angle = (sepalIndex / 5) * Math.PI * 2;
            const sepal = new THREE.Mesh(leafGeometry, leafMaterial);
            sepal.scale.set(0.026, 0.004, 0.009);
            sepal.position.set(
              x + Math.cos(angle) * 0.02,
              y + 0.09,
              z + Math.sin(angle) * 0.02,
            );
            sepal.rotation.y = -angle;
            offeringGroup.add(sepal);
          }
        }
      }

      scene.add(offeringGroup);
    }

    // Khay và ba chén gốm phía trước lư hương.
    const cupProfile = [
      [0.001, 0.005],
      [0.035, 0.005],
      [0.040, 0.018],
      [0.050, 0.035],
      [0.065, 0.090],
      [0.068, 0.105],
      [0.058, 0.105],
      [0.055, 0.090],
      [0.040, 0.038],
      [0.001, 0.028],
    ].map(([radius, height]) => new THREE.Vector2(radius, height));

    const cupGeometry = new THREE.LatheGeometry(cupProfile, 32);

    const cupBandGeometry = new THREE.TorusGeometry(
      0.060,
      0.003,
      8,
      32,
    );

    const trayGeometry = new RoundedBoxGeometry(
      0.66,
      0.035,
      0.27,
      3,
      0.012,
    );

    geometries.push(cupGeometry, cupBandGeometry, trayGeometry);

    const cupsGroup = new THREE.Group();
    cupsGroup.position.set(0, 1.3, 0.62);

    // Đáy khay chạm mặt bàn.
    const tray = new THREE.Mesh(trayGeometry, porcelainMaterial);
    tray.position.y = 0.0175;
    cupsGroup.add(tray);

    for (const x of [-0.20, 0, 0.20]) {
      const cup = new THREE.Mesh(cupGeometry, porcelainMaterial);
      cup.position.set(x, 0.035, 0);
      cupsGroup.add(cup);

      const band = new THREE.Mesh(cupBandGeometry, blueMaterial);
      band.rotation.x = Math.PI / 2;
      band.position.set(x, 0.120, 0);
      cupsGroup.add(band);
    }

    scene.add(cupsGroup);

    // Lư đồng có nắp ở phía sau, dựng cách điệu theo ảnh.
    const coveredCenser = new THREE.Group();
    coveredCenser.position.set(0, 1.3, -0.55);

    const censerProfile = [
      [0.001, 0.14],
      [0.13, 0.14],
      [0.17, 0.17],
      [0.22, 0.22],
      [0.25, 0.29],
      [0.245, 0.34],
      [0.21, 0.39],
      [0.16, 0.42],
      [0.16, 0.46],
      [0.19, 0.47],
      [0.19, 0.49],
      [0.001, 0.49],
    ].map(([radius, height]) => new THREE.Vector2(radius, height));

    const censerBodyGeometry = new THREE.LatheGeometry(
      censerProfile,
      48,
    );

    const censerLidProfile = [
      [0.001, 0],
      [0.205, 0],
      [0.205, 0.02],
      [0.18, 0.04],
      [0.15, 0.075],
      [0.10, 0.105],
      [0.045, 0.12],
      [0.001, 0.12],
    ].map(([radius, height]) => new THREE.Vector2(radius, height));

    const censerLidGeometry = new THREE.LatheGeometry(
      censerLidProfile,
      48,
    );

    const censerKnobGeometry = new THREE.SphereGeometry(
      0.035,
      16,
      12,
    );

    const censerLegGeometry = new THREE.CylinderGeometry(
      0.035,
      0.045,
      0.14,
      12,
    );

    const censerHandleGeometry = new THREE.TorusGeometry(
      0.07,
      0.012,
      8,
      24,
    );

    const censerRimGeometry = new THREE.TorusGeometry(
      0.195,
      0.009,
      8,
      48,
    );

    geometries.push(
      censerBodyGeometry,
      censerLidGeometry,
      censerKnobGeometry,
      censerLegGeometry,
      censerHandleGeometry,
      censerRimGeometry,
    );

    const censerBody = new THREE.Mesh(censerBodyGeometry, bronze);
    coveredCenser.add(censerBody);

    const censerLid = new THREE.Mesh(censerLidGeometry, bronze);
    censerLid.position.y = 0.49;
    coveredCenser.add(censerLid);

    const censerKnob = new THREE.Mesh(censerKnobGeometry, bronze);
    censerKnob.position.y = 0.63;
    censerKnob.scale.set(0.8, 1.2, 0.8);
    coveredCenser.add(censerKnob);

    const censerRim = new THREE.Mesh(censerRimGeometry, bronze);
    censerRim.rotation.x = Math.PI / 2;
    censerRim.position.y = 0.49;
    coveredCenser.add(censerRim);

    // Ba chân chạm mặt bàn.
    for (let index = 0; index < 3; index += 1) {
      const angle = (index / 3) * Math.PI * 2;

      const leg = new THREE.Mesh(censerLegGeometry, bronze);
      leg.position.set(
        Math.sin(angle) * 0.14,
        0.07,
        Math.cos(angle) * 0.14,
      );

      coveredCenser.add(leg);
    }

    for (const side of [-1, 1]) {
      const handle = new THREE.Mesh(censerHandleGeometry, bronze);
      handle.position.set(side * 0.265, 0.36, 0);
      coveredCenser.add(handle);
    }

    scene.add(coveredCenser);

    // Hai chân nến mẫu bằng đồng.
    const candleStandProfile = [
      [0.001, 0],
      [0.15, 0],
      [0.15, 0.025],
      [0.12, 0.05],
      [0.09, 0.08],
      [0.055, 0.14],
      [0.04, 0.20],
      [0.035, 0.38],
      [0.055, 0.42],
      [0.055, 0.45],
      [0.035, 0.48],
      [0.035, 0.57],
      [0.09, 0.59],
      [0.12, 0.62],
      [0.12, 0.65],
      [0.095, 0.65],
      [0.08, 0.625],
      [0.001, 0.625],
    ].map(([radius, height]) => new THREE.Vector2(radius, height));

    const candleStandGeometry = new THREE.LatheGeometry(
      candleStandProfile,
      40,
    );

    const candleGeometry = new THREE.CylinderGeometry(
      0.025,
      0.03,
      0.18,
      16,
    );

    geometries.push(candleStandGeometry, candleGeometry);

    const candleMaterial = new THREE.MeshStandardMaterial({
      color: "#ead9b7",
      roughness: 0.8,
      metalness: 0,
    });

    for (const x of [-0.82, 0.82]) {
      const candleStandGroup = new THREE.Group();
      candleStandGroup.position.set(x, 1.3, -0.42);

      const stand = new THREE.Mesh(candleStandGeometry, bronze);
      candleStandGroup.add(stand);

      const candle = new THREE.Mesh(candleGeometry, candleMaterial);

      // Đáy nến nằm trên lòng đĩa của chân nến.
      candle.position.y = 0.715;
      candleStandGroup.add(candle);

      scene.add(candleStandGroup);
    }

    // Ngọn lửa nhỏ trên đôi chân nến, dùng ánh sáng tĩnh để giữ hiệu năng.
    const candleFlameGeometry = new THREE.ConeGeometry(0.028, 0.11, 10);
    geometries.push(candleFlameGeometry);

    for (const x of [-0.82, 0.82]) {
      const flame = new THREE.Mesh(candleFlameGeometry, candleFlameMaterial);
      flame.position.set(x, 2.17, -0.42);
      flame.userData.skipShadow = true;
      scene.add(flame);

      const candleGlow = new THREE.PointLight("#ffbd70", 1, 1.6, 2);
      candleGlow.position.set(x, 2.2, -0.42);
      scene.add(candleGlow);
    }

    // Texture sọc dưa mô phỏng, không phải ảnh chụp.
    const melonCanvas = document.createElement("canvas");
    melonCanvas.width = 256;
    melonCanvas.height = 128;

    const melonContext = melonCanvas.getContext("2d");

    if (melonContext) {
      melonContext.fillStyle = "#607747";
      melonContext.fillRect(0, 0, 256, 128);

      melonContext.strokeStyle = "#40583a";
      melonContext.lineWidth = 6;
      melonContext.lineCap = "round";

      for (let stripe = -1; stripe <= 12; stripe += 1) {
        melonContext.beginPath();

        for (let y = 0; y <= 128; y += 2) {
          const x =
            stripe * (256 / 12) +
            Math.sin((y / 128) * Math.PI * 6 + stripe * 0.7) * 5 +
            Math.sin((y / 128) * Math.PI * 14 + stripe * 1.1) * 1.5;

          if (y === 0) {
            melonContext.moveTo(x, y);
          } else {
            melonContext.lineTo(x, y);
          }
        }

        melonContext.stroke();
      }
    }

    const melonTexture = new THREE.CanvasTexture(melonCanvas);
    melonTexture.colorSpace = THREE.SRGBColorSpace;

    const melonMaterial = new THREE.MeshPhysicalMaterial({
      map: melonTexture,
      roughness: 0.8,
      metalness: 0,
      clearcoat: 0.015,
      clearcoatRoughness: 0.84,
    });

    const melonGeometry = new THREE.SphereGeometry(0.18, 48, 32);

    const melonStandProfile = [
      [0.001, 0],
      [0.13, 0],
      [0.14, 0.025],
      [0.10, 0.05],
      [0.07, 0.08],
      [0.07, 0.11],
      [0.14, 0.14],
      [0.17, 0.16],
      [0.17, 0.18],
      [0.14, 0.18],
      [0.001, 0.15],
    ].map(([radius, height]) => new THREE.Vector2(radius, height));

    const melonStandGeometry = new THREE.LatheGeometry(
      melonStandProfile,
      32,
    );

    geometries.push(melonGeometry, melonStandGeometry);

    const melonOfferingGroups: THREE.Group[] = [];

    for (const x of [-0.62, 0.62]) {
      const melonGroup = new THREE.Group();
      melonGroup.position.set(x, 1.3, 0.22);

      const stand = new THREE.Mesh(melonStandGeometry, wood);
      melonGroup.add(stand);

      const melon = new THREE.Mesh(melonGeometry, melonMaterial);
      melon.scale.set(0.95, 1.15, 0.95);

      // Đáy quả tựa trên lòng đế.
      melon.position.y = 0.357;
      melon.rotation.y = x;
      melonGroup.add(melon);

      scene.add(melonGroup);
      melonOfferingGroups.push(melonGroup);
    }

    // Lư hương mẫu trong góc tri ân.
    // Thu nhỏ quanh điểm đặt trên mặt bàn, cao 1.3.
    const incenseGroup = new THREE.Group();
    incenseGroup.position.set(0, 1.3, 0.22);
    incenseGroup.scale.setScalar(0.62);

    // Giữ nguyên các tọa độ đã dùng trong code hiện tại.
    const incenseContent = new THREE.Group();
    incenseContent.position.y = -1.3;

    incenseGroup.add(incenseContent);
    scene.add(incenseGroup);

    // Biên dạng đi từ đáy ngoài, lên miệng,
    // rồi trở xuống thành trong để tạo lòng rỗng.
    const bowlProfile = [
      [0.001, -0.12],
      [0.18, -0.12],
      [0.23, -0.1],
      [0.29, -0.04],
      [0.34, 0.06],
      [0.37, 0.15],
      [0.38, 0.2],
      [0.345, 0.2],
      [0.335, 0.15],
      [0.305, 0.06],
      [0.26, -0.04],
      [0.18, -0.08],
      [0.001, -0.08],
    ].map(([radius, height]) => new THREE.Vector2(radius, height));

    const bowlGeometry = new THREE.LatheGeometry(bowlProfile, 64);
    geometries.push(bowlGeometry);

    const bowl = new THREE.Mesh(bowlGeometry, bronze);
    bowl.position.set(0, 1.48, 0);
    incenseContent.add(bowl);

    // Vành miệng.
    const rimGeometry = new THREE.TorusGeometry(0.3625, 0.022, 12, 64);
    geometries.push(rimGeometry);

    const rim = new THREE.Mesh(rimGeometry, bronze);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 1.68, 0);
    incenseContent.add(rim);

    // Chân đế chạm mặt bàn, mặt bàn hiện tại cao 1.3.
    const baseGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.06, 48);
    geometries.push(baseGeometry);

    const base = new THREE.Mesh(baseGeometry, bronze);
    base.position.set(0, 1.33, 0);
    incenseContent.add(base);

    // Hai quai đơn giản, dựng đối xứng.
    const handleGeometry = new THREE.TorusGeometry(0.105, 0.018, 10, 32);
    geometries.push(handleGeometry);

    for (const side of [-1, 1]) {
      const handle = new THREE.Mesh(handleGeometry, bronze);
      handle.position.set(side * 0.405, 1.56, 0);
      handle.scale.set(0.8, 1, 1);
      incenseContent.add(handle);
    }

    // Lớp tro nằm bên trong, thấp hơn vành miệng.
    const ashMaterial = new THREE.MeshStandardMaterial({
      color: "#8b8174",
      roughness: 1,
      metalness: 0,
    });

    const ashGeometry = new THREE.CylinderGeometry(0.33, 0.32, 0.025, 48);
    geometries.push(ashGeometry);

    const ash = new THREE.Mesh(ashGeometry, ashMaterial);
    ash.position.set(0, 1.6375, 0);
    incenseContent.add(ash);

    const incenseMaterial = new THREE.MeshStandardMaterial({
      color: "#754b35",
      roughness: 0.88,
    });
    const sourceIncenseMaterials = ["#70452f", "#80533a", "#76503a"].map(
      (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.9 }),
    );
    const emberMaterial = new THREE.MeshStandardMaterial({
      color: "#55403a",
      emissive: "#ff5a1f",
      emissiveIntensity: 0,
      roughness: 0.8,
    });
    const stickGeometry = new THREE.CylinderGeometry(0.008, 0.012, 0.8, 10);
    const emberGeometry = new THREE.SphereGeometry(0.018, 8, 8);
    const plantedIncense = new THREE.Group();
    plantedIncense.visible = false;
    incenseContent.add(plantedIncense);
    geometries.push(stickGeometry, emberGeometry);

    const plantedStickLayout = [
      { x: -0.071, z: -0.012, tilt: -0.024, top: 2.438 },
      { x: 0, z: 0.012, tilt: 0.012, top: 2.452 },
      { x: 0.071, z: -0.006, tilt: 0.027, top: 2.438 },
    ];
    for (const { x, z, tilt, top } of plantedStickLayout) {
      const stick = new THREE.Mesh(stickGeometry, incenseMaterial);
      stick.position.set(x, 2.05, z);
      stick.rotation.z = tilt;
      plantedIncense.add(stick);

      const ember = new THREE.Mesh(emberGeometry, emberMaterial);
      ember.position.set(x, top, z);
      plantedIncense.add(ember);
    }

    const ritualStickGeometry = new THREE.CylinderGeometry(
      0.006,
      0.009,
      0.52,
      10,
    );
    geometries.push(ritualStickGeometry);

    const sourceIncense = new THREE.Group();
    sourceIncense.position.set(-1.38, 1.315, 0.66);
    sourceIncense.rotation.x = Math.PI / 2;
    const sourceIncenseSticks: THREE.Mesh[] = [];
    for (let index = 0; index < 9; index += 1) {
      const stick = new THREE.Mesh(
        ritualStickGeometry,
        sourceIncenseMaterials[index % sourceIncenseMaterials.length],
      );
      stick.position.x = (index - 4) * 0.018;
      stick.rotation.z = ((index % 3) - 1) * 0.012;
      sourceIncense.add(stick);
      sourceIncenseSticks.push(stick);
    }
    scene.add(sourceIncense);

    const heldIncense = new THREE.Group();
    heldIncense.visible = false;
    const heldEmbers: THREE.Mesh[] = [];
    for (const x of [-0.044, 0, 0.044]) {
      const stick = new THREE.Mesh(ritualStickGeometry, incenseMaterial);
      stick.position.set(x, 0.26, 0);
      heldIncense.add(stick);

      const ember = new THREE.Mesh(emberGeometry, emberMaterial);
      ember.position.set(x, 0.52, 0);
      ember.visible = false;
      heldIncense.add(ember);
      heldEmbers.push(ember);
    }
    scene.add(heldIncense);

    const handRoot = new THREE.Group();
    handRoot.visible = false;
    scene.add(handRoot);

    const handTexture = textureLoader.load("/images/ritual-hand-pinch-v1.png");
    handTexture.colorSpace = THREE.SRGBColorSpace;
    const handSpriteMaterial = new THREE.MeshBasicMaterial({
      map: handTexture,
      transparent: true,
      alphaTest: 0.035,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const handSpriteGeometry = new THREE.PlaneGeometry(0.85, 0.567);
    const handSprite = new THREE.Mesh(handSpriteGeometry, handSpriteMaterial);
    handSprite.position.z = -0.22;
    handSprite.renderOrder = 8;
    handSprite.userData.excludeFromAltarBounds = true;
    handSprite.userData.skipShadow = true;
    handRoot.add(handSprite);

    const lighterHandRoot = new THREE.Group();
    lighterHandRoot.visible = false;
    scene.add(lighterHandRoot);

    const lighterHandTexture = textureLoader.load(
      "/images/ritual-lighter-hand-v1.png",
    );
    lighterHandTexture.colorSpace = THREE.SRGBColorSpace;
    const lighterHandMaterial = new THREE.MeshBasicMaterial({
      map: lighterHandTexture,
      transparent: true,
      alphaTest: 0.035,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const lighterHandGeometry = new THREE.PlaneGeometry(1.15, 0.767);
    const lighterHandSprite = new THREE.Mesh(
      lighterHandGeometry,
      lighterHandMaterial,
    );
    lighterHandSprite.position.z = 0.12;
    lighterHandSprite.renderOrder = 7;
    lighterHandSprite.userData.excludeFromAltarBounds = true;
    lighterHandSprite.userData.skipShadow = true;
    lighterHandRoot.add(lighterHandSprite);

    const lighterFlame = new THREE.Group();
    lighterFlame.position.set(-0.32, 0.28, 0.25);
    lighterFlame.visible = false;
    const lighterFlameOuterGeometry = new THREE.ConeGeometry(
      0.025,
      0.12,
      12,
    );
    const lighterFlameInnerGeometry = new THREE.ConeGeometry(
      0.013,
      0.075,
      12,
    );
    geometries.push(lighterFlameOuterGeometry, lighterFlameInnerGeometry);
    const lighterFlameOuterMaterial = new THREE.MeshBasicMaterial({
      color: "#ff8b32",
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      toneMapped: false,
    });
    const lighterFlameInnerMaterial = new THREE.MeshBasicMaterial({
      color: "#fff1a8",
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
      toneMapped: false,
    });
    const lighterFlameOuter = new THREE.Mesh(
      lighterFlameOuterGeometry,
      lighterFlameOuterMaterial,
    );
    const lighterFlameInner = new THREE.Mesh(
      lighterFlameInnerGeometry,
      lighterFlameInnerMaterial,
    );
    lighterFlameOuter.renderOrder = 12;
    lighterFlameInner.renderOrder = 13;
    lighterFlameOuter.userData.excludeFromAltarBounds = true;
    lighterFlameInner.userData.excludeFromAltarBounds = true;
    lighterFlame.add(lighterFlameOuter, lighterFlameInner);
    lighterHandRoot.add(lighterFlame);
    const lighterGlow = new THREE.PointLight("#ff9f43", 0, 0.9, 2);
    lighterGlow.position.set(-0.32, 0.29, 0.29);
    lighterHandRoot.add(lighterGlow);

    const incenseLight = new THREE.PointLight("#ff8b45", 0, 2, 2);
    incenseLight.position.set(0, 2.4, 0);
    incenseContent.add(incenseLight);

    // Tấm gỗ tưởng nhớ tổ tiên.
    addRoundedWood(
      1.65, 1.9, 0.08,
      0, 2.4, -1.11,
      0.018,
    );

    // Viền đứng nổi trên mặt gỗ.
    for (const x of [-0.77, 0.77]) {
      addRoundedWood(
        0.07, 1.86, 0.035,
        x, 2.4, -1.055,
        0.008,
      );
    }

    // Viền ngang.
    for (const y of [1.505, 3.295]) {
      addRoundedWood(
        1.47, 0.07, 0.035,
        0, y, -1.055,
        0.008,
      );
    }

    // Viền đồng thanh mảnh quanh bài vị, phối cùng hoa văn trên cánh tủ.
    for (const x of [-0.72, 0.72]) {
      addBox(0.012, 1.66, 0.012, x, 2.4, -1.015, borderMaterial);
    }
    for (const y of [1.58, 3.22]) {
      addBox(1.34, 0.012, 0.012, 0, y, -1.015, borderMaterial);
    }

    let ornamentMaterialForFallback: THREE.MeshPhysicalMaterial | null = null;
    const altarOrnamentTexture = textureLoader.load(
      "/textures/altar-ornament.png",
      undefined,
      undefined,
      () => {
        if (disposed || !ornamentMaterialForFallback) return;
        ornamentMaterialForFallback.map = null;
        ornamentMaterialForFallback.color.set("#75634b");
        ornamentMaterialForFallback.needsUpdate = true;
      },
    );
    altarOrnamentTexture.colorSpace = THREE.SRGBColorSpace;
    altarOrnamentTexture.anisotropy = Math.min(
      8,
      renderer.capabilities.getMaxAnisotropy(),
    );
    const altarOrnamentGeometry = new THREE.PlaneGeometry(1.42, 2.13);
    geometries.push(altarOrnamentGeometry);
    const altarOrnamentMaterial = new THREE.MeshPhysicalMaterial({
      map: altarOrnamentTexture,
      color: "#675b49",
      roughness: 0.78,
      metalness: 0,
      clearcoat: 0,
      clearcoatRoughness: 0.8,
    });
    ornamentMaterialForFallback = altarOrnamentMaterial;
    const altarOrnament = new THREE.Mesh(
      altarOrnamentGeometry,
      altarOrnamentMaterial,
    );
    altarOrnament.position.set(0, 2.4, -1.025);
    altarOrnament.userData.skipShadow = true;
    scene.add(altarOrnament);

    // Chữ in trên nền trong suốt.
    const remembranceCanvas = document.createElement("canvas");
    remembranceCanvas.width = 1024;
    remembranceCanvas.height = 512;

    const remembranceContext = remembranceCanvas.getContext("2d");

    if (remembranceContext) {
      remembranceContext.clearRect(0, 0, 1024, 512);
      remembranceContext.fillStyle = "#f0d9a5";
      remembranceContext.strokeStyle = "rgba(35, 17, 10, 0.8)";
      remembranceContext.textAlign = "center";
      remembranceContext.textBaseline = "middle";
      remembranceContext.shadowColor = "rgba(20, 8, 4, 0.9)";
      remembranceContext.shadowBlur = 7;
      remembranceContext.shadowOffsetY = 2;

      remembranceContext.font =
        '110px Georgia, "Times New Roman", serif';
      remembranceContext.lineWidth = 9;
      remembranceContext.strokeText("Tưởng nhớ", 512, 175);
      remembranceContext.fillText("Tưởng nhớ", 512, 175);

      remembranceContext.font =
        'bold 145px Georgia, "Times New Roman", serif';
      remembranceContext.lineWidth = 11;
      remembranceContext.strokeText("tổ tiên", 512, 335);
      remembranceContext.fillText("tổ tiên", 512, 335);
    }

    const remembranceTexture = new THREE.CanvasTexture(
      remembranceCanvas,
    );
    remembranceTexture.colorSpace = THREE.SRGBColorSpace;

    const remembranceMaterial = new THREE.MeshBasicMaterial({
      map: remembranceTexture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    const remembranceGeometry = new THREE.PlaneGeometry(1.4, 0.7);
    geometries.push(remembranceGeometry);

    const remembranceText = new THREE.Mesh(
      remembranceGeometry,
      remembranceMaterial,
    );

    remembranceText.position.set(0, 2.55, -0.94);
    remembranceText.renderOrder = 10;
    remembranceText.userData.skipShadow = true;

    scene.add(remembranceText);

    // Đặt sau khi đã tạo bàn, lư hương và nhang.
    // Các sprite khói được tạo phía sau nên không tham gia.
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const skipShadow = object.userData.skipShadow === true;

        object.castShadow = !skipShadow;
        object.receiveShadow = !skipShadow;
      }
    });

    // Đo các vật thể của bàn thờ, bỏ sàn và tường nền.
    scene.updateMatrixWorld(true);

    const altarBounds = new THREE.Box3();

    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || object.userData.excludeFromAltarBounds) {
        return;
      }
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];

      const isRoomSurface = materials.some(
        (material) =>
          material === floorMaterial ||
          material === wallMaterial
      );

      if (isRoomSurface) return;

      object.geometry.computeBoundingBox();

      const localBounds = object.geometry.boundingBox;
      if (!localBounds) return;

      const worldBounds = localBounds
        .clone()
        .applyMatrix4(object.matrixWorld);

      altarBounds.union(worldBounds);
    });

    const altarSphere = altarBounds.getBoundingSphere(
      new THREE.Sphere()
    );

    const defaultViewDirection = new THREE.Vector3(
      0.12,
      0.14,
      1
    ).normalize();

    const controls = new OrbitControls(
      camera,
      renderer.domElement
    );

    controls.enablePan = false;
    controls.enableDamping = false;

    controls.minAzimuthAngle = -Math.PI / 4.5;
    controls.maxAzimuthAngle = Math.PI / 4.5;
    controls.minPolarAngle = Math.PI / 3;
    controls.maxPolarAngle = Math.PI / 2;

    const fitCameraToAltar = (resetDirection = false) => {
      const direction = resetDirection
        ? defaultViewDirection.clone()
        : camera.position.clone().sub(controls.target).normalize();

      if (direction.lengthSq() === 0) {
        direction.copy(defaultViewDirection);
      }

      const verticalHalfFov = THREE.MathUtils.degToRad(
        camera.fov / 2
      );

      const horizontalHalfFov = Math.atan(
        Math.tan(verticalHalfFov) * camera.aspect
      );

      const limitingHalfFov = Math.min(
        verticalHalfFov,
        horizontalHalfFov
      );

      // Giữ trọn bàn thờ và thảm lễ trong khung hình.
      const distance =
        (altarSphere.radius / Math.sin(limitingHalfFov)) * 0.82;

      controls.target.copy(altarSphere.center);

      controls.minDistance = distance * 0.55;
      controls.maxDistance = distance * 2;

      camera.position
        .copy(altarSphere.center)
        .addScaledVector(direction, distance);

      camera.near = Math.max(0.01, distance / 100);
      camera.far = Math.max(50, distance * 4);
      camera.updateProjectionMatrix();

      controls.update();
    };

    const render = () => {
      if (contextLost) return;
      renderer.render(scene, camera);
    };
    renderScene = render;

    // Create a soft smoke texture locally.
    const smokeCanvas = document.createElement("canvas");
    smokeCanvas.width = 64;
    smokeCanvas.height = 64;

    const smokeContext = smokeCanvas.getContext("2d");

    if (smokeContext) {
      const gradient = smokeContext.createRadialGradient(32, 32, 0, 32, 32, 32);

      gradient.addColorStop(0, "rgba(220, 215, 205, 0.65)");
      gradient.addColorStop(0.45, "rgba(220, 215, 205, 0.25)");
      gradient.addColorStop(1, "rgba(220, 215, 205, 0)");

      smokeContext.fillStyle = gradient;
      smokeContext.fillRect(0, 0, 64, 64);
    }

    const smokeTexture = new THREE.CanvasTexture(smokeCanvas);

    const smokeParticles: {
      sprite: THREE.Sprite;
      material: THREE.SpriteMaterial;
      originX: number;
      phase: number;
    }[] = [];

    for (const originX of [-0.12, 0, 0.12]) {
      for (let index = 0; index < 6; index += 1) {
        const material = new THREE.SpriteMaterial({
          map: smokeTexture,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        });

        const sprite = new THREE.Sprite(material);
        sprite.visible = false;
        incenseContent.add(sprite);

        smokeParticles.push({
          sprite,
          material,
          originX,
          phase: index / 6,
        });
      }
    }

    const sparkleCanvas = document.createElement("canvas");
    sparkleCanvas.width = 48;
    sparkleCanvas.height = 48;
    const sparkleContext = sparkleCanvas.getContext("2d");
    if (sparkleContext) {
      const glow = sparkleContext.createRadialGradient(24, 24, 0, 24, 24, 24);
      glow.addColorStop(0, "rgba(255, 250, 225, 1)");
      glow.addColorStop(0.28, "rgba(255, 218, 145, 0.88)");
      glow.addColorStop(0.7, "rgba(232, 165, 75, 0.28)");
      glow.addColorStop(1, "rgba(232, 165, 75, 0)");
      sparkleContext.fillStyle = glow;
      sparkleContext.fillRect(0, 0, 48, 48);
    }

    const sparkleTexture = new THREE.CanvasTexture(sparkleCanvas);
    sparkleTexture.colorSpace = THREE.SRGBColorSpace;

    const fireworkBursts: {
      points: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
      positions: THREE.BufferAttribute;
      velocities: THREE.Vector3[];
      center: THREE.Vector3;
      delay: number;
    }[] = [];

    for (const [index, side] of [-1, 1].entries()) {
      const particleCount = 12;
      const geometry = new THREE.BufferGeometry();
      const positions = new THREE.BufferAttribute(
        new Float32Array(particleCount * 3),
        3,
      );
      const colors = new THREE.BufferAttribute(
        new Float32Array(particleCount * 3),
        3,
      );
      const velocities: THREE.Vector3[] = [];

      for (let particle = 0; particle < particleCount; particle += 1) {
        const angle = (particle / particleCount) * Math.PI * 2 + index * 0.12;
        const radius = 0.17 + (particle % 3) * 0.045;
        velocities.push(
          new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            ((particle % 3) - 1) * 0.025,
          ),
        );

        const color = new THREE.Color(
          particle % 3 === 0 ? "#fff0bd" : "#e8ad57",
        );
        colors.setXYZ(particle, color.r, color.g, color.b);
      }

      geometry.setAttribute("position", positions);
      geometry.setAttribute("color", colors);

      const material = new THREE.PointsMaterial({
        map: sparkleTexture,
        size: 0.09,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const points = new THREE.Points(geometry, material);
      points.visible = false;
      points.frustumCulled = false;
      scene.add(points);

      fireworkBursts.push({
        points,
        positions,
        velocities,
        center: new THREE.Vector3(side * 0.98, 3.05, -0.88),
        delay: index * 0.12,
      });
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    let isLit = false;
    let isLighting = false;
    let animationFrame: number | null = null;
    let lastTime: number | null = null;
    let smokeTime = 0;
    let fireworkStartedAt: number | null = null;
    let ritualStartedAt: number | null = null;
    let onRitualComplete: (() => void) | null = null;

    const ritualKeyframes = [
      {
        time: 0,
        hand: new THREE.Vector3(-3.1, 1.48, 0.78),
        incense: new THREE.Vector3(-1.08, 1.315, 0.72),
        incenseRotation: Math.PI / 2,
        handArcHeight: 0,
        incenseArcHeight: 0,
      },
      {
        time: 0.75,
        hand: new THREE.Vector3(-1.38, 1.43, 0.72),
        incense: new THREE.Vector3(-1.08, 1.315, 0.72),
        incenseRotation: Math.PI / 2,
        handArcHeight: 0,
        incenseArcHeight: 0,
      },
      {
        time: 1.05,
        hand: new THREE.Vector3(-1.38, 1.62, 0.72),
        incense: new THREE.Vector3(-1.08, 1.48, 0.72),
        incenseRotation: 0,
        handArcHeight: 0,
        incenseArcHeight: 0,
      },
      {
        time: 2.25,
        hand: new THREE.Vector3(-1.38, 1.62, 0.72),
        incense: new THREE.Vector3(-1.08, 1.48, 0.72),
        incenseRotation: 0,
        handArcHeight: 0,
        incenseArcHeight: 0,
      },
      {
        time: 3.0,
        hand: new THREE.Vector3(-0.3, 1.55, 0.36),
        incense: new THREE.Vector3(0, 1.517, 0.22),
        incenseRotation: 0,
        handArcHeight: 0.4,
        incenseArcHeight: 0.34,
      },
      {
        time: 3.3,
        hand: new THREE.Vector3(-0.3, 1.55, 0.36),
        incense: new THREE.Vector3(0, 1.517, 0.22),
        incenseRotation: 0,
        handArcHeight: 0,
        incenseArcHeight: 0,
      },
      {
        time: 3.65,
        hand: new THREE.Vector3(-0.92, 1.72, 0.72),
        incense: new THREE.Vector3(0, 1.517, 0.22),
        incenseRotation: 0,
        handArcHeight: 0,
        incenseArcHeight: 0,
      },
      {
        time: 4.4,
        hand: new THREE.Vector3(-3.2, 1.92, 0.92),
        incense: new THREE.Vector3(0, 1.517, 0.22),
        incenseRotation: 0,
        handArcHeight: 0,
        incenseArcHeight: 0,
      },
    ];

    const lighterKeyframes = [
      {
        time: 0,
        position: new THREE.Vector3(3.2, 1.55, 0.55),
        arcHeight: 0,
      },
      {
        time: 0.82,
        position: new THREE.Vector3(3.2, 1.55, 0.55),
        arcHeight: 0,
      },
      {
        time: 1.35,
        position: new THREE.Vector3(-0.76, 1.72, 0.55),
        arcHeight: 0.3,
      },
      {
        time: 1.9,
        position: new THREE.Vector3(-0.76, 1.72, 0.55),
        arcHeight: 0,
      },
      {
        time: 2.25,
        position: new THREE.Vector3(0.5, 1.92, 0.5),
        arcHeight: 0.12,
      },
      {
        time: 2.55,
        position: new THREE.Vector3(3.2, 1.55, 0.55),
        arcHeight: 0,
      },
    ];

    const ritualPickupTime = 0.75;
    const lighterFlameStart = 1.35;
    const lighterFlameEnd = 1.95;
    const ritualIgnitionTime = 1.5;
    const ritualPlantTime = 3.0;
    const ritualDuration = 4.4;

    const updateSmoke = () => {
      for (const particle of smokeParticles) {
        const progress = (particle.phase + smokeTime * 0.15) % 1;
        const drift = Math.sin(progress * Math.PI * 2 + particle.originX);

        particle.sprite.visible = isLit;

        particle.sprite.position.set(
          particle.originX + drift * progress * 0.14,
          2.48 + progress * 0.95,
          progress * 0.04,
        );

        const size = 0.07 + progress * 0.2;
        particle.sprite.scale.set(size, size, 1);

        particle.material.opacity = isLit
          ? Math.sin(progress * Math.PI) * 0.18
          : 0;
      }
    };

    const updateIncenseRitual = (time: number) => {
      if (!isLighting || ritualStartedAt === null) return;

      const elapsed = (time - ritualStartedAt) / 1000;
      const nextFrameIndex = ritualKeyframes.findIndex(
        (frame, index) =>
          index < ritualKeyframes.length - 1 &&
          elapsed >= frame.time &&
          elapsed <= ritualKeyframes[index + 1].time,
      );
      const frameIndex = Math.max(
        0,
        Math.min(nextFrameIndex, ritualKeyframes.length - 2),
      );
      const from = ritualKeyframes[frameIndex];
      const to = ritualKeyframes[frameIndex + 1];
      const progress = THREE.MathUtils.clamp(
        (elapsed - from.time) / (to.time - from.time),
        0,
        1,
      );
      const eased = progress * progress * (3 - 2 * progress);

      handRoot.position.lerpVectors(from.hand, to.hand, eased);
      handRoot.position.y += from.handArcHeight * Math.sin(eased * Math.PI);
      heldIncense.position.lerpVectors(from.incense, to.incense, eased);
      heldIncense.position.y +=
        from.incenseArcHeight * Math.sin(eased * Math.PI);
      heldIncense.rotation.x = THREE.MathUtils.lerp(
        from.incenseRotation,
        to.incenseRotation,
        eased,
      );

      const lighterNextFrameIndex = lighterKeyframes.findIndex(
        (frame, index) =>
          index < lighterKeyframes.length - 1 &&
          elapsed >= frame.time &&
          elapsed <= lighterKeyframes[index + 1].time,
      );
      if (lighterNextFrameIndex < 0) {
        lighterHandRoot.position.copy(
          lighterKeyframes[lighterKeyframes.length - 1].position,
        );
      } else {
        const lighterFrom = lighterKeyframes[lighterNextFrameIndex];
        const lighterTo = lighterKeyframes[lighterNextFrameIndex + 1];
        const lighterProgress = THREE.MathUtils.clamp(
          (elapsed - lighterFrom.time) /
            (lighterTo.time - lighterFrom.time),
          0,
          1,
        );
        const lighterEased =
          lighterProgress * lighterProgress * (3 - 2 * lighterProgress);
        lighterHandRoot.position.lerpVectors(
          lighterFrom.position,
          lighterTo.position,
          lighterEased,
        );
        lighterHandRoot.position.y +=
          lighterFrom.arcHeight * Math.sin(lighterEased * Math.PI);
      }
      lighterHandRoot.visible = elapsed >= 0.82 && elapsed < 2.55;
      const isLighterFlameOn =
        elapsed >= lighterFlameStart && elapsed < lighterFlameEnd;
      lighterFlame.visible = isLighterFlameOn;
      lighterGlow.intensity = isLighterFlameOn
        ? 1.1 + Math.sin(time * 0.06) * 0.18
        : 0;
      lighterFlame.scale.y = 0.94 + Math.sin(time * 0.08) * 0.12;
      lighterFlame.rotation.z = Math.sin(time * 0.05) * 0.07;

      if (elapsed >= ritualPickupTime) {
        for (const stick of sourceIncenseSticks.slice(3, 6)) {
          stick.visible = false;
        }
      }
      heldIncense.visible =
        elapsed >= ritualPickupTime && elapsed < ritualPlantTime;

      if (elapsed >= ritualIgnitionTime) {
        for (const ember of heldEmbers) ember.visible = true;
        emberMaterial.color.set("#ff9a50");
        emberMaterial.emissiveIntensity = elapsed < ritualPlantTime ? 1.5 : 2;
      }

      if (elapsed >= ritualPlantTime && !isLit) {
        heldIncense.visible = false;
        plantedIncense.visible = true;
        incenseLight.intensity = 4;
        isLit = true;
        smokeTime = 0;
      }

      if (elapsed >= ritualDuration) {
        handRoot.visible = false;
        lighterHandRoot.visible = false;
        lighterFlame.visible = false;
        lighterGlow.intensity = 0;
        isLighting = false;
        ritualStartedAt = null;
        fireworkStartedAt = time;
        const complete = onRitualComplete;
        onRitualComplete = null;
        complete?.();
      }
    };

    const finishRitualImmediately = () => {
      if (!isLighting) return;

      for (const stick of sourceIncenseSticks.slice(3, 6)) {
        stick.visible = false;
      }
      heldIncense.visible = false;
      handRoot.visible = false;
      lighterHandRoot.visible = false;
      lighterFlame.visible = false;
      lighterGlow.intensity = 0;
      plantedIncense.visible = true;
      emberMaterial.color.set("#ff9a50");
      emberMaterial.emissiveIntensity = 2;
      incenseLight.intensity = 4;
      isLit = true;
      isLighting = false;
      ritualStartedAt = null;
      fireworkStartedAt = null;
      smokeTime = 0;

      const complete = onRitualComplete;
      onRitualComplete = null;
      complete?.();
    };

    const updateFireworks = (time: number) => {
      if (!isLit || reducedMotion.matches || fireworkStartedAt === null) {
        for (const burst of fireworkBursts) {
          burst.points.visible = false;
          burst.points.material.opacity = 0;
        }
        if (reducedMotion.matches) fireworkStartedAt = null;
        return;
      }

      const elapsed = (time - fireworkStartedAt) / 1000;
      const duration = 1.35;

      for (const burst of fireworkBursts) {
        const progress = (elapsed - burst.delay) / duration;
        if (progress < 0 || progress >= 1) {
          burst.points.visible = false;
          burst.points.material.opacity = 0;
          continue;
        }

        const expansion = 1 - (1 - progress) ** 2;
        burst.points.visible = true;
        burst.points.material.opacity = Math.sin(progress * Math.PI) * 0.72;

        for (const [particle, velocity] of burst.velocities.entries()) {
          burst.positions.setXYZ(
            particle,
            burst.center.x + velocity.x * expansion,
            burst.center.y + velocity.y * expansion + progress * 0.045,
            burst.center.z + velocity.z * expansion,
          );
        }
        burst.positions.needsUpdate = true;
      }

      if (elapsed >= duration + 0.12) fireworkStartedAt = null;
    };

    const stopSmokeAnimation = () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }

      animationFrame = null;
      lastTime = null;
    };

    const animateSmoke = (time: number) => {
      animationFrame = null;

      if (
        contextLost ||
        (!isLit && !isLighting) ||
        document.hidden
      ) {
        lastTime = null;
        return;
      }

      if (lastTime !== null && !reducedMotion.matches) {
        // Limit the time step so smoke does not jump on a slow device.
        smokeTime += Math.min((time - lastTime) / 1000, 0.05);
      }

      lastTime = time;
      if (!reducedMotion.matches) updateSmoke();
      updateIncenseRitual(time);
      updateFireworks(time);
      render();

      animationFrame = requestAnimationFrame(animateSmoke);
    };

    const syncSmokeAnimation = () => {
      stopSmokeAnimation();
      if (contextLost) return;
      updateSmoke();
      updateIncenseRitual(performance.now());
      updateFireworks(performance.now());
      render();

      if (
        (isLighting || (isLit && !reducedMotion.matches)) &&
        !document.hidden
      ) {
        animationFrame = requestAnimationFrame(animateSmoke);
      }
    };

    const handleContextLost = () => {
      contextLost = true;
      stopSmokeAnimation();
      finishRitualImmediately();

      controls.enabled = false;
      resetRef.current = null;
      viewRef.current = null;
      incenseRef.current = null;

      setError(
        "Cảnh 3D đã tạm ngừng do mất kết nối đồ họa. Bạn hãy đóng cảnh rồi mở lại, hoặc tiếp tục ở những mục bên dưới."
      );
    };

    renderer.domElement.addEventListener(
      "webglcontextlost",
      handleContextLost
    );

    reducedMotion.addEventListener("change", syncSmokeAnimation);
    document.addEventListener("visibilitychange", syncSmokeAnimation);

    incenseRef.current = {
      light: (onComplete) => {
        if (isLit || isLighting) return;

        isLighting = true;
        ritualStartedAt = performance.now();
        onRitualComplete = onComplete;
        handRoot.visible = true;
        heldIncense.visible = false;
        plantedIncense.visible = false;
        for (const ember of heldEmbers) ember.visible = false;
        emberMaterial.color.set("#55403a");
        emberMaterial.emissiveIntensity = 0;
        incenseLight.intensity = 0;

        syncSmokeAnimation();
      },
    };

    let hasInitialView = false;

    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;

      if (width <= 0 || height <= 0) return;

      renderer.setSize(width, height);
      camera.aspect = width / height;

      fitCameraToAltar(!hasInitialView);
      hasInitialView = true;

      render();
    };

    // Chỉ vẽ lại khi đổi góc nhìn hoặc kích thước.
    controls.addEventListener("change", render);

    resetRef.current = () => {
      fitCameraToAltar(true);
      render();
    };

    viewRef.current = {
      rotate: (angle) => {
        const offset = camera.position.clone().sub(controls.target);
        const spherical = new THREE.Spherical().setFromVector3(offset);

        spherical.theta += angle;

        camera.position
          .copy(controls.target)
          .add(new THREE.Vector3().setFromSpherical(spherical));

        controls.update();
        render();
      },

      zoom: (factor) => {
        const offset = camera.position.clone().sub(controls.target);

        const distance = THREE.MathUtils.clamp(
          offset.length() * factor,
          controls.minDistance,
          controls.maxDistance,
        );

        offset.setLength(distance);
        camera.position.copy(controls.target).add(offset);

        controls.update();
        render();
      },
    };

    const decorationRoot = new THREE.Group();
    decorationRoot.matrixAutoUpdate = false;

    // Mặt bàn trong cảnh hiện tại nằm ở cao độ 1.3.
    // Đặt vật phẩm nhỏ phía trước bên trái lư hương.
    decorationRoot.position.set(-0.55, 1.3, 0.38);
    decorationRoot.updateMatrix();

    scene.add(decorationRoot);

    let currentDecoration: THREE.Group | null = null;
    let currentDecorationId: DecorationId | null = null;

    const setDecoration = (nextId: DecorationId | null) => {
      if (nextId === currentDecorationId) return;

      if (currentDecoration) {
        disposeDigitalDecoration(currentDecoration);
        currentDecoration = null;
      }

      currentDecorationId = nextId;

      if (nextId === "boiled-chicken") {
        // Đặt gà cúng cân đối ở khoảng trống phía trước bên trái bàn thờ.
        decorationRoot.position.set(-0.68, 1.3, 0.52);
        decorationRoot.scale.setScalar(0.68);
      } else {
        decorationRoot.position.set(-0.55, 1.3, 0.38);
        decorationRoot.scale.setScalar(1);
      }
      decorationRoot.updateMatrix();

      if (nextId) {
        currentDecoration = createDigitalDecoration(nextId, () => {
          if (disposed || currentDecorationId !== nextId) return;
          renderer.shadowMap.needsUpdate = true;
          render();
        });
        decorationRoot.add(currentDecoration);
      }

      renderer.shadowMap.needsUpdate = true;
      render();
    };

    decorationControllerRef.current = {
      set: setDecoration,
    };

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    sceneReady = true;
    revealSceneWhenReady();

    return () => {
      disposed = true;
      decorationControllerRef.current = null;

      if (currentDecoration) {
        disposeDigitalDecoration(currentDecoration);
        currentDecoration = null;
      }

      decorationRoot.removeFromParent();

      stopSmokeAnimation();
      renderer.domElement.removeEventListener(
        "webglcontextlost",
        handleContextLost
      );

      reducedMotion.removeEventListener("change", syncSmokeAnimation);
      document.removeEventListener("visibilitychange", syncSmokeAnimation);

      observer.disconnect();
      controls.removeEventListener("change", render);
      controls.dispose();

      resetRef.current = null;
      viewRef.current = null;
      incenseRef.current = null;

      for (const particle of smokeParticles) {
        incenseContent.remove(particle.sprite);
        particle.material.dispose();
      }

      for (const burst of fireworkBursts) {
        scene.remove(burst.points);
        burst.points.geometry.dispose();
        burst.points.material.dispose();
      }

      scene.remove(sourceIncense, heldIncense, handRoot, lighterHandRoot);
      handSpriteGeometry.dispose();
      handSpriteMaterial.dispose();
      handTexture.dispose();
      lighterHandGeometry.dispose();
      lighterHandMaterial.dispose();
      lighterHandTexture.dispose();
      lighterFlameOuterMaterial.dispose();
      lighterFlameInnerMaterial.dispose();

      smokeTexture.dispose();
      sparkleTexture.dispose();
      incenseMaterial.dispose();
      sourceIncenseMaterials.forEach((material) => material.dispose());
      emberMaterial.dispose();
      ashMaterial.dispose();
      porcelainMaterial.dispose();
      porcelainTexture.dispose();
      blueMaterial.dispose();
      branchMaterial.dispose();
      fruitMaterials.forEach((material) => material.dispose());
      fruitSkinTextures.forEach((texture) => texture.dispose());
      leafMaterial.dispose();
      candleMaterial.dispose();
      candleFlameMaterial.dispose();
      flowerMaterial.dispose();
      flowerCenterMaterial.dispose();
      melonMaterial.dispose();
      melonTexture.dispose();

      geometries.forEach((geometry) => geometry.dispose());

      wood.dispose();
      doorMaterial.dispose();
      doorTexture.dispose();
      floorTexture.dispose();
      wallMaterial.dispose();
      wallTexture.dispose();
      altarOrnamentMaterial.dispose();
      altarOrnamentTexture.dispose();
      remembranceMaterial.dispose();
      remembranceTexture.dispose();
      borderMaterial.dispose();
      bronze.dispose();
      floorMaterial.dispose();
      rugMaterial.dispose();

      light.shadow.dispose();
      scene.environment = null;
      environmentTarget.dispose();
      woodTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    decorationControllerRef.current?.set(decoration);
  }, [decoration]);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-md">
      {/* 3D Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-soft/80 p-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Badge
            variant="outline"
            className="text-xs px-2.5 py-0.5 font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-400/40 gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Mô hình 3D tương tác</span>
          </Badge>
          <span className="text-xs text-stone-500 dark:text-stone-400 hidden sm:inline">
            Góc tri ân và không gian bài trí
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={Boolean(error)}
          onClick={() => resetRef.current?.()}
          className="text-xs border-line text-ink hover:text-accent cursor-pointer gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Đặt lại góc nhìn</span>
        </Button>
      </div>

      {/* 3D Canvas Viewport */}
      {error ? (
        <div role="status" className="p-8 text-center bg-surface-soft">
          <p className="text-sm text-stone-600 dark:text-stone-300">{error}</p>
        </div>
      ) : (
        <div className="relative">
          <div
            ref={hostRef}
            className="h-[360px] w-full sm:h-[440px] lg:h-[500px]"
          />

          {sceneLoading && (
            <div
              role="status"
              aria-live="polite"
              className="absolute inset-0 z-20 flex items-center justify-center bg-[#eee9df]"
            >
              <div className="flex flex-col items-center gap-3 text-center text-stone-700">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-amber-700/25 border-t-amber-800" />
                <span className="text-sm font-medium">
                  Đang chuẩn bị không gian bàn thờ…
                </span>
              </div>
            </div>
          )}

          {textureFallbackUsed && !sceneLoading && (
            <div
              role="status"
              className="absolute bottom-3 left-3 z-20 rounded-lg bg-white/90 px-3 py-2 text-xs text-stone-700 shadow-sm"
            >
              Một số chất liệu chưa tải được; cảnh đang dùng màu dự phòng.
            </div>
          )}

          {/* Quick Incense Status Pill over 3D Canvas */}
          <div
            role="status"
            aria-live="polite"
            className="absolute top-3.5 left-3.5 pointer-events-none z-10"
          >
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm transition-all ${
                incenseLighting || incenseLit
                  ? "bg-amber-950/80 text-amber-200 border border-amber-400/50"
                  : "bg-black/50 text-stone-200 border border-white/20"
              }`}
            >
              <Flame
                className={`w-3.5 h-3.5 ${
                  incenseLighting || incenseLit
                    ? "text-amber-400 animate-pulse fill-current"
                    : "text-stone-400"
                }`}
              />
              <span>
                {incenseLighting
                  ? "Đang thắp hương"
                  : incenseLit
                    ? "Hương đang thắp"
                    : "Hương chưa thắp"}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Interactive Controls Toolbar */}
      <div className="flex justify-center border-t border-line bg-surface p-4 sm:p-6">
        {/* Incense Action Button */}
        <button
          type="button"
          disabled={Boolean(error) || sceneLoading || incenseLighting || incenseLit}
          aria-busy={incenseLighting}
          onClick={handleLightIncense}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-80 ${
            incenseLit
              ? "bg-stone-800 text-stone-200 border border-stone-600"
              : "bg-gradient-to-r from-red-800 via-amber-800 to-red-900 text-white shadow-amber-900/20 hover:from-red-700 hover:to-amber-700"
          }`}
        >
          <Flame
            className={`w-4 h-4 ${
              incenseLighting || incenseLit
                ? "text-amber-400 animate-pulse fill-current"
                : "text-amber-200"
            }`}
          />
          <span>
            {incenseLighting
              ? "Đang thắp hương…"
              : incenseLit
                ? "Hương đang cháy"
                : "Thắp hương lòng"}
          </span>
        </button>
      </div>
      {children}
    </div>
  );
};

