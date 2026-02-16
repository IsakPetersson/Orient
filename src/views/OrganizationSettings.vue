<template>
  <div class="settings-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Laddar inställningar...</p>
    </div>

    <!-- Auth Required -->
    <div v-else-if="showAuthModal" class="modal-overlay auth-modal-overlay" @click.self="goToLogin">
      <div class="modal-content auth-modal-content">
        <div class="auth-modal-body">
          <div class="auth-icon">
            <img src="../assets/images/lock.png" alt="Lock" class="auth-icon-img" />
          </div>
          <h2>Inloggning Krävs</h2>
          <p>Du måste vara inloggad för att komma åt Organisationsinställningar.</p>
          <button class="btn btn-primary btn-full" @click="goToLogin">
            Gå till Inloggning
          </button>
        </div>
      </div>
    </div>

    <!-- No Organization -->
    <div v-else-if="showNoOrgModal" class="modal-overlay auth-modal-overlay">
      <div class="modal-content auth-modal-content">
        <div class="auth-modal-body">
          <div class="auth-icon">
            <img src="../assets/images/members-icon.png" alt="Organization" class="auth-icon-img" />
          </div>
          <h2>Ingen Organisation</h2>
          <p>Du är inte med i någon organisation.</p>
          <button class="btn btn-primary btn-full" @click="$router.push('/')">
            Gå till Startsidan
          </button>
        </div>
      </div>
    </div>

    <!-- No Permission -->
    <div v-else-if="!hasPermission" class="modal-overlay auth-modal-overlay">
      <div class="modal-content auth-modal-content">
        <div class="auth-modal-body">
          <h2>Ingen Behörighet</h2>
          <p>Endast ägare och administratörer kan ändra organisationsinställningar.</p>
          <button class="btn btn-primary btn-full" @click="$router.push('/dashboard')">
            Tillbaka till Dashboard
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <section v-else class="settings-container">
      <div class="settings-header">
        <button class="back-btn" @click="$router.push('/dashboard')">
          ← Tillbaka till Dashboard
        </button>
        <h1>Organisationsinställningar</h1>
        <select 
          v-if="userOrganizations.length > 1" 
          v-model="organizationId" 
          @change="onOrganizationChange"
          class="org-selector"
        >
          <option v-for="org in userOrganizations" :key="org.organization.id" :value="org.organization.id">
            {{ org.organization.name }}
          </option>
        </select>
        <p v-else class="current-org">{{ organizationName }}</p>
      </div>

      <div class="settings-content">
        <!-- General Settings -->
        <div class="settings-section">
          <h2>Allmänt</h2>
          <div class="setting-item">
            <label for="orgName">Organisationsnamn</label>
            <input 
              type="text" 
              id="orgName" 
              v-model="organizationName" 
              class="setting-input"
              disabled
            />
            <p class="setting-hint">Kontakta support för att ändra organisationsnamnet</p>
          </div>
        </div>

        <!-- Swish Settings -->
        <div class="settings-section">
          <h2>Swish Inställningar</h2>
          
          <!-- Configuration Status -->
          <div v-if="swishConfigLoaded" class="config-status">
            <div v-if="swishConfig.certificateConfigured" class="status-badge success">
              ✓ Swish konfigurerat ({{ swishConfig.mode }})
            </div>
            <div v-else class="status-badge warning">
              ⚠ Swish ej konfigurerat
            </div>
          </div>

          <div class="setting-item">
            <label for="swishMerchantNumber">Swish-nummer (Handelsnummer)</label>
            <input 
              type="text" 
              id="swishMerchantNumber" 
              v-model="swishMerchantNumber" 
              class="setting-input"
              placeholder="123 456 7890"
              :disabled="savingSwish"
            />
            <p class="setting-hint">
              Ditt företags Swish-nummer för Swish Handel.
            </p>
          </div>

          <div class="setting-item">
            <label for="swishMode">Miljö</label>
            <select 
              id="swishMode" 
              v-model="swishMode" 
              class="setting-input"
              :disabled="savingSwish"
            >
              <option value="TEST">Test (MSS)</option>
              <option value="PROD">Produktion</option>
            </select>
            <p class="setting-hint">
              Välj TEST för att använda Swish testmiljö (MSS), eller PROD för riktiga betalningar.
            </p>
          </div>

          <div class="setting-item">
            <label for="swishCertificate">Swish .p12 Certifikat</label>
            <input 
              type="file" 
              id="swishCertificate" 
              ref="swishCertFile"
              accept=".p12,.pfx"
              @change="handleCertificateSelect"
              class="file-input"
              :disabled="savingSwish"
            />
            <p class="setting-hint">
              Ladda upp det .p12-certifikat du har fått från din bank för Swish Commerce.
            </p>
            <p v-if="certificateFile" class="file-selected">
              Vald fil: {{ certificateFile.name }}
            </p>
          </div>

          <div class="setting-item">
            <label for="swishPassphrase">Certifikatslösenord</label>
            <input 
              type="password" 
              id="swishPassphrase" 
              v-model="swishPassphrase" 
              class="setting-input"
              placeholder="Lösenord för .p12-certifikatet"
              :disabled="savingSwish"
              autocomplete="new-password"
            />
            <p class="setting-hint">
              Lösenordet som skyddar ditt .p12-certifikat.
            </p>
          </div>
          
          <div class="info-box">
            <h3>Så här aktiverar du Swish-betalningar:</h3>
            <ol>
              <li>Se till att din organisation har ett <strong>Swish Commerce</strong>-avtal med din bank</li>
              <li>Hämta ditt <strong>Swish-nummer</strong> (handelsnummer) från din bank</li>
              <li>Hämta ditt <strong>.p12-certifikat och lösenord</strong> från din bank</li>
              <li>Fyll i informationen ovan och klicka på "Spara Swish-konfiguration"</li>
            </ol>
            <p class="note">
              <strong>Obs:</strong> Certifikatet och lösenordet lagras krypterat i databasen.
            </p>
          </div>

          <button 
            class="btn btn-primary save-btn" 
            @click="saveSwishConfig"
            :disabled="savingSwish || !canSaveSwishConfig"
          >
            {{ savingSwish ? 'Sparar...' : 'Spara Swish-konfiguration' }}
          </button>
        </div>

        <!-- Invite Section -->
        <div class="settings-section">
          <h2>Bjud in Medlemmar</h2>
          <div class="invite-container">
            <p>Dela denna inbjudningskod med nya teammedlemmar:</p>
            <div class="invite-code-display">
              <code class="invite-code">{{ inviteCode || 'Laddar...' }}</code>
              <button class="copy-btn" @click="copyInviteCode" :disabled="!inviteCode">
                {{ copied ? '✓ Kopierad' : 'Kopiera' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="settings-section danger-zone" v-if="currentUserRole === 'OWNER'">
          <h2>Farlig Zon</h2>
          <div class="setting-item">
            <p>Ta bort denna organisation permanent. Detta kan inte ångras.</p>
            <button class="btn btn-danger" @click="confirmDeleteOrganization">
              Ta bort Organisation
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { getCurrentUser } from '../lib/auth'
import { getUserOrganizations, getOrganizationInvite, deleteOrganization } from '../lib/orgs'

export default {
  name: 'OrganizationSettings',
  data() {
    return {
      showAuthModal: false,
      showNoOrgModal: false,
      loading: true,
      saving: false,
      savingSwish: false,
      organizationId: null,
      organizationName: '',
      swishMerchantNumber: '',
      swishMode: 'TEST',
      swishPassphrase: '',
      certificateFile: null,
      swishConfig: null,
      swishConfigLoaded: false,
      userOrganizations: [],
      currentUserRole: '',
      inviteCode: '',
      copied: false
    }
  },
  computed: {
    hasPermission() {
      return this.currentUserRole === 'OWNER' || this.currentUserRole === 'ADMIN'
    },
    canSaveSwishConfig() {
      return this.swishMerchantNumber.trim() && 
             this.swishMode && 
             this.certificateFile && 
             this.swishPassphrase.trim()
    }
  },
  async mounted() {
    const user = await getCurrentUser()
    if (!user) {
      this.showAuthModal = true
      this.loading = false
      return
    }
    
    await this.loadSettings()
  },
  methods: {
    async loadSettings() {
      try {
        this.loading = true
        
        // Get user's organizations
        const memberships = await getUserOrganizations()
        if (memberships.length === 0) {
          this.showNoOrgModal = true
          this.loading = false
          return
        }
        
        this.userOrganizations = memberships
        
        // Use the selected organization or the first one
        if (!this.organizationId) {
          this.organizationId = memberships[0].organization.id
        }
        
        // Get current user's role
        const currentMembership = memberships.find(m => m.organization.id === this.organizationId)
        this.currentUserRole = currentMembership?.role || ''
        
        // Get organization details
        const response = await fetch('/api/orgs?action=getDetails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ organizationId: this.organizationId })
        })
        
        if (response.ok) {
          const data = await response.json()
          this.organizationName = data.organization.name
          this.swishMerchantNumber = data.organization.swishMerchantNumber || ''
        }
        
        // Get invite code
        const inviteData = await getOrganizationInvite(this.organizationId)
        this.inviteCode = inviteData.code
        
        // Load Swish configuration status
        await this.loadSwishConfig()
        
        this.loading = false
      } catch (error) {
        console.error('Failed to load settings:', error)
        this.loading = false
        alert('Kunde inte ladda inställningar')
      }
    },
    async loadSwishConfig() {
      try {
        const response = await fetch('/api/swish-config', {
          method: 'GET',
          headers: {
            'x-org-id': this.organizationId
          },
          credentials: 'include'
        })
        
        if (response.ok) {
          this.swishConfig = await response.json()
          this.swishConfigLoaded = true
          
          // Pre-fill merchant number and mode if configured
          if (this.swishConfig.merchantNumber) {
            this.swishMerchantNumber = this.swishConfig.merchantNumber
          }
          if (this.swishConfig.mode) {
            this.swishMode = this.swishConfig.mode
          }
        }
      } catch (error) {
        console.error('Failed to load Swish config:', error)
      }
    },
    handleCertificateSelect(event) {
      const file = event.target.files[0]
      if (file) {
        // Validate file extension
        if (!file.name.endsWith('.p12') && !file.name.endsWith('.pfx')) {
          alert('Vänligen välj en .p12 eller .pfx fil')
          event.target.value = ''
          return
        }
        
        // Validate file size (max 50KB)
        if (file.size > 50 * 1024) {
          alert('Certifikatfilen är för stor (max 50KB)')
          event.target.value = ''
          return
        }
        
        this.certificateFile = file
      }
    },
    async saveSwishConfig() {
      if (!this.hasPermission) {
        alert('Du har inte behörighet att ändra inställningar')
        return
      }

      if (!this.canSaveSwishConfig) {
        alert('Vänligen fyll i alla obligatoriska fält')
        return
      }

      try {
        this.savingSwish = true
        
        // Read certificate file as base64
        const reader = new FileReader()
        const certificateBase64 = await new Promise((resolve, reject) => {
          reader.onload = () => {
            const arrayBuffer = reader.result
            const bytes = new Uint8Array(arrayBuffer)
            const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '')
            resolve(btoa(binary))
          }
          reader.onerror = reject
          reader.readAsArrayBuffer(this.certificateFile)
        })
        
        const response = await fetch('/api/swish-config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-org-id': this.organizationId
          },
          credentials: 'include',
          body: JSON.stringify({
            merchantNumber: this.swishMerchantNumber.trim(),
            mode: this.swishMode,
            certificateBase64,
            passphrase: this.swishPassphrase
          })
        })
        
        if (!response.ok) {
          const error = await response.json()
          const errorMsg = error.details || error.error || 'Failed to save Swish configuration'
          throw new Error(errorMsg)
        }
        
        alert('Swish-konfiguration sparad!')
        
        // Clear sensitive fields
        this.swishPassphrase = ''
        this.certificateFile = null
        if (this.$refs.swishCertFile) {
          this.$refs.swishCertFile.value = ''
        }
        
        // Reload config status
        await this.loadSwishConfig()
        
        this.savingSwish = false
      } catch (error) {
        console.error('Failed to save Swish config:', error)
        alert(`Kunde inte spara Swish-konfiguration: ${error.message}`)
        this.savingSwish = false
      }
    },
    async onOrganizationChange() {
      await this.loadSettings()
    },
    async copyInviteCode() {
      try {
        await navigator.clipboard.writeText(this.inviteCode)
        this.copied = true
        setTimeout(() => {
          this.copied = false
        }, 2000)
      } catch (error) {
        console.error('Failed to copy:', error)
        alert('Kunde inte kopiera inbjudningskod')
      }
    },
    async confirmDeleteOrganization() {
      const confirmed = confirm(
        `Är du säker på att du vill ta bort organisationen "${this.organizationName}"? ` +
        `Detta kommer permanent radera alla data kopplade till organisationen, inklusive:\n\n` +
        `• Alla konton och transaktioner\n` +
        `• Alla medlemmar\n` +
        `• Alla inbjudningar\n\n` +
        `Denna åtgärd kan INTE ångras!`
      )
      
      if (!confirmed) return
      
      const doubleConfirm = prompt(
        `Skriv organisationens namn "${this.organizationName}" för att bekräfta borttagning:`
      )
      
      if (doubleConfirm !== this.organizationName) {
        alert('Organisationsnamnet matchar inte. Borttagning avbruten.')
        return
      }
      
      try {
        await deleteOrganization(this.organizationId)
        alert('Organisationen har tagits bort.')
        this.$router.push('/login')
      } catch (error) {
        console.error('Failed to delete organization:', error)
        alert('Kunde inte ta bort organisationen')
      }
    },
    goToLogin() {
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.settings-page {
  background-color: var(--background);
  min-height: 100vh;
  padding: 20px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: var(--text-dark);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--background);
  border-top-color: var(--primary-dark);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.settings-container {
  max-width: 900px;
  margin: 0 auto;
}

.settings-header {
  margin-bottom: 2rem;
}

.back-btn {
  background: none;
  border: none;
  color: var(--primary-light);
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 0;
  margin-bottom: 1rem;
  transition: color 0.2s;
}

.back-btn:hover {
  color: var(--primary-dark);
}

.settings-header h1 {
  font-size: 2rem;
  color: var(--primary-dark);
  margin-bottom: 1rem;
}

.org-selector {
  padding: 0.5rem 1rem;
  border: 2px solid var(--background);
  border-radius: 6px;
  font-size: 0.95rem;
  font-family: inherit;
  color: var(--text-dark);
  background-color: white;
  cursor: pointer;
  transition: border-color 0.3s ease;
  max-width: 300px;
}

.org-selector:focus {
  outline: none;
  border-color: var(--primary-light);
}

.current-org {
  font-size: 1.125rem;
  color: var(--text-dark);
  opacity: 0.8;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.settings-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.settings-section h2 {
  font-size: 1.5rem;
  color: var(--primary-dark);
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--background);
  padding-bottom: 0.75rem;
}

.setting-item {
  margin-bottom: 1.5rem;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-dark);
  margin-bottom: 0.5rem;
}

