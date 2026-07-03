import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA2pS0E6uUPPodmXyzGTG6voaGodvUc9oQ",
  authDomain: "kanji-master-d2e6f.firebaseapp.com",
  projectId: "kanji-master-d2e6f",
  storageBucket: "kanji-master-d2e6f.firebasestorage.app",
  messagingSenderId: "255601882759",
  appId: "1:255601882759:web:d0248af5a53e6a15542a22",
  measurementId: "G-71W5HXJQT5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
