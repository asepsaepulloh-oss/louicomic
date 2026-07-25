import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { App as CapApp } from '@capacitor/app';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HeroBanner } from './components/HeroBanner';
import { GenrePills } from './components/GenrePills';
import { MangaCard } from './components/MangaCard';
import { ChapterList } from './components/ChapterList';
import { ReaderControls } from './components/ReaderControls';
import { WebtoonReader } from './components/WebtoonReader';
import { SinglePageReader } from './components/SinglePageReader';
import { AnimeSection } from './components/AnimeSection';
import {
  fetchPopularManga,
  fetchLatestManga,
  searchManga,
  fetchMangaDetail,
  fetchMangaChapters,
  fetchChapterPages,
  getProxiedImageUrl,
} from './services/api';
import {
  fetchUserBookmarks,
  addBookmark,
  removeBookmark,
  fetchUserHistory,
  saveReadingProgress,
  clearUserHistory,
} from './services/supabase';
import {
  MangaItem,
  MangaDetail,
  ChapterItem,
  ChapterPage,
  BookmarkItem,
  ReadingHistoryItem,
  ReaderMode,
  ReaderBgColor,
} from './types/manga';
import {
  BookOpen,
  Flame,
  Clock,
  Heart,
  History,
  Search,
  ArrowLeft,
  Play,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

function AppContent() {
  const { userId } = useAuth();

  // Navigation & State
  const [currentTab, setCurrentTab] = useState<string>('home'); // 'home' | 'popular' | 'latest' | 'bookmarks' | 'history'
  const [selectedMangaId, setSelectedMangaId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedChapterName, setSelectedChapterName] = useState<string>('');

  // Data State
  const [popularMangas, setPopularMangas] = useState<MangaItem[]>([]);
  const [latestMangas, setLatestMangas] = useState<MangaItem[]>([]);
  const [searchResults, setSearchResults] = useState<MangaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  
  const [mangaDetail, setMangaDetail] = useState<MangaDetail | null>(null);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [chapterPages, setChapterPages] = useState<ChapterPage[]>([]);

  // User Bookmarks & History
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);

  // Reader Settings
  const [readerMode, setReaderMode] = useState<ReaderMode>('webtoon');
  const [readerBgColor, setReaderBgColor] = useState<ReaderBgColor>('dark');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Pagination & Loading
  const [page, setPage] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [readerLoading, setReaderLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load Bookmarks & History on User Change
  useEffect(() => {
    loadUserUserData();
  }, [userId]);

  // Capacitor Deep Link Listener for Mobile OAuth Callbacks
  useEffect(() => {
    const sub = CapApp.addListener('appUrlOpen', (data) => {
      console.log('Capacitor App URL Opened:', data.url);
      if (data.url.includes('clerk') || data.url.includes('callback') || data.url.includes('token')) {
        // If deep link contains callback, reload or let Clerk JS handle URL params
        window.location.href = data.url;
      }
    });
    return () => {
      sub.then((s) => s.remove()).catch(() => {});
    };
  }, []);

  const loadUserUserData = async () => {
    try {
      const bks = await fetchUserBookmarks(userId);
      setBookmarks(bks);
      const hist = await fetchUserHistory(userId);
      setHistory(hist);
    } catch (e) {
      console.warn('Gagal memuat data pengguna:', e);
    }
  };

  // Fetch Home/Popular/Latest Data
  const loadMangaList = useCallback(
    async (targetTab: string, pageNum: number, genre: string = '', query: string = '') => {
      setLoading(true);
      setErrorMsg(null);
      try {
        if (query.trim()) {
          const res = await searchManga(query, pageNum);
          setSearchResults(res.mangas);
          setHasNextPage(res.hasNextPage);
        } else if (genre) {
          const res = await searchManga(genre, pageNum);
          setSearchResults(res.mangas);
          setHasNextPage(res.hasNextPage);
        } else if (targetTab === 'popular') {
          const res = await fetchPopularManga(pageNum);
          setPopularMangas(res.mangas);
          setHasNextPage(res.hasNextPage);
        } else if (targetTab === 'latest') {
          const res = await fetchLatestManga(pageNum);
          setLatestMangas(res.mangas);
          setHasNextPage(res.hasNextPage);
        } else {
          // Home Tab: fetch both popular & latest page 1
          const [popRes, latRes] = await Promise.all([
            fetchPopularManga(1),
            fetchLatestManga(1),
          ]);
          setPopularMangas(popRes.mangas);
          setLatestMangas(latRes.mangas);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal memuat daftar komik dari server Shinigami.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!selectedMangaId && !selectedChapterId) {
      loadMangaList(currentTab, page, selectedGenre, searchQuery);
    }
  }, [currentTab, page, selectedGenre, searchQuery, selectedMangaId, selectedChapterId, loadMangaList]);

  // Load Manga Detail & Chapters
  const handleSelectManga = async (mangaId: string) => {
    setSelectedMangaId(mangaId);
    setSelectedChapterId(null);
    setMangaDetail(null);
    setChapters([]);
    setDetailLoading(true);
    setErrorMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const [detail, chaps] = await Promise.all([
        fetchMangaDetail(mangaId),
        fetchMangaChapters(mangaId),
      ]);
      setMangaDetail(detail);
      setChapters(chaps);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengambil detail komik.');
    } finally {
      setDetailLoading(false);
    }
  };

  // Load Chapter Reader
  const handleSelectChapter = async (chapterId: string, chapterName: string) => {
    setSelectedChapterId(chapterId);
    setSelectedChapterName(chapterName);
    setChapterPages([]);
    setCurrentPage(1);
    setReaderLoading(true);
    setErrorMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const pagesData = await fetchChapterPages(chapterId);
      setChapterPages(pagesData);

      // Save Reading Progress
      if (mangaDetail && selectedMangaId) {
        const updatedHistory = await saveReadingProgress(
          {
            mangaId: selectedMangaId,
            title: mangaDetail.title,
            thumbnail: mangaDetail.thumbnail,
            chapterId,
            chapterName,
            page: 1,
            totalPages: pagesData.length,
          },
          userId
        );
        setHistory(updatedHistory);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengambil gambar chapter komik.');
    } finally {
      setReaderLoading(false);
    }
  };

  // Handle Bookmarking
  const bookmarkedIdsSet = useMemo(() => new Set(bookmarks.map((b) => b.mangaId)), [bookmarks]);

  const handleToggleBookmark = async (manga: MangaItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isSaved = bookmarkedIdsSet.has(manga.url);

    if (isSaved) {
      const updated = await removeBookmark(manga.url, userId);
      setBookmarks(updated);
    } else {
      const updated = await addBookmark(
        {
          mangaId: manga.url,
          title: manga.title,
          thumbnail: manga.thumbnail,
        },
        userId
      );
      setBookmarks(updated);
    }
  };

  // Search Submit Handler
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedGenre('');
    setSelectedMangaId(null);
    setSelectedChapterId(null);
    setCurrentTab('search');
    setPage(1);
  };

  // Genre Filter Handler
  const handleSelectGenre = (genre: string) => {
    setSelectedGenre(genre);
    setSearchQuery('');
    setSelectedMangaId(null);
    setSelectedChapterId(null);
    setCurrentTab('genre');
    setPage(1);
  };

  // Clear Reading History
  const handleClearHistory = async () => {
    if (confirm('Apakah kamu yakin ingin menghapus semua riwayat bacaan?')) {
      await clearUserHistory(userId);
      setHistory([]);
    }
  };

  // History chapter ids set for reading badge
  const historyChapterIdsSet = useMemo(() => {
    return new Set(history.map((h) => h.chapterId));
  }, [history]);

  // Find last read chapter for selected manga
  const lastReadChapterObj = useMemo(() => {
    if (!selectedMangaId) return null;
    return history.find((h) => h.mangaId === selectedMangaId) || null;
  }, [selectedMangaId, history]);

  // Background style for reader
  const readerBgClass = useMemo(() => {
    switch (readerBgColor) {
      case 'black':
        return 'bg-black text-slate-100';
      case 'sepia':
        return 'bg-[#1c1813] text-[#e8ded1]';
      case 'white':
        return 'bg-slate-100 text-slate-900';
      default:
        return 'bg-slate-950 text-slate-100';
    }
  }, [readerBgColor]);

  // Render Full Reader Mode
  if (selectedChapterId) {
    return (
      <div className={`min-h-screen ${readerBgClass} transition-colors duration-300`}>
        <ReaderControls
          mangaTitle={mangaDetail?.title || 'LouiComic'}
          currentChapterName={selectedChapterName}
          chapters={chapters}
          currentChapterId={selectedChapterId}
          currentPage={currentPage}
          totalPages={chapterPages.length}
          readerMode={readerMode}
          bgColor={readerBgColor}
          autoScrollSpeed={autoScrollSpeed}
          isFullscreen={isFullscreen}
          onBackToDetail={() => setSelectedChapterId(null)}
          onChangeChapter={(chId, chName) => handleSelectChapter(chId, chName)}
          onChangeMode={(mode) => setReaderMode(mode)}
          onChangeBgColor={(color) => setReaderBgColor(color)}
          onToggleAutoScroll={() => setAutoScrollSpeed((prev) => (prev > 0 ? 0 : 2))}
          onToggleFullscreen={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {});
              setIsFullscreen(true);
            } else {
              document.exitFullscreen().catch(() => {});
              setIsFullscreen(false);
            }
          }}
          onJumpPage={(p) => setCurrentPage(p)}
        />

        {readerLoading ? (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-4 pt-24">
            <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
            <p className="text-sm font-semibold text-amber-400">Memuat gambar chapter komik...</p>
          </div>
        ) : errorMsg ? (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4 pt-24">
            <AlertCircle className="w-12 h-12 text-rose-500" />
            <h3 className="text-lg font-bold text-white">Gagal Memuat Chapter</h3>
            <p className="text-sm text-slate-400 max-w-md">{errorMsg}</p>
            <button
              onClick={() => handleSelectChapter(selectedChapterId, selectedChapterName)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
            >
              Coba Muat Ulang
            </button>
          </div>
        ) : readerMode === 'webtoon' ? (
          <WebtoonReader
            pages={chapterPages}
            autoScrollSpeed={autoScrollSpeed}
            onPageVisible={(p) => setCurrentPage(p)}
            prevChapter={
              chapters.findIndex((c) => c.url === selectedChapterId) < chapters.length - 1
                ? chapters[chapters.findIndex((c) => c.url === selectedChapterId) + 1]
                : null
            }
            nextChapter={
              chapters.findIndex((c) => c.url === selectedChapterId) > 0
                ? chapters[chapters.findIndex((c) => c.url === selectedChapterId) - 1]
                : null
            }
            onNavigateChapter={(chId, chName) => handleSelectChapter(chId, chName)}
          />
        ) : (
          <SinglePageReader
            pages={chapterPages}
            currentPage={currentPage}
            onPageChange={(p) => setCurrentPage(p)}
            prevChapter={
              chapters.findIndex((c) => c.url === selectedChapterId) < chapters.length - 1
                ? chapters[chapters.findIndex((c) => c.url === selectedChapterId) + 1]
                : null
            }
            nextChapter={
              chapters.findIndex((c) => c.url === selectedChapterId) > 0
                ? chapters[chapters.findIndex((c) => c.url === selectedChapterId) - 1]
                : null
            }
            onNavigateChapter={(chId, chName) => handleSelectChapter(chId, chName)}
          />
        )}
      </div>
    );
  }

  // Render Manga Detail View
  if (selectedMangaId) {
    const isBookmarked = bookmarkedIdsSet.has(selectedMangaId);
    const proxiedCover = mangaDetail ? getProxiedImageUrl(mangaDetail.thumbnail) : '';

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Header
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setSelectedMangaId(null);
            setCurrentTab(tab);
          }}
          onSearch={handleSearch}
          bookmarkCount={bookmarks.length}
          historyCount={history.length}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* Back Button */}
          <button
            onClick={() => setSelectedMangaId(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Kembali ke Beranda</span>
          </button>

          {detailLoading ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-sm font-semibold text-amber-400">Memuat detail komik...</p>
            </div>
          ) : errorMsg ? (
            <div className="py-16 text-center space-y-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-8">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <h3 className="text-lg font-bold text-white">Gagal Memuat Komik</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">{errorMsg}</p>
              <button
                onClick={() => handleSelectManga(selectedMangaId)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Coba Lagi
              </button>
            </div>
          ) : mangaDetail ? (
            <>
              {/* Manga Banner & Detail Card */}
              <div className="relative bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start">
                
                {/* Backdrop Blur Poster */}
                <div
                  className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 scale-125"
                  style={{ backgroundImage: `url(${proxiedCover})` }}
                />

                {/* Cover Image */}
                <div className="relative z-10 w-48 sm:w-56 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border-2 border-amber-500/30 flex-shrink-0 mx-auto md:mx-0">
                  <img
                    src={proxiedCover}
                    alt={mangaDetail.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (mangaDetail.thumbnail && !target.src.includes(encodeURIComponent(mangaDetail.thumbnail))) {
                        target.src = mangaDetail.thumbnail;
                      } else {
                        target.src = 'https://placehold.co/300x420/1e293b/94a3b8?text=LouiComic';
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                  <span
                    className={`absolute top-2 left-2 px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase shadow tracking-wider ${
                      mangaDetail.status === 'Ongoing'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {mangaDetail.status || 'Ongoing'}
                  </span>
                </div>

                {/* Metadata Column */}
                <div className="relative z-10 flex-1 space-y-4 text-center md:text-left">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-snug">
                    {mangaDetail.title}
                  </h1>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-xs text-slate-300 font-medium">
                    <div>
                      <span className="text-slate-400">Pengarang: </span>
                      <span className="text-amber-400 font-bold">{mangaDetail.author || 'Tidak Diketahui'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Artis: </span>
                      <span className="text-amber-400 font-bold">{mangaDetail.artist || 'Tidak Diketahui'}</span>
                    </div>
                  </div>

                  {/* Genre Pills */}
                  {mangaDetail.genre && (
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-1">
                      {mangaDetail.genre.split(',').map((g) => (
                        <span
                          key={g}
                          onClick={() => handleSelectGenre(g.trim())}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold cursor-pointer hover:bg-amber-500/20 transition-colors"
                        >
                          {g.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Synopsis */}
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                    {mangaDetail.description || 'Belum ada sinopsis untuk komik ini.'}
                  </p>

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                    {lastReadChapterObj ? (
                      <button
                        onClick={() =>
                          handleSelectChapter(
                            lastReadChapterObj.chapterId,
                            lastReadChapterObj.chapterName
                          )
                        }
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/20 transition-all transform active:scale-95"
                      >
                        <Play className="w-4 h-4 fill-slate-950" />
                        <span>Lanjutkan ({lastReadChapterObj.chapterName})</span>
                      </button>
                    ) : (
                      chapters.length > 0 && (
                        <button
                          onClick={() =>
                            handleSelectChapter(
                              chapters[chapters.length - 1].url,
                              chapters[chapters.length - 1].name
                            )
                          }
                          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/20 transition-all transform active:scale-95"
                        >
                          <Play className="w-4 h-4 fill-slate-950" />
                          <span>Mulai Baca (Chapter Pertama)</span>
                        </button>
                      )
                    )}

                    <button
                      onClick={() =>
                        handleToggleBookmark({
                          title: mangaDetail.title,
                          thumbnail: mangaDetail.thumbnail,
                          url: selectedMangaId,
                        })
                      }
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm border transition-all ${
                        isBookmarked
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-rose-400 text-rose-400' : ''}`} />
                      <span>{isBookmarked ? 'Disimpan' : 'Tambah Bookmark'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Chapter List Section */}
              <ChapterList
                chapters={chapters}
                mangaId={selectedMangaId}
                historyChapterIds={historyChapterIdsSet}
                onSelectChapter={handleSelectChapter}
              />
            </>
          ) : null}
        </main>

        <Footer />
      </div>
    );
  }

  // Active Main View Content Renderer
  const renderMainTabContent = () => {
    // 0. ANIME TAB
    if (currentTab === 'anime') {
      return <AnimeSection initialSearchQuery={searchQuery} />;
    }

    // 1. BOOKMARKS TAB
    if (currentTab === 'bookmarks') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-current" />
              <span>Komik Bookmark Saya</span>
            </h2>
            <span className="text-xs text-slate-400 font-semibold bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              Total {bookmarks.length} Komik
            </span>
          </div>

          {bookmarks.length === 0 ? (
            <div className="py-20 text-center bg-slate-900/60 rounded-2xl border border-slate-800 p-8 space-y-4">
              <Heart className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">Belum Ada Bookmark</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Klik ikon hati pada komik favorit kamu untuk menyimpannya ke daftar bookmark!
              </p>
              <button
                onClick={() => setCurrentTab('popular')}
                className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Jelajahi Komik Populer
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {bookmarks.map((b) => (
                <MangaCard
                  key={b.mangaId}
                  manga={{ title: b.title, thumbnail: b.thumbnail, url: b.mangaId }}
                  isBookmarked={true}
                  onToggleBookmark={(m, e) => handleToggleBookmark(m, e)}
                  onClick={handleSelectManga}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    // 2. HISTORY TAB
    if (currentTab === 'history') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" />
              <span>Riwayat Terakhir Dibaca</span>
            </h2>

            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Riwayat</span>
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="py-20 text-center bg-slate-900/60 rounded-2xl border border-slate-800 p-8 space-y-4">
              <History className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">Belum Ada Riwayat Bacaan</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Mulai membaca komik pilihanmu dan progress bacaan kamu akan otomatis tersimpan di sini!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={`${item.mangaId}-${item.chapterId}`}
                  onClick={() => handleSelectManga(item.mangaId)}
                  className="group flex items-center justify-between p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={getProxiedImageUrl(item.thumbnail)}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (item.thumbnail && !target.src.includes(encodeURIComponent(item.thumbnail))) {
                          target.src = item.thumbnail;
                        } else {
                          target.src = 'https://placehold.co/300x420/1e293b/94a3b8?text=LouiComic';
                        }
                      }}
                      className="w-12 h-16 object-cover rounded-lg flex-shrink-0 border border-slate-800"
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                        {item.title}
                      </h3>
                      <p className="text-xs text-amber-400 font-semibold mt-0.5">
                        {item.chapterName} (Halaman {item.page} dari {item.totalPages || '?'})
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Terakhir dibaca: {new Date(item.lastReadAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectManga(item.mangaId);
                      handleSelectChapter(item.chapterId, item.chapterName);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex-shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Lanjut Baca</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 3. SEARCH / GENRE RESULTS
    if (currentTab === 'search' || currentTab === 'genre') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-amber-400" />
              <span>
                Hasil {searchQuery ? `Pencarian "${searchQuery}"` : `Genre "${selectedGenre}"`}
              </span>
            </h2>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedGenre('');
                setCurrentTab('home');
              }}
              className="text-xs text-amber-400 hover:underline"
            >
              Reset Filter
            </button>
          </div>

          <GenrePills selectedGenre={selectedGenre} onSelectGenre={handleSelectGenre} />

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs font-semibold text-amber-400">Mencari komik...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-16 text-center bg-slate-900/60 rounded-2xl border border-slate-800 p-8">
              <p className="text-slate-400 text-sm">Tidak ada komik yang ditemukan untuk pencarian ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {searchResults.map((manga) => (
                <MangaCard
                  key={manga.url}
                  manga={manga}
                  isBookmarked={bookmarkedIdsSet.has(manga.url)}
                  onToggleBookmark={handleToggleBookmark}
                  onClick={handleSelectManga}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    // 4. POPULAR TAB
    if (currentTab === 'popular') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span>Komik Paling Populer</span>
            </h2>
          </div>

          <GenrePills selectedGenre={selectedGenre} onSelectGenre={handleSelectGenre} />

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs font-semibold text-amber-400">Memuat komik populer...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {popularMangas.map((manga) => (
                <MangaCard
                  key={manga.url}
                  manga={manga}
                  isBookmarked={bookmarkedIdsSet.has(manga.url)}
                  onToggleBookmark={handleToggleBookmark}
                  onClick={handleSelectManga}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          <div className="flex items-center justify-center gap-4 pt-6">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-xs font-bold text-slate-200"
            >
              <ChevronLeft className="w-4 h-4 text-amber-400" />
              <span>Sebelumnya</span>
            </button>
            <span className="text-xs font-bold text-amber-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
              Halaman {page}
            </span>
            <button
              disabled={!hasNextPage}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-bold text-xs"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    // 5. LATEST TAB
    if (currentTab === 'latest') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Update Komik Terbaru</span>
            </h2>
          </div>

          <GenrePills selectedGenre={selectedGenre} onSelectGenre={handleSelectGenre} />

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs font-semibold text-amber-400">Memuat update terbaru...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {latestMangas.map((manga) => (
                <MangaCard
                  key={manga.url}
                  manga={manga}
                  isBookmarked={bookmarkedIdsSet.has(manga.url)}
                  onToggleBookmark={handleToggleBookmark}
                  onClick={handleSelectManga}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-center gap-4 pt-6">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-xs font-bold text-slate-200"
            >
              <ChevronLeft className="w-4 h-4 text-amber-400" />
              <span>Sebelumnya</span>
            </button>
            <span className="text-xs font-bold text-amber-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
              Halaman {page}
            </span>
            <button
              disabled={!hasNextPage}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-bold text-xs"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    // 6. DEFAULT HOME VIEW
    return (
      <div className="space-y-10">
        
        {/* Featured Hero Banner */}
        {popularMangas.length > 0 && (
          <HeroBanner
            featuredList={popularMangas.slice(0, 5)}
            bookmarkedIds={bookmarkedIdsSet}
            onToggleBookmark={handleToggleBookmark}
            onSelectManga={handleSelectManga}
          />
        )}

        {/* Quick Genre Pills */}
        <GenrePills selectedGenre={selectedGenre} onSelectGenre={handleSelectGenre} />

        {/* Popular Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span>Komik Populer Minggu Ini</span>
            </h2>
            <button
              onClick={() => setCurrentTab('popular')}
              className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading && popularMangas.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-slate-900 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {popularMangas.slice(0, 12).map((manga) => (
                <MangaCard
                  key={manga.url}
                  manga={manga}
                  isBookmarked={bookmarkedIdsSet.has(manga.url)}
                  onToggleBookmark={handleToggleBookmark}
                  onClick={handleSelectManga}
                />
              ))}
            </div>
          )}
        </section>

        {/* Latest Updates Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Rilisan Komik Terbaru</span>
            </h2>
            <button
              onClick={() => setCurrentTab('latest')}
              className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading && latestMangas.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-slate-900 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {latestMangas.slice(0, 12).map((manga) => (
                <MangaCard
                  key={manga.url}
                  manga={manga}
                  isBookmarked={bookmarkedIdsSet.has(manga.url)}
                  onToggleBookmark={handleToggleBookmark}
                  onClick={handleSelectManga}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedMangaId(null);
          setSelectedChapterId(null);
          setCurrentTab(tab);
        }}
        onSearch={handleSearch}
        bookmarkCount={bookmarks.length}
        historyCount={history.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {errorMsg && !selectedMangaId && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => loadMangaList(currentTab, page, selectedGenre, searchQuery)}
              className="px-3 py-1 bg-rose-500 text-white rounded font-bold hover:bg-rose-600"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {renderMainTabContent()}
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
