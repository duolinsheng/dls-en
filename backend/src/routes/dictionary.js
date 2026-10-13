import express from 'express';
import { searchDictionary } from '../controllers/dictionaryController.js';

const router = express.Router();

router.get('/search', searchDictionary);

export default router;
