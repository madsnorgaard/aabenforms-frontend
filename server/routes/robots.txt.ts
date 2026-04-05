import { defineEventHandler, setHeader } from 'h3'

export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'text/plain')

  return `User-agent: *
Allow: /
Disallow: /auth/
Disallow: /workflows/
Disallow: /workflow-status/
Disallow: /api/

Sitemap: https://aabenforms.dk/sitemap.xml`
})
