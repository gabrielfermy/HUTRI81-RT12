'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Gift, Users, UserPlus, Phone, MapPin, Search, Trash2, Edit2, 
  RotateCcw, Sparkles, Volume2, VolumeX, Minimize2, Maximize2, 
  CheckCircle, AlertTriangle, AlertCircle, Play, X, User
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

export default function DoorprizePage() {
  // Tabs: 'input' (Check-in admin) or 'draw' (Projector Panggung)
  const [activeTab, setActiveTab] = useState<'input' | 'draw'>('input');
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form input state
  const [nama, setNama] = useState('');
  const [noTelp, setNoTelp] = useState('');
  const [dawis, setDawis] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingId, setIsEditingId] = useState<string | null>(null);

  // Duplicate Check Modal State
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateMatchInfo, setDuplicateMatchInfo] = useState<{
    newName: string;
    existingName: string;
    phone: string;
    dawis: string;
  } | null>(null);

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

      // Funfare arpeggio notes (C major: C4, E4, G4, C5, E5, G5, C6)
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
      console.warn('Audio play victory error:', e);
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

      // Generate burst particles from sides and bottom
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
          p.speedY += 0.28; // Gravity
          p.speedX *= 0.98; // Air resistance
          p.rotation += p.rotationSpeed;

          if (p.y < canvas.height + 20) {
            active = true;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = p.color;
            // Draw rectangle particle or circle
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

  // ----------------------------------------------------
  // Sync Data (Supabase with LocalStorage offline fallback)
  // ----------------------------------------------------
  useEffect(() => {
    loadAttendees();

    // Subscribe to realtime database changes if Supabase is connected
    let channel: any;
    try {
      channel = supabase
        .channel('kehadiran-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'kehadiran' }, (payload: any) => {
          console.log('Realtime DB Change detected:', payload);
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
    // Always sync offline cache with the latest data
    if (fetchedData.length > 0) {
      localStorage.setItem('doorprize_attendees', JSON.stringify(fetchedData));
    }
    setLoading(false);
  };

  const saveAttendeesList = async (updatedList: Attendee[]) => {
    setAttendees(updatedList);
    localStorage.setItem('doorprize_attendees', JSON.stringify(updatedList));

    // Try sending to Supabase
    try {
      // In this approach, we update/insert individual rows in the table.
      // To prevent sync conflicts, the page actions below will call their database handlers,
      // and update local state as source of truth.
    } catch (e) {
      console.warn('Failed to sync to database:', e);
    }
  };

  // ----------------------------------------------------
  // Duplicate Checks and Adding/Editing Participants
  // ----------------------------------------------------
  
  // Utility function to normalize names for checking (lowercase, trim, strip punctuation)
  const normalizeName = (name: string) => {
    return name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  };

  // Helper to check for spelling duplicates
  const findDuplicateName = (nameInput: string, phoneInput: string, dawisInput: string) => {
    const normNew = normalizeName(nameInput);
    if (!normNew) return null;

    // Check matches
    return attendees.find(att => {
      // Don't match the row currently being edited
      if (isEditingId && att.id === isEditingId) return false;
      
      const normExist = normalizeName(att.nama);
      const isPhoneMatch = att.no_telp.trim() === phoneInput.trim();
      const isDawisMatch = att.dawis.trim() === dawisInput.trim();

      // Check case 1: Phone and Dawis match, and names are highly similar (e.g. Agus Tri vs Agus)
      if (isPhoneMatch && isDawisMatch) {
        const isHighlySimilar = normNew.includes(normExist) || normExist.includes(normNew) || 
                                (normNew.substring(0, 4) === normExist.substring(0, 4));
        return isHighlySimilar;
      }
      return false;
    });
  };

  const handleFormSubmit = async (e: React.FormEvent, forceBypass = false) => {
    e.preventDefault();
    if (!nama.trim()) return;

    // 1. Run Duplicate check
    if (!forceBypass) {
      const duplicateMatch = findDuplicateName(nama, noTelp, dawis);
      if (duplicateMatch) {
        setDuplicateMatchInfo({
          newName: nama,
          existingName: duplicateMatch.nama,
          phone: noTelp,
          dawis: dawis
        });
        setShowDuplicateModal(true);
        return; // Pause execution until user makes selection in duplicate modal
      }
    }

    await saveAttendee();
  };

  const saveAttendee = async () => {
    const cleanedPhone = noTelp.trim();
    const newAttendeeData = {
      nama: nama.trim(),
      no_telp: cleanedPhone,
      dawis: dawis.trim(),
      is_won: false
    };

    if (isEditingId) {
      // Editing Mode
      const updatedList = attendees.map(a => 
        a.id === isEditingId ? { ...a, ...newAttendeeData } : a
      );
      saveAttendeesList(updatedList);

      try {
        await supabase
          .from('kehadiran')
          .update(newAttendeeData)
          .eq('id', isEditingId);
      } catch (err) {
        console.warn('Supabase update error:', err);
      }

      setIsEditingId(null);
    } else {
      // Add New Mode
      const tempId = crypto.randomUUID();
      const newAttendee: Attendee = {
        id: tempId,
        ...newAttendeeData,
        created_at: new Date().toISOString()
      };

      const updatedList = [...attendees, newAttendee];
      saveAttendeesList(updatedList);

      try {
        const { data, error } = await supabase
          .from('kehadiran')
          .insert([newAttendeeData])
          .select();
        
        if (!error && data && data[0]) {
          // Replace temp id with Supabase real id
          const syncList = updatedList.map(a => a.id === tempId ? data[0] : a);
          setAttendees(syncList);
          localStorage.setItem('doorprize_attendees', JSON.stringify(syncList));
        }
      } catch (err) {
        console.warn('Supabase insert error:', err);
      }
    }

    // Reset Form
    setNama('');
    setNoTelp('');
    setDawis('');
    setIsEditingId(null);
  };

  const handleEdit = (att: Attendee) => {
    setIsEditingId(att.id);
    setNama(att.nama);
    setNoTelp(att.no_telp);
    setDawis(att.dawis);
    setActiveTab('input');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus peserta ini dari daftar?')) return;

    const updatedList = attendees.filter(a => a.id !== id);
    saveAttendeesList(updatedList);

    try {
      await supabase
        .from('kehadiran')
        .delete()
        .eq('id', id);
    } catch (err) {
      console.warn('Supabase delete error:', err);
    }
  };

  const handleResetPool = async () => {
    if (!confirm('PERHATIAN: Ini akan meriset kembali semua status pemenang agar bisa diundi ulang dari awal. Lanjutkan?')) return;

    const updatedList = attendees.map(a => ({ ...a, is_won: false, won_at: undefined }));
    saveAttendeesList(updatedList);

    try {
      await supabase
        .from('kehadiran')
        .update({ is_won: false, won_at: null });
    } catch (err) {
      console.warn('Supabase reset pool error:', err);
    }
  };

  const handleClearAllAttendees = async () => {
    if (!confirm('BAHAYA: Ini akan menghapus SELURUH daftar kehadiran peserta. Pastikan Anda sudah membackup jika diperlukan. Ketik OK untuk mengkonfirmasi.')) return;
    const confirmText = prompt('Ketik "HAPUS SEMUA" untuk mengkonfirmasi penghapusan total:');
    if (confirmText !== 'HAPUS SEMUA') return;

    saveAttendeesList([]);

    try {
      await supabase
        .from('kehadiran')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything
    } catch (err) {
      console.warn('Supabase clear all error:', err);
    }
  };

  // Auto-copy previous phone number for children/minors
  const handleCopyPrevPhone = () => {
    if (attendees.length > 0) {
      const lastAttendee = attendees[attendees.length - 1];
      setNoTelp(lastAttendee.no_telp);
      setDawis(lastAttendee.dawis);
    }
  };

  // ----------------------------------------------------
  // Lucky Draw Engines (Slot Reel & Matrix Decryptor)
  // ----------------------------------------------------
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
      alert('Semua peserta di dalam pool sudah memenangkan doorprize! Silakan riset pool.');
      return;
    }

    setIsDrawing(true);
    setWinner(null);
    setWinnerModalOpen(false);

    // Pick a final winner ahead of time
    const selectedWinner = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
    
    let duration = 3500; // ms
    let startTime = Date.now();
    let delay = 35; // speed of change in ms

    const runAnimation = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        // Play click sounds and cycle names randomly
        if (elapsed % (delay * 3) < delay) {
          playTick(drawMode === 'slot' ? 450 + (progress * 250) : 550);
        }

        // Random name selections for spinner
        const randomIndex = Math.floor(Math.random() * eligiblePool.length);
        const randomPerson = eligiblePool[randomIndex];

        if (drawMode === 'slot') {
          // Display current, previous, next names to simulate slot reel
          const prevIndex = (randomIndex - 1 + eligiblePool.length) % eligiblePool.length;
          const nextIndex = (randomIndex + 1) % eligiblePool.length;
          setTempDrawName(`${eligiblePool[prevIndex].nama.toUpperCase()} \n 👉 ${randomPerson.nama.toUpperCase()} 👈 \n ${eligiblePool[nextIndex].nama.toUpperCase()}`);
        } else {
          // Matrix Flash mode
          setTempDrawName(randomPerson.nama.toUpperCase());
        }

        // Decelerate animation speed
        delay = 35 + Math.pow(progress, 2.5) * 350; 
        drawIntervalRef.current = setTimeout(runAnimation, delay);
      } else {
        // Animation finished
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

    // Update in Supabase
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
    // Simply close modal without marking as won
    setWinnerModalOpen(false);
    setWinner(null);
    setTempDrawName('SIAP DIKOCOK!');
  };

  const handleRemoveWinnerStatus = async (id: string) => {
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

  // Clean timeouts on unmount
  useEffect(() => {
    return () => {
      if (drawIntervalRef.current) clearTimeout(drawIntervalRef.current);
    };
  }, []);

  // Filtered attendance list in input tab
  const filteredAttendees = useMemo(() => {
    return attendees.filter(a => 
      a.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.no_telp.includes(searchTerm) ||
      a.dawis.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [attendees, searchTerm]);

  // Fullscreen support for stage view
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
    <div className="flex-1 bg-slate-900 text-slate-100 flex flex-col">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-800 to-red-950 border-b border-red-500/20 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-white rounded-xl shadow-md flex items-center justify-center p-1.5 border border-red-500/30">
            <Gift className="h-full w-full text-red-600 animate-bounce" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-wide uppercase">
              Doorprize & Presensi Malam Tirakatan
            </h1>
            <p className="text-xs text-red-300 font-semibold tracking-wider uppercase mt-0.5">
              RT 12 PELEM KIDUL - HUT RI KE-81
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-950/60 p-1 rounded-xl border border-white/10 mt-4 md:mt-0 max-w-fit">
          <button
            onClick={() => setActiveTab('input')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'input' 
                ? 'bg-red-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            <span>Input Kehadiran</span>
          </button>
          <button
            onClick={() => setActiveTab('draw')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'draw' 
                ? 'bg-red-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Panggung Undian</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ============================================================== */}
        {/* TAB 1: INPUT KEHADIRAN (PANITIA ADMIN)                         */}
        {/* ============================================================== */}
        {activeTab === 'input' && (
          <>
            {/* Input Form Column (lg:col-span-4) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                  <h2 className="font-bold text-white flex items-center space-x-2">
                    <UserPlus className="text-red-500 h-5 w-5" />
                    <span>{isEditingId ? 'Edit Peserta' : 'Daftarkan Peserta'}</span>
                  </h2>
                  {isEditingId && (
                    <button 
                      onClick={() => {
                        setIsEditingId(null);
                        setNama('');
                        setNoTelp('');
                        setDawis('');
                      }}
                      className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Batal Edit</span>
                    </button>
                  )}
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                      Nama Lengkap
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-red-500 text-white placeholder-slate-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Phone Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold uppercase text-slate-400">
                        No. HP / Telpon
                      </label>
                      {attendees.length > 0 && !isEditingId && (
                        <button
                          type="button"
                          onClick={handleCopyPrevPhone}
                          className="text-[10px] bg-red-950 border border-red-500/30 text-red-300 font-bold px-2 py-0.5 rounded hover:bg-red-900 transition-colors"
                        >
                          Salin No. HP Sebelumnnya (Anak/Minor)
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="tel"
                        value={noTelp}
                        onChange={(e) => setNoTelp(e.target.value)}
                        placeholder="Contoh: 08123456789 atau kosongkan"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-red-500 text-white placeholder-slate-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Dawis Group Input */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                      Dawis (Dasa Wisma)
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        value={dawis}
                        onChange={(e) => setDawis(e.target.value)}
                        placeholder="Contoh: Dawis Dahlia, Dawis Melati"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-red-500 text-white placeholder-slate-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md shadow-red-600/20 active:scale-95"
                  >
                    {isEditingId ? 'Simpan Perubahan' : 'Masukkan Presensi'}
                  </button>
                </form>
              </div>

              {/* Stats card */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 shadow-md">
                <h3 className="text-sm font-bold text-white mb-3">Statistik Pendaftaran</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl text-center">
                    <span className="block text-xl font-black text-white">{attendees.length}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Terdaftar</span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl text-center">
                    <span className="block text-xl font-black text-green-400">{eligiblePool.length}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Aktif di Pool</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between gap-2">
                  <button
                    onClick={handleResetPool}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors text-center"
                  >
                    Riset Doorprize
                  </button>
                  <button
                    onClick={handleClearAllAttendees}
                    className="flex-1 bg-red-950/40 hover:bg-red-950 text-red-400 hover:text-red-300 font-bold py-2 px-3 border border-red-900/30 rounded-lg text-xs transition-colors text-center"
                  >
                    Kosongkan Pool
                  </button>
                </div>
              </div>
            </div>

            {/* Attendance List Table (lg:col-span-8) */}
            <div className="lg:col-span-8 bg-slate-950/50 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col h-[600px]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 gap-3">
                <h2 className="font-bold text-white flex items-center space-x-2">
                  <Users className="text-red-500 h-5 w-5" />
                  <span>Daftar Kehadiran Peserta</span>
                </h2>
                
                {/* Search input */}
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari nama, no. HP, atau dawis..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-red-500 text-white placeholder-slate-500 transition-colors"
                  />
                </div>
              </div>

              {/* Table list */}
              <div className="flex-1 overflow-y-auto mt-4 pr-1">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                  </div>
                ) : filteredAttendees.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                    <Users className="h-10 w-10 mb-2 stroke-[1.5]" />
                    <p>{searchTerm ? 'Hasil pencarian tidak ditemukan.' : 'Belum ada peserta yang didaftarkan.'}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-3">No. Urut</th>
                          <th className="py-2.5 px-3">Nama</th>
                          <th className="py-2.5 px-3">No. HP</th>
                          <th className="py-2.5 px-3">Dawis</th>
                          <th className="py-2.5 px-3 text-center">Status Doorprize</th>
                          <th className="py-2.5 px-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-sm">
                        {filteredAttendees.map((att, idx) => (
                          <tr key={att.id} className="hover:bg-slate-900/30 transition-colors group">
                            <td className="py-3 px-3 font-semibold text-slate-500">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-3 font-bold text-white">
                              {att.nama}
                            </td>
                            <td className="py-3 px-3 text-slate-300 font-mono text-xs">
                              {att.no_telp || <span className="text-slate-600 italic">Minor (Sama dng sebelumnya)</span>}
                            </td>
                            <td className="py-3 px-3 text-slate-300">
                              {att.dawis || <span className="text-slate-600">-</span>}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {att.is_won ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-950 text-yellow-400 border border-yellow-800/40">
                                  SUDAH MENANG
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-950 text-green-400 border border-green-800/40">
                                  BELUM MENANG
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end space-x-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEdit(att)}
                                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                                  title="Edit Data"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(att.id)}
                                  className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors"
                                  title="Hapus Data"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* TAB 2: PANGGUNG LUCKY DRAW (PROJECTOR STAGE VIEW)              */}
        {/* ============================================================== */}
        {activeTab === 'draw' && (
          <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Main Stage Panel (lg:col-span-9) */}
            <div className="lg:col-span-9 flex flex-col space-y-4">
              <div 
                ref={screenRef}
                className="relative bg-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between overflow-hidden shadow-2xl flex-1 min-h-[550px] transition-all"
              >
                {/* Visual Accent - Red Header in Fullscreen */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-white to-red-600" />
                
                {/* Header controls (Sound, Screen controls, Engine switcher) */}
                <div className="flex items-center justify-between z-10">
                  {/* Mode switcher */}
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

                  {/* Right side controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={isDrawing}
                      onClick={() => setVipMode(!vipMode)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        vipMode
                          ? 'bg-yellow-500 border-yellow-400 text-slate-950 font-black shadow-md shadow-yellow-500/20'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                      }`}
                      title="Toggle Tombol VIP"
                    >
                      👑 Mode VIP
                    </button>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors"
                      title={soundEnabled ? 'Matikan Suara' : 'Aktifkan Suara'}
                    >
                      {soundEnabled ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
                    </button>
                    <button
                      onClick={toggleFullscreen}
                      className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors"
                      title={isFullscreen ? 'Keluar Fullscreen' : 'Masuk Fullscreen'}
                    >
                      {isFullscreen ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                {/* Draw Animation Body */}
                <div className="flex-1 flex flex-col items-center justify-center py-10 z-10">
                  <div className="text-center w-full max-w-3xl px-4">
                    {/* Badge */}
                    <div className="inline-flex items-center space-x-2 bg-red-950 border border-red-500/30 px-4 py-1.5 rounded-full text-red-300 font-bold text-sm uppercase tracking-widest mb-6">
                      <Sparkles className="h-4 w-4 animate-spin text-red-400" />
                      <span>DOORPRIZE MALAM SYUKURAN</span>
                    </div>

                    {/* Animated Name Frame */}
                    <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 border-4 border-red-600/80 rounded-[2.5rem] py-14 px-6 md:px-12 shadow-[0_0_50px_rgba(239,68,68,0.15)] flex items-center justify-center min-h-[220px]">
                      
                      {/* Red/White design highlights */}
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
                        // Matrix Mode
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

                 {/* Trigger Button & Pool Count */}
                <div className="flex flex-col items-center z-10 w-full">
                  {vipMode ? (
                    // Giant 3D Red Button for VIP
                    <div className="relative my-4 flex items-center justify-center">
                      {/* Ripple waves */}
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
                    // Standard trigger button
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
                    Peserta Aktif di Pool: <span className="text-red-400 font-extrabold">{eligiblePool.length}</span> dari {attendees.length} Orang
                  </span>
                </div>
              </div>
            </div>

            {/* Winners & Verification Panel Sidebar (lg:col-span-3) */}
            <div className="lg:col-span-3 flex flex-col space-y-4">
              
              {/* Verification Panel */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col h-[260px]">
                <h3 className="text-xs font-bold text-white tracking-wider uppercase pb-2 border-b border-slate-800 flex items-center justify-between">
                  <span>Nama Peserta di Pool</span>
                  <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400">{eligiblePool.length} Orang</span>
                </h3>
                <div className="flex-1 overflow-y-auto mt-2 space-y-1.5 pr-1 text-xs">
                  {eligiblePool.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-600 italic">Pool kosong.</div>
                  ) : (
                    eligiblePool.map((p, i) => (
                      <div key={p.id} className="flex items-center justify-between bg-slate-900/60 p-2 rounded border border-slate-800/40 hover:bg-slate-900 transition-colors">
                        <span className="font-bold text-slate-200 truncate pr-2">{i+1}. {p.nama}</span>
                        <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-400">{p.dawis || 'No Dawis'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Winners History log */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col h-[270px]">
                <h3 className="text-xs font-bold text-white tracking-wider uppercase pb-2 border-b border-slate-800 flex items-center justify-between">
                  <span>Daftar Pemenang</span>
                  <span className="text-[10px] bg-yellow-950 text-yellow-400 px-2 py-0.5 rounded border border-yellow-800/30">{winnersList.length} Pemenang</span>
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
                          <span className="block text-[8px] text-slate-400 mt-0.5">{w.dawis || 'No Dawis'} • {w.no_telp || 'No HP'}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveWinnerStatus(w.id)}
                          className="p-1 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded transition-colors"
                          title="Kembalikan ke Pool Undian"
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
        )}

      </div>

      {/* ============================================================== */}
      {/* OVERLAY MODAL: WINNER CELEBRATION SHOWROOM                     */}
      {/* ============================================================== */}
      {winnerModalOpen && winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 overflow-hidden">
          {/* Confetti canvas overlay */}
          <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none w-full h-full" />

          {/* Modal box */}
          <div className="relative bg-slate-900 border-4 border-yellow-500 rounded-[3rem] p-8 md:p-12 max-w-xl w-full text-center shadow-[0_0_80px_rgba(234,179,8,0.25)] z-10 transform scale-100 transition-transform duration-300">
            {/* Indonesian Independence Ribbon Banner */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white font-black text-sm uppercase px-8 py-2 rounded-full border-2 border-white shadow-lg tracking-widest select-none">
              MERDEKA!
            </div>

            <div className="flex flex-col items-center justify-center my-6">
              <div className="h-20 w-20 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center justify-center p-3 mb-6 animate-pulse">
                <Gift className="h-full w-full text-yellow-500" />
              </div>

              <h2 className="text-xl md:text-2xl font-black text-slate-400 uppercase tracking-widest mb-1 select-none">
                Pemenang Doorprize
              </h2>
              
              <div className="w-full bg-slate-950 border border-slate-800 rounded-3xl py-8 px-4 my-4">
                <span className="block text-4xl md:text-5xl font-black text-white uppercase tracking-wide leading-tight drop-shadow-md truncate">
                  {winner.nama}
                </span>
                <span className="inline-block mt-3 px-3 py-1 bg-yellow-950/40 text-yellow-400 border border-yellow-950 font-mono text-xs font-bold rounded-lg uppercase tracking-wider">
                  Dawis: {winner.dawis || 'Tidak Ada'} • Telp: {winner.no_telp || 'Minor'}
                </span>
              </div>

              <p className="text-slate-400 text-xs mt-2 select-none">
                Apakah pemenang hadir dan menerima hadiah?
              </p>
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button
                onClick={handleRedraw}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold py-3.5 px-4 rounded-2xl text-sm transition-all border border-slate-700 active:scale-95 flex items-center justify-center space-x-2"
              >
                <RotateCcw className="h-4.5 w-4.5" />
                <span>Tidak Hadir (Undi Ulang)</span>
              </button>
              <button
                onClick={() => handleConfirmWinner(winner.id)}
                className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-3.5 px-4 rounded-2xl text-sm transition-all shadow-md shadow-yellow-500/20 active:scale-95 flex items-center justify-center space-x-2"
              >
                <CheckCircle className="h-4.5 w-4.5 fill-current" />
                <span>SAH (Simpan Pemenang)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* OVERLAY MODAL: DUPLICATE DETECTION VERIFICATION DIAG           */}
      {/* ============================================================== */}
      {showDuplicateModal && duplicateMatchInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center space-x-3 text-yellow-500 mb-4 pb-3 border-b border-slate-800">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="font-bold text-white text-base">Peringatan Duplikasi Nama</h3>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Nama <strong className="text-white">"{duplicateMatchInfo.newName}"</strong> memiliki No. HP <strong className="text-white">({duplicateMatchInfo.phone || 'Kosong'})</strong> dan Dawis <strong className="text-white">({duplicateMatchInfo.dawis || 'Kosong'})</strong> yang sama dengan peserta yang sudah terdaftar:
            </p>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2 mb-6">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Nama Terdaftar:</span>
                <span className="font-bold text-white">{duplicateMatchInfo.existingName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">No. HP:</span>
                <span className="font-bold text-white font-mono">{duplicateMatchInfo.phone || 'Kosong'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Dawis:</span>
                <span className="font-bold text-white">{duplicateMatchInfo.dawis || 'Kosong'}</span>
              </div>
            </div>

            <p className="text-slate-400 text-xs mb-6 leading-relaxed">
              Apakah ini orang yang sama (ingin membatalkan input) atau orang yang berbeda (anggota keluarga/minor yang menumpang nomor HP)?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDuplicateModal(false);
                  setDuplicateMatchInfo(null);
                  setIsEditingId(null);
                  // Reset form or let them fix
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors"
              >
                Ya, Batalkan Pendaftaran
              </button>
              <button
                onClick={async () => {
                  setShowDuplicateModal(false);
                  setDuplicateMatchInfo(null);
                  await saveAttendee(); // Bypass check and save
                }}
                className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors"
              >
                Bukan, Ini Orang Berbeda (Simpan)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
