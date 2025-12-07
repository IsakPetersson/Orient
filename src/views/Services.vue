<template>
  <div class="dashboard-page">
    <section class="dashboard-compact">
      <div class="container-full">
        <!-- Header -->
        <div class="header-bar">
          <div class="welcome-text">
            <h1>Dashboard</h1>
            <p>{{ organizationName }}</p>
          </div>
          <div class="header-actions">
            <button class="quick-action-card header-btn" @click="handleViewFiles">
              <img src="../assets/images/folder-icon.png" alt="Folder" class="action-icon-img" />
              <span class="action-text">Lagrade filer</span>
            </button>
            <button class="quick-action-card header-btn" @click="handleViewMembers">
              <img src="../assets/images/members-icon.png" alt="Members" class="action-icon-img" />
              <span class="action-text">Medlemmar</span>
            </button>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="main-grid">
          <!-- Top Left - Quick Actions -->
          <div class="left-column">
            <div class="panel">
              <div class="panel-header">
                <h3>Snabbknappar</h3>
              </div>
              <div class="quick-actions-grid" style="padding-top: 10px;">
                <button class="quick-action-card" @click="handleAction('upload-receipt')">
                  <img src="../assets/images/arrow-icon.png" alt="Upload" class="action-icon-img arrow-up" />
                  <span class="action-text">Ladda upp Kvitto</span>
                </button>
                <button class="quick-action-card" @click="handleAction('start-accounting')">
                  <span class="action-icon">▶</span>
                  <span class="action-text">Starta Bokföring</span>
                </button>
                <button class="quick-action-card" @click="handleAction('download-accounting')">
                  <img src="../assets/images/arrow-icon.png" alt="Download" class="action-icon-img" />
                  <span class="action-text">Ladda ner Bokföring</span>
                </button>
                <button class="quick-action-card" @click="handleAction('swish-payment')">
                  <span class="action-icon">$</span>
                  <span class="action-text">Swish Betalning</span>
                </button>
                <button class="quick-action-card" @click="handleAction('create-invoice')">
                  <span class="action-icon"><div class="thick-square"></div></span>
                  <span class="action-text">Skapa Faktura</span>
                </button>
                <button class="quick-action-card" @click="handleAction('add-member')">
                  <span class="action-icon">+</span>
                  <span class="action-text">Lägg till Medlem</span>
                </button>
                <button class="quick-action-card" @click="handleAction('record-expense')">
                  <span class="action-icon">−</span>
                  <span class="action-text">Registrera Utgift</span>
                </button>
                <button class="quick-action-card" @click="handleAction('record-income')">
                  <span class="action-icon">+</span>
                  <span class="action-text">Registrera Intäkt</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Top Center - Financial Overview (spans 2 columns) -->
          <div class="center-column">
            <div class="stats-compact">
              <h3 class="section-title">Ekonomisk Översikt</h3>
              <div class="stat-card-compact">
                <div class="stat-label">Kassa & Bank</div>
                <div class="stat-amount">{{ cashAndBank.toLocaleString() }} kr</div>
              </div>
              <div class="stat-card-compact income">
                <div class="stat-label">Månadens Intäkter</div>
                <div class="stat-amount">+{{ monthlyIncome.toLocaleString() }} kr</div>
              </div>
              <div class="stat-card-compact expense">
                <div class="stat-label">Månadens Utgifter</div>
                <div class="stat-amount">-{{ monthlyExpenses.toLocaleString() }} kr</div>
              </div>
              <div class="stat-card-compact" :class="monthlyResult >= 0 ? 'income' : 'expense'">
                <div class="stat-label">Resultat</div>
                <div class="stat-amount">{{ monthlyResult >= 0 ? '+' : '' }}{{ monthlyResult.toLocaleString() }} kr</div>
              </div>
            </div>
          </div>

          <!-- Top Right - Alerts/To Do -->
          <div class="right-column">
            <div class="panel">
              <div class="panel-header">
                <h3>Att Göra</h3>
              </div>
              <div class="alerts-compact">
                <div v-for="alert in alerts" :key="alert.id" class="alert-row" :class="alert.type">
                  <span class="alert-icon">!</span>
                  <span class="alert-text">{{ alert.message }}</span>
                </div>
              </div>
              <button class="alerts-action-btn" @click="handleViewAllAlerts">Åtgärda Alla</button>
            </div>
          </div>

          <!-- Bottom Left - Member Status -->
          <div class="bottom-left">
            <div class="panel">
              <h3 class="panel-header-title">Medlemsstatus</h3>
              <div class="member-stats-compact">
                <div class="member-stat-row">
                  <span class="member-label">Totalt Medlemmar</span>
                  <span class="member-value">{{ totalMembers }}</span>
                </div>
                <div class="member-stat-row">
                  <span class="member-label">Betalat</span>
                  <span class="member-value paid">{{ paidMembers }}</span>
                </div>
                <div class="member-stat-row">
                  <span class="member-label">Obetalt</span>
                  <span class="member-value unpaid">{{ unpaidMembers }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Center - Income and Expense Breakdowns (spans 2 columns) -->
          <div class="bottom-center">
            <div class="center-split">
              <!-- Income Breakdown -->
              <div class="breakdown-panel">
                <h3>Intäkter (Uppdelning)</h3>
                <div class="breakdown-list">
                  <div v-for="item in incomeBreakdown" :key="item.id" class="breakdown-row">
                    <span class="breakdown-label">{{ item.category }}</span>
                    <span class="breakdown-value">{{ item.amount.toLocaleString() }} kr</span>
                  </div>
                </div>
              </div>

              <!-- Expense Breakdown -->
              <div class="breakdown-panel">
                <h3>Utgifter (Uppdelning)</h3>
                <div class="breakdown-list">
                  <div v-for="item in expenseBreakdown" :key="item.id" class="breakdown-row">
                    <span class="breakdown-label">{{ item.category }}</span>
                    <span class="breakdown-value">{{ item.amount.toLocaleString() }} kr</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Right 1 - Empty placeholder -->
          <div class="bottom-right-1">
          </div>

          <!-- Bottom Right 2 - Recent Activity -->
          <div class="bottom-right-2">
            <div class="panel">
              <div class="panel-header">
                <h3>Senaste Aktivitet</h3>
              </div>
              <div class="activity-compact">
                <div v-for="transaction in recentTransactions.slice(0, 5)" :key="transaction.id" class="activity-row">
                  <div class="activity-info">
                    <span class="activity-name">{{ transaction.description }}</span>
                    <span class="activity-date">{{ transaction.date }}</span>
                  </div>
                  <div class="activity-amount" :class="transaction.type">
                    {{ transaction.type === 'income' ? '+' : '-' }}{{ transaction.amount.toLocaleString() }} kr
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- File Upload Modal -->
    <div v-if="showUploadModal" class="modal-overlay" @click="closeUploadModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Ladda upp Kvitto</h2>
          <button class="close-btn" @click="closeUploadModal">×</button>
        </div>
        <div 
          class="upload-area"
          :class="{ 'dragover': isDragging }"
          @drop="handleDrop"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @dragenter="handleDragEnter"
        >
          <div class="upload-icon">
            <img src="../assets/images/arrow-icon.png" alt="Upload" class="action-icon-img arrow-up large-icon" />
          </div>
          <p class="upload-text">Dra och släpp filer här</p>
          <p class="upload-subtext">eller</p>
          <input 
            type="file" 
            ref="fileInput" 
            @change="handleFileSelect" 
            multiple 
            accept="image/*,.pdf"
            style="display: none;"
          />
          <button class="browse-btn" @click="$refs.fileInput.click()">Bläddra efter filer</button>
          <p class="upload-hint">Stödda format: Bilder (JPG, PNG) och PDF</p>
        </div>
        <div v-if="selectedFiles.length > 0" class="file-list">
          <h3>Valda filer ({{ selectedFiles.length }})</h3>
          <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
            <span class="file-icon"><div class="thick-square small"></div></span>
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size">{{ formatFileSize(file.size) }}</span>
            <button class="remove-file-btn" @click="removeFile(index)">×</button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeUploadModal">Avbryt</button>
          <button 
            class="upload-btn" 
            @click="uploadFiles" 
            :disabled="selectedFiles.length === 0"
          >
            Ladda upp ({{ selectedFiles.length }})
          </button>
        </div>
      </div>
    </div>

    <!-- Add Member Modal -->
    <div v-if="showAddMemberModal" class="modal-overlay" @click="closeAddMemberModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Lägg till Medlem</h2>
          <button class="close-btn" @click="closeAddMemberModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="addMember">
            <div class="form-group">
              <label for="memberName">Namn *</label>
              <input 
                type="text" 
                id="memberName" 
                v-model="newMember.name" 
                required
                placeholder="För- och efternamn"
              />
            </div>
            <div class="form-group">
              <label for="memberEmail">E-post *</label>
              <input 
                type="email" 
                id="memberEmail" 
                v-model="newMember.email" 
                required
                placeholder="exempel@email.com"
              />
            </div>
            <div class="form-group">
              <label for="memberPhone">Telefon</label>
              <input 
                type="tel" 
                id="memberPhone" 
                v-model="newMember.phone"
                placeholder="070-123 45 67"
              />
            </div>
            <div class="form-group">
              <label for="memberType">Medlemstyp *</label>
              <select id="memberType" v-model="newMember.type" required>
                <option value="">Välj medlemstyp</option>
                <option value="regular">Ordinarie</option>
                <option value="youth">Ungdom</option>
                <option value="senior">Senior</option>
                <option value="family">Familj</option>
              </select>
            </div>
            <div class="form-group">
              <label for="memberFee">Årsavgift (kr) *</label>
              <input 
                type="number" 
                id="memberFee" 
                v-model.number="newMember.fee" 
                required
                min="0"
                placeholder="500"
              />
            </div>
            <div class="form-group checkbox-group">
              <label>
                <input 
                  type="checkbox" 
                  v-model="newMember.paid"
                />
                <span>Har betalat årsavgift</span>
              </label>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeAddMemberModal">Avbryt</button>
          <button class="upload-btn" @click="addMember">Lägg till Medlem</button>
        </div>
      </div>
    </div>

    <!-- Register Income Modal -->
    <div v-if="showIncomeModal" class="modal-overlay" @click="closeIncomeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Registrera Intäkt</h2>
          <button class="close-btn" @click="closeIncomeModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="registerIncome">
            <div class="form-group">
              <label for="incomeDescription">Beskrivning *</label>
              <input 
                type="text" 
                id="incomeDescription" 
                v-model="newIncome.description" 
                required
                placeholder="T.ex. Medlemsavgifter, Sponsring"
              />
            </div>
            <div class="form-group">
              <label for="incomeAmount">Belopp (kr) *</label>
              <input 
                type="number" 
                id="incomeAmount" 
                v-model.number="newIncome.amount" 
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div class="form-group">
              <label for="incomeCategory">Kategori *</label>
              <select id="incomeCategory" v-model="newIncome.category" required>
                <option value="">Välj kategori</option>
                <option value="Medlemsavgifter">Medlemsavgifter</option>
                <option value="Sponsring">Sponsring</option>
                <option value="Tävlingsavgifter">Tävlingsavgifter</option>
                <option value="Bidrag">Bidrag</option>
                <option value="Övrigt">Övrigt</option>
              </select>
            </div>
            <div class="form-group">
              <label for="incomeDate">Datum *</label>
              <input 
                type="date" 
                id="incomeDate" 
                v-model="newIncome.date" 
                required
              />
            </div>
            <div class="form-group">
              <label for="incomeNotes">Anteckningar</label>
              <textarea 
                id="incomeNotes" 
                v-model="newIncome.notes"
                rows="3"
                placeholder="Valfri information..."
              ></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeIncomeModal">Avbryt</button>
          <button class="upload-btn" @click="registerIncome">Registrera Intäkt</button>
        </div>
      </div>
    </div>

    <!-- Register Expense Modal -->
    <div v-if="showExpenseModal" class="modal-overlay" @click="closeExpenseModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Registrera Utgift</h2>
          <button class="close-btn" @click="closeExpenseModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="registerExpense">
            <div class="form-group">
              <label for="expenseDescription">Beskrivning *</label>
              <input 
                type="text" 
                id="expenseDescription" 
                v-model="newExpense.description" 
                required
                placeholder="T.ex. Lokalhyra, Utrustning"
              />
            </div>
            <div class="form-group">
              <label for="expenseAmount">Belopp (kr) *</label>
              <input 
                type="number" 
                id="expenseAmount" 
                v-model.number="newExpense.amount" 
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div class="form-group">
              <label for="expenseCategory">Kategori *</label>
              <select id="expenseCategory" v-model="newExpense.category" required>
                <option value="">Välj kategori</option>
                <option value="Lokalhyra">Lokalhyra</option>
                <option value="Utrustning">Utrustning</option>
                <option value="Tränare">Tränare</option>
                <option value="Resor">Resor</option>
                <option value="Marknadsföring">Marknadsföring</option>
                <option value="Administration">Administration</option>
                <option value="Övrigt">Övrigt</option>
              </select>
            </div>
            <div class="form-group">
              <label for="expenseDate">Datum *</label>
              <input 
                type="date" 
                id="expenseDate" 
                v-model="newExpense.date" 
                required
              />
            </div>
            <div class="form-group">
              <label for="expenseNotes">Anteckningar</label>
              <textarea 
                id="expenseNotes" 
                v-model="newExpense.notes"
                rows="3"
                placeholder="Valfri information..."
              ></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeExpenseModal">Avbryt</button>
          <button class="upload-btn" @click="registerExpense">Registrera Utgift</button>
        </div>
      </div>
    </div>

    <!-- Swish Payment Modal -->
    <div v-if="showSwishModal" class="modal-overlay" @click="closeSwishModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Swish Betalning</h2>
          <button class="close-btn" @click="closeSwishModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="requestSwishPayment">
            <div class="form-group">
              <label for="swishPhone">Telefonnummer *</label>
              <input 
                type="tel" 
                id="swishPhone" 
                v-model="swishPayment.phone" 
                required
                placeholder="07X-XXX XX XX"
                pattern="[0-9\s\-]+"
              />
            </div>
            <div class="form-group">
              <label for="swishAmount">Belopp (kr) *</label>
              <input 
                type="number" 
                id="swishAmount" 
                v-model.number="swishPayment.amount" 
                required
                min="1"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div class="form-group">
              <label for="swishDescription">Beskrivning *</label>
              <textarea 
                id="swishDescription" 
                v-model="swishPayment.description"
                required
                rows="3"
                placeholder="T.ex. Medlemsavgift 2025, Träningsavgift"
                maxlength="50"
              ></textarea>
              <small class="char-count">{{ swishPayment.description.length }}/50 tecken</small>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeSwishModal">Avbryt</button>
          <button class="upload-btn" @click="requestSwishPayment">Begär Betalning</button>
        </div>
      </div>
    </div>
  </div>
</template><script>
export default {
  name: 'Dashboard',
  data() {
    return {
      organizationName: 'Din Förening AB',
      cashAndBank: 452500,
      monthlyIncome: 128000,
      monthlyExpenses: 83400,
      totalMembers: 127,
      paidMembers: 102,
      unpaidMembers: 25,
      showUploadModal: false,
      isDragging: false,
      selectedFiles: [],
      showAddMemberModal: false,
      newMember: {
        name: '',
        email: '',
        phone: '',
        type: '',
        fee: 500,
        paid: false
      },
      showIncomeModal: false,
      newIncome: {
        description: '',
        amount: 0,
        category: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      },
      showExpenseModal: false,
      newExpense: {
        description: '',
        amount: 0,
        category: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      },
      showSwishModal: false,
      swishPayment: {
        phone: '',
        amount: 0,
        description: ''
      },
      recentTransactions: [
        { id: 1, type: 'income', description: 'Medlemsavgifter - December', amount: 32000, date: '1 Dec 2025' },
        { id: 2, type: 'expense', description: 'Utrustning', amount: 8500, date: '30 Nov 2025' },
        { id: 3, type: 'income', description: 'Sponsring - Lokalt företag', amount: 50000, date: '28 Nov 2025' },
        { id: 4, type: 'expense', description: 'Lokalhyra', amount: 12000, date: '27 Nov 2025' },
        { id: 5, type: 'income', description: 'Tävlingsavgifter', amount: 24000, date: '25 Nov 2025' }
      ],
      alerts: [
        { id: 1, type: 'warning', message: '25 medlemmar har ej betalat avgift' },
        { id: 2, type: 'info', message: '3 kvitton väntar på godkännande' },
        { id: 3, type: 'warning', message: '5 omatchade Swish-betalningar' }
      ],
      incomeBreakdown: [
        { id: 1, category: 'Medlemsavgifter', amount: 72000 },
        { id: 2, category: 'Sponsring', amount: 40000 },
        { id: 3, category: 'Tävlingsavgifter', amount: 12000 },
        { id: 4, category: 'Övrigt', amount: 4000 }
      ],
      expenseBreakdown: [
        { id: 1, category: 'Lokalhyra', amount: 35000 },
        { id: 2, category: 'Utrustning', amount: 28000 },
        { id: 3, category: 'Tränare', amount: 15000 },
        { id: 4, category: 'Övrigt', amount: 5400 }
      ]
    }
  },
  computed: {
    monthlyResult() {
      return this.monthlyIncome - this.monthlyExpenses
    }
  },
  methods: {
    handleAction(action) {
      console.log('Action:', action)
      if (action === 'upload-receipt') {
        this.showUploadModal = true
      } else if (action === 'add-member') {
        this.showAddMemberModal = true
      } else if (action === 'record-income') {
        this.showIncomeModal = true
      } else if (action === 'record-expense') {
        this.showExpenseModal = true
      } else if (action === 'swish-payment') {
        this.showSwishModal = true
      } else {
        alert(`Funktionen "${action}" kommer snart!`)
      }
    },
    handleViewAllAlerts() {
      console.log('View all alerts')
      alert('Öppnar åtgärdssida (kommer snart)...')
    },
    handleViewFiles() {
      console.log('View stored files')
      alert('Här hamnar alla dina uppladdade kvitton och dokument.')
    },
    handleViewMembers() {
      console.log('View members')
      alert('Här visas en lista över alla medlemmar.')
    },
    closeUploadModal() {
      this.showUploadModal = false
      this.selectedFiles = []
      this.isDragging = false
    },
    handleDragEnter(e) {
      e.preventDefault()
      this.isDragging = true
    },
    handleDragOver(e) {
      e.preventDefault()
      this.isDragging = true
    },
    handleDragLeave(e) {
      e.preventDefault()
      this.isDragging = false
    },
    handleDrop(e) {
      e.preventDefault()
      this.isDragging = false
      const files = Array.from(e.dataTransfer.files)
      this.addFiles(files)
    },
    handleFileSelect(e) {
      const files = Array.from(e.target.files)
      this.addFiles(files)
    },
    addFiles(files) {
      const validFiles = files.filter(file => {
        const isImage = file.type.startsWith('image/')
        const isPDF = file.type === 'application/pdf'
        return isImage || isPDF
      })
      this.selectedFiles = [...this.selectedFiles, ...validFiles]
    },
    removeFile(index) {
      this.selectedFiles.splice(index, 1)
    },
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    },
    uploadFiles() {
      console.log('Uploading files:', this.selectedFiles)
      // Here you would typically send files to a backend server
      alert(`${this.selectedFiles.length} fil(er) laddades upp!`)
      this.closeUploadModal()
    },
    closeAddMemberModal() {
      this.showAddMemberModal = false
      this.newMember = {
        name: '',
        email: '',
        phone: '',
        type: '',
        fee: 500,
        paid: false
      }
    },
    addMember() {
      console.log('Adding member:', this.newMember)
      // Here you would typically send the member data to a backend server
      
      // Update member counts
      this.totalMembers++
      if (this.newMember.paid) {
        this.paidMembers++
      } else {
        this.unpaidMembers++
      }
      
      alert(`Medlem ${this.newMember.name} har lagts till!`)
      this.closeAddMemberModal()
    },
    closeIncomeModal() {
      this.showIncomeModal = false
      this.newIncome = {
        description: '',
        amount: 0,
        category: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      }
    },
    registerIncome() {
      console.log('Registering income:', this.newIncome)
      
      // Update monthly income
      this.monthlyIncome += this.newIncome.amount
      
      // Update cash and bank
      this.cashAndBank += this.newIncome.amount
      
      // Add to recent transactions
      const formattedDate = new Date(this.newIncome.date).toLocaleDateString('sv-SE', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      })
      this.recentTransactions.unshift({
        id: Date.now(),
        type: 'income',
        description: this.newIncome.description,
        amount: this.newIncome.amount,
        date: formattedDate
      })
      
      // Update income breakdown
      const existingCategory = this.incomeBreakdown.find(item => item.category === this.newIncome.category)
      if (existingCategory) {
        existingCategory.amount += this.newIncome.amount
      } else {
        this.incomeBreakdown.push({
          id: Date.now(),
          category: this.newIncome.category,
          amount: this.newIncome.amount
        })
      }
      
      alert(`Intäkt på ${this.newIncome.amount.toLocaleString()} kr har registrerats!`)
      this.closeIncomeModal()
    },
    closeExpenseModal() {
      this.showExpenseModal = false
      this.newExpense = {
        description: '',
        amount: 0,
        category: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      }
    },
    registerExpense() {
      console.log('Registering expense:', this.newExpense)
      
      // Update monthly expenses
      this.monthlyExpenses += this.newExpense.amount
      
      // Update cash and bank
      this.cashAndBank -= this.newExpense.amount
      
      // Add to recent transactions
      const formattedDate = new Date(this.newExpense.date).toLocaleDateString('sv-SE', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      })
      this.recentTransactions.unshift({
        id: Date.now(),
        type: 'expense',
        description: this.newExpense.description,
        amount: this.newExpense.amount,
        date: formattedDate
      })
      
      // Update expense breakdown
      const existingCategory = this.expenseBreakdown.find(item => item.category === this.newExpense.category)
      if (existingCategory) {
        existingCategory.amount += this.newExpense.amount
      } else {
        this.expenseBreakdown.push({
          id: Date.now(),
          category: this.newExpense.category,
          amount: this.newExpense.amount
        })
      }
      
      alert(`Utgift på ${this.newExpense.amount.toLocaleString()} kr har registrerats!`)
      this.closeExpenseModal()
    },
    closeSwishModal() {
      this.showSwishModal = false
      this.swishPayment = {
        phone: '',
        amount: 0,
        description: ''
      }
    },
    requestSwishPayment() {
      console.log('Requesting Swish payment:', this.swishPayment)
      // Here you would typically integrate with Swish API
      
      alert(`Swish-betalning på ${this.swishPayment.amount.toLocaleString()} kr har begärts från ${this.swishPayment.phone}`)
      this.closeSwishModal()
    }
  }
}
</script>

