'use strict';
const Sentry = require('./instrument');
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const validation = require('./libs/unalib');

function createChatServer(authMiddleware = null) {
  const app = express();
  const httpServer = http.createServer(app);
  const io = new Server(httpServer);
  // Monitoreo exclusivo del entorno local
  if (process.env.OTEL_SERVICE_NAME === 'una-chat-local') {
    const { metrics, context, trace } = require('@opentelemetry/api');
    const { logs, SeverityNumber } = require('@opentelemetry/api-logs');

    const logger = logs.getLogger('una-chat-local');
    const meter = metrics.getMeter('una-chat-local');

    const solicitudes = meter.createCounter('una_chat_requests');
    const duracion = meter.createHistogram('una_chat_request_duration', {
      unit: 'ms'
    });

    app.use((req, res, next) => {
      const inicio = Date.now();
      const span = trace.getSpan(context.active());
      const traceId = span?.spanContext().traceId;

      logger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: 'INFO',
        body: 'Solicitud recibida en UNA Chat local',
        attributes: {
          'http.request.method': req.method,
          'url.path': req.path,
          'trace_id': traceId || 'sin-traza'
        }
      });

      res.on('finish', () => {
        const atributos = {
          method: req.method,
          status_code: String(res.statusCode)
        };

        solicitudes.add(1, atributos);
        duracion.record(Date.now() - inicio, atributos);
      });

      next();
    });
  }


  if (authMiddleware) {
    app.use(authMiddleware);

    io.engine.use((req, res, next) => {
      if (req._query && req._query.sid !== undefined) return next();
      authMiddleware(req, res, next);
    });

    io.use((socket, next) => {
      if (socket.request.oidc?.isAuthenticated()) return next();
      next(new Error('Debes iniciar sesión para usar el chat'));
    });
  }

  const requireLogin = authMiddleware
    ? require('express-openid-connect').requiresAuth()
    : (_req, _res, next) => next();

  app.get('/', requireLogin, (_req, res) =>
    res.sendFile(path.join(__dirname, 'index.html')));
  app.use('/media', requireLogin, express.static(path.join(__dirname, 'media')));

  



  io.on('connection', socket => {
    socket.on('Evento-Mensaje-Server', (datos, confirmar) => {
      const resultado = JSON.parse(validation.validateMessage(datos));
      if (resultado.error) {
        socket.emit('Evento-Error-Server', resultado.error);
        if (typeof confirmar === 'function') confirmar({ ok: false, error: resultado.error });
        return;
      }
      io.emit('Evento-Mensaje-Server', resultado);
      if (typeof confirmar === 'function') confirmar({ ok: true });
    });
  });

  // Registrar errores HTTP de Express en Sentry
  if (process.env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
  }

  return { app, httpServer, io };
}



const servidor = createChatServer();

// Iniciar normalmente cuando se ejecuta con npm start
if (require.main === module) {
  require('dotenv').config();
  const { createAuthMiddleware } = require('./server/auth');

  createAuthMiddleware()
    .then(authMiddleware => {
      const protegido = createChatServer(authMiddleware);
      const port = process.env.PORT || 3000;

      protegido.httpServer.listen(port, () => {
        console.log(`UNA Chat con Auth0 en http://localhost:${port}`);
      });
    })
    .catch(error => {
      console.error('Error al iniciar Auth0:', error.message);
      process.exitCode = 1;
    });
}

// Permitir que Vercel utilice el servidor HTTP y Socket.IO
module.exports = servidor.httpServer;

// Conservar la funciÃ³n utilizada por las pruebas del proyecto
module.exports.createChatServer = createChatServer;

