import { Router } from 'express';
import * as c from '../controllers/saleController.js';
import { requireAuth } from '../middleware/auth.js';
const r = Router();
r.post('/', requireAuth('cashier'), c.checkout);
r.get('/', c.list);
r.get('/summary/today', c.summary);
r.get('/:id', c.get);
export default r;
