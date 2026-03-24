<template>
  <div class="dashboard-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>{{ $t('dashboard.loading') }}</p>
    </div>
    
    <section v-else-if="!showNoOrgModal && !showAuthModal" class="dashboard-compact">
      <div class="container-full">
        <!-- Header -->
        <div class="header-bar">
          <div class="welcome-text">
            <h1>{{ $t('dashboard.title') }}</h1>
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
              <span class="action-text">{{ $t('dashboard.swishStatusBtn') }}</span>
            </button>
            <button class="quick-action-card header-btn" @click="handleViewMembers">
              <img src="../assets/images/members-icon.png" alt="Members" class="action-icon-img" />
              <span class="action-text">{{ $t('dashboard.membersBtn') }}</span>
            </button>
            <button class="quick-action-card header-btn" @click="handleViewSettings" v-if="currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'">
              <span class="action-icon">⚙</span>
              <span class="action-text">{{ $t('dashboard.settingsBtn') }}</span>
            </button>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="main-grid">
          <!-- Top Left - Quick Actions -->
          <div class="left-column">
            <div class="panel">
              <div class="panel-header">
                <h3>{{ $t('dashboard.quickActions') }}</h3>
              </div>
              <div class="quick-actions-grid" style="padding-top: 10px;">
                <button class="quick-action-card" @click="handleAction('upload-receipt')">
                  <img src="../assets/images/arrow-icon.png" alt="Upload" class="action-icon-img arrow-up" />
                  <span class="action-text">{{ $t('dashboard.uploadReceipt') }}</span>
                </button>
                <button class="quick-action-card" @click="handleAction('create-invoice')">
                  <span class="action-icon"><div class="thick-square"></div></span>
                  <span class="action-text">{{ $t('dashboard.createInvoice') }}</span>
                </button>
                <button class="quick-action-card" @click="handleAction('download-accounting')" :disabled="downloadingSie">
                  <img src="../assets/images/arrow-icon.png" alt="Download" class="action-icon-img" />
                  <span class="action-text">{{ downloadingSie ? $t('dashboard.downloadingSie') : $t('dashboard.downloadSie') }}</span>
                </button>
                <button class="quick-action-card" @click="handleAction('swish-payment')">
                  <span class="action-icon">$</span>
                  <span class="action-text">{{ $t('dashboard.swishPay') }}</span>
                </button>
                <button class="quick-action-card" @click="handleAction('download-pdf')" :disabled="downloadingPdf">
                  <img src="../assets/images/arrow-icon.png" alt="PDF" class="action-icon-img" />
                  <span class="action-text">{{ downloadingPdf ? $t('dashboard.downloadingPdf') : $t('dashboard.downloadPdf') }}</span>
                </button>
                <button class="quick-action-card" @click="handleAction('add-member')">
                  <span class="action-icon">+</span>
                  <span class="action-text">{{ $t('dashboard.addMember') }}</span>
                </button>
                <button class="quick-action-card" @click="handleAction('record-expense')">
                  <span class="action-icon">−</span>
                  <span class="action-text">{{ $t('dashboard.recordExpense') }}</span>
                </button>
                <button class="quick-action-card" @click="handleAction('record-income')">
                  <span class="action-icon">+</span>
                  <span class="action-text">{{ $t('dashboard.recordIncome') }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Top Center - Financial Overview (spans 2 columns) -->
          <div class="center-column">
            <div class="stats-compact">
              <h3 class="section-title">{{ $t('dashboard.overview') }}</h3>
              <div class="stat-card-compact">
                <div class="stat-label">{{ $t('dashboard.cashBank') }}</div>
                <div class="stat-amount">{{ cashAndBank.toLocaleString() }} kr</div>
              </div>
              <div class="stat-card-compact income">
                <div class="stat-label">{{ $t('dashboard.monthlyIncome') }}</div>
                <div class="stat-amount">+{{ monthlyIncome.toLocaleString() }} kr</div>
              </div>
              <div class="stat-card-compact expense">
                <div class="stat-label">{{ $t('dashboard.monthlyExpenses') }}</div>
                <div class="stat-amount">-{{ monthlyExpenses.toLocaleString() }} kr</div>
              </div>
              <div class="stat-card-compact" :class="monthlyResult >= 0 ? 'income' : 'expense'">
                <div class="stat-label">{{ $t('dashboard.result') }}</div>
                <div class="stat-amount">{{ monthlyResult >= 0 ? '+' : '' }}{{ monthlyResult.toLocaleString() }} kr</div>
              </div>
            </div>
          </div>

          <!-- Right Column - Calendar -->
          <div class="right-column">
            <div class="panel calendar-panel">
              <div class="panel-header calendar-header">
                <div class="calendar-nav">
                  <button class="cal-nav-btn" @click="calendarPrevMonth">&#8249;</button>
                  <span class="cal-month-label">
                    {{ $t('calendar.months')[calendarMonth] }} {{ calendarYear }}
                  </span>
                  <button class="cal-nav-btn" @click="calendarNextMonth">&#8250;</button>
                </div>
                <div class="calendar-header-actions">
                  <button class="cal-today-btn" @click="calendarGoToday">{{ $t('calendar.today') }}</button>
                  <button class="cal-add-btn" @click="openAddEventModal(null)">+ {{ $t('calendar.addEvent') }}</button>
                </div>
              </div>

              <!-- Day-of-week labels -->
              <div class="cal-weekdays">
                <span v-for="(wd, i) in calendarWeekdays" :key="i">{{ wd }}</span>
              </div>

              <!-- Day grid -->
              <div class="cal-grid">
                <div
                  v-for="(day, i) in calendarDays"
                  :key="i"
                  class="cal-day"
                  :class="{
                    'cal-other-month': !day.currentMonth,
                    'cal-today': calendarIsToday(day),
                    'cal-has-event': calendarDayHasEvent(day)
                  }"
                  @click="calendarSelectDay(day)"
                >
                  <span class="cal-day-num">{{ day.date.getDate() }}</span>
                  <span v-if="calendarDayHasEvent(day)" class="cal-dot"></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Left - Member Status -->
          <div class="bottom-left">
            <div class="panel">
              <h3 class="panel-header-title">{{ $t('dashboard.memberStatus') }}</h3>
              <div class="member-stats-compact">
                <div class="member-stat-row">
                  <span class="member-label">{{ $t('dashboard.totalMembers') }}</span>
                  <span class="member-value">{{ totalMembers }}</span>
                </div>
                <div class="member-stat-row">
                  <span class="member-label">{{ $t('dashboard.paid') }}</span>
                  <span class="member-value paid">{{ paidMembers }}</span>
                </div>
                <div class="member-stat-row">
                  <span class="member-label">{{ $t('dashboard.unpaid') }}</span>
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
                <h3>{{ $t('dashboard.income') }} {{ $t('dashboard.breakdown') }}</h3>
                <div class="breakdown-list">
                  <div v-for="item in incomeBreakdown" :key="item.id" class="breakdown-row">
                    <span class="breakdown-label">{{ item.category }}</span>
                    <span class="breakdown-value">{{ item.amount.toLocaleString() }} kr</span>
                  </div>
                </div>
              </div>

              <!-- Expense Breakdown -->
              <div class="breakdown-panel">
                <h3>{{ $t('dashboard.expenses') }} {{ $t('dashboard.breakdown') }}</h3>
                <div class="breakdown-list">
                  <div v-for="item in expenseBreakdown" :key="item.id" class="breakdown-row">
                    <span class="breakdown-label">{{ item.category }}</span>
                    <span class="breakdown-value">{{ item.amount.toLocaleString() }} kr</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Right 1 - empty -->
          <div class="bottom-right-1"></div>

          <!-- Bottom Right 2 - Recent Activity -->
          <div class="bottom-right-2">
            <div class="panel">
              <div class="panel-header">
                <h3>{{ $t('dashboard.recentActivity') }}</h3>
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
                    {{ transaction.type === 'income' ? '+' : '-' }}{{ Math.abs(transaction.amount).toLocaleString() }} kr
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
          <button v-if="customAlertType === 'show-settings-link'" class="btn btn-primary btn-lg" @click="$router.push('/settings')">{{ $t('dashboard.gotoSettings') }}</button>
          <button :class="['btn', 'btn-lg', customAlertType === 'show-settings-link' ? 'btn-primary' : 'btn-primary']" @click="showCustomAlert = false">
            {{ customAlertType === 'show-settings-link' ? $t('dashboard.cancel') : $t('dashboard.ok') }}
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
          <button class="btn cancel-btn" @click="showConfirmModal = false">{{ $t('dashboard.cancel') }}</button>
          <button class="btn btn-primary" @click="handleConfirm">{{ $t('dashboard.confirm') }}</button>
        </div>
      </div>
    </div>

    <!-- Members Modal -->
    <div v-if="showMembersModal" class="modal-overlay" @click="closeMembersModal">
      <div class="modal-content members-modal" @click.stop>
        <div class="modal-header">
          <h2>{{ $t('dashboard.membersTitle', { orgName: organizationName }) }}</h2>
          <button class="close-btn" @click="closeMembersModal">×</button>
        </div>
        <div class="modal-body">
          <!-- Team Members Section -->
          <div class="members-section">
            <h3 class="section-title">{{ $t('dashboard.teamMembers', { count: teamMembers.length }) }}</h3>
            <div v-if="teamMembers.length === 0" class="no-members">
              <p>{{ $t('dashboard.noTeamMembers') }}</p>
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
                  {{ $t('dashboard.joined', { date: formatDate(member.joinedAt) }) }}
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
              <h3 class="section-title" style="margin-bottom: 0;">{{ $t('dashboard.clubMembers', { count: clubMembers.length }) }}</h3>
              <button 
                v-if="currentUserRole === 'OWNER' && clubMembers.some(m => !m.paid && m.phone)" 
                class="btn btn-sm btn-primary" 
                @click="requestAllUnpaid"
                style="font-size: 0.8rem; padding: 4px 8px;"
              >
                {{ $t('dashboard.requestUnpaid') }}
              </button>
            </div>
            <div v-if="clubMembers.length === 0" class="no-members">
              <p>{{ $t('dashboard.noClubMembers') }}</p>
            </div>
            <div v-else class="members-list">
              <div v-for="member in clubMembers" :key="'club-' + member.id" class="member-item" @click="viewClubMemberDetails(member)" style="cursor: pointer;">
                <div class="member-avatar">
                  <span class="avatar-initial">{{ member.name.charAt(0).toUpperCase() }}</span>
                </div>
                <div class="member-info">
                  <div class="member-name">{{ member.name }}</div>
                  <div class="member-email">{{ member.email }}</div>
                  <div class="member-meta">{{ translateMemberType(member.type) }} • {{ member.fee }} kr/{{ $t('common.year') }}</div>
                </div>
                <div class="member-status-badge" :class="{ 'paid': member.paid, 'unpaid': !member.paid }">
                  {{ member.paid ? $t('dashboard.member.paid') : $t('dashboard.member.unpaid') }}
                </div>
                <div class="member-joined">
                  {{ $t('dashboard.member.since', { date: formatDate(member.createdAt) }) }}
                </div>
                <div class="header-actions" v-if="currentUserRole === 'OWNER'" @click.stop>
                   <button 
                     v-if="!member.paid && member.phone" 
                     class="action-btn" 
                     @click="requestPaymentForMember(member)" 
                     :title="$t('dashboard.member.requestSwish')"
                     style="margin-right: 5px; background: none; border: none; font-size: 1.2rem; cursor: pointer;"
                   >
                     $
                   </button>
                  <button class="action-btn remove-btn" @click="removeClubMember(member)" :title="$t('dashboard.member.remove')">
                    ×
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="closeMembersModal">{{ $t('dashboard.member.close') }}</button>
        </div>
      </div>
    </div>

    <!-- File Upload Modal -->
    <div v-if="showUploadModal" class="modal-overlay" @click="closeUploadModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ $t('dashboard.uploadModal.title') }}</h2>
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
          <p class="upload-text">{{ $t('dashboard.uploadModal.dropText') }}</p>
          <p class="upload-subtext">{{ $t('dashboard.uploadModal.or') }}</p>
          <input 
            type="file" 
            ref="fileInput" 
            @change="handleFileSelect" 
            accept="image/*"
            style="display: none;"
          />
          <button class="browse-btn" @click="$refs.fileInput.click()">{{ $t('dashboard.uploadModal.browse') }}</button>
          <p class="upload-hint">{{ $t('dashboard.uploadModal.hint') }}</p>
        </div>
        <div v-if="selectedFiles.length > 0" class="file-list">
          <h3>{{ $t('dashboard.uploadModal.selectedFiles', { count: selectedFiles.length }) }}</h3>
          <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
            <span class="file-icon"><div class="thick-square small"></div></span>
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size">{{ formatFileSize(file.size) }}</span>
            <button class="remove-file-btn" @click="removeFile(index)">×</button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeUploadModal">{{ $t('dashboard.uploadModal.cancel') }}</button>
          <button 
            class="upload-btn" 
            @click="uploadFiles" 
            :disabled="selectedFiles.length === 0 || parsingReceipt"
          >
            {{ parsingReceipt ? $t('dashboard.uploadModal.analyzing') : $t('dashboard.uploadModal.upload', { count: selectedFiles.length }) }}
          </button>
        </div>
      </div>
    </div>

    <!-- Add Member Modal -->
    <div v-if="showAddMemberModal" class="modal-overlay" @click="closeAddMemberModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ $t('dashboard.addMemberModal.title') }}</h2>
          <button class="close-btn" @click="closeAddMemberModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="addMember">
            <div class="form-group">
              <label for="memberName">{{ $t('dashboard.addMemberModal.name') }}</label>
              <input 
                type="text" 
                id="memberName" 
                v-model="newMember.name" 
                required
                :placeholder="$t('dashboard.addMemberModal.name')"
              />
            </div>
            <div class="form-group">
              <label for="memberEmail">{{ $t('dashboard.addMemberModal.email') }}</label>
              <input 
                type="email" 
                id="memberEmail" 
                v-model="newMember.email" 
                required
                :placeholder="$t('dashboard.addMemberModal.email')"
              />
            </div>
            <div class="form-group">
              <label for="memberPhone">{{ $t('dashboard.addMemberModal.phone') }}</label>
              <input 
                type="tel" 
                id="memberPhone" 
                v-model="newMember.phone"
                :placeholder="$t('dashboard.addMemberModal.phone')"
              />
            </div>
            <div class="form-group">
              <label for="memberType">{{ $t('dashboard.addMemberModal.type') }}</label>
              <select id="memberType" v-model="newMember.type" required>
                <option value="">{{ $t('dashboard.addMemberModal.selectType') }}</option>
                <option value="regular">{{ $t('dashboard.addMemberModal.types.regular') }}</option>
                <option value="youth">{{ $t('dashboard.addMemberModal.types.youth') }}</option>
                <option value="senior">{{ $t('dashboard.addMemberModal.types.senior') }}</option>
                <option value="family">{{ $t('dashboard.addMemberModal.types.family') }}</option>
              </select>
            </div>
            <div class="form-group">
              <label for="memberFee">{{ $t('dashboard.addMemberModal.fee') }}</label>
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
                <span>{{ $t('dashboard.addMemberModal.paidCheck') }}</span>
              </label>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeAddMemberModal">{{ $t('dashboard.addMemberModal.cancel') }}</button>
          <button class="upload-btn" @click="addMember">{{ $t('dashboard.addMemberModal.add') }}</button>
        </div>
      </div>
    </div>

    <!-- Register Income Modal -->
    <div v-if="showIncomeModal" class="modal-overlay" @click="closeIncomeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ $t('dashboard.incomeModal.title') }}</h2>
          <button class="close-btn" @click="closeIncomeModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="registerIncome">
            <div class="form-group">
              <label for="incomeDescription">{{ $t('dashboard.incomeModal.description') }}</label>
              <input 
                type="text" 
                id="incomeDescription" 
                v-model="newIncome.description" 
                required
                :placeholder="$t('dashboard.incomeModal.placeholderDesc')"
              />
            </div>
            <div class="form-group">
              <label for="incomeAmount">{{ $t('dashboard.incomeModal.amount') }}</label>
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
              <label for="incomeCategory">{{ $t('dashboard.incomeModal.category') }}</label>
              <select id="incomeCategory" v-model="newIncome.category" required>
                <option value="">{{ $t('dashboard.incomeModal.selectCategory') }}</option>
                <option value="Medlemsavgifter">{{ $t('dashboard.incomeModal.categories.fees') }}</option>
                <option value="Sponsring">{{ $t('dashboard.incomeModal.categories.sponsorship') }}</option>
                <option value="Tävlingsavgifter">{{ $t('dashboard.incomeModal.categories.competition') }}</option>
                <option value="Bidrag">{{ $t('dashboard.incomeModal.categories.grants') }}</option>
                <option value="Övrigt">{{ $t('dashboard.incomeModal.categories.other') }}</option>
              </select>
            </div>
            <div class="form-group">
              <label for="incomeDate">{{ $t('dashboard.incomeModal.date') }}</label>
              <input 
                type="date" 
                id="incomeDate" 
                v-model="newIncome.date" 
                required
              />
            </div>
            <div class="form-group">
              <label for="incomeNotes">{{ $t('dashboard.incomeModal.notes') }}</label>
              <textarea 
                id="incomeNotes" 
                v-model="newIncome.notes"
                rows="3"
                :placeholder="$t('dashboard.incomeModal.placeholderNotes')"
              ></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeIncomeModal">{{ $t('dashboard.incomeModal.cancel') }}</button>
          <button class="upload-btn" @click="registerIncome">{{ $t('dashboard.incomeModal.register') }}</button>
        </div>
      </div>
    </div>

    <!-- Register Expense Modal -->
    <div v-if="showExpenseModal" class="modal-overlay" @click="closeExpenseModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ $t('dashboard.expenseModal.title') }}</h2>
          <button class="close-btn" @click="closeExpenseModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="registerExpense">
            <div class="form-group">
              <label for="expenseDescription">{{ $t('dashboard.expenseModal.description') }}</label>
              <input 
                type="text" 
                id="expenseDescription" 
                v-model="newExpense.description" 
                required
                :placeholder="$t('dashboard.expenseModal.placeholderDesc')"
              />
            </div>
            <div class="form-group">
              <label for="expenseAmount">{{ $t('dashboard.expenseModal.amount') }}</label>
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
              <label for="expenseCategory">{{ $t('dashboard.expenseModal.category') }}</label>
              <select id="expenseCategory" v-model="newExpense.category" required>
                <option value="">{{ $t('dashboard.expenseModal.selectCategory') }}</option>
                <option value="Lokalhyra">{{ $t('dashboard.expenseModal.categories.rent') }}</option>
                <option value="Utrustning">{{ $t('dashboard.expenseModal.categories.equipment') }}</option>
                <option value="Tränare">{{ $t('dashboard.expenseModal.categories.coach') }}</option>
                <option value="Resor">{{ $t('dashboard.expenseModal.categories.travel') }}</option>
                <option value="Marknadsföring">{{ $t('dashboard.expenseModal.categories.marketing') }}</option>
                <option value="Administration">{{ $t('dashboard.expenseModal.categories.admin') }}</option>
                <option value="Övrigt">{{ $t('dashboard.expenseModal.categories.other') }}</option>
              </select>
            </div>
            <div class="form-group">
              <label for="expenseDate">{{ $t('dashboard.expenseModal.date') }}</label>
              <input 
                type="date" 
                id="expenseDate" 
                v-model="newExpense.date" 
                required
              />
            </div>
            <div class="form-group">
              <label for="expenseNotes">{{ $t('dashboard.expenseModal.notes') }}</label>
              <textarea 
                id="expenseNotes" 
                v-model="newExpense.notes"
                rows="3"
                :placeholder="$t('dashboard.expenseModal.placeholderNotes')"
              ></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeExpenseModal">{{ $t('dashboard.expenseModal.cancel') }}</button>
          <button class="upload-btn" @click="registerExpense">{{ $t('dashboard.expenseModal.register') }}</button>
        </div>
      </div>
    </div>

    <!-- Swish Payment Modal -->
    <div v-if="showSwishModal" class="modal-overlay" @click="closeSwishModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ $t('dashboard.swishModal.title') }}</h2>
          <button class="close-btn" @click="closeSwishModal">×</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
              <label for="swishMember">{{ $t('dashboard.swishModal.selectMember') }}</label>
              <select 
                id="swishMember" 
                @change="onSwishMemberSelect($event)"
                class="form-select"
              >
                <option value="">{{ $t('dashboard.swishModal.selectMemberPlaceholder') }}</option>
                <option v-for="member in clubMembers" :key="member.id" :value="member.id">
                  {{ member.name }} ({{ member.phone || $t('dashboard.swishModal.noPhone') }})
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="swishPhone">{{ $t('dashboard.swishModal.phone') }}</label>
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
              <label for="swishAmount">{{ $t('dashboard.swishModal.amount') }}</label>
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
              <label for="swishDescription">{{ $t('dashboard.swishModal.description') }}</label>
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
                :placeholder="$t('dashboard.swishModal.selectPreset')"
                maxlength="50"
              ></textarea>
              <small class="char-count">{{ $t('dashboard.swishModal.charCount', { current: swishPayment.description.length, max: 50 }) }}</small>
            </div>
            <div class="form-group">
              <label for="swishAccount">{{ $t('dashboard.swishModal.bookAccount') }}</label>
              <select 
                id="swishAccount" 
                v-model="swishPayment.bookAccountId"
                class="form-select"
              >
                <option :value="null">{{ $t('dashboard.swishModal.noAutoBook') }}</option>
                <option v-for="account in accounts" :key="account.id" :value="account.id">
                  {{ account.name }}
                </option>
              </select>
              <small class="setting-hint">{{ $t('dashboard.swishModal.bookHint') }}</small>
            </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeSwishModal">{{ $t('dashboard.swishModal.cancel') }}</button>
          <button class="upload-btn" @click="requestSwishPayment">{{ $t('dashboard.swishModal.request') }}</button>
        </div>
      </div>
    </div>

    <!-- Invoice Modal -->
    <div v-if="showInvoiceModal" class="modal-overlay" @click.self="closeInvoiceModal">
      <div class="modal-content invoice-modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ $t('dashboard.invoiceModal.title') }}</h2>
          <button class="close-btn" @click="closeInvoiceModal">×</button>
        </div>

        <!-- Step 1: Fill in form -->
        <div v-if="invoiceStep === 'form'" class="modal-body">
          <div class="form-group">
            <label>{{ $t('dashboard.invoiceModal.selectMember') }}</label>
            <select class="form-select" @change="onInvoiceMemberSelect($event)">
              <option value="">{{ $t('dashboard.invoiceModal.selectMemberPlaceholder') }}</option>
              <option v-for="m in clubMembers" :key="m.id" :value="m.id">
                {{ m.name }} ({{ m.email }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ $t('dashboard.invoiceModal.recipientName') }} *</label>
            <input type="text" v-model="newInvoice.recipientName" :placeholder="$t('dashboard.invoiceModal.placeholderName')" />
          </div>
          <div class="form-group">
            <label>{{ $t('dashboard.invoiceModal.recipientEmail') }}</label>
            <input type="email" v-model="newInvoice.recipientEmail" :placeholder="$t('dashboard.invoiceModal.placeholderEmail')" />
          </div>
          <div class="form-group">
            <label>{{ $t('dashboard.invoiceModal.description') }} *</label>
            <div class="preset-buttons">
              <button
                type="button"
                v-for="preset in descriptionPresets"
                :key="preset"
                class="preset-btn"
                @click="newInvoice.description = preset"
                :class="{ active: newInvoice.description === preset }"
              >{{ preset }}</button>
            </div>
            <input type="text" v-model="newInvoice.description" :placeholder="$t('dashboard.invoiceModal.placeholderDescription')" />
          </div>
          <div class="form-group">
            <label>{{ $t('dashboard.invoiceModal.amount') }} *</label>
            <input type="number" v-model.number="newInvoice.amount" min="1" step="0.01" placeholder="0.00" />
          </div>
          <div class="form-group">
            <label>{{ $t('dashboard.invoiceModal.dueDate') }}</label>
            <input type="date" v-model="newInvoice.dueDate" />
          </div>
          <div class="form-group">
            <label>{{ $t('dashboard.invoiceModal.notes') }}</label>
            <textarea v-model="newInvoice.notes" rows="2" :placeholder="$t('dashboard.invoiceModal.placeholderNotes')"></textarea>
          </div>
        </div>

        <!-- Step 2: PDF preview -->
        <div v-if="invoiceStep === 'preview'" class="modal-body invoice-preview-body">
          <div class="invoice-preview-card">
            <div class="invoice-preview-header">
              <div>
                <div class="invoice-preview-org">{{ organizationName }}</div>
                <div class="invoice-preview-label">Faktura</div>
              </div>
              <div class="invoice-preview-number">{{ pendingInvoice ? pendingInvoice.invoiceNumber : '' }}</div>
            </div>
            <div class="invoice-preview-meta">
              <div>
                <span class="preview-meta-label">{{ $t('dashboard.invoiceModal.previewTo') }}</span>
                <span class="preview-meta-value">{{ newInvoice.recipientName }}</span>
              </div>
              <div v-if="newInvoice.dueDate">
                <span class="preview-meta-label">{{ $t('dashboard.invoiceModal.dueDate') }}</span>
                <span class="preview-meta-value">{{ newInvoice.dueDate }}</span>
              </div>
            </div>
            <div class="invoice-preview-desc">
              <span class="preview-meta-label">{{ $t('dashboard.invoiceModal.description') }}</span>
              <p>{{ newInvoice.description }}</p>
            </div>
            <div v-if="newInvoice.notes" class="invoice-preview-desc">
              <span class="preview-meta-label">{{ $t('dashboard.invoiceModal.notes') }}</span>
              <p>{{ newInvoice.notes }}</p>
            </div>
            <div class="invoice-preview-total">
              <span>{{ $t('dashboard.invoiceModal.amount') }}</span>
              <span class="preview-total-amount">{{ Number(newInvoice.amount).toLocaleString('sv-SE', { minimumFractionDigits: 2 }) }} kr</span>
            </div>
          </div>
          <div class="invoice-preview-actions">
            <button class="invoice-action-btn pdf-btn" @click="downloadInvoicePdf" :disabled="generatingInvoicePdf">
              {{ generatingInvoicePdf ? $t('dashboard.invoiceModal.generatingPdf') : $t('dashboard.invoiceModal.downloadPdf') }}
            </button>
            <button
              v-if="newInvoice.recipientEmail"
              class="invoice-action-btn send-btn"
              @click="sendInvoiceEmail"
              :disabled="sendingInvoiceEmail"
            >
              {{ sendingInvoiceEmail ? $t('dashboard.invoiceModal.sending') : $t('dashboard.invoiceModal.sendEmail') }}
            </button>
            <p v-else class="invoice-no-email-note">{{ $t('dashboard.invoiceModal.noEmailNote') }}</p>
          </div>
        </div>

        <div class="modal-footer">
          <button v-if="invoiceStep === 'form'" class="cancel-btn" @click="closeInvoiceModal">{{ $t('dashboard.invoiceModal.cancel') }}</button>
          <button v-if="invoiceStep === 'form'" class="upload-btn" @click="createInvoice" :disabled="creatingInvoice">
            {{ creatingInvoice ? $t('dashboard.invoiceModal.creating') : $t('dashboard.invoiceModal.create') }}
          </button>
          <button v-if="invoiceStep === 'preview'" class="cancel-btn" @click="invoiceStep = 'form'">{{ $t('dashboard.invoiceModal.back') }}</button>
          <button v-if="invoiceStep === 'preview'" class="cancel-btn" @click="closeInvoiceModal">{{ $t('dashboard.invoiceModal.done') }}</button>
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
          <h2>{{ $t('dashboard.authModal.title') }}</h2>
          <p>{{ $t('dashboard.authModal.message') }}</p>
          <button class="btn btn-primary btn-full" @click="goToLogin">
            {{ $t('dashboard.authModal.login') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Day Modal -->
    <div v-if="showDayModal && selectedDay" class="modal-overlay" @click.self="closeDayModal">
      <div class="modal-content day-modal-content">
        <div class="modal-header">
          <h3 class="day-modal-date">
            {{ selectedDay.toLocaleDateString($i18n.locale === 'sv' ? 'sv-SE' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) }}
          </h3>
          <button class="close-btn" @click="closeDayModal">×</button>
        </div>
        <div class="day-modal-body">
          <div v-if="selectedDayEvents.length === 0" class="day-modal-empty">
            {{ $t('calendar.noEvents') }}
          </div>
          <div
            v-for="ev in selectedDayEvents"
            :key="ev.id"
            class="day-modal-event-row"
            @click="openEventDetailModal(ev)"
          >
            <span class="cal-event-dot" :class="calendarEventTypeClass(ev.type)"></span>
            <div class="day-modal-event-info">
              <span class="day-modal-event-title">{{ ev.title }}</span>
              <span class="day-modal-event-type">{{ $t('calendar.types.' + (ev.type || 'event')) }}</span>
            </div>
            <span class="day-modal-event-chevron">›</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeDayModal">{{ $t('calendar.cancel') }}</button>
          <button class="submit-btn" @click="openAddEventModal({ date: selectedDay })">+ {{ $t('calendar.addEvent') }}</button>
        </div>
      </div>
    </div>

    <!-- Event Detail Modal -->
    <div v-if="showEventDetailModal && selectedEvent" class="modal-overlay" @click.self="closeEventDetailModal">
      <div class="modal-content event-detail-modal">
        <div class="modal-header">
          <h3>{{ $t('calendar.eventDetails') }}</h3>
          <button class="close-btn" @click="closeEventDetailModal">×</button>
        </div>
        <div class="modal-body event-detail-body">
          <h4 class="event-detail-title">{{ selectedEvent.title }}</h4>
          <div class="event-detail-meta">
            <span class="event-detail-type-badge" :class="calendarEventTypeClass(selectedEvent.type)">
              {{ $t('calendar.types.' + (selectedEvent.type || 'event')) }}
            </span>
            <span class="event-detail-date">
              {{ selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString($i18n.locale === 'sv' ? 'sv-SE' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '' }}
            </span>
          </div>
          <div class="event-detail-section">
            <label>{{ $t('calendar.eventDescription') }}</label>
            <p v-if="selectedEvent.description" class="event-detail-desc">{{ selectedEvent.description }}</p>
            <p v-else class="event-detail-empty">{{ $t('calendar.noDescription') }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeEventDetailModal">{{ $t('calendar.cancel') }}</button>
          <button class="event-detail-delete-btn" @click="deleteCalendarEvent(selectedEvent.id); closeEventDetailModal()">{{ $t('calendar.deleteEvent') }}</button>
        </div>
      </div>
    </div>

    <!-- Add Event Modal -->
    <div v-if="showAddEventModal" class="modal-overlay" @click.self="closeAddEventModal">
      <div class="modal-content event-modal-content">
        <div class="modal-header">
          <h3>{{ $t('calendar.addEvent') }}</h3>
          <button class="close-btn" @click="closeAddEventModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>{{ $t('calendar.eventTitle') }}</label>
            <input
              v-model="newEvent.title"
              class="form-input"
              :placeholder="$t('calendar.eventTitlePlaceholder')"
              maxlength="100"
            />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>{{ $t('calendar.eventDate') }}</label>
              <input v-model="newEvent.date" type="date" class="form-input" />
            </div>
            <div class="form-group">
              <label>{{ $t('calendar.eventEndDate') }}</label>
              <input v-model="newEvent.endDate" type="date" class="form-input" />
            </div>
          </div>
          <div class="form-group">
            <label>{{ $t('calendar.eventType') }}</label>
            <select v-model="newEvent.type" class="form-input">
              <option value="event">{{ $t('calendar.types.event') }}</option>
              <option value="competition">{{ $t('calendar.types.competition') }}</option>
              <option value="training">{{ $t('calendar.types.training') }}</option>
              <option value="meeting">{{ $t('calendar.types.meeting') }}</option>
              <option value="other">{{ $t('calendar.types.other') }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ $t('calendar.eventDescription') }}</label>
            <textarea
              v-model="newEvent.description"
              class="form-input"
              :placeholder="$t('calendar.eventDescPlaceholder')"
              rows="2"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeAddEventModal">{{ $t('calendar.cancel') }}</button>
          <button class="submit-btn" :disabled="creatingEvent" @click="createCalendarEvent">
            {{ creatingEvent ? $t('calendar.creating') : $t('calendar.create') }}
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
          <h2>{{ $t('dashboard.noOrgModal.title') }}</h2>
          <p>{{ $t('dashboard.noOrgModal.message') }}</p>
          <button class="btn btn-primary btn-full" @click="$router.push('/')">
            {{ $t('dashboard.noOrgModal.home') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Club Member Detail Modal -->
    <div v-if="showClubMemberDetailModal && selectedClubMember" class="modal-overlay" @click="closeClubMemberDetailModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ $t('dashboard.clubMemberDetailModal.title') }}</h2>
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
              <span class="detail-label">{{ $t('dashboard.clubMemberDetailModal.email') }}:</span>
              <span class="detail-value">{{ selectedClubMember.email }}</span>
            </div>
            <div v-if="selectedClubMember.phone" class="detail-row">
              <span class="detail-label">{{ $t('dashboard.clubMemberDetailModal.phone') }}:</span>
              <span class="detail-value">{{ selectedClubMember.phone }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ $t('dashboard.clubMemberDetailModal.type') }}:</span>
              <span class="detail-value">{{ translateMemberType(selectedClubMember.type) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ $t('dashboard.clubMemberDetailModal.fee') }}:</span>
              <span class="detail-value">{{ selectedClubMember.fee }} kr</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ $t('dashboard.clubMemberDetailModal.since') }}:</span>
              <span class="detail-value">{{ formatDate(selectedClubMember.createdAt) }}</span>
            </div>
          </div>

          <div class="payment-status-section">
            <h4>{{ $t('dashboard.clubMemberDetailModal.paymentStatus') }}</h4>
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
                  {{ selectedClubMember.paid ? $t('dashboard.clubMemberDetailModal.paid') : $t('dashboard.clubMemberDetailModal.unpaid') }}
                </span>
              </label>
            </div>
            <p class="payment-note" v-if="currentUserRole !== 'OWNER' && currentUserRole !== 'ADMIN'">
              {{ $t('dashboard.clubMemberDetailModal.adminNote') }}
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="closeClubMemberDetailModal">{{ $t('dashboard.clubMemberDetailModal.close') }}</button>
        </div>
      </div>
    </div>

    <!-- Swish Status Modal -->
    <div v-if="showSwishStatusModal" class="modal-overlay" @click="closeSwishStatusModal">
      <div class="modal-content modal-lg" @click.stop>
        <div class="modal-header">
          <h2>{{ $t('dashboard.swishStatusModal.title') }}</h2>
          <button class="close-btn" @click="closeSwishStatusModal">×</button>
        </div>
        <div class="modal-body">
          <div v-if="swishRequests.length === 0" class="no-members">
            <p>{{ $t('dashboard.swishStatusModal.noRequests') }}</p>
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
          <button class="cancel-btn" @click="closeSwishStatusModal">{{ $t('dashboard.swishStatusModal.close') }}</button>
        </div>
      </div>
    </div>
  </div>
</template><script>
import { getCurrentUser } from '../lib/auth'
import { getUserOrganizations } from '../lib/orgs'
import { getDashboardData, createTransaction, createAccount, getOrganizationMembers, createMember } from '../lib/dashboard'
import { jsPDF } from 'jspdf'

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
      parsingReceipt: false,
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
      currentUserAvatar: null,
      currentUserName: '',
      downloadingSie: false,
      downloadingPdf: false,
      showInvoiceModal: false,
      invoiceStep: 'form', // 'form' | 'preview'
      creatingInvoice: false,
      generatingInvoicePdf: false,
      sendingInvoiceEmail: false,
      pendingInvoice: null,
      newInvoice: {
        memberId: null,
        recipientName: '',
        recipientEmail: '',
        description: '',
        amount: 0,
        dueDate: '',
        notes: ''
      },
      alerts: [],
      incomeBreakdown: [],
      expenseBreakdown: [],
      accounts: [],
      // Calendar
      calendarYear: new Date().getFullYear(),
      calendarMonth: new Date().getMonth(), // 0-indexed
      calendarEvents: [],
      selectedDay: null,
      showAddEventModal: false,
      creatingEvent: false,
      newEvent: {
        title: '',
        date: '',
        endDate: '',
        description: '',
        type: 'event'
      },
      selectedEvent: null,
      showEventDetailModal: false,
      showDayModal: false
    }
  },
  async mounted() {
    const user = await getCurrentUser()
    if (!user) {
      this.showAuthModal = true
      return
    }

    this.currentUserName = user.name || ''
    this.currentUserAvatar = user.avatarUrl || null

    await this.loadDashboard()
  },
  computed: {
    monthlyResult() {
      return this.monthlyIncome - this.monthlyExpenses
    },
    currentUserInitial() {
      return (this.currentUserName || 'U').charAt(0).toUpperCase()
    },
    calendarWeekdays() {
      return this.$i18n.locale === 'sv'
        ? ['M', 'T', 'O', 'T', 'F', 'L', 'S']
        : ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    },
    calendarDays() {
      const year = this.calendarYear
      const month = this.calendarMonth
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      // Monday-first: getDay() returns 0=Sun, so shift
      const startDow = (firstDay.getDay() + 6) % 7
      const days = []
      for (let i = 0; i < startDow; i++) {
        const d = new Date(year, month, -startDow + i + 1)
        days.push({ date: d, currentMonth: false })
      }
      for (let d = 1; d <= lastDay.getDate(); d++) {
        days.push({ date: new Date(year, month, d), currentMonth: true })
      }
      const remaining = 42 - days.length
      for (let i = 1; i <= remaining; i++) {
        days.push({ date: new Date(year, month + 1, i), currentMonth: false })
      }
      return days
    },
    selectedDayEvents() {
      if (!this.selectedDay) return []
      const sel = this.selectedDay.toDateString()
      return this.calendarEvents.filter(e => new Date(e.date).toDateString() === sel)
    },
    upcomingEvents() {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return this.calendarEvents
        .filter(e => new Date(e.date) >= today)
        .slice(0, 5)
    },
    descriptionPresets() {
      return [
        'Medlemsavgift',
        'Tävlingsavgift',
        'Träningsavgift',
        'Lokalhyra',
        'Utrustning',
        'Sponsring'
      ]
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
        await this.loadCalendarEvents()
      } catch (error) {
        console.error('Failed to load dashboard:', error)
        this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('dashboard.alerts.loadError'), 'error')
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
          message: `${this.unpaidMembers} ${this.$t('dashboard.member.unpaid').toLowerCase()} ${this.$t('dashboard.membersBtn').toLowerCase()}` // Keep simple or improve alert translation later
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
        this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('dashboard.alerts.sieError'), 'error')
      } finally {
        this.downloadingSie = false
      }
    },
    async downloadPdfFile() {
      try {
        this.downloadingPdf = true

        // Ensure members are loaded
        if (this.clubMembers.length === 0) {
          const response = await getOrganizationMembers(this.organizationId)
          this.teamMembers = response.teamMembers
          this.clubMembers = response.clubMembers
        }

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
        const pageW = doc.internal.pageSize.getWidth()
        const margin = 14
        const colRight = pageW - margin
        let y = 18

        // ── Header ──────────────────────────────────────────────────────────
        doc.setFontSize(20)
        doc.setFont('helvetica', 'bold')
        doc.text(this.organizationName || 'Organisation', margin, y)
        y += 7

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(120)
        const generated = new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })
        doc.text(`Genererad: ${generated}`, margin, y)
        doc.setTextColor(0)
        y += 8

        // Divider
        doc.setDrawColor(200)
        doc.line(margin, y, colRight, y)
        y += 8

        // ── Financial Summary ────────────────────────────────────────────────
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.text('Ekonomisk Oversikt', margin, y)
        y += 6

        const summaryRows = [
          ['Kassa & Bank', `${this.cashAndBank.toLocaleString('sv-SE')} kr`],
          ['Manadsintakter', `+${this.monthlyIncome.toLocaleString('sv-SE')} kr`],
          ['Manadskostnader', `-${this.monthlyExpenses.toLocaleString('sv-SE')} kr`],
          ['Resultat', `${this.monthlyResult >= 0 ? '+' : ''}${this.monthlyResult.toLocaleString('sv-SE')} kr`],
        ]

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        summaryRows.forEach(([label, value]) => {
          doc.text(label, margin, y)
          doc.text(value, colRight, y, { align: 'right' })
          y += 6
        })
        y += 4

        // ── Members ──────────────────────────────────────────────────────────
        doc.setDrawColor(200)
        doc.line(margin, y, colRight, y)
        y += 6

        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.text('Medlemmar', margin, y)
        y += 6

        // Member summary line
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`Totalt: ${this.totalMembers}   Betalat: ${this.paidMembers}   Obetalt: ${this.unpaidMembers}`, margin, y)
        y += 7

        if (this.clubMembers.length > 0) {
          // Table header
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(9)
          doc.text('Namn', margin, y)
          doc.text('E-post', margin + 55, y)
          doc.text('Avgift', margin + 115, y)
          doc.text('Status', colRight, y, { align: 'right' })
          y += 1
          doc.setDrawColor(180)
          doc.line(margin, y, colRight, y)
          y += 4

          doc.setFont('helvetica', 'normal')
          for (const m of this.clubMembers) {
            if (y > 270) {
              doc.addPage()
              y = 18
            }
            doc.text((m.name || '').substring(0, 28), margin, y)
            doc.text((m.email || '').substring(0, 35), margin + 55, y)
            doc.text(`${(m.fee ?? 0).toLocaleString('sv-SE')} kr`, margin + 115, y)
            doc.text(m.paid ? 'Betalt' : 'Obetalt', colRight, y, { align: 'right' })
            y += 5
          }
        }
        y += 4

        // ── Transactions ─────────────────────────────────────────────────────
        if (y > 240) { doc.addPage(); y = 18 }

        doc.setDrawColor(200)
        doc.line(margin, y, colRight, y)
        y += 6

        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.text('Senaste Transaktioner', margin, y)
        y += 6

        if (this.recentTransactions.length > 0) {
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(9)
          doc.text('Datum', margin, y)
          doc.text('Beskrivning', margin + 25, y)
          doc.text('Kategori', margin + 95, y)
          doc.text('Belopp', colRight, y, { align: 'right' })
          y += 1
          doc.setDrawColor(180)
          doc.line(margin, y, colRight, y)
          y += 4

          doc.setFont('helvetica', 'normal')
          for (const t of this.recentTransactions) {
            if (y > 270) {
              doc.addPage()
              y = 18
            }
            const dateStr = t.date ? new Date(t.date).toLocaleDateString('sv-SE') : ''
            const desc = (t.description || '').substring(0, 38)
            const cat = (t.category || '').substring(0, 18)
            const absAmt = Math.abs(Number(t.amount)).toLocaleString('sv-SE')
            const amount = t.type === 'income'
              ? `+${absAmt} kr`
              : `-${absAmt} kr`
            doc.text(dateStr, margin, y)
            doc.text(desc, margin + 25, y)
            doc.text(cat, margin + 95, y)
            doc.text(amount, colRight, y, { align: 'right' })
            y += 5
          }
        } else {
          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
          doc.text('Inga transaktioner registrerade.', margin, y)
        }

        // ── Footer ───────────────────────────────────────────────────────────
        const pageCount = doc.internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i)
          doc.setFontSize(8)
          doc.setTextColor(160)
          doc.text(`Sida ${i} av ${pageCount}`, pageW / 2, 290, { align: 'center' })
          doc.setTextColor(0)
        }

        const orgSlug = (this.organizationName || 'rapport').toLowerCase().replace(/\s+/g, '-')
        doc.save(`${orgSlug}-rapport-${new Date().toISOString().split('T')[0]}.pdf`)
      } catch (error) {
        console.error('PDF export failed:', error)
        this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('dashboard.alerts.pdfError'), 'error')
      } finally {
        this.downloadingPdf = false
      }
    },
    onInvoiceMemberSelect(event) {
      const memberId = parseInt(event.target.value)
      if (memberId) {
        const member = this.clubMembers.find(m => m.id === memberId)
        if (member) {
          this.newInvoice.memberId = member.id
          this.newInvoice.recipientName = member.name
          this.newInvoice.recipientEmail = member.email || ''
          if (!this.newInvoice.amount && member.fee) {
            this.newInvoice.amount = member.fee
          }
        }
      } else {
        this.newInvoice.memberId = null
      }
    },
    async createInvoice() {
      if (!this.newInvoice.recipientName || !this.newInvoice.description || !this.newInvoice.amount) {
        this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('dashboard.invoiceModal.validationError'), 'error')
        return
      }
      try {
        this.creatingInvoice = true
        const response = await fetch('/api/invoice?action=create', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'x-org-id': String(this.organizationId)
          },
          body: JSON.stringify({
            memberId: this.newInvoice.memberId,
            recipientName: this.newInvoice.recipientName,
            recipientEmail: this.newInvoice.recipientEmail || null,
            description: this.newInvoice.description,
            amount: this.newInvoice.amount,
            dueDate: this.newInvoice.dueDate || null,
            notes: this.newInvoice.notes || null
          })
        })
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to create invoice')
        }
        this.pendingInvoice = await response.json()
        this.invoiceStep = 'preview'
      } catch (error) {
        console.error('Invoice creation failed:', error)
        this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('dashboard.invoiceModal.createError'), 'error')
      } finally {
        this.creatingInvoice = false
      }
    },
    async downloadInvoicePdf() {
      try {
        this.generatingInvoicePdf = true
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
        const pageW = doc.internal.pageSize.getWidth()
        const margin = 20
        const colRight = pageW - margin
        let y = 20

        // Header block
        doc.setFillColor(30, 41, 59)
        doc.rect(0, 0, pageW, 38, 'F')
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        doc.text(this.organizationName || 'Organisation', margin, 18)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(148, 163, 184)
        doc.text('FAKTURA', margin, 28)
        doc.setTextColor(0, 0, 0)
        y = 52

        // Invoice number + dates row
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text('Fakturanummer', margin, y)
        doc.text('Förfallodatum', pageW / 2 + 10, y)
        y += 6
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(14)
        doc.text(this.pendingInvoice?.invoiceNumber || '', margin, y)
        doc.text(this.newInvoice.dueDate || '–', pageW / 2 + 10, y)
        y += 10

        // Divider
        doc.setDrawColor(229, 231, 235)
        doc.line(margin, y, colRight, y)
        y += 8

        // Recipient
        doc.setFontSize(9)
        doc.setTextColor(107, 114, 128)
        doc.text('TILL', margin, y)
        y += 5
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(17, 24, 39)
        doc.text(this.newInvoice.recipientName, margin, y)
        if (this.newInvoice.recipientEmail) {
          y += 6
          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(107, 114, 128)
          doc.text(this.newInvoice.recipientEmail, margin, y)
        }
        y += 10

        // Description
        doc.setFontSize(9)
        doc.setTextColor(107, 114, 128)
        doc.text('AVSER', margin, y)
        y += 5
        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(55, 65, 81)
        const descLines = doc.splitTextToSize(this.newInvoice.description, colRight - margin)
        doc.text(descLines, margin, y)
        y += descLines.length * 6 + 4

        // Notes (if any)
        if (this.newInvoice.notes) {
          doc.setFontSize(9)
          doc.setTextColor(107, 114, 128)
          doc.text('NOTERING', margin, y)
          y += 5
          doc.setFontSize(10)
          doc.setTextColor(55, 65, 81)
          const noteLines = doc.splitTextToSize(this.newInvoice.notes, colRight - margin)
          doc.text(noteLines, margin, y)
          y += noteLines.length * 5 + 6
        }

        // Amount box
        doc.setFillColor(248, 250, 252)
        doc.roundedRect(margin, y, colRight - margin, 18, 3, 3, 'F')
        doc.setFontSize(11)
        doc.setTextColor(107, 114, 128)
        doc.setFont('helvetica', 'normal')
        doc.text('Belopp att betala', margin + 5, y + 11)
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(17, 24, 39)
        const amountStr = Number(this.newInvoice.amount).toLocaleString('sv-SE', { minimumFractionDigits: 2 }) + ' kr'
        doc.text(amountStr, colRight - 4, y + 11, { align: 'right' })
        y += 26

        // Generated line
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(156, 163, 175)
        doc.text(`Skapad ${new Date().toLocaleDateString('sv-SE')} via Orient`, margin, y)

        const filename = `faktura-${this.pendingInvoice?.invoiceNumber || 'draft'}.pdf`
        doc.save(filename)
      } catch (error) {
        console.error('Invoice PDF failed:', error)
        this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('dashboard.invoiceModal.pdfError'), 'error')
      } finally {
        this.generatingInvoicePdf = false
      }
    },
    async sendInvoiceEmail() {
      if (!this.pendingInvoice) return
      try {
        this.sendingInvoiceEmail = true
        const response = await fetch('/api/invoice?action=send-email', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'x-org-id': String(this.organizationId)
          },
          body: JSON.stringify({ invoiceId: this.pendingInvoice.id })
        })
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to send email')
        }
        this.showAlert(this.$t('dashboard.alerts.successTitle'), this.$t('dashboard.invoiceModal.emailSent', { email: this.newInvoice.recipientEmail }), 'success')
        this.pendingInvoice = { ...this.pendingInvoice, status: 'SENT' }
      } catch (error) {
        console.error('Invoice email failed:', error)
        this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('dashboard.invoiceModal.emailError'), 'error')
      } finally {
        this.sendingInvoiceEmail = false
      }
    },
    closeInvoiceModal() {
      this.showInvoiceModal = false
      this.invoiceStep = 'form'
      this.pendingInvoice = null
      this.creatingInvoice = false
      this.generatingInvoicePdf = false
      this.sendingInvoiceEmail = false
      this.newInvoice = {
        memberId: null,
        recipientName: '',
        recipientEmail: '',
        description: '',
        amount: 0,
        dueDate: '',
        notes: ''
      }
    },

    // --- Calendar methods ---
    async loadCalendarEvents() {
      if (!this.organizationId) return
      try {
        const res = await fetch(
          `/api/events?year=${this.calendarYear}&month=${this.calendarMonth + 1}`,
          { headers: { 'x-org-id': String(this.organizationId) } }
        )
        if (res.ok) {
          const data = await res.json()
          this.calendarEvents = data.events || []
        }
      } catch (e) {
        console.error('Failed to load calendar events:', e)
      }
    },
    async calendarPrevMonth() {
      if (this.calendarMonth === 0) {
        this.calendarMonth = 11
        this.calendarYear--
      } else {
        this.calendarMonth--
      }
      this.selectedDay = null
      await this.loadCalendarEvents()
    },
    async calendarNextMonth() {
      if (this.calendarMonth === 11) {
        this.calendarMonth = 0
        this.calendarYear++
      } else {
        this.calendarMonth++
      }
      this.selectedDay = null
      await this.loadCalendarEvents()
    },
    calendarGoToday() {
      const now = new Date()
      this.calendarYear = now.getFullYear()
      this.calendarMonth = now.getMonth()
      this.selectedDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      this.loadCalendarEvents()
    },
    calendarSelectDay(day) {
      this.selectedDay = day.date
      this.selectedEvent = null
      this.showDayModal = true
    },
    closeDayModal() {
      this.showDayModal = false
    },
    calendarDayHasEvent(day) {
      const ds = day.date.toDateString()
      return this.calendarEvents.some(e => new Date(e.date).toDateString() === ds)
    },
    calendarIsToday(day) {
      return day.date.toDateString() === new Date().toDateString()
    },
    calendarIsSelected(day) {
      return this.selectedDay && day.date.toDateString() === this.selectedDay.toDateString()
    },
    openAddEventModal(day) {
      const dateStr = day
        ? (day.date instanceof Date ? day.date : new Date(day.date)).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
      this.newEvent = { title: '', date: dateStr, endDate: '', description: '', type: 'event' }
      this.showDayModal = false
      this.showAddEventModal = true
    },
    closeAddEventModal() {
      this.showAddEventModal = false
      this.newEvent = { title: '', date: '', endDate: '', description: '', type: 'event' }
    },
    async createCalendarEvent() {
      if (!this.newEvent.title.trim()) {
        this.showAlert(this.$t('calendar.titleRequired'), '', 'error')
        return
      }
      if (!this.newEvent.date) {
        this.showAlert(this.$t('calendar.dateRequired'), '', 'error')
        return
      }
      this.creatingEvent = true
      try {
        const res = await fetch('/api/events?action=create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-org-id': String(this.organizationId) },
          body: JSON.stringify(this.newEvent)
        })
        if (res.ok) {
          await this.loadCalendarEvents()
          this.closeAddEventModal()
          if (this.selectedDay) this.showDayModal = true
        } else {
          this.showAlert(this.$t('calendar.createError'), '', 'error')
        }
      } catch (e) {
        this.showAlert(this.$t('calendar.createError'), '', 'error')
      } finally {
        this.creatingEvent = false
      }
    },
    async deleteCalendarEvent(id) {
      try {
        const res = await fetch('/api/events?action=delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-org-id': String(this.organizationId) },
          body: JSON.stringify({ id })
        })
        if (res.ok) {
          await this.loadCalendarEvents()
          if (this.selectedDay) this.showDayModal = true
        } else {
          this.showAlert(this.$t('calendar.deleteError'), '', 'error')
        }
      } catch (e) {
        this.showAlert(this.$t('calendar.deleteError'), '', 'error')
      }
    },
    openEventDetailModal(ev) {
      this.selectedEvent = ev
      this.showDayModal = false
      this.showEventDetailModal = true
    },
    closeEventDetailModal() {
      this.showEventDetailModal = false
      this.selectedEvent = null
    },
    calendarEventTypeClass(type) {
      const map = { competition: 'type-competition', training: 'type-training', meeting: 'type-meeting', other: 'type-other' }
      return map[type] || 'type-event'
    },
    formatCalendarDate(dateStr) {
      const d = new Date(dateStr)
      return d.toLocaleDateString(this.$i18n.locale === 'sv' ? 'sv-SE' : 'en-GB', { day: 'numeric', month: 'short' })
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
      } else if (action === 'download-pdf') {
        await this.downloadPdfFile()
      } else if (action === 'create-invoice') {
        if (this.clubMembers.length === 0) {
          try {
            const response = await getOrganizationMembers(this.organizationId)
            this.teamMembers = response.teamMembers
            this.clubMembers = response.clubMembers
          } catch (error) {
            console.error('Failed to load members for invoice:', error)
          }
        }
        this.showInvoiceModal = true
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
        this.showAlert(this.$t('dashboard.alerts.infoTitle'), this.$t('dashboard.alerts.featureComing', { feature: action }), 'info')
      }
    },
    handleViewAllAlerts() {
      console.log('View all alerts')
      this.showAlert(this.$t('dashboard.alerts.infoTitle'), this.$t('dashboard.alerts.actionPage'), 'info')
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
        this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('dashboard.alerts.swishError'), 'error')
      }
    },
    closeSwishStatusModal() {
      this.showSwishStatusModal = false
    },
    translateSwishStatus(status) {
      const key = `dashboard.swishStatus.${status}`
      return this.$t(key) !== key ? this.$t(key) : status
    },
    async handleViewMembers() {      
      try {
        const response = await getOrganizationMembers(this.organizationId)
        this.teamMembers = response.teamMembers
        this.clubMembers = response.clubMembers
        this.showMembersModal = true
      } catch (error) {
        console.error('Failed to load members:', error)
        this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('dashboard.alerts.membersError'), 'error')
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
        this.showAlert(this.$t('dashboard.alerts.noRecipients'), this.$t('dashboard.alerts.noUnpaidPhones'), 'warning')
        return
      }

      const totalAmount = unpaidMembers.reduce((sum, m) => sum + m.fee, 0)
      
      this.showConfirm(
        this.$t('dashboard.alerts.sendRequests'),
        this.$t('dashboard.alerts.confirmSend', { count: unpaidMembers.length, amount: totalAmount }),
        async () => {
          const defaultAccountId = this.accounts.length > 0 ? this.accounts[0].id : null
          await this.processUnpaidRequests(unpaidMembers, defaultAccountId)
        }
      )
    },
    async processUnpaidRequests(unpaidMembers, defaultAccountId) {
      if (this.unpaidMembers === 0) {
        this.showAlert(this.$t('dashboard.alerts.noUnpaid'), this.$t('dashboard.alerts.noUnpaidToSend'), 'info');
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
        this.showAlert(this.$t('dashboard.alerts.swishNotConfiguredTitle'), configError, 'show-settings-link')
        return
      }
      
      let message = this.$t('dashboard.alerts.bulkRequestSuccess', { successCount })
      if (failCount > 0) {
        message += `\n\n${this.$t('dashboard.alerts.bulkRequestFail', { failCount })}`
        
        // Add sample errors to message
        if (errors.length > 0) {
          const sampleErrors = errors.slice(0, 3).join('\n');
          message += `\n\n${this.$t('dashboard.alerts.bulkRequestError')}\n${sampleErrors}`;
          
          if (errors.length > 3) {
            message += `\n${this.$t('dashboard.alerts.bulkRequestMore', { count: errors.length - 3 })}`;
          }
        }
      }
      
      const title = failCount > 0 ? this.$t('dashboard.alerts.doneWithErrors') : this.$t('dashboard.alerts.done');
      this.showAlert(title, message, failCount > 0 ? 'warning' : 'success')
      this.loadDashboard() // Refresh data
    },
    requestPaymentForMember(member) {
      if (!member.phone) {
        this.showAlert(this.$t('dashboard.alerts.missingInfo'), this.$t('dashboard.alerts.noPhone'), 'warning');
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
        this.$t('dashboard.alerts.changeRole'),
        this.$t('dashboard.alerts.confirmChangeRole', {
          user: member.user.name,
          oldRole: this.translateRole(member.role),
          newRole: this.translateRole(newRole)
        }),
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
            this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('dashboard.alerts.updateRoleError'), 'error')
          }
        }
      )
    },
    async removeTeamMember(member) {
      this.showConfirm(
        this.$t('dashboard.alerts.removeMember'),
        this.$t('dashboard.alerts.confirmRemoveTeamMember', { user: member.user.name }),
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
            this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('dashboard.alerts.removeTeamMemberError'), 'error')
          }
        }
      )
    },
    async removeClubMember(member) {
      this.showConfirm(
        this.$t('dashboard.alerts.removeMember'),
        this.$t('dashboard.alerts.confirmRemoveClubMember', { user: member.name }),
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
            this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('dashboard.alerts.removeClubMemberError'), 'error')
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
        this.showAlert(this.$t('dashboard.alerts.noPermissionTitle'), this.$t('dashboard.clubMemberDetailModal.adminNote'), 'error')
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
        this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('dashboard.alerts.updatePaymentError'), 'error')
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
      const validFiles = files.filter(file => file.type.startsWith('image/'))
      // Only one receipt at a time
      if (validFiles.length > 0) {
        this.selectedFiles = [validFiles[0]]
      }
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
      return this.$t(`dashboard.roles.${role}`)
    },
    translateMemberType(type) {
      if (!type) return ''
      return this.$t(`memberTypes.${type}`)
    },
    async uploadFiles() {
      if (!this.selectedFiles.length) return
      this.parsingReceipt = true
      try {
        const file = this.selectedFiles[0]
        const { createWorker } = await import('tesseract.js')
        const worker = await createWorker(['swe', 'eng'])
        const { data: { text } } = await worker.recognize(file)
        await worker.terminate()
        const parsed = this.parseReceiptText(text)
        this.newExpense = {
          description: parsed.description,
          amount: parsed.amount,
          category: '',
          date: parsed.date || new Date().toISOString().split('T')[0],
          notes: ''
        }
        this.closeUploadModal()
        this.showExpenseModal = true
      } catch (e) {
        console.error('Receipt OCR failed:', e)
        this.showAlert(
          this.$t('dashboard.alerts.errorTitle'),
          this.$t('dashboard.uploadModal.analyzeError'),
          'error'
        )
      } finally {
        this.parsingReceipt = false
      }
    },
    parseReceiptText(text) {
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      // Find all currency-like numbers and take the largest (most likely the total)
      const amounts = [...text.matchAll(/(\d+[.,]\d{2})/g)]
        .map(m => parseFloat(m[1].replace(',', '.')))
      const amount = amounts.length ? Math.max(...amounts) : 0
      // First non-trivial line that doesn't start with a digit = merchant name
      const description = lines.find(l => l.length > 3 && !/^\d/.test(l)) || lines[0] || ''
      // Look for date patterns YYYY-MM-DD or DD/MM/YYYY or DD.MM.YYYY
      const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})|(\d{2}[\/\.]\d{2}[\/\.]\d{4})/)
      let date = ''
      if (dateMatch) {
        if (dateMatch[1]) {
          date = dateMatch[1]
        } else {
          const parts = dateMatch[2].split(/[\/\.]/)
          date = `${parts[2]}-${parts[1]}-${parts[0]}`
        }
      }
      return { description, amount, date }
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
          this.showAlert(this.$t('dashboard.alerts.warningTitle'), this.$t('dashboard.alerts.noOrgSelected'), 'warning')
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
        this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('dashboard.alerts.addMemberError'), 'error')
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
          this.showAlert(this.$t('dashboard.alerts.warningTitle'), this.$t('dashboard.alerts.noOrgSelected'), 'warning')
          return
        }
        
        // Get or create a default account
        let accountId = this.accounts[0]?.id
        if (!accountId) {
          this.showAlert(this.$t('dashboard.alerts.warningTitle'), this.$t('dashboard.alerts.noAccount'), 'warning')
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
        this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('dashboard.alerts.incomeError'), 'error')
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
          this.showAlert(this.$t('dashboard.alerts.warningTitle'), this.$t('dashboard.alerts.noOrgSelected'), 'warning')
          return
        }
        
        // Get or create a default account
        let accountId = this.accounts[0]?.id
        if (!accountId) {
          this.showAlert(this.$t('dashboard.alerts.warningTitle'), this.$t('dashboard.alerts.noAccount'), 'warning')
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
        this.showAlert(this.$t('dashboard.alerts.errorTitle'), this.$t('dashboard.alerts.expenseError'), 'error')
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
        this.showAlert(this.$t('dashboard.alerts.missingInfo'), this.$t('dashboard.alerts.enterPhone'), 'warning');
        return;
      }

      this.showConfirm(
        this.$t('dashboard.alerts.sendRequest'),
        this.$t('dashboard.alerts.confirmSendRequest', { phone: this.swishPayment.phone, amount: this.swishPayment.amount }),
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
          const errorMsg = error.message || error.error || this.$t('dashboard.alerts.createRequestError')
          console.error('Swish API error details:', error)
          throw new Error(errorMsg)
        }

        const paymentRequest = await response.json()
        
        this.showAlert(this.$t('dashboard.alerts.paymentSent'), this.$t('dashboard.alerts.paymentRequested', { phone: this.swishPayment.phone, amount: this.swishPayment.amount }), 'success')
        
        this.closeSwishModal()
        
        // Reload data to show updated information
        await this.loadDashboard()
      } catch (error) {
        console.error('Failed to request Swish payment:', error)
        this.showAlert(this.$t('dashboard.alerts.paymentError'), this.$t('dashboard.alerts.requestErrorPrefix') + error.message, 'error')
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
  color: var(--text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--background);
  border-top-color: var(--primary-light);
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
  background: var(--surface);
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
  color: var(--text);
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
  color: var(--text);
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
  color: var(--text-secondary);
  margin: 0;
  opacity: 0.8;
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
  background: var(--surface);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 1.0625rem;
  color: var(--text);
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
  color: var(--text-secondary);
  opacity: 0.7;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.stat-amount {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text);
}

