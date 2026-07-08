'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Save, FileText, User, Eye, Edit3, ShieldAlert, Sparkles, Search } from 'lucide-react';

interface Note {
  id: string;
  panitia_id: string;
  nama_panitia: string;
  judul: string;
  konten: string;
  created_at: string;
  updated_at: string;
}

export default function KepanitiaanCatatan() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  // Editor states
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit');

  // Search & Filters for admin
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState('ALL');

  // Load user session and notes
  const loadNotes = async (user: any) => {
    try {
      let query = supabase.from('panitia_notes').select('*');
      
      // Access Control: Non-Ketua Panitia can only view their own notes
      const isSuperAdmin = user.jabatan === 'Ketua Panitia';
      if (!isSuperAdmin) {
        query = query.eq('panitia_id', user.id);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });
      if (data && !error) {
        setNotes(data);
        if (data.length > 0) {
          // Default to the first note in the list
          setActiveNote(data[0]);
          setEditTitle(data[0].judul);
          setEditContent(data[0].konten || '');
        } else {
          setActiveNote(null);
          setEditTitle('');
          setEditContent('');
        }
      } else if (error) {
        alert('Gagal memuat catatan dari database: ' + error.message + '\n\nApakah tabel "panitia_notes" sudah dibuat di SQL Editor Supabase Anda?');
      }
    } catch (err: any) {
      console.error('Error fetching notes:', err);
      alert('Terjadi kesalahan koneksi saat memuat catatan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userSession = localStorage.getItem('session_panitia');
    if (userSession) {
      const user = JSON.parse(userSession);
      setCurrentUser(user);
      loadNotes(user);
    } else {
      setLoading(false);
    }
  }, []);

  const handleSelectNote = (note: Note) => {
    setActiveNote(note);
    setEditTitle(note.judul);
    setEditContent(note.konten || '');
    setEditorMode('edit');
  };

  const handleCreateNote = async () => {
    if (!currentUser) return;

    const newNote = {
      panitia_id: currentUser.id,
      nama_panitia: currentUser.nama,
      judul: 'Catatan Baru Tanpa Judul',
      konten: '# Catatan Baru\nTulis poin-poin penting di sini...',
    };

    try {
      const { data, error } = await supabase.from('panitia_notes').insert([newNote]).select();
      if (data && !error) {
        const created: Note = data[0];
        setNotes([created, ...notes]);
        setActiveNote(created);
        setEditTitle(created.judul);
        setEditContent(created.konten || '');
        setEditorMode('edit');
      } else if (error) {
        alert('Gagal membuat catatan baru: ' + error.message + '\n\nSilakan pastikan tabel "panitia_notes" sudah dibuat di database Anda.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Gagal menghubungi database: ' + err.message);
    }
  };

  const handleSaveNote = async () => {
    if (!activeNote || saving) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('panitia_notes')
        .update({
          judul: editTitle,
          konten: editContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeNote.id);

      if (!error) {
        setNotes(notes.map(n => n.id === activeNote.id ? { ...n, judul: editTitle, konten: editContent } : n));
        setActiveNote({ ...activeNote, judul: editTitle, konten: editContent });
        
        // Show temporary alert banner/toast
        const alertBox = document.getElementById('save-toast');
        if (alertBox) {
          alertBox.classList.remove('opacity-0');
          setTimeout(() => alertBox.classList.add('opacity-0'), 2000);
        }
      } else {
        alert('Gagal menyimpan catatan: ' + error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (id: string, judul: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus catatan "${judul}"?`)) return;

    try {
      const { error } = await supabase.from('panitia_notes').delete().eq('id', id);
      if (!error) {
        const remaining = notes.filter(n => n.id !== id);
        setNotes(remaining);
        if (activeNote?.id === id) {
          if (remaining.length > 0) {
            handleSelectNote(remaining[0]);
          } else {
            setActiveNote(null);
            setEditTitle('');
            setEditContent('');
          }
        }
      } else {
        alert('Gagal menghapus catatan: ' + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Simple Markdown Renderer
  const renderMarkdown = (text: string) => {
    if (!text) return '';
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h4 class="text-sm font-bold text-white mt-4 mb-2">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="text-base font-bold text-white mt-4 mb-2">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="text-lg font-black text-white mt-4 mb-2 border-b border-slate-900 pb-1">$1</h2>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

    // Italics
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-slate-350">$1</em>');

    // Code
    html = html.replace(/`(.*?)`/g, '<code class="bg-slate-950 px-1.5 py-0.5 rounded text-red-400 font-mono text-[10px]">$1</code>');

    // Lists
    html = html.replace(/^\-\s(.*$)/gim, '<li class="list-disc list-inside text-slate-300 ml-4 my-1">$1</li>');

    // Line breaks
    html = html.replace(/\n/g, '<br/>');

    return html;
  };

  const isSuperAdmin = currentUser?.jabatan === 'Ketua Panitia';

  // Filtered notes list for display in sidebar
  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.judul.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.konten.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUser = selectedUserFilter === 'ALL' || n.nama_panitia === selectedUserFilter;
    return matchesSearch && matchesUser;
  });

  // Extract unique panitia names for filter select dropdown
  const uniqueAuthors = Array.from(new Set(notes.map(n => n.nama_panitia)));

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-slate-950 text-white min-h-[50vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-red-500 border-r-2 mx-auto"></div>
          <p className="text-xs text-slate-400">Memuat Catatan Panitia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-900 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-red-500" />
            <span>Catatan & Agenda Penting</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isSuperAdmin
              ? 'Panel Super Admin: Anda dapat memantau dan mengelola catatan pribadi seluruh panitia.'
              : 'Gunakan notepad pribadi ini untuk mencatat todo, nomor penting, atau rancangan teks acara.'}
          </p>
        </div>

        <button
          onClick={handleCreateNote}
          className="flex items-center space-x-2 px-4 py-2 bg-red-650 hover:bg-red-600 text-white font-bold text-xs rounded-xl transition-all shadow-lg"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Catatan Baru</span>
        </button>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Sidebar Notes Directory */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-4 space-y-4 lg:col-span-1 h-fit">
          <div className="space-y-1">
            <span className="block text-[10px] text-slate-500 font-extrabold uppercase tracking-wide">Direktori Catatan</span>
            <span className="text-xs text-slate-300 font-bold">Daftar Notepad</span>
          </div>

          <div className="space-y-2">
            {/* Search */}
            <input
              type="text"
              placeholder="Cari kata kunci..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
            />

            {/* Author filter (Admin Only) */}
            {isSuperAdmin && uniqueAuthors.length > 0 && (
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-red-500"
              >
                <option value="ALL">Semua Panitia</option>
                {uniqueAuthors.map(auth => (
                  <option key={auth} value={auth}>{auth}</option>
                ))}
              </select>
            )}
          </div>

          {/* List items */}
          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {filteredNotes.map(n => (
              <div
                key={n.id}
                onClick={() => handleSelectNote(n)}
                className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between ${
                  activeNote?.id === n.id
                    ? 'bg-red-500/5 border-red-500/20 text-red-400'
                    : 'bg-slate-950/40 border-slate-900 text-slate-450 hover:border-slate-800'
                }`}
              >
                <div>
                  <span className="block text-[11px] font-bold text-white truncate">{n.judul}</span>
                  {isSuperAdmin && (
                    <span className="inline-flex items-center text-[9px] text-slate-550 font-bold mt-1">
                      <User className="h-2.5 w-2.5 mr-0.5 text-slate-650" />
                      <span>{n.nama_panitia}</span>
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center text-[9px] text-slate-600 mt-2.5 pt-1 border-t border-slate-900/50">
                  <span>{new Date(n.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(n.id, n.judul);
                    }}
                    className="text-slate-700 hover:text-red-400 p-0.5 rounded transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
            {filteredNotes.length === 0 && (
              <p className="text-[10px] text-slate-600 italic py-6 text-center">Tidak ada catatan.</p>
            )}
          </div>
        </div>

        {/* Note Editor Area */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 lg:col-span-3 space-y-4 relative min-h-[550px] flex flex-col">
          {/* Toast Notification */}
          <div
            id="save-toast"
            className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 opacity-0 pointer-events-none flex items-center space-x-1"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Berhasil disimpan!</span>
          </div>

          {activeNote ? (
            <>
              {/* Note Metadata Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-900 pb-4">
                <div className="space-y-1">
                  <span className="block text-[9px] text-slate-500 font-extrabold uppercase tracking-wide">
                    Pemilik Catatan: {activeNote.nama_panitia}
                  </span>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="bg-transparent text-base font-bold text-white focus:outline-none border-b border-transparent focus:border-slate-800 w-full max-w-lg"
                  />
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {/* Editor Mode Swappers */}
                  <div className="flex bg-slate-950 p-1 border border-slate-850 rounded-xl">
                    <button
                      onClick={() => setEditorMode('edit')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center space-x-1.5 transition-all ${
                        editorMode === 'edit'
                          ? 'bg-slate-900 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit Editor</span>
                    </button>
                    <button
                      onClick={() => setEditorMode('preview')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center space-x-1.5 transition-all ${
                        editorMode === 'preview'
                          ? 'bg-slate-900 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Preview MD</span>
                    </button>
                  </div>

                  {/* Save button */}
                  <button
                    onClick={handleSaveNote}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Simpan</span>
                  </button>
                </div>
              </div>

              {/* Text Editor Body */}
              <div className="flex-grow flex flex-col pt-2">
                {editorMode === 'edit' ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Tulis konten catatan dengan format Markdown di sini... (e.g. # Judul, **teks tebal**, - list)"
                    className="w-full flex-grow bg-slate-950/40 border border-slate-900 rounded-xl p-4 text-xs text-slate-200 font-medium font-sans leading-relaxed focus:outline-none focus:border-red-500/20 resize-none min-h-[350px]"
                  />
                ) : (
                  <div 
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(editContent) }}
                    className="w-full flex-grow bg-slate-950/20 border border-transparent rounded-xl p-4 text-xs text-slate-300 font-sans leading-relaxed overflow-y-auto min-h-[350px]"
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center space-y-3">
              <FileText className="h-10 w-10 text-slate-800" />
              <p className="text-xs text-slate-500 italic">Belum ada catatan terpilih. Klik 'Buat Catatan Baru' untuk memulai.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
