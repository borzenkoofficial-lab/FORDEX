import { emergingStartups } from './emergingStartups';

const establishedResearchUniverse = [
  { name: 'Zyfra', sector: 'INDUSTRIAL AI', source: 'https://seedtable.com/best-ai-startups-in-russia', sourceName: 'SEEDTABLE' },
  { name: 'Reason8.ai', sector: 'GENERATIVE AI', source: 'https://seedtable.com/best-ai-startups-in-russia', sourceName: 'SEEDTABLE' },
  { name: 'Nanosemantics', sector: 'CONVERSATIONAL AI', source: 'https://seedtable.com/best-ai-startups-in-russia', sourceName: 'SEEDTABLE' },
  { name: 'Synqera', sector: 'RETAIL AI', source: 'https://seedtable.com/best-ai-startups-in-russia', sourceName: 'SEEDTABLE' },
  { name: 'Promobot', sector: 'ROBOTICS', source: 'https://seedtable.com/best-ai-startups-in-russia', sourceName: 'SEEDTABLE' },
  { name: 'BestFitMe', sector: 'HR / AI', source: 'https://seedtable.com/best-ai-startups-in-russia', sourceName: 'SEEDTABLE' },
  { name: 'Geosplit', sector: 'GEOANALYTICS', source: 'https://seedtable.com/best-ai-startups-in-russia', sourceName: 'SEEDTABLE' },
  { name: 'MyBuddy.ai', sector: 'EDTECH / AI', source: 'https://seedtable.com/best-ai-startups-in-russia', sourceName: 'SEEDTABLE' },
  { name: 'Inspector Cloud', sector: 'COMPUTER VISION', source: 'https://seedtable.com/best-ai-startups-in-russia', sourceName: 'SEEDTABLE' },
  { name: 'Youth Laboratories', sector: 'BIOTECH / AI', source: 'https://seedtable.com/best-ai-startups-in-russia', sourceName: 'SEEDTABLE' },
  { name: 'DeepPavlov', sector: 'NLP / RESEARCH', source: 'https://www.ai-review.ru/blog/ai-startapy-rossii-top-20/', sourceName: 'AI REVIEW' },
  { name: 'Chatfuel', sector: 'CONVERSATIONAL AI', source: 'https://www.ai-review.ru/blog/ai-startapy-rossii-top-20/', sourceName: 'AI REVIEW' },
  { name: 'VoiceBox', sector: 'SPEECH AI', source: 'https://www.ai-review.ru/blog/ai-startapy-rossii-top-20/', sourceName: 'AI REVIEW' },
  { name: 'ЦРТ', sector: 'SPEECH / BIOMETRICS', source: 'https://www.ai-review.ru/blog/ai-startapy-rossii-top-20/', sourceName: 'AI REVIEW' },
  { name: 'Naumen', sector: 'ENTERPRISE AI', source: 'https://www.ai-review.ru/blog/ai-startapy-rossii-top-20/', sourceName: 'AI REVIEW' },
  { name: 'Intema', sector: 'ENTERPRISE AI', source: 'https://www.ai-review.ru/blog/ai-startapy-rossii-top-20/', sourceName: 'AI REVIEW' },
  { name: 'Celsus', sector: 'MEDTECH / AI', source: 'https://www.ai-review.ru/blog/ai-startapy-rossii-top-20/', sourceName: 'AI REVIEW' },
  { name: 'Third Opinion', sector: 'MEDTECH / AI', source: 'https://www.ai-review.ru/blog/ai-startapy-rossii-top-20/', sourceName: 'AI REVIEW' },
  { name: 'MWS AI', sector: 'LLM / INFRASTRUCTURE', source: 'https://www.ai-review.ru/blog/top-ai-kompaniy-rossii-reyting-2026/', sourceName: 'AI REVIEW' },
  { name: 'MTS AI', sector: 'TELCO / AI', source: 'https://www.ai-review.ru/blog/top-ai-kompaniy-rossii-reyting-2026/', sourceName: 'AI REVIEW' },
  { name: 'Sber AI', sector: 'GENERATIVE AI', source: 'https://www.ai-review.ru/blog/top-ai-kompaniy-rossii-reyting-2026/', sourceName: 'AI REVIEW' },
  { name: 'Yandex AI', sector: 'LLM / PLATFORM', source: 'https://www.ai-review.ru/blog/top-ai-kompaniy-rossii-reyting-2026/', sourceName: 'AI REVIEW' },
  { name: 'T-Bank AI', sector: 'FINTECH AI', source: 'https://www.ai-review.ru/blog/top-ai-kompaniy-rossii-reyting-2026/', sourceName: 'AI REVIEW' },
  { name: 'Silero', sector: 'SPEECH AI', source: 'https://maximsoldatkin.ru/russkie-neyroseti/', sourceName: 'PUBLIC CATALOG' },
  { name: 'Salute AI', sector: 'CONSUMER AI', source: 'https://maximsoldatkin.ru/russkie-neyroseti/', sourceName: 'PUBLIC CATALOG' },
  { name: 'YandexGPT', sector: 'LLM', source: 'https://maximsoldatkin.ru/russkie-neyroseti/', sourceName: 'PUBLIC CATALOG' },
];

export const researchUniverse = [
  ...establishedResearchUniverse.map((item, index) => ({
    ...item,
    id: `research-${index + 1}`,
    priority: 'ESTABLISHED',
  })),
  ...emergingStartups.map((item, index) => ({
    name: item.name,
    sector: item.sector,
    source: item.source,
    sourceName: item.sourceName,
    priority: 'EMERGING',
    founder: item.founder,
    founderAge: item.founderAge ?? null,
    id: `research-${establishedResearchUniverse.length + index + 1}`,
  })),
];

export const coverageLabels = [
  'FOUNDATION & LLM',
  'ENTERPRISE AI',
  'COMPUTER VISION',
  'MEDTECH',
  'INDUSTRIAL AI',
  'SPEECH',
  'ROBOTICS',
  'CONSUMER AI',
];
