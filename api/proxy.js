export default async function handler(req, res) {
  const targetPath = req.headers['x-target-path']

  if (!targetPath) {
    return res.status(400).json({ error: 'Missing x-target-path header' })
  }

  const fetchUrl = `https://api.wts.chat${targetPath}`

  const options = {
    method: req.method,
    headers: {
      'Authorization': req.headers.authorization || '',
      'Content-Type': 'application/json',
    },
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    // Vercel pode entregar req.body já parseado ou como string — normaliza os dois
    if (req.body !== undefined && req.body !== null) {
      options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    }
  }

  try {
    const upstream = await fetch(fetchUrl, options)
    const text = await upstream.text()

    // Tenta parsear como JSON; se falhar, devolve texto puro
    try {
      const json = JSON.parse(text)
      return res.status(upstream.status).json(json)
    } catch {
      return res.status(upstream.status).end(text)
    }
  } catch (err) {
    console.error('[proxy] fetch error →', fetchUrl, err.message)
    return res.status(500).json({ error: err.message, target: fetchUrl })
  }
}
