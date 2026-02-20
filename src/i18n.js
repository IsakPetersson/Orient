import { createI18n } from 'vue-i18n'
import sv from './locales/sv.json'
import en from './locales/en.json'

const i18n = createI18n({
    legacy: false, // you must set `false`, to use Composition API
    globalInjection: true, // Inject $t, $d, etc. globally
    locale: 'sv', // set locale
    fallbackLocale: 'en', // set fallback locale
    messages: {
        sv,
        en
    }
})

export default i18n
