const db = require('./db-connection');

const handleError = (ex, functionName) => {
  console.error(`[${functionName}] error`, ex); // Use console.error for errors
  return { status: 500, result: { error: ex.message } };
};

const extractQuery = (query) => {
  if (!query || Object.keys(query).length === 0) return {};

  const params = [];
  const where = Object.keys(query).map(key => {
    if (key !== 'field' && key !== 'value') {
      params.push(query[key]);
      return `${key} = ?`;
    }
    return null;
  }).filter(Boolean);

  return {
    where: where.join(' AND '),
    params,
  };
};

const executeQuery = async (sql, params, countQuery, limit, offset) => {
  try {
    const rowsPromise = db.asyncAll(sql, [...params, limit, offset]);
    const totalPromise = countQuery ? db.asyncGet(countQuery, params) : Promise.resolve({ "COUNT(*)": 0 });

    const [rows, total] = await Promise.all([rowsPromise, totalPromise]);
    return { status: 200, result: { rows, total: total["COUNT(*)"] } };
  } catch (ex) {
    return handleError(ex, 'executeQuery');
  }
};

class Helper {
  static async getAll(tableName, options = {}) {
    const { limit = 10, offset = 0 } = options;

    const sql = `SELECT * FROM ${tableName} LIMIT ? OFFSET ?`;
    const countQuery = `SELECT COUNT(*) FROM ${tableName}`;

    try {
      const [rows, total] = await Promise.all([
        db.asyncAll(sql, [limit, offset]),
        db.asyncGet(countQuery),
      ]);

      return { status: 200, result: { rows, total: total["COUNT(*)"] } };
    } catch (ex) {
      return handleError(ex, 'getAll');
    }
  }

  static async getById(tableName, query) {
    const { where, params } = extractQuery(query);
    if (!where || !params.length) {
      return { status: 400, result: { error: 'Please provide field and value' } };
    }

    const sql = `SELECT * FROM ${tableName} WHERE ${where}`;
    try {
      const rows = await db.asyncGet(sql, params);
      return { status: 200, result: rows };
    } catch (ex) {
      return handleError(ex, 'getById');
    }
  }

  static getByRawQuery(query, params = [], options = {}) {
    if (!query) {
      return { status: 400, result: { error: 'Please provide query' } };
    }

    const { limit = 10, offset = 0 } = options;
    const sql = `${query} LIMIT ? OFFSET ?`;
    const countQuery = `SELECT COUNT(*) FROM (${query})`;

    return executeQuery(sql, params, countQuery, limit, offset);
  }

  static getByQuery(tableName, query, options = {}) {
    const { where, params } = extractQuery(query);
    const { limit = 10, offset = 0, count = true } = options;

    if (!where || !params.length) {
      return { status: 400, result: { error: 'Please provide field and value' } };
    }

    const sql = `SELECT * FROM ${tableName} WHERE ${where} LIMIT ? OFFSET ?`;
    const countQuery = count ? `SELECT COUNT(*) FROM ${tableName} WHERE ${where}` : '';

    return executeQuery(sql, params, countQuery, limit, offset);
  }

  async checkExists(tableName, query) {
    const isExists = await this.getById(tableName, query);

    if (!isExists) return null;

    switch (isExists.status) {
      case 500:
        return isExists;
      case 400:
        return { status: 404, result: { error: 'Not found' } };
      case 200:
        return isExists.result ? null : { status: 404, result: { error: 'Not found' } };
      default:
        return { status: 500, result: { error: 'Unexpected status' } };
    }
  }

  verifyData(tableName, data, query) {
    if (!data || Object.keys(data).length === 0) {
      return { status: 422, result: { error: 'Please provide data' } };
    }

    const { where, params } = extractQuery(query);
    if (!where || !params.length) {
      return { status: 400, result: { error: 'Please provide field and value' } };
    }

    return this.checkExists(tableName, query);
  }

  async update(tableName, data, query) {
    const hasError = await this.verifyData(tableName, data, query);
    if (hasError) return hasError;

    const { where, params } = extractQuery(query);
    const setFields = Object.keys(data).map(key => `${key} = ?`).join(',');
    const values = Object.values(data);
    const updateParams = [...values, ...params];

    const sql = `UPDATE ${tableName} SET ${setFields} WHERE ${where}`;

    try {
      await db.asyncRun(sql, updateParams);
      const row = await db.asyncGet(`SELECT * FROM ${tableName} WHERE ${where}`, params);
      return { status: 200, result: row };
    } catch (ex) {
      return handleError(ex, 'update');
    }
  }

  static async delete(tableName, query) {
    const { where, params } = extractQuery(query);
    if (!where || !params.length) {
      return { status: 400, result: { error: 'Please provide field and value' } };
    }

    const sql = `DELETE FROM ${tableName} WHERE ${where}`;

    try {
      await db.asyncRun(sql, params);
      return { status: 200, result: { [params]: 'Deleted' } };
    } catch (ex) {
      return handleError(ex, 'delete');
    }
  }

  static async create(tableName, data) {
    if (!data || Object.keys(data).length === 0) {
      return { status: 422, result: { error: "Please provide data" } };
    }

    const keys = Object.keys(data).join(',');
    const fields = Object.keys(data).map(() => '?').join(',');
    const values = Object.values(data);
    const sql = `INSERT INTO ${tableName} (${keys}) VALUES (${fields}) RETURNING *;`;

    try {
      const rows = await db.asyncGet(sql, values);
      return { status: 201, result: rows };
    } catch (ex) {
      return handleError(ex, 'create');
    }
  }
}

module.exports = Helper;
