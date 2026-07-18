CREATE TABLE IF NOT EXISTS seo_index (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  title_length INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  description_length INTEGER NOT NULL DEFAULT 0,
  keywords TEXT DEFAULT '',
  schemas TEXT DEFAULT '',
  has_faq INTEGER NOT NULL DEFAULT 0,
  has_breadcrumb INTEGER NOT NULL DEFAULT 0,
  has_og INTEGER NOT NULL DEFAULT 0,
  has_canonical INTEGER NOT NULL DEFAULT 0,
  robots TEXT NOT NULL DEFAULT 'index, follow',
  index_status TEXT NOT NULL DEFAULT 'not_indexed',
  last_checked TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed with all xSoft pages
INSERT INTO seo_index (url, title, title_length, description, description_length, keywords, schemas, has_faq, has_breadcrumb, has_og, has_canonical, robots, index_status) VALUES
('/', 'xSoft Ltd — AI-Powered Software Solutions for Modern Businesses', 62, 'We build AI chatbots, high-performance websites, Chrome extensions, and SEO strategies that help businesses grow. Based in England, delivering globally.', 152, 'AI chatbot development, web development consultancy, Chrome extension, SEO, xSoft Ltd, Cloudflare Workers', 'Organization, FAQPage', 1, 0, 1, 1, 'index, follow', 'not_indexed'),
('/services/', 'Services — xSoft Ltd | AI Chatbots, Web Dev, Extensions, SEO', 61, 'Full-stack software services: AI chatbots with RAG, high-performance web apps, Chrome extensions, and technical SEO. Enterprise infrastructure, startup speed.', 160, 'AI chatbot development, web development, Chrome extension, SEO consultancy, Cloudflare Workers, RAG', 'Service, FAQPage', 1, 1, 1, 1, 'index, follow', 'not_indexed'),
('/case-studies/', 'Case Studies — xSoft Ltd | Real Projects, Real Results', 55, 'See how we''ve built AI chatbots, 1000+ page websites, crypto platforms, and conversion tools. Live projects with measurable outcomes.', 133, 'case studies, portfolio, web development, AI chatbot, xSoft projects', 'CollectionPage, FAQPage', 1, 1, 1, 1, 'index, follow', 'not_indexed'),
('/case-studies/scrabblewordsfinder/', 'Case Study: ScrabbleWordsFinder — AI Word Game Platform | xSoft Ltd', 67, 'How we built a full-stack Scrabble platform with AI chatbot, 1000+ pages, 6 games, world rankings, and daily challenges. Cloudflare Workers, D1, Vectorize.', 156, 'ScrabbleWordsFinder, AI chatbot case study, Cloudflare Workers, word game platform, RAG chatbot, SEO at scale', 'Article', 0, 1, 1, 1, 'index, follow', 'not_indexed'),
('/case-studies/xconvert24/', 'Case Study: xConvert24 — 60+ Tools & Converters Platform | xSoft Ltd', 69, 'How we built a comprehensive utility platform with 30+ converters, 30+ tools, admin analytics, and Chrome extension. Astro + Cloudflare Workers.', 143, 'xConvert24, unit converter, web tools platform, Cloudflare Workers, case study', 'Article', 0, 1, 1, 1, 'index, follow', 'not_indexed'),
('/case-studies/xcrypto24/', 'Case Study: xCrypto24 — Real-Time Cryptocurrency Platform | xSoft Ltd', 70, 'How we built a crypto tracking platform with live prices, bubble charts, portfolio tools, and top 100 coin data on Cloudflare.', 126, 'xCrypto24, cryptocurrency tracker, crypto bubble chart, real-time prices, Cloudflare Workers, case study', 'Article', 0, 1, 1, 1, 'index, follow', 'not_indexed'),
('/about/', 'About xSoft Ltd — Software Consultancy Based in England', 56, 'xSoft Ltd is a software consultancy founded in 2026. We build AI chatbots, web applications, Chrome extensions, and SEO strategies for businesses worldwide.', 157, 'about xSoft, software consultancy, Rajeev Naik, England, AI development, web development', 'AboutPage, FAQPage', 1, 1, 1, 1, 'index, follow', 'not_indexed'),
('/contact/', 'Contact xSoft Ltd — Start Your Software Project Today', 55, 'Get in touch with xSoft Ltd. We''ll respond within 24 hours with a clear plan for your AI chatbot, web application, or Chrome extension project.', 143, 'contact xSoft, hire developer, AI chatbot quote, web development enquiry', 'ContactPage, FAQPage', 1, 1, 1, 1, 'index, follow', 'not_indexed'),
('/blog/', 'Blog — xSoft Ltd | AI, Cloudflare, SEO & Extensions', 52, 'Technical deep-dives on building AI chatbots with RAG, scaling SEO to 1000+ pages, Cloudflare Workers architecture, and Chrome extension development.', 150, 'xSoft blog, AI chatbot development, Cloudflare Workers, RAG, SEO at scale, Chrome extensions, D1, KV', 'Blog', 0, 1, 1, 1, 'index, follow', 'not_indexed'),
('/blog/building-rag-chatbots-cloudflare/', 'Building RAG Chatbots on Cloudflare Workers AI | xSoft', 55, 'How to build a production RAG chatbot using Cloudflare Workers AI, Vectorize, and D1. Architecture, code patterns, and lessons learned.', 133, 'RAG chatbot, Cloudflare Workers AI, Vectorize, vector embeddings, semantic search, AI chatbot architecture', 'Article, FAQPage', 1, 1, 1, 1, 'index, follow', 'not_indexed'),
('/blog/seo-at-scale-1000-pages/', 'SEO at Scale — How We Deployed 1000+ Pages in 30 Days | xSoft Blog', 67, 'The content strategy, automation tools, and technical SEO architecture behind deploying over 1,000 indexed pages on a single site within 8 weeks of launch.', 155, 'SEO at scale, content automation, structured data, Astro SEO, Google indexing, 1000 pages', 'Article, FAQPage', 1, 1, 1, 1, 'index, follow', 'not_indexed'),
('/blog/manifest-v3-chrome-extensions/', 'Manifest V3 Chrome Extensions — Concept to Store | xSoft', 57, 'A practical guide to building Chrome extensions with Manifest V3. Service workers, permissions, Web Store submission, and analytics.', 130, 'Chrome extension, Manifest V3, Chrome Web Store, service worker, browser extension development', 'Article, FAQPage', 1, 1, 1, 1, 'index, follow', 'not_indexed'),
('/blog/cloudflare-d1-vs-kv/', 'Cloudflare D1 vs KV — When to Use What | xSoft Blog', 52, 'A practical comparison of Cloudflare D1 (SQLite) and KV (key-value store). When to choose each, performance, and real-world patterns.', 132, 'Cloudflare D1, Cloudflare KV, D1 vs KV, edge database, key-value store, serverless database', 'Article, FAQPage', 1, 1, 1, 1, 'index, follow', 'not_indexed'),
('/privacy/', 'Privacy Policy — xSoft Ltd | How We Protect Your Data', 55, 'Privacy policy for xSoft Ltd and all services operated under xSoft. GDPR compliant. We collect minimal data and never sell your information.', 140, 'privacy policy, xSoft, GDPR, data protection', 'WebPage', 0, 1, 1, 1, 'index, follow', 'not_indexed'),
('/terms/', 'Terms of Service — xSoft Ltd | Development Agreements', 55, 'Terms and conditions for using xSoft Ltd services and websites. Clear, fair terms for software development engagements.', 120, 'terms of service, xSoft, software development terms, consultancy agreement', 'WebPage', 0, 1, 1, 1, 'index, follow', 'not_indexed');
