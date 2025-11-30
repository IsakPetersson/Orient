// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('TechshipProto loaded successfully!');
    initializeApp();
});

// Initialize app
function initializeApp() {
    smoothScrolling();
    animateOnScroll();
    handleContactForm();
}

// Smooth scrolling for navigation links
function smoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 60;
                const targetPosition = target.offsetTop - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Animate elements on scroll
function animateOnScroll() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe feature cards
    document.querySelectorAll('.feature-card, .stat, .service-item, .value-card, .faq-item').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

// Handle contact form submission
function handleContactForm() {
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // Get form data
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                organization: document.getElementById('organization').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };

            console.log('Form submitted:', formData);

            // Show success message (in production, this would send to a server)
            alert('Thank you for your message! We will get back to you soon.');
            form.reset();
        });
    }
}

// Button interactions
document.addEventListener('click', function (e) {
    if (e.target.matches('.btn')) {
        console.log('Button clicked:', e.target.textContent);
        // Add your button click handlers here
    }
});
