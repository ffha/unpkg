export async function etag(entity) {
  if (entity.length === 0) {
    // fast-path empty
    return '"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"';
  }

  // compute hash of entity
  var digest = await crypto.subtle.digest('sha-1', entity);
  const hash = btoa(
    String.fromCharCode(...new Uint8Array(digest))
  );

  // compute length of entity
  var len = entity.byteLength;

  return '"' + len.toString(16) + '-' + hash + '"';
}
