import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Play, Pause, Download, Volume2, Search, Loader2, 
  Heart, BookOpen, LogOut, User, X, Globe 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, googleProvider, db } from './firebase';
import { 
  signInWithPopup, signOut, onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot 
} from 'firebase/firestore';
import './App.css';

const API_BASE = 'https://mp3quran.net/api/v3';
const QURAN_TEXT_API = 'https://api.alquran.cloud/v1';

function App() {
  const [reciters, setReciters] = useState([]);
  const [selectedReciter, setSelectedReciter] = useState(null);
  const [surahs, setSurahs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSurah, setCurrentSurah] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'favorites'
  
  // Auth state
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);

  // Reading mode state
  const [readingSurah, setReadingSurah] = useState(null);
  const [surahText, setSurahText] = useState(null);
  const [readingLoading, setReadingLoading] = useState(false);

  const audioRef = useRef(new Audio());

  useEffect(() => {
    fetchReciters();
    fetchSurahs();
    
    // Auth listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Listen to favorites
        const favRef = doc(db, 'users', currentUser.uid);
        onSnapshot(favRef, (docSnap) => {
          if (docSnap.exists()) {
            setFavorites(docSnap.data().favorites || []);
          } else {
            setDoc(favRef, { favorites: [] });
          }
        });
      } else {
        setFavorites([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchReciters = async () => {
    try {
      const response = await axios.get(`${API_BASE}/reciters?language=ar`);
      setReciters(response.data.reciters);
      const defaultReciter = response.data.reciters.find(r => r.name.includes('العفاسي')) || response.data.reciters[0];
      setSelectedReciter(defaultReciter);
    } catch (error) {
      console.error('Error fetching reciters:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSurahs = async () => {
    try {
      const response = await axios.get(`${API_BASE}/suwar?language=ar`);
      setSurahs(response.data.suwar);
    } catch (error) {
      console.error('Error fetching suwar:', error);
    }
  };

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = () => signOut(auth);

  const toggleFavorite = async (surahId) => {
    if (!user) {
      login();
      return;
    }
    const favRef = doc(db, 'users', user.uid);
    if (favorites.includes(surahId)) {
      await updateDoc(favRef, { favorites: arrayRemove(surahId) });
    } else {
      await updateDoc(favRef, { favorites: arrayUnion(surahId) });
    }
  };

  const openReadingMode = async (surah) => {
    setReadingSurah(surah);
    setReadingLoading(true);
    try {
      const response = await axios.get(`${QURAN_TEXT_API}/surah/${surah.id}/ar.alafasy`);
      setSurahText(response.data.data);
    } catch (error) {
      console.error('Error fetching surah text:', error);
    } finally {
      setReadingLoading(false);
    }
  };

  const getAudioUrl = (surah, reciter) => {
    if (!reciter || !reciter.moshaf) return null;
    const moshaf = reciter.moshaf.find(m => {
      const allowedSurahs = m.surah_list.split(',').map(Number);
      return allowedSurahs.includes(surah.id);
    }) || reciter.moshaf[0];
    return `${moshaf.server}${surah.id.toString().padStart(3, '0')}.mp3`;
  };

  const playSurah = (surah, reciter = selectedReciter) => {
    const audioUrl = getAudioUrl(surah, reciter);
    if (!audioUrl) return;

    if (currentSurah?.id === surah.id && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setCurrentSurah(surah);
      setIsPlaying(true);
    }
  };

  const downloadSurah = async (surah) => {
    const audioUrl = getAudioUrl(surah, selectedReciter);
    if (!audioUrl) return;
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${surah.name}-${selectedReciter.name}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      window.open(audioUrl, '_blank');
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    const updateProgress = () => {
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
      setDuration(audio.duration || 0);
    };
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', () => setIsPlaying(false));
    return () => audio.removeEventListener('timeupdate', updateProgress);
  }, []);

  const handleProgressChange = (e) => {
    const rect = e.target.getBoundingClientRect();
    const p = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = p * audioRef.current.duration;
  };

  const filteredSurahs = surahs
    .filter(s => s.name.includes(searchQuery))
    .filter(s => activeTab === 'all' || favorites.includes(s.id));

  if (loading) return (
    <div className="loading-container">
      <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      <p>جاري تحميل تطبيق القرآن الكريم...</p>
    </div>
  );

  return (
    <div className="app-container">
      <header>
        <div className="header-brand">
          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }}>القرآن الكريم</motion.h1>
          <p>استماع، تحميل، وقراءة</p>
        </div>

        <div className="auth-bar">
          {user ? (
            <div className="user-info">
              <img src={user.photoURL} alt={user.displayName} className="user-avatar" />
              <button onClick={logout} className="logout-btn">خروج</button>
            </div>
          ) : (
            <button onClick={login} className="login-btn">
              <User size={20} />
              تسجيل الدخول
            </button>
          )}
        </div>
      </header>

      <nav className="tabs">
        <div className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>جميع السور</div>
        <div className={`tab ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>المفضلة {favorites.length > 0 && `(${favorites.length})`}</div>
      </nav>

      <div className="controls-grid">
        <div className="card">
          <label className="label">اختر القارئ</label>
          <select value={selectedReciter?.id} onChange={(e) => setSelectedReciter(reciters.find(r => r.id === parseInt(e.target.value)))}>
            {reciters.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        <div className="card">
          <label className="label">بحث عن سورة</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="ابحث عن سورة..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        </div>
      </div>

      <div className="surahs-grid">
        {filteredSurahs.map((surah) => (
          <motion.div layout key={surah.id} className="card surah-card">
            <div className="surah-info">
              <div className="surah-number">{surah.id}</div>
              <div className="surah-name">{surah.name}</div>
            </div>
            <div className="surah-actions">
              <button className={`action-btn favorite ${favorites.includes(surah.id) ? 'active' : ''}`} onClick={() => toggleFavorite(surah.id)}>
                <Heart size={18} fill={favorites.includes(surah.id) ? "currentColor" : "none"} />
              </button>
              <button className="action-btn read" onClick={() => openReadingMode(surah)}>
                <BookOpen size={18} />
              </button>
              <button className="action-btn" onClick={() => playSurah(surah)}>
                {currentSurah?.id === surah.id && isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button className="action-btn" onClick={() => downloadSurah(surah)}>
                <Download size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Reading Modal */}
      <AnimatePresence>
        {readingSurah && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <div className="modal-header">
                <h2>سورة {readingSurah.name}</h2>
                <button className="close-btn" onClick={() => setReadingSurah(null)}><X size={24} /></button>
              </div>
              <div className="reading-body">
                {readingLoading ? (
                  <Loader2 className="animate-spin" size={32} />
                ) : (
                  <>
                    {readingSurah.id !== 1 && readingSurah.id !== 9 && <div className="basmala">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>}
                    {surahText?.ayahs.map(ayah => (
                      <span key={ayah.number}>
                        {ayah.text} <span className="ayah-number">{ayah.numberInSurah}</span>
                      </span>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player Bar */}
      <AnimatePresence>
        {currentSurah && (
          <motion.div className="player-bar" initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}>
            <div className="player-info">
              <span className="surah-name">{currentSurah.name}</span>
              <span className="label">{selectedReciter?.name}</span>
            </div>
            <div className="player-controls">
              <button className="play-pause-btn" onClick={() => isPlaying ? audioRef.current.pause() : audioRef.current.play()}>
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
            </div>
            <div className="progress-container">
              <div className="progress-bar" onClick={handleProgressChange}>
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}><Volume2 size={20} /></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
