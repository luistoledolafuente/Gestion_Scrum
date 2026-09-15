# Momentum Scrum

Base full-stack para gestionar proyectos Scrum y compartir el avance mediante un portal de cliente de solo lectura.

Incluye autenticación con correo o Google, aislamiento por espacios de trabajo, roles de acceso, directorio editable de clientes, calendario diario/semanal/mensual, reuniones con Google Meet, reportes de portafolio, sincronización individual con Google Calendar y actualización automática en segundo plano.

## Estructura

- `server/`: API REST con Express, TypeScript, PostgreSQL y Prisma.
- `client/`: dashboard React con Vite, React Router, Axios y Recharts.

## Inicio rápido

Requisitos: Node.js 20 o superior y PostgreSQL.

1. Crea una base PostgreSQL vacía.
2. Copia `server/.env.example` como `server/.env` y ajusta `DATABASE_URL`.
3. Instala las dependencias (si todavía no existen):

   ```bash
   npm install
   ```

4. Crea las tablas y genera Prisma Client:

   ```bash
   cd server
   npm run prisma:migrate
   npm run prisma:generate
   ```

5. En dos terminales, desde la raíz:

   ```bash
   npm run dev:server
   npm run dev:client
   ```

Abre `http://localhost:5173`. La API queda en `http://localhost:4000/api`; Vite redirige automáticamente las peticiones `/api`.

En el primer acceso, crea una cuenta desde `/register`. El registro crea también un workspace personal aislado. Desde **Configuración** puedes compartirlo con otra cuenta registrada como administrador, editor o cliente de solo lectura. Las rutas internas exigen una sesión válida; únicamente `/portal/:token` continúa siendo público y de solo lectura.

## Primeros registros

La base no incluye datos ficticios. Inicia sesión en el dashboard y empieza creando un cliente y luego un proyecto desde la interfaz.

Si quieres utilizar la API directamente, primero debes autenticarte y conservar la cookie de sesión:

```bash
curl -c cookies.txt -X POST http://localhost:4000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Tu nombre","email":"tu@correo.com","password":"una-clave-segura"}'

curl -X POST http://localhost:4000/api/clients \
  -b cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ana Cliente","email":"ana@empresa.com","companyName":"Empresa"}'

curl -X POST http://localhost:4000/api/projects \
  -b cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"name":"Nuevo producto","description":"Primera versión","startDate":"2026-09-14","clientId":"ID_DEL_CLIENTE","deliverables":["MVP navegable"]}'
```

El proyecto creado incluye `publicPortalToken`; compártelo como `/portal/{publicPortalToken}`.

Para iniciar sesión con Google y conectar el calendario de cada usuario, completa únicamente `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en el servidor. Cada persona autoriza después su propio Calendar desde **Configuración**; no debes copiar refresh tokens manualmente. Google Meet se crea mediante `conferenceData` de Calendar API y no requiere habilitar otra API. El registro tradicional y el calendario interno funcionan sin Google.

La configuración que debes realizar manualmente en Google Cloud está descrita en [server/README.md](server/README.md#configuración-manual-de-google-cloud).

Consulta [server/README.md](server/README.md) para el catálogo de endpoints.
