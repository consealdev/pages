// Writes the Security group of the docs from threat-model.md in the umbrella repo (consealdev/conseal), one page for each
// layer, so the model has one source. The pages are generated: change the model there, then run this again.
//
// Usage, from docs-site:  node scripts/split-threat-model.mjs <path to threat-model.md>
//
// What it changes in the text: a section's own heading becomes its page's title, the headings under it move up a level,
// each "§4.3" becomes a link to the page and heading it names, a relative link (to spec/) points at the repo on GitHub,
// and the product's name is capitalised in prose.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import GithubSlugger from 'github-slugger';

const [sourcePath] = process.argv.slice(2);
if (!sourcePath)
{
    console.error('usage: node scripts/split-threat-model.mjs <path to threat-model.md>');
    process.exit(2);
}

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/content/docs/security');
const BASE = '/docs/security';
const REPO_URL = 'https://github.com/consealdev/conseal';
const MODEL_URL = `${REPO_URL}/blob/main/threat-model.md`;

// The sections each page holds, and how it is shown. A title is at most 45 characters and a description 120 to 160.
const PAGES = [
    { name: 'threat-model', sections: [1, 2], title: 'Threat model', label: 'Overview',
        description: 'What Conseal protects, against whom, and what it relies on: how the system is built, the assets it guards, and who is trusted with what.' },
    { name: 'keys', sections: [3], title: 'Threat model: keys and wrapping', label: 'Keys and wrapping',
        description: 'What Conseal\'s key wrapping stops: a malicious server, offline brute force on a stolen wrapped key, tampering, a network attacker and a leaking library.' },
    { name: 'circle', sections: [4], title: 'Threat model: the circle', label: 'The circle',
        description: 'What the circle\'s join ceremony enforces and relies on: the core\'s checks, what CircleClient adds, the core without it, and what the server holds and refuses.' },
    { name: 'channels', sections: [5], title: 'Threat model: channels', label: 'Channels',
        description: 'What a channel enforces and relies on when users share a key, what the server holds, and what the server still learns about members and activity.' },
    { name: 'sync', sections: [6], title: 'Threat model: sync', label: 'Sync',
        description: 'What the sync envelope and SyncEngine enforce for records moving between devices, what a dishonest server can still do, and what sync relies on.' },
    { name: 'identity', sections: [7], title: 'Threat model: the identity', label: 'The identity',
        description: 'How every device in a circle shares one ECDH and ECDSA key pair through the keyring record, what SyncEngine enforces about it, and what it relies on.' },
    { name: 'blobs', sections: [8], title: 'Threat model: blobs', label: 'Blobs',
        description: 'How blobs carry content too large for a record, with a key of their own and presigned URLs to object storage, and what SyncEngine enforces for them.' },
    { name: 'export-import', sections: [9], title: 'Threat model: export and import', label: 'Export and import',
        description: 'What exportAll and importAll enforce when the user keeps a copy of their data, which holds content and never keys, and what the two rely on.' },
    { name: 'server-knowledge', sections: [10], title: 'Threat model: what the server learns', label: 'What the server learns',
        description: 'What a server that follows the contract still learns although it can\'t read the content: the shape of the activity around the sealed data.' },
    { name: 'limits', sections: [11], title: 'Threat model: what is not protected', label: 'What is not protected',
        description: 'What Conseal doesn\'t protect against: cross-site scripting, a compromised server that serves the code, side channels, and keys held in JavaScript memory.' },
    { name: 'assumptions', sections: [12], title: 'Threat model: caller assumptions', label: 'Caller assumptions',
        description: 'The model holds only if the app meets these assumptions, such as HTTPS and a strict Content Security Policy, and each row says what breaks if it does not.' },
    { name: 'out-of-scope', sections: [13, 14], title: 'Threat model: scope and reporting', label: 'Scope and reporting',
        description: 'What is deliberately outside Conseal, such as transport security, authentication, access control and availability, and how to report a security issue.' },
];

const lines = fs.readFileSync(sourcePath, 'utf8').replace(/\r\n/g, '\n').split('\n');

