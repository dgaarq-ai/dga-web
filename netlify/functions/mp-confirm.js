// netlify/functions/mp-confirm.js
//
// Verifica un pago de Mercado Pago y entrega un código PRO único y automático.
// Requiere una variable de entorno en Netlify: MP_ACCESS_TOKEN
// (Panel de Netlify → Site settings → Environment variables. Nunca pegar el token en el código ni en el chat.)
//
// Uso desde la página de "gracias" después de que Mercado Pago redirige de vuelta:
//   GET /.netlify/functions/mp-confirm?payment_id=XXXX&product=homescore-pro
//
// Requiere el paquete @netlify/blobs (se instala solo al conectar el repo — no hace falta base de datos externa).

const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const { payment_id, product } = event.queryStringParameters || {};

  if (!payment_id || !product) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Falta payment_id o product' }) };
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Falta configurar MP_ACCESS_TOKEN en Netlify' }) };
  }

  // 1) Confirmar el pago directamente contra la API de Mercado Pago (nunca confiar solo en el redirect del navegador)
  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!mpRes.ok) {
    return { statusCode: 402, body: JSON.stringify({ error: 'No se pudo verificar el pago' }) };
  }
  const payment = await mpRes.json();
  if (payment.status !== 'approved') {
    return { statusCode: 402, body: JSON.stringify({ error: 'Pago no aprobado', status: payment.status }) };
  }

  // 2) Evitar generar dos códigos distintos si el comprador recarga la página de gracias
  const store = getStore('pro-codes');
  const existing = await store.get(`payment:${payment_id}`, { type: 'json' });
  if (existing) {
    return { statusCode: 200, body: JSON.stringify({ code: existing.code }) };
  }

  // 3) Generar un código único, legible, no adivinable
  const code = `DGA-${product.toUpperCase().slice(0, 4)}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  await store.setJSON(`payment:${payment_id}`, { code, product, createdAt: new Date().toISOString() });
  await store.setJSON(`code:${code}`, { paymentId: payment_id, product, usedCount: 0 });

  return { statusCode: 200, body: JSON.stringify({ code }) };
};
