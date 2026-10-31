'use strict';
const Sentry = require('./instrument');
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const validation = require('./libs/unalib');

function createChatServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const io = new Server(httpServer);

  app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));
  app.use('/media', express.static(path.join(__dirname, 'media')));

  



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
  const port = process.env.PORT || 3000;
  servidor.httpServer.listen(port, () => {
    console.log(`UNA Chat en http://localhost:${port}`);
  });
}

// Permitir que Vercel utilice el servidor HTTP y Socket.IO
module.exports = servidor.httpServer;

// Conservar la función utilizada por las pruebas del proyecto
module.exports.createChatServer = createChatServer;

