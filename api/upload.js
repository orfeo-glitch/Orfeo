const { put } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, x-filename, x-content-type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = process.env.ORFEO_SECRET || 'orfeo2026';
  const token  = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (token !== secret) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const filename    = req.headers['x-filename']     || `upload-${Date.now()}.jpg`;
    const contentType = req.headers['x-content-type'] || 'image/jpeg';

    // Leer el body como buffer
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const blob = await put(`orfeo/${filename}`, buffer, {
      access: 'public',
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return res.status(200).json({ url: blob.url });
  } catch (e) {
    console.error('Upload error:', e.message);
    return res.status(500).json({ error: 'Upload failed: ' + e.message });
  }
};

module.exports.config = {
  api: {
    bodyParser: false, // necesario para leer raw body
    sizeLimit: '10mb',
  },
};