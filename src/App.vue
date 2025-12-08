<template>
  <div id="app">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div>
          <span class="logo-text">Orient</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <ul class="nav-links">
          <li>
            <router-link to="/" exact-active-class="active">
              <span class="nav-icon">○</span>
              <span class="nav-text">Hem</span>
            </router-link>
          </li>
          <li>
            <router-link to="/dashboard" active-class="active">
              <span class="nav-icon">■</span>
              <span class="nav-text">Dashboard</span>
            </router-link>
          </li>
          <li>
            <router-link to="/about" active-class="active">
              <span class="nav-icon">?</span>
              <span class="nav-text">Om Oss</span>
            </router-link>
          </li>
          <li>
            <router-link to="/contact" active-class="active">
              <span class="nav-icon">@</span>
              <span class="nav-text">Kontakt</span>
            </router-link>
          </li>
        </ul>
      </nav>
    </aside>

    <div class="main-content">
      <router-view />

      
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  computed: {
    isDashboardRoute() {
      return this.$route.path === '/dashboard'
    }
  }
}
</script>

<style scoped>
#app {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: clamp(200px, 15vw, 240px);
  background-color: var(--primary-dark);
  box-shadow: clamp(1px, 0.2vw, 2px) 0 clamp(5px, 1vw, 10px) rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  transition: width 0.3s ease;
}

.sidebar-header {
  padding: clamp(1rem, 2vh, 1.5rem) clamp(0.75rem, 1.5vw, 1rem);
  border-bottom: clamp(0.5px, 0.1vh, 1px) solid rgba(255, 255, 255, 0.1);
}

.logo {
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo a {
  display: block;
  text-decoration: none;
}

.logo-image {
  width: clamp(100px, 12vw, 140px);
  height: auto;
  transition: transform 0.3s ease;
}

.logo-image:hover {
  transform: scale(1.05);
}

.logo-text {
  font-size: clamp(1.2rem, 2.5vh, 1.75rem);
  font-weight: 700;
  color: var(--text-light);
  letter-spacing: clamp(0.02em, 0.3vh, 0.05em);
  text-transform: uppercase;
  display: block;
  transition: all 0.3s ease;
}

.logo-text:hover {
  color: var(--background);
  transform: translateX(2px);
}

.sidebar-nav {
  flex: 1;
  padding: clamp(1rem, 2vh, 1.5rem) 0;
}

.nav-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-links li {
  margin-bottom: clamp(0.25rem, 0.5vh, 0.5rem);
}

.nav-links a {
  display: flex;
  align-items: center;
  gap: clamp(0.5rem, 1.5vw, 1rem);
  padding: clamp(0.75rem, 1.5vh, 1rem) clamp(1rem, 2vw, 1.5rem);
  color: var(--text-light);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  opacity: 0.8;
}

.nav-links a:hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.05);
}

.nav-links a.active {
  opacity: 1;
  background-color: var(--primary-light);
  border-left: clamp(2px, 0.5vw, 4px) solid var(--text-light);
}

.nav-links a.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.nav-links a.sub-item {
  padding-left: clamp(1.5rem, 4vw, 2.5rem);
  font-size: clamp(0.8rem, 1.2vh, 0.9rem);
}

.nav-icon {
  font-size: clamp(1rem, 1.8vh, 1.2rem);
  width: clamp(20px, 3vw, 24px);
  text-align: center;
  flex-shrink: 0;
}

.nav-text {
  font-size: clamp(0.875rem, 1.5vh, 1rem);
}

.main-content {
  margin-left: clamp(200px, 15vw, 240px);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left 0.3s ease;
}

@media (max-width: 1024px) {
  .sidebar {
    width: clamp(180px, 20vw, 220px);
  }

  .main-content {
    margin-left: clamp(180px, 20vw, 220px);
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: clamp(160px, 25vw, 200px);
  }

  .main-content {
    margin-left: clamp(160px, 25vw, 200px);
  }

  .logo-text {
    font-size: clamp(0.9rem, 2vh, 1.1rem);
  }

  .nav-text {
    font-size: clamp(0.8rem, 1.3vh, 0.9rem);
  }

  .nav-icon {
    font-size: clamp(0.9rem, 1.5vh, 1.1rem);
    width: clamp(18px, 4vw, 22px);
  }

  .sidebar-header {
    padding: clamp(0.75rem, 1.5vh, 1rem) clamp(0.5rem, 1vw, 0.75rem);
  }

  .nav-links a {
    padding: clamp(0.5rem, 1.2vh, 0.75rem) clamp(0.75rem, 1.5vw, 1rem);
  }
}

@media (max-width: 480px) {
  .sidebar {
    width: clamp(140px, 30vw, 180px);
  }

  .main-content {
    margin-left: clamp(140px, 30vw, 180px);
  }

  .logo-text {
    font-size: clamp(0.8rem, 1.8vh, 1rem);
    letter-spacing: clamp(0.01em, 0.2vh, 0.03em);
  }

  .nav-text {
    font-size: clamp(0.75rem, 1.2vh, 0.85rem);
  }

  .nav-icon {
    font-size: clamp(0.8rem, 1.3vh, 1rem);
    width: clamp(16px, 5vw, 20px);
  }

  .sidebar-header {
    padding: clamp(0.5rem, 1.2vh, 0.75rem) clamp(0.5rem, 1vw, 0.75rem);
  }

  .nav-links a {
    padding: clamp(0.5rem, 1vh, 0.65rem) clamp(0.5rem, 1.2vw, 0.75rem);
    gap: clamp(0.4rem, 1.2vw, 0.6rem);
  }
}
</style>