<style scoped>
.dashboard-page {
  background-color: var(--background);
  height: 100vh;
  padding: 20px;
  overflow: hidden;
  box-sizing: border-box;
}

.dashboard-compact {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.container-full {
  max-width: 100%;
  padding: 0.5rem 1.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  background: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-btn {
  flex-direction: row;
  min-height: auto;
  padding: 0.5rem 1rem;
  gap: 0.75rem; 
}

.action-icon-img {
  width: 1.25rem;
  height: auto;
  object-fit: contain;
}

.header-btn .action-icon {
  font-size: 1.25rem;
}

.header-btn .action-text {
  font-size: 0.95rem;
  text-align: left;
}

.welcome-text h1 {
  font-size: 1.625rem;
  color: var(--primary-dark);
  margin: 0;
  line-height: 1.2;
}

.welcome-text p {
  font-size: 1rem;
  color: var(--text-dark);
  margin: 0;
  opacity: 0.8;
}

.main-actions {
  display: flex;
  gap: 0.75rem;
}

.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  grid-template-rows: 1.1fr 1fr;
  gap: 1.5rem;
  flex: 1;
  min-height: 0;
}

/* Left Column */
.left-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  grid-column: 1;
  grid-row: 1;
}

.left-column .panel {
  flex: 1;
  min-height: 0;
}

