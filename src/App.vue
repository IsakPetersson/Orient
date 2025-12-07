<template>
  <div id="app">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <router-link to="/">
            <img src="./assets/images/orient-logo.png" alt="Orient Logo" class="logo-image" />
          </router-link>
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
  width: 240px;
  background-color: var(--primary-dark);
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.sidebar-header {
  padding: 1.5rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
  width: 140px;
  height: auto;
  transition: transform 0.3s ease;
}

.logo-image:hover {
  transform: scale(1.05);
}



.sidebar-nav {
  flex: 1;
  padding: 1.5rem 0;
}

.nav-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-links li {
  margin-bottom: 0.5rem;
}

.nav-links a {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
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
  border-left: 4px solid var(--text-light);
}

.nav-links a.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.nav-links a.sub-item {
  padding-left: 2.5rem;
  font-size: 0.9rem;
}

.nav-icon {
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
}

.nav-text {
  font-size: 1rem;
}

.main-content {
  margin-left: 240px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

@media (max-width: 768px) {
  .sidebar {
    width: 200px;
  }

  .main-content {
    margin-left: 200px;
  }

  .logo {
    font-size: 1.2rem;
  }

  .nav-text {
    font-size: 0.9rem;
  }
}
</style>
