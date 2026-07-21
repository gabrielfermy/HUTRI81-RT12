const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Tentukan file env berdasarkan argumen --prod
const isProd = process.argv.includes('--prod');
const envFileName = isProd ? '.env.prod' : '.env.local';

console.log(`Menggunakan konfigurasi dari: ${envFileName}`);

// 1. Baca Environment Variables
let env = {};
try {
  const envFile = fs.readFileSync(envFileName, 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) {
      env[key.trim()] = val.join('=').trim();
    }
  });
} catch (err) {
  console.error(`Gagal membaca file ${envFileName}:`, err.message);
  process.exit(1);
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL atau Anon Key tidak ditemukan di .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Daftar Tabel yang Ingin Di-backup
const tables = [
  'warga',
  'panitia',
  'rundown',
  'rab',
  'sponsorship',
  'rapat',
  'pengeluaran',
  'kehadiran_rapat',
  'seksi'
];

async function runBackup() {
  console.log('Memulai backup data Supabase ke format JSON secara lokal...');
  const backupData = {
    timestamp: new Date().toISOString(),
    data: {}
  };

  for (const table of tables) {
    try {
      console.log(`Mengambil data dari tabel: ${table}...`);
      const { data, error } = await supabase.from(table).select('*');
      
      if (error) {
        // Abaikan jika tabel tidak ada atau error izin akses
        console.warn(`[Peringatan] Gagal mengambil tabel ${table}:`, error.message);
        backupData.data[table] = [];
      } else {
        backupData.data[table] = data || [];
        console.log(`Tabel ${table}: Berhasil mengambil ${backupData.data[table].length} baris.`);
      }
    } catch (err) {
      console.error(`Gagal memproses tabel ${table}:`, err.message);
    }
  }

  // 3. Simpan file backup ke folder 'backups'
  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const envSuffix = isProd ? 'prod' : 'local';
  const filename = `supabase-backup-${envSuffix}-${dateStr}.json`;
  const filepath = path.join(backupDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`\n==================================================`);
  console.log(`Backup BERHASIL disimpan!`);
  console.log(`Lokasi file: ${filepath}`);
  console.log(`==================================================`);
}

runBackup();
