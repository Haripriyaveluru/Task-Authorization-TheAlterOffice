
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyAZ6LXlOOoKsf0l-itr2c6cHzYCETY1ar0",
    authDomain: "task-auth-management.firebaseapp.com",
    projectId: "task-auth-management",
    storageBucket: "task-auth-management.firebasestorage.app",
    messagingSenderId: "461059262981",
    appId: "1:461059262981:web:4b943b4e9d35d9715baa6c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log(app, 'inti app');
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, provider, signInWithPopup, signOut, db, storage };