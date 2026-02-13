<template>
  <div id="app">
    <nav class="sidebar">
      <div class="logo-container">
        <router-link to="/" class="logo-link">
          <img src="./assets/images/logo.png" alt="Logo" class="logo" />
        </router-link>
      </div>
      <ul class="nav-links">
        <li>
          <router-link to="/" class="nav-item">
            <span class="icon">▲</span>
            <span class="label">Hem</span>
          </router-link>
        </li>
        <li>
          <router-link to="/about" class="nav-item">
            <span class="icon">●</span>
            <span class="label">Om Oss</span>
          </router-link>
        </li>
        <li>
          <router-link to="/services" class="nav-item">
            <span class="icon">■</span>
            <span class="label">Dashboard</span>
          </router-link>
        </li>
        <li>
          <router-link to="/contact" class="nav-item">
            <span class="icon">✉</span>
            <span class="label">Kontakt</span>
          </router-link>
        </li>
        <li v-if="!isLoggedIn">
          <router-link to="/login" class="nav-item">
            <span class="icon">▶</span>
            <span class="label">Logga In</span>
          </router-link>
        </li>
        <li v-else>
          <a @click="handleLogout" class="nav-item" style="cursor: pointer;">
            <span class="icon">◀</span>
            <span class="label">Logga Ut</span>
          </a>
        </li>
      </ul>

      <!-- User Info Section -->
      <div v-if="isLoggedIn && currentUser" class="user-info">
        <div class="user-avatar">
          {{ currentUser.name.charAt(0).toUpperCase() }}
        </div>
        <div class="user-details">
          <div class="user-name">{{ currentUser.name }}</div>
          <div class="user-email">{{ currentUser.email }}</div>
        </div>
        <!-- Organizations Button -->
        <button @click="showOrgModal = true" class="org-button">
          <span class="icon">◆</span>
          <span class="label">Organisationer</span>
        </button>
      </div>
    </nav>

    <main class="main-content">
      <router-view />
    </main>

    <!-- Organizations Modal -->
    <div v-if="showOrgModal" class="modal-overlay" @click="showOrgModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Organisationer</h2>
          <button class="close-btn" @click="showOrgModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <h3>Nuvarande Organisationer</h3>
          <div class="org-list">
            <div v-if="organizations.length === 0" class="no-orgs">
              Du är inte med i några organisationer än.
            </div>
            <div v-else v-for="org in organizations" :key="org.id" class="org-item">
              {{ org.name }}
            </div>
          </div>
          <div class="org-actions">
            <button @click="openCreateOrgModal" class="btn-primary">Skapa Organisation</button>
            <button @click="openJoinOrgModal" class="btn-secondary">Gå Med i Organisation</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Organization Modal -->
    <div v-if="showCreateOrgModal" class="modal-overlay" @click="showCreateOrgModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Skapa Organisation</h2>
          <button class="close-btn" @click="showCreateOrgModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleCreateOrg">
            <div class="form-group">
              <label for="orgName">Organisationsnamn</label>
              <input
                type="text"
                id="orgName"
                v-model="newOrgName"
                required
                placeholder="Ange organisationsnamn"
              />
            </div>
            <div v-if="orgError" class="error-message">{{ orgError }}</div>
            <button type="submit" class="btn-primary">Skapa</button>
          </form>
        </div>
      </div>
    </div>

    <!-- Join Organization Modal -->
    <div v-if="showJoinOrgModal" class="modal-overlay" @click="showJoinOrgModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Gå Med i Organisation</h2>
          <button class="close-btn" @click="showJoinOrgModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleJoinOrg">
            <div class="form-group">
              <label for="joinCode">Inbjudningskod</label>
              <input
                type="text"
                id="joinCode"
                v-model="joinCode"
                required
                placeholder="Ange inbjudningskod"
              />
            </div>
            <div v-if="orgError" class="error-message">{{ orgError }}</div>
            <button type="submit" class="btn-primary">Gå Med</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { getCurrentUser, logout } from './lib/auth'

