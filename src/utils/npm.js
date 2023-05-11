import { streamToArrayBuffer } from "./streamToArrayBuffer";

const npmRegistryURL = 'https://registry.npmjs.org';

function isScopedPackageName(packageName) {
  return packageName.startsWith('@');
}

function encodePackageName(packageName) {
  return isScopedPackageName(packageName)
    ? `@${encodeURIComponent(packageName.substring(1))}`
    : encodeURIComponent(packageName);
}

async function fetchPackageInfo(packageName) {
  const name = encodePackageName(packageName);
  const infoURL = `${npmRegistryURL}/${name}`;

  // console.debug(`Fetching package info for ${packageName} from ${infoURL}`);

  const res = await fetch(infoURL, {
    headers: {
      Accept: 'application/json'
    },
    backend: 'npm'
  });

  if (res.status === 200) {
    return res.json();
  }

  if (res.status === 404) {
    return null;
  }

  const content = await res.text();

  // console.error(
  //   'Error fetching info for %s (status: %s)',
  //   packageName,
  //   res.status
  // );
  // console.error(content);

  return null;
}

/**
 * Returns an object of available { versions, tags }.
 * Uses a cache to avoid over-fetching from the registry.
 */
export async function getVersionsAndTags(packageName) {
  const info = await fetchPackageInfo(packageName);
  return info && info.versions
    ? { versions: Object.keys(info.versions), tags: info['dist-tags'] }
    : null;
}

// All the keys that sometimes appear in package info
// docs that we don't need. There are probably more.
const packageConfigExcludeKeys = [
  'browserify',
  'bugs',
  'directories',
  'engines',
  'files',
  'homepage',
  'keywords',
  'maintainers',
  'scripts'
];

function cleanPackageConfig(config) {
  const newConfig = {};
  for (const key of Object.keys(config)) {
    if (!key.startsWith('_') && !packageConfigExcludeKeys.includes(key)) {
      newConfig[key] = config[key];
    }
  }
  return newConfig;
}

/**
 * Returns metadata about a package, mostly the same as package.json.
 * Uses a cache to avoid over-fetching from the registry.
 */
export async function getPackageConfig(packageName, version) {
  const info = await fetchPackageInfo(packageName);
  return info && info.versions && version in info.versions
    ? cleanPackageConfig(info.versions[version])
    : null;
}

/**
 * Returns a stream of the tarball'd contents of the given package.
 */
export async function getPackage(packageName, version) {
  const tarballName = isScopedPackageName(packageName)
    ? packageName.split('/')[1]
    : packageName;
  const tarballURL = `${npmRegistryURL}/${packageName}/-/${tarballName}-${version}.tgz`;

  // console.debug(`Fetching package for ${packageName} from ${tarballURL}`);
  const res = await fetch(tarballURL, {backend: 'npm'});

  if (res.status === 200) {
    return streamToArrayBuffer(res.body.pipeThrough(new DecompressionStream("gzip")));
  }

  if (res.status === 404) {
    return null;
  }

  // const content = await res.text();

  // console.error(
  //   'Error fetching tarball for %s@%s (status: %s)',
  //   packageName,
  //   version,
  //   res.status
  // );
  // console.error(content);

  return null;
}
