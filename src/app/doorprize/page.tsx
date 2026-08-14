'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Gift, Sparkles, Volume2, VolumeX, Minimize2, Maximize2, 
  CheckCircle, Play, RotateCcw, AlertTriangle, Download, Upload, Trash2
} from 'lucide-react';

interface DrawHistoryItem {
  id: string;
  number: number;
  prizeName: string;
  status: 'SAH' | 'GUGUR';
  winnerName?: string;
  drawnAt: string;
}

interface PrizeConfig {
  id: string;
  name: string;
  totalQuantity: number;
  drawCountPerClick: number;
  icon: string;
  colorClass: string;
}

const PRIZES: PrizeConfig[] = [
  { id: 'lemari', name: 'Lemari 2 Pintu', totalQuantity: 1, drawCountPerClick: 1, icon: '🚪', colorClass: 'from-amber-600 to-amber-900 border-amber-500' },
  { id: 'kipas', name: 'Kipas Angin', totalQuantity: 1, drawCountPerClick: 1, icon: '🌀', colorClass: 'from-blue-600 to-blue-900 border-blue-500' },
  { id: 'magicom', name: 'Magicom', totalQuantity: 1, drawCountPerClick: 1, icon: '🍚', colorClass: 'from-red-600 to-red-900 border-red-500' },
  { id: 'pel', name: 'Alat Pel BOLDE', totalQuantity: 1, drawCountPerClick: 1, icon: '🧹', colorClass: 'from-purple-600 to-purple-900 border-purple-500' },
  { id: 'uang100', name: 'Uang Tunai 100 Ribu', totalQuantity: 5, drawCountPerClick: 1, icon: '💵', colorClass: 'from-emerald-600 to-emerald-950 border-emerald-500' },
  { id: 'uang50', name: 'Uang Tunai 50 Ribu', totalQuantity: 6, drawCountPerClick: 3, icon: '💵', colorClass: 'from-teal-600 to-teal-950 border-teal-500' },
  { id: 'uang20', name: 'Uang Tunai 20 Ribu', totalQuantity: 10, drawCountPerClick: 5, icon: '💵', colorClass: 'from-cyan-600 to-cyan-950 border-cyan-500' },
  { id: 'bebas', name: 'Kocokan Bebas', totalQuantity: 999, drawCountPerClick: 1, icon: '🎲', colorClass: 'from-slate-700 to-slate-900 border-slate-500' },
];

