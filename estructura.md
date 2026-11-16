# Análisis del backend y el frontend

## Alcance

Este documento describe la implementación que está presente en `backend/` y `frontend/`, no las funcionalidades que solo se mencionan en la documentación. La revisión fue estática: se inspeccionaron rutas, controladores, modelos, servicios, pantallas y configuración. No se ejecutaron pruebas ni se validó el comportamiento en producción.

## Resumen

El repositorio implementa una aplicación web para administrar equipos, solicitudes de préstamo, usuarios, categorías y mantenimientos. El backend ofrece una API REST con Express, TypeScript, Sequelize y PostgreSQL. El frontend es una SPA con React, TypeScript, Vite y React Router. La separación por capas es entendible y existen tipos compartidos en el frontend y documentación Swagger en el servidor.

Los puntos de mayor atención son la autorización: varias rutas protegidas solo validan que exista un JWT y no que el usuario tenga rol de administrador; además, hay operaciones públicas de usuarios. También hay una oportunidad importante de mejorar la consistencia transaccional de préstamos y el aislamiento de los datos de cada docente. La documentación general presenta funciones que no se encuentran en las pantallas o rutas actuales.

## Arquitectura y recorrido

```text
React → Axios (BACKEND_URL) → Express /api → controladores → Sequelize → PostgreSQL
```

1. `AuthContext` inicia sesión contra `/api/auth/login` y guarda token y usuario en `localStorage`.
2. El interceptor Axios agrega el token como `Authorization: Bearer ...`.
3. `ProtectedRoute` protege páginas en el navegador y puede restringirlas visualmente a administradores.
4. Express aplica `verificarToken` a algunos grupos de rutas. Los controladores consultan modelos Sequelize y responden JSON.

La protección del frontend mejora la navegación, pero no reemplaza la autorización del backend: una petición directa a la API debe tener las mismas restricciones.

## Backend

### Componentes

- `backend/src/index.ts`: crea Express, configura CORS y JSON, publica Swagger, monta rutas e inicia el servidor.
- `backend/src/config/database.ts`: construye Sequelize desde `DATABASE_URL`.
- `backend/src/models/`: define `Usuario`, `Categoria`, `Equipo`, `Prestamo` y `Mantenimiento`, junto con relaciones.
- `backend/src/routes/`: agrupa endpoints por recurso.
- `backend/src/controllers/`: concentra la lógica de lectura y modificación.
- `backend/src/middlewares/authMiddleware.ts`: valida JWT.

### Flujos implementados

- **Autenticación:** compara contraseña con bcrypt y firma JWT con vencimiento de 8 horas.
- **Inventario:** lista equipos con categoría, permite alta, edición y baja. La baja elimina el equipo y sus préstamos/mantenimientos asociados en una transacción.
- **Préstamos:** la solicitud comprueba que el equipo esté disponible y lo marca `Solicitado`; el administrador puede actualizar estados y registrar fechas desde el frontend.
- **Mantenimientos:** crea y actualiza registros con transacciones y sincronización del estado operativo del equipo.
- **Usuarios y categorías:** alta/consulta/edición de usuarios y consulta/alta de categorías, con los controles de ruta detallados abajo.

### Hallazgos y riesgos

1. **Falta autorización por rol en la API.** `verificarToken` solo valida la firma y guarda el payload en `req.user`; no comprueba `rol`. Rutas de edición/borrado de equipos, préstamos y usuarios, así como mantenimientos, quedan accesibles para cualquier usuario autenticado si conoce el endpoint. La restricción `requireAdmin` vive en el cliente y se puede eludir llamando a la API.
2. **Alta de usuario expuesta.** `POST /api/usuarios` está montada bajo `/api/usuarios` con autenticación general, pero la propia ruta `POST /` no agrega middleware y `createUsuario` permite enviar `rol`. Por lo tanto, una persona no autenticada podría crear una cuenta y solicitar el rol `admin` (el resultado exacto depende de las restricciones del modelo/base).
3. **Lecturas amplias de préstamos.** `GET /api/prestamos` devuelve la lista completa. `MisSolicitudes.tsx` descarga esa lista y filtra por `id_usuario` en el navegador. Esto expone datos de otros solicitantes y aumenta la carga; el filtro debe aplicarse en el servidor usando la identidad verificada del token.
4. **Identidad de solicitud confiada al body.** `crearSolicitud` usa `req.body` entero al crear el préstamo; el cliente también envía `id_usuario`. El servidor debería derivar el solicitante del JWT e ignorar el ID enviado por el cliente.
5. **Riesgo de estados desincronizados/concurrencia.** En préstamos, crear registro y actualizar equipo son operaciones separadas y sin transacción ni bloqueo. Dos solicitudes concurrentes podrían observar el mismo equipo como disponible. Al rechazar o devolver se vuelve a poner `Disponible` sin validar que ese préstamo sea el que mantiene ocupado el equipo o que exista un mantenimiento activo. La transición del estado del préstamo tampoco valida estados permitidos.
6. **Secreto de respaldo JWT.** El middleware y el login usan `secret_fallback` si `JWT_SECRET` falta. En producción debería exigirse una clave configurada y detener el arranque si no existe.
7. **Errores de arranque y conexión.** `sequelize.sync({ force: false })` se ejecuta al iniciar el servidor. El error de conexión se captura y registra, pero el proceso no falla explícitamente; el servidor puede quedar escuchando aunque la base no esté disponible. Conviene definir migraciones/versionado de esquema y una política clara de readiness.
8. **Validación de entrada poco uniforme.** Varios controladores pasan `req.body` directamente a Sequelize. Esto deja reglas, campos permitidos y mensajes de error dependientes del modelo y dificulta prevenir asignación masiva.
9. **CORS abierto por configuración por defecto.** `cors()` acepta solicitudes desde cualquier origen. Para una API de despliegue conviene limitar los orígenes permitidos mediante configuración.
10. **Documentación desactualizada.** `docs/API.md` describe nombres de campos, roles, permisos y endpoints que no coinciden completamente con los modelos/rutas actuales. Es más seguro tratar Swagger y el código vigente como fuente de verdad hasta actualizar esa guía.

