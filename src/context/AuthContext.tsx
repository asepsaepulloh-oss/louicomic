import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { ClerkProvider, useUser, useClerk, SignIn } from '@clerk/clerk-react';
import { Key, User, X, CheckCircle2, ShieldCheck, Settings, AlertTriangle, Loader2 } from 'lucide-react';
import { ErrorBoundary } from '../components/ErrorBoundary';

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
 * Component that safely renders Clerk SignIn after clerk-js has loaded
 */
function ClerkSignInContent() {
  const clerk = useClerk();

  if (!clerk || !clerk.loaded) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 space-y-3 min-h-[300px]">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-xs text-slate-300 font-medium">Menghubungkan ke layanan autentikasi Clerk...</p>
      </div>
    );
  }

  return (
    <SignIn
      routing="hash"
      appearance={{
        elements: {
          card: 'bg-slate-950 border border-slate-800 shadow-none text-white w-full',
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
  );
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

  const handleClearClerkKey = () => {
    try {
      localStorage.removeItem('clerk_pub_key');
    } catch (e) {
      console.error(e);
    }
    setActiveKey('');
    setShowKeySettings(false);
    setShowSignInModal(false);
    window.location.reload();
  };

  const isConfigured = Boolean(
    activeKey && activeKey.startsWith('pk_') && activeKey.length > 20
  );

  const guestAuthValue = {
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
  };

  return (
    <>
      {isConfigured ? (
        <ErrorBoundary
          fallback={
            <AuthContext.Provider value={guestAuthValue}>
              {children}
            </AuthContext.Provider>
          }
        >
          <ClerkProvider publishableKey={activeKey}>
            <ClerkAuthInner onOpenSignInModal={() => setShowSignInModal(true)}>
              {children}
            </ClerkAuthInner>
          </ClerkProvider>
        </ErrorBoundary>
      ) : (
        <AuthContext.Provider value={guestAuthValue}>
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

                {/* Embedded Native Clerk Sign In Component with Error Boundary */}
                <ErrorBoundary
                  fallback={(err, reset) => (
                    <div className="w-full space-y-4 py-2 text-center">
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-left space-y-2">
                        <div className="flex items-center gap-2 font-bold text-white">
                          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <span>Detail Kendala Login Clerk</span>
                        </div>
                        
                        {err?.message ? (
                          <p className="text-[11px] font-mono text-rose-300 bg-slate-950 p-2 rounded border border-slate-800 break-all">
                            {err.message}
                          </p>
                        ) : null}

                        {activeKey.startsWith('pk_test_') ? (
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            Kamu menggunakan <code className="text-amber-400 font-mono px-1 py-0.5 rounded bg-slate-900">pk_test_...</code> (Test Key). Kunci Test Clerk <strong>tidak mendukung</strong> domain custom seperti <code className="text-amber-400 font-mono">{window.location.hostname}</code>. Silakan ganti ke <strong>Production Key (<code className="text-amber-400 font-mono">pk_live_...</code>)</strong>.
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            Pastikan domain <code className="text-amber-400 font-mono">{window.location.hostname}</code> sudah terdaftar di Clerk Dashboard atau gunakan Mode Tamu.
                          </p>
                        )}

                        <div className="text-[10px] text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 space-y-1 font-mono">
                          <p className="text-amber-300/90 font-sans font-semibold">💡 Opsi Tambahan:</p>
                          <p>• Kamu dapat menekan &quot;Lanjut dengan Mode Tamu&quot; di bawah untuk langsung menggunakan aplikasi.</p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        <button
                          onClick={reset}
                          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 cursor-pointer transition-all"
                        >
                          Coba Muat Ulang Form Login
                        </button>

                        <button
                          onClick={() => setShowSignInModal(false)}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-amber-500/10 transition-all flex items-center justify-center gap-2"
                        >
                          <User className="w-4 h-4 text-slate-950" />
                          <span>Lanjut dengan Mode Tamu (Gratis)</span>
                        </button>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setShowKeySettings(true)}
                            className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] border border-slate-700 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                          >
                            <Settings className="w-3.5 h-3.5 text-amber-400" />
                            <span>Ubah Key Clerk</span>
                          </button>
                          <button
                            onClick={handleClearClerkKey}
                            className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-400 font-semibold text-[11px] border border-slate-800 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>Reset Key</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                >
                  <div className="w-full flex justify-center text-slate-900 overflow-hidden rounded-xl min-h-[300px]">
                    <ClerkSignInContent />
                  </div>
                </ErrorBoundary>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Pengaturan Akun / Mode Masuk</h3>
                    <p className="text-xs text-slate-400">Pilih Mode Tamu atau Konfigurasi Clerk Key</p>
                  </div>
                </div>

                {saveSuccess ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>Publishable Key tersimpan! Memuat ulang...</span>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs">
                    <form onSubmit={handleSaveGuestName} className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <label className="block font-bold text-slate-200 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-amber-400" />
                        <span>1. Mode Tamu (Tanpa Akun)</span>
                      </label>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Baca komik & anime secara langsung. Bookmark & riwayat otomatis tersimpan di browser kamu.
                      </p>
                      <input
                        type="text"
                        placeholder="Nama tampilan (misal: Pembaca Loui)"
                        value={guestNameInput}
                        onChange={(e) => setGuestNameInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all cursor-pointer shadow-md"
                      >
                        Masuk Mode Tamu
                      </button>
                    </form>

                    <form onSubmit={handleSaveKey} className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <label className="block font-bold text-slate-200 flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-amber-400" />
                        <span>2. Hubungkan Clerk Publishable Key</span>
                      </label>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Untuk sinkronisasi login akun antar-perangkat. Masukkan Publishable Key (<code className="text-amber-400 font-mono">pk_test_...</code> / <code className="text-amber-400 font-mono">pk_live_...</code>):
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
                        className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 transition-colors cursor-pointer"
                      >
                        Simpan Key & Hubungkan
                      </button>
                    </form>

                    {isConfigured && (
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => setShowKeySettings(false)}
                          className="text-xs text-amber-400 hover:underline cursor-pointer"
                        >
                          &larr; Kembali ke Form Login Clerk
                        </button>
                        <button
                          type="button"
                          onClick={handleClearClerkKey}
                          className="text-xs text-rose-400 hover:underline cursor-pointer"
                        >
                          Reset / Hapus Key
                        </button>
                      </div>
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



