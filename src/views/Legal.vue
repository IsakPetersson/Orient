<template>
  <div class="legal-page">
    <div class="legal-container">
      <div class="legal-sidebar">
        <ul class="legal-nav">
          <li :class="{ active: currentTab === 'terms' }" @click="currentTab = 'terms'">
            {{ getNavLabel('terms') }}
          </li>
          <li :class="{ active: currentTab === 'privacy' }" @click="currentTab = 'privacy'">
            {{ getNavLabel('privacy') }}
          </li>
          <li :class="{ active: currentTab === 'dpa' }" @click="currentTab = 'dpa'">
            {{ getNavLabel('dpa') }}
          </li>
          <li :class="{ active: currentTab === 'cookies' }" @click="currentTab = 'cookies'">
            Cookiepolicy
          </li>
        </ul>
        <div class="lang-switch">
          <button 
            :class="{ active: $i18n.locale === 'sv' }" 
            @click="$i18n.locale = 'sv'"
          >🇸🇪 Svenska</button>
          <button 
            :class="{ active: $i18n.locale === 'en' }" 
            @click="$i18n.locale = 'en'"
          >🇬🇧 English</button>
        </div>
        <button class="back-btn" @click="$router.push('/')">← {{ $i18n.locale === 'sv' ? 'Tillbaka till Hem' : 'Back to Home' }}</button>
      </div>

      <div class="legal-content">
        <!-- Terms of Service -->
        <div v-if="currentTab === 'terms'" class="legal-section">
          <h1>{{ $i18n.locale === 'sv' ? 'Allmänna Villkor' : 'Terms of Service' }}</h1>
          <p class="last-updated">{{ $i18n.locale === 'sv' ? 'Gäller från' : 'Effective from' }}: 2026-02-18 | Version: 1.0</p>
          
          <div v-if="$i18n.locale === 'sv'" class="legal-text">
            <h2>1. Om Orient</h2>
            <p>Orient är ett molnbaserat bokföringssystem utvecklat för ideella föreningar och mindre organisationer i Sverige.</p>
            <p>Tjänsten möjliggör bland annat:</p>
            <ul>
                <li>Löpande bokföring</li>
                <li>Verifikationshantering</li>
                <li>SIE-export</li>
                <li>Hantering av konton och transaktioner</li>
                <li>Skapande av Swish-betalningsförfrågningar</li>
            </ul>
            <p>Orient tillhandahåller ett tekniskt system och lämnar inte redovisningsrådgivning.</p>

            <h2>2. Parter</h2>
            <p>Dessa villkor gäller mellan:</p>
            <p><strong>Orient (leverantören)</strong><br>
            Organisationsnummer: [DITT ORGNR]<br>
            E-post: [EMAIL]</p>
            <p>och</p>
            <p>Den organisation som registrerar konto i systemet (“Föreningen”)</p>

            <h2>3. Tjänstens användning</h2>
            <p>Föreningen ansvarar för:</p>
            <ul>
                <li>Att bokföringen är korrekt och fullständig</li>
                <li>Att uppgifter som registreras är riktiga</li>
                <li>Att Swish-avtal är korrekt upprättat med bank</li>
                <li>Att organisationsnummer är korrekt angivet</li>
                <li>Att behöriga användare utses</li>
            </ul>
            <p>Orient ansvarar för:</p>
            <ul>
                <li>Tillhandahållande av systemet</li>
                <li>Rimlig teknisk tillgänglighet</li>
                <li>Säker lagring enligt gällande lag</li>
            </ul>

            <h2>4. Bokföring och lagkrav</h2>
            <p>Orient är utformat för att stödja bokföringsskyldiga organisationer enligt Bokföringslagen (1999:1078).</p>
            <p>Föreningen är ensam ansvarig för att bokföringen uppfyller lagens krav.</p>
            <p>Orient möjliggör export i SIE-format.</p>
            <p>Bokföringsdata sparas i minst 7 år i enlighet med lag.</p>

            <h2>5. Swish</h2>
            <p>Orient hanterar inte kundmedel.</p>
            <p>Alla betalningar sker direkt mellan Föreningens bank och betalaren.</p>
            <p>Orient är inte betaltjänstleverantör och omfattas inte av tillståndsplikt enligt lagen om betaltjänster.</p>
            <p>Föreningen ansvarar för att inneha giltigt avtal om Swish för Handel.</p>

            <h2>6. Abonnemang och betalning</h2>
            <p>Tjänsten tillhandahålls genom abonnemang.</p>
            <p>Avgift debiteras månadsvis eller årsvis.</p>
            <p>Uppsägningstid: 30 dagar.</p>
            <p>Ingen återbetalning sker för påbörjad period.</p>

            <h2>7. Ansvarsbegränsning</h2>
            <p>Orient ansvarar inte för:</p>
            <ul>
                <li>Indirekt skada</li>
                <li>Förlorad vinst</li>
                <li>Förlust till följd av felaktig bokföring</li>
            </ul>
            <p>Orients totala ansvar är begränsat till vad Föreningen betalat under de senaste 12 månaderna.</p>

            <h2>8. Uppsägning</h2>
            <p>Föreningen kan säga upp tjänsten när som helst.</p>
            <p>Vid uppsägning ges möjlighet att exportera data.</p>
            <p>Bokföringsdata kan sparas enligt lagkrav även efter uppsägning.</p>

            <h2>9. Tillämplig lag</h2>
            <p>Svensk lag gäller.</p>
            <p>Tvister avgörs i svensk domstol.</p>
          </div>

          <div v-else class="legal-text">
            <h2>1. About Orient</h2>
            <p>Orient is a cloud-based bookkeeping system designed for Swedish nonprofit organizations and small associations.</p>
            <p>The Service enables:</p>
            <ul>
                <li>Bookkeeping</li>
                <li>Voucher management</li>
                <li>SIE export</li>
                <li>Account and transaction management</li>
                <li>Swish payment request creation</li>
            </ul>
            <p>Orient provides a technical platform and does not offer accounting advice.</p>

            <h2>2. Parties</h2>
            <p>These terms apply between:</p>
            <p><strong>Orient (the Provider)</strong><br>
            Company registration number: [YOUR ORGNR]<br>
            Email: [EMAIL]</p>
            <p>and</p>
            <p>The organization registering an account (“the Organization”)</p>

            <h2>3. Use of the Service</h2>
            <p>The Organization is responsible for:</p>
            <ul>
                <li>Accuracy of bookkeeping</li>
                <li>Correct data entry</li>
                <li>Maintaining a valid Swish merchant agreement</li>
                <li>Providing correct organization number</li>
                <li>Assigning authorized users</li>
            </ul>
            <p>Orient is responsible for:</p>
            <ul>
                <li>Providing the platform</li>
                <li>Reasonable technical availability</li>
                <li>Secure data storage</li>
            </ul>

            <h2>4. Bookkeeping Compliance</h2>
            <p>The Service is designed to support compliance with the Swedish Bookkeeping Act (1999:1078).</p>
            <p>The Organization remains solely responsible for legal compliance.</p>
            <p>Data can be exported in SIE format.</p>
            <p>Accounting data is retained for at least 7 years.</p>

            <h2>5. Swish Payments</h2>
            <p>Orient does not handle or hold funds.</p>
            <p>All payments are made directly between the Organization’s bank and the payer.</p>
            <p>Orient is not a payment service provider.</p>
            <p>The Organization is responsible for maintaining a valid Swish Commerce agreement.</p>

            <h2>6. Subscription & Payment</h2>
            <p>The Service is provided on a subscription basis.</p>
            <p>Fees are charged monthly or annually.</p>
            <p>Notice period: 30 days.</p>
            <p>No refunds for commenced subscription periods.</p>

            <h2>7. Limitation of Liability</h2>
            <p>Orient is not liable for:</p>
            <ul>
                <li>Indirect damages</li>
                <li>Loss of profit</li>
                <li>Accounting errors made by the Organization</li>
            </ul>
            <p>Total liability is limited to fees paid during the previous 12 months.</p>

            <h2>8. Termination</h2>
            <p>The Organization may terminate at any time.</p>
            <p>Data export is available before termination.</p>
            <p>Bookkeeping data may be retained as required by law.</p>
          </div>
        </div>

        <!-- Privacy Policy -->
        <div v-if="currentTab === 'privacy'" class="legal-section">
          <h1>{{ $i18n.locale === 'sv' ? 'Integritetspolicy' : 'Privacy Policy' }}</h1> 
          <p class="last-updated">{{ $i18n.locale === 'sv' ? 'Senast uppdaterad' : 'Last updated' }}: 2026-02-18</p>

          <div v-if="$i18n.locale === 'sv'" class="legal-text">
            <h2>1. Roller</h2>
            <p>Föreningen är personuppgiftsansvarig.<br>
            Orient är personuppgiftsbiträde.</p>

            <h2>2. Vilka uppgifter behandlas</h2>
            <ul>
                <li>Namn</li>
                <li>E-postadress</li>
                <li>Hashat lösenord</li>
                <li>Organisationskoppling</li>
                <li>IP-adress</li>
                <li>Swish-relaterade uppgifter</li>
                <li>I framtiden: uppladdade kvitton</li>
            </ul>

            <h2>3. Ändamål</h2>
            <p>Personuppgifter behandlas för att:</p>
            <ul>
                <li>Tillhandahålla tjänsten</li>
                <li>Säkerställa säker inloggning</li>
                <li>Uppfylla bokföringskrav</li>
            </ul>

            <h2>4. Lagring</h2>
            <p>Data lagras inom EU.</p>
            <p>Överföring sker via krypterad anslutning (HTTPS).</p>
            <p>Swish-certifikat lagras krypterat.</p>

            <h2>5. Rättigheter</h2>
            <p>Registrerade har rätt att:</p>
            <ul>
                <li>Begära registerutdrag</li>
                <li>Begära rättelse</li>
                <li>Begära begränsning</li>
            </ul>
            <p>Bokföringsdata kan inte raderas under lagstadgad lagringstid.</p>
          </div>
          
          <div v-else class="legal-text">
            <h2>Roles</h2>
            <p>The Organization is the data controller.<br>
            Orient is the data processor.</p>

            <h2>Data Processed</h2>
            <ul>
                <li>Name</li>
                <li>Email address</li>
                <li>Hashed password</li>
                <li>Organization membership</li>
                <li>IP address</li>
                <li>Swish-related data</li>
                <li>Future: uploaded receipts</li>
            </ul>

            <h2>Purpose</h2>
            <p>Data is processed to:</p>
            <ul>
                <li>Provide the Service</li>
                <li>Ensure secure authentication</li>
                <li>Comply with bookkeeping laws</li>
            </ul>

            <h2>Storage</h2>
            <p>Data is stored within the EU.</p>
            <p>Encrypted transmission (HTTPS).</p>
            <p>Encrypted storage of Swish certificates.</p>

            <h2>Rights</h2>
            <p>Data subjects may request:</p>
            <ul>
                <li>Access</li>
                <li>Rectification</li>
                <li>Restriction of processing</li>
            </ul>
            <p>Accounting data cannot be erased during statutory retention period.</p>
          </div>
        </div>

        <!-- DPA -->
        <div v-if="currentTab === 'dpa'" class="legal-section">
           <h1>{{ $i18n.locale === 'sv' ? 'Personuppgiftsbiträdesavtal (PUB)' : 'Data Processing Agreement (DPA)' }}</h1>
           <p class="last-updated">{{ $i18n.locale === 'sv' ? 'Senast uppdaterad' : 'Last updated' }}: 2026-02-18</p>
           
           <div v-if="$i18n.locale === 'sv'" class="legal-text">
             <p>Orient behandlar personuppgifter enligt instruktion från Föreningen.</p>
             
             <h2>Säkerhetsåtgärder</h2>
             <ul>
                 <li>Krypterad överföring</li>
                 <li>Krypterad lagring av känsliga uppgifter</li>
                 <li>Rollbaserad åtkomst</li>
                 <li>Loggning av åtkomst</li>
             </ul>

             <h2>Underbiträden</h2>
             <ul>
                 <li>Vercel (hosting)</li>
                 <li>Databasleverantör (Vercel Postgres)</li>
             </ul>

             <p>Orient rapporterar personuppgiftsincidenter inom 72 timmar.</p>
           </div>
           
           <div v-else class="legal-text">
             <p>Orient processes personal data only on documented instructions.</p>
             
             <h2>Security Measures</h2>
             <ul>
                 <li>Encrypted communication</li>
                 <li>Encrypted sensitive storage</li>
                 <li>Role-based access control</li>
                 <li>Audit logging</li>
             </ul>

             <h2>Sub-processors</h2>
             <ul>
                 <li>Vercel (hosting)</li>
                 <li>Database provider (Vercel Postgres)</li>
             </ul>

             <p>Data breaches are reported within 72 hours.</p>
           </div>
        </div>

        <!-- Cookie Policy -->
        <div v-if="currentTab === 'cookies'" class="legal-section">
            <h1>Cookiepolicy</h1>
            
            <div v-if="$i18n.locale === 'sv'" class="legal-text">
                <p>Orient använder endast nödvändiga cookies för:</p>
                <ul>
                    <li>Autentisering (session cookie)</li>
                    <li>Säker inloggning</li>
                </ul>
                <p>Inga marknadsförings- eller spårningscookies används.</p>
            </div>
            
            <div v-else class="legal-text">
                <p>Orient uses only essential cookies for:</p>
                <ul>
                    <li>Session authentication</li>
                    <li>Secure login</li>
                </ul>
                <p>No marketing or tracking cookies are used.</p>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Legal',
  data() {
    return {
      currentTab: 'terms'
    }
  },
  mounted() {
    // Check URL query param to open specific tab if needed
    if (this.$route.query.tab) {
      this.currentTab = this.$route.query.tab
    }
  },
  methods: {
    getNavLabel(tab) {
      if (this.$i18n.locale === 'sv') {
        const labels = {
          terms: 'Användarvillkor',
          privacy: 'Integritetspolicy',
          dpa: 'Personuppgiftsbiträdesavtal',
          cookies: 'Cookiepolicy'
        }
        return labels[tab] || tab
      } else {
         const labels = {
          terms: 'Terms of Service',
          privacy: 'Privacy Policy',
          dpa: 'Data Processing Agreement',
          cookies: 'Cookie Policy'
        }
        return labels[tab] || tab
      }
    }
  }
}
</script>

