const MORPHO_GRAPHQL_URL = 'https://blue-api.morpho.org/graphql';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const upstream = await fetch(MORPHO_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {}),
    });

    const text = await upstream.text();
    res.status(upstream.status).setHeader('Content-Type', 'application/json').send(text);
  } catch {
    res.status(502).json({ error: 'Unable to reach Morpho API' });
  }
}