.setting-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--background);
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.3s;
}

.setting-input:focus {
  outline: none;
  border-color: var(--primary-light);
}

.setting-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.7;
}

.setting-hint {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-dark);
  opacity: 0.7;
  line-height: 1.4;
}

.info-box {
  background: #e0f2fe;
  border-left: 4px solid var(--primary-light);
  padding: 1.5rem;
  border-radius: 6px;
  margin: 1.5rem 0;
}

.info-box h3 {
  font-size: 1.125rem;
  color: var(--primary-dark);
  margin-bottom: 1rem;
}

.info-box ol {
  margin-left: 1.5rem;
  margin-bottom: 1rem;
}

.info-box li {
  margin-bottom: 0.5rem;
  color: var(--text-dark);
  line-height: 1.5;
}

.info-box .note {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 0.875rem;
  color: var(--text-dark);
}

.save-btn {
  margin-top: 1rem;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.invite-container {
  margin-top: 1rem;
}

.invite-code-display {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  padding: 1rem;
  background: var(--background);
  border-radius: 6px;
}

.invite-code {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--primary-dark);
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 4px;
}

.copy-btn {
  padding: 0.75rem 1.5rem;
  background: var(--primary-light);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.copy-btn:hover:not(:disabled) {
  background: var(--primary-medium);
  transform: translateY(-1px);
}

.copy-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.danger-zone {
  border: 2px solid #fee;
  margin-top: 3rem;
}

.danger-zone h2 {
  color: #dc2626;
  border-bottom-color: #fee;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary-light);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-medium);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-primary.btn-full {
  width: 100%;
  padding: 1rem;
  font-size: 1.125rem;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
  transform: translateY(-1px);
}

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
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.auth-modal-content {
  max-width: 400px;
}

.auth-modal-body {
  padding: 2rem;
  text-align: center;
}

.auth-icon {
  margin-bottom: 1.5rem;
}

.auth-icon-img {
  width: 64px;
  height: auto;
}

.auth-modal-body h2 {
  font-size: 1.5rem;
  color: var(--primary-dark);
  margin-bottom: 1rem;
}

.auth-modal-body p {
  color: var(--text-dark);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .settings-page {
    padding: 10px;
  }

  .settings-section {
    padding: 1.5rem;
  }

  .settings-header h1 {
    font-size: 1.5rem;
  }

  .invite-code-display {
    flex-direction: column;
  }

  .copy-btn {
    width: 100%;
  }
}

/* Swish Configuration Styles */
.config-status {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--background);
  border-radius: 6px;
}

.status-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
}

.status-badge.success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.status-badge.warning {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}

.file-input {
  padding: 0.5rem;
  border: 2px dashed var(--primary-light);
  border-radius: 6px;
  background: var(--background);
  cursor: pointer;
  width: 100%;
  font-size: 0.95rem;
}

.file-input:hover:not(:disabled) {
  background: #f0f9ff;
  border-color: var(--primary-medium);
}

.file-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.file-selected {
  margin-top: 0.5rem;
  color: var(--primary-dark);
  font-size: 0.875rem;
  font-weight: 600;
}
</style>
