import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "tdesign-vue-next/es/style/index.css";
import "./locales"; // Initialize UIKit i18n
import App from "@/App.vue";
import "./styles/normalize.css";
import router from "./router";
// Aegis data reporting (remove for GitHub demo)
import { initAegis } from "./utils/aegis";

// Initialize Aegis SDK for data reporting
initAegis();

const app = createApp(App);

app.use(router);
app.use(ElementPlus);
app.mount("#app");
