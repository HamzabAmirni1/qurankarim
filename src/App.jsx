import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Play, Pause, Download, Search, Loader2,
  Heart, BookOpen, User, X, Moon, Sun,
  MessageCircle, Instagram, Youtube, Facebook, Send, Globe, Bookmark,
  Sunrise, Sunset, MoonStar, Info, BookCheck, MapPin, SkipForward, SkipBack, Calendar, Award, CheckCircle, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabase';
import confetti from 'canvas-confetti';
import { CHALLENGES_DATA } from './data/challenges';
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
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // --- New features from khatawat-elmuslim ---
  // Khatma Planner
  const [khatmaPlan, setKhatmaPlan] = useState(JSON.parse(localStorage.getItem('khatmaPlan')) || null);
  const [completedKhatmaDays, setCompletedKhatmaDays] = useState(JSON.parse(localStorage.getItem('completedKhatmaDays')) || []);
  const [khatmaInputs, setKhatmaInputs] = useState({ khatmas: 1, days: 30, sessions: 5 });
  
  // 30-Day Challenge
  const [hijriDay, setHijriDay] = useState(parseInt(localStorage.getItem('hijri_day')) || 1);
  const [hijriDateStr, setHijriDateStr] = useState('');
  const [challengeCompleted, setChallengeCompleted] = useState(false);

  // Top Bar Info
  const [maghribCountdown, setMaghribCountdown] = useState('');
  const [currentTimeStr, setCurrentTimeStr] = useState('');

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

    // PWA Install Prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      if (!localStorage.getItem('pwaInstallDismissed')) setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => setShowInstallBanner(false));

    // Audio Progress Sync
    const updateProgress = () => {
      if (audioRef.current.duration) {
        setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
      }
    };
    audioRef.current.addEventListener('timeupdate', updateProgress);
    audioRef.current.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      audioRef.current.removeEventListener('timeupdate', updateProgress);
    };
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
      setupHijriInfo(data.data.date?.hijri);
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

        const timings = prayerRes.data.data.timings;
        setPrayerTimes(timings);
        
        // Setup hijri date
        const hijri = prayerRes.data.data.date.hijri;
        setupHijriInfo(hijri);

        const detectedCity = geoRes.data.city || geoRes.data.locality || "الموقع الحالي";
        setCity(detectedCity);
        localStorage.setItem('city', detectedCity);
        notify(`تم تحديد موقعك: ${detectedCity}`, 'success');
      } catch (e) { notify('فشل جلب أوقات الصلاة لموقعك', 'error'); }
    }, () => notify('يرجى السماح بالوصول للموقع', 'error'));
  };

  const setupHijriInfo = (hijri) => {
    if (!hijri) return;
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const englishNumerals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const convertArabicNumeralsToEnglish = (str) => str.replace(/[٠-٩]/g, (d) => englishNumerals[arabicNumerals.indexOf(d)]);
    
    let hDay = parseInt(convertArabicNumeralsToEnglish(String(hijri.day)), 10);
    const hMonth = hijri.month.ar;
    const hYear = convertArabicNumeralsToEnglish(String(hijri.year));
    
    setHijriDay(hDay);
    localStorage.setItem('hijri_day', String(hDay));
    setHijriDateStr(`${hDay} ${hMonth} ${hYear} هـ`);
  };

  const calculateKhatmaPlan = () => {
    const { khatmas, days, sessions } = khatmaInputs;
    if (khatmas && days && sessions) {
      const totalPagesPerDay = Math.ceil((khatmas * 600) / days);
      const pagesPerSession = (totalPagesPerDay / sessions).toFixed(1);
      const plan = { khatmas, days, sessions, totalPagesPerDay, pagesPerSession };
      setKhatmaPlan(plan);
      localStorage.setItem('khatmaPlan', JSON.stringify(plan));
      notify('تم إعداد خطة الختمة بنجاح', 'success');
    }
  };

  const toggleKhatmaDay = (day) => {
    let newCompleted;
    if (completedKhatmaDays.includes(day)) {
      newCompleted = completedKhatmaDays.filter(d => d !== day);
    } else {
      newCompleted = [...completedKhatmaDays, day];
    }
    setCompletedKhatmaDays(newCompleted);
    localStorage.setItem('completedKhatmaDays', JSON.stringify(newCompleted));
  };

  const resetKhatmaPlan = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف خطة الختمة الحالية والبدء من جديد؟')) {
      setKhatmaPlan(null);
      setCompletedKhatmaDays([]);
      localStorage.removeItem('khatmaPlan');
      localStorage.removeItem('completedKhatmaDays');
    }
  };

  const completeDailyChallenge = () => {
    setChallengeCompleted(true);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#047857', '#a47148', '#ffffff', '#ffd700']
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
      if (prayerTimes && prayerTimes.Maghrib) {
        const convertArabicNumeralsToEnglish = (str) => {
          const arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
          return str.replace(/[٠-٩]/g, (d) => String(arabic.indexOf(d)));
        };
        const maghribStr = convertArabicNumeralsToEnglish(prayerTimes.Maghrib);
        const [h, m] = maghribStr.split(':');
        const maghribDate = new Date();
        maghribDate.setHours(h, m, 0);
        
        let diff = maghribDate - now;
        if (diff < 0) {
          setMaghribCountdown("أفطرتم هنيئاً!");
        } else {
          const hrs = Math.floor(diff / 3600000).toString().padStart(2, '0');
          const mins = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
          const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
          setMaghribCountdown(`${hrs}:${mins}:${secs}`);
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [prayerTimes]);

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
  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') notify('تم تثبيت التطبيق بنجاح! 🎉', 'success');
    setInstallPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismissInstall = () => {
    localStorage.setItem('pwaInstallDismissed', 'true');
    setShowInstallBanner(false);
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
      const { data } = await axios.get(`https://api.alquran.cloud/v1/surah/${surah.id}/quran-simple-enhanced`);
      setSurahText({
        ayahs: data.data.ayahs.map(v => ({ number: v.number, numberInSurah: v.numberInSurah, text: v.text }))
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

      <div className="info-strip" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)', padding: '0.8rem 2rem', margin: '1rem auto', maxWidth: '1200px', borderRadius: '12px', flexWrap: 'wrap', gap: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)' }}>
            <Calendar size={18} color="var(--primary)" />
            <span>{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)', borderRight: '2px solid var(--border-color)', paddingRight: '1.5rem' }}>
            <Moon size={18} color="var(--primary)" />
            <span>{hijriDateStr}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)', borderRight: '2px solid var(--border-color)', paddingRight: '1.5rem' }}>
            <Clock size={18} color="var(--primary)" />
            <span style={{ direction: 'ltr' }}>{currentTimeStr}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f9731615', color: '#f97316', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 'bold' }}>
          <Sunset size={18} />
          <span>الوقت المتبقي لأذان المغرب: <span style={{ direction: 'ltr', display: 'inline-block', minWidth: '70px', textAlign: 'center' }}>{maghribCountdown}</span></span>
        </div>
      </div>

      {/* PWA Install Banner */}
      <AnimatePresence>
        {showInstallBanner && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            className="pwa-install-banner"
          >
            <div className="pwa-install-content">
              <div className="pwa-install-icon">📲</div>
              <div className="pwa-install-text">
                <strong>ثبّت التطبيق</strong>
                <span>استمتع بالقرآن الكريم كتطبيق على هاتفك أو حاسوبك</span>
              </div>
            </div>
            <div className="pwa-install-actions">
              <button className="pwa-install-btn" onClick={handleInstall}>تثبيت</button>
              <button className="pwa-dismiss-btn" onClick={handleDismissInstall}>×</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
          <div className={`tab ${activeTab === 'khatma' ? 'active' : ''}`} onClick={() => setActiveTab('khatma')}>خطة الختمة</div>
          <div className={`tab ${activeTab === 'challenge' ? 'active' : ''}`} onClick={() => setActiveTab('challenge')}>تحدي 30 يوم</div>
          <div className={`tab ${activeTab === 'adhkar' ? 'active' : ''}`} onClick={() => setActiveTab('adhkar')}>الأذكار</div>
          <div className={`tab ${activeTab === 'duas' ? 'active' : ''}`} onClick={() => setActiveTab('duas')}>أدعية مختارة</div>
          <div className={`tab ${activeTab === 'prayers' ? 'active' : ''}`} onClick={() => setActiveTab('prayers')}>مواقيت الصلاة</div>
          <div className={`tab ${activeTab === 'help' ? 'active' : ''}`} onClick={() => setActiveTab('help')}>كيفية الاستخدام</div>
          <div className={`tab ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>عن التطبيق</div>
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
        ) : activeTab === 'challenge' ? (
          <div className="challenge-section">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card help-card" style={{ textAlign: 'center' }}>
              <span className="day-badge" style={{ background: 'var(--primary)', color: '#fff', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.9rem' }}>تحدي اليوم {hijriDay} من الشهر الهجري</span>
              <h2 className="dua-cat-title" style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>{CHALLENGES_DATA[(hijriDay - 1) % CHALLENGES_DATA.length].title}</h2>
              <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>{CHALLENGES_DATA[(hijriDay - 1) % CHALLENGES_DATA.length].desc}</p>
              <div style={{ background: 'var(--card-bg-alt)', padding: '1.5rem', borderRadius: '8px', margin: '1.5rem 0' }}>
                <span style={{ fontFamily: 'Scheherazade New', fontSize: '1.5rem', color: 'var(--primary)', lineHeight: '2' }}>"{CHALLENGES_DATA[(hijriDay - 1) % CHALLENGES_DATA.length].evidence}"</span>
                <div style={{ marginTop: '1rem', fontSize: '1rem', color: 'var(--text-muted)' }}>- {CHALLENGES_DATA[(hijriDay - 1) % CHALLENGES_DATA.length].source}</div>
              </div>
              <button 
                className="login-btn" 
                onClick={completeDailyChallenge}
                style={{ background: challengeCompleted ? '#28a745' : 'var(--primary)', width: 'auto', padding: '0.8rem 2rem', marginTop: '1rem', fontSize: '1.1rem' }}
                disabled={challengeCompleted}
              >
                {challengeCompleted ? <><CheckCircle size={20} className="inline mr-2" /> تقبل الله منك!</> : <><CheckCircle size={20} className="inline mr-2" /> تم بحمد الله</>}
              </button>
            </motion.div>
          </div>
        ) : activeTab === 'khatma' ? (
          <div className="khatma-section">
            {!khatmaPlan ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card help-card">
                <div className="help-header">
                  <BookCheck size={32} className="text-emerald-500" />
                  <h2>ضبط خطة الختمة</h2>
                </div>
                <div className="controls-grid" style={{ gridTemplateColumns: '1fr', gap: '1rem', marginTop: '1.5rem' }}>
                  <div>
                    <label className="label">كم ختمة تريد أن تختم في هذا الشهر؟</label>
                    <input type="number" min="1" value={khatmaInputs.khatmas} onChange={(e) => setKhatmaInputs({...khatmaInputs, khatmas: parseInt(e.target.value) || 1 })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text)' }} />
                  </div>
                  <div>
                    <label className="label">كم يوماً تنوي القراءة خلالها؟ (مثلاً: 30 لشهر كامل)</label>
                    <input type="number" min="1" max="365" value={khatmaInputs.days} onChange={(e) => setKhatmaInputs({...khatmaInputs, days: parseInt(e.target.value) || 30 })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text)' }} />
                  </div>
                  <div>
                    <label className="label">كم مرة تقرأ القرآن في اليوم (عدد الجلسات)؟</label>
                    <input type="number" min="1" max="20" value={khatmaInputs.sessions} onChange={(e) => setKhatmaInputs({...khatmaInputs, sessions: parseInt(e.target.value) || 5 })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text)' }} />
                  </div>
                  <button className="login-btn" onClick={calculateKhatmaPlan} style={{ marginTop: '1rem', width: '100%', padding: '1rem' }}>ابدأ خطة الختمة</button>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="card text-center relative" style={{ marginBottom: '2rem' }}>
                  <h3 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '1.5rem' }}>خطتك الحالية للختمة</h3>
                  <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>خطتك لمدة <b style={{ color: 'var(--primary)' }}>{khatmaPlan.days}</b> يوماً: قراءة <b style={{ color: 'var(--primary)' }}>{khatmaPlan.totalPagesPerDay}</b> صفحة يومياً.</p>
                  <p style={{ fontSize: '1.1rem' }}>عليك قراءة <b style={{ color: 'var(--primary)' }}>{khatmaPlan.pagesPerSession}</b> صفحة في كل جلسة.</p>
                  <button className="theme-toggle" onClick={resetKhatmaPlan} style={{ position: 'absolute', top: '1rem', left: '1rem', background: '#ef4444', color: '#fff', padding: '0.5rem', borderRadius: '50%' }} title="إعادة ضبط الخطة">
                    <X size={18} />
                  </button>
                </div>
                
                <h4 style={{ margin: '2rem 0 1rem', textAlign: 'center', fontSize: '1.3rem' }}>مسار الختمة - {khatmaPlan.days} يوماً</h4>
                <div className="adhkar-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px' }}>
                  {Array.from({ length: khatmaPlan.days }).map((_, idx) => {
                    const day = idx + 1;
                    const isDone = completedKhatmaDays.includes(day);
                    return (
                      <div 
                        key={day} 
                        onClick={() => toggleKhatmaDay(day)}
                        style={{
                          background: isDone ? '#047857' : 'var(--card-bg)',
                          color: isDone ? '#fff' : 'var(--text)',
                          border: isDone ? 'none' : '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '1rem 0.5rem',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                        }}
                      >
                        <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>يوم {day}</div>
                        {isDone ? <CheckCircle size={20} style={{ margin: '0 auto' }} /> : <Clock size={20} style={{ margin: '0 auto', opacity: 0.5 }} />}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        ) : activeTab === 'about' ? (
          <div className="about-container card help-card" style={{ textAlign: 'center' }}>
            <div style={{ margin: '1rem auto 2rem', width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', border: '4px solid var(--primary)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
              <img src="https://ui-avatars.com/api/?name=Hamza+Amirni&background=047857&color=fff&size=120" alt="Hamza Amirni" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <h1 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '2rem' }}>حمزة اعمرني</h1>
            <h2 style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>مطور ومبرمج برمجيات الإسلامية</h2>
            <div style={{ lineHeight: '1.8', maxWidth: '800px', margin: '0 auto', fontSize: '1.1rem', color: 'var(--text)' }}>
              <p style={{ marginBottom: '1rem' }}>أنا شاب مسلم أحب التقنية وأسعى لتوظيفها في خدمة ديني وأمتي.</p>
              <p style={{ marginBottom: '1rem' }}>أنشأت تطبيق "القرآن الكريم" ليكون رفيقًا يوميًا يعيننا على الطاعة ويذكرنا بالله في زحمة الحياة.</p>
              <p style={{ marginBottom: '1rem' }}>تساعدك المنصة على ختم القرآن وإعداد خطة مخصصة لك، كما تحتوي على أذكار من السنة الصحيحة وتحدي 30 يوم لتعزيز العادات الإيمانية.</p>
              <p style={{ color: 'var(--primary)', fontWeight: 'bold', margin: '2rem 0 1rem', fontSize: '1.2rem' }}>إن أصبت فمن الله، وإن أخطأت فمن نفسي.</p>
              <p style={{ background: 'rgba(4, 120, 87, 0.1)', padding: '1rem', borderRadius: '8px' }}>🤲 لا تنسوني ووالدي من دعوة صالحة بظهر الغيب، أن يرحمنا الله ويغفر لنا ويجعل هذا العمل صدقة جارية لنا.</p>
            </div>
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
                <div className="rr-header-audio-player">
                  <div className="rr-audio-main-controls">
                    <button className="rr-skip-btn" onClick={(e) => { e.stopPropagation(); audioRef.current.currentTime -= 10 }} title="رجوع 10 ثواني"><SkipBack size={18} /></button>
                    <button 
                      className={`rr-play-btn ${currentSurah?.id === readingSurah.id && isPlaying ? 'playing' : ''}`}
                      onClick={(e) => { e.stopPropagation(); playSurah(readingSurah); }}
                    >
                      {currentSurah?.id === readingSurah.id && isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
                    </button>
                    <button className="rr-skip-btn" onClick={(e) => { e.stopPropagation(); audioRef.current.currentTime += 10 }} title="تقديم 10 ثواني"><SkipForward size={18} /></button>
                  </div>
                  {currentSurah?.id === readingSurah.id && (
                    <div className="rr-audio-progress-bar-mini">
                      <div className="rr-progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                  )}
                </div>

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
            <div className="player-info"><strong>{currentSurah.name}</strong><br /><small>{selectedReciter?.name}</small></div>
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
