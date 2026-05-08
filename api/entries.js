const { kv } = require('@vercel/kv');

const defaultDb = {
  products: [
    { id:1, nombre:"Sweater Rayado Marron", precio:30000, img:"product-1.png", categoria:"sweater", stock:true, destacado:true, descripcion:"", fecha:"2026-01-01" },
    { id:2, nombre:"Sweater Azul Splash",   precio:40000, img:"product-2.png", categoria:"sweater", stock:true, destacado:true, descripcion:"", fecha:"2026-01-01" },
    { id:3, nombre:"Sweater Double Azul",   precio:25000, img:"product-3.png", categoria:"sweater", stock:true, destacado:true, descripcion:"", fecha:"2026-01-01" },
    { id:4, nombre:"Sweater Rayado Azul",   precio:30000, img:"product-4.png", categoria:"sweater", stock:true, destacado:true, descripcion:"", fecha:"2026-01-01" },
  ],
  drop:     { temporada:"SS2026", titulo:"Nuevo Drop", subtitulo:"La nueva colección ya está disponible.", videoUrl:"drop.mp4" },
  settings: { email:"hola@orfeo.ar", instagram:"#", tiktok:"#", whatsapp:"#" },
  nextId: 5
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const db = await kv.get('orfeo_db');
      return res.status(200).json(db || defaultDb);
    } catch (e) {
      console.error('KV get error:', e.message);
      return res.status(200).json(defaultDb);
    }
  }

  if (req.method === 'PUT') {
    const secret = process.env.ORFEO_SECRET || 'orfeo2026';
    const token  = (req.headers.authorization || '').replace('Bearer ', '').trim();
    if (token !== secret) return res.status(401).json({ error: 'Unauthorized' });
    try {
      await kv.set('orfeo_db', req.body);
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('KV set error:', e.message);
      return res.status(500).json({ error: 'Storage error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

module.exports.config = {
  api: { bodyParser: { sizeLimit: '4mb' } }
};