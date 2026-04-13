import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import "./styles.css";

import LogView from "./views/LogView.vue";
import PairedView from "./views/PairedView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "log", component: LogView },
    { path: "/paired", name: "paired", component: PairedView },
  ],
});

const app = createApp(App);
app.use(router);
app.mount("#app");
