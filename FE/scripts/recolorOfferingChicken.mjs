import fs from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const inputGlb = 'public/models/offering-chicken.original-single.glb';
const buf = fs.readFileSync(inputGlb);
const gltf = await new Promise((resolve, reject) => {
  new GLTFLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', resolve, reject);
});
const geom = gltf.scene.children[0].geometry;
const posAttr = geom.attributes.position;
const normAttr = geom.attributes.normal;
const indexAttr = geom.index;

const compactCount = posAttr.count;
const triCount = indexAttr.count / 3;
console.log('Loaded geometry with', compactCount, 'vertices and', triCount, 'triangles');

const pos = posAttr.array;
const norm = normAttr.array;
const indices = indexAttr.array;

// Compute face normals & centers
const faceNormals = new Float32Array(triCount * 3);
const faceCenters = new Float32Array(triCount * 3);
const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();
const cb = new THREE.Vector3(), ab = new THREE.Vector3();

for (let i = 0; i < triCount; i++) {
  const i3 = i * 3;
  const a = indices[i3], b = indices[i3 + 1], c = indices[i3 + 2];
  vA.fromArray(pos, a * 3);
  vB.fromArray(pos, b * 3);
  vC.fromArray(pos, c * 3);
  cb.subVectors(vC, vB);
  ab.subVectors(vA, vB);
  cb.cross(ab).normalize();
  faceNormals[i3] = cb.x; faceNormals[i3 + 1] = cb.y; faceNormals[i3 + 2] = cb.z;
  faceCenters[i3] = (vA.x + vB.x + vC.x) / 3;
  faceCenters[i3 + 1] = (vA.y + vB.y + vC.y) / 3;
  faceCenters[i3 + 2] = (vA.z + vB.z + vC.z) / 3;
}

// Edge adjacency
const edgeToTri = new Map();
for (let i = 0; i < triCount; i++) {
  const i3 = i * 3;
  const a = indices[i3], b = indices[i3 + 1], c = indices[i3 + 2];
  for (const [v1, v2] of [[Math.min(a,b), Math.max(a,b)], [Math.min(b,c), Math.max(b,c)], [Math.min(c,a), Math.max(c,a)]]) {
    const key = (BigInt(v1) << 32n) | BigInt(v2);
    let arr = edgeToTri.get(key);
    if (!arr) { arr = []; edgeToTri.set(key, arr); }
    arr.push(i);
  }
}

const triAdj = Array.from({ length: triCount }, () => []);
for (const [key, tris] of edgeToTri.entries()) {
  if (tris.length === 2) {
    triAdj[tris[0]].push(tris[1]);
    triAdj[tris[1]].push(tris[0]);
  }
}

// --- 1. SEGMENT COMB (MÀO GÀ) ---
let topTri = 0, topY = -Infinity;
for (let i = 0; i < triCount; i++) {
  if (faceCenters[i * 3 + 1] > topY) {
    topY = faceCenters[i * 3 + 1];
    topTri = i;
  }
}

const isComb = new Uint8Array(triCount);
const combQueue = [topTri];
isComb[topTri] = 1;

while (combQueue.length > 0) {
  const curr = combQueue.pop();
  for (const next of triAdj[curr]) {
    if (isComb[next]) continue;
    const x = faceCenters[next * 3], y = faceCenters[next * 3 + 1], z = faceCenters[next * 3 + 2];
    if (y < 0.422) continue; // Comb base line
    if (z < 0.11 || z > 0.25) continue; // Comb length in Z
    if (x < 0.055 || x > 0.112) continue; // Comb width in X
    isComb[next] = 1;
    combQueue.push(next);
  }
}

// Comb smoothing pass
for (let i = 0; i < triCount; i++) {
  if (!isComb[i] && faceCenters[i * 3 + 1] > 0.425) {
    const combNeighbors = triAdj[i].filter(n => isComb[n]).length;
    if (combNeighbors >= 2) isComb[i] = 1;
  }
}

// --- 2. SEGMENT PLATE (MÂM TRẮNG) ---
// Plate geometry characteristics:
// Outer wavy rim extends to X in [-0.345, 0.345], Z in [-0.39, 0.39], rising to Y up to 0.080.
// Underneath the plate (foot ring & bottom) Y < 0.015.
// Inside the dish basin around the chicken, the dish surface has Y < 0.024.
// The chicken body (drumstick/foot, breast, neck) sits on top and has Y > 0.022.
const isPlate = new Uint8Array(triCount);
const plateQueue = [];

