import React from 'react';
import { Tag } from 'lucide-react';

interface GenrePillsProps {
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
}

const POPULAR_GENRES = [
  'Semua',
  'Action',
  'Adventure',
  'Fantasy',
  'Isekai',
  'System',
  'Reincarnation',
  'Romance',
  'Comedy',
  'Drama',
  'Martial Arts',
  'Supernatural',
  'Sci-Fi',
  'Mystery',
  'Slice of Life',
  'Horror',
];

export const GenrePills: React.FC<GenrePillsProps> = ({
  selectedGenre,
  onSelectGenre,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider pr-2 border-r border-slate-800 flex-shrink-0">
        <Tag className="w-3.5 h-3.5 text-amber-400" />
        <span>Genre</span>
      </div>
      {POPULAR_GENRES.map((genre) => {
        const isActive = (selectedGenre === '' && genre === 'Semua') || selectedGenre.toLowerCase() === genre.toLowerCase();
        return (
          <button
            key={genre}
            onClick={() => onSelectGenre(genre === 'Semua' ? '' : genre)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              isActive
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50'
            }`}
          >
            {genre}
          </button>
        );
      })}
    </div>
  );
};
