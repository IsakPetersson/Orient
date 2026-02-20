import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import './assets/style.css'

const app = createApp(App)

app.config.errorHandler = (err, vm, info) => {
  console.error('Global Error Handler:', err, info)
  alert(`Error: ${err.message}\nCheck console for details.`)
}

app.use(router)
app.use(i18n)
app.mount('#app')
