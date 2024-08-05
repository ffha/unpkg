import { lookup } from 'mrmime';
import { toType } from "./toType.js";

export async function fileMetadata(file) {
  const digest = await crypto.subtle.digest('SHA-384', file.buffer);
  const base64string = btoa(
    String.fromCharCode(...new Uint8Array(digest))
  );
  const md = {
    lastModified: file.mtime ? new Date(file.mtime * 1000).toUTCString() : "Sat, 26 Oct 1985 08:15:00 GMT",
    type: toType(file.type),
    contentType: lookup(file.path) || 'text/plain',
    integrity: `sha384-${base64string}`,
    path: file.path,
  }
  return md;
}
