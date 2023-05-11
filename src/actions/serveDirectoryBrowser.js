import { getPackage } from '../utils/npm.js';
import { serveBrowsePage } from './serveBrowsePage.js';
import { Untar } from "./Untar.js";
import { fileMetadata } from "./fileMetadata.js";
async function findMatchingEntries(c, stream, filename) {
  const extractor = new Untar(stream);
  let files = extractor.getFolder(filename);
  if (files.length === 0) {
    // 404
    return c.text('oops', 404);
  }
  const mds = []
  for (const file of files) {
    const md = await fileMetadata(file);
    md.size = file.buffer.byteLength;
    md.content = file.buffer;
    mds.push(md)
  }

  return mds;
}

export async function serveDirectoryBrowser(c) {
  const stream = await getPackage(c.req.packageName, c.req.packageVersion);

  const filename = c.req.filename.slice(0, -1) || '/';
  const entries = await findMatchingEntries(c, stream, filename);

  if (entries.length === 0) {
    return c.text(`Not found: ${c.req.packageSpec}${c.req.filename}`, 404);
  }

  c.req.browseTarget = {
    path: filename,
    type: 'directory',
    details: entries
  };

  return await serveBrowsePage(c);
}

