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

      // Strip ad/tracking scripts from original HTML
      html = html.replace(/<script[^>]*src=["'][^"']*(nekostream|statlytic|bodegashunlike|linkmansclate)[^"']*["'][^>]*><\/script>/gi, '');

      // Patch script to override window.parent/window.top and document.domain before player scripts execute
      const patchScript = `
        <base href="${origin}/" />
        <script>
          (function() {
            // 1. Override Document.prototype.referrer and document.referrer
            try {
              Object.defineProperty(Document.prototype, 'referrer', {
                get: function() { return 'https://animixplay.cz/'; },
                configurable: true
              });
            } catch(e) {}
            try {
              Object.defineProperty(document, 'referrer', {
                get: function() { return 'https://animixplay.cz/'; },
                configurable: true
              });
            } catch(e) {}

            // 2. Override Window.prototype and window parent/top to prevent frame-busting
            try {
              Object.defineProperty(Window.prototype, 'parent', {
                get: function() { return this; },
                configurable: true
              });
              Object.defineProperty(Window.prototype, 'top', {
                get: function() { return this; },
                configurable: true
              });
            } catch(e) {}
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

            // 3. Override document.domain
            try {
              var _d = 'animixplay.cz';
              Object.defineProperty(document, 'domain', {
                get: function() { return _d; },
                set: function(v) { return v; },
                configurable: true
              });
            } catch(e) {}

            // 4. Neutralize SandboxDetector
            window.SandboxDetector = {
              detect: function(cb) {
                if (typeof cb === 'function') cb(false);
                return Promise.resolve(false);
              },
              run: function(opts) {
                if (opts && opts.onAllowed) try { opts.onAllowed(); } catch(err) {}
                if (opts && opts.onResult) try { opts.onResult(false); } catch(err) {}
                return Promise.resolve(false);
              },
              isTopLevel: function() { return true; },
              showBlockMessage: function() {}
            };

            // 5. Neutralize devtoolsDetector
            var dummyDevTools = {
              addListener: function() {},
              removeListener: function() {},
              isLaunch: function() { return false; },
              launch: function() {},
              stop: function() {},
              start: function() {}
            };
            try {
              Object.defineProperty(window, 'devtoolsDetector', {
                get: function() { return dummyDevTools; },
                set: function() {},
                configurable: true
              });
            } catch(e) {}

            // 6. Block redirect calls to comic.louiv.me
            try {
              var origReplace = window.location.replace.bind(window.location);
              var origAssign = window.location.assign.bind(window.location);
              window.location.replace = function(url) {
                if (url && (String(url).includes('comic.louiv.me') || String(url).includes('louiv.me'))) {
                  console.warn('[Proxy Patch] Blocked location.replace to:', url);
                  return;
                }
                return origReplace(url);
              };
              window.location.assign = function(url) {
                if (url && (String(url).includes('comic.louiv.me') || String(url).includes('louiv.me'))) {
                  console.warn('[Proxy Patch] Blocked location.assign to:', url);
                  return;
                }
                return origAssign(url);
              };
            } catch(e) {}

            // 7. Intercept script creation to block ad scripts dynamically
            try {
              var origCreateElement = document.createElement.bind(document);
              document.createElement = function(tagName, options) {
                var el = origCreateElement(tagName, options);
                if (tagName && String(tagName).toLowerCase() === 'script') {
                  var origSetAttribute = el.setAttribute.bind(el);
                  el.setAttribute = function(name, val) {
                    if (name === 'src' && typeof val === 'string') {
                      if (val.includes('nekostream') || val.includes('linkmansclate') || val.includes('bodegashunlike')) {
                        console.warn('[Proxy Patch] Blocked ad script:', val);
                        return;
                      }
                    }
                    return origSetAttribute(name, val);
                  };
                }
                return el;
              };
            } catch(e) {}
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
