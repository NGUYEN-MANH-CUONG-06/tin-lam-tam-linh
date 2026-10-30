import fs from 'node:fs';

const file = 'src/components/createDigitalDecoration.ts';
let code = fs.readFileSync(file, 'utf8');

const startMarker = '  if (id === "boiled-chicken") {';
const endMarker = '  } else if (id === "incense-burner") {';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  throw new Error(`Markers not found: startIndex=${startIndex}, endIndex=${endIndex}`);
}

const replacement = `  if (id === "boiled-chicken") {
    // Model 3D gà cúng 180.000 tam giác từ file GLB (tách 3 vật liệu: mâm sứ trắng, da vàng óng, mào đỏ tươi)
    const chickenHolder = new THREE.Group();
    // Góc xoay hướng nhẹ về trung tâm bàn thờ (~25° - 35°) để lộ cánh, mào và đầu gà uy nghiêm
    chickenHolder.rotation.y = 0.52;
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
`;

code = code.slice(0, startIndex) + replacement + code.slice(endIndex);
fs.writeFileSync(file, code);
console.log('Successfully updated createDigitalDecoration.ts');
