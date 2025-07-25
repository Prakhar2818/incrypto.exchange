
import fs from 'fs';
import path from 'path';
import config from '../config/index.js';
import { extractDateFromSymbol, parseDate } from './dateUtils.js'; // adjust path if needed

export function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function clearCSVs(dirPath1) {
  const files = fs.readdirSync(dirPath1);
  for (const file of files) {
    if (file.endsWith('.csv')) {
      fs.unlinkSync(path.join(dirPath1, file));
    }
  }
}

export function saveCSV(filename, symbols) {
  try {
    const csvData = ['Symbols', ...symbols].join('\n');
    fs.writeFileSync(filename, csvData, 'utf8');
    console.log(`💾 CSV saved: ${filename} (${symbols.length} symbols)`);
  } catch (err) {
    console.error(`❌ Error saving CSV: ${err.message}`);
  }
}

// ✅ New unified function: saveTopExpiryCSVs (6 BTC + 6 ETH)
export function saveTopExpiryCSVs(baseDir, instruments) {
  const grouped = { BTC: {}, ETH: {} };

  for (const item of instruments) {
    const symbol = item.instrument_name;
    const expiry = extractDateFromSymbol(symbol);
    if (!expiry) continue;

    const currency = symbol.startsWith('BTC') ? 'BTC' : symbol.startsWith('ETH') ? 'ETH' : null;
    if (!currency) continue;

    if (!grouped[currency][expiry]) {
      grouped[currency][expiry] = [];
    }
    grouped[currency][expiry].push(item);
  }

  for (const currency of ['BTC', 'ETH']) {
    const expiryDates = Object.keys(grouped[currency]);
    const sorted = expiryDates.sort((a, b) => parseDate(a) - parseDate(b)).slice(0, 6); // first 6 only

    for (const expiry of sorted) {
      const data = grouped[currency][expiry];
      const filename = path.join(baseDir, `${currency}_${expiry}.csv`);
      const rows = data.map(d =>
        `${d.instrument_name},${d.last_price || ''},${new Date(d.timestamp || Date.now()).toISOString()}`
      );
      const header = 'Symbol,Last Price,Timestamp';
      fs.writeFileSync(filename, [header, ...rows].join('\n'), 'utf8');
      console.log(`✅ CSV written: ${filename} (${rows.length} entries)`);
    }
  }
}
