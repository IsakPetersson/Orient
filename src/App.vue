<template>
  <div id="app">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div>
          <span class="logo-text">Orient</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <ul class="nav-links">
          <li>
            <router-link to="/" exact-active-class="active">
              <span class="nav-icon">○</span>
              <span class="nav-text">Hem</span>
            </router-link>
          </li>
          <li>
            <router-link to="/dashboard" active-class="active">
              <span class="nav-icon">■</span>
              <span class="nav-text">Dashboard</span>
            </router-link>
          </li>
          <li>
            <router-link to="/about" active-class="active">
              <span class="nav-icon">?</span>
              <span class="nav-text">Om Oss</span>
            </router-link>
          </li>
          <li>
            <router-link to="/contact" active-class="active">
              <span class="nav-icon">@</span>
              <span class="nav-text">Kontakt</span>
            </router-link>
          </li>
          <li v-if="!user">
            <router-link to="/login" active-class="active">
              <span class="nav-icon">▶</span>
              <span class="nav-text">Logga In</span>
            </router-link>
          </li>
          <li v-if="user">
            <a href="#" @click.prevent="handleLogout" class="nav-link">
              <span class="nav-icon">◀</span>
              <span class="nav-text">Logga Ut</span>
            </a>
          </li>
        </ul>
      </nav>
      
      <div v-if="user" class="user-section">
        <a href="#" @click.prevent="openOrganizationsModal" class="organizations-link">
          <span class="nav-icon">◆</span>
          <span class="nav-text">Organisationer</span>
        </a>
        
        <div class="user-info">
          <div class="user-avatar">
            <span class="avatar-initial">{{ userInitial }}</span>
          </div>
          <div class="user-details">
            <div class="user-name">{{ user.name }}</div>
            <div class="user-email">{{ user.email }}</div>
          </div>
        </div>
      </div>
    </aside>

    <div class="main-content">
      <router-view />
    </div>

    <!-- Organizations Modal -->
    <div v-if="showOrganizationsModal" class="modal-overlay" @click.self="closeOrganizationsModal">
      <div class="modal-content organizations-modal">
        <div class="modal-header">
          <h2>Organisationer</h2>
          <button class="close-btn" @click="closeOrganizationsModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="organizations-section">
            <h3>Nuvarande Organisationer</h3>
            <div class="organizations-list">
              <div v-if="organizations.length === 0" class="no-organizations">
                <p>Du är inte med i någon organisation ännu.</p>
              </div>
              <div v-else>
                <div v-for="org in organizations" :key="org.id" class="organization-item">
                  <div class="org-info">
                    <span class="org-name">{{ org.name }}</span>
                    <span class="org-role">{{ org.role }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="organizations-actions">
            <button class="btn btn-primary" @click="showJoinModal">
              Gå med i Organisation
            </button>
            <button class="btn btn-primary" @click="showCreateModal">
              Skapa Organisation
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
        <form @submit.prevent="submitCreateOrganization" class="modal-body">
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
        <form @submit.prevent="submitJoinOrganization" class="modal-body">
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
            <p class="invite-code-hint">Dela denna kod med andra för att bjuda in dem till organisationen.</p>
          </div>
          <div class="modal-actions">
            <button class="btn btn-primary" @click="closeSuccessModal">Stäng</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getCurrentUser, logout } from './lib/auth'
import { getUserOrganizations, createOrganization as createOrg, joinOrganization as joinOrg } from './lib/orgs'

export default {
  name: 'App',
  data() {
    return {
      user: null,
      showOrganizationsModal: false,
      organizations: [],
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
      inviteCodeToShare: ''
    }
  },
  async mounted() {
    await this.checkAuth()
  },
  watch: {
    '$route'() {
      this.checkAuth()
    }
  },
  computed: {
    isDashboardRoute() {
      return this.$route.path === '/dashboard'
    },
    userInitial() {
      return this.user?.name?.charAt(0).toUpperCase() || '?'
    }
  },
  methods: {
    async checkAuth() {
      const user = await getCurrentUser()
      this.user = user
    },
    async handleLogout() {
      try {
        await logout()
        this.user = null
        this.$router.push('/')
      } catch (error) {
        console.error('Logout failed:', error)
      }
    },
    async openOrganizationsModal() {
      this.showOrganizationsModal = true
      await this.loadOrganizations()
    },
    closeOrganizationsModal() {
      this.showOrganizationsModal = false
    },
    showCreateModal() {
      this.showCreateOrgModal = true
      this.newOrgName = ''
      this.createError = null
    },
    closeCreateOrgModal() {
      this.showCreateOrgModal = false
      this.newOrgName = ''
      this.createError = null
    },
    showJoinModal() {
      this.showJoinOrgModal = true
      this.inviteCode = ''
      this.joinError = null
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
        // Refresh the organizations list
        await this.loadOrganizations()
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
        const result = await joinOrg(this.inviteCode)
        this.closeJoinOrgModal()
        alert(`Du har gått med i "${result.organization.name}" som ${result.role}`)
        // Refresh the organizations list
        await this.loadOrganizations()
      } catch (error) {
        this.joinError = error.message || 'Kunde inte gå med i organisationen'
      } finally {
        this.joinLoading = false
      }
    },
    async loadOrganizations() {
      try {
        const memberships = await getUserOrganizations()
        this.organizations = memberships.map(m => ({
          id: m.organization.id,
          name: m.organization.name,
          role: m.role
        }))
      } catch (error) {
        console.error('Failed to load organizations:', error)
        this.organizations = []
      }
    },
    copyInviteCode() {
      navigator.clipboard.writeText(this.inviteCodeToShare)
        .then(() => alert('Inbjödningskod kopierad!'))
        .catch(() => alert('Kunde inte kopiera koden'))
    }
  },
}
</script>

