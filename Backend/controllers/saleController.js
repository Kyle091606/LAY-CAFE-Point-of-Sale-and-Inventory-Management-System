import * as service from '../services/saleService.js';
import handleError from '../utils/handleError.js';
export const checkout = async (req, res) => {
  try {
    res.status(201).json(await service.checkout(req.body, req.user.id));
  }
  catch (e) {
    handleError(res, e);
  }
};
export const list = async (req, res) => {
  try {
    res.json(await service.getAll(req.query));
  }
  catch (e) {
    handleError(res, e);
  }
};
export const summary = async (_req, res) => {
  try {
    res.json(await service.getTodaySummary());
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
