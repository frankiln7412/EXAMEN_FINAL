# 📋 GUÍA DE PRESENTACIÓN — EXAMEN FINAL INF781
## SecureWallet - Billetera Electrónica Segura

---

## 📌 ANTES DE EMPEZAR

### 1. Iniciar el Backend
```bash
cd backend
php artisan serve --port=8000
```
Dejar corriendo en: **http://localhost:8000**

### 2. Iniciar el Frontend
```bash
cd frontend
npm run dev
```
Abrir en navegador: **http://localhost:5173**

### 3. Importar Postman
- Abre Postman
- Click **Import** → selecciona `SecureWallet-Postman.json` (está en la carpeta `backend/`)
- Se cargarán todos los endpoints con ejemplos

---

## 📌 FLUJO FUNCIONAL (RF-01 a RF-10)

### 🔹 1. REGISTRO (RF-01)
**Postman:** `Auth → Register`
```json
{
  "name": "Nuevo Usuario",
  "ci": "55555555",
  "email": "nuevo@test.com",
  "phone": "70555555",
  "password": "MiPassword1!",
  "captcha_token": "test-captcha"
}
```
**Esperado:** 201 Created, te devuelve tokens y datos del usuario.

---

### 🔹 2. LOGIN (RF-02)
**Postman:** `Auth → Login`
```json
{
  "email": "juan@test.com",
  "password": "User1234!@"
}
```
**Esperado:** 200 OK, devuelve access_token + refresh_token

> **Prueba de bloqueo:** Enviar 5 veces seguidas con contraseña incorrecta. La 6ta debe dar **423 Account blocked**.

---

### 🔹 3. VER PERFIL (RF-04)
**Postman:** `Profile & Wallet → Get Profile`
**Esperado:** 200 OK, muestra nombre, email, rol, saldo de la billetera.

---

### 🔹 4. VER SALDO (RF-04)
**Postman:** `Profile & Wallet → Get Wallet Balance`
**Esperado:** 200 OK, `{ "uuid": "...", "balance": "1000.00" }`

---

### 🔹 5. RECARGAR SALDO (RF-05)
**Postman:** `Profile & Wallet → Top Up`
```json
{ "amount": 500.00 }
```
**Esperado:** 201 Created, el saldo aumenta y se registra el movimiento.

---

### 🔹 6. TRANSFERENCIA (RF-06)
**Postman:** `Transfers → Create Transfer`
```json
{
  "destinatario": "maria@test.com",
  "monto": 100.00,
  "descripcion": "Pago almuerzo"
}
```
**Headers:** `Idempotency-Key: 9f1c2a7e-55b4-4d2c-a1f0-3c8e7d6b1a90`
**Esperado:** 201 Created, devuelve `transaction_uuid` y `requires_totp: false`

---

### 🔹 7. CONFIRMAR TRANSFERENCIA (RF-07)
**Postman:** `Transfers → Confirm Transfer`
- Reemplazar `TRANSACTION_UUID` por el uuid del paso anterior
- Como el monto es < 500 Bs, **no requiere TOTP**
**Esperado:** 200 OK, transferencia completada

---

### 🔹 8. HISTORIAL (RF-08)
**Postman:** `Transactions → Get Transactions`
**Esperado:** 200 OK, lista paginada de movimientos

---

### 🔹 9. PANEL ADMIN (RF-09)
Usar credenciales de ADMIN:
```json
{
  "email": "admin@securewallet.com",
  "password": "Admin123!@#"
}
```
**Postman:** `Admin → List Users`
**Postman:** `Admin → Audit Logs`
**Esperado:** 200 OK, solo accesible con token de admin

---

### 🔹 10. CERRAR SESIÓN (RF-10)
**Postman:** `Auth → Logout`
**Esperado:** 200 OK, el token queda invalidado en el servidor

---

## 📌 PRUEBAS DE SEGURIDAD (RS-01 a RS-10)

