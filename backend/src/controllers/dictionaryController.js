import dictionaryService from '../services/dictionaryService.js';

export const searchDictionary = (req, res) => {
  const { dialect, query } = req.query;
  if (!dialect || !query) {
    return res.status(400).json({ error: 'Missing dialect or query' });
  }

  try {
    const results = dictionaryService.search(dialect, query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search dictionary' });
  }
};