<style scoped>
#app {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: clamp(200px, 15vw, 240px);
  background-color: var(--primary-dark);
  box-shadow: clamp(1px, 0.2vw, 2px) 0 clamp(5px, 1vw, 10px) rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  transition: width 0.3s ease;
}

.sidebar-header {
  padding: clamp(1rem, 2vh, 1.5rem) clamp(0.75rem, 1.5vw, 1rem);
  border-bottom: clamp(0.5px, 0.1vh, 1px) solid rgba(255, 255, 255, 0.1);
}

.logo {
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo a {
  display: block;
  text-decoration: none;
}

.logo-image {
  width: clamp(100px, 12vw, 140px);
  height: auto;
  transition: transform 0.3s ease;
}

.logo-image:hover {
  transform: scale(1.05);
}

.logo-text {
  font-size: clamp(1.2rem, 2.5vh, 1.75rem);
  font-weight: 700;
  color: var(--text-light);
  letter-spacing: clamp(0.02em, 0.3vh, 0.05em);
  text-transform: uppercase;
  display: block;
  transition: all 0.3s ease;
}

.logo-text:hover {
  color: var(--background);
  transform: translateX(2px);
}

.sidebar-nav {
  flex: 1;
  padding: clamp(1rem, 2vh, 1.5rem) 0;
}

.nav-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-links li {
  margin-bottom: clamp(0.25rem, 0.5vh, 0.5rem);
}

.nav-links a {
  display: flex;
  align-items: center;
  gap: clamp(0.5rem, 1.5vw, 1rem);
  padding: clamp(0.75rem, 1.5vh, 1rem) clamp(1rem, 2vw, 1.5rem);
  color: var(--text-light);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  opacity: 0.8;
}

.nav-links a:hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.05);
}

.nav-links a.active {
  opacity: 1;
  background-color: var(--primary-light);
  border-left: clamp(2px, 0.5vw, 4px) solid var(--text-light);
}

.nav-links a.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.nav-links a.sub-item {
  padding-left: clamp(1.5rem, 4vw, 2.5rem);
  font-size: clamp(0.8rem, 1.2vh, 0.9rem);
}

.nav-icon {
  font-size: clamp(1rem, 1.8vh, 1.2rem);
  width: clamp(20px, 3vw, 24px);
  text-align: center;
  flex-shrink: 0;
}

.nav-text {
  font-size: clamp(0.875rem, 1.5vh, 1rem);
}

.user-section {
  margin-top: auto;
}

.organizations-link {
  display: flex;
  align-items: center;
  gap: clamp(0.5rem, 1.5vw, 1rem);
  padding: clamp(0.75rem, 1.5vh, 1rem) clamp(1rem, 2vw, 1.5rem);
  color: var(--text-light);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  opacity: 0.8;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.organizations-link:hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.05);
}

.user-info {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: clamp(1rem, 2vh, 1.5rem);
  display: flex;
  align-items: center;
  gap: clamp(0.75rem, 1.5vw, 1rem);
  background-color: rgba(0, 0, 0, 0.1);
}

