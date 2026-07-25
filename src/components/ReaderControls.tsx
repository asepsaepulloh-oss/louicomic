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
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBackToDetail}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Kembali ke Detail Komik"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
              {mangaTitle}
            </h1>
            <p className="text-xs text-amber-400 font-medium truncate">
              {currentChapterName}
            </p>
          </div>
        </div>

        {/* Center: Chapter Switcher Dropdown */}
        <div className="hidden md:flex items-center gap-2">
          <button
            disabled={!prevChapter}
            onClick={() => prevChapter && onChangeChapter(prevChapter.url, prevChapter.name)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200"
            title="Chapter Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <select
            value={currentChapterId}
            onChange={(e) => {
              const selected = chapters.find((c) => c.url === e.target.value);
              if (selected) onChangeChapter(selected.url, selected.name);
            }}
            className="bg-slate-900 text-xs font-semibold text-amber-300 border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 max-w-[200px]"
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
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200"
            title="Chapter Selanjutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Controls & Preferences */}
        <div className="flex items-center gap-2">
          
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => onChangeMode('webtoon')}
              className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 ${
                readerMode === 'webtoon' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Mode Webtoon (Gulung Kebawah)"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Webtoon</span>
            </button>
            <button
              onClick={() => onChangeMode('single')}
              className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 ${
                readerMode === 'single' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Mode Per Halaman"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Per Halaman</span>
            </button>
          </div>

          {/* Background Color Selector */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
            <Palette className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <button
              onClick={() => onChangeBgColor('black')}
              className={`w-4 h-4 rounded-full bg-black border ${bgColor === 'black' ? 'ring-2 ring-amber-400 border-white' : 'border-slate-700'}`}
              title="Latar Hitam"
            />
            <button
              onClick={() => onChangeBgColor('dark')}
              className={`w-4 h-4 rounded-full bg-slate-900 border ${bgColor === 'dark' ? 'ring-2 ring-amber-400 border-white' : 'border-slate-700'}`}
              title="Latar Slate"
            />
            <button
              onClick={() => onChangeBgColor('sepia')}
              className={`w-4 h-4 rounded-full bg-[#2d261e] border ${bgColor === 'sepia' ? 'ring-2 ring-amber-400 border-white' : 'border-slate-700'}`}
              title="Latar Sepia"
            />
          </div>

          {/* Auto Scroll Toggle (Webtoon mode only) */}
          {readerMode === 'webtoon' && (
            <button
              onClick={onToggleAutoScroll}
              className={`p-2 rounded-lg border transition-colors ${
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
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Layar Penuh"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Bottom Page Progress Bar */}
      <div className="bg-slate-900/95 border-t border-slate-800/80 px-4 py-1.5 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span>Halaman</span>
          <span className="font-bold text-amber-400">{currentPage}</span>
          <span>dari</span>
          <span className="font-bold">{totalPages || 1}</span>
        </div>

        {/* Page Jump Slider */}
        {totalPages > 1 && (
          <div className="flex items-center gap-3 flex-1 max-w-xs mx-4">
            <input
              type="range"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => onJumpPage(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>
        )}

        {/* Navigation buttons for mobile view */}
        <div className="flex md:hidden items-center gap-2">
          <button
            disabled={!prevChapter}
            onClick={() => prevChapter && onChangeChapter(prevChapter.url, prevChapter.name)}
            className="px-2 py-1 bg-slate-800 rounded text-[11px] disabled:opacity-40"
          >
            ← Prev Ch
          </button>
          <button
            disabled={!nextChapter}
            onClick={() => nextChapter && onChangeChapter(nextChapter.url, nextChapter.name)}
            className="px-2 py-1 bg-amber-500 text-slate-950 font-bold rounded text-[11px] disabled:opacity-40"
          >
            Next Ch →
          </button>
        </div>
      </div>
    </div>
  );
};
