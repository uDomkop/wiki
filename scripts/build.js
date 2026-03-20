const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const PAGES_DIR = path.join(__dirname, '..', 'pages');
const DOCS_DIR = path.join(__dirname, '..', 'docs');

// GitHub-like HTML template
function pageTemplate(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.1/github-markdown.min.css">
  <style>
    body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: 980px;
      margin: 0 auto;
      padding: 45px;
      background-color: #ffffff;
      color: #1f2328;
    }
    @media (prefers-color-scheme: dark) {
      body { background-color: #0d1117; color: #e6edf3; }
    }
    @media (max-width: 767px) {
      body { padding: 15px; }
    }
    .back-link {
      display: inline-block;
      margin-bottom: 24px;
      color: #0969da;
      text-decoration: none;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      font-size: 14px;
    }
    .back-link:hover { text-decoration: underline; }
    @media (prefers-color-scheme: dark) {
      .back-link { color: #58a6ff; }
    }
  </style>
</head>
<body>
  <a class="back-link" href="index.html">← Back to index</a>
  <article class="markdown-body">
    ${body}
  </article>
</body>
</html>`;
}

function indexTemplate(intro, links) {
  const listItems = links
    .map(({ title, file }) => `    <li><a href="${file}">${escapeHtml(title)}</a></li>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wiki</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.1/github-markdown.min.css">
  <style>
    body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: 980px;
      margin: 0 auto;
      padding: 45px;
      background-color: #ffffff;
      color: #1f2328;
    }
    @media (prefers-color-scheme: dark) {
      body { background-color: #0d1117; color: #e6edf3; }
    }
    @media (max-width: 767px) {
      body { padding: 15px; }
    }
  </style>
</head>
<body>
  <article class="markdown-body">
    ${intro}
    <h2>Pages</h2>
    <ul>
${listItems}
    </ul>
  </article>
</body>
</html>`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugify(name) {
  // Replace spaces and special chars with hyphens, keep it readable
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

fs.mkdirSync(DOCS_DIR, { recursive: true });

const INDEX_FILE = 'index.md';
const mdFiles = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.md') && f !== INDEX_FILE);
const pages = [];

for (const mdFile of mdFiles) {
  const title = path.basename(mdFile, '.md');
  const slug = slugify(title);
  const htmlFile = slug + '.html';

  const mdContent = fs.readFileSync(path.join(PAGES_DIR, mdFile), 'utf8');
  const htmlBody = marked(mdContent);
  const html = pageTemplate(title, htmlBody);

  fs.writeFileSync(path.join(DOCS_DIR, htmlFile), html, 'utf8');
  pages.push({ title, file: htmlFile });
  console.log(`  ${mdFile} → docs/${htmlFile}`);
}

// Sort pages alphabetically
pages.sort((a, b) => a.title.localeCompare(b.title));

// Render index.md as intro if it exists
const indexMdPath = path.join(PAGES_DIR, INDEX_FILE);
const intro = fs.existsSync(indexMdPath)
  ? marked(fs.readFileSync(indexMdPath, 'utf8'))
  : '';

fs.writeFileSync(path.join(DOCS_DIR, 'index.html'), indexTemplate(intro, pages), 'utf8');
console.log(`  → docs/index.html (${pages.length} pages)`);
