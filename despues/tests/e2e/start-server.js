'use strict';
const { createChatServer } = require('../../server');

const servidor = createChatServer();

servidor.httpServer.listen(3100, '127.0.0.1', () => {
  console.log('Servidor exclusivo para pruebas E2E en puerto 3100');
});
