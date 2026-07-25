import { AnimeItem, AnimeDetailData, AnimeEpisodeItem, AnimeBookmarkItem, AnimeWatchHistoryItem, EpisodeDetailData } from '../types/anime';

const ANIME_API_BASE = 'https://api.louiv.me/api';

export interface AnimeApiResponse<T> {
  ok: boolean;
  data?: T;
  query?: string;
  error?: string;
}

/**
 * Searches anime via REST API at api.louiv.me
 */
export async function searchAnimeApi(query: string): Promise<AnimeItem[]> {
  const url = `${ANIME_API_BASE}/search?q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const json: AnimeApiResponse<AnimeItem[]> = await res.json();
    if (json.ok && Array.isArray(json.data)) {
      return json.data;
    }
    return [];
  } catch (err) {
    console.warn(`Anime search API error for query "${query}":`, err);
    return [];
  }
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
 * Fetches ongoing anime list
 */
export async function fetchOngoingAnime(): Promise<AnimeItem[]> {
  try {
    // Try endpoint first
    const res = await fetch(`${ANIME_API_BASE}/ongoing?page=1`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.ok && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (e) {
    // Fallback to search filter
  }

  // Fallback: search anime and filter by status === 'Ongoing'
  const all = await searchAnimeApi('a');
  return all.filter((item) => item.status?.toLowerCase().includes('ongoing'));
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
 * Gets detailed anime info with fallback if endpoint is unavailable
 */
export async function fetchAnimeDetailApi(item: AnimeItem): Promise<AnimeDetailData> {
  // Try direct endpoint if available
  try {
    const res = await fetch(`${ANIME_API_BASE}/anime/${item.slug}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.ok && json.data) {
        return {
          title: json.data.title || item.title,
          slug: item.slug,
          japanese_title: json.data.japanese_title || item.title,
          status: json.data.status || item.status || 'Ongoing',
          rating: json.data.rating || item.rating || '8.2',
          synopsis: json.data.synopsis || `Nonton Anime ${item.title} Subtitle Indonesia dengan kualitas HD di LouiComic.`,
          image_url: json.data.image_url || item.image_url,
          genres: json.data.genres || item.genres || [],
          episodes: Array.isArray(json.data.episodes) && json.data.episodes.length > 0
            ? json.data.episodes
            : generateEpisodesFromTitle(item),
        };
      }
    }
  } catch (e) {
    console.warn(`Direct anime detail error for ${item.slug}, using generated detail:`, e);
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
 * Fetches episode details including stream URL, mirrors, and download links
 */
export async function fetchEpisodeDetailApi(episodeSlug: string): Promise<EpisodeDetailData | null> {
  const url = `${ANIME_API_BASE}/episode/${episodeSlug}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const json = await res.json();
    if (json.ok && json.data) {
      return json.data as EpisodeDetailData;
    }
    if (json.stream_url || json.mirrors || json.downloads || json.title) {
      return json as EpisodeDetailData;
    }
    return null;
  } catch (err) {
    console.warn(`Episode detail API error for "${episodeSlug}":`, err);
    return null;
  }
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