export default defineComponent({
  name: 'App',
  data() {
    return {
      isLoggedIn: false,
      currentUser: null as { name: string; email: string } | null,
      showOrgModal: false,
      showCreateOrgModal: false,
      showJoinOrgModal: false,
      organizations: [] as Array<{ id: number; name: string }>,
      newOrgName: '',
      joinCode: '',
      orgError: ''
    }
  },
  async mounted() {
    await this.checkAuth()
  },
  watch: {
    $route() {
      this.checkAuth()
    }
  },
  methods: {
    async checkAuth() {
      try {
        const user = await getCurrentUser()
        this.isLoggedIn = !!user
        this.currentUser = user
        if (user) {
          await this.loadOrganizations()
        }
      } catch (error) {
        this.isLoggedIn = false
        this.currentUser = null
      }
    },
    async handleLogout() {
      await logout()
      this.isLoggedIn = false
      this.currentUser = null
      this.$router.push('/')
    },
    async loadOrganizations() {
      try {
        const response = await fetch('/api/organizations', {
          credentials: 'include'
        })
        if (response.ok) {
          this.organizations = await response.json()
        }
      } catch (error) {
        console.error('Failed to load organizations:', error)
      }
    },
    openCreateOrgModal() {
      this.showOrgModal = false
      this.showCreateOrgModal = true
      this.newOrgName = ''
      this.orgError = ''
    },
    openJoinOrgModal() {
      this.showOrgModal = false
      this.showJoinOrgModal = true
      this.joinCode = ''
      this.orgError = ''
    },
    async handleCreateOrg() {
      try {
        this.orgError = ''
        const response = await fetch('/api/organizations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ name: this.newOrgName })
        })
        
        if (response.ok) {
          await this.loadOrganizations()
          this.showCreateOrgModal = false
          this.showOrgModal = true
        } else {
          const data = await response.json()
          this.orgError = data.error || 'Kunde inte skapa organisation'
        }
      } catch (error) {
        this.orgError = 'Ett fel uppstod'
      }
    },
    async handleJoinOrg() {
      try {
        this.orgError = ''
        const response = await fetch('/api/organizations/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ inviteCode: this.joinCode })
        })
        
        if (response.ok) {
          await this.loadOrganizations()
          this.showJoinOrgModal = false
          this.showOrgModal = true
        } else {
          const data = await response.json()
          this.orgError = data.error || 'Ogiltig inbjudningskod'
        }
      } catch (error) {
        this.orgError = 'Ett fel uppstod'
      }
    }
  }
})
</script>

<style>
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

.user-info {
  margin-top: auto;
  padding: clamp(0.75rem, 1.5vw, 1rem);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: clamp(0.5rem, 1vw, 0.75rem);
}

.user-info > div:first-child {
  display: flex;
  align-items: center;
  gap: clamp(0.5rem, 1vw, 0.75rem);
}

.user-avatar {
  width: clamp(2rem, 4vw, 2.5rem);
  height: clamp(2rem, 4vw, 2.5rem);
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: clamp(0.875rem, 1.5vw, 1.125rem);
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  font-size: clamp(0.75rem, 1.25vw, 0.875rem);
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: clamp(0.625rem, 1vw, 0.75rem);
  color: rgba(231, 244, 253, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.org-button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: clamp(0.5rem, 1vw, 0.75rem);
  padding: clamp(0.5rem, 1vw, 0.625rem);
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  color: #e7f4fd;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: clamp(0.75rem, 1.25vw, 0.875rem);
}

.org-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(5px);
}

.org-button .icon {
  font-size: clamp(0.875rem, 1.5vw, 1rem);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #555;
  font-size: 1.125rem;
}

.org-list {
  margin-bottom: 1.5rem;
  min-height: 100px;
}

.no-orgs {
  padding: 2rem;
  text-align: center;
  color: #999;
  font-style: italic;
}

.org-item {
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  color: #333;
}

.org-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  min-width: 150px;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-secondary:hover {
  background: #f0f4ff;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.error-message {
  padding: 0.75rem;
  background: #fee;
  color: #c33;
  border-radius: 8px;
  margin-bottom: 1rem;
}
</style>
