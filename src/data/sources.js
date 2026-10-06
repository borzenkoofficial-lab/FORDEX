export const sourceRegistry = [
  {
    id: 'cnews',
    name: 'CNews Analytics',
    type: 'MARKET RANKING',
    title: 'Крупнейшие игроки российского рынка ИИ-решений 2025',
    date: 'JUN 2026',
    url: 'https://www.cnews.ru/reviews/tehnologii_iskusstvennogo_intellekta_1/review_table/a8b6a30b8dca288a5d94b9a035a836bcf06be2b2/',
    use: 'AI project revenue and growth for provider benchmarking.',
    note: 'Displayed as an external source ranking, not as a FORDEX score.'
  },
  {
    id: 'aiana',
    name: 'AIANA',
    type: 'MARKET RESEARCH',
    title: 'RAI-2026 · российский рынок искусственного интеллекта',
    date: 'AUG 2026',
    url: 'https://aiana.ru/research/rai-2026-ru/',
    use: 'Macro market size and company-count context.',
    note: 'Market-level figures are kept separate from company-level index scores.'
  },
  {
    id: 'ai-review',
    name: 'AI Review',
    type: 'ECOSYSTEM RESEARCH',
    title: 'AI-стартапы России: топ-20 в 2026',
    date: 'AUG 2026',
    url: 'https://ai-review.ru/blog/ai-startapy-rossii-top-20/',
    use: 'Candidate discovery and category cross-checks.',
    note: 'Editorial secondary source; claims are not copied into FORDEX without a source link.'
  },
  {
    id: 'seedtable',
    name: 'Seedtable',
    type: 'STARTUP DATABASE',
    title: 'Best AI Startups in Russia (2026)',
    date: '2026',
    url: 'https://seedtable.com/best-ai-startups-in-russia',
    use: 'Startup discovery and funding-stage cross-checks.',
    note: 'Third-party scoring is never reused as the FORDEX score.'
  },
  {
    id: 'venture-guide',
    name: 'Venture Guide / Moscow Venture Fund',
    type: 'VENTURE DATA',
    title: 'Russian technology investment flow',
    date: 'OCT 2026',
    url: 'https://www.comnews.ru/content/247690/2026-10-05/2026-w41/1007/iskusstvennyy-intellekt-ostaetsya-liderom-obemu-venchurnykh-investiciy',
    use: 'Current venture-market context and deal-flow monitoring.',
    note: 'Figures may be revised as later deal disclosures are added.'
  },
  {
    id: 'official-company',
    name: 'Official company sources',
    type: 'PRIMARY SOURCES',
    title: 'Company websites, investor announcements and product pages',
    date: 'CONTINUOUS',
    url: 'https://cognitivepilot.com/',
    use: 'Primary evidence for product, funding and company-specific claims.',
    note: 'FORDEX prefers a primary company source when one is public and specific.'
  },
];

export const sourceRules = [
  'A disclosed amount is recorded as disclosed; unknown financing stays UNDISCLOSED.',
  'FORDEX editorial scores are separate from external rankings, valuations and database scores.',
  'Every indexed company should carry a source URL and a review month.',
  'Market-level research is presented as context, not as a substitute for company evidence.',
];