// Seed bottom & outer rim of plate (definitely not chicken)
for (let i = 0; i < triCount; i++) {
  const y = faceCenters[i * 3 + 1];
  const x = faceCenters[i * 3];
  const z = faceCenters[i * 3 + 2];
  const ny = faceNormals[i * 3 + 1];

  // Underneath the plate (facing down):
  if (y < 0.012 && ny < 0) {
    isPlate[i] = 1;
    plateQueue.push(i);
  }
  // Outermost wavy rim of the dish (outside chicken bounding box in XZ):
  if (y < 0.082 && (x < -0.25 || x > 0.29 || z < -0.28 || z > 0.345)) {
    isPlate[i] = 1;
    plateQueue.push(i);
  }
}

while (plateQueue.length > 0) {
  const curr = plateQueue.pop();
  const c3 = curr * 3;
  for (const next of triAdj[curr]) {
    if (isPlate[next] || isComb[next]) continue;
    const n3 = next * 3;
    const nY = faceCenters[n3 + 1];
    const nX = faceCenters[n3];
    const nZ = faceCenters[n3 + 2];
    const normY = faceNormals[n3 + 1];

    if (nY > 0.082) continue; // Above plate rim

    // In the central area where the chicken sits:
    // Chicken body starts above Y = 0.022 unless it's the downward-facing plate underside.
    const inCentralArea = (nX >= -0.22 && nX <= 0.26 && nZ >= -0.25 && nZ <= 0.31);
    if (inCentralArea && nY > 0.022 && normY < 0.88) {
      // This is chicken leg/foot or chicken body, not plate basin!
      continue;
    }

    const dot = faceNormals[c3] * faceNormals[n3] + faceNormals[c3 + 1] * faceNormals[n3 + 1] + faceNormals[c3 + 2] * faceNormals[n3 + 2];
    if (dot < 0.52 && nY > 0.015) continue; // Crease boundary

    isPlate[next] = 1;
    plateQueue.push(next);
  }
}

// Plate morphological cleanup passes (fill pinholes on the plate)
for (let iter = 0; iter < 4; iter++) {
  let changed = 0;
  for (let i = 0; i < triCount; i++) {
    if (!isPlate[i] && !isComb[i]) {
      const y = faceCenters[i * 3 + 1];
      const x = faceCenters[i * 3];
      const z = faceCenters[i * 3 + 2];
      // Only clean up on outer plate or underside
      const isOuter = (x < -0.24 || x > 0.28 || z < -0.27 || z > 0.33 || y < 0.015);
      if (isOuter && y < 0.082) {
        const plateNeighbors = triAdj[i].filter(n => isPlate[n]).length;
        if (plateNeighbors >= 2) {
          isPlate[i] = 1;
          changed++;
        }
      }
    }
  }
  if (changed === 0) break;
}

// Remove any isolated plate triangles that crept into chicken area
for (let i = 0; i < triCount; i++) {
  if (isPlate[i]) {
    const y = faceCenters[i * 3 + 1];
    const x = faceCenters[i * 3];
    const z = faceCenters[i * 3 + 2];
    if (x >= -0.20 && x <= 0.24 && z >= -0.22 && z <= 0.28 && y > 0.025) {
      const chickenNeighbors = triAdj[i].filter(n => !isPlate[n] && !isComb[n]).length;
      if (chickenNeighbors >= 2) {
        isPlate[i] = 0;
      }
    }
  }
}

// Partition triangles into 3 index lists
const plateTris = [];
const skinTris = [];
const combTris = [];

for (let i = 0; i < triCount; i++) {
  const i3 = i * 3;
  const a = indices[i3], b = indices[i3 + 1], c = indices[i3 + 2];
  if (isComb[i]) {
    combTris.push(a, b, c);
  } else if (isPlate[i]) {
    plateTris.push(a, b, c);
  } else {
    skinTris.push(a, b, c);
  }
}

console.log('Partitioned triangles:', {
  plate: plateTris.length / 3,
  skin: skinTris.length / 3,
  comb: combTris.length / 3,
  total: (plateTris.length + skinTris.length + combTris.length) / 3
});

const plateIndices = new Uint32Array(plateTris);
const skinIndices = new Uint32Array(skinTris);
const combIndices = new Uint32Array(combTris);

