import { AnimeItem, AnimeDetailData, AnimeEpisodeItem, AnimeBookmarkItem, AnimeWatchHistoryItem, EpisodeDetailData, MirrorQuality, DownloadQuality } from '../types/anime';

const LOUIV_ANIME_API_BASE = 'https://api.louiv.me/api';

export interface AnimeApiResponse<T> {
  success?: boolean;
  results?: T;
  error?: string;
}

/**
 * Clean raw slug from search/list endpoints (e.g. 'one-piece-odmau/ep-1' -> 'one-piece-odmau')
 */
function extractBaseSlug(slugOrPath: string): string {
  if (!slugOrPath) return '';
  const clean = slugOrPath.trim();
  if (clean.includes('/')) {
    return clean.split('/')[0];
  }
  return clean;
}

/**
 * Searches anime via REST API at https://api.louiv.me/api/search
 */
export async function searchAnimeApi(query: string): Promise<AnimeItem[]> {
  const encQuery = encodeURIComponent(query.trim());
  if (!encQuery) return fetchPopularAnime();

  try {
    const res = await fetch(`${LOUIV_ANIME_API_BASE}/search?keyword=${encQuery}`, {
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const json: AnimeApiResponse<any> = await res.json();
      const list = json.results?.data || json.results;
      if (Array.isArray(list)) {
        const results: AnimeItem[] = [];
        const seenSlugs = new Set<string>();

        for (const item of list) {
          const rawSlug = item.slug || (item.animeId ? String(item.animeId) : '');
          const cleanSlug = extractBaseSlug(rawSlug);
          if (cleanSlug && !seenSlugs.has(cleanSlug)) {
            seenSlugs.add(cleanSlug);
            results.push({
              title: item.title || item.japaneseTitle || 'Anime',
              slug: cleanSlug,
              image_url: item.poster || '',
              status: item.status || 'Ongoing',
              type: item.type || 'TV',
              rating: item.rating || item.malScore || '8.5',
              genres: Array.isArray(item.genres)
                ? item.genres.map((g: any) => ({
                    title: typeof g === 'string' ? g : g.title || g.name || '',
                    slug: (typeof g === 'string' ? g : g.slug || g.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                  }))
                : [],
            });
          }
        }

        if (results.length > 0) {
          return results;
        }
      }
    }
  } catch (e) {
    console.warn('Search anime error:', e);
  }

  return [];
}

/**
 * Curated list of popular anime search terms
 */
export const POPULAR_ANIME_SEARCHES = [
  'one piece',
  'jujutsu',
  'kimetsu',
  'bleach',
  'slime',
  'naruto',
  'solo leveling',
  'chainsaw',
  'youkoso',
  'kaiju',
  'spy x family',
];

/**
 * Fetches popular/trending anime from /most-popular, /trending, and homepage
 */
export async function fetchPopularAnime(): Promise<AnimeItem[]> {
  const combined: AnimeItem[] = [];
  const seenSlugs = new Set<string>();

  const processAnimeList = (list: any[], defaultType = 'TV') => {
    if (!Array.isArray(list)) return;
    for (const item of list) {
      const rawSlug = item.slug || (item.animeId ? String(item.animeId) : '');
      const cleanSlug = extractBaseSlug(rawSlug);
      if (cleanSlug && !seenSlugs.has(cleanSlug)) {
        seenSlugs.add(cleanSlug);
        combined.push({
          title: item.title || item.japaneseTitle || 'Anime',
          slug: cleanSlug,
          image_url: item.poster || '',
          status: item.status || 'Ongoing',
          type: item.type || defaultType,
          rating: item.rating || item.malScore || '8.5',
          genres: Array.isArray(item.genres)
            ? item.genres.map((g: any) => ({
                title: typeof g === 'string' ? g : g.title || g.name || '',
                slug: (typeof g === 'string' ? g : g.slug || g.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              }))
            : [],
        });
      }
    }
  };

  const [mostPopularRes, trendingRes, homeRes] = await Promise.allSettled([
    fetch(`${LOUIV_ANIME_API_BASE}/most-popular`, { headers: { Accept: 'application/json' } }),
    fetch(`${LOUIV_ANIME_API_BASE}/trending`, { headers: { Accept: 'application/json' } }),
    fetch(`${LOUIV_ANIME_API_BASE}/`, { headers: { Accept: 'application/json' } }),
  ]);

  if (mostPopularRes.status === 'fulfilled' && mostPopularRes.value.ok) {
    try {
      const json = await mostPopularRes.value.json();
      processAnimeList(json.results?.data || json.results);
    } catch (e) {
      console.warn('Error parsing most-popular:', e);
    }
  }

  if (trendingRes.status === 'fulfilled' && trendingRes.value.ok) {
    try {
      const json = await trendingRes.value.json();
      processAnimeList(json.results?.data || json.results);
    } catch (e) {
      console.warn('Error parsing trending:', e);
    }
  }

  if (homeRes.status === 'fulfilled' && homeRes.value.ok) {
    try {
      const json = await homeRes.value.json();
      if (json.results?.spotlights) processAnimeList(json.results.spotlights);
      if (json.results?.trending) processAnimeList(json.results.trending);
    } catch (e) {
      console.warn('Error parsing homepage spotlights:', e);
    }
  }

  if (combined.length > 0) {
    return combined;
  }

  // Fallback search
  return searchAnimeApi('one piece');
}

/**
 * Fetches ongoing/latest releases from /new-release and /latest-updated
 */
export async function fetchOngoingAnime(): Promise<AnimeItem[]> {
  const result: AnimeItem[] = [];
  const seenSlugs = new Set<string>();

  const processReleaseList = (list: any[]) => {
    if (!Array.isArray(list)) return;
    for (const item of list) {
      const rawSlug = item.slug || (item.animeId ? String(item.animeId) : '');
      const cleanSlug = extractBaseSlug(rawSlug);
      if (cleanSlug && !seenSlugs.has(cleanSlug)) {
        seenSlugs.add(cleanSlug);
        result.push({
          title: item.title || item.japaneseTitle || 'Anime',
          slug: cleanSlug,
          image_url: item.poster || '',
          status: 'Ongoing',
          type: item.type || 'TV',
          rating: item.rating || '8.5',
          episode_count: item.sub ? `Ep ${item.sub}` : undefined,
          genres: [],
        });
      }
    }
  };

  const [newReleaseRes, latestUpdatedRes] = await Promise.allSettled([
    fetch(`${LOUIV_ANIME_API_BASE}/new-release`, { headers: { Accept: 'application/json' } }),
    fetch(`${LOUIV_ANIME_API_BASE}/latest-updated`, { headers: { Accept: 'application/json' } }),
  ]);

  if (newReleaseRes.status === 'fulfilled' && newReleaseRes.value.ok) {
    try {
      const json = await newReleaseRes.value.json();
      processReleaseList(json.results?.data || json.results);
    } catch (e) {
      console.warn('Error parsing new-release:', e);
    }
  }

  if (latestUpdatedRes.status === 'fulfilled' && latestUpdatedRes.value.ok) {
    try {
      const json = await latestUpdatedRes.value.json();
      processReleaseList(json.results?.data || json.results);
    } catch (e) {
      console.warn('Error parsing latest-updated:', e);
    }
  }

  if (result.length > 0) {
    return result;
  }

  return fetchPopularAnime();
}

/**
 * Generates fallback episodes if episode list is missing
 */
export function generateEpisodesFromTitle(item: AnimeItem): AnimeEpisodeItem[] {
  const episodes: AnimeEpisodeItem[] = [];
  const title = item.title;

  const matchRange = title.match(/Episode\s+(\d+)\s*[–\-]\s*(\d+)/i);
  let totalEp = 12;

  if (matchRange) {
    const endEp = parseInt(matchRange[2], 10);
    if (!isNaN(endEp) && endEp > 0) {
      totalEp = Math.min(endEp, 1000);
    }
  } else {
    const matchSingle = title.match(/Episode\s+(\d+)/i);
    if (matchSingle) {
      const epNum = parseInt(matchSingle[1], 10);
      if (!isNaN(epNum)) totalEp = epNum;
    } else if (item.status?.toLowerCase().includes('ongoing')) {
      totalEp = 24;
    }
  }

  for (let i = totalEp; i >= 1; i--) {
    episodes.push({
      title: `Episode ${i}`,
      slug: `${item.slug}-episode-${i}`,
      episode_number: i,
    });
  }

  return episodes;
}

/**
 * Gets detailed anime info & episode list from /info and /episodes
 */
export async function fetchAnimeDetailApi(item: AnimeItem): Promise<AnimeDetailData> {
  const cleanSlug = extractBaseSlug(item.slug);

  let infoData: any = null;
  let animeId = '';

  // 1. Fetch Anime Info
  try {
    const infoRes = await fetch(`${LOUIV_ANIME_API_BASE}/info?id=${encodeURIComponent(cleanSlug)}`, {
      headers: { Accept: 'application/json' },
    });
    if (infoRes.ok) {
      const json = await infoRes.json();
      infoData = json.results;
      if (infoData?.animeId) {
        animeId = String(infoData.animeId);
      }
    }
  } catch (e) {
    console.warn(`Info fetch error for ${cleanSlug}:`, e);
  }

  // 2. Fetch Episodes List
  let episodes: AnimeEpisodeItem[] = [];
  const epFetchId = animeId || cleanSlug;

  try {
    const epRes = await fetch(`${LOUIV_ANIME_API_BASE}/episodes/${encodeURIComponent(epFetchId)}`, {
      headers: { Accept: 'application/json' },
    });
    if (epRes.ok) {
      const json = await epRes.json();
      const rawEpisodes = json.results?.episodes;
      if (Array.isArray(rawEpisodes) && rawEpisodes.length > 0) {
        episodes = rawEpisodes.map((ep: any, idx: number) => {
          const epNo = ep.episode_no || idx + 1;
          const serverIds = ep.server_ids || '';
          const epSlug = serverIds
            ? `${cleanSlug}___ep${epNo}___${serverIds}`
            : `${cleanSlug}-episode-${epNo}`;

          return {
            title: ep.title && ep.title.trim() !== '' ? `Episode ${epNo}: ${ep.title}` : `Episode ${epNo}`,
            slug: epSlug,
            episode_number: epNo,
            release_date: ep.timestamp ? new Date(parseInt(ep.timestamp) * 1000).toLocaleDateString('id-ID') : '',
          };
        });
      }
    }
  } catch (e) {
    console.warn(`Episodes fetch error for ${epFetchId}:`, e);
  }

  if (episodes.length === 0) {
    episodes = generateEpisodesFromTitle(item);
  }

  const synopsisText = infoData?.synopsis || `Nonton Anime ${item.title} Subtitle Indonesia gratis full HD di LouiComic.`;

  return {
    title: infoData?.title || item.title,
    slug: cleanSlug,
    japanese_title: infoData?.japaneseTitle || item.title,
    type: infoData?.type || item.type || 'TV',
    status: infoData?.status || item.status || 'Ongoing',
    rating: infoData?.rating || infoData?.malScore || item.rating || '8.5',
    studio: Array.isArray(infoData?.studios) ? infoData.studios.join(', ') : 'Animation Studio',
    release_date: infoData?.aired || '2026',
    synopsis: synopsisText,
    image_url: infoData?.poster || item.image_url,
    genres: Array.isArray(infoData?.genres)
      ? infoData.genres.map((g: any) => ({
          title: typeof g === 'string' ? g : g.title || g.name || '',
          slug: (typeof g === 'string' ? g : g.slug || g.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        }))
      : item.genres || [],
    episodes,
  };
}

/**
 * Fetches episode details including server list and streaming links
 */
export async function fetchEpisodeDetailApi(episodeSlug: string): Promise<EpisodeDetailData | null> {
  let animeSlug = '';
  let epNo = 1;
  let serverIds = '';

  // Check encoded serverIds format: "animeSlug___ep1___serverIds"
  if (episodeSlug.includes('___ep') && episodeSlug.includes('___')) {
    const parts = episodeSlug.split('___');
    if (parts.length >= 3) {
      animeSlug = parts[0];
      const epPart = parts[1].replace('ep', '');
      epNo = parseInt(epPart, 10) || 1;
      serverIds = parts.slice(2).join('___');
    }
  } else {
    // Parse from standard slug e.g. "one-piece-odmau-episode-1"
    const match = episodeSlug.match(/^(.*?)(?:-episode-|-ep-)(\d+)$/i);
    if (match) {
      animeSlug = match[1];
      epNo = parseInt(match[2], 10) || 1;
    } else {
      animeSlug = extractBaseSlug(episodeSlug);
    }
  }

  // If serverIds is missing, try looking up serverIds directly via /episodes
  if (!serverIds && animeSlug) {
    try {
      const epRes = await fetch(`${LOUIV_ANIME_API_BASE}/episodes/${encodeURIComponent(animeSlug)}`, {
        headers: { Accept: 'application/json' },
      });
      if (epRes.ok) {
        const epJson = await epRes.json();
        const epList = epJson?.results?.episodes;
        if (Array.isArray(epList)) {
          const targetEp = epList.find((e: any) => e.episode_no === epNo) || epList[0];
          if (targetEp?.server_ids) {
            serverIds = targetEp.server_ids;
          }
        }
      }
    } catch (e) {
      console.warn('Server IDs lookup error:', e);
    }
  }

  // If we have serverIds, fetch available streaming servers from /servers?ids=...
  if (serverIds) {
    try {
      const serversRes = await fetch(`${LOUIV_ANIME_API_BASE}/servers?ids=${encodeURIComponent(serverIds)}`, {
        headers: { Accept: 'application/json' },
      });

      if (serversRes.ok) {
        const serversJson = await serversRes.json();
        const serverList = serversJson.results;

        if (Array.isArray(serverList) && serverList.length > 0) {
          // Fetch stream URL for each server (limit to top 5)
          const providers = await Promise.all(
            serverList.slice(0, 5).map(async (server: any, idx: number) => {
              if (!server.link_id) return null;
              try {
                const streamRes = await fetch(`${LOUIV_ANIME_API_BASE}/stream?id=${encodeURIComponent(server.link_id)}`, {
                  headers: { Accept: 'application/json' },
                });
                if (streamRes.ok) {
                  const streamJson = await streamRes.json();
                  const streamUrl = streamJson.results?.url;
                  if (streamUrl) {
                    return {
                      name: `${server.name || 'Server ' + (idx + 1)} (${(server.type || 'SUB').toUpperCase()})`,
                      data_content: `<iframe src="${streamUrl}"></iframe>`,
                      is_default: idx === 0,
                      streamUrl,
                    };
                  }
                }
              } catch (e) {
                console.warn(`Stream fetch error for server ${server.name}:`, e);
              }
              return null;
            })
          );

          const validProviders = providers.filter(Boolean) as Array<{
            name: string;
            data_content: string;
            is_default: boolean;
            streamUrl: string;
          }>;

          if (validProviders.length > 0) {
            const defaultStreamUrl = validProviders[0].streamUrl;
            const mirrors: MirrorQuality[] = [
              {
                quality: '720p HD',
                providers: validProviders.map((p) => ({
                  name: p.name,
                  data_content: p.data_content,
                  is_default: p.is_default,
                })),
              },
            ];

            // Optional: fetch download links
            const downloads: DownloadQuality[] = [];
            try {
              const dlRes = await fetch(
                `${LOUIV_ANIME_API_BASE}/download?slug=${encodeURIComponent(animeSlug)}&ep=${epNo}`,
                { headers: { Accept: 'application/json' } }
              );
              if (dlRes.ok) {
                const dlJson = await dlRes.json();
                const rawDl = dlJson.results?.downloads;
                if (Array.isArray(rawDl) && rawDl.length > 0) {
                  for (const dlItem of rawDl) {
                    downloads.push({
                      quality: dlItem.quality || 'HD 720p',
                      size: dlItem.size || null,
                      links: Array.isArray(dlItem.links) ? dlItem.links : [],
                    });
                  }
                }
              }
            } catch {
              // Download fetch failed silently
            }

            return {
              title: `Episode ${epNo}`,
              slug: episodeSlug,
              stream_url: defaultStreamUrl,
              mirrors,
              downloads,
              previous_episode: epNo > 1 ? { title: `Episode ${epNo - 1}`, slug: `${animeSlug}-episode-${epNo - 1}` } : null,
              next_episode: { title: `Episode ${epNo + 1}`, slug: `${animeSlug}-episode-${epNo + 1}` },
            };
          }
        }
      }
    } catch (e) {
      console.warn(`Servers fetch error for ${serverIds}:`, e);
    }
  }

  // Fallback return
  return {
    title: `Episode ${epNo}`,
    slug: episodeSlug,
    stream_url: `https://megaplay.buzz/stream/s-5/94736/sub`,
    mirrors: [
      {
        quality: '720p HD',
        providers: [
          {
            name: 'Server Utama (HD)',
            data_content: `<iframe src="https://megaplay.buzz/stream/s-5/94736/sub"></iframe>`,
            is_default: true,
          },
        ],
      },
    ],
    downloads: [],
    previous_episode: epNo > 1 ? { title: `Episode ${epNo - 1}`, slug: `${animeSlug}-episode-${epNo - 1}` } : null,
    next_episode: { title: `Episode ${epNo + 1}`, slug: `${animeSlug}-episode-${epNo + 1}` },
  };
}

/**
 * Helper to extract playable iframe source from data_content or URL
 */
export function extractStreamSrc(dataContentOrUrl: string | null | undefined): string | null {
  if (!dataContentOrUrl) return null;
  const str = dataContentOrUrl.trim();

  // If it's already an HTTP/HTTPS link
  if (str.startsWith('http://') || str.startsWith('https://')) {
    return str;
  }

  // If it contains <iframe ... src="..." ...>
  const srcMatch = str.match(/src=["']([^"']+)["']/i);
  if (srcMatch && srcMatch[1]) {
    return srcMatch[1];
  }

  // Try decoding base64 if it looks like base64
  if (!str.includes('<') && str.length > 20 && !str.includes(' ')) {
    try {
      const decoded = atob(str);
      const decodedSrcMatch = decoded.match(/src=["']([^"']+)["']/i);
      if (decodedSrcMatch && decodedSrcMatch[1]) {
        return decodedSrcMatch[1];
      }
      if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
        return decoded;
      }
    } catch {
      // Not base64
    }
  }

  return null;
}

// LOCAL STORAGE HELPERS FOR ANIME BOOKMARKS & HISTORY
const LS_ANIME_BOOKMARKS_KEY = 'louicomic_anime_bookmarks';
const LS_ANIME_HISTORY_KEY = 'louicomic_anime_history';

export interface AnimeVideoResult {
  url: string;
  type: 'direct' | 'embed';
  availableResolutions: string[];
}

export async function getAnimeVideo(episodeId: string, reso: string = '720p'): Promise<AnimeVideoResult> {
  const detail = await fetchEpisodeDetailApi(episodeId);
  if (!detail || !detail.mirrors || detail.mirrors.length === 0) {
    if (detail?.stream_url) {
      const isDirect = detail.stream_url.endsWith('.mp4') || detail.stream_url.endsWith('.m3u8');
      return {
        url: isDirect ? detail.stream_url : `/api/stream-embed?url=${encodeURIComponent(detail.stream_url)}`,
        type: isDirect ? 'direct' : 'embed',
        availableResolutions: ['360p', '480p', '720p', '1080p'],
      };
    }
    throw new Error('Video stream tidak ditemukan');
  }

  const availableResolutions = detail.mirrors.map((m) => m.quality);
  const mirror = detail.mirrors.find((m) => m.quality.toLowerCase() === reso.toLowerCase()) || detail.mirrors[0];

  let rawUrl = '';
  if (mirror && mirror.providers && mirror.providers.length > 0) {
    const defaultProvider = mirror.providers.find((p) => p.is_default) || mirror.providers[0];
    if (defaultProvider.data_content) {
      rawUrl = extractStreamSrc(defaultProvider.data_content);
    }
  }

  if (!rawUrl && detail.stream_url) {
    rawUrl = detail.stream_url;
  }

  if (!rawUrl) {
    throw new Error('Video URL tidak tersedia untuk resolusi ini');
  }

  const isDirect = rawUrl.endsWith('.mp4') || rawUrl.endsWith('.m3u8');
  const finalUrl = isDirect ? rawUrl : `/api/stream-embed?url=${encodeURIComponent(rawUrl)}`;

  return {
    url: finalUrl,
    type: isDirect ? 'direct' : 'embed',
    availableResolutions,
  };
}

export const getAnimeBookmarks = (): AnimeBookmarkItem[] => {
  try {
    const raw = localStorage.getItem(LS_ANIME_BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveAnimeBookmark = (item: AnimeBookmarkItem): AnimeBookmarkItem[] => {
  const current = getAnimeBookmarks();
  const filtered = current.filter((b) => b.slug !== item.slug);
  const updated = [item, ...filtered];
  try {
    localStorage.setItem(LS_ANIME_BOOKMARKS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save anime bookmark', e);
  }
  return updated;
};

export const removeAnimeBookmark = (slug: string): AnimeBookmarkItem[] => {
  const current = getAnimeBookmarks();
  const updated = current.filter((b) => b.slug !== slug);
  try {
    localStorage.setItem(LS_ANIME_BOOKMARKS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to remove anime bookmark', e);
  }
  return updated;
};

export const isAnimeBookmarked = (slug: string): boolean => {
  return getAnimeBookmarks().some((b) => b.slug === slug);
};

export const getAnimeHistory = (): AnimeWatchHistoryItem[] => {
  try {
    const raw = localStorage.getItem(LS_ANIME_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveAnimeHistory = (item: AnimeWatchHistoryItem): AnimeWatchHistoryItem[] => {
  const current = getAnimeHistory();
  const filtered = current.filter((h) => !(h.animeSlug === item.animeSlug && h.episodeSlug === item.episodeSlug));
  const updated = [item, ...filtered].slice(0, 50); // Keep last 50
  try {
    localStorage.setItem(LS_ANIME_HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save anime history', e);
  }
  return updated;
};


