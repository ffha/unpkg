import { HTMLResponse } from "@worker-tools/html";
import MainApp from '../client/main/App.js';
import MainTemplate from '../templates/MainTemplate.js';

const fourHours = 14400;
const CacheControl = `public, max-age=${fourHours}`;
const SurrogateKey = 'main';

const html = MainTemplate({content: MainApp()})
export function serveMainPage() {
  return new HTMLResponse(html, {
    headers: {
      'Cache-Control': CacheControl,
      'Surrogate-Key': SurrogateKey,
    }
  })
}
