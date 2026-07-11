import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckSquare, Square, Trash2, Plus, Users, Clock } from 'lucide-react';

interface Task {
  id: string;
  rundown_id: string;
  deskripsi: string;
  is_completed: boolean;
  pic: string;
  created_at: string;
}

interface RundownTaskListProps {
  rundownId: string;
  eventName: string;
  seksiPj: string[];
}

export const RundownTaskList: React.FC<RundownTaskListProps> = ({ rundownId, eventName, seksiPj = [] }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDescription, setNewDescription] = useState('');
  
  // Default new PIC to the first section assigned, or 'Semua Panitia'
  const [newPic, setNewPic] = useState('Semua Panitia');

  // Fetch tasks
  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('rundown_tasks')
        .select('*')
        .eq('rundown_id', rundownId)
        .order('created_at', { ascending: true });

      if (data && !error) {
        setTasks(data);
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();

    // Subscribe to task changes
    const channel = supabase
      .channel(`rundown-tasks-${rundownId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rundown_tasks', filter: `rundown_id=eq.${rundownId}` }, () => {
        loadTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rundownId]);

  // Set default PIC whenever seksiPj changes
  useEffect(() => {
    if (seksiPj && seksiPj.length > 0) {
      setNewPic(seksiPj[0]);
    } else {
      setNewPic('Semua Panitia');
    }
  }, [seksiPj]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescription.trim()) return;

    try {
      const { error } = await supabase
        .from('rundown_tasks')
        .insert([{
          rundown_id: rundownId,
          deskripsi: newDescription.trim(),
          pic: newPic,
          is_completed: false
        }]);

      if (!error) {
        setNewDescription('');
        loadTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      const { error } = await supabase
        .from('rundown_tasks')
        .update({ is_completed: !task.is_completed })
        .eq('id', task.id);

      if (!error) {
        setTasks(tasks.map(t => t.id === task.id ? { ...t, is_completed: !t.is_completed } : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('rundown_tasks')
        .delete()
        .eq('id', taskId);

      if (!error) {
        setTasks(tasks.filter(t => t.id !== taskId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const completedCount = tasks.filter(t => t.is_completed).length;

  // Group tasks by section PJ
  const sectionsList = seksiPj && seksiPj.length > 0 ? ['Semua Panitia', ...seksiPj] : ['Semua Panitia'];
  const groupedTasks = sectionsList.map(sec => ({
    sectionName: sec,
    items: tasks.filter(t => t.pic === sec)
  })).filter(group => group.items.length > 0);

  // Remaining tasks not matching current assigned sections
  const otherItems = tasks.filter(t => !sectionsList.includes(t.pic));
  if (otherItems.length > 0) {
    groupedTasks.push({
      sectionName: 'Seksi Lain',
      items: otherItems
    });
  }

  return (
    <div className="bg-slate-900/10 border border-slate-900 rounded-xl p-4 mt-2 space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-900">
        <div>
          <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Persiapan internal</span>
          <span className="text-xs text-white font-bold">Daftar Kebutuhan & Tugas PJ</span>
        </div>
        <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-black">
          {completedCount}/{tasks.length} Selesai
        </span>
      </div>

      {/* Task List Grouped by PJ */}
      <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
        {groupedTasks.map(group => (
          <div key={group.sectionName} className="space-y-1.5">
            <span className="block text-[9px] text-primary-400 font-extrabold uppercase tracking-wide">
              {group.sectionName === 'Semua Panitia' ? 'Umum / Semua PJ' : `Seksi ${group.sectionName}`}
            </span>
            <div className="space-y-1 pl-1">
              {group.items.map(t => (
                <div key={t.id} className="flex items-center justify-between gap-3 bg-slate-950/40 p-2 rounded-lg border border-slate-900/30 hover:border-slate-850 transition-all">
                  <div className="flex items-center space-x-2 min-w-0 flex-grow">
                    <button 
                      type="button"
                      onClick={() => handleToggleTask(t)}
                      className="text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                    >
                      {t.is_completed ? (
                        <CheckSquare className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                    <span className={`block text-xs leading-relaxed min-w-0 flex-grow ${t.is_completed ? 'line-through text-slate-500 font-medium' : 'text-slate-200 font-semibold'}`}>
                      {t.deskripsi}
                    </span>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => handleDeleteTask(t.id)}
                    className="text-slate-750 hover:text-primary-400 p-1 rounded-md transition-colors shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
        {tasks.length === 0 && !loading && (
          <p className="text-[10px] text-slate-650 italic py-2 text-center">Belum ada tugas persiapan khusus.</p>
        )}
      </div>

      {/* Add Task Mini-Form */}
      <form onSubmit={handleAddTask} className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-900">
        <input
          type="text"
          required
          placeholder="Tugas baru (e.g. Siapkan 10 obor)"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          className="sm:col-span-2 bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-primary-500"
        />
        <div className="flex gap-1.5">
          <select
            value={newPic}
            onChange={(e) => setNewPic(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded-lg px-1.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-primary-500"
          >
            <option value="Semua Panitia">Semua PJ</option>
            {seksiPj.map((sec) => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
          <button
            type="submit"
            className="p-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors shrink-0 flex items-center justify-center"
          >
            <Plus className="h-4.5 w-4.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
