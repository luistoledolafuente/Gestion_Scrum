# API

## Scripts

- `npm run dev`: servidor con recarga en caliente.
- `npm run build`: genera Prisma Client y compila TypeScript.
- `npm start`: ejecuta la compilación.
- `npm run prisma:migrate -- --name nombre`: crea/aplica migraciones.
- `npm run prisma:studio`: abre Prisma Studio.

## Variables de entorno

Usa `.env.example` como referencia para la base de datos, sesiones y Google OAuth.

Variables principales:

- `DATABASE_URL`: conexión PostgreSQL.
- `CLIENT_ORIGIN`: origen exacto del frontend, sin barra final.
- `TOKEN_ENCRYPTION_KEY`: clave aleatoria privada de al menos 32 caracteres para cifrar los tokens de Calendar.
- `SESSION_DAYS`: duración de la sesión.
- `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`: credenciales OAuth del cliente web.
- `GOOGLE_LOGIN_REDIRECT_URI`: callback para iniciar sesión con Google.
- `GOOGLE_CALENDAR_REDIRECT_URI`: callback para vincular Calendar.

`GOOGLE_ACCESS_TOKEN`, `GOOGLE_REFRESH_TOKEN` y `GOOGLE_REDIRECT_URI` se conservan únicamente como compatibilidad con la integración anterior de una sola cuenta. Para el flujo multiusuario no son necesarios: cada usuario conecta su cuenta desde el dashboard y sus tokens se almacenan cifrados.

Si las credenciales Google están vacías, el registro con correo y el calendario interno siguen funcionando.

## Configuración manual de Google Cloud

Codex no modifica esta configuración. Haz estos pasos en tu proyecto de Google Cloud:

1. En **APIs y servicios > Biblioteca**, habilita **Google Calendar API**.
2. En **Google Auth Platform > Branding**, completa nombre de la aplicación, correo de soporte y datos de contacto.
3. En **Audience**, usa **External** si podrán registrarse personas ajenas a tu organización. Mientras la app esté en modo de prueba, agrega los correos que la probarán en **Test users**.
4. En **Data Access**, agrega el permiso de Calendar `https://www.googleapis.com/auth/calendar.events`. Los permisos `openid`, `email` y `profile` se solicitan para el login.
5. En **Clients**, abre o crea un cliente OAuth de tipo **Web application**.
6. Agrega como origen JavaScript autorizado para desarrollo: `http://localhost:5173`.
7. Agrega exactamente estos dos redirect URIs autorizados:

   ```text
   http://localhost:4000/api/auth/google/callback
   http://localhost:4000/api/integrations/google/callback
   ```

8. Copia el Client ID y Client Secret a `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en `server/.env`. No los coloques en el frontend ni los publiques en Git.
9. Reinicia el backend. Prueba primero **Continuar con Google** y después, dentro de **Configuración**, **Conectar Google Calendar**.

En producción sustituye localhost por tus dominios HTTPS y registra los dos callbacks equivalentes. Las URLs deben coincidir carácter por carácter con las variables del servidor.

## Endpoints

Todos viven bajo `/api`.

| Recurso | Rutas |
| --- | --- |
| Autenticación | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `GET /auth/google/start`, `GET /auth/google/callback` |
| Integración Google | `GET /integrations/google/status`, `POST /integrations/google/connect`, `GET /integrations/google/callback`, `DELETE /integrations/google/connection` |
| Workspaces | `GET /workspaces/current`, `GET/POST /workspaces/current/members`, `PATCH/DELETE /workspaces/current/members/:memberId` |
| Clientes | `GET/POST /clients`, `GET/PATCH/PUT/DELETE /clients/:id` |
| Proyectos | `GET/POST /projects`, `GET/PATCH/PUT/DELETE /projects/:id` |
| Sprints | `GET/POST /sprints`, `GET/PATCH/PUT/DELETE /sprints/:id` |
| Backlog | `GET/POST /backlog-items`, `GET/PATCH/PUT/DELETE /backlog-items/:id` |
| Items de sprint | `GET/POST /sprint-items`, `GET/PATCH/PUT/DELETE /sprint-items/:id` |
| Retrospectivas | `GET/POST /retrospectives`, `GET/PATCH/PUT/DELETE /retrospectives/:id` |
| Calendario | `GET/POST /calendar-events`, `GET/PATCH/DELETE /calendar-events/:id` |
| Métricas | `GET /metrics/sprint/:id` |
| Reportes | `GET /reports/portfolio` |
| Portal público | `GET /client-portal/:token` |
| Salud | `GET /health` |

Salud, autenticación y portal público son las únicas rutas que no requieren una sesión previa. La cookie de sesión es `httpOnly`, se valida en el backend y Axios envía credenciales automáticamente.

Las peticiones internas incluyen `X-Workspace-Id`. El backend comprueba que el usuario sea miembro antes de devolver datos. Los roles `OWNER`, `ADMIN`, `EDITOR` y el rol heredado `MEMBER` pueden modificar; `CLIENT` solo puede leer. Clientes, proyectos, sprints, backlog, reuniones, métricas y reportes quedan filtrados por el workspace activo.

Los listados de sprints, backlog e items aceptan `projectId` o `sprintId` como query param según corresponda. En los items del backlog, `isKey: true` publica el item como hito en el portal del cliente.

El calendario acepta `projectId`, `clientId`, `start` y `end` como filtros. Envía `createGoogleMeet: true` para generar una videollamada única e `inviteClient: true` para invitar al correo del cliente asociado. `DELETE` conserva el registro interno con estado `CANCELLED` y elimina el evento vinculado de Google cuando corresponde.