<style scoped>
.legal-page {
  padding: 2rem;
  background-color: var(--marketing-band-muted);
  min-height: 100vh;
}

.legal-container {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  gap: 2rem;
  background: var(--surface);
  border-radius: 12px;
  border: 1px solid var(--border);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  min-height: 600px;
}

.legal-sidebar {
  width: 300px;
  background: var(--surface-alt);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
}

.legal-nav {
  list-style: none;
  padding: 0;
  margin: 0;
  margin-bottom: 2rem;
}

.legal-nav li {
  padding: 1rem;
  cursor: pointer;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
  font-weight: 500;
  transition: all 0.2s;
}

.legal-nav li:hover {
  background: var(--surface);
  color: var(--text);
}

.legal-nav li.active {
  background: var(--surface);
  color: var(--text);
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border-left: 4px solid var(--primary-light);
}

.lang-switch {
  margin-bottom: auto;
  display: flex;
  gap: 0.5rem;
}

.lang-switch button {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--input-bg);
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.lang-switch button.active {
  background: var(--surface-alt);
  color: var(--text);
  border-color: var(--primary-light);
  font-weight: 600;
}

.legal-content {
  flex: 1;
  padding: 3rem;
  overflow-y: auto;
}

.legal-section h1 {
  margin-top: 0;
  color: var(--text);
  font-size: 2rem;
}

.last-updated {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.legal-text h2 {
  color: var(--text);
  font-size: 1.25rem;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.legal-text p {
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 1rem;
}

.legal-text ul {
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.back-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  margin-top: 2rem;
}

.back-btn:hover {
  color: var(--text);
}

@media (max-width: 1024px) {
  .legal-container {
    flex-direction: column;
    min-height: auto;
  }
  
  .legal-sidebar {
    width: 100%;
    padding: 1rem;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }

  .legal-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .legal-nav li {
    padding: 0.6rem 1rem;
    margin-bottom: 0;
    font-size: 0.9rem;
  }

  .legal-content {
    padding: 2rem;
  }

  .legal-section h1 {
    font-size: 1.75rem;
  }
}

@media (max-width: 768px) {
  .legal-page {
    padding: 1rem;
  }

  .legal-content {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .legal-page {
    padding: 0.75rem;
  }

  .legal-content {
    padding: 1rem;
  }

  .legal-nav li {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }
}
</style>