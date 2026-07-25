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
  ExternalLink,
} from 'lucide-react';
import { AnimeItem, AnimeDetailData, AnimeEpisodeItem, EpisodeDetailData } from '../types/anime';
import {
  fetchAnimeDetailApi,
  fetchEpisodeDetailApi,
  extractStreamSrc,
  isAnimeBookmarked,
  saveAnimeBookmark,
  removeAnimeBookmark,
  saveAnimeHistory,
} from '../services/animeApi';
import { AnimeVideoPlayer } from './AnimeVideoPlayer';

interface AnimePlayerModalProps {
  anime: AnimeItem | null;
  onClose: () => void;
}

export const AnimePlayerModal: React.FC<AnimePlayerModalProps> = ({ anime, onClose }) => {
  const [detail, setDetail] = useState<AnimeDetailData | null>(null);
  const [episodeDetail, setEpisodeDetail] = useState<EpisodeDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingEpisode, setLoadingEpisode] = useState<boolean>(false);
  const [selectedEpisode, setSelectedEpisode] = useState<AnimeEpisodeItem | null>(null);
  const [selectedMirrorQuality, setSelectedMirrorQuality] = useState<string>('720p');
  const [selectedProviderName, setSelectedProviderName] = useState<string>('');
  const [bookmarked, setBookmarked] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    if (!anime) return;

    setBookmarked(isAnimeBookmarked(anime.slug));
    setLoading(true);
    setIsPlaying(false);

    fetchAnimeDetailApi(anime)
      .then((data) => {
        setDetail(data);
        if (data.episodes && data.episodes.length > 0) {
          setSelectedEpisode(data.episodes[0]); // default to first episode
        }
      })
      .catch((err) => console.error('Failed to load anime detail:', err))
      .finally(() => setLoading(false));
  }, [anime]);

  // Fetch episode details (mirrors, stream URL, downloads) when selectedEpisode changes
  useEffect(() => {
    if (!selectedEpisode) return;
    setLoadingEpisode(true);

    fetchEpisodeDetailApi(selectedEpisode.slug)
      .then((data) => {
        setEpisodeDetail(data);
        if (data?.mirrors && data.mirrors.length > 0) {
          const firstMirror = data.mirrors[0];
          setSelectedMirrorQuality(firstMirror.quality);
          if (firstMirror.providers && firstMirror.providers.length > 0) {
            const defProv = firstMirror.providers.find((p) => p.is_default) || firstMirror.providers[0];
            setSelectedProviderName(defProv.name);
          }
        }
      })
      .catch((err) => console.error('Failed to fetch episode detail:', err))
      .finally(() => setLoadingEpisode(false));
  }, [selectedEpisode]);

  // When selected mirror quality changes, set default provider for that quality
  useEffect(() => {
    if (!episodeDetail?.mirrors) return;
    const matchQual = episodeDetail.mirrors.find((m) => m.quality === selectedMirrorQuality) || episodeDetail.mirrors[0];
    if (matchQual && matchQual.providers && matchQual.providers.length > 0) {
      const defProv = matchQual.providers.find((p) => p.is_default) || matchQual.providers[0];
      setSelectedProviderName(defProv.name);
    }
  }, [selectedMirrorQuality, episodeDetail]);

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
    if (episodeDetail?.next_episode) {
      const nextEp = episodeDetail.next_episode;
      setSelectedEpisode({
        title: nextEp.title,
        slug: nextEp.slug,
        episode_number: 0,
      });
      return;
    }
    if (!detail?.episodes || !selectedEpisode) return;
    const currentIndex = detail.episodes.findIndex((e) => e.slug === selectedEpisode.slug);
    if (currentIndex > 0) {
      setSelectedEpisode(detail.episodes[currentIndex - 1]);
    }
  };

  const handlePrevEpisode = () => {
    if (episodeDetail?.previous_episode) {
      const prevEp = episodeDetail.previous_episode;
      setSelectedEpisode({
        title: prevEp.title,
        slug: prevEp.slug,
        episode_number: 0,
      });
      return;
    }
    if (!detail?.episodes || !selectedEpisode) return;
    const currentIndex = detail.episodes.findIndex((e) => e.slug === selectedEpisode.slug);
    if (currentIndex < detail.episodes.length - 1) {
      setSelectedEpisode(detail.episodes[currentIndex + 1]);
    }
  };

  // Resolve current active video stream iframe or video URL
  const getActiveStreamUrl = (): string | null => {
    if (!episodeDetail) return null;

    if (episodeDetail.mirrors && episodeDetail.mirrors.length > 0) {
      const qual = episodeDetail.mirrors.find((m) => m.quality === selectedMirrorQuality) || episodeDetail.mirrors[0];
      if (qual && qual.providers && qual.providers.length > 0) {
        const prov = qual.providers.find((p) => p.name === selectedProviderName) || qual.providers[0];
        if (prov && prov.data_content) {
          const src = extractStreamSrc(prov.data_content);
          if (src) return src;
        }
      }
    }

    if (episodeDetail.stream_url) {
      const src = extractStreamSrc(episodeDetail.stream_url);
      if (src) return src;
    }

    return null;
  };

  const activeStreamSrc = getActiveStreamUrl();

  // Stream URL used directly for video / iframe player
  const getEmbedStreamUrl = (url: string | null): string | null => {
    if (!url) return null;
    return url;
  };

  const activeEmbedSrc = getEmbedStreamUrl(activeStreamSrc);

  // Helper lists for servers & qualities
  const availableQualities = episodeDetail?.mirrors?.map((m) => m.quality) || ['360p', '480p', '720p', '1080p'];
  const currentQualityObject = episodeDetail?.mirrors?.find((m) => m.quality === selectedMirrorQuality) || episodeDetail?.mirrors?.[0];
  const availableProviders = currentQualityObject?.providers || [
    { name: 'Server Utama (HD)', data_content: null },
    { name: 'Server Fast 2', data_content: null },
    { name: 'Server Backup', data_content: null },
  ];

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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
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
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Main Video Player Section */}
          <div className="relative w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner group">
            {loading || loadingEpisode ? (
              <div className="aspect-video w-full flex flex-col items-center justify-center text-slate-400 gap-3 bg-slate-950">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-medium animate-pulse">Memuat Video Stream Episode...</p>
              </div>
            ) : isPlaying ? (
              <div className="relative w-full aspect-video bg-black group">
                {activeStreamSrc ? (
                  activeStreamSrc.endsWith('.mp4') || activeStreamSrc.endsWith('.m3u8') ? (
                    <video
                      key={activeStreamSrc}
                      src={activeStreamSrc}
                      poster={anime.image_url}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <iframe
                      key={activeEmbedSrc || activeStreamSrc}
                      src={activeEmbedSrc || activeStreamSrc}
                      title={selectedEpisode?.title || anime.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                      referrerPolicy="no-referrer"
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
                    <Film className="w-12 h-12 text-slate-600 mb-3" />
                    <p className="text-sm font-semibold text-slate-200">Stream video tidak tersedia untuk server ini</p>
                    <p className="text-xs text-slate-400 mt-1">Silakan pilih Server Provider lain di bawah</p>
                  </div>
                )}

                {/* Top overlay player controls */}
                <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                  {activeStreamSrc && (
                    <a
                      href={activeStreamSrc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Buka pemutar video langsung di tab baru"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Buka di Tab Baru</span>
                    </a>
                  )}
                  <button
                    onClick={() => setIsPlaying(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-xs text-slate-200 border border-slate-700/80 backdrop-blur-md shadow-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Tutup Pemutar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full h-full relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
                {/* Visual Video Screen Player Canvas */}
                <div className="absolute inset-0 bg-cover bg-center opacity-25 blur-sm" style={{ backgroundImage: `url(${anime.image_url})` }} />
                <div className="absolute inset-0 bg-slate-950/70" />

                <div className="relative z-10 max-w-md space-y-4">
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10 transition-transform active:scale-95 group/play cursor-pointer"
                    title="Putar Video"
                  >
                    <Play className="w-8 h-8 fill-amber-400 ml-1 group-hover/play:scale-110 transition-transform" />
                  </button>

                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-widest">
                      {selectedProviderName || 'Server Utama'} &bull; {selectedMirrorQuality}
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
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Prev Ep</span>
                    </button>

                    <button
                      onClick={() => setIsPlaying(true)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Putar Video HD</span>
                    </button>

                    <button
                      onClick={handleNextEpisode}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 transition-colors cursor-pointer"
                    >
                      <span>Next Ep</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Streaming Tip Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                <strong>Tips Streaming:</strong> Jika pemutar video tidak memuat (layar hitam), coba pilih <strong>Server Provider</strong> di bawah atau klik <strong>Buka di Tab Baru</strong>.
              </span>
            </div>
            {activeStreamSrc && (
              <a
                href={activeStreamSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-colors flex-shrink-0 cursor-pointer"
              >
                <span>Buka Tab Baru</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Server & Quality Selection Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            {/* Servers / Providers */}
            <div>
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-2">
                <Server className="w-3.5 h-3.5 text-amber-400" /> Server Provider ({selectedMirrorQuality})
              </span>
              <div className="flex flex-wrap gap-2">
                {availableProviders.map((prov) => (
                  <button
                    key={prov.name}
                    onClick={() => {
                      setSelectedProviderName(prov.name);
                      setIsPlaying(true);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      selectedProviderName === prov.name
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 font-bold'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                  >
                    {prov.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Options */}
            <div>
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-2">
                <Monitor className="w-3.5 h-3.5 text-amber-400" /> Resolusi Video
              </span>
              <div className="flex flex-wrap gap-2">
                {availableQualities.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setSelectedMirrorQuality(q);
                      setIsPlaying(true);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      selectedMirrorQuality === q
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
            {/* Episode List & Downloads (2 Cols on lg) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-amber-400" />
                  <span>Daftar Episode ({detail?.episodes.length || 0})</span>
                </h3>

                {selectedEpisode && (
                  <span className="text-xs text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 truncate max-w-[200px]">
                    Dipilih: {selectedEpisode.title}
                  </span>
                )}
              </div>

              {/* Episode Grid Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-1">
                {(episodeDetail?.episode_selector || detail?.episodes)?.map((ep) => {
                  const isSelected = selectedEpisode?.slug === ep.slug;
                  return (
                    <button
                      key={ep.slug}
                      onClick={() => {
                        setSelectedEpisode({
                          title: ep.title,
                          slug: ep.slug,
                          episode_number: 0,
                        });
                        setIsPlaying(true);
                      }}
                      className={`p-2.5 rounded-xl text-left border transition-all flex items-center justify-between group cursor-pointer ${
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

                {episodeDetail?.downloads && episodeDetail.downloads.length > 0 ? (
                  <div className="space-y-2">
                    {episodeDetail.downloads.map((dl, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-400">{dl.quality}</span>
                          {dl.size && <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">({dl.size})</span>}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {dl.links.map((link, lIdx) => (
                            <a
                              key={lIdx}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-[11px] border border-slate-700/60 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3 h-3 text-amber-400" />
                              <span>{link.provider}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
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
                )}
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

