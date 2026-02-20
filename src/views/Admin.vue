<template>
  <div class="admin-page">
    <div class="admin-container">
      <h1 class="admin-title">🔒 Admin — Beta Codes</h1>

      <!-- Auth gate -->
      <div v-if="!authenticated" class="auth-card">
        <p class="auth-desc">Enter your admin secret to continue.</p>
        <form @submit.prevent="authenticate" class="auth-form">
          <input
            v-model="secretInput"
            type="password"
            placeholder="Admin secret"
            class="admin-input"
            autofocus
          />
          <button type="submit" class="btn-admin btn-admin-primary" :disabled="!secretInput">Unlock</button>
        </form>
        <p v-if="authError" class="error-msg">{{ authError }}</p>
      </div>

      <!-- Main panel -->
      <div v-else class="main-panel">
        <!-- Generate section -->
        <div class="card">
          <h2>Generate New Codes</h2>
          <div class="generate-row">
            <div class="gen-field">
              <label>Count</label>
              <input v-model.number="genCount" type="number" min="1" max="50" class="admin-input small" />
            </div>
            <div class="gen-field grow">
              <label>Note (optional)</label>
              <input v-model="genNote" type="text" placeholder="e.g. Club name or organiser" class="admin-input" />
            </div>
            <button class="btn-admin btn-admin-primary" @click="generateCodes" :disabled="generating">
              {{ generating ? 'Generating…' : 'Generate' }}
            </button>
          </div>
          <!-- Newly generated codes highlight -->
          <div v-if="newCodes.length" class="new-codes-box">
            <p class="new-codes-title">✅ Generated {{ newCodes.length }} code(s) — copy and share these:</p>
            <div v-for="c in newCodes" :key="c.id" class="new-code-row">
              <code class="code-chip">{{ c.code }}</code>
              <button class="copy-btn" @click="copyCode(c.code)">Copy</button>
              <span v-if="c.note" class="note-tag">{{ c.note }}</span>
            </div>
          </div>
        </div>

        <!-- Codes table -->
        <div class="card">
          <div class="table-header-row">
            <h2>All Codes ({{ codes.length }})</h2>
            <div class="filter-row">
              <button :class="['filter-btn', filter === 'all' && 'active']" @click="filter = 'all'">All</button>
              <button :class="['filter-btn', filter === 'unused' && 'active']" @click="filter = 'unused'">Unused</button>
              <button :class="['filter-btn', filter === 'used' && 'active']" @click="filter = 'used'">Used</button>
            </div>
            <button class="btn-admin btn-admin-ghost" @click="loadCodes" :disabled="loadingCodes">↻ Refresh</button>
          </div>

          <div v-if="loadingCodes" class="loading-msg">Loading…</div>
          <div v-else-if="filteredCodes.length === 0" class="empty-msg">No codes found.</div>
          <table v-else class="codes-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Note</th>
                <th>Status</th>
                <th>Used by</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in filteredCodes" :key="c.id" :class="c.usedAt ? 'row-used' : 'row-unused'">
                <td><code class="code-chip">{{ c.code }}</code></td>
                <td class="note-cell">{{ c.note || '–' }}</td>
                <td>
                  <span :class="['status-badge', c.usedAt ? 'used' : 'unused']">
                    {{ c.usedAt ? 'Used' : 'Available' }}
                  </span>
                </td>
                <td class="email-cell">{{ c.usedByEmail || '–' }}</td>
                <td class="date-cell">{{ formatDate(c.createdAt) }}</td>
                <td>
                  <button class="delete-btn" @click="confirmDelete(c)" title="Delete">✕</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Delete confirm modal -->
      <div v-if="codeToDelete" class="modal-overlay" @click.self="codeToDelete = null">
        <div class="modal-box">
          <h3>Delete code?</h3>
          <p>Are you sure you want to delete <code class="code-chip">{{ codeToDelete.code }}</code>?
            <span v-if="codeToDelete.usedAt" style="color:#dc2626;"> This code has been used!</span>
          </p>
          <div class="modal-actions">
            <button class="btn-admin btn-admin-ghost" @click="codeToDelete = null">Cancel</button>
            <button class="btn-admin btn-admin-danger" @click="deleteCode" :disabled="deleting">
              {{ deleting ? 'Deleting…' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminView',
  data() {
    return {
      secretInput: '',
      secret: '',
      authenticated: false,
      authError: '',
      codes: [],
      loadingCodes: false,
      genCount: 1,
      genNote: '',
      generating: false,
      newCodes: [],
      filter: 'all',
      codeToDelete: null,
      deleting: false
    }
  },
  computed: {
    filteredCodes() {
      if (this.filter === 'unused') return this.codes.filter(c => !c.usedAt)
      if (this.filter === 'used') return this.codes.filter(c => c.usedAt)
      return this.codes
    }
  },
  methods: {
    async authenticate() {
      this.authError = ''
      try {
        const res = await fetch('/api/admin?action=codes', {
          headers: { 'x-admin-secret': this.secretInput }
        })
        if (res.status === 401) {
          this.authError = 'Incorrect secret.'
          return
        }
        if (!res.ok) throw new Error(await res.text())
        this.codes = await res.json()
        this.secret = this.secretInput
        this.secretInput = ''
        this.authenticated = true
      } catch (e) {
        this.authError = e.message || 'Authentication failed.'
      }
    },

    async loadCodes() {
      this.loadingCodes = true
      try {
        const res = await fetch('/api/admin?action=codes', {
          headers: { 'x-admin-secret': this.secret }
        })
        this.codes = await res.json()
      } finally {
        this.loadingCodes = false
      }
    },

    async generateCodes() {
      this.generating = true
      this.newCodes = []
      try {
        const res = await fetch('/api/admin?action=generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-secret': this.secret
          },
          body: JSON.stringify({ count: this.genCount, note: this.genNote || undefined })
        })
        const created = await res.json()
        this.newCodes = created
        this.genNote = ''
        await this.loadCodes()
      } finally {
        this.generating = false
      }
    },

    confirmDelete(code) {
      this.codeToDelete = code
    },

    async deleteCode() {
      this.deleting = true
      try {
        await fetch(`/api/admin?action=delete&id=${this.codeToDelete.id}`, {
          method: 'DELETE',
          headers: { 'x-admin-secret': this.secret }
        })
        this.codeToDelete = null
        await this.loadCodes()
      } finally {
        this.deleting = false
      }
    },

    copyCode(code) {
      navigator.clipboard.writeText(code)
    },

    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString('sv-SE', {
        year: 'numeric', month: '2-digit', day: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 2rem 1rem;
}

.admin-container {
  max-width: 900px;
  margin: 0 auto;
}

.admin-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 2rem;
}

/* Auth gate */
.auth-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  max-width: 400px;
}

