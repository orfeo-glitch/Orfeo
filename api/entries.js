const DB_KEY = 'orfeo_db';

const defaultDb = {
  products: [],
  drop:     { temporada:"SS2026", titulo:"Nuevo Drop", subtitulo:"La nueva colección ya está disponible.", videoUrl:"img/drop.mp4", heroType:"video", heroImg:"" },
  settings: { email:"hola@orfeo.ar", instagram:"#", tiktok:"#", whatsapp:"#" },
  nextId: 1
};

async function kvGet(key) {
  const url   = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  try {
    const res  = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const json = await res.json();
    if (!json.result) return null;

    // result might be a string (need one parse) or already an object
    let parsed = json.result;
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    // legacy: double-stringified — parse again if still a string
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    return parsed;
  } catch(e) {
    console.error('kvGet error:', e.message);
    return null;
  }
}

async function kvSet(key, value) {
  const url   = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('Missing KV env vars');
  // Store as single JSON string — compatible with kvGet's JSON.parse(json.result)
  const res = await fetch(`${url}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(JSON.stringify(value))
  });
  if (!res.ok) throw new Error('KV set failed: ' + res.status);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      let db = await kvGet(DB_KEY);

      // Final safety: if still a string after kvGet, parse one more time
      if (typeof db === 'string') {
        try { db = JSON.parse(db); } catch(e) { db = null; }
      }

      // Validate structure
      if (!db || typeof db !== 'object' || !Array.isArray(db.products)) {
        console.warn('KV returned invalid structure, using defaultDb');
        db = null;
      }

      return res.status(200).json(db || defaultDb);
    } catch (e) {
      console.error('GET error:', e.message);
      return res.status(200).json(defaultDb);
    }
  }

  if (req.method === 'PUT') {
    const secret = process.env.ORFEO_SECRET || 'orfeo2026';
    const token  = (req.headers.authorization || '').replace('Bearer ', '').trim();
    if (token !== secret) return res.status(401).json({ error: 'Unauthorized' });
    try {
      await kvSet(DB_KEY, req.body);
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('PUT error:', e.message);
      return res.status(500).json({ error: 'Storage error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

module.exports.config = {
  api: { bodyParser: { sizeLimit: '4mb' } }
};