import { getCollection } from 'astro:content';

const escapeXml = (value = '') => value.replace(/[<>&'\"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char]);

export async function GET({ site }) {
  const base = import.meta.env.BASE_URL;
  const posts = (await getCollection('docs'))
    .filter((entry) => entry.data.contentType === 'blog-post' && !entry.data.draft)
    .sort((a, b) => (b.data.date?.getTime() || 0) - (a.data.date?.getTime() || 0));
  const origin = site || new URL('https://blade-hq.github.io');
  const items = posts.map((post) => {
    const url = new URL(`${base}${post.id.replace(/index$/, '')}`, origin).href;
    return `<item><title>${escapeXml(post.data.title)}</title><link>${url}</link><guid>${url}</guid><pubDate>${post.data.date?.toUTCString()}</pubDate><description>${escapeXml(post.data.summary || post.data.description || '')}</description></item>`;
  }).join('');
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Blade Agent Blog</title><link>${new URL(`${base}blog/`, origin).href}</link><description>Blade Agent 的设计决策与工程实现</description><language>zh-CN</language>${items}</channel></rss>`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
