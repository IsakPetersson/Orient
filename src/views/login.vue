<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Login Hero -->
      <section class="hero login-hero">
        <div class="hero-content">
          <h1>Välkommen Tillbaka</h1>
          <p class="hero-subtitle">Logga in på ditt Orient-konto</p>
        </div>
      </section>

      <!-- Login Form Section -->
      <section class="login-section">
        <div class="login-form-wrapper">
        <h2 class="login-title">Logga In</h2>
          <form @submit.prevent="handleLogin" class="login-form">
            <div class="form-group">
              <label for="email">E-post</label>
              <input
                type="email"
                id="email"
                v-model="email"
                placeholder="din@email.se"
                required
              />
            </div>

            <div class="form-group">
              <label for="password">Lösenord</label>
              <input
                type="password"
                id="password"
                v-model="password"
                placeholder="Ange ditt lösenord"
                required
              />
            </div>

            <div class="form-options">
              <label class="remember-me">
                <input type="checkbox" v-model="rememberMe" />
                <span>Kom ihåg mig</span>
              </label>
              <a href="#" class="forgot-password">Glömt lösenord?</a>
            </div>

            <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
                {{ loading ? 'Loggar in…' : 'Logga In' }}
            </button>

            <p v-if="error" style="color: red; margin: 0;">{{ error }}</p>


            <div class="login-divider">
              <span>eller</span>
            </div>

            <button type="button" class="btn btn-primary btn-full" @click="handleRegister" :disabled="loading">
                {{ loading ? 'Skapar konto…' : 'Skapa Nytt Konto' }}
            </button>
          </form>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { login, register } from '../lib/auth'

export default {
  name: 'LoginView',
  data() {
    return {
      email: '',
      password: '',
      rememberMe: false,
      loading: false,
      error: null
    }
  },
  methods: {
    async handleLogin() {
      this.error = null
      this.loading = true
      try {
        await login(this.email, this.password, this.rememberMe)

        // Välj vart du vill skicka användaren efter login:
        // Om du har /dashboard, byt till det.
        this.$router.push('/')
      } catch (e) {
        this.error = e?.message || 'Inloggningen misslyckades'
      } finally {
        this.loading = false
      }
    },

    async handleRegister() {
      // Minimal registrering: vi saknar "namn" i form just nu.
      // Så vi skapar ett default-namn baserat på email tills du lägger till ett fält.
      this.error = null
      this.loading = true
      try {
        const defaultName = this.email.split('@')[0] || 'Användare'
        await register(this.email, defaultName, this.password, this.rememberMe)

        // Efter register: du är inloggad (cookie sätts), skicka vidare
        this.$router.push('/')
      } catch (e) {
        this.error = e?.message || 'Registreringen misslyckades'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>


<style scoped>
.login-page {
  min-height: 100vh;
  background-color: var(--background);
}

.login-title {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: var(--text-dark);
}

.login-container {
  display: flex;
  min-height: 100vh;
}

.login-hero {
  flex: 1;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: var(--background);
}

.login-form-wrapper {
  background-color: var(--text-light);
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 450px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: -0.5rem;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-dark);
  cursor: pointer;
}

.remember-me input[type="checkbox"] {
  cursor: pointer;
}

.forgot-password {
  font-size: 0.9rem;
  color: var(--primary-light);
  text-decoration: none;
  transition: color 0.3s ease;
}

.forgot-password:hover {
  color: var(--primary-medium);
  text-decoration: underline;
}

.login-divider {
  position: relative;
  text-align: center;
  margin: 1rem 0;
}

.login-divider::before,
.login-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 45%;
  height: 1px;
  background-color: var(--background);
}

.login-divider::before {
  left: 0;
}

.login-divider::after {
  right: 0;
}

.login-divider span {
  background-color: var(--text-light);
  padding: 0 1rem;
  color: var(--text-dark);
  opacity: 0.7;
  font-size: 0.9rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }

  .login-hero {
    min-height: 50vh;
  }

  .login-hero h1 {
    font-size: 2.5rem;
  }

  .login-section {
    min-height: 50vh;
  }

  .login-form-wrapper {
    padding: 2rem 1.5rem;
    margin: 0 1rem;
  }

  .form-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}
</style>
