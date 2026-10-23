'use strict';
const assert = require('assert');
const val = require('../libs/unalib');

function validar(mensaje, nombre = 'Ana') {
  return JSON.parse(val.validateMessage(JSON.stringify({ nombre, mensaje, color: '#123abc' })));
}

describe('Validaciones de UNA Chat', () => {
  it('acepta imágenes JPG, PNG, GIF y WEBP por URL HTTP(S)', () => {
    for (const ext of ['jpg', 'png', 'gif', 'webp']) {
      const url = `https://ejemplo.com/foto.${ext}?v=2`;
      assert.equal(val.is_valid_url_image(url), true);
      assert.equal(validar(url).tipo, 'imagen');
    }
  });
  it('rechaza extensiones que no corresponden a imágenes', () => {
    assert.equal(val.is_valid_url_image('https://ejemplo.com/foto.png.exe'), false);
    assert.equal(val.is_valid_url_image('javascript:alert(1)'), false);
  });
  it('valida URLs de YouTube y construye la URL de embed seguro', () => {
    const salida = validar('https://www.youtube.com/watch?v=qYwlqx-JLok');
    assert.equal(salida.tipo, 'youtube');
    assert.equal(salida.url, 'https://www.youtube-nocookie.com/embed/qYwlqx-JLok');
    assert.equal(val.is_valid_yt_video('https://youtu.be/qYwlqx-JLok'), true);
  });
  it('valida archivos MP4, WEBM y OGG', () => {
    for (const ext of ['mp4', 'webm', 'ogg']) {
      assert.equal(validar(`https://ejemplo.com/demo.${ext}`).tipo, 'video');
    }
  });
  it('bloquea scripts HTML y atributos con HTML', () => {
    assert.match(validar("<script>alert('Inyección de script');</script>").error, /bloqueado/i);
    assert.match(validar('<img src=x onerror=alert(1)>').error, /bloqueado/i);
  });
  it('rechaza URLs que no apuntan a medios válidos', () => {
    assert.match(validar('https://ejemplo.com/documento.pdf').error, /solo se permiten/i);
  });
  it('no crea HTML con un mensaje de texto normal', () => {
    const salida = validar('Hola mundo');
    assert.equal(salida.mensaje, 'Hola mundo');
    assert.equal(salida.tipo, 'texto');
    assert.equal(salida.url, null);
  });
  it('controla nombres peligrosos y el color', () => {
    const mensaje = { nombre: '<script>x</script>', mensaje: 'hola', color: 'red; background:url(x)' };
    assert.ok(JSON.parse(val.validateMessage(JSON.stringify(mensaje))).error);
    assert.equal(JSON.parse(val.validateMessage(JSON.stringify({ nombre: 'Ana', mensaje: 'hola', color: 'red' }))).color, '#1D4ED8');
  });
  it('no permite mensajes mal formados, vacíos o demasiado largos', () => {
    assert.ok(JSON.parse(val.validateMessage('no-es-json')).error);
    assert.ok(validar('').error);
    assert.ok(validar('x'.repeat(2001)).error);
  });
});
