import Home from "./Pages/Home/Home";

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById('App');
  if (root) {
    root.appendChild(Home());
  }
});