.stats-compact {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 1.0625rem;
  color: var(--primary-dark);
  margin: 0 0 0.75rem 0;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-card-compact {
  padding: 0.75rem;
  border-bottom: 1px solid var(--background);
}

.stat-card-compact:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 0.9375rem;
  color: var(--text-dark);
  opacity: 0.7;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.stat-amount {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--primary-dark);
}

.stat-card-compact.income .stat-amount {
  color: #22c55e;
}

.stat-card-compact.expense .stat-amount {
  color: #ef4444;
}

.actions-panel {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  flex: 1;
}

.actions-panel h3 {
  font-size: 0.9rem;
  color: var(--primary-dark);
  margin: 0 0 0.75rem 0;
  font-weight: 600;
}

.member-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.member-stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--background);
  border-radius: 6px;
}

.member-label {
  font-size: 1.0625rem;
  color: var(--text-dark);
  font-weight: 500;
}

.member-value {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--primary-dark);
}

.member-value.paid {
  color: #22c55e;
}

.member-value.unpaid {
  color: #ef4444;
}

.breakdown-panel {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.breakdown-panel h3 {
  font-size: 1.125rem;
  color: var(--primary-dark);
  margin: 0 0 0.75rem 0;
  font-weight: 600;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: var(--background);
  border-radius: 4px;
}

.breakdown-label {
  font-size: 1rem;
  color: var(--text-dark);
  font-weight: 500;
}

.breakdown-value {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--primary-dark);
}

