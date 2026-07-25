import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { User, X, LogOut, Mail, Lock, Sparkles, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';

interface AuthContextType {
  userId: string;
  userName: string;
  userEmail: string | null;
  userAvatar: string;
  isSignedIn: boolean;
  isAnonymous: boolean;
  firebaseUser: FirebaseUser | null;
  openSignInModal: () => void;
  closeSignInModal: () => void;
  signOutUser: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  userId: 'guest',
  userName: 'Tamu / Guest',
  userEmail: null,
  userAvatar: '',
  isSignedIn: false,
  isAnonymous: true,
  firebaseUser: null,
  openSignInModal: () => {},
  closeSignInModal: () => {},
  signOutUser: async () => {},
  signInWithGoogle: async () => {},
  signInAsGuest: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showSignInModal, setShowSignInModal] = useState<boolean>(false);

  // Email / Password Form State
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const openSignInModal = () => {
    setAuthError(null);
    setAuthSuccess(null);
    setShowSignInModal(true);
  };

  const closeSignInModal = () => {
    setShowSignInModal(false);
  };

  const signInWithGoogle = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setAuthSuccess('Berhasil masuk dengan akun Google!');
      setTimeout(() => {
        closeSignInModal();
        setAuthSuccess(null);
      }, 1000);
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err.code === 'auth/popup-blocked') {
        setAuthError('Popup login diblokir oleh browser. Izinkan popup untuk melanjutkan.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Proses login Google dibatalkan.');
      } else {
        setAuthError(err.message || 'Gagal masuk dengan Google.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const signInAsGuest = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInAnonymously(auth);
      setAuthSuccess('Masuk sebagai Tamu (Guest)');
      setTimeout(() => {
        closeSignInModal();
        setAuthSuccess(null);
      }, 800);
    } catch (err: any) {
      console.error('Guest Auth Error:', err);
      setAuthError(err.message || 'Gagal masuk sebagai Tamu.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Email dan kata sandi wajib diisi.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    try {
      if (isRegisterMode) {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName.trim() && res.user) {
          await updateProfile(res.user, { displayName: displayName.trim() });
        }
        setAuthSuccess('Pendaftaran berhasil! Selamat datang.');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setAuthSuccess('Berhasil masuk!');
      }

      setTimeout(() => {
        closeSignInModal();
        setAuthSuccess(null);
        setEmail('');
        setPassword('');
        setDisplayName('');
      }, 1000);
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setAuthError('Email atau kata sandi tidak cocok.');
      } else if (err.code === 'auth/email-already-in-use') {
        setAuthError('Email ini sudah terdaftar. Silakan masuk.');
      } else if (err.code === 'auth/weak-password') {
        setAuthError('Kata sandi terlalu pendek (minimal 6 karakter).');
      } else {
        setAuthError(err.message || 'Gagal autentikasi email.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign Out Error:', err);
    }
  };

  // Derive User Information
  const isSignedIn = Boolean(firebaseUser);
  const isAnonymous = Boolean(firebaseUser?.isAnonymous);
  const userId = firebaseUser ? firebaseUser.uid : 'guest';
  const userName = firebaseUser
    ? firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Pembaca Tamu' : firebaseUser.email?.split('@')[0]) || 'Pengguna LouiComic'
    : 'Tamu / Guest';
  const userEmail = firebaseUser?.email || null;
  const userAvatar = firebaseUser?.photoURL || '';

  return (
    <AuthContext.Provider
      value={{
        userId,
        userName,
        userEmail,
        userAvatar,
        isSignedIn,
        isAnonymous,
        firebaseUser,
        openSignInModal,
        closeSignInModal,
        signOutUser,
        signInWithGoogle,
        signInAsGuest,
      }}
    >
      {children}

      {/* Auth Modal Window */}
      {showSignInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 my-8 space-y-5">
            
            {/* Close Modal Button */}
            <button
              onClick={closeSignInModal}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Masuk ke LouiComic</h3>
                <p className="text-xs text-slate-400">Gunakan Firebase Authentication yang stabil</p>
              </div>
            </div>

            {/* Notifications */}
            {authError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {authError}
              </div>
            )}

            {authSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* Quick OAuth Button */}
            <div className="space-y-2.5">
              <button
                type="button"
                disabled={authLoading}
                onClick={signInWithGoogle}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/90 text-white font-semibold text-xs border border-slate-700/80 flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Masuk dengan Google</span>
              </button>

              <button
                type="button"
                disabled={authLoading}
                onClick={signInAsGuest}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/10 active:scale-95 disabled:opacity-50"
              >
                <User className="w-4 h-4 text-slate-950" />
                <span>Lanjut Mode Tamu (Tanpa Akun)</span>
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[11px] text-slate-500 font-medium">atau Email</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {isRegisterMode && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Nama Tampilan</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Nama kamu"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Alamat Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Kata Sandi</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>{isRegisterMode ? 'Daftar Akun Baru' : 'Masuk dengan Email'}</span>
                )}
              </button>
            </form>

            <div className="text-center pt-1 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-xs text-amber-400 hover:underline font-medium cursor-pointer"
              >
                {isRegisterMode
                  ? 'Sudah punya akun? Masuk di sini'
                  : 'Belum punya akun? Buat akun baru'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
