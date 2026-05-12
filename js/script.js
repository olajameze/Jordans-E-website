/* js/script.js - Main site & booking page behaviour */
/* Requires: flatpickr, emailjs */

'use strict';

// Initialize EmailJS with public key
if (typeof emailjs !== 'undefined') {
    emailjs.init("cHFT-wrNq-nXjCQFq");
}

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
            menuBtn.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
            document.body.classList.toggle('menu-open', isOpen);
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

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('active')) {
                toggleMenu(false);
            }
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

    // Inline playback for iOS Safari + Firefox sets attributes programmatically (avoids static HTML compat lint noise)
    function fixPlaysinline() {
        const videos = qsa('video');
        videos.forEach((video) => {
            if (video.hasAttribute('autoplay')) {
                video.muted = true;
            }
            video.setAttribute('playsinline', '');
            video.setAttribute('webkit-playsinline', '');
        });
    }

    // Handle cleanup when page is hidden or closed
    function handleCleanup() {
        // Add any cleanup tasks here
        const video = document.getElementById('heroVideo');
        if (video) {
            video.pause();
        }
    }

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
        const btnText = submitBtn.querySelector('.btn-text');
        const originalBtnText = btnText ? btnText.textContent : submitBtn.textContent;
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.classList.add('is-loading');

        if (btnText) btnText.textContent = 'Sending...';

        // Clear previous messages
        const messagesDiv = document.getElementById('form-messages');
        if (messagesDiv) {
            messagesDiv.textContent = '';
            messagesDiv.className = 'form-message';
        }

        // Validate form before sending
        if (!validateForm()) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('is-loading');
            if (btnText) btnText.textContent = originalBtnText;
            return;
        }

        // Collect form data
        const templateParams = {
            to_name: "Breazy Productions",
            from_name: form.name.value,
            from_email: form.email.value,
            phone: form.phone.value,
            event_type: form.event_type.value,
            booking_date: form.booking_date.value,
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
                    messagesDiv.classList.add('animate-success');
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
                submitBtn.classList.remove('is-loading');
                if (btnText) btnText.textContent = originalBtnText;
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
        
        // Validate booking date (main input value; Flatpickr with altInput uses hidden real value)
        if (!bookingDate.value || !bookingDate.value.trim()) {
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

    /* Date picker: initialized once in initBookingCalendar() — do not double-init here */
}

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
        fixPlaysinline();
        initBookingForm();
        handleUrlStatus();
        initVideoFallback();
        initViewportObserver();
        initPageLoader();
        
        // Initialize animations
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 500);
    });