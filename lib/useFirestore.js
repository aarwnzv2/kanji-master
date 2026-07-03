import { useEffect, useState } from 'react';
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

export function useFirestore(userId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Real-time sync de l'utilisateur
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      (doc) => {
        if (doc.exists()) {
          setData(doc.data());
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  // Save user data
  const saveUserData = async (userData) => {
    if (!userId) return;
    try {
      await setDoc(doc(db, 'users', userId), userData, { merge: true });
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  return { data, loading, saveUserData };
}
