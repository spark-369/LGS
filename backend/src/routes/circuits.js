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
  simulateStoredCircuit,
} from '../controllers/circuitController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import {
  validateCircuit,
  validateObjectId,
  validateCircuitQuery,
} from '../middleware/validation.js';

const router = Router();

// Public gallery — readable while signed out, but enriched with `isOwner`
// when a valid token is supplied.
router.get('/public', optionalAuth, validateCircuitQuery, getPublicCircuits);

// Everything below requires a valid session.
router.use(authenticate);

router.post('/', validateCircuit, createCircuit);
router.get('/', validateCircuitQuery, getCircuits);
router.get('/:id', validateObjectId, getCircuit);
router.put('/:id', validateObjectId, validateCircuit, updateCircuit);
router.patch('/:id/public', validateObjectId, togglePublic);
router.post('/:id/duplicate', validateObjectId, duplicateCircuit);
router.post('/:id/simulate', validateObjectId, simulateStoredCircuit);
router.delete('/:id', validateObjectId, deleteCircuit);

export default router;
