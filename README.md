# SecureWallet — Billetera Electrónica Segura

**Examen Final — INF781 · Seguridad de Software**
**Docente:** M. Sc. Huáscar Fedor Gonzales Guzmán
**Gestion:** I/2026

---

## Autores

| Nombre | Rol |
|--------|-----|
| _Nombre del integrante 1_ | _backend_ |
| _Nombre del integrante 2_ | _frontend_ |
| _Nombre del integrante 3_ | _seguridad/pruebas_ |

---

## Descripcion

Aplicacion full-stack de billetera electronica que implementa controles de seguridad contra OWASP Top 10 (2021): autenticacion robusta, autorizacion granular (RBAC), proteccion de datos sensibles, trazabilidad de operaciones y defensa contra condiciones de carrera.

- **Backend:** Laravel 13 (PHP 8.3) + Sanctum + PostgreSQL
- **Frontend:** React + TypeScript + Vite + TailwindCSS
- **Arquitectura:** API REST desacoplada, comunicacion HTTP/JSON

---

## Instalacion y ejecucion

### Backend

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve --port=8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Usuarios de prueba (seeders)

| Rol | Nombre | Email | Contrasena |
|-----|--------|-------|-----------|
| ADMIN | Admin | admin@securewallet.com | Admin123!@# |
| USER | Juan Perez | juan@test.com | User1234!@ |
| USER | Maria Lopez | maria@test.com | User1234!@ |

---

## Controles de seguridad implementados (OWASP Top 10 2021)

| Codigo | OWASP | Control | Verificacion |
|--------|-------|---------|-------------|
| RS-01 | A01 - Broken Access Control | UUID publicos, prevencion IDOR | Manipular UUID de otro usuario devuelve 403/404 |
| RS-02 | A01 - Broken Access Control | RBAC (USER/ADMIN) + middleware 403 | Token USER en endpoint admin devuelve 403 |
| RS-03 | A02 - Cryptographic Failures | bcrypt cost >= 12, secrets ocultos en JSON | Ningun endpoint expone password o mfa_secret |
| RS-04 | A03 - Injection | Eloquent ORM + Form Requests con validacion estricta | SQL injection no cuela, campos extra ignorados |
| RS-05 | A04 - Insecure Design | Transacciones DB + FOR UPDATE + Idempotency-Key | 2 transfers concurrentes no generan saldo negativo |
| RS-06 | A05 - Security Misconfiguration | CORS restringido, errores genericos en produccion | CORS bloquea origenes no autorizados |
| RS-07 | A07 - Identification Failures | Access token 15 min, refresh con rotacion y deteccion de reuso | Refresh token reutilizado revoca toda la familia |
| RS-08 | A07 - Identification Failures | Rate limiting (5/min login, 10/min transfers) | Intento 6 en login devuelve 429 |
| RS-09 | A09 - Security Logging | Auditoria inmutable con IP, user-agent, solo ADMIN | Bitacora consultable solo por ADMIN |
| RS-10 | XSS / CSRF (transversal) | Salida escapada (React), Bearer tokens en localStorage | Sin innerHTML, auth via Bearer header |

---

## Estructura del proyecto

```
/
├── backend/                 API REST Laravel 13
│   ├── app/
│   │   ├── Http/Controllers/Api/   6 controladores
│   │   ├── Http/Requests/          Validacion de entrada (5 Form Requests)
│   │   ├── Http/Middleware/        AdminMiddleware (RBAC)
│   │   ├── Models/                 User, Wallet, Transaction, RefreshToken, AuditLog
│   │   └── Services/               AuditService (bitacora)
│   ├── database/
│   │   ├── migrations/     7 tablas
│   │   └── seeders/        3 usuarios + wallets
│   ├── routes/api.php      15 endpoints REST
│   └── config/             cors.php, sanctum.php
│
├── frontend/               React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/          Login, Register, Dashboard, Wallet, Transfer, Transactions, Admin
│   │   ├── components/     Layout, ProtectedRoute
│   │   └── lib/            API client, auth helpers
│   └── ...
│
├── SecureWallet-Postman.json  Coleccion Postman completa
├── .gitignore
└── README.md
```

---

## Endpoints de la API

| Metodo | Endpoint | Acceso | Descripcion |
|--------|----------|--------|-------------|
| POST | /api/v1/auth/register | Publico | Registro + CAPTCHA |
| POST | /api/v1/auth/login | Publico | Login (MFA si esta habilitado) |
| POST | /api/v1/auth/mfa/verify | Publico* | Verifica TOTP y emite tokens |
| POST | /api/v1/auth/mfa/enable | USER | Activar MFA + QR |
| POST | /api/v1/auth/refresh | Publico* | Rotar refresh token |
| POST | /api/v1/auth/logout | USER | Revocar tokens |
| GET | /api/v1/me | USER | Perfil autenticado |
| GET | /api/v1/wallet | USER | Saldo actual |
| POST | /api/v1/wallet/topup | USER | Recarga de saldo |
| POST | /api/v1/transfers | USER | Crear transferencia (Idempotency-Key) |
| POST | /api/v1/transfers/{uuid}/confirm | USER | Confirmar transferencia (+TOTP si >500 Bs) |
| GET | /api/v1/transactions | USER | Historial paginado |
| GET | /api/v1/admin/users | ADMIN | Listar usuarios |
| PATCH | /api/v1/admin/users/{uuid}/block | ADMIN | Bloquear/desbloquear |
| GET | /api/v1/admin/audit-logs | ADMIN | Bitacora de auditoria |

---

## Buenas practicas de seguridad aplicadas

1. **Principio de minima exposicion:** Solo se retornan UUIDs (nunca IDs numericos). Campos sensibles (password, mfa_secret) en $hidden del modelo.
2. **Defensa en profundidad:** Rate limiting + bloqueo de cuenta tras 5 intentos fallidos. Middleware de admin + abilities de Sanctum.
3. **Transacciones atomicas:** Toda operacion financiera usa DB::transaction() con lockForUpdate() para evitar condiciones de carrera.
4. **Idempotencia:** Cada transferencia requiere Idempotency-Key para evitar dobles cobros por reintentos.
5. **Rotacion de tokens:** Refresh token de un solo uso. Reutilizar uno ya rotado revoca toda la familia de tokens.
6. **Validacion estricta:** Form Requests en cada endpoint con tipos, rangos, formatos y proteccion contra mass assignment.
7. **Auditoria completa:** Bitacora inmutable (UPDATED_AT = null) que registra IP, user-agent y timestamp de cada operacion critica.
8. **Cifrado de contrasenas:** bcrypt con costo 12 (BCRYPT_ROUNDS=12).
9. **CORS restringido:** Solo el origen del frontend (localhost:5173) puede consumir la API.
10. **Separacion de responsabilidades:** Backend y frontend desacoplados. El servidor es el unico responsable de la autorizacion.

---

## Coleccion Postman

Importar `SecureWallet-Postman.json` en Postman/Insomnia. Incluye ejemplos de peticiones validas e invalidas para todos los endpoints.

---

## Notas importantes

- El archivo `.env` **no debe versionarse**. Usar `.env.example` como plantilla.
- En produccion, establecer `APP_DEBUG=false` para evitar fugas de informacion en errores.
- Los tokens se almacenan en localStorage. Las contrasenas deben cumplir: minimo 10 caracteres, mayuscula, minuscula, digito y simbolo.