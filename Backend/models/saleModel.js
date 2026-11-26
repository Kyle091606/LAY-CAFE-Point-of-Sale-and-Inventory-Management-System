import db from '../config/db.js';
// Read-only sales queries. Transactional checkout remains in services/saleService.js
// so stock locks, deductions and recording remain atomic.
export async function findById(id) {
  const [sales] = await db.query(
    'SELECT id, customer_name AS customer, order_type AS orderType, total_amount AS total, payment, change_amount AS `change`, status, created_at AS createdAt FROM sales WHERE id=?',
    [id]
  );
  if (!sales[0])
    return null;
  const [items] = await db.query(
    'SELECT si.product_id AS productId, p.name, si.quantity, si.unit_price AS unitPrice, si.subtotal FROM sale_items si JOIN products p ON p.id=si.product_id WHERE si.sale_id=? ORDER BY si.id',
    [id]
  );
  return { ...sales[0], items };
}
export async function findAll({ from, to } = {}) {
  const where = from && to ? 'WHERE DATE(s.created_at) BETWEEN ? AND ?' : '';
  const [rows] = await db.query(
    `SELECT s.id, s.customer_name AS customer, s.order_type AS orderType, s.total_amount AS total, s.payment, s.change_amount AS \`change\`, s.status, s.created_at AS createdAt, (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id=s.id) AS itemLines FROM sales s ${where} ORDER BY s.created_at DESC, s.id DESC LIMIT 150`,
    from && to ? [from, to] : []
  );
  return rows;
}
export async function todaySummary() {
  const [[today]] = await db.query('SELECT COUNT(*) AS transactions, COALESCE(SUM(total_amount),0) AS totalSales FROM sales WHERE DATE(created_at)=CURDATE()');
  const [[pending]] = await db.query("SELECT COUNT(*) AS pendingOrders FROM sales WHERE status IN ('pending','preparing')");
  return {
    transactions: today.transactions,
    totalSales: today.totalSales,
    pendingOrders: pending.pendingOrders
  };
}