.stat-card-compact.income .stat-amount {
  color: #22c55e;
}

.stat-card-compact.expense .stat-amount {
  color: #ef4444;
}

.actions-panel {
  background: var(--surface);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  flex: 1;
}

.actions-panel h3 {
  font-size: 0.9rem;
  color: var(--text);
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
  color: var(--text-secondary);
  font-weight: 500;
}

.member-value {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--text);
}

.member-value.paid {
  color: #22c55e;
}

.member-value.unpaid {
  color: #ef4444;
}

.breakdown-panel {
  background: var(--surface);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.breakdown-panel h3 {
  font-size: 1.125rem;
  color: var(--text);
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
  color: var(--text-secondary);
  font-weight: 500;
}

.breakdown-value {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--text);
}

.member-stats-compact {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.panel-header-title {
  font-size: 1.125rem;
  color: var(--text);
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
  background: var(--surface);
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
  color: var(--text);
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
  border-color: var(--primary-medium);
  transform: translateY(-2px);
}

.quick-action-card:hover .action-icon,
.quick-action-card:hover .action-text {
  color: white;
}

.action-icon {
  font-size: 1.625rem;
  font-weight: 700;
  color: var(--text);
}

.action-text {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text);
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
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-date {
  font-size: 0.9375rem;
  color: var(--text-secondary);
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
  min-height: 0;
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
  color: var(--text);
}

.alert-text {
  font-size: 1.0625rem;
  color: var(--text);
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
  background-color: var(--overlay-bg);
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
  background: var(--surface);
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
  color: var(--text);
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--text-secondary);
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
  color: var(--text);
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
  color: var(--text);
  margin: 0.5rem 0;
}

