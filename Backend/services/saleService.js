import db from '../config/db.js';
import * as saleModel from '../models/saleModel.js';
import ValidationError from '../utils/ValidationError.js';
import { validateOrderType } from '../utils/orderType.js';
const cents = (n) => Math.round(Number(n) * 100);
const money = (n) => n / 100;
const validId = (v) => Number.isInteger(Number(v)) && Number(v) > 0;
// Atomic checkout: lock stock, validate all recipe requirements, insert sale,
// deduct inventory, record movement, then commit. Any failure rolls back all.
export async function checkout(input = {}, cashierId) {
  if (!Array.isArray(input.items) || !input.items.length)
    throw new ValidationError(400, 'Add items to the cart first.');
  const quantities = new Map();
  for (const raw of input.items) {
    const id = Number(raw.productId), qty = Number(raw.quantity);
    if (!validId(id) || !Number.isInteger(qty) || qty < 1 || qty > 100)
      throw new ValidationError(400, 'Invalid product or quantity (1–100).');
    quantities.set(id, (quantities.get(id) || 0) + qty);
  }
  if ([...quantities.values()].some(q => q > 100))
    throw new ValidationError(400, 'Maximum 100 units per product.');
  const payment = Number(input.payment);
  if (!Number.isFinite(payment) || input.payment === '' || input.payment == null || payment < 0 || payment > 99999999)
    throw new ValidationError(400, 'Enter a valid payment.');
  const orderType = validateOrderType(input.orderType);
  const customer = String(input.customer || '').trim().slice(0, 120) || 'Walk-in';
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const ids = [...quantities.keys()].sort((a, b) => a - b);
    const [products] = await connection.query(
      `SELECT id, name, price FROM products WHERE is_active = 1 AND id IN (${ids.map(() => '?').join(',')}) ORDER BY id FOR UPDATE`,
      ids
    );
    if (products.length !== ids.length)
      throw new ValidationError(409, 'Some products are no longer available. Refresh the menu.');
    const lines = products.map(p => ({
      productId: p.id,
      name: p.name,
      quantity: quantities.get(p.id),
      unitPrice: Number(p.price)
    }));
    let totalCents = 0;
    for (const line of lines) {
      line.subtotal = money(cents(line.unitPrice) * line.quantity);
      totalCents += cents(line.subtotal);
    }
    const paidCents = cents(payment);
    if (paidCents < totalCents)
      throw new ValidationError(400, 'Payment is not enough.');
    const [recipeRows] = await connection.query(
      `SELECT pi.product_id AS productId, pi.inventory_id AS inventoryId, pi.quantity_required AS quantityRequired, i.name AS inventoryName FROM product_inventory pi JOIN inventory i ON i.id=pi.inventory_id WHERE pi.product_id IN (${ids.map(() => '?').join(',')}) ORDER BY pi.inventory_id`,
      ids
    );
    const mappedIds = new Set(recipeRows.map(r => r.productId));
    const missing = products.find(p => !mappedIds.has(p.id));
    if (missing)
      throw new ValidationError(409, `Set an inventory recipe for ${missing.name} before selling it. Ask the admin.`);
    const required = new Map();
    for (const row of recipeRows) {
      const previous = required.get(row.inventoryId) || { quantity: 0, name: row.inventoryName };
      previous.quantity += Number(row.quantityRequired) * quantities.get(row.productId);
      required.set(row.inventoryId, previous);
    }
    const inventoryIds = [...required.keys()].sort((a, b) => a - b);
    const [stocks] = await connection.query(
      `SELECT id, name, quantity, unit FROM inventory WHERE is_active=1 AND id IN (${inventoryIds.map(() => '?').join(',')}) ORDER BY id FOR UPDATE`,
      inventoryIds
    );
    for (const stock of stocks) {
      const needed = Math.round(required.get(stock.id).quantity * 1000) / 1000;
      if (Number(stock.quantity) + 0.0000001 < needed)
        throw new ValidationError(409, `Insufficient ${stock.name}: need ${needed} ${stock.unit}, available ${stock.quantity} ${stock.unit}.`);
    }
    if (stocks.length !== inventoryIds.length)
      throw new ValidationError(409, 'A recipe ingredient is missing.');
    const [sale] = await connection.query(
      'INSERT INTO sales (customer_name, order_type, total_amount, payment, change_amount, cashier_id) VALUES (?, ?, ?, ?, ?, ?)',
      [customer, orderType, money(totalCents), money(paidCents), money(paidCents - totalCents), cashierId]
    );
    await connection.query(
      'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES ?',
      [lines.map(l => [sale.insertId, l.productId, l.quantity, l.unitPrice, l.subtotal])]
    );
    for (const stock of stocks) {
      const needed = Math.round(required.get(stock.id).quantity * 1000) / 1000;
      await connection.query('UPDATE inventory SET quantity = quantity - ? WHERE id = ?', [needed, stock.id]);
      await connection.query(
        'INSERT INTO inventory_movements (inventory_id, sale_id, movement_type, quantity_change, note) VALUES (?, ?, ?, ?, ?)',
        [stock.id, sale.insertId, 'sale', -needed, `POS sale #${sale.insertId}`]
      );
    }
    await connection.commit();
    return await getOne(sale.insertId);
  }
  catch (err) {
    await connection.rollback();
    throw err;
  }
  finally {
    connection.release();
  }
}
export async function getOne(id) {
  if (!validId(id))
    throw new ValidationError(400, 'Invalid sale ID.');
  const sale = await saleModel.findById(id);
  if (!sale)
    throw new ValidationError(404, 'Order not found.');
  return sale;
}
export async function getAll({ from, to } = {}) {
  const valid = d => /^\d{4}-\d{2}-\d{2}$/.test(d);
  if ((from || to) && !(valid(from) && valid(to)))
    throw new ValidationError(400, 'Use both from and to as YYYY-MM-DD.');
  return saleModel.findAll({ from, to });
}
export async function getTodaySummary() {
  return saleModel.todaySummary();
}
