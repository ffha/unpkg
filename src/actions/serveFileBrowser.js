import createDataURI from '../utils/createDataURI.js';
import { getPackage } from '../utils/npm.js';
import getHighlights from '../utils/getHighlights.js';
import getLanguageName from '../utils/getLanguageName.js';

import {serveBrowsePage} from './serveBrowsePage.js';
import { Untar } from "./Untar.js";
import { fileMetadata } from "./fileMetadata.js";

async function findEntry(stream, filename) {
  // filename = /some/file/name.js
  const extractor = new Untar(stream);
  const file = extractor.getFile(filename);
  if (!file) {
    return
  }
  const md = await fileMetadata(file);
  md.size = file.buffer.byteLength;
  md.content = file.buffer;
  return md;
}

export async function serveFileBrowser(c) {
  const stream = await getPackage(c.var.packageName, c.var.packageVersion);
  const entry = await findEntry(stream, c.var.filename);

  if (!entry) {
    return c.text(`Not found: ${c.var.packageSpec}${c.var.filename}`, 404);
  }

  const details = {
    contentType: entry.contentType,
    integrity: entry.integrity,
    language: getLanguageName(entry.path),
    size: entry.size,
    content: entry.content,
  };

  if (/^image\//.test(details.contentType)) {
    details.uri = createDataURI(details.contentType, entry.content);
    details.highlights = null;
  } else {
    details.uri = null;
    var decoder = new TextDecoder('utf-8');
    details.highlights = getHighlights(
      decoder.decode(entry.content),
      entry.path
    );
  }

  c.set("browseTarget" , {
    path: c.var.filename,
    type: 'file',
    details
  });

  return serveBrowsePage(c);
}

