import { MangaItem, MangaDetail, ChapterItem, ChapterPage } from '../types/manga';

/**
 * Ensures API base URL is always clean and includes /api suffix
 */
function getApiBaseUrl(): string {
  const envValue = import.meta.env.VITE_SHINIGAMI_API_BASE;
  const rawBase = (envValue && envValue.trim() !== '' ? envValue : 'https://apis.louiv.me/api')
    .trim()
    .replace(/\/+$/, '');

  if (rawBase.endsWith('/api')) {
    return rawBase;
  }
  return `${rawBase}/api`;
}

export const API_BASE_URL = getApiBaseUrl();

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedManga {
  mangas: MangaItem[];
  hasNextPage: boolean;
}

/**
 * Ensures image URLs are routed through the Shinigami image proxy or properly formatted.
 */
export function getProxiedImageUrl(originalUrl: string): string {
  if (!originalUrl) return 'https://placehold.co/300x420/1e293b/e2e8f0?text=No+Cover';

  // If it's already a proxied URL
  if (originalUrl.includes('/manga/image?url=')) {
    if (originalUrl.startsWith('http')) {
      return originalUrl;
    }
    return `${API_BASE_URL}${originalUrl.startsWith('/') ? '' : '/'}${originalUrl}`;
  }

  // Route direct external image URLs via Shinigami image proxy
  if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
    return `${API_BASE_URL}/manga/image?url=${encodeURIComponent(originalUrl)}`;
  }

  return originalUrl;
}

/**
 * Robust fetch helper that handles JSON parsing safely and falls back to Vite proxy
 */
async function fetchApi<T>(endpointPath: string): Promise<ApiResponse<T>> {
  const cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  const directUrl = `${API_BASE_URL}${cleanPath}`;
  const proxyUrl = `/shinigami-proxy/api${cleanPath}`;

  const parseResponse = async (res: Response): Promise<ApiResponse<T>> => {
    const text = await res.text();
    const trimmed = text.trim();

    if (trimmed.startsWith('<') || trimmed.startsWith('<!DOCTYPE')) {
      throw new Error(`Response from API is HTML, not JSON`);
    }

    try {
      return JSON.parse(trimmed);
    } catch (e) {
      throw new Error('Failed to parse JSON response');
    }
  };

  // 1. Try direct API URL
  try {
    const res = await fetch(directUrl, {
      headers: { Accept: 'application/json, text/plain, */*' },
    });
    if (res.ok) {
      return await parseResponse(res);
    }
  } catch (err) {
    console.warn(`Direct fetch failed for ${directUrl}, trying proxy...`, err);
  }

  // 2. Try relative Vite proxy URL if direct URL failed
  try {
    const res = await fetch(proxyUrl, {
      headers: { Accept: 'application/json, text/plain, */*' },
    });
    if (res.ok) {
      return await parseResponse(res);
    }
  } catch (err) {
    console.warn(`Proxy fetch failed for ${proxyUrl}`, err);
  }

  throw new Error('Gagal terhubung ke API Shinigami. Pastikan koneksi internet tersedia.');
}

/**
 * Fetch popular manga list (paginated)
 */
export async function fetchPopularManga(page: number = 1): Promise<{ mangas: MangaItem[]; hasNextPage: boolean }> {
  try {
    const json = await fetchApi<PaginatedManga>(`/manga/popular?page=${page}`);
    if (!json.success || !json.data) {
      throw new Error(json.error || 'Response komik populer tidak valid');
    }
    return json.data;
  } catch (err: any) {
    console.error('fetchPopularManga error:', err);
    throw err;
  }
}

/**
 * Fetch latest updated manga list (paginated)
 */
export async function fetchLatestManga(page: number = 1): Promise<{ mangas: MangaItem[]; hasNextPage: boolean }> {
  try {
    const json = await fetchApi<PaginatedManga>(`/manga/latest?page=${page}`);
    if (!json.success || !json.data) {
      throw new Error(json.error || 'Response komik terbaru tidak valid');
    }
    return json.data;
  } catch (err: any) {
    console.error('fetchLatestManga error:', err);
    throw err;
  }
}

/**
 * Search manga by keyword or genre
 */
export async function searchManga(query: string, page: number = 1): Promise<{ mangas: MangaItem[]; hasNextPage: boolean }> {
  try {
    const json = await fetchApi<PaginatedManga>(`/manga/search?q=${encodeURIComponent(query)}&page=${page}`);
    if (!json.success || !json.data) {
      throw new Error(json.error || 'Gagal mencari komik');
    }
    return json.data;
  } catch (err: any) {
    console.error('searchManga error:', err);
    throw err;
  }
}

/**
 * Get detailed manga metadata by mangaId
 */
export async function fetchMangaDetail(mangaId: string): Promise<MangaDetail> {
  try {
    const json = await fetchApi<MangaDetail>(`/manga/${encodeURIComponent(mangaId)}`);
    if (!json.success || !json.data) {
      throw new Error(json.error || 'Detail komik tidak ditemukan');
    }
    return json.data;
  } catch (err: any) {
    console.error('fetchMangaDetail error:', err);
    throw err;
  }
}

/**
 * Get chapter list for a manga
 */
export async function fetchMangaChapters(mangaId: string): Promise<ChapterItem[]> {
  try {
    const json = await fetchApi<ChapterItem[]>(`/manga/${encodeURIComponent(mangaId)}/chapters`);
    if (!json.success || !json.data) {
      throw new Error(json.error || 'Gagal mengambil daftar chapter');
    }
    return json.data;
  } catch (err: any) {
    console.error('fetchMangaChapters error:', err);
    throw err;
  }
}

/**
 * Get page image list for a chapter
 */
export async function fetchChapterPages(chapterId: string): Promise<ChapterPage[]> {
  try {
    const json = await fetchApi<ChapterPage[]>(`/manga/chapter/${encodeURIComponent(chapterId)}/pages`);
    if (!json.success || !json.data) {
      throw new Error(json.error || 'Gagal mengambil gambar halaman');
    }
    return json.data;
  } catch (err: any) {
    console.error('fetchChapterPages error:', err);
    throw err;
  }
}

/**
 * Check Shinigami API status
 */
export async function checkApiHealth(): Promise<{ online: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const json = await fetchApi<PaginatedManga>('/manga/popular?page=1');
    const latencyMs = Date.now() - start;
    if (json.success) {
      return { online: true, latencyMs };
    }
    return { online: false, latencyMs, error: json.error || 'Unknown error' };
  } catch (e: any) {
    return { online: false, latencyMs: Date.now() - start, error: e.message || 'Network error' };
  }
}
