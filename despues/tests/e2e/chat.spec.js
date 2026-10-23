'use strict';
const { test, expect } = require('@playwright/test');

async function enviar(page, texto) {
  await page.getByRole('textbox', { name: 'Nombre' }).fill('Ana');
  await page.getByRole('textbox', { name: 'Mensaje' }).fill(texto);
  await page.getByRole('button', { name: 'Enviar' }).click();
}

test('muestra una imagen enviada por el chat y termina de cargarla', async ({ page }) => {
  await page.goto('/');
  await enviar(page, new URL('/media/ejemplo.png', page.url()).toString());
  const imagen = page.locator('#messages img').last();
  await expect(imagen).toBeVisible();
  await expect.poll(() => imagen.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
});

test('muestra un reproductor de video y carga el video MP4', async ({ page }) => {
  await page.goto('/');
  await enviar(page, new URL('/media/ejemplo.mp4', page.url()).toString());
  const video = page.locator('#messages video').last();
  await expect(video).toBeVisible();
  await expect.poll(() => video.evaluate(v => v.readyState >= 2)).toBe(true);
});

test('bloquea script y no muestra alerta JavaScript', async ({ page }) => {
  let alertDetectada = false;
  page.on('dialog', async dialogo => { alertDetectada = true; await dialogo.dismiss(); });
  await page.goto('/');
  await enviar(page, "<script>alert('Inyección de script');</script>");
  await expect(page.getByRole('alert')).toContainText('bloqueado');
  await expect(page.locator('#messages li')).toHaveCount(0);
  expect(alertDetectada).toBe(false);
});
