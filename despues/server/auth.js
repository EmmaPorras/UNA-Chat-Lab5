
'use strict';

const { auth } = require('express-openid-connect');
const { getAuth0ClientSecret } = require('./vault');

async function createAuthMiddleware() {
  const required = [
    'ISSUER_BASE_URL',
    'CLIENT_ID',
    'BASE_URL',
    'SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      'Falta configuración de Auth0: ' + missing.join(', ')
    );
  }

  // Recuperar la credencial desde Supabase Vault.
  // No guardar ni imprimir el Client Secret.
  const clientSecret = await getAuth0ClientSecret();

  return auth({
    authRequired: false,
    auth0Logout: true,

    issuerBaseURL: process.env.ISSUER_BASE_URL,
    clientID: process.env.CLIENT_ID,
    clientSecret,
    clientAuthMethod: 'client_secret_post',

    baseURL: process.env.BASE_URL,
    secret: process.env.SECRET,

    authorizationParams: {
      response_type: 'code',
      scope: 'openid profile email'
    },

    routes: {
      callback: '/auth/callback'
    }
  });
}

module.exports = {
  createAuthMiddleware
};
