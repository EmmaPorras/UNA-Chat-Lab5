'use strict';
const { io: conectar } = require('socket.io-client');
const { createChatServer } = require('../../server');
const unalib = require('../../libs/unalib');

let servidor;
let cliente;
let puerto;

beforeAll(async () => {
  servidor = createChatServer();
  await new Promise(resolve => servidor.httpServer.listen(0, '127.0.0.1', resolve));
  puerto = servidor.httpServer.address().port;
});

afterEach(() => {
  if (cliente) { cliente.disconnect(); cliente = null; }
  jest.restoreAllMocks();
});

afterAll(async () => {
  if (servidor) await new Promise(resolve => servidor.io.close(resolve));
});

async function crearCliente() {
  cliente = conectar(`http://127.0.0.1:${puerto}`, { transports: ['websocket'], reconnection: false, forceNew: true });
  await new Promise((resolve, reject) => {
    cliente.once('connect', resolve);
    cliente.once('connect_error', reject);
  });
  return cliente;
}

function enviarYEsperar(socket, payload, evento) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('El servidor no respondió')), 4500);
    socket.once(evento, datos => { clearTimeout(timer); resolve(datos); });
    socket.emit('Evento-Mensaje-Server', JSON.stringify({ nombre: 'Ana', mensaje: payload, color: '#123abc' }));
  });
}

describe('Integración Node.js + una-lib + Socket.IO reales', () => {
  test('acepta imagen y llama a validateMessage', async () => {
    const spy = jest.spyOn(unalib, 'validateMessage');
    const socket = await crearCliente();
    const respuesta = await enviarYEsperar(socket, 'https://ejemplo.com/foto.png', 'Evento-Mensaje-Server');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(respuesta.tipo).toBe('imagen');
    expect(respuesta.url).toContain('foto.png');
  });

  test('acepta video y entrega un reproductor compatible', async () => {
    const socket = await crearCliente();
    const respuesta = await enviarYEsperar(socket, 'https://www.youtube.com/watch?v=qYwlqx-JLok', 'Evento-Mensaje-Server');
    expect(respuesta.tipo).toBe('youtube');
    expect(respuesta.url).toBe('https://www.youtube-nocookie.com/embed/qYwlqx-JLok');
  });

  test('bloquea inyección de scripts sin reenviarla a los participantes', async () => {
    const socket = await crearCliente();
    const respuesta = await enviarYEsperar(socket, "<script>alert('Inyección de script');</script>", 'Evento-Error-Server');
    expect(respuesta).toMatch(/bloqueado/i);
  });

  test('bloquea una URL ajena a imágenes o videos', async () => {
    const socket = await crearCliente();
    const respuesta = await enviarYEsperar(socket, 'https://ejemplo.com/archivo.pdf', 'Evento-Error-Server');
    expect(respuesta).toMatch(/solo se permiten/i);
  });
});
