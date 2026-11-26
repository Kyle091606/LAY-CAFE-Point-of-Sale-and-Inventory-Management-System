import db from "../config/db.js";
const COLUMNS = "id, name, category, price, is_active AS isActive, created_at AS createdAt";
const toProduct = (r) => ({ ...r, price: Number(r.price), isActive: Boolean(r.isActive) });
async function findAll(activeOnly = false) {
  const where = activeOnly ? "WHERE is_active = 1" : "";
  const [rows] = await db.query(`SELECT ${COLUMNS} FROM products ${where} ORDER BY category ASC, name ASC`);
  return rows.map(toProduct);
}
async function findById(id) {
  const [rows] = await db.query(`SELECT ${COLUMNS} FROM products WHERE id = ?`, [id]);
  return rows[0] ? toProduct(rows[0]) : null;
}
// Active products lang, para sa checkout
async function findActiveByIds(ids) {
  if (!ids.length)
    return [];
  const [rows] = await db.query(`SELECT ${COLUMNS} FROM products WHERE is_active = 1 AND id IN (?)`, [ids]);
  return rows.map(toProduct);
}
async function create({ name, category, price }) {
  const [result] = await db.query("INSERT INTO products (name, category, price) VALUES (?, ?, ?)", [name, category, price]);
  return findById(result.insertId);
}
async function update(id, { name, category, price, isActive }) {
  const [result] = await db.query(
    "UPDATE products SET name = ?, category = ?, price = ?, is_active = ? WHERE id = ?",
    [name, category, price, isActive ? 1 : 0, id]
  );
  return result.affectedRows ? findById(id) : null;
}
// Soft delete: may foreign key galing sale_items kaya hindi pwedeng tuluyang burahin
async function deactivate(id) {
  const [result] = await db.query("UPDATE products SET is_active = 0 WHERE id = ?", [id]);
  return result.affectedRows > 0;
}
export { findAll, findById, findActiveByIds, create, update, deactivate };
