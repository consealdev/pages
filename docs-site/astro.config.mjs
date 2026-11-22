// The Conseal docs as a Starlight site, served at conseal.dev/docs, beside the home page in
// ../www.

import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// OpenPanel's visit counter is added only when the build has a client id: the OPENPANEL_CLIENT_ID repository variable
// in CI. The same files go to pre.conseal.dev and conseal.dev, so www/assets/js/analytics.js counts visits to
// conseal.dev only. The home page loads the same file (.github/assemble-site.sh).
const openpanelClientId = process.env.OPENPANEL_CLIENT_ID;

export default defineConfig({
    site: 'https://conseal.dev',
    base: '/docs',
    integrations: [
        starlight({
            title: 'Conseal Docs',
            description: 'Guides and reference for Conseal: end-to-end encrypted sync and sharing for web apps, with a crypto core, a sync engine and an ASP.NET Core backend.',
            favicon: '/favicon.ico',
            head: openpanelClientId
                ? [
                    {
                        tag: 'script',
                        attrs: {
                            defer: true,
                            src: '/assets/js/analytics.js',
                            'data-client-id': openpanelClientId,
                        },
                    },
                ]
                : [],
            // The header, frame, title and theme toggle of the other product docs (lpdf.io, authstack.id)
            components: {
                Head: './src/components/head.astro',
                Header: './src/components/header.astro',
                PageFrame: './src/components/page-frame.astro',
                SiteTitle: './src/components/site-title.astro',
                ThemeProvider: './src/components/theme-provider.astro',
                ThemeSelect: './src/components/theme-toggle.astro',
            },
            customCss: ['./src/styles/docs.css'],
            // A folder of pages is a group: add a markdown file to one and it joins the sidebar
            sidebar: [
                { label: 'Getting Started', items: [{ autogenerate: { directory: 'start' } }] },
                { label: 'Concepts', items: [{ autogenerate: { directory: 'concepts' } }] },
                { label: 'TypeScript', items: [{ autogenerate: { directory: 'core' } }] },
                { label: 'Sync', items: [{ autogenerate: { directory: 'sync' } }] },
                { label: 'UI components', items: [{ autogenerate: { directory: 'ui' } }] },
                { label: '.NET backend', items: [{ autogenerate: { directory: 'dotnet' } }] },
                { label: 'API', items: [{ autogenerate: { directory: 'api' } }] },
                { label: 'Security', items: [{ autogenerate: { directory: 'security' } }] },
            ],
        }),
    ],
});
