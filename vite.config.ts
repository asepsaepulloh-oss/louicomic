import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

function streamProxyPlugin() {
  const handler = async (req: any, res: any, next: any) => {
    if (!req.url?.startsWith('/api/stream-embed')) {
      return next();
    }
    try {
      const urlParam = new URL(req.url, 'http://localhost').searchParams.get('url');
      if (!urlParam) {
        res.statusCode = 400;
        res.end('Missing url parameter');
        return;
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
        res.statusCode = response.status;
        res.end(`Failed to fetch stream: ${response.statusText}`);
        return;
      }

      let html = await response.text();

      // Strip ad/tracking scripts from original HTML
      html = html.replace(/<script[^>]*src=["'][^"']*(nekostream|statlytic|bodegashunlike|linkmansclate)[^"']*["'][^>]*><\/script>/gi, '');

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
      res.end(html);
    } catch (error: any) {
      res.statusCode = 500;
      res.end(`Proxy error: ${error?.message || error}`);
    }
  };

  return {
    name: 'stream-proxy-plugin',
    configureServer(server: any) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), streamProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/shinigami-proxy': {
          target: 'https://apis.louiv.me',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/shinigami-proxy/, ''),
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'application/json, text/plain, */*',
          },
        },
      },
    },
  };
});
