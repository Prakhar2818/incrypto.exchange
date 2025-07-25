import https from 'https';
import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import config from '../config/index.js';
import { extractDateFromSymbol, parseDate } from '../utils/dateUtils.js';
import { ensureDir, saveCSV } from '../utils/fileUtils.js';





export async function fetchAndSaveSymbolsByCurrency(currency) {
  const apiUrl = `${config.deribitApiBase}?currency=${currency}&kind=option`;
  return new Promise((resolve, reject) => {
    https.get(apiUrl, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const instruments = JSON.parse(data).result;
        const symbols = instruments.filter(i => i.is_active).map(i => i.instrument_name);
        console.log(`✅ [${currency}] Total active symbols fetched: ${symbols.length}`);

        const dateMap = new Map();
        for (const symbol of symbols) {
          const date = extractDateFromSymbol(symbol);
          if (!date) continue;
          if (!dateMap.has(date)) dateMap.set(date, []);
          dateMap.get(date).push(symbol);
        }

        const sortedDates = [...dateMap.keys()].sort((a, b) => parseDate(a) - parseDate(b));
        const selectedDates = sortedDates.slice(0, config.maxDates);

        ensureDir(config.symbolOutputDir);
        let totalSubscribed = 0;

        selectedDates.forEach(date => {
          const symbolsForDate = dateMap.get(date);
          totalSubscribed += symbolsForDate.length;
          const filePath = path.join(config.symbolOutputDir, `${currency}_symbols_${date}.csv`);
          saveCSV(filePath, symbolsForDate);
        });

        console.log(`✅ [${currency}] Total symbols across ${selectedDates.length} dates: ${totalSubscribed}`);
        resolve();
      });
    }).on('error', reject);
  });
}

export async function readSymbolsFromCSVsByCurrency(currency) {
  return new Promise((resolve, reject) => {
    const symbolSet = new Set();
    fs.readdir(config.symbolOutputDir, (err, files) => {
      if (err) return reject(err);

      const csvFiles = files.filter(f => f.startsWith(`${currency}_`) && f.endsWith('.csv'));
      let readCount = 0;

      for (const file of csvFiles) {
        fs.createReadStream(path.join(config.symbolOutputDir, file))
          .pipe(csvParser())
          .on('data', row => {
            if (row.Symbols) symbolSet.add(row.Symbols.trim());
          })
          .on('end', () => {
            readCount++;
            if (readCount === csvFiles.length) {
              resolve([...symbolSet]);
            }
          });
      }
    });
  });
}
