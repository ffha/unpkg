import { html, unsafeHTML } from "@worker-tools/html";
// import formatBytes from 'pretty-bytes';
// import formatDate from 'date-fns/format';
// import parseDate from 'date-fns/parse';

// import { formatNumber, formatPercent } from '../utils/format.js';
import { fontSans, fontMono } from '../utils/style.js';

// import { TwitterIcon, GitHubIcon } from './Icons.js';

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
    font-size: 1rem;
    padding: 0 3px;
    background-color: #eee;
  }

  dd,
  ul {
    margin-left: 0px;
    padding-left: 25px;
  }
`;

// function Stats({ data }) {
//   let totals = data.totals;
//   let since = parseDate(totals.since);
//   let until = parseDate(totals.until);

//   return (
//     html`<p>From <strong>${formatDate(since, 'MMM D')}</strong> to <strong>${formatDate(until, 'MMM D')}</strong> unpkg served
//       <strong>${formatNumber(totals.requests.all)}</strong> requests and a total of <strong>${formatBytes(totals.bandwidth.all)}</strong> of data to <strong>${formatNumber(totals.uniques.all)}</strong> unique visitors,
//       <strong>${formatPercent(totals.requests.cached / totals.requests.all, 2)}% </strong>
//       of which were served from the cache.
//     </p>`
//   );
// }

