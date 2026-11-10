# PLATA LIFE — fases pendientes y criterios de aceptación

## Fase 1 — Aplicar el lenguaje visual (trabajo realizado en esta entrega)
- Paleta oscura verde/negro con acento verde neón.
- Landing con identidad PLATA LIFE y mensaje Finanzas + Fitness + Tú.
- Dashboard y formularios adaptados al tema visual.
- Icono propio provisional para el futuro asistente; no representa una integración de IA activa.
- Responsive básico existente y ajustes para móvil.

## Fase 2 — Configuración del entorno (pendiente, requiere acciones en cuentas del propietario)
- Crear/configurar Neon y ejecutar `neon/migrations/0001_plata_life.sql`.
- Configurar Supabase Auth y variables privadas a partir de `.env.example`.
- No pegar secretos en chats ni subir `.env.local` al repositorio.
- Confirmar que el despliegue de Vercel usa variables de entorno separadas por Preview/Production.

## Fase 3 — Pruebas técnicas (pendiente)
- Instalar dependencias, ejecutar lint y build.
- Pruebas de API para entradas inválidas, errores de DB y usuario no autenticado.
- Pruebas de aislamiento con dos usuarios: ninguna consulta puede devolver datos ajenos.
- Pruebas de persistencia: crear registro, recargar y verificar en Neon.
- Pruebas de responsive en 320/375/768/1024 px y accesibilidad de teclado/contraste.

## Fase 4 — Producto funcional (pendiente)
- Editar/eliminar movimientos con confirmación y registro de auditoría.
- Cuentas, presupuestos, categorías configurables y filtros por periodo.
- Fitness: rutinas, ejercicios, series/repeticiones y metas de hábito.
- Exportación y borrado de datos; política de privacidad y términos.

## Fase 5 — Operación segura (pendiente)
- Límites de tasa, validación consistente, mensajes de error sin filtrar secretos, logs sin datos sensibles.
- Backups y prueba real de restauración; monitoreo y alertas.
- Revisión de permisos y dependencias.

## Fase 6 — IA (intencionalmente aplazada)
- Definir una tarea específica y medible antes de conectar un modelo.
- Consentimiento explícito, minimización de datos y no enviar transacciones completas por defecto.
- Separar el servicio IA del cálculo financiero determinista; mostrar fuentes y límites.
- No lanzar recomendaciones financieras como hechos ni fingir OCR de recibos, chat o conexión con proveedor antes de probarlos.

## Criterio de salida a producción
No declarar la aplicación lista hasta que las fases 2–5 pasen en un entorno de prueba con resultados reproducibles. El diseño visual implementado no significa que el backend esté configurado o que la app esté desplegada.
