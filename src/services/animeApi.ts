import { AnimeItem, AnimeDetailData, AnimeEpisodeItem, AnimeBookmarkItem, AnimeWatchHistoryItem, EpisodeDetailData } from '../types/anime';

const ANIME_API_BASE = 'https://api.sansekai.my.id/api';

export interface AnimeApiResponse<T> {
  ok?: boolean;
  success?: boolean;
  status?: boolean | number;
  data?: T;
  results?: T;
  query?: string;
  error?: string;
}

/**
 * Searches anime via REST API at api.sansekai.my.id
 */
export async function searchAnimeApi(query: string): Promise<AnimeItem[]> {
  const urls = [
    `${ANIME_API_BASE}/anime/search?q=${encodeURIComponent(query)}`,
    `${ANIME_API_BASE}/anime/search?query=${encodeURIComponent(query)}`,
    `${ANIME_API_BASE}/search?q=${encodeURIComponent(query)}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) continue;

      const json = await res.json();
      const list = json.data || json.results || json.anime || (Array.isArray(json) ? json : null);

      if (Array.isArray(list) && list.length > 0) {
        return list.map((item: any) => ({
          title: item.title || item.name || 'Anime',
          slug: item.slug || item.id || item.url || item.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          rating: item.rating || item.score || '8.2',
          status: item.status || 'Ongoing',
          image_url: item.image_url || item.image || item.cover || item.poster || item.thumb || '',
          genres: item.genres || item.genre || [],
          latest_episode: item.latest_episode || item.episode || item.episodes_count || '',
        }));
      }
    } catch (err) {
      console.warn(`Anime search error at ${url}:`, err);
    }
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
 * Fetches popular/trending anime by querying common popular anime titles
 */
export async function fetchPopularAnime(): Promise<AnimeItem[]> {
  try {
    const results = await Promise.all([
      searchAnimeApi('kimetsu'),
      searchAnimeApi('jujutsu'),
      searchAnimeApi('bleach'),
      searchAnimeApi('one piece'),
      searchAnimeApi('a'),
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
 * Fetches ongoing anime list (from /anime/latest or /anime/recommended)
 */
export async function fetchOngoingAnime(): Promise<AnimeItem[]> {
  const endpoints = [
    `${ANIME_API_BASE}/anime/latest`,
    `${ANIME_API_BASE}/anime/recommended`,
    `${ANIME_API_BASE}/ongoing?page=1`,
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) continue;

      const json = await res.json();
      const list = json.data || json.results || json.anime || (Array.isArray(json) ? json : null);

      if (Array.isArray(list) && list.length > 0) {
        return list.map((item: any) => ({
          title: item.title || item.name || 'Anime',
          slug: item.slug || item.id || item.url || item.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          rating: item.rating || item.score || '8.5',
          status: item.status || 'Ongoing',
          image_url: item.image_url || item.image || item.cover || item.poster || item.thumb || '',
          genres: item.genres || item.genre || [],
          latest_episode: item.latest_episode || item.episode || '',
        }));
      }
    } catch (e) {
      // try next
    }
  }

  // Fallback: search anime and filter by status
  const all = await searchAnimeApi('a');
  return all.filter((item) => item.status?.toLowerCase().includes('ongoing')) || all;
}

/**
 * Extracts episode numbers from title string (e.g., "(Episode 1 – 26)" or "Episode 12")
 */
export function generateEpisodesFromTitle(item: AnimeItem): AnimeEpisodeItem[] {
  const episodes: AnimeEpisodeItem[] = [];
  const title = item.title;

  // Try to parse pattern "Episode 1 – 24" or "Episode 1 - 12"
  const matchRange = title.match(/Episode\s+(\d+)\s*[–\-]\s*(\d+)/i);
  let totalEp = 12; // default if not found

  if (matchRange) {
    const endEp = parseInt(matchRange[2], 10);
    if (!isNaN(endEp) && endEp > 0) {
      totalEp = Math.min(endEp, 1000);
    }
  } else {
    // Check single episode
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
 * Gets detailed anime info from /anime/detail with fallback
 */
export async function fetchAnimeDetailApi(item: AnimeItem): Promise<AnimeDetailData> {
  const urls = [
    `${ANIME_API_BASE}/anime/detail?slug=${encodeURIComponent(item.slug)}`,
    `${ANIME_API_BASE}/anime/detail?url=${encodeURIComponent(item.slug)}`,
    `${ANIME_API_BASE}/anime/detail/${item.slug}`,
    `${ANIME_API_BASE}/anime/${item.slug}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) continue;

      const json = await res.json();
      const payload = json.data || json.detail || (json.title ? json : null);

      if (payload) {
        return {
          title: payload.title || item.title,
          slug: item.slug,
          japanese_title: payload.japanese_title || payload.title || item.title,
          status: payload.status || item.status || 'Ongoing',
          rating: payload.rating || item.rating || '8.2',
          synopsis: payload.synopsis || `Nonton Anime ${item.title} Subtitle Indonesia di LouiComic.`,
          image_url: payload.image_url || payload.image || item.image_url,
          genres: payload.genres || item.genres || [],
          episodes: Array.isArray(payload.episodes) && payload.episodes.length > 0
            ? payload.episodes
            : generateEpisodesFromTitle(item),
        };
      }
    } catch (e) {
      console.warn(`Anime detail fetch error at ${url}:`, e);
    }
  }

  // Fallback detail constructed from item metadata
  return {
    title: item.title,
    slug: item.slug,
    japanese_title: item.title,
    status: item.status || 'Ongoing',
    rating: item.rating || '8.5',
    studio: 'Animation Studio',
    release_date: '2024',
    synopsis: `Nonton gratis anime ${item.title} Subtitle Indonesia full HD. Cerita petualangan seru dengan kualitas video jernih dan pilihan server cepat di LouiComic.`,
    image_url: item.image_url,
    genres: item.genres || [],
    episodes: generateEpisodesFromTitle(item),
  };
}

/**
 * Fetches episode details including stream URL, mirrors, and download links from /anime/getvideo
 */
export async function fetchEpisodeDetailApi(episodeSlug: string): Promise<EpisodeDetailData | null> {
  const urls = [
    `${ANIME_API_BASE}/anime/getvideo?slug=${encodeURIComponent(episodeSlug)}`,
    `${ANIME_API_BASE}/anime/getvideo?url=${encodeURIComponent(episodeSlug)}`,
    `${ANIME_API_BASE}/anime/getvideo/${episodeSlug}`,
    `${ANIME_API_BASE}/episode/${episodeSlug}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) continue;

      const json = await res.json();
      const data = json.data || (json.stream_url || json.mirrors || json.downloads || json.title ? json : null);

      if (data) {
        return data as EpisodeDetailData;
      }
    } catch (err) {
      console.warn(`Episode detail API error at ${url}:`, err);
    }
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
