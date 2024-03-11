import { LitElement, html } from 'lit';
import './my-app';

export class MainElement extends LitElement {
  render() {
    return html`<my-app></my-app>`;
  }
}

customElements.define('main-element', MainElement);

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  if (root) {
    root.appendChild(document.createElement('main-element'));
  }
});
