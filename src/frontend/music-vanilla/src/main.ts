import App from "./Components/App.component";

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById('App');
  if (root) {
    root.appendChild(App());
  }
});
