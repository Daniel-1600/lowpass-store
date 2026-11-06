// Renders the original product artwork (SVG -> WebP + Open Graph JPEG).
// Output is committed, so this only needs re-running when the artwork changes.
//   npm run images
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const OUT = new URL('../public/images/', import.meta.url).pathname
const SIZE = 1600
const SAGE = '#DCE3DC'
const SAND = '#E9E3D6'
const CLAY = '#EBDCCF'
const FOG = '#DFE1E6'
const ORANGE = '#E4572E'

const defs = `
  <linearGradient id="ink" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3B3D42"/><stop offset="1" stop-color="#17181B"/></linearGradient>
  <linearGradient id="inkV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#44464C"/><stop offset="1" stop-color="#1B1C1F"/></linearGradient>
  <linearGradient id="bone" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FBF9F4"/><stop offset="1" stop-color="#D5D0C4"/></linearGradient>
  <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E8E9EA"/><stop offset=".5" stop-color="#A9ACB1"/><stop offset="1" stop-color="#D5D7DA"/></linearGradient>
  <linearGradient id="walnut" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9A6A45"/><stop offset="1" stop-color="#5B3921"/></linearGradient>
  <linearGradient id="moss" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#65735C"/><stop offset="1" stop-color="#37402F"/></linearGradient>
  <linearGradient id="signal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F06A40"/><stop offset="1" stop-color="#C43F1C"/></linearGradient>
  <radialGradient id="cone"><stop offset="0" stop-color="#55575C"/><stop offset=".35" stop-color="#26272A"/><stop offset=".8" stop-color="#101113"/><stop offset="1" stop-color="#2E2F33"/></radialGradient>
  <radialGradient id="dome"><stop offset="0" stop-color="#F1F1F1"/><stop offset=".6" stop-color="#9A9CA0"/><stop offset="1" stop-color="#4D4F53"/></radialGradient>
  <radialGradient id="knob" cx=".38" cy=".32"><stop offset="0" stop-color="#F4F4F4"/><stop offset=".55" stop-color="#ABADB2"/><stop offset="1" stop-color="#63656A"/></radialGradient>
  <radialGradient id="vignette" cx=".5" cy=".42" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity=".06"/></radialGradient>
  <filter id="soft" x="-40%" y="-300%" width="180%" height="700%"><feGaussianBlur stdDeviation="42"/></filter>
  <filter id="lift" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#000" flood-opacity=".28"/></filter>`

const shadow = (cx, cy, rx, ry = 46) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#1A1408" opacity=".3" filter="url(#soft)"/>`

const dots = (x, y, w, h, gap, r, fill = '#0D0E10', inside = () => true) => {
  let out = ''
  for (let j = 0; j * gap <= h; j++) {
    for (let i = 0; i * gap <= w; i++) {
      const px = x + i * gap + (j % 2 ? gap / 2 : 0)
      const py = y + j * gap
      if (px <= x + w && inside(px, py)) out += `<circle cx="${px}" cy="${py}" r="${r}" fill="${fill}"/>`
    }
  }
  return out
}

const driver = (cx, cy, r) => `
  <circle cx="${cx}" cy="${cy}" r="${r + 16}" fill="#0E0F11"/>
  <circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="url(#metal)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#cone)"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 0.3}" fill="url(#dome)"/>`

const tweeter = (cx, cy, r) => `
  <circle cx="${cx}" cy="${cy}" r="${r + 10}" fill="url(#metal)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#111214"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 0.58}" fill="url(#dome)"/>`

function headphones(body, cupDetail) {
  const cup = (x, flip) => {
    const padX = flip ? x + 150 : x - 42
    const cx = x + 80
    return `
    <rect x="${padX}" y="745" width="52" height="350" rx="26" fill="#111214"/>
    <rect x="${x}" y="710" width="160" height="420" rx="78" fill="url(#${body})" filter="url(#lift)"/>
    ${cupDetail(cx, 920)}`
  }
  return `${shadow(800, 1215, 430)}
    <path d="M 520 760 V 640 A 280 280 0 0 1 1080 640 V 760" fill="none" stroke="url(#${body})" stroke-width="58" stroke-linecap="round"/>
    <path d="M 520 650 A 280 280 0 0 1 1080 650" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="16" transform="translate(0 30)"/>
    <rect x="507" y="660" width="26" height="110" rx="10" fill="url(#metal)"/>
    <rect x="1067" y="660" width="26" height="110" rx="10" fill="url(#metal)"/>
    ${cup(440, true)}${cup(1000, false)}`
}

