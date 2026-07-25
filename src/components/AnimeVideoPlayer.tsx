import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Film, Settings } from 'lucide-react';
import { getAnimeVideo } from '../services/animeApi';

export interface AnimeVideoPlayerProps {
  episodeId: string;
  animeUrlId?: string;
  reso?: string;
  onResolutionChange?: (reso: string) => void;
}

const DEFAULT_RESOLUTIONS = ['360p', '480p', '720p', '1080p'];

export const AnimeVideoPlayer: React.FC<AnimeVideoPlayerProps> = ({
  episodeId,
  reso = '720p',
  onResolutionChange,
}) => {
  const [currentReso, setCurrentReso] = useState<string>(reso);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoType, setVideoType] = useState<'direct' | 'embed'>('direct');
  const [availableResolutions, setAvailableResolutions] = useState<string[]>(DEFAULT_RESOLUTIONS);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setCurrentReso(reso);
  }, [reso]);

  const loadVideo = useCallback(async () => {
    if (!episodeId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getAnimeVideo(episodeId, currentReso);
      setVideoUrl(result.url);
      setVideoType(result.type);
      if (result.availableResolutions && result.availableResolutions.length > 0) {
        setAvailableResolutions(result.availableResolutions);
      }
    } catch {
      setError('Gagal memuat video. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [episodeId, currentReso]);

  useEffect(() => {
    loadVideo();
  }, [loadVideo]);

  const handleVideoError = useCallback(() => {
    setError('Video gagal diputar. Coba resolusi lain atau refresh halaman.');
  }, []);

  const handleResoClick = (r: string) => {
    setCurrentReso(r);
    if (onResolutionChange) {
      onResolutionChange(r);
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* Video Player Main Viewport */}
      <main className="flex min-h-[40vh] sm:min-h-[50vh] items-center justify-center bg-black rounded-t-xl overflow-hidden border border-slate-800 shadow-2xl relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="border-amber-500 mb-4 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
            <p className="text-lg font-medium text-white">Memuat video...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Film className="text-slate-500 mb-4 h-16 w-16" />
            <p className="text-lg font-medium text-white">{error}</p>
            <p className="text-slate-400 mt-2 text-sm">
              Coba resolusi yang berbeda atau refresh halaman
            </p>
          </div>
        ) : videoUrl ? (
          <div className="aspect-video w-full max-w-5xl">
            {videoType === 'direct' ? (
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                autoPlay
                playsInline
                controlsList="nodownload"
                className="h-full w-full rounded-t-lg object-contain"
                onError={handleVideoError}
              >
                Browser Anda tidak mendukung pemutaran video.
              </video>
            ) : (
              <iframe
                src={videoUrl}
                className="h-full w-full border-0 rounded-t-lg"
                title="Video player"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Film className="text-slate-500 mb-4 h-16 w-16" />
            <p className="text-lg font-medium text-white">Video tidak tersedia</p>
            <p className="text-slate-400 mt-2 text-sm">Coba resolusi yang berbeda</p>
          </div>
        )}
      </main>

      {/* Resolution Selector Bar */}
      <div className="bg-slate-900 border-slate-800 border-t border-b border-x rounded-b-xl">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 py-3">
            <div className="text-slate-400 flex items-center gap-2 text-sm font-medium">
              <Settings className="h-4 w-4 text-amber-400" />
              <span className="hidden sm:inline">Resolusi:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {availableResolutions.map((r) => (
                <button
                  key={r}
                  onClick={() => handleResoClick(r)}
                  className={`rounded px-3 py-1 text-sm font-medium transition-colors cursor-pointer ${
                    currentReso === r
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimeVideoPlayer;
