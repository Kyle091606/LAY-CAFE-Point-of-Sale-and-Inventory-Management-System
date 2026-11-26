import { Router } from 'express';
import * as c from '../controllers/productController.js';
import db from '../config/db.js';
import ValidationError from '../utils/ValidationError.js';
import { requireAuth } from '../middleware/auth.js';
const r = Router();
r.get('/', c.list);
r.get('/:id/recipe', requireAuth('admin'), async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT pi.inventory_id AS inventoryId, i.name, i.unit, pi.quantity_required AS quantityRequired FROM product_inventory pi JOIN inventory i ON i.id=pi.inventory_id WHERE pi.product_id=? ORDER BY i.name',
      [req.params.id]
    );
    res.json(rows);
  }
  catch (e) {
    next(e);
  }
});
r.put('/:id/recipe', requireAuth('admin'), async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const items = req.body?.items;
    if (!Array.isArray(items) || !items.length || items.length > 30)
      throw new ValidationError(400, 'Choose 1–30 ingredients for this product.');
    const ids = new Set();
    for (const row of items) {
      const id = Number(row.inventoryId), qty = Number(row.quantityRequired);
      if (!Number.isInteger(id) || id < 1 || ids.has(id) || !Number.isFinite(qty) || qty <= 0 || qty > 10000 || Math.abs(Math.round(qty * 1000) - qty * 1000) > 0.00001)
        throw new ValidationError(400, 'Each ingredient needs a unique ID and a quantity greater than zero (up to 3 decimals).');
      ids.add(id);
    }
    await conn.beginTransaction();
    const [[p]] = await conn.query('SELECT id FROM products WHERE id=? FOR UPDATE', [req.params.id]);
    if (!p)
      throw new ValidationError(404, 'Product not found.');
    await conn.query('DELETE FROM product_inventory WHERE product_id=?', [req.params.id]);
    await conn.query(
      'INSERT INTO product_inventory (product_id,inventory_id,quantity_required) VALUES ?',
      [items.map(i => [req.params.id, i.inventoryId, i.quantityRequired])]
    );
    await conn.commit();
    res.json({ message: 'Product recipe saved.' });
  }
  catch (e) {
    await conn.rollback();
    next(e);
  }
  finally {
    conn.release();
  }
});
r.get('/:id', c.get);
r.post('/', requireAuth('admin'), c.create);
r.put('/:id', requireAuth('admin'), c.update);
r.delete('/:id', requireAuth('admin'), c.remove);
export default r;