export default function NumberDoorprizePage() {
  const [history, setHistory] = useState<DrawHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Active drawing configuration
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>('lemari');
  const [customDrawCount, setCustomDrawCount] = useState<number>(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active draw numbers container
  const [currentSlots, setCurrentSlots] = useState<{
    index: number;
    number: number;
    status: 'PENDING' | 'SAH' | 'GUGUR';
    digit1: number;
    digit2: number;
    digit3: number;
    isSpinning1: boolean;
    isSpinning2: boolean;
    isSpinning3: boolean;
  }[]>([]);

  // Refs
  const screenRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animationFrameRefs = useRef<NodeJS.Timeout[]>([]);

  const activePrize = useMemo(() => {
    return PRIZES.find(p => p.id === selectedPrizeId) || PRIZES[0];
  }, [selectedPrizeId]);

  // Compute number pool from 1 to 200
  const eligiblePool = useMemo(() => {
    const totalNumbers = Array.from({ length: 200 }, (_, i) => i + 1);
    // Exclude numbers already marked as SAH or GUGUR
    const drawnNumbers = new Set(history.map(h => h.number));
    return totalNumbers.filter(n => !drawnNumbers.has(n));
  }, [history]);

  // Audio effects synthesizer engine
  const playSynthTone = (freq: number, type: OscillatorType = 'triangle', duration = 0.3, volume = 0.15, detune = 0) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.detune.setValueAtTime(detune, ctx.currentTime);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio failed:', e);
    }
  };

  // Chunky jackpot mechanical spin tick
  const playSpinTick = () => {
    if (!soundEnabled) return;
    // Detuned sawtooth wave for heavy mechanical slot roll sound
    playSynthTone(140 + Math.random() * 80, 'sawtooth', 0.05, 0.18);
  };

  // Loud bell chime chord when a slot resolves/stops
  const playSlotStopChime = () => {
    if (!soundEnabled) return;
    // C-major chord interval (C5, E5, G5) detuned for rich chime
    const notes = [523.25, 659.25, 783.99];
    notes.forEach(f => {
      playSynthTone(f, 'triangle', 0.4, 0.15, -5);
      playSynthTone(f, 'sine', 0.4, 0.15, 0);
      playSynthTone(f, 'triangle', 0.4, 0.15, 5);
    });
  };

  // Majestic detuned multi-voice synth victory fanfare (unison chorus effect)
  const playVictoryFanfare = () => {
    if (!soundEnabled) return;
    // Casino jackpot arpeggiator tones (C5, E5, G5, C6, G5, E5) playing in a fast loop
    const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 659.25];
    const delayStep = 75; // very fast retro arcade casino payout tempo
    
    for (let loop = 0; loop < 5; loop++) {
      notes.forEach((freq, idx) => {
        const timeOffset = (loop * notes.length + idx) * delayStep;
        setTimeout(() => {
          // Play fat square waves for authentic arcade coin sound
          playSynthTone(freq, 'square', 0.12, 0.15, -6);
          playSynthTone(freq, 'square', 0.12, 0.15, 6);
        }, timeOffset);
      });
    }
  };

  // Load Draw History from Supabase & LocalStorage
  useEffect(() => {
    loadHistory();

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      animationFrameRefs.current.forEach(t => clearTimeout(t));
    };
  }, []);

  const wonCountForActivePrize = useMemo(() => {
    return history.filter(h => h.prizeName === activePrize.name && h.status === 'SAH').length;
  }, [history, activePrize]);

  const isQuotaMet = useMemo(() => {
    return activePrize.id !== 'bebas' && wonCountForActivePrize >= activePrize.totalQuantity;
  }, [activePrize, wonCountForActivePrize]);

  const isFocusMode = useMemo(() => {
    return isDrawing || (currentSlots.length > 0 && currentSlots.some(s => s.status === 'PENDING'));
  }, [isDrawing, currentSlots]);


  // Sync selected prize and history to show winners immediately if quota is full
  useEffect(() => {
    if (isDrawing) return;

    // If we have active slots in drawing/resolution phase, do NOT clear or override them
    if (currentSlots.length > 0 && currentSlots.some(s => s.status === 'PENDING' || s.status === 'GUGUR')) {
      return;
    }

    if (isQuotaMet) {
      const prizeWinners = history
        .filter(h => h.prizeName === activePrize.name && h.status === 'SAH')
        .sort((a, b) => new Date(a.drawnAt).getTime() - new Date(b.drawnAt).getTime());
      
      setCurrentSlots(prizeWinners.map((w, index) => {
        const paddedNum = w.number.toString().padStart(3, '0');
        return {
          index,
          number: w.number,
          status: 'SAH' as const,
          digit1: parseInt(paddedNum[0]) || 0,
          digit2: parseInt(paddedNum[1]) || 0,
          digit3: parseInt(paddedNum[2]) || 0,
          isSpinning1: false,
          isSpinning2: false,
          isSpinning3: false,
        };
      }));
    } else {
      setCurrentSlots([]);
    }
  }, [selectedPrizeId, history, activePrize, isQuotaMet]);


  const loadHistory = async () => {
    setLoading(true);
    let items: DrawHistoryItem[] = [];
    let errorOccurred = false;

    try {
      const { data, error } = await supabase
        .from('kehadiran')
        .select('*')
        .order('won_at', { ascending: false });

      if (error) throw error;
      if (data) {
        items = data.map((d: any) => {
          // Parse number from name string e.g. "Nomor 142" or "142"
          const numMatch = d.nama.match(/\d+/);
          const parsedNum = numMatch ? parseInt(numMatch[0]) : 0;
          // Extract winner name if contains " - Name"
          const winnerParts = d.nama.split(' - ');
          const winnerName = winnerParts.length > 1 ? winnerParts[1] : '';

          return {
            id: d.id,
            number: parsedNum,
            prizeName: d.no_telp || 'Doorprize',
            status: (d.dawis === 'GUGUR' ? 'GUGUR' : 'SAH') as 'SAH' | 'GUGUR',
            winnerName: winnerName,
            drawnAt: d.won_at || d.created_at || new Date().toISOString()
          };
        }).filter((item: DrawHistoryItem) => item.number > 0);
      }
    } catch (err) {
      console.warn('Supabase load error, falling back to local storage', err);
      errorOccurred = true;
    }

    if (errorOccurred || items.length === 0) {
      const localData = localStorage.getItem('doorprize_number_history');
      if (localData) {
        items = JSON.parse(localData);
      }
    }

    setHistory(items);
    setLoading(false);
  };

  const saveHistoryList = async (updatedHistory: DrawHistoryItem[]) => {
    setHistory(updatedHistory);
    localStorage.setItem('doorprize_number_history', JSON.stringify(updatedHistory));
  };

  // Main Draw Spin trigger
  const handleSpinDraw = () => {
    if (isDrawing) return;

    const count = activePrize.id === 'bebas' ? customDrawCount : activePrize.drawCountPerClick;
    if (eligiblePool.length < count) {
      alert(`Pool angka tidak cukup! Sisa angka di pool: ${eligiblePool.length}`);
      return;
    }

    setIsDrawing(true);
    
    // Choose random unique numbers from the pool
    const selectedNumbers: number[] = [];
    const poolCopy = [...eligiblePool];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * poolCopy.length);
      selectedNumbers.push(poolCopy[idx]);
      poolCopy.splice(idx, 1);
    }

    // Initialize slots
    const initialSlots = selectedNumbers.map((num, index) => {
      const paddedNum = num.toString().padStart(3, '0');
      return {
        index,
        number: num,
        status: 'PENDING' as const,
        digit1: Math.floor(Math.random() * 10),
        digit2: Math.floor(Math.random() * 10),
        digit3: Math.floor(Math.random() * 10),
        isSpinning1: true,
        isSpinning2: true,
        isSpinning3: true,
      };
    });
    setCurrentSlots(initialSlots);

    // Start rolling animation for each slot
    selectedNumbers.forEach((num, index) => {
      const paddedNum = num.toString().padStart(3, '0');
      animateSlotDigits(
        index,
        parseInt(paddedNum[0]) || 0,
        parseInt(paddedNum[1]) || 0,
        parseInt(paddedNum[2]) || 0
      );
    });
  };

  const animateSlotDigits = (slotIndex: number, d1: number, d2: number, d3: number) => {
    const intervalTime = 45;
    
    // Reel 1 Animation
    let elapsed1 = 0;
    const duration1 = 1500 + slotIndex * 350;
    const runReel1 = () => {
      elapsed1 += intervalTime;
      if (elapsed1 < duration1) {
        setCurrentSlots(prev => prev.map(s => s.index === slotIndex ? { ...s, digit1: Math.floor(Math.random() * 10) } : s));
        playSpinTick();
        const timeout = setTimeout(runReel1, intervalTime);
        animationFrameRefs.current.push(timeout);
      } else {
        setCurrentSlots(prev => prev.map(s => s.index === slotIndex ? { ...s, digit1: d1, isSpinning1: false } : s));
        playSlotStopChime();
      }
    };

    // Reel 2 Animation
    let elapsed2 = 0;
    const duration2 = 2100 + slotIndex * 350;
    const runReel2 = () => {
      elapsed2 += intervalTime;
      if (elapsed2 < duration2) {
        setCurrentSlots(prev => prev.map(s => s.index === slotIndex ? { ...s, digit2: Math.floor(Math.random() * 10) } : s));
        playSpinTick();
        const timeout = setTimeout(runReel2, intervalTime);
        animationFrameRefs.current.push(timeout);
      } else {
        setCurrentSlots(prev => prev.map(s => s.index === slotIndex ? { ...s, digit2: d2, isSpinning2: false } : s));
        playSlotStopChime();
      }
    };

    // Reel 3 Animation
    let elapsed3 = 0;
    const duration3 = 2700 + slotIndex * 350;
    const runReel3 = () => {
      elapsed3 += intervalTime;
      if (elapsed3 < duration3) {
        setCurrentSlots(prev => prev.map(s => s.index === slotIndex ? { ...s, digit3: Math.floor(Math.random() * 10) } : s));
        playSpinTick();
        const timeout = setTimeout(runReel3, intervalTime);
        animationFrameRefs.current.push(timeout);
      } else {
        setCurrentSlots(prev => prev.map(s => s.index === slotIndex ? { ...s, digit3: d3, isSpinning3: false } : s));
        playSlotStopChime();

        // Check if all slots have finished spinning
        setTimeout(() => {
          setCurrentSlots(prev => {
            const anySpinning = prev.some(s => s.isSpinning1 || s.isSpinning2 || s.isSpinning3);
            if (!anySpinning && isDrawing) {
              setIsDrawing(false);
              playVictoryFanfare();
              triggerConfetti();
            }
            return prev;
          });
        }, 100);
      }
    };

    runReel1();
    runReel2();
    runReel3();
  };

  // Redraw specific single slot (The polemic resolver!)
  const handleRedrawSlot = (slotIndex: number) => {
    if (eligiblePool.length === 0) {
      alert('Pool angka sudah habis!');
      return;
    }

    // Draw one number from pool
    const newNumber = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];

    // Mark current number of this slot as GUGUR in history instantly so it's excluded
    const currentNumber = currentSlots.find(s => s.index === slotIndex)?.number;
    if (currentNumber) {
      logWinnerToDB(currentNumber, activePrize.name, 'GUGUR');
    }

    const paddedNum = newNumber.toString().padStart(3, '0');
    const d1 = parseInt(paddedNum[0]) || 0;
    const d2 = parseInt(paddedNum[1]) || 0;
    const d3 = parseInt(paddedNum[2]) || 0;

    // Set slot to spinning
    setCurrentSlots(prev => prev.map(s => s.index === slotIndex ? { 
      ...s, 
      number: newNumber, 
      status: 'PENDING',
      digit1: Math.floor(Math.random() * 10),
      digit2: Math.floor(Math.random() * 10),
      digit3: Math.floor(Math.random() * 10),
      isSpinning1: true,
      isSpinning2: true,
      isSpinning3: true,
    } : s));
    
    // Spin animation just for this slot
    animateSlotDigits(slotIndex, d1, d2, d3);
  };

  // Confirm winner for a slot
  const handleConfirmSlot = (slotIndex: number) => {
    const slot = currentSlots.find(s => s.index === slotIndex);
    if (!slot || slot.isSpinning1 || slot.isSpinning2 || slot.isSpinning3) return;

    logWinnerToDB(slot.number, activePrize.name, 'SAH');
    
    setCurrentSlots(prev => prev.map(s => s.index === slotIndex ? { ...s, status: 'SAH' } : s));
    
    // Trigger celebratory fanfare and confetti on Sah winner validation!
    playVictoryFanfare();
    triggerConfetti();
  };

  // Disqualify / Gugur a slot
  const handleDisqualifySlot = (slotIndex: number) => {
    const slot = currentSlots.find(s => s.index === slotIndex);
    if (!slot || slot.isSpinning1 || slot.isSpinning2 || slot.isSpinning3) return;

    logWinnerToDB(slot.number, activePrize.name, 'GUGUR');
    
    setCurrentSlots(prev => prev.map(s => s.index === slotIndex ? { ...s, status: 'GUGUR' } : s));
    playSynthTone(220, 'sawtooth', 0.35, 0.15);
  };

  // Save drawing logs to Supabase and LocalStorage history state
  const logWinnerToDB = async (num: number, prize: string, status: 'SAH' | 'GUGUR') => {
    const formattedNum = num.toString().padStart(3, '0');
    const dbName = `${formattedNum} - (Belum ada nama)`;
    const wonAtStr = new Date().toISOString();

    // Optimistically update local state
    const newHistoryItem: DrawHistoryItem = {
      id: crypto.randomUUID(),
      number: num,
      prizeName: prize,
      status: status,
      drawnAt: wonAtStr
    };
    const updated = [newHistoryItem, ...history.filter(h => h.number !== num)];
    saveHistoryList(updated);

    try {
      // Upsert based on number
      // We can search if there is an existing record with this number in 'nama' using regex or pattern
      const { data: existing } = await supabase
        .from('kehadiran')
        .select('id')
        .ilike('nama', `${formattedNum}%`)
        .limit(1);

      if (existing && existing.length > 0) {
        await supabase
          .from('kehadiran')
          .update({
            no_telp: prize,
            dawis: status,
            is_won: status === 'SAH',
            won_at: wonAtStr
          })
          .eq('id', existing[0].id);
      } else {
        await supabase
          .from('kehadiran')
          .insert([{
            nama: dbName,
            no_telp: prize,
            dawis: status,
            is_won: status === 'SAH',
            won_at: wonAtStr
          }]);
      }
    } catch (err) {
      console.warn('Failed to sync with Supabase', err);
    }
  };

  // Reset all draw history
  const handleResetDraws = async () => {
    if (!confirm('PERHATIAN: Tindakan ini akan menghapus semua riwayat pemenang & nomor gugur. Pool undian akan direset menjadi 1-200. Apakah Anda yakin?')) return;
    
    saveHistoryList([]);
    setCurrentSlots([]);

    try {
      const { error } = await supabase
        .from('kehadiran')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything

      if (error) throw error;
      alert('Data undian berhasil di-reset!');
    } catch (err) {
      console.warn('Supabase reset error', err);
      alert('Data lokal berhasil di-reset, sinkronisasi cloud gagal.');
    }
  };

  // Confetti Particle System
  const triggerConfetti = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: any[] = [];
    const colors = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#EC4899', '#FFFFFF'];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 20,
        vx: (Math.random() - 0.5) * 15,
        vy: -Math.random() * 20 - 10,
        size: Math.random() * 8 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.4; // gravity
        p.vx *= 0.98;
        p.rotation += p.rotationSpeed;

        if (p.y < canvas.height + 20) {
          active = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });
      if (active) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  };

  const renderJackpotReel = (digit: number, isSpinning: boolean, numberStyle: React.CSSProperties) => {
    return (
      <div 
        className="h-[140px] w-[70px] md:w-[90px] overflow-hidden relative flex items-center justify-center bg-slate-950 border-x border-slate-900 shadow-inner rounded-xl"
        style={{ border: '2px solid rgba(251, 191, 36, 0.45)' }}
      >
        {/* 3D Cylinder curve shadow overlays */}
        <div className="absolute top-0 left-0 right-0 h-9 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-9 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />
        
        {/* Center horizontal red win payline */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-red-600/70 z-20 pointer-events-none shadow-[0_0_8px_rgba(239,68,68,0.6)]" />

        {isSpinning ? (
          <div className="animate-slot-roll flex flex-col items-center justify-center" style={{ gap: '2.5rem' }}>
            <span className="font-mono font-black text-6xl opacity-15 select-none text-slate-500">
              {(digit - 1 + 10) % 10}
            </span>
            <span className="font-mono font-black text-8xl select-none" style={{ color: '#FBBF24' }}>
              {digit}
            </span>
            <span className="font-mono font-black text-6xl opacity-15 select-none text-slate-500">
              {(digit + 1) % 10}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center z-0">
            <span className="font-mono font-black text-5xl opacity-10 select-none pointer-events-none -mt-8 text-slate-500">
              {(digit - 1 + 10) % 10}
            </span>
            <span 
              className="font-mono font-black text-7xl md:text-8xl select-none my-1"
              style={numberStyle}
            >
              {digit}
            </span>
            <span className="font-mono font-black text-5xl opacity-10 select-none pointer-events-none -mb-8 text-slate-500">
              {(digit + 1) % 10}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Backup & Import
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `doorprize_backup_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            if (confirm('Import cadangan akan menimpa seluruh riwayat undian saat ini. Lanjutkan?')) {
              await saveHistoryList(parsed);
              alert('Import berhasil! Sinkronisasi Supabase dapat dilakukan dari menu panitia.');
            }
          } else {
            alert('Format file cadangan tidak valid.');
          }
        } catch (err) {
          alert('Gagal membaca file backup.');
        }
      };
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      screenRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col min-h-screen relative overflow-hidden">
      <style>{`
        @keyframes slot-roll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-33.33%); }
        }
        .animate-slot-roll {
          animation: slot-roll 0.08s linear infinite;
        }
      `}</style>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-45 w-full h-full" />

      {/* Top Header */}
      <div className="bg-gradient-to-r from-red-800 to-red-950 border-b border-red-500/20 px-6 py-4 flex items-center justify-between shadow-xl z-10">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-white rounded-xl shadow-md flex items-center justify-center p-1.5 border border-red-500/30">
            <Gift className="h-full w-full text-red-600 animate-bounce" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-wide uppercase">
              PANGGUNG UNDIAN DOORPRIZE
            </h1>
            <p className="text-xs text-red-300 font-semibold tracking-wider uppercase mt-0.5">
              RT 12 PELEM KIDUL - HUT RI KE-81
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-350 hover:text-white transition-colors"
            title="Toggle Suara"
          >
            {soundEnabled ? <Volume2 className="h-4.5 w-4.5 text-red-400" /> : <VolumeX className="h-4.5 w-4.5" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-350 hover:text-white transition-colors"
            title="Layar Penuh"
          >
            {isFullscreen ? <Minimize2 className="h-4.5 w-4.5 text-red-400" /> : <Maximize2 className="h-4.5 w-4.5" />}
          </button>
          <button
            onClick={handleExportBackup}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-350 hover:text-white transition-colors"
            title="Ekspor Data Backup"
          >
            <Download className="h-4.5 w-4.5" />
          </button>
          <label className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-350 hover:text-white transition-colors cursor-pointer" title="Impor Data Backup">
            <Upload className="h-4.5 w-4.5" />
            <input type="file" onChange={handleImportBackup} accept=".json" className="hidden" />
          </label>
          <button
            onClick={handleResetDraws}
            className="p-2.5 bg-red-950/40 border border-red-900/50 hover:bg-red-900/40 rounded-xl text-red-400 hover:text-red-300 transition-colors"
            title="Reset Seluruh Undian"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 z-10">
        
        {/* Left Side: Prize Picker & Drawer Screen */}
        <div className={`${isFocusMode ? 'lg:col-span-12' : 'lg:col-span-9'} flex flex-col space-y-6`}>
          
          {/* Prize Selector Tabs */}
          {!isFocusMode && (
            <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-2xl">
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2.5 px-1.5">
              Pilih Hadiah yang Diperebutkan:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
              {PRIZES.map(p => {
                const isSelected = selectedPrizeId === p.id;
                const wonCountForPrize = history.filter(h => h.prizeName === p.name && h.status === 'SAH').length;
                return (
                  <button
                    key={p.id}
                    disabled={isDrawing || currentSlots.some(s => s.status === 'PENDING')}
                    onClick={() => {
                      setSelectedPrizeId(p.id);
                      setCurrentSlots([]);
                    }}
                    className={`relative p-3.5 rounded-xl border flex flex-col items-center justify-between text-center transition-all ${
                      isSelected 
                        ? `bg-gradient-to-b ${p.colorClass} text-white font-extrabold shadow-lg` 
                        : 'bg-slate-950/60 border-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    <span className="text-xl mb-1">{p.icon}</span>
                    <span className="text-[10px] font-black tracking-wide leading-tight truncate w-full">{p.name}</span>
                    <span className="text-[8px] opacity-75 mt-1 font-semibold">
                      {p.id === 'bebas' ? 'Bebas' : `${wonCountForPrize} / ${p.totalQuantity}`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom counter display if Bebas selected */}
            {selectedPrizeId === 'bebas' && (
              <div className="flex items-center space-x-3 mt-4 bg-slate-950/50 p-3 rounded-xl border border-slate-800 w-fit">
                <span className="text-xs font-semibold text-slate-350">Jumlah yang dikocok sekaligus:</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={customDrawCount}
                  onChange={(e) => setCustomDrawCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-16 bg-slate-900 text-center font-bold py-1 border border-slate-800 rounded text-red-400"
                />
              </div>
            )}
          </div>
          )}

          {/* Core Visual Draw Board */}
          <div 
            ref={screenRef}
            className="flex-1 bg-slate-950 border border-slate-850 rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between overflow-hidden shadow-2xl relative min-h-[500px]"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-white to-red-600" />
            
            {/* Draw Header */}
            <div className="text-center w-full my-4">
              <div className="inline-flex items-center space-x-2 bg-red-950 border border-red-500/30 px-5 py-1.5 rounded-full text-red-300 font-extrabold text-xs uppercase tracking-widest mb-4">
                <Sparkles className="h-3.5 w-3.5 animate-spin text-yellow-400" />
                <span>MEMPEREBUTKAN: {activePrize.name.toUpperCase()}</span>
              </div>
            </div>

            {/* Animated Slots Container */}
            <div className="flex-1 flex items-center justify-center py-6">
              {currentSlots.length === 0 ? (
                <div className="text-center text-slate-600 font-bold max-w-md p-6">
                  <div className="text-6xl mb-4">🎁</div>
                  <p className="text-slate-400 text-sm">Pilih jenis hadiah di atas, kemudian tekan tombol kocok untuk mengundi nomor pemenang!</p>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-6 w-full max-w-6xl">
                  {currentSlots.map(slot => {
                    const displayNum = slot.number.toString().padStart(3, '0');
                    const isAnySpinning = slot.isSpinning1 || slot.isSpinning2 || slot.isSpinning3;
                    
                    // Direct inline style colors to bypass global light mode CSS overrides
                    let numberStyle: React.CSSProperties = { color: '#FBBF24' }; // default pending (amber-400)
                    if (isAnySpinning) {
                      numberStyle = { color: '#F87171' }; // spinning (red-400)
                    } else if (slot.status === 'SAH') {
                      numberStyle = { color: '#34D399' }; // sah (emerald-400)
                    } else if (slot.status === 'GUGUR') {
                      numberStyle = { color: '#64748B', textDecoration: 'line-through' }; // gugur (slate-500)
                    }

                    return (
                      <div 
                        key={slot.index}
                        className={`relative border-4 rounded-[2.5rem] p-6 shadow-2xl flex flex-col items-center min-w-[280px] md:min-w-[360px] border-slate-800 transition-all ${
                          slot.status === 'SAH' ? 'border-emerald-500 ring-4 ring-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.35)]' : 
                          slot.status === 'GUGUR' ? 'border-red-500/70 ring-4 ring-red-500/10 opacity-60' : 
                          isAnySpinning ? 'border-yellow-500/80 ring-4 ring-yellow-500/15 shadow-[0_0_30px_rgba(245,158,11,0.25)]' : ''
                        }`}
                        style={{ background: 'linear-gradient(to bottom, #0f172a, #020617)' }}
                      >
                        {/* 3 Reels Side-by-Side - Authentic Jackpot Visual */}
                        <div className="flex items-center justify-center bg-slate-950 p-4 rounded-3xl border-2 border-slate-900 shadow-inner space-x-1.5 md:space-x-3 w-full">
                          {renderJackpotReel(slot.digit1, slot.isSpinning1, numberStyle)}
                          {renderJackpotReel(slot.digit2, slot.isSpinning2, numberStyle)}
                          {renderJackpotReel(slot.digit3, slot.isSpinning3, numberStyle)}
                        </div>

                        {/* Interactive Status Badges/Controls */}
                        {!isAnySpinning && (
                          <div className="mt-5 w-full flex flex-col space-y-2">
                            {slot.status === 'PENDING' ? (
                              <div className="grid grid-cols-2 gap-2 w-full">
                                <button
                                  onClick={() => handleConfirmSlot(slot.index)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-colors uppercase tracking-wider cursor-pointer"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Sah</span>
                                </button>
                                <button
                                  onClick={() => handleDisqualifySlot(slot.index)}
                                  className="bg-red-950/60 border border-red-900 hover:bg-red-900/60 text-red-300 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-colors uppercase tracking-wider cursor-pointer"
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                  <span>Gugur</span>
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center space-y-2.5 w-full">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
                                  slot.status === 'SAH' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900' : 'bg-red-950/30 text-red-400 border border-red-950'
                                }`}>
                                  {slot.status === 'SAH' ? '✓ SAH MENANG' : '✗ DISKUALIFIKASI'}
                                </span>
                                {slot.status === 'GUGUR' && (
                                  <button
                                    onClick={() => handleRedrawSlot(slot.index)}
                                    className="w-full mt-1 bg-red-600 hover:bg-red-500 text-white font-black text-[10px] py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all active:scale-95 shadow-md cursor-pointer uppercase tracking-wider animate-pulse"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    <span>Kocok Ulang Slot Ini</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Controls / Clear Board Button */}
            <div className="flex flex-col items-center w-full mt-4">
              {currentSlots.length > 0 && !isDrawing && currentSlots.every(s => s.status !== 'PENDING') ? (
                <button
                  onClick={() => setCurrentSlots([])}
                  className="group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-lg md:text-xl tracking-widest uppercase py-4 px-14 rounded-2xl shadow-xl active:scale-95 transition-all select-none border-b-4 border-emerald-800 flex items-center space-x-3 cursor-pointer"
                >
                  <CheckCircle className="h-5.5 w-5.5 fill-current" />
                  <span>Selesai & Bersihkan Papan</span>
                </button>
              ) : (
                <button
                  disabled={isDrawing || eligiblePool.length === 0 || isQuotaMet}
                  onClick={handleSpinDraw}
                  className="group relative overflow-hidden bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-slate-900 disabled:to-slate-950 text-white disabled:text-slate-650 font-black text-lg md:text-xl tracking-widest uppercase py-4 px-14 rounded-2xl shadow-xl hover:shadow-red-600/10 active:scale-95 transition-all select-none border-b-4 border-red-800 disabled:border-slate-900 flex items-center space-x-3 cursor-pointer"
                >
                  <Play className="h-5.5 w-5.5 fill-current" />
                  <span>
                    {isDrawing ? 'MENGOCAK NOMOR...' : 
                     isQuotaMet ? 'KUOTA PEMENANG PENUH' : 'KOCAK DOORPRIZE'}
                  </span>
                </button>
              )}

              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4 bg-slate-900 border border-slate-800/80 px-4 py-2 rounded-full select-none">
                Sisa nomor di Pool: <span className="text-red-400 font-extrabold">{eligiblePool.length}</span> dari 200 Nomor
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Winner logs */}
        {!isFocusMode && (
          <div className="lg:col-span-3 flex flex-col space-y-6">
            
            {/* Sah Pemenang List */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col h-[280px]">
              <h3 className="text-xs font-bold text-white tracking-wider uppercase pb-2.5 border-b border-slate-800 flex items-center justify-between">
                <span>Daftar Pemenang</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/30">
                  {history.filter(h => h.status === 'SAH').length}
                </span>
              </h3>
              <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1 text-xs">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                  </div>
                ) : history.filter(h => h.status === 'SAH').length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-600 italic">Belum ada pemenang sah.</div>
                ) : (
                  history.filter(h => h.status === 'SAH').map((w, idx) => (
                    <div key={w.id} className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <div>
                        <span className="font-extrabold text-red-400 text-sm">#{w.number.toString().padStart(3, '0')}</span>
                        <span className="text-[10px] font-black text-white ml-2 bg-slate-900 py-0.5 px-2 rounded border border-slate-850">{w.prizeName}</span>
                        {w.winnerName && (
                          <div className="text-[10px] text-emerald-400 font-bold mt-1 bg-emerald-950/30 border border-emerald-900/30 py-0.5 px-1.5 rounded w-fit">
                            👤 {w.winnerName}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Disqualified / Gugur List */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col h-[280px]">
              <h3 className="text-xs font-bold text-white tracking-wider uppercase pb-2.5 border-b border-slate-800 flex items-center justify-between">
                <span>Nomor Gugur (Absent)</span>
                <span className="text-[10px] bg-red-950 text-red-400 px-2 py-0.5 rounded border border-red-800/30">
                  {history.filter(h => h.status === 'GUGUR').length}
                </span>
              </h3>
              <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1 text-xs">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                  </div>
                ) : history.filter(h => h.status === 'GUGUR').length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-600 italic">Tidak ada nomor gugur.</div>
                ) : (
                  history.filter(h => h.status === 'GUGUR').map((g) => (
                    <div key={g.id} className="flex items-center justify-between bg-red-950/10 p-2.5 rounded-xl border border-red-900/20">
                      <div>
                        <span className="font-extrabold text-slate-400 line-through text-sm">#{g.number.toString().padStart(3, '0')}</span>
                        <span className="text-[9px] font-bold text-red-300 ml-2 bg-red-950/30 py-0.5 px-2 rounded border border-red-900/20">{g.prizeName}</span>
                        <span className="block text-[8px] text-slate-500 mt-1">Gugur pada: {new Date(g.drawnAt).toLocaleTimeString('id-ID')}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
