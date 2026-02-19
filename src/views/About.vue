<template>
  <div class="about-page">
    <!-- About Hero -->
    <section class="page-hero">
      <div class="hero-content">
        <h1>{{ $t('about.title') }}</h1>
        <p class="hero-subtitle">{{ $t('about.subtitle') }}</p>
      </div>
    </section>

    <!-- Mission Section -->
    <section class="about-section">
      <div class="container">
        <div class="about-content-page">
          <h2>{{ $t('about.missionTitle') }}</h2>
          <p>{{ $t('about.missionText1') }}</p>
          <p>{{ $t('about.missionText2') }}</p>
        </div>
      </div>
    </section>
    <section class="story-section">
      <div class="container">
        <div class="about-content-page">
          <h2>{{ $t('about.storyTitle') }}</h2>
          <p>{{ $t('about.storyText1') }}</p>
          <p>{{ $t('about.storyText2') }}</p>
        </div>
      </div>
    </section>

    <!-- Values Section -->
    <section class="values-section">
      <div class="container">
        <h2 class="section-title">{{ $t('about.valuesTitle') }}</h2>
        <div class="values-grid">
          <div class="value-card">
            <h3>{{ $t('about.simplicityTitle') }}</h3>
            <p>{{ $t('about.simplicityDesc') }}</p>
          </div>
          <div class="value-card">
            <h3>{{ $t('about.accessibilityTitle') }}</h3>
            <p>{{ $t('about.accessibilityDesc') }}</p>
          </div>
          <div class="value-card">
            <h3>{{ $t('about.reliabilityTitle') }}</h3>
            <p>{{ $t('about.reliabilityDesc') }}</p>
          </div>
          <div class="value-card">
            <h3>{{ $t('about.communityTitle') }}</h3>
            <p>{{ $t('about.communityDesc') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="container">
        <h2>{{ $t('about.joinCommunity') }}</h2>
        <p>{{ $t('about.trustText') }}</p>
        <button class="btn btn-primary" @click="$router.push('/login')">{{ $t('about.getStartedToday') }}</button>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'About'
}
</script>
