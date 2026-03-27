<template>
  <div class="settings-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>{{ $t('settings.loading') }}</p>
    </div>

    <!-- Auth Required -->
    <div v-else-if="showAuthModal" class="modal-overlay auth-modal-overlay" @click.self="goToLogin">
      <div class="modal-content auth-modal-content">
        <div class="auth-modal-body">
          <div class="auth-icon">
            <img src="../assets/images/lock.png" alt="Lock" class="auth-icon-img" />
          </div>
          <h2>{{ $t('settings.authRequiredTitle') }}</h2>
          <p>{{ $t('settings.authRequiredText') }}</p>
          <button class="btn btn-primary btn-full" @click="goToLogin">
            {{ $t('settings.goToLogin') }}
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
          <h2>{{ $t('settings.noOrgTitle') }}</h2>
          <p>{{ $t('settings.noOrgText') }}</p>
          <button class="btn btn-primary btn-full" @click="$router.push('/')">
            {{ $t('settings.goToHome') }}
          </button>
        </div>
      </div>
    </div>

    <!-- No Permission -->
    <div v-else-if="!hasPermission" class="modal-overlay auth-modal-overlay">
      <div class="modal-content auth-modal-content">
        <div class="auth-modal-body">
          <h2>{{ $t('settings.noPermissionTitle') }}</h2>
          <p>{{ $t('settings.noPermissionText') }}</p>
          <button class="btn btn-primary btn-full" @click="$router.push('/dashboard')">
            {{ $t('settings.backToDashboard') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <section v-else class="settings-container">
      <div class="settings-header">
        <button class="back-btn" @click="$router.push('/dashboard')">
          ← {{ $t('settings.backToDashboard') }}
        </button>
        <h1>{{ $t('settings.pageTitle') }}</h1>
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
          <h2>{{ $t('settings.generalTitle') }}</h2>
          <div class="setting-item">
            <label for="orgName">{{ $t('settings.orgNameLabel') }}</label>
            <input 
              type="text" 
              id="orgName" 
              v-model="organizationName" 
              class="setting-input"
              disabled
            />
            <p class="setting-hint">{{ $t('settings.orgNameHint') }}</p>
          </div>
          
          <div class="setting-item">
            <label for="orgNumber">{{ $t('settings.orgNumberLabel') }}</label>
            <div style="display: flex; gap: 1rem;">
              <input 
                type="text" 
                id="orgNumber" 
                v-model="orgNumber" 
                class="setting-input"
                :placeholder="$t('settings.orgNumberPlaceholder')"
                :disabled="savingOrg"
              />
            </div>
            <p class="setting-hint">{{ $t('settings.orgNumberHint') }}</p>
          </div>

          <div class="setting-item">
            <label for="orgLogo">{{ $t('settings.logoLabel') }}</label>
            <div style="display: flex; gap: 1rem;">
              <input 
                type="text" 
                id="orgLogo" 
                v-model="orgLogo" 
                class="setting-input"
                :placeholder="$t('settings.logoPlaceholder')"
                :disabled="savingOrg"
              />
            </div>
            <p class="setting-hint">{{ $t('settings.logoHint') }}</p>
          </div>

          <button class="btn btn-primary" @click="saveOrgDetails" :disabled="savingOrg || !orgDetailsChanged" style="margin-top: 1rem;">
            {{ savingOrg ? $t('settings.savingGeneral') : $t('settings.saveGeneral') }}
          </button>
        </div>

        <!-- Swish Settings -->
        <div class="settings-section">
          <h2>{{ $t('settings.swishTitle') }}</h2>
          
          <!-- Configuration Status -->
          <div v-if="swishConfigLoaded" class="config-status">
            <div v-if="swishConfig.certificateConfigured" class="status-badge success">
              {{ $t('settings.swishConfigured', { mode: swishConfig.mode }) }}
            </div>
            <div v-else class="status-badge warning">
              {{ $t('settings.swishNotConfigured') }}
            </div>
          </div>

          <div class="setting-item">
            <div class="label-row">
              <label for="swishMerchantNumber">{{ $t('settings.merchantNumberLabel') }}</label>
              <button class="help-link" @click="showMerchantGuide = true">{{ $t('settings.guideButton') }}</button>
            </div>
            <input 
              type="text" 
              id="swishMerchantNumber" 
              v-model="swishMerchantNumber" 
              class="setting-input"
              :placeholder="$t('settings.merchantNumberPlaceholder')"
              :disabled="savingSwish"
            />
            <p class="setting-hint">
              {{ $t('settings.merchantNumberHint') }}
            </p>
          </div>

          <div class="setting-item">
            <label for="swishMode">{{ $t('settings.environmentLabel') }}</label>
            <select 
              id="swishMode" 
              v-model="swishMode" 
              class="setting-input"
              :disabled="savingSwish"
            >
              <option value="TEST">{{ $t('settings.envTest') }}</option>
              <option value="PROD">{{ $t('settings.envProd') }}</option>
            </select>
            <p class="setting-hint">
              {{ $t('settings.environmentHint') }}
            </p>
          </div>

          <div class="setting-item">
            <div class="label-row">
              <label for="swishCertificate">{{ $t('settings.certificateLabel') }}</label>
              <button class="help-link" @click="showCertificateGuide = true">{{ $t('settings.guideButton') }}</button>
            </div>
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
              {{ $t('settings.certificateHint') }}
            </p>
            <p v-if="certificateFile" class="file-selected">
              {{ $t('settings.fileSelected', { fileName: certificateFile.name }) }}
            </p>
          </div>

          <div class="setting-item">
            <label for="swishPassphrase">{{ $t('settings.passphraseLabel') }}</label>
            <input 
              type="password" 
              id="swishPassphrase" 
              v-model="swishPassphrase" 
              class="setting-input"
              :placeholder="$t('settings.passphrasePlaceholder')"
              :disabled="savingSwish"
              autocomplete="new-password"
            />
            <p class="setting-hint">
              {{ $t('settings.passphraseHint') }}
            </p>
          </div>
          
          <div class="info-box">
            <h3>{{ $t('settings.activationStepsTitle') }}</h3>
            <ol>
              <li v-html="$t('settings.step1')"></li>
              <li v-html="$t('settings.step2')"></li>
              <li v-html="$t('settings.step3')"></li>
              <li>{{ $t('settings.step4') }}</li>
            </ol>
            <p class="note">
              {{ $t('settings.noteEncrypted') }}
            </p>
          </div>

          <button 
            class="btn btn-primary save-btn" 
            @click="saveSwishConfig"
            :disabled="savingSwish || !canSaveSwishConfig"
          >
            {{ savingSwish ? $t('settings.savingSwish') : $t('settings.saveSwish') }}
          </button>
        </div>

        <!-- SIE4 export & import -->
        <div class="settings-section">
          <h2>{{ $t('settings.accountingTitle') }}</h2>
          <div class="sie-settings-card">
            <h3 class="sie-settings-subtitle">{{ $t('settings.exportTitle') }}</h3>
            <p class="setting-hint sie-settings-desc">{{ $t('settings.exportDesc') }}</p>
            <div class="sie-actions-row">
              <button
                type="button"
                class="btn btn-primary sie-action-btn"
                @click="downloadSieFile"
                :disabled="downloadingSie"
              >
                <span v-if="downloadingSie">{{ $t('settings.downloadingSie') }}</span>
                <span v-else>{{ $t('settings.sieExportLabel') }}</span>
              </button>
              <button
                type="button"
                class="btn btn-primary sie-action-btn"
                :disabled="!sieImportOrgs.length"
                :title="!sieImportOrgs.length ? $t('dashboard.sieImport.noOrgsForImport') : ''"
                @click="openSieImportModal"
              >
                {{ $t('settings.sieImportLabel') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Invite Section -->
        <div class="settings-section">
          <h2>{{ $t('settings.inviteTitle') }}</h2>
          <div class="invite-container">
            <p>{{ $t('settings.inviteText') }}</p>
            <div class="invite-code-display">
              <code class="invite-code">{{ inviteCode || $t('settings.loadingCode') }}</code>
              <button class="copy-btn" @click="copyInviteCode" :disabled="!inviteCode">
                {{ copied ? $t('settings.copied') : $t('settings.copy') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="settings-section danger-zone" v-if="currentUserRole === 'OWNER'">
          <h2>{{ $t('settings.dangerZoneTitle') }}</h2>
          <div class="setting-item">
            <p>{{ $t('settings.deleteOrgText') }}</p>
            <button class="btn btn-danger" @click="confirmDeleteOrganization">
              {{ $t('settings.deleteOrgButton') }}
            </button>
          </div>
        </div>
      </div>
    </section>
    <!-- Merchant Number Guide Modal -->
    <div v-if="showMerchantGuide" class="modal-overlay help-modal-overlay" @click.self="showMerchantGuide = false">
      <div class="modal-content help-modal-content">
        <div class="help-modal-header">
          <h2>{{ $t('settings.merchantGuideTitle') }}</h2>
          <button class="close-btn" @click="showMerchantGuide = false">×</button>
        </div>
        <div class="help-modal-body">
          <p>{{ $t('settings.merchantGuideText1') }}</p>
          
          <h3 v-html="$t('settings.step1Title')"></h3>
          <p v-html="$t('settings.step1Text')"></p>
          
          <h3 v-html="$t('settings.step2Title')"></h3>
          <p v-html="$t('settings.step2Text')"></p>
          
          <h3 v-html="$t('settings.step3Title')"></h3>
          <p>{{ $t('settings.step3Text') }}</p>
        </div>
        <div class="help-modal-footer">
          <button class="btn btn-primary" @click="showMerchantGuide = false">{{ $t('settings.understand') }}</button>
        </div>
      </div>
    </div>

    <!-- Certificate Guide Modal -->
    <div v-if="showCertificateGuide" class="modal-overlay help-modal-overlay" @click.self="showCertificateGuide = false">
      <div class="modal-content help-modal-content">
        <div class="help-modal-header">
          <h2>{{ $t('settings.certGuideTitle') }}</h2>
          <button class="close-btn" @click="showCertificateGuide = false">×</button>
        </div>
        <div class="help-modal-body">
          <p>{{ $t('settings.certGuideIntro') }}</p>
          
          <div class="help-callout">
            <h3 class="help-callout-title">{{ $t('settings.option1Title') }}</h3>
            <p>{{ $t('settings.option1Text') }}</p>
            <textarea readonly class="help-textarea">{{ $t('settings.helpRequestText') }}</textarea>
          </div>

          <h3 class="help-section-title">{{ $t('settings.option2Title') }}</h3>
          <p>{{ $t('settings.option2Text') }}</p>

          <ol class="help-numbered-list">
            <li v-html="$t('settings.certStep1')"></li>
            <li v-html="$t('settings.certStep2')"></li>
            <li v-html="$t('settings.certStep3')"></li>
            <li v-html="$t('settings.certStep4')"></li>
          </ol>

          <details class="help-details">
            <summary class="help-details-summary">{{ $t('settings.technicalInstructions') }}</summary>
            <div class="help-details-inner">
              <p>{{ $t('settings.techStep1') }}</p>
              <code class="help-code-block">
                openssl req -new -newkey rsa:2048 -nodes -keyout swish.key -out swish.csr
              </code>
              <p>{{ $t('settings.techStep2') }}</p>
              <code class="help-code-block">
                openssl pkcs12 -export -out swish_certificate.p12 -inkey swish.key -in swish_signed.pem
              </code>
            </div>
          </details>

        </div>
        <div class="help-modal-footer">
          <button class="btn btn-primary" @click="showCertificateGuide = false">{{ $t('settings.understand') }}</button>
        </div>
      </div>
    </div>

    <!-- Custom Alert Modal -->
    <div v-if="showCustomAlert" class="modal-overlay alert-modal-overlay" @click.self="showCustomAlert = false">
      <div class="modal-content alert-modal-content">
        <div class="alert-header-centered">
          <div class="alert-icon-circle" :class="customAlertType">
            <span v-if="customAlertType === 'success'">✓</span>
            <span v-else-if="customAlertType === 'error'">✕</span>
            <span v-else>!</span>
          </div>
          <h2>{{ customAlertTitle }}</h2>
        </div>
        <div class="alert-body-centered" v-if="customAlertMessage">
          <p style="white-space: pre-line;">{{ customAlertMessage }}</p>
        </div>
        <div class="modal-footer centered">
          <button class="btn btn-primary btn-lg" @click="showCustomAlert = false">{{ $t('settings.understand') }}</button>
        </div>
      </div>
    </div>

    <!-- Confirm Modal -->
    <div v-if="showConfirmModal" class="modal-overlay alert-modal-overlay" @click.self="showConfirmModal = false">
      <div class="modal-content alert-modal-content">
        <div class="alert-header-centered">
          <div class="alert-icon-circle warning">
            <span>?</span>
          </div>
          <h2>{{ customAlertTitle }}</h2>
        </div>
        <div class="alert-body-centered">
          <p style="white-space: pre-line;">{{ customAlertMessage }}</p>
        </div>
        <div class="modal-footer centered" style="gap: 1rem;">
          <button class="btn cancel-btn" @click="showConfirmModal = false">{{ $t('buttons.cancel') }}</button>
          <button class="btn btn-primary" @click="handleConfirm">{{ $t('dashboard.confirm') }}</button>
        </div>
      </div>
    </div>

    <!-- Delete Organization Modal -->
    <div v-if="showDeleteModal" class="modal-overlay alert-modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-content alert-modal-content delete-modal-content">
        <div class="alert-header-centered">
          <div class="alert-icon-circle error">
            <span>✕</span>
          </div>
          <h2>{{ $t('settings.deleteTitle') }}</h2>
        </div>
        <div class="alert-body-centered">
          <p><strong>{{ $t('settings.deleteWarning', { orgName: organizationName }) }}</strong></p>
          <p class="delete-confirm-hint">{{ $t('settings.deleteConfirm') }}</p>
          <div class="delete-confirm-box">
            <label class="delete-confirm-label">
              {{ $t('settings.alerts.deleteDoubleConfirm', { name: organizationName }) }}
            </label>
            <input
              v-model="deleteConfirmName"
              type="text"
              class="setting-input delete-confirm-input"
              :placeholder="organizationName"
              :disabled="deleting"
            />
          </div>
        </div>
        <div class="modal-footer centered" style="gap: 1rem;">
          <button class="btn cancel-btn" @click="closeDeleteModal" :disabled="deleting">{{ $t('buttons.cancel') }}</button>
          <button
            class="btn btn-danger"
            :disabled="!canConfirmDelete || deleting"
            @click="executeDeleteOrganization"
          >
            <span v-if="deleting">{{ $t('settings.deleting') }}</span>
            <span v-else-if="deleteCountdown > 0">{{ $t('settings.wait', { seconds: deleteCountdown }) }}</span>
            <span v-else>{{ $t('settings.deleteBtn') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- SIE4 Import Modal -->
    <div v-if="showSieImportModal" class="modal-overlay" @click.self="closeSieImportModal">
      <div class="modal-content sie-import-modal" @click.stop>
        <div class="modal-header">
          <h2>{{ $t('dashboard.sieImport.title') }}</h2>
          <button class="close-btn" type="button" @click="closeSieImportModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="sie-import-org-row">
            <label for="sie-import-org">{{ $t('dashboard.sieImport.targetOrganization') }}</label>
            <select
              id="sie-import-org"
              v-model.number="sieImportOrganizationId"
              class="sie-import-select setting-input"
              :disabled="sieImporting || sieImportAccountsLoading"
              @change="onSieImportOrganizationChange"
            >
              <option v-for="m in sieImportOrgs" :key="m.organization.id" :value="m.organization.id">
                {{ m.organization.name }}
              </option>
            </select>
            <p class="sie-import-account-hint">{{ $t('dashboard.sieImport.targetOrganizationHint') }}</p>
          </div>

          <div class="sie-import-account-row">
            <label for="sie-import-account">{{ $t('dashboard.sieImport.targetAccount') }}</label>
            <select
              id="sie-import-account"
              v-model.number="sieImportAccountId"
              class="sie-import-select setting-input"
              :disabled="!sieImportAccounts.length || sieImporting || sieImportAccountsLoading"
            >
              <option v-for="a in sieImportAccounts" :key="a.id" :value="a.id">{{ a.name }}</option>
            </select>
            <p class="sie-import-account-hint">{{ $t('dashboard.sieImport.targetAccountHint') }}</p>
            <p v-if="sieImportOrganizationId && !sieImportAccounts.length && !sieImportAccountsLoading" class="sie-import-warning">{{ $t('dashboard.sieImport.noAccounts') }}</p>
          </div>

          <div v-if="!sieImportParsed" class="sie-upload-section">
            <div
              class="upload-area sie-upload-area"
              :class="{ 'drag-active': sieImportDragging, 'sie-upload-disabled': !canSieImportProceed }"
              @dragover.prevent="onSieUploadDragOver"
              @dragleave.prevent="sieImportDragging = false"
              @drop.prevent="handleSieFileDrop"
              @click="openSieFilePicker"
            >
              <span class="upload-icon">📂</span>
              <p v-if="sieImportParsing">{{ $t('dashboard.sieImport.parsing') }}</p>
              <p v-else>{{ $t('dashboard.sieImport.dropHint') }}</p>
            </div>
            <input
              ref="sieFileInput"
              type="file"
              accept=".se,.si,.sie"
              style="display: none"
              @change="handleSieFileSelect"
            />
          </div>

          <div v-if="sieImportParsed" class="sie-preview">
            <div class="sie-summary-grid">
              <div class="sie-summary-item">
                <span class="sie-summary-label">{{ $t('dashboard.sieImport.vouchers') }}</span>
                <span class="sie-summary-value">{{ sieImportParsed.voucherCount }}</span>
              </div>
              <div class="sie-summary-item">
                <span class="sie-summary-label">{{ $t('dashboard.sieImport.transactions') }}</span>
                <span class="sie-summary-value">{{ sieImportParsed.transactions.length }}</span>
              </div>
              <div class="sie-summary-item">
                <span class="sie-summary-label">{{ $t('dashboard.sieImport.totalIncome') }}</span>
                <span class="sie-summary-value income">+{{ sieImportParsed.totalIncome.toLocaleString() }} kr</span>
              </div>
              <div class="sie-summary-item">
                <span class="sie-summary-label">{{ $t('dashboard.sieImport.totalExpenses') }}</span>
                <span class="sie-summary-value expense">-{{ sieImportParsed.totalExpenses.toLocaleString() }} kr</span>
              </div>
            </div>

            <h4>{{ $t('dashboard.sieImport.details') }}</h4>
            <div class="sie-preview-table-wrapper">
              <table class="sie-preview-table">
                <thead>
                  <tr>
                    <th>{{ $t('dashboard.sieImport.date') }}</th>
                    <th>{{ $t('dashboard.sieImport.description') }}</th>
                    <th>{{ $t('dashboard.sieImport.category') }}</th>
                    <th>{{ $t('dashboard.sieImport.amount') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(t, i) in sieImportParsed.transactions" :key="i">
                    <td>{{ t.date ? new Date(t.date).toLocaleDateString($i18n.locale === 'sv' ? 'sv-SE' : 'en-GB') : '—' }}</td>
                    <td>{{ t.description || '—' }}</td>
                    <td>{{ t.category || $t('dashboard.sieImport.noCategory') }}</td>
                    <td :class="t.amount >= 0 ? 'income' : 'expense'">
                      {{ t.amount >= 0 ? '+' : '' }}{{ t.amount.toLocaleString() }} kr
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button type="button" class="sie-replace-btn" @click="resetSieImport">{{ $t('dashboard.sieImport.replaceFile') }}</button>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="cancel-btn" @click="closeSieImportModal">{{ $t('dashboard.sieImport.cancel') }}</button>
          <button
            type="button"
            class="submit-btn"
            :disabled="!sieImportParsed || sieImporting || !canSubmitSieImport"
            @click="submitSieImport"
          >
            {{ sieImporting ? $t('dashboard.sieImport.importing') : $t('dashboard.sieImport.import') }}
          </button>
        </div>
      </div>
    </div>
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
      showMerchantGuide: false,
      showCertificateGuide: false,
      loading: true,
      saving: false,
      savingSwish: false,
      organizationId: null,
      organizationName: '',
      swishMerchantNumber: '',
      swishMode: 'TEST',
      orgNumber: '',
      originalOrgNumber: '',
      orgLogo: '',
      originalOrgLogo: '',
      savingOrg: false,
      swishPassphrase: '',
      downloadingSie: false,
      certificateFile: null,
      swishConfig: null,
      swishConfigLoaded: false,
      userOrganizations: [],
      currentUserRole: '',
      inviteCode: '',
      copied: false,
      // Alert/Confirm modal state
      showCustomAlert: false,
      showConfirmModal: false,
      confirmCallback: null,
      customAlertTitle: '',
      customAlertMessage: '',
      customAlertType: 'info',
      // Delete modal state
      showDeleteModal: false,
      deleteConfirmName: '',
      deleting: false,
      deleteCountdown: 5,
      deleteTimer: null,
      showSieImportModal: false,
      sieImportFile: null,
      sieImportParsing: false,
      sieImportParsed: null,
      sieImporting: false,
      sieImportDragging: false,
      sieImportAccountId: null,
      sieImportOrganizationId: null,
      sieImportAccounts: [],
      sieImportAccountsLoading: false
    }
  },
  computed: {
    /** Organizations the user may import bookkeeping into (OWNER or ADMIN). */
    sieImportOrgs() {
      return (this.userOrganizations || []).filter(
        (m) => m.role === 'OWNER' || m.role === 'ADMIN'
      )
    },
    canSieImportProceed() {
      return (
        !!this.sieImportOrganizationId &&
        this.sieImportAccounts.length > 0 &&
        !this.sieImportAccountsLoading
      )
    },
    canSubmitSieImport() {
      return (
        !!this.sieImportParsed &&
        !!this.sieImportOrganizationId &&
        !!this.sieImportAccountId &&
        this.sieImportAccounts.length > 0 &&
        !this.sieImportAccountsLoading
      )
    },
    hasPermission() {
      return this.currentUserRole === 'OWNER' || this.currentUserRole === 'ADMIN'
    },
    canSaveSwishConfig() {
      return this.swishMerchantNumber.trim() && 
             this.swishMode && 
             this.certificateFile && 
             this.swishPassphrase.trim()
    },
    orgDetailsChanged() {
      return this.orgNumber !== this.originalOrgNumber || this.orgLogo !== this.originalOrgLogo
    },
    canConfirmDelete() {
      return this.deleteConfirmName === this.organizationName && this.deleteCountdown === 0
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
            'x-org-id': String(this.organizationId)
          },
          body: JSON.stringify({ organizationId: this.organizationId })
        })
        
        if (response.ok) {
          const data = await response.json()
          this.organizationName = data.organization.name
          this.swishMerchantNumber = data.organization.swishMerchantNumber || ''
          this.orgNumber = data.organization.orgNumber || ''
          this.originalOrgNumber = data.organization.orgNumber || ''
          this.orgLogo = data.organization.logoUrl || ''
          this.originalOrgLogo = data.organization.logoUrl || ''
        }

        // Get invite code
        try {
          const inviteData = await getOrganizationInvite(this.organizationId)
          this.inviteCode = inviteData.code
        } catch (e) {
          console.error('Failed to get invite code:', e)
        }

        // Load Swish configuration status
        await this.loadSwishConfig()
        
        this.loading = false
      } catch (error) {
        console.error('Failed to load settings:', error)
        this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('settings.alerts.loadError'), 'error')
        this.loading = false
      }
    },
    async downloadSieFile() {
      try {
        this.downloadingSie = true
        
        const response = await fetch(`/api/finance?action=sie`, {
          method: 'GET',
          headers: {
            'x-org-id': String(this.organizationId)
          },
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error('Failed to download SIE file')
        }
        
        // Handle file download
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        
        // Extract filename from header
        const contentDisposition = response.headers.get('Content-Disposition')
        let filename = 'export.se'
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/)
          if (match && match[1]) {
            filename = match[1]
          }
        }
        
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
      } catch (error) {
        console.error('SIE export failed:', error)
        this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('settings.alerts.sieError'), 'error')
      } finally {
        this.downloadingSie = false
      }

    },

    syncSieImportAccountSelection() {
      const list = this.sieImportAccounts || []
      if (!list.length) {
        this.sieImportAccountId = null
        return
      }
      const ok = list.some((a) => a.id === this.sieImportAccountId)
      if (!this.sieImportAccountId || !ok) {
        this.sieImportAccountId = list[0].id
      }
    },
    async fetchSieImportAccounts(orgId) {
      if (!orgId) {
        this.sieImportAccounts = []
        this.sieImportAccountId = null
        return
      }
      this.sieImportAccountsLoading = true
      try {
        const accRes = await fetch('/api/finance?action=accounts', {
          method: 'GET',
          headers: { 'x-org-id': String(orgId) },
          credentials: 'include'
        })
        if (accRes.ok) {
          this.sieImportAccounts = await accRes.json()
          this.syncSieImportAccountSelection()
        } else {
          this.sieImportAccounts = []
          this.sieImportAccountId = null
        }
      } catch {
        this.sieImportAccounts = []
        this.sieImportAccountId = null
      } finally {
        this.sieImportAccountsLoading = false
      }
    },
    async onSieImportOrganizationChange() {
      this.sieImportParsed = null
      this.sieImportDragging = false
      if (this.$refs.sieFileInput) this.$refs.sieFileInput.value = ''
      await this.fetchSieImportAccounts(this.sieImportOrganizationId)
    },
    async openSieImportModal() {
      if (!this.sieImportOrgs.length) {
        this.showAlert(
          this.$t('dashboard.alerts.noPermissionTitle'),
          this.$t('dashboard.sieImport.noOrgsForImport'),
          'error'
        )
        return
      }
      const currentOk = this.sieImportOrgs.some((m) => m.organization.id === this.organizationId)
      this.sieImportOrganizationId = currentOk
        ? this.organizationId
        : this.sieImportOrgs[0].organization.id
      await this.fetchSieImportAccounts(this.sieImportOrganizationId)
      this.showSieImportModal = true
    },
    closeSieImportModal() {
      this.showSieImportModal = false
      this.resetSieImport()
      this.sieImportAccounts = []
      this.sieImportOrganizationId = null
      this.sieImportAccountId = null
    },
    resetSieImport() {
      this.sieImportFile = null
      this.sieImportParsed = null
      this.sieImportParsing = false
      this.sieImporting = false
      this.sieImportDragging = false
      if (this.$refs.sieFileInput) this.$refs.sieFileInput.value = ''
    },
    onSieUploadDragOver() {
      if (!this.canSieImportProceed) return
      this.sieImportDragging = true
    },
    openSieFilePicker() {
      if (!this.canSieImportProceed) return
      this.$refs.sieFileInput?.click()
    },
    handleSieFileDrop(e) {
      this.sieImportDragging = false
      if (!this.canSieImportProceed) return
      const file = e.dataTransfer?.files?.[0]
      if (file) this.parseSieFile(file)
    },
    handleSieFileSelect(e) {
      if (!this.canSieImportProceed) return
      const file = e.target.files?.[0]
      if (file) this.parseSieFile(file)
    },
    async parseSieFile(file) {
      if (!this.canSieImportProceed) {
        this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('dashboard.sieImport.noAccounts'), 'error')
        return
      }
      this.sieImportParsing = true
      this.sieImportFile = file
      try {
        const raw = await file.arrayBuffer()
        const bytes = new Uint8Array(raw)
        const text = this.decodeSieBytes(bytes)
        const parsed = this.parseSie4Text(text)

        if (!parsed.transactions.length) {
          this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('dashboard.sieImport.noTransactions'), 'error')
          this.sieImportParsing = false
          return
        }

        this.sieImportParsed = parsed
      } catch (err) {
        console.error('SIE parse error:', err)
        this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('dashboard.sieImport.parseError'), 'error')
      } finally {
        this.sieImportParsing = false
      }
    },
    decodeSieBytes(bytes) {
      const cp437Swedish = { 0x8F: 'Å', 0x8E: 'Ä', 0x99: 'Ö', 0x86: 'å', 0x84: 'ä', 0x94: 'ö' }
      let out = ''
      for (let i = 0; i < bytes.length; i++) {
        const b = bytes[i]
        out += cp437Swedish[b] || String.fromCharCode(b)
      }
      return out
    },
    parseSie4Text(text) {
      const reverseAccountMap = {
        3010: 'Medlemsavgift',
        3050: 'Tävlingsavgift',
        3040: 'Träningsavgift',
        3900: 'Sponsring',
        5010: 'Lokalhyra',
        4010: 'Utrustning',
        6990: 'Övrigt'
      }

      const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
      const transactions = []
      let voucherCount = 0

      let currentVer = null
      let inBlock = false

      for (const line of lines) {
        const trimmed = line.trim()

        if (trimmed.startsWith('#VER')) {
          const m = trimmed.match(/#VER\s+"?([^"\s]+)"?\s+(\d+)\s+(\d{8})\s+("([^"]*)")?/)
          if (m) {
            currentVer = {
              series: m[1],
              number: parseInt(m[2]),
              date: m[3],
              description: m[5] || ''
            }
            voucherCount++
          }
          continue
        }

        if (trimmed === '{') {
          inBlock = true
          continue
        }

        if (trimmed === '}') {
          if (inBlock && currentVer && currentVer._transLines) {
            const bankLine = currentVer._transLines.find(t => t.account === 1930)
            const contraLine = currentVer._transLines.find(t => t.account !== 1930)

            if (bankLine) {
              transactions.push({
                amount: bankLine.amount,
                description: currentVer.description || null,
                category: contraLine ? (reverseAccountMap[contraLine.account] || null) : null,
                date: this.sieDate(currentVer.date),
                voucherSeries: currentVer.series
              })
            }
          }
          inBlock = false
          currentVer = null
          continue
        }

        if (inBlock && trimmed.startsWith('#TRANS')) {
          const tm = trimmed.match(/#TRANS\s+(\d+)\s+\{[^}]*\}\s+(-?[\d.]+)/)
          if (tm && currentVer) {
            if (!currentVer._transLines) currentVer._transLines = []
            currentVer._transLines.push({
              account: parseInt(tm[1]),
              amount: parseFloat(tm[2])
            })
          }
        }
      }

      const totalIncome = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
      const totalExpenses = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)

      return { transactions, voucherCount, totalIncome, totalExpenses }
    },
    sieDate(yyyymmdd) {
      if (!yyyymmdd || yyyymmdd.length !== 8) return null
      return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`
    },
    async submitSieImport() {
      if (!this.sieImportParsed?.transactions?.length) return
      if (!this.canSubmitSieImport) {
        this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('dashboard.sieImport.error'), 'error')
        return
      }

      this.sieImporting = true
      try {
        const accountId = this.sieImportAccountId
        const response = await fetch('/api/finance?action=import-sie', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-org-id': String(this.sieImportOrganizationId)
          },
          credentials: 'include',
          body: JSON.stringify({
            accountId,
            transactions: this.sieImportParsed.transactions
          })
        })

        if (!response.ok) throw new Error('Import failed')

        const result = await response.json()
        this.closeSieImportModal()
        this.showAlert(
          '✓',
          this.$t('dashboard.sieImport.success', { count: result.imported }),
          'success'
        )
      } catch (err) {
        console.error('SIE import failed:', err)
        this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('dashboard.sieImport.error'), 'error')
      } finally {
        this.sieImporting = false
      }
    },

    async saveOrgDetails() {
      try {
        this.savingOrg = true
        
        const response = await fetch('/api/orgs?action=update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-org-id': String(this.organizationId)
          },
          body: JSON.stringify({
            orgNumber: this.orgNumber,
            logoUrl: this.orgLogo
          })
        })
        
        if (!response.ok) {
          throw new Error('Failed to update organization')
        }
        
        this.originalOrgNumber = this.orgNumber
        this.originalOrgLogo = this.orgLogo
        this.showAlert(this.$t('settings.alerts.settingsSaved'), '', 'success')
        
      } catch (error) {
        console.error('Failed to save org details:', error)
        this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('settings.alerts.saveError'), 'error')
      } finally {
        this.savingOrg = false
      }
    },
    async loadSwishConfig() {
      try {
        const response = await fetch('/api/swish?action=config', {
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
          this.showAlert(this.$t('dashboard.alerts.warningTitle'), this.$t('settings.alerts.fileType'), 'warning')
          event.target.value = ''
          return
        }
        
        // Validate file size (max 50KB)
        if (file.size > 50 * 1024) {
          this.showAlert(this.$t('dashboard.alerts.warningTitle'), this.$t('settings.alerts.fileSize'), 'warning')
          event.target.value = ''
          return
        }
        
        this.certificateFile = file
      }
    },
    async saveSwishConfig() {
      if (!this.hasPermission) {
        this.showAlert(this.$t('dashboard.alerts.noPermissionTitle'), this.$t('settings.alerts.noPermission'), 'error')
        return
      }

      if (!this.canSaveSwishConfig) {
        this.showAlert(this.$t('dashboard.alerts.warningTitle'), this.$t('settings.alerts.fillFields'), 'warning')
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
        
        const response = await fetch('/api/swish?action=config', {
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
        
        this.showAlert(this.$t('settings.alerts.swishSaved'), '', 'success')
        
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
        this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('settings.alerts.swishSaveError', { error: error.message }), 'error')
        this.savingSwish = false
      }
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
        this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('settings.alerts.copyError'), 'error')
      }
    },
    async onOrganizationChange() {
      await this.loadSettings()
    },
    goToLogin() {
      this.$router.push('/login')
    },
    showAlert(title, message, type = 'info') {
      this.customAlertTitle = title
      this.customAlertMessage = message
      this.customAlertType = type
      this.showCustomAlert = true
    },
    showConfirm(title, message, callback) {
      this.customAlertTitle = title
      this.customAlertMessage = message
      this.confirmCallback = callback
      this.showConfirmModal = true
    },
    handleConfirm() {
      this.showConfirmModal = false
      if (this.confirmCallback) {
        this.confirmCallback()
      }
    },
    confirmDeleteOrganization() {
      this.deleteConfirmName = ''
      this.deleting = false
      this.deleteCountdown = 5
      this.showDeleteModal = true
      if (this.deleteTimer) clearInterval(this.deleteTimer)
      this.deleteTimer = setInterval(() => {
        if (this.deleteCountdown > 0) {
          this.deleteCountdown--
        } else {
          clearInterval(this.deleteTimer)
        }
      }, 1000)
    },
    closeDeleteModal() {
      this.showDeleteModal = false
      this.deleteConfirmName = ''
      if (this.deleteTimer) clearInterval(this.deleteTimer)
    },
    async executeDeleteOrganization() {
      if (!this.canConfirmDelete) return
      try {
        this.deleting = true
        await deleteOrganization(this.organizationId)
        this.showDeleteModal = false
        this.showAlert(this.$t('settings.alerts.deleteSuccess'), '', 'success')
        setTimeout(() => this.$router.push('/login'), 2000)
      } catch (error) {
        console.error('Failed to delete organization:', error)
        this.deleting = false
        this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('settings.alerts.deleteError'), 'error')
      }
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
  color: var(--text-secondary);
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
  color: var(--text);
}

.settings-header h1 {
  font-size: 2rem;
  color: var(--text);
  margin-bottom: 1rem;
}

.org-selector {
  padding: 0.5rem 1rem;
  border: 2px solid var(--border);
  border-radius: 6px;
  font-size: 0.95rem;
  font-family: inherit;
  color: var(--text);
  background-color: var(--input-bg);
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
  color: var(--text-secondary);
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.settings-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.settings-section h2 {
  font-size: 1.5rem;
  color: var(--text);
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--border);
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
  color: var(--text);
  margin-bottom: 0.5rem;
}

.setting-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border);
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  background: var(--input-bg);
  color: var(--text);
  transition: border-color 0.3s;
}

.setting-input:focus {
  outline: none;
  border-color: var(--primary-light);
}

.setting-input:disabled {
  background-color: var(--surface-alt);
  cursor: not-allowed;
  opacity: 0.85;
}

.setting-hint {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.info-box {
  background: var(--surface-alt);
  border-left: 4px solid var(--primary-light);
  padding: 1.5rem;
  border-radius: 6px;
  margin: 1.5rem 0;
}

.info-box h3 {
  font-size: 1.125rem;
  color: var(--text);
  margin-bottom: 1rem;
}

.info-box ol {
  margin-left: 1.5rem;
  margin-bottom: 1rem;
}

.info-box li {
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.info-box .note {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
  font-size: 0.875rem;
  color: var(--text-secondary);
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
  color: var(--text);
  background: var(--input-bg);
  padding: 0.75rem 1rem;
  border-radius: 4px;
  border: 1px solid var(--border);
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
  border: 2px solid rgba(220, 38, 38, 0.45);
  margin-top: 3rem;
}

.danger-zone h2 {
  color: #ef4444;
  border-bottom-color: rgba(220, 38, 38, 0.35);
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
  background: var(--surface);
  border: 1px solid var(--border);
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
  color: var(--text);
  margin-bottom: 1rem;
}

.auth-modal-body p {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

@media (max-width: 1024px) {
  .settings-header {
    margin-top: 2.5rem;
  }
}

@media (max-width: 768px) {
  .settings-page {
    padding: 0.75rem;
  }

  .settings-section {
    padding: 1.25rem;
  }

  .settings-header h1 {
    font-size: 1.5rem;
  }

  .settings-section h2 {
    font-size: 1.2rem;
  }

  .setting-item label {
    font-size: 0.9rem;
  }

  .invite-code-display {
    flex-direction: column;
  }

  .copy-btn {
    width: 100%;
  }

  .btn {
    padding: 0.65rem 1.25rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .settings-section {
    padding: 1rem;
  }

  .org-selector {
    max-width: 100%;
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
  background: var(--surface-alt);
  border-color: var(--primary-medium);
}

.file-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  width: 100%;
}

.label-row label {
  margin-bottom: 0;
}

.help-link {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.help-link:hover {
  color: var(--primary-light);
}

.help-modal-overlay {
  z-index: 2000;
}

.help-modal-content {
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 0;
  border-radius: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
}

.help-modal-header {
  padding: 1.5rem 2rem 1rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.help-modal-header h2 {
  margin: 0;
  color: var(--text);
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
}

.help-modal-body {
  padding: 2rem;
  text-align: left;
}

.help-modal-body h3 {
  font-size: 1.1rem;
  margin: 1.5rem 0 0.5rem;
  color: var(--text);
}

.help-modal-body p {
  margin-bottom: 1rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.help-modal-body ul, .help-modal-body ol {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.help-modal-body li {
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
}

.help-modal-footer {
  padding: 1rem 2rem;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
}

.help-callout {
  background: var(--surface-alt);
  border-left: 4px solid var(--primary-light);
  padding: 1rem;
  margin-bottom: 2rem;
  border-radius: 6px;
}

.help-callout-title {
  margin-top: 0;
  color: var(--primary-light);
}

.help-textarea {
  width: 100%;
  height: 100px;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  resize: none;
  font-size: 0.9em;
  font-family: inherit;
  background: var(--input-bg);
  color: var(--text);
}

.help-section-title {
  color: var(--text-secondary);
}

.help-numbered-list {
  padding-left: 1.5rem;
}

.help-details {
  margin-top: 2rem;
  cursor: pointer;
}

.help-details-summary {
  color: var(--text-secondary);
  font-weight: 500;
}

.help-details-inner {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.help-code-block {
  display: block;
  background: var(--surface-alt);
  color: var(--text);
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  margin-bottom: 1rem;
  word-break: break-all;
  font-size: 0.85em;
  border: 1px solid var(--border);
}

.file-selected {
  margin-top: 0.5rem;
  color: var(--primary-dark);
  font-size: 0.875rem;
  font-weight: 600;
}

/* Alert / Confirm / Delete Modal Styles */
.alert-modal-overlay {
  z-index: 2000;
}

.alert-modal-content {
  max-width: 420px;
  text-align: center;
  padding: 0;
  border-radius: 12px;
  overflow: hidden;
}

.delete-modal-content {
  max-width: 480px;
}

.alert-header-centered {
  padding: 2rem 2rem 1rem;
}

.alert-header-centered h2 {
  color: var(--text);
}

.delete-confirm-hint {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.delete-confirm-box {
  text-align: left;
  background: rgba(220, 38, 38, 0.12);
  border: 1px solid rgba(248, 113, 113, 0.45);
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
}

.delete-confirm-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 0.5rem;
}

.delete-confirm-input {
  border-color: rgba(248, 113, 113, 0.5) !important;
}

.alert-icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
}

.alert-icon-circle.success {
  background-color: #d1fae5;
  color: #059669;
}

.alert-icon-circle.error {
  background-color: #fee2e2;
  color: #dc2626;
}

.alert-icon-circle.info {
  background-color: #e0f2fe;
  color: #0284c7;
}

.alert-icon-circle.warning {
  background-color: #fef3c7;
  color: #d97706;
}

.alert-body-centered {
  padding: 0 2rem 1rem;
}

.alert-body-centered p {
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 1rem;
}

.modal-footer {
  padding: 1.5rem 2rem 2rem;
  display: flex;
  justify-content: flex-end;
  border-top: none;
}

.modal-footer.centered {
  justify-content: center;
  gap: 0.75rem;
}

.btn-lg {
  padding: 0.75rem 2rem;
  font-size: 1rem;
}

.cancel-btn {
  background: var(--surface-alt);
  color: var(--text);
  border: 1px solid var(--border);
  padding: 0.6rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.2s;
}

.cancel-btn:hover {
  background: var(--background);
}

/* SIE4 settings card & import modal */
.sie-settings-card {
  padding: 1.25rem 1.5rem;
  background: var(--surface);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.sie-settings-subtitle {
  margin: 0 0 0.5rem;
  font-size: 1.05rem;
  color: var(--text);
}

.sie-settings-desc {
  margin-bottom: 1rem !important;
}

.sie-actions-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.sie-action-btn {
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 480px) {
  .sie-actions-row {
    grid-template-columns: 1fr;
  }
}

.sie-import-modal {
  max-width: 680px;
  width: 95%;
}

.sie-import-modal .modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sie-import-modal .modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text);
}

.sie-import-modal .modal-body {
  padding: 1.25rem 1.5rem;
  max-height: min(70vh, 520px);
  overflow-y: auto;
}

.sie-import-org-row,
.sie-import-account-row {
  margin-bottom: 1.1rem;
}

.sie-import-org-row label,
.sie-import-account-row label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.4rem;
  color: var(--text);
  font-size: 0.95rem;
}

.sie-import-select {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.sie-import-account-hint {
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin: 0.45rem 0 0;
  line-height: 1.4;
}

.sie-import-warning {
  color: #dc2626;
  font-size: 0.88rem;
  margin: 0.5rem 0 0;
}

.sie-upload-area.sie-upload-disabled {
  opacity: 0.55;
  cursor: not-allowed;
  pointer-events: none;
}

.sie-import-modal .modal-footer {
  padding: 1rem 1.5rem 1.25rem;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.sie-upload-area {
  border: 2px dashed var(--border);
  border-radius: 12px;
  padding: 2.5rem 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  background: var(--background);
}

.sie-upload-area:hover,
.sie-upload-area.drag-active {
  border-color: var(--primary-light);
}

.sie-upload-section .upload-icon {
  font-size: 2.25rem;
  display: block;
  margin-bottom: 0.5rem;
}

.sie-upload-section p {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin: 0;
}

.sie-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.65rem;
  margin-bottom: 1rem;
}

.sie-summary-item {
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.75rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.sie-summary-label {
  font-size: 0.72rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.sie-summary-value {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text);
}

.sie-summary-value.income {
  color: #22c55e;
}

.sie-summary-value.expense {
  color: #ef4444;
}

.sie-preview h4 {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
  color: var(--text);
}

.sie-preview-table-wrapper {
  max-height: 260px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.sie-preview-table-wrapper::-webkit-scrollbar {
  display: none;
}

.sie-preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.sie-preview-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

.sie-preview-table th {
  background: var(--primary-dark);
  color: var(--text-light);
  padding: 0.5rem 0.65rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.72rem;
  text-transform: uppercase;
}

.sie-preview-table td {
  padding: 0.45rem 0.65rem;
  border-bottom: 1px solid var(--border);
  color: var(--text);
}

.sie-preview-table .income {
  color: #22c55e;
  font-weight: 600;
}

.sie-preview-table .expense {
  color: #ef4444;
  font-weight: 600;
}

.sie-replace-btn {
  margin-top: 0.65rem;
  background: none;
  border: none;
  color: var(--primary-light);
  cursor: pointer;
  font-size: 0.85rem;
  text-decoration: underline;
  padding: 0;
}

.submit-btn {
  background: var(--primary-light);
  color: var(--text-light);
  border: none;
  padding: 0.6rem 1.35rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
}

.submit-btn:hover:not(:disabled) {
  filter: brightness(1.05);
}

.submit-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
