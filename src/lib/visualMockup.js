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
  const [accent, soft] = pick(company + founder);
  const seed = [...String(company + founder)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const variant = seed % 5;
  const brand = esc(company).slice(0, 24);
  const name = esc(founder).slice(0, 30);
  const role = esc(sector).slice(0, 28);
  const specs = [
    {
      label: 'FOUNDER DOSSIER',
      title: 'PRODUCT',
      shape: '<rect x="165" y="235" width="320" height="290" rx="22" fill="' + soft + '"/><rect x="205" y="275" width="240" height="38" rx="10" fill="#FFFFFF"/><rect x="205" y="337" width="180" height="12" rx="6" fill="#C8D3E2"/><rect x="205" y="365" width="215" height="10" rx="5" fill="#D9E1EB"/><rect x="205" y="410" width="240" height="76" rx="16" fill="#FFFFFF"/><circle cx="245" cy="448" r="17" fill="' + accent + '" opacity=".18"/><rect x="278" y="432" width="115" height="9" rx="4" fill="' + accent + '" opacity=".55"/><rect x="278" y="452" width="88" height="8" rx="4" fill="#C9D4E1"/>'
    },
    {
      label: 'FOUNDER DOSSIER',
      title: 'ARCHITECTURE',
      shape: '<rect x="165" y="225" width="865" height="315" rx="24" fill="#F7F9FC"/><circle cx="320" cy="380" r="72" fill="' + soft + '"/><circle cx="320" cy="380" r="32" fill="' + accent + '" opacity=".25"/><rect x="470" y="280" width="180" height="78" rx="16" fill="' + soft + '"/><rect x="720" y="280" width="210" height="78" rx="16" fill="#FFFFFF" stroke="#D8E1EC"/><rect x="470" y="410" width="180" height="78" rx="16" fill="#FFFFFF" stroke="#D8E1EC"/><rect x="720" y="410" width="210" height="78" rx="16" fill="' + soft + '"/><path d="M392 380 H470 M650 319 H720 M650 449 H720 M825 358 V410" fill="none" stroke="' + accent + '" stroke-width="6" stroke-linecap="round" opacity=".8"/>'
    },
    {
      label: 'FOUNDER DOSSIER',
      title: 'RESEARCH',
      shape: '<rect x="165" y="220" width="865" height="330" rx="24" fill="#F8FAFC"/><path d="M205 470 C300 420 320 455 390 388 S520 440 600 350 S735 410 820 300 S940 350 995 260" fill="none" stroke="' + accent + '" stroke-width="9" stroke-linecap="round"/><path d="M205 470 C300 420 320 455 390 388 S520 440 600 350 S735 410 820 300 S940 350 995 260 V505 H205 Z" fill="' + accent + '" opacity=".09"/><rect x="210" y="255" width="210" height="14" rx="7" fill="#D5DEE9"/><rect x="210" y="284" width="155" height="10" rx="5" fill="#E0E6EE"/><circle cx="860" cy="350" r="58" fill="' + soft + '"/><circle cx="860" cy="350" r="23" fill="' + accent + '"/>'
    },
    {
      label: 'FOUNDER DOSSIER',
      title: 'INDUSTRIAL',
      shape: '<rect x="165" y="225" width="865" height="320" rx="24" fill="#F5F7FA"/><path d="M225 480 H955" stroke="#CBD6E3" stroke-width="5"/><path d="M300 480 V355 L365 290 L430 355 V480 M565 480 V320 L635 255 L705 320 V480 M810 480 V370 L875 315 L940 370 V480" fill="none" stroke="' + accent + '" stroke-width="8"/><circle cx="365" cy="355" r="18" fill="' + soft + '"/><circle cx="635" cy="320" r="18" fill="' + soft + '"/><circle cx="875" cy="370" r="18" fill="' + soft + '"/>'
    },
    {
      label: 'FOUNDER DOSSIER',
      title: 'GROWTH',
      shape: '<rect x="165" y="225" width="865" height="320" rx="24" fill="' + soft + '"/><rect x="215" y="430" width="72" height="72" rx="12" fill="#FFFFFF"/><rect x="315" y="380" width="72" height="122" rx="12" fill="#FFFFFF"/><rect x="415" y="330" width="72" height="172" rx="12" fill="#FFFFFF"/><rect x="515" y="275" width="72" height="227" rx="12" fill="' + accent + '"/><path d="M675 485 C730 430 770 450 812 390 S900 350 965 275" fill="none" stroke="' + accent + '" stroke-width="8" stroke-linecap="round"/><circle cx="965" cy="275" r="14" fill="' + accent + '"/><rect x="695" y="260" width="175" height="12" rx="6" fill="#C7D2DF"/><rect x="695" y="288" width="125" height="9" rx="4" fill="#D6DEE8"/>'
    }
  ][variant];

  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">',
    '<defs><linearGradient id="founderBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#EDF2F7"/></linearGradient><filter id="founderShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#122033" flood-opacity=".12"/></filter></defs>',
    '<rect width="1200" height="800" fill="url(#founderBg)"/>',
    '<circle cx="1030" cy="125" r="150" fill="' + soft + '"/><circle cx="1030" cy="125" r="95" fill="' + accent + '" opacity=".1"/>',
    '<g filter="url(#founderShadow)">',
    '<rect x="125" y="95" width="950" height="610" rx="28" fill="#FFFFFF"/>',
    '<rect x="125" y="95" width="950" height="86" rx="28" fill="#F8FAFC"/><rect x="125" y="153" width="950" height="28" fill="#F8FAFC"/>',
    '<circle cx="164" cy="138" r="7" fill="#D8E0EA"/><circle cx="188" cy="138" r="7" fill="#D8E0EA"/><circle cx="212" cy="138" r="7" fill="' + accent + '"/>',
    '<text x="260" y="146" font-family="Inter,Arial,sans-serif" font-size="23" font-weight="800" fill="#122033" letter-spacing="1">' + brand + '</text>',
    '<text x="1018" y="143" text-anchor="end" font-family="Inter,Arial,sans-serif" font-size="12" font-weight="800" fill="#7B8797" letter-spacing="1.5">' + specs.label + '</text>',
    '<text x="165" y="218" font-family="Inter,Arial,sans-serif" font-size="10" font-weight="800" fill="' + accent + '" letter-spacing="2">' + specs.title + '</text>',
    '<text x="165" y="655" font-family="Inter,Arial,sans-serif" font-size="17" font-weight="800" fill="#122033">' + name + '</text>',
    '<text x="165" y="680" font-family="Inter,Arial,sans-serif" font-size="11" font-weight="700" fill="#7B8797" letter-spacing="1.2">' + role + '</text>',
    '<text x="1018" y="675" text-anchor="end" font-family="Inter,Arial,sans-serif" font-size="11" font-weight="700" fill="#7B8797" letter-spacing="1.2">FORDEX · FOUNDER PROFILE</text>',
    specs.shape,
    '</g></svg>'
  ].join('');

  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

