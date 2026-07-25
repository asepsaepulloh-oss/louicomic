import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const defaultFirebaseConfig = {
  projectId: "loui-4c309",
  appId: "1:765750796086:android:0030f1948387d417de1d97",
  apiKey: "AIzaSyCxytSbAJv0glm814OFMEzNy1kTRaOAK0I",
  authDomain: "loui-4c309.firebaseapp.com",
  firestoreDatabaseId: "default",
  storageBucket: "loui-4c309.firebasestorage.app",
  messagingSenderId: "765750796086",
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
