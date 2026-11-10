# Hito 5–7: PLATA LIFE y Neon

## Decisión de datos
Neon es PostgreSQL administrado y almacena movimientos, entrenamientos y objetivos. La conexión se mantiene del lado del servidor. Esta entrega conserva Supabase Auth únicamente para identidad/sesión, no para guardar el ledger; se documenta como una decisión transitoria explícita.

## Dominio inicial
- `transactions`: ingresos y gastos en GTQ, categoría, nota y fecha.
- `workouts`: sesión, duración, notas y fecha.
- `wellness_goals`: base de datos para objetivos de finanzas, fitness o bienestar; las pantallas de gestión aún no están implementadas.

## Qué problema resuelve primero
Evitar que la persona tenga que usar una app para gastos y otra para recordar si entrenó: ofrece registro manual rápido, resumen del mes y lista reciente. La integración es opcional a nivel de producto: una persona puede usar solo finanzas o solo fitness. No se calcula salud, dieta ni asesoría financiera personalizada.

## Riesgos abiertos
1. Las tablas de Neon no tienen RLS de Postgres habilitado en esta migración. El aislamiento depende del backend privado y de que todas las consultas filtren por el ID de sesión. Por eso las credenciales de Neon jamás deben llegar al navegador; son obligatorias las pruebas multiusuario y la revisión de todas las rutas.
2. La identidad todavía depende de Supabase Auth. Neon no sustituye autenticación, correo ni recuperación de contraseña.
3. Aún faltan edición/eliminación de movimientos, exportación, presupuestos, borrado de cuenta, controles de abuso, pruebas, términos y privacidad.
4. Las estadísticas de entrenamiento son solo conteo y duración registrada; no equivalen a una evaluación médica ni a una recomendación de salud.
5. No hay IA en este hito. Primero se valida que las personas registren datos y obtengan valor real.
