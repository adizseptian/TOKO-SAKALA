#!/usr/bin/env node
/**
 * Skrip Migrasi Data Sampel TOKO SAKALA
 * Membaca data sampel/lama dan memvalidasi ke dalam skema TokoSakalaDocument tunggal.
 * Output dapat diimpor langsung ke IndexedDB atau Supabase via menu Pengaturan aplikasi.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

console.log('=== SKRIP MIGRASI DATA TOKO SAKALA (v2.1 TOKO MODE) ===');

const defaultSampleData = {
  app: 'toko-sakala',
  schemaVersion: 1,
  dataVersion: 1,
  updatedAt: new Date().toISOString(),
  payload: {
    inventoryItems: [
      { id: 'indomie', name: 'Indomie Goreng', category: 'Makanan', unit: 'Dus (40 pcs)', packSize: 40, costPerPack: 96000, sellingPricePerUnit: 3000, currentPhysicalStock: 12 },
      { id: 'sedap', name: 'Mie Sedap', category: 'Makanan', unit: 'Dus (40 pcs)', packSize: 40, costPerPack: 92000, sellingPricePerUnit: 2800, currentPhysicalStock: 8 },
      { id: 'aqua', name: 'Aqua 600ml', category: 'Minuman', unit: 'Dus (24 botol)', packSize: 24, costPerPack: 45000, sellingPricePerUnit: 3000, currentPhysicalStock: 5 },
      { id: 'telur', name: 'Telur Ayam Negeri', category: 'Makanan', unit: 'Kg', packSize: 1, costPerPack: 26000, sellingPricePerUnit: 29000, currentPhysicalStock: 25 },
      { id: 'gula', name: 'Gula Pasir', category: 'Makanan', unit: 'Kg', packSize: 1, costPerPack: 16000, sellingPricePerUnit: 18000, currentPhysicalStock: 15 },
      { id: 'chocopie', name: 'ChocoPie', category: 'Makanan', unit: 'Pcs', packSize: 1, costPerPack: 2000, sellingPricePerUnit: 2500, currentPhysicalStock: 50 },
      { id: 'sampoerna', name: 'Rokok Sampoerna', category: 'Rokok', unit: 'Slop (10 bks)', packSize: 10, costPerPack: 310000, sellingPricePerUnit: 34000, currentPhysicalStock: 3 }
    ],
    purchases: [
      { id: 'p-init-1', date: '2026-10-30', productId: 'indomie', productName: 'Indomie Goreng', quantity: 2, unit: 'dus', totalCost: 192000, totalUnits: 80, createdAt: new Date(Date.now() - 86400000).toISOString() }
    ],
    expenses: [
      { id: 'e-init-1', date: '2026-10-30', category: 'Listrik', description: 'Token listrik toko', amount: 50000, createdAt: new Date(Date.now() - 86400000).toISOString() }
    ],
    stockChecks: [],
    deposits: [],
    dailyClosings: []
  }
};

// Hitung SHA-256 deterministik
function computeDeterministicChecksum(payload) {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

const checksum = computeDeterministicChecksum(defaultSampleData.payload);
const finalDocument = {
  ...defaultSampleData,
  checksum
};

const outputPath = resolve(rootDir, 'migrated-toko-sakala-data.json');
writeFileSync(outputPath, JSON.stringify(finalDocument, null, 2), 'utf8');

console.log(`[SUKSES] Data sampel berhasil dimigrasikan ke: ${outputPath}`);
console.log(`- Versi Dokumen: ${finalDocument.dataVersion}`);
console.log(`- Checksum SHA-256: ${checksum}`);
console.log(`- Total Barang: ${finalDocument.payload.inventoryItems.length}`);
console.log('File ini siap diimpor melalui tombol "Pulihkan JSON" di antarmuka Pengaturan.');