.user-avatar {
  width: clamp(36px, 6vw, 44px);
  height: clamp(36px, 6vw, 44px);
  border-radius: 50%;
  background-color: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-initial {
  font-size: clamp(1rem, 2vh, 1.25rem);
  font-weight: 700;
  color: var(--text-light);
}

.user-details {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.user-name {
  font-size: clamp(0.875rem, 1.5vh, 1rem);
  font-weight: 600;
  color: var(--text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: clamp(0.75rem, 1.2vh, 0.85rem);
  color: var(--background);
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.main-content {
  margin-left: clamp(200px, 15vw, 240px);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left 0.3s ease;
}

@media (max-width: 1024px) {
  .sidebar {
    width: clamp(180px, 20vw, 220px);
  }

  .main-content {
    margin-left: clamp(180px, 20vw, 220px);
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: clamp(160px, 25vw, 200px);
  }

  .main-content {
    margin-left: clamp(160px, 25vw, 200px);
  }

  .logo-text {
    font-size: clamp(0.9rem, 2vh, 1.1rem);
  }

  .nav-text {
    font-size: clamp(0.8rem, 1.3vh, 0.9rem);
  }

  .nav-icon {
    font-size: clamp(0.9rem, 1.5vh, 1.1rem);
    width: clamp(18px, 4vw, 22px);
  }

  .sidebar-header {
    padding: clamp(0.75rem, 1.5vh, 1rem) clamp(0.5rem, 1vw, 0.75rem);
  }

  .nav-links a {
    padding: clamp(0.5rem, 1.2vh, 0.75rem) clamp(0.75rem, 1.5vw, 1rem);
  }
}

@media (max-width: 480px) {
  .sidebar {
    width: clamp(140px, 30vw, 180px);
  }

  .main-content {
    margin-left: clamp(140px, 30vw, 180px);
  }

  .logo-text {
    font-size: clamp(0.8rem, 1.8vh, 1rem);
    letter-spacing: clamp(0.01em, 0.2vh, 0.03em);
  }

  .nav-text {
    font-size: clamp(0.75rem, 1.2vh, 0.85rem);
  }

  .nav-icon {
    font-size: clamp(0.8rem, 1.3vh, 1rem);
    width: clamp(16px, 5vw, 20px);
  }

  .sidebar-header {
    padding: clamp(0.5rem, 1.2vh, 0.75rem) clamp(0.5rem, 1vw, 0.75rem);
  }

  .nav-links a {
    padding: clamp(0.5rem, 1vh, 0.65rem) clamp(0.5rem, 1.2vw, 0.75rem);
    gap: clamp(0.4rem, 1.2vw, 0.6rem);
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
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.organizations-modal {
  max-width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--background);
}

.modal-header h2 {
  font-size: 1.75rem;
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

.modal-body {
  padding: 2rem;
}

.organizations-section {
  margin-bottom: 2rem;
}

.organizations-section h3 {
  font-size: 1.25rem;
  color: var(--primary-dark);
  margin-bottom: 1rem;
}

.organizations-list {
  background-color: var(--background);
  border-radius: 8px;
  padding: 1rem;
  min-height: 150px;
  max-height: 300px;
  overflow-y: auto;
}

.no-organizations {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  color: var(--text-dark);
  opacity: 0.7;
}

.no-organizations p {
  margin: 0;
  font-size: 1rem;
}

.organization-item {
  background-color: var(--text-light);
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.organization-item:last-child {
  margin-bottom: 0;
}

.organization-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.org-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.org-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-dark);
}

.org-role {
  font-size: 0.875rem;
  color: var(--text-dark);
  background-color: var(--background);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
}

.organizations-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.organizations-actions button {
  flex: 1;
  min-width: 200px;
}

/* Form Styles */
.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
}

.form-group label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 0.5rem;
}

.form-group input {
  padding: 0.875rem;
  border: 2px solid var(--background);
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-light);
}

.error-message {
  color: #d32f2f;
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.modal-actions button {
  min-width: 120px;
}

/* Create/Join Organization Modals */
.create-org-modal,
.join-org-modal {
  max-width: 500px;
}

/* Success Modal */
.success-modal {
  max-width: 550px;
}

.success-message {
  font-size: 1.1rem;
  color: var(--primary-dark);
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.invite-code-section {
  background-color: var(--background);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.invite-code-section label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 0.75rem;
}

.invite-code-display {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.75rem;
}

.invite-code-display code {
  flex: 1;
  background-color: var(--text-light);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 1.1rem;
  font-family: 'Courier New', monospace;
  color: var(--primary-dark);
  border: 2px solid var(--primary-light);
  font-weight: 600;
  letter-spacing: 0.05em;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  min-width: auto;
}

.invite-code-hint {
  font-size: 0.875rem;
  color: var(--text-dark);
  opacity: 0.8;
  margin: 0;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .modal-content {
    max-width: 95%;
  }
  
  .modal-header {
    padding: 1rem 1.5rem;
  }
  
  .modal-header h2 {
    font-size: 1.5rem;
  }
  
  .modal-body {
    padding: 1.5rem;
  }
  
  .organizations-actions {
    flex-direction: column;
  }
  
  .organizations-actions button {
    min-width: 100%;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .modal-actions button {
    width: 100%;
  }
  
  .invite-code-display {
    flex-direction: column;
  }
  
  .invite-code-display code {
    font-size: 1rem;
  }
}
</style>


