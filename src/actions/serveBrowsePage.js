import { HTMLResponse } from "@worker-tools/html";
import semver from 'semver';

import BrowseApp from '../client/browse/App.js';
import MainTemplate from '../templates/MainTemplate.js';

import { getVersionsAndTags } from '../utils/npm.js';

function byVersion(a, b) {
  return semver.lt(a, b) ? -1 : semver.gt(a, b) ? 1 : 0;
}

async function getAvailableVersions(packageName, log) {
  const versionsAndTags = await getVersionsAndTags(packageName, log);
  return versionsAndTags ? versionsAndTags.versions.sort(byVersion) : [];
}

export async function serveBrowsePage(c) {
  const availableVersions = await getAvailableVersions(
    c.var.packageName,
    c.req.log
  );
  const data = {
    packageName: c.var.packageName,
    packageVersion: c.var.packageVersion,
    availableVersions: availableVersions,
    filename: c.var.filename,
    target: c.var.browseTarget
  };
  const content = BrowseApp(data);

  const html = MainTemplate({
    title: `UNPKG - ${c.var.packageName}`,
    description: `The CDN for ${c.var.packageName}`,
    data,
    content
  });

  return new HTMLResponse(html, {
    headers: {
      'Cache-Control': 'public, max-age=14400',// 4 hours
      'Surrogate-Key': 'browse',
    }
  })
}
