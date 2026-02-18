<template>
  <div class="legal-page">
    <div class="legal-container">
      <div class="legal-sidebar">
        <ul class="legal-nav">
          <li :class="{ active: currentTab === 'terms' }" @click="currentTab = 'terms'">
            Användarvillkor
          </li>
          <li :class="{ active: currentTab === 'privacy' }" @click="currentTab = 'privacy'">
            Integritetspolicy
          </li>
          <li :class="{ active: currentTab === 'dpa' }" @click="currentTab = 'dpa'">
            Personuppgiftsbiträdesavtal
          </li>
        </ul>
        <button class="back-btn" @click="$router.push('/')">← Tillbaka till Hem</button>
      </div>

      <div class="legal-content">
        <!-- Terms of Service -->
        <div v-if="currentTab === 'terms'" class="legal-section">
          <h1>Användarvillkor</h1>
          <p class="last-updated">Senast uppdaterad: 2026-02-18</p>
          
          <div class="legal-text">
            <h2>1. Introduktion</h2>
            <p>Välkommen till Orient ("Tjänsten"). Dessa användarvillkor reglerar din användning av vår plattform för medlems- och ekonomihantering. Genom att registrera ett konto eller använda Tjänsten accepterar du dessa villkor i sin helhet.</p>

            <h2>2. Tjänstens omfattning</h2>
            <p>Orient är en teknisk plattform som tillhandahåller verktyg för föreningar att hantera medlemsregister, betalningar via Swish och enkel bokföring. Vi agerar inte som bank eller finansiellt institut. Alla betalningar sker direkt mellan medlem och förening.</p>

            <h2>3. Användarkonton</h2>
            <p>Du ansvarar för att upprätthålla säkerheten för ditt konto och lösenord. Orient kan inte hållas ansvarigt för förlust eller skada som uppstår till följd av din underlåtenhet att uppfylla detta säkerhetsansvar.</p>

            <h2>4. Betalningar och Avgifter</h2>
            <p>Tjänsten kan vara föremål för avgifter enligt den prislista som gäller vid tidpunkten för avtalets ingående. Orient förbehåller sig rätten att ändra avgifterna med 30 dagars varsel.</p>

            <h2>5. Ansvarsbegränsning</h2>
            <p>Tjänsten tillhandahålls i "befintligt skick". Orient garanterar inte att Tjänsten alltid kommer att vara felfri eller avbrottsfri. Vi ansvarar inte för indirekta skador, såsom utebliven vinst eller dataförlust.</p>

            <h2>6. Uppsägning</h2>
            <p>Du kan när som helst avsluta ditt konto. Orient förbehåller sig rätten att stänga av konton som bryter mot dessa villkor eller gällande lag.</p>
          </div>
        </div>

        <!-- Privacy Policy -->
        <div v-if="currentTab === 'privacy'" class="legal-section">
          <h1>Integritetspolicy</h1> 
          <p class="last-updated">Senast uppdaterad: 2026-02-18</p>

          <div class="legal-text">
            <h2>1. Personuppgiftsansvar</h2>
            <p>När du använder Orient som förening är <strong>Föreningen Personuppgiftsansvarig</strong> för sina medlemmars data. Orient agerar som <strong>Personuppgiftsbiträde</strong> och behandlar endast data på uppdrag av Föreningen.</p>

            <h2>2. Vilka uppgifter vi samlar in</h2>
            <p>Vi samlar in information som du tillhandahåller oss, såsom namn, e-postadress, telefonnummer samt data relaterad till din förenings verksamhet (medlemshistorik, betalningar).</p>

            <h2>3. Hur vi använder uppgifterna</h2>
            <p>Vi använder uppgifterna för att tillhandahålla, driva och förbättra våra tjänster, samt för att kommunicera med dig gällande tjänsterelaterade frågor.</p>

            <h2>4. Datadelning</h2>
            <p>Vi säljer aldrig dina personuppgifter. Vi delar endast data med underleverantörer som krävs för att driva tjänsten (t.ex. serverleverantörer, betaltjänster).</p>

            <h2>5. Dina rättigheter</h2>
            <p>Du har rätt att begära tillgång till, rättelse av eller radering av dina personuppgifter. Kontakta oss på support@orient.se för att utöva dessa rättigheter.</p>
          </div>
        </div>

        <!-- DPA Placeholder -->
        <div v-if="currentTab === 'dpa'" class="legal-section">
           <h1>Personuppgiftsbiträdesavtal (PUB)</h1>
           <p class="last-updated">Senast uppdaterad: 2026-02-18</p>
           
           <div class="legal-text">
             <p>Detta är en sammanfattning av vårt Personuppgiftsbiträdesavtal som gäller mellan Orient (Biträdet) och Föreningen (Ansvarig).</p>
             
             <h2>1. Behandlingens art och ändamål</h2>
             <p>Biträdet åtar sig att behandla personuppgifter endast i enlighet med Ansvarigs instruktioner och för att fullgöra leveransen av Tjänsten.</p>

             <h2>2. Säkerhet</h2>
             <p>Biträdet ska vidta lämpliga tekniska och organisatoriska åtgärder för att skydda personuppgifterna.</p>

             <h2>3. Underbiträden</h2>
             <p>Biträdet har rätt att anlita underbiträden för drift av servrar och databaser. En fullständig lista över underbiträden finns tillgänglig på begäran.</p>
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
  }
}
</script>

<style scoped>
.legal-page {
  padding: 2rem;
  background-color: #f8fafc;
  min-height: 100vh;
}

.legal-container {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  gap: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-height: 600px;
}

.legal-sidebar {
  width: 300px;
  background: #f1f5f9;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.legal-nav {
  list-style: none;
  padding: 0;
  margin: 0;
}

.legal-nav li {
  padding: 1rem;
  cursor: pointer;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  color: var(--text-dark);
  font-weight: 500;
  transition: all 0.2s;
}

.legal-nav li:hover {
  background: white;
  color: var(--primary-dark);
}

.legal-nav li.active {
  background: white;
  color: var(--primary-dark);
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border-left: 4px solid var(--primary-dark);
}

.legal-content {
  flex: 1;
  padding: 3rem;
  overflow-y: auto;
}

.legal-section h1 {
  margin-top: 0;
  color: var(--primary-dark);
  font-size: 2rem;
}

.last-updated {
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.legal-text h2 {
  color: #334155;
  font-size: 1.25rem;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.legal-text p {
  color: #475569;
  line-height: 1.7;
  margin-bottom: 1rem;
}

.back-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  margin-top: auto;
}

.back-btn:hover {
  color: var(--primary-dark);
}

@media (max-width: 768px) {
  .legal-container {
    flex-direction: column;
  }
  
  .legal-sidebar {
    width: 100%;
    padding: 1rem;
  }
}
</style>