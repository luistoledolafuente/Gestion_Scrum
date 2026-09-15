import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '../../generated/prisma/client.js';
import { HttpError } from '../utils/http-error.js';

export const notFound: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const status = error.code === 'P2025' ? 404 : error.code === 'P2002' ? 409 : 400;
    res.status(status).json({ message: error.code === 'P2002' ? 'El registro ya existe' : 'No se pudo completar la operación' });
    return;
  }
  console.error(error);
  res.status(500).json({ message: 'Error interno del servidor' });
};
