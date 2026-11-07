
'use strict';

const { Pool } = require('pg');

let pool;

function getPool() {
  const host = process.env.PGHOST || '127.0.0.1';
  const local = ['127.0.0.1', 'localhost'].includes(host);

  if (!local &&
      !/^aws-\d+-[a-z0-9-]+\.pooler\.supabase\.com$/.test(host)) {
    throw new Error('Host de PostgreSQL no permitido');
  }

  if (!process.env.PGPASSWORD) {
    throw new Error('Falta PGPASSWORD');
  }

  if (!pool) {
    pool = new Pool({
      host,
      port: Number(process.env.PGPORT || (local ? 54322 : 5432)),
      database: process.env.PGDATABASE || 'postgres',
      user: process.env.PGUSER || 'una_chat_backend',
      password: process.env.PGPASSWORD,

      ssl: local ? false : {
        rejectUnauthorized: true,
        servername: host,
        ...(process.env.PGSSL_ROOT_CERT
          ? { ca: process.env.PGSSL_ROOT_CERT.replace(/\\n/g, '\n') }
          : {})
      },

      max: 2,
      connectionTimeoutMillis: 10000
    });
  }

  return pool;
}

async function getAuth0ClientSecret() {
  const result = await getPool().query(
    'SELECT una_chat_private.get_auth0_client_secret() AS client_secret'
  );

  const secret = result.rows[0]?.client_secret;

  if (typeof secret !== 'string' || !secret) {
    throw new Error('No se pudo recuperar el secreto de Vault');
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