export default function App() {
  // const stats = fetch('/api/stats?period=last-month')
  //     .then(res => res.json());

  return html`
  <style>${unsafeHTML(globalStyles)}</style>
  <div style="max-width: 740px; margin: 0 auto;">
      <div style="padding: 0 20px;">
        <header>
          <h1 style="text-align: center; font-size: 4.5em; letter-spacing: 0.05em;">UNPKG</h1>
          <p>
            unpkg is a fast, global content delivery network for everything on
            <a href="https://www.npmjs.com/">npm</a>. Use it to quickly
            and easily load any file from any package using a URL like:
          </p>
          <div style="text-align: center; background-color: #eee; margin: 2em 0px; padding: 5px 0">
            unpkg.com/:package@:version/:file
          </div>

          ${/*html`<Stats data=${stats} />`*/''}
        </header>

        <h3 style="font-size: 1.6em;" id="examples">
          Examples
        </h3>

        <p>Using a fixed version:</p>
        <ul>
          <li>
            <a href="/react@16.7.0/umd/react.production.min.js">
              unpkg.com/react@16.7.0/umd/react.production.min.js
            </a>
          </li>
          <li>
            <a href="/react-dom@16.7.0/umd/react-dom.production.min.js">
              unpkg.com/react-dom@16.7.0/umd/react-dom.production.min.js
            </a>
          </li>
        </ul>

          <p>
            You may also use a <a href="https://docs.npmjs.com/about-semantic-versioning">semver range</a> or a <a href="https://docs.npmjs.com/cli/dist-tag">tag</a> instead of a fixed version number, or omit the version/tag entirely to use the <code>latest</code> tag.
          </p>

          <ul>
            <li>
              <a href="/react@^16/umd/react.production.min.js">
                unpkg.com/react@^16/umd/react.production.min.js
              </a>
            </li>
            <li>
              <a href="/react/umd/react.production.min.js">
                unpkg.com/react/umd/react.production.min.js
              </a>
            </li>
          </ul>

          <p>
            If you omit the file path (i.e. use a "bare" URL), unpkg will serve the file specified by the <code>unpkg</code> field in <code>package.json</code>, or fall back to <code>main</code>.
          </p>

          <ul>
            <li>
              <a href="/jquery">unpkg.com/jquery</a>
            </li>
            <li>
              <a href="/three">unpkg.com/three</a>
            </li>
          </ul>

          <p>
            Append a <code>/</code> at the end of a URL to view a listing of all the files in a package.
          </p>

          <ul>
            <li>
              <a href="/react/">unpkg.com/react/</a>
            </li>
            <li>
              <a href="/react-router/">unpkg.com/react-router/</a>
            </li>
          </ul>

          <h3 style="font-size: 1.6em" id="query-params">
            Query Parameters
          </h3>

          <dl>
            <dt>
              <code>?meta</code>
            </dt>
            <dd>
              Return metadata about any file in a package as JSON (e.g.
              <code>/any/file?meta</code>)
            </dd>

            <dt>
              <code>?module</code>
            </dt>
            <dd>
              Expands all <a href="https://html.spec.whatwg.org/multipage/webappapis.html#resolve-a-module-specifier">
                "bare" <code>import</code> specifiers
              </a> in JavaScript modules to unpkg URLs. This feature is <em>very experimental</em>
            </dd>
          </dl>

          <h3 style="font-size: 1.6em" id="cache-behavior">
            Cache Behavior
          </h3>

          <p>
            The CDN caches files based on their permanent URL, which includes
            the npm package version. This works because npm does not allow
            package authors to overwrite a package that has already been
            published with a different one at the same version number.
          </p>
          <p>
            Browsers are instructed (via the <code>Cache-Control</code> header)
            to cache assets indefinitely (1 year).
          </p>
          <p>
            URLs that do not specify a package version number redirect to one
            that does. This is the <code>latest</code> version when no version
            is specified, or the <code>maxSatisfying</code> version when a <a href="https://github.com/npm/node-semver">semver version</a> is given. Redirects are cached for 10 minutes at the CDN, 1 minute in browsers.
          </p>
          <p>
            If you want users to be able to use the latest version when you cut
            a new release, the best policy is to put the version number in the
            URL directly in your installation instructions. This will also load
            more quickly because we won't have to resolve the latest
            version and redirect them.
          </p>

          <h3 style="font-size: 1.6em" id="workflow">
            Workflow
          </h3>

          <p>
            For npm package authors, unpkg relieves the burden of publishing
            your code to a CDN in addition to the npm registry. All you need to
            do is include your <a href="https://github.com/umdjs/umd">UMD</a> build in your
            npm package (not your repo, that's different!).
          </p>

          <p>You can do this easily using the following setup:</p>

          <ul>
            <li>
              Add the <code>umd</code> (or <code>dist</code>) directory to your <code>.gitignore</code> file
            </li>
            <li>
              Add the <code>umd</code> directory to your <a href="https://docs.npmjs.com/files/package.json#files">
                files array
              </a> in <code>package.json</code>
            </li>
            <li>
              Use a build script to generate your UMD build in the <code>umd</code> directory when you publish
            </li>
          </ul>

          <p>
            That's it! Now when you <code>npm publish</code> you'll
            have a version available on unpkg as well.
          </p>

          <h3 style="font-size: 1.6em" id="about">
            About
          </h3>

          <p>
            unpkg is an <a href="https://github.com/mjackson/unpkg">open source</a> project built and maintained by
            <a href="https://twitter.com/mjackson">Michael Jackson</a>.
            unpkg is not affiliated with or supported by npm, Inc. in any way.
            Please do not contact npm for help with unpkg. Instead, please reach
            out to <a href="https://twitter.com/unpkg">@unpkg</a> with any
            questions or concerns.
          </p>
        </div>
      </div>

      <footer style="margin-top: 5rem; background: black; color: #aaa;">
        <div style="max-width: 740px; padding: 10px 20px; margin: 0 auto; display: flex; flex-direction: row; align-items: center; justify-content: space-between" >
          <p>
            <span>&copy; ${new Date().getFullYear()} UNPKG</span>
          </p>
          ${/*<p style="font-size: 1.5rem">
            <a href="https://twitter.com/unpkg"
              style="color: #aaa; display: inline-block"
            >
              ${TwitterIcon()}
            </a>
            <a href="https://github.com/mjackson/unpkg"
              style="color: #aaa; display: inline-block; margin-left: 1rem;" >
              ${GitHubIcon()}
            </a>
          </p>*/''}
        </div>
      </footer>`
}
