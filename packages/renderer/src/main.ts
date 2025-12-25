import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import './style.css';
import App from './App.vue';

function applyTheme(theme: 'light' | 'dark' | 'auto') {
  const html = document.documentElement;
  html.classList.remove('light', 'dark');
  
  if (theme === 'auto') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    html.classList.add(isDark ? 'dark' : 'light');
  } else {
    html.classList.add(theme);
  }
}

const app = createApp(App);
app.use(createPinia());
app.use(ElementPlus);

applyTheme('auto');

app.mount('#app');
