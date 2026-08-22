export async function scanWorldAuto(worldName) {
  const targetUrl = 'https://gtmart.shop/scan';
  const apiEndpoint = 'https://gtmart.shop/api/scan';

  // 1. Dapatkan Session Cookie otomatis
  const pageRes = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });

  // Ekstrak set-cookie dari header
  const rawSetCookie = pageRes.headers.getSetCookie 
    ? pageRes.headers.getSetCookie() 
    : [pageRes.headers.get('set-cookie') || ''];

  const dynamicCookie = rawSetCookie
    .filter(Boolean)
    .map(c => c.split(';')[0])
    .join('; ');

  // 2. Ekstrak X-Gtm-Token dari HTML
  const html = await pageRes.text();
  const tokenMatch = html.match(/\b(\d{13}\.[a-f0-9]{32,64})\b/i);

  if (!tokenMatch) {
    throw new Error('Gagal mengekstrak token. Cek apakah IP terkena rate limit.');
  }

  const token = tokenMatch[1];
  console.log(`[+] Token didapat: ${token}`);
  console.log(`[+] Cookie didapat: ${dynamicCookie}`);

  // 3. Request Scan API
  const scanRes = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-gtm-token': token,
      'Cookie': dynamicCookie,
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
      'Referer': targetUrl,
      'Origin': 'https://gtmart.shop'
    },
    body: JSON.stringify({ world: worldName.trim().toUpperCase() })
  });

  if (!scanRes.ok) {
    throw new Error(`API Scan Error [${scanRes.status}]: ${await scanRes.text()}`);
  }

  return await scanRes.json();
}