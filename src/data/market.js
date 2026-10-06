import { companyRegistry } from './companyRegistry.js';
import { founderRegistry } from './founderRegistry.js';
import { dealRecords } from './deals.js';
import { youngLeaderRankings } from './youngLeaders.js';

export const marketCompanies = companyRegistry;
export const founderProfiles = founderRegistry;

export const newsFeed = [
  {
    id: 'webiomed-sep-2026',
    category: 'ЗДРАВООХРАНЕНИЕ',
    date: '30 SEP 2026',
    title: 'Webiomed и TouchMED готовят совместные AI-решения для здравоохранения к ITM2026.',
    sourceName: 'WEBIOMED',
    source: 'https://www.webiomed.ru/novosti/',
  },
  {
    id: 'smart-engines-sep-2026',
    category: 'COMPUTER VISION',
    date: '24 SEP 2026',
    title: 'Smart Engines представила портативный томограф со свободным позиционированием на базе собственного стека компьютерного зрения.',
    sourceName: 'SMART ENGINES',
    source: 'https://smartengines.ru/news/bez-gosfinansirovaniya-i-korporaczij-smart-engines-sozdala-pervyj-v-mire-nosimyj-tomograf/',
  },
  {
    id: 'cognitive-sep-2026',
    category: 'AUTONOMOUS SYSTEMS',
    date: '09 SEP 2026',
    title: 'Cognitive Pilot продолжает публиковать исследования и кейсы внедрения автономных решений для сельского хозяйства.',
    sourceName: 'COGNITIVE PILOT',
    source: 'https://cognitivepilot.com/',
  },
  {
    id: 'dresscode-sep-2026',
    category: 'FASHIONTECH',
    date: 'SEP 2026',
    title: 'DRESSCODE расширяет сценарии виртуальной примерки и увеличивает лимит генераций на пользователя.',
    sourceName: 'DRESSCODE',
    source: 'https://www.dresscode.ai/news.html',
  },
  {
    id: 'expanta-may-2026',
    category: 'ПРОМЫШЛЕННЫЕ ТЕХНОЛОГИИ',
    date: '07 MAY 2026',
    title: 'Expanta расширяет портфель ПО для планирования и развивает промышленный софт как согласованный технологический стек.',
    sourceName: 'EXPANTA',
    source: 'https://expanta.ru/',
  },
  {
    id: 'startup-village-jun-2026',
    category: 'ЭКОСИСТЕМА',
    date: '02 JUN 2026',
    title: 'Startup Village 2026 объединяет тысячи стартапов и технологических команд в России.',
    sourceName: 'RB.RU',
    source: 'https://rb.ru/tag/startups/',
  },
];

export const marketSummary = {
  trackedCompanies: marketCompanies.length,
  indexedStartups: companyRegistry.filter((item) => item.kind === 'INDEX COMPANY').length + youngLeaderRankings.length,
  founderProfiles: founderProfiles.length,
  recordedDeals: dealRecords.length,
  knownDealCapitalM: dealRecords.reduce((sum, deal) => sum + deal.valueM, 0),
  lastReview: '06 OCT 2026',
};
