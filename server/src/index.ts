import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './models/prisma.js';

const server = app.listen(env.port, (error?: Error) => {
  if (error) {
    console.error(`No se pudo iniciar la API: ${error.message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`API disponible en http://localhost:${env.port}/api`);
});

const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
