/**
 * Build a standalone, searchable HTML version of docs/API.md.
 *
 * Usage: pnpm docs:api
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { marked } from 'marked';

const sourcePath = new URL('../docs/API.md', import.meta.url);
const outputPath = new URL('../docs/api.html', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const version = pkg.version || '0.0.0';

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const decodeEntities = (value) =>
  String(value)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");

const stripTags = (value) => value.replace(/<[^>]+>/g, '');

const markdown = readFileSync(sourcePath, 'utf8');
let html = marked.parse(markdown, { gfm: true, breaks: false });

// marked percent-encodes non-ASCII fragments; our heading ids are raw UTF-8,
// so decode them back and re-escape quotes for attribute safety.
html = html.replace(/href="#([^"]*)"/g, (match, fragment) => {
  try {
    return `href="#${escapeHtml(decodeURIComponent(fragment))}"`;
  } catch {
    return match;
  }
});

// Assign GitHub-compatible slugs to h2/h3 and collect the table of contents.
// The Markdown links in API.md use the same slug format, so in-page anchors
// keep working in the generated HTML.
const usedSlugs = new Map();
const makeSlug = (text) => {
  let base = text
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
  if (!base) base = 'section';
  const count = usedSlugs.get(base) ?? 0;
  usedSlugs.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
};

const toc = [];
html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_match, level, inner) => {
  const text = decodeEntities(stripTags(inner)).trim();
  const id = makeSlug(text);
  toc.push({ id, level: Number(level), text });
  const anchor = `<a class="anchor" href="#${id}" aria-hidden="true">#</a>`;
  return `<h${level} id="${id}">${inner}${anchor}</h${level}>`;
});

const tocHtml = toc
  .map(
    (item) =>
      `<a class="toc-link level-${item.level}" href="#${item.id}" data-text="${escapeHtml(
        item.text.toLowerCase()
      )}">${escapeHtml(item.text)}</a>`
  )
  .join('\n');

const page = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>vecbridge API 参考</title>
<style>
  :root {
    color-scheme: light;
    --bg: #ffffff;
    --bg-soft: #f7f8fa;
    --bg-code: #0f172a;
    --fg: #1f2937;
    --fg-soft: #5b6675;
    --border: #e5e8ec;
    --accent: #2563eb;
    --accent-soft: #eff4ff;
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--fg);
    font: 15px/1.75 "Microsoft YaHei", "PingFang SC", system-ui, -apple-system, sans-serif;
  }
  .layout { display: flex; min-height: 100vh; }

  /* Sidebar */
  .sidebar {
    position: sticky;
    top: 0;
    align-self: flex-start;
    width: 300px;
    height: 100vh;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border);
    background: var(--bg-soft);
  }
  .brand {
    display: flex; align-items: baseline; gap: 8px;
    padding: 20px 20px 12px;
  }
  .brand .logo { font-size: 18px; font-weight: 700; letter-spacing: -.02em; }
  .brand .ver {
    font-size: 11px; color: var(--fg-soft);
    border: 1px solid var(--border); border-radius: 999px; padding: 1px 7px;
    background: #fff;
  }
  .side-links {
    display: flex; flex-wrap: wrap; gap: 6px;
    padding: 0 16px 12px;
  }
  .side-links a {
    font-size: 12px; font-weight: 500;
    color: var(--accent); background: #fff;
    border: 1px solid var(--border); border-radius: 6px;
    padding: 3px 9px; text-decoration: none;
  }
  .side-links a:hover { background: var(--accent-soft); border-color: #bfdbfe; }
  .search-wrap { padding: 0 16px 12px; }
  #search {
    width: 100%; padding: 8px 11px;
    border: 1px solid var(--border); border-radius: 8px;
    font: inherit; font-size: 13px; color: var(--fg);
    background: #fff; outline: none;
  }
  #search:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
  nav#toc { flex: 1; overflow-y: auto; padding: 4px 12px 24px; }
  .toc-link {
    display: block;
    padding: 5px 10px;
    border-radius: 6px;
    color: var(--fg-soft);
    text-decoration: none;
    font-size: 13px;
    line-height: 1.5;
    border-left: 2px solid transparent;
  }
  .toc-link:hover { background: #eef1f6; color: var(--fg); }
  .toc-link.level-2 { font-weight: 600; color: var(--fg); margin-top: 6px; }
  .toc-link.level-3 { padding-left: 22px; font-size: 12.5px; }
  .toc-link.active { background: var(--accent-soft); color: var(--accent); border-left-color: var(--accent); }
  .toc-empty { padding: 12px; font-size: 12px; color: var(--fg-soft); }

  /* Content */
  .content { flex: 1; min-width: 0; }
  article { max-width: 920px; margin: 0 auto; padding: 36px 44px 120px; }
  article h1 {
    font-size: 30px; line-height: 1.3; margin: 0 0 18px;
    letter-spacing: -.02em;
  }
  article h2 {
    font-size: 22px; margin: 52px 0 16px; padding-bottom: 8px;
    border-bottom: 1px solid var(--border); scroll-margin-top: 20px;
  }
  article h3 {
    font-size: 17px; margin: 32px 0 12px; padding-left: 10px;
    border-left: 3px solid var(--accent); scroll-margin-top: 20px;
  }
  article h4 { font-size: 15px; margin: 24px 0 10px; }
  article p { margin: 12px 0; }
  article a { color: var(--accent); text-decoration: none; }
  article a:hover { text-decoration: underline; }
  article .anchor {
    margin-left: 8px; color: var(--border); font-weight: 400;
    opacity: 0; transition: opacity .15s;
  }
  article h2:hover .anchor, article h3:hover .anchor { opacity: 1; }
  article ul, article ol { padding-left: 26px; margin: 12px 0; }
  article li { margin: 5px 0; }
  article blockquote {
    margin: 16px 0; padding: 10px 16px;
    border-left: 3px solid #f0b429; background: #fffaf0;
    color: #6b5320; border-radius: 0 6px 6px 0;
  }
  article blockquote p { margin: 4px 0; }
  article code {
    font-family: "Cascadia Code", "JetBrains Mono", Consolas, monospace;
    font-size: .88em;
    background: #eef2f7; color: #b42318;
    padding: .12em .38em; border-radius: 4px;
    word-break: break-word;
  }
  article pre {
    margin: 16px 0; padding: 16px 18px;
    background: var(--bg-code); color: #e2e8f0;
    border-radius: 10px; overflow-x: auto;
    font-size: 13px; line-height: 1.65;
  }
  article pre code {
    background: none; color: inherit; padding: 0;
    font-size: inherit; word-break: normal;
  }
  article table {
    width: 100%; border-collapse: collapse; margin: 16px 0;
    font-size: 13.5px; display: block; overflow-x: auto;
  }
  article th, article td {
    border: 1px solid var(--border);
    padding: 8px 11px; text-align: left; vertical-align: top;
  }
  article th { background: var(--bg-soft); font-weight: 600; white-space: nowrap; }
  article tr:nth-child(even) td { background: #fcfcfd; }
  article hr { border: none; border-top: 1px solid var(--border); margin: 36px 0; }
  article img { max-width: 100%; }

  .top-btn {
    position: fixed; right: 28px; bottom: 28px;
    width: 40px; height: 40px; border-radius: 50%;
    border: 1px solid var(--border); background: #fff; color: var(--fg-soft);
    cursor: pointer; font-size: 16px; box-shadow: 0 4px 14px rgba(15, 23, 42, .08);
    display: none;
  }
  .top-btn.show { display: block; }

  @media (max-width: 940px) {
    .sidebar { display: none; }
    article { padding: 24px 20px 80px; }
    article h1 { font-size: 24px; }
  }
</style>
</head>
<body>
<div class="layout">
  <aside class="sidebar">
    <div class="brand">
      <span class="logo">vecbridge</span>
      <span class="ver">API · v${escapeHtml(version)}</span>
    </div>
    <div class="side-links">
      <a href="../examples/playground.html">在线工作台</a>
      <a href="../examples/browser-demo.html">API 示例</a>
      <a href="../dist/vecbridge.global.js">global.js</a>
      <a href="https://github.com/ivwv/vecbridge" target="_blank" rel="noopener">GitHub</a>
    </div>
    <div class="search-wrap">
      <input id="search" type="search" placeholder="搜索类 / 方法 / 选项…" autocomplete="off" />
    </div>
    <nav id="toc">
      ${tocHtml}
      <div class="toc-empty" id="tocEmpty" style="display:none">没有匹配的条目</div>
    </nav>
  </aside>
  <main class="content">
    <article id="doc">
${html}
    </article>
  </main>
</div>
<button class="top-btn" id="topBtn" title="回到顶部">↑</button>
<script>
(() => {
  const search = document.getElementById('search');
  const links = Array.from(document.querySelectorAll('.toc-link'));
  const empty = document.getElementById('tocEmpty');

  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    let visible = 0;
    for (const link of links) {
      const hit = !q || link.dataset.text.includes(q);
      link.style.display = hit ? '' : 'none';
      if (hit) visible++;
    }
    empty.style.display = visible === 0 ? '' : 'none';
  });

  // Highlight the section currently in view.
  const byId = new Map(links.map((link) => [link.getAttribute('href').slice(1), link]));
  const headings = Array.from(document.querySelectorAll('article h2[id], article h3[id]'));
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const link of links) link.classList.remove('active');
        const active = byId.get(entry.target.id);
        if (active) {
          active.classList.add('active');
          active.scrollIntoView({ block: 'nearest' });
        }
        break;
      }
    },
    { rootMargin: '0px 0px -75% 0px', threshold: 0 }
  );
  headings.forEach((heading) => observer.observe(heading));

  const topBtn = document.getElementById('topBtn');
  window.addEventListener('scroll', () => {
    topBtn.classList.toggle('show', window.scrollY > 600);
  });
  topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();
</script>
</body>
</html>
`;

mkdirSync(new URL('../docs/', import.meta.url), { recursive: true });
writeFileSync(outputPath, page);

const paragraphs = (html.match(/<p>/g) || []).length;
console.log(
  `docs/api.html written (${(page.length / 1024).toFixed(1)} kB, ${toc.length} headings, ${paragraphs} paragraphs)`
);
