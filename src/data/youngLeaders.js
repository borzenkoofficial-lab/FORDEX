import { emergingStartups } from './emergingStartups';
import { startupRankings } from './startups';

const byId = new Map(emergingStartups.map((item) => [item.id, item]));
const coreById = new Map(startupRankings.map((item) => [item.id, item]));

const records = [
  { id: 'veai', capitalM: 400, usersK: 6, foundedYear: 2025, source: 'https://veai.ru/blog/company/veai-investround', sourceName: 'VEAI' },
  { id: 'gradius', valuationM: 150, usersK: 3000, mrrK: 1200, foundedYear: 2025, source: 'https://productradar.ru/blog/kak-gradius-privlek-investitsii-150mln/', sourceName: 'PRODUCT RADAR' },
  { id: 'health-hero', capitalM: 15, usersK: 200, source: 'https://health-hero.pro/about', sourceName: 'HEALTH HERO' },
  { id: 'lork-dev', usersK: 1.447, payers: 119, mrrK: 184, source: 'https://lork.dev/blog/lork-dev-184k-mrr-partnerskaya-programma', sourceName: 'LORK' },
  { id: 'poehali-dev', usersK: 50, source: 'https://poehali.dev/', sourceName: 'ПОЕХАЛИ.DEV' },
  { id: 'innde', capitalM: 5, source: 'https://productradar.ru/blog/innde-pervyj-raund-investiczij-5-mln-rubley/', sourceName: 'PRODUCT RADAR' },
  { id: 'mymeet-ai', capitalM: 5, source: 'https://productradar.ru/product/mymeet-ai/', sourceName: 'PRODUCT RADAR' },
  { id: 'freestyling-ai', source: 'https://productradar.ru/product/freestyling-ai/', sourceName: 'PRODUCT RADAR' },
  { id: 'glabix', source: 'https://productradar.ru/product/glabiks/', sourceName: 'PRODUCT RADAR' },
  { id: 'pitchy-pro', source: 'https://pitchy.pro/about', sourceName: 'PITCHY.PRO' },
  { id: 'polza-ai', source: 'https://productradar.ru/product/polza-ai/', sourceName: 'PRODUCT RADAR' },
  { id: 'babyhelper', usersK: 28, source: 'https://productradar.ru/product/babyhelper/', sourceName: 'PRODUCT RADAR' },
];

const CAPITAL_BENCHMARK_M = 400;
const VALUATION_BENCHMARK_M = 150;
const USERS_BENCHMARK_K = 3000;
const MRR_BENCHMARK_K = 1200;

const logSignal = (value, benchmark) => value > 0 ? Math.min(100, (Math.log10(value + 1) / Math.log10(benchmark + 1)) * 100) : 0;

function buildSignal(record) {
  const capitalBase = Math.max(record.capitalM || 0, record.valuationM || 0);
  const capitalSignal = Math.max(
    logSignal(record.capitalM || 0, CAPITAL_BENCHMARK_M),
    logSignal(record.valuationM || 0, VALUATION_BENCHMARK_M),
  );
  const tractionSignal = Math.max(
    logSignal(record.usersK || 0, USERS_BENCHMARK_K),
    logSignal(record.mrrK || 0, MRR_BENCHMARK_K),
  );
  return Number((capitalSignal * 0.55 + tractionSignal * 0.45).toFixed(1));
}

export const youngLeaderRankings = records
  .map((record) => {
    const emerging = byId.get(record.id);
    const core = coreById.get(record.id);
    if (!emerging && !core) return null;
    return {
      ...record,
      ...emerging,
      ...(core ? { sector: core.sector, stage: core.stage, city: core.city, description: core.description, website: core.website } : {}),
      signal: buildSignal(record),
      capitalLabel: record.valuationM
        ? 'ОЦЕНКА ₽' + record.valuationM + 'M'
        : record.capitalM
          ? 'КАПИТАЛ ₽' + record.capitalM + 'M'
          : 'КАПИТАЛ НЕ РАСКРЫТ',
      tractionLabel: record.mrrK
        ? 'MRR ₽' + record.mrrK + 'K'
        : record.usersK
          ? (record.usersK >= 1000 ? 'ПОЛЬЗОВАТЕЛИ ' + (record.usersK / 1000).toFixed(1) + 'M' : 'ПОЛЬЗОВАТЕЛИ ' + record.usersK + 'K')
          : 'ТЯГА ПРОДУКТА НЕ НОРМАЛИЗОВАНА',
    };
  })
  .filter(Boolean)
  .sort((a, b) => b.signal - a.signal || a.name.localeCompare(b.name))
  .map((item, index) => ({ ...item, rank: index + 1 }));

export const youngLeaderMethodology = {
  title: 'ГЛАВНЫЙ РЕЙТИНГ МОЛОДЫХ ЛИДЕРОВ',
  description: 'Прозрачный discovery-сигнал для молодых AI-команд. 55% — капитал или раскрытая оценка, 45% — подтверждённая тяга продукта через пользователей или MRR. Это не инвестиционная оценка и не заменяет FORDEX Score.',
  lastVerified: '06 OCT 2026',
};