// Cut the text into the preamble and the numbered sections
const starts = [];
lines.forEach((line, index) => { const match = /^## (\d+)\. /.exec(line); if (match) starts.push({ number: Number(match[1]), index }); });
const preamble = lines.slice(0, starts[0].index);
const sections = new Map();
starts.forEach((start, position) =>
{
    const end = position + 1 < starts.length ? starts[position + 1].index : lines.length;
    const body = lines.slice(start.index, end);
    while (body.length && (body[body.length - 1].trim() === '' || body[body.length - 1].trim() === '---')) body.pop();
    sections.set(start.number, body);
});
for (const page of PAGES) for (const number of page.sections) if (!sections.has(number)) throw new Error(`section ${number} is not in ${sourcePath}`);
const covered = new Set(PAGES.flatMap(page => page.sections));
for (const number of sections.keys()) if (!covered.has(number)) throw new Error(`section ${number} is in no page`);

// A page with one section gives its heading to the title and moves the headings under it up a level. A page with
// several keeps their headings.
function pageLines(page)
{
    if (page.sections.length > 1) return page.sections.flatMap((number, position) => [...(position ? [''] : []), ...sections.get(number)]);
    const [, ...rest] = sections.get(page.sections[0]);
    return rest.map(line => (/^#{3,6} /.test(line) ? line.slice(1) : line));
}

// Where each "N.M" subsection and each "N" section ends up
const targets = new Map();
const built = PAGES.map(page =>
{
    const body = page.name === 'threat-model' ? [...preambleBody(), '', ...pageLines(page)] : pageLines(page);
    const slugger = new GithubSlugger();
    for (const line of body)
    {
        const heading = /^(#{2,6}) (.*)$/.exec(line);
        if (!heading) continue;
        const text = heading[2];
        const slug = slugger.slug(text);
        const sub = /^(\d+\.\d+) /.exec(text);
        const top = /^(\d+)\. /.exec(text);
        if (sub) targets.set(sub[1], `${BASE}/${page.name}/#${slug}`);
        else if (top) targets.set(top[1], `${BASE}/${page.name}/#${slug}`);
    }
    for (const number of page.sections) if (!targets.has(String(number))) targets.set(String(number), `${BASE}/${page.name}/`);
    return { page, body };
});

/** The model's opening: its version, scope and audience, and what it covers. Its title and rule are dropped. */
function preambleBody()
{
    return preamble.filter(line => !/^# /.test(line) && line.trim() !== '---').join('\n').trim().split('\n');
}

let problems = 0;
const relativeLinks = new Set();
fs.mkdirSync(OUT, { recursive: true });
for (const { page, body } of built)
{
    let text = body.join('\n').trim() + '\n';
    text = text.replace(/§(\d+(?:\.\d+)?)/g, (match, number) =>
    {
        const target = targets.get(number);
        if (!target) { console.error(`${page.name}: ${match} names a section the model doesn't have`); problems++; return match; }
        return `[${match}](${target})`;
    });
    // A path in the umbrella repo, such as spec or spec/openapi.yaml, points at that repo on GitHub
    text = text.replace(/\]\(([^)]+)\)/g, (match, target) =>
    {
        if (/^(https?:|#|\/docs\/)/.test(target)) return match;
        if (!/^[\w.-]+(\/[\w.-]+)*$/.test(target)) { relativeLinks.add(target); return match; }
        return `](${REPO_URL}/${path.extname(target) ? 'blob' : 'tree'}/main/${target})`;
    });
    text = text.replace(/(?<![`/@.\w-])conseal(?![\w/.-])/g, 'Conseal');

    const checks = [[page.title.length <= 45, `title ${page.title.length} characters`],
        [page.description.length >= 120 && page.description.length <= 160, `description ${page.description.length} characters`]];
    for (const [ok, what] of checks) if (!ok) { console.error(`${page.name}: ${what}`); problems++; }

    const order = PAGES.indexOf(page);
    const front = `---\ntitle: "${page.title}"\ndescription: "${page.description}"\nsidebar:\n    label: ${page.label}\n    order: ${order}\n---\n\n`;
    const note = `<!-- Generated by docs-site/scripts/split-threat-model.mjs from threat-model.md in consealdev/conseal (${MODEL_URL}). `
        + 'Change the model there and run the script again. -->\n\n';
    fs.writeFileSync(path.join(OUT, `${page.name}.md`), front + note + text);
    console.log(`${page.name.padEnd(17)} sections ${page.sections.join('+').padEnd(6)} ${String(text.split(/\s+/).length).padStart(5)} words`);
}
if (relativeLinks.size) console.error('relative links left:', [...relativeLinks].join(', '));
process.exit(problems || relativeLinks.size ? 1 : 0);
