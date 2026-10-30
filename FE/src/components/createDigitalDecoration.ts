import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export type DecorationId =
  | "lotus-vase"
  | "river-lantern"
  | "jade-lotus"
  | "golden-lotus"
  | "incense-burner"
  | "boiled-chicken";

export function createDigitalDecoration(
  id: DecorationId,
  onAssetLoaded?: () => void,
): THREE.Group {
  const group = new THREE.Group();

  const addMesh = (
    geometry: THREE.BufferGeometry,
    color: string,
    position: [number, number, number]
  ) => {
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.65,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    group.add(mesh);

    return mesh;
  };

  if (id === "boiled-chicken") {
    // Model 3D gà cúng 180.000 tam giác từ file GLB (tách 3 vật liệu: mâm sứ trắng, da vàng óng, mào đỏ tươi)
    const chickenHolder = new THREE.Group();
    // Xoay đĩa gà nằm ngang song song với mép bàn thờ, đầu gà chầu vào trung tâm bát hương
    chickenHolder.rotation.y = Math.PI / 2;
    group.add(chickenHolder);

    const loader = new GLTFLoader();
    loader.load(
      "/models/offering-chicken.glb",
      (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            const mat = child.material;
            if (mat) {
              if (mat.name === "BoiledChickenPlate") {
                child.material = new THREE.MeshPhysicalMaterial({
                  color: "#faf7f2",
                  roughness: 0.18,
                  metalness: 0.02,
                  clearcoat: 0.45,
                  clearcoatRoughness: 0.15,
                });
              } else if (mat.name === "BoiledChickenSkin") {
                child.material = new THREE.MeshPhysicalMaterial({
                  color: "#cca038", // Da gà luộc vàng óng truyền thống
                  roughness: 0.52,
                  metalness: 0.0,
                  clearcoat: 0.12,
                  clearcoatRoughness: 0.42,
                });
              } else if (mat.name === "BoiledChickenComb") {
                child.material = new THREE.MeshPhysicalMaterial({
                  color: "#b82015", // Mào cờ đỏ tươi
                  roughness: 0.38,
                  metalness: 0.0,
                  clearcoat: 0.15,
                });
              }
            }
          }
        });
        chickenHolder.add(model);
        group.updateMatrix();
        onAssetLoaded?.();
      },
      undefined,
      (err) => {
        console.error("Lỗi tải /models/offering-chicken.glb:", err);
      }
    );
  } else if (id === "incense-burner") {
    const bronze = "#a7783c";

    addMesh(
      new THREE.CylinderGeometry(0.13, 0.10, 0.12, 24),
      bronze,
      [0, 0.12, 0]
    );

    addMesh(
      new THREE.CylinderGeometry(0.10, 0.13, 0.07, 24),
      bronze,
      [0, 0.215, 0]
    );

    addMesh(
      new THREE.SphereGeometry(0.025, 12, 8),
      "#d4ad62",
      [0, 0.27, 0]
    );

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;

      addMesh(
        new THREE.CylinderGeometry(0.018, 0.025, 0.07, 10),
        bronze,
        [
          Math.cos(angle) * 0.075,
          0.035,
          Math.sin(angle) * 0.075,
        ]
      );
    }

    for (const side of [-1, 1]) {
      const handle = addMesh(
        new THREE.TorusGeometry(0.04, 0.009, 8, 16),
        bronze,
        [side * 0.14, 0.15, 0]
      );

      handle.rotation.y = Math.PI / 2;
    }
  } else if (
    id === "lotus-vase" ||
    id === "jade-lotus" ||
    id === "golden-lotus"
  ) {
    addMesh(
      new THREE.CylinderGeometry(0.08, 0.11, 0.24, 20),
      id === "jade-lotus"
        ? "#6ee7b7"
        : id === "golden-lotus"
          ? "#d4a437"
          : "#b47b55",
      [0, 0.12, 0]
    );

    for (const x of [-0.055, 0, 0.055]) {
      const height = x === 0 ? 0.24 : 0.18;

      addMesh(
        new THREE.CylinderGeometry(0.006, 0.006, height, 8),
        "#647a52",
        [x, 0.24 + height / 2, 0]
      );

      const flowerY = 0.24 + height;

      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;

        const petal = addMesh(
          new THREE.SphereGeometry(0.045, 12, 8),
          id === "jade-lotus"
            ? "#ecfdf5"
            : id === "golden-lotus"
              ? "#ffe39a"
              : "#d99b9b",
          [
            x + Math.cos(angle) * 0.025,
            flowerY,
            Math.sin(angle) * 0.025,
          ]
        );

        petal.scale.set(0.65, 0.45, 1);
        petal.rotation.y = Math.PI / 2 - angle;
      }

      addMesh(
        new THREE.SphereGeometry(0.022, 12, 8),
        "#d6b75a",
        [x, flowerY + 0.012, 0]
      );
    }
  } else {
    addMesh(
      new THREE.CylinderGeometry(0.14, 0.11, 0.035, 24),
      "#ae7658",
      [0, 0.018, 0]
    );

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;

      const petal = addMesh(
        new THREE.SphereGeometry(0.065, 12, 8),
        "#d7a375",
        [Math.cos(angle) * 0.09, 0.055, Math.sin(angle) * 0.09]
      );

      petal.scale.set(0.6, 0.45, 1);
      petal.rotation.y = Math.PI / 2 - angle;
    }

    addMesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.06, 12),
      "#f1ddba",
      [0, 0.065, 0]
    );

    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.016, 12, 8),
      new THREE.MeshBasicMaterial({
        color: "#ffbd68",
      })
    );

    flame.scale.set(0.65, 1.6, 0.65);
    flame.position.set(0, 0.115, 0);
    group.add(flame);
  }

  return group;
}

export function disposeDigitalDecoration(group: THREE.Group): void {
  const textures = new Set<THREE.Texture>();

  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;

    object.geometry.dispose();

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    materials.forEach((material) => {
      const materialWithTextures = material as THREE.Material & {
        map?: THREE.Texture | null;
        bumpMap?: THREE.Texture | null;
        roughnessMap?: THREE.Texture | null;
      };
      if (materialWithTextures.map) textures.add(materialWithTextures.map);
      if (materialWithTextures.bumpMap) {
        textures.add(materialWithTextures.bumpMap);
      }
      if (materialWithTextures.roughnessMap) {
        textures.add(materialWithTextures.roughnessMap);
      }
      material.dispose();
    });
  });

  textures.forEach((texture) => texture.dispose());
  group.removeFromParent();
}
