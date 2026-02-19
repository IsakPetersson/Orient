<template>
  <div class="contact-page">
    <!-- Contact Hero -->
    <section class="page-hero">
      <div class="hero-content">
        <h1>{{ $t('contact.title') }}</h1>
        <p class="hero-subtitle">{{ $t('contact.subtitle') }}</p>
      </div>
    </section>

    <!-- Contact Form Section -->
    <section class="contact-form-section">
      <div class="container">
        <div class="contact-grid">
          <div class="contact-info">
            <h2>{{ $t('contact.talkTitle') }}</h2>
            <p>{{ $t('contact.talkText') }}</p>

            <div class="contact-methods">
              <div class="contact-method">
                <div class="method-icon">@</div>
                <div class="method-details">
                  <h3>{{ $t('contact.email') }}</h3>
                  <p>support@techshipproto.com</p>
                </div>
              </div>

              <div class="contact-method">
                <div class="method-icon">⊕</div>
                <div class="method-details">
                  <h3>{{ $t('contact.phone') }}</h3>
                  <p>+46 (8) 123-4567</p>
                </div>
              </div>

              <div class="contact-method">
                <div class="method-icon">○</div>
                <div class="method-details">
                  <h3>{{ $t('contact.hours') }}</h3>
                  <p>{{ $t('contact.hoursText') }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="contact-form-wrapper">
            <form class="contact-form" @submit.prevent="handleSubmit">
              <div class="form-group">
                <label for="name">{{ $t('contact.formName') }}</label>
                <input type="text" id="name" v-model="form.name" required>
              </div>

              <div class="form-group">
                <label for="email">{{ $t('contact.formEmail') }}</label>
                <input type="email" id="email" v-model="form.email" required>
              </div>

              <div class="form-group">
                <label for="organization">{{ $t('contact.formOrg') }}</label>
                <input type="text" id="organization" v-model="form.organization">
              </div>

              <div class="form-group">
                <label for="subject">{{ $t('contact.formSubject') }}</label>
                <select id="subject" v-model="form.subject" required>
                  <option value="">{{ $t('contact.subjectDefault') }}</option>
                  <option value="trial">{{ $t('contact.subjectTrial') }}</option>
                  <option value="pricing">{{ $t('contact.subjectPricing') }}</option>
                  <option value="support">{{ $t('contact.subjectSupport') }}</option>
                  <option value="general">{{ $t('contact.subjectGeneral') }}</option>
                  <option value="other">{{ $t('contact.subjectOther') }}</option>
                </select>
              </div>

              <div class="form-group">
                <label for="message">{{ $t('contact.formMessage') }}</label>
                <textarea id="message" v-model="form.message" rows="6" required></textarea>
              </div>

              <button type="submit" class="btn btn-primary btn-full">{{ $t('contact.sendMessage') }}</button>
            </form>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="faq-section">
      <div class="container">
        <h2 class="section-title">{{ $t('contact.faqTitle') }}</h2>
        <div class="faq-grid">
          <div class="faq-item">
            <h3>{{ $t('contact.faq1Q') }}</h3>
            <p>{{ $t('contact.faq1A') }}</p>
          </div>
          <div class="faq-item">
            <h3>{{ $t('contact.faq2Q') }}</h3>
            <p>{{ $t('contact.faq2A') }}</p>
          </div>
          <div class="faq-item">
            <h3>{{ $t('contact.faq3Q') }}</h3>
            <p>{{ $t('contact.faq3A') }}</p>
          </div>
          <div class="faq-item">
            <h3>{{ $t('contact.faq4Q') }}</h3>
            <p>{{ $t('contact.faq4A') }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'Contact',
  data() {
    return {
      form: {
        name: '',
        email: '',
        organization: '',
        subject: '',
        message: ''
      }
    }
  },
  methods: {
    handleSubmit() {
      console.log('Form submitted:', this.form)
      this.form = {
        name: '',
        email: '',
        organization: '',
        subject: '',
        message: ''
      }
    }
  }
}
</script>