.member-stats-compact {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.panel-header-title {
  font-size: 1.125rem;
  color: var(--primary-dark);
  margin: 0 0 0.75rem 0;
  font-weight: 600;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--background);
}

/* Center Column */
.center-column {
  display: flex;
  flex-direction: column;
  grid-column: 2 / 4;
  grid-row: 1;
}

.center-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  height: 100%;
}

.center-left,
.center-right {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
}

.panel {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  /* margin-bottom removed to fix grid height alignment */
  display: flex;
  flex-direction: column;
}

.center-column .panel {
  flex: 1;
  min-height: 0;
}

.panel-header {
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--background);
  margin-bottom: 0.75rem;
}

.panel-header h3 {
  font-size: 1.25rem;
  color: var(--primary-dark);
  margin: 0;
  font-weight: 600;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  overflow-y: auto;
  flex: 1;
}

.quick-action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.75rem 0.5rem;
  background: var(--background);
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 70px;
}

.quick-action-card:hover {
  background: var(--primary-light);
  border-color: var(--primary-dark);
  transform: translateY(-2px);
}

.quick-action-card:hover .action-icon,
.quick-action-card:hover .action-text {
  color: white;
}

.action-icon {
  font-size: 1.625rem;
  font-weight: 700;
  color: var(--primary-dark);
}

