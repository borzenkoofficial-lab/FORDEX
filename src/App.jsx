import { ArrowRight, Heart, Search, UserRound, Truck, Box, ShieldCheck, LockKeyhole, ChevronRight } from 'lucide-react';

const nav = ['COMPANIES','FOUNDERS','DEALS','RANKINGS'];
const categories = [
  { title:'COMPANIES', text:'The businesses shaping the AI economy.', image:'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=700&q=85' },
  { title:'FOUNDERS', text:'The people building what comes next.', image:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=85' },
  { title:'DEALS', text:'Capital, investments and strategic moves.', image:'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=700&q=85' },
];
const companies = [
  { name:'Yandex AI', meta:'AI · Technology', image:'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=900&q=85' },
  { name:'GigaChat', meta:'Generative AI · Sber', image:'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=85' },
  { name:'MTS AI', meta:'AI · Telecom', image:'https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=900&q=85' },
  { name:'Salute', meta:'AI · Sber', image:'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=85' },
];

export function App(){
  return <div className="site">
    <div className="announcement">THE AI BUSINESS INDEX OF RUSSIA <span>2026</span></div>
    <header className="header">
      <nav className="nav-left">{nav.map(item=><a href={'#'+item.toLowerCase()} key={item}>{item}</a>)}</nav>
      <a className="logo" href="#top">FORDEX</a>
      <div className="nav-right"><button><Search size={16}/><span>SEARCH</span></button><button><UserRound size={16}/><span>LOGIN</span></button><button><Heart size={16}/><span>WATCHLIST</span></button><button className="cart"><Box size={16}/><span>INDEX (0)</span></button></div>
    </header>

    <main id="top">
      <section className="hero">
        <div className="hero-copy"><span>AI BUSINESS<br/>THAT MOVES<br/>RUSSIA FORWARD</span><i/></div>
        <div className="hero-word">FORDEX</div>
        <img className="hero-image" src="https://images.unsplash.com/photo-1551836022-4c4c79ecde51?auto=format&fit=crop&w=1300&q=90" alt="Business leaders"/>
        <div className="hero-actions"><a className="primary" href="#index">EXPLORE INDEX <ArrowRight size={14}/></a><a className="underlined" href="#companies">EXPLORE COMPANIES</a></div>
        <div className="hero-stamp">AI BUSINESS<br/>INDEX<br/><strong>2026</strong><i/></div>
      </section>

      <section className="category-strip" id="companies">{categories.map(c=><a className="category" href="#index" key={c.title}><img src={c.image} alt=""/><div><h3>{c.title}</h3><p>{c.text}</p><span>EXPLORE <ArrowRight size={13}/></span></div></a>)}</section>

      <section className="editorial" id="index">
        <div className="editorial-copy"><span>NEW INDEX</span><h2>THE NEW<br/>AI ECONOMY</h2><p>Discover the companies, founders and capital defining the next chapter of Russian technology.</p><a className="primary" href="#rankings">VIEW THE INDEX <ArrowRight size={14}/></a></div>
        <img src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1500&q=90" alt="Technology leaders"/>
      </section>

      <section className="trust"><div><Truck/><strong>LIVE DATA</strong><span>Continuously updated</span></div><div><Box/><strong>COMPANIES</strong><span>Verified profiles</span></div><div><ShieldCheck/><strong>DATA QUALITY</strong><span>Editorially reviewed</span></div><div><LockKeyhole/><strong>OPEN INDEX</strong><span>Transparent methodology</span></div></section>

      <section className="best" id="rankings"><div className="section-head"><div><span>EDITOR'S SELECTION</span><h2>BEST OF FORDEX</h2></div><a href="#companies">VIEW ALL <ChevronRight size={14}/></a></div><div className="company-grid">{companies.map(c=><article key={c.name}><div className="card-image"><img src={c.image} alt=""/><button aria-label="Add to watchlist"><Heart size={16}/></button></div><div className="card-meta"><h3>{c.name}</h3><span>{c.meta}</span></div></article>)}</div></section>
    </main>

    <footer><div className="logo">FORDEX</div><p>AI BUSINESS INDEX · RUSSIA</p><span>© 2026 FORDEX</span></footer>
  </div>
}
