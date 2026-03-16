import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Play, Pause, Download, Volume2, Search, Loader2, 
  Heart, BookOpen, LogOut, User, X, Moon, Sun,
  MessageCircle, Instagram, Youtube, Facebook, Send, Globe, Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabase';
import './App.css';

const API_BASE = 'https://mp3quran.net/api/v3';
const QURAN_TEXT_API = 'https://api.alquran.cloud/v1';

const SOCIAL_LINKS = [
  { name: 'قناة الواتساب', icon: <MessageCircle size={18} />, url: 'https://whatsapp.com/channel/0029ValXRoHCnA7yKopcrn1p' },
  { name: 'مجموعة الواتساب', icon: <MessageCircle size={18} />, url: 'https://chat.whatsapp.com/DDb3fGPuZPB1flLc1BV9gJ' },
  { name: 'إنستغرام 1', icon: <Instagram size={18} />, url: 'https://instagram.com/hamza_amirni_01' },
  { name: 'إنستغرام 2', icon: <Instagram size={18} />, url: 'https://instagram.com/hamza_amirni_02' },
  { name: 'قناة الإنستغرام', icon: <Instagram size={18} />, url: 'https://www.instagram.com/channel/AbbqrMVbExH_EZLD/' },
  { name: 'فيسبوك', icon: <Facebook size={18} />, url: 'https://www.facebook.com/6kqzuj3y4e' },
  { name: 'صفحة الفيسبوك', icon: <Facebook size={18} />, url: 'https://www.facebook.com/profile.php?id=61564527797752' },
  { name: 'يوتيوب', icon: <Youtube size={18} />, url: 'https://www.youtube.com/@Hamzaamirni01' },
  { name: 'تلغرام', icon: <Send size={18} />, url: 'https://t.me/hamzaamirni' },
  { name: 'موقعي الشخصي', icon: <Globe size={18} />, url: 'https://hamzaamirni.netlify.app' }
];

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
  const [activeTab, setActiveTab] = useState('all');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [lastRead, setLastRead] = useState(JSON.parse(localStorage.getItem('lastRead')) || null);

  const [readingSurah, setReadingSurah] = useState(null);
  const [surahText, setSurahText] = useState(null);
  const [readingLoading, setReadingLoading] = useState(false);

  const audioRef = useRef(new Audio());

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchReciters();
    fetchSurahs();
    
    // Supabase Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setFavorites([]);
        setLastRead(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId) => {
    const { data, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      setFavorites(data.favorites || []);
      setLastRead(data.last_read || null);
      if (data.last_read) {
        localStorage.setItem('lastRead', JSON.stringify(data.last_read));
      }
    } else if (error && error.code === 'PGRST116') {
      // Create record if doesn't exist
      await supabase.from('user_data').insert([{ user_id: userId, favorites: [], last_read: null }]);
    }
  };

  const fetchReciters = async () => {
    try {
      const response = await axios.get(`${API_BASE}/reciters?language=ar`);
      setReciters(response.data.reciters);
      setSelectedReciter(response.data.reciters.find(r => r.name.includes('العفاسي')) || response.data.reciters[0]);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const fetchSurahs = async () => {
    try {
      const response = await axios.get(`${API_BASE}/suwar?language=ar`);
      setSurahs(response.data.suwar);
    } catch (error) { console.error(error); }
  };

  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const logout = () => supabase.auth.signOut();

  const toggleFavorite = async (surahId) => {
    if (!user) { login(); return; }
    
    let newFavorites;
    if (favorites.includes(surahId)) {
      newFavorites = favorites.filter(id => id !== surahId);
    } else {
      newFavorites = [...favorites, surahId];
    }

    setFavorites(newFavorites);
    await supabase
      .from('user_data')
      .update({ favorites: newFavorites })
      .eq('user_id', user.id);
  };

  const saveBookmark = async (ayah) => {
    const bookmarkData = {
      surahId: readingSurah.id,
      surahName: readingSurah.name,
      ayahNumber: ayah.numberInSurah,
      timestamp: Date.now()
    };
    setLastRead(bookmarkData);
    localStorage.setItem('lastRead', JSON.stringify(bookmarkData));
    if (user) {
      await supabase
        .from('user_data')
        .update({ last_read: bookmarkData })
        .eq('user_id', user.id);
    }
  };

  const openReadingMode = async (surah) => {
    setReadingSurah(surah);
    setReadingLoading(true);
    try {
      const response = await axios.get(`${QURAN_TEXT_API}/surah/${surah.id}/ar.alafasy`);
      setSurahText(response.data.data);
    } catch (error) { console.error(error); } finally { setReadingLoading(false); }
  };

  const getAudioUrl = (surah, reciter) => {
    if (!reciter || !reciter.moshaf) return null;
    const moshaf = reciter.moshaf.find(m => m.surah_list.split(',').map(Number).includes(surah.id)) || reciter.moshaf[0];
    return `${moshaf.server}${surah.id.toString().padStart(3, '0')}.mp3`;
  };

  const playSurah = (surah, reciter = selectedReciter) => {
    const url = getAudioUrl(surah, reciter);
    if (!url) return;
    if (currentSurah?.id === surah.id && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.src = url;
      audioRef.current.play();
      setCurrentSurah(surah);
      setIsPlaying(true);
    }
  };

  const downloadSurah = async (surah) => {
    const url = getAudioUrl(surah, selectedReciter);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${surah.name}.mp3`;
      link.click();
    } catch { window.open(url, '_blank'); }
  };

  useEffect(() => {
    const audio = audioRef.current;
    const update = () => setProgress((audio.currentTime / audio.duration) * 100 || 0);
    audio.addEventListener('timeupdate', update);
    audio.addEventListener('ended', () => setIsPlaying(false));
    return () => audio.removeEventListener('timeupdate', update);
  }, []);

  const filteredSurahs = surahs
    .filter(s => s.name.includes(searchQuery))
    .filter(s => activeTab === 'all' || favorites.includes(s.id));

  if (loading) return (
    <div className="loading-container">
      <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      <p>جاري التحميل...</p>
    </div>
  );

  return (
    <div className="app-container" style={{ padding: 0, maxWidth: 'none' }}>
      <header>
        <div className="header-brand">
          <div className="header-icon"><BookOpen size={32} fill="currentColor" /></div>
          <div>
            <h1>القرآن الكريم</h1>
            <p className="dev-credit">بإشراف المطور حمزة اعمرني</p>
          </div>
        </div>

        <div className="header-search-container" style={{ flex: 1, margin: '0 2rem', maxWidth: '600px', position: 'relative' }}>
          <input 
            type="text" 
            placeholder="ابحث في القرآن..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
          />
          <Search size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
          </button>
          
          <div className="auth-bar">
            {user ? (
              <div className="user-info">
                <img src={user.user_metadata.avatar_url} className="user-avatar" alt="User" />
                <button onClick={logout} className="logout-btn">خروج</button>
              </div>
            ) : (
              <button onClick={login} className="login-btn" style={{ background: '#198754' }}>
                <LogOut size={20} style={{ transform: 'rotate(180deg)' }} />
                تسجيل الدخول
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="hero-banner">
        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>القرآن الكريم</motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>{"وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا"}</motion.p>
      </section>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        {lastRead && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card khatm-card" 
            onClick={() => openReadingMode(surahs.find(s => s.id === lastRead.surahId))}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
              <Bookmark color="#fff" fill="var(--accent)" />
              <div style={{ fontSize: '1.1rem', color: '#fff' }}>
                <strong>مواصلة الختمة:</strong> سورة {lastRead.surahName} - آية {lastRead.ayahNumber}
              </div>
            </div>
          </motion.div>
        )}

        <nav className="tabs">
          <div className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>السور</div>
          <div className={`tab ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>المفضلة ({favorites.length})</div>
        </nav>

        <div className="controls-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="card">
            <label className="label">اختر القارئ للاستماع</label>
            <select value={selectedReciter?.id} onChange={(e) => setSelectedReciter(reciters.find(r => r.id === parseInt(e.target.value)))}>
              {reciters.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        </div>

        <div className="surahs-grid">
          {filteredSurahs.map((surah) => (
            <motion.div layout key={surah.id} className="card surah-card">
              <div className="surah-info">
                <div className="surah-number">{surah.id}</div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="surah-name">{surah.name}</div>
                  <div className="surah-english">{surah.englishName || `Surah ${surah.id}`}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '4px', background: 'rgba(22, 163, 74, 0.05)', padding: '2px 8px', borderRadius: '10px', width: 'fit-content' }}>
                    {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                  </div>
                </div>
              </div>
            <div className="surah-actions">
              <button className={`action-btn favorite ${favorites.includes(surah.id) ? 'active' : ''}`} onClick={() => toggleFavorite(surah.id)}>
                <Heart size={18} fill={favorites.includes(surah.id) ? "#ef4444" : "none"} />
              </button>
              <button className="action-btn" onClick={() => openReadingMode(surah)} title="قراءة"><BookOpen size={18} /></button>
              <button className="action-btn" onClick={() => playSurah(surah)} title="استماع">
                {currentSurah?.id === surah.id && isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button className="action-btn" onClick={() => downloadSurah(surah)} title="تحميل"><Download size={18} /></button>
            </div>
          </motion.div>
        ))}
        </div>
      </div>

      <AnimatePresence>
        {readingSurah && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content" initial={{ scale: 0.9 }}>
              <div className="modal-header">
                <h2>{readingSurah.name}</h2>
                <button className="close-btn" onClick={() => setReadingSurah(null)}><X size={24} /></button>
              </div>
              <div className="reading-body">
                {readingLoading ? <Loader2 className="animate-spin" /> : (
                  <>
                    {![1, 9].includes(readingSurah.id) && <div className="basmala">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>}
                    {surahText?.ayahs.map(ayah => (
                      <span 
                        key={ayah.number} 
                        className={`ayah-content ${lastRead?.surahId === readingSurah.id && lastRead?.ayahNumber === ayah.numberInSurah ? 'bookmarked' : ''}`}
                        onClick={() => saveBookmark(ayah)}
                        title="ابدأ من هنا المرة القادمة"
                      >
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

      <AnimatePresence>
        {currentSurah && (
          <motion.div className="player-bar" initial={{ y: 100 }} animate={{ y: 0 }}>
            <div className="player-info"><strong>{currentSurah.name}</strong><br/><small>{selectedReciter?.name}</small></div>
            <button className="play-pause-btn" onClick={() => isPlaying ? audioRef.current.pause() : audioRef.current.play()}>
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <div className="progress-container">
              <div className="progress-bar" onClick={(e) => {
                const rect = e.target.getBoundingClientRect();
                audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * audioRef.current.duration;
              }}><div className="progress-fill" style={{ width: `${progress}%` }}></div></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer>
        <div className="dev-info">
          <h3>بإشراف المطور حمزة اعمرني</h3>
          <p>Hamza Amirni - Software Developer</p>
        </div>
        <div className="social-grid">
          {SOCIAL_LINKS.map((link, idx) => (
            <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="social-link">
              {link.icon} {link.name}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}

export default App;
