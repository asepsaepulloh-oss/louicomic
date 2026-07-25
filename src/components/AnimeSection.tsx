import React, { useState, useEffect } from 'react';
import {
  Film,
  Search,
  Sparkles,
  Flame,
  Clock,
  Bookmark,
  History,
  Play,
  Star,
  RefreshCw,
  Tv,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { AnimeItem, AnimeBookmarkItem, AnimeWatchHistoryItem } from '../types/anime';
import {
  searchAnimeApi,
  fetchPopularAnime,
  getAnimeBookmarks,
  getAnimeHistory,
  removeAnimeBookmark,
} from '../services/animeApi';
import { AnimeCard } from './AnimeCard';
import { AnimePlayerModal } from './AnimePlayerModal';

interface AnimeSectionProps {
  initialSearchQuery?: string;
}

export const AnimeSection: React.FC<AnimeSectionProps> = ({ initialSearchQuery }) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'bookmarks' | 'history'>('all');
  const [animeList, setAnimeList] = useState<AnimeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery || '');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedAnime, setSelectedAnime] = useState<AnimeItem | null>(null);

  // Bookmarks & History state
  const [bookmarks, setBookmarks] = useState<AnimeBookmarkItem[]>([]);
  const [history, setHistory] = useState<AnimeWatchHistoryItem[]>([]);

  // Load initial popular anime
  const loadDefaultAnime = async () => {
    setLoading(true);
    try {
      const data = await fetchPopularAnime();
      setAnimeList(data);
    } catch (err) {
      console.error('Failed to load popular anime:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialSearchQuery && initialSearchQuery.trim() !== '') {
      handleSearchSubmit(initialSearchQuery);
    } else {
      loadDefaultAnime();
    }
    setBookmarks(getAnimeBookmarks());
    setHistory(getAnimeHistory());
  }, [initialSearchQuery]);

  // Handle Search
  const handleSearchSubmit = async (query: string) => {
    if (!query.trim()) {
      loadDefaultAnime();
      return;
    }
    setLoading(true);
    setActiveSubTab('all');
    try {
      const res = await searchAnimeApi(query);
      setAnimeList(res);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Genre Filters
  const GENRES = [
    'All',
    'Action',
    'Adventure',
    'Comedy',
    'Fantasy',
    'Isekai',
    'Romance',
    'School',
    'Shounen',
    'Supernatural',
  ];

  // Filter list by selected Genre & Status
  const filteredAnimeList = animeList.filter((item) => {
    let matchGenre = true;
    if (selectedGenre !== 'All') {
      matchGenre = item.genres?.some(
        (g) => g.title.toLowerCase() === selectedGenre.toLowerCase()
      ) ?? false;
    }

    let matchStatus = true;
    if (selectedStatus === 'Ongoing') {
      matchStatus = item.status?.toLowerCase().includes('ongoing') ?? false;
    } else if (selectedStatus === 'Completed') {
      matchStatus = item.status?.toLowerCase().includes('completed') ?? false;
    }

    return matchGenre && matchStatus;
  });

  const featuredHero = animeList.length > 0 ? animeList[0] : null;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Featured Anime Hero Banner */}
      {featuredHero && activeSubTab === 'all' && !searchQuery && (
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 blur-sm scale-105"
            style={{ backgroundImage: `url(${featuredHero.image_url})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />

          <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center gap-6">
            <img
              src={featuredHero.image_url}
              alt={featuredHero.title}
              className="w-36 sm:w-44 aspect-[3/4] object-cover rounded-xl shadow-xl border border-slate-700/80 flex-shrink-0"
            />

            <div className="space-y-3 text-center md:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500 text-slate-950 shadow-sm">
                  Rekomendasi Anime
                </span>
                {featuredHero.rating && (
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {featuredHero.rating}
                  </span>
                )}
                {featuredHero.status && (
                  <span className="text-xs font-semibold text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700">
                    {featuredHero.status}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight line-clamp-2">
                {featuredHero.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-2xl leading-relaxed">
                Streaming & Nonton Anime Subtitle Indonesia kualitas jernih Full HD gratis. Pilihan episode lengkap dan update tercepat di LouiComic.
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <button
                  onClick={() => setSelectedAnime(featuredHero)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Nonton Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs & Search Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 backdrop-blur-md">
        {/* Sub Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setActiveSubTab('all');
              setSelectedGenre('All');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Koleksi Anime</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('bookmarks');
              setBookmarks(getAnimeBookmarks());
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'bookmarks'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Bookmark ({bookmarks.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('history');
              setHistory(getAnimeHistory());
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'history'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Nonton</span>
          </button>
        </div>

        {/* Anime Search Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearchSubmit(searchQuery);
          }}
          className="relative flex-1 max-w-md"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari anime (misal: Naruto, One Piece, Kimetsu)..."
            className="w-full pl-9 pr-20 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-colors"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Genre & Status Filters (When in 'all' subtab) */}
      {activeSubTab === 'all' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {['All', 'Ongoing', 'Completed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedStatus === st
                      ? 'bg-slate-800 text-amber-400 border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st === 'All' ? 'Semua Status' : st}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedGenre('All');
                setSelectedStatus('All');
                loadDefaultAnime();
              }}
              className="flex items-center gap-1 text-xs text-amber-400/90 hover:text-amber-300 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>

          {/* Genre Chips */}
          <div className="flex flex-wrap gap-1.5">
            {GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                  selectedGenre === genre
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB CONTENT: ALL ANIME */}
      {activeSubTab === 'all' && (
        <div>
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 mx-auto border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Memuat anime dari REST API (api.louiv.me/api)...</p>
            </div>
          ) : filteredAnimeList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {filteredAnimeList.map((anime) => (
                <AnimeCard
                  key={anime.slug}
                  anime={anime}
                  onSelect={(item) => setSelectedAnime(item)}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center space-y-3 bg-slate-900/50 rounded-2xl border border-slate-800">
              <Tv className="w-12 h-12 mx-auto text-slate-600" />
              <h3 className="text-base font-bold text-slate-200">Anime Tidak Ditemukan</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Coba gunakan kata kunci pencarian lain seperti "Naruto", "Bleach", "One Piece", atau reset filter genre.
              </p>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB CONTENT: BOOKMARKS */}
      {activeSubTab === 'bookmarks' && (
        <div>
          {bookmarks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {bookmarks.map((bm) => (
                <div
                  key={bm.slug}
                  className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col h-full"
                >
                  <div
                    onClick={() =>
                      setSelectedAnime({
                        title: bm.title,
                        slug: bm.slug,
                        image_url: bm.image_url,
                        genres: [],
                        rating: bm.rating,
                        status: bm.status,
                      })
                    }
                    className="relative aspect-[3/4] cursor-pointer"
                  >
                    <img
                      src={bm.image_url}
                      alt={bm.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAnimeBookmark(bm.slug);
                          setBookmarks(getAnimeBookmarks());
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/80 text-white hover:bg-rose-600 transition-colors shadow-md"
                        title="Hapus Bookmark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 flex flex-col justify-between flex-grow">
                    <h4 className="text-xs font-bold text-slate-100 line-clamp-2">{bm.title}</h4>
                    <button
                      onClick={() =>
                        setSelectedAnime({
                          title: bm.title,
                          slug: bm.slug,
                          image_url: bm.image_url,
                          genres: [],
                          rating: bm.rating,
                          status: bm.status,
                        })
                      }
                      className="mt-2 w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <Play className="w-3 h-3 fill-slate-950" />
                      <span>Lanjut Nonton</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center space-y-3 bg-slate-900/50 rounded-2xl border border-slate-800">
              <Bookmark className="w-12 h-12 mx-auto text-slate-600" />
              <h3 className="text-base font-bold text-slate-200">Belum Ada Bookmark Anime</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Klik tombol "Bookmark" pada detail episode anime untuk menyimpannya di sini.
              </p>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB CONTENT: HISTORY */}
      {activeSubTab === 'history' && (
        <div className="space-y-3">
          {history.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {history.map((h, index) => (
                <div
                  key={index}
                  onClick={() =>
                    setSelectedAnime({
                      title: h.animeTitle,
                      slug: h.animeSlug,
                      image_url: h.image_url,
                      genres: [],
                    })
                  }
                  className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer flex items-center gap-3 group"
                >
                  <img
                    src={h.image_url}
                    alt={h.animeTitle}
                    className="w-14 h-20 object-cover rounded-lg border border-slate-800 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-100 group-hover:text-amber-400 transition-colors truncate">
                      {h.animeTitle}
                    </h4>
                    <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-block mt-1">
                      {h.episodeTitle}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(h.watchedAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </p>
                  </div>
                  <Play className="w-5 h-5 text-slate-600 group-hover:text-amber-400 group-hover:scale-110 transition-all mr-2 flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center space-y-3 bg-slate-900/50 rounded-2xl border border-slate-800">
              <History className="w-12 h-12 mx-auto text-slate-600" />
              <h3 className="text-base font-bold text-slate-200">Belum Ada Riwayat Nonton</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Riwayat anime yang kamu tonton akan tersimpan secara otomatis di sini.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Streaming Player Modal */}
      {selectedAnime && (
        <AnimePlayerModal
          anime={selectedAnime}
          onClose={() => setSelectedAnime(null)}
        />
      )}
    </div>
  );
};
