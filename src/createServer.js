/// <reference types="@fastly/js-compute" />

import { env } from 'fastly:env';
import { SimpleCache } from 'fastly:cache';
import { LinearRouter } from 'hono/router/linear-router'
import { Hono } from 'hono'
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

// TODO: Implement ReadableStream getIterator() and [@@asyncIterator]() methods
async function streamToString(stream) {
	const decoder = new TextDecoder();
	let string = '';
	let reader = stream.getReader()
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const { done, value } = await reader.read();
		if (done) {
			return string;
		}
		string += decoder.decode(value)
	}
}

function isRunningLocally() {
    return env('FASTLY_SERVICE_VERSION') == '';
}

async function readThroughCache(c, next) {
    if (isRunningLocally()) {
        return await next()
    }
    const url = new URL(c.req.url)
    const key = url.pathname + url.search;
    const ten_minutes = 600_000;
    let bodykey = `__body__${key}`
    let headerskey = `__headers__${key}`
    let body = SimpleCache.get(bodykey);
    if (body) {
        let headers = SimpleCache.get(headerskey);
        if (headers) {
            headers = await headers.json();
            headers['server-timing'] = "hit-state;desc=hit";
            return new Response(body.body, {headers})
        }
    }
    await next();
    let [body1, body2] = c.res.body.tee();
    c.executionCtx.waitUntil(streamToString(body1).then(value => {
        return SimpleCache.getOrSet(bodykey, () => {
            return {
                value,
                ttl: ten_minutes
            }
        });
    }));
    const headers = Object.fromEntries(c.res.headers.entries())
    c.executionCtx.waitUntil(SimpleCache.getOrSet(headerskey, () => {
        return {
            value: JSON.stringify(headers),
            ttl: ten_minutes
        };
    }));
    c.res = new Response(body2, c.res)
    c.res.headers.append('server-timing',  "hit-state;desc=miss");
}

export function createServer() {
    const app = new Hono({ router: new LinearRouter() })

    app.use('*', logger());

    app.use('*', cors());

    app.use('*', async (c, next) => {
        c.res.headers.append('server-timing', "time-start-msec;dur=" + performance.now())
        await next();
        c.res.headers.append('server-timing', "time-elapsed;dur=" + performance.now())
        c.res.headers.append('server-timing', "fastly-pop;desc=" + (env("FASTLY_POP") || 'local'));
        c.header('FASTLY_SERVICE_VERSION', env('FASTLY_SERVICE_VERSION'));
        c.header("x-compress-hint", "on");
        c.header("x-trailer-server-timing", "rtt,timestamp,retrans");
	c.headers("alt-svc", 'h3=":443";ma=86400,h3-29=":443";ma=86400,h3-27=":443";ma=86400');
    });

    // app.use('*', async (c, next) => {
    //     const url = new URL(c.req.url);
    //     if (url.hostname.startsWith('mod.')) {
    //         url.searchParams.set('module', '');
    //         c.req = new Request(url, c.req);
    //     }
    //     await next();
    // });

    // app.use('*', async (c) => {
    //     const res = await get('public', c.req);
    //     if (res) {
    //         return res;
    //     }
    // });

    app.get('/',
    readThroughCache,
    serveMainPage);

    app.get('/favicon.ico',
    readThroughCache,
    c => c.body(favicon, {
        headers: {
            'content-type': 'image/svg+xml',
            'cache-control': 'public, max-age=31536000',
            'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
            'x-content-type-options': 'nosniff',
            'x-compress-hint': 'on',
        }
    }));
    app.get('/favicon.svg',
    readThroughCache,
    c => c.body(favicon, {
        headers: {
            'content-type': 'image/svg+xml',
            'cache-control': 'public, max-age=31536000',
            'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
            'x-content-type-options': 'nosniff',
            'x-compress-hint': 'on',
        }
    }));

    // app.get('/api/stats', serveStats);

    app.use('*', redirectLegacyURLs);

    app.use(
        '/browse/*',
        async (c, next) => {
            c.req.browse = true;
            await next()
        },
        validatePackagePathname,
        validatePackageName,
        validatePackageVersion,
        readThroughCache,
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
    app.get(
        '*',
        async (c, next) => {
            const url = new URL(c.req.url);
            const meta = url.searchParams.has('meta');
            const module = url.searchParams.has('module');
            c.req.meta = meta;
            c.req.module = module;
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
        readThroughCache,
        async (c, next) => {
            if (c.req.meta) {
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
            if (c.req.module) {
                return await serveModule(c)
            } else {
                return await serveFile(c)
            }
        }
    );
    
    return app;
}
