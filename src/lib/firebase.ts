import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const defaultFirebaseConfig = {
  projectId: "loui-4c309",
  appId: "1:765750796086:web:3e6a960278658fe9de1d97",
  apiKey: "AIzaSyCUKhJLcixcA2A2X9xsHz1YogDVOyc8z79k",
  authDomain: "loui-4c309.firebaseapp.com",
  firestoreDatabaseId: "default",
  storageBucket: "loui-4c309.firebasestorage.app",
  messagingSenderId: "765750796086",
};

const app = getApps().length === 0 ? initializeApp(defaultFirebaseConfig) : getApp();

export const auth = getAuth(app);
const dbId = defaultFirebaseConfig.firestoreDatabaseId;
export const db = (dbId && dbId !== 'default' && dbId !== '(default)') 
  ? getFirestore(app, dbId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
