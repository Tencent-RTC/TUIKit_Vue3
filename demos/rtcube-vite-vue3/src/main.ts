import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "tdesign-vue-next/es/style/index.css";
import "./locales"; // Initialize UIKit i18n
import App from "@/App.vue";
import "./styles/normalize.css";
import router from "./router";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(ElementPlus);
app.mount("#app");
