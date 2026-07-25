import React, { useState, useEffect } from 'react';
import { ChapterPage, ChapterItem } from '../types/manga';
import { getProxiedImageUrl } from '../services/api';
import { ChevronLeft, ChevronRight, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';

interface SinglePageReaderProps {
  pages: ChapterPage[];
  currentPage: number;
  onPageChange: (pageNumber: number) => void;
  prevChapter: ChapterItem | null;
  nextChapter: ChapterItem | null;
  onNavigateChapter: (chapterId: string, chapterName: string) => void;
}

export const SinglePageReader: React.FC<SinglePageReaderProps> = ({
  pages,
  currentPage,
  onPageChange,
  prevChapter,
  nextChapter,
  onNavigateChapter,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imgAttempt, setImgAttempt] = useState<number>(0);

  const pageIndex = Math.max(0, Math.min(currentPage - 1, pages.length - 1));
  const activePage = pages[pageIndex];

  // Reset image attempt on page change
  useEffect(() => {
    setImgAttempt(0);
  }, [currentPage]);

  // Keyboard Navigation Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (currentPage < pages.length) {
          onPageChange(currentPage + 1);
        } else if (nextChapter) {
          onNavigateChapter(nextChapter.url, nextChapter.name);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (currentPage > 1) {
          onPageChange(currentPage - 1);
        } else if (prevChapter) {
          onNavigateChapter(prevChapter.url, prevChapter.name);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, pages.length, prevChapter, nextChapter, onPageChange, onNavigateChapter]);

  if (!activePage) return null;

  let pageUrl = getProxiedImageUrl(activePage.imageUrl);
  if (imgAttempt === 1 && activePage.imageUrl?.startsWith('http')) {
    pageUrl = activePage.imageUrl;
  }
  const hasFailed = imgAttempt >= 2;

  return (
    <div className="w-full min-h-screen pt-24 pb-16 flex flex-col items-center justify-between px-4">
      
      {/* Zoom Toolbar */}
      <div className="flex items-center gap-2 mb-3 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800 text-xs text-slate-300">
        <button
          onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.2))}
          className="p-1 hover:text-amber-400"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="font-semibold text-amber-400">{Math.round(zoomLevel * 100)}%</span>
        <button
          onClick={() => setZoomLevel((z) => Math.min(2, z + 0.2))}
          className="p-1 hover:text-amber-400"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomLevel(1)}
          className="ml-2 text-[10px] text-slate-400 hover:text-white underline"
        >
          Reset
        </button>
      </div>

      {/* Main Image Container */}
      <div className="relative w-full max-w-4xl flex items-center justify-center min-h-[500px]">
        
        {/* Left Click Region */}
        <button
          onClick={() => {
            if (currentPage > 1) onPageChange(currentPage - 1);
            else if (prevChapter) onNavigateChapter(prevChapter.url, prevChapter.name);
          }}
          className="absolute left-0 top-0 bottom-0 w-1/4 z-20 flex items-center justify-start pl-4 group opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-r from-slate-950/60 to-transparent"
        >
          <div className="p-3 rounded-full bg-amber-500 text-slate-950 shadow-xl group-hover:scale-110 transition-transform">
            <ChevronLeft className="w-6 h-6" />
          </div>
        </button>

        {/* Right Click Region */}
        <button
          onClick={() => {
            if (currentPage < pages.length) onPageChange(currentPage + 1);
            else if (nextChapter) onNavigateChapter(nextChapter.url, nextChapter.name);
          }}
          className="absolute right-0 top-0 bottom-0 w-1/4 z-20 flex items-center justify-end pr-4 group opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-l from-slate-950/60 to-transparent"
        >
          <div className="p-3 rounded-full bg-amber-500 text-slate-950 shadow-xl group-hover:scale-110 transition-transform">
            <ChevronRight className="w-6 h-6" />
          </div>
        </button>

        {/* Page Image */}
        {hasFailed ? (
          <div className="p-8 my-10 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3">
            <p className="text-sm text-rose-400 font-medium">Gagal memuat gambar halaman {currentPage}</p>
            <button
              onClick={() => setImgAttempt(0)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Muat Ulang
            </button>
          </div>
        ) : (
          <div className="overflow-auto max-h-[80vh] flex items-center justify-center transition-all">
            <img
              src={pageUrl}
              alt={`Halaman ${currentPage}`}
              referrerPolicy="no-referrer"
              onError={() => setImgAttempt((prev) => prev + 1)}
              style={{ transform: `scale(${zoomLevel})` }}
              className="max-h-[75vh] w-auto object-contain select-none shadow-2xl rounded transition-transform duration-200"
            />
          </div>
        )}
      </div>

      {/* Page Turn Controls Footer */}
      <div className="mt-6 flex items-center gap-4 bg-slate-900/90 border border-slate-800 px-6 py-3 rounded-2xl shadow-xl">
        <button
          disabled={currentPage <= 1 && !prevChapter}
          onClick={() => {
            if (currentPage > 1) onPageChange(currentPage - 1);
            else if (prevChapter) onNavigateChapter(prevChapter.url, prevChapter.name);
          }}
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-semibold text-xs"
        >
          <ChevronLeft className="w-4 h-4 text-amber-400" />
          <span>Sebelumnya</span>
        </button>

        <span className="text-xs font-bold text-amber-400">
          {currentPage} / {pages.length}
        </span>

        <button
          disabled={currentPage >= pages.length && !nextChapter}
          onClick={() => {
            if (currentPage < pages.length) onPageChange(currentPage + 1);
            else if (nextChapter) onNavigateChapter(nextChapter.url, nextChapter.name);
          }}
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
        >
          <span>Selanjutnya</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
