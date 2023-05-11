export async function getIntegrity(data) {
  const digest = await crypto.subtle.digest('SHA-384', data);
  const base64string = btoa(
    String.fromCharCode(...new Uint8Array(digest))
  );

  return `sha384-${base64string}`;
}
