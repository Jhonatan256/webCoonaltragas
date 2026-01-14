# Manual Técnico - Plataforma Fondexpress

> Destinado a desarrolladores y personal de soporte técnico.

## 1. Resumen
Aplicación web compuesta por un frontend (React + Vite + PrimeReact) y una API en PHP que expone endpoints de autenticación, gestión de usuarios, registro y utilidades (PDF, Excel, Mensajería). Autenticación basada en JWT y validación de acceso por roles/módulo.

## 2. Arquitectura
- Frontend SPA: React + Context para Auth.
- Backend PHP: Organización por capas (Repositories, Services, Validation, Support).
- Almacenamiento: Base de datos relacional (scripts en carpeta sql/). Archivos (firmas, registros) en `storage/`.
- Seguridad: JWT + Turnstile (captcha) + limpieza programada de localStorage.

### 2.1 Diagrama lógico (texto)
[Cliente] --> [Frontend (Vite build)] --> [API PHP] --> [DB / Storage]

## 3. Repositorios y estructura
```
fondoExpress/
  src/components/ (Login, Dashboard, etc.)
  src/context/ (AuthContext, hooks)
  public/img/
apiFondexpress/
  Clasess/Repositories/*.php
  Clasess/Services/*.php
  sql/*.sql
  storage/(firmas, register, update)
```

## 4. Flujo de Autenticación
1. Usuario envía credenciales + captcha token a `/auth/token`.
2. Backend valida captcha y credenciales.
3. Devuelve JWT + user.
4. Frontend guarda token y user en localStorage (gestionado por `AuthContext.jsx`).
5. Auto refresh silencioso sólo para módulos `update` y `register`.
6. Expiración produce logout y limpieza.

### 4.1 Claims relevantes
- `exp`: expiración (segundos epoch)
- `roles`: array de roles (ej: ["dashboard"]) 
- `module`: módulo activo (dashboard | update | register)

## 5. Manejo de Sesión Frontend
Archivo: `AuthContext.jsx`
- Guarda: token, user, identificacion
- Timers: expiración y refresh
- Limpieza total a las 3h (`storage_init_at` + localStorage.clear())
- Funciones expuestas: `login`, `logout`, `loginWithToken`, `refreshToken` (interno)

## 6. Captcha (Turnstile)
Componente: `CaptchaTurnstile.jsx`
- Carga script dinámicamente.
- Usa `forwardRef` + método imperativo `reset()`.
- Eventos: callback, error-callback, expired-callback => set token o null.
- En `Login.jsx` se reinicia tras login exitoso, errores y al montar.

## 7. Endpoints Principales (resumen conceptual)
- `POST /auth/token` -> JWT.
- `POST /auth/forgot-password` -> envía nueva clave temporal.
- `GET /usuarios/documento/{doc}` -> (renovación para update)
- `GET /register/documento/{doc}` -> (renovación para register)
(Otros: logs, municipios, etc. según Repositories.)

> Para documentación exhaustiva sugerir generar listado automático con un script que inspeccione rutas.

## 8. Repositories (patrón)
Ejemplos: `UsuarioRepository.php`, `MunicipioRepository.php` manejan queries y devuelven arrays/objetos de datos.

## 9. Services
- `MailService.php`: Envío de correos.
- `PdfService.php`: Generación de PDF.
- `ExcelExportService.php` / `ExcelImportService.php`: Procesos de Excel.
- `SmsService.php`, `WhatsAppService.php`: Mensajería.

## 10. Seguridad Backend
- Validar siempre entrada (usar `Validator.php`).
- Sanitizar identificación (numérica).
- Rotar `JWT_SECRET` (no almacenado en repo idealmente).
- Limitar intentos de login (sugerencia: conteo y backoff).
- Logs de request en tabla (ver `request_logs.sql`).

## 11. Variables de Entorno / Configuración
(Agregar archivo .env no incluido aquí si procede.)
- DB_HOST, DB_NAME, DB_USER, DB_PASS
- JWT_SECRET
- SMTP_HOST, SMTP_USER, SMTP_PASS
- WHATSAPP_API_KEY, SMS_API_KEY
- TURNSTILE_SECRET_KEY (lado servidor)
- FRONTEND_ORIGIN para CORS

## 12. Despliegue
### 12.1 Frontend
1. `npm install`
2. `npm run build`
3. Servir carpeta `dist/` detrás de Apache/Nginx.

### 12.2 Backend
1. `composer install --no-dev --optimize-autoloader`
2. Configurar virtual host / ruta `/api`.
3. Ajustar permisos en `storage/`.
4. Asegurar PHP 8.x y extensiones requeridas.

### 12.3 Base de Datos
1. Ejecutar scripts en `apiFondexpress/sql/`.
2. Crear usuario con permisos mínimos (SELECT, INSERT, UPDATE, DELETE).

## 13. Logs y Monitoreo
- Tabla de logs de requests.
- Recomendado: agregar nivel (INFO/WARN/ERROR) y correlación.
- Monitorear métricas: tasa de errores 5xx, latencia media.

## 14. Backups
- DB: Diario + retención 30 días.
- Carpeta `storage/`: Incremental + semanal completo.

## 15. Estrategia de Ramas (Sugerida)
- `master/main`: producción.
- `develop`: integración.
- `feature/*`, `hotfix/*`, `release/*`.

## 16. Dependencias Críticas
Frontend: primeReact, react-router, vite.
Backend: firebase/php-jwt, phpmailer, phpoffice/phpspreadsheet, flightphp.

## 17. Troubleshooting Técnico
| Síntoma | Causa probable | Acción |
|--------|----------------|--------|
| Token inválido antes de expirar | Desfase horario | Sincronizar NTP servidor. |
| Captcha no genera callback | Script bloqueado | Ver cabeceras CSP / extensiones. |
| Memoria alta en export PDF | Documento grande | Paginar / stream. |
| Upload firma falla | Permisos en storage | Revisar chmod / propietario. |

## 18. Mejora Continua
- Automatizar pruebas smoke en CI.
- Agregar lint y auditorías (npm audit, composer audit).
- Implementar caching en endpoints de lectura frecuente.

## 19. Generación de Documentación
Sugerencia: usar scripts para extraer rutas y generar README parcial.

## 20. Anexos
- Ejemplo payload JWT
## 21. Generar PDF
```bash
pandoc src/doc/ManualTecnico.md -o ManualTecnico.pdf --pdf-engine=xelatex
```
Opcional: añadir portada usando `--from markdown+yaml_metadata_block` y un bloque YAML inicial.

---
Última actualización: 14/10/2025
```
{
  "exp": 1739558400,
  "roles": ["dashboard"],
  "module": "dashboard",
  "sub": "123456"
}
```

---
Última actualización: 14/10/2025
