import { getCollection } from 'astro:content';
import { compareReleaseEntries } from '../../lib/content';

const escapeXml = (value = '') => value.replace(/[<>&'\"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char]);

export async function GET({ site }) {
  const base = import.meta.env.BASE_URL;
  const releases = (await getCollection('docs'))
    .filter((entry) => entry.data.contentType === 'changelog-release' && !entry.data.draft)
    .sort(compareReleaseEntries);
  const origin = site || new URL('https://blade-hq.github.io');
  const items = releases.map((release) => {
    const url = new URL(`${base}${release.id.replace(/index$/, '')}`, origin).href;
    const flags = [release.data.channel === 'stable' ? '正式版' : '预发布', release.data.breaking ? '破坏性变更' : ''].filter(Boolean).join(' · ');
    return `<item><title>${escapeXml(`${release.data.title} · ${flags}`)}</title><link>${url}</link><guid>${url}</guid><pubDate>${release.data.date?.toUTCString()}</pubDate><description>${escapeXml(release.data.summary || release.data.description || '')}</description></item>`;
  }).join('');
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Blade Agent 更新日志</title><link>${new URL(`${base}changelog/`, origin).href}</link><description>Blade Agent 正式版与预发布版本</description><language>zh-CN</language>${items}</channel></rss>`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
