const dbHelpers = require('../../libs/db-helpers');
const controllerHelpers = require('../../libs/controller-helpers');

const tableName = 'customers';
const columns = [
  'customer_id', 'first_name',
  'last_name', 'company',
  'address', 'city',
  'state', 'country',
  'postal_code', 'phone',
  'fax', 'email',
  'support_rep_id'
];
const primaryKey = 'customer_id';

const controllers = {
  getAll: async (req, res) => {
    const { status, result } = await dbHelpers.getAll(tableName, req.query);

    res.status(status).json(result);
  },
  getOne: async (req, res) => {
    const { id } = req.params;
    const { status, result } = await dbHelpers.getById(tableName, { [primaryKey]: id });

    res.status(status).json(result);
  },
  create: async (req, res) => {
    const data = controllerHelpers.extractFields(req.body, columns);
    const { status, result } = await dbHelpers.create(tableName, data);

    res.status(status).json(result);
  },
  update: async (req, res) => {
    const data = controllerHelpers.extractFields(req.body, columns);
    delete data[primaryKey]; // Can't update this

    const { id } = req.params;
    const { status, result } = await dbHelpers.update(tableName, data, { [primaryKey]: id });

    res.status(status).json(result);
  },
  delete: async (req, res) => {
    const { id } = req.params;
    const { status, result } = await dbHelpers.delete(tableName, { [primaryKey]: id });

    res.status(status).json(result);
  },
}

module.exports = controllers;