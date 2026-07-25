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

export interface MirrorProvider {
  name: string;
  data_content: string | null;
  is_default?: boolean;
}

export interface MirrorQuality {
  quality: string;
  providers: MirrorProvider[];
}

export interface DownloadLink {
  provider: string;
  url: string;
}

export interface DownloadQuality {
  quality: string;
  size: string | null;
  links: DownloadLink[];
}

export interface EpisodeListItem {
  title: string;
  slug: string;
}

export interface EpisodeDetailData {
  title: string;
  slug: string;
  url?: string;
  episode?: number | null;
  anime?: {
    name: string;
    slug: string;
    url?: string;
  } | null;
  stream_url?: string | null;
  mirrors?: MirrorQuality[];
  downloads?: DownloadQuality[];
  episode_selector?: EpisodeListItem[];
  previous_episode?: EpisodeListItem | null;
  next_episode?: EpisodeListItem | null;
  all_episodes?: EpisodeListItem | null;
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
