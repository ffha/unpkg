import { html, unsafeHTML } from "@worker-tools/html";

import { formatBytes } from '../utils/format.js';

import { ContentArea, ContentAreaHeaderBar } from './ContentArea.js';

function getBasename(path) {
  let segments = path.split('/');
  return segments[segments.length - 1];
}

function ImageViewer({ path, uri }) {
  return (
    html`<div style="padding: 20px; text-align: center">
      <img alt=${getBasename(path)} src=${uri} />
    </div>`
  );
}

function CodeListing({ highlights }) {
  let lines = highlights.slice(0);
  let hasTrailingNewline = lines.length && lines[lines.length - 1] === '';
  if (hasTrailingNewline) {
    lines.pop();
  }

  return (
    html`<div
      className="code-listing"
      style=" overflow-x: auto; overflow-y: hidden; padding-top: 5px;padding-bottom: 5px"
    >
      <table
        style=" border: none; border-collapse: collapse; border-spacing: 0"
      >
        <tbody>
          ${lines.map((line, index) => {
            let lineNumber = index + 1;

            return (
              html`<tr>
                <td
                  id=${`L${lineNumber}`}
                  style="padding-left: 10px;padding-right: 10px;color: rgba(27, 31, 35, .3);text-align: right;vertical-align: top;width: 1%;min-width: 50px;user-select: none"
                ><span>${lineNumber}</span>
                </td>
                <td
                  id=${`LC${lineNumber}`}
                  style=" padding-left: 10px; padding-right: 10px; color: #24292e;white-space: pre"
                ><code>${unsafeHTML(line)}</code></td>
              </tr>`
            );
          })}
          ${!hasTrailingNewline ? (
            html`<tr><td
                style="padding-left: 10px;padding-right: 10px;color: rgba(27, 31, 35, .3);text-align: right;vertical-align: top;width: 1%;min-width: 50px;user-select: none;"
              >\\</td><td
                style="padding-left: 10px;color: rgba(27, 31, 35, .3);user-select: none;"
              >No newline at end of file</td></tr>`
          ) : ''}
        </tbody>
      </table>
    </div>`
  );
}

function BinaryViewer() {
  return (
    html`<div style="padding: 20px">
      <p style="text-align: center">No preview available.</p>
    </div>`
  );
}

export default function FileViewer({
  packageName,
  packageVersion,
  path,
  details
}) {
  let { highlights, uri, language, size } = details;

  return (
    html`${ContentArea({
      children:
      html`${ContentAreaHeaderBar({
        children:
        html`<span>${formatBytes(size || 0)}</span>
        <span>${language}</span>
        <span>
          <a
            href=${`/${packageName}@${packageVersion}${path}`}
            style=" display: inline-block; margin-left: 8px; padding: 2px 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem; color: #24292e; background-color: #eff3f6; border: 1px solid rgba(27, 31, 35, .2); border-radius: 3px;"
          >
            View Raw
          </a>
        </span>`
      })}
      ${highlights ? (
        CodeListing({highlights})
      ) : uri ? (
        ImageViewer({path,uri})
      ) : (
        BinaryViewer()
      )}
      `
    })}`
  );
}