.action-text {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--primary-dark);
  text-align: center;
  line-height: 1.2;
}

.activity-compact {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  /* Scrollbar styling */
  scrollbar-width: thin;
  padding-right: 5px;
}

.activity-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--background);
  border-radius: 6px;
}

.activity-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.activity-name {
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--primary-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-date {
  font-size: 0.9375rem;
  color: var(--text-dark);
  opacity: 0.7;
}

.activity-amount {
  font-size: 1.25rem;
  font-weight: 700;
  margin-left: 1rem;
  white-space: nowrap;
}

.activity-amount.income {
  color: #22c55e;
}

.activity-amount.expense {
  color: #ef4444;
}

/* Right Column */
.right-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 100%;
  overflow: hidden;
  grid-column: 4;
  grid-row: 1;
}

/* Bottom Row */
.bottom-left {
  grid-column: 1;
  grid-row: 2;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.bottom-left .panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bottom-center {
  grid-column: 2 / 4;
  grid-row: 2;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.bottom-right-1 {
  grid-column: 3;
  grid-row: 2;
  display: none;
}

.bottom-right-2 {
  grid-column: 4;
  grid-row: 2;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.bottom-right-2 .panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.right-column .panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.alerts-compact {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  flex: 1;
  margin-bottom: 0.75rem;
  min-height: 0;
  max-height: calc(100% - 50px);
}

.alert-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--background);
  border-radius: 6px;
  border-left: 3px solid transparent;
  flex-shrink: 0;
}

.alert-row.warning {
  border-left-color: #f59e0b;
  background: #fef3c7;
}

.alert-row.info {
  border-left-color: #3b82f6;
  background: #dbeafe;
}

.alert-icon {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-dark);
}

