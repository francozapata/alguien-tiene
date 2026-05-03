import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrAO5LUFyPE605IX9eWCMuHwDTVTV95vA",
  authDomain: "alguien-tiene.firebaseapp.com",
  projectId: "alguien-tiene",
  storageBucket: "alguien-tiene.firebasestorage.app",
  messagingSenderId: "5593966854",
  appId: "1:5593966854:web:bb2b9fa9f1152c39119687"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);