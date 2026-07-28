import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCn3klIWrLk3OF7_g8NjDdtpkn6MwamPXw",
  authDomain: "jobber-aabc8.firebaseapp.com",
  projectId: "jobber-aabc8",
  storageBucket: "jobber-aabc8.firebasestorage.app",
  messagingSenderId: "1069813215831",
  appId: "1:1069813215831:web:b0dd1bca9107c59fd56912",
  measurementId: "G-J7LE7WVK6P",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
