import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { ClerkProvider, useUser, useClerk } from '@clerk/clerk-react';
import { Key, User, X, CheckCircle2, ShieldCheck } from 'lucide-react';

interface AuthContextType {
  userId: string;
  userName: string;
  userEmail: string | null;
  userAvatar: string;
  isSignedIn: boolean;
  isClerkConfigured: boolean;
  openSignInModal: () => void;
  setCustomClerkKey: (key: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  userId: 'guest',
  userName: 'Tamu / Guest',
  userEmail: null,
  userAvatar: '',
  isSignedIn: false,
  isClerkConfigured: false,
  openSignInModal: () => {},
  setCustomClerkKey: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function getStoredClerkKey(): string {
  const envKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (envKey && envKey.trim().startsWith('pk_') && envKey.trim().length > 20) {
    return envKey.trim().replace(/^["']|["']$/g, '');
  }
  try {
    const localKey = localStorage.getItem('clerk_pub_key');
    if (localKey && localKey.trim().startsWith('pk_') && localKey.trim().length > 20) {
      return localKey.trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    // localStorage unavailable
  }
  return '';
}

/**
 * Inner component when ClerkProvider is active
 */
function ClerkAuthInner({
  children,
  onOpenKeyConfig,
}: {
  children: ReactNode;
  onOpenKeyConfig: () => void;
}) {
  const { user, isSignedIn } = useUser();
  const { openSignIn } = useClerk();

  const userId = user?.id || 'guest';
  const userName = user?.fullName || user?.firstName || user?.username || 'Pembaca Komik';
  const userEmail = user?.primaryEmailAddress?.emailAddress || null;
  const userAvatar = user?.imageUrl || '';

  const handleOpenSignIn = () => {
    try {
      openSignIn();
    } catch (e) {
      console.warn('Clerk openSignIn error:', e);
      onOpenKeyConfig();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        userId,
        userName,
        userEmail,
        userAvatar,
        isSignedIn: Boolean(isSignedIn),
        isClerkConfigured: true,
        openSignInModal: handleOpenSignIn,
        setCustomClerkKey: (key: string) => {
          localStorage.setItem('clerk_pub_key', key);
          window.location.reload();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Main Auth Provider wrapper that handles both configured Clerk and Guest mode
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeKey, setActiveKey] = useState<string>(() => getStoredClerkKey());
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [inputKey, setInputKey] = useState<string>('');
  const [guestNameInput, setGuestNameInput] = useState<string>('');
  const [currentGuestName, setCurrentGuestName] = useState<string>(() => {
    return localStorage.getItem('guest_user_name') || 'Mode Tamu (Guest)';
  });
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    const k = getStoredClerkKey();
    if (k) setActiveKey(k);
  }, []);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputKey.trim().replace(/^["']|["']$/g, '');
    if (trimmed && trimmed.startsWith('pk_') && trimmed.length > 20) {
      localStorage.setItem('clerk_pub_key', trimmed);
      setActiveKey(trimmed);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowConfigModal(false);
        window.location.reload();
      }, 1000);
    } else {
      alert('Format Clerk Publishable Key tidak valid. Kunci harus diawali dengan "pk_test_" atau "pk_live_".');
    }
  };

  const handleSaveGuestName = (e: React.FormEvent) => {
    e.preventDefault();
    if (guestNameInput.trim()) {
      localStorage.setItem('guest_user_name', guestNameInput.trim());
      setCurrentGuestName(guestNameInput.trim());
      setShowConfigModal(false);
    }
  };

  const isConfigured = Boolean(
    activeKey && activeKey.startsWith('pk_') && activeKey.length > 20
  );

  return (
    <>
      {isConfigured ? (
        <ClerkProvider publishableKey={activeKey}>
          <ClerkAuthInner onOpenKeyConfig={() => setShowConfigModal(true)}>
            {children}
          </ClerkAuthInner>
        </ClerkProvider>
      ) : (
        <AuthContext.Provider
          value={{
            userId: 'guest',
            userName: currentGuestName,
            userEmail: null,
            userAvatar: '',
            isSignedIn: false,
            isClerkConfigured: false,
            openSignInModal: () => setShowConfigModal(true),
            setCustomClerkKey: (key: string) => {
              localStorage.setItem('clerk_pub_key', key);
              setActiveKey(key);
            },
          }}
        >
          {children}
        </AuthContext.Provider>
      )}

      {/* Auth Configuration / Login Dialog Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-6">
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Masuk / Konfigurasi Clerk</h3>
                <p className="text-xs text-slate-400">Aktifkan login akun di aplikasi Android / Web</p>
              </div>
            </div>

            {saveSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>Publishable Key tersimpan! Memuat ulang modul Clerk...</span>
              </div>
            ) : (
              <div className="space-y-5 text-xs">
                {/* Option 1: Set Clerk Publishable Key */}
                <form onSubmit={handleSaveKey} className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <label className="block font-bold text-slate-200 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>1. Hubungkan Clerk Publishable Key</span>
                  </label>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Jika aplikasi ini di-build dari GitHub Actions tanpa Secret Key, tempelkan Publishable Key Clerk kamu (<code className="text-amber-400 font-mono">pk_test_...</code> / <code className="text-amber-400 font-mono">pk_live_...</code>) dari <a href="https://dashboard.clerk.com" target="_blank" rel="noreferrer" className="text-amber-400 underline">Clerk Dashboard</a>:
                  </p>
                  <input
                    type="text"
                    placeholder="pk_test_xxxxxxxxxxxxxxxx"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-colors cursor-pointer"
                  >
                    Simpan & Hubungkan Clerk
                  </button>
                </form>

                {/* Option 2: Guest Mode Profile Customization */}
                <form onSubmit={handleSaveGuestName} className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <label className="block font-bold text-slate-200 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-400" />
                    <span>2. Atau Lanjut Mode Tamu (Guest)</span>
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Kamu bisa membaca komik, menyimpan bookmark, dan riwayat secara lokal tanpa akun. Ubah nama profil kamu di bawah:
                  </p>
                  <input
                    type="text"
                    placeholder="Nama kamu (misal: Pembaca Loui)"
                    value={guestNameInput}
                    onChange={(e) => setGuestNameInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 transition-colors cursor-pointer"
                  >
                    Simpan Profil Tamu
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