### 🔸 RS-01 — IDOR (Acceso a datos de otro usuario)
**Postman:** `Security Tests → Access Another User's Wallet (IDOR)`
- Con token de Juan, intentar cambiar uuid en la URL
**Esperado:** El endpoint /wallet siempre devuelve SOLO la billetera del usuario autenticado, sin importar parámetros

### 🔸 RS-02 — RBAC (Admin forzado)
**Postman:** `Security Tests → Admin Endpoint as Regular User`
- Con token de Juan (USER), intentar acceder a `/admin/users`
**Esperado:** **403 Forbidden**

### 🔸 RS-03 — Contraseñas con bcrypt
- Verificar en BD que las contraseñas están hasheadas con bcrypt
- El campo `mfa_secret` NUNCA aparece en respuestas JSON

### 🔸 RS-04 — Validación (Injection)
- Enviar datos maliciosos: `'; DROP TABLE users; --`
**Esperado:** El ORM escapa todo, no hay inyección SQL

### 🔸 RS-05 — Doble cobro (Idempotency)
- Enviar la misma transferencia 2 veces con el mismo `Idempotency-Key`
**Esperado:** **409 Conflict** — "This request has already been processed"

### 🔸 RS-06 — CORS
- Verificar que las cabeceras CORS solo permiten `http://localhost:5173`

### 🔸 RS-07 — Refresh Token Rotation
**Flujo:**
1. Hacer login → obtener refresh_token
2. Usar refresh_token para obtener nuevos tokens (funciona)
3. Usar el MISMO refresh_token otra vez
**Esperado:** **401** — "Token reuse detected. All tokens revoked." + toda la familia revocada

### 🔸 RS-08 — Rate Limiting
**Postman:** `Security Tests → Login with Wrong Password`
- Enviar 6 peticiones de login rápido
**Esperado:** A partir de la 6ta en menos de 1 minuto → **429 Too Many Requests**
- Además, tras 5 intentos fallidos → **423 Account blocked**

### 🔸 RS-09 — Bitácora de auditoría
**Postman:** `Admin → Audit Logs`
**Esperado:** Todos los eventos registrados con IP, user-agent, timestamp

### 🔸 RS-10 — XSS/CSRF
- El frontend React escapa todo el output automáticamente
- Los tokens se manejan por header `Authorization: Bearer`

---

## 📌 LO QUE EL LICENCIADO VA A PREGUNTAR

### Preguntas conceptuales (OWASP Top 10):
1. ¿Qué es IDOR y cómo lo preveniste?
2. ¿Diferencia entre autenticación y autorización?
3. ¿Cómo funciona bcrypt y por qué cost ≥ 12?
4. ¿Qué son las condiciones de carrera y cómo las evitaste?
5. ¿Cómo funciona la rotación de refresh tokens?
6. ¿Qué es rate limiting y por qué es importante?

### Modificaciones en vivo que puede pedir:
- Cambiar el rate limit de 5 a 10 intentos por minuto
- Cambiar el costo de bcrypt de 12 a 14
- Agregar un campo nuevo a la validación
- Explicar una parte específica del código

---

## ✅ CHECKLIST FINAL

| Requisito | Hecho |
|---|---|
| El proyecto levanta desde cero siguiendo el README | ⬜ |
| .env NO está en el repositorio, solo .env.example | ⬜ |
| Usuarios semilla: 1 ADMIN + 2 USER | ⬜ |
| Colección Postman importada y funcional | ⬜ |
| Video mostrando flujo completo + ataque rechazado | ⬜ |
| Saber explicar cada control de seguridad (RS-01 a RS-10) | ⬜ |
| Saber modificar código en vivo | ⬜ |

---

## 🚀 COMANDOS RÁPIDOS (para la defensa)

```powershell
# Iniciar backend
cd backend
php artisan serve --port=8000

# Iniciar frontend  
cd frontend
npm run dev

# Resetear BD (si es necesario)
cd backend
php artisan migrate:fresh --seed

# Ver rutas
php artisan route:list
```

---

**¡Mucho éxito en la defensa! 💪 Si necesitan ajustes de último minuto, avisen.**
