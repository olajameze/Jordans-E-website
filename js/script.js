/* js/script.js - Main site & booking page behaviour */
/* Requires: flatpickr, emailjs */

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // Initialize EmailJS with public key (only on pages that need it)
    if (typeof emailjs !== 'undefined') {
        emailjs.init("cHFT-wrNq-nXjCQFq", {
            publicKey: "cHFT-wrNq-nXjCQFq",
        });
    }

    // Mobile Menu Functionality - Updated version
    function initMobileNavigation() {
        const menuBtn = document.querySelector('.menu-btn');
        const navLinks = document.querySelector('.nav-links');
        
        if (!menuBtn || !navLinks) return;
        
        function toggleMenu() {
            const isOpen = navLinks.classList.contains('active');
            navLinks.classList.toggle('active', !isOpen);
            menuBtn.classList.toggle('active', !isOpen);
            menuBtn.setAttribute('aria-expanded', String(!isOpen));
            document.body.style.overflow = isOpen ? '' : 'hidden';
        }
        
        menuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        });
        
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active') && 
                !navLinks.contains(e.target) && 
                !menuBtn.contains(e.target)) {
                toggleMenu();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('active')) {
                toggleMenu();
            }
        });
        
        // Close when clicking nav links (mobile)
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 768 && navLinks.classList.contains('active')) {
                    toggleMenu();
                }
            });
        });
        
        // Close menu on resize (if mobile menu is open)
        window.addEventListener('resize', () => {
            if (navLinks.classList.contains('active') && window.innerWidth > 768) {
                toggleMenu();
            }
        });
    }

    // Initialize mobile menu
    initMobileNavigation();

    const DEBUG = false; // set true for console debug logs

    function debug(...args) {
        if (DEBUG) console.log('[Debug]', ...args);
    }

    // --------- Helpers ---------
    function qs(selector, ctx = document) { return ctx.querySelector(selector); }
    function qsa(selector, ctx = document) { return Array.from((ctx || document).querySelectorAll(selector)); }
    function createEl(tag, props = {}) {
        const el = document.createElement(tag);
        Object.keys(props).forEach(k => el[k] = props[k]);
        return el;
    }

    // Accessible showMessage for forms
    function showMessage(message, type = 'info', target = null, timeout = 5000) {
        const container = target || qs('#booking-form') || document.body;
        if (!container) return;

        // remove existing message
        const existing = container.parentNode && container.parentNode.querySelector('.form-message');
        if (existing) existing.remove();

        const msg = createEl('div');
        msg.className = `form-message ${type}`;
        msg.textContent = message;
        msg.setAttribute('role', 'alert');
        
        if (container.parentNode) container.parentNode.insertBefore(msg, container);
        else document.body.appendChild(msg);

        if (timeout > 0) {
            setTimeout(() => { if (msg.parentNode) msg.remove(); }, timeout);
        }
    }

    // Basic email and phone validators
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    function isValidPhone(phone) {
        const cleaned = phone.replace(/[\s\-().]/g, '');
        return /^\+?\d{7,15}$/.test(cleaned);
    }

    // --------- Navigation (mobile menu + scroll effect) ---------
    function initNavigation() {
        const menuBtn = qs('.menu-btn') || qs('#menu-btn');
        const navLinks = qs('.nav-links');
        const navigation = qs('.navigation');

        if (!menuBtn || !navLinks || !navigation) {
            debug('Navigation elements missing');
            return;
        }

        // Toggle function
        function toggleMenu(open) {
            const isOpen = typeof open === 'boolean' ? open : !navLinks.classList.contains('active');
            navLinks.classList.toggle('active', isOpen);
            menuBtn.classList.toggle('active', isOpen);
            menuBtn.classList.toggle('open', isOpen);
            menuBtn.setAttribute('aria-expanded', String(isOpen));
        }

        menuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleMenu();
            debug('Toggled mobile menu');
        });

        // Close when clicking outside the nav (only when it's open)
        document.addEventListener('click', (e) => {
            if (!navLinks.classList.contains('active')) return;
            if (!navigation.contains(e.target)) {
                toggleMenu(false);
                debug('Closed menu via outside click');
            }
        });

        // Close when clicking a nav link (mobile)
        qsa('.nav-links a').forEach(link => {
            link.addEventListener('click', () => toggleMenu(false));
        });

        // Add/remove scrolled class on navigation based on scrollY
        function onScroll() {
            if (window.scrollY > 40) navigation.classList.add('scrolled');
            else navigation.classList.remove('scrolled');
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll(); // initial
    }

    // --------- Flatpickr (booking) ---------
    function initBookingCalendar() {
        const input = qs('#booking-date');
        if (!input || typeof flatpickr === 'undefined') {
            debug('No booking date input or flatpickr not loaded');
            return;
        }

        // Example: disable Sundays and set working hours
        flatpickr(input, {
            enableTime: true,
            dateFormat: "Y-m-d H:i",
            altInput: true,
            altFormat: "F j, Y h:i K",
            minDate: "today",
            maxDate: new Date().fp_incr(90), // 90 days out
            minuteIncrement: 15,
            time_24hr: false,
            minTime: "09:00",
            maxTime: "17:00",
            disable: [
                function(date) { return date.getDay() === 0; } // disable Sundays
            ],
            locale: { firstDayOfWeek: 1 } // Monday
        });
    }

    // Firefox playsinline fix
    function fixPlaysinline() {
        const video = document.getElementById('heroVideo');
        if (video && !video.hasAttribute('playsinline')) {
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true');
        }
    }

    // Handle cleanup when page is hidden or closed
    function handleCleanup() {
        // Add any cleanup tasks here
        const video = document.getElementById('heroVideo');
        if (video) {
            video.pause();
        }
    }

    // Call this function when the DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        fixPlaysinline();
    });

    // Use pagehide instead of unload
    window.addEventListener('pagehide', handleCleanup);
    // Also handle visibilitychange for better browser support
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') {
            handleCleanup();
        }
    });

