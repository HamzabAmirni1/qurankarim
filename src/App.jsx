import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Play, Pause, Download, Volume2, Search, Loader2, 
  Heart, BookOpen, LogOut, User, X, Moon, Sun, 
  MessageCircle, Instagram, Youtube, Facebook, Send, Globe, Bookmark,
  Clock, Sunrise, Sunset, MoonStar, Star, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabase';
import './App.css';

const API_BASE = 'https://mp3quran.net/api/v3';
const QURAN_TEXT_API = 'https://api.alquran.cloud/v1';
const TAFSIR_API = 'https://quranenc.com/api/v1/translation/aya/arabic_moyassar';
const PRAYER_API = 'https://api.aladhan.com/v1/timingsByCity';
const ADHKAR_URL = 'https://raw.githubusercontent.com/nawafalqari/azkar-api/master/azkar.json';

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
  const [activeTab, setActiveTab] = useState('all');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [lastRead, setLastRead] = useState(JSON.parse(localStorage.getItem('lastRead')) || null);

  const [readingSurah, setReadingSurah] = useState(null);
  const [surahText, setSurahText] = useState(null);
  const [readingLoading, setReadingLoading] = useState(false);
  const [selectedTafsir, setSelectedTafsir] = useState(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);

  const [prayerTimes, setPrayerTimes] = useState(null);
  const [city, setCity] = useState(localStorage.getItem('city') || 'Casablanca');
  const [adhkar, setAdhkar] = useState({});
  const [selectedAdhkarCategory, setSelectedAdhkarCategory] = useState(null);

  const audioRef = useRef(new Audio());

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchReciters();
    fetchSurahs();
    fetchPrayerTimes();
    fetchAdhkar();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) fetchUserData(session.user.id);
      else { setFavorites([]); setLastRead(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId) => {
    const { data } = await supabase.from('user_data').select('*').eq('user_id', userId).single();
    if (data) {
      setFavorites(data.favorites || []);
      setLastRead(data.last_read || null);
      if (data.last_read) localStorage.setItem('lastRead', JSON.stringify(data.last_read));
    }
  };

  const fetchReciters = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/reciters?language=ar`);
      setReciters(data.reciters);
      setSelectedReciter(data.reciters.find(r => r.name.includes('العفاسي')) || data.reciters[0]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchSurahs = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/suwar?language=ar`);
      setSurahs(data.suwar);
    } catch (e) { console.error(e); }
  };

  const fetchPrayerTimes = async () => {
    try {
      const { data } = await axios.get(`${PRAYER_API}?city=${city}&country=Morocco&method=3`);
      setPrayerTimes(data.data.timings);
    } catch (e) { console.error(e); }
  };

  const fetchAdhkar = async () => {
    try {
      const { data } = await axios.get(ADHKAR_URL);
      setAdhkar(data);
    } catch (e) { console.error(e); }
  };

  const fetchTafsir = async (surahId, ayahId) => {
    setTafsirLoading(true);
    try {
      const { data } = await axios.get(`${TAFSIR_API}/${surahId}/${ayahId}`);
      setSelectedTafsir(data.result);
    } catch (e) { console.error(e); } finally { setTafsirLoading(false); }
  };

  const login = () => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  const logout = () => supabase.auth.signOut();

  const toggleFavorite = async (surahId) => {
    if (!user) { login(); return; }
    const newFavs = favorites.includes(surahId) ? favorites.filter(id => id !== surahId) : [...favorites, surahId];
    setFavorites(newFavs);
    await supabase.from('user_data').update({ favorites: newFavs }).eq('user_id', user.id);
  };

  const saveBookmark = async (ayah) => {
    const bookmarkData = { surahId: readingSurah.id, surahName: readingSurah.name, ayahNumber: ayah.numberInSurah, timestamp: Date.now() };
    setLastRead(bookmarkData);
    localStorage.setItem('lastRead', JSON.stringify(bookmarkData));
    if (user) await supabase.from('user_data').update({ last_read: bookmarkData }).eq('user_id', user.id);
    fetchTafsir(readingSurah.id, ayah.numberInSurah);
  };

  const openReadingMode = async (surah) => {
    setReadingSurah(surah);
    setReadingLoading(true);
    setSelectedTafsir(null);
    try {
      const { data } = await axios.get(`${QURAN_TEXT_API}/surah/${surah.id}/ar.alafasy`);
      setSurahText(data.data);
    } catch (e) { console.error(e); } finally { setReadingLoading(false); }
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
      const link = document.body.appendChild(document.createElement('a'));
      link.href = URL.createObjectURL(blob);
      link.download = `${surah.name}.mp3`;
      link.click();
      document.body.removeChild(link);
    } catch { window.open(url, '_blank'); }
  };

  useEffect(() => {
    const audio = audioRef.current;
    const update = () => setProgress((audio.currentTime / audio.duration) * 100 || 0);
    audio.addEventListener('timeupdate', update);
    audio.addEventListener('ended', () => setIsPlaying(false));
    return () => audio.removeEventListener('timeupdate', update);
  }, []);

  const filteredSurahs = surahs.filter(s => s.name.includes(searchQuery)).filter(s => activeTab === 'all' || favorites.includes(s.id));

  if (loading) return (
    <div className="loading-container">
      <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      <p>جاري تحميل تطبيق القرآن...</p>
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
          <input type="text" placeholder="ابحث في القرآن..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
              <button onClick={login} className="login-btn" style={{ background: '#047857' }}><User size={20} /> دخول</button>
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
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card khatm-card" onClick={() => openReadingMode(surahs.find(s => s.id === lastRead.surahId))}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
              <Bookmark color="#fff" fill="var(--accent)" />
              <div style={{ fontSize: '1.1rem', color: '#fff' }}><strong>مواصلة الختمة:</strong> سورة {lastRead.surahName} - آية {lastRead.ayahNumber}</div>
            </div>
          </motion.div>
        )}

        <nav className="tabs">
          <div className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>السور</div>
          <div className={`tab ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>المفضلة</div>
          <div className={`tab ${activeTab === 'adhkar' ? 'active' : ''}`} onClick={() => setActiveTab('adhkar')}>الأذكار</div>
          <div className={`tab ${activeTab === 'prayers' ? 'active' : ''}`} onClick={() => setActiveTab('prayers')}>مواقيت الصلاة</div>
        </nav>

        {activeTab === 'all' || activeTab === 'favorites' ? (
          <>
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
                    </div>
                  </div>
                  <div className="surah-actions">
                    <button className={`action-btn favorite ${favorites.includes(surah.id) ? 'active' : ''}`} onClick={() => toggleFavorite(surah.id)}><Heart size={18} fill={favorites.includes(surah.id) ? "#ef4444" : "none"} /></button>
                    <button className="action-btn" onClick={() => openReadingMode(surah)}><BookOpen size={18} /></button>
                    <button className="action-btn" onClick={() => playSurah(surah)}>{currentSurah?.id === surah.id && isPlaying ? <Pause size={18} /> : <Play size={18} />}</button>
                    <button className="action-btn" onClick={() => downloadSurah(surah)}><Download size={18} /></button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        ) : activeTab === 'adhkar' ? (
          <div className="adhkar-section">
            <div className="categories-scroll">
              {Object.keys(adhkar).map(cat => (
                <button key={cat} className={`cat-btn ${selectedAdhkarCategory === cat ? 'active' : ''}`} onClick={() => setSelectedAdhkarCategory(cat)}>{cat}</button>
              ))}
            </div>
            <div className="adhkar-grid">
              {selectedAdhkarCategory && adhkar[selectedAdhkarCategory].map((zikr, idx) => (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={idx} className="card zikr-card">
                  <p>{zikr.content}</p>
                  <div className="zikr-footer"><span>التكرار: {zikr.count || (zikr.repeats && JSON.parse(zikr.repeats)) || 1}</span><span className="source">{zikr.description}</span></div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="prayer-times-section">
            <div className="card city-selector">
              <label className="label">اختر المدينة</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Casablanca, Rabat..." />
                <button className="login-btn" onClick={fetchPrayerTimes}>تحديث</button>
              </div>
            </div>
            {prayerTimes && (
              <div className="prayer-grid">
                {[
                  { name: 'الفجر', key: 'Fajr', icon: <Sunrise size={24} /> },
                  { name: 'الظهر', key: 'Dhuhr', icon: <Sun size={24} /> },
                  { name: 'العصر', key: 'Asr', icon: <Sunset size={24} /> },
                  { name: 'المغرب', key: 'Maghrib', icon: <Sunset size={24} color="#f97316" /> },
                  { name: 'العشاء', key: 'Isha', icon: <MoonStar size={24} color="#6366f1" /> }
                ].map(p => (
                  <div key={p.key} className="card prayer-card">
                    <div className="p-icon">{p.icon}</div>
                    <div className="p-name">{p.name}</div>
                    <div className="p-time">{prayerTimes[p.key]}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reading & Tafsir Modal */}
      <AnimatePresence>
        {readingSurah && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content reading-modal" initial={{ scale: 0.9 }}>
              <div className="modal-header">
                <h2>{readingSurah.name}</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {selectedTafsir && <button className="action-btn" onClick={() => setSelectedTafsir(null)}><Info size={20} /> النص الأصلي</button>}
                  <button className="close-btn" onClick={() => setReadingSurah(null)}><X size={24} /></button>
                </div>
              </div>
              <div className="reading-body">
                {readingLoading ? <Loader2 className="animate-spin" /> : (
                  <div className="reading-layout">
                    <div className="quran-text-column">
                      {![1, 9].includes(readingSurah.id) && <div className="basmala">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>}
                      {surahText?.ayahs.map(ayah => (
                        <span key={ayah.number} className={`ayah-content ${lastRead?.ayahNumber === ayah.numberInSurah ? 'bookmarked' : ''}`} onClick={() => saveBookmark(ayah)}>
                          {ayah.text} <span className="ayah-number">{ayah.numberInSurah}</span>
                        </span>
                      ))}
                    </div>
                    {selectedTafsir && (
                      <motion.div initial={{ x: 300 }} animate={{ x: 0 }} className="tafsir-panel">
                        <h3>تفسير الآية {selectedTafsir.aya}</h3>
                        {tafsirLoading ? <Loader2 className="animate-spin" /> : (
                          <div className="tafsir-content">
                            <p className="original-ayah">{selectedTafsir.arabic_text}</p>
                            <hr />
                            <p className="tafsir-text">{selectedTafsir.translation}</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
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
            <button className="play-pause-btn" onClick={() => isPlaying ? audioRef.current.pause() : audioRef.current.play()}>{isPlaying ? <Pause size={24} /> : <Play size={24} />}</button>
            <div className="progress-container"><div className="progress-bar" onClick={(e) => { const rect = e.target.getBoundingClientRect(); audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * audioRef.current.duration; }}><div className="progress-fill" style={{ width: `${progress}%` }}></div></div></div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer>
        <div className="dev-info"><h3>بإشراف المطور حمزة اعمرني</h3><p>Hamza Amirni - Software Developer</p></div>
        <div className="social-grid">
          {SOCIAL_LINKS.map((link, idx) => (
            <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="social-link">{link.icon} {link.name}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}

export default App;
