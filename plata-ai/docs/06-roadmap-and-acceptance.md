# PLATA LIFE — fases pendientes y criterios de aceptación

## Implementado en la rama feat/plata-life-neon-alignment (código fuente, no certificado)
- Alineación de APIs financieras y de fitness con las tablas reales del proyecto Neon de PLATA LIFE.
- Mapeo de identidad Supabase → UUID interno de app_users.
- Registro de ingresos/gastos, cuentas GTQ, presupuestos y metas.
- Edición/eliminación de movimientos, entrenamientos, metas y presupuestos con filtro de propietario.
- Resúmenes mensuales y saldos de cuentas calculados en SQL.
- Workflow de CI para lint y build.

## Fase 1 — Verificación técnica (pendiente)
- Instalar dependencias en CI y comprobar lint y build.
- Corregir todos los errores y advertencias de TypeScript/ESLint.
- Pruebas de API con sesión válida, ausente, expirada y payloads inválidos.
- Pruebas de aislamiento de dos usuarios para cada GET/PATCH/DELETE/POST.
- Persistencia: crear, actualizar, recargar y borrar registros en un proyecto de prueba.
- Verificar cálculos con movimientos, cuentas, transferencias y límites de periodo.

## Fase 2 — Fitness completo (pendiente)
- Crear y editar rutinas.
- Catálogo de ejercicios y asociación de ejercicios a rutinas.
- Registrar sesiones con ejercicios, series, repeticiones y descanso.
- Historial por rutina y métricas descriptivas, sin recomendaciones médicas.

## Fase 3 — Operación segura (pendiente)
- Rate limiting por usuario e IP para endpoints sensibles.
- Exportación y borrado de cuenta con flujo verificado y retención documentada.
- Auditoría de cambios financieros y reglas de conciliación de cuentas.
- Logs sin PII ni secretos, alertas y monitoreo.
- Backups automáticos y prueba real de restauración.

## Fase 4 — Preparación comercial y legal (pendiente)
- Política de privacidad, términos, consentimiento y avisos claros sobre el alcance del producto.
- Definir soporte, retención, recuperación de cuentas y respuesta a incidentes.
- Revisar dependencias y controles de seguridad con herramientas externas.

## Fase 5 — Despliegue (pendiente)
- Crear proyecto PLATA LIFE en Vercel.
- Configurar variables separadas para Preview y Production desde las cuentas del propietario.
- Verificar Supabase Auth Site URL, Redirect URLs y confirmación de correo.
- Probar la rama como Preview con datos no reales.
- Conectar el dominio solo después de validar flujos y controles.

## Fase 6 — IA (intencionalmente aplazada)
- Definir una función concreta, opt-in y medible.
- Minimizar datos; no enviar transacciones completas por defecto.
- Separar cálculo financiero determinista de cualquier explicación del modelo.
- Mostrar límites y fuentes; no ofrecer consejos financieros regulados ni prometer resultados.

## Criterio de salida a producción
No declarar la aplicación lista hasta que las fases 1–5 se hayan ejecutado en un entorno aislado con resultados reproducibles. La nueva UI y los endpoints añadidos no acreditan una compilación o prueba funcional que aún no se haya ejecutado.
