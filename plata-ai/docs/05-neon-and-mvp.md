# Hito Neon — modelo real de PLATA LIFE

## Arquitectura
Supabase Auth autentica a la persona. El servidor resuelve su sesión y relaciona el UUID de Supabase con el UUID interno de `app_users` en Neon. Neon almacena los movimientos, las cuentas, presupuestos, metas y registros de fitness.

La cadena `DATABASE_URL` se mantiene exclusivamente en el servidor. Ningún endpoint acepta un `user_id` del navegador como autoridad: las consultas obtienen el ID interno desde la sesión validada y filtran todos los registros por `user_id`.

## Esquema Neon existente
El proyecto de Neon verificado contiene once tablas:
- `app_users`
- `financial_accounts`
- `financial_transactions`
- `transaction_categories`
- `budgets`
- `financial_goals`
- `exercises`
- `workout_routines`
- `routine_exercises`
- `workout_sessions`
- `workout_session_exercises`

La migración `neon/migrations/0001_plata_life.sql` pertenece al prototipo inicial y crea una estructura distinta. Se mantiene como referencia histórica, no como migración para el proyecto existente. No ejecutar en la base actual ni tratarla como fuente de verdad.

## Funcionalidad conectada en la rama de alineación
- Ingresos y gastos; resumen mensual de la base completa.
- Cuentas GTQ de efectivo, banco, ahorro, crédito y otras.
- Presupuestos con periodo y cálculo de gasto por categoría o total.
- Metas financieras con progreso.
- Edición y borrado/archivo de registros con filtro de propietario.
- Rutinas, ejercicios y sesiones asociadas a una rutina; al registrar una sesión se copian sus ejercicios.
- Validación de payloads y consultas parametrizadas.

## Riesgos y límites abiertos
1. RLS está desactivado en las once tablas. El aislamiento depende de Neon privado y del filtro de propietario en cada API. No declarar la app segura hasta pasar pruebas multiusuario de todos los endpoints.
2. No se ha probado una restauración de backups de Neon.
3. Las transferencias entre cuentas, exportación de datos, cierre/borrado de cuenta, rate limits, bitácora de auditoría y cumplimiento legal siguen pendientes.
4. Las métricas de fitness se limitan a registros; no son una evaluación médica ni recomendaciones de entrenamiento.
5. No hay IA conectada. No enviar movimientos financieros a un modelo por defecto.

## Criterio para abrir producción
Build y lint correctos, pruebas de persistencia en staging, pruebas con dos cuentas independientes y negativos de acceso cruzado, validación de las reglas de negocio y revisión de seguridad. Solo después configurar el dominio y promover a Vercel Production.
