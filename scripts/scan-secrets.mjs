import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const skip = new Set(['node_modules', '.git', 'dist', '.next', '.vite']);
const patterns = [
  { name: 'Google API key', regex: /AIza[0-9A-Za-z_-]{30,}/g },
  { name: 'Private key block', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: 'Supabase secret-like key', regex: /sb_secret_[A-Za-z0-9_-]{20,}/g },
  { name: 'Hard-coded DATABASE_URL password', regex: /postgres(?:ql)?:\/\/[^\s:@]+:[^\s@]{8,}@/gi }
];
const hits = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const file = join(dir, name);
    const st = statSync(file);
    if (st.isDirectory()) walk(file);
    else if (st.isFile() && st.size < 2_000_000) {
      const data = readFileSync(file, 'utf8');
      for (const p of patterns) if (p.regex.test(data)) hits.push(`${relative(root, file)}: possible ${p.name}`);
    }
  }
}
walk(root);
if (hits.length) {
  console.error('Ditemukan pola yang perlu diperiksa:');
  console.error([...new Set(hits)].join('\n'));
  process.exitCode = 1;
} else {
  console.log('Tidak ditemukan pola secret yang dikenal. Ini bukan jaminan semua secret terdeteksi.');
}
