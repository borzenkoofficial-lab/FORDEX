import { startupRankings } from './startups.js';
import { emergingStartups } from './emergingStartups.js';

export const corporateCompanies = [
  {
    id: 'yandex',
    name: 'Yandex',
    kind: 'CORPORATE',
    sizeBand: 'GROWING',
    sector: 'LLM / PLATFORM',
    tags: ['AI / AGENTS', 'CONSUMER'],
    stage: 'LARGE TECH',
    city: 'MOSCOW',
    description: 'Крупномасштабные AI-продукты, модели и инфраструктура для поиска, ассистентов и облачных сервисов.',
    source: 'https://yandex.ru/',
    sourceName: 'YANDEX',
    website: 'https://yandex.ru/',
    verificationLevel: 'PRIMARY_SOURCE',
    verified: true,
    lastVerified: '2026-10',
  },
  {
    id: 'sber',
    name: 'Sber',
    kind: 'CORPORATE',
    sizeBand: 'GROWING',
    sector: 'GENERATIVE AI',
    tags: ['AI / AGENTS', 'CONSUMER'],
    stage: 'LARGE TECH',
    city: 'MOSCOW',
    description: 'Продукты генеративного AI и корпоративные технологии вокруг GigaChat и экосистемы Сбера.',
    source: 'https://sber.ru/',
    sourceName: 'SBER',
    website: 'https://sber.ru/',
    verificationLevel: 'PRIMARY_SOURCE',
    verified: true,
    lastVerified: '2026-10',
  },
  {
    id: 'vk',
    name: 'VK',
    kind: 'CORPORATE',
    sizeBand: 'GROWING',
    sector: 'AI / DATA',
    tags: ['AI / AGENTS', 'CONSUMER'],
    stage: 'LARGE TECH',
    city: 'MOSCOW',
    description: 'Инфраструктура AI и машинного обучения для пользовательских продуктов, рекламы и контента.',
    source: 'https://vk.company/',
    sourceName: 'VK',
    website: 'https://vk.company/',
    verificationLevel: 'PRIMARY_SOURCE',
    verified: true,
    lastVerified: '2026-10',
  },
  {
    id: 'tbank',
    name: 'T-Bank',
    kind: 'CORPORATE',
    sizeBand: 'GROWING',
    sector: 'FINTECH AI',
    tags: ['AI / AGENTS', 'CONSUMER'],
    stage: 'LARGE TECH',
    city: 'MOSCOW',
    description: 'Прикладное машинное обучение и языковые технологии внутри крупной цифровой финансовой платформы.',
    source: 'https://www.tbank.ru/',
    sourceName: 'T-BANK',
    website: 'https://www.tbank.ru/',
    verificationLevel: 'PRIMARY_SOURCE',
    verified: true,
    lastVerified: '2026-10',
  },
];

const registryImages = [
  'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1000&q=86',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1000&q=86',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=86',
  'https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=1000&q=86',
  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1000&q=86',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=86',
  'https://images.unsplash.com/photo-1531973576160-7125cd663d86?auto=format&fit=crop&w=1000&q=86',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1000&q=86',
];

function fromCore(item) {
  return {
    ...item,
    kind: 'INDEX COMPANY',
    verificationLevel: 'EDITORIAL_SCORED',
    researchStatus: 'RANKED',
    sizeBand: item.sizeBand ?? 'GROWING',
    sourceName: item.sourceName ?? item.name,
  };
}

function fromEmerging(item) {
  return {
    ...item,
    verificationLevel: item.verified ? 'SOURCE_CLAIMED' : 'RESEARCH',
    researchStatus: 'RESEARCH',
    kind: 'EMERGING STARTUP',
    sourceName: item.sourceName ?? item.name,
  };
}

const baseCompanyRegistry = [
  ...corporateCompanies,
  ...startupRankings.map(fromCore),
  ...emergingStartups.map(fromEmerging),
];

export const companyRegistry = baseCompanyRegistry.map((company, index) => ({
  ...company,
  image: company.image ?? registryImages[index % registryImages.length],
}));

export const companyById = new Map(companyRegistry.map((company) => [company.id, company]));

export const companyRegistryStats = {
  total: companyRegistry.length,
  corporate: companyRegistry.filter((item) => item.kind === 'CORPORATE').length,
  ranked: companyRegistry.filter((item) => item.kind === 'INDEX COMPANY').length,
  emerging: companyRegistry.filter((item) => item.kind === 'EMERGING STARTUP').length,
  withFounder: companyRegistry.filter((item) => Boolean(item.founder)).length,
  sourceClaimed: companyRegistry.filter((item) => item.verificationLevel === 'SOURCE_CLAIMED').length,
  primarySource: companyRegistry.filter((item) => item.verificationLevel === 'PRIMARY_SOURCE').length,
  editorialScored: companyRegistry.filter((item) => item.verificationLevel === 'EDITORIAL_SCORED').length,
};
