import { createI18n } from 'vue-i18n'
import sv from './locales/sv.json'
import en from './locales/en.json'

const i18n = createI18n({
    legacy: true, // Set to true for Options API support (this.$t)
    locale: 'sv', // set locale
    fallbackLocale: 'en', // set fallback locale
    globalInjection: true, // Ensure global injection is enabled
    messages: {
        sv,
        en
    }
})

export default i18n
