// Fills the license page of the assembled site: www/content/COMMERCIAL-LICENSE.md, as HTML, into <output>/license/index.html,
// where the page has `<!-- license -->`. The page's text is the license's own, so it can't drift from the copies in
// conseal-js and conseal-dotnet, and it is in the HTML for readers and crawlers that run no script.
//
// Usage: node docs-site/scripts/render-license.mjs <output-dir>   (run from the repository root, after the pages are copied)

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { marked } from 'marked';

const MARKER = '<!-- license -->';

const output = process.argv[2];
if (!output)
{
    console.error('usage: render-license.mjs <output-dir>');
    process.exit(2);
}

const pagePath = join(output, 'license', 'index.html');
const page = await readFile(pagePath, 'utf8');
if (!page.includes(MARKER))
{
    throw new Error(`${pagePath} has no ${MARKER} to fill`);
}

const license = marked.parse(await readFile('www/content/COMMERCIAL-LICENSE.md', 'utf8'), { gfm: true, async: false });
const lead = marked.parse(await readFile('www/content/license-lead.md', 'utf8'), { gfm: true, async: false });

// The license opens with a title and two lines, its copyright and its contact, and then a `---`. The page's styles take
// those two lines as two paragraphs, and markdown makes them one.
const rule = license.indexOf('<hr>');
const lines = /<p>([^]*?)\n([^]*?)<\/p>/;
if (rule < 0 || !lines.test(license.slice(0, rule)))
{
    throw new Error('COMMERCIAL-LICENSE.md no longer opens with a title, two lines and a `---`: say how the page takes them');
}
const masthead = license.slice(0, rule).replace(lines, (match, copyright, contact) => `<p>${copyright}</p>\n<p>${contact}</p>`);

// The lead goes after the opening paragraph, the one that names the AGPL. The page's own styles draw the rule above each
// section, so the `---` rules of the source are dropped.
const opening = /^(<p>[^]*?<\/p>)/;
const body = license.slice(rule).replace(/<hr>\s*/g, '');
if (!opening.test(body))
{
    throw new Error('COMMERCIAL-LICENSE.md no longer opens with a paragraph after its first `---`: say where the lead goes');
}
const html = masthead + body.replace(opening, match => `${match}\n${lead}`);

await writeFile(pagePath, page.replace(MARKER, () => html));
console.log(`Rendered the license into ${pagePath}`);
