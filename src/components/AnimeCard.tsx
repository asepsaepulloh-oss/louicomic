import React, { useState } from 'react';
import { Star, Play, Film } from 'lucide-react';
import { AnimeItem } from '../types/anime';

interface AnimeCardProps {
  anime: AnimeItem;
  onSelect: (anime: AnimeItem) => void;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({ anime, onSelect }) => {
  const [imgError, setImgError] = useState(false);

  // Clean status text
  const isOngoing = anime.status?.toLowerCase().includes('ongoing');
  const isCompleted = anime.status?.toLowerCase().includes('completed');

  return (
    <div
      onClick={() => onSelect(anime)}
      className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 cursor-pointer flex flex-col h-full"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-950">
        {!imgError && anime.image_url ? (
          <img
            src={anime.image_url}
            alt={anime.title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-slate-600 bg-slate-900">
            <Film className="w-12 h-12 mb-2 text-slate-700" />
            <span className="text-xs text-center font-medium">No Image</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

        {/* Status Badge */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 z-10">
          {isOngoing && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/90 text-white shadow-sm backdrop-blur-md">
              ONGOING
            </span>
          )}
          {isCompleted && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-500/90 text-white shadow-sm backdrop-blur-md">
              TAMAT
            </span>
          )}
          {anime.type && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-800/90 text-slate-200 border border-slate-700/60 backdrop-blur-md">
              {anime.type.toUpperCase()}
            </span>
          )}
        </div>

        {/* Rating Badge */}
        {anime.rating && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500 text-slate-950 shadow-md backdrop-blur-md z-10">
            <Star className="w-3 h-3 fill-slate-950" />
            <span>{anime.rating}</span>
          </div>
        )}

        {/* Hover Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5 flex flex-col flex-grow justify-between bg-slate-900/90">
        <div>
          <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
            {anime.title}
          </h3>

          {/* Genre Tags */}
          {anime.genres && anime.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {anime.genres.slice(0, 2).map((g, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/40"
                >
                  {g.title}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 text-amber-400/90 font-medium group-hover:translate-x-1 transition-transform">
            <Play className="w-3.5 h-3.5 fill-amber-400" />
            <span>Nonton Now</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">SUB INDO</span>
        </div>
      </div>
    </div>
  );
};