.upload-subtext {
  font-size: 0.9rem;
  color: var(--text-secondary);
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
  color: var(--text-secondary);
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
  color: var(--text);
  margin: 0 0 1rem 0;
  font-weight: 600;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--surface);
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
  color: var(--text);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 0.8rem;
  color: var(--text-secondary);
  opacity: 0.7;
}

.remove-file-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
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
  color: var(--text-secondary);
}

.cancel-btn:hover {
  background: #e2e8f0;
}

.submit-btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: var(--primary-light);
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background-color: var(--primary-medium);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.submit-btn:disabled {
  background-color: #cbd5e1;
  cursor: not-allowed;
  opacity: 0.6;
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
  color: var(--text);
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text);
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
  color: var(--text-secondary);
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
  color: var(--text-secondary);
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
  color: var(--text);
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
  color: var(--text-secondary);
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
  color: var(--text);
  margin-bottom: 1rem;
}

.auth-modal-content p {
  font-size: 1.1rem;
  color: var(--text-secondary);
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
  color: var(--text);
  margin-bottom: 1rem;
  padding-left: 1rem;
  border-left: 4px solid var(--primary-medium);
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
  color: var(--text);
  margin-bottom: 0.25rem;
}

.member-email {
  font-size: 0.875rem;
  color: var(--text-secondary);
  opacity: 0.7;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-meta {
  font-size: 0.75rem;
  color: var(--text-secondary);
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
  background: var(--border);
  color: var(--text);
}

.member-joined {
  font-size: 0.875rem;
  color: var(--text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}

.no-members {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--text-secondary);
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
  color: var(--text);
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
  color: var(--text-secondary);
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text);
}

