'use strict';
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
  return { app, httpServer, io };
}

if (require.main === module) {
  const { httpServer } = createChatServer();
  const port = process.env.PORT || 3000;
  httpServer.listen(port, () => console.log(`UNA Chat en http://localhost:${port}`));
}

module.exports = { createChatServer };
