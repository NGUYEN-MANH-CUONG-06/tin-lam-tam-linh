import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { unzipSync } from 'three/addons/libs/fflate.module.js';
import { MeshoptSimplifier } from 'three/addons/libs/meshopt_simplifier.module.js';
import * as THREE from 'three';

const input = process.argv[2];
if (!input) throw new Error('Usage: node --max-old-space-size=6144 scripts/convertOfferingChicken.mjs <chicken.3mf>');
const files = unzipSync(new Uint8Array(readFileSync(input)), {
  filter: entry => /3D\/Objects\/.*\.model$/.test(entry.name),
});
const bytes = Object.values(files)[0];
if (!bytes) throw new Error('No 3MF mesh found');
const xml = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
function countTag(tag) {
  let count = 0, offset = 0;
  while ((offset = xml.indexOf(tag, offset)) !== -1) { count++; offset += tag.length; }
  return count;
}
const vertexCount = countTag('<vertex ');
const triangleCount = countTag('<triangle ');
const positions = new Float32Array(vertexCount * 3);
const indices = new Uint32Array(triangleCount * 3);
let vertex = 0, triangle = 0;
const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
for (let offset = 0; offset < xml.length;) {
  let end = Math.min(xml.length, offset + 4 * 1024 * 1024);
  if (end < xml.length) end = xml.indexOf(10, end) + 1;
  const text = xml.toString('utf8', offset, end);
  for (const match of text.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"\s*\/>/g)) {
    // Source is Z-up in millimeters. Convert to right-handed Three.js Y-up.
    const p = [Number(match[1]), Number(match[3]), -Number(match[2])];
    for (let axis = 0; axis < 3; axis++) {
      positions[vertex * 3 + axis] = p[axis];
      min[axis] = Math.min(min[axis], p[axis]);
      max[axis] = Math.max(max[axis], p[axis]);
    }
    vertex++;
  }
  for (const match of text.matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"[^>]*\/>/g)) {
    indices[triangle++] = Number(match[1]);
    indices[triangle++] = Number(match[2]);
    indices[triangle++] = Number(match[3]);
  }
  offset = end;
}
if (vertex !== vertexCount || triangle !== indices.length) throw new Error('Incomplete 3MF parse');
console.log({ vertexCount, triangleCount, min, max });
const scale = 0.78 / Math.max(max[0] - min[0], max[2] - min[2]);
for (let i = 0; i < positions.length; i += 3) {
  positions[i] = (positions[i] - (min[0] + max[0]) / 2) * scale;
  positions[i + 1] = (positions[i + 1] - min[1]) * scale;
  positions[i + 2] = (positions[i + 2] - (min[2] + max[2]) / 2) * scale;
}
await MeshoptSimplifier.ready;
console.time('simplify');
const [simplified, error] = MeshoptSimplifier.simplify(indices, positions, 3, 180000 * 3, 0.003, ['Prune']);
console.timeEnd('simplify');
const [remap, compactCount] = MeshoptSimplifier.compactMesh(simplified);
const compact = new Float32Array(compactCount * 3);
for (let i = 0; i < vertexCount; i++) {
  if (remap[i] < compactCount) compact.set(positions.subarray(i * 3, i * 3 + 3), remap[i] * 3);
}
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(compact, 3));
geometry.setIndex(new THREE.BufferAttribute(simplified, 1));
geometry.computeVertexNormals();
geometry.computeBoundingBox();
const normals = geometry.getAttribute('normal').array;
const bounds = geometry.boundingBox;
const arrays = [compact, normals, simplified];
const binary = Buffer.concat(arrays.map(a => Buffer.from(a.buffer, a.byteOffset, a.byteLength)));
let byteOffset = 0;
const bufferViews = arrays.map(a => { const view = { buffer: 0, byteOffset, byteLength: a.byteLength }; byteOffset += a.byteLength; return view; });
const gltf = {
  asset: { version: '2.0', generator: 'Offering chicken 3MF conversion + meshoptimizer', copyright: '忆十二六 — CC BY 4.0 — https://www.nexprint.cn/zh/models/G6815293' },
  scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0, name: 'WholeBoiledOfferingChicken' }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0 }] }],
  materials: [{ name: 'BoiledChickenSkin', pbrMetallicRoughness: { baseColorFactor: [...new THREE.Color('#d4a34f').toArray(), 1], metallicFactor: 0, roughnessFactor: 0.62 } }],
  buffers: [{ byteLength: binary.length }], bufferViews,
  accessors: [
    { bufferView: 0, componentType: 5126, count: compactCount, type: 'VEC3', min: bounds.min.toArray(), max: bounds.max.toArray() },
    { bufferView: 1, componentType: 5126, count: compactCount, type: 'VEC3' },
    { bufferView: 2, componentType: 5125, count: simplified.length, type: 'SCALAR' },
  ],
};
let json = Buffer.from(JSON.stringify(gltf));
json = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 0x20)]);
const header = Buffer.alloc(20);
header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + json.length + 8 + binary.length, 8);
header.writeUInt32LE(json.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
const binHeader = Buffer.alloc(8);
binHeader.writeUInt32LE(binary.length, 0); binHeader.writeUInt32LE(0x004e4942, 4);
mkdirSync('public/models', { recursive: true });
writeFileSync('public/models/offering-chicken.glb', Buffer.concat([header, json, binHeader, binary]));
console.log({ triangles: simplified.length / 3, vertices: compactCount, relativeError: error, bounds, bytes: header.length + json.length + binHeader.length + binary.length });
