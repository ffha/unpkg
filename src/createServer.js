import { LinearRouter } from 'hono/router/linear-router'
import { Hono } from 'hono'
import { etag } from 'hono/etag'
import { secureHeaders } from 'hono/secure-headers'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { serveMainPage } from "./actions/serveMainPage.js";
import { serveFileMetadata } from './actions/serveFileMetadata.js';
import { serveDirectoryMetadata } from './actions/serveDirectoryMetadata.js';
import { redirectLegacyURLs } from './middleware/redirectLegacyURLs.js';
import { validateFilename } from './middleware/validateFilename.js';
import { validatePackagePathname } from './middleware/validatePackagePathname.js';
import { validatePackageName } from './middleware/validatePackageName.js';
import { validatePackageVersion } from './middleware/validatePackageVersion.js';
import { findEntry } from './middleware/findEntry.js';
import { serveFile } from './actions/serveFile.js';
import { serveModule } from './actions/serveModule.js';
import { serveDirectoryBrowser } from "./actions/serveDirectoryBrowser.js";
import { serveFileBrowser } from "./actions/serveFileBrowser.js";
import favicon from './favicon.js'


export function createServer() {
    const app = new Hono({ router: new LinearRouter() })

    app.onError((error, c) => {
        console.error('Internal App Error:', error, error.stack, error.message);
        return c.text('Internal Server Error', 500)
    });
    app.use('*', etag())
    app.use(logger());
    app.use('*', secureHeaders({
        crossOriginResourcePolicy: "cross-origin",
        crossOriginOpenerPolicy: false,
        referrerPolicy: false,
        strictTransportSecurity: "max-age=15552000",
        xDnsPrefetchControl: false,
        xDownloadOptions: false,
        xFrameOptions: false,
        xPermittedCrossDomainPolicies: false,
        xXssProtection: false
    }))
    app.use("*", cors());

    app.get('/', serveMainPage);

    app.get('/favicon.ico',
    c => c.body(favicon, {
        headers: {
            'content-type': 'image/svg+xml',
            'cache-control': 'public, max-age=31536000',
            'x-content-type-options': 'nosniff',
        }
    }));
    app.get('/favicon.svg', c => c.body(favicon, {
        headers: {
            'content-type': 'image/svg+xml',
            'cache-control': 'public, max-age=31536000',
            'x-content-type-options': 'nosniff',
        }
    }));

    // app.get('/api/stats', serveStats);

    app.use('*', redirectLegacyURLs);

    app.use(
        '/browse/*',
        async (c, next) => {
            c.set("browse", true);
            await next()
        },
        validatePackagePathname,
        validatePackageName,
        validatePackageVersion,
        async (c) => {
            const path = new URL(c.req.url).pathname;
            let response;
            if (path.endsWith('/')) {
                response = await serveDirectoryBrowser(c)
            } else {
                response =  await serveFileBrowser(c)
            }
            return response
        }
    );

    // We need to route in this weird way because Express
    // doesn't have a way to route based on query params.
    app.use(
        '*',
        async (c, next) => {
            const url = new URL(c.req.url);
            const meta = url.searchParams.has('meta');
            const module = url.searchParams.has('module');
            c.set("meta", meta);
            c.set("module", module)
            if (!meta && !module) {
                // Send old */ requests to the new /browse UI.
                const path = new URL(c.req.url).pathname;
                if (path.endsWith('/')) {
                    return c.redirect('/browse' + new URL(c.req.url).pathname, 302);
                }
            }
            await next();
        },
        validatePackagePathname,
        validatePackageName,
        validatePackageVersion,
        validateFilename,
        async (c, next) => {
            if (c.var.meta) {
                const path = new URL(c.req.url).pathname;
                if (path.endsWith('/')) {
                    return await serveDirectoryMetadata(c)
                } else {
                    return await serveFileMetadata(c)
                }
            }
            await next();
        },
        findEntry,
        async (c) => {
            if (c.var.module) {
                return await serveModule(c)
            } else {
                return await serveFile(c)
            }
        }
    );
    
    return app;
}
