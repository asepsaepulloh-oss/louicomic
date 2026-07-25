import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const defaultFirebaseConfig = {
  projectId: "yielding-datum-lzp2g",
  appId: "1:74744533323:web:3bef96ed4ad04dc22618ce",
  apiKey: "AIzaSyCIaxpiCMGqc9GiZ7pPMEKbP3iWcKbyfpU",
  authDomain: "yielding-datum-lzp2g.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-copy-50261e5e-2530-46e4-bfa0-360061fdbff7",
  storageBucket: "yielding-datum-lzp2g.firebasestorage.app",
  messagingSenderId: "74744533323",
};

const app = getApps().length === 0 ? initializeApp(defaultFirebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = defaultFirebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, defaultFirebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
