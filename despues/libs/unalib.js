'use strict';

// Validación compartida por el servidor y las pruebas. No produce HTML sin escapar.
const MAX_MENSAJE = 2000;
const MAX_NOMBRE = 40;
const ID_YOUTUBE = /^[a-zA-Z0-9_-]{11}$/;

function obtenerURL(valor) {
  if (typeof valor !== 'string' || valor.length > 2048 || /\s/.test(valor)) return null;
  try {
    const url = new URL(valor);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (!url.hostname || url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

function esURLImagen(valor) {
  const url = obtenerURL(valor);
  return Boolean(url && /\.(?:jpg|jpeg|png|gif|bmp|webp)$/i.test(url.pathname));
}

function esURLVideoArchivo(valor) {
  const url = obtenerURL(valor);
  return Boolean(url && /\.(?:mp4|webm|ogg|ogv)$/i.test(url.pathname));
}

function obtenerYouTubeId(valor) {
  const url = obtenerURL(valor);
  if (!url) return null;
  const host = url.hostname.toLowerCase();
  let id = null;
  if (['youtu.be', 'www.youtu.be'].includes(host)) {
    id = url.pathname.split('/')[1] || null;
  } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com',
    'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else if (/^\/(embed|shorts|live)\//.test(url.pathname)) id = url.pathname.split('/')[2];
  }
  return id && ID_YOUTUBE.test(id) ? id : null;
}

function contieneCodigoPeligroso(texto) {
  // En este chat solo se admite texto simple, sin etiquetas HTML ejecutables.
  return /<\/?[a-z][^>]*>/i.test(texto) || /\b(?:javascript|vbscript|data)\s*:/i.test(texto);
}

function error(motivo) {
  return JSON.stringify({ error: motivo });
}

module.exports = {
  is_valid_phone: function (phone) {
    return typeof phone === 'string' && /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/i.test(phone);
  },
  is_valid_url_image: esURLImagen,
  is_valid_yt_video: function (url) { return obtenerYouTubeId(url) !== null; },
  is_valid_url_video: esURLVideoArchivo,
  getYTVideoId: obtenerYouTubeId,
  validateMessage: function (datos) {
    if (typeof datos !== 'string' || datos.length > 5000) {
      return error('Formato de mensaje inválido.');
    }

    let obj;
    try { obj = JSON.parse(datos); } catch { return error('JSON inválido.'); }
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return error('El mensaje debe ser un objeto.');
    }

    const mensaje = typeof obj.mensaje === 'string' ? obj.mensaje.trim() : '';
    const nombre = typeof obj.nombre === 'string' && obj.nombre.trim() ? obj.nombre.trim() : 'Anónimo';
    const color = typeof obj.color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(obj.color)
      ? obj.color : '#1D4ED8';

    if (!mensaje || mensaje.length > MAX_MENSAJE || nombre.length > MAX_NOMBRE) {
      return error('El mensaje o el nombre están vacíos o superan el límite permitido.');
    }
    if (contieneCodigoPeligroso(mensaje) || contieneCodigoPeligroso(nombre)) {
      return error('Mensaje bloqueado: contiene código HTML o scripts no permitidos.');
    }

    let tipo = 'texto';
    let url = null;
    let videoId = null;
    if (esURLImagen(mensaje)) {
      tipo = 'imagen';
      url = mensaje;
    } else if ((videoId = obtenerYouTubeId(mensaje)) !== null) {
      tipo = 'youtube';
      url = `https://www.youtube-nocookie.com/embed/${videoId}`;
    } else if (esURLVideoArchivo(mensaje)) {
      tipo = 'video';
      url = mensaje;
    } else if (/(?:\b[a-z][a-z0-9+.-]*:\/\/|\bwww\.|\bjavascript\s*:)/i.test(mensaje)) {
      return error('Solo se permiten URLs de imágenes y videos compatibles (HTTP o HTTPS).');
    }

    return JSON.stringify({ nombre, mensaje, color, tipo, url });
  }
};
