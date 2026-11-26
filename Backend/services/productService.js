import * as model from "../models/productModel.js";
import ValidationError from "../utils/ValidationError.js";
function parseId(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0)
    throw new ValidationError(400, "Invalid product id.");
  return n;
}
function clean(input = {}) {
  const name = String(input.name || "").trim();
  const category = String(input.category || "").trim();
  const price = Number(input.price);
  const isActive = input.isActive === undefined ? true : Boolean(input.isActive);
  if (!name || name.length > 190)
    throw new ValidationError(400, "Enter the product name.");
  if (!category || category.length > 80)
    throw new ValidationError(400, "Enter the category.");
  if (input.price === "" || input.price === undefined || !Number.isFinite(price) || price < 0 || price > 99999999)
    throw new ValidationError(400, "Price must be 0 or more.");
  return { name, category, price: Math.round(price * 100) / 100, isActive };
}
const getAll = (activeOnly) => model.findAll(activeOnly);
async function getOne(id) {
  const item = await model.findById(parseId(id));
  if (!item)
    throw new ValidationError(404, "Product not found.");
  return item;
}
const add = (input) => model.create(clean(input));
async function update(id, input) {
  const item = await model.update(parseId(id), clean(input));
  if (!item)
    throw new ValidationError(404, "Product not found.");
  return item;
}
async function remove(id) {
  if (!(await model.deactivate(parseId(id))))
    throw new ValidationError(404, "Product not found.");
}
export { getAll, getOne, add, update, remove };
