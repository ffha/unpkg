import { createPackageURL } from '../utils/createPackageURL.js';
import { getPackage } from '../utils/npm.js';
import { Untar } from '../actions/Untar.js';
import { fileMetadata } from '../actions/fileMetadata.js';

function fileRedirect(c, entry) {
  // Redirect to the file with the extension so it's
  // clear which file is being served.
  return new Response('', {
    status: 302,
    headers: {
      'Cache-Control': 'public, max-age=31536000', // 1 year
      'Surrogate-Key': 'redirect, file-redirect',
      Location: createPackageURL(
        c.req.packageName,
        c.req.packageVersion,
        entry.path,
        new URL(c.req.url).searchParams
      )
    }
  });
}

function indexRedirect(c, entry) {
  // Redirect to the index file so relative imports
  // resolve correctly.
  return new Response('', {
    status: 302,
    headers: {
      'Cache-Control': 'public, max-age=31536000', // 1 year
      'Surrogate-Key': 'redirect, file-redirect',
      Location: createPackageURL(
        c.req.packageName,
        c.req.packageVersion,
        entry.path,
        new URL(c.req.url).searchParams
      )
    }
  });
}

/**
 * Search the given tarball for entries that match the given name.
 * Follows node's resolution algorithm.
 * https://nodejs.org/api/modules.html#modules_all_together
 */
async function searchEntries(arrayBuffer, filename) {
  // filename = /some/file/name.js or /some/dir/name
  const extractor = new Untar(arrayBuffer);
  let file = extractor.getFile(filename);
  if (!file) {
    const jsEntryFilename = `${filename}.js`;
    file = extractor.getFile(jsEntryFilename);
    if (!file) {
      const jsonEntryFilename = `${filename}.json`;
      file = extractor.getFile(jsonEntryFilename);
    }
  }
  if (!file) {
    // 404
    return new Response('oops', { status: 404 });
  }

  const md = await fileMetadata(file);
  md.size = file.buffer.byteLength;
  md.content = file.buffer;

  return {
    foundEntry: md,
  };
}

/**
 * Fetch and search the archive to try and find the requested file.
 * Redirect to the "index" file if a directory was requested.
 */
export async function findEntry(c, next) {
  const arrayBuffer = await getPackage(c.req.packageName, c.req.packageVersion);
  const { foundEntry: entry, matchingEntries: entries } = await searchEntries(
    arrayBuffer,
    c.req.filename
  );

  if (!entry) {
    return c.text(`Cannot find "${c.req.filename}" in ${c.req.packageSpec}`, {
      status: 404,
      headers: {
        'Cache-Control': 'public, max-age=31536000', // 1 year
        'Surrogate-Key': 'missing, missing-entry'
      }
    })
  }

  if (entry.type === 'file' && entry.path !== c.req.filename) {
    return fileRedirect(c, entry);
  }

  if (entry.type === 'directory') {
    // We need to redirect to some "index" file inside the directory so
    // our URLs work in a similar way to require("lib") in node where it
    // uses `lib/index.js` when `lib` is a directory.
    const indexEntry =
    entries[`${c.req.filename}/index.js`] ||
    entries[`${c.req.filename}/index.json`];

    if (indexEntry && indexEntry.type === 'file') {
      return indexRedirect(c, indexEntry);
    }

    return c.text(`Cannot find an index in "${c.req.filename}" in ${c.req.packageSpec}`,{
      status: 404,
      headers: {
        'Cache-Control': 'public, max-age=31536000', // 1 year
        'Surrogate-Key': 'missing, missing-index'
      }
    });
  }

  c.req.entry = entry;

  await next();
}
