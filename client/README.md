# Cliente web

## Scripts

- `npm run dev`: inicia Vite en `http://localhost:5173`.
- `npm run build`: genera el bundle de producción.
- `npm run lint`: comprueba el código con ESLint.
- `npm run preview`: previsualiza el bundle.

Durante el desarrollo, las peticiones a `/api` se redirigen al backend en `http://localhost:4000`.

## Vistas

- `/login`: acceso con correo/contraseña o Google.
- `/register`: alta tradicional de usuario y workspace.
- `/`: resumen interno de proyectos y sprints.
- `/projects/:projectId`: backlog, iteraciones y métricas del proyecto.
- `/sprints/:sprintId`: tablero Kanban editable y burndown.
- `/calendar`: agenda diaria, semanal y mensual; creación y edición de reuniones con Google Meet.
- `/reports`: métricas del portafolio, velocidad, riesgos, avance por proyecto y exportación CSV.
- `/settings`: perfil, estado de integración y conexión individual con Google Calendar.
- `/portal/:token`: reporte de solo lectura para el cliente.

Todas las vistas internas están protegidas. El portal del cliente es público por diseño y solo expone la información filtrada por su token.

El dashboard se actualiza cada 30 segundos, los proyectos cada 20, los sprints cada 15 y el portal público cada 45 segundos. El polling se pausa cuando la pestaña no está visible y todas las vistas permiten actualizar manualmente.