## Frontend

### Componentes y pantallas

- `frontend/src/App.tsx`: rutas de login, dashboard, inventario, préstamos, usuarios, mantenimientos y solicitudes docentes.
- `context/AuthContext.tsx`: estado de sesión y persistencia de token/usuario.
- `services/`: cliente Axios y funciones por recurso.
- `pages/admin/`: panel de métricas y gestión administrativa.
- `pages/docente/`: solicitud de préstamo e historial propio (filtrado actualmente en cliente).
- `components/common/` y `components/layout/`: protección de páginas, modal, toast y estructura general.

El dashboard calcula sus métricas en el cliente a partir de listas cargadas desde la API. La UI separa en general las tareas de administración de las vistas docentes.

### Hallazgos y oportunidades

1. **Token persistido en `localStorage`.** Es sencillo de implementar, pero cualquier script ejecutado en el mismo origen podría leerlo. Para un sistema expuesto, evaluar cookie `HttpOnly`, `Secure` y `SameSite`, junto con protección CSRF según el diseño.
2. **No se valida sesión al restaurarla.** Al recargar, `AuthContext` confía en el token y usuario almacenados hasta que una llamada falle. No hay una operación de perfil/renovación que confirme el token antes de mostrar la sesión.
3. **El interceptor solo trata 401.** El backend también responde 403 cuando el token es inválido/expiró, por lo que el frontend puede dejar datos de sesión obsoletos en ese caso.
4. **`BACKEND_URL` requerida.** El frontend valida la configuración de la URL de API al iniciar; debe definirse en el entorno de compilación.
5. **Errores de carga poco visibles.** Dashboard e historial docente escriben errores en consola; en algunos casos el usuario puede quedar con una lista vacía sin explicación. Sería mejor mostrar estados de error y ofrecer reintento.
6. **Métricas y datos dependen de listas completas.** La solución es simple para volúmenes pequeños, pero filtros y agregaciones deberían pasar al servidor si crece el inventario.
7. **Servicios con funciones que parecen no respaldadas.** Por ejemplo, `equipoService.getById` y varios `getById` del cliente llaman rutas individuales que no se observan registradas para esos recursos. Revisar y alinear cliente con API.
8. **Tipos y contratos evolucionan por separado.** Las interfaces TypeScript ayudan, pero no validan las respuestas HTTP en tiempo de ejecución. Conviene centralizar DTOs/contratos o agregar validación al borde de la API.

## Diferencias con la documentación funcional

En `docs/PROYECTO.md` y `README.md` se anuncian QR, reservas, reportes/exportación Excel, notificaciones y métricas más amplias. En la implementación revisada no se encontraron módulos o dependencias que materialicen varias de esas funciones: no hay modelo/rutas/pantallas de reservas, generación/escaneo QR ni exportación Excel. El sistema actual cubre principalmente inventario, préstamo y mantenimiento.

También existe una discrepancia de terminología: la documentación menciona estados y campos distintos a los que usa el código. Por ejemplo, los equipos usan `Disponible`, `Solicitado`, `Prestado`, `Mantenimiento`; préstamos usan estados en minúscula como `pendiente`, `aprobado`, `entregado`, `devuelto` y `rechazado`.

## Prioridades sugeridas

1. **Cerrar autorización:** agregar middleware de rol administrador en endpoints administrativos; restringir el alta de usuarios; derivar identidad del JWT; filtrar préstamos en el servidor.
2. **Asegurar consistencia:** validar transiciones de estado y hacer atómicos los cambios de préstamo/equipo con transacciones y bloqueo apropiado.
3. **Endurecer configuración:** exigir `JWT_SECRET`, restringir CORS, validar variables de entorno y definir health/readiness de base de datos.
4. **Formalizar contratos:** validar payloads, actualizar `docs/API.md` y eliminar o implementar endpoints que el cliente presupone.
5. **Mejorar sesión y UX de errores:** manejar 401/403 en forma coherente y mostrar errores/reintentos en las pantallas.
6. **Alinear alcance:** actualizar la documentación de producto o planificar explícitamente QR, reservas y exportaciones como funcionalidades futuras.

## Referencias de código

- Backend: [`backend/src/index.ts`](backend/src/index.ts), [`backend/src/middlewares/authMiddleware.ts`](backend/src/middlewares/authMiddleware.ts), [`backend/src/controllers/prestamoController.ts`](backend/src/controllers/prestamoController.ts), [`backend/src/controllers/usuarioController.ts`](backend/src/controllers/usuarioController.ts), [`backend/src/models/Equipo.ts`](backend/src/models/Equipo.ts).
- Frontend: [`frontend/src/App.tsx`](frontend/src/App.tsx), [`frontend/src/context/AuthContext.tsx`](frontend/src/context/AuthContext.tsx), [`frontend/src/services/api.ts`](frontend/src/services/api.ts), [`frontend/src/pages/docente/MisSolicitudes.tsx`](frontend/src/pages/docente/MisSolicitudes.tsx).
- Documentación existente: [`docs/PROYECTO.md`](docs/PROYECTO.md), [`docs/API.md`](docs/API.md).
