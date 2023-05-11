import { html, unsafeHTML } from "@worker-tools/html";

export function ContentArea({ children }) {
  return (
   html`<div
      style="border: 1px solid #dfe2e5;border-radius: 3px;"
    >
      ${children}
    </div>`
  );
}

export function ContentAreaHeaderBar({ children}) {
  return (
    html`<div
      style="padding: 10px;background: #f6f8fa;color: #424242;border: 1px solid #d1d5da;border-top-left-radius: 3px; border-top-right-radius: 3px;margin: -1px -1px 0px;display: flex;flex-direction: row;align-items: center;justify-content: space-between;"
    >
      ${children}
    </div>`
  );
}
