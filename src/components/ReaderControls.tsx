import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  LayoutList,
  Layers,
  Palette,
  Play,
  Pause,
} from 'lucide-react';
import { ChapterItem, ReaderMode, ReaderBgColor } from '../types/manga';

interface ReaderControlsProps {
  mangaTitle: string;
  currentChapterName: string;
  chapters: ChapterItem[];
  currentChapterId: string;
  currentPage: number;
  totalPages: number;
  readerMode: ReaderMode;
  bgColor: ReaderBgColor;
  autoScrollSpeed: number;
  isFullscreen: boolean;
  onBackToDetail: () => void;
  onChangeChapter: (chapterId: string, chapterName: string) => void;
  onChangeMode: (mode: ReaderMode) => void;
  onChangeBgColor: (color: ReaderBgColor) => void;
  onToggleAutoScroll: () => void;
  onToggleFullscreen: () => void;
  onJumpPage: (page: number) => void;
}

export const ReaderControls: React.FC<ReaderControlsProps> = ({
  mangaTitle,
  currentChapterName,
  chapters,
  currentChapterId,
  currentPage,
  totalPages,
  readerMode,
  bgColor,
  autoScrollSpeed,
  isFullscreen,
  onBackToDetail,
  onChangeChapter,
  onChangeMode,
  onChangeBgColor,
  onToggleAutoScroll,
  onToggleFullscreen,
  onJumpPage,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const currentIndex = chapters.findIndex((c) => c.url === currentChapterId);
  const prevChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null; // Newest first
  const nextChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;

  return (
    <>
      {/* ================= TOP HEADER BAR ================= */}
      <div className="fixed top-0 inset-x-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/90 text-slate-100 shadow-lg px-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 flex items-center justify-between gap-2">
        
        {/* Left: Back & Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={onBackToDetail}
            className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer flex-shrink-0"
            title="Kembali ke Detail Komik"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
          </button>
          
          <div className="min-w-0 flex-1">
            <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-[120px] sm:max-w-xs">
              {mangaTitle}
            </h1>
            <p className="text-[10px] sm:text-xs text-amber-400 font-bold truncate">
              {currentChapterName}
            </p>
          </div>
        </div>

        {/* Right: Quick Settings / Mode / Fullscreen */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => onChangeMode('webtoon')}
              className={`p-2 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                readerMode === 'webtoon' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Mode Webtoon"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Webtoon</span>
            </button>
            <button
              onClick={() => onChangeMode('single')}
              className={`p-2 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                readerMode === 'single' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Mode Halaman"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Halaman</span>
            </button>
          </div>

          {/* Color Theme Selector Dropdown / Button */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
              title="Warna Latar"
            >
              <Palette className="w-4 h-4 text-amber-400" />
            </button>

            {showColorPicker && (
              <div className="absolute right-0 top-12 p-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex items-center gap-2 z-50 animate-fadeIn">
                <button
                  onClick={() => { onChangeBgColor('black'); setShowColorPicker(false); }}
                  className={`w-6 h-6 rounded-full bg-black border ${bgColor === 'black' ? 'ring-2 ring-amber-400 border-white' : 'border-slate-700'}`}
                  title="Hitam Pekat"
                />
                <button
                  onClick={() => { onChangeBgColor('dark'); setShowColorPicker(false); }}
                  className={`w-6 h-6 rounded-full bg-slate-950 border ${bgColor === 'dark' ? 'ring-2 ring-amber-400 border-white' : 'border-slate-700'}`}
                  title="Gelap Slate"
                />
                <button
                  onClick={() => { onChangeBgColor('sepia'); setShowColorPicker(false); }}
                  className={`w-6 h-6 rounded-full bg-[#1c1813] border ${bgColor === 'sepia' ? 'ring-2 ring-amber-400 border-white' : 'border-slate-700'}`}
                  title="Sepia Vintage"
                />
                <button
                  onClick={() => { onChangeBgColor('white'); setShowColorPicker(false); }}
                  className={`w-6 h-6 rounded-full bg-slate-100 border ${bgColor === 'white' ? 'ring-2 ring-amber-400 border-slate-900' : 'border-slate-300'}`}
                  title="Terang White"
                />
              </div>
            )}
          </div>

          {/* Auto Scroll Toggle (Webtoon mode) */}
          {readerMode === 'webtoon' && (
            <button
              onClick={onToggleAutoScroll}
              className={`p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                autoScrollSpeed > 0
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
              }`}
              title={autoScrollSpeed > 0 ? 'Hentikan Auto Scroll' : 'Mulai Auto Scroll'}
            >
              {autoScrollSpeed > 0 ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={onToggleFullscreen}
            className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            title="Layar Penuh"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ================= BOTTOM NAVIGATION & SLIDER BAR ================= */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/90 text-slate-100 shadow-2xl px-2 sm:px-4 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] flex items-center justify-between gap-1.5 sm:gap-3">
        
        {/* Prev Chapter Button */}
        <button
          disabled={!prevChapter}
          onClick={() => prevChapter && onChangeChapter(prevChapter.url, prevChapter.name)}
          className="px-2.5 py-2 min-h-[42px] flex items-center gap-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 disabled:opacity-30 text-xs font-bold transition-all cursor-pointer flex-shrink-0"
          title="Chapter Sebelumnya"
        >
          <ChevronLeft className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Center: Chapter Dropdown & Page Slider Container */}
        <div className="flex-1 flex items-center justify-center gap-2 max-w-xl min-w-0">
          
          {/* Chapter Selector Dropdown */}
          <select
            value={currentChapterId}
            onChange={(e) => {
              const selected = chapters.find((c) => c.url === e.target.value);
              if (selected) onChangeChapter(selected.url, selected.name);
            }}
            className="bg-slate-900 text-xs font-bold text-amber-300 border border-slate-800 rounded-xl px-2 py-2 min-h-[42px] focus:outline-none focus:border-amber-500 max-w-[100px] sm:max-w-[180px] truncate cursor-pointer flex-shrink-0"
          >
            {chapters.map((ch) => (
              <option key={ch.url} value={ch.url}>
                {ch.name}
              </option>
            ))}
          </select>

          {/* Page Progress Indicator & Range Slider */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0 bg-slate-900/80 px-2 py-1.5 rounded-xl border border-slate-800/80 min-h-[42px]">
            <span className="text-[11px] font-semibold text-slate-300 whitespace-nowrap hidden min-[400px]:inline">
              Hal <strong className="text-amber-400">{currentPage}</strong>/{totalPages || 1}
            </span>
            <span className="text-[11px] font-semibold text-slate-300 whitespace-nowrap min-[400px]:hidden">
              <strong className="text-amber-400">{currentPage}</strong>/{totalPages || 1}
            </span>

            {totalPages > 1 && (
              <input
                type="range"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => onJumpPage(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
            )}
          </div>
        </div>

        {/* Next Chapter Button */}
        <button
          disabled={!nextChapter}
          onClick={() => nextChapter && onChangeChapter(nextChapter.url, nextChapter.name)}
          className="px-3 py-2 min-h-[42px] flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold disabled:opacity-30 text-xs transition-all cursor-pointer shadow-md flex-shrink-0"
          title="Chapter Selanjutnya"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </>
  );
};
