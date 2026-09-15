import { HttpError } from './http-error.js';

export type JsonObject = Record<string, unknown>;

export const requireFields = (body: JsonObject, fields: string[]) => {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === '');
  if (missing.length) throw new HttpError(400, `Campos requeridos: ${missing.join(', ')}`);
};

export const withDates = (body: JsonObject, fields: string[]) => {
  const data = { ...body };
  for (const field of fields) {
    if (typeof data[field] === 'string') {
      const date = new Date(data[field]);
      if (Number.isNaN(date.getTime())) throw new HttpError(400, `${field} no es una fecha válida`);
      data[field] = date;
    }
  }
  return data;
};
