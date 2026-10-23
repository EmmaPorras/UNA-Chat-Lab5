# UNA Chat · Laboratorio 5 · Seguridad Informática

Este paquete contiene **antes/** (el proyecto original suministrado) y **despues/** (una propuesta corregida y ampliada). No modifique `antes/` hasta obtener la primera evidencia.

## Qué se cambió

- El frontend ya no inserta mensajes con `.html()`; utiliza `textContent` y crea etiquetas de medios con la API del DOM.
- `libs/unalib.js` corrige las validaciones originales que usaban la variable `phone` por error, admite imágenes JPG/JPEG/PNG/GIF/BMP/WEBP, videos MP4/WEBM/OGG y enlaces compatibles de YouTube.
- El servidor **bloquea mensajes con etiquetas HTML/scripts y URLs que no son medios**; no transmite al chat los mensajes rechazados. También valida el nombre y el color.
- Se conservan las pruebas existentes y se añaden pruebas unitarias Mocha, de integración Jest con Socket.IO real y end-to-end Playwright.
- El servidor proporciona dos archivos de medios de prueba bajo `/media/`, por lo que la prueba del video no depende de plataformas externas.

## Requisitos

Node.js moderno (recomendado 20 o superior), npm, terminal PowerShell o similar, navegador Chromium para Playwright y acceso a Internet para instalar paquetes npm inicialmente. El paquete NO incluye `node_modules`, ni resultados falsos de pruebas, ni capturas fabricadas.

## Evidencia 1: mostrar la vulnerabilidad ORIGINAL

Abra una terminal en `antes/` y ejecute:

```powershell
npm install
npm start
```

Abra `http://localhost:3000` en el navegador. En el campo de mensaje escriba lo siguiente y haga clic en `Send`:

```html
<script>alert('Inyección de script');</script>
```

Tome **evidencia1.jpg** de lo que ocurra, incluyendo el alert si aparece. La evidencia debe ser genuina. Esta versión es intencionalmente insegura; no la exponga a Internet ni la utilice con otros usuarios.

DETENGA este servidor con **Ctrl+C** antes del siguiente paso.

## Iniciar la versión CORREGIDA

Abra la terminal en `despues/` y ejecute:

```powershell
npm install
npm start
```

Abra `http://localhost:3000`. Puede probar con estos mensajes:

- Imagen local: `http://localhost:3000/media/ejemplo.png`
- Video local: `http://localhost:3000/media/ejemplo.mp4`
- YouTube: `https://www.youtube.com/watch?v=qYwlqx-JLok` (puede depender de Internet)
- Texto: `Hola, mundo`
- Ataque XSS: `<script>alert('Inyección de script');</script>` (debe mostrar un aviso de rechazo, **sin ejecutarse**)

Nota: los medios de prueba locales están pensados para ejecutarse desde el mismo equipo donde se abre el navegador; si se usa otro dispositivo, sustituya `localhost` por una IP accesible, manteniendo los protocolos/puertos adecuados.

## Evidencia 2: pruebas UNITARIAS

Abra otra terminal dentro de `despues/` y ejecute:

```powershell
npm test
```

Tome una captura JPG que muestre el resultado de la ejecución de las pruebas unitarias. El archivo `test/test.js` es el original; `test/validacion.test.js` contiene las pruebas adicionales.

## Evidencia 3: pruebas de INTEGRACIÓN

Desde la terminal dentro de `despues/` ejecute:

```powershell
npm run test:integration
```

Equivale al comando solicitado en la guía:

```powershell
npx jest tests/integration --runInBand --env=node
```

Estas pruebas **no simulan una ruta HTTP**: el proyecto usa Socket.IO, por eso conectan un cliente Socket.IO al backend real y verifican que se ejecute `una-lib.validateMessage`. Tome una captura JPG de la salida de estas pruebas.

## Evidencia 4: pruebas END-TO-END con Playwright

En `despues/`, instale Chromium (solo la primera vez):

```powershell
npx playwright install chromium
```

Si el servidor ya se ejecuta en `http://localhost:3000`, déjelo activo. En otra terminal dentro de `despues/` ejecute:

```powershell
npx playwright test --project=chromium --headed
```

Playwright también puede iniciar el servidor automáticamente si no está funcionando. Las pruebas revisan imagen cargada, video MP4 cargado y ausencia de alerta con rechazo del script malicioso. Tome **evidencia4.jpg** de los resultados aprobados.

Para consultar el reporte:

```powershell
npx playwright show-report
```

## Entrega en ProfeLink

- Cuatro capturas JPG auténticas (evidencia 1: inyección antes de corregir; evidencia 2: unitarias; evidencia 3: integración; evidencia 4: Playwright).
- Repositorio GitHub con el código corregido y las suites de pruebas, incluyendo `README.md`, `package.json` y configuración de Playwright. NO suba `node_modules/`.
- Archivo `repositorio.txt` que contenga el enlace **real** a su GitHub (créelo solo después de publicar el repositorio).

**Observación importante sobre la guía del profesor:** el paso 11 incluye instrucciones contradictorias: primero menciona adjuntar un PDF con capturas JPG y después dice expresamente «No suba documentos de Word ni PDF». Conviene consultar con el profesor cuál es el formato definitivo; en cualquier caso conserve las capturas JPG y el repositorio enlazado.

**Fecha de entrega de la guía:** viernes 23 de octubre de 2026, a las 23:59:59.

## Nota sobre verificación

La lógica y sintaxis JavaScript fueron revisadas localmente y las funciones de validación se probaron con Node.js. No fue posible ejecutar las suites con Mocha, Jest o Playwright dentro de este entorno porque la descarga de paquetes desde npm no estuvo disponible. Es necesario ejecutar los comandos de arriba en su computadora y conservar las capturas reales de los resultados.
