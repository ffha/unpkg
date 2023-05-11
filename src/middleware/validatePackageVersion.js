import maxSatisfying from 'semver/ranges/max-satisfying.js';

import { createPackageURL } from '../utils/createPackageURL.js';
import { getPackageConfig, getVersionsAndTags } from '../utils/npm.js';

function semverRedirect(c, newVersion) {
  const url = new URL(c.req.url);
  const append = c.req.browse ? '/browse' : '';
  return new Response('', {
    status: 302,
    headers: {
      'Cache-Control': 'public, s-maxage=600, max-age=60', // 10 mins on CDN, 1 min on clients
      'Surrogate-Key': 'redirect, semver-redirect',
      Location: append + createPackageURL(c.req.packageName, newVersion, c.req.filename, url.searchParams),
    }
  });
}

async function resolveVersion(packageName, range) {
  const versionsAndTags = await getVersionsAndTags(packageName);

  if (versionsAndTags) {
    const { versions, tags } = versionsAndTags;

    if (range in tags) {
      range = tags[range];
    }

    return versions.includes(range)
      ? range
      : maxSatisfying(versions, range);
  }

  return null;
}

/**
 * Check the package version/tag in the URL and make sure it's good. Also
 * fetch the package config and add it to req.packageConfig. Redirect to
 * the resolved version number if necessary.
 */
export async function validatePackageVersion(c, next) {
  const version = await resolveVersion(
    c.req.packageName,
    c.req.packageVersion
  );

  if (!version) {
    return c.text(`Cannot find package ${c.req.packageSpec}`, 404);
  }

  if (version !== c.req.packageVersion) {
    return semverRedirect(c, version);
  }

  c.req.packageConfig = await getPackageConfig(
    c.req.packageName,
    c.req.packageVersion,
  );

  if (!c.req.packageConfig) {
    return c.text(`Cannot get config for package ${c.req.packageSpec}`, 500);
  }

  await next();
}
