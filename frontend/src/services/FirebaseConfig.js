import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDY3fNyri2zNW-fVvbjvtV3sDJx6LdLjBo",
  authDomain: "luct-reporting-app-cb106.firebaseapp.com",
  projectId: "luct-reporting-app-cb106",
  storageBucket: "luct-reporting-app-cb106.firebasestorage.app",
  messagingSenderId: "475408059518",
  appId: "1:475408059518:web:75686477a04e4cf6969c2f",
  measurementId: "G-P7Z0JMF59K"
};

// ✅ Only initialize app once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ✅ Only initialize auth once
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (e) {
  // Already initialized — just get the existing instance
  auth = getAuth(app);
}

// ✅ Firestore
export const db = getFirestore(app);

// ✅ Export both db and firestore so all files work
export const firestore = db;

export { auth };