import { readFileSync } from 'node:fs';
import { unzipSync, strFromU8 } from 'three/addons/libs/fflate.module.js';
const data = new Uint8Array(readFileSync(process.argv[2]));
const entries = [];
unzipSync(data, { filter: entry => { entries.push({ name: entry.name, bytes: entry.originalSize }); return false; } });
console.log(entries.filter(e => /model$|png$|json$/.test(e.name)));
const models = unzipSync(data, { filter: entry => entry.name.endsWith('.model') });
for (const [name, bytes] of Object.entries(models)) {
  console.log(name, bytes.length, strFromU8(bytes.subarray(0, 2200)), strFromU8(bytes.subarray(-1400)));
  const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (const tag of ['<vertex ', '<triangle ']) {
    let count = 0;
    let offset = 0;
    while ((offset = buffer.indexOf(tag, offset)) !== -1) { count++; offset += tag.length; }
    console.log(tag, count);
  }
}
