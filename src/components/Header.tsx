import React, { useState } from 'react';
import { BookOpen, Search, Heart, History, Flame, Clock, User, Menu, X, Film, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onSearch: (query: string) => void;
  bookmarkCount: number;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onSearch,
  bookmarkCount,
  historyCount,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isSignedIn, userName, userAvatar, openSignInModal, signOutUser } = useAuth();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
      setMobileMenuOpen(false);
    }
  };

  const navItems = [
    { id: 'home', label: 'Beranda', icon: BookOpen },
    { id: 'anime', label: 'Anime', icon: Film, isHighlight: true },
    { id: 'popular', label: 'Populer', icon: Flame },
    { id: 'latest', label: 'Terbaru', icon: Clock },
    { id: 'bookmarks', label: 'Bookmark', icon: Heart, count: bookmarkCount },
    { id: 'history', label: 'Riwayat', icon: History, count: historyCount },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 text-white shadow-lg transition-all pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onSelectTab('home')}>
            <img
              src="/logo.svg"
              alt="LouiComic Logo"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl shadow-md shadow-orange-500/20 border border-slate-800 group-hover:scale-105 transition-transform"
            />
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-300 bg-clip-text text-transparent">
                LouiComic
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                v1.0
              </span>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4 relative">
            <input
              type="text"
              placeholder="Cari judul komik, genre (misal: Solo Leveling, Action)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-slate-800/80 text-sm text-slate-100 placeholder-slate-400 rounded-full pl-10 pr-10 py-2 border border-slate-700/60 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </form>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                      : item.isHighlight
                      ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.isHighlight ? 'text-amber-400 animate-pulse' : ''}`} />
                  <span>{item.label}</span>
                  {item.isHighlight && (
                    <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-amber-500 text-slate-950 uppercase rounded tracking-wider">
                      NEW
                    </span>
                  )}
                  {typeof item.count === 'number' && item.count > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-semibold bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Auth Buttons */}
          <div className="flex items-center gap-2">
            
            {/* Firebase User Profile or Masuk Button */}
            <div className="flex items-center">
              {isSignedIn ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
                    {userAvatar ? (
                      <img src={userAvatar} alt={userName} className="w-6 h-6 rounded-full border border-amber-500/40 object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/40">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-slate-200 max-w-[110px] truncate hidden sm:inline">
                      {userName}
                    </span>
                  </div>

                  <button
                    onClick={signOutUser}
                    className="p-2.5 min-h-[40px] min-w-[40px] rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer flex items-center justify-center active:scale-95"
                    title="Keluar / Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={openSignInModal}
                  className="flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all active:scale-95 cursor-pointer"
                  title="Masuk ke Akun"
                >
                  <User className="w-4 h-4 fill-slate-950 text-slate-950" />
                  <span>Masuk</span>
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar & Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-800/80 space-y-4 animate-fadeIn">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Cari komik atau genre..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-slate-800 text-sm text-slate-100 placeholder-slate-400 rounded-xl pl-10 pr-10 py-3 min-h-[44px] border border-slate-700 focus:outline-none focus:border-amber-500"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              )}
            </form>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2.5 px-3.5 py-3 min-h-[48px] rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                        : 'text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {typeof item.count === 'number' && item.count > 0 && (
                      <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-amber-500/30 text-amber-300 rounded-full">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}

              {!isSignedIn ? (
                <button
                  onClick={() => {
                    openSignInModal();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] rounded-xl text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 col-span-2 shadow-lg transition-all cursor-pointer"
                >
                  <User className="w-5 h-5 fill-slate-950" />
                  <span>Masuk ke Akun</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    signOutUser();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] rounded-xl text-sm font-bold text-rose-300 bg-rose-500/20 border border-rose-500/40 hover:bg-rose-500/30 col-span-2 transition-all cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Keluar dari ({userName})</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
