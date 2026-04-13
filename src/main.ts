import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import "./styles.css";

import LogView from "./views/LogView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "log", component: LogView },
  ],
});

const app = createApp(App);
app.use(router);
app.mount("#app");
