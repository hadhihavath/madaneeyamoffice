import { initializeApp, getApps, getApp } from "firebase/app";

// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyByHEojemrjJb-adC0CwSQibrUH9-zx4NM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "officeceem.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "officeceem",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "officeceem.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "735928526170",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:735928526170:web:2d74989531f729e052ff63",
};

// Initialize Firebase (safeguarded against duplicate initialization in SSR/HMR)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export default app;
