import { Router } from 'express';
import db from '../config/db.js';
import * as saleService from '../services/saleService.js';
import ValidationError from '../utils/ValidationError.js';
const router = Router();
const transitions = { pending: 'preparing', preparing: 'ready', ready: 'completed' };
router.get('/orders', async (_req, res, next) => {
  try {
    const [orders] = await db.query("SELECT id, customer_name AS customer, order_type AS orderType, status, total_amount AS total, created_at AS createdAt FROM sales ORDER BY FIELD(status,'pending','preparing','ready','completed'), created_at DESC LIMIT 120");
    if (!orders.length)
      return res.json([]);
    const ids = orders.map(x => x.id);
    const [lines] = await db.query(
      `SELECT si.sale_id AS saleId, p.name, si.quantity FROM sale_items si JOIN products p ON p.id=si.product_id WHERE si.sale_id IN (${ids.map(() => '?').join(',')}) ORDER BY si.id`,
      ids
    );
    const items = new Map(ids.map(id => [id, []]));
    for (const row of lines)
      items.get(row.saleId)?.push({ name: row.name, quantity: row.quantity });
    res.json(orders.map(o => ({ ...o, items: items.get(o.id) })));
  }
  catch (err) {
    next(err);
  }
});
router.patch('/orders/:id/status', async (req, res, next) => {
  try {
    const status = String(req.body?.status || '');
    if (!['preparing', 'ready', 'completed'].includes(status))
      throw new ValidationError(400, 'Invalid order status.');
    const [result] = await db.query(
      'UPDATE sales SET status=? WHERE id=? AND status=?',
      [status, req.params.id, Object.keys(transitions).find(key => transitions[key] === status)]
    );
    if (!result.affectedRows)
      throw new ValidationError(409, 'Order status changed or invalid transition. Refresh orders.');
    res.json(await saleService.getOne(req.params.id));
  }
  catch (err) {
    next(err);
  }
});
export default router;
