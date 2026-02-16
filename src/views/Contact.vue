<template>
  <div class="contact-page">
    <!-- Contact Hero -->
    <section class="page-hero">
      <div class="hero-content">
        <h1>Kontakta Oss</h1>
        <p class="hero-subtitle">Vi skulle älska att höra från dig och svara på dina frågor</p>
      </div>
    </section>

    <!-- Contact Form Section -->
    <section class="contact-form-section">
      <div class="container">
        <div class="contact-grid">
          <div class="contact-info">
            <h2>Låt Oss Prata</h2>
            <p>Oavsett om du är intresserad av att starta en gratis provperiod, har frågor om våra tjänster eller behöver hjälp med ditt konto, är vi här för att hjälpa till.</p>

            <div class="contact-methods">
              <div class="contact-method">
                <div class="method-icon">@</div>
                <div class="method-details">
                  <h3>E-post</h3>
                  <p>support@techshipproto.com</p>
                </div>
              </div>

              <div class="contact-method">
                <div class="method-icon">⊕</div>
                <div class="method-details">
                  <h3>Telefon</h3>
                  <p>+46 (8) 123-4567</p>
                </div>
              </div>

              <div class="contact-method">
                <div class="method-icon">○</div>
                <div class="method-details">
                  <h3>Öppettider</h3>
                  <p>Mån-Fre: 09:00 - 18:00</p>
                </div>
              </div>
            </div>
          </div>

          <div class="contact-form-wrapper">
            <form class="contact-form" @submit.prevent="handleSubmit">
              <div class="form-group">
                <label for="name">Namn *</label>
                <input type="text" id="name" v-model="form.name" required>
              </div>

              <div class="form-group">
                <label for="email">E-post *</label>
                <input type="email" id="email" v-model="form.email" required>
              </div>

              <div class="form-group">
                <label for="organization">Organisation</label>
                <input type="text" id="organization" v-model="form.organization">
              </div>

              <div class="form-group">
                <label for="subject">Ämne *</label>
                <select id="subject" v-model="form.subject" required>
                  <option value="">Välj ett ämne</option>
                  <option value="trial">Starta Gratis Provperiod</option>
                  <option value="pricing">Prisinformation</option>
                  <option value="support">Teknisk Support</option>
                  <option value="general">Allmän Förfrågan</option>
                  <option value="other">Annat</option>
                </select>
              </div>

              <div class="form-group">
                <label for="message">Meddelande *</label>
                <textarea id="message" v-model="form.message" rows="6" required></textarea>
              </div>

              <button type="submit" class="btn btn-primary btn-full">Skicka Meddelande</button>
            </form>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="faq-section">
      <div class="container">
        <h2 class="section-title">Vanliga Frågor</h2>
        <div class="faq-grid">
          <div class="faq-item">
            <h3>Hur fungerar den kostnadsfria provperioden?</h3>
            <p>Registrera dig för en 14-dagars gratis provperiod med full tillgång till alla funktioner. Inget kreditkort krävs.</p>
          </div>
          <div class="faq-item">
            <h3>Vilka typer av organisationer stödjer ni?</h3>
            <p>Vi arbetar med idrottsföreningar, klubbar, ideella organisationer och små samhällsorganisationer av alla slag.</p>
          </div>
          <div class="faq-item">
            <h3>Är min data säker?</h3>
            <p>Ja. Vi använder banknivåkryptering och regelmässiga säkerhetskopior för att hålla din data trygg och säker.</p>
          </div>
          <div class="faq-item">
            <h3>Kan jag importera befintlig data?</h3>
            <p>Absolut. Vi stödjer import från kalkylblad och kan hjälpa till med migrering från andra plattformar.</p>
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