.auth-desc {
  color: #64748b;
  margin-bottom: 1rem;
}

.auth-form {
  display: flex;
  gap: 0.75rem;
}

/* Inputs */
.admin-input {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.admin-input:focus { border-color: #6366f1; }
.admin-input.small { width: 70px; }

/* Buttons */
.btn-admin {
  padding: 0.55rem 1.25rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  white-space: nowrap;
  transition: background 0.2s;
}

.btn-admin:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-admin-primary { background: #6366f1; color: white; }
.btn-admin-primary:hover:not(:disabled) { background: #4f46e5; }

.btn-admin-ghost { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
.btn-admin-ghost:hover:not(:disabled) { background: #e2e8f0; }

.btn-admin-danger { background: #dc2626; color: white; }
.btn-admin-danger:hover:not(:disabled) { background: #b91c1c; }

/* Cards */
.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 1.5rem;
}

.card h2 { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0 0 1.25rem; }

/* Generate row */
.generate-row {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.gen-field { display: flex; flex-direction: column; gap: 0.3rem; }
.gen-field label { font-size: 0.8rem; font-weight: 600; color: #64748b; }
.gen-field.grow { flex: 1; min-width: 160px; }

/* New codes box */
.new-codes-box {
  margin-top: 1.25rem;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 8px;
  padding: 1rem;
}

.new-codes-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #166534;
  margin-bottom: 0.75rem;
}

.new-code-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}

.code-chip {
  font-family: monospace;
  font-size: 0.9rem;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.05em;
  border: 1px solid #e2e8f0;
}

.copy-btn {
  font-size: 0.75rem;
  padding: 2px 8px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.copy-btn:hover { background: #4f46e5; }

.note-tag {
  font-size: 0.75rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

/* Table */
.table-header-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.table-header-row h2 { margin: 0; flex: 1; }

.filter-row { display: flex; gap: 0.25rem; }

.filter-btn {
  padding: 0.3rem 0.75rem;
  border: 1.5px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  color: #64748b;
  transition: all 0.15s;
}

.filter-btn.active { background: #6366f1; color: white; border-color: #6366f1; }

.codes-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.codes-table th {
  text-align: left;
  padding: 0.6rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  border-bottom: 1.5px solid #f1f5f9;
}

.codes-table td {
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid #f8fafc;
  vertical-align: middle;
}

.row-used td { opacity: 0.6; }

.status-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 100px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.status-badge.used { background: #fee2e2; color: #991b1b; }
.status-badge.unused { background: #dcfce7; color: #166534; }

.note-cell, .email-cell, .date-cell { color: #64748b; font-size: 0.82rem; }

.delete-btn {
  background: none;
  border: none;
  color: #cbd5e1;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  transition: all 0.15s;
}

.delete-btn:hover { background: #fee2e2; color: #dc2626; }

.loading-msg, .empty-msg { color: #94a3b8; padding: 1rem 0; font-size: 0.9rem; }

.error-msg { color: #dc2626; font-size: 0.875rem; margin-top: 0.5rem; }

/* Delete modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-box {
  background: white;
  border-radius: 12px;
  padding: 1.75rem;
  max-width: 420px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
}

.modal-box h3 { margin: 0 0 0.75rem; font-size: 1.1rem; color: #1e293b; }
.modal-box p { color: #475569; margin-bottom: 1.25rem; line-height: 1.5; }

.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }
</style>
