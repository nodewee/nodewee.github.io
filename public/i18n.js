/**
 * i18n - Internationalization module for handling multiple languages
 */
class I18n {
  constructor() {
    this.languages = null;
    this.currentLanguage = null;
    this.defaultLanguage = 'en';
    this.supportedLanguages = ['en', 'zh'];
    this.eventListeners = {};
  }

  /**
   * Initialize the i18n system
   */
  async init() {
    try {
      await this.loadLanguageData();
      this.setInitialLanguage();
      this.applyLanguage();
      this.initLanguageSwitcher();
      
      // Dispatch event that i18n is ready
      this.dispatchEvent('ready', { language: this.currentLanguage });
      return true;
    } catch (error) {
      console.error('Failed to initialize i18n:', error);
      return false;
    }
  }

  /**
   * Load language data from JSON file
   */
  async loadLanguageData() {
    const response = await fetch('languages.json');
    this.languages = await response.json();
  }

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
  }

  /**
   * Detect browser language
   */
  detectLanguage() {
    const browserLang = navigator.language.split('-')[0];
    this.currentLanguage = this.supportedLanguages.includes(browserLang) 
      ? browserLang 
      : this.defaultLanguage;
  }

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
  }

  /**
   * Apply the current language to all elements with data-i18n attribute
   */
  applyLanguage() {
    if (!this.languages || !this.currentLanguage) return;

    const langData = this.languages[this.currentLanguage];
    
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
  }

  /**
   * Initialize language switcher UI
   */
  initLanguageSwitcher() {
    const languageSwitcher = document.getElementById('language-switcher');
    if (!languageSwitcher) return;
    
    // Clear any existing buttons
    languageSwitcher.innerHTML = '';
    
    this.supportedLanguages.forEach(lang => {
      const button = document.createElement('button');
      button.setAttribute('data-lang', lang);
      button.textContent = lang.toUpperCase();
      button.addEventListener('click', () => this.setLanguage(lang));
      languageSwitcher.appendChild(button);
    });
    
    this.updateLanguageSwitcherDisplay();
  }

  /**
   * Update language switcher to highlight current language
   */
  updateLanguageSwitcherDisplay() {
    const buttons = document.querySelectorAll('#language-switcher button');
    buttons.forEach(button => {
      const isActive = button.getAttribute('data-lang') === this.currentLanguage;
      button.classList.toggle('active', isActive);
    });
  }

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
  }

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
  }

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
}

// Create and export singleton instance
const i18n = new I18n();

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
  i18n.init();
}); 