<template>
  <div class="profile-page">
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>{{ $t('profile.loading') }}</p>
    </div>

    <div v-else-if="showAuthModal" class="modal-overlay auth-modal-overlay" @click.self="goToLogin">
      <div class="modal-content auth-modal-content">
        <div class="auth-modal-body">
          <h2>{{ $t('profile.authRequired') }}</h2>
          <button class="btn btn-primary btn-full" @click="goToLogin">{{ $t('profile.goToLogin') }}</button>
        </div>
      </div>
    </div>

    <section v-else class="profile-container">
      <!-- Header -->
      <div class="profile-header">
        <button class="back-btn" @click="$router.push('/dashboard')">← {{ $t('profile.back') }}</button>
        <h1>{{ $t('profile.title') }}</h1>
      </div>

      <div class="profile-content">
        <!-- Avatar card -->
        <div class="profile-card avatar-card">
          <div class="avatar-section">
            <div class="avatar-wrapper" @click="triggerAvatarUpload">
              <img v-if="form.avatarUrl" :src="form.avatarUrl" alt="Avatar" class="avatar-img" />
              <div v-else class="avatar-placeholder">
                <span class="avatar-initial">{{ (form.name || 'U').charAt(0).toUpperCase() }}</span>
              </div>
              <div class="avatar-overlay">
                <span>{{ $t('profile.changePhoto') }}</span>
              </div>
            </div>
            <input
              ref="avatarInput"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style="display:none"
              @change="onAvatarSelected"
            />
            <div class="avatar-actions">
              <button class="avatar-upload-btn" @click="triggerAvatarUpload">{{ $t('profile.uploadPhoto') }}</button>
              <button v-if="form.avatarUrl" class="avatar-remove-btn" @click="removeAvatar">{{ $t('profile.removePhoto') }}</button>
            </div>
            <p class="avatar-hint">{{ $t('profile.photoHint') }}</p>
          </div>
        </div>

        <!-- Info card -->
        <div class="profile-card info-card">
          <h2 class="card-title">{{ $t('profile.personalInfo') }}</h2>

          <div class="form-group">
            <label>{{ $t('profile.name') }}</label>
            <input type="text" v-model="form.name" :placeholder="$t('profile.namePlaceholder')" />
          </div>

          <div class="form-group">
            <label>{{ $t('profile.email') }}</label>
            <input type="email" :value="currentUser.email" disabled class="input-disabled" />
            <small class="field-hint">{{ $t('profile.emailHint') }}</small>
          </div>

          <div class="form-group">
            <label>{{ $t('profile.phone') }}</label>
            <input type="tel" v-model="form.phone" :placeholder="$t('profile.phonePlaceholder')" />
          </div>

          <div class="form-group">
            <label>{{ $t('profile.memberSince') }}</label>
            <input type="text" :value="formatDate(currentUser.createdAt)" disabled class="input-disabled" />
          </div>

          <div class="card-footer">
            <button class="save-btn" @click="saveProfile" :disabled="saving">
              {{ saving ? $t('profile.saving') : $t('profile.save') }}
            </button>
          </div>
        </div>

        <!-- Password card -->
        <div class="profile-card password-card">
          <h2 class="card-title">{{ $t('profile.changePassword') }}</h2>
          <p class="card-desc">{{ $t('profile.passwordDesc') }}</p>

          <div class="form-group">
            <label>{{ $t('profile.currentPassword') }}</label>
            <input type="password" v-model="passwordForm.current" :placeholder="$t('profile.passwordPlaceholder')" />
          </div>
          <div class="form-group">
            <label>{{ $t('profile.newPassword') }}</label>
            <input type="password" v-model="passwordForm.newPass" :placeholder="$t('profile.newPasswordPlaceholder')" />
          </div>
          <div class="form-group">
            <label>{{ $t('profile.confirmPassword') }}</label>
            <input type="password" v-model="passwordForm.confirm" :placeholder="$t('profile.confirmPasswordPlaceholder')" />
          </div>

          <div class="card-footer">
            <button class="save-btn" @click="changePassword" :disabled="changingPassword">
              {{ changingPassword ? $t('profile.saving') : $t('profile.changePasswordBtn') }}
            </button>
          </div>
        </div>
        <!-- Theme card -->
        <div class="profile-card theme-card">
          <h2 class="card-title">{{ $t('profile.theme') }}</h2>
          <p class="card-desc">{{ $t('profile.themeDesc') }}</p>

          <div class="theme-options">
            <button
              class="theme-option"
              :class="{ active: selectedTheme === 'light' }"
              @click="selectTheme('light')"
            >
              <div class="theme-preview theme-preview-light">
                <div class="tp-sidebar"></div>
                <div class="tp-body">
                  <div class="tp-card"></div>
                  <div class="tp-card"></div>
                </div>
              </div>
              <span class="theme-label">{{ $t('profile.themeLight') }}</span>
              <span class="theme-desc">{{ $t('profile.themeLightDesc') }}</span>
            </button>

            <button
              class="theme-option"
              :class="{ active: selectedTheme === 'dark' }"
              @click="selectTheme('dark')"
            >
              <div class="theme-preview theme-preview-dark">
                <div class="tp-sidebar"></div>
                <div class="tp-body">
                  <div class="tp-card"></div>
                  <div class="tp-card"></div>
                </div>
              </div>
              <span class="theme-label">{{ $t('profile.themeDark') }}</span>
              <span class="theme-desc">{{ $t('profile.themeDarkDesc') }}</span>
            </button>

            <button
              class="theme-option"
              :class="{ active: selectedTheme === 'midnight' }"
              @click="selectTheme('midnight')"
            >
              <div class="theme-preview theme-preview-midnight">
                <div class="tp-sidebar"></div>
                <div class="tp-body">
                  <div class="tp-card"></div>
                  <div class="tp-card"></div>
                </div>
              </div>
              <span class="theme-label">{{ $t('profile.themeMidnight') }}</span>
              <span class="theme-desc">{{ $t('profile.themeMidnightDesc') }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Toast notification -->
      <transition name="toast">
        <div v-if="toast.show" class="toast" :class="toast.type">{{ toast.message }}</div>
      </transition>
    </section>
  </div>
</template>

<script>
import { getCurrentUser, updateProfile } from '../lib/auth'

export default {
  name: 'ProfileSettings',
  data() {
    return {
      loading: true,
      showAuthModal: false,
      saving: false,
      changingPassword: false,
      currentUser: null,
      form: {
        name: '',
        phone: '',
        avatarUrl: null
      },
      passwordForm: {
        current: '',
        newPass: '',
        confirm: ''
      },
      selectedTheme: 'light',
      toast: {
        show: false,
        message: '',
        type: 'success'
      }
    }
  },
  async mounted() {
    const user = await getCurrentUser()
    if (!user) {
      this.showAuthModal = true
      this.loading = false
      return
    }
    this.currentUser = user
    this.form.name = user.name || ''
    this.form.phone = user.phone || ''
    this.form.avatarUrl = user.avatarUrl || null
    this.selectedTheme = user.theme || 'light'
    this.loading = false
  },
  methods: {
    goToLogin() {
      this.$router.push('/login')
    },
    formatDate(dateStr) {
      if (!dateStr) return ''
      return new Date(dateStr).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })
    },
    triggerAvatarUpload() {
      this.$refs.avatarInput.click()
    },
    onAvatarSelected(event) {
      const file = event.target.files?.[0]
      if (!file) return

      if (file.size > 5 * 1024 * 1024) {
        this.showToast(this.$t('profile.imageTooLarge'), 'error')
        return
      }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      img.onload = () => {
        const size = 256
        canvas.width = size
        canvas.height = size
        const scale = Math.max(size / img.width, size / img.height)
        const w = img.width * scale
        const h = img.height * scale
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
        this.form.avatarUrl = canvas.toDataURL('image/jpeg', 0.85)
      }
      img.src = URL.createObjectURL(file)
      event.target.value = ''
    },
    removeAvatar() {
      this.form.avatarUrl = null
    },
    async saveProfile() {
      if (!this.form.name.trim()) {
        this.showToast(this.$t('profile.nameRequired'), 'error')
        return
      }
      try {
        this.saving = true
        const updated = await updateProfile({
          name: this.form.name.trim(),
          phone: this.form.phone.trim() || null,
          avatarUrl: this.form.avatarUrl
        })
        this.currentUser = updated
        this.showToast(this.$t('profile.saveSuccess'), 'success')
      } catch (err) {
        this.showToast(err.message || this.$t('profile.saveError'), 'error')
      } finally {
        this.saving = false
      }
    },
    async changePassword() {
      if (!this.passwordForm.current || !this.passwordForm.newPass) {
        this.showToast(this.$t('profile.fillAllFields'), 'error')
        return
      }
      if (this.passwordForm.newPass.length < 8) {
        this.showToast(this.$t('profile.passwordTooShort'), 'error')
        return
      }
      if (this.passwordForm.newPass !== this.passwordForm.confirm) {
        this.showToast(this.$t('profile.passwordMismatch'), 'error')
        return
      }
      try {
        this.changingPassword = true
        const res = await fetch('/api/auth?action=change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            currentPassword: this.passwordForm.current,
            newPassword: this.passwordForm.newPass
          })
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Failed')
        this.passwordForm = { current: '', newPass: '', confirm: '' }
        this.showToast(this.$t('profile.passwordChanged'), 'success')
      } catch (err) {
        this.showToast(err.message || this.$t('profile.passwordError'), 'error')
      } finally {
        this.changingPassword = false
      }
    },
    async selectTheme(theme) {
      this.selectedTheme = theme
      document.documentElement.setAttribute('data-theme', theme === 'light' ? '' : theme)
      localStorage.setItem('techship-theme', theme)
      try {
        await updateProfile({ theme })
        this.showToast(this.$t('profile.themeSaved'), 'success')
      } catch {
        // theme is applied locally even if save fails
      }
    },
    showToast(message, type = 'success') {
      this.toast = { show: true, message, type }
      setTimeout(() => { this.toast.show = false }, 3000)
    }
  }
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: var(--background);
  font-family: inherit;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1rem;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--primary-light);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.profile-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.back-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.15s;
}

.back-btn:hover {
  background: var(--surface);
  color: var(--text);
}

.profile-header h1 {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.profile-content {
  display: grid;
  grid-template-columns: 280px 1fr;
  grid-template-rows: auto auto;
  gap: 1.5rem;
}

.avatar-card {
  grid-row: 1 / 3;
}

.profile-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.75rem;
}

.card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 1.25rem;
}

.card-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: -0.75rem 0 1.25rem;
}

/* Avatar */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

.avatar-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-initial {
  font-size: 2.5rem;
  font-weight: 700;
  color: #fff;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.avatar-upload-btn {
  padding: 0.6rem 1rem;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.avatar-upload-btn:hover { opacity: 0.88; }

.avatar-remove-btn {
  padding: 0.6rem 1rem;
  background: none;
  color: #ef4444;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.avatar-remove-btn:hover { background: #fef2f2; }

.avatar-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Form */
.form-group {
  margin-bottom: 1.1rem;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.4rem;
}

.form-group input {
  width: 100%;
  padding: 0.65rem 0.875rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.95rem;
  background: var(--input-bg);
  color: var(--text);
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-light);
}

.input-disabled {
  background: var(--background) !important;
  color: var(--text-secondary) !important;
  cursor: not-allowed;
}

.field-hint {
  display: block;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.3rem;
}

.card-footer {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-light);
}

.save-btn {
  padding: 0.7rem 1.75rem;
  background: var(--btn-dark);
  color: var(--btn-dark-text);
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.save-btn:hover:not(:disabled) { opacity: 0.85; }
.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Theme picker */
.theme-card {
  grid-column: 1 / -1;
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.theme-option:hover {
  border-color: var(--primary-light);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.theme-option.active {
  border-color: var(--primary-light);
  background: var(--surface-alt);
  box-shadow: 0 0 0 3px rgba(69, 104, 130, 0.18);
}

.theme-preview {
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: 8px;
  display: flex;
  overflow: hidden;
  border: 1px solid var(--border);
}

.tp-sidebar {
  width: 28%;
  min-height: 100%;
}

.tp-body {
  flex: 1;
  padding: 8%;
  display: flex;
  flex-direction: column;
  gap: 6%;
}

.tp-card {
  flex: 1;
  border-radius: 4px;
}

.theme-preview-light .tp-sidebar { background: #1B3C53; }
.theme-preview-light .tp-body { background: #E3E3E3; }
.theme-preview-light .tp-card { background: #ffffff; }

.theme-preview-dark .tp-sidebar { background: #0d1b2a; }
.theme-preview-dark .tp-body { background: #111827; }
.theme-preview-dark .tp-card { background: #1e293b; }

.theme-preview-midnight .tp-sidebar { background: #152238; }
.theme-preview-midnight .tp-body { background: #0f1a2e; }
.theme-preview-midnight .tp-card { background: #182842; }

.theme-label {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text);
}

.theme-desc {
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.3;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.8rem 1.75rem;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  z-index: 9999;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.toast.success { background: var(--btn-dark); color: var(--btn-dark-text); }
.toast.error   { background: #ef4444; color: #fff; }

.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 1rem); }

/* Responsive */
@media (max-width: 700px) {
  .profile-content {
    grid-template-columns: 1fr;
  }
  .avatar-card {
    grid-row: auto;
  }
  .theme-options {
    grid-template-columns: 1fr;
  }
}

/* Auth modal reuse */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--surface);
  border-radius: 16px;
  padding: 2.5rem;
  max-width: 420px;
  width: 90%;
  text-align: center;
}

.auth-modal-body h2 { margin: 0 0 0.75rem; font-size: 1.4rem; }
.auth-modal-body p  { margin: 0 0 1.5rem; color: var(--text-secondary); }

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
}

.btn-primary { background: #4f46e5; color: #fff; }
.btn-full    { width: 100%; }
</style>
