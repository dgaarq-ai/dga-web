// netlify/functions/verify-code.js
//
// Valida un código PRO ingresado dentro de HOME SCORE® o Flipping.
// Permite hasta 3 activaciones por código (mismo comprador, distintos navegadores/dispositivos)
// para no generar friction legítima, pero corta la reventa masiva de un mismo código.
//
// Uso: GET /.netlify/functions/verify-code?code=DGA-HOME-A1B2C3

const { getStore } = require('@netlify/blobs');

const MAX_USES = 3;

exports.handler = async (event) => {
  const { code } = event.queryStringParameters || {};
  if (!code) return { statusCode: 400, body: JSON.stringify({ valid: false, error: 'Falta el código' }) };

  const store = getStore('pro-codes');
  const entry = await store.get(`code:${code.toUpperCase()}`, { type: 'json' });

  if (!entry) return { statusCode: 200, body: JSON.stringify({ valid: false, error: 'Código inexistente' }) };
  if (entry.usedCount >= MAX_USES) {
    return { statusCode: 200, body: JSON.stringify({ valid: false, error: 'Código usado en demasiados dispositivos' }) };
  }

  entry.usedCount += 1;
  await store.setJSON(`code:${code.toUpperCase()}`, entry);

  return { statusCode: 200, body: JSON.stringify({ valid: true, product: entry.product }) };
};
