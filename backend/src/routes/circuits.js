import { Router } from 'express';
import {
  createCircuit,
  getCircuits,
  getCircuit,
  updateCircuit,
  deleteCircuit,
  duplicateCircuit,
  getPublicCircuits,
  togglePublic,
} from '../controllers/circuitController.js';
import {
  authenticate,
  validateCircuit,
  validateObjectId,
  validateCircuitQuery,
} from '../middleware/auth.js';

const router = Router();

router.get('/public', getPublicCircuits);

router.use(authenticate);

router.post('/', validateCircuit, createCircuit);
router.get('/', validateCircuitQuery, getCircuits);
router.get('/:id', validateObjectId, getCircuit);
router.put('/:id', validateObjectId, validateCircuit, updateCircuit);
router.patch('/:id/public', validateObjectId, togglePublic);
router.delete('/:id', validateObjectId, deleteCircuit);
router.post('/:id/duplicate', validateObjectId, duplicateCircuit);

export default router;
