export interface MangaItem {
  title: string;
  thumbnail: string;
  url: string; // mangaId
  mangaUrl?: string;
}

export interface MangaDetail {
  title: string;
  author: string;
  artist: string;
  status: 'Ongoing' | 'Completed' | 'Unknown' | string;
  description: string;
  genre: string; // comma-separated
  thumbnail: string;
}

export interface ChapterItem {
  name: string;
  dateUpload: number; // Unix ms timestamp
  url: string; // chapterId
  chapterUrl?: string;
}

export interface ChapterPage {
  index: number;
  imageUrl: string;
}

export interface BookmarkItem {
  mangaId: string;
  title: string;
  thumbnail: string;
  addedAt: string;
  lastReadChapterId?: string;
  lastReadChapterName?: string;
}

export interface ReadingHistoryItem {
  mangaId: string;
  title: string;
  thumbnail: string;
  chapterId: string;
  chapterName: string;
  page: number;
  totalPages: number;
  lastReadAt: string;
}

export type ReaderMode = 'webtoon' | 'single' | 'double';
export type ReaderBgColor = 'black' | 'dark' | 'sepia' | 'white';

export interface ReaderSettings {
  mode: ReaderMode;
  bgColor: ReaderBgColor;
  fitWidth: boolean;
  autoScrollSpeed: number; // 0 = off, 1-5 speed
}
