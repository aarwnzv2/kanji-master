'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/useAuth';
import { useFirestore } from '../lib/useFirestore';

const SRS_INTERVALS = {
  1: 1 * 24 * 60 * 60 * 1000,
  2: 3 * 24 * 60 * 60 * 1000,
  3: 7 * 24 * 60 * 60 * 1000,
  4: 14 * 24 * 60 * 60 * 1000,
  5: 30 * 24 * 60 * 60 * 1000,
};

export default function KanjiMaster() {
  // Firebase Auth
  const { user, loading: authLoading, signup, login, logout } = useAuth();
  const { data: firebaseData, loading: dbLoading, saveUserData } = useFirestore(user?.uid);

  // Auth Modal States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Load kanji database from JSON
  const [kanjiDatabase, setKanjiDatabase] = useState({
    N5: [],
    N4: [],
    N3: [],
    N2: [],
    N1: [],
  });

  const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];
  const duelDuration = 30; // seconds

  // State
  const [level, setLevel] = useState('N5');
  const [idx, setIdx] = useState(0);
  const [dark, setDark] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState('learn');
  const [drawing, setDrawing] = useState(false);
  const [srsQueue, setSrsQueue] = useState([]);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const canvasRef = useRef(null);

  // User & Multiplayer
  const [username, setUsername] = useState('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [duelMode, setDuelMode] = useState(false);
  const [duelScore, setDuelScore] = useState(0);
  const [duelTime, setDuelTime] = useState(duelDuration);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Persistence
  const [kanjiData, setKanjiData] = useState({});
  const [streak, setStreak] = useState(0);
  const [lastStudyDate, setLastStudyDate] = useState(null);
  const [dailyMissionsDone, setDailyMissionsDone] = useState(0);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);

  // Handle Auth
  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      setAuthError('');
      await signup(authEmail, authPassword);
      setAuthEmail('');
      setAuthPassword('');
      setShowAuthModal(false);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setAuthError('');
      await login(authEmail, authPassword);
      setAuthEmail('');
      setAuthPassword('');
      setShowAuthModal(false);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Load Firebase data when available
  useEffect(() => {
    if (firebaseData) {
      setKanjiData(firebaseData.kanjiData || {});
      setStreak(firebaseData.streak || 0);
      setUsername(firebaseData.username || '');
      setWins(firebaseData.wins || 0);
      setLosses(firebaseData.losses || 0);
    }
  }, [firebaseData]);

  // Save to Firestore when data changes
  useEffect(() => {
    if (user && !dbLoading) {
      saveUserData({
        username,
        kanjiData,
        streak,
        wins,
        losses,
        lastUpdated: new Date().toISOString(),
      });
    }
  }, [kanjiData, streak, username, wins, losses, user, dbLoading, saveUserData]);

  // Load kanji database from JSON file
  useEffect(() => {
    const loadKanjiDatabase = async () => {
      try {
        const response = await fetch('/kanji-db.json');
        const data = await response.json();
        setKanjiDatabase(data);
      } catch (error) {
        console.error('Error loading kanji database:', error);
      }
    };
    loadKanjiDatabase();
  }, []);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kanjiMasterData');
    if (saved) {
      const data = JSON.parse(saved);
      setKanjiData(data.kanjiData || {});
      setStreak(data.streak || 0);
      setLastStudyDate(data.lastStudyDate || null);
      setDailyMissionsDone(data.dailyMissionsDone || 0);
      setUsername(data.username || '');
      setWins(data.wins || 0);
      setLosses(data.losses || 0);
    }

    const savedLeaderboard = localStorage.getItem('leaderboard');
    if (savedLeaderboard) {
      setLeaderboard(JSON.parse(savedLeaderboard));
    } else {
      initializeLeaderboard();
    }

    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('lastStudyDate');
    if (lastDate && lastDate !== today) {
      setDailyMissionsDone(0);
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationEnabled(true);
    }

    if (!localStorage.getItem('username')) {
      setShowUsernameModal(true);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(
      'kanjiMasterData',
      JSON.stringify({
        kanjiData,
        streak,
        lastStudyDate,
        dailyMissionsDone,
        username,
        wins,
        losses,
      })
    );
  }, [kanjiData, streak, lastStudyDate, dailyMissionsDone, username, wins, losses]);

  // Save le