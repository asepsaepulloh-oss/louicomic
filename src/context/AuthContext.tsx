import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { ClerkProvider, useUser, SignIn, UserButton } from '@clerk/clerk-react';
import { Key, User, X, CheckCircle2, ShieldCheck, Settings } from 'lucide-react';

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
  onOpenSignInModal,
}: {
  children: ReactNode;
  onOpenSignInModal: () => void;
}) {
  const { user, isSignedIn } = useUser();

  const userId = user?.id || 'guest';
  const userName = user?.fullName || user?.firstName || user?.username || 'Pembaca Komik';
  const userEmail = user?.primaryEmailAddress?.emailAddress || null;
  const userAvatar = user?.imageUrl || '';

  return (
    <AuthContext.Provider
      value={{
        userId,
        userName,
        userEmail,
        userAvatar,
        isSignedIn: Boolean(isSignedIn),
        isClerkConfigured: true,
        openSignInModal: onOpenSignInModal,
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
  const [showSignInModal, setShowSignInModal] = useState<boolean>(false);
  const [showKeySettings, setShowKeySettings] = useState<boolean>(false);
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
        setShowKeySettings(false);
        setShowSignInModal(false);
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
      setShowSignInModal(false);
    }
  };

  const isConfigured = Boolean(
    activeKey && activeKey.startsWith('pk_') && activeKey.length > 20
  );

  return (
    <>
      {isConfigured ? (
        <ClerkProvider publishableKey={activeKey}>
          <ClerkAuthInner onOpenSignInModal={() => setShowSignInModal(true)}>
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
            openSignInModal: () => setShowSignInModal(true),
            setCustomClerkKey: (key: string) => {
              localStorage.setItem('clerk_pub_key', key);
              setActiveKey(key);
            },
          }}
        >
          {children}
        </AuthContext.Provider>
      )}

      {/* Auth Sign-In Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 my-8">
            <button
              onClick={() => {
                setShowSignInModal(false);
                setShowKeySettings(false);
              }}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {isConfigured && !showKeySettings ? (
              <div className="space-y-4 flex flex-col items-center">
                <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                    <span className="text-sm font-bold text-white">Masuk ke LouiComic</span>
                  </div>
                  <button
                    onClick={() => setShowKeySettings(true)}
                    className="p-1 text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                    title="Pengaturan Key Clerk"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Ubah Key</span>
                  </button>
                </div>

                {/* Embedded Native Clerk Sign In Component */}
                <div className="w-full flex justify-center text-slate-900 overflow-hidden rounded-xl">
                  <SignIn
                    routing="virtual"
                    appearance={{
                      elements: {
                        card: 'bg-slate-950 border border-slate-800 shadow-none text-white',
                        headerTitle: 'text-white',
                        headerSubtitle: 'text-slate-400',
                        socialButtonsBlockButton: 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700',
                        formFieldLabel: 'text-slate-300',
                        formFieldInput: 'bg-slate-900 border-slate-700 text-white',
                        formButtonPrimary: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold',
                        footerActionText: 'text-slate-400',
                        footerActionLink: 'text-amber-400 hover:text-amber-300',
                      },
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Konfigurasi Clerk Auth</h3>
                    <p className="text-xs text-slate-400">Hubungkan Clerk Publishable Key atau Lanjut Guest Mode</p>
                  </div>
                </div>

                {saveSuccess ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>Publishable Key tersimpan! Memuat ulang...</span>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs">
                    <form onSubmit={handleSaveKey} className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <label className="block font-bold text-slate-200 flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-amber-400" />
                        <span>Clerk Publishable Key</span>
                      </label>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Tempelkan Publishable Key (<code className="text-amber-400 font-mono">pk_test_...</code> / <code className="text-amber-400 font-mono">pk_live_...</code>) dari <a href="https://dashboard.clerk.com" target="_blank" rel="noreferrer" className="text-amber-400 underline">Clerk Dashboard</a>:
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
                        Simpan & Hubungkan
                      </button>
                    </form>

                    <form onSubmit={handleSaveGuestName} className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <label className="block font-bold text-slate-200 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-amber-400" />
                        <span>Mode Tamu (Tanpa Login)</span>
                      </label>
                      <p className="text-[11px] text-slate-400">
                        Kamu dapat membaca komik & anime, menyimpan bookmark secara lokal tanpa akun.
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

                    {isConfigured && (
                      <button
                        type="button"
                        onClick={() => setShowKeySettings(false)}
                        className="w-full text-center text-xs text-amber-400 hover:underline pt-1 cursor-pointer"
                      >
                        &larr; Kembali ke Tampilan Login Clerk
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};