.payment-status-section {
  background: var(--background);
  border-radius: 8px;
  padding: 1.5rem;
}

.payment-status-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
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
  color: var(--text);
}

.payment-note {
  font-size: 0.875rem;
  color: var(--text-secondary);
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
  color: var(--text-secondary);
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
  background-color: var(--surface-alt);
  color: var(--text-secondary);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-right: 8px;
  vertical-align: middle;
  border: 1px solid var(--border);
}


/* ── Invoice Modal ──────────────────────────────────────────────────────── */
.invoice-modal-content {
  max-width: 560px;
  width: 100%;
}

.invoice-preview-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.invoice-preview-card {
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  font-size: 0.9rem;
}

.invoice-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: var(--btn-dark);
  color: var(--btn-dark-text);
  padding: 1.1rem 1.4rem;
}

.invoice-preview-org {
  font-size: 1.05rem;
  font-weight: 700;
}

.invoice-preview-label {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 2px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.invoice-preview-number {
  font-size: 1.15rem;
  font-weight: 700;
  color: #e2e8f0;
}

.invoice-preview-meta {
  display: flex;
  gap: 2rem;
  padding: 0.9rem 1.4rem;
  border-bottom: 1px solid var(--border-light);
}

.preview-meta-label {
  display: block;
  font-size: 0.72rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.preview-meta-value {
  font-weight: 600;
  color: var(--text);
}

.invoice-preview-desc {
  padding: 0.75rem 1.4rem;
  border-bottom: 1px solid var(--border-light);
}

.invoice-preview-desc p {
  margin: 4px 0 0;
  color: var(--text);
}

.invoice-preview-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 1.4rem;
  background: var(--surface-alt);
  font-weight: 600;
  color: var(--text);
}

.preview-total-amount {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
}

.invoice-preview-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.invoice-action-btn {
  flex: 1;
  min-width: 140px;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}

.invoice-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.invoice-action-btn:not(:disabled):hover {
  opacity: 0.88;
  transform: translateY(-1px);
}

.invoice-action-btn.pdf-btn {
  background: var(--btn-dark);
  color: var(--btn-dark-text);
}

.invoice-action-btn.send-btn {
  background: #4f46e5;
  color: #fff;
}

.invoice-no-email-note {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0;
}

/* ── Calendar Panel ─────────────────────────────────────────────────────── */
.calendar-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  overflow: hidden;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-light);
  flex-wrap: wrap;
  gap: 0.5rem;
}

