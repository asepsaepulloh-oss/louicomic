import React from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  BookOpen,
  LayoutList,
  Layers,
  Palette,
  Play,
  Pause,
  RotateCcw,
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
  const currentIndex = chapters.findIndex((c) => c.url === currentChapterId);
  const prevChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null; // chapters usually sorted newest first
  const nextChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-2xl transition-all">
      
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        
        {/* Left: Back & Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onBackToDetail}
            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Kembali ke Detail Komik"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-[140px] sm:max-w-md">
              {mangaTitle}
            </h1>
            <p className="text-[11px] text-amber-400 font-bold truncate">
              {currentChapterName}
            </p>
          </div>
        </div>

        {/* Center: Chapter Switcher Dropdown (Visible on Desktop & Mobile!) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            disabled={!prevChapter}
            onClick={() => prevChapter && onChangeChapter(prevChapter.url, prevChapter.name)}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 transition-colors cursor-pointer"
            title="Chapter Sebelumnya"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <select
            value={currentChapterId}
            onChange={(e) => {
              const selected = chapters.find((c) => c.url === e.target.value);
              if (selected) onChangeChapter(selected.url, selected.name);
            }}
            className="bg-slate-900 text-xs font-bold text-amber-300 border border-slate-700 rounded-xl px-2.5 sm:px-3 py-2.5 min-h-[44px] focus:outline-none focus:border-amber-500 max-w-[130px] sm:max-w-[220px] cursor-pointer"
          >
            {chapters.map((ch) => (
              <option key={ch.url} value={ch.url}>
                {ch.name}
              </option>
            ))}
          </select>

          <button
            disabled={!nextChapter}
            onClick={() => nextChapter && onChangeChapter(nextChapter.url, nextChapter.name)}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-slate-950 font-bold transition-colors cursor-pointer"
            title="Chapter Selanjutnya"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Controls & Preferences */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => onChangeMode('webtoon')}
              className={`px-2.5 py-2 min-h-[40px] rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                readerMode === 'webtoon' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Mode Webtoon (Gulung Kebawah)"
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">Webtoon</span>
            </button>
            <button
              onClick={() => onChangeMode('single')}
              className={`px-2.5 py-2 min-h-[40px] rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                readerMode === 'single' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Mode Per Halaman"
            >
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Halaman</span>
            </button>
          </div>

          {/* Background Color Selector */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1.5">
            <Palette className="w-4 h-4 text-slate-400 ml-1" />
            <button
              onClick={() => onChangeBgColor('black')}
              className={`w-5 h-5 rounded-full bg-black border cursor-pointer ${bgColor === 'black' ? 'ring-2 ring-amber-400 border-white' : 'border-slate-700'}`}
              title="Latar Hitam"
            />
            <button
              onClick={() => onChangeBgColor('dark')}
              className={`w-5 h-5 rounded-full bg-slate-900 border cursor-pointer ${bgColor === 'dark' ? 'ring-2 ring-amber-400 border-white' : 'border-slate-700'}`}
              title="Latar Slate"
            />
            <button
              onClick={() => onChangeBgColor('sepia')}
              className={`w-5 h-5 rounded-full bg-[#2d261e] border cursor-pointer ${bgColor === 'sepia' ? 'ring-2 ring-amber-400 border-white' : 'border-slate-700'}`}
              title="Latar Sepia"
            />
          </div>

          {/* Auto Scroll Toggle (Webtoon mode only) */}
          {readerMode === 'webtoon' && (
            <button
              onClick={onToggleAutoScroll}
              className={`p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                autoScrollSpeed > 0
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title={autoScrollSpeed > 0 ? 'Hentikan Otomatis Scroll' : 'Jalankan Otomatis Scroll'}
            >
              {autoScrollSpeed > 0 ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={onToggleFullscreen}
            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Layar Penuh"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Bottom Page Progress Bar */}
      <div className="bg-slate-900/95 border-t border-slate-800/80 px-3 sm:px-4 py-2 flex items-center justify-between text-xs text-slate-300 gap-2">
        <div className="flex items-center gap-1.5 text-xs">
          <span>Hal</span>
          <span className="font-bold text-amber-400">{currentPage}</span>
          <span>/</span>
          <span className="font-bold">{totalPages || 1}</span>
        </div>

        {/* Page Jump Slider */}
        {totalPages > 1 && (
          <div className="flex items-center gap-3 flex-1 max-w-xs mx-2">
            <input
              type="range"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => onJumpPage(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
          </div>
        )}

        {/* Navigation buttons for mobile view */}
        <div className="flex items-center gap-2">
          <button
            disabled={!prevChapter}
            onClick={() => prevChapter && onChangeChapter(prevChapter.url, prevChapter.name)}
            className="px-3 py-2 min-h-[40px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold disabled:opacity-40 flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-amber-400" />
            <span>Prev</span>
          </button>
          <button
            disabled={!nextChapter}
            onClick={() => nextChapter && onChangeChapter(nextChapter.url, nextChapter.name)}
            className="px-3.5 py-2 min-h-[40px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs disabled:opacity-40 flex items-center gap-1 cursor-pointer shadow-md"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
