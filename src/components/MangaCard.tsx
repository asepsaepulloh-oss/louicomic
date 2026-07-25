import React, { useState } from 'react';
import { Heart, BookOpen, Star } from 'lucide-react';
import { MangaItem } from '../types/manga';
import { getProxiedImageUrl } from '../services/api';

interface MangaCardProps {
  manga: MangaItem;
  isBookmarked: boolean;
  onToggleBookmark: (manga: MangaItem, e: React.MouseEvent) => void;
  onClick: (mangaId: string) => void;
}

export const MangaCard: React.FC<MangaCardProps> = ({
  manga,
  isBookmarked,
  onToggleBookmark,
  onClick,
}) => {
  const [imgAttempt, setImgAttempt] = useState<number>(0);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Fallback ladder: Proxied URL -> Direct URL -> Placeholder
  let imgSrc = getProxiedImageUrl(manga.thumbnail);
  if (imgAttempt === 1 && manga.thumbnail?.startsWith('http')) {
    imgSrc = manga.thumbnail;
  } else if (imgAttempt >= 2) {
    imgSrc = 'https://placehold.co/300x420/1e293b/94a3b8?text=LouiComic';
  }

  return (
    <div
      onClick={() => onClick(manga.url)}
      className="group relative bg-slate-900/90 rounded-xl overflow-hidden border border-slate-800 hover:border-amber-500/50 shadow-md hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 cursor-pointer flex flex-col transform hover:-translate-y-1"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[3/4] w-full bg-slate-950 overflow-hidden">
        
        {/* Loading Skeleton */}
        {!imgLoaded && imgAttempt < 2 && (
          <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-slate-700 animate-bounce" />
          </div>
        )}

        <img
          src={imgSrc}
          alt={manga.title}
          referrerPolicy="no-referrer"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgAttempt((prev) => prev + 1)}
          className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ${
            imgLoaded || imgAttempt >= 2 ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Bookmark Heart Button */}
        <button
          onClick={(e) => onToggleBookmark(manga, e)}
          title={isBookmarked ? 'Hapus dari Bookmark' : 'Tambah ke Bookmark'}
          className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-all duration-200 z-10 ${
            isBookmarked
              ? 'bg-rose-500/80 text-white shadow-lg shadow-rose-500/30 scale-110'
              : 'bg-slate-900/70 text-slate-300 hover:text-rose-400 hover:bg-slate-900/90'
          }`}
        >
          <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>

        {/* Read Badge Overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-500/90 text-slate-950 shadow-sm">
            <Star className="w-3 h-3 fill-slate-950" /> Manga
          </span>
        </div>
      </div>

      {/* Content Info */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <h3
          title={manga.title}
          className="text-sm font-semibold text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug"
        >
          {manga.title}
        </h3>
        
        <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 group-hover:text-amber-300 transition-colors">
            <BookOpen className="w-3 h-3" /> Baca Sekarang
          </span>
          <span className="text-amber-500 font-bold">→</span>
        </div>
      </div>
    </div>
  );
};