export function createEditorialMockup(sourceName, category, title = '') {
  const [accent, soft] = pick(sourceName + category + title);
  const variants = [
    '<path d="M190 520 C280 470 315 490 385 420 S520 445 600 360 S730 405 820 315 S935 345 1010 250" fill="none" stroke="' + accent + '" stroke-width="8" stroke-linecap="round"/><path d="M190 520 C280 470 315 490 385 420 S520 445 600 360 S730 405 820 315 S935 345 1010 250 V560 H190 Z" fill="' + accent + '" opacity=".08"/><rect x="190" y="235" width="250" height="18" rx="9" fill="#CAD5E2"/><rect x="190" y="268" width="185" height="10" rx="5" fill="#DFE5EC"/>',
    '<circle cx="600" cy="385" r="120" fill="' + soft + '"/><circle cx="600" cy="385" r="58" fill="' + accent + '" opacity=".2"/><circle cx="600" cy="385" r="24" fill="' + accent + '"/><path d="M600 265 V205 M600 505 V565 M480 385 H420 M720 385 H780" stroke="' + accent + '" stroke-width="7" stroke-linecap="round"/><rect x="190" y="235" width="200" height="14" rx="7" fill="#CBD6E2"/><rect x="190" y="267" width="155" height="9" rx="4" fill="#DEE5ED"/>',
    '<rect x="195" y="250" width="220" height="260" rx="20" fill="' + soft + '"/><rect x="460" y="250" width="220" height="260" rx="20" fill="#F8FAFC"/><rect x="725" y="250" width="285" height="260" rx="20" fill="#F8FAFC"/><path d="M245 455 L300 380 L350 410 L395 325" fill="none" stroke="' + accent + '" stroke-width="8" stroke-linecap="round"/><circle cx="245" cy="455" r="10" fill="' + accent + '"/><circle cx="395" cy="325" r="10" fill="' + accent + '"/><rect x="500" y="305" width="135" height="14" rx="7" fill="#D1DBE6"/><rect x="500" y="335" width="100" height="10" rx="5" fill="#DEE5ED"/><rect x="770" y="305" width="160" height="14" rx="7" fill="#D1DBE6"/><rect x="770" y="335" width="195" height="10" rx="5" fill="#DEE5ED"/>',
    '<path d="M210 485 H990" stroke="#CAD5E2" stroke-width="5"/><path d="M300 485 V350 L380 270 L460 350 V485 M570 485 V320 L650 240 L730 320 V485 M840 485 V360 L910 285 L980 360 V485" fill="none" stroke="' + accent + '" stroke-width="8"/><circle cx="380" cy="350" r="17" fill="' + soft + '"/><circle cx="650" cy="320" r="17" fill="' + soft + '"/><circle cx="910" cy="360" r="17" fill="' + soft + '"/><rect x="210" y="235" width="275" height="14" rx="7" fill="#CBD6E2"/>',
    '<rect x="210" y="285" width="760" height="215" rx="20" fill="#F8FAFC"/><rect x="245" y="325" width="115" height="140" rx="14" fill="' + soft + '"/><rect x="395" y="355" width="115" height="110" rx="14" fill="#EAF0F7"/><rect x="545" y="305" width="115" height="160" rx="14" fill="' + soft + '"/><rect x="695" y="335" width="115" height="130" rx="14" fill="#EAF0F7"/><rect x="845" y="265" width="90" height="200" rx="14" fill="' + accent + '" opacity=".85"/><path d="M275 540 C390 500 510 520 610 455 S805 430 950 300" fill="none" stroke="' + accent + '" stroke-width="7" stroke-linecap="round"/>',
  ];
  const index = [...String(sourceName + category + title)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % variants.length;
  const brand = esc(sourceName).slice(0, 28);
  const categoryText = esc(category).slice(0, 30);
  const headline = esc(title).slice(0, 42);
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">',
    '<defs><linearGradient id="editorialBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#EEF3F8"/></linearGradient><filter id="editorialShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#122033" flood-opacity=".11"/></filter></defs>',
    '<rect width="1200" height="800" fill="url(#editorialBg)"/><circle cx="1010" cy="115" r="160" fill="' + soft + '"/><circle cx="1010" cy="115" r="100" fill="' + accent + '" opacity=".1"/>',
    '<g filter="url(#editorialShadow)"><rect x="125" y="95" width="950" height="610" rx="28" fill="#FFFFFF"/>',
    '<rect x="125" y="95" width="950" height="82" rx="28" fill="#F8FAFC"/><rect x="125" y="150" width="950" height="27" fill="#F8FAFC"/>',
    '<circle cx="164" cy="137" r="7" fill="#D8E0EA"/><circle cx="188" cy="137" r="7" fill="#D8E0EA"/><circle cx="212" cy="137" r="7" fill="' + accent + '"/>',
    '<text x="260" y="145" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="800" fill="#122033" letter-spacing="1">' + brand + '</text>',
    '<text x="1015" y="142" text-anchor="end" font-family="Inter,Arial,sans-serif" font-size="12" font-weight="800" fill="#7B8797" letter-spacing="1.4">' + categoryText + '</text>',
    '<text x="165" y="215" font-family="Inter,Arial,sans-serif" font-size="11" font-weight="800" fill="' + accent + '" letter-spacing="2">FORDEX EDITORIAL SIGNAL</text>',
    variants[index],
    '<text x="165" y="605" font-family="Inter,Arial,sans-serif" font-size="18" font-weight="800" fill="#122033">' + headline + '</text>',
    '<text x="165" y="650" font-family="Inter,Arial,sans-serif" font-size="11" font-weight="700" fill="#7B8797" letter-spacing="1.3">SOURCE · ' + brand + ' · FORDEX NEWS</text>',
    '</g></svg>'
  ].join('');
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}
