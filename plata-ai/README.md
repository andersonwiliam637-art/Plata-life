# PLATA LIFE — finanzas personales + fitness

Aplicación web mobile-first para Guatemala, con interfaz en español y moneda base GTQ. PLATA LIFE combina control de dinero, cuentas, presupuestos, metas de ahorro y registro de actividad física.

## Arquitectura

- **Frontend y API:** Next.js 15 App Router + TypeScript + React 19.
- **Despliegue previsto:** Vercel, conectado a este repositorio de GitHub.
- **Autenticación:** Supabase Auth. El servidor valida cada sesión con `getUser()`.
- **Base de datos de aplicación:** Neon PostgreSQL. La conexión `DATABASE_URL` existe solo en el servidor.
- **Identidad interna:** `app_users` enlaza `auth_provider='supabase'` y el UUID de Supabase con el UUID interno usado por las tablas de Neon.

## Esquema Neon verificado

El proyecto Neon conectado de PLATA LIFE contiene estas 11 tablas: `app_users`, `financial_accounts`, `financial_transactions`, `transaction_categories`, `budgets`, `financial_goals`, `exercises`, `workout_routines`, `routine_exercises`, `workout_sessions` y `workout_session_exercises`.

**Advertencia de migraciones:** `neon/migrations/0001_plata_life.sql` es un esquema antiguo del starter y NO representa este esquema real de 11 tablas. No lo ejecutes sobre la base actual. Las API de esta rama se alinean con las tablas verificadas en el proyecto Neon existente. Una instalación nueva necesita una migración inicial nueva, revisada y probada por separado.

## Funcionalidad conectada en esta rama de trabajo

- Registro e inicio de sesión por Supabase Auth.
- Registro de ingresos y gastos en cuentas propiedad de la persona autenticada.
- Resumen mensual de ingresos y gastos calculado por Neon sobre el ledger completo, no solo sobre la lista reciente.
- Administración de cuentas: efectivo, banco, ahorro, crédito y otras. Archivar conserva el historial.
- Edición y eliminación de movimientos y sesiones con comprobación del propietario.
- Registro de sesiones de entrenamiento con duración, fecha y notas.
- Creación, visualización y eliminación de presupuestos y metas financieras.
- Las cifras del landing son ilustrativas y se identifican como tales; el panel autenticado usa datos de la cuenta.

## Configuración local

Requisitos: Node.js 20.9+ y npm.

1. Copia `.env.example` a `.env.local`.
2. Configura `DATABASE_URL` con la conexión pooled de Neon. Nunca la marques como `NEXT_PUBLIC_*`.
3. Configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (o la publishable key compatible).
4. En Supabase Auth, configura Site URL y Redirect URLs para el origen local y `/auth/callback`.
5. En `plata-ai/`, ejecuta `npm install`, `npm run dev` y visita `http://localhost:3000`.

## Endpoints principales

- `/api/transactions`: GET/POST.
- `/api/transactions/[id]`: PATCH/DELETE.
- `/api/accounts`: GET/POST.
- `/api/accounts/[id]`: PATCH y archivado mediante DELETE.
- `/api/budgets` y `/api/budgets/[id]`: GET/POST/PATCH/DELETE.
- `/api/goals` y `/api/goals/[id]`: GET/POST/PATCH/DELETE.
- `/api/workouts`: GET/POST.
- `/api/workouts/[id]`: PATCH/DELETE.

Todas las rutas de datos verifican la sesión Supabase, resuelven el usuario interno Neon en el servidor y filtran por ese ID. No se confía en un `user_id` recibido del navegador. Las consultas se parametrizan mediante el cliente Neon.

## Límites de seguridad y estado de producción

El esquema Neon actual tiene RLS desactivado en las 11 tablas. La defensa en esta arquitectura depende de que Neon solo sea accesible por `DATABASE_URL` del servidor y de que cada ruta aplique siempre el filtro de propietario. Esto requiere pruebas específicas multiusuario antes de producción. No pongas `DATABASE_URL` en el cliente ni en variables `NEXT_PUBLIC_*`.

**No está certificado para producción todavía.** Aún falta ejecutar instalación, lint, build, pruebas de rutas con dos usuarios, pruebas de persistencia en el Neon del propietario, revisión de seguridad, límites de tasa, exportación/borrado de datos, backups con una restauración probada, política de privacidad y términos. Las credenciales reales de Supabase/Neon no están presentes en el repositorio y no se han solicitado en el chat.

## CI y despliegue

La rama `feat/plata-life-neon-alignment` incorpora un workflow GitHub Actions para instalar, ejecutar ESLint y compilar Next.js. La aplicación aún no se ha desplegado ni conectado a un proyecto Vercel de PLATA LIFE en el equipo actualmente conectado. El despliegue debe hacerse primero como Preview, con variables de Preview, y validarse antes de conectar el dominio de producción.

## IA

El asistente y la lectura inteligente de recibos son conceptos futuros. No hay un modelo IA conectado en esta versión. No se envían datos financieros personales a un modelo.
