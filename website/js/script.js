/* js/script.js - Main site & booking page behaviour */
/* Requires: flatpickr (optional), fetch API (modern browsers) */

(function () {
  'use strict';

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
    // target: DOM node to insert message before (default: booking form)
    const container = target || qs('#booking-form') || document.body;
    if (!container) return;

    // remove existing message
    const existing = container.parentNode && container.parentNode.querySelector('.form-message');
    if (existing) existing.remove();

    const msg = createEl('div');
    msg.className = `form-message ${type}`;
    msg.textContent = message;
    msg.setAttribute('role', 'alert');
    // Insert message above the form if possible, otherwise append to body
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
    // Accepts UK numbers (+44...) or common international formats (digits, spaces, -, parentheses)
    const cleaned = phone.replace(/[\s\-().]/g, '');
    return /^\+?\d{7,15}$/.test(cleaned);
  }

  // --------- Navigation (mobile menu + scroll effect) ---------
  function initNavigation() {
    const menuBtn = qs('.menu-btn');
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

  // --------- Booking form: validation + AJAX submit ---------
  function initBookingForm() {
    const form = qs('#booking-form');
    if (!form) {
      debug('Booking form not present');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');

    // Field-level validation helper
    function validateField(field) {
      const name = field.name || field.id || 'field';
      const val = (field.value || '').trim();
      let ok = true;
      let err = '';

      if (field.hasAttribute('required') && !val) {
        ok = false; err = 'This field is required';
      } else if (field.type === 'email' && val && !isValidEmail(val)) {
        ok = false; err = 'Enter a valid email';
      } else if (field.type === 'tel' && val && !isValidPhone(val)) {
        ok = false; err = 'Enter a valid phone number';
      }

      // show or remove inline error message
      const existing = field.parentNode.querySelector('.error-message');
      if (!ok) {
        if (existing) existing.textContent = err;
        else {
          const d = createEl('div');
          d.className = 'error-message';
          d.textContent = err;
          field.parentNode.appendChild(d);
        }
        field.classList.add('error');
      } else {
        if (existing) existing.remove();
        field.classList.remove('error');
      }
      return ok;
    }

    // Validate entire form, returns boolean
    function validateForm() {
      let valid = true;
      const requiredFields = qsa('#booking-form [required]');
      requiredFields.forEach(f => {
        if (!validateField(f)) valid = false;
      });
      // Extra checks for email/phone even if not required attribute
      const email = qs('#email'); if (email && email.value.trim() && !isValidEmail(email.value)) { validateField(email); valid = false; }
      const phone = qs('#phone'); if (phone && phone.value.trim() && !isValidPhone(phone.value)) { validateField(phone); valid = false; }
      return valid;
    }

    // Real-time validation on blur/input
    qsa('#booking-form input, #booking-form textarea, #booking-form select').forEach(input => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => {
        const existing = input.parentNode.querySelector('.error-message');
        if (existing && input.value.trim()) existing.remove();
        input.classList.remove('error');
      });
    });

    // Handle submission (AJAX)
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      // Remove previous messages
      const oldMsg = document.querySelector('.form-message'); if (oldMsg) oldMsg.remove();

      if (!validateForm()) {
        showMessage('Please fix the errors in the form and try again.', 'error', form);
        return;
      }

      // disable button & show loading
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      // Prepare data (FormData works for file uploads too)
      const action = form.getAttribute('action') || window.location.href;
      const method = (form.getAttribute('method') || 'POST').toUpperCase();

      try {
        const formData = new FormData(form);
        // Send via fetch
        const res = await fetch(action, {
          method,
          body: formData,
        });

        if (res.ok) {
          showMessage('Thank you! Your booking request has been sent successfully.', 'success', form);
          form.reset();
          // reset flatpickr alt input display if present
          const fp = qs('#booking-date'); if (fp && fp._flatpickr) fp._flatpickr.clear();
        } else {
          // Try to parse JSON error, fallback to generic
          let text = 'There was a problem sending your message. Please try again later.';
          try { const json = await res.json(); if (json && json.message) text = json.message; } catch (e) { /* ignore */ }
          showMessage(text, 'error', form);
        }
      } catch (err) {
        debug('Network error', err);
        showMessage('Network error — please check your connection and try again.', 'error', form);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit';
        }
      }
    });
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
  });

})();
