module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { nombre, apellido, email, direccion, ciudad, cp, notas, items, total } = req.body;

  if (!nombre || !email || !items || items.length === 0) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  const itemsHtml = items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e8e5de;font-size:14px;color:#0d0d0d;">${i.nombre}${i.selectedTalle ? ` — ${i.selectedTalle}` : ''}${i.selectedColor ? ` / ${i.selectedColor}` : ''}</td>
      <td style="padding:10px 0;border-bottom:1px solid #e8e5de;font-size:14px;color:#888;text-align:center;">×${i.qty}</td>
      <td style="padding:10px 0;border-bottom:1px solid #e8e5de;font-size:14px;color:#0d0d0d;text-align:right;">$${Number(i.precio * i.qty).toLocaleString('es-AR')}</td>
    </tr>`).join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0ede6;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;padding:0;">

    <!-- header -->
    <div style="background:#0d0d0d;padding:32px 40px;">
      <p style="margin:0;font-size:20px;font-weight:400;letter-spacing:0.06em;color:#ffffff;">Orfeo®</p>
      <p style="margin:6px 0 0;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.4);">Nuevo pedido recibido</p>
    </div>

    <!-- body -->
    <div style="padding:36px 40px;">

      <p style="font-size:13px;font-weight:300;color:#888;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 6px;">Comprador</p>
      <p style="font-size:18px;font-weight:300;color:#0d0d0d;margin:0 0 24px;">${nombre} ${apellido}</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:8px 0;font-size:12px;color:#888;width:120px;vertical-align:top;">Email</td>
          <td style="padding:8px 0;font-size:13px;color:#0d0d0d;font-weight:300;">${email}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:12px;color:#888;vertical-align:top;">Dirección</td>
          <td style="padding:8px 0;font-size:13px;color:#0d0d0d;font-weight:300;">${direccion}, ${ciudad} (${cp})</td>
        </tr>
        ${notas ? `<tr>
          <td style="padding:8px 0;font-size:12px;color:#888;vertical-align:top;">Notas</td>
          <td style="padding:8px 0;font-size:13px;color:#0d0d0d;font-weight:300;">${notas}</td>
        </tr>` : ''}
      </table>

      <div style="height:1px;background:#e8e5de;margin:24px 0;"></div>

      <p style="font-size:12px;font-weight:400;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin:0 0 16px;">Productos</p>
      <table style="width:100%;border-collapse:collapse;">
        ${itemsHtml}
      </table>

      <div style="display:flex;justify-content:space-between;padding:16px 0 0;border-top:2px solid #0d0d0d;margin-top:4px;">
        <span style="font-size:13px;font-weight:400;letter-spacing:0.06em;text-transform:uppercase;color:#0d0d0d;">Total</span>
        <span style="font-size:16px;font-weight:300;color:#0d0d0d;">$${Number(total).toLocaleString('es-AR')}</span>
      </div>

      <div style="background:#f0ede6;padding:16px 20px;margin-top:28px;">
        <p style="margin:0;font-size:12px;font-weight:300;color:#888;line-height:1.6;">
          <strong style="color:#0d0d0d;">Pago a coordinar.</strong> Contactate con el comprador para acordar el método de pago y envío.
        </p>
      </div>

    </div>

    <!-- footer -->
    <div style="padding:20px 40px;border-top:1px solid #e8e5de;">
      <p style="margin:0;font-size:11px;color:#bbb;font-weight:300;">Orfeo® — Buenos Aires, Argentina — Est. 2026</p>
    </div>

  </div>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    'Orfeo <onboarding@resend.dev>',
        to:      ['somosorfeo@gmail.com'],
        replyTo: email,
        subject: `Nuevo pedido — ${nombre} ${apellido}`,
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Error al enviar el email' });
    }

    return res.status(200).json({ ok: true });

  } catch (e) {
    console.error('Send error:', e.message);
    return res.status(500).json({ error: 'Error interno' });
  }
};

module.exports.config = {
  api: { bodyParser: { sizeLimit: '1mb' } }
};