.alert-text {
  font-size: 1.0625rem;
  color: var(--primary-dark);
  font-weight: 500;
  flex: 1;
}

.alerts-action-btn {
  width: 100%;
  padding: 0.6rem 1rem;
  font-size: 1.0625rem;
  font-weight: 600;
  background-color: var(--primary-light);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.alerts-action-btn:hover {
  background-color: var(--primary-medium);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

@media (max-width: 1400px) {
  .main-grid {
    grid-template-columns: 1fr 2fr 1fr;
    grid-template-rows: auto auto;
  }

  .left-column {
    grid-column: 1;
    grid-row: 1;
  }

  .center-column {
    grid-column: 2;
    grid-row: 1;
  }

  .right-column {
    grid-column: 3;
    grid-row: 1;
  }

  .bottom-left {
    grid-column: 1;
    grid-row: 2;
  }

  .bottom-center {
    grid-column: 2;
    grid-row: 2;
  }

  .bottom-right-2 {
    grid-column: 3;
    grid-row: 2;
  }
}

@media (max-width: 1024px) {
  .main-grid {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto auto;
  }

  .left-column {
    grid-column: 1;
    grid-row: 1;
  }

  .center-column {
    grid-column: 2;
    grid-row: 1 / 3;
  }

  .right-column {
    grid-column: 1;
    grid-row: 2;
  }

  .bottom-left {
    grid-column: 1;
    grid-row: 3;
  }

  .bottom-center {
    grid-column: 2;
    grid-row: 3;
  }

  .bottom-right-2 {
    grid-column: 1 / 3;
    grid-row: 4;
  }

  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .container-full {
    padding: 0.5rem 1rem;
  }

  .main-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    gap: 1rem;
  }

  .left-column,
  .center-column,
  .right-column,
  .bottom-left,
  .bottom-center,
  .bottom-right-2 {
    grid-column: 1;
    grid-row: auto;
  }

  .center-split {
    grid-template-columns: 1fr;
  }

  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .welcome-text h1 {
    font-size: 1.25rem;
  }

  .welcome-text p {
    font-size: 0.875rem;
  }

  .stat-amount {
    font-size: 1.5rem;
  }

  .panel-header h3 {
    font-size: 1rem;
  }

  .action-text {
    font-size: 0.8rem;
  }

  .activity-name {
    font-size: 0.95rem;
  }

  .activity-amount {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .quick-actions-grid {
    grid-template-columns: 1fr;
  }

  .header-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .main-actions {
    width: 100%;
    justify-content: stretch;
  }

  .stat-amount {
    font-size: 1.25rem;
  }

  .action-icon {
    font-size: 1.25rem;
  }

  .action-text {
    font-size: 0.75rem;
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
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid var(--background);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--primary-dark);
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--text-dark);
  cursor: pointer;
  padding: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--background);
  color: var(--primary-dark);
}

