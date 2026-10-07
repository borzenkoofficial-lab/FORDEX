const PALETTES = [
  ['#2457D6', '#E8EFFF'],
  ['#168A62', '#E8F6EF'],
  ['#B77716', '#FFF4DC'],
  ['#167F8F', '#E6F5F7'],
  ['#7752B9', '#F1EBFB'],
];

function pick(value = '') {
  let hash = 0;
  for (const char of String(value)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTES[hash % PALETTES.length];
}

function esc(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function createBrandMockup(name, sector = 'AI / DATA', meta = '') {
  const [accent, soft] = pick(name);
  const brand = esc(name).slice(0, 28);
  const label = esc(sector).slice(0, 31);
  const secondary = esc(meta).slice(0, 34);
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">',
    '<defs>',
    '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#EEF3F8"/></linearGradient>',
    '<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#122033" flood-opacity=".12"/></filter>',
    '</defs>',
    '<rect width="1200" height="800" fill="url(#bg)"/>',
    '<circle cx="1030" cy="110" r="170" fill="' + soft + '"/>',
    '<circle cx="1020" cy="110" r="112" fill="' + accent + '" opacity=".11"/>',
    '<g filter="url(#shadow)">',
    '<rect x="125" y="100" width="950" height="600" rx="28" fill="#FFFFFF"/>',
    '<rect x="125" y="100" width="950" height="76" rx="28" fill="#F8FAFC"/>',
    '<rect x="125" y="148" width="950" height="28" fill="#F8FAFC"/>',
    '<circle cx="161" cy="138" r="7" fill="#D8E0EA"/><circle cx="185" cy="138" r="7" fill="#D8E0EA"/><circle cx="209" cy="138" r="7" fill="' + accent + '"/>',
    '<text x="260" y="145" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="800" fill="#122033" letter-spacing="1">' + brand + '</text>',
    '<text x="980" y="143" text-anchor="end" font-family="Inter,Arial,sans-serif" font-size="13" font-weight="700" fill="#7B8797" letter-spacing="1.5">' + label + '</text>',
    '<rect x="165" y="205" width="285" height="210" rx="18" fill="' + soft + '"/>',
    '<rect x="485" y="205" width="545" height="86" rx="18" fill="#F5F7FA"/>',
    '<rect x="485" y="315" width="165" height="100" rx="18" fill="#F5F7FA"/><rect x="670" y="315" width="165" height="100" rx="18" fill="#F5F7FA"/><rect x="855" y="315" width="175" height="100" rx="18" fill="#F5F7FA"/>',
    '<rect x="165" y="445" width="865" height="205" rx="18" fill="#F8FAFC"/>',
    '<path d="M200 585 C275 540 325 566 390 510 S520 555 590 498 S730 530 795 470 S920 520 995 450" fill="none" stroke="' + accent + '" stroke-width="8" stroke-linecap="round"/>',
    '<path d="M200 585 C275 540 325 566 390 510 S520 555 590 498 S730 530 795 470 S920 520 995 450 L995 610 L200 610 Z" fill="' + accent + '" opacity=".08"/>',
    '<rect x="200" y="480" width="120" height="10" rx="5" fill="#CBD5E1"/><rect x="200" y="500" width="190" height="8" rx="4" fill="#D8E0EA"/>',
    '<rect x="485" y="233" width="235" height="10" rx="5" fill="#CBD5E1"/><rect x="485" y="253" width="330" height="8" rx="4" fill="#D8E0EA"/>',
    '<rect x="505" y="338" width="90" height="26" rx="13" fill="' + soft + '"/><rect x="690" y="338" width="86" height="26" rx="13" fill="' + soft + '"/><rect x="875" y="338" width="92" height="26" rx="13" fill="' + soft + '"/>',
    '<text x="165" y="745" font-family="Inter,Arial,sans-serif" font-size="15" font-weight="700" fill="#7B8797" letter-spacing="2">' + (secondary || 'FORDEX · COMPANY PROFILE') + '</text>',
    '</g></svg>'
  ].join('');
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

export function createFounderMockup(company, founder, sector = 'AI / DATA') {
  return createBrandMockup(company, sector, 'FOUNDER · ' + founder);
}
