## Que cambia
<!-- Describe el cambio y el requisito, defecto o ajuste que atiende (RF-xx, Dxx, AJ-xx) -->

## Lista de chequeo (AJ-04)
- [ ] Los criterios de aceptacion del requisito estan escritos con valores limite
- [ ] Las pruebas nuevas o modificadas estan en verde (npm test)
- [ ] La integracion continua (GitHub Actions) esta en verde
- [ ] Las contrasenas se guardan cifradas y no aparecen en ninguna respuesta
- [ ] Las rutas que modifican datos exigen token
- [ ] Los errores de base de datos responden 500 sin exponer detalles
- [ ] Las consultas SQL usan parametros ($1, $2...)
- [ ] No hay credenciales en el codigo (todo esta en .env)
- [ ] ESLint no reporta errores (npm run lint)
- [ ] La documentacion afectada esta actualizada
- [ ] Los defectos encontrados quedaron registrados
