export interface AnimeGenre {
  title: string;
  slug: string;
  url?: string;
}

export interface AnimeItem {
  title: string;
  slug: string;
  url?: string;
  type?: string;
  image_url: string;
  genres: AnimeGenre[];
  status?: string;
  rating?: string | null;
  episode_count?: string;
}

export interface AnimeEpisodeItem {
  title: string;
  slug: string;
  episode_number: number;
  release_date?: string;
}

export interface AnimeDetailData {
  title: string;
  slug: string;
  japanese_title?: string;
  type?: string;
  status?: string;
  rating?: string;
  studio?: string;
  release_date?: string;
  synopsis?: string;
  image_url: string;
  genres: AnimeGenre[];
  episodes: AnimeEpisodeItem[];
}

export interface AnimeBookmarkItem {
  slug: string;
  title: string;
  image_url: string;
  rating?: string | null;
  status?: string;
  addedAt: string;
  lastEpisodeSlug?: string;
  lastEpisodeTitle?: string;
}

export interface AnimeWatchHistoryItem {
  animeSlug: string;
  animeTitle: string;
  image_url: string;
  episodeSlug: string;
  episodeTitle: string;
  watchedAt: string;
}
