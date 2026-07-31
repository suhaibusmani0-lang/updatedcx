const http = require('http');

const PORT = 8001;
const TARGET_HOST = '127.0.0.1';
const TARGET_PORT = 3000;

const server = http.createServer((req, res) => {
  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `${TARGET_HOST}:${TARGET_PORT}` },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, message: 'Proxy error: ' + err.message }));
  });

  req.pipe(proxyReq, { end: true });
});

server.on('upgrade', (req, socket, head) => {
  const options = {
    host: TARGET_HOST,
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `${TARGET_HOST}:${TARGET_PORT}` },
  };
  const proxyReq = http.request(options);
  proxyReq.on('upgrade', (proxyRes, proxySocket) => {
    socket.write(`HTTP/1.1 101 Switching Protocols\r\n` +
      Object.entries(proxyRes.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n') +
      `\r\n\r\n`);
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });
  proxyReq.on('error', () => socket.end());
  proxyReq.end();
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`API proxy listening on ${PORT} → ${TARGET_HOST}:${TARGET_PORT}`);
});
