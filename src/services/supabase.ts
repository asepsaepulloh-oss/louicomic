import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BookmarkItem, ReadingHistoryItem } from '../types/manga';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 20);
};

let supabaseClient: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('Gagal inisialisasi Supabase client:', err);
  }
}

export const getSupabaseClient = (): SupabaseClient | null => supabaseClient;

// LOCAL STORAGE FALLBACK HELPERS
const LS_BOOKMARKS_KEY = 'louicomic_bookmarks';
const LS_HISTORY_KEY = 'louicomic_history';

const getLSBookmarks = (): BookmarkItem[] => {
  try {
    const raw = localStorage.getItem(LS_BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLSBookmarks = (items: BookmarkItem[]) => {
  try {
    localStorage.setItem(LS_BOOKMARKS_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('LocalStorage error saving bookmarks:', e);
  }
};

const getLSHistory = (): ReadingHistoryItem[] => {
  try {
    const raw = localStorage.getItem(LS_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLSHistory = (items: ReadingHistoryItem[]) => {
  try {
    localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('LocalStorage error saving history:', e);
  }
};

// --- BOOKMARKS SERVICES ---

export async function fetchUserBookmarks(userId: string = 'guest'): Promise<BookmarkItem[]> {
  if (supabaseClient && userId !== 'guest') {
    try {
      const { data, error } = await supabaseClient
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: false });

      if (!error && data) {
        return data.map((row: any) => ({
          mangaId: row.manga_id,
          title: row.title,
          thumbnail: row.thumbnail,
          addedAt: row.added_at,
          lastReadChapterId: row.last_read_chapter_id,
          lastReadChapterName: row.last_read_chapter_name,
        }));
      }
    } catch (e) {
      console.warn('Supabase fetch error, fallback to LocalStorage:', e);
    }
  }

  return getLSBookmarks();
}

export async function addBookmark(manga: { mangaId: string; title: string; thumbnail: string }, userId: string = 'guest'): Promise<BookmarkItem[]> {
  const newItem: BookmarkItem = {
    mangaId: manga.mangaId,
    title: manga.title,
    thumbnail: manga.thumbnail,
    addedAt: new Date().toISOString(),
  };

  if (supabaseClient && userId !== 'guest') {
    try {
      await supabaseClient.from('bookmarks').upsert(
        {
          user_id: userId,
          manga_id: manga.mangaId,
          title: manga.title,
          thumbnail: manga.thumbnail,
          added_at: newItem.addedAt,
        },
        { onConflict: 'user_id,manga_id' }
      );
    } catch (e) {
      console.warn('Supabase add bookmark error:', e);
    }
  }

  const current = getLSBookmarks();
  const filtered = current.filter((b) => b.mangaId !== manga.mangaId);
  const updated = [newItem, ...filtered];
  saveLSBookmarks(updated);
  return updated;
}

export async function removeBookmark(mangaId: string, userId: string = 'guest'): Promise<BookmarkItem[]> {
  if (supabaseClient && userId !== 'guest') {
    try {
      await supabaseClient
        .from('bookmarks')
        .delete()
        .match({ user_id: userId, manga_id: mangaId });
    } catch (e) {
      console.warn('Supabase remove bookmark error:', e);
    }
  }

  const current = getLSBookmarks();
  const updated = current.filter((b) => b.mangaId !== mangaId);
  saveLSBookmarks(updated);
  return updated;
}

// --- READING HISTORY SERVICES ---

export async function fetchUserHistory(userId: string = 'guest'): Promise<ReadingHistoryItem[]> {
  if (supabaseClient && userId !== 'guest') {
    try {
      const { data, error } = await supabaseClient
        .from('reading_history')
        .select('*')
        .eq('user_id', userId)
        .order('last_read_at', { ascending: false });

      if (!error && data) {
        return data.map((row: any) => ({
          mangaId: row.manga_id,
          title: row.title,
          thumbnail: row.thumbnail,
          chapterId: row.chapter_id,
          chapterName: row.chapter_name,
          page: row.page || 1,
          totalPages: row.total_pages || 1,
          lastReadAt: row.last_read_at,
        }));
      }
    } catch (e) {
      console.warn('Supabase history fetch error, fallback to LocalStorage:', e);
    }
  }

  return getLSHistory();
}

export async function saveReadingProgress(history: {
  mangaId: string;
  title: string;
  thumbnail: string;
  chapterId: string;
  chapterName: string;
  page: number;
  totalPages: number;
}, userId: string = 'guest'): Promise<ReadingHistoryItem[]> {
  const now = new Date().toISOString();
  const item: ReadingHistoryItem = {
    ...history,
    lastReadAt: now,
  };

  if (supabaseClient && userId !== 'guest') {
    try {
      await supabaseClient.from('reading_history').upsert(
        {
          user_id: userId,
          manga_id: history.mangaId,
          title: history.title,
          thumbnail: history.thumbnail,
          chapter_id: history.chapterId,
          chapter_name: history.chapterName,
          page: history.page,
          total_pages: history.totalPages,
          last_read_at: now,
        },
        { onConflict: 'user_id,manga_id' }
      );
    } catch (e) {
      console.warn('Supabase save history error:', e);
    }
  }

  const current = getLSHistory();
  const filtered = current.filter((h) => h.mangaId !== history.mangaId);
  const updated = [item, ...filtered];
  saveLSHistory(updated);
  return updated;
}

export async function clearUserHistory(userId: string = 'guest'): Promise<void> {
  if (supabaseClient && userId !== 'guest') {
    try {
      await supabaseClient
        .from('reading_history')
        .delete()
        .eq('user_id', userId);
    } catch (e) {
      console.warn('Supabase clear history error:', e);
    }
  }

  localStorage.removeItem(LS_HISTORY_KEY);
}

/**
 * SQL Schema script to create Supabase tables
 */
export const SUPABASE_SQL_SCHEMA = `-- Jalankan SQL ini di Supabase SQL Editor untuk mengaktifkan sinkronisasi database:

-- 1. Table Bookmarks
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  manga_id TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail TEXT,
  last_read_chapter_id TEXT,
  last_read_chapter_name TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_manga_bookmark UNIQUE (user_id, manga_id)
);

-- 2. Table Reading History
CREATE TABLE IF NOT EXISTS public.reading_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  manga_id TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail TEXT,
  chapter_id TEXT NOT NULL,
  chapter_name TEXT NOT NULL,
  page INT DEFAULT 1,
  total_pages INT DEFAULT 1,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_manga_history UNIQUE (user_id, manga_id)
);

-- 3. Indeks untuk performa query
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_history_user ON public.reading_history(user_id);

-- 4. RLS (Row Level Security) - Opsional jika menggunakan Anon Key
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all" ON public.bookmarks FOR ALL USING (true);
CREATE POLICY "Allow public all history" ON public.reading_history FOR ALL USING (true);
`;