.upload-area {
  margin: 2rem;
  padding: 3rem 2rem;
  border: 3px dashed #cbd5e1;
  border-radius: 12px;
  text-align: center;
  background: var(--background);
  transition: all 0.3s ease;
}

.upload-area.dragover {
  border-color: var(--primary-light);
  background: #e0f2fe;
  transform: scale(1.02);
}

.upload-icon .action-icon-img.large-icon {
  width: 4rem;
  height: auto;
}

.upload-icon {
  margin-bottom: 1rem;
}

.arrow-up {
  transform: rotate(180deg);
}

.thick-square {
  width: 0.75em;
  height: 0.75em;
  border: 3px solid currentColor;
  display: inline-block;
  vertical-align: middle;
  box-sizing: border-box;
  margin-bottom: 0.1em;
}

.thick-square.small {
  width: 0.8em;
  height: 0.8em;
  border-width: 2px;
}

.thick-circle {
  width: 0.75em;
  height: 0.75em;
  border: 3px solid currentColor;
  border-radius: 50%;
  display: inline-block;
  vertical-align: middle;
  box-sizing: border-box;
  margin-bottom: 0.1em;
}

.thick-arrow {
  position: relative;
  display: inline-block;
  width: 0.8em;
  height: 0.9em;
  vertical-align: middle;
}

