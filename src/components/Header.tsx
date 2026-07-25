import React, { useState } from 'react';
import { BookOpen, Search, Heart, History, Flame, Clock, User, Menu, X, Film } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserButton, SignInButton } from '@clerk/clerk-react';

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
  const { isSignedIn, isClerkConfigured, userName } = useAuth();

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
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('home')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 p-0.5 shadow-md shadow-orange-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-amber-400" />
              </div>
            </div>
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
            
            {/* Clerk User Button or Guest Profile */}
            <div className="flex items-center">
              {isClerkConfigured ? (
                isSignedIn ? (
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: 'w-8 h-8 rounded-full border border-amber-500/40',
                      },
                    }}
                  />
                ) : (
                  <SignInButton mode="modal">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold transition-all">
                      <User className="w-3.5 h-3.5" />
                      <span>Masuk</span>
                    </button>
                  </SignInButton>
                )
              ) : (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 bg-slate-800/80 border border-slate-700/60"
                  title="Modus Tamu (Guest)"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="truncate max-w-[80px] sm:max-w-[120px] font-medium">{userName}</span>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar & Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-800 space-y-3 animate-fadeIn">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Cari komik..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-slate-800 text-sm text-slate-100 placeholder-slate-400 rounded-lg pl-9 pr-8 py-2 border border-slate-700 focus:outline-none focus:border-amber-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </form>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
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
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'text-slate-300 bg-slate-800/50 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-amber-400" />
                    <span>{item.label}</span>
                    {typeof item.count === 'number' && item.count > 0 && (
                      <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/30 text-amber-300 rounded-full">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
