import { useEffect, useMemo, useState } from 'react';
import { rankingCategories, scoreWeights, startupRankings } from './data/startups';
import { dealRecords, founderProfiles, marketCompanies, marketSummary, newsFeed } from './data/market';
import { coverageLabels, researchUniverse } from './data/coverage';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  ChevronRight,
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
const HERO_IMAGE = 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1600&q=88';
const EDITORIAL_IMAGE = 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1600&q=88';

const categoryLinks = [
  { title: 'COMPANIES', text: 'Structured company profiles across the Russian AI economy.', href: 'companies', image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=720&q=86' },
  { title: 'FOUNDERS', text: 'The people building the teams, products and markets.', href: 'founders', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=720&q=86' },
  { title: 'DEALS', text: 'Funding rounds and capital movements with evidence attached.', href: 'deals', image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=720&q=86' },
];

const sectorFilters = ['ALL', 'AI / AGENTS', 'DEEPTECH', 'MEDTECH', 'NEUROTECH', 'INDUSTRIAL', 'CONSUMER'];

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

  const knownRoutes = ['home', 'companies', 'founders', 'deals', 'rankings', 'market', 'news', 'analytics', 'watchlist'];

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
      {route === 'news' && <News />}
      {route === 'analytics' && <Analytics />}
      {route === 'watchlist' && <Watchlist names={watchlist} toggleWatch={toggleWatch} />}
      {!knownRoutes.includes(route) && <NotFound route={route} />}
      <Footer />
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </div>
  );
}

function TopBar() {
  return (
    <div className="announcement">
      <span>THE AI BUSINESS INDEX OF RUSSIA</span><strong>RESEARCH BETA · 2026</strong>
      <div className="announcement-links">
        <button type="button" onClick={() => goto('analytics')}>METHODOLOGY</button><span>|</span>
        <button type="button" onClick={() => goto('news')}>LATEST</button><span>|</span>
        <button type="button" onClick={() => goto('home')}>HOME</button>
      </div>
    </div>
  );
}

function Header({ route, watchCount, onSearch }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const watchLabel = watchCount ? 'WATCHLIST (' + watchCount + ')' : 'WATCHLIST';
  const navigate = (target) => {
    setMobileOpen(false);
    goto(target);
  };

  return (
    <>
      <header className="header">
        <button className="mobile-menu" type="button" aria-label="Open navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)}>
          {mobileOpen ? <X size={17} /> : <Menu size={17} />}
        </button>
        <nav className="nav-left" aria-label="Primary">
          {NAV.map((item) => (
            <button type="button" key={item} className={route === item.toLowerCase() ? 'active' : ''} onClick={() => goto(item.toLowerCase())}>{item}</button>
          ))}
        </nav>
        <button className="logo" type="button" onClick={() => goto('home')} aria-label="FORDEX home">FORDEX</button>
        <div className="nav-right">
          <button type="button" onClick={onSearch}><Search size={15} /><span>SEARCH</span></button>
          <button type="button" onClick={() => goto('analytics')}><LineChart size={15} /><span>ANALYTICS</span></button>
          <button type="button" onClick={() => goto('watchlist')}><Heart size={15} /><span>{watchLabel}</span></button>
          <button type="button" onClick={() => goto('rankings')}><BarChart3 size={15} /><span>INDEX</span></button>
        </div>
      </header>
      <div className={mobileOpen ? 'mobile-drawer open' : 'mobile-drawer'} aria-hidden={!mobileOpen}>
        <div className="mobile-drawer-links">
          {NAV.map((item) => <button type="button" key={item} onClick={() => navigate(item.toLowerCase())}>{item}</button>)}
          <button type="button" onClick={() => navigate('news')}>NEWS</button>
          <button type="button" onClick={() => navigate('analytics')}>ANALYTICS</button>
          <button type="button" onClick={() => navigate('watchlist')}>WATCHLIST{watchCount ? ' (' + watchCount + ')' : ''}</button>
        </div>
        <div className="mobile-drawer-note"><strong>FORDEX</strong><span>AI BUSINESS INDEX · RUSSIA</span></div>
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
      <section className="hero">
        <div className="hero-copy"><span>AI BUSINESS<br />THAT MOVES<br />RUSSIA FORWARD</span><i /></div>
        <div className="hero-word" aria-hidden="true">FORDEX</div>
        <img className="hero-image" src={HERO_IMAGE} alt="Business leaders in discussion" />
        <div className="hero-actions">
          <ButtonLink route="rankings" className="primary">EXPLORE INDEX <ArrowRight size={14} /></ButtonLink>
          <ButtonLink route="companies" className="underlined">BROWSE COMPANIES</ButtonLink>
        </div>
        <div className="hero-stamp">RESEARCH<br />BETA<br /><strong>2026</strong><i /></div>
      </section>

      <section className="category-strip">
        {categoryLinks.map((category) => (
          <button className="category" type="button" key={category.title} onClick={() => goto(category.href)}>
            <img src={category.image} alt="" loading="lazy" />
            <div><h3>{category.title}</h3><p>{category.text}</p><span>EXPLORE <ArrowRight size={13} /></span></div>
          </button>
        ))}
      </section>

      <section className="index-snapshot">
        <div className="section-kicker">INDEX SNAPSHOT · {marketSummary.lastReview}</div>
        <div className="snapshot-grid">
          <Metric label="COMPANIES" value={marketSummary.trackedCompanies} note="tracked profiles" icon={<Building2 />} />
          <Metric label="STARTUPS" value={marketSummary.indexedStartups} note="ranked companies" icon={<TrendingUp />} />
          <Metric label="FOUNDERS" value={marketSummary.founderProfiles} note="verified people" icon={<Users />} />
          <Metric label="DEALS" value={marketSummary.recordedDeals} note="recorded transactions" icon={<WalletCards />} />
        </div>
      </section>

      <section className="editorial">
        <div className="editorial-copy">
          <span>THE RESEARCH LAYER</span><h2>ONE PLACE.<br />MORE SIGNAL.</h2>
          <p>FORDEX separates company facts, capital events and editorial ranking signals so a visitor can move from headline to evidence without leaving the index.</p>
          <ButtonLink route="analytics" className="primary">HOW IT WORKS <ArrowRight size={14} /></ButtonLink>
        </div>
        <img src={EDITORIAL_IMAGE} alt="Team working together" loading="lazy" />
      </section>

      <section className="trust">
        <div><LineChart /><strong>FRESHNESS</strong><span>Every record carries a review date.</span></div>
        <div><ShieldCheck /><strong>VERIFIED</strong><span>Sources stay attached to profiles.</span></div>
        <div><TrendingUp /><strong>RANKED</strong><span>One transparent editorial model.</span></div>
        <div><LockKeyhole /><strong>OPEN INDEX</strong><span>Research is separated from hype.</span></div>
      </section>

      <section className="best">
        <div className="section-head"><div><span>RISING NOW</span><h2>WATCH THE MOVERS</h2></div><ButtonLink route="rankings" className="view-all">VIEW INDEX <ChevronRight size={14} /></ButtonLink></div>
        <div className="movers-grid">
          {rising.map((item) => (
            <button type="button" className="mover-card" key={item.id} onClick={() => goto('rankings')}>
              <span className="mover-rank">#{String(item.rank).padStart(2, '0')}</span>
              <div><strong>{item.name}</strong><span>{item.sector}</span></div>
              <em>+{item.momentum}%</em>
            </button>
          ))}
        </div>
      </section>

      <section className="home-dual">
        <div className="signal-panel">
          <div className="panel-head"><span>LARGEST RECORDED ROUNDS</span><WalletCards size={20} /></div>
          {recentDeals.map((deal) => <button type="button" key={deal.id} onClick={() => goto('deals')}><span>{deal.company}<small>{deal.date}</small></span><strong>{deal.value}</strong><ArrowRight size={14} /></button>)}
        </div>
        <div className="signal-panel">
          <div className="panel-head"><span>INDEX COVERAGE</span><Activity size={20} /></div>
          {sectorCounts.map((item) => <div className="coverage-line" key={item.sector}><span>{item.sector}</span><div><i style={{ width: Math.max(15, item.count / startupRankings.length * 100) + '%' }} /></div><strong>{item.count}</strong></div>)}
          <ButtonLink route="analytics" className="small-link">VIEW MARKET DATA <ArrowRight size={13} /></ButtonLink>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, note, icon }) {
  return <article className="metric-card"><div className="metric-icon">{icon}</div><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function PageHero({ eyebrow, title, description, action }) {
  return (
    <section className="page-hero">
      <div><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p>{action}</div>
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
      <PageHero eyebrow="BUSINESS DIRECTORY" title="COMPANIES" description="A structured index of public AI businesses, technology groups and ranked independent companies tracked by FORDEX." />
      <section className="toolbar">
        <label><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search company, sector, city..." /></label>
        <button type="button" onClick={() => setFilter(filter === 'ALL' ? 'AI / AGENTS' : 'ALL')}><SlidersHorizontal size={15} />{filter === 'ALL' ? 'FILTER' : 'RESET'}</button>
        <span className="result-count">{filtered.length} PROFILES</span>
      </section>
      <div className="filter-rail">{sectorFilters.map((item) => <button type="button" key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div>
      <section className="directory-grid">
        {filtered.map((item, index) => (
          <article className="directory-card" key={item.id}>
            <div className="directory-image">
              <img src={item.image} alt="" loading={index < 6 ? 'eager' : 'lazy'} />
              <button type="button" className="image-open" onClick={() => setSelected(item)} aria-label={'Open ' + item.name + ' profile'} />
              <span>{item.ranking ? '#' + String(item.ranking).padStart(2, '0') : item.kind}</span>
              {item.verified && <span className="verified-mark"><CheckCircle2 size={13} /></span>}
              <button type="button" className={isWatched(item, watchlist) ? 'watch active' : 'watch'} onClick={() => toggleWatch(item)} aria-label="Toggle watchlist"><Heart size={16} fill={isWatched(item, watchlist) ? 'currentColor' : 'none'} /></button>
            </div>
            <div className="directory-copy">
              <span>{item.sector} · {item.stage}</span><h3>{item.name}</h3><p>{item.description}</p>
              <button type="button" className="card-cta" onClick={() => setSelected(item)}>VIEW PROFILE <ArrowRight size={13} /></button>
            </div>
          </article>
        ))}
        {!filtered.length && <div className="empty">NO RESULTS FOUND.</div>}
      </section>
      {selected && <CompanyDrawer company={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}

function CompanyDrawer({ company, onClose }) {
  return (
    <div className="startup-overlay" role="dialog" aria-modal="true" aria-label={company.name + ' profile'} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="startup-drawer company-drawer">
        <div className="drawer-top"><span>FORDEX PROFILE · {company.kind}</span><button type="button" onClick={onClose} aria-label="Close profile"><X size={18} /></button></div>
        <div className="drawer-media"><img src={company.image} alt="" /></div>
        <span className="drawer-sector">{company.sector}</span><h2>{company.name}</h2><p>{company.description}</p>
        <div className="drawer-stats">
          <div><span>STAGE</span><strong>{company.stage}</strong></div>
          <div><span>LOCATION</span><strong>{company.city}</strong></div>
          <div><span>FORDEX RANK</span><strong>{company.ranking ? '#' + String(company.ranking).padStart(2, '0') : '—'}</strong></div>
          <div><span>REVIEWED</span><strong>{company.lastVerified || '—'}</strong></div>
        </div>
        {company.score && <div className="drawer-signal"><span>INDEX SIGNAL</span><p>FORDEX score <strong>{company.score}</strong> · momentum <strong>+{company.momentum}%</strong>.</p></div>}
        <a className="drawer-source" href={company.website || company.source} target="_blank" rel="noreferrer">OPEN COMPANY <ExternalLink size={14} /></a>
      </aside>
    </div>
  );
}

function MarketMap() {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();
  const indexed = startupRankings.length;
  const corporate = marketCompanies.filter((item) => item.kind === 'CORPORATE').length;
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
      <PageHero eyebrow="MARKET COVERAGE" title="MARKET MAP" description="A wider research universe around the scored FORDEX index. Ranked companies carry editorial scores; the watch universe is deliberately kept unscored until evidence is strong enough." action={<ButtonLink route="rankings" className="text-link">OPEN STARTUP RANKING <ArrowRight size={13} /></ButtonLink>} />
      <section className="market-overview">
        <div><span>FORDEX CORE</span><strong>{indexed}</strong><small>scored companies</small></div>
        <div><span>CORPORATE LAYER</span><strong>{corporate}</strong><small>large technology groups</small></div>
        <div><span>RESEARCH UNIVERSE</span><strong>{researchUniverse.length}</strong><small>additional watch profiles</small></div>
        <div><span>DATA SOURCES</span><strong>3+</strong><small>public research streams</small></div>
      </section>

      <section className="market-intro">
        <div><span>HOW TO READ THE MAP</span><h2>SEPARATE THE<br />SCORE FROM<br />THE COVERAGE.</h2></div>
        <div>
          <p>FORDEX uses three layers: scored startups, corporate AI players and a research universe. This keeps the visible ranking strict without pretending every company has the same depth of public evidence.</p>
          <div className="market-legend"><span><i className="legend-dot solid" />SCORED</span><span><i className="legend-dot" />COVERAGE ONLY</span><span><i className="legend-dot dark" />CORPORATE</span></div>
        </div>
      </section>

      <section className="market-sectors">
        <div className="section-head"><div><span>SECTOR COVERAGE</span><h2>WHERE THE MARKET SITS</h2></div></div>
        <div className="sector-map-grid">
          {buckets.map((bucket) => <div className="sector-map-card" key={bucket.label}><span>{bucket.label}</span><strong>{bucket.count}</strong><div><i style={{ width: Math.min(100, 18 + bucket.count / Math.max(1, indexed) * 100) + '%' }} /></div><small>INDEXED SIGNALS</small></div>)}
        </div>
      </section>

      <section className="market-universe">
        <div className="universe-head">
          <div><span>RESEARCH UNIVERSE</span><h2>WHO ELSE<br />IS ON THE RADAR?</h2></div>
          <label><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search watch universe..." /></label>
        </div>
        <div className="universe-table">
          <div className="universe-row universe-head-row"><span>COMPANY</span><span>SECTOR</span><span>STATUS</span><span>SOURCE</span></div>
          {visible.map((item, index) => <a href={item.source} target="_blank" rel="noreferrer" className="universe-row" key={item.name}><strong>{item.name}</strong><span>{item.sector}</span><span>RESEARCH WATCH</span><span>{item.sourceName} <ExternalLink size={13} /></span></a>)}
          {!visible.length && <div className="empty">NO WATCH PROFILES MATCH THE QUERY.</div>}
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
      <PageHero eyebrow="PEOPLE & LEADERS" title="FOUNDERS" description="A people index covering founders and key executives, with role, company, city and source links attached to every profile." />
      <section className="toolbar"><label><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search founder or company..." /></label><span className="result-count">{filtered.length} PEOPLE</span></section>
      <section className="portrait-grid">
        {filtered.map((founder, index) => (
          <button type="button" className="founder-card" key={founder.id} onClick={() => setSelected(founder)}>
            <div className="portrait-image"><img src={founder.image} alt="" loading={index < 4 ? 'eager' : 'lazy'} /><span>0{index + 1}</span></div>
            <span>{founder.company}</span><h3>{founder.name}</h3><small>{founder.role}</small>
            <span className="card-cta">VIEW PROFILE <ArrowRight size={13} /></span>
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
        <div className="drawer-top"><span>FORDEX PEOPLE INDEX</span><button type="button" onClick={onClose} aria-label="Close profile"><X size={18} /></button></div>
        <div className="drawer-media portrait"><img src={founder.image} alt="" /></div>
        <span className="drawer-sector">{founder.role}</span><h2>{founder.name}</h2><p>{founder.description}</p>
        <div className="drawer-stats"><div><span>COMPANY</span><strong>{founder.company}</strong></div><div><span>LOCATION</span><strong>{founder.city}</strong></div><div><span>STATUS</span><strong>{founder.verified ? 'VERIFIED' : 'RESEARCH'}</strong></div></div>
        <a className="drawer-source" href={founder.source} target="_blank" rel="noreferrer">VIEW SOURCE <ExternalLink size={14} /></a>
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
      <PageHero eyebrow="CAPITAL & TRANSACTIONS" title="DEALS" description="A source-linked ledger of funding rounds and capital events included in the current FORDEX research sample." />
      <section className="deal-summary"><div><span>VISIBLE RECORDS</span><strong>{filtered.length}</strong></div><div><span>KNOWN CAPITAL</span><strong>₽{formatMoney(total)}M</strong></div><div><span>LAST REVIEW</span><strong>{marketSummary.lastReview}</strong></div></section>
      <section className="toolbar"><label><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search company, deal, investor..." /></label><span className="result-count">{filtered.length} RECORDS</span></section>
      <div className="filter-rail">{types.map((item) => <button type="button" key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div>
      <section className="deals-table">
        <div className="table-row table-head"><span>COMPANY</span><span>TYPE</span><span>VALUE</span><span>DATE</span><span>LEAD / NOTE</span><span>SOURCE</span></div>
        {filtered.map((deal) => (
          <a className="table-row" key={deal.id} href={deal.source} target="_blank" rel="noreferrer">
            <strong>{deal.company}</strong><span>{deal.type}</span><strong>{deal.value}</strong><span>{deal.date}</span><span>{deal.lead}</span><ExternalLink size={14} />
          </a>
        ))}
      </section>
      {!filtered.length && <div className="empty">NO DEALS MATCH THE CURRENT FILTER.</div>}
    </main>
  );
}

function Rankings() {
  const [category, setCategory] = useState('ALL');
  const [view, setView] = useState('overall');
  const [sort, setSort] = useState('rank');
  const [selected, setSelected] = useState(null);
  const filtered = useMemo(() => {
    const rows = startupRankings.filter((item) => category === 'ALL' || item.tags.includes(category));
    return [...rows].sort((a, b) => {
      if (view === 'movers') return b.momentum - a.momentum;
      if (view === 'capital') return (b.fundingM ?? -1) - (a.fundingM ?? -1);
      if (sort === 'score') return b.score - a.score;
      if (sort === 'momentum') return b.momentum - a.momentum;
      if (sort === 'funding') return (b.fundingM ?? -1) - (a.fundingM ?? -1);
      return a.rank - b.rank;
    });
  }, [category, view, sort]);

  return (
    <main className="inner-page rankings-page">
      <PageHero eyebrow="THE FORDEX INDEX · 2026" title="STARTUP RANKINGS" description="A research-beta editorial ranking of Russian AI and technology companies. Scores reflect the published FORDEX model, not an external market authority." action={<ButtonLink route="analytics" className="text-link">METHODOLOGY <ArrowRight size={13} /></ButtonLink>} />
      <section className="ranking-intro">
        <div><span>FORDEX STARTUP INDEX</span><h2>WHO IS<br />MOVING UP?</h2></div>
        <div><p>FORDEX converts observable signals into a normalized score so companies can be compared on one page. Every profile keeps its source and review month visible.</p><small>RESEARCH BETA · 20 INDEXED COMPANIES · LAST REVIEW OCT 2026</small></div>
      </section>
      <section className="ranking-controls">
        <div className="ranking-view-tabs">
          <button type="button" className={view === 'overall' ? 'active' : ''} onClick={() => setView('overall')}>OVERALL</button>
          <button type="button" className={view === 'movers' ? 'active' : ''} onClick={() => setView('movers')}>FASTEST MOVERS</button>
          <button type="button" className={view === 'capital' ? 'active' : ''} onClick={() => setView('capital')}>CAPITAL LEADERS</button>
        </div>
        <div className="ranking-filter-set">
          <div className="ranking-tabs">{rankingCategories.map((item) => <button type="button" key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
          <label>SORT <select value={sort} onChange={(e) => setSort(e.target.value)}><option value="rank">FORDEX RANK</option><option value="score">SCORE</option><option value="momentum">MOMENTUM</option><option value="funding">KNOWN FUNDING</option></select></label>
        </div>
      </section>
      <section className="startup-table" aria-label="FORDEX Startup Rankings">
        <div className="startup-row startup-head"><span>#</span><span>COMPANY</span><span>SECTOR</span><span>STAGE</span><span>FUNDING</span><span>MOMENTUM</span><span>SCORE</span></div>
        {filtered.map((item) => (
          <button type="button" className="startup-row startup-item" key={item.id} onClick={() => setSelected(item)}>
            <span className="rank-cell"><strong>{String(item.rank).padStart(2, '0')}</strong><small className={item.previousRank > item.rank ? 'rank-up' : item.previousRank < item.rank ? 'rank-down' : 'rank-flat'}>{item.previousRank > item.rank ? '↑ ' + (item.previousRank - item.rank) : item.previousRank < item.rank ? '↓ ' + (item.rank - item.previousRank) : '—'}</small></span>
            <span className="startup-name"><strong>{item.name}</strong><small>{item.city} · {item.verified ? 'VERIFIED' : 'RESEARCH'}</small></span>
            <span>{item.sector}</span><span>{item.stage}</span><span>{item.funding}</span><strong className="positive">+{item.momentum}%</strong><strong className="score">{item.score}</strong>
          </button>
        ))}
      </section>
      <section className="ranking-context">
        <div><span>CURRENT VIEW</span><strong>{view === 'overall' ? 'OVERALL INDEX' : view === 'movers' ? 'FASTEST MOVERS' : 'CAPITAL LEADERS'}</strong></div>
        <p>{view === 'overall' ? 'Ordered by the published FORDEX score.' : view === 'movers' ? 'Ordered by the editorial momentum signal; this is not a revenue growth rate.' : 'Ordered by disclosed financing amounts; undisclosed funding is kept at the bottom.'}</p>
      </section>
      <section className="ranking-method">
        <div><span>HOW FORDEX SCORES</span><h2>ONE SCORE.<br />SIX SIGNALS.</h2><p>The model is deliberately weighted toward evidence of a working business. Funding alone cannot win the index.</p></div>
        <div className="score-list">{scoreWeights.map((weight) => <div key={weight.label}><span>{weight.label}</span><strong>{weight.value}%</strong><i><b style={{ width: weight.value + '%' }} /></i></div>)}</div>
      </section>
      {selected && <StartupDrawer startup={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}

function StartupDrawer({ startup, onClose }) {
  const delta = startup.previousRank ? startup.previousRank - startup.rank : 0;
  const deltaText = delta > 0 ? 'UP ' + delta : delta < 0 ? 'DOWN ' + Math.abs(delta) : 'FLAT';

  return (
    <div className="startup-overlay" role="dialog" aria-modal="true" aria-label={startup.name + ' ranking profile'} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="startup-drawer">
        <div className="drawer-top"><span>FORDEX INDEX · #{String(startup.rank).padStart(2, '0')}</span><button type="button" onClick={onClose} aria-label="Close profile"><X size={18} /></button></div>
        <div className="drawer-score"><small>FORDEX SCORE</small><strong>{startup.score}</strong><span>+{startup.momentum}% MOMENTUM</span></div>
        <span className="drawer-sector">{startup.sector}</span><h2>{startup.name}</h2><p>{startup.description}</p>
        <div className="drawer-stats">
          <div><span>STAGE</span><strong>{startup.stage}</strong></div>
          <div><span>FUNDING</span><strong>{startup.funding}</strong></div>
          <div><span>LATEST ROUND</span><strong>{startup.latestRound || '—'}</strong></div>
          <div><span>LOCATION</span><strong>{startup.city}</strong></div>
        </div>
        <div className="drawer-signal"><span>RANK MOVEMENT</span><p><strong>{deltaText}</strong> · current #{startup.rank}, previous #{startup.previousRank || '—'}. Last verified {startup.lastVerified}.</p></div>
        <a className="drawer-source" href={startup.source} target="_blank" rel="noreferrer">VIEW EVIDENCE <ExternalLink size={14} /></a>
      </aside>
    </div>
  );
}

function News() {
  return (
    <main className="inner-page">
      <PageHero eyebrow="EDITORIAL & SOURCES" title="NEWS" description="A lightweight editorial layer built from public company updates and ecosystem reporting, with the original source one click away." />
      <section className="news-list">
        {newsFeed.map((story, index) => (
          <article key={story.id}>
            <div className="news-index">{String(index + 1).padStart(2, '0')}</div>
            <div><span>{story.date} · {story.category}</span><h2>{story.title}</h2><small>{story.sourceName}</small></div>
            <a href={story.source} target="_blank" rel="noreferrer">READ SOURCE <ExternalLink size={14} /></a>
          </article>
        ))}
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
      <PageHero eyebrow="MARKET INTELLIGENCE" title="ANALYTICS" description="Derived metrics from the current FORDEX research dataset. Sample counts describe indexed records, not the entire Russian market." />
      <section className="metric-grid analytics-metrics">
        <Metric label="INDEXED COMPANIES" value={startupRankings.length} note="startup ranking sample" icon={<Building2 />} />
        <Metric label="AVERAGE SCORE" value={averageScore.toFixed(1)} note="out of 100" icon={<Activity />} />
        <Metric label="AVG MOMENTUM" value={'+' + avgMomentum.toFixed(1) + '%'} note="editorial signal" icon={<TrendingUp />} />
        <Metric label="KNOWN FUNDING" value={'₽' + formatMoney(knownFunding) + 'M'} note="visible in indexed records" icon={<WalletCards />} />
      </section>
      <section className="analytics-panel">
        <div className="panel-head"><div><span>INDEX COMPOSITION</span><h2>WHERE THE 20 COMPANIES SIT</h2></div><BarChart3 size={22} /></div>
        <div className="analytics-bars">
          {sectors.slice(0, 7).map((item) => <div className="analytics-bar-row" key={item.tag}><span>{item.tag}</span><div><i style={{ width: Math.max(8, item.count / startupRankings.length * 100) + '%' }} /></div><strong>{item.count}</strong></div>)}
        </div>
      </section>
      <section className="methodology">
        <div><span>EDITORIAL METHODOLOGY</span><h2>MAKE THE SIGNAL<br />AUDITABLE.</h2><p>FORDEX ranks companies using six weighted signals. A score is an editorial research output; it is not a valuation, investment recommendation or claim of market leadership.</p></div>
        <div className="method-cards">{scoreWeights.map((weight, index) => <article key={weight.label}><small>0{index + 1}</small><strong>{weight.value}%</strong><span>{weight.label}</span></article>)}</div>
      </section>
      <section className="source-board">
        <div><span>DATA DISCIPLINE</span><h2>FACTS FIRST.</h2></div>
        <div><p>Known financing is recorded in rubles where a published amount is available. “UNDISCLOSED” stays visible rather than being estimated. Each indexed company carries a source and verification month.</p><ButtonLink route="companies" className="text-link">BROWSE SOURCES <ArrowRight size={13} /></ButtonLink></div>
      </section>
    </main>
  );
}

function Watchlist({ names, toggleWatch }) {
  const items = marketCompanies.filter((company) => isWatched(company, names));
  return (
    <main className="inner-page">
      <PageHero eyebrow="PERSONAL INDEX" title="WATCHLIST" description="Your saved companies stay in the browser and work without an account. The list can be cleared or extended from any company card." />
      <section className="company-grid watch-grid">
        {items.length ? items.map((company) => (
          <article key={company.id}>
            <div className="card-image"><img src={company.image} alt="" loading="lazy" /><button type="button" className="watch active" onClick={() => toggleWatch(company)}><Heart size={16} fill="currentColor" /></button></div>
            <div className="card-meta"><span>{company.sector}</span><h3>{company.name}</h3><small>{company.stage}</small></div>
          </article>
        )) : <div className="empty"><Heart size={18} /> YOUR WATCHLIST IS EMPTY.</div>}
      </section>
    </main>
  );
}

function formatMoney(value) {
  return Number(value).toLocaleString('ru-RU', { maximumFractionDigits: 1 });
}

function NotFound({ route }) {
  return <main className="not-found"><span>404</span><h1>NOT FOUND</h1><p>There is no FORDEX section called “{route}”.</p><ButtonLink route="home" className="primary"><ArrowLeft size={14} /> RETURN HOME</ButtonLink></main>;
}

function Footer() {
  return (
    <footer>
      <div><div className="logo">FORDEX</div><p>AI BUSINESS INDEX · RUSSIA</p></div>
      <div className="footer-links"><button type="button" onClick={() => goto('companies')}>COMPANIES</button><button type="button" onClick={() => goto('founders')}>FOUNDERS</button><button type="button" onClick={() => goto('deals')}>DEALS</button><button type="button" onClick={() => goto('analytics')}>METHODOLOGY</button></div>
      <span>© 2026 FORDEX · RESEARCH BETA</span>
    </footer>
  );
}

function SearchOverlay({ onClose }) {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!normalized) return [];
    const companyResults = marketCompanies.filter((item) => [item.name, item.sector, item.stage].join(' ').toLowerCase().includes(normalized)).slice(0, 6).map((item) => ({ label: item.name, meta: item.sector, route: 'companies' }));
    const founderResults = founderProfiles.filter((item) => [item.name, item.company, item.role].join(' ').toLowerCase().includes(normalized)).slice(0, 4).map((item) => ({ label: item.name, meta: 'FOUNDER · ' + item.company, route: 'founders' }));
    const dealResults = dealRecords.filter((item) => [item.company, item.type, item.sector, item.lead].join(' ').toLowerCase().includes(normalized)).slice(0, 4).map((item) => ({ label: item.company + ' · ' + item.type, meta: item.value + ' · ' + item.date, route: 'deals' }));
    const newsResults = newsFeed.filter((item) => [item.title, item.category, item.sourceName].join(' ').toLowerCase().includes(normalized)).slice(0, 3).map((item) => ({ label: item.title, meta: 'NEWS · ' + item.date, route: 'news' }));
    const coverageResults = researchUniverse.filter((item) => [item.name, item.sector, item.sourceName].join(' ').toLowerCase().includes(normalized)).slice(0, 4).map((item) => ({ label: item.name, meta: 'MARKET · ' + item.sector, route: 'market' }));
    return [...companyResults, ...founderResults, ...dealResults, ...newsResults, ...coverageResults].slice(0, 12);
  }, [normalized]);

  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search FORDEX" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="search-box">
        <div className="search-top"><span>SEARCH FORDEX</span><button type="button" onClick={onClose} aria-label="Close search"><X size={19} /></button></div>
        <label className="search-input"><Search size={20} /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Company, founder, deal, news..." /></label>
        <div className="search-results">
          {query ? (results.length ? results.map((item) => <button key={item.label + item.meta} type="button" onClick={() => { onClose(); goto(item.route); }}><span>{item.meta}</span><strong>{item.label}</strong><ArrowRight size={14} /></button>) : <p>NO MATCHES IN THE FORDEX INDEX.</p>) : <p>TYPE TO SEARCH THE INDEX.</p>}
        </div>
        <div className="search-hint">PRESS <kbd>ESC</kbd> TO CLOSE · PRESS <kbd>/</kbd> TO SEARCH</div>
      </div>
    </div>
  );
}

