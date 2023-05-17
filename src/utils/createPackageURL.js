export function createPackageURL(
  packageName,
  packageVersion,
  filename,
  query
) {
  let url = `/${packageName}`;

  if (packageVersion) url += `@${packageVersion}`;
  if (filename) url += filename;
  if (query.size) {
    query.sort();
    url += '?' + query.toString();
  }

  return url;
}
