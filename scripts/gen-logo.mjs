/**
 * Génère les déclinaisons du logo ENTAN depuis public/entan-logo.png
 * (fleur terracotta #c15f3c sur fond BLANC opaque) :
 *   - public/entan-logo-t.png : 512px, fond TRANSPARENT (UI, thème sombre ok)
 *   - src/app/icon.png        : 256px, transparent (favicon Next)
 *   - public/email-logo.png   : 144px, transparent (en-tête des emails)
 *
 * Transparence : l'image est bicolore (accent plat sur blanc). Pour chaque
 * pixel, alpha = distance à blanc normalisée par la distance accent↔blanc ;
 * la couleur de sortie est l'accent partout (pas de halo gris sur les bords).
 * Usage : node scripts/gen-logo.mjs
 */
import sharp from 'sharp';

const ACCENT = { r: 193, g: 95, b: 60 }; // #c15f3c
const DIST_ACCENT_WHITE = Math.hypot(255 - ACCENT.r, 255 - ACCENT.g, 255 - ACCENT.b);

const src = 'public/entan-logo.png';
const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

const out = Buffer.alloc(width * height * 4);
for (let i = 0, j = 0; i < data.length; i += channels, j += 4) {
  const d = Math.hypot(255 - data[i], 255 - data[i + 1], 255 - data[i + 2]);
  const a = Math.max(0, Math.min(255, Math.round((d / DIST_ACCENT_WHITE) * 255)));
  out[j] = ACCENT.r;
  out[j + 1] = ACCENT.g;
  out[j + 2] = ACCENT.b;
  out[j + 3] = a;
}

const base = sharp(out, { raw: { width, height, channels: 4 } });
await base.clone().resize(512, 512).png().toFile('public/entan-logo-t.png');
await base.clone().resize(256, 256).png().toFile('src/app/icon.png');
await base.clone().resize(144, 144).png().toFile('public/email-logo.png');
console.log('OK: entan-logo-t.png (512), src/app/icon.png (256), email-logo.png (144)');
