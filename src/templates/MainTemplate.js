import { html, unsafeHTML } from "@worker-tools/html";

export default function MainTemplate({
  title = 'UNPKG',
  description = 'The CDN for everything on npm',
  favicon = '/favicon.svg',
  content = '',
  elements = []
} = {}) {
  return html`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset='utf-8' />
  <meta http-equiv='X-UA-Compatible' content='IE=edge,chrome=1' />
  ${description ? html`<meta name='description' content='${description}' />` : ''}
  <meta name='viewport' content='width=device-width,initial-scale=1,maximum-scale=1' />
  <meta name='timestamp' content='${new Date().toISOString() }'/>
  ${favicon ? html`<link rel='shortcut icon' href="${favicon}" type="image/svg+xml"/>` : ''}
  <title>${title}</title>
</head>
<body>
  <div id='root'>${content }</div>
  ${html`${elements.join('')}`}
  </div>
</body>
</html>
`
}
