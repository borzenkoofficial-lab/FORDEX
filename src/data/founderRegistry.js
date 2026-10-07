import { emergingFounderProfiles } from './emergingStartups.js';
import { createFounderMockup } from '../lib/visualMockup.js';

const founderImages = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=86',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=86',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=86',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=86',
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=86',
];

const establishedFounders = [
  {
    id: 'olga-uskova',
    name: 'Olga Uskova',
    company: 'Cognitive Pilot',
    role: 'FOUNDER / CEO',
    city: 'MOSCOW',
    description: 'Предприниматель и основатель Cognitive Pilot, развивающий AI для автономного транспорта и сельского хозяйства.',
    source: 'https://uskova.cognitivepilot.com/',
    verified: true,
    verificationLevel: 'PRIMARY_SOURCE',
  },
  {
    id: 'alex-panov',
    name: 'Alex Panov',
    company: 'Neiry',
    role: 'FOUNDER / CEO',
    city: 'MOSCOW',
    description: 'Основатель и CEO Neiry, развивающий бизнес BCI-продуктов и платформы для медицинских и потребительских сценариев.',
    source: 'https://neiry.ru/strategy',
    verified: true,
    verificationLevel: 'PRIMARY_SOURCE',
  },
  {
    id: 'alexander-larionov',
    name: 'Alexander Larionov',
    company: 'DRESSCODE',
    role: 'CO-FOUNDER / CTO',
    city: 'MOSCOW',
    description: 'Сооснователь и технический руководитель DRESSCODE — платформы AI-виртуальной примерки для fashion-ритейла.',
    source: 'https://www.dresscode.ai/news/dresscode-i-cum-zaklyuchili-strategicheskoe-partnerstvo.html',
    verified: true,
    verificationLevel: 'PRIMARY_SOURCE',
  },
  {
    id: 'andrey-zimenkov',
    name: 'Andrey Zimenkov',
    company: 'targetai',
    role: 'CO-FOUNDER / CEO',
    city: 'MOSCOW',
    description: 'Сооснователь и CEO targetai, развивающий LLM и голосовых агентов для клиентских операций и обучения.',
    source: 'https://targetai.ai/about-us',
    verified: true,
    verificationLevel: 'PRIMARY_SOURCE',
  },
  {
    id: 'alina-mukhamedzhanova',
    name: 'Alina Mukhamedzhanova',
    company: 'Syntelly',
    role: 'CEO',
    city: 'MOSCOW',
    description: 'CEO Syntelly — компании химической информатики, использующей AI и большие научные массивы данных.',
    source: 'https://syntelly.ru/aboutsyntelly',
    verified: true,
    verificationLevel: 'PRIMARY_SOURCE',
  },
  {
    id: 'stanislav-ashmanov',
    name: 'Stanislav Ashmanov',
    company: 'Syntelly',
    role: 'CO-FOUNDER / DEVELOPMENT',
    city: 'MOSCOW',
    description: 'Сооснователь и советник по развитию Syntelly.',
    source: 'https://syntelly.ru/aboutsyntelly',
    verified: true,
    verificationLevel: 'PRIMARY_SOURCE',
  },
  {
    id: 'maxim-fedorov',
    name: 'Maxim Fedorov',
    company: 'Syntelly',
    role: 'CO-FOUNDER / SCIENCE',
    city: 'MOSCOW',
    description: 'Сооснователь и научный советник Syntelly.',
    source: 'https://syntelly.ru/aboutsyntelly',
    verified: true,
    verificationLevel: 'PRIMARY_SOURCE',
  },
  {
    id: 'georgy-belyaev',
    name: 'Georgy Belyaev',
    company: 'Algorithm1 / Expanta',
    role: 'FOUNDER / CEO',
    city: 'MOSCOW',
    description: 'Основатель и CEO Algorithm1, компании портфеля промышленной software-группы Expanta.',
    source: 'https://expanta.ru/news/ekspanta-obyavlyaet-o-sozdanii-edinogo-aps-kontura-dlya-promyshlennosti-posle-pokupki-algoritm1/',
    verified: true,
    verificationLevel: 'PRIMARY_SOURCE',
  },
];

const emerging = emergingFounderProfiles.map((founder) => ({
  ...founder,
  verificationLevel: founder.ageSource ? 'SOURCE_CLAIMED' : 'RESEARCH',
}));

const deduped = new Map();
[...establishedFounders, ...emerging].forEach((founder) => {
  const key = founder.company.toLowerCase() + '::' + founder.name.toLowerCase();
  if (!deduped.has(key)) deduped.set(key, founder);
});

export const founderRegistry = [...deduped.values()].map((founder) => ({
  ...founder,
  image: createFounderMockup(founder.company, founder.name, founder.role),
}));

export const founderById = new Map(founderRegistry.map((founder) => [founder.id, founder]));

export const founderRegistryStats = {
  total: founderRegistry.length,
  withAge: founderRegistry.filter((item) => item.age != null).length,
  sourceClaimed: founderRegistry.filter((item) => item.verificationLevel === 'SOURCE_CLAIMED').length,
  primarySource: founderRegistry.filter((item) => item.verificationLevel === 'PRIMARY_SOURCE').length,
  research: founderRegistry.filter((item) => item.verificationLevel === 'RESEARCH').length,
};
