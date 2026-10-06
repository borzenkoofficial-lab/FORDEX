import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  ChevronRight,
  Heart,
  LineChart,
  LockKeyhole,
  Menu,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-react';

const NAV = ['COMPANIES', 'FOUNDERS', 'DEALS', 'RANKINGS'];
const HERO_IMAGE = 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1400&q=88';
const EDITORIAL_IMAGE = 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1500&q=88';

const categories = [
  { title: 'COMPANIES', text: 'The businesses shaping the AI economy.', image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=700&q=85', href: 'companies' },
  { title: 'FOUNDERS', text: 'The people building what comes next.', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=85', href: 'founders' },
  { title: 'DEALS', text: 'Capital, investments and strategic moves.', image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=700&q=85', href: 'deals' },
];

const companies = [
  { name: 'Yandex AI', type: 'AI · Technology', score: '01', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=900&q=85', description: 'AI infrastructure, research and products.' },
  { name: 'GigaChat', type: 'Generative AI · Enterprise', score: '02', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=85', description: 'Large language models and business AI.' },
  { name: 'MTS AI', type: 'AI · Telecom', score: '03', image: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=900&q=85', description: 'Applied AI across products and infrastructure.' },
  { name: 'Salute', type: 'AI · Consumer', score: '04', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=85', description: 'Consumer AI and intelligent services.' },
];

const founders = [
  { name: 'Alexey Kuznetsov', company: 'NOVA AI', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=85' },
  { name: 'Anna Petrova', company: 'VISION LAB', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=85' },
  { name: 'Dmitry Orlov', company: 'VECTOR', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=85' },
  { name: 'Maria Sokolova', company: 'MINDWORKS', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=85' },
];

const deals = [
  { company: 'NOVA AI', type: 'Series A', value: '₽1.8B', date: 'OCT 2026', sector: 'Foundation AI' },
  { company: 'VECTOR', type: 'Strategic', value: '₽720M', date: 'SEP 2026', sector: 'Robotics' },
  { company: 'MINDWORKS', type: 'Seed', value: '₽240M', date: 'SEP 2026', sector: 'Enterprise AI' },
  { company: 'VISION LAB', type: 'Series B', value: '₽3.2B', date: 'AUG 2026', sector: 'Computer Vision' },
  { company: 'NEXA', type: 'Strategic', value: '₽540M', date: 'AUG 2026', sector: 'AI Infrastructure' },
];

const rankingRows = companies.map((company, index) => ({
  rank: index + 1,
  company: company.name,
  category: company.type,
  momentum: ['+18.4%', '+16.1%', '+13.8%', '+11.2%'][index],
  position: ['Leader', 'Rising', 'Rising', 'Established'][index],
}));

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

export function App() {
  const route = useRoute();
  const [searchOpen, setSearchOpen] = useState(false);
  const [watchlist, setWatchlist] = useState(() => {
    try { const value = JSON.parse(localStorage.getItem('fordex-watchlist') || '[]'); return Array.isArray(value) ? value : []; }
    catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem('fordex-watchlist', JSON.stringify(watchlist)); }
    catch { /* best effort */ }
  }, [watchlist]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === '/' && !searchOpen && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  const toggleWatch = (name) => setWatchlist((current) =>
    current.includes(name) ? current.filter((item) => item !== name) : [...current, name]
  );

  const knownRoutes = ['home', 'companies', 'founders', 'deals', 'rankings', 'news', 'analytics', 'watchlist'];

  return (
    <div className="site">
      <TopBar />
      <Header route={route} watchCount={watchlist.length} onSearch={() => setSearchOpen(true)} />
      {route === 'home' && <Home watchlist={watchlist} toggleWatch={toggleWatch} />}
      {route === 'companies' && <Directory eyebrow="BUSINESS DIRECTORY" title="AI COMPANIES" description="A structured view of the companies building, financing and deploying artificial intelligence." items={companies} watchlist={watchlist} toggleWatch={toggleWatch} imageKey="image" typeKey="type" />}
      {route === 'founders' && <Founders />}
      {route === 'deals' && <Deals />}
      {route === 'rankings' && <Rankings />}
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
      <span>THE AI BUSINESS INDEX OF RUSSIA</span><strong>2026</strong>
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
          {NAV.map((item) => <button type="button" key={item} className={route === item.toLowerCase() ? 'active' : ''} onClick={() => goto(item.toLowerCase())}>{item}</button>)}
        </nav>
        <button className="logo" type="button" onClick={() => goto('home')} aria-label="FORDEX home">FORDEX</button>
        <div className="nav-right">
          <button type="button" onClick={onSearch}><Search size={16} /><span>SEARCH</span></button>
          <button type="button" onClick={() => goto('analytics')}><UserRound size={16} /><span>SIGN IN</span></button>
          <button type="button" onClick={() => goto('watchlist')}><Heart size={16} /><span>{watchLabel}</span></button>
          <button type="button" onClick={() => goto('rankings')}><BarChart3 size={16} /><span>INDEX</span></button>
        </div>
      </header>
      <div className={mobileOpen ? 'mobile-drawer open' : 'mobile-drawer'} aria-hidden={!mobileOpen}>
        <div className="mobile-drawer-links">
          {NAV.map((item) => <button type="button" key={item} onClick={() => navigate(item.toLowerCase())}>{item}</button>)}
          <button type="button" onClick={() => navigate('news')}>NEWS</button>
          <button type="button" onClick={() => navigate('analytics')}>ANALYTICS</button>
          <button type="button" onClick={() => navigate('watchlist')}>WATCHLIST{watchCount ? ' (' + watchCount + ')' : ''}</button>
        </div>
        <div className="mobile-drawer-note"><span>FORDEX</span><p>AI BUSINESS INDEX · RUSSIA</p></div>
      </div>
    </>
  );
}

function Home({ watchlist, toggleWatch }) {
  return (
    <main id="top">
      <section className="hero">
        <div className="hero-copy"><span>AI BUSINESS<br />THAT MOVES<br />RUSSIA FORWARD</span><i /></div>
        <div className="hero-word" aria-hidden="true">FORDEX</div>
        <img className="hero-image" src={HERO_IMAGE} alt="Business leaders in discussion" />
        <div className="hero-actions">
          <ButtonLink route="rankings" className="primary">EXPLORE INDEX <ArrowRight size={14} /></ButtonLink>
          <ButtonLink route="companies" className="underlined">EXPLORE COMPANIES</ButtonLink>
        </div>
        <div className="hero-stamp">AI BUSINESS<br />INDEX<br /><strong>2026</strong><i /></div>
      </section>

      <section className="category-strip">
        {categories.map((category) => (
          <button className="category" type="button" key={category.title} onClick={() => goto(category.href)}>
            <img src={category.image} alt="" loading="lazy" />
            <div><h3>{category.title}</h3><p>{category.text}</p><span>EXPLORE <ArrowRight size={13} /></span></div>
          </button>
        ))}
      </section>

      <section className="editorial">
        <div className="editorial-copy">
          <span>NEW INDEX</span><h2>THE NEW<br />AI ECONOMY</h2>
          <p>Discover the companies, founders and capital defining the next chapter of Russian technology.</p>
          <ButtonLink route="analytics" className="primary">VIEW THE INDEX <ArrowRight size={14} /></ButtonLink>
        </div>
        <img src={EDITORIAL_IMAGE} alt="Team working together" loading="lazy" />
      </section>

      <section className="trust" aria-label="FORDEX principles">
        <div><LineChart /><strong>LIVE DATA</strong><span>Continuously updated</span></div>
        <div><ShieldCheck /><strong>VERIFIED PROFILES</strong><span>Structured company data</span></div>
        <div><TrendingUp /><strong>RANKINGS</strong><span>Transparent methodology</span></div>
        <div><LockKeyhole /><strong>OPEN INDEX</strong><span>Evidence-led research</span></div>
      </section>

      <section className="best">
        <div className="section-head">
          <div><span>EDITOR'S SELECTION</span><h2>BEST OF FORDEX</h2></div>
          <ButtonLink route="companies" className="view-all">VIEW ALL <ChevronRight size={14} /></ButtonLink>
        </div>
        <div className="company-grid">
          {companies.map((company) => (
            <article key={company.name}>
              <div className="card-image">
                <img src={company.image} alt="" loading="lazy" />
                <button type="button" className={watchlist.includes(company.name) ? 'watch active' : 'watch'} onClick={() => toggleWatch(company.name)} aria-label="Toggle watchlist">
                  <Heart size={16} fill={watchlist.includes(company.name) ? 'currentColor' : 'none'} />
                </button>
              </div>
              <div className="card-meta"><h3>{company.name}</h3><span>{company.type}</span></div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function PageHero({ eyebrow, title, description }) {
  return (
    <section className="page-hero">
      <div><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
      <div className="page-hero-word" aria-hidden="true">{title.split(' ')[0]}</div>
    </section>
  );
}

function Directory({ eyebrow, title, description, items, watchlist, toggleWatch, imageKey, typeKey }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const filtered = useMemo(() => items.filter((item) => {
    const haystack = (item.name + ' ' + (item[typeKey] || '')).toLowerCase();
    return haystack.includes(query.toLowerCase()) && (filter === 'ALL' || (item[typeKey] || '').toUpperCase().includes(filter));
  }), [items, query, filter, typeKey]);

  return (
    <main className="inner-page">
      <PageHero eyebrow={eyebrow} title={title} description={description} />
      <section className="toolbar">
        <label><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search companies" /></label>
        <button type="button" onClick={() => setFilter(filter === 'ALL' ? 'AI' : 'ALL')}><SlidersHorizontal size={15} />{filter === 'ALL' ? 'FILTER' : 'RESET'}</button>
      </section>
      <section className="directory-grid">
        {filtered.map((item) => (
          <article className="directory-card" key={item.name}>
            <div className="directory-image">
              <img src={item[imageKey]} alt="" loading="lazy" />
              <span>{item.score || '—'}</span>
              <button type="button" className={watchlist.includes(item.name) ? 'watch active' : 'watch'} onClick={() => toggleWatch(item.name)} aria-label="Toggle watchlist"><Heart size={16} fill={watchlist.includes(item.name) ? 'currentColor' : 'none'} /></button>
            </div>
            <div className="directory-copy">
              <span>{item[typeKey]}</span><h3>{item.name}</h3><p>{item.description}</p>
              <button type="button" onClick={() => goto('analytics')}>VIEW PROFILE <ArrowRight size={13} /></button>
            </div>
          </article>
        ))}
        {!filtered.length && <div className="empty">NO RESULTS FOUND.</div>}
      </section>
    </main>
  );
}

function Founders() {
  return (
    <main className="inner-page">
      <PageHero eyebrow="PEOPLE & LEADERS" title="FOUNDERS" description="The people behind the companies and products moving the AI market forward." />
      <section className="portrait-grid">
        {founders.map((founder, index) => (
          <article key={founder.name}>
            <div className="portrait-image"><img src={founder.image} alt="" loading="lazy" /><span>0{index + 1}</span></div>
            <span>{founder.company}</span><h3>{founder.name}</h3>
            <button type="button" onClick={() => goto('analytics')}>VIEW PROFILE <ArrowRight size={13} /></button>
          </article>
        ))}
      </section>
    </main>
  );
}

function Deals() {
  return (
    <main className="inner-page">
      <PageHero eyebrow="CAPITAL & TRANSACTIONS" title="DEALS" description="A structured record of funding rounds, strategic investments and capital movements." />
      <section className="deals-table">
        <div className="table-row table-head"><span>COMPANY</span><span>TYPE</span><span>VALUE</span><span>DATE</span></div>
        {deals.map((deal) => <div className="table-row" key={deal.company + '-' + deal.date}><strong>{deal.company}</strong><span>{deal.type}</span><strong>{deal.value}</strong><span>{deal.date}</span></div>)}
      </section>
      <section className="deal-note"><span>MARKET SIGNAL</span><h2>CAPITAL IS<br />MOVING FASTER.</h2><p>FORDEX tracks the transactions that matter to the direction of the AI economy.</p></section>
    </main>
  );
}

function Rankings() {
  return (
    <main className="inner-page">
      <PageHero eyebrow="THE FORDEX INDEX" title="RANKINGS" description="A clear editorial index of companies with the strongest combination of scale, momentum and market relevance." />
      <section className="ranking-table">
        <div className="ranking-row ranking-head"><span>RANK</span><span>COMPANY</span><span>CATEGORY</span><span>MOMENTUM</span><span>STATUS</span></div>
        {rankingRows.map((row) => <div className="ranking-row" key={row.rank}><strong>{String(row.rank).padStart(2, '0')}</strong><strong>{row.company}</strong><span>{row.category}</span><strong>{row.momentum}</strong><span>{row.position}</span></div>)}
      </section>
      <div className="methodology"><span>METHODOLOGY</span><h2>DATA. SIGNAL.<br />JUDGEMENT.</h2><p>FORDEX combines structured data and editorial review. The interface stays simple; the research layer stays rigorous.</p></div>
    </main>
  );
}

function News() {
  const stories = [
    { title: 'THE AI ECONOMY IS MOVING FROM MODELS TO MARKETS.', category: 'ANALYSIS' },
    { title: 'WHERE NEW CAPITAL IS ENTERING THE AI STACK.', category: 'CAPITAL' },
    { title: 'THE COMPANIES BUILDING THE NEXT WAVE OF AI INFRASTRUCTURE.', category: 'COMPANIES' },
    { title: 'WHY FOUNDERS ARE MOVING CLOSER TO DISTRIBUTION.', category: 'STRATEGY' },
  ];
  return (
    <main className="inner-page">
      <PageHero eyebrow="EDITORIAL" title="NEWS" description="The moves, companies and ideas shaping the Russian AI market." />
      <section className="news-list">
        {stories.map((story, index) => <article key={story.title}><span>0{index + 1} · {story.category}</span><h2>{story.title}</h2><button type="button" onClick={() => goto('analytics')}>READ STORY <ArrowRight size={14} /></button></article>)}
      </section>
    </main>
  );
}

function Analytics() {
  const bars = [38, 53, 48, 68, 61, 79, 73, 91, 84, 96];
  return (
    <main className="inner-page">
      <PageHero eyebrow="MARKET INTELLIGENCE" title="ANALYTICS" description="A visual layer over the companies, people and transactions tracked by FORDEX." />
      <section className="metric-grid">
        <article><span>COMPANIES</span><strong>1,284</strong><small>TRACKED</small></article>
        <article><span>FOUNDERS</span><strong>3,742</strong><small>PROFILES</small></article>
        <article><span>DEALS</span><strong>186</strong><small>RECORDED</small></article>
        <article><span>CAPITAL</span><strong>₽48.6B</strong><small>TRACKED</small></article>
      </section>
      <section className="analytics-panel">
        <div className="panel-head"><div><span>MARKET MOMENTUM</span><h2>AI BUSINESS INDEX · 2026</h2></div><TrendingUp size={22} /></div>
        <div className="bars">{bars.map((value, index) => <div className="bar" style={{ '--bar': value + '%' }} key={index}><i /><span>{String(index + 1).padStart(2, '0')}</span></div>)}</div>
      </section>
    </main>
  );
}

function Watchlist({ names, toggleWatch }) {
  const items = companies.filter((company) => names.includes(company.name));
  return (
    <main className="inner-page">
      <PageHero eyebrow="PERSONAL INDEX" title="WATCHLIST" description="Keep the companies that matter to you in one focused view." />
      <section className="company-grid watch-grid">
        {items.length ? items.map((company) => <article key={company.name}><div className="card-image"><img src={company.image} alt="" loading="lazy" /><button type="button" className="watch active" onClick={() => toggleWatch(company.name)}><Heart size={16} fill="currentColor" /></button></div><div className="card-meta"><h3>{company.name}</h3><span>{company.type}</span></div></article>) : <div className="empty">YOUR WATCHLIST IS EMPTY.</div>}
      </section>
    </main>
  );
}

function NotFound({ route }) {
  return <main className="not-found"><span>404</span><h1>NOT FOUND</h1><p>There is no FORDEX section called “{route}”.</p><ButtonLink route="home" className="primary"><ArrowLeft size={14} /> RETURN HOME</ButtonLink></main>;
}

function Footer() {
  return (
    <footer>
      <div className="logo">FORDEX</div><p>AI BUSINESS INDEX · RUSSIA</p>
      <div className="footer-links">
        <button type="button" onClick={() => goto('companies')}>COMPANIES</button>
        <button type="button" onClick={() => goto('founders')}>FOUNDERS</button>
        <button type="button" onClick={() => goto('deals')}>DEALS</button>
        <button type="button" onClick={() => goto('analytics')}>METHODOLOGY</button>
      </div>
      <span>© 2026 FORDEX</span>
    </footer>
  );
}

function SearchOverlay({ onClose }) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => companies.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())), [query]);
  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search FORDEX">
      <div className="search-box">
        <div className="search-top"><span>SEARCH FORDEX</span><button type="button" onClick={onClose} aria-label="Close search"><X size={19} /></button></div>
        <label className="search-input"><Search size={20} /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Company, founder, deal..." /></label>
        <div className="search-results">
          {query ? results.map((item) => <button key={item.name} type="button" onClick={() => { onClose(); goto('companies'); }}><span>{item.type}</span><strong>{item.name}</strong><ArrowRight size={14} /></button>) : <p>TYPE TO SEARCH THE FORDEX INDEX.</p>}
        </div>
        <div className="search-hint">PRESS <kbd>ESC</kbd> TO CLOSE</div>
      </div>
    </div>
  );
}
