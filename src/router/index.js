import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import About from '../views/About.vue'
import Services from '../views/Services.vue'
import Contact from '../views/Contact.vue'
import Login from '../views/login.vue'
import OrganizationSettings from '../views/OrganizationSettings.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/about',
        name: 'About',
        component: About
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: Services
    },
    {
        path: '/contact',
        name: 'Contact',
        component: Contact
    },
    {
        path: '/login',
        name: 'Login',
        component: Login
    },
    {
        path: '/settings',
        name: 'OrganizationSettings',
        component: OrganizationSettings
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