.calendar-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cal-nav-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-size: 1.1rem;
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.cal-nav-btn:hover {
  background: var(--surface-alt);
}

.cal-month-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text);
  min-width: 130px;
  text-align: center;
}

.calendar-header-actions {
  display: flex;
  gap: 0.4rem;
}

.cal-today-btn {
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.3rem 0.7rem;
  font-size: 0.78rem;
  cursor: pointer;
  color: var(--text);
  font-weight: 500;
  transition: background 0.15s;
}

.cal-today-btn:hover {
  background: var(--border);
}

.cal-add-btn {
  background: #2d6a4f;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.3rem 0.7rem;
  font-size: 0.78rem;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.15s;
}

.cal-add-btn:hover {
  background: #1b4332;
}

.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 0.4rem 0.75rem 0;
  gap: 2px;
}

.cal-weekdays span {
  text-align: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  padding: 0.25rem 0.75rem;
}

.cal-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  transition: background 0.12s;
  min-width: 0;
}

.cal-day:hover {
  background: var(--surface-alt);
}

.cal-day-num {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text);
  line-height: 1;
}

.cal-day.cal-other-month .cal-day-num {
  color: var(--border);
}

.cal-day.cal-today {
  background: #d1fae5;
}

.cal-day.cal-today .cal-day-num {
  color: #065f46;
  font-weight: 700;
}