.thick-arrow-up::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 0.4em solid transparent;
  border-right: 0.4em solid transparent;
  border-bottom: 0.4em solid currentColor;
}

.thick-arrow-up::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0.25em;
  height: 0.5em;
  background-color: currentColor;
}

.thick-arrow-down::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 0.4em solid transparent;
  border-right: 0.4em solid transparent;
  border-top: 0.4em solid currentColor;
}

.thick-arrow-down::after {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0.25em;
  height: 0.5em;
  background-color: currentColor;
}

.upload-text {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--primary-dark);
  margin: 0.5rem 0;
}

.upload-subtext {
  font-size: 0.9rem;
  color: var(--text-dark);
  margin: 0.5rem 0;
}

.browse-btn {
  margin: 1rem 0;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  background-color: var(--primary-light);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.browse-btn:hover {
  background-color: var(--primary-medium);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.upload-hint {
  font-size: 0.75rem;
  color: var(--text-dark);
  opacity: 0.7;
  margin: 0.5rem 0 0 0;
}

.file-list {
  margin: 0 2rem 2rem 2rem;
  padding: 1rem;
  background: var(--background);
  border-radius: 8px;
}

.file-list h3 {
  font-size: 0.9rem;
  color: var(--primary-dark);
  margin: 0 0 1rem 0;
  font-weight: 600;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.file-item:last-child {
  margin-bottom: 0;
}

.file-icon {
  font-size: 1.5rem;
}

.file-name {
  flex: 1;
  font-size: 0.9rem;
  color: var(--primary-dark);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 0.8rem;
  color: var(--text-dark);
  opacity: 0.7;
}

.remove-file-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-dark);
  cursor: pointer;
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.remove-file-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 2px solid var(--background);
}

.cancel-btn,
.upload-btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background: var(--background);
  color: var(--text-dark);
}

.cancel-btn:hover {
  background: #e2e8f0;
}

.upload-btn {
  background-color: var(--primary-light);
  color: white;
}

.upload-btn:hover:not(:disabled) {
  background-color: var(--primary-medium);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.upload-btn:disabled {
  background-color: #cbd5e1;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Form Styles */
.modal-body {
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary-dark);
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary-light);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input::placeholder {
  color: #94a3b8;
}

.checkbox-group {
  margin-top: 1rem;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-weight: 500;
}

.checkbox-group input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--primary-light);
}

.checkbox-group span {
  font-size: 0.95rem;
  color: var(--text-dark);
}

.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-family: inherit;
  resize: vertical;
}

.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-light);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group textarea::placeholder {
  color: #94a3b8;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 0.8rem;
  color: var(--text-dark);
  opacity: 0.6;
  margin-top: 0.25rem;
}
</style>
