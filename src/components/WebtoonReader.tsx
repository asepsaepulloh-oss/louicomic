import React, { useEffect, useRef, useState } from 'react';
import { ChapterPage, ChapterItem } from '../types/manga';
import { getProxiedImageUrl } from '../services/api';
import { RefreshCw, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';

interface WebtoonReaderProps {
  pages: ChapterPage[];
  autoScrollSpeed: number;
  onPageVisible: (pageIndex: number) => void;
  prevChapter: ChapterItem | null;
  nextChapter: ChapterItem | null;
  onNavigateChapter: (chapterId: string, chapterName: string) => void;
}

export const WebtoonReader: React.FC<WebtoonReaderProps> = ({
  pages,
  autoScrollSpeed,
  onPageVisible,
  prevChapter,
  nextChapter,
  onNavigateChapter,
}) => {
  const [failedAttempts, setFailedAttempts] = useState<Record<number, number>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Intersection Observer for page tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageIndex = Number(entry.target.getAttribute('data-page-index'));
            if (!isNaN(pageIndex)) {
              onPageVisible(pageIndex + 1);
            }
          }
        });
      },
      { threshold: 0.4 }
    );

    imageRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [pages, onPageVisible]);

  // Auto Scroll Loop
  useEffect(() => {
    if (autoScrollSpeed <= 0) return;
    const interval = setInterval(() => {
      window.scrollBy({ top: autoScrollSpeed * 2, behavior: 'smooth' });
    }, 50);
    return () => clearInterval(interval);
  }, [autoScrollSpeed]);

  const handleRetryImage = (index: number) => {
    setFailedAttempts((prev) => ({ ...prev, [index]: 0 }));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center py-20 px-0 sm:px-4 min-h-screen">
      <div className="w-full max-w-3xl flex flex-col items-center">
        {pages.map((page, idx) => {
          const attempts = failedAttempts[idx] || 0;
          let pageUrl = getProxiedImageUrl(page.imageUrl);
          if (attempts === 1 && page.imageUrl?.startsWith('http')) {
            pageUrl = page.imageUrl;
          }
          const hasFailed = attempts >= 2;

          return (
            <div
              key={page.index || idx}
              ref={(el) => (imageRefs.current[idx] = el)}
              data-page-index={idx}
              className="relative w-full min-h-[300px] sm:min-h-[500px] flex items-center justify-center bg-slate-950 my-0 border-b border-slate-900/30"
            >
              {hasFailed ? (
                <div className="p-8 my-10 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-3">
                  <p className="text-sm text-rose-400 font-medium">
                    Gagal memuat halaman {idx + 1}
                  </p>
                  <button
                    onClick={() => handleRetryImage(idx)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Coba Muat Ulang</span>
                  </button>
                </div>
              ) : (
                <img
                  src={pageUrl}
                  alt={`Halaman ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  onError={() => setFailedAttempts((prev) => ({ ...prev, [idx]: (prev[idx] || 0) + 1 }))}
                  loading="lazy"
                  className="w-full h-auto object-contain select-none shadow-lg transition-opacity duration-300"
                />
              )}
            </div>
          );
        })}

        {/* End of Chapter Navigation Footer */}
        <div className="w-full mt-12 mb-20 p-6 bg-slate-900 rounded-2xl border border-slate-800 text-center space-y-6 shadow-2xl">
          <h3 className="text-lg font-bold text-white">
            Kamu telah mencapai akhir chapter ini! 🎉
          </h3>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {prevChapter && (
              <button
                onClick={() => onNavigateChapter(prevChapter.url, prevChapter.name)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-amber-400" />
                <span>{prevChapter.name}</span>
              </button>
            )}

            <button
              onClick={scrollToTop}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-sm border border-slate-700 transition-all"
            >
              <ArrowUp className="w-4 h-4" />
              <span>Kembali ke Atas</span>
            </button>

            {nextChapter && (
              <button
                onClick={() => onNavigateChapter(nextChapter.url, nextChapter.name)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-sm shadow-lg shadow-orange-500/20 transition-all"
              >
                <span>{nextChapter.name}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
