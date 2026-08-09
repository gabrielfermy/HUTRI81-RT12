'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Gift, Sparkles, Volume2, VolumeX, Minimize2, Maximize2, 
  CheckCircle, Play, RotateCcw
} from 'lucide-react';

interface Attendee {
  id: string;
  nama: string;
  no_telp: string;
  dawis: string;
  is_won: boolean;
  won_at?: string;
  created_at?: string;
}

export default function PublicDoorprizePage() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Drawing settings and states
  const [drawMode, setDrawMode] = useState<'slot' | 'matrix'>('slot');
  const [isDrawing, setIsDrawing] = useState(false);
  const [winner, setWinner] = useState<Attendee | null>(null);
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vipMode, setVipMode] = useState(false);
  const [tempDrawName, setTempDrawName] = useState('SIAP DIKOCOK!');

  // Ref pointers
  const screenRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ----------------------------------------------------
  // Audio Synthesis for Ticking & Victory Fanfare
  // ----------------------------------------------------
  const playTick = (frequency = 600) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.06);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (e) {
      console.warn('Audio play tick error:', e);
    }
  };

  const playVictory = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const freqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((f, index) => {
        const timeOffset = index * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = index % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime + timeOffset);
        
        gain.gain.setValueAtTime(0.12, ctx.currentTime + timeOffset);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.4);
        
        osc.start(ctx.currentTime + timeOffset);
        osc.stop(ctx.currentTime + timeOffset + 0.4);
      });
    } catch (e) {
      console.warn('Audio play victory arpeggio error:', e);
    }
  };

  // ----------------------------------------------------
  // Confetti Canvas Particle System
  // ----------------------------------------------------
  useEffect(() => {
    if (winnerModalOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const particles: Array<{
        x: number;
        y: number;
        size: number;
        color: string;
        speedX: number;
        speedY: number;
        rotation: number;
        rotationSpeed: number;
      }> = [];

      const colors = ['#EF4444', '#FFFFFF', '#F59E0B', '#3B82F6', '#10B981', '#EC4899'];

      for (let i = 0; i < 180; i++) {
        const side = Math.random() > 0.5;
        particles.push({
          x: side ? 30 : canvas.width - 30,
          y: canvas.height - 50,
          size: Math.random() * 8 + 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          speedX: (side ? 1 : -1) * (Math.random() * 12 + 6),
          speedY: -Math.random() * 18 - 8,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 8
        });
      }

      let animationId: number;
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;

        particles.forEach(p => {
          p.x += p.speedX;
          p.y += p.speedY;
          p.speedY += 0.28;
          p.speedX *= 0.98;
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
          animationId = requestAnimationFrame(animate);
        }
      };

      animate();

      const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      window.addEventListener('resize', handleResize);

      return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [winnerModalOpen]);

  // Load and Subscribe data from Supabase/LocalStorage
  useEffect(() => {
    loadAttendees();

    let channel: any;
    try {
      channel = supabase
        .channel('kehadiran-public-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'kehadiran' }, () => {
          loadAttendees();
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription not available:', e);
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (e) {}
      }
    };
  }, []);

  const loadAttendees = async () => {
    setLoading(true);
    let fetchedData: Attendee[] = [];
    let errorOccurred = false;

    try {
      const { data, error } = await supabase
        .from('kehadiran')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) {
        fetchedData = data;
      }
    } catch (err) {
      console.warn('Failed to fetch from Supabase. Falling back to LocalStorage.', err);
      errorOccurred = true;
    }

    if (errorOccurred || fetchedData.length === 0) {
      const localData = localStorage.getItem('doorprize_attendees');
      if (localData) {
        fetchedData = JSON.parse(localData);
      }
    }

    setAttendees(fetchedData);
    setLoading(false);
  };

  const saveAttendeesList = async (updatedList: Attendee[]) => {
    setAttendees(updatedList);
    localStorage.setItem('doorprize_attendees', JSON.stringify(updatedList));
  };

  const eligiblePool = useMemo(() => {
    return attendees.filter(a => !a.is_won);
  }, [attendees]);

  const winnersList = useMemo(() => {
    return attendees
      .filter(a => a.is_won)
      .sort((a, b) => new Date(a.won_at || '').getTime() - new Date(b.won_at || '').getTime());
  }, [attendees]);

  const handleSpinDraw = () => {
    if (isDrawing) return;
    if (eligiblePool.length === 0) {
      alert('Semua peserta di dalam pool sudah memenangkan doorprize!');
      return;
    }

    setIsDrawing(true);
    setWinner(null);
    setWinnerModalOpen(false);

    const selectedWinner = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
    
    let duration = 3500;
    let startTime = Date.now();
    let delay = 35;

    const runAnimation = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        if (elapsed % (delay * 3) < delay) {
          playTick(drawMode === 'slot' ? 450 + (progress * 250) : 550);
        }

        const randomIndex = Math.floor(Math.random() * eligiblePool.length);
        const randomPerson = eligiblePool[randomIndex];

        if (drawMode === 'slot') {
          const prevIndex = (randomIndex - 1 + eligiblePool.length) % eligiblePool.length;
          const nextIndex = (randomIndex + 1) % eligiblePool.length;
          setTempDrawName(`${eligiblePool[prevIndex].nama.toUpperCase()} \n 👉 ${randomPerson.nama.toUpperCase()} 👈 \n ${eligiblePool[nextIndex].nama.toUpperCase()}`);
        } else {
          setTempDrawName(randomPerson.nama.toUpperCase());
        }

        delay = 35 + Math.pow(progress, 2.5) * 350; 
        drawIntervalRef.current = setTimeout(runAnimation, delay);
      } else {
        setWinner(selectedWinner);
        setTempDrawName(`👉 ${selectedWinner.nama.toUpperCase()} 👈`);
        setIsDrawing(false);
        playVictory();
        setWinnerModalOpen(true);
      }
    };

    runAnimation();
  };

  const handleConfirmWinner = async (winnerId: string) => {
    const timestamp = new Date().toISOString();
    const updatedList = attendees.map(a => 
      a.id === winnerId ? { ...a, is_won: true, won_at: timestamp } : a
    );
    saveAttendeesList(updatedList);

    try {
      await supabase
        .from('kehadiran')
        .update({ is_won: true, won_at: timestamp })
        .eq('id', winnerId);
    } catch (err) {
      console.warn('Supabase winner update error:', err);
    }

    setWinnerModalOpen(false);
    setWinner(null);
    setTempDrawName('SIAP DIKOCOK!');
  };

  const handleRedraw = () => {
    setWinnerModalOpen(false);
    setWinner(null);
    setTempDrawName('SIAP DIKOCOK!');
  };

  const handleRemoveWinnerStatus = async (id: string) => {
    const timestamp = new Date().toISOString();
    const updatedList = attendees.map(a => 
      a.id === id ? { ...a, is_won: false, won_at: undefined } : a
    );
    saveAttendeesList(updatedList);

    try {
      await supabase
        .from('kehadiran')
        .update({ is_won: false, won_at: null })
        .eq('id', id);
    } catch (err) {
      console.warn('Supabase remove winner status error:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (drawIntervalRef.current) clearTimeout(drawIntervalRef.current);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (screenRef.current?.requestFullscreen) {
        screenRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="flex-1 bg-slate-900 text-slate-100 flex flex-col min-h-screen">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-800 to-red-950 border-b border-red-500/20 px-6 py-4 flex items-center justify-between shadow-xl">
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
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Draw Board Component */}
        <div className="lg:col-span-9 flex flex-col space-y-4">
          <div 
            ref={screenRef}
            className="relative bg-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between overflow-hidden shadow-2xl flex-1 min-h-[520px] transition-all"
          >
            {/* Red / White Line Accent */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-white to-red-600" />
            
            {/* Header controls (Mode, sound, fullscreen) */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
                <button
                  disabled={isDrawing}
                  onClick={() => setDrawMode('slot')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    drawMode === 'slot' 
                      ? 'bg-red-600 text-white shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Slot Machine (Reel)
                </button>
                <button
                  disabled={isDrawing}
                  onClick={() => setDrawMode('matrix')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    drawMode === 'matrix' 
                      ? 'bg-red-600 text-white shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Matrix Flash
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  disabled={isDrawing}
                  onClick={() => setVipMode(!vipMode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    vipMode
                      ? 'bg-yellow-500 border-yellow-400 text-slate-950 font-black shadow-md shadow-yellow-500/20'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  👑 Mode VIP
                </button>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors"
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors"
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Animation area */}
            <div className="flex-1 flex flex-col items-center justify-center py-8 z-10">
              <div className="text-center w-full max-w-3xl px-4">
                <div className="inline-flex items-center space-x-2 bg-red-950 border border-red-500/30 px-4 py-1.5 rounded-full text-red-300 font-bold text-xs uppercase tracking-widest mb-6 select-none">
                  <Sparkles className="h-3.5 w-3.5 animate-spin text-red-400" />
                  <span>DOORPRIZE MALAM SYUKURAN</span>
                </div>

                <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 border-4 border-red-600/80 rounded-[2.5rem] py-14 px-6 md:px-12 shadow-[0_0_50px_rgba(239,68,68,0.15)] flex items-center justify-center min-h-[220px]">
                  <div className="absolute top-4 left-4 h-3 w-3 bg-red-500 rounded-full animate-ping" />
                  <div className="absolute top-4 right-4 h-3 w-3 bg-white rounded-full animate-ping" />

                  {drawMode === 'slot' ? (
                    <div className="whitespace-pre-line text-lg font-bold tracking-wide text-slate-400 select-none">
                      {isDrawing ? (
                        <div className="h-[120px] overflow-hidden flex flex-col justify-center text-center">
                          {tempDrawName.split('\n').map((line, i) => (
                            <div 
                              key={i} 
                              className={`transition-all duration-75 uppercase truncate ${
                                line.includes('👉') 
                                  ? 'text-white text-3xl md:text-5xl font-black tracking-wider py-2 font-sans bg-red-600/10 border-y border-red-500/20 px-4 rounded-xl' 
                                  : 'text-slate-600 text-sm md:text-base opacity-40 font-medium py-1 line-through'
                              }`}
                            >
                              {line.replace(/[👉👈]/g, '').trim()}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-white text-3xl md:text-5xl font-black uppercase tracking-widest leading-normal animate-pulse px-4">
                          {tempDrawName.includes('👉') ? tempDrawName.replace(/[👉👈]/g, '').trim() : tempDrawName}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full">
                      <div className={`uppercase tracking-wider font-sans select-none truncate px-4 ${
                        isDrawing 
                          ? 'text-red-400 font-extrabold text-3xl md:text-5xl' 
                          : 'text-white text-3xl md:text-6xl font-black animate-pulse'
                      }`}>
                        {tempDrawName}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Spinner buttons */}
            <div className="flex flex-col items-center z-10 w-full">
              {vipMode ? (
                <div className="relative my-4 flex items-center justify-center">
                  <div className="absolute inset-0 h-36 w-36 bg-red-600/30 rounded-full animate-ping pointer-events-none" />
                  <div className="absolute inset-0 h-28 w-28 bg-red-500/20 rounded-full animate-pulse pointer-events-none" />
                  
                  <button
                    disabled={isDrawing}
                    onClick={handleSpinDraw}
                    className={`relative h-28 w-28 bg-gradient-to-b from-red-500 to-red-700 active:from-red-600 active:to-red-850 text-white rounded-full font-black text-xs tracking-wider uppercase flex flex-col items-center justify-center shadow-[0_10px_0_#991b1b,0_12px_15px_rgba(0,0,0,0.5)] active:translate-y-[8px] active:shadow-[0_2px_0_#991b1b,0_6px_8px_rgba(0,0,0,0.5)] border-4 border-red-400/30 transition-all select-none hover:scale-105 active:scale-95 disabled:from-slate-800 disabled:to-slate-900 disabled:shadow-none disabled:translate-y-0 disabled:scale-100 disabled:border-slate-950 flex-shrink-0 z-20`}
                  >
                    <Sparkles className="h-5 w-5 mb-0.5 text-yellow-300 animate-bounce" />
                    <span className="text-[11px] font-black">TEKAN</span>
                    <span className="text-[8px] font-bold text-red-200 tracking-widest leading-none mt-0.5">DOORPRIZE</span>
                  </button>
                </div>
              ) : (
                <button
                  disabled={isDrawing}
                  onClick={handleSpinDraw}
                  className={`group relative overflow-hidden bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-slate-800 disabled:to-slate-900 text-white font-black text-lg md:text-xl tracking-widest uppercase py-4 px-12 rounded-2xl shadow-xl hover:shadow-red-600/20 active:scale-95 transition-all select-none border-b-4 border-red-800 disabled:border-slate-950 flex items-center space-x-3 ${
                    isDrawing ? 'animate-pulse' : ''
                  }`}
                >
                  <Play className="h-5 w-5 fill-current" />
                  <span>{isDrawing ? 'MEMILIH NAMA...' : 'MUTAR DOOPRIZE'}</span>
                </button>
              )}
              
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-4 bg-slate-900 border border-slate-800/80 px-4 py-1.5 rounded-full select-none">
                Peserta di Pool: <span className="text-red-400 font-extrabold">{eligiblePool.length}</span> dari {attendees.length} Orang
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar logs */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col h-[250px]">
            <h3 className="text-xs font-bold text-white tracking-wider uppercase pb-2 border-b border-slate-850 flex items-center justify-between">
              <span>Nama di Pool</span>
              <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400">{eligiblePool.length}</span>
            </h3>
            <div className="flex-1 overflow-y-auto mt-2 space-y-1.5 pr-1 text-xs">
              {loading ? (
                <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div></div>
              ) : eligiblePool.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-600 italic">Pool kosong.</div>
              ) : (
                eligiblePool.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between bg-slate-900/60 p-2 rounded border border-slate-800/40">
                    <span className="font-bold text-slate-200 truncate pr-2">{i+1}. {p.nama}</span>
                    <span className="text-[9px] bg-slate-850 px-1.5 py-0.5 rounded text-slate-400">{p.dawis || '-'}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col h-[250px]">
            <h3 className="text-xs font-bold text-white tracking-wider uppercase pb-2 border-b border-slate-850 flex items-center justify-between">
              <span>Daftar Pemenang</span>
              <span className="text-[10px] bg-yellow-950 text-yellow-400 px-2 py-0.5 rounded border border-yellow-800/30">{winnersList.length}</span>
            </h3>
            <div className="flex-1 overflow-y-auto mt-2 space-y-1.5 pr-1 text-xs">
              {winnersList.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-600 italic">Belum ada pemenang.</div>
              ) : (
                winnersList.map((w, idx) => (
                  <div key={w.id} className="flex items-center justify-between bg-yellow-950/20 p-2 rounded border border-yellow-800/20">
                    <div className="truncate pr-2">
                      <span className="font-extrabold text-yellow-400">#{idx + 1}</span>
                      <span className="font-bold text-white ml-1.5">{w.nama}</span>
                      <span className="block text-[8px] text-slate-400 mt-0.5">{w.dawis || '-'} • {w.no_telp || 'Minor'}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveWinnerStatus(w.id)}
                      className="p-1 hover:bg-red-950/40 text-slate-450 hover:text-red-400 rounded transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Winner Popover */}
      {winnerModalOpen && winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 overflow-hidden">
          <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none w-full h-full" />

          <div className="relative bg-slate-900 border-4 border-yellow-500 rounded-[3rem] p-8 md:p-12 max-w-xl w-full text-center shadow-[0_0_80px_rgba(234,179,8,0.25)] z-10">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white font-black text-sm uppercase px-8 py-2 rounded-full border-2 border-white shadow-lg tracking-widest">
              MERDEKA!
            </div>

            <div className="flex flex-col items-center justify-center my-6">
              <div className="h-20 w-20 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center justify-center p-3 mb-6 animate-pulse">
                <Gift className="h-full w-full text-yellow-500" />
              </div>

              <h2 className="text-xl md:text-2xl font-black text-slate-450 uppercase tracking-widest mb-1">
                Pemenang Doorprize
              </h2>
              
              <div className="w-full bg-slate-950 border border-slate-800 rounded-3xl py-8 px-4 my-4">
                <span className="block text-4xl md:text-5xl font-black text-white uppercase tracking-wide leading-tight truncate">
                  {winner.nama}
                </span>
                <span className="inline-block mt-3 px-3 py-1 bg-yellow-950/40 text-yellow-400 border border-yellow-950 font-mono text-xs font-bold rounded-lg uppercase tracking-wider">
                  Dawis: {winner.dawis || 'Tidak Ada'} • Telp: {winner.no_telp || 'Minor'}
                </span>
              </div>

              <p className="text-slate-400 text-xs mt-2">
                Apakah pemenang hadir di lokasi?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <button
                onClick={handleRedraw}
                className="bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white font-bold py-3.5 px-4 rounded-2xl text-sm transition-all border border-slate-700 active:scale-95 flex items-center justify-center space-x-2"
              >
                <RotateCcw className="h-4.5 w-4.5" />
                <span>Tidak Hadir (Undi Ulang)</span>
              </button>
              <button
                onClick={() => handleConfirmWinner(winner.id)}
                className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-3.5 px-4 rounded-2xl text-sm transition-all shadow-md active:scale-95 flex items-center justify-center space-x-2"
              >
                <CheckCircle className="h-4.5 w-4.5 fill-current" />
                <span>SAH (Simpan Pemenang)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
