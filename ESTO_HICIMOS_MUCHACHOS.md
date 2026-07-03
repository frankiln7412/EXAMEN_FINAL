# 🚀 SecureWallet - ¡Esto hicimos muchachos!

## Proyecto: Billetera Electrónica Segura
**Examen Final — INF781 · Seguridad de Software**
**Docente:** M. Sc. Huáscar Fedor Gonzales Guzmán
**Gestión:** I/2026

---

## ✅ ¿Qué hicimos?

Desarrollamos **SecureWallet**, una billetera electrónica completa con:

### Backend (API REST)
- **Laravel 13 + Sanctum** (PHP 8.3)
- **PostgreSQL** como base de datos
- 15 endpoints REST bajo `/api/v1`

### Frontend (Web SPA)
- **React + TypeScript + Vite + TailwindCSS**
- Interfaz profesional con diseño responsivo
- Consume la API del backend

---

## 📋 Funcionalidades implementadas (RF-01 a RF-10)

| # | Funcionalidad | Estado |
|---|---|---|
| RF-01 | Registro con CAPTCHA + creación automática de billetera | ✅ |
| RF-02 | Login con bloqueo tras 5 intentos fallidos (15 min) | ✅ |
| RF-03 | MFA/TOTP con Google Authenticator (código QR) | ✅ |
| RF-04 | Consulta de saldo y perfil | ✅ |
| RF-05 | Recarga de saldo simulada | ✅ |
| RF-06 | Transferencia entre usuarios (mín 1 Bs, máx 5000 Bs) | ✅ |
| RF-07 | Confirmación en 2 pasos (+ TOTP si > 500 Bs) | ✅ |
| RF-08 | Historial paginado con filtros | ✅ |
| RF-09 | Panel ADMIN: usuarios, bloqueo, bitácora | ✅ |
| RF-10 | Logout con revocación de tokens | ✅ |

---

## 🔒 Controles de seguridad implementados (RS-01 a RS-10)

| # | OWASP | Control | Estado |
|---|---|---|---|
| RS-01 | A01 - Broken Access Control | UUID públicos, IDOR prevenido | ✅ |
| RS-02 | A01 - Broken Access Control | RBAC (USER/ADMIN) con middleware | ✅ |
| RS-03 | A02 - Cryptographic Failures | bcrypt cost=12, secretos nunca expuestos | ✅ |
| RS-04 | A03 - Injection | Eloquent ORM + validación estricta | ✅ |
| RS-05 | A04 - Insecure Design | Transacciones FOR UPDATE + Idempotency-Key | ✅ |
| RS-06 | A05 - Security Misconfiguration | CORS, errores genéricos en producción | ✅ |
| RS-07 | A07 - Identification Failures | Access token 15 min, refresh con rotación | ✅ |
| RS-08 | A07 - Identification Failures | Rate limiting (5/min login, 10/min transfers) | ✅ |
| RS-09 | A09 - Security Logging | Auditoría con IP, user-agent, solo ADMIN | ✅ |
| RS-10 | XSS/CSRF | React con salida escapada, Bearer tokens | ✅ |

---

## 🧪 Usuarios de prueba

| Rol | Nombre | Email | Contraseña | Saldo inicial |
|---|---|---|---|---|
| **ADMIN** | Admin | admin@securewallet.com | Admin123!@# | 1000 Bs |
| **USER** | Juan Perez | juan@test.com | User1234!@ | 1000 Bs |
| **USER** | Maria Lopez | maria@test.com | User1234!@ | 1000 Bs |

---

## 📂 Estructura del proyecto

```
C:\Examen_final_INF781\
├── backend/                  ← API REST Laravel 13
│   ├── app/
│   │   ├── Controllers/Api/  ← 6 controladores
│   │   ├── Models/           ← User, Wallet, Transaction, RefreshToken, AuditLog
│   │   ├── Http/Requests/    ← Validación de entrada
│   │   ├── Middleware/       ← AdminMiddleware
│   │   └── Services/         ← AuditService
│   ├── routes/api.php        ← 15 endpoints
│   ├── database/
│   │   ├── migrations/       ← 8 tablas
│   │   └── seeders/          ← 3 usuarios + wallets
│   └── SecureWallet-Postman.json  ← Colección Postman
│
├── frontend/                 ← React + TypeScript + Vite
│   └── src/
│       ├── components/       ← Layout
│       ├── pages/            ← Login, Register, Dashboard, Wallet, Transfer, etc.
│       └── lib/              ← API client, Auth helpers
│
├── INF781-Examen-Final.pdf   ← Examen original
└── ESTO_HICIMOS_MUCHACHOS.md ← Este archivo
```

---

## 🚀 Cómo ejecutar el proyecto

### 1. Iniciar Backend
```bash
cd backend
php artisan serve --port=8000
```
La API corre en: **http://localhost:8000**

### 2. Iniciar Frontend
```bash
cd frontend
npm run dev
```
El frontend corre en: **http://localhost:5173**

---

## 📤 Entregables para el Licenciado

### ✅ Lo que ya está listo:
1. **Código fuente completo** (backend + frontend)
2. **Base de datos** migrada y seedeada con usuarios de prueba
3. **README.md** con instrucciones de instalación (dentro de `/backend/`)
4. **Colección Postman** (`SecureWallet-Postman.json`) con endpoints válidos e inválidos
5. **Controles de seguridad** RS-01 a RS-10 implementados y verificados

### 📌 Pendiente de hacer (para la entrega final):
1. **Subir a GitHub** el repositorio con las carpetas `/backend` y `/frontend`
2. **Crear el video** demostrando el flujo completo + un ataque rechazado
3. **Preparar la defensa oral** individual:
   - Saber explicar cada control OWASP implementado
   - Poder modificar código en vivo (cambiar rate limit, costo bcrypt, etc.)
   - Responder preguntas conceptuales de seguridad

### 🎯 Tips para la defensa:
- El Licenciado va a hacer **ataques con Postman/curl** para probar:
  - IDOR (manipular UUIDs de otros usuarios) → debe dar 403/404
  - Acceder a admin sin rol → debe dar 403
  - Reutilizar refresh token → debe revocar toda la familia
  - Rate limiting → 429 después de muchos intentos
  - Condiciones de carrera → saldos nunca negativos
- Todos los integrantes deben saber **TODO el código**, no solo su parte
- Estudien el OWASP Top 10 (2021) - preguntarán conceptos
- Pueden usar IA para desarrollar, pero en la defensa NO - si no saben explicar, anula la nota

---

**¡Suerte muchachos! 🎉 Si necesitan ayuda con la defensa o ajustes, avisen.**
