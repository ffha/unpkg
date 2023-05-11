import { Untar } from "./Untar";
import { getPackage } from '../utils/npm.js';
import { fileMetadata } from "./fileMetadata.js";
import { toType } from "./toType";
function dirname(path) {
  if (!path.length) {
    return '.';
  }
  const hasRoot = path[0] === '/';
  let end;
  for (let i = path.length - 1; i >= 1; --i) {
    if (path[i] === '/') {
      end = i;
      break;
    }
  }

  if (!end) { return hasRoot ? '/' : '.'; }
  if (hasRoot && end === 1) { return '//'; }
  return path.slice(0, end);
}

async function findMatchingEntries(stream, filename) {
  const extractor = new Untar(stream);
  const entries = {};

  entries[filename] = { path: filename, type: '5' };
  for (let header of extractor.getFiles()) {
    const entry = {
      // Most packages have header names that look like `package/index.js`
      // so we shorten that to just `/index.js` here. A few packages use a
      // prefix other than `package/`. e.g. the firebase package uses the
      // `firebase_npm/` prefix. So we just strip the first dir name.
      path: header.path.replace(/^[^/]+\/?/, '/'),
      type: header.type
    };

    // Dynamically create "directory" entries for all subdirectories
    // in this entry's path. Some tarballs omit directory entries for
    // some reason, so this is the "brute force" method.
    let dir = dirname(entry.path);
    while (dir !== '/') {
      if (!entries[dir] && dir.startsWith(filename)) {
        entries[dir] = { path: dir, type: '5' };
      }
      dir = dirname(dir);
    }

    // Ignore non-files and files that don't match the prefix.
    if (entry.type !== '0' || !entry.path.startsWith(filename)) {
      continue;
    }

    try {
      const content = extractor.getFile(header.path);
      entry.size = content.buffer.byteLength;
      const md = await fileMetadata(content)

      entry.contentType = md.contentType;
      entry.lastModified = md.lastModified
      entry.integrity = md.integrity

      entries[entry.path] = entry;
    } catch { /* empty */ }
  }
  return entries;
}

function getMatchingEntries(entry, entries) {
  return Object.keys(entries)
    .filter(key => entry.path !== key && dirname(key) === entry.path)
    .map(key => entries[key]);
}

function getMetadata(entry, entries) {
  const metadata = { path: entry.path, type: entry.type };
  if (entry.type === '0') {
    metadata.type = toType(entry.type);
    metadata.contentType = entry.contentType;
    metadata.integrity = entry.integrity;
    metadata.lastModified = entry.lastModified;
    metadata.size = entry.size;
  } else if (entry.type === '5') {
    metadata.type = toType(entry.type);
    metadata.files = getMatchingEntries(entry, entries).map(e =>
      getMetadata(e, entries)
    );
  }

  return metadata;
}

export async function serveDirectoryMetadata(c) {
  const stream = await getPackage(c.req.packageName, c.req.packageVersion);
  if (!stream) {
    return c.text('Not Found', 404)
  }
  const filename = c.req.filename.slice(0, -1) || '/';
  const entries = await findMatchingEntries(stream, filename);
  const metadata = getMetadata(entries[filename], entries);

  return c.json(metadata);
}
