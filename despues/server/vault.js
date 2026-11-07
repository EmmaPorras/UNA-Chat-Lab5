
'use strict';

const { Pool } = require('pg');

let pool;

function getPool() {
  const host = process.env.PGHOST || '127.0.0.1';

  if (!['127.0.0.1', 'localhost'].includes(host)) {
    throw new Error('Esta configuración solo permite Supabase local');
  }

  if (!process.env.PGPASSWORD) {
    throw new Error('Falta PGPASSWORD en el archivo .env');
  }

  if (!pool) {
    pool = new Pool({
      host,
      port: Number(process.env.PGPORT || 54322),
      database: process.env.PGDATABASE || 'postgres',
      user: process.env.PGUSER || 'una_chat_backend',
      password: process.env.PGPASSWORD,
      ssl: false,
      max: 2,
      connectionTimeoutMillis: 5000
    });
  }

  return pool;
}

async function getAuth0ClientSecret() {
  const resultado = await getPool().query(
    'SELECT una_chat_private.get_auth0_client_secret() AS client_secret'
  );

  const secret = resultado.rows[0]?.client_secret;

  if (!secret || typeof secret !== 'string') {
    throw new Error('No se pudo recuperar el Client Secret');
  }

  return secret;
}

async function closeVault() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  getAuth0ClientSecret,
  closeVault
};
