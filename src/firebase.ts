import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

/**
 * Firebase Configuration
 * Silakan lengkapi dengan konfigurasi asli dari Firebase Console Anda.
 */
const firebaseConfig = {
  apiKey: "AIzaSyB4b-kerTYVtSsDdkzfvweU0WJhaSlwduo",
  authDomain: "grid-c2a69.firebaseapp.com",
  projectId: "grid-c2a69",
  storageBucket: "grid-c2a69.firebasestorage.app",
  messagingSenderId: "910647457052",
  appId: "1:910647457052:web:b4178636bc0926cdaff6d9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and export it
export const db = getFirestore(app);

export default app;
