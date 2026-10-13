import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');

class DictionaryService {
  constructor() {
    this.cache = new Map();
  }

  loadDictionary(dialect) {
    if (this.cache.has(dialect)) {
      return this.cache.get(dialect);
    }

    const csvFile = path.join(DATA_DIR, `${dialect}_dictionary.csv`);
    if (!fs.existsSync(csvFile)) {
      logger.warn(`Dictionary file not found for dialect: ${dialect}`);
      return null;
    }

    try {
      const content = fs.readFileSync(csvFile, 'utf-8');
      const records = parse(content, { columns: true, skip_empty_lines: true });
      this.cache.set(dialect, records);
      logger.info(`Loaded dictionary for ${dialect} into cache (${records.length} records)`);
      return records;
    } catch (err) {
      logger.error(`Failed to load dictionary for ${dialect}:`, err);
      throw err;
    }
  }

  search(dialect, query) {
    const records = this.loadDictionary(dialect);
    if (!records) return [];

    const lowerQuery = query.toLowerCase();
    return records.filter(r => 
      Object.values(r).some(v => v.toLowerCase().includes(lowerQuery))
    );
  }

  // Preload all available dictionaries
  preloadAll() {
    if (!fs.existsSync(DATA_DIR)) return;
    const files = fs.readdirSync(DATA_DIR);
    files.forEach(file => {
      if (file.endsWith('_dictionary.csv')) {
        const dialect = file.replace('_dictionary.csv', '');
        this.loadDictionary(dialect);
      }
    });
  }
}

export default new DictionaryService();
