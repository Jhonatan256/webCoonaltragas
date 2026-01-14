# Manual de Uso - Aplicación Fondexpress

> Versión para pantalla. Para una versión imprimible o PDF vea `ManualUsuario_print.md`.

## 1. Introducción
Esta aplicación permite a los empleados y asociados de Fondexpress acceder al panel interno (dashboard), actualizar sus datos o realizar un registro asociado. Este manual explica paso a paso cómo usar cada sección.

## 2. Acceso (Login)
![Pantalla Login](../assets/placeholder_login.png "Colocar captura de pantalla del login aquí")
1. Abra la URL oficial proporcionada por su entidad (ej. https://fondexpress.example.com).
2. Verá la pantalla de ingreso con el logo de Fondexpress.
3. Ingrese su número de identificación en el campo "Usuario" (solo números).
4. Ingrese su contraseña.
5. Complete el captcha (esperar a que se valide automáticamente).
6. Presione el botón "Ingresar".

Si los datos son correctos será dirigido al Dashboard (si su usuario tiene rol correspondiente). Si no, se mostrará un mensaje de error.

### 2.1 Errores frecuentes
- "Usuario y contraseña son requeridos": Falta uno de los campos.
- "Por favor complete el captcha": Aún no se ha validado el captcha.
- "Credenciales inválidas" o similar: Número o clave incorrectos.
- Si el captcha se reinicia, espere y vuelva a intentarlo.

## 3. Olvidé mi contraseña
![Modal Recuperar Clave](../assets/placeholder_forgot.png "Colocar captura del modal de recuperación")
1. En la pantalla de login haga clic en "¿Olvidaste tu contraseña?".
2. Se abrirá una ventana emergente.
3. Ingrese su número de identificación.
4. Presione "Enviar nueva clave".
5. Si es exitoso, recibirá un correo con una contraseña temporal.
6. Use esa contraseña para ingresar y (si aplica) cámbiela según políticas internas.

Si hay error, revise que el documento sea correcto y vuelva a intentar más tarde.

## 4. Actualizar datos ("Actualizar datos")
![Pantalla Actualizar Datos](../assets/placeholder_update.png "Colocar captura del módulo actualizar")
1. En la pantalla principal de login haga clic en "Actualizar datos".
2. Siga el flujo indicado (se abrirá la vista específica del módulo de actualización).
3. Complete o modifique la información solicitada.
4. Guarde los cambios.

Notas:
- Algunos campos pueden ser obligatorios.
- Podrían solicitarle nuevamente verificación de identidad.

## 5. Registro asociado ("Registro asociado")
![Pantalla Registro Asociado](../assets/placeholder_register.png "Colocar captura del módulo registro")
1. En la pantalla de login seleccione "Registro asociado".
2. Ingrese la información requerida para el registro (ej. identificación, datos personales, contacto, etc.).
3. Envíe el formulario.
4. Recibirá confirmación en pantalla y/o por correo.

## 6. Dashboard (Panel interno)
(Disponible solo para usuarios con rol de dashboard).

### 6.1 Ingreso
Una vez autenticado, si su rol lo permite, será redirigido automáticamente. Si intenta acceder sin rol, regresará al login.

### 6.2 Componentes usuales
- Barra de navegación / menubar.
- Sección de métricas rápidas (usuarios nuevos, actualizados, etc.).
- Listados paginados de usuarios.
- Acceso a exportaciones (si se habilita) y filtros.

### 6.3 Acciones frecuentes
1. Consultar usuarios nuevos.
2. Revisar usuarios actualizados.
3. Generar reporte (PDF/Excel) si la opción aparece.

### 6.4 Restricciones
Si no tiene permisos, verá un mensaje o será redirigido. Contacte al administrador para ampliación de roles.

> Placeholder de captura(s):
![Dashboard Principal](../assets/placeholder_dashboard.png "Colocar captura del dashboard")

## 7. Seguridad de la sesión
| Aspecto | Detalle |
|---------|---------|
| Expiración de token | Al vencer se cierra sesión automáticamente. |
| Limpieza programada | A las 3 horas se borra la información local (reinicio forzado). |
| Limpieza al entrar a Login | Siempre que se carga la pantalla de login se purga la sesión previa. |
| Captcha | Impide automatización maliciosa. |
| Buenas prácticas | No reutilice contraseñas, no comparta credenciales. |

## 8. Recomendaciones de uso
- Use navegadores modernos (Chrome, Edge, Firefox). 
- Permita la carga del script de captcha (Turnstile) para poder ingresar.
- Si algo no carga, refresque la página (Ctrl + F5).
- Evite múltiples intentos rápidos para no bloquear temporalmente su acceso.

## 9. Solución de problemas comunes
| Problema | Posible causa | Acción sugerida | Prioridad |
|----------|---------------|-----------------|-----------|
| No carga el captcha | Bloqueador de scripts / red corporativa | Deshabilite bloqueadores, pruebe otra red. | Media |
| Captcha se reinicia solo | Token expiró | Reintente; es normal tras algunos segundos. | Baja |
| Credenciales inválidas | Usuario/clave erróneos o mayúsculas | Verifique número y contraseña, revise teclado. | Alta |
| No llega correo de recuperación | Correo desactualizado / Spam | Revisar spam; si no llega, contactar soporte. | Media |
| Se cierra sesión sola | Expiración o limpieza de 3h | Iniciar sesión nuevamente. | Baja |
| Redirección constante a login | Token inválido o rol insuficiente | Pedir revisión de rol a administrador. | Alta |

## 10. Privacidad y protección de datos
- El sistema solo utiliza la información necesaria para la operación interna.
- El captcha protege contra accesos automatizados.
- Los datos sensibles (contraseña, token) no deben compartirse.

## 11. Contacto de soporte
Si presenta inconvenientes que no pueda resolver:
- Canal interno de TI: soporte@fondexpress.example.com
- Horario de atención: Lunes a Viernes 8:00 - 17:00.

Incluya en su reporte: número de identificación, descripción del problema, hora aproximada e imagen (si aplica).

## 12. Actualizaciones del sistema
Cuando se agregan nuevas funciones el manual se puede actualizar. Si nota diferencias entre la interfaz y este documento, contacte a soporte para confirmar la versión vigente.

### 12.1 Cómo reportar una mejora
Indique: Pantalla, descripción, beneficio esperado.

### 12.2 Frecuencia sugerida de revisión
Trimestral o tras releases mayores.

## 13. Versión imprimible
Para una versión simplificada sin capturas ni tablas extensas genere el PDF desde `ManualUsuario_print.md`.

## 14. Generar PDF
Opciones:
1. Navegador: Abrir el archivo servido (si se publica) y usar Imprimir -> Guardar como PDF.
2. Pandoc (requiere instalación):
	```bash
	pandoc src/doc/ManualUsuario.md -o ManualUsuario.pdf --pdf-engine=xelatex
	```
3. Extensión VSCode Markdown PDF.

Sugerencias de formato:
- Margen: 1.5 cm.
- Tamaño papel: A4.
- Quitar fondo o tema oscuro antes de exportar.

---
Última actualización: 14/10/2025 (ampliado con placeholders y tablas)

---
Última actualización: 14/10/2025
