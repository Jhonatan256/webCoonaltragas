# Manual de Uso (Versión Imprimible)

> Esta versión está optimizada para impresión / PDF. No incluye capturas ni tablas anchas. Use junto con la versión completa si necesita imágenes.

## 1. Objetivo
Guía rápida para que un usuario final ingrese, recupere su contraseña y use las funciones básicas (actualizar datos, registro y dashboard si aplica).

## 2. Requisitos
- Navegador actualizado.
- Conexión a Internet.
- Tener su número de identificación y contraseña.

## 3. Ingreso (Login)
1. Abra la URL oficial.
2. Escriba su identificación (solo números).
3. Escriba su contraseña.
4. Espere validación del captcha.
5. Pulse "Ingresar".

Si el acceso es válido y posee rol de dashboard, será redirigido automáticamente.

## 4. Recuperar contraseña
1. Pulse "¿Olvidaste tu contraseña?".
2. Ingrese su identificación.
3. Envíe.
4. Revise su correo (spam si no aparece).

## 5. Actualizar datos
1. Seleccione "Actualizar datos" en la pantalla de inicio.
2. Modifique los campos permitidos.
3. Guarde.

## 6. Registro asociado
1. Pulse "Registro asociado".
2. Complete los datos solicitados.
3. Envíe y verifique la confirmación.

## 7. Dashboard (solo roles autorizados)
- Visualiza métricas y listados.
- Puede acceder a usuarios nuevos / actualizados y generar reportes si se habilitó.

## 8. Seguridad y sesiones
- Auto cierre al expirar token.
- Limpieza total tras aprox. 3 horas.
- Al abrir el login se borra la sesión previa.

## 9. Problemas comunes (resumen)
- Credenciales inválidas: revise identificación y contraseña.
- No llega correo: revise spam y correo registrado.
- Redirige al login: rol insuficiente o token vencido.
- No aparece captcha: desactive bloqueadores.

## 10. Soporte
Correo: soporte@fondexpress.example.com
Horario: Lun-Vie 8:00 - 17:00

Incluya en un ticket: identificación, descripción, hora y captura (si procede).

## 11. Buenas prácticas
- No compartir claves.
- Cerrar sesión si usa equipo compartido.
- Cambiar contraseña periódicamente (si la política lo exige).

## 12. Actualización del documento
Revisar tras cambios funcionales mayores. Fecha actual abajo.

## 13. Generar PDF (Sugerido)
1. Pandoc:
	```bash
	pandoc src/doc/ManualUsuario_print.md -o ManualUsuario_print.pdf --pdf-engine=xelatex
	```
2. O usar impresión del navegador.

---
Última actualización: 14/10/2025

<!-- Sugerencia impresión: en pandoc usar --pdf-engine=xelatex; añadir portada si se desea -->
