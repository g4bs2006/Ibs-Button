export default async function handler(req, res) {
  const targetPath = req.headers['x-target-path'];
  
  if (!targetPath) {
    return res.status(400).json({ error: 'Missing x-target-path header' });
  }

  const fetchUrl = `https://api.wts.chat${targetPath}`;
  
  const options = {
    method: req.method,
    headers: {
      'Authorization': req.headers.authorization,
      'Content-Type': req.headers['content-type'] || 'application/json'
    }
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    options.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
  }

  try {
    const fetchRes = await fetch(fetchUrl, options);
    const contentType = fetchRes.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await fetchRes.json();
      return res.status(fetchRes.status).json(data);
    } else {
      const text = await fetchRes.text();
      return res.status(fetchRes.status).send(text);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
