# SecureWallet - Billetera Electrónica Segura

Proyecto integrador para INF781 · Seguridad de Software.

## Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Backend | Laravel 13 + Sanctum (PHP 8.3) |
| Frontend | React + TypeScript + Vite + TailwindCSS |
| Base de datos | PostgreSQL |
| Autenticación | Sanctum (Bearer tokens) + Refresh tokens con rotación |
| MFA/TOTP | Google Authenticator (pragmarx/google2fa) |

## Requisitos

- PHP >= 8.3
- Composer
- Node.js >= 20
- PostgreSQL

## Instalación y Ejecución

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd securewallet
```

### 2. Configurar Backend

```bash
cd backend
cp .env.example .env
# Editar .env con credenciales de BD
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve --port=8000
```

### 3. Configurar Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible en `http://localhost:5173`.

## Variables de Entorno (.env)

Ver `.env.example` para todas las variables requeridas.

## Usuarios de Prueba (Seeders)

| Rol | Nombre | Email | Contraseña |
|---|---|---|---|
| ADMIN | Admin | admin@securewallet.com | Admin123!@# |
| USER | Juan Perez | juan@test.com | User1234!@ |
| USER | Maria Lopez | maria@test.com | User1234!@ |

Todos los usuarios tienen saldo inicial de 1000.00 Bs.

## Endpoints de la API

Prefijo base: `/api/v1`

### Autenticación
| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| POST | /auth/register | Público | Registro + CAPTCHA |
| POST | /auth/login | Público | Login (MFA si habilitado) |
| POST | /auth/mfa/verify | Público* | Verifica TOTP |
| POST | /auth/refresh | Público* | Rota refresh token |
| POST | /auth/logout | USER | Revoca tokens |
| POST | /auth/mfa/enable | USER | Activa MFA |

### Perfil y Cartera
| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| GET | /me | USER | Perfil autenticado |
| GET | /wallet | USER | Saldo actual |
| POST | /wallet/topup | USER | Recarga de saldo |

### Transferencias
| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| POST | /transfers | USER | Crear transferencia |
| POST | /transfers/{uuid}/confirm | USER | Confirmar transferencia |
| GET | /transactions | USER | Historial paginado |

### Admin
| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| GET | /admin/users | ADMIN | Listar usuarios |
| PATCH | /admin/users/{uuid}/block | ADMIN | Bloquear/desbloquear |
| GET | /admin/audit-logs | ADMIN | Bitácora de auditoría |

## Controles de Seguridad Implementados

| Código | OWASP | Control |
|---|---|---|
| RS-01 | A01 - Broken Access Control | UUID públicos, IDOR prevenido (cada usuario solo ve sus datos) |
| RS-02 | A01 - Broken Access Control | RBAC (USER/ADMIN) con middleware verificador en servidor |
| RS-03 | A02 - Cryptographic Failures | bcrypt cost=12, TOTP secret nunca expuesto en JSON |
| RS-04 | A03 - Injection | Eloquent ORM con parámetros enlazados, Form Requests con validación |
| RS-05 | A04 - Insecure Design | Transacciones DB con FOR UPDATE, Idempotency-Key |
| RS-06 | A05 - Security Misconfiguration | CORS restringido, helmet, errores genéricos en producción |
| RS-07 | A07 - Identification Failures | Access token 15 min, refresh token con rotación y detección de reúso |
| RS-08 | A07 - Identification Failures | Rate limiting (5/min login, 10/min transfers), CAPTCHA en registro |
| RS-09 | A09 - Security Logging | Auditoría inmutable con IP, user-agent, consultable solo por ADMIN |
| RS-10 | XSS/CSRF | React con salida escapada, tokens por Bearer header |