const art = {
  'arc-one': { bg: SAND, svg: () => headphones('ink', (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="26" fill="${ORANGE}"/>`) },
  'arc-studio': {
    bg: SAGE,
    svg: () =>
      headphones('moss', (cx, cy) => `
        <rect x="${cx - 60}" y="${cy - 165}" width="120" height="330" rx="58" fill="url(#metal)"/>
        ${dots(cx - 50, cy - 150, 100, 300, 21, 6.5, '#26272A', (x, y) => Math.abs(y - cy) < 148 && Math.abs(x - cx) < 48)}`),
  },
  'pebble-buds': {
    bg: CLAY,
    svg: () => {
      const bud = (cx, angle) => `
        <g transform="rotate(${angle} ${cx} 560)" filter="url(#lift)">
          <rect x="${cx - 32}" y="560" width="64" height="210" rx="32" fill="url(#bone)"/>
          <circle cx="${cx}" cy="540" r="86" fill="url(#bone)"/>
          <circle cx="${cx}" cy="540" r="44" fill="#26272A"/>
          <circle cx="${cx}" cy="540" r="10" fill="${ORANGE}"/>
        </g>`
      return `${shadow(800, 1250, 400)}
        <rect x="470" y="840" width="660" height="400" rx="170" fill="url(#bone)" filter="url(#lift)"/>
        <path d="M 473 985 H 1127" stroke="#9D988C" stroke-width="5"/>
        <rect x="770" y="1070" width="60" height="16" rx="8" fill="${ORANGE}"/>
        ${bud(650, -10)}${bud(950, 10)}`
    },
  },
  'cube-3': {
    bg: SAND,
    svg: () => {
      const box = (x) => `
        <rect x="${x}" y="500" width="480" height="680" rx="26" fill="url(#walnut)" filter="url(#lift)"/>
        <rect x="${x + 22}" y="522" width="436" height="636" rx="14" fill="url(#ink)"/>
        ${tweeter(x + 240, 640, 58)}${driver(x + 240, 925, 165)}`
      return `${shadow(800, 1195, 620)}${box(250)}${box(870)}`
    },
  },
  'monitor-2': {
    bg: FOG,
    svg: () => {
      const box = (x) => `
        <path d="M ${x + 60} 1130 L ${x + 300} 1130 L ${x + 330} 1190 L ${x + 30} 1190 Z" fill="url(#inkV)"/>
        <rect x="${x}" y="560" width="360" height="570" rx="46" fill="url(#bone)" filter="url(#lift)"/>
        ${tweeter(x + 180, 685, 44)}${driver(x + 180, 925, 118)}`
      return `${shadow(800, 1205, 560)}${box(310)}${box(930)}`
    },
  },
  'room-radio': {
    bg: CLAY,
    svg: () => `${shadow(800, 1190, 590)}
      <path d="M 430 540 C 430 360 1170 360 1170 540" fill="none" stroke="url(#ink)" stroke-width="42" stroke-linecap="round"/>
      <rect x="230" y="530" width="1140" height="650" rx="96" fill="url(#signal)" filter="url(#lift)"/>
      <rect x="290" y="590" width="620" height="530" rx="50" fill="#B13816"/>
      ${dots(325, 620, 550, 470, 34, 10, '#541606')}
      <rect x="970" y="600" width="340" height="150" rx="20" fill="#16171A"/>
      ${Array.from({ length: 13 }, (_, i) => `<rect x="${996 + i * 23.5}" y="${i % 4 === 0 ? 630 : 650}" width="4" height="${i % 4 === 0 ? 72 : 52}" fill="#E7E2D7"/>`).join('')}
      <rect x="1148" y="620" width="7" height="110" fill="#FFB199"/>
      <circle cx="1140" cy="935" r="118" fill="#7E2711"/>
      <circle cx="1140" cy="925" r="108" fill="url(#knob)"/>
      <rect x="1134" y="830" width="12" height="62" rx="6" fill="#26272A"/>`,
  },
  'tactile-75': {
    bg: FOG,
    svg: () => {
      const rows = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1],
        [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 1],
        [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25, 1],
        [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.75, 1, 1],
        [1.25, 1.25, 1.25, 6.25, 1, 1, 1, 1, 1, 1],
      ]
      const u = 76
      let keys = ''
      rows.forEach((row, j) => {
        let x = 180
        row.forEach((w, i) => {
          const accent = (j === 0 && i === 0) || (j === 3 && i === row.length - 2) || (j === 5 && i === 3)
          const light = !accent && (w > 1.2 || j === 0)
          const kw = w * u - 8
          const y = 548 + j * u
          keys += `<rect x="${x}" y="${y + 5}" width="${kw}" height="68" rx="12" fill="#000" opacity=".5"/>
            <rect x="${x}" y="${y}" width="${kw}" height="66" rx="12" fill="${accent ? 'url(#signal)' : light ? '#A9A69D' : 'url(#bone)'}"/>`
          x += w * u
        })
      })
      return `${shadow(800, 1085, 660, 60)}
        <g transform="rotate(-7 800 800)">
          <rect x="150" y="518" width="1276" height="536" rx="36" fill="url(#ink)" filter="url(#lift)"/>
          ${keys}
        </g>`
    },
  },
  'macro-9': {
    bg: SAGE,
    svg: () => {
      let keys = ''
      for (let j = 0; j < 3; j++) {
        for (let i = 0; i < 3; i++) {
          const accent = i === 2 && j === 2
          const x = 505 + i * 158
          const y = 640 + j * 158
          keys += `<rect x="${x}" y="${y + 9}" width="140" height="136" rx="22" fill="#000" opacity=".45"/>
            <rect x="${x}" y="${y}" width="140" height="136" rx="22" fill="${accent ? 'url(#signal)' : 'url(#bone)'}"/>`
        }
      }
      return `${shadow(800, 1190, 390)}
        <rect x="460" y="330" width="680" height="830" rx="56" fill="url(#moss)" filter="url(#lift)"/>
        <circle cx="800" cy="480" r="108" fill="#20251B"/>
        <circle cx="800" cy="470" r="98" fill="url(#knob)"/>
        <rect x="794" y="384" width="12" height="52" rx="6" fill="#26272A"/>
        ${keys}`
    },
  },
  'bridge-dac': {
    bg: FOG,
    svg: () => `${shadow(800, 1085, 560)}
      <rect x="260" y="620" width="1080" height="450" rx="38" fill="url(#ink)" filter="url(#lift)"/>
      <rect x="330" y="700" width="330" height="170" rx="16" fill="#0A0B0C"/>
      <text x="495" y="815" text-anchor="middle" font-family="monospace" font-size="96" fill="${ORANGE}" letter-spacing="2">44.1</text>
      <circle cx="350" cy="965" r="16" fill="${ORANGE}"/>
      <circle cx="420" cy="965" r="16" fill="#6C6E73"/>
      <circle cx="490" cy="965" r="16" fill="#6C6E73"/>
      <circle cx="810" cy="845" r="42" fill="url(#metal)"/><circle cx="810" cy="845" r="21" fill="#050506"/>
      <circle cx="1120" cy="845" r="146" fill="#0B0C0D"/>
      <circle cx="1120" cy="835" r="134" fill="url(#knob)"/>
      <rect x="1113" y="716" width="14" height="72" rx="7" fill="#26272A"/>`,
  },
  'brick-65': {
    bg: CLAY,
    svg: () => `${shadow(800, 1190, 330)}
      <rect x="665" y="330" width="44" height="200" rx="10" fill="url(#metal)"/>
      <rect x="891" y="330" width="44" height="200" rx="10" fill="url(#metal)"/>
      <rect x="500" y="490" width="600" height="690" rx="96" fill="url(#bone)" filter="url(#lift)"/>
      <rect x="690" y="690" width="220" height="56" rx="28" fill="#26272A"/><rect x="714" y="710" width="172" height="16" rx="8" fill="#6C6E73"/>
      <rect x="690" y="800" width="220" height="56" rx="28" fill="#26272A"/><rect x="714" y="820" width="172" height="16" rx="8" fill="#6C6E73"/>
      <rect x="690" y="910" width="220" height="56" rx="28" fill="${ORANGE}"/><rect x="714" y="930" width="172" height="16" rx="8" fill="#6F1D08"/>`,
  },
  'cell-20': {
    bg: SAND,
    svg: () => `${shadow(800, 1265, 340)}
      <g transform="rotate(5 800 800)">
        <rect x="520" y="300" width="560" height="960" rx="82" fill="url(#ink)" filter="url(#lift)"/>
        <rect x="548" y="328" width="504" height="904" rx="62" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="3"/>
        <rect x="690" y="1120" width="220" height="42" rx="21" fill="#08090A"/>
        ${[0, 1, 2, 3].map((i) => `<rect x="${660 + i * 76}" y="440" width="52" height="18" rx="9" fill="${i < 3 ? ORANGE : '#55575C'}"/>`).join('')}
        <text x="800" y="830" text-anchor="middle" font-family="sans-serif" font-size="88" font-weight="600" fill="#D5D7DA" letter-spacing="4">20K</text>
      </g>`,
  },
  'pad-2': {
    bg: SAGE,
    svg: () => `${shadow(800, 1210, 450)}
      <path d="M 570 1130 L 1030 1130 L 1120 1205 L 480 1205 Z" fill="url(#inkV)"/>
      <rect x="540" y="330" width="520" height="830" rx="80" fill="url(#bone)" filter="url(#lift)" transform="rotate(-4 800 800)"/>
      <g transform="rotate(-4 800 800)">
        <circle cx="800" cy="680" r="162" fill="none" stroke="#BDB8AB" stroke-width="20"/>
        <circle cx="800" cy="680" r="96" fill="none" stroke="#BDB8AB" stroke-width="20"/>
        <circle cx="800" cy="680" r="24" fill="${ORANGE}"/>
        <rect x="770" y="1040" width="60" height="14" rx="7" fill="${ORANGE}"/>
      </g>`,
  },
}

const productSvg = (name, size = SIZE) => {
  const { bg, svg } = art[name]
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${SIZE} ${SIZE}">
    <defs>${defs}</defs>
    <rect width="${SIZE}" height="${SIZE}" fill="${bg}"/><rect width="${SIZE}" height="${SIZE}" fill="url(#vignette)"/>
    ${svg()}</svg>`
}

// Open Graph cards are 1200x630, with the product's art filling the frame's height.
const ogSvg = (bg, title, sub, productPng) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630">
  <rect width="1200" height="630" fill="#16171A"/>
  ${productPng ? `<image x="570" y="0" width="630" height="630" xlink:href="data:image/png;base64,${productPng}"/>` : ''}
  <text x="64" y="104" font-family="sans-serif" font-size="30" font-weight="700" fill="${ORANGE}" letter-spacing="1">LOWPASS</text>
  ${title.map((line, i) => `<text x="64" y="${300 + i * 78}" font-family="sans-serif" font-size="70" font-weight="700" fill="#F7F5F0">${line}</text>`).join('')}
  <text x="64" y="${318 + title.length * 72}" font-family="sans-serif" font-size="30" fill="#B9B8B1">${sub}</text>
</svg>`

const ogCopy = {
  'arc-one': ['Arc One', 'Closed-back headphones'],
  'arc-studio': ['Arc Studio', 'Open-back headphones'],
  'pebble-buds': ['Pebble Buds', 'Noise-cancelling earbuds'],
  'cube-3': ['Cube 3', 'Powered bookshelf speakers'],
  'monitor-2': ['Monitor 2', 'Desktop monitor speakers'],
  'room-radio': ['Room Radio', 'Portable FM + Bluetooth radio'],
  'tactile-75': ['Tactile 75', '75% mechanical keyboard'],
  'macro-9': ['Macro 9', 'Nine-key macro pad'],
  'bridge-dac': ['Bridge DAC', 'USB DAC + headphone amp'],
  'brick-65': ['Brick 65', '65W GaN wall charger'],
  'cell-20': ['Cell 20', '20,000 mAh power bank'],
  'pad-2': ['Pad 2', 'Wireless charging stand'],
}

await mkdir(`${OUT}products`, { recursive: true })
await mkdir(`${OUT}og`, { recursive: true })

for (const name of Object.keys(art)) {
  const svg = Buffer.from(productSvg(name))
  await sharp(svg).webp({ quality: 88 }).toFile(`${OUT}products/${name}.webp`)
  const thumb = await sharp(Buffer.from(productSvg(name, 630))).png().toBuffer()
  const [title, sub] = ogCopy[name]
  await sharp(Buffer.from(ogSvg(art[name].bg, [title], sub, thumb.toString('base64'))))
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(`${OUT}og/${name}.jpg`)
}

const heroThumb = await sharp(Buffer.from(productSvg('room-radio', 630))).png().toBuffer()
await sharp(Buffer.from(ogSvg(CLAY, ['Good sound,', 'small desk.'], 'Headphones, speakers and desk gear', heroThumb.toString('base64'))))
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(`${OUT}og/default.jpg`)

console.log(`Rendered ${Object.keys(art).length} products + default OG card to ${OUT}`)
