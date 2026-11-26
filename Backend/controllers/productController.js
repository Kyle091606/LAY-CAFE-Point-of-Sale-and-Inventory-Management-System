import * as service from "../services/productService.js";
import handleError from "../utils/handleError.js";
// GET /products           -> lahat
// GET /products?active=1  -> para sa cashier screen (active lang)
export const list = async (req, res) => {
  try {
    res.json(await service.getAll(req.query.active === "1"));
  }
  catch (e) {
    handleError(res, e);
  }
};
export const get = async (req, res) => {
  try {
    res.json(await service.getOne(req.params.id));
  }
  catch (e) {
    handleError(res, e);
  }
};
export const create = async (req, res) => {
  try {
    res.status(201).json(await service.add(req.body));
  }
  catch (e) {
    handleError(res, e);
  }
};
export const update = async (req, res) => {
  try {
    res.json(await service.update(req.params.id, req.body));
  }
  catch (e) {
    handleError(res, e);
  }
};
export const remove = async (req, res) => {
  try {
    await service.remove(req.params.id);
    res.status(204).end();
  }
  catch (e) {
    handleError(res, e);
  }
};
