import express from 'express';
import configRoutes from './config.js';
import dictionaryRoutes from './dictionary.js';

const router = express.Router();

router.use('/config', configRoutes);
router.use('/dictionary', dictionaryRoutes);

export default router;
