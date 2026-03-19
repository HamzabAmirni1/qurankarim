import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Play, Pause, Download, Search, Loader2, 
  Heart, BookOpen, User, X, Moon, Sun, 
  MessageCircle, Instagram, Youtube, Facebook, Send, Globe, Bookmark,
  Sunrise, Sunset, MoonStar, Info, BookCheck, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabase';
import './App.css';

const API_BASE = 'https://mp3quran.net/api/v3';
const PRAYER_API = 'https://api.aladhan.com/v1/timingsByCity';
const TAFSIR_API = 'https://quranenc.com/api/v1/translation/aya/arabic_moyassar';
const ADHKAR_URL = 'https://raw.githubusercontent.com/nawafalqari/azkar-api/56df51279ab6eb86dc2f6202c7de26c8948331c1/azkar.json';
const HISN_AL_MUSLIM = {
  "أذكار الصباح": [
    { content: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لا إِلَهَ إِلا اللَّهُ وَحْدَهُ لا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", count: 1, ref: "مسلم" },
    { content: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ", count: 1, ref: "الترمذي" },
    { content: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ", count: 1, ref: "الحاكم (صحيح)" }
  ],
  "أذكار المساء": [
    { content: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لا إِلَهَ إِلا اللَّهُ وَحْدَهُ لا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", count: 1, ref: "مسلم" },
    { content: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ", count: 1, ref: "الترمذي" }
  ],
  "أذكار النوم": [
    { content: "بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا، بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ", count: 1, ref: "البخاري ومسلم" }
  ]
};

const DUAS_DATA = {
  "أدعية قرآنية": [
    { text: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", src: "سورة البقرة" },
    { text: "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً إِنَّكَ أَنْتَ الْوَهَّابُ", src: "سورة آل عمران" },
    { text: "رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي رَبَّنَا وَتَقَبَّلْ دُعَاءِ", src: "سورة إبراهيم" }
  ],
  "أدعية الاستغفار": [
    { text: "اللَّهُمَّ أَنْتَ رَبِّي لا إِلَهَ إِلا أَنْتَ ، خَلَقْتَنِي وَأَنَا عَبْدُكَ ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ", src: "سيد الاستغفار" },
    { text: "رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ", src: "سنن أبي داود" }
  ],
  "أدعية تيسير الأمور": [
    { text: "اللَّهُمَّ لا سَهْلَ إِلا مَا جَعَلْتَهُ سَهْلاً ، وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلاً", src: "صحيح ابن حبان" },
    { text: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ", src: "الترمذي" }
  ]
};

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

const MOROCCAN_CITIES = [
  "Agadir", "Al Hoceima", "Arfoud", "Assilah", "Azemour", "Azilal", "Azrou", "Ben Slimane", "Bengrire", "Beni Mellal", "Berkane", "Berrechid", "Bouarfa", "Boujad", "Boujdour", "Boulemane", "Bouznika", "Casablanca", "Chefchaouen", "Dakhla", "El Jadida", "El Kelaa des Sraghna", "Errachidia", "Essaouira", "Fes", "Figuig", "Guelmim", "Guercif", "Ifrane", "Kenitra", "Khemisset", "Khenifra", "Khouribga", "Ksar El Kebir", "Laayoune", "Larache", "Marrakesh", "Meknes", "Midelt", "Missour", "Mohammedia", "Nador", "Ouarzazate", "Oued Zem", "Oujda", "Rabat", "Safi", "Sefrou", "Settat", "Sidi Ifni", "Sidi Kacem", "Sidi Slimane", "Skhirat", "Smara", "Tan-Tan", "Tangier", "Taourirt", "Taroudant", "Tata", "Taza", "Temara", "Tetouan", "Tifelt", "Tinghir", "Tiznit", "Youssoufia", "Zagora"
].sort();

function App() {
  const [reciters, setReciters] = useState([]);
  const [selectedReciter, setSelectedReciter] = useState(null);
  const [surahs, setSurahs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSurah, setCurrentSurah] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState(localStorage.getItem('activeTab') || 'all');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [notification, setNotification] = useState(null);
  
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [lastRead, setLastRead] = useState(JSON.parse(localStorage.getItem('lastRead')) || null);

  const [readingSurah, setReadingSurah] = useState(null);
  const [surahText, setSurahText] = useState(null);
  const [readingLoading, setReadingLoading] = useState(false);
  const [selectedTafsir, setSelectedTafsir] = useState(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [readingFontSize, setReadingFontSize] = useState(parseInt(localStorage.getItem('readingFontSize')) || 28);
  const [readingTheme, setReadingTheme] = useState(localStorage.getItem('readingTheme') || 'sepia');

  // New Tafsir Tab States
  const [tafsirSurahId, setTafsirSurahId] = useState(1);
  const [tafsirAyahId, setTafsirAyahId] = useState(1);
  const [independentTafsir, setIndependentTafsir] = useState(null);

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
    localStorage.setItem('readingFontSize', readingFontSize);
  }, [readingFontSize]);

  useEffect(() => {
    localStorage.setItem('readingTheme', readingTheme);
  }, [readingTheme]);

  const notify = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

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

  const fetchPrayerTimes = async (customCity = city) => {
    try {
      const { data } = await axios.get(`${PRAYER_API}?city=${customCity}&country=Morocco&method=3`);
      setPrayerTimes(data.data.timings);
      setCity(customCity);
      localStorage.setItem('city', customCity);
      if (customCity !== "الموقع الحالي") notify(`تم تحديث المواقيت لمدينة ${customCity}`, 'success');
    } catch (e) { notify('لم يتم العثور على المدينة', 'error'); }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return notify('متصفحك لا يدعم تحديد الموقع', 'error');
    
    notify('جاري تحديد موقعك...', 'info');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const [prayerRes, geoRes] = await Promise.all([
          axios.get(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=3`),
          axios.get(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ar`)
        ]);
        
        setPrayerTimes(prayerRes.data.data.timings);
        const detectedCity = geoRes.data.city || geoRes.data.locality || "الموقع الحالي";
        setCity(detectedCity);
        localStorage.setItem('city', detectedCity);
        notify(`تم تحديد موقعك: ${detectedCity}`, 'success');
      } catch (e) { notify('فشل جلب أوقات الصلاة لموقعك', 'error'); }
    }, () => notify('يرجى السماح بالوصول للموقع', 'error'));
  };

  const fetchAdhkar = async () => {
    try {
      const { data } = await axios.get(ADHKAR_URL);
      setAdhkar(data);
      if (!selectedAdhkarCategory) setSelectedAdhkarCategory(Object.keys(data)[0]);
    } catch (e) { console.error(e); }
  };

  const fetchTafsir = async (surahId, ayahId, isIndependent = false) => {
    if (isIndependent) setTafsirLoading(true);
    try {
      const { data } = await axios.get(`${TAFSIR_API}/${surahId}/${ayahId}`);
      if (isIndependent) setIndependentTafsir(data.result);
      else setSelectedTafsir(data.result);
    } catch (e) { console.error(e); } finally { setTafsirLoading(false); }
  };

  const login = () => {
    notify('جاري توجيهك لتسجيل الدخول...', 'info');
    supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  };
  const logout = () => { 
    supabase.auth.signOut();
    notify('تم تسجيل الخروج بنجاح', 'success');
  };

  const toggleFavorite = async (surahId) => {
    if (!user) { login(); return; }
    const newFavs = favorites.includes(surahId) ? favorites.filter(id => id !== surahId) : [...favorites, surahId];
    setFavorites(newFavs);
    await supabase.from('user_data').update({ favorites: newFavs }).eq('user_id', user.id);
  };

  const saveBookmark = async (ayah) => {
    const data = { surahId: readingSurah.id, surahName: readingSurah.name, ayahNumber: ayah.numberInSurah };
    setLastRead(data);
    localStorage.setItem('lastReadBook', JSON.stringify(data));
    notify(`تم حفظ مكانك في سورة ${readingSurah.name} - آية ${ayah.numberInSurah}`, 'success');
    if (user) {
      await supabase.from('profiles').update({ last_read: data }).eq('id', user.id);
    }
    fetchTafsir(readingSurah.id, ayah.numberInSurah);
  };

  const openReadingMode = async (surah) => {
    setReadingSurah(surah);
    setReadingLoading(true);
    setSelectedTafsir(null);
    try {
      const { data } = await axios.get(`https://raw.githubusercontent.com/risan/quran-json/main/dist/chapters/${surah.id}.json`);
      setSurahText({
        ayahs: data.verses.map(v => ({ number: v.id, numberInSurah: v.id, text: v.text }))
      });
    } catch (e) { console.error(e); notify('خطأ في تحميل النص', 'error'); } finally { setReadingLoading(false); }
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
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
          
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {lastRead && (
            <button className="resume-header-btn" onClick={() => openReadingMode(surahs.find(s => s.id === lastRead.surahId))}>
              <Bookmark size={18} /> استكمال القراءة
            </button>
          )}
          <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
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
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="khatm-card-premium" 
            onClick={() => openReadingMode(surahs.find(s => s.id === lastRead.surahId))}
          >
            <div className="khatm-content">
              <div className="khatm-text">
                <span className="khatm-label">واصل من حيث توقفت</span>
                <h3>سورة {lastRead.surahName}</h3>
                <p>آية رقم {lastRead.ayahNumber}</p>
              </div>
              <div className="khatm-icon-glow">
                <Bookmark size={60} fill="rgba(255,255,255,0.2)" />
              </div>
            </div>
            <div className="khatm-action-hint">اضغط للمتابعة <BookOpen size={16} /></div>
          </motion.div>
        )}

        <nav className="tabs">
          <div className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>السور</div>
          <div className={`tab ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>المفضلة</div>
          <div className={`tab ${activeTab === 'tafsir' ? 'active' : ''}`} onClick={() => setActiveTab('tafsir')}>تفسير السور</div>
          <div className={`tab ${activeTab === 'adhkar' ? 'active' : ''}`} onClick={() => setActiveTab('adhkar')}>الأذكار</div>
          <div className={`tab ${activeTab === 'duas' ? 'active' : ''}`} onClick={() => setActiveTab('duas')}>أدعية مختارة</div>
          <div className={`tab ${activeTab === 'prayers' ? 'active' : ''}`} onClick={() => setActiveTab('prayers')}>مواقيت الصلاة</div>
          <div className={`tab ${activeTab === 'help' ? 'active' : ''}`} onClick={() => setActiveTab('help')}>كيفية الاستخدام</div>
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
                    <button className={`action-btn favorite ${favorites.includes(surah.id) ? 'active' : ''}`} onClick={() => toggleFavorite(surah.id)} title="تفضيل"><Heart size={18} fill={favorites.includes(surah.id) ? "#ef4444" : "none"} /></button>
                    <button className="action-btn" onClick={() => openReadingMode(surah)} title="قراءة وتفسير"><BookOpen size={18} /></button>
                    <button className="action-btn" onClick={() => playSurah(surah)} title="استماع"><Play size={18} /></button>
                    <button className="action-btn" onClick={() => downloadSurah(surah)} title="تحميل"><Download size={18} /></button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        ) : activeTab === 'tafsir' ? (
          <div className="tafsir-full-tab">
            <div className="card tafsir-controls">
              <div className="grid-2">
                <div>
                  <label className="label">اختر السورة</label>
                  <select value={tafsirSurahId} onChange={(e) => setTafsirSurahId(e.target.value)}>
                    {surahs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">رقم الآية</label>
                  <input type="number" min="1" value={tafsirAyahId} onChange={(e) => setTafsirAyahId(e.target.value)} />
                </div>
              </div>
              <button className="login-btn w-full mt-1" onClick={() => fetchTafsir(tafsirSurahId, tafsirAyahId, true)}>بحث في التفسير</button>
            </div>
            {tafsirLoading ? <div className="p-4 text-center"><Loader2 className="animate-spin inline" /> جاري جلب التفسير...</div> : independentTafsir && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card tafsir-results">
                <h1>{independentTafsir.sura} - آية {independentTafsir.aya}</h1>
                <p className="original-ayah-large">{independentTafsir.arabic_text}</p>
                <div className="tafsir-main">
                  <h3>تفسير الميسر</h3>
                  <p>{independentTafsir.translation}</p>
                </div>
              </motion.div>
            )}
          </div>
        ) : activeTab === 'adhkar' ? (
          <div className="adhkar-section">
            <div className="categories-scroll">
              {Object.keys(adhkar).map(cat => (
                <button key={cat} className={`cat-btn ${selectedAdhkarCategory === cat ? 'active' : ''}`} onClick={() => setSelectedAdhkarCategory(cat)}>{cat}</button>
              ))}
            </div>
            <div className="adhkar-grid">
              {/* Authenticated Hisn Al Muslim Section */}
              <div className="dua-category-group">
                <h2 className="dua-cat-title">حصن المسلم (موثق)</h2>
                <div className="adhkar-grid">
                  {Object.entries(HISN_AL_MUSLIM).map(([cat, items]) => (
                    <div key={cat} style={{ gridColumn: '1/-1' }}>
                      <h3 style={{ marginBottom: '1rem', color: 'var(--primary)', opacity: 0.8 }}>{cat}</h3>
                      <div className="adhkar-grid">
                        {items.map((item, i) => (
                          <motion.div key={i} className="card zikr-card authenticated-zikr">
                            <p style={{ fontSize: '1.2rem', fontFamily: 'Scheherazade New' }}>{item.content}</p>
                            <div className="zikr-footer">
                              <div className="zikr-badge">التكرار: {item.count}</div>
                              <small className="zikr-src">المصدر: {item.ref}</small>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ts-divider" style={{ gridColumn: '1/-1', margin: '3rem 0' }}></div>

              {selectedAdhkarCategory && adhkar[selectedAdhkarCategory].map((zikr, idx) => (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }} key={idx} className="card zikr-card">
                  <div className="zikr-content-box">
                    <p>{zikr.content}</p>
                  </div>
                  <div className="zikr-footer">
                    <div className="zikr-badge">التكرار: {zikr.count || 1}</div>
                    <small className="zikr-src">{zikr.description || 'مصدر موثوق'}</small>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : activeTab === 'duas' ? (
          <div className="duas-section">
            <div className="adhkar-grid">
              {Object.entries(DUAS_DATA).map(([category, items]) => (
                <div key={category} className="dua-category-group">
                  <h2 className="dua-cat-title">{category}</h2>
                  <div className="adhkar-grid">
                    {items.map((dua, i) => (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={i} className="card zikr-card dua-card-premium">
                        <div className="zikr-content-box">
                          <p style={{ fontSize: '1.4rem', lineHeight: '2' }}>{dua.text}</p>
                        </div>
                        <div className="zikr-footer">
                          <small className="zikr-src">{dua.src}</small>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'help' ? (
          <div className="help-section">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card help-card">
              <div className="help-header">
                <Info size={32} className="text-emerald-500" />
                <h2>دليل الاستخدام والختمة</h2>
              </div>
              <div className="help-content-grid">
                <div className="help-item">
                  <h3>📖 كيف أبدأ الختمة؟</h3>
                  <p>عند دخولك لوضع "القراءة"، قم بالضغط على أي آية تصل إليها. سيقوم التطبيق تلقائياً بحفظ مكانك ووضع علامة تمييز عليها.</p>
                </div>
                <div className="help-item">
                  <h3>🔖 التذكير التلقائي</h3>
                  <p>في المرة القادمة التي تفتح فيها التطبيق، ستجد بطاقة علوية تخبرك بآخر سورة وآية توقفت عندها. اضغط عليها لتعود فوراً لمكانك.</p>
                </div>
                <div className="help-item">
                  <h3>🎧 الاستماع والتحميل</h3>
                  <p>يمكنك اختيار قارئك المفضل من القائمة والاستماع للسور مباشرة أو تحميلها لجهازك بصيغة MP3.</p>
                </div>
                <div className="help-item">
                  <h3>🌙 الوضع الليلي</h3>
                  <p>استخدم أيقونة الشمس/القمر في الأعلى للتبديل بين وضع النهار ووضع الليل المريح للعين.</p>
                </div>
              </div>
              <div className="help-footer-note">
                <Bookmark size={20} /> نصيحة: قم بتسجيل الدخول لحفظ ختمتك ومفضلاتك عبر جميع أجهزتك.
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="prayer-times-section">
            <div className="card city-selector">
              <label className="label">اختيار المدينة</label>
              <div className="city-input-group">
                <input 
                  list="moroccan-cities"
                  type="text" 
                  value={city} 
                  onChange={(e) => setCity(e.target.value)} 
                  placeholder="ابحث عن مدينة (مثلاً: Casablanca)" 
                />
                <datalist id="moroccan-cities">
                  {MOROCCAN_CITIES.map(c => <option key={c} value={c} />)}
                </datalist>
                <button className="login-btn" onClick={() => fetchPrayerTimes(city)}>تحديث</button>
                <button className="theme-toggle" title="تحديد موقعي" onClick={detectLocation} style={{ background: 'var(--primary)', color: '#fff', borderRadius: '8px', padding: '0.6rem' }}>
                  <MapPin size={22} />
                </button>
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

      {/* Professional Reading Room */}
      <AnimatePresence>
        {readingSurah && (
          <motion.div 
            className={`reading-room-overlay theme-${readingTheme}`} 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.98 }}
          >
            <div className="reading-room-header">
              <div className="rr-controls-left">
                <button className="icon-btn-rr" onClick={() => setReadingSurah(null)} title="خروج"><X size={24} /></button>
                <div className="rr-title-box">
                  <h2>{readingSurah.name}</h2>
                  <div className="rr-meta-info">
                    <span className="rr-badge">{readingSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</span>
                    <span className="rr-badge">{readingSurah.numberOfAyahs} آية</span>
                    <span>{readingSurah.englishName}</span>
                  </div>
                </div>
              </div>

              <div className="rr-controls-right">
                <div className="font-control">
                  <span className="label-sm">حجم الخط</span>
                  <input type="range" min="20" max="60" value={readingFontSize} onChange={(e) => setReadingFontSize(parseInt(e.target.value))} />
                </div>
                
                <div className="theme-pills">
                  {['light', 'dark', 'sepia'].map(t => (
                    <button key={t} className={`theme-pill ${readingTheme === t ? 'active' : ''} ${t}`} onClick={() => setReadingTheme(t)} />
                  ))}
                </div>
              </div>
            </div>

            <div className="reading-room-body">
              {readingLoading ? (
                <div className="loader-full"><Loader2 className="animate-spin" size={48} /><span>جاري تجهيز المصحف...</span></div>
              ) : (
                <div className="reading-room-layout">
                  <div className="quran-text-container-premium">
                    <div className="quran-text-flow" style={{ fontSize: `${readingFontSize}px` }}>
                      {![1, 9].includes(readingSurah.id) && <div className="basmala-premium">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>}
                      {surahText?.ayahs.map((ayah, index) => {
                        return (
                          <span 
                            key={ayah.number} 
                            className={`ayah-unit ${lastRead?.ayahNumber === ayah.numberInSurah && lastRead?.surahId === readingSurah.id ? 'active-verse' : ''}`} 
                            onClick={() => saveBookmark(ayah)}
                          >
                            {ayah.text} <span className="ayah-number-badge">{ayah.numberInSurah}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {selectedTafsir && (
                      <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} className="tafsir-side-panel">
                        <div className="ts-header">
                          <h3>تفسير الميسر</h3>
                          <button onClick={() => setSelectedTafsir(null)}><X size={20} /></button>
                        </div>
                        <div className="ts-content">
                          <p className="ts-ayah-text">{selectedTafsir.arabic_text}</p>
                          <div className="ts-divider" />
                          <p className="ts-translation"><strong>التفسير:</strong> {selectedTafsir.translation}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
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

      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`notification-toast ${notification.type}`}
          >
            {notification.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
