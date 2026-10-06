import { useEffect, useMemo, useState } from 'react';
import { rankingCategories, scoreWeights } from './data/startups';
import { rankingCollections } from './data/rankingCollections';
import { rankedStartupIndex, rankingModel } from './lib/rankingEngine';
import { dealRecords, founderProfiles, marketCompanies, marketSummary, newsFeed } from './data/market';
import { coverageLabels, researchUniverse } from './data/coverage';
import { aiProviderRankings, aiProviderSource } from './data/providerRankings';
import { sourceRegistry, sourceRules } from './data/sources';
import { editorialArticles, getEditorialArticle } from './data/articles';
import { ruText, ruTag, ruSector, ruStage, ruCity, ruKind, ruRole, ruScoreLabel, ruDate, ruSizeBand } from './i18n';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
  Heart,
  LineChart,
  LockKeyhole,
  Menu,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  UserRound,
  Users,
  WalletCards,
  X,
} from 'lucide-react';

const NAV = ['COMPANIES', 'FOUNDERS', 'DEALS', 'RANKINGS', 'MARKET'];
const EDITORIAL_IMAGE = 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1600&q=88';

const categoryLinks = [
  { title: 'COMPANIES', text: 'Структурированные профили компаний российской AI-экономики.', href: 'companies', image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=720&q=86' },
  { title: 'FOUNDERS', text: 'Люди, которые строят команды, продукты и рынки.', href: 'founders', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=720&q=86' },
  { title: 'DEALS', text: 'Раунды финансирования и движения капитала с привязанными доказательствами.', href: 'deals', image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=720&q=86' },
];

const sectorFilters = ['ALL', 'AI / AGENTS', 'DEEPTECH', 'MEDTECH', 'NEUROTECH', 'INDUSTRIAL', 'CONSUMER'];
const startupRankings = rankedStartupIndex;
const startupRankById = new Map(startupRankings.map((item) => [item.id, item]));

function getRoute() {
  return window.location.hash.replace('#', '').trim().toLowerCase() || 'home';
}

function goto(route) {
  window.location.hash = route;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function useRoute() {
  const [route, setRoute] = useState(getRoute);
  useEffect(() => {
    const onHash = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return route;
}

function ButtonLink({ children, route, className = '' }) {
  return <button className={className} onClick={() => goto(route)} type="button">{children}</button>;
}

function isWatched(item, watchlist) {
  return watchlist.includes(item.id) || watchlist.includes(item.name);
}

function moneyM(items) {
  return items.reduce((sum, item) => sum + (Number(item.valueM) || 0), 0);
}

export function App() {
  const route = useRoute();
  const [searchOpen, setSearchOpen] = useState(false);
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('fordex-watchlist') || '[]');
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try { localStorage.setItem('fordex-watchlist', JSON.stringify(watchlist)); }
    catch { /* best effort */ }
  }, [watchlist]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === '/' && !searchOpen && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  const toggleWatch = (item) => {
    const key = item.id;
    setWatchlist((current) => {
      const watched = isWatched(item, current);
      if (watched) return current.filter((value) => value !== key && value !== item.name);
      return [...current, key];
    });
  };

  const knownRoutes = ['home', 'companies', 'founders', 'deals', 'rankings', 'market', 'sources', 'news', 'analytics', 'watchlist'];

  return (
    <div className="site">
      <TopBar />
      <Header route={route} watchCount={watchlist.length} onSearch={() => setSearchOpen(true)} />
      {route === 'home' && <Home watchlist={watchlist} toggleWatch={toggleWatch} />}
      {route === 'companies' && <CompanyDirectory watchlist={watchlist} toggleWatch={toggleWatch} />}
      {route === 'founders' && <Founders />}
      {route === 'deals' && <Deals />}
      {route === 'rankings' && <Rankings />}
      {route === 'market' && <MarketMap />}
      {route === 'sources' && <Sources />}
      {route === 'news' && <News />}
      {route === 'analytics' && <Analytics />}
      {route === 'watchlist' && <Watchlist names={watchlist} toggleWatch={toggleWatch} />}
      {route.startsWith('article-') && <ArticlePage articleId={route.replace('article-', '')} />}
      {route.startsWith('research-') && <ResearchArticlePage researchId={route} />}
      {!knownRoutes.includes(route) && !route.startsWith('article-') && !route.startsWith('research-') && <NotFound route={route} />}
      <Footer />
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </div>
  );
}

function TopBar() {
  return (
    <div className="announcement">
      <span>ИНДЕКС AI-БИЗНЕСА РОССИИ</span><strong>ИССЛЕДОВАТЕЛЬСКАЯ БЕТА · 2026</strong>
      <div className="announcement-links">
        <button type="button" onClick={() => goto('analytics')}>МЕТОДОЛОГИЯ</button><span>|</span>
        <button type="button" onClick={() => goto('news')}>ПОСЛЕДНЕЕ</button><span>|</span>
        <button type="button" onClick={() => goto('home')}>ГЛАВНАЯ</button>
      </div>
    </div>
  );
}

function Header({ route, watchCount, onSearch }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const watchLabel = watchCount ? 'СЛЕДИТЬ (' + watchCount + ')' : 'СЛЕДИТЬ';
  const navigate = (target) => {
    setMobileOpen(false);
    goto(target);
  };

  return (
    <>
      <header className="header">
        <button className="mobile-menu" type="button" aria-label="Открыть навигацию" aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)}>
          {mobileOpen ? <X size={17} /> : <Menu size={17} />}
        </button>
        <nav className="nav-left" aria-label="Основная навигация">
          {NAV.map((item) => (
            <button type="button" key={item} className={route === item.toLowerCase() ? 'active' : ''} onClick={() => goto(item.toLowerCase())}>{ruText(item)}</button>
          ))}
        </nav>
        <button className="logo" type="button" onClick={() => goto('home')} aria-label="Главная FORDEX">FORDEX</button>
        <div className="nav-right">
          <button type="button" onClick={onSearch}><Search size={15} /><span>ПОИСК</span></button>
          <button type="button" onClick={() => goto('analytics')}><LineChart size={15} /><span>АНАЛИТИКА</span></button>
          <button type="button" onClick={() => goto('watchlist')}><Heart size={15} /><span>{watchLabel}</span></button>
          <button type="button" onClick={() => goto('rankings')}><BarChart3 size={15} /><span>ИНДЕКС</span></button>
        </div>
      </header>
      <div className={mobileOpen ? 'mobile-drawer open' : 'mobile-drawer'} aria-hidden={!mobileOpen}>
        <div className="mobile-drawer-links">
          {NAV.map((item) => <button type="button" key={item} onClick={() => navigate(item.toLowerCase())}>{ruText(item)}</button>)}
          <button type="button" onClick={() => navigate('news')}>НОВОСТИ</button>
          <button type="button" onClick={() => navigate('analytics')}>АНАЛИТИКА</button>
          <button type="button" onClick={() => navigate('watchlist')}>СЛЕДИТЬ{watchCount ? ' (' + watchCount + ')' : ''}</button>
        </div>
        <div className="mobile-drawer-note"><strong>FORDEX</strong><span>ИНДЕКС AI-БИЗНЕСА · РОССИЯ</span></div>
      </div>
    </>
  );
}

function Home({ watchlist, toggleWatch }) {
  const rising = startupRankings.filter((item) => item.momentum >= 10).slice(0, 4);
  const recentDeals = [...dealRecords].sort((a, b) => (b.valueM || 0) - (a.valueM || 0)).slice(0, 4);
  const sectorCounts = [...new Set(startupRankings.flatMap((item) => item.tags))]
    .filter((sector) => sector !== 'CONSUMER')
    .map((sector) => ({ sector, count: startupRankings.filter((item) => item.tags.includes(sector)).length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <main id="top">
      <section className="hero hero-large">
        <div className="hero-copy"><span>ИНДЕКС AI-БИЗНЕСА<br />РОССИИ</span><i /></div>
        <div className="hero-word" aria-hidden="true">FORDEX</div>
        <div className="hero-kicker"><span>РЕЙТИНГИ · КАПИТАЛ · ЛЮДИ</span><strong>ВЕСЬ РЫНОК<br />В ОДНОМ КАДРЕ.</strong></div>
        <div className="hero-actions">
          <ButtonLink route="rankings" className="primary">ОТКРЫТЬ ИНДЕКС <ArrowRight size={14} /></ButtonLink>
          <ButtonLink route="companies" className="underlined">СМОТРЕТЬ КОМПАНИИ</ButtonLink>
        </div>
        <div className="hero-stamp"><span>ИССЛЕДОВАТЕЛЬСКАЯ БЕТА</span><strong>2026</strong><i /></div>
        <div className="hero-foot">
          <span>{marketSummary.indexedStartups} КОМПАНИЙ С ОЦЕНКОЙ</span><span>{marketSummary.trackedCompanies} ПРОФИЛЕЙ В ОТСЛЕЖИВАНИИ</span><span>ДАННЫЕ С ПРИВЯЗКОЙ К ИСТОЧНИКУ</span>
          <button type="button" onClick={() => goto('market')}>ОТКРЫТЬ КАРТУ РЫНКА <ArrowRight size={13} /></button>
        </div>
      </section>

      <section className="category-strip">
        {categoryLinks.map((category) => (
          <button className="category" type="button" key={ruText(category.title)} onClick={() => goto(category.href)}>
            <img src={category.image} alt="" loading="lazy" />
            <div><h3>{ruText(category.title)}</h3><p>{category.text}</p><span>СМОТРЕТЬ <ArrowRight size={13} /></span></div>
          </button>
        ))}
      </section>

      <section className="index-snapshot">
        <div className="section-kicker">СНИМОК ИНДЕКСА · {marketSummary.lastReview}</div>
        <div className="snapshot-grid">
          <Metric label="КОМПАНИИ" value={marketSummary.trackedCompanies} note="профилей в отслеживании" icon={<Building2 />} />
          <Metric label="СТАРТАПЫ" value={marketSummary.indexedStartups} note="компаний в рейтинге" icon={<TrendingUp />} />
          <Metric label="ОСНОВАТЕЛИ" value={marketSummary.founderProfiles} note="проверенных людей" icon={<Users />} />
          <Metric label="СДЕЛКИ" value={marketSummary.recordedDeals} note="зафиксированных сделок" icon={<WalletCards />} />
        </div>
      </section>

      <section className="editorial">
        <div className="editorial-copy">
          <span>СЛОЙ ИССЛЕДОВАНИЙ</span><h2>В ОДНОМ МЕСТЕ.<br />БОЛЬШЕ СИГНАЛОВ.</h2>
          <p>FORDEX разделяет факты о компаниях, события с капиталом и редакционные сигналы рейтинга, чтобы можно было пройти от новости к доказательствам, не покидая индекс.</p>
          <ButtonLink route="analytics" className="primary">КАК ЭТО РАБОТАЕТ <ArrowRight size={14} /></ButtonLink>
        </div>
        <img src={EDITORIAL_IMAGE} alt="Команда за работой" loading="lazy" />
      </section>

      <section className="trust">
        <div><LineChart /><strong>АКТУАЛЬНОСТЬ</strong><span>Каждая запись содержит дату проверки.</span></div>
        <div><ShieldCheck /><strong>ПРОВЕРЕНО</strong><span>Источники прикреплены к профилям.</span></div>
        <div><TrendingUp /><strong>РЕЙТИНГ</strong><span>Единая прозрачная редакционная модель.</span></div>
        <div><LockKeyhole /><strong>ОТКРЫТЫЙ ИНДЕКС</strong><span>Исследования отделены от шума и хайпа.</span></div>
      </section>

      <section className="best">
        <div className="section-head"><div><span>СЕЙЧАС РАСТУТ</span><h2>ЛИДЕРЫ ДИНАМИКИ</h2></div><ButtonLink route="rankings" className="view-all">ОТКРЫТЬ ИНДЕКС <ChevronRight size={14} /></ButtonLink></div>
        <div className="movers-grid">
          {rising.map((item) => (
            <button type="button" className="mover-card" key={item.id} onClick={() => goto('rankings')}>
              <span className="mover-rank">#{String(item.rank).padStart(2, '0')}</span>
              <div><strong>{item.name}</strong><span>{ruSector(item.sector)}</span></div>
              <em>+{item.momentum}%</em>
            </button>
          ))}
        </div>
      </section>

      <section className="home-dual">
        <div className="signal-panel">
          <div className="panel-head"><span>КРУПНЕЙШИЕ ЗАФИКСИРОВАННЫЕ СДЕЛКИ</span><WalletCards size={20} /></div>
          {recentDeals.map((deal) => <button type="button" key={deal.id} onClick={() => goto('deals')}><span>{deal.company}<small>{ruDate(deal.date)}</small></span><strong>{deal.value}</strong><ArrowRight size={14} /></button>)}
        </div>
        <div className="signal-panel">
          <div className="panel-head"><span>ПОКРЫТИЕ ИНДЕКСА</span><Activity size={20} /></div>
          {sectorCounts.map((item) => <div className="coverage-line" key={item.sector}><span>{ruSector(item.sector)}</span><div><i style={{ width: Math.max(15, item.count / startupRankings.length * 100) + '%' }} /></div><strong>{item.count}</strong></div>)}
          <ButtonLink route="analytics" className="small-link">СМОТРЕТЬ ДАННЫЕ РЫНКА <ArrowRight size={13} /></ButtonLink>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, note, icon }) {
  return <article className="metric-card"><div className="metric-icon">{icon}</div><span>{ruText(label)}</span><strong>{value}</strong><small>{note}</small></article>;
}

function PageHero({ eyebrow, title, description, action }) {
  return (
    <section className="page-hero">
      <div><span>{eyebrow}</span><h1>{ruText(title)}</h1><p>{description}</p>{action}</div>
      <div className="page-hero-word" aria-hidden="true">{title.split(' ')[0]}</div>
    </section>
  );
}

function CompanyDirectory({ watchlist, toggleWatch }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => marketCompanies.filter((item) => {
    const haystack = [item.name, item.sector, item.stage, item.city, item.description].join(' ').toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesFilter = filter === 'ALL' || item.tags?.includes(filter);
    return matchesQuery && matchesFilter;
  }), [query, filter]);

  return (
    <main className="inner-page">
      <PageHero eyebrow="КАТАЛОГ КОМПАНИЙ" title="COMPANIES" description="Структурированный каталог публичных AI-компаний, технологических групп и независимых компаний, отслеживаемых FORDEX." />
      <section className="toolbar">
        <label><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск компании, сектора, города..." /></label>
        <button type="button" onClick={() => setFilter(filter === 'ALL' ? 'AI / AGENTS' : 'ALL')}><SlidersHorizontal size={15} />{filter === 'ALL' ? 'ФИЛЬТР' : 'СБРОСИТЬ'}</button>
        <span className="result-count">{filtered.length} ПРОФИЛЕЙ</span>
      </section>
      <div className="filter-rail">{sectorFilters.map((item) => <button type="button" key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{ruTag(item)}</button>)}</div>
      <section className="directory-grid">
        {filtered.map((item, index) => (
          <article className="directory-card" key={item.id}>
            <div className="directory-image">
              <img src={item.image} alt="" loading={index < 6 ? 'eager' : 'lazy'} />
              <button type="button" className="image-open" onClick={() => setSelected(item)} aria-label={'Открыть профиль «' + item.name + '»'} />
              <span>{startupRankById.has(item.id) ? '#' + String(startupRankById.get(item.id).rank).padStart(2, '0') : ruKind(item.kind)}</span>
              {item.verified && <span className="verified-mark"><CheckCircle2 size={13} /></span>}
              <button type="button" className={isWatched(item, watchlist) ? 'watch active' : 'watch'} onClick={() => toggleWatch(item)} aria-label="Добавить в список отслеживания"><Heart size={16} fill={isWatched(item, watchlist) ? 'currentColor' : 'none'} /></button>
            </div>
            <div className="directory-copy">
              <span>{ruSector(item.sector)} · {ruStage(item.stage)}</span><h3>{item.name}</h3><p>{item.description}</p>
              <button type="button" className="card-cta" onClick={() => setSelected(item)}>ОТКРЫТЬ ПРОФИЛЬ <ArrowRight size={13} /></button>
            </div>
          </article>
        ))}
        {!filtered.length && <div className="empty">РЕЗУЛЬТАТОВ НЕТ.</div>}
      </section>
      {selected && <CompanyDrawer company={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}

function CompanyDrawer({ company, onClose }) {
  const ranked = startupRankById.get(company.id);
  return (
    <div className="startup-overlay" role="dialog" aria-modal="true" aria-label={company.name + ' профиль'} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="startup-drawer company-drawer">
        <div className="drawer-top"><span>ПРОФИЛЬ FORDEX · {ruKind(company.kind)}</span><button type="button" onClick={onClose} aria-label="Закрыть профиль"><X size={18} /></button></div>
        <div className="drawer-media"><img src={company.image} alt="" /></div>
        <span className="drawer-sector">{ruSector(company.sector)}</span><h2>{company.name}</h2><p>{company.description}</p>{company.evidence && <div className="drawer-signal"><span>ДОКАЗАТЕЛЬСТВА</span><p>{company.evidence}</p></div>}
        <div className="drawer-stats">
          <div><span>СТАДИЯ</span><strong>{ruStage(company.stage)}</strong></div>
          <div><span>МАСШТАБ</span><strong>{company.sizeBand ? ruSizeBand(company.sizeBand) : '—'}</strong></div>
          <div><span>ЛОКАЦИЯ</span><strong>{ruCity(company.city)}</strong></div>
          <div><span>РЕЙТИНГ FORDEX</span><strong>{ranked ? '#' + String(ranked.rank).padStart(2, '0') : '—'}</strong></div>
          <div><span>ПРОВЕРЕНО</span><strong>{company.lastVerified || '—'}</strong></div>
        </div>
        {ranked && <div className="drawer-signal"><span>СИГНАЛ ИНДЕКСА</span><p>оценка FORDEX <strong>{ranked.score}</strong> · динамика <strong>+{ranked.momentum}%</strong>.</p></div>}
        <a className="drawer-source" href={company.website || company.source} target="_blank" rel="noreferrer">ОТКРЫТЬ КОМПАНИЮ <ExternalLink size={14} /></a>
      </aside>
    </div>
  );
}

function MarketMap() {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();
  const indexed = startupRankings.length;
  const corporate = marketCompanies.filter((item) => item.kind === 'CORPORATE').length;
  const emerging = marketCompanies.filter((item) => item.kind === 'EMERGING STARTUP').length;
  const visible = researchUniverse.filter((item) => [item.name, item.sector, item.sourceName].join(' ').toLowerCase().includes(normalized));

  const buckets = useMemo(() => {
    const map = new Map();
    startupRankings.forEach((item) => item.tags.forEach((tag) => map.set(tag, (map.get(tag) || 0) + 1)));
    marketCompanies.filter((item) => item.kind === 'CORPORATE').forEach((item) => item.tags?.forEach((tag) => map.set(tag, (map.get(tag) || 0) + 1)));
    return coverageLabels.map((label) => {
      const aliases = label === 'FOUNDATION & LLM' ? ['AI / AGENTS'] : label === 'COMPUTER VISION' ? ['DEEPTECH', 'MEDTECH'] : label === 'MEDTECH' ? ['MEDTECH'] : label === 'INDUSTRIAL AI' ? ['INDUSTRIAL'] : label === 'CONSUMER AI' ? ['CONSUMER'] : [];
      return { label, count: aliases.reduce((sum, alias) => sum + (map.get(alias) || 0), 0) };
    });
  }, []);

  return (
    <main className="inner-page market-page">
      <PageHero eyebrow="ПОКРЫТИЕ РЫНКА" title="MARKET MAP" description="Расширенный исследовательский контур вокруг основного индекса FORDEX. Ранжируются только компании с отдельной проверкой; молодые стартапы и новые команды сначала проходят очередь покрытия." action={<ButtonLink route="rankings" className="text-link">ОТКРЫТЬ РЕЙТИНГ СТАРТАПОВ <ArrowRight size={13} /></ButtonLink>} />
      <section className="market-overview">
        <div><span>ЯДРО FORDEX</span><strong>{indexed}</strong><small>компаний с оценкой</small></div>
        <div><span>КОРПОРАТИВНЫЙ СЛОЙ</span><strong>{corporate}</strong><small>крупных технологических групп</small></div>
        <div><span>МОЛОДЫЕ КОМАНДЫ</span><strong>{emerging}</strong><small>стартапов на радаре</small></div>
        <div><span>ИССЛЕДОВАТЕЛЬСКАЯ ВЫБОРКА</span><strong>{researchUniverse.length}</strong><small>записей до публикации в индексе</small></div>
      </section>

      <section className="market-intro">
        <div><span>КАК ЧИТАТЬ КАРТУ</span><h2>РАЗДЕЛЯЙТЕ<br />ЯДРО И<br />ПОКРЫТИЕ.</h2></div>
        <div>
          <p>FORDEX использует три слоя: оценённые стартапы, корпоративных AI-игроков и исследовательскую выборку. Внутри последнего слоя отдельный приоритет получают молодые команды и новые продукты, даже когда данных пока недостаточно для балла. Это позволяет сохранять строгий рейтинг и не делать вид, что по каждой компании есть одинаковый объём открытых данных.</p>
          <div className="market-legend"><span><i className="legend-dot solid" />С ОЦЕНКОЙ</span><span><i className="legend-dot" />ТОЛЬКО ПОКРЫТИЕ</span><span><i className="legend-dot dark" />КОРПОРАТИВНЫЕ</span></div>
        </div>
      </section>

      <section className="market-sectors">
        <div className="section-head"><div><span>ПОКРЫТИЕ ПО СЕКТОРАМ</span><h2>ГДЕ НАХОДИТСЯ РЫНОК</h2></div></div>
        <div className="sector-map-grid">
          {buckets.map((bucket) => <div className="sector-map-card" key={bucket.label}><span>{ruText(bucket.label)}</span><strong>{bucket.count}</strong><div><i style={{ width: Math.min(100, 18 + bucket.count / Math.max(1, indexed) * 100) + '%' }} /></div><small>СИГНАЛОВ В ИНДЕКСЕ</small></div>)}
        </div>
      </section>

      <section className="market-universe">
        <div className="universe-head">
          <div><span>ИССЛЕДОВАТЕЛЬСКАЯ ВЫБОРКА</span><h2>КТО ЕЩЁ<br />НА РАДАРЕ?</h2></div>
          <label><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по исследовательской выборке..." /></label>
        </div>
        <div className="universe-table">
          <div className="universe-row universe-head-row"><span>КОМПАНИЯ</span><span>СЕКТОР</span><span>СТАТУС</span><span>ИСТОЧНИК</span></div>
          {visible.map((item, index) => <button type="button" className="universe-row" key={item.id || item.name} onClick={() => goto(item.id)}><strong>{item.name}</strong><span>{ruSector(item.sector)}</span><span>{item.priority === 'EMERGING' ? 'МОЛОДАЯ КОМАНДА · НА РАДАРЕ' : 'ИССЛЕДОВАНИЕ · НА РАДАРЕ'}</span><span>ОТКРЫТЬ ДОСЬЕ <ArrowRight size={13} /></span></button>)}
          {!visible.length && <div className="empty">ПРОФИЛИ НЕ НАЙДЕНЫ ПО ЗАПРОСУ.</div>}
        </div>
      </section>
    </main>
  );
}

function Founders() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const filtered = founderProfiles.filter((item) => [item.name, item.company, item.role].join(' ').toLowerCase().includes(query.toLowerCase()));

  return (
    <main className="inner-page">
      <PageHero eyebrow="ЛЮДИ И ЛИДЕРЫ" title="FOUNDERS" description="Индекс основателей и ключевых руководителей: должность, компания, город и ссылка на источник для каждого профиля." />
      <section className="toolbar"><label><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск основателя или компании..." /></label><span className="result-count">{filtered.length} ЛЮДЕЙ</span></section>
      <section className="portrait-grid">
        {filtered.map((founder, index) => (
          <button type="button" className="founder-card" key={founder.id} onClick={() => setSelected(founder)}>
            <div className="portrait-image"><img src={founder.image} alt="" loading={index < 4 ? 'eager' : 'lazy'} /><span>0{index + 1}</span></div>
            <span>{founder.company}</span><h3>{founder.name}</h3><small>{ruRole(founder.role)}{founder.age ? ' · ' + founder.age + ' ЛЕТ' : ''}</small>
            <span className="card-cta">ОТКРЫТЬ ПРОФИЛЬ <ArrowRight size={13} /></span>
          </button>
        ))}
      </section>
      {selected && <FounderDrawer founder={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}

function FounderDrawer({ founder, onClose }) {
  return (
    <div className="startup-overlay" role="dialog" aria-modal="true" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="startup-drawer founder-drawer">
        <div className="drawer-top"><span>ИНДЕКС ЛЮДЕЙ FORDEX</span><button type="button" onClick={onClose} aria-label="Закрыть профиль"><X size={18} /></button></div>
        <div className="drawer-media portrait"><img src={founder.image} alt="" /></div>
        <span className="drawer-sector">{ruRole(founder.role)}</span><h2>{founder.name}</h2><p>{founder.description}</p>
        <div className="drawer-stats"><div><span>КОМПАНИЯ</span><strong>{founder.company}</strong></div><div><span>ЛОКАЦИЯ</span><strong>{ruCity(founder.city)}</strong></div><div><span>ВОЗРАСТ</span><strong>{founder.age ? founder.age + ' лет' : '—'}</strong></div><div><span>СТАТУС</span><strong>{founder.verified ? 'ПРОВЕРЕНО' : 'ИССЛЕДОВАНИЕ'}</strong></div></div>
        <a className="drawer-source" href={founder.source} target="_blank" rel="noreferrer">ОТКРЫТЬ ИСТОЧНИК <ExternalLink size={14} /></a>
      </aside>
    </div>
  );
}

function Deals() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const types = ['ALL', ...new Set(dealRecords.map((deal) => deal.type))];
  const filtered = dealRecords.filter((deal) => {
    const haystack = [deal.company, deal.type, deal.sector, deal.lead].join(' ').toLowerCase();
    return haystack.includes(query.toLowerCase()) && (filter === 'ALL' || deal.type === filter);
  });
  const total = moneyM(filtered);

  return (
    <main className="inner-page">
      <PageHero eyebrow="КАПИТАЛ И СДЕЛКИ" title="DEALS" description="Реестр раундов финансирования и событий с капиталом в текущей исследовательской выборке FORDEX, связанных с первоисточниками." />
      <section className="deal-summary"><div><span>ВИДИМЫЕ ЗАПИСИ</span><strong>{filtered.length}</strong></div><div><span>ИЗВЕСТНЫЙ КАПИТАЛ</span><strong>₽{formatMoney(total)}M</strong></div><div><span>ПОСЛЕДНЯЯ ПРОВЕРКА</span><strong>{marketSummary.lastReview}</strong></div></section>
      <section className="toolbar"><label><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск компании, сделки, инвестора..." /></label><span className="result-count">{filtered.length} ЗАПИСЕЙ</span></section>
      <div className="filter-rail">{types.map((item) => <button type="button" key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div>
      <section className="deals-table">
        <div className="table-row table-head"><span>КОМПАНИЯ</span><span>ТИП</span><span>СУММА</span><span>ДАТА</span><span>ИНВЕСТОР / ПРИМЕЧАНИЕ</span><span>ИСТОЧНИК</span></div>
        {filtered.map((deal) => (
          <a className="table-row" key={deal.id} href={deal.source} target="_blank" rel="noreferrer">
            <strong>{deal.company}</strong><span>{ruText(deal.type)}</span><strong>{deal.value}</strong><span>{ruDate(deal.date)}</span><span>{deal.lead}</span><ExternalLink size={14} />
          </a>
        ))}
      </section>
      {!filtered.length && <div className="empty">ПО ТЕКУЩЕМУ ФИЛЬТРУ СДЕЛОК НЕТ.</div>}
    </main>
  );
}

function Rankings() {
  const [rankingMode, setRankingMode] = useState('startups');
  const [category, setCategory] = useState('ALL');
  const [view, setView] = useState('overall');
  const [sort, setSort] = useState('rank');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const rankingSeries = rankingCategories.filter((item) => item !== 'ALL').map((item) => {
    const rows = startupRankings.filter((startup) => startup.tags.includes(item));
    const leader = [...rows].sort((a, b) => b.score - a.score)[0];
    return { name: item, count: rows.length, leader };
  });
  const topThree = [...startupRankings].sort((a, b) => a.rank - b.rank).slice(0, 3);
  const averageScore = startupRankings.reduce((sum, item) => sum + item.score, 0) / startupRankings.length;
  const fastestMover = [...startupRankings].sort((a, b) => b.momentum - a.momentum)[0];
  const knownFunding = startupRankings.reduce((sum, item) => sum + (item.fundingM || 0), 0);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const rows = startupRankings.filter((item) => {
      const matchesCategory = category === 'ALL' || item.tags.includes(category);
      const haystack = [item.name, item.sector, item.stage, item.city, ...item.tags].join(' ').toLowerCase();
      return matchesCategory && (!normalized || haystack.includes(normalized));
    });
    return [...rows].sort((a, b) => {
      if (view === 'movers') return b.momentum - a.momentum;
      if (view === 'capital') return (b.fundingM ?? -1) - (a.fundingM ?? -1);
      if (sort === 'score') return b.score - a.score;
      if (sort === 'momentum') return b.momentum - a.momentum;
      if (sort === 'funding') return (b.fundingM ?? -1) - (a.fundingM ?? -1);
      return a.rank - b.rank;
    });
  }, [category, query, view, sort]);

  return (
    <main className="inner-page rankings-page">
      <PageHero eyebrow="ИНДЕКС FORDEX · 2026" title="RANKINGS" description="FORDEX отделяет собственные редакционные индексы от внешних таблиц источников. Опубликованные оценки, исследовательское покрытие и внешние рейтинги никогда не выдаются за один и тот же сигнал." action={<ButtonLink route="analytics" className="text-link">МЕТОДОЛОГИЯ <ArrowRight size={13} /></ButtonLink>} />
      <section className="ranking-mode-switch" aria-label="FORDEX ranking families">
        {rankingCollections.map((collection) => (
          <button type="button" key={collection.key} className={rankingMode === collection.key ? 'active' : ''} onClick={() => setRankingMode(collection.key)}>
            <span>{collection.number}</span>
            <strong>{collection.title}</strong>
            <small>{ruText(collection.status)} · {ruText(collection.scope)}</small>
          </button>
        ))}
      </section>
      {rankingMode === 'providers' ? <ProviderRanking /> : rankingMode === 'ai100' ? <RankingCollectionPanel collectionKey="ai100" /> : rankingMode === 'vibe100' ? <RankingCollectionPanel collectionKey="vibe100" /> : <>
      <section className="ranking-intro">
        <div><span>FORDEX ИНДЕКС СТАРТАПОВ · 2026</span><h2>ИНДЕКС<br />СТАРТАПОВ.</h2></div>
        <div><p>Один основной индекс для сравнения AI-стартапов по наблюдаемым сигналам бизнеса, капитала, динамики, технологии, рынка и команды. Оценка рассчитывается детерминированной моделью FORDEX.</p><small>ИССЛЕДОВАТЕЛЬСКАЯ БЕТА · МОДЕЛЬ {rankingModel.version.toUpperCase()} · {startupRankings.length} КОМПАНИЙ С ОЦЕНКОЙ · {marketSummary.trackedCompanies} ПРОФИЛЕЙ В ОТСЛЕЖИВАНИИ · ПОСЛЕДНЯЯ ПРОВЕРКА ОКТ 2026</small></div>
      </section>
      <section className="ranking-lead">
        <div className="ranking-lead-head"><span>ИНДЕКС В ОДНОМ ВЗГЛЯДЕ</span><small>ТЕКУЩИЙ СНИМОК ИССЛЕДОВАНИЙ</small></div>
        <div className="ranking-lead-stats">
          <div><span>С ОЦЕНКОЙ</span><strong>{startupRankings.length}</strong><small>компаний</small></div>
          <div><span>ЛУЧШАЯ ОЦЕНКА</span><strong>{topThree[0]?.score?.toFixed(1) || '—'}</strong><small>{topThree[0]?.name || '—'}</small></div>
          <div><span>СРЕДНИЙ БАЛЛ</span><strong>{averageScore.toFixed(1)}</strong><small>из 100</small></div>
          <div><span>САМЫЙ БЫСТРЫЙ РОСТ</span><strong>+{fastestMover?.momentum?.toFixed(1) || '—'}%</strong><small>{fastestMover?.name || '—'}</small></div>
          <div><span>ИЗВЕСТНОЕ ФИНАНСИРОВАНИЕ</span><strong>₽{formatMoney(knownFunding)}M</strong><small>только раскрытые данные</small></div>
        </div>
        <div className="ranking-top-three">
          {topThree.map((item) => (
            <button type="button" className={'ranking-top-card rank-' + item.rank} key={item.id} onClick={() => setSelected(item)}>
              <div><span>#{String(item.rank).padStart(2, '0')}</span><small>{ruSector(item.sector)}</small></div>
              <strong>{item.name}</strong>
              <div className="ranking-top-score"><b>{item.score.toFixed(1)}</b><em>{item.previousRank > item.rank ? '↑ ' + (item.previousRank - item.rank) : item.previousRank < item.rank ? '↓ ' + (item.rank - item.previousRank) : '—'}</em></div>
            </button>
          ))}
        </div>
      </section>
      <section className="ranking-series">
        <div className="ranking-series-head"><div><span>СЕРИИ РЕЙТИНГОВ</span><h2>ИНДЕКС<br />ПО РЫНКАМ</h2></div><p>Каждая серия использует базовую модель доказательств FORDEX и сужает выборку по тегам компаний. Отраслевая таблица — это представление индекса, а не отдельная система оценки отрасли.</p></div>
        <div className="ranking-series-grid">
          {rankingSeries.map((series) => (
            <button type="button" className="series-card" key={series.name} onClick={() => { setCategory(series.name); setView('overall'); }}>
              <span>{ruTag(series.name)}</span><strong>{String(series.count).padStart(2, '0')}</strong><small>{series.leader ? 'ЛИДЕР · ' + series.leader.name : 'НЕТ КОМПАНИЙ С ОЦЕНКОЙ'}</small><ArrowRight size={14} />
            </button>
          ))}
        </div>
      </section>
      <section className="ranking-controls">
        <label className="ranking-search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск компании, сектора, стадии..." aria-label="Поиск по рейтингу стартапов" /></label>
        <div className="ranking-result-bar">
          <span>{filtered.length} ИЗ {startupRankings.length} КОМПАНИЙ С ОЦЕНКОЙ</span>
          {(query || category !== 'ALL' || view !== 'overall' || sort !== 'rank') && (
            <button type="button" onClick={() => { setQuery(''); setCategory('ALL'); setView('overall'); setSort('rank'); }}>СБРОСИТЬ ВИД <X size={12} /></button>
          )}
        </div>
        <div className="ranking-view-tabs">
          <button type="button" className={view === 'overall' ? 'active' : ''} onClick={() => setView('overall')}>ОБЩИЙ РЕЙТИНГ</button>
          <button type="button" className={view === 'movers' ? 'active' : ''} onClick={() => setView('movers')}>ЛИДЕРЫ РОСТА</button>
          <button type="button" className={view === 'capital' ? 'active' : ''} onClick={() => setView('capital')}>ЛИДЕРЫ ПО КАПИТАЛУ</button>
        </div>
        <div className="ranking-filter-set">
          <div className="ranking-tabs">{rankingCategories.map((item) => <button type="button" key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{ruTag(item)}</button>)}</div>
          <label>СОРТИРОВАТЬ <select value={sort} onChange={(e) => setSort(e.target.value)}><option value="rank">РЕЙТИНГ FORDEX</option><option value="score">ОЦЕНКА</option><option value="momentum">ДИНАМИКА</option><option value="funding">ИЗВЕСТНОЕ ФИНАНСИРОВАНИЕ</option></select></label>
        </div>
      </section>
      <section className="startup-table" aria-label="Рейтинг стартапов FORDEX">
        <div className="startup-row startup-head"><span>#</span><span>КОМПАНИЯ</span><span>СЕКТОР</span><span>СТАДИЯ</span><span>ФИНАНСИРОВАНИЕ</span><span>ДИНАМИКА</span><span>ОЦЕНКА</span></div>
        {filtered.map((item) => (
          <button type="button" className="startup-row startup-item" key={item.id} onClick={() => setSelected(item)}>
            <span className="rank-cell"><strong>{String(item.rank).padStart(2, '0')}</strong><small className={item.previousRank > item.rank ? 'rank-up' : item.previousRank < item.rank ? 'rank-down' : 'rank-flat'}>{item.previousRank > item.rank ? '↑ ' + (item.previousRank - item.rank) : item.previousRank < item.rank ? '↓ ' + (item.rank - item.previousRank) : '—'}</small></span>
            <span className="startup-name"><strong>{item.name}</strong><small>{ruCity(item.city)} · {item.verified ? 'ПРОВЕРЕНО' : 'ИССЛЕДОВАНИЕ'}</small></span>
            <span>{ruSector(item.sector)}</span><span>{ruStage(item.stage)}</span><span>{item.funding}</span><strong className="positive">+{item.momentum}%</strong><strong className="score">{item.score}</strong>
          </button>
        ))}
        {!filtered.length && <div className="ranking-empty"><strong>СОВПАДЕНИЙ НЕТ.</strong><span>Попробуйте изменить поиск или сбросить фильтр категории.</span></div>}
      </section>
      <section className="ranking-context">
        <div><span>ТЕКУЩИЙ ВИД</span><strong>{view === 'overall' ? 'ОБЩИЙ РЕЙТИНГ' : view === 'movers' ? 'ЛИДЕРЫ РОСТА' : 'ЛИДЕРЫ ПО КАПИТАЛУ'}</strong></div>
        <p>{view === 'overall' ? 'Сортировка по вычисляемой оценке FORDEX.' : view === 'movers' ? 'Сортировка по редакционному сигналу динамики; это не темп роста выручки.' : 'Сортировка по раскрытым объёмам финансирования; нераскрытое финансирование остаётся внизу.'}</p>
      </section>
      <section className="ranking-method">
        <div><span>КАК FORDEX СЧИТАЕТ</span><h2>ОДНА ОЦЕНКА.<br />ШЕСТЬ СИГНАЛОВ.</h2><p>Предварительная модель v0.1 преобразует шесть наблюдаемых сигналов в единую исследовательскую оценку от 0 до 100. Одного финансирования недостаточно, чтобы возглавить индекс.</p></div>
        <div className="score-list">{scoreWeights.map((weight) => <div key={ruScoreLabel(weight.label)}><span>{ruScoreLabel(weight.label)}</span><strong>{weight.value}%</strong><i><b style={{ width: weight.value + '%' }} /></i></div>)}</div>
      </section>
      {selected && <StartupDrawer startup={selected} onClose={() => setSelected(null)} />}
      </>}
    </main>
  );
}

function RankingCollectionPanel({ collectionKey }) {
  const collection = rankingCollections.find((item) => item.key === collectionKey);
  const corporateCount = marketCompanies.filter((item) => item.kind === 'CORPORATE').length;
  const scoredCount = startupRankings.length;

  if (!collection) return null;

  const isAI100 = collection.key === 'ai100';
  const topRows = isAI100 ? startupRankings.slice(0, 10) : [];

  return (
    <section className="ranking-collection-panel">
      <div className="ranking-collection-overview">
        <div className="ranking-collection-copy">
          <span>{collection.label} · {ruText(collection.status)}</span>
          <h2>{collection.title === 'VIBE 100' ? <>НОВАЯ<br />ЭКОНОМИКА РАЗРАБОТКИ.</> : <>РАСШИРЕННЫЙ<br />ИНДЕКС AI-БИЗНЕСА.</>}</h2>
          <p>{collection.description}</p>
        </div>
        <div className="ranking-collection-meta">
          <div><span>СТАТУС</span><strong>{ruText(collection.status)}</strong><small>{ruText(collection.scope)}</small></div>
          <div><span>ЦЕЛЬ</span><strong>{collection.target ?? '—'}</strong><small>{collection.target ? 'компаний' : 'по методологии источника'}</small></div>
          <div><span>С ОЦЕНКОЙ СЕЙЧАС</span><strong>{isAI100 ? scoredCount : '0'}</strong><small>{isAI100 ? 'записей о стартапах' : 'не опубликовано'}</small></div>
          <div><span>ПРИМЕЧАНИЕ ПО ПОКРЫТИЮ</span><strong>{isAI100 ? corporateCount + ' корпоративных' : 'ИССЛЕДОВАНИЕ'}</strong><small>{isAI100 ? 'отслеживаются отдельно' : 'сначала проверка данных'}</small></div>
        </div>
      </div>

      {isAI100 ? (
        <>
          <div className="ranking-collection-banner">
            <div><span>СТАТУС ПУБЛИКАЦИИ</span><strong>{scoredCount} С ОЦЕНКОЙ / {collection.target} ЦЕЛЬ</strong></div>
            <p>{collection.note}</p>
          </div>
          <section className="startup-table collection-table" aria-label="Текущее покрытие AI 100 с оценкой">
            <div className="startup-row startup-head"><span>#</span><span>КОМПАНИЯ</span><span>СЕКТОР</span><span>СТАДИЯ</span><span>ФИНАНСИРОВАНИЕ</span><span>ДИНАМИКА</span><span>ОЦЕНКА</span></div>
            {topRows.map((item) => (
              <button type="button" className="startup-row startup-item" key={item.id} onClick={() => goto('rankings')}>
                <span className="rank-cell"><strong>{String(item.rank).padStart(2, '0')}</strong><small className="rank-flat">ЯДРО</small></span>
                <span className="startup-name"><strong>{item.name}</strong><small>{ruCity(item.city)} · {item.verified ? 'ПРОВЕРЕНО' : 'ИССЛЕДОВАНИЕ'}</small></span>
                <span>{ruSector(item.sector)}</span><span>{ruStage(item.stage)}</span><span>{item.funding}</span><strong className="positive">+{item.momentum}%</strong><strong className="score">{item.score}</strong>
              </button>
            ))}
          </section>
          <section className="ranking-collection-grid">
            <article>
              <span>ПРАВИЛО ОЦЕНКИ</span>
              <strong>ОЦЕНКА СТАРТАПА<br />ИСПОЛЬЗУЕТСЯ ЗДЕСЬ.</strong>
              <p>Пока для более широкого AI-рынка нет сопоставимых данных по компаниям, FORDEX сохраняет оценку стартапов и не придумывает оценки для корпораций.</p>
            </article>
            <article>
              <span>КОРПОРАТИВНЫЙ СЛОЙ</span>
              <strong>{corporateCount}<br />В ОТСЛЕЖИВАНИИ.</strong>
              <p>Корпоративные AI-игроки находятся в разделе «Рынок» и не входят в рейтинг стартапов, пока методология AI 100 не определит сопоставимую модель доказательств.</p>
              <ButtonLink route="market" className="text-link">СМОТРЕТЬ ПОКРЫТИЕ РЫНКА <ArrowRight size={13} /></ButtonLink>
            </article>
          </section>
        </>
      ) : (
        <>
          <div className="ranking-collection-banner research">
            <div><span>УСЛОВИЕ ПУБЛИКАЦИИ</span><strong>ПОКА НЕ РАНЖИРУЕТСЯ</strong></div>
            <p>{collection.note}</p>
          </div>
          <section className="ranking-research-state">
            <div className="research-state-number">00</div>
            <div>
              <span>ИССЛЕДОВАТЕЛЬСКАЯ ОЧЕРЕДЬ VIBE 100</span>
              <h3>ОПУБЛИКОВАННЫХ ОЦЕНОК ПОКА НЕТ.</h3>
              <p>Мы не превращаем курсы, агентства или обычные AI-инструменты в рейтинг только потому, что они используют термин «vibe coding». Кандидату нужны запись о компании или продукте, публичный источник и понятное правило включения.</p>
              {collection.source && <a href={collection.source} target="_blank" rel="noreferrer">ИССЛЕДОВАТЕЛЬСКАЯ БАЗА · {collection.sourceName} <ExternalLink size={13} /></a>}
            </div>
          </section>
        </>
      )}
    </section>
  );
}

function ProviderRanking() {
  const [sort, setSort] = useState('revenue');
  const rows = useMemo(() => [...aiProviderRankings].sort((a, b) => sort === 'growth'
    ? (b.growth ?? -999) - (a.growth ?? -999)
    : b.revenueM - a.revenueM), [sort]);
  const topGrowth = [...aiProviderRankings].filter((item) => item.growth != null).sort((a, b) => b.growth - a.growth)[0];
  const totalRevenue = aiProviderRankings.reduce((sum, item) => sum + item.revenueM, 0);

  return (
    <section className="provider-ranking">
      <div className="provider-meta"><div><span>РЕЙТИНГ ИСТОЧНИКА</span><strong>{aiProviderSource.name}</strong><small>{aiProviderSource.title}</small></div><div><span>ВИДИМЫЕ</span><strong>{aiProviderRankings.length}</strong><small>компаний из таблицы источника</small></div><div><span>ВИДИМАЯ ВЫРУЧКА</span><strong>₽{formatMoney(totalRevenue)}M</strong><small>сумма показанных строк</small></div><div><span>МАКСИМАЛЬНЫЙ ЗАЯВЛЕННЫЙ РОСТ</span><strong>{topGrowth ? '+' + topGrowth.growth + '%' : '—'}</strong><small>{topGrowth ? topGrowth.name : '—'}</small></div></div>
      <div className="provider-toolbar"><p>{aiProviderSource.note}</p><div><button type="button" className={sort === 'revenue' ? 'active' : ''} onClick={() => setSort('revenue')}>ВЫРУЧКА</button><button type="button" className={sort === 'growth' ? 'active' : ''} onClick={() => setSort('growth')}>РОСТ</button></div></div>
      <div className="provider-table">
        <div className="provider-row provider-head"><span>#</span><span>КОМПАНИЯ</span><span>ВЫРУЧКА AI · 2025</span><span>РОСТ</span><span>СПЕЦИАЛИЗАЦИЯ</span><span>ГОРОД</span></div>
        {rows.map((item, index) => <div className="provider-row" key={item.name}><strong>{String(item.rank ?? index + 1).padStart(2, '0')}</strong><strong>{item.name}</strong><strong>₽{formatMoney(item.revenueM)}M</strong><span className={item.growth != null && item.growth < 0 ? 'negative' : 'positive'}>{item.growth == null ? '—' : (item.growth >= 0 ? '+' : '') + item.growth + '%'}</span><span>{ruText(item.focus)}</span><span>{ruCity(item.city)}</span></div>)}
      </div>
      <div className="provider-source"><span>ИСТОЧНИК · CNEWS ANALYTICS · 2026</span><a href={aiProviderSource.source} target="_blank" rel="noreferrer">ОТКРЫТЬ ПОЛНУЮ ТАБЛИЦУ <ExternalLink size={13} /></a></div>
    </section>
  );
}

function StartupDrawer({ startup, onClose }) {
  const delta = startup.previousRank ? startup.previousRank - startup.rank : 0;
  const deltaText = delta > 0 ? 'ВВЕРХ ' + delta : delta < 0 ? 'ВНИЗ ' + Math.abs(delta) : 'БЕЗ ИЗМЕНЕНИЙ';
  const company = marketCompanies.find((item) => item.id === startup.id);

  return (
    <div className="startup-overlay" role="dialog" aria-modal="true" aria-label={startup.name + ' профиль в рейтинге'} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="startup-drawer">
        <div className="drawer-top"><span>ИНДЕКС FORDEX · #{String(startup.rank).padStart(2, '0')}</span><button type="button" onClick={onClose} aria-label="Закрыть профиль"><X size={18} /></button></div>
        {company && <div className="drawer-media"><img src={company.image} alt="" /></div>}

        <div className="drawer-score">
          <div>
            <small>FORDEX ЯДРО</small>
            <strong>{startup.score}</strong>
            <span>+{startup.momentum}% ДИНАМИКА</span>
          </div>
          <div className="drawer-score-rank">
            <span>ТЕКУЩАЯ ПОЗИЦИЯ</span>
            <strong>#{String(startup.rank).padStart(2, '0')}</strong>
            <em>{deltaText}</em>
          </div>
        </div>

        <span className="drawer-sector">{ruSector(startup.sector)}</span>
        <h2>{startup.name}</h2>
        <p>{startup.description}</p>

        <div className="drawer-tags">
          {startup.tags.map((tag) => <span key={tag}>{ruTag(tag)}</span>)}
        </div>

        <section className="drawer-block">
          <div className="drawer-block-head"><span>БИЗНЕС-СИГНАЛ</span><small>НАБЛЮДАЕМЫЕ ФАКТЫ</small></div>
          <p className="drawer-traction">{startup.traction || 'Дополнительные данные о бизнес-динамике пока не опубликованы.'}</p>
        </section>

        <div className="drawer-stats">
          <div><span>СТАДИЯ</span><strong>{ruStage(startup.stage)}</strong></div>
          <div><span>ФИНАНСИРОВАНИЕ</span><strong>{startup.funding}</strong></div>
          <div><span>ПОСЛЕДНИЙ РАУНД</span><strong>{startup.latestRound || '—'}</strong></div>
          <div><span>ЛОКАЦИЯ</span><strong>{ruCity(startup.city)}</strong></div>
        </div>

        <section className="drawer-block drawer-model">
          <div className="drawer-block-head"><span>МОДЕЛЬ ИНДЕКСА</span><small>ВЗВЕШЕННЫЕ СИГНАЛЫ</small></div>
          <div className="drawer-weight-list">
            {scoreWeights.map((weight, index) => {
              const signal = startup.scoreBreakdown?.[index];
              return (
                <div key={ruScoreLabel(weight.label)}>
                  <span>{ruScoreLabel(weight.label)}</span>
                  <strong>{signal?.score ?? '—'} / 100 · {weight.value}%</strong>
                  <i><b style={{ width: (signal?.score ?? 0) + '%' }} /></i>
                </div>
              );
            })}
          </div>
          <p className="drawer-model-note">Вычисляемая оценка строится из шести нормализованных сигналов. Финансирование — только один из факторов, а не сам рейтинг. Модель v0.1 является предварительной.</p>
        </section>

        <div className="drawer-signal">
          <span>ДВИЖЕНИЕ В РЕЙТИНГЕ</span>
          <p><strong>{deltaText}</strong> · текущее место #{startup.rank}, предыдущее #{startup.previousRank || '—'}. Последняя проверка: {startup.lastVerified}.</p>
        </div>

        <div className="drawer-evidence">
          <div><span>СТАТУС ДАННЫХ</span><strong><CheckCircle2 size={13} /> СВЯЗАНО С ИСТОЧНИКОМ</strong></div>
          <small>Доказательства прикреплены к записи; нераскрытое финансирование остаётся нераскрытым.</small>
        </div>

        {startup.website && <a className="drawer-source" href={startup.website} target="_blank" rel="noreferrer">ОТКРЫТЬ КОМПАНИЮ <ExternalLink size={14} /></a>}
        <a className="drawer-source" href={startup.source} target="_blank" rel="noreferrer">СМОТРЕТЬ ДОКАЗАТЕЛЬСТВА <ExternalLink size={14} /></a>
      </aside>
    </div>
  );
}

function News() {
  return (
    <main className="inner-page">
      <PageHero eyebrow="РЕДАКЦИЯ FORDEX" title="СТАТЬИ" description="Редакционные материалы FORDEX о российских AI-компаниях, командах, технологиях и рыночных сигналах. Материал читается внутри FORDEX; первоисточник всегда указан отдельно." action={<ButtonLink route="market" className="text-link">ВЕРНУТЬСЯ НА КАРТУ РЫНКА <ArrowRight size={13} /></ButtonLink>} />
      <section className="news-list">
        {editorialArticles.map((story, index) => (
          <article key={story.id}>
            <div className="news-index">{String(index + 1).padStart(2, '0')}</div>
            <div><span>{ruDate(story.date)} · {story.category}</span><h2>{story.title}</h2><small>{story.readTime} · {story.sourceName}</small></div>
            <button type="button" className="news-read" onClick={() => goto('article-' + story.id)}>ЧИТАТЬ В FORDEX <ArrowRight size={14} /></button>
          </article>
        ))}
      </section>
    </main>
  );
}

function ArticlePage({ articleId }) {
  const article = getEditorialArticle(articleId);
  if (!article) return <NotFound route={'article-' + articleId} />;

  const index = editorialArticles.findIndex((item) => item.id === article.id);
  const related = editorialArticles.filter((item) => item.id !== article.id).slice(0, 3);

  return (
    <main className="inner-page article-page">
      <section className="article-hero">
        <div className="article-hero-top"><span>{article.category} · {ruDate(article.date)} · {article.readTime}</span><ButtonLink route="news" className="article-back"><ArrowLeft size={13} /> ВСЕ СТАТЬИ</ButtonLink></div>
        <div className="article-hero-grid">
          <span className="article-number">{String(index + 1).padStart(2, '0')}</span>
          <div><h1>{article.title}</h1><p>{article.dek}</p></div>
        </div>
      </section>

      <section className="article-body">
        <article className="article-main">
          <p className="article-lead">{article.lead}</p>
          {article.sections.map((section) => (
            <section className="article-section" key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
          <div className="article-source">
            <span>ПЕРВОИСТОЧНИК</span>
            <strong>{article.sourceName}</strong>
            <p>Фактическая основа материала проверена по публичной публикации. Редакционные выводы и формулировки выше принадлежат FORDEX.</p>
            <a href={article.source} target="_blank" rel="noreferrer">ОТКРЫТЬ ПЕРВОИСТОЧНИК <ExternalLink size={13} /></a>
          </div>
        </article>

        <aside className="article-aside">
          <div><span>FORDEX</span><strong>РЕДАКЦИОННЫЙ<br />СЛОЙ</strong><p>Материалы находятся внутри индекса. Внешние сайты используются только как источники доказательств.</p></div>
          <div><span>ДРУГИЕ МАТЕРИАЛЫ</span>{related.map((item) => <button type="button" key={item.id} onClick={() => goto('article-' + item.id)}><small>{ruDate(item.date)}</small><strong>{item.title}</strong><ArrowRight size={13} /></button>)}</div>
        </aside>
      </section>
    </main>
  );
}

function ResearchArticlePage({ researchId }) {
  const entry = researchUniverse.find((item) => item.id === researchId);
  if (!entry) return <NotFound route={researchId} />;

  const profile = marketCompanies.find((item) => item.name === entry.name);
  const isEmerging = entry.priority === 'EMERGING';
  const founder = profile?.founder || entry.founder;
  const founderAge = profile?.founderAge ?? entry.founderAge;
  const description = profile?.description || `FORDEX отслеживает ${entry.name} как часть ${isEmerging ? 'исследовательского слоя молодых и растущих AI-команд' : 'расширенного покрытия российского AI-рынка'}.`;

  return (
    <main className="inner-page article-page">
      <section className="article-hero research-article-hero">
        <div className="article-hero-top"><span>{isEmerging ? 'МОЛОДАЯ КОМАНДА' : 'ИССЛЕДОВАТЕЛЬСКОЕ ДОСЬЕ'} · {ruSector(entry.sector)}</span><ButtonLink route="market" className="article-back"><ArrowLeft size={13} /> КАРТА РЫНКА</ButtonLink></div>
        <div className="article-hero-grid">
          <span className="article-number">RE</span>
          <div><h1>{entry.name}</h1><p>{description}</p></div>
        </div>
      </section>

      <section className="article-body">
        <article className="article-main">
          <p className="article-lead">FORDEX пока не присваивает этой записи автоматический рейтинг только ради заполнения списка. Сначала фиксируется исследовательское досье, затем — при наличии сопоставимых фактов — компания может перейти в опубликованный индекс.</p>

          <section className="article-section">
            <h2>Что уже известно</h2>
            <p>{description}</p>
            {profile?.evidence && <p>{profile.evidence}</p>}
            {founder && <p>Основатель: <strong>{founder}</strong>{founderAge ? ` · публично указан возраст ${founderAge} лет` : ''}.</p>}
          </section>

          <section className="article-section">
            <h2>Почему компания на радаре</h2>
            <p>{isEmerging ? 'Молодые продукты и небольшие команды находятся в отдельном приоритете FORDEX. Размер компании не повышает оценку сам по себе, но помогает понять стадию и контекст развития.' : 'Компания включена в расширенное покрытие FORDEX, потому что упоминается в публичных исследовательских источниках по российскому AI-рынку. Наличие в покрытии не означает включение в опубликованный рейтинг.'}</p>
          </section>

          <div className="article-source">
            <span>ИСТОЧНИК ДАННЫХ</span>
            <strong>{entry.sourceName}</strong>
            <p>Публичный источник, на котором основана текущая запись. FORDEX хранит ссылку внутри досье, поэтому пользователь не покидает сайт ради просмотра карточки.</p>
            <a href={entry.source} target="_blank" rel="noreferrer">ОТКРЫТЬ ПЕРВОИСТОЧНИК <ExternalLink size={13} /></a>
          </div>
        </article>

        <aside className="article-aside research-aside">
          <div><span>ПРОФИЛЬ FORDEX</span><strong>{ruSector(entry.sector)}</strong><p>Статус: {isEmerging ? 'исследование · молодая команда' : 'исследование · расширенное покрытие'}.</p></div>
          <div className="research-facts">
            <span>ФАКТЫ</span>
            <div><small>СТАДИЯ</small><strong>{profile?.stage ? ruStage(profile.stage) : '—'}</strong></div>
            <div><small>ГОРОД</small><strong>{profile?.city ? ruCity(profile.city) : '—'}</strong></div>
            <div><small>МАСШТАБ</small><strong>{profile?.sizeBand ? ruSizeBand(profile.sizeBand) : '—'}</strong></div>
            <div><small>ОСНОВАТЕЛЬ</small><strong>{founder || '—'}</strong></div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function Analytics() {
  const sectors = [...new Set(startupRankings.flatMap((item) => item.tags))]
    .map((tag) => ({ tag, count: startupRankings.filter((item) => item.tags.includes(tag)).length }))
    .sort((a, b) => b.count - a.count);
  const averageScore = startupRankings.reduce((sum, item) => sum + item.score, 0) / startupRankings.length;
  const avgMomentum = startupRankings.reduce((sum, item) => sum + item.momentum, 0) / startupRankings.length;
  const knownFunding = startupRankings.reduce((sum, item) => sum + (item.fundingM || 0), 0);

  return (
    <main className="inner-page">
      <PageHero eyebrow="РЫНОЧНАЯ АНАЛИТИКА" title="ANALYTICS" description="Производные показатели текущего исследовательского набора FORDEX. Количество записей относится к индексу и не описывает весь российский рынок." />
      <section className="metric-grid analytics-metrics">
        <Metric label="КОМПАНИЙ В ИНДЕКСЕ" value={startupRankings.length} note="выборка рейтинга стартапов" icon={<Building2 />} />
        <Metric label="AVERAGE ЯДРО" value={averageScore.toFixed(1)} note="из 100" icon={<Activity />} />
        <Metric label="СРЕДНЯЯ ДИНАМИКА" value={'+' + avgMomentum.toFixed(1) + '%'} note="редакционный сигнал" icon={<TrendingUp />} />
        <Metric label="ИЗВЕСТНОЕ ФИНАНСИРОВАНИЕ" value={'₽' + formatMoney(knownFunding) + 'M'} note="видимо в записях индекса" icon={<WalletCards />} />
      </section>
      <section className="analytics-panel">
        <div className="panel-head"><div><span>СОСТАВ ИНДЕКСА</span><h2>ГДЕ НАХОДЯТСЯ 20 КОМПАНИЙ</h2></div><BarChart3 size={22} /></div>
        <div className="analytics-bars">
          {sectors.slice(0, 7).map((item) => <div className="analytics-bar-row" key={item.tag}><span>{ruTag(item.tag)}</span><div><i style={{ width: Math.max(8, item.count / startupRankings.length * 100) + '%' }} /></div><strong>{item.count}</strong></div>)}
        </div>
      </section>
      <section className="methodology">
        <div><span>РЕДАКЦИОННАЯ МЕТОДОЛОГИЯ</span><h2>СДЕЛАТЬ СИГНАЛ<br />ПРОВЕРЯЕМЫМ.</h2><p>FORDEX ранжирует компании по шести взвешенным сигналам. Оценка является результатом редакционного исследования; это не оценка стоимости, инвестиционная рекомендация или заявление о лидерстве на рынке.</p></div>
        <div className="method-cards">{scoreWeights.map((weight, index) => <article key={ruScoreLabel(weight.label)}><small>0{index + 1}</small><strong>{weight.value}%</strong><span>{ruScoreLabel(weight.label)}</span></article>)}</div>
      </section>
      <section className="source-board">
        <div><span>ДИСЦИПЛИНА ДАННЫХ</span><h2>СНАЧАЛА ФАКТЫ.</h2></div>
        <div><p>Известное финансирование указывается в рублях, когда опубликована сумма. «НЕ РАСКРЫТО» остаётся видимым вместо приблизительной оценки. Для каждой компании индекса указан источник и месяц проверки.</p><ButtonLink route="companies" className="text-link">СМОТРЕТЬ ИСТОЧНИКИ <ArrowRight size={13} /></ButtonLink></div>
      </section>
    </main>
  );
}

function Sources() {
  return (
    <main className="inner-page sources-page">
      <PageHero eyebrow="ДАННЫЕ И ПРОИСХОЖДЕНИЕ" title="ИСТОЧНИКИ" description="Публичные исследовательские потоки, лежащие в основе FORDEX. Внешние рейтинги остаются внешними, а первичные доказательства прикреплены к записям компаний." />
      <section className="source-principles">
        <div><span>СТАНДАРТ ДАННЫХ</span><h2>ДОКАЗАТЕЛЬСТВА<br />ВАЖНЕЕ<br />МНЕНИЙ.</h2></div>
        <div><p>FORDEX — редакционный исследовательский продукт. Интерфейс может сравнивать и ранжировать, но каждое фактическое поле должно быть связано с публичным источником и месяцем проверки.</p><div className="source-rule-grid">{sourceRules.map((rule, index) => <div key={rule}><small>0{index + 1}</small><span>{rule}</span></div>)}</div></div>
      </section>
      <section className="source-cards">
        <div className="section-head"><div><span>РЕЕСТР ИСТОЧНИКОВ</span><h2>ОТКУДА БЕРУТСЯ ДАННЫЕ</h2></div></div>
        <div className="source-grid">{sourceRegistry.map((source) => <article className="source-card" key={source.id}><div><span>{ruText(source.type)}</span><strong>{source.name}</strong><small>{ruDate(source.date)} · {source.title}</small></div><p>{source.use}</p><em>{source.note}</em><a href={source.url} target="_blank" rel="noreferrer">ОТКРЫТЬ ИСТОЧНИК <ExternalLink size={13} /></a></article>)}</div>
      </section>
      <section className="source-disclaimer"><span>IMPORTANT</span><p>Оценки FORDEX — результат редакционного исследования. Это не инвестиционная рекомендация, рыночная капитализация, оценка стоимости, финансовый прогноз или заявление о доле рынка. Внешние рейтинги маркируются отдельно.</p></section>
    </main>
  );
}

function Watchlist({ names, toggleWatch }) {
  const items = marketCompanies.filter((company) => isWatched(company, names));
  return (
    <main className="inner-page">
      <PageHero eyebrow="ЛИЧНЫЙ ИНДЕКС" title="WATCHLIST" description="Сохранённые компании остаются в браузере и работают без аккаунта. Список можно очищать или пополнять с любой карточки компании." />
      <section className="company-grid watch-grid">
        {items.length ? items.map((company) => (
          <article key={company.id}>
            <div className="card-image"><img src={company.image} alt="" loading="lazy" /><button type="button" className="watch active" onClick={() => toggleWatch(company)}><Heart size={16} fill="currentColor" /></button></div>
            <div className="card-meta"><span>{ruSector(company.sector)}</span><h3>{company.name}</h3><small>{company.stage}</small></div>
          </article>
        )) : <div className="empty"><Heart size={18} /> СПИСОК ОТСЛЕЖИВАНИЯ ПУСТ.</div>}
      </section>
    </main>
  );
}

function formatMoney(value) {
  return Number(value).toLocaleString('ru-RU', { maximumFractionDigits: 1 });
}

function NotFound({ route }) {
  return <main className="not-found"><span>404</span><h1>НЕ НАЙДЕНО</h1><p>Раздела FORDEX с названием «{route}» не существует.</p><ButtonLink route="home" className="primary"><ArrowLeft size={14} /> ВЕРНУТЬСЯ НА ГЛАВНУЮ</ButtonLink></main>;
}

function Footer() {
  return (
    <footer>
      <div><div className="logo">FORDEX</div><p>ИНДЕКС AI-БИЗНЕСА · РОССИЯ</p></div>
      <div className="footer-links"><button type="button" onClick={() => goto('companies')}>КОМПАНИИ</button><button type="button" onClick={() => goto('founders')}>ОСНОВАТЕЛИ</button><button type="button" onClick={() => goto('deals')}>СДЕЛКИ</button><button type="button" onClick={() => goto('analytics')}>МЕТОДОЛОГИЯ</button><button type="button" onClick={() => goto('sources')}>ИСТОЧНИКИ</button></div>
      <span>© 2026 FORDEX · ИССЛЕДОВАТЕЛЬСКАЯ БЕТА</span>
    </footer>
  );
}

function SearchOverlay({ onClose }) {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!normalized) return [];
    const companyResults = marketCompanies.filter((item) => [item.name, item.sector, item.stage].join(' ').toLowerCase().includes(normalized)).slice(0, 6).map((item) => ({ label: item.name, meta: ruSector(item.sector), route: 'companies' }));
    const founderResults = founderProfiles.filter((item) => [item.name, item.company, item.role].join(' ').toLowerCase().includes(normalized)).slice(0, 4).map((item) => ({ label: item.name, meta: 'ОСНОВАТЕЛЬ · ' + item.company, route: 'founders' }));
    const dealResults = dealRecords.filter((item) => [item.company, item.type, item.sector, item.lead].join(' ').toLowerCase().includes(normalized)).slice(0, 4).map((item) => ({ label: item.company + ' · ' + ruText(item.type), meta: item.value + ' · ' + ruDate(item.date), route: 'deals' }));
    const newsResults = newsFeed.filter((item) => [item.title, item.category, item.sourceName].join(' ').toLowerCase().includes(normalized)).slice(0, 3).map((item) => ({ label: item.title, meta: 'НОВОСТИ · ' + ruDate(item.date), route: 'news' }));
    const coverageResults = researchUniverse.filter((item) => [item.name, item.sector, item.sourceName].join(' ').toLowerCase().includes(normalized)).slice(0, 4).map((item) => ({ label: item.name, meta: 'ДОСЬЕ · ' + ruSector(item.sector), route: item.id }));
    return [...companyResults, ...founderResults, ...dealResults, ...newsResults, ...coverageResults].slice(0, 12);
  }, [normalized]);

  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Поиск FORDEX" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="search-box">
        <div className="search-top"><span>ПОИСК FORDEX</span><button type="button" onClick={onClose} aria-label="Закрыть поиск"><X size={19} /></button></div>
        <label className="search-input"><Search size={20} /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Компания, основатель, сделка, новость..." /></label>
        <div className="search-results">
          {query ? (results.length ? results.map((item) => <button key={item.label + item.meta} type="button" onClick={() => { onClose(); goto(item.route); }}><span>{item.meta}</span><strong>{item.label}</strong><ArrowRight size={14} /></button>) : <p>В ИНДЕКСЕ FORDEX НИЧЕГО НЕ НАЙДЕНО.</p>) : <p>НАЧНИТЕ ВВОДИТЬ ЗАПРОС ПО ИНДЕКСУ.</p>}
        </div>
        <div className="search-hint">НАЖМИТЕ <kbd>ESC</kbd>, ЧТОБЫ ЗАКРЫТЬ · НАЖМИТЕ <kbd>/</kbd>, ЧТОБЫ ИСКАТЬ</div>
      </div>
    </div>
  );
}

