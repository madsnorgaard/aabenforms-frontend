import { defineEventHandler, setHeader } from 'h3'

const SITE_URL = 'https://aabenforms.dk'

interface SitemapEntry {
  loc: string
  lastmod: string
  changefreq: string
  priority: string
  alternates?: { lang: string; href: string }[]
}

function buildSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries.map((entry) => {
    const alternateLinks = entry.alternates
      ?.map(
        (alt) =>
          `    <xhtml:link rel="alternate" hreflang="${alt.lang}" href="${alt.href}" />`
      )
      .join('\n')

    return `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
${alternateLinks || ''}
  </url>`
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`
}

export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=3600, s-maxage=3600')

  const today = new Date().toISOString().split('T')[0]

  const staticPages: { path: string; changefreq: string; priority: string }[] = [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/demo', changefreq: 'weekly', priority: '0.9' },
    { path: '/demo/byggetilladelse', changefreq: 'monthly', priority: '0.8' },
    { path: '/demo/merudgifter', changefreq: 'monthly', priority: '0.8' },
    { path: '/demo/skoleskift', changefreq: 'monthly', priority: '0.8' },
    { path: '/demo/klage', changefreq: 'monthly', priority: '0.8' },
    { path: '/demo/klage-fuldmagt', changefreq: 'monthly', priority: '0.8' },
    { path: '/demo/sygedagpenge', changefreq: 'monthly', priority: '0.8' },
    { path: '/kontakt', changefreq: 'yearly', priority: '0.6' },
    { path: '/tilgaengelighed', changefreq: 'monthly', priority: '0.4' },
    { path: '/cookies', changefreq: 'yearly', priority: '0.3' },
  ]

  const entries: SitemapEntry[] = staticPages.map((page) => ({
    loc: `${SITE_URL}${page.path === '/' ? '' : page.path}`,
    lastmod: today,
    changefreq: page.changefreq,
    priority: page.priority,
    alternates: [
      { lang: 'da', href: `${SITE_URL}${page.path === '/' ? '' : page.path}` },
      { lang: 'en', href: `${SITE_URL}/en${page.path === '/' ? '' : page.path}` },
      { lang: 'x-default', href: `${SITE_URL}${page.path === '/' ? '' : page.path}` },
    ],
  }))

  return buildSitemapXml(entries)
})
