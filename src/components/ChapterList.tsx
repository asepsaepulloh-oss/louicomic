import React, { useState } from 'react';
import { Search, ArrowUpDown, Clock, CheckCircle2, Play } from 'lucide-react';
import { ChapterItem } from '../types/manga';

interface ChapterListProps {
  chapters: ChapterItem[];
  mangaId: string;
  historyChapterIds?: Set<string>;
  onSelectChapter: (chapterId: string, chapterName: string) => void;
}

export const ChapterList: React.FC<ChapterListProps> = ({
  chapters,
  historyChapterIds = new Set(),
  onSelectChapter,
}) => {
  const [filterText, setFilterText] = useState('');
  const [sortAsc, setSortAsc] = useState(false);

  const filteredChapters = chapters
    .filter((ch) => ch.name.toLowerCase().includes(filterText.toLowerCase()))
    .sort((a, b) => {
      // Extract numbers if possible for numeric sorting, or fallback to index/date
      const matchA = a.name.match(/\d+(\.\d+)?/);
      const matchB = b.name.match(/\d+(\.\d+)?/);
      if (matchA && matchB) {
        const numA = parseFloat(matchA[0]);
        const numB = parseFloat(matchB[0]);
        return sortAsc ? numA - numB : numB - numA;
      }
      return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });

  const formatDate = (ts: number) => {
    if (!ts) return 'Terbaru';
    const date = new Date(ts);
    if (isNaN(date.getTime())) return 'Terbaru';
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Daftar Chapter</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {chapters.length} Chapter
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Chapter */}
          <div className="relative flex-1 sm:w-48">
            <input
              type="text"
              placeholder="Cari chapter..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full bg-slate-800 text-xs text-slate-100 placeholder-slate-400 rounded-lg pl-8 pr-3 py-1.5 border border-slate-700 focus:outline-none focus:border-amber-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Sort Button */}
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Urutan Chapter"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <span>{sortAsc ? 'Terlama' : 'Terbaru'}</span>
          </button>
        </div>
      </div>

      {/* Chapter Grid List */}
      {filteredChapters.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-sm">
          Tidak ada chapter yang cocok dengan pencarian "{filterText}".
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
          {filteredChapters.map((ch) => {
            const isRead = historyChapterIds.has(ch.url);
            return (
              <button
                key={ch.url}
                onClick={() => onSelectChapter(ch.url, ch.name)}
                className={`group flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  isRead
                    ? 'bg-slate-950/80 border-slate-800/80 text-slate-400 hover:border-amber-500/50 hover:bg-slate-900'
                    : 'bg-slate-800/60 hover:bg-amber-500/10 border-slate-700/60 hover:border-amber-500/50 text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-2 rounded-lg ${isRead ? 'bg-slate-900 text-emerald-400' : 'bg-slate-900 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950'} transition-colors`}>
                    {isRead ? <CheckCircle2 className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  </div>

                  <div className="truncate">
                    <span className="text-sm font-semibold group-hover:text-amber-400 transition-colors block truncate">
                      {ch.name}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-500" /> {formatDate(ch.dateUpload)}
                    </span>
                  </div>
                </div>

                {isRead && (
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex-shrink-0">
                    Dibaca
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
