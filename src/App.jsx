import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Play, Pause, Download, Volume2, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const API_BASE = 'https://mp3quran.net/api/v3';

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

  const audioRef = useRef(new Audio());

  useEffect(() => {
    fetchReciters();
    fetchSurahs();
  }, []);

  const fetchReciters = async () => {
    try {
      const response = await axios.get(`${API_BASE}/reciters?language=ar`);
      setReciters(response.data.reciters);
      // Default to Mishary Rashid Alafasy if found
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

  const handleReciterChange = (e) => {
    const reciter = reciters.find(r => r.id === parseInt(e.target.value));
    setSelectedReciter(reciter);
    if (currentSurah) {
      playSurah(currentSurah, reciter);
    }
  };

  const playSurah = (surah, reciter = selectedReciter) => {
    if (!reciter) return;

    const server = reciter.moshaf[0].server;
    const surahId = surah.id.toString().padStart(3, '0');
    const audioUrl = `${server}${surahId}.mp3`;

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

  const downloadSurah = (surah) => {
    if (!selectedReciter) return;
    const server = selectedReciter.moshaf[0].server;
    const surahId = surah.id.toString().padStart(3, '0');
    const audioUrl = `${server}${surahId}.mp3`;
    
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `${surah.name}-${selectedReciter.name}.mp3`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const audio = audioRef.current;
    
    const updateProgress = () => {
      const p = (audio.currentTime / audio.duration) * 100;
      setProgress(p || 0);
      setDuration(audio.duration || 0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', () => setIsPlaying(false));
    
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
    };
  }, []);

  const handleProgressChange = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const p = x / width;
    audioRef.current.currentTime = p * audioRef.current.duration;
  };

  const filteredSurahs = surahs.filter(s => s.name.includes(searchQuery));

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem', color: '#fff' }}>
      <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      <p style={{ fontFamily: 'Cairo' }}>جاري تحميل البيانات...</p>
    </div>
  );

  if (reciters.length === 0 && !loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem', color: '#fff' }}>
      <h2>عذراً، تعذر تحميل البيانات</h2>
      <p>يرجى التحقق من اتصال الإنترنت أو المحاولة لاحقاً</p>
      <button onClick={() => window.location.reload()} className="action-btn" style={{ padding: '0.5rem 1rem' }}>إعادة المحاولة</button>
    </div>
  );

  return (
    <div className="app-container">
      <header>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          القرآن الكريم
        </motion.h1>
        <p>استمع للقرآن الكريم وحمله بصوت قارئك المفضل</p>
      </header>

      <div className="controls-grid">
        <div className="card">
          <label className="label">اختر القارئ</label>
          <select value={selectedReciter?.id} onChange={handleReciterChange}>
            {reciters.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
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
              style={{
                width: '100%',
                padding: '0.8rem 1rem 0.8rem 2.5rem',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border)',
                borderRadius: '0.8rem',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            <Search 
              size={18} 
              style={{ 
                position: 'absolute', 
                left: '1rem', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} 
            />
          </div>
        </div>
      </div>

      <div className="surahs-grid">
        {filteredSurahs.map((surah) => (
          <motion.div 
            layout
            key={surah.id} 
            className="card surah-card"
            whileHover={{ scale: 1.02 }}
          >
            <div className="surah-info">
              <div className="surah-number">{surah.id}</div>
              <div className="surah-name">{surah.name}</div>
            </div>
            <div className="surah-actions">
              <button 
                className="action-btn" 
                onClick={() => playSurah(surah)}
                title="تشغيل"
              >
                {currentSurah?.id === surah.id && isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button 
                className="action-btn download" 
                onClick={() => downloadSurah(surah)}
                title="تحميل"
              >
                <Download size={20} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {currentSurah && (
          <motion.div 
            className="player-bar"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
          >
            <div className="player-info">
              <span className="surah-name">{currentSurah.name}</span>
              <span className="label">{selectedReciter?.name}</span>
            </div>

            <div className="player-controls">
              <button 
                className="play-pause-btn"
                onClick={() => isPlaying ? audioRef.current.pause() : audioRef.current.play()}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
            </div>

            <div className="progress-container">
              <div className="progress-bar" onClick={handleProgressChange}>
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                <span>{Math.floor(audioRef.current.currentTime / 60)}:{Math.floor(audioRef.current.currentTime % 60).toString().padStart(2, '0')}</span>
                <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>

            <div className="player-actions" style={{ display: 'flex', gap: '1rem' }}>
              <Volume2 size={20} />
              {/* Add Volume control here if needed */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
