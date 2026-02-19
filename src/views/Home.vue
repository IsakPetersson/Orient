<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1>{{ $t('home.heroTitle') }}</h1>
        <p class="hero-subtitle">{{ $t('home.heroSubtitle') }}</p>
        <div class="hero-buttons">
          <button class="btn btn-primary" @click="$router.push('/login')">{{ $t('home.getStarted') }}</button>
          <button class="btn btn-secondary" @click="$router.push('/about')">{{ $t('home.learnMore') }}</button>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features">
      <div class="container">
        <h2 class="section-title">{{ $t('home.featuresTitle') }}</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <!-- Doc Storage -->
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <h3>{{ $t('home.docStorageTitle') }}</h3>
            <p>{{ $t('home.docStorageDesc') }}</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <!-- Financial Calc -->
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            </div>
            <h3>{{ $t('home.finCalcTitle') }}</h3>
            <p>{{ $t('home.finCalcDesc') }}</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <!-- Revenue -->
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
            <h3>{{ $t('home.revenueTitle') }}</h3>
            <p>{{ $t('home.revenueDesc') }}</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <!-- Member DB -->
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <h3>{{ $t('home.memberDbTitle') }}</h3>
            <p>{{ $t('home.memberDbDesc') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section id="about" class="about">
      <div class="container">
        <div class="about-text">
          <h2>{{ $t('home.aboutTitle') }}</h2>
          <p>{{ $t('home.aboutText1') }}</p>
          <p>{{ $t('home.aboutText2') }}</p>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="contact">
      <div class="container">
        <h2 class="section-title">{{ $t('home.contactTitle') }}</h2>
        <p class="contact-subtitle">{{ $t('home.contactSubtitle') }}</p>
        <button class="btn btn-primary" @click="$router.push('/login')">{{ $t('home.startTrial') }}</button>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>
