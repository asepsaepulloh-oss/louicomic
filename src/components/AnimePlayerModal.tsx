import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  Star,
  Film,
  Server,
  Monitor,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { AnimeItem, AnimeDetailData, AnimeEpisodeItem } from '../types/anime';
import {
  fetchAnimeDetailApi,
  isAnimeBookmarked,
  saveAnimeBookmark,
  removeAnimeBookmark,
  saveAnimeHistory,
} from '../services/animeApi';

interface AnimePlayerModalProps {
  anime: AnimeItem | null;
  onClose: () => void;
}

export const AnimePlayerModal: React.FC<AnimePlayerModalProps> = ({ anime, onClose }) => {
  const [detail, setDetail] = useState<AnimeDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEpisode, setSelectedEpisode] = useState<AnimeEpisodeItem | null>(null);
  const [serverQuality, setServerQuality] = useState<string>('720p');
  const [selectedServer, setSelectedServer] = useState<string>('Server Utama (HD)');
  const [bookmarked, setBookmarked] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    if (!anime) return;

    setBookmarked(isAnimeBookmarked(anime.slug));
    setLoading(true);

    fetchAnimeDetailApi(anime)
      .then((data) => {
        setDetail(data);
        if (data.episodes && data.episodes.length > 0) {
          setSelectedEpisode(data.episodes[0]); // default to Episode 1 or latest
        }
      })
      .catch((err) => console.error('Failed to load anime detail:', err))
      .finally(() => setLoading(false));
  }, [anime]);

  // Record history when episode is selected
  useEffect(() => {
    if (anime && selectedEpisode) {
      saveAnimeHistory({
        animeSlug: anime.slug,
        animeTitle: anime.title,
        image_url: anime.image_url,
        episodeSlug: selectedEpisode.slug,
        episodeTitle: selectedEpisode.title,
        watchedAt: new Date().toISOString(),
      });
    }
  }, [anime, selectedEpisode]);

  if (!anime) return null;

  const handleToggleBookmark = () => {
    if (bookmarked) {
      removeAnimeBookmark(anime.slug);
      setBookmarked(false);
    } else {
      saveAnimeBookmark({
        slug: anime.slug,
        title: anime.title,
        image_url: anime.image_url,
        rating: anime.rating,
        status: anime.status,
        addedAt: new Date().toISOString(),
        lastEpisodeSlug: selectedEpisode?.slug,
        lastEpisodeTitle: selectedEpisode?.title,
      });
      setBookmarked(true);
    }
  };

  const handleNextEpisode = () => {
    if (!detail?.episodes || !selectedEpisode) return;
    const currentIndex = detail.episodes.findIndex((e) => e.slug === selectedEpisode.slug);
    // Note: episodes are sorted descending or ascending
    if (currentIndex > 0) {
      setSelectedEpisode(detail.episodes[currentIndex - 1]);
    }
  };

  const handlePrevEpisode = () => {
    if (!detail?.episodes || !selectedEpisode) return;
    const currentIndex = detail.episodes.findIndex((e) => e.slug === selectedEpisode.slug);
    if (currentIndex < detail.episodes.length - 1) {
      setSelectedEpisode(detail.episodes[currentIndex + 1]);
    }
  };

  // Mock server video stream URL or iframe video player
  const getVideoSourceUrl = () => {
    // Elegant fallback streaming video player canvas
    return `https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&rel=0`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800/80 z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Film className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-100 truncate">{anime.title}</h2>
              <p className="text-[11px] text-amber-400 font-medium">
                {selectedEpisode ? selectedEpisode.title : 'Sedang Memuat...'} &bull; Subtitle Indonesia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleBookmark}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                bookmarked
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              {bookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{bookmarked ? 'Tersimpan' : 'Bookmark'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Main Video Player Player Section */}
          <div className="relative aspect-video w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner group">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-medium animate-pulse">Memuat Server Streaming...</p>
              </div>
            ) : (
              <div className="w-full h-full relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
                {/* Visual Video Screen Player Canvas */}
                <div className="absolute inset-0 bg-cover bg-center opacity-25 blur-sm" style={{ backgroundImage: `url(${anime.image_url})` }} />
                <div className="absolute inset-0 bg-slate-950/70" />

                <div className="relative z-10 max-w-md space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
                    <Play className="w-8 h-8 fill-amber-400 ml-1" />
                  </div>

                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-widest">
                      {selectedServer} &bull; {serverQuality}
                    </span>
                    <h3 className="text-lg font-extrabold text-white mt-2">
                      {selectedEpisode?.title || 'Episode 1'}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                      {anime.title}
                    </p>
                  </div>

                  {/* Player Controls Bar */}
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={handlePrevEpisode}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Prev Ep</span>
                    </button>

                    <a
                      href={`https://api.louiv.me/api/search?q=${encodeURIComponent(anime.title)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Putar Video HD</span>
                    </a>

                    <button
                      onClick={handleNextEpisode}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60"
                    >
                      <span>Next Ep</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Server & Quality Selection Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            {/* Servers */}
            <div>
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-2">
                <Server className="w-3.5 h-3.5 text-amber-400" /> Server Video
              </span>
              <div className="flex flex-wrap gap-2">
                {['Server Utama (HD)', 'Server Fast 2', 'Server Backup'].map((srv) => (
                  <button
                    key={srv}
                    onClick={() => setSelectedServer(srv)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      selectedServer === srv
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                  >
                    {srv}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Options */}
            <div>
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-2">
                <Monitor className="w-3.5 h-3.5 text-amber-400" /> Resolusi
              </span>
              <div className="flex flex-wrap gap-2">
                {['360p', '480p', '720p', '1080p Full HD'].map((q) => (
                  <button
                    key={q}
                    onClick={() => setServerQuality(q)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      serverQuality === q
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Episode List & Anime Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Episode List (2 Cols on lg) */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-amber-400" />
                  <span>Daftar Episode ({detail?.episodes.length || 0})</span>
                </h3>

                {selectedEpisode && (
                  <span className="text-xs text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Dipilih: {selectedEpisode.title}
                  </span>
                )}
              </div>

              {/* Episode Grid Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-1">
                {detail?.episodes.map((ep) => {
                  const isSelected = selectedEpisode?.slug === ep.slug;
                  return (
                    <button
                      key={ep.slug}
                      onClick={() => setSelectedEpisode(ep)}
                      className={`p-2.5 rounded-xl text-left border transition-all flex items-center justify-between group ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                    >
                      <span className="text-xs truncate">{ep.title}</span>
                      <Play className={`w-3 h-3 flex-shrink-0 ${isSelected ? 'fill-slate-950' : 'text-slate-500 group-hover:text-amber-400'}`} />
                    </button>
                  );
                })}
              </div>

              {/* Download Links Accordion/Box */}
              <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Download Episode ({selectedEpisode?.title || 'Episode 1'})</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {['360p SD', '480p SD', '720p HD', '1080p FHD'].map((res) => (
                    <div key={res} className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <span className="font-semibold text-slate-300">{res}</span>
                      <div className="flex gap-1.5">
                        <a
                          href="https://mega.nz"
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 font-mono text-[10px]"
                        >
                          Mega
                        </a>
                        <a
                          href="https://drive.google.com"
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 font-mono text-[10px]"
                        >
                          GDrive
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Anime Detail Overview (1 Col on lg) */}
            <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800 h-fit">
              <div className="flex gap-3">
                <img
                  src={anime.image_url}
                  alt={anime.title}
                  className="w-20 h-28 object-cover rounded-lg border border-slate-800 flex-shrink-0"
                />
                <div className="space-y-1.5 min-w-0">
                  <h4 className="text-sm font-bold text-slate-100 line-clamp-2">{anime.title}</h4>
                  <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-400">
                    {anime.rating && (
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="w-3 h-3 fill-amber-400" /> {anime.rating}
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                      {anime.status || 'Ongoing'}
                    </span>
                  </div>
                  {detail?.release_date && (
                    <p className="text-[11px] text-slate-500">Rilis: {detail.release_date}</p>
                  )}
                </div>
              </div>

              {/* Genre Pills */}
              {anime.genres && anime.genres.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Genre
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {anime.genres.map((g, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-amber-400 border border-slate-800">
                        {g.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Synopsis */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Sinopsis
                </span>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-5">
                  {detail?.synopsis || `Nonton anime ${anime.title} Subtitle Indonesia gratis di LouiComic.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
