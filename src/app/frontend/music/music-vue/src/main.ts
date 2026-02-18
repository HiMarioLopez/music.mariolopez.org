import { createApp } from "vue";
import App from "./App.vue";
import "./styles/global.css";

const app = createApp(App);

app.config.errorHandler = (error, instance, info) => {
  console.error("Vue app error:", error, info, instance);
};

app.mount("#app");
