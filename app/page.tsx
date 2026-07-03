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
  const drawingRef = useRef(false);
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

  // Save leaderboard
  useEffect(() => {
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
  }, [leaderboard]);

  // Initialize leaderboard with demo users
  const initializeLeaderboard = () => {
    const demo = [
      { username: 'KanjiKing', level: 'N1', score: 450, wins: 45, streak: 28 },
      { username: 'SushiLover', level: 'N2', score: 380, wins: 38, streak: 15 },
      { username: 'TokyoDreamer', level: 'N3', score: 320, wins: 32, streak: 12 },
      { username: 'MangaReader', level: 'N4', score: 280, wins: 28, streak: 8 },
      { username: 'AnimeWatcher', level: 'N5', score: 150, wins: 15, streak: 5 },
    ];
    setLeaderboard(demo);
    localStorage.setItem('leaderboard', JSON.stringify(demo));
  };

  // Calculate user score
  const calculateScore = () => {
    let score = 0;
    Object.values(kanjiData).forEach((levelData) => {
      Object.values(levelData).forEach((data) => {
        score += (data.stage || 0) * 10;
      });
    });
    return score + streak * 5;
  };

  // Set username
  const handleSetUsername = (name) => {
    if (name.trim()) {
      setUsername(name);
      localStorage.setItem('username', name);
      setShowUsernameModal(false);
    }
  };

  // Duel timer
  useEffect(() => {
    if (!duelMode || duelTime <= 0) return;

    const timer = setInterval(() => {
      setDuelTime((t) => {
        if (t <= 1) {
          endDuel();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [duelMode, duelTime]);

  const startDuel = () => {
    setDuelMode(true);
    setDuelScore(0);
    setDuelTime(duelDuration);
    setMode('learn');
    setIdx(0);
  };

  const endDuel = () => {
    const userScore = duelScore;
    const opponentScore = Math.floor(Math.random() * (duelScore + 20));

    if (userScore > opponentScore) {
      setWins(wins + 1);
      alert(`🎉 You won! ${userScore} vs ${opponentScore}`);
    } else {
      setLosses(losses + 1);
      alert(`💔 You lost! ${userScore} vs ${opponentScore}`);
    }

    setDuelMode(false);
    addToLeaderboard();
  };

  const addToLeaderboard = () => {
    const userScore = calculateScore();
    const newUser = {
      username: username || 'Player',
      level,
      score: userScore,
      wins,
      streak,
    };

    const updated = [...leaderboard];
    const existingIdx = updated.findIndex((u) => u.username === username);

    if (existingIdx >= 0) {
      updated[existingIdx] = newUser;
    } else {
      updated.push(newUser);
    }

    updated.sort((a, b) => b.score - a.score);
    setLeaderboard(updated.slice(0, 10)); // Top 10
  };

  const handleDuelCorrect = () => {
    setDuelScore(duelScore + 10);
    handleSRSCorrect();
  };

  // Calculate SRS queue
  useEffect(() => {
    const now = Date.now();
    const queue = [];

    Object.entries(kanjiData).forEach(([lv, kanjiMap]) => {
      Object.entries(kanjiMap).forEach(([kanjiIdx, data]) => {
        if (data.nextReviewDate && data.nextReviewDate <= now) {
          queue.push({ level: lv, idx: parseInt(kanjiIdx) });
        }
      });
    });

    setSrsQueue(queue);
  }, [kanjiData]);

  const kanjis = kanjiDatabase[level];
  const current = kanjis[idx];
  const currentKanjiData = kanjiData[level]?.[idx] || { stage: 0, nextReviewDate: null };

  const getMasteryLabel = (stage) => {
    if (stage === 0) return '🆕 New';
    if (stage === 1) return '📖 Learning';
    if (stage === 2 || stage === 3) return '🔄 Reviewing';
    if (stage === 4) return '⭐ Mastered';
    return '❓ Unknown';
  };

  const getMasteryColor = (stage) => {
    if (stage === 0) return '#94a3b8';
    if (stage === 1) return '#f59e0b';
    if (stage === 2 || stage === 3) return '#8b5cf6';
    if (stage === 4) return '#10b981';
    return '#6b7280';
  };

  const requestNotification = async () => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotificationEnabled(true);
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationEnabled(true);
        }
      }
    }
  };

  const showNotification = (title, options = {}) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { icon: '🎌', ...options });
    }
  };

  const handleSRSCorrect = () => {
    const newStage = Math.min((currentKanjiData.stage || 0) + 1, 4);
    const nextReviewDate = Date.now() + SRS_INTERVALS[newStage + 1];

    setKanjiData({
      ...kanjiData,
      [level]: {
        ...(kanjiData[level] || {}),
        [idx]: {
          stage: newStage,
          nextReviewDate,
          lastReviewDate: Date.now(),
        },
      },
    });

    handleLevelUp();

    setTimeout(() => {
      if (!duelMode) {
        setIdx((idx + 1) % kanjis.length);
      } else {
        setIdx((idx + 1) % kanjis.length);
      }
      setFlipped(false);
    }, 500);
  };

  const handleLevelUp = () => {
    const today = new Date().toDateString();
    const newMissionsDone = dailyMissionsDone + 1;
    setDailyMissionsDone(newMissionsDone);

    if (lastStudyDate !== today) {
      if (lastStudyDate === new Date(Date.now() - 86400000).toDateString()) {
        setStreak(streak + 1);
      } else {
        setStreak(1);
      }
      setLastStudyDate(today);
      localStorage.setItem('lastStudyDate', today);
    }

    if (newMissionsDone === 5) {
      showNotification('✨ Daily Mission Complete!', {
        body: 'Great job! Come back tomorrow.',
      });
    }
  };

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = dark ? '#1e293b' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [dark]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const startDrawing = (e) => {
      drawingRef.current = true;
      const rect = canvas.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const draw = (e) => {
      if (!drawingRef.current) return;
      const rect = canvas.getBoundingClientRect();
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = dark ? '#e2e8f0' : '#0f172a';
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    };

    const stopDrawing = () => {
      drawingRef.current = false;
      ctx.closePath();
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
    };
  }, [dark]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = dark ? '#1e293b' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const dailyGoal = 5;
  const missionComplete = dailyMissionsDone >= dailyGoal;
  const levelData = kanjiData[level] || {};
  const levelLearned = Object.keys(levelData).length;
  const levelMastered = Object.values(levelData).filter((d: any) => d && d.stage === 4).length;
  const progress = Math.round((levelLearned / kanjis.length) * 100);

  // Loading auth
  if (authLoading || dbLoading) {
    return (
      <div className={`app-container ${dark ? 'dark' : 'light'}`}>
        <div className="modal-overlay">
          <div className="modal">
            <h2>Loading... 🎌</h2>
          </div>
        </div>
      </div>
    );
  }

  // Auth Modal
  if (!user) {
    return (
      <div className={`app-container ${dark ? 'dark' : 'light'}`}>
        <div className="modal-overlay">
          <div className="modal">
            <h2>Welcome to Kanji Master! 🎌</h2>
            <p>{authMode === 'login' ? 'Sign in to continue' : 'Create an account'}</p>

            <form onSubmit={authMode === 'login' ? handleLogin : handleSignup}>
              <input
                type="email"
                placeholder="Email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
              />

              {authError && <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '12px' }}>❌ {authError}</div>}

              <button type="submit" className="btn btn-success">
                {authMode === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            </form>

            <button
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'signup' : 'login');
                setAuthError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                cursor: 'pointer',
                fontSize: '12px',
                marginTop: '12px',
                textDecoration: 'underline'
              }}
            >
              {authMode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Username Modal (after auth)
  if (showUsernameModal && !username) {
    return (
      <div className={`app-container ${dark ? 'dark' : 'light'}`}>
        <div className="modal-overlay">
          <div className="modal">
            <h2>Welcome to Kanji Master! 🎌</h2>
            <p>Choose your username</p>
            <input
              type="text"
              placeholder="Enter your username..."
              id="usernameInput"
              maxLength={20}
            />
            <button
              className="btn btn-success"
              onClick={() => handleSetUsername((document.getElementById('usernameInput') as HTMLInputElement).value)}
            >
              Start Learning!
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${dark ? 'dark' : 'light'}`}>
      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">🎌 Kanji Master</h1>
        <div className="header-right">
          {duelMode && (
            <div className="duel-timer">
              ⏱️ {duelTime}s | 🎯 {duelScore}
            </div>
          )}
          <button
            className="user-badge"
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            title={username || 'Profile'}
          >
            👤 {(username || user?.email).substring(0, 8)}
          </button>
          <button
            className="logout-btn"
            onClick={() => {
              logout();
              setUsername('');
            }}
            title="Logout"
          >
            🚪
          </button>
          <div className="streak-badge">🔥 {streak}</div>
          <button
            className={`notification-btn ${notificationEnabled ? 'enabled' : ''}`}
            onClick={requestNotification}
          >
            🔔
          </button>
          <button className="theme-btn" onClick={() => setDark(!dark)}>
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="leaderboard-modal">
          <div className="leaderboard-content">
            <div className="leaderboard-header">
              <h3>🏆 Global Leaderboard</h3>
              <button className="close-btn" onClick={() => setShowLeaderboard(false)}>
                ✕
              </button>
            </div>
            <div className="leaderboard-list">
              {leaderboard.map((user, i) => (
                <div key={i} className="leaderboard-item">
                  <div className="rank">#{i + 1}</div>
                  <div className="user-info">
                    <div className="user-name">{user.username}</div>
                    <div className="user-level">{user.level}</div>
                  </div>
                  <div className="user-stats">
                    <div className="stat">📊 {user.score}</div>
                    <div className="stat">🏆 {user.wins}</div>
                    <div className="stat">🔥 {user.streak}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Daily Mission */}
      <div className={`daily-mission ${missionComplete ? 'complete' : ''}`}>
        <div className="mission-content">
          <div className="mission-text">Daily Mission: Learn {dailyGoal} Kanji</div>
          <div className="mission-progress">
            {[...Array(dailyGoal)].map((_, i) => (
              <div
                key={i}
                className={`mission-dot ${i < dailyMissionsDone ? 'done' : ''}`}
              />
            ))}
          </div>
        </div>
        {missionComplete && <div className="mission-badge">✨ Complete!</div>}
      </div>

      {/* Level Selector */}
      <div className="level-selector">
        {levels.map((lv) => (
          <button
            key={lv}
            className={`level-btn ${level === lv ? 'active' : ''}`}
            onClick={() => {
              setLevel(lv);
              setIdx(0);
            }}
          >
            <span className="level-name">{lv}</span>
            <span className="level-count">
              {Object.keys(kanjiData[lv] || {}).length}/{kanjiDatabase[lv].length}
            </span>
          </button>
        ))}
      </div>

      {/* Mode Selector */}
      <div className="mode-selector">
        <button
          className={`mode-btn ${mode === 'learn' && !duelMode ? 'active' : ''}`}
          onClick={() => {
            setMode('learn');
            if (!duelMode) setDuelMode(false);
          }}
        >
          📚 Learn
        </button>
        <button
          className={`mode-btn ${mode === 'write' ? 'active' : ''}`}
          onClick={() => setMode('write')}
        >
          ✏️ Write
        </button>
        {srsQueue.length > 0 && (
          <button
            className={`mode-btn ${mode === 'srs' ? 'active' : ''}`}
            onClick={() => setMode('srs')}
          >
            🔄 SRS ({srsQueue.length})
          </button>
        )}
        <button
          className={`mode-btn ${mode === 'review' ? 'active' : ''}`}
          onClick={() => setMode('review')}
        >
          📊 Review
        </button>
        {!duelMode && (
          <button className="mode-btn duel-btn" onClick={startDuel}>
            🎮 Duel
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="app-main">
        {/* Progress */}
        <div className="progress-section">
          <div className="progress-header">
            <span>{level} Progress</span>
            <span className="progress-text">
              {levelLearned} / {kanjis.length} ({levelMastered} ⭐)
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* LEARN MODE */}
        {(mode === 'learn' || duelMode) && !showLeaderboard && (
          <>
            <div className="mastery-indicator" style={{ borderColor: getMasteryColor(currentKanjiData.stage) }}>
              {getMasteryLabel(currentKanjiData.stage)}
            </div>

            <div
              className={`kanji-card ${flipped ? 'flipped' : ''}`}
              onClick={() => setFlipped(!flipped)}
            >
              <div className="card-label">{flipped ? 'Answer' : 'Question'}</div>
              {!flipped ? (
                <div className="kanji-display">{current.kanji}</div>
              ) : (
                <div className="answer-display">
                  <div className="meaning">{current.meaning}</div>
                  <div className="hiragana">{current.hiragana}</div>
                  <div className="story">"{current.story}"</div>
                </div>
              )}
              <div className="card-hint">Click to flip</div>
            </div>

            <div className="button-group">
              <button
                className="btn btn-success"
                onClick={duelMode ? handleDuelCorrect : handleSRSCorrect}
              >
                ✓ Got It!
              </button>
              <button
                className={`btn btn-secondary ${dark ? 'dark' : ''}`}
                onClick={() => {
                  setIdx((idx + 1) % kanjis.length);
                  setFlipped(false);
                }}
              >
                Skip
              </button>
            </div>
          </>
        )}

        {/* WRITE MODE */}
        {mode === 'write' && !showLeaderboard && (
          <>
            <div className="write-container">
              <div className="kanji-prompt">
                <div className="prompt-label">Draw this kanji:</div>
                <div className="kanji-display" style={{ marginTop: '10px' }}>
                  {current.kanji}
                </div>
              </div>

              <canvas
                ref={canvasRef}
                className="drawing-canvas"
                width={400}
                height={300}
              />

              <div className="button-group">
                <button className="btn btn-secondary" onClick={clearCanvas}>
                  🗑️ Clear
                </button>
                <button className="btn btn-success" onClick={() => {
                  handleSRSCorrect();
                  clearCanvas();
                }}>
                  ✓ Done
                </button>
              </div>
            </div>
          </>
        )}

        {/* REVIEW MODE */}
        {mode === 'review' && !showLeaderboard && (
          <>
            <div className="review-container">
              <div className="review-stats">
                <div className="stat">
                  <div className="stat-label">Learning</div>
                  <div className="stat-value">{levelLearned}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Mastered</div>
                  <div className="stat-value">{levelMastered}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Wins</div>
                  <div className="stat-value">{wins}</div>
                </div>
              </div>

              <div className="kanji-list">
                {kanjis.map((k, i) => {
                  const data = levelData[i];
                  return (
                    <div
                      key={i}
                      className={`kanji-item ${data ? 'learned' : ''}`}
                      style={{
                        borderColor: data ? getMasteryColor(data.stage) : 'inherit',
                      }}
                      onClick={() => {
                        setIdx(i);
                        setMode('learn');
                      }}
                    >
                      <div className="kanji-char">{k.kanji}</div>
                      <div className="kanji-meta">
                        <div>{k.meaning}</div>
                        <div className="kanji-hiragana">
                          {data ? getMasteryLabel(data.stage) : '🆕 New'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Navigation */}
        {(mode === 'learn' || mode === 'write') && !showLeaderboard && (
          <div className="nav-group">
            <button
              className={`btn-nav ${dark ? 'dark' : ''}`}
              onClick={() => {
                setIdx((idx - 1 + kanjis.length) % kanjis.length);
                setFlipped(false);
                if (mode === 'write') clearCanvas();
              }}
            >
              ← Back
            </button>
            <div className={`counter ${dark ? 'dark' : ''}`}>
              {idx + 1} / {kanjis.length}
            </div>
            <button
              className="btn-nav btn-next"
              onClick={() => {
                setIdx((idx + 1) % kanjis.length);
                setFlipped(false);
                if (mode === 'write') clearCanvas();
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
