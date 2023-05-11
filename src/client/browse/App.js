import { html, unsafeHTML } from "@worker-tools/html";
import { fontSans, fontMono } from '../utils/style.js';

import FolderViewer from './FolderViewer.js';
import FileViewer from './FileViewer.js';
// import { TwitterIcon, GitHubIcon } from './Icons.js';

// import SelectDownArrow from './images/SelectDownArrow.png';
const SelectDownArrow = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAKCAYAAAC9vt6cAAAAAXNSR0IArs4c6QAAARFJREFUKBVjZAACNS39RhBNKrh17WI9o4quoT3Dn78HSNUMUs/CzOTI/O7Vi4dCYpJ3/jP+92BkYGAlyiBGhm8MjIxJt65e3MQM0vDu9YvLYmISILYZELOBxHABRkaGr0yMzF23r12YDFIDNgDEePv65SEhEXENBkYGFSAXuyGMjF8Z/jOsvX3tYiFIDwgwQSgIaaijnvj/P8M5IO8HsjiY/f//D4b//88A1SQhywG9jQr09PS4v/1mPAeUUPzP8B8cJowMjL+Bqu6xMQmaXL164AuyDgwDQJLa2qYSP//9vARkCoMVMzK8YeVkNbh+9uxzMB+JwGoASF5Vx0jz/98/18BqmZi171w9D2EjaaYKEwAEK00XQLdJuwAAAABJRU5ErkJggg=='
const globalStyles = `
  html {
    box-sizing: border-box;
  }
  *,
  *:before,
  *:after {
    box-sizing: inherit;
  }

  html,
  body,
  #root {
    height: 100%;
    margin: 0px;
  }

  body {
    ${fontSans}
    font-size: 16px;
    line-height: 1.5;
    overflow-wrap: break-word;
    background: white;
    color: black;
  }

  code {
    ${fontMono}
  }

  th,
  td {
    padding: 0px;
  }

  select {
    font-size: inherit;
  }

  #root {
    display: flex;
    flex-direction: column;
  }
`;

// Adapted from https://github.com/highlightjs/highlight.js/blob/master/src/styles/atom-one-light.css
const lightCodeStyles = `
  .code-listing {
    background: #fbfdff;
    color: #383a42;
  }
  .code-comment,
  .code-quote {
    color: #a0a1a7;
    font-style: italic;
  }
  .code-doctag,
  .code-keyword,
  .code-link,
  .code-formula {
    color: #a626a4;
  }
  .code-section,
  .code-name,
  .code-selector-tag,
  .code-deletion,
  .code-subst {
    color: #e45649;
  }
  .code-literal {
    color: #0184bb;
  }
  .code-string,
  .code-regexp,
  .code-addition,
  .code-attribute,
  .code-meta-string {
    color: #50a14f;
  }
  .code-built_in,
  .code-class .code-title {
    color: #c18401;
  }
  .code-attr,
  .code-variable,
  .code-template-variable,
  .code-type,
  .code-selector-class,
  .code-selector-attr,
  .code-selector-pseudo,
  .code-number {
    color: #986801;
  }
  .code-symbol,
  .code-bullet,
  .code-meta,
  .code-selector-id,
  .code-title {
    color: #4078f2;
  }
  .code-emphasis {
    font-style: italic;
  }
  .code-strong {
    font-weight: bold;
  }
`;

function AppHeader() {
  return html`<header style="margin-top: 2rem" >
      <h1 style="text-align: center; font-size: 3rem; letter-spacing: 0.05em" >
        <a href="/" style="color: #000; text-decoration: none;" >
          UNPKG
        </a>
      </h1>
    </header>`;
}

