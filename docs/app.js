/**
 * Optimized app.js - Combines i18n and main functionality
 * Performance optimized version
 */
(function() {
  // I18n - Internationalization functionality
  const i18n = {
    languages: null,
    currentLanguage: null,
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'zh'],
    eventListeners: {},
    completeData: window.completeI18nData || null,

    /**
     * Initialize the i18n system
     */
    async init() {
      try {
        // Use complete data embedded in HTML
        if (this.completeData) {
          this.languages = this.completeData;
          
          // Set initial language
          this.setInitialLanguage();
          
          // Apply translations with complete data
          this.applyLanguage();
          
          // Initialize language switcher UI
          this.initLanguageSwitcher();
          
          // Dispatch ready event immediately
          this.dispatchEvent('ready', { language: this.currentLanguage });
        } else {
          // Fallback to fetch if inline data isn't available for some reason
          this.loadLanguageData().then(() => {
            this.setInitialLanguage();
            this.applyLanguage();
            this.initLanguageSwitcher();
            this.dispatchEvent('ready', { language: this.currentLanguage });
          });
        }
        
        return true;
      } catch (error) {
        console.error('Failed to initialize i18n:', error);
        return false;
      }
    },

    /**
     * Load language data from JSON file (fallback method)
     */
    async loadLanguageData() {
      try {
        const response = await fetch('languages.json');
        const data = await response.json();
        this.languages = data;
        return true;
      } catch (error) {
        console.error('Error loading language data:', error);
        return false;
      }
    },

    /**
     * Set initial language based on storage or browser preference
     */
    setInitialLanguage() {
      const storedLang = localStorage.getItem('preferredLanguage');
      if (storedLang && this.supportedLanguages.includes(storedLang)) {
        this.currentLanguage = storedLang;
      } else {
        this.detectLanguage();
      }
    },

    /**
     * Detect browser language
     */
    detectLanguage() {
      const browserLang = navigator.language.split('-')[0];
      this.currentLanguage = this.supportedLanguages.includes(browserLang) 
        ? browserLang 
        : this.defaultLanguage;
    },

    /**
     * Set language and update the page
     * @param {string} lang - Language code to set
     */
    setLanguage(lang) {
      if (!this.supportedLanguages.includes(lang)) return false;
      
      this.currentLanguage = lang;
      localStorage.setItem('preferredLanguage', lang);
      this.applyLanguage();
      
      // Dispatch language change event
      this.dispatchEvent('languageChanged', { language: lang });
      return true;
    },

    /**
     * Apply the current language to all elements with data-i18n attribute
     * Uses batched DOM updates for better performance
     */
    applyLanguage() {
      if (!this.languages || !this.currentLanguage) return;

      const langData = this.languages[this.currentLanguage];
      if (!langData) return;
      
      // Use requestAnimationFrame for batched DOM updates
      requestAnimationFrame(() => {
        // Update elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
          const keys = element.getAttribute('data-i18n').split('.');
          let value = langData;
          
          // Navigate through nested keys
          for (const key of keys) {
            value = value && value[key] ? value[key] : null;
            if (!value) break;
          }
          
          if (value) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
              element.placeholder = value;
            } else {
              element.textContent = value;
            }
          }
        });

        // Update HTML lang attribute
        document.documentElement.lang = this.currentLanguage;
        
        // Update language switcher display
        this.updateLanguageSwitcherDisplay();
      });
    },

    /**
     * Initialize language switcher UI
     */
    initLanguageSwitcher() {
      const languageSwitcher = document.getElementById('language-switcher');
      if (!languageSwitcher) return;
      
      // Create once using DocumentFragment for better performance
      const fragment = document.createDocumentFragment();
      
      this.supportedLanguages.forEach(lang => {
        const button = document.createElement('button');
        button.setAttribute('data-lang', lang);
        button.textContent = lang.toUpperCase();
        button.addEventListener('click', () => this.setLanguage(lang));
        fragment.appendChild(button);
      });
      
      // Single DOM operation
      languageSwitcher.innerHTML = '';
      languageSwitcher.appendChild(fragment);
      
      this.updateLanguageSwitcherDisplay();
    },

    /**
     * Update language switcher to highlight current language
     */
    updateLanguageSwitcherDisplay() {
      const buttons = document.querySelectorAll('#language-switcher button');
      buttons.forEach(button => {
        const isActive = button.getAttribute('data-lang') === this.currentLanguage;
        button.classList.toggle('active', isActive);
      });
    },

    /**
     * Get translation data for a specific key
     * @param {string} key - Dot notation key to get translation
     * @returns {Object|string|null} - Translation value
     */
    getTranslation(key) {
      if (!this.languages || !this.currentLanguage) return null;
      
      const keys = key.split('.');
      let value = this.languages[this.currentLanguage];
      
      for (const k of keys) {
        value = value && value[k] ? value[k] : null;
        if (!value) break;
      }
      
      return value;
    },

    /**
     * Add event listener for i18n events
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
      if (!this.eventListeners[event]) {
        this.eventListeners[event] = [];
      }
      this.eventListeners[event].push(callback);
    },

    /**
     * Dispatch event to all listeners
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    dispatchEvent(event, data) {
      if (!this.eventListeners[event]) return;
      
      this.eventListeners[event].forEach(callback => {
        callback(data);
      });
    }
  };

  // Main application functionality
  const app = {
    /**
     * Initialize the application
     */
    init() {
      this.initNavigation();
      this.initSmoothScrolling();
      this.initLazyLoading();
      this.initAnimations();
      this.initScanlinesEffect();
      
      // Listen for i18n ready event BEFORE initializing i18n
      // This ensures the listener is attached before the event might be dispatched
      i18n.on('ready', data => {
        this.initPortfolio();
      });
      
      // Initialize i18n 
      i18n.init();
      
      // Listen for language change events
      i18n.on('languageChanged', data => {
        this.updatePortfolio();
      });
    },
    
    /**
     * Initialize navigation functionality
     */
    initNavigation() {
      const menuToggle = document.getElementById('menu-toggle');
      const navMenu = document.getElementById('nav-menu');
      
      if (!menuToggle || !navMenu) return;
      
      // Toggle menu on button click - using event delegation
      menuToggle.addEventListener('click', this.toggleNavMenu);
      
      // Close menu when clicking on links - event delegation
      navMenu.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
          this.closeNavMenu();
        }
      });
      
      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (
          navMenu.classList.contains('active') && 
          !navMenu.contains(e.target) && 
          !menuToggle.contains(e.target)
        ) {
          this.closeNavMenu();
        }
      });
      
      // Throttled scroll handler for nav highlighting
      window.addEventListener('scroll', this.throttle(this.highlightActiveNavItem, 100));
    },
    
    /**
     * Toggle navigation menu state
     */
    toggleNavMenu() {
      const menuToggle = document.getElementById('menu-toggle');
      const navMenu = document.getElementById('nav-menu');
      
      navMenu.classList.toggle('active');
      menuToggle.classList.toggle('active');
      document.body.classList.toggle('nav-open');
    },
    
    /**
     * Close navigation menu
     */
    closeNavMenu() {
      const menuToggle = document.getElementById('menu-toggle');
      const navMenu = document.getElementById('nav-menu');
      
      navMenu.classList.remove('active');
      menuToggle.classList.remove('active');
      document.body.classList.remove('nav-open');
    },
    
    /**
     * Highlight the active navigation item based on scroll position
     * Optimized with IntersectionObserver when supported
     */
    highlightActiveNavItem() {
      const navLinks = document.querySelectorAll('nav a');
      
      // Older method as fallback (using scroll position)
      if (!('IntersectionObserver' in window)) {
        const scrollPosition = window.scrollY + 100; // Offset for fixed header
        
        document.querySelectorAll('section[id]').forEach(section => {
          const sectionTop = section.offsetTop;
          const sectionHeight = section.offsetHeight;
          const sectionId = section.getAttribute('id');
          
          if (
            scrollPosition >= sectionTop && 
            scrollPosition < sectionTop + sectionHeight
          ) {
            navLinks.forEach(link => {
              link.classList.toggle('active', link.getAttribute('href') === `#${sectionId}`);
            });
          }
        });
      }
    },
    
    /**
     * Initialize smooth scrolling for anchor links
     */
    initSmoothScrolling() {
      // Event delegation for better performance
      document.addEventListener('click', (e) => {
        // Check if it's an anchor with hash
        const anchor = e.target.closest('a[href^="#"]');
        if (!anchor) return;
        
        e.preventDefault();
        
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;
        
        const target = document.querySelector(targetId);
        if (!target) return;
        
        // Account for fixed header
        const headerOffset = 80;
        const elementPosition = target.offsetTop;
        const offsetPosition = elementPosition - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      });
    },
    
    /**
     * Initialize lazy loading for images
     */
    initLazyLoading() {
      // Use native lazy loading where supported
      // For browsers without native support, we'd implement a fallback
      // But most modern browsers support it now
    },
    
    /**
     * Initialize animations for page elements
     * Uses IntersectionObserver for better performance
     */
    initAnimations() {
      if (!('IntersectionObserver' in window)) {
        // Fallback for browsers without IntersectionObserver
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
          el.classList.add('animated');
        });
        return;
      }
      
      const animatedElements = document.querySelectorAll('.animate-on-scroll');
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animated');
            // Stop observing once animated
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      
      animatedElements.forEach(element => {
        observer.observe(element);
      });
    },
    
    /**
     * Initialize scanlines effect with delay
     */
    initScanlinesEffect() {
      // Delay scanline effect to improve initial page load
      setTimeout(() => {
        const scanline = document.querySelector('.scanline');
        if (scanline) {
          scanline.style.display = 'block';
        }
      }, 1000);
    },
    
    /**
     * Initialize portfolio section
     */
    initPortfolio() {
      this.updatePortfolio();
    },
    
    /**
     * Update portfolio based on current language
     */
    updatePortfolio() {
      const projectsData = i18n.getTranslation('portfolio.projects');
      if (projectsData) {
        this.populatePortfolioProjects(projectsData);
      }
    },
    
    /**
     * Populate portfolio projects with data
     * Uses DocumentFragment for better performance
     * @param {Array} projectsData - Array of project data objects
     */
    populatePortfolioProjects(projectsData) {
      const projectsContainer = document.getElementById('portfolio-projects');
      if (!projectsContainer || !projectsData) return;
      
      // Create fragment for batch DOM update
      const fragment = document.createDocumentFragment();
      
      projectsData.forEach(project => {
        const projectElement = this.createProjectElement(project);
        fragment.appendChild(projectElement);
      });
      
      // Single DOM update
      projectsContainer.innerHTML = '';
      projectsContainer.appendChild(fragment);
    },
    
    /**
     * Create project element from project data
     * @param {Object} project - Project data
     * @returns {HTMLElement} - Project element
     */
    createProjectElement(project) {
      // Generate a simple ID from project name
      const projectId = project.name.toLowerCase().replace(/\s+/g, '-');
      
      // Determine icon based on project category
      const iconClass = this.getProjectIcon(project.category);
      
      const projectElement = document.createElement('div');
      projectElement.classList.add('project-card');
      projectElement.id = projectId;
      
      const linksHTML = this.createProjectLinks(project);
      
      // Use innerHTML once instead of multiple DOM operations
      projectElement.innerHTML = `
        <div class="project-header">
          <div class="project-icon"><i class="${iconClass}"></i></div>
          <h3>${project.name}</h3>
        </div>
        <p>${project.description}</p>
        <div class="project-meta">
          ${linksHTML}
        </div>
      `;
      
      return projectElement;
    },
    
    /**
     * Get appropriate icon class based on project category
     * @param {string} projectCategory - Category of the project
     * @returns {string} - Icon class
     */
    getProjectIcon(projectCategory) {
      const name = projectCategory ? projectCategory.toLowerCase() : '';
      
      if (['programming','python'].includes(name)) {
        return 'fas fa-code';
      } else if (['game'].includes(name)) {
        return 'fas fa-gamepad';
      } else if (['tool'].includes(name)) {
        return 'fas fa-tools';
      }
      
      return 'fas fa-code';
    },
    
    /**
     * Create HTML for project links
     * @param {Object} project - Project data
     * @returns {string} - HTML for links
     */
    createProjectLinks(project) {
      let links = '';
      
      if (project.github) {
        links += `<a href="${project.github}" target="_blank" class="project-link github-link" aria-label="GitHub repository">
          <i class="fab fa-github"></i>
        </a>`;
      }
      
      if (project.website) {
        links += `<a href="${project.website}" target="_blank" class="project-link website-link" aria-label="Project website">
          <i class="fas fa-external-link-alt"></i>
        </a>`;
      }
      
      return links;
    },
    
    /**
     * Throttle function to limit execution rate
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in ms
     * @returns {Function} - Throttled function
     */
    throttle(func, limit) {
      let inThrottle;
      return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    }
  };
  
  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
  } else {
    // DOM already loaded
    app.init();
  }
})(); 