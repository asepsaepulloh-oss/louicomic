import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Endpoint to proxy stream embed pages and patch sandbox/document.domain checks
  app.get('/api/stream-embed', async (req, res) => {
    try {
      const urlParam = req.query.url as string;
      if (!urlParam) {
        return res.status(400).send('Missing url parameter');
      }

      const targetUrl = decodeURIComponent(urlParam);
      const urlObj = new URL(targetUrl);
      const origin = urlObj.origin;

      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://comic.louiv.me/',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        return res
          .status(response.status)
          .send(`Failed to fetch stream: ${response.statusText}`);
      }

      let html = await response.text();

      // Patch script to override window.parent/window.top and document.domain before player scripts execute
      const patchScript = `
        <base href="${origin}/" />
        <script>
          (function() {
            try {
              Object.defineProperty(window, 'parent', {
                get: function() { return window; },
                configurable: true
              });
              Object.defineProperty(window, 'top', {
                get: function() { return window; },
                configurable: true
              });
            } catch(e) {}

            try {
              var _d = document.domain;
              Object.defineProperty(document, 'domain', {
                get: function() { return _d; },
                set: function(v) { return v; },
                configurable: true
              });
            } catch(e) {}

            window.SandboxDetector = {
              detect: function() { return Promise.resolve(false); },
              run: function() { return Promise.resolve(false); },
              isTopLevel: function() { return true; },
              showBlockMessage: function() {}
            };
          })();
        </script>
      `;

      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${patchScript}`);
      } else if (html.includes('<HEAD>')) {
        html = html.replace('<HEAD>', `<HEAD>${patchScript}`);
      } else {
        html = patchScript + html;
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error: any) {
      res.status(500).send(`Proxy error: ${error?.message || error}`);
    }
  });

  // Proxy for shinigami API
  app.use('/shinigami-proxy', async (req, res) => {
    try {
      const targetUrl = `https://apis.louiv.me${req.url}`;
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
        },
      });
      const data = await response.arrayBuffer();
      res.status(response.status);
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() !== 'content-encoding') {
          res.setHeader(key, value);
        }
      });
      res.send(Buffer.from(data));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