const posBuffer = Buffer.from(pos.buffer, pos.byteOffset, pos.byteLength);
const normBuffer = Buffer.from(norm.buffer, norm.byteOffset, norm.byteLength);
const plateBuffer = Buffer.from(plateIndices.buffer, plateIndices.byteOffset, plateIndices.byteLength);
const skinBuffer = Buffer.from(skinIndices.buffer, skinIndices.byteOffset, skinIndices.byteLength);
const combBuffer = Buffer.from(combIndices.buffer, combIndices.byteOffset, combIndices.byteLength);

const arrays = [posBuffer, normBuffer, plateBuffer, skinBuffer, combBuffer];
const binary = Buffer.concat(arrays);

let byteOffset = 0;
const bufferViews = arrays.map(a => {
  const view = { buffer: 0, byteOffset, byteLength: a.byteLength };
  byteOffset += a.byteLength;
  return view;
});

const bounds = geom.boundingBox;

// Rich authentic PBR material colors:
const plateColor = new THREE.Color('#faf7f2'); // Sứ trắng ngà bóng
const skinColor = new THREE.Color('#cca038'); // Da gà luộc vàng óng truyền thống
const combColor = new THREE.Color('#b82015'); // Mào gà trống đỏ son

const gltfOut = {
  asset: {
    version: '2.0',
    generator: 'Offering chicken multi-material 3-part partition (Plate, Skin, Comb)',
    copyright: '忆十二六 — CC BY 4.0 — https://www.nexprint.cn/zh/models/G6815293'
  },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0, name: 'OfferingChickenWithPlateAndComb' }],
  meshes: [
    {
      name: 'OfferingChickenMesh',
      primitives: [
        {
          attributes: { POSITION: 0, NORMAL: 1 },
          indices: 2,
          material: 0
        },
        {
          attributes: { POSITION: 0, NORMAL: 1 },
          indices: 3,
          material: 1
        },
        {
          attributes: { POSITION: 0, NORMAL: 1 },
          indices: 4,
          material: 2
        }
      ]
    }
  ],
  materials: [
    {
      name: 'BoiledChickenPlate',
      pbrMetallicRoughness: {
        baseColorFactor: [...plateColor.toArray(), 1],
        metallicFactor: 0.02,
        roughnessFactor: 0.18
      }
    },
    {
      name: 'BoiledChickenSkin',
      pbrMetallicRoughness: {
        baseColorFactor: [...skinColor.toArray(), 1],
        metallicFactor: 0.0,
        roughnessFactor: 0.54
      }
    },
    {
      name: 'BoiledChickenComb',
      pbrMetallicRoughness: {
        baseColorFactor: [...combColor.toArray(), 1],
        metallicFactor: 0.0,
        roughnessFactor: 0.38
      }
    }
  ],
  buffers: [{ byteLength: binary.length }],
  bufferViews,
  accessors: [
    {
      bufferView: 0,
      componentType: 5126,
      count: compactCount,
      type: 'VEC3',
      min: bounds.min.toArray(),
      max: bounds.max.toArray()
    },
    {
      bufferView: 1,
      componentType: 5126,
      count: compactCount,
      type: 'VEC3'
    },
    {
      bufferView: 2,
      componentType: 5125,
      count: plateIndices.length,
      type: 'SCALAR'
    },
    {
      bufferView: 3,
      componentType: 5125,
      count: skinIndices.length,
      type: 'SCALAR'
    },
    {
      bufferView: 4,
      componentType: 5125,
      count: combIndices.length,
      type: 'SCALAR'
    }
  ]
};

let json = Buffer.from(JSON.stringify(gltfOut));
json = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 0x20)]);

const header = Buffer.alloc(20);
header.writeUInt32LE(0x46546c67, 0); // glTF magic
header.writeUInt32LE(2, 4); // version 2
header.writeUInt32LE(12 + 8 + json.length + 8 + binary.length, 8); // total length
header.writeUInt32LE(json.length, 12);
header.writeUInt32LE(0x4e4f534a, 16); // JSON chunk

const binHeader = Buffer.alloc(8);
binHeader.writeUInt32LE(binary.length, 0);
binHeader.writeUInt32LE(0x004e4942, 4); // BIN chunk

const targetPath = 'public/models/offering-chicken.glb';
fs.writeFileSync(targetPath, Buffer.concat([header, json, binHeader, binary]));
console.log('Successfully wrote refined multi-material GLB to', targetPath);
