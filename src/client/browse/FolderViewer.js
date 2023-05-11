import { html } from "@worker-tools/html";
import sortBy from 'sort-by';

import { formatBytes } from '../utils/format.js';

import { ContentArea, ContentAreaHeaderBar } from './ContentArea.js';

const linkStyle = "color: #0076ff; text-decoration: none;";

const tableCellStyle = "padding-top: 6px;padding-right: 3px;padding-bottom: 6px;padding-left: 3px;border-top: 1px solid #eaecef;";

const iconCellStyle = tableCellStyle + "color: #424242;width: 17px;padding-right: 2px;padding-left: 10px;";

const typeCellStyle = tableCellStyle + "text-align: right;padding-right: 10px;";

function getRelName(path, base) {
  return path.substr(base.length > 1 ? base.length + 1 : 1);
}

const fileIcon = html`<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 12 16" class="css-i6dzq1" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M6 5H2V4h4v1zM2 8h7V7H2v1zm0 2h7V9H2v1zm0 2h7v-1H2v1zm10-7.5V14c0 .55-.45 1-1 1H1c-.55 0-1-.45-1-1V2c0-.55.45-1 1-1h7.5L12 4.5zM11 5L8 2H1v12h10V5z"></path></svg>`
const fileCodeIcon = html`<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 12 16" class="css-i6dzq1" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8.5 1H1c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h10c.55 0 1-.45 1-1V4.5L8.5 1zM11 14H1V2h7l3 3v9zM5 6.98L3.5 8.5 5 10l-.5 1L2 8.5 4.5 6l.5.98zM7.5 6L10 8.5 7.5 11l-.5-.98L8.5 8.5 7 7l.5-1z"></path></svg>`
const folderIcon = html`<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 14 16" class="css-i6dzq1" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M13 4H7V3c0-.66-.31-1-1-1H1c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1zM6 4H1V3h5v1z"></path></svg>`

export default function FolderViewer({ path, details: entries }) {
  const subdirs = [];
  const files = [];
  for (const entry of entries) {
    if (entry.type === 'directory') {
      subdirs.push(entry);
    } else if (entry.type === 'file') {
      files.push(entry);
    }
  }

  subdirs.sort(sortBy('path'));
  files.sort(sortBy('path'));

  const rows = [];

  if (path !== '/') {
    rows.push(
      html`<tr key="..">
        <td style="${iconCellStyle}" />
        <td style="${tableCellStyle}">
          <a title="Parent directory" href="../" style="${linkStyle}">
            ..
          </a>
        </td>
        <td style="${tableCellStyle}"></td>
        <td style="${typeCellStyle}"></td>
      </tr>`
    );
  }

  subdirs.forEach(({ path: dirname }) => {
    const relName = getRelName(dirname, path);
    const href = relName + '/';
    rows.push(
      html`<tr key=${relName}>
        <td style="${iconCellStyle}">
        ${folderIcon}
        </td>
        <td style="${tableCellStyle}">
          <a title=${relName} href=${href} style="${linkStyle}">
            ${relName}
          </a>
        </td>
        <td style="${tableCellStyle}">-</td>
        <td style="${typeCellStyle}">-</td>
      </tr>`
    );
  });

  files.forEach(({ path: filename, size, contentType }) => {
    const relName = getRelName(filename, path);
    const href = relName;
    rows.push(
      html`<tr key=${relName}>
        <td style="${iconCellStyle}">
          ${contentType === 'text/plain' || contentType === 'text/markdown' ? (
            fileIcon
          ) : (
            fileCodeIcon
          )}
        </td>
        <td style="${tableCellStyle}">
          <a title=${relName} href=${href} style="${linkStyle}">
            ${relName}
          </a>
        </td>
        <td style="${tableCellStyle}">${formatBytes(size)}</td>
        <td style="${typeCellStyle}">${contentType}</td>
      </tr>`
    );
  });

  let counts = [];
  if (files.length > 0) {
    counts.push(`${files.length} file${files.length === 1 ? '' : 's'}`);
  }
  if (subdirs.length > 0) {
    counts.push(`${subdirs.length} folder${subdirs.length === 1 ? '' : 's'}`);
  }

  return (
    html`${ContentArea({
      children: html`${ContentAreaHeaderBar({
        children: html`<span>${counts.join(', ')}</span>`
      })}
      <table
        style=" width: 100%; border-collapse: collapse; border-radius: 2px; background: #fff;"
      >
        <thead>
          <tr>
            <th><div style="border:0; clip:rect(0 0 0 0); height:1px; width:1px; margin:-1px; padding:0; overflow:hidden; position:absolute">Icon</div></th>
            <th><div style="border:0; clip:rect(0 0 0 0); height:1px; width:1px; margin:-1px; padding:0; overflow:hidden; position:absolute">Name</div></th>
            <th><div style="border:0; clip:rect(0 0 0 0); height:1px; width:1px; margin:-1px; padding:0; overflow:hidden; position:absolute">Size</div></th>
            <th><div style="border:0; clip:rect(0 0 0 0); height:1px; width:1px; margin:-1px; padding:0; overflow:hidden; position:absolute">Content Type</div></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`
    })}`
  );
}
