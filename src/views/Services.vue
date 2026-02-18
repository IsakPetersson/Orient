<template>
  <div class="dashboard-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Laddar dashboard...</p>
    </div>
    
    <section v-else-if="!showNoOrgModal && !showAuthModal" class="dashboard-compact">
      <div class="container-full">
        <!-- Header -->
        <div class="header-bar">
          <div class="welcome-text">
            <h1>Dashboard</h1>
          </div>
          <div class="org-name-container">
              <img v-if="organizationLogo" :src="organizationLogo" alt="Logo" class="org-logo"/>
              <select v-if="userOrganizations.length > 1" v-model="organizationId" @change="onOrganizationChange" class="org-selector">
                <option v-for="org in userOrganizations" :key="org.organization.id" :value="org.organization.id">
                  {{ org.organization.name }}
                </option>
              </select>
              <h2 v-else class="org-title">{{ organizationName }}</h2>
          </div>
          <div class="header-actions">
            <button class="quick-action-card header-btn" @click="handleViewSwishStatus">
              <span class="action-icon">⇄</span>
              <span class="action-text">Swish Status</span>
            </button>
            <button class="quick-action-card header-btn" @click="handleViewMembers">
              <img src="../assets/images/members-icon.png" alt="Members" class="action-icon-img" />
              <span class="action-text">Medlemmar</span>
            </button>
            <button class="quick-action-card header-btn" @click="handleViewSettings" v-if="currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'">
              <span class="action-icon">⚙</span>
              <span class="action-text">Inställningar</span>
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
                <button class="quick-action-card" @click="handleAction('download-accounting')" :disabled="downloadingSie">
                  <img src="../assets/images/arrow-icon.png" alt="Download" class="action-icon-img" />
                  <span class="action-text">{{ downloadingSie ? 'Laddar ner...' : 'Ladda ner SIE4-fil' }}</span>
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
                    <span class="activity-name">
                      <span v-if="transaction.voucherSeries" class="voucher-id">{{ transaction.voucherSeries }}{{ transaction.voucherNumber }}</span>
                      {{ transaction.description }}
                    </span>
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

    <!-- Custom Alert Modal -->
    <div v-if="showCustomAlert" class="modal-overlay alert-modal-overlay" @click.self="showCustomAlert = false">
      <div class="modal-content alert-modal-content">
        <div class="alert-header-centered">
          <div class="alert-icon-circle" :class="customAlertType === 'show-settings-link' ? 'warning' : customAlertType">
            <span v-if="customAlertType === 'success'">✓</span>
            <span v-else-if="customAlertType === 'error'">✕</span>
            <span v-else>!</span>
          </div>
          <h2>{{ customAlertTitle }}</h2>
        </div>
        <div class="alert-body-centered">
          <p style="white-space: pre-line;">{{ customAlertMessage }}</p>
        </div>
        <div class="modal-footer centered">
          <button v-if="customAlertType === 'show-settings-link'" class="btn btn-primary btn-lg" @click="$router.push('/settings')">Gå till Inställningar</button>
          <button :class="['btn', 'btn-lg', customAlertType === 'show-settings-link' ? 'btn-primary' : 'btn-primary']" @click="showCustomAlert = false">
            {{ customAlertType === 'show-settings-link' ? 'Avbryt' : 'OK' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
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
          <button class="btn cancel-btn" @click="showConfirmModal = false">Avbryt</button>
          <button class="btn btn-primary" @click="handleConfirm">Bekräfta</button>
        </div>
      </div>
    </div>

    <!-- Members Modal -->
    <div v-if="showMembersModal" class="modal-overlay" @click="closeMembersModal">
      <div class="modal-content members-modal" @click.stop>
        <div class="modal-header">
          <h2>Medlemmar i {{ organizationName }}</h2>
          <button class="close-btn" @click="closeMembersModal">×</button>
        </div>
        <div class="modal-body">
          <!-- Team Members Section -->
          <div class="members-section">
            <h3 class="section-title">Teammedlemmar ({{ teamMembers.length }})</h3>
            <div v-if="teamMembers.length === 0" class="no-members">
              <p>Inga teammedlemmar hittades.</p>
            </div>
            <div v-else class="members-list">
              <div v-for="member in teamMembers" :key="'team-' + member.id" class="member-item">
                <div class="member-avatar">
                  <span class="avatar-initial">{{ member.user.name.charAt(0).toUpperCase() }}</span>
                </div>
                <div class="member-info">
                  <div class="member-name">{{ member.user.name }}</div>
                  <div class="member-email">{{ member.user.email }}</div>
                </div>
                <div class="member-role-badge" :class="member.role.toLowerCase()">
                  {{ translateRole(member.role) }}
                </div>
                <div class="member-joined">
                  Gick med {{ formatDate(member.joinedAt) }}
                </div>
                <div v-if="currentUserRole === 'OWNER' && member.role !== 'OWNER'" class="member-actions">
                  <button class="action-btn promote-btn" @click="promoteMember(member)" :title="member.role === 'ADMIN' ? 'Degradera' : 'Befördra'">
                    {{ member.role === 'ADMIN' ? '▼' : '▲' }}
                  </button>
                  <button class="action-btn remove-btn" @click="removeTeamMember(member)" title="Ta bort">
                    ×
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Club Members Section -->
          <div class="members-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <h3 class="section-title" style="margin-bottom: 0;">Klubbmedlemmar ({{ clubMembers.length }})</h3>
              <button 
                v-if="currentUserRole === 'OWNER' && clubMembers.some(m => !m.paid && m.phone)" 
                class="btn btn-sm btn-primary" 
                @click="requestAllUnpaid"
                style="font-size: 0.8rem; padding: 4px 8px;"
              >
                Begär från alla obetalda
              </button>
            </div>
            <div v-if="clubMembers.length === 0" class="no-members">
              <p>Inga klubbmedlemmar hittades.</p>
            </div>
            <div v-else class="members-list">
              <div v-for="member in clubMembers" :key="'club-' + member.id" class="member-item" @click="viewClubMemberDetails(member)" style="cursor: pointer;">
                <div class="member-avatar">
                  <span class="avatar-initial">{{ member.name.charAt(0).toUpperCase() }}</span>
                </div>
                <div class="member-info">
                  <div class="member-name">{{ member.name }}</div>
                  <div class="member-email">{{ member.email }}</div>
                  <div class="member-meta">{{ translateMemberType(member.type) }} • {{ member.fee }} kr/år</div>
                </div>
                <div class="member-status-badge" :class="{ 'paid': member.paid, 'unpaid': !member.paid }">
                  {{ member.paid ? 'Betald' : 'Obetald' }}
                </div>
                <div class="member-joined">
                  Medlem sedan {{ formatDate(member.createdAt) }}
                </div>
                <div class="header-actions" v-if="currentUserRole === 'OWNER'" @click.stop>
                   <button 
                     v-if="!member.paid && member.phone" 
                     class="action-btn" 
                     @click="requestPaymentForMember(member)" 
                     title="Begär Swish-betalning"
                     style="margin-right: 5px; background: none; border: none; font-size: 1.2rem; cursor: pointer;"
                   >
                     $
                   </button>
                  <button class="action-btn remove-btn" @click="removeClubMember(member)" title="Ta bort">
                    ×
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="closeMembersModal">Stäng</button>
        </div>
      </div>
    </div>

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
            <div class="form-group">
              <label for="swishMember">Välj medlem (fyller i telefonnummer)</label>
              <select 
                id="swishMember" 
                @change="onSwishMemberSelect($event)"
                class="form-select"
              >
                <option value="">-- Välj medlem --</option>
                <option v-for="member in clubMembers" :key="member.id" :value="member.id">
                  {{ member.name }} ({{ member.phone || 'Inget nummer' }})
                </option>
              </select>
            </div>
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
              <div class="preset-buttons">
                <button 
                  type="button"
                  v-for="preset in descriptionPresets" 
                  :key="preset" 
                  class="preset-btn"
                  @click="setDescriptionPreset(preset)"
                  :class="{ active: swishPayment.description === preset }"
                >
                  {{ preset }}
                </button>
              </div>
              <textarea 
                id="swishDescription" 
                v-model="swishPayment.description"
                required
                rows="3"
                placeholder="Välj en förinställning eller skriv egen text"
                maxlength="50"
              ></textarea>
              <small class="char-count">{{ swishPayment.description.length }}/50 tecken</small>
            </div>
            <div class="form-group">
              <label for="swishAccount">Boka till konto (valfritt)</label>
              <select 
                id="swishAccount" 
                v-model="swishPayment.bookAccountId"
                class="form-select"
              >
                <option :value="null">-- Boka inte automatiskt --</option>
                <option v-for="account in accounts" :key="account.id" :value="account.id">
                  {{ account.name }}
                </option>
              </select>
              <small class="setting-hint">Om vald kommer betalningen automatiskt bokas som en transaktion när den är genomförd.</small>
            </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeSwishModal">Avbryt</button>
          <button class="upload-btn" @click="requestSwishPayment">Begär Betalning</button>
        </div>
      </div>
    </div>

    <!-- Authentication Required Modal -->
    <div v-if="showAuthModal" class="modal-overlay auth-modal-overlay" @click.self="goToLogin">
      <div class="modal-content auth-modal-content">
        <div class="auth-modal-body">
          <div class="auth-icon">
            <img src="../assets/images/lock.png" alt="Lock" class="auth-icon-img" />
          </div>
          <h2>Inloggning Krävs</h2>
          <p>Du måste vara inloggad för att komma åt Dashboard.</p>
          <button class="btn btn-primary btn-full" @click="goToLogin">
            Gå till Inloggning
          </button>
        </div>
      </div>
    </div>

    <!-- No Organization Modal -->
    <div v-if="showNoOrgModal" class="modal-overlay auth-modal-overlay">
      <div class="modal-content auth-modal-content">
        <div class="auth-modal-body">
          <div class="auth-icon">
            <img src="../assets/images/members-icon.png" alt="Organization" class="auth-icon-img" />
          </div>
          <h2>Ingen Organisation</h2>
          <p>Du är inte med i någon organisation. Gå till Organisationer för att gå med eller skapa en.</p>
          <button class="btn btn-primary btn-full" @click="$router.push('/')">
            Gå till Startsidan
          </button>
        </div>
      </div>
    </div>

    <!-- Club Member Detail Modal -->
    <div v-if="showClubMemberDetailModal && selectedClubMember" class="modal-overlay" @click="closeClubMemberDetailModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Medlemsdetaljer</h2>
          <button class="close-btn" @click="closeClubMemberDetailModal">×</button>
        </div>
        <div class="modal-body">
          <div class="member-detail-section">
            <div class="member-detail-avatar">
              <span class="avatar-initial-large">{{ selectedClubMember.name.charAt(0).toUpperCase() }}</span>
            </div>
            <h3 class="member-detail-name">{{ selectedClubMember.name }}</h3>
          </div>

          <div class="member-detail-info">
            <div class="detail-row">
              <span class="detail-label">E-post:</span>
              <span class="detail-value">{{ selectedClubMember.email }}</span>
            </div>
            <div v-if="selectedClubMember.phone" class="detail-row">
              <span class="detail-label">Telefon:</span>
              <span class="detail-value">{{ selectedClubMember.phone }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Medlemstyp:</span>
              <span class="detail-value">{{ translateMemberType(selectedClubMember.type) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Årsavgift:</span>
              <span class="detail-value">{{ selectedClubMember.fee }} kr</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Medlem sedan:</span>
              <span class="detail-value">{{ formatDate(selectedClubMember.createdAt) }}</span>
            </div>
          </div>

          <div class="payment-status-section">
            <h4>Betalningsstatus</h4>
            <div class="payment-toggle">
              <label class="toggle-label">
                <input 
                  type="checkbox" 
                  v-model="selectedClubMember.paid" 
                  @change="togglePaymentStatus"
                  :disabled="currentUserRole !== 'OWNER' && currentUserRole !== 'ADMIN'"
                />
                <span class="toggle-slider"></span>
                <span class="toggle-text">
                  {{ selectedClubMember.paid ? 'Betald' : 'Obetald' }}
                </span>
              </label>
            </div>
            <p class="payment-note" v-if="currentUserRole !== 'OWNER' && currentUserRole !== 'ADMIN'">
              Endast ägare och administratörer kan ändra betalningsstatus.
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="closeClubMemberDetailModal">Stäng</button>
        </div>
      </div>
    </div>

    <!-- Swish Status Modal -->
    <div v-if="showSwishStatusModal" class="modal-overlay" @click="closeSwishStatusModal">
      <div class="modal-content modal-lg" @click.stop>
        <div class="modal-header">
          <h2>Swish Betalningar</h2>
          <button class="close-btn" @click="closeSwishStatusModal">×</button>
        </div>
        <div class="modal-body">
          <div v-if="swishRequests.length === 0" class="no-members">
            <p>Inga Swish-förfrågningar hittades.</p>
          </div>
          <div v-else class="members-list">
            <div v-for="req in swishRequests" :key="req.id" class="member-item">
              <div class="member-info">
                <div class="member-name">{{ req.message || 'Swish Betalning' }}</div>
                <div class="member-email">{{ req.payerAlias }}</div>
                <div class="member-meta">{{ new Date(req.createdAt).toLocaleString('sv-SE') }}</div>
              </div>
              <div class="member-status-badge" 
                   :class="{ 
                     'paid': req.status === 'PAID', 
                     'unpaid': req.status === 'DECLINED' || req.status === 'ERROR' || req.status === 'CANCELLED',
                     'pending': req.status === 'PENDING' || req.status === 'CREATED'
                   }"
                   :style="req.status === 'PENDING' || req.status === 'CREATED' ? 'background-color: #fef3c7; color: #92400e;' : ''">
                {{ translateSwishStatus(req.status) }} <span v-if="req.amount">({{ req.amount }} kr)</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeSwishStatusModal">Stäng</button>
        </div>
      </div>
    </div>
  </div>
</template><script>
import { getCurrentUser } from '../lib/auth'
import { getUserOrganizations } from '../lib/orgs'
import { getDashboardData, createTransaction, createAccount, getOrganizationMembers, createMember } from '../lib/dashboard'

export default {
  name: 'Dashboard',
  data() {
    return {
      showAuthModal: false,
      showNoOrgModal: false,
      loading: true,
      organizationId: null,
      organizationName: '',
      organizationLogo: null,
      userOrganizations: [],
      currentUserRole: '',
      showMembersModal: false,
      // Custom Alert State
      showCustomAlert: false,
      showConfirmModal: false,
      confirmCallback: null,
      customAlertTitle: '',
      customAlertMessage: '',
      customAlertType: 'info', // 'info', 'success', 'error', 'warning'
      teamMembers: [],
      clubMembers: [],
      showClubMemberDetailModal: false,
      selectedClubMember: null,
      cashAndBank: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      totalMembers: 0,
      paidMembers: 0,
      unpaidMembers: 0,
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
      showSwishStatusModal: false,
      swishRequests: [],
      showSwishModal: false,
      swishPayment: {
        phone: '',
        amount: 0,
        description: '',
        bookAccountId: null,
        memberId: null
      },
      recentTransactions: [],
      downloadingSie: false,
      alerts: [],
      incomeBreakdown: [],
      expenseBreakdown: [],
      accounts: [],
      descriptionPresets: [
        'Medlemsavgift',
        'Tävlingsavgift',
        'Träningsavgift',
        'Lokalhyra',
        'Utrustning',
        'Sponsring'
      ]
    }
  },
  async mounted() {
    const user = await getCurrentUser()
    if (!user) {
      this.showAuthModal = true
      return
    }
    
    await this.loadDashboard()
  },
  computed: {
    monthlyResult() {
      return this.monthlyIncome - this.monthlyExpenses
    }
  },
  methods: {
    async loadDashboard() {
      try {
        this.loading = true
        
        // Get user's organizations
        const memberships = await getUserOrganizations()
        if (memberships.length === 0) {
          this.showNoOrgModal = true
          this.loading = false
          return
        }
        
        // Store all organizations
        this.userOrganizations = memberships
        
        // Use the selected organization or the first one
        if (!this.organizationId) {
          this.organizationId = memberships[0].organization.id
        }
        
        // Get current user's role in this organization
        const currentMembership = memberships.find(m => m.organization.id === this.organizationId)
        this.currentUserRole = currentMembership?.role || ''
        
        // Fetch dashboard data
        const data = await getDashboardData(this.organizationId)
        
        // If no accounts exist, create a default one
        if (data.accounts.length === 0) {
          await createAccount(this.organizationId, 'Huvudkonto')
          // Re-fetch data after creating account
          const updatedData = await getDashboardData(this.organizationId)
          this.updateDashboardState(updatedData)
        } else {
          this.updateDashboardState(data)
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error)
        alert('Kunde inte ladda dashboard-data')
      } finally {
        this.loading = false
      }
    },
    updateDashboardState(data) {
      // Update state with real data
      this.organizationName = data.organization.name
      this.organizationLogo = data.organization.logoUrl // Populate logoUrl
      this.cashAndBank = data.financialSummary.totalBalance
      this.monthlyIncome = data.financialSummary.monthlyIncome
      this.monthlyExpenses = data.financialSummary.monthlyExpenses
      this.totalMembers = data.members.total
      this.paidMembers = data.members.paid
      this.unpaidMembers = data.members.unpaid
      this.recentTransactions = data.recentTransactions
      this.incomeBreakdown = data.incomeBreakdown
      this.expenseBreakdown = data.expenseBreakdown
      this.accounts = data.accounts
      
      // Set default alerts if needed
      this.alerts = []
      if (this.unpaidMembers > 0) {
        this.alerts.push({
          id: 1,
          type: 'warning',
          message: `${this.unpaidMembers} medlemmar har ej betalat avgift`
        })
      }
    },
    onSwishMemberSelect(event) {
      const memberId = parseInt(event.target.value)
      if (memberId) {
        const member = this.clubMembers.find(m => m.id === memberId)
        if (member && member.phone) {
          this.swishPayment.phone = member.phone
          this.swishPayment.memberId = member.id
        }
      } else {
        this.swishPayment.memberId = null
      }
    },
    async downloadSieFile() {
      try {
        this.downloadingSie = true
        
        const response = await fetch(`/api/finance?action=sie`, {
          method: 'GET',
          headers: {
            'x-org-id': String(this.organizationId)
          }
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
        alert('Kunde inte ladda ner SIE-filen. Försök igen senare.')
      } finally {
        this.downloadingSie = false
      }
    },
    async handleAction(action) {
      console.log('Action:', action)
      if (action === 'upload-receipt') {
        this.showUploadModal = true
      } else if (action === 'add-member') {
        this.showAddMemberModal = true
      } else if (action === 'record-income') {
        this.showIncomeModal = true
      } else if (action === 'record-expense') {
        this.showExpenseModal = true
      } else if (action === 'download-accounting') {
        await this.downloadSieFile()
      } else if (action === 'swish-payment') {
        // Load members if not already loaded, so we can pick from the list
        if (this.clubMembers.length === 0) {
          try {
            const response = await getOrganizationMembers(this.organizationId)
            this.teamMembers = response.teamMembers
            this.clubMembers = response.clubMembers
          } catch (error) {
            console.error('Failed to load members for swish:', error)
            // Don't block opening the modal if fetching fails
          }
        }
        // Set default account for booking so transaction is created automatically
        if (this.accounts.length > 0) {
          this.swishPayment.bookAccountId = this.accounts[0].id
        }
        this.showSwishModal = true
      } else {
        alert(`Funktionen "${action}" kommer snart!`)
      }
    },
    handleViewAllAlerts() {
      console.log('View all alerts')
      alert('Öppnar åtgärdssida (kommer snart)...')
    },
    async handleViewSwishStatus() {
      this.showSwishStatusModal = true
      try {
        const response = await fetch('/api/swish?action=requests', {
          headers: { 'x-org-id': String(this.organizationId) }
        })
        if (!response.ok) throw new Error('Failed to fetch requests')
        this.swishRequests = await response.json()
      } catch (error) {
        console.error('Error fetching Swish requests:', error)
        alert('Kunde inte hämta Swish-förfrågningar')
      }
    },
    closeSwishStatusModal() {
      this.showSwishStatusModal = false
    },
    translateSwishStatus(status) {
      const map = {
        'PAID': 'Betald',
        'DECLINED': 'Nekad',
        'ERROR': 'Fel',
        'PENDING': 'Väntar',
        'CREATED': 'Skapad',
        'CANCELLED': 'Avbruten'
      }
      return map[status] || status
    },
    async handleViewMembers() {      
      try {
        const response = await getOrganizationMembers(this.organizationId)
        this.teamMembers = response.teamMembers
        this.clubMembers = response.clubMembers
        this.showMembersModal = true
      } catch (error) {
        console.error('Failed to load members:', error)
        alert('Kunde inte ladda medlemmar')
      }
    },
    handleViewSettings() {
      this.$router.push('/settings')
    },
    closeMembersModal() {
      this.showMembersModal = false
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
    async requestAllUnpaid() {
      const unpaidMembers = this.clubMembers.filter(m => !m.paid && m.phone)
      
      if (unpaidMembers.length === 0) {
        this.showAlert('Inga mottagare', 'Inga obetalda medlemmar med telefonnummer hittades.', 'warning')
        return
      }

      const totalAmount = unpaidMembers.reduce((sum, m) => sum + m.fee, 0)
      
      this.showConfirm(
        'Skicka betalningsförfrågningar?',
        `Detta skickar ${unpaidMembers.length} Swish-förfrågningar för totalt ${totalAmount} kr.\n\nEn begäran skickas till varje obetald medlem med registrerat telefonnummer.`,
        async () => {
          const defaultAccountId = this.accounts.length > 0 ? this.accounts[0].id : null
          await this.processUnpaidRequests(unpaidMembers, defaultAccountId)
        }
      )
    },
    async processUnpaidRequests(unpaidMembers, defaultAccountId) {
      if (this.unpaidMembers === 0) {
        this.showAlert('Inga obetalda', 'Det finns inga obetalda medlemmar att skicka till.', 'info');
        return;
      }
      
      this.closeMembersModal() // Close members modal first
      this.loading = true
      
      let successCount = 0
      let failCount = 0
      const errors = []
      let configError = null

      try {
        for (const member of unpaidMembers) {
          try {
            const response = await fetch('/api/swish?action=requests', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-org-id': String(this.organizationId)
              },
              body: JSON.stringify({
                payerPhone: member.phone,
                amount: String(member.fee), // Ensure string
                message: 'Medlemsavgift',
                bookAccountId: defaultAccountId,
                memberId: member.id
              })
            })

            if (response.ok) {
              successCount++
            } else {
              let errorText = await response.text()
              let errorMessage = errorText
              
              try {
                const errorObj = JSON.parse(errorText)
                errorMessage = errorObj.message || errorObj.error || errorText
              } catch (e) {
                // Not JSON
              }
              
              console.error(`Failed to request from ${member.name}:`, errorMessage)
              
              // Check for configuration error
              if (errorMessage.includes('Swish is not fully configured')) {
                configError = errorMessage
                // Don't count this one as failed yet, stop immediately
                break 
              }
              
              errors.push(`${member.name}: ${errorMessage}`)
              failCount++
            }
          } catch (error) {
            console.error(`Error requesting from ${member.name}:`, error)
            errors.push(`${member.name}: ${error.message}`)
            failCount++
          }
        }
      } finally {
        this.loading = false
      }
      
      if (configError) {
        // If some requests succeeded before error, reload dashboard
        if (successCount > 0) {
          await this.loadDashboard()
        }
        this.showAlert('Swish ej konfigurerat', configError, 'show-settings-link')
        return
      }
      
      let message = `Klar! Skickade ${successCount} förfrågningar.`
      if (failCount > 0) {
        message += `\n\nMisslyckades med ${failCount} förfrågningar.`
        
        // Add sample errors to message
        if (errors.length > 0) {
          const sampleErrors = errors.slice(0, 3).join('\n');
          message += `\n\nExempel på fel:\n${sampleErrors}`;
          
          if (errors.length > 3) {
            message += `\n...och ${errors.length - 3} till.`;
          }
        }
      }
      
      this.showAlert(failCount > 0 ? 'Slutfört med fel' : 'Klart!', message, failCount > 0 ? 'warning' : 'success')
      this.loadDashboard() // Refresh data
    },
    requestPaymentForMember(member) {
      if (!member.phone) {
        this.showAlert('Saknar uppgifter', 'Denna medlem har inget telefonnummer registrerat.', 'warning');
        return;
      }
      
      this.closeMembersModal();
      
      // Pre-fill Swish modal data
      this.swishPayment = {
        phone: member.phone,
        memberId: member.id,
        amount: member.fee, // Use member's annual fee as default amount
        description: 'Medlemsavgift',
        bookAccountId: this.accounts.length > 0 ? this.accounts[0].id : null
      };
      
      this.showSwishModal = true;
    },
    async promoteMember(member) {
      // Toggle between MEMBER, VIEWER, and ADMIN roles
      let newRole
      if (member.role === 'VIEWER') {
        newRole = 'MEMBER'
      } else if (member.role === 'MEMBER') {
        newRole = 'ADMIN'
      } else if (member.role === 'ADMIN') {
        newRole = 'MEMBER'
      }

      this.showConfirm(
        'Ändra roll?',
        `Är du säker på att du vill ändra rollen för ${member.user.name} från ${this.translateRole(member.role)} till ${this.translateRole(newRole)}?`,
        async () => {
          try {
            const response = await fetch(`/api/orgs?action=updateRole`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'x-org-id': this.organizationId
              },
              credentials: 'include',
              body: JSON.stringify({
                membershipId: member.id,
                role: newRole
              })
            })

            if (!response.ok) {
              throw new Error('Failed to update role')
            }

            // Reload members
            await this.handleViewMembers()
          } catch (error) {
            console.error('Failed to update role:', error)
            this.showAlert('Fel', 'Kunde inte uppdatera rollen', 'error')
          }
        }
      )
    },
    async removeTeamMember(member) {
      this.showConfirm(
        'Ta bort medlem?',
        `Är du säker på att du vill ta bort ${member.user.name} från organisationen? Detta kan inte ångras.`,
        async () => {
          try {
            const response = await fetch(`/api/orgs?action=removeMember`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'x-org-id': this.organizationId
              },
              credentials: 'include',
              body: JSON.stringify({
                membershipId: member.id
              })
            })

            if (!response.ok) {
              throw new Error('Failed to remove team member')
            }

            // Reload members
            await this.handleViewMembers()
          } catch (error) {
            console.error('Failed to remove team member:', error)
            this.showAlert('Fel', 'Kunde inte ta bort teammedlemmen', 'error')
          }
        }
      )
    },
    async removeClubMember(member) {
      this.showConfirm(
        'Ta bort medlem?',
        `Är du säker på att du vill ta bort ${member.name} från medlemslistan? Detta kan inte ångras.`,
        async () => {
          try {
            const response = await fetch(`/api/members?id=${member.id}`, {
              method: 'DELETE',
              headers: {
                'x-org-id': this.organizationId
              },
              credentials: 'include'
            })

            if (!response.ok) {
              throw new Error('Failed to remove club member')
            }

            // Reload members
            await this.handleViewMembers()
          } catch (error) {
            console.error('Failed to remove club member:', error)
            this.showAlert('Fel', 'Kunde inte ta bort klubbmedlemmen', 'error')
          }
        }
      )
    },
    viewClubMemberDetails(member) {
      this.selectedClubMember = { ...member }
      this.showClubMemberDetailModal = true
    },
    closeClubMemberDetailModal() {
      this.showClubMemberDetailModal = false
      this.selectedClubMember = null
    },
    async togglePaymentStatus() {
      if (this.currentUserRole !== 'OWNER' && this.currentUserRole !== 'ADMIN') {
        this.showAlert('Ingen behörighet', 'Endast ägare och administratörer kan ändra betalningsstatus', 'error')
        this.selectedClubMember.paid = !this.selectedClubMember.paid
        return
      }

      const wasPaid = !this.selectedClubMember.paid // Previous state before toggle
      const nowPaid = this.selectedClubMember.paid // New state after toggle

      try {
        const response = await fetch(`/api/members?id=${this.selectedClubMember.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-org-id': this.organizationId
          },
          credentials: 'include',
          body: JSON.stringify({
            paid: this.selectedClubMember.paid
          })
        })

        if (!response.ok) {
          throw new Error('Failed to update payment status')
        }

        // If changed from unpaid to paid, create an income transaction
        if (!wasPaid && nowPaid && this.accounts.length > 0) {
          const accountId = this.accounts[0].id
          await createTransaction(
            this.organizationId,
            accountId,
            this.selectedClubMember.fee,
            `Medlemsavgift - ${this.selectedClubMember.name}`,
            'Medlemsavgifter'
          )
        }

        // Update the member in the clubMembers list
        const memberIndex = this.clubMembers.findIndex(m => m.id === this.selectedClubMember.id)
        if (memberIndex !== -1) {
          this.clubMembers[memberIndex].paid = this.selectedClubMember.paid
        }

        // Reload dashboard to update member counts and financial data
        const data = await getDashboardData(this.organizationId)
        this.paidMembers = data.members.paid
        this.unpaidMembers = data.members.unpaid
        this.cashAndBank = data.financialSummary.totalBalance
        this.monthlyIncome = data.financialSummary.monthlyIncome
        this.recentTransactions = data.recentTransactions
        this.incomeBreakdown = data.incomeBreakdown
      } catch (error) {
        console.error('Failed to update payment status:', error)
        this.showAlert('Fel', 'Kunde inte uppdatera betalningsstatus', 'error')
        // Revert the change
        this.selectedClubMember.paid = !this.selectedClubMember.paid
      }
    },
    async onOrganizationChange() {
      await this.loadDashboard()
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
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('sv-SE', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    },
    translateRole(role) {
      const translations = {
        'OWNER': 'Ägare',
        'ADMIN': 'Administratör',
        'MEMBER': 'Medlem',
        'VIEWER': 'Granskare'
      }
      return translations[role] || role
    },
    translateMemberType(type) {
      const translations = {
        'regular': 'Ordinarie',
        'youth': 'Ungdom',
        'senior': 'Senior',
        'family': 'Familj'
      }
      return translations[type] || type
    },
    uploadFiles() {
      console.log('Uploading files:', this.selectedFiles)
      // Here you would typically send files to a backend server
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
    async addMember() {
      try {
        if (!this.organizationId) {
          alert('Ingen organisation vald')
          return
        }

        await createMember(this.organizationId, {
          name: this.newMember.name,
          email: this.newMember.email,
          phone: this.newMember.phone || undefined,
          type: this.newMember.type,
          fee: this.newMember.fee,
          paid: this.newMember.paid
        })
        
        // If member is added as paid, create an income transaction
        if (this.newMember.paid && this.accounts.length > 0) {
          const accountId = this.accounts[0].id
          await createTransaction(
            this.organizationId,
            accountId,
            this.newMember.fee,
            `Medlemsavgift - ${this.newMember.name}`,
            'Medlemsavgifter'
          )
        }
        
        // Reload dashboard to get updated member counts and transactions
        const data = await getDashboardData(this.organizationId)
        this.totalMembers = data.members.total
        this.paidMembers = data.members.paid
        this.unpaidMembers = data.members.unpaid
        this.cashAndBank = data.financialSummary.totalBalance
        this.monthlyIncome = data.financialSummary.monthlyIncome
        this.recentTransactions = data.recentTransactions
        this.incomeBreakdown = data.incomeBreakdown
        
        // Reload members list if it's currently being viewed
        if (this.showMembersModal) {
          const response = await getOrganizationMembers(this.organizationId)
          this.teamMembers = response.teamMembers
          this.clubMembers = response.clubMembers
        }
        
        this.closeAddMemberModal()
      } catch (error) {
        console.error('Failed to add member:', error)
        alert('Kunde inte lägga till medlem')
      }
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
    async registerIncome() {
      try {
        if (!this.organizationId) {
          alert('Ingen organisation vald')
          return
        }
        
        // Get or create a default account
        let accountId = this.accounts[0]?.id
        if (!accountId) {
          alert('Inget konto hittat. Skapa ett konto först.')
          return
        }
        
        // Create transaction in database (positive for income)
        await createTransaction(
          this.organizationId,
          accountId,
          this.newIncome.amount, // positive amount for income
          this.newIncome.description,
          this.newIncome.category
        )
        
        this.closeIncomeModal()
        
        // Reload dashboard data
        await this.loadDashboard()
      } catch (error) {
        console.error('Failed to register income:', error)
        alert('Kunde inte registrera intäkt')
      }
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
    async registerExpense() {
      try {
        if (!this.organizationId) {
          alert('Ingen organisation vald')
          return
        }
        
        // Get or create a default account
        let accountId = this.accounts[0]?.id
        if (!accountId) {
          alert('Inget konto hittat. Skapa ett konto först.')
          return
        }
        
        // Create transaction in database (negative for expense)
        await createTransaction(
          this.organizationId,
          accountId,
          -this.newExpense.amount, // negative amount for expense
          this.newExpense.description,
          this.newExpense.category
        )
        
        this.closeExpenseModal()
        
        // Reload dashboard data
        await this.loadDashboard()
      } catch (error) {
        console.error('Failed to register expense:', error)
        alert('Kunde inte registrera utgift')
      }
    },
    setDescriptionPreset(preset) {
      this.swishPayment.description = preset
    },
    closeSwishModal() {
      this.showSwishModal = false
      this.swishPayment = {
        phone: '',
        amount: 0,
        description: '',
        bookAccountId: null
      }
    },
    async requestSwishPayment() {
      // Validate phone number
      if (!this.swishPayment.phone) {
        this.showAlert('Saknar uppgifter', 'Vänligen ange ett telefonnummer.', 'warning');
        return;
      }

      this.showConfirm(
        'Skicka betalningsförfrågan?',
        `Är du säker på att du vill skicka en Swish-förfrågan till ${this.swishPayment.phone} på ${this.swishPayment.amount} kr?`,
        async () => {
          await this.processSwishPayment();
        }
      );
    },
    async processSwishPayment() {
      try {
        const response = await fetch('/api/swish?action=requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-org-id': this.organizationId
          },
          credentials: 'include',
          body: JSON.stringify({
            payerPhone: this.swishPayment.phone,
            amount: this.swishPayment.amount.toFixed(2),
            message: this.swishPayment.description,
            bookAccountId: this.swishPayment.bookAccountId || null,
            memberId: this.swishPayment.memberId || null
          })
        })

        if (!response.ok) {
          const error = await response.json()
          // Show detailed error message if available
          const errorMsg = error.message || error.error || 'Kunde inte skapa betalningsbegäran'
          console.error('Swish API error details:', error)
          throw new Error(errorMsg)
        }

        const paymentRequest = await response.json()
        
        this.showAlert('Betalning skickad!', `Swish-betalning begärd från ${this.swishPayment.phone} för ${this.swishPayment.amount} kr`, 'success')
        
        this.closeSwishModal()
        
        // Reload data to show updated information
        await this.loadDashboard()
      } catch (error) {
        console.error('Failed to request Swish payment:', error)
        this.showAlert('Fel vid betalning', `Fel vid betalningsbegäran: ${error.message}`, 'error')
      }
    },
    goToLogin() {
      this.$router.push('/login')
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

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
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
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-btn .action-text {
  font-size: 0.95rem;
  text-align: left;
}

.welcome-text {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.welcome-text h1 {
  font-size: 1.625rem;
  color: var(--primary-dark);
  margin: 0;
  line-height: 1.2;
}

.org-name-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: 2rem;
  margin-right: auto; /* Push header actions to right */
}

.org-logo {
  height: 48px;
  width: auto;
  object-fit: contain;
  border-radius: 4px;
}

.org-title {
  font-size: 1.25rem;
  color: var(--primary-dark);
  font-weight: 600;
  margin: 0;
}

.org-name {
  display: flex;
  align-items: center;
}

.org-name p,
.welcome-text p {
  font-size: 1rem;
  color: var(--text-dark);
  margin: 0;
  opacity: 0.8;
}

.org-selector {
  padding: 0.5rem 1rem;
  border: 2px solid var(--background);
  border-radius: 6px;
  font-size: 0.95rem;
  font-family: inherit;
  color: var(--text-dark);
  background-color: var(--text-light);
  cursor: pointer;
  transition: border-color 0.3s ease;
  max-width: 250px;
}

.org-selector:focus {
  outline: none;
  border-color: var(--primary-light);
}

.org-selector:hover {
  border-color: var(--primary-light);
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

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.preset-btn {
  padding: 0.5rem 1rem;
  background: var(--background);
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--primary-dark);
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-btn:hover {
  background: var(--primary-light);
  border-color: var(--primary-light);
  color: white;
}

.preset-btn.active {
  background: var(--primary-light);
  border-color: var(--primary-light);
  color: white;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 0.8rem;
  color: var(--text-dark);
  opacity: 0.6;
  margin-top: 0.25rem;
}

/* Authentication Modal */
.auth-modal-overlay {
  z-index: 3000;
}

.auth-modal-content {
  max-width: 450px;
  text-align: center;
}

.auth-modal-body {
  padding: 1rem;
}

.auth-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.auth-icon-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
}

.auth-modal-content h2 {
  font-size: 1.75rem;
  color: var(--primary-dark);
  margin-bottom: 1rem;
}

.auth-modal-content p {
  font-size: 1.1rem;
  color: var(--text-dark);
  margin-bottom: 2rem;
  line-height: 1.6;
}

/* Members Modal */
.members-modal {
  max-width: 800px;
}

.members-section {
  margin-bottom: 2rem;
}

.members-section:last-child {
  margin-bottom: 0;
}

.members-section .section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary-dark);
  margin-bottom: 1rem;
  padding-left: 1rem;
  border-left: 4px solid var(--primary);
}

.members-list {
  padding: 1rem;
  max-height: 60vh;
  overflow-y: auto;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  background: var(--background);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.member-item:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.member-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.member-avatar .avatar-initial {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-light);
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-dark);
  margin-bottom: 0.25rem;
}

.member-email {
  font-size: 0.875rem;
  color: var(--text-dark);
  opacity: 0.7;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-meta {
  font-size: 0.75rem;
  color: var(--text-dark);
  opacity: 0.6;
  text-transform: capitalize;
  margin-top: 0.25rem;
}

.member-status-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.member-status-badge.paid {
  background: #d1fae5;
  color: #065f46;
}

.member-status-badge.unpaid {
  background: #fee2e2;
  color: #991b1b;
}

.member-role-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.member-role-badge.owner {
  background: #fef3c7;
  color: #92400e;
}

.member-role-badge.admin {
  background: #ddd6fe;
  color: #5b21b6;
}

.member-role-badge.member {
  background: #dbeafe;
  color: #1e40af;
}

.member-role-badge.viewer {
  background: #e5e7eb;
  color: #374151;
}

.member-joined {
  font-size: 0.875rem;
  color: var(--text-dark);
  opacity: 0.6;
  white-space: nowrap;
  flex-shrink: 0;
}

.no-members {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--text-dark);
  opacity: 0.7;
}

.no-members p {
  margin: 0;
  font-size: 1rem;
}

.member-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-shrink: 0;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.promote-btn {
  background: #dbeafe;
  color: #1e40af;
}

.promote-btn:hover {
  background: #bfdbfe;
  transform: translateY(-2px);
}

.remove-btn {
  background: #fee2e2;
  color: #991b1b;
}

.remove-btn:hover {
  background: #fecaca;
  transform: scale(1.1);
}

/* Club Member Detail Modal */
.member-detail-section {
  text-align: center;
  padding: 1.5rem 0;
  border-bottom: 2px solid var(--background);
  margin-bottom: 1.5rem;
}

.member-detail-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.avatar-initial-large {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-light);
}

.member-detail-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary-dark);
  margin: 0;
}

.member-detail-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--background);
  border-radius: 6px;
}

.detail-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark);
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 1rem;
  font-weight: 500;
  color: var(--primary-dark);
}

.payment-status-section {
  background: var(--background);
  border-radius: 8px;
  padding: 1.5rem;
}

.payment-status-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-dark);
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.payment-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  position: relative;
}

.toggle-label input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  width: 60px;
  height: 32px;
  background-color: #fee2e2;
  border-radius: 16px;
  position: relative;
  transition: background-color 0.3s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 24px;
  height: 24px;
  background-color: #991b1b;
  border-radius: 50%;
  top: 4px;
  left: 4px;
  transition: transform 0.3s ease, background-color 0.3s ease;
}

.toggle-label input[type="checkbox"]:checked + .toggle-slider {
  background-color: #d1fae5;
}

.toggle-label input[type="checkbox"]:checked + .toggle-slider::before {
  transform: translateX(28px);
  background-color: #065f46;
}

.toggle-label input[type="checkbox"]:disabled + .toggle-slider {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--primary-dark);
}

.payment-note {
  font-size: 0.875rem;
  color: var(--text-dark);
  opacity: 0.7;
  text-align: center;
  margin: 0;
  font-style: italic;
}

/* Custom Alert Modal Styles */
.alert-modal-overlay {
  z-index: 2000;
}

.alert-modal-content {
  max-width: 400px;
  text-align: center;
  padding: 0;
  border-radius: 12px;
  overflow: hidden;
}

.alert-header-centered {
  padding: 2rem 2rem 1rem;
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
  color: #4b5563;
  line-height: 1.6;
  font-size: 1.1rem;
}

.modal-footer.centered {
  justify-content: center;
  padding: 1.5rem 2rem 2rem;
  border-top: none;
}

.btn-lg {
  padding: 0.75rem 2rem;
  font-size: 1.1rem;
}

.voucher-id {
  display: inline-block;
  background-color: #f3f4f6;
  color: #6b7280;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-right: 8px;
  vertical-align: middle;
  border: 1px solid #e5e7eb;
}
</style>

