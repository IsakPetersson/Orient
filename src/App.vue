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
              <span class="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              </span>
              <span class="nav-text">{{ $t('nav.home') }}</span>
            </router-link>
          </li>
          <li>
            <router-link to="/dashboard" active-class="active">
              <span class="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              </span>
              <span class="nav-text">{{ $t('nav.dashboard') }}</span>
            </router-link>
          </li>
          <li>
            <router-link to="/about" active-class="active">
              <span class="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              </span>
              <span class="nav-text">{{ $t('nav.about') }}</span>
            </router-link>
          </li>
          <li>
            <router-link to="/contact" active-class="active">
              <span class="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              </span>
              <span class="nav-text">{{ $t('nav.contact') }}</span>
            </router-link>
          </li>
          <li>
            <router-link to="/legal" active-class="active">
              <span class="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </span>
              <span class="nav-text">{{ $t('nav.legal') }}</span>
            </router-link>
          </li>
          <li v-if="!user">
            <router-link to="/login" active-class="active">
              <span class="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
              </span>
              <span class="nav-text">{{ $t('nav.login') }}</span>
            </router-link>
          </li>
          <li v-if="user">
            <a href="#" @click.prevent="handleLogout" class="nav-link">
              <span class="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </span>
              <span class="nav-text">{{ $t('nav.logout') }}</span>
            </a>
          </li>
        </ul>
      </nav>

      <div class="language-switcher-sidebar">
        <div class="lang-toggle">
          <button @click="$i18n.locale = 'sv'" :class="{ active: $i18n.locale === 'sv' }">SV</button>
          <button @click="$i18n.locale = 'en'" :class="{ active: $i18n.locale === 'en' }">EN</button>
        </div>
      </div>
      
      <div v-if="user" class="user-section">
        <a href="#" @click.prevent="openOrganizationsModal" class="organizations-link">
          <span class="nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </span>
          <span class="nav-text">{{ $t('nav.organizations') }}</span>
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
      <!-- Email verification banner -->
      <div
        v-if="user && !user.emailVerified && !verifyBannerDismissed"
        class="verify-email-banner"
      >
        <span class="verify-banner-icon">⚠️</span>
        <span class="verify-banner-text">{{ $t('auth.verifyEmailBanner') }}</span>
        <button
          class="verify-resend-btn"
          :disabled="resendLoading || resendSent"
          @click="resendVerificationEmail"
        >
          {{ resendSent ? $t('auth.verificationEmailSent') : (resendLoading ? $t('auth.sending') : $t('auth.resendVerification')) }}
        </button>
        <button class="verify-dismiss-btn" @click="verifyBannerDismissed = true">&times;</button>
      </div>
      <router-view />
    </div>

    <!-- Organizations Modal -->
    <div v-if="showOrganizationsModal" class="modal-overlay" @click.self="closeOrganizationsModal">
      <div class="modal-content organizations-modal">
        <div class="modal-header">
          <h2>{{ $t('org.title') }}</h2>
          <button class="close-btn" @click="closeOrganizationsModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="organizations-section">
            <h3>{{ $t('org.current') }}</h3>
            <div class="organizations-list">
              <div v-if="organizations.length === 0" class="no-organizations">
                <p>{{ $t('org.noOrgs') }}</p>
              </div>
              <div v-else>
                <div 
                  v-for="org in organizations" 
                  :key="org.id" 
                  class="organization-item"
                  :class="{ 'clickable': org.role === 'OWNER', 'selected': selectedOrganization?.id === org.id }"
                  @click="selectOrganization(org)"
                >
                  <div class="org-info">
                    <span class="org-name">{{ org.name }}</span>
                    <span class="org-role">{{ translateRole(org.role) }}</span>
                  </div>
                  <div v-if="selectedOrganization?.id === org.id && org.role === 'OWNER'" class="org-controls">
                    <button class="btn btn-sm btn-secondary" @click.stop="copyOrganizationInvite">
                      {{ $t('org.copyInvite') }}
                    </button>
                    <button class="btn btn-sm btn-danger" @click.stop="openDeleteModal">
                      {{ $t('org.delete') }}
                    </button>
                  </div>
                  <p v-if="codeCopied && selectedOrganization?.id === org.id" class="copy-feedback">{{ $t('org.copied') }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="organizations-actions">
            <button class="btn btn-primary" @click="showJoinModal">
              {{ $t('org.join') }}
            </button>
            <button class="btn btn-primary" @click="showCreateModal">
              {{ $t('org.create') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Organization Modal -->
    <div v-if="showCreateOrgModal" class="modal-overlay" @click.self="closeCreateOrgModal">
      <div class="modal-content create-org-modal">
        <div class="modal-header">
          <h2>{{ $t('org.createTitle') }}</h2>
          <button class="close-btn" @click="closeCreateOrgModal">&times;</button>
        </div>
        <form @submit.prevent="submitCreateOrganization" class="modal-body">
          <div class="form-group">
            <label for="org-name">{{ $t('org.nameLabel') }}</label>
            <input
              type="text"
              id="org-name"
              v-model="newOrgName"
              :placeholder="$t('org.namePlaceholder')"
              required
            />
          </div>
          <p v-if="createError" class="error-message">{{ createError }}</p>
          <div class="modal-actions">
            <button type="button" class="btn btn-primary" @click="closeCreateOrgModal">{{ $t('org.cancel') }}</button>
            <button type="submit" class="btn btn-primary" :disabled="createLoading">
              {{ createLoading ? $t('org.creating') : $t('org.createBtn') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Join Organization Modal -->
    <div v-if="showJoinOrgModal" class="modal-overlay" @click.self="closeJoinOrgModal">
      <div class="modal-content join-org-modal">
        <div class="modal-header">
          <h2>{{ $t('org.joinTitle') }}</h2>
          <button class="close-btn" @click="closeJoinOrgModal">&times;</button>
        </div>
        <form @submit.prevent="submitJoinOrganization" class="modal-body">
          <div class="form-group">
            <label for="invite-code">{{ $t('org.inviteCode') }}</label>
            <input
              type="text"
              id="invite-code"
              v-model="inviteCode"
              :placeholder="$t('org.inviteCodePlaceholder')"
              required
            />
          </div>
          <p v-if="joinError" class="error-message">{{ joinError }}</p>
          <div class="modal-actions">
            <button type="button" class="btn btn-primary" @click="closeJoinOrgModal">{{ $t('org.cancel') }}</button>
            <button type="submit" class="btn btn-primary" :disabled="joinLoading">
              {{ joinLoading ? $t('org.joining') : $t('org.joinBtn') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Success Modal for showing invite code -->
    <div v-if="showSuccessModal" class="modal-overlay" @click.self="closeSuccessModal">
      <div class="modal-content success-modal">
        <div class="modal-header">
          <h2>{{ $t('org.orgCreated') }}</h2>
          <button class="close-btn" @click="closeSuccessModal">&times;</button>
        </div>
        <div class="modal-body">
          <p class="success-message">{{ $t('org.orgCreatedMessage', { orgName: createdOrgName }) }}</p>
          <div class="invite-code-section">
            <label>{{ $t('org.inviteCodeLabel') }}</label>
            <div class="invite-code-display">
              <code>{{ inviteCodeToShare }}</code>
              <button type="button" class="btn btn-primary btn-sm" @click="copyInviteCode">{{ $t('org.copy') }}</button>
            </div>
            <p v-if="codeCopied" class="copy-success-message">{{ $t('org.copied') }}</p>
            <p class="invite-code-hint">{{ $t('org.shareHint') }}</p>
          </div>
          <div class="modal-actions">
            <button class="btn btn-primary" @click="closeSuccessModal">{{ $t('org.continue') }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-content delete-modal">
        <div class="modal-header">
          <h2>{{ $t('org.deleteTitle') }}</h2>
          <button class="close-btn" @click="closeDeleteModal">&times;</button>
        </div>
        <div class="modal-body">
          <p class="warning-message">{{ $t('org.deleteWarning', { orgName: selectedOrganization?.name }) }}</p>
          <p class="warning-text">{{ $t('org.deleteConfirm') }}</p>
          
          <div class="delete-confirmation">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="deleteConfirmChecked" 
                @change="onDeleteCheckboxChange"
              />
              <span>{{ $t('org.deleteCheckbox') }}</span>
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-primary" @click="closeDeleteModal">{{ $t('org.cancel') }}</button>
            <button 
              type="button" 
              class="btn btn-danger" 
              @click="confirmDelete"
              :disabled="!deleteConfirmChecked || deleteCountdown > 0 || deleteLoading"
            >
              {{ deleteLoading ? $t('org.deleting') : deleteCountdown > 0 ? $t('org.wait', { seconds: deleteCountdown }) : $t('org.deleteBtn') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getCurrentUser, logout } from './lib/auth'
import { getUserOrganizations, createOrganization as createOrg, joinOrganization as joinOrg, getOrganizationInvite, deleteOrganization as deleteOrg } from './lib/orgs'

export default {
  name: 'App',
  data() {
    return {
      user: null,
      showOrganizationsModal: false,
      organizations: [],
      selectedOrganization: null,
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
      codeCopied: false,
      showDeleteModal: false,
      deleteConfirmChecked: false,
      deleteCountdown: 5,
      deleteCountdownInterval: null,
      deleteLoading: false,
      verifyBannerDismissed: false,
      resendLoading: false,
      resendSent: false
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
    translateRole(role) {
      return this.$t(`dashboard.roles.${role}`)
    },
    async resendVerificationEmail() {
      this.resendLoading = true
      try {
        // Re-trigger verification by calling register with existing user is not possible,
        // so we use a dedicated resend endpoint
        const res = await fetch('/api/auth?action=resend-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        if (res.ok) {
          this.resendSent = true
        }
      } catch {
        // silent fail
      } finally {
        this.resendLoading = false
      }
    },
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
      this.selectedOrganization = null
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
      this.codeCopied = false
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
        await joinOrg(this.inviteCode)
        this.closeJoinOrgModal()
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
        .then(() => {
          this.codeCopied = true
          setTimeout(() => {
            this.codeCopied = false
          }, 3000)
        })
        .catch(() => {
          this.codeCopied = false
        })
    },
    selectOrganization(org) {
      if (org.role === 'OWNER') {
        this.selectedOrganization = this.selectedOrganization?.id === org.id ? null : org
      }
    },
    async copyOrganizationInvite() {
      if (!this.selectedOrganization) return
      
      try {
        const result = await getOrganizationInvite(this.selectedOrganization.id)
        await navigator.clipboard.writeText(result.code)
        this.inviteCodeToShare = result.code
        this.codeCopied = true
        setTimeout(() => {
          this.codeCopied = false
        }, 3000)
      } catch (error) {
        console.error('Failed to copy invite code:', error)
      }
    },
    openDeleteModal() {
      this.showDeleteModal = true
      this.deleteConfirmChecked = false
      this.deleteCountdown = 5
    },
    closeDeleteModal() {
      this.showDeleteModal = false
      this.deleteConfirmChecked = false
      this.deleteCountdown = 5
      if (this.deleteCountdownInterval) {
        clearInterval(this.deleteCountdownInterval)
        this.deleteCountdownInterval = null
      }
    },
    onDeleteCheckboxChange() {
      if (this.deleteConfirmChecked) {
        // Start countdown
        this.deleteCountdown = 5
        this.deleteCountdownInterval = setInterval(() => {
          this.deleteCountdown--
          if (this.deleteCountdown <= 0) {
            clearInterval(this.deleteCountdownInterval)
            this.deleteCountdownInterval = null
          }
        }, 1000)
      } else {
        // Stop countdown and reset
        if (this.deleteCountdownInterval) {
          clearInterval(this.deleteCountdownInterval)
          this.deleteCountdownInterval = null
        }
        this.deleteCountdown = 5
      }
    },
    async confirmDelete() {
      if (!this.selectedOrganization || this.deleteCountdown > 0) return
      
      this.deleteLoading = true
      try {
        await deleteOrg(this.selectedOrganization.id)
        this.closeDeleteModal()
        this.selectedOrganization = null
        await this.loadOrganizations()
      } catch (error) {
        console.error('Failed to delete organization:', error)
      } finally {
        this.deleteLoading = false
      }
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

.verify-email-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fef3c7;
  border-bottom: 2px solid #f59e0b;
  padding: 10px 20px;
  font-size: 13.5px;
  color: #78350f;
}
.verify-banner-icon {
  font-size: 16px;
  flex-shrink: 0;
}
.verify-banner-text {
  flex: 1;
}
.verify-resend-btn {
  background: #f59e0b;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 5px 14px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.verify-resend-btn:disabled {
  opacity: 0.65;
  cursor: default;
}
.verify-dismiss-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #92400e;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
  flex-shrink: 0;
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
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  cursor: default;
}

.organization-item.clickable {
  cursor: pointer;
}

.organization-item.selected {
  background-color: #e8f4f8;
  box-shadow: 0 0 0 2px var(--primary-light);
}

.organization-item:last-child {
  margin-bottom: 0;
}

.organization-item.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.org-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
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

.org-controls {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--background);
}

.org-controls button {
  flex: 1;
}

.copy-feedback {
  font-size: 0.875rem;
  color: #2e7d32;
  margin: 0.5rem 0 0 0;
  font-weight: 500;
  animation: fadeIn 0.3s ease-in;
}

.organizations-actions {
  display: flex;
  gap: 1.5rem;
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
  justify-content: center;
  margin-top: 3rem;
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

.copy-success-message {
  font-size: 0.875rem;
  color: #2e7d32;
  margin: 0.5rem 0 0 0;
  font-weight: 500;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.invite-code-hint {
  font-size: 0.875rem;
  color: var(--text-dark);
  opacity: 0.8;
  margin: 0;
  line-height: 1.5;
}

/* Delete Modal */
.delete-modal {
  max-width: 550px;
}

.warning-message {
  font-size: 1.1rem;
  color: #d32f2f;
  margin-bottom: 1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.warning-text {
  font-size: 0.95rem;
  color: var(--text-dark);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.delete-confirmation {
  background-color: var(--background);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--primary-dark);
}

.checkbox-label span {
  font-size: 0.95rem;
  color: var(--text-dark);
}

/* Button Styles */
.btn-secondary {
  background-color: var(--text-dark);
  color: var(--text-light);
}

.btn-secondary:hover {
  background-color: #555;
}

.btn-danger {
  background-color: #d32f2f;
  color: white;
}

.btn-danger:hover {
  background-color: #b71c1c;
}

.btn-danger:disabled {
  background-color: #e57373;
  cursor: not-allowed;
  opacity: 0.6;
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
.language-switcher-sidebar {
  padding: 1rem;
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: center;
}

.lang-toggle {
  display: inline-flex;
  background-color: rgba(0, 0, 0, 0.2);
  gap: 4px;
  padding: 4px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.lang-toggle button {
  background: none;
  border: none;
  color: var(--text-light);
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.lang-toggle button.active {
  background-color: var(--primary-light);
  color: #fff;
  opacity: 1;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.lang-toggle button:hover:not(.active) {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.05);
}
</style>

