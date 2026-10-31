
'use strict';

const Sentry = require('@sentry/node');

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL ? 'vercel' : 'local',
    tracesSampleRate: 0
  });
}

module.exports = Sentry;
