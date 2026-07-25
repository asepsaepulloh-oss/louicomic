import React from 'react';
import { BookOpen, Film, Flame, Heart, History, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  bookmarkCount: number;
  historyCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  bookmarkCount,
  historyCount,
}) => {
  const { isSignedIn, openSignInModal } = useAuth();

  const navItems = [
    { id: 'home', label: 'Beranda', icon: BookOpen },
    { id: 'anime', label: 'Anime', icon: Film, isNew: true },
    { id: 'popular', label: 'Populer', icon: Flame },
    { id: 'bookmarks', label: 'Bookmark', icon: Heart, count: bookmarkCount },
    { id: 'history', label: 'Riwayat', icon: History, count: historyCount },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/90 shadow-2xl lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
                isActive
                  ? 'text-amber-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-amber-500 rounded-b-full shadow-sm shadow-amber-500/50" />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400 scale-110' : ''} transition-transform`} />
                {item.isNew && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.2 text-[8px] font-black bg-amber-500 text-slate-950 rounded-full animate-pulse">
                    NEW
                  </span>
                )}
                {typeof item.count === 'number' && item.count > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 text-[9px] font-extrabold bg-rose-500 text-white rounded-full border border-slate-900">
                    {item.count > 99 ? '99+' : item.count}
                  </span>
                )}
              </div>

              <span className="text-[10px] mt-1 leading-tight tracking-tight truncate max-w-[64px]">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* User Auth or Quick Login Icon */}
        {!isSignedIn && (
          <button
            onClick={openSignInModal}
            className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl text-slate-300 hover:text-amber-400 font-medium transition-all cursor-pointer"
            title="Masuk Akun"
          >
            <User className="w-5 h-5 text-amber-400" />
            <span className="text-[10px] mt-1 leading-tight tracking-tight">Masuk</span>
          </button>
        )}
      </div>
    </nav>
  );
};
