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

      const patchScript = `
        <base href="${origin}/" />
        <script>
          (function() {
            // 1. Override parent and top to prevent frame-busting detection
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

            // 2. Override document.domain
            try {
              var _d = document.domain;
              Object.defineProperty(document, 'domain', {
                get: function() { return _d; },
                set: function(v) { return v; },
                configurable: true
              });
            } catch(e) {}

            // 3. Spoof document.referrer to allowed domain
            try {
              Object.defineProperty(document, 'referrer', {
                get: function() { return 'https://animixplay.cz/'; },
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
                if (opts && opts.onAllowed) opts.onAllowed();
                if (opts && opts.onResult) opts.onResult(false);
                return Promise.resolve(false);
              },
              isTopLevel: function() { return true; },
              showBlockMessage: function() {}
            };

            // 5. Neutralize devtoolsDetector (prevents redirecting when DevTools/Console is open)
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

            // 6. Block location.replace / location.assign redirects away to comic.louiv.me
            try {
              window.location.replace = function(url) {
                console.warn('[Proxy Patch] Blocked location.replace to:', url);
              };
              window.location.assign = function(url) {
                console.warn('[Proxy Patch] Blocked location.assign to:', url);
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