.cal-day.cal-selected {
  background: #2d6a4f;
}

.cal-day.cal-selected .cal-day-num {
  color: #fff;
  font-weight: 700;
}

.cal-day.cal-selected .cal-dot {
  background: #a7f3d0;
}

.cal-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #2d6a4f;
  margin-top: 2px;
}

/* Day Modal */
.day-modal-content {
  max-width: 420px;
  width: 95%;
}

.day-modal-date {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  text-transform: capitalize;
}

.day-modal-body {
  padding: 0.5rem 1.5rem 1rem;
  min-height: 80px;
}

.day-modal-empty {
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.95rem;
  padding: 1.5rem 0;
}

.day-modal-event-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid var(--border-light);
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.12s;
}

.day-modal-event-row:hover {
  background: var(--surface-alt);
}

.day-modal-event-row:last-child {
  border-bottom: none;
}

.day-modal-event-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.day-modal-event-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
}

.day-modal-event-type {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-top: 1px;
}

.day-modal-event-chevron {
  color: var(--text-secondary);
  font-size: 1.25rem;
  line-height: 1;
}

.cal-event-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 3px;
  flex-shrink: 0;
}

.cal-event-dot.type-event { background: #2d6a4f; }
.cal-event-dot.type-competition { background: #dc2626; }
.cal-event-dot.type-training { background: #2563eb; }
.cal-event-dot.type-meeting { background: #d97706; }
.cal-event-dot.type-other { background: #6b7280; }

.cal-event-delete {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 1rem;
  padding: 0 2px;
  line-height: 1;
  flex-shrink: 0;
  transition: color 0.12s;
}

.cal-event-delete:hover {
  color: #dc2626;
}

/* Add Event Modal */
.event-modal-content {
  max-width: 460px;
  width: 95%;
}

/* Event Detail Modal */
.event-detail-modal {
  max-width: 480px;
  width: 95%;
}

.event-detail-body {
  padding: 1.5rem 2rem;
}

.event-detail-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 1rem;
  line-height: 1.3;
}

.event-detail-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.event-detail-type-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  text-transform: uppercase;
}

.event-detail-type-badge.type-event { background: #d1fae5; color: #065f46; }
.event-detail-type-badge.type-competition { background: #fee2e2; color: #b91c1c; }
.event-detail-type-badge.type-training { background: #dbeafe; color: #1d4ed8; }
.event-detail-type-badge.type-meeting { background: #fef3c7; color: #b45309; }
.event-detail-type-badge.type-other { background: var(--surface-alt); color: var(--text-secondary); }

.event-detail-date {
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.event-detail-section {
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.event-detail-section label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.event-detail-desc {
  font-size: 1rem;
  color: var(--text);
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.event-detail-empty {
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-style: italic;
  margin: 0;
}

.event-detail-delete-btn {
  padding: 0.75rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: #fee2e2;
  color: #b91c1c;
  transition: background 0.2s;
}

.event-detail-delete-btn:hover {
  background: #fecaca;
}
</style>

<style>
/* PNG quick-action / header icons don't inherit color — make them white on dark themes and on hover */
[data-theme="dark"] .quick-action-card .action-icon-img,
[data-theme="midnight"] .quick-action-card .action-icon-img,
[data-theme="dark"] .header-btn .action-icon-img,
[data-theme="midnight"] .header-btn .action-icon-img {
  filter: brightness(0) invert(1);
  opacity: 0.95;
}

.quick-action-card:hover .action-icon-img,
.header-btn:hover .action-icon-img {
  filter: brightness(0) invert(1);
  opacity: 1;
}
</style>

