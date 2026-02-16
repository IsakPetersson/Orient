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

            <button type="button" class="btn btn-primary btn-full" @click="handleRegister">
              Skapa Nytt Konto
            </button>
          </form>
        </div>
      </section>
    </div>

    <!-- Registration Modal -->
    <div v-if="showRegisterModal" class="modal-overlay" @click.self="closeRegisterModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Skapa Nytt Konto</h2>
          <button class="close-btn" @click="closeRegisterModal">&times;</button>
        </div>
        <form @submit.prevent="handleRegisterSubmit" class="register-form">
          <div class="form-group">
            <label for="register-name">Namn</label>
            <input
              type="text"
              id="register-name"
              v-model="registerName"
              placeholder="Ditt fullständiga namn"
              required
            />
          </div>

          <div class="form-group">
            <label for="register-email">E-post</label>
            <input
              type="email"
              id="register-email"
              v-model="registerEmail"
              placeholder="din@email.se"
              required
            />
          </div>

          <div class="form-group">
            <label for="register-password">Lösenord</label>
            <input
              type="password"
              id="register-password"
              v-model="registerPassword"
              placeholder="Välj ett starkt lösenord"
              required
            />
          </div>

          <div class="form-group">
            <label for="register-confirm-password">Bekräfta Lösenord</label>
            <input
              type="password"
              id="register-confirm-password"
              v-model="registerConfirmPassword"
              placeholder="Ange lösenordet igen"
              required
            />
          </div>

          <p v-if="registerError" class="error-message">{{ registerError }}</p>

          <button type="submit" class="btn btn-primary btn-full" :disabled="registerLoading">
            {{ registerLoading ? 'Skapar konto…' : 'Skapa Konto' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Organization Setup Modal (after registration) -->
    <div v-if="showOrgSetupModal" class="modal-overlay" @click.self="skipOrgSetup">
      <div class="modal-content org-setup-modal">
        <div class="modal-header">
          <h2>Välkommen!</h2>
          <button class="close-btn" @click="skipOrgSetup">&times;</button>
        </div>
        <div class="modal-body">
          <p class="welcome-message">Ditt konto har skapats! Vill du gå med i en organisation eller skapa en ny?</p>
          <div class="org-setup-actions">
            <button class="btn btn-primary btn-full" @click="openJoinOrgFromSetup">
              Gå med i Organisation
            </button>
            <button class="btn btn-primary btn-full" @click="openCreateOrgFromSetup">
              Skapa Organisation
            </button>
            <button class="btn-link" @click="skipOrgSetup">
              Hoppa över
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Organization Modal -->
    <div v-if="showCreateOrgModal" class="modal-overlay" @click.self="closeCreateOrgModal">
      <div class="modal-content create-org-modal">
        <div class="modal-header">
          <h2>Skapa Organisation</h2>
          <button class="close-btn" @click="closeCreateOrgModal">&times;</button>
        </div>
        <form @submit.prevent="submitCreateOrganization" class="modal-body-form">
          <div class="form-group">
            <label for="org-name">Organisationens namn</label>
            <input
              type="text"
              id="org-name"
              v-model="newOrgName"
              placeholder="T.ex. Fotbollsklubben AIK"
              required
            />
          </div>
          <p v-if="createError" class="error-message">{{ createError }}</p>
          <div class="modal-actions">
            <button type="button" class="btn btn-primary" @click="closeCreateOrgModal">Avbryt</button>
            <button type="submit" class="btn btn-primary" :disabled="createLoading">
              {{ createLoading ? 'Skapar...' : 'Skapa' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Join Organization Modal -->
    <div v-if="showJoinOrgModal" class="modal-overlay" @click.self="closeJoinOrgModal">
      <div class="modal-content join-org-modal">
        <div class="modal-header">
          <h2>Gå med i Organisation</h2>
          <button class="close-btn" @click="closeJoinOrgModal">&times;</button>
        </div>
        <form @submit.prevent="submitJoinOrganization" class="modal-body-form">
          <div class="form-group">
            <label for="invite-code">Inbjödningskod</label>
            <input
              type="text"
              id="invite-code"
              v-model="inviteCode"
              placeholder="Ange inbjödningskod"
              required
            />
          </div>
          <p v-if="joinError" class="error-message">{{ joinError }}</p>
          <div class="modal-actions">
            <button type="button" class="btn btn-primary" @click="closeJoinOrgModal">Avbryt</button>
            <button type="submit" class="btn btn-primary" :disabled="joinLoading">
              {{ joinLoading ? 'Går med...' : 'Gå med' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Success Modal for showing invite code -->
    <div v-if="showSuccessModal" class="modal-overlay" @click.self="closeSuccessModal">
      <div class="modal-content success-modal">
        <div class="modal-header">
          <h2>Organisation Skapad!</h2>
          <button class="close-btn" @click="closeSuccessModal">&times;</button>
        </div>
        <div class="modal-body">
          <p class="success-message">Organisation "{{ createdOrgName }}" har skapats!</p>
          <div class="invite-code-section">
            <label>Inbjödningskod:</label>
            <div class="invite-code-display">
              <code>{{ inviteCodeToShare }}</code>
              <button type="button" class="btn btn-primary btn-sm" @click="copyInviteCode">Kopiera</button>
            </div>
            <p v-if="codeCopied" class="copy-success-message">✓ Kopierad!</p>
            <p class="invite-code-hint">Dela denna kod med andra för att bjuda in dem till organisationen.</p>
          </div>
          <div class="modal-actions">
            <button class="btn btn-primary" @click="closeSuccessModal">Fortsätt</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { login, register } from '../lib/auth'
import { createOrganization as createOrg, joinOrganization as joinOrg } from '../lib/orgs'

export default {
  name: 'LoginView',
  data() {
    return {
      email: '',
      password: '',
      rememberMe: false,
      loading: false,
      error: null,
      showRegisterModal: false,
      registerName: '',
      registerEmail: '',
      registerPassword: '',
      registerConfirmPassword: '',
      registerLoading: false,
      registerError: null,
      showOrgSetupModal: false,
      showCreateOrgModal: false,
      newOrgName: '',
      createLoading: false,
      createError: null,
      showJoinOrgModal: false,
      inviteCode: '',
      joinLoading: false,
      joinError: null,
      showSuccessModal: false,
      createdOrgName: '',
      inviteCodeToShare: '',
      codeCopied: false
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

    handleRegister() {
      this.showRegisterModal = true
    },

    closeRegisterModal() {
      this.showRegisterModal = false
      this.registerName = ''
      this.registerEmail = ''
      this.registerPassword = ''
      this.registerConfirmPassword = ''
      this.registerError = null
    },

    async handleRegisterSubmit() {
      this.registerError = null

      // Validate passwords match
      if (this.registerPassword !== this.registerConfirmPassword) {
        this.registerError = 'Lösenorden matchar inte'
        return
      }

      this.registerLoading = true
      try {
        await register(this.registerEmail, this.registerName, this.registerPassword, false)

        // After register: show organization setup modal
        this.closeRegisterModal()
        this.showOrgSetupModal = true
      } catch (e) {
        this.registerError = e?.message || 'Registreringen misslyckades'
      } finally {
        this.registerLoading = false
      }
    },

    skipOrgSetup() {
      this.showOrgSetupModal = false
      this.$router.push('/')
    },

    openJoinOrgFromSetup() {
      this.showOrgSetupModal = false
      this.showJoinOrgModal = true
      this.inviteCode = ''
      this.joinError = null
    },

    openCreateOrgFromSetup() {
      this.showOrgSetupModal = false
      this.showCreateOrgModal = true
      this.newOrgName = ''
      this.createError = null
    },

    closeCreateOrgModal() {
      this.showCreateOrgModal = false
      this.newOrgName = ''
      this.createError = null
    },

    closeJoinOrgModal() {
      this.showJoinOrgModal = false
      this.inviteCode = ''
      this.joinError = null
    },

    closeSuccessModal() {
      this.showSuccessModal = false
      this.createdOrgName = ''
      this.inviteCodeToShare = ''
      this.codeCopied = false
      this.$router.push('/')
    },

    async submitCreateOrganization() {
      this.createError = null
      this.createLoading = true

      try {
        const result = await createOrg(this.newOrgName)
        this.createdOrgName = result.organization.name
        this.inviteCodeToShare = result.invite.code
        this.closeCreateOrgModal()
        this.showSuccessModal = true
      } catch (error) {
        this.createError = error.message || 'Kunde inte skapa organisationen'
      } finally {
        this.createLoading = false
      }
    },

    async submitJoinOrganization() {
      this.joinError = null
      this.joinLoading = true

      try {
        await joinOrg(this.inviteCode)
        this.closeJoinOrgModal()
        this.$router.push('/')
      } catch (error) {
        this.joinError = error.message || 'Kunde inte gå med i organisationen'
      } finally {
        this.joinLoading = false
      }
    },

    copyInviteCode() {
      navigator.clipboard.writeText(this.inviteCodeToShare)
        .then(() => {
          this.codeCopied = true
          setTimeout(() => {
            this.codeCopied = false
          }, 3000)
        })
        .catch(() => {
          this.codeCopied = false
        })
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

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-content {
  background-color: var(--text-light);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  font-size: 2rem;
  color: var(--primary-dark);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--text-dark);
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;
}

.close-btn:hover {
  color: var(--primary-dark);
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.org-setup-actions {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 2rem;
}

.welcome-message {
  font-size: 1rem;
  color: var(--text-dark);
  margin: 0 0 0.5rem 0;
  line-height: 1.6;
}

.error-message {
  color: #d32f2f;
  margin: 0;
  font-size: 0.9rem;
}

.btn-link {
  background: none;
  border: none;
  color: var(--primary-dark);
  cursor: pointer;
  padding: 0.5rem;
  font-size: 0.9rem;
  text-decoration: none;
  transition: opacity 0.3s ease;
}

.btn-link:hover {
  opacity: 0.7;
  text-decoration: underline;
}

@media (max-width: 768px) {
  .modal-content {
    padding: 1.5rem;
  }

  .modal-header h2 {
    font-size: 1.5rem;
  }
}
</style>
