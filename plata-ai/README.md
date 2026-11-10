# PLATA LIFE — finanzas personales + fitness

Base de producto para Guatemala, móvil primero y en español. Este hito incorpora registro de movimientos financieros y entrenamientos, resumen mensual calculado desde registros reales, endpoints autenticados y una base PostgreSQL en Neon. No contiene un chatbot ni simula recomendaciones de IA.

## Arquitectura actual
- **Aplicación:** Next.js 15 + TypeScript.
- **Base de datos de aplicación:** Neon PostgreSQL (`DATABASE_URL`, exclusivamente servidor).
- **Sesiones e identidad temporal de esta iteración:** Supabase Auth. Neon no ofrece por sí solo un proveedor de identidad; esta separación evita exponer datos y permite sustituir el proveedor de autenticación en una fase posterior sin mover la base de datos.
- **Datos:** `transactions`, `workouts`, `wellness_goals` y tabla mínima de identidad futura `app_users`.
- **Seguridad API:** exige sesión, usa consultas parametrizadas, valida entradas y añade `user_id` desde la sesión; nunca confía en un `user_id` enviado por el cliente.

## Configuración local
Requisitos: Node.js 20.9+ y npm.

1. Crea un proyecto PostgreSQL en Neon y copia la cadena de conexión pooled desde **Connect**.
2. En Neon SQL Editor, ejecuta `neon/migrations/0001_plata_life.sql`.
3. Copia `.env.example` a `.env.local`. Completa `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. En Supabase Auth, configura Site URL y Redirect URLs para `http://localhost:3000` y `/auth/callback`.
5. Ejecuta `npm install`, `npm run dev` y visita `http://localhost:3000`.
6. Verifica registro/login; añade un ingreso, un gasto y un entrenamiento; refresca la página; confirma que los datos persisten y que otra cuenta no puede verlos.

## Endpoints implementados
- `GET /api/transactions` y `POST /api/transactions`
- `GET /api/workouts` y `POST /api/workouts`

Las rutas limitan resultados a los registros del usuario autenticado. Los endpoints devuelven errores explícitos cuando falta la migración o la conexión, no datos falsos.

## Estado honesto de entrega
**Implementado en el código:** UI conjunta de finanzas + fitness, formularios, resúmenes derivados de los registros, endpoints y migración SQL para Neon.

**No verificado aquí:** conexión a una cuenta real de Neon/Supabase, instalación de dependencias, compilación, pruebas automatizadas, despliegue, pruebas de aislamiento con dos usuarios o auditoría de seguridad externa. No se debe ingresar información financiera real ni anunciarlo como listo para producción hasta pasar estas pruebas.

## Diseño visual elegido — PLATA LIFE
La interfaz sigue el primer concepto aprobado: fondo verde-negro, acentos verde neón, tarjetas oscuras, bordes discretos y enfoque móvil. Se añadió una identidad gráfica propia para el futuro asistente (símbolo de destello/bot), sin usar logotipos de terceros ni fingir que la IA ya está conectada. Las cifras de la landing son ilustrativas; el dashboard autenticado calcula cifras desde los registros del usuario.

## Próximas fases recomendadas
1. Configurar credenciales y ejecutar build + pruebas de integración en un entorno de prueba.
2. Añadir pruebas automatizadas de aislamiento multiusuario y validación, borrado/exportación de datos, límites/rate limiting y logging sin datos sensibles.
3. Completar categorías personalizables, cuentas, presupuestos, rutinas con series/repeticiones y objetivos compartidos de bienestar.
4. Agregar controles de privacidad, política de datos, backups/restauración y monitoreo.
5. Solo después, evaluar IA con una tarea concreta y medible; no conectar información financiera a modelos por defecto.
