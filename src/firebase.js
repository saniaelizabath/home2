import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    projectId: "tuitionapp-b354c",
    appId: "1:319686109373:web:d1f2ac234c74cfd0dd2fd4",
    storageBucket: "tuitionapp-b354c.firebasestorage.app",
    apiKey: "AIzaSyDAf2W4cBJw64x3v5X5skDEOdDF2BIJKIs",
    authDomain: "tuitionapp-b354c.firebaseapp.com",
    messagingSenderId: "319686109373",
    measurementId: "G-RJXBFSN0PS"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