function AppNavigation({
  packageName,
  packageVersion,
  availableVersions,
  filename
}) {
  let breadcrumbs = [];

  if (filename === '/') {
    breadcrumbs.push(packageName);
  } else {
    let url = `/browse/${packageName}@${packageVersion}`;

    breadcrumbs.push(html`<a style="color: #0076ff; text-decoration: none;" href=${url}/>${packageName}</a>`);

    let segments = filename
      .replace(/^\/+/, '')
      .replace(/\/+$/, '')
      .split('/');
    let lastSegment = segments.pop();

    segments.forEach(segment => {
      url += `/${segment}`;
      breadcrumbs.push(html`<a style="color: #0076ff; text-decoration: none;" href=${url}/>${segment}</a>`);
    });

    breadcrumbs.push(lastSegment);
  }

  return html`<header style="display: flex; flex-direction: row; align-items: center;" >
      <h1 style="font-size: 1.5rem; font-weight: normal; flex: 1; word-break: break-all" >
        <nav>
          ${breadcrumbs.map((item, index, array) => {
            const parts = []
              if (index !== 0) {
                parts.push(html`<span style="padding-left: 5px; padding-right: 5px;">/</span>`)
              }
              if (index === array.length - 1) {
                parts.push(html`<strong>${item}</strong>`)
              } else {
                parts.push(item)
              }
            return parts
          })}
        </nav>
      </h1>
      ${
        PackageVersionPicker({
          availableVersions,
          packageVersion,
          onChange:`window.location.href=window.location.href.replace('@${packageVersion}','@'+this.value);`
        })
      }
    </header>`;
}

function PackageVersionPicker({ packageVersion, availableVersions, onChange }) {

  return html`<p style="margin-left: 20px;" >
      <label>
        Version:
        <select
          name="version"
          onChange=${unsafeHTML(onChange)}
          style="${`appearance: none;
          cursor: pointer;
          padding: 4px 24px 4px 8px;
          font-weight: 600;
          font-size: 0.9em;
          color: #24292e;
          border: 1px solid rgba(27, 31, 35, .2);
          border-radius: 3px;
          background-color: #eff3f6;
          background-image: url("${SelectDownArrow}");
          background-position: right 8px center;
          background-repeat: no-repeat;
          background-size: auto 25%;`}"
        >
          ${availableVersions.map(v => (
            html`<option ${v === packageVersion ? "selected" : ""} value=${v}>${v}</option>`
          ))}
        </select>
      </label>
    </p>`;
}

function AppContent({ packageName, packageVersion, target }) {
  return target.type === 'directory' ? (
    FolderViewer({path:target.path, details:target.details})
  ) : target.type === 'file' ? (
    FileViewer({
      packageName:packageName,
      packageVersion:packageVersion,
      path:target.path,
      details:target.details,
    })
  ) : null;
}

export default function App({
  packageName,
  packageVersion,
  availableVersions = [],
  filename,
  target
}) {
  let maxContentWidth = '940px';
  // TODO: Make this changeable
  let isFullWidth = false;

  return html`
  <style>${unsafeHTML(globalStyles)}</style>
  <style>${unsafeHTML(lightCodeStyles)}</style>
  <div style="flex: 1 0 auto" >
    <div style="${`max-width: ${maxContentWidth}; padding: 0 20px; margin: 0 auto;`}">
      ${AppHeader()}
    </div>
    <div style="${"padding: 0 20px; margin: 0 auto;" + (isFullWidth ? "" : "max-width: " +maxContentWidth)}">
      ${
        AppNavigation({
          packageName:packageName,
          packageVersion:packageVersion,
          availableVersions:availableVersions,
          filename:filename,
        })
      }
    </div>
    <div
      style="${"padding: 0 20px; margin: 0 auto;" +
        (isFullWidth ? "" : "max-width: " + maxContentWidth)
      }"
    >
      ${AppContent({
        packageName:packageName,
        packageVersion:packageVersion,
        target:target,
      })}
    </div>
  </div>

      <footer style=" margin-top: 5rem; background: black;color: #aaa">
        <div
          style=" max-width: ${maxContentWidth}; padding: 10px 20px; margin: 0 auto; display: flex; flex-direction: row; align-items: center; justify-content: space-between"
        >
        <p></p><p>
            <span>&copy; ${new Date().getFullYear()} UNPKG</span>
          </p><p></p>
        </div>
      </footer>`;
}
