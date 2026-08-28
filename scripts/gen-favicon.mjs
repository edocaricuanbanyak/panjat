// Regenerate src/app/favicon.ico from the Panjat brand mark (src/app/icon.svg).
// The default create-next-app favicon.ico (a Next/Vercel mark) was never replaced,
// so scrapers/tabs showed the wrong logo. Run: `node scripts/gen-favicon.mjs`.
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const svg = readFileSync(new URL("../src/app/icon.svg", import.meta.url));
const sizes = [16, 32, 48];

const pngs = await Promise.all(
  sizes.map((s) => sharp(svg, { density: 512 }).resize(s, s).png().toBuffer()),
);

// Assemble an ICO that embeds each PNG (PNG-in-ICO — supported everywhere modern).
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(sizes.length, 4); // image count

const entries = [];
let offset = 6 + sizes.length * 16;
sizes.forEach((s, i) => {
  const png = pngs[i];
  const e = Buffer.alloc(16);
  e.writeUInt8(s >= 256 ? 0 : s, 0); // width (0 = 256)
  e.writeUInt8(s >= 256 ? 0 : s, 1); // height
  e.writeUInt8(0, 2); // palette colors
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // color planes
  e.writeUInt16LE(32, 6); // bits per pixel
  e.writeUInt32LE(png.length, 8); // image size
  e.writeUInt32LE(offset, 12); // image offset
  offset += png.length;
  entries.push(e);
});

const ico = Buffer.concat([header, ...entries, ...pngs]);
writeFileSync(new URL("../src/app/favicon.ico", import.meta.url), ico);
console.log(`favicon.ico written: ${ico.length} bytes (sizes ${sizes.join(",")})`);
