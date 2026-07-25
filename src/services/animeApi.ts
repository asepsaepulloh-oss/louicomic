import { AnimeItem, AnimeDetailData, AnimeEpisodeItem, AnimeBookmarkItem, AnimeWatchHistoryItem, EpisodeDetailData, MirrorQuality, DownloadQuality } from '../types/anime';

const LOUIV_API_BASE = 'https://api.louiv.me';
const SANSEKAI_API_BASE = 'https://api.sansekai.my.id/api';

export interface AnimeApiResponse<T> {
  statusCode?: number;
  statusMessage?: string;
  ok?: boolean;
  data?: T;
  query?: string;
  error?: string;
}

/**
 * Searches anime via REST API at api.louiv.me (Oploverz, Otakudesu, & Kuramanime)
 */
export async function searchAnimeApi(query: string): Promise<AnimeItem[]> {
  const encQuery = encodeURIComponent(query);

  const [oploverzRes, otakudesuRes, kuramanimeRes] = await Promise.allSettled([
    fetch(`${LOUIV_API_BASE}/oploverz/search?q=${encQuery}`, { headers: { Accept: 'application/json' } }),
    fetch(`${LOUIV_API_BASE}/otakudesu/search?q=${encQuery}`, { headers: { Accept: 'application/json' } }),
    fetch(`${LOUIV_API_BASE}/kuramanime/anime?search=${encQuery}`, { headers: { Accept: 'application/json' } }),
  ]);

  const combinedResults: AnimeItem[] = [];
  const seenTitles = new Set<string>();

  // Process Oploverz results
  if (oploverzRes.status === 'fulfilled' && oploverzRes.value.ok) {
    try {
      const json = await oploverzRes.value.json();
      const list = json.data?.animeList;
      if (Array.isArray(list)) {
        for (const item of list) {
          const title = item.title || 'Anime';
          const titleKey = title.toLowerCase().trim();
          if (!seenTitles.has(titleKey)) {
            seenTitles.add(titleKey);
            combinedResults.push({
              title,
              slug: item.slug || item.href?.split('/').filter(Boolean).pop() || 'anime',
              image_url: item.poster || '',
              status: item.status || 'Completed',
              type: item.type || 'TV',
              rating: '8.5',
              genres: [],
            });
          }
        }
      }
    } catch (e) {
      console.warn('Error parsing Oploverz search JSON:', e);
    }
  }

  // Process Otakudesu results
  if (otakudesuRes.status === 'fulfilled' && otakudesuRes.value.ok) {
    try {
      const json = await otakudesuRes.value.json();
      const list = json.data?.animeList;
      if (Array.isArray(list)) {
        for (const item of list) {
          const title = item.title || 'Anime';
          const titleKey = title.toLowerCase().trim();
          if (!seenTitles.has(titleKey)) {
            seenTitles.add(titleKey);
            combinedResults.push({
              title,
              slug: item.animeId || item.otakudesuUrl?.split('/').filter(Boolean).pop() || 'anime',
              image_url: item.poster || '',
              status: item.status?.replace('Status : ', '') || 'Ongoing',
              rating: item.score?.replace('Rating : ', '') || '8.2',
              genres: item.genreList?.map((g: any) => ({ title: g.title, slug: g.genreId })) || [],
            });
          }
        }
      }
    } catch (e) {
      console.warn('Error parsing Otakudesu search JSON:', e);
    }
  }

  // Process Kuramanime results
  if (kuramanimeRes.status === 'fulfilled' && kuramanimeRes.value.ok) {
    try {
      const json = await kuramanimeRes.value.json();
      const list = json.data?.animeList || json.data;
      if (Array.isArray(list)) {
        for (const item of list) {
          const title = item.title || item.name || 'Anime';
          const titleKey = title.toLowerCase().trim();
          if (!seenTitles.has(titleKey)) {
            seenTitles.add(titleKey);
            combinedResults.push({
              title,
              slug: item.animeId || item.id || item.slug || 'anime',
              image_url: item.poster || item.image || item.cover || '',
              status: item.status || 'Ongoing',
              type: item.type || 'TV',
              rating: item.score || item.rating || '8.3',
              genres: item.genreList?.map((g: any) => ({ title: g.title || g, slug: g.genreId || g })) || [],
            });
          }
        }
      }
    } catch (e) {
      console.warn('Error parsing Kuramanime search JSON:', e);
    }
  }

  if (combinedResults.length > 0) {
    return combinedResults;
  }

  // Fallback to Sansekai API if both returned empty
  try {
    const res = await fetch(`${SANSEKAI_API_BASE}/anime/search?q=${encQuery}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      const list = json.data || json.results;
      if (Array.isArray(list) && list.length > 0) {
        return list.map((item: any) => ({
          title: item.title || 'Anime',
          slug: item.slug || 'anime',
          image_url: item.image_url || item.image || item.poster || '',
          status: item.status || 'Ongoing',
          rating: item.rating || '8.0',
          genres: item.genres || [],
        }));
      }
    }
  } catch (err) {
    console.warn('Sansekai search failed:', err);
  }

  return [];
}

/**
 * Curated list of popular anime categories and search terms
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
 * Fetches popular/trending anime
 */
export async function fetchPopularAnime(): Promise<AnimeItem[]> {
  try {
    const results = await Promise.all([
      searchAnimeApi('one piece'),
      searchAnimeApi('kimetsu'),
      searchAnimeApi('jujutsu'),
      searchAnimeApi('bleach'),
      searchAnimeApi('naruto'),
    ]);

    const combined: AnimeItem[] = [];
    const seenSlugs = new Set<string>();

    for (const list of results) {
      for (const item of list) {
        if (!seenSlugs.has(item.slug)) {
          seenSlugs.add(item.slug);
          combined.push(item);
        }
      }
    }

    return combined;
  } catch (err) {
    console.error('Error fetching popular anime:', err);
    return [];
  }
}

/**
 * Fetches ongoing anime list from Otakudesu, Oploverz, and Kuramanime endpoints
 */
export async function fetchOngoingAnime(): Promise<AnimeItem[]> {
  const [otakudesuRes, oploverzRes, kuramanimeRes] = await Promise.allSettled([
    fetch(`${LOUIV_API_BASE}/otakudesu/ongoing?page=1`, { headers: { Accept: 'application/json' } }),
    fetch(`${LOUIV_API_BASE}/oploverz/home`, { headers: { Accept: 'application/json' } }),
    fetch(`${LOUIV_API_BASE}/kuramanime/anime?status=ongoing`, { headers: { Accept: 'application/json' } }),
  ]);

  const result: AnimeItem[] = [];
  const seenTitles = new Set<string>();

  // Process Otakudesu ongoing
  if (otakudesuRes.status === 'fulfilled' && otakudesuRes.value.ok) {
    try {
      const json = await otakudesuRes.value.json();
      const list = json.data?.animeList;
      if (Array.isArray(list)) {
        for (const item of list) {
          const title = item.title || 'Anime';
          const titleKey = title.toLowerCase().trim();
          if (!seenTitles.has(titleKey)) {
            seenTitles.add(titleKey);
            result.push({
              title,
              slug: item.animeId || (item.otakudesuUrl ? item.otakudesuUrl.split('/').filter(Boolean).pop() : 'anime'),
              image_url: item.poster || '',
              status: 'Ongoing',
              type: 'TV',
              rating: '8.5',
              latest_episode: item.episodes ? `Episode ${item.episodes}` : '',
              genres: [],
            });
          }
        }
      }
    } catch (err) {
      console.warn('Error parsing Otakudesu ongoing:', err);
    }
  }

  // Process Oploverz home
  if (oploverzRes.status === 'fulfilled' && oploverzRes.value.ok) {
    try {
      const json = await oploverzRes.value.json();
      const homeData = json.data;
      const list = homeData?.popularToday?.animeList || homeData?.latestRelease?.animeList;
      if (Array.isArray(list)) {
        for (const item of list) {
          const title = item.seriesName?.split('\t')[0] || item.title || 'Anime';
          const titleKey = title.toLowerCase().trim();
          const rawSlug = item.seriesSlug || item.slug || (item.href ? item.href.split('/').filter(Boolean).pop() : '');
          if (rawSlug && !seenTitles.has(titleKey)) {
            seenTitles.add(titleKey);
            result.push({
              title,
              slug: rawSlug,
              image_url: item.poster || '',
              status: 'Ongoing',
              type: item.type || 'TV',
              rating: '8.8',
              genres: [],
            });
          }
        }
      }
    } catch (err) {
      console.warn('Error parsing Oploverz home:', err);
    }
  }

  // Process Kuramanime ongoing
  if (kuramanimeRes.status === 'fulfilled' && kuramanimeRes.value.ok) {
    try {
      const json = await kuramanimeRes.value.json();
      const list = json.data?.animeList || json.data;
      if (Array.isArray(list)) {
        for (const item of list) {
          const title = item.title || item.name || 'Anime';
          const titleKey = title.toLowerCase().trim();
          if (!seenTitles.has(titleKey)) {
            seenTitles.add(titleKey);
            result.push({
              title,
              slug: item.animeId || item.id || item.slug || 'anime',
              image_url: item.poster || item.image || item.cover || '',
              status: 'Ongoing',
              type: item.type || 'TV',
              rating: item.score || item.rating || '8.4',
              latest_episode: item.episodes ? `Episode ${item.episodes}` : '',
              genres: [],
            });
          }
        }
      }
    } catch (err) {
      console.warn('Error parsing Kuramanime ongoing:', err);
    }
  }

  if (result.length > 0) {
    return result;
  }

  // Fallback search
  const all = await searchAnimeApi('naruto');
  return all.length > 0 ? all : [];
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
 * Gets detailed anime info from Oploverz or Otakudesu
 */
export async function fetchAnimeDetailApi(item: AnimeItem): Promise<AnimeDetailData> {
  // 1. Try Oploverz Detail
  try {
    const res = await fetch(`${LOUIV_API_BASE}/oploverz/anime/${item.slug}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      const details = json.data?.details;
      if (details) {
        const eps: AnimeEpisodeItem[] = Array.isArray(details.episodeList)
          ? details.episodeList.map((ep: any, idx: number) => {
              const epSlug = ep.href ? ep.href.split('/').filter(Boolean).pop() : `${item.slug}-episode-${idx + 1}`;
              return {
                title: ep.title || `Episode ${ep.episode || idx + 1}`,
                slug: epSlug || `${item.slug}-episode-${idx + 1}`,
                episode_number: parseInt(ep.episode) || idx + 1,
                release_date: ep.date || '',
              };
            })
          : generateEpisodesFromTitle(item);

        const synopsisText = Array.isArray(details.synopsis?.paragraphList)
          ? details.synopsis.paragraphList.join('\n\n')
          : typeof details.synopsis === 'string'
          ? details.synopsis
          : `Nonton Anime ${item.title} Subtitle Indonesia gratis di LouiComic.`;

        return {
          title: details.title || item.title,
          slug: item.slug,
          japanese_title: details.title || item.title,
          type: details.type || item.type || 'TV',
          status: details.status || item.status || 'Ongoing',
          rating: details.rating || item.rating || '8.5',
          studio: details.studio || 'Studio Animation',
          release_date: details.releasedOn || '2026',
          synopsis: synopsisText,
          image_url: details.poster || item.image_url,
          genres: Array.isArray(details.genres)
            ? details.genres.map((g: string) => ({ title: g, slug: g.toLowerCase().replace(/[^a-z0-9]+/g, '-') }))
            : item.genres || [],
          episodes: eps,
        };
      }
    }
  } catch (e) {
    console.warn(`Oploverz detail fetch error for ${item.slug}:`, e);
  }

  // 2. Try Otakudesu Detail
  try {
    const res = await fetch(`${LOUIV_API_BASE}/otakudesu/anime/${item.slug}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      const detail = json.data?.animeDetail;
      if (detail) {
        const eps: AnimeEpisodeItem[] = Array.isArray(detail.episodeList)
          ? detail.episodeList.map((ep: any, idx: number) => ({
              title: ep.title || `Episode ${idx + 1}`,
              slug: ep.episodeId || ep.otakudesuUrl?.split('/').filter(Boolean).pop() || `${item.slug}-ep-${idx + 1}`,
              episode_number: idx + 1,
            }))
          : generateEpisodesFromTitle(item);

        return {
          title: detail.title || item.title,
          slug: item.slug,
          japanese_title: detail.japanese || item.title,
          status: detail.status || 'Ongoing',
          rating: detail.score?.replace('Rating : ', '') || '8.2',
          synopsis: detail.synopsis || `Nonton Anime ${item.title} Subtitle Indonesia.`,
          image_url: detail.poster || item.image_url,
          genres: detail.genreList?.map((g: any) => ({ title: g.title, slug: g.genreId })) || [],
          episodes: eps,
        };
      }
    }
  } catch (e) {
    console.warn(`Otakudesu detail fetch error for ${item.slug}:`, e);
  }

  // Fallback detail constructed from item metadata
  return {
    title: item.title,
    slug: item.slug,
    japanese_title: item.title,
    status: item.status || 'Ongoing',
    rating: item.rating || '8.5',
    studio: 'Animation Studio',
    release_date: '2026',
    synopsis: `Nonton gratis anime ${item.title} Subtitle Indonesia full HD di LouiComic. Cerita petualangan seru dengan kualitas video jernih dan pilihan server cepat.`,
    image_url: item.image_url,
    genres: item.genres || [],
    episodes: generateEpisodesFromTitle(item),
  };
}

/**
 * Fetches episode details including streaming URL and download links
 */
export async function fetchEpisodeDetailApi(episodeSlug: string): Promise<EpisodeDetailData | null> {
  // 1. Try Oploverz Episode
  try {
    const res = await fetch(`${LOUIV_API_BASE}/oploverz/episode/${episodeSlug}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      const details = json.data?.details;
      if (details) {
        const streamUrl = details.streamingUrl || null;

        const mirrors: MirrorQuality[] = streamUrl
          ? [
              {
                quality: '720p HD',
                providers: [
                  {
                    name: 'Server Utama (HD)',
                    data_content: `<iframe src="${streamUrl}"></iframe>`,
                    is_default: true,
                  },
                ],
              },
            ]
          : [];

        // Parse downloads
        const downloads: DownloadQuality[] = [];
        if (Array.isArray(details.download)) {
          for (const fmt of details.download) {
            const formatTitle = fmt.title ? fmt.title.toUpperCase() : 'MP4';
            if (Array.isArray(fmt.qualityList)) {
              for (const qItem of fmt.qualityList) {
                const links = Array.isArray(qItem.urlList)
                  ? qItem.urlList.map((u: any) => ({
                      provider: u.title || 'Server',
                      url: u.url,
                    }))
                  : [];

                if (links.length > 0) {
                  downloads.push({
                    quality: `${qItem.title || 'HD'} (${formatTitle})`,
                    size: null,
                    links,
                  });
                }
              }
            }
          }
        }

        return {
          title: details.title || 'Episode Detail',
          slug: episodeSlug,
          stream_url: streamUrl,
          mirrors,
          downloads,
          previous_episode: details.prevEpisode?.href
            ? {
                title: details.prevEpisode.title || 'Previous Episode',
                slug: details.prevEpisode.href.split('/').filter(Boolean).pop()!,
              }
            : null,
          next_episode: details.nextEpisode?.href
            ? {
                title: details.nextEpisode.title || 'Next Episode',
                slug: details.nextEpisode.href.split('/').filter(Boolean).pop()!,
              }
            : null,
        };
      }
    }
  } catch (err) {
    console.warn(`Oploverz episode fetch error for ${episodeSlug}:`, err);
  }

  // 2. Try Otakudesu Episode
  try {
    const res = await fetch(`${LOUIV_API_BASE}/otakudesu/episode/${episodeSlug}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      const epData = json.data;
      if (epData) {
        return {
          title: epData.title || 'Episode Detail',
          slug: episodeSlug,
          stream_url: epData.stream_url || epData.default_stream_url || null,
          mirrors: epData.mirrors || [],
          downloads: epData.downloads || [],
        };
      }
    }
  } catch (err) {
    console.warn(`Otakudesu episode fetch error for ${episodeSlug}:`, err);
  }

  return null;
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