// --------- Booking form: validation + EmailJS submit ---------
function initBookingForm() {
    const form = document.getElementById('booking-form');
    if (!form) {
        console.log('Booking form not present');
        return;
    }

    console.log('Initializing booking form');

    // Initialize EmailJS for booking form
    if (typeof emailjs !== 'undefined') {
        emailjs.init("cHFT-wrNq-nXjCQFq"); // Remove the nested config object
    }

    // Form submit handler
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Form submitted');
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        // Clear previous messages
        const messagesDiv = document.getElementById('form-messages');
        if (messagesDiv) {
            messagesDiv.textContent = '';
            messagesDiv.className = 'form-message';
        }

        // Validate form before sending
        if (!validateForm()) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            return;
        }

        // Collect form data
        const templateParams = {
            to_name: "Breazy Productions",
            from_name: form.name.value,
            email: form.email.value,
            phone_number: form.phone.value,
            project_type: form.event_type.value,
            preferred_date: form.booking_date.value,
            message: form.message.value,
            reply_to: form.email.value
        };

        console.log('Sending email with params:', templateParams);

        // Send email using EmailJS - simplified approach
        emailjs.send('service_cnon06x', 'template_65yg6dd', templateParams)
            .then(function(response) {
                console.log('SUCCESS!', response.status, response.text);
                if (messagesDiv) {
                    messagesDiv.textContent = 'Thank you! Your booking request has been sent. We\'ll get back to you within 48 hours.';
                    messagesDiv.className = 'form-message success';
                }
                form.reset();
                
                // Clear flatpickr if it exists
                const dateInput = document.getElementById('booking-date');
                if (dateInput && dateInput._flatpickr) {
                    dateInput._flatpickr.clear();
                }
            })
            .catch(function(error) {
                console.error('FAILED...', error);
                if (messagesDiv) {
                    messagesDiv.textContent = 'Sorry, there was a problem sending your message. Please try again or email us directly.';
                    messagesDiv.className = 'form-message error';
                }
            })
            .finally(function() {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            });
    });

    // Validate form function
    function validateForm() {
        const name = document.getElementById('name');
        const email = document.getElementById('email');
        const phone = document.getElementById('phone');
        const eventType = document.getElementById('event-type');
        const bookingDate = document.getElementById('booking-date');
        
        let isValid = true;
        
        // Reset error states
        document.querySelectorAll('.error-field').forEach(el => {
            el.classList.remove('error-field');
        });
        
        document.querySelectorAll('.error-text').forEach(el => {
            el.remove();
        });
        
        // Validate name
        if (!name.value.trim()) {
            name.classList.add('error-field');
            showFieldError(name, 'Name is required');
            isValid = false;
        }
        
        // Validate email
        if (!email.value.trim()) {
            email.classList.add('error-field');
            showFieldError(email, 'Email is required');
            isValid = false;
        } else if (!isValidEmail(email.value)) {
            email.classList.add('error-field');
            showFieldError(email, 'Please enter a valid email address');
            isValid = false;
        }
        
        // Validate phone
        if (!phone.value.trim()) {
            phone.classList.add('error-field');
            showFieldError(phone, 'Phone number is required');
            isValid = false;
        } else if (!isValidPhone(phone.value)) {
            phone.classList.add('error-field');
            showFieldError(phone, 'Please enter a valid phone number');
            isValid = false;
        }
        
        // Validate event type
        if (!eventType.value) {
            eventType.classList.add('error-field');
            showFieldError(eventType, 'Please select a project type');
            isValid = false;
        }
        
        // Validate booking date
        if (!bookingDate.value) {
            bookingDate.classList.add('error-field');
            showFieldError(bookingDate, 'Please select a date and time');
            isValid = false;
        }
        
        return isValid;
    }

    function showFieldError(field, message) {
        const error = document.createElement('div');
        error.className = 'error-text';
        error.textContent = message;
        field.parentNode.appendChild(error);
    }

    // Initialize date picker
    if (document.getElementById('booking-date')) {
        flatpickr("#booking-date", {
            enableTime: true,
            dateFormat: "Y-m-d H:i",
            minDate: "today",
            maxDate: new Date().fp_incr(90),
            minTime: "09:00",
            maxTime: "17:00",
            disable: [
                function(date) {
                    return date.getDay() === 0; // Disable Sundays
                }
            ]
        });
    }
}

    // Initialize the form when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        initBookingForm();
    });

    // --------- URL param status handler (show success/error after redirect) ---------
    function handleUrlStatus() {
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        if (!status) return;
        if (status === 'success') showMessage('Thank you! Your booking request has been sent.', 'success', qs('#booking-form') || document.body);
        if (status === 'error') showMessage('Sorry, there was an error sending your message. Please try again.', 'error', qs('#booking-form') || document.body);
    }

    // --------- Video fallback (hide video if it errors) ---------
    function initVideoFallback() {
        const video = qs('#hero-video');
        if (!video) return;
        video.addEventListener('error', () => {
            video.style.display = 'none';
            if (video.parentElement) video.parentElement.classList.add('video-fallback');
            debug('Hero video error - fallback shown');
        });
    }

    // --------- Viewport visibility / animation trigger ---------
    function initViewportObserver() {
        const items = qsa('.video-item, .animate-on-scroll');
        if (!items.length) return;

        // If IntersectionObserver available, use it (better performance)
        if ('IntersectionObserver' in window) {
            const obs = new IntersectionObserver((entries) => {
                entries.forEach(ent => {
                    if (ent.isIntersecting) {
                        ent.target.classList.add('visible');
                        // If you only want the animation once:
                        obs.unobserve(ent.target);
                    }
                });
            }, { threshold: 0.15 });

            items.forEach(i => obs.observe(i));
        } else {
            // Fallback to simple check on scroll
            function isInViewport(el) {
                const r = el.getBoundingClientRect();
                return r.top < (window.innerHeight || document.documentElement.clientHeight) && r.bottom > 0;
            }
            function onScroll() { items.forEach(i => { if (isInViewport(i)) i.classList.add('visible'); }); }
            window.addEventListener('scroll', onScroll, { passive: true });
            onScroll();
        }
    }

    // --------- Work Page Functionality ---------
    function initWorkPage() {
        // Check if we're on the work page
        if (!qs('.video-item')) return;
        
        // Filter functionality
        const filterButtons = qsa('.filter-btn');
        const videoItems = qsa('.video-item');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                button.classList.add('active');
                
                const filterValue = button.getAttribute('data-filter');
                
                // Filter videos
                videoItems.forEach(item => {
                    if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                        item.style.display = 'block';
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0)';
                        }, 10);
                    } else {
                        item.style.opacity = '0';
                        item.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            item.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
        
        // Video modal functionality
        const videoModal = qs('#videoModal');
        const modalVideo = qs('#modalVideo');
        const closeModal = qs('.close-modal');
        const playButtons = qsa('.play-button');
        
        if (videoModal && modalVideo && closeModal) {
            playButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const videoItem = this.closest('.video-item');
                    const videoSrc = videoItem.getAttribute('data-video-src');
                    const videoTitle = videoItem.querySelector('h3').textContent;
                    
                    // Set video source from data attribute
                    if (videoSrc) {
                        modalVideo.innerHTML = `<source src="${videoSrc}" type="video/mp4">`;
                        modalVideo.load();
                    }
                    
                    videoModal.classList.add('active');
                    document.body.style.overflow = 'hidden'; // Prevent scrolling
                });
            });
            
            closeModal.addEventListener('click', function() {
                videoModal.classList.remove('active');
                if (modalVideo) modalVideo.pause();
                document.body.style.overflow = ''; // Re-enable scrolling
            });
            
            // Close modal when clicking outside
            videoModal.addEventListener('click', function(e) {
                if (e.target === videoModal) {
                    videoModal.classList.remove('active');
                    if (modalVideo) modalVideo.pause();
                    document.body.style.overflow = '';
                }
            });
        }
    }

    // --------- Page Loader ---------
    function initPageLoader() {
        const loader = qs('.loader');
        if (loader) {
            window.addEventListener('load', function() {
                loader.classList.add('hidden');
            });
        }
    }

    // --------- Minimal polyfills / browser compatibility tweaks ---------
    function initPolyfills() {
        if (!Element.prototype.matches) {
            Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
        }
        // classList and querySelector exist in IE10+, we avoid heavy polyfills here
    }

    // --------- Init all ---------
    document.addEventListener('DOMContentLoaded', function () {
        debug('DOM ready');
        initPolyfills();
        initNavigation();
        initBookingCalendar();
        initBookingForm();
        handleUrlStatus();
        initVideoFallback();
        initViewportObserver();
        initWorkPage();
        initPageLoader();
        
        // Initialize animations
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 500);
    });
});