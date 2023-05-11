export function createSearch(query) {
  const keys = query.sort().keys();
  const pairs = keys.reduce(
    (memo, key) =>
      memo.concat(
        query[key] == null || query[key] === ''
          ? key
          : `${key}=${encodeURIComponent(query[key])}`
      ),
    []
  );

  return pairs.length ? `?${pairs.join('&')}` : '';
}
