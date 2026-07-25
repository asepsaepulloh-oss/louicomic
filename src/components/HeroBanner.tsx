import React, { useState, useEffect } from 'react';
import { Play, Heart, ChevronLeft, ChevronRight, Star, Flame } from 'lucide-react';
import { MangaItem } from '../types/manga';
import { getProxiedImageUrl } from '../services/api';

interface HeroBannerProps {
  featuredList: MangaItem[];
  bookmarkedIds: Set<string>;
  onToggleBookmark: (manga: MangaItem, e: React.MouseEvent) => void;
  onSelectManga: (mangaId: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  featuredList,
  bookmarkedIds,
  onToggleBookmark,
  onSelectManga,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgAttempt, setImgAttempt] = useState<number>(0);

  useEffect(() => {
    setImgAttempt(0);
  }, [currentIndex]);

  useEffect(() => {
    if (featuredList.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredList.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredList]);

  if (!featuredList || featuredList.length === 0) return null;

  const current = featuredList[currentIndex];
  const isBookmarked = bookmarkedIds.has(current.url);

  let proxiedCover = getProxiedImageUrl(current.thumbnail);
  if (imgAttempt === 1 && current.thumbnail?.startsWith('http')) {
    proxiedCover = current.thumbnail;
  } else if (imgAttempt >= 2) {
    proxiedCover = 'https://placehold.co/300x420/1e293b/94a3b8?text=LouiComic';
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl mb-8 group">
      
      {/* Blurred Background Poster */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-25 scale-110 transition-all duration-1000"
        style={{ backgroundImage: `url(${proxiedCover})` }}
      />

      {/* Dark Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

      {/* Hero Content Grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 md:py-12 flex flex-col md:flex-row items-center gap-8">
        
        {/* Cover Poster */}
        <div
          onClick={() => onSelectManga(current.url)}
          className="relative w-44 sm:w-52 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl shadow-orange-500/10 border-2 border-amber-500/30 flex-shrink-0 cursor-pointer group-hover:scale-102 transition-transform duration-300 bg-slate-950"
        >
          <img
            src={proxiedCover}
            alt={current.title}
            referrerPolicy="no-referrer"
            onError={() => setImgAttempt((prev) => prev + 1)}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 bg-amber-500 text-slate-950 font-extrabold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded shadow">
            TRENDING NO. {currentIndex + 1}
          </div>
        </div>

        {/* Info Column */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Flame className="w-3.5 h-3.5 fill-amber-400" /> Komik Terpopuler
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> 4.9 / 5.0
            </span>
          </div>

          <h1
            onClick={() => onSelectManga(current.url)}
            className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight cursor-pointer hover:text-amber-400 transition-colors line-clamp-2 leading-tight"
          >
            {current.title}
          </h1>

          <p className="text-sm text-slate-300 line-clamp-2 sm:line-clamp-3 max-w-2xl leading-relaxed">
            Nikmati petualangan komik terbaik secara gratis dengan kualitas halaman tinggi, dukungan baca mode webtoon, dan simpan riwayat baca kamu di LouiComic.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
            <button
              onClick={() => onSelectManga(current.url)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-sm shadow-lg shadow-orange-500/20 transition-all transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Baca Komik</span>
            </button>

            <button
              onClick={(e) => onToggleBookmark(current, e)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border transition-all ${
                isBookmarked
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-rose-400 text-rose-400' : ''}`} />
              <span>{isBookmarked ? 'Disimpan' : 'Bookmark'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows & Indicators */}
      {featuredList.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + featuredList.length) % featuredList.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-950 border border-slate-800 backdrop-blur-sm z-20"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % featuredList.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-950 border border-slate-800 backdrop-blur-sm z-20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
            {featuredList.slice(0, 5).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? 'w-6 bg-amber-400' : 'w-1.5 bg-slate-600 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
