/**
 * Main script for personal website
 */
(function() {
  // Main initialization function
  function init() {
    initNavigation();
    initSmoothScrolling();
    initAnimations();
    initScanlinesEffect();
    
    // Wait for i18n to be ready, then initialize portfolio
    i18n.on('ready', data => {
      initPortfolio();
      initSkills();
    });
    
    // Listen for language changes
    i18n.on('languageChanged', data => {
      updatePortfolio();
      updateSkills();
    });
  }
  
  /**
   * Initialize navigation functionality
   */
  function initNavigation() {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (!menuToggle || !navMenu) return;
    
    // Toggle menu on button click
    menuToggle.addEventListener('click', () => {
      toggleNavMenu();
    });
    
    // Close menu when clicking on links
    document.querySelectorAll('#nav-menu a').forEach(link => {
      link.addEventListener('click', () => {
        closeNavMenu();
      });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (
        navMenu.classList.contains('active') && 
        !navMenu.contains(e.target) && 
        !menuToggle.contains(e.target)
      ) {
        closeNavMenu();
      }
    });

    // Highlight active nav item on scroll (throttled)
    window.addEventListener('scroll', throttle(highlightActiveNavItem, 100));
  }
  
  /**
   * Toggle navigation menu state
   */
  function toggleNavMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    navMenu.classList.toggle('active');
    menuToggle.classList.toggle('active');
    document.body.classList.toggle('nav-open');
  }
  
  /**
   * Close navigation menu
   */
  function closeNavMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    navMenu.classList.remove('active');
    menuToggle.classList.remove('active');
    document.body.classList.remove('nav-open');
  }

  /**
   * Highlight the active navigation item based on scroll position
   */
  function highlightActiveNavItem() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('nav a');
    
    const scrollPosition = window.scrollY + 100; // Offset for fixed header
    
    sections.forEach(section => {
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

  /**
   * Initialize smooth scrolling for anchor links
   */
  function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const target = document.querySelector(this.getAttribute('href'));
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
    });
  }

  /**
   * Initialize animations for page elements
   */
  function initAnimations() {
    // Animate elements when they come into view
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
        }
      });
    }, { threshold: 0.1 });
    
    animatedElements.forEach(element => {
      observer.observe(element);
    });
  }
  
  /**
   * Initialize scanlines effect
   */
  function initScanlinesEffect() {
    // Enable scanline effect after a delay
    setTimeout(() => {
      const scanline = document.querySelector('.scanline');
      if (scanline) {
        scanline.style.display = 'block';
      }
    }, 1000);
  }
  
  /**
   * Initialize portfolio section
   */
  function initPortfolio() {
    updatePortfolio();
  }
  
  /**
   * Update portfolio based on current language
   */
  function updatePortfolio() {
    const projectsData = i18n.getTranslation('portfolio.projects');
    if (projectsData) {
      populatePortfolioProjects(projectsData);
    }
  }

  /**
   * Populate portfolio projects with data
   * @param {Array} projectsData - Array of project data objects from language file
   */
  function populatePortfolioProjects(projectsData) {
    const projectsContainer = document.getElementById('portfolio-projects');
    if (!projectsContainer || !projectsData) return;
    
    projectsContainer.innerHTML = '';

    projectsData.forEach(project => {
      const projectElement = createProjectElement(project);
      projectsContainer.appendChild(projectElement);
    });
  }
  
  /**
   * Create project element from project data
   * @param {Object} project - Project data
   * @returns {HTMLElement} - Project element
   */
  function createProjectElement(project) {
    // Generate a simple ID from project name
    const projectId = project.name.toLowerCase().replace(/\s+/g, '-');
    
    // Determine icon based on project name or type
    const iconClass = getProjectIcon(project.category);
    
    const projectElement = document.createElement('div');
    projectElement.classList.add('project-card');
    projectElement.id = projectId;
    
    const linksHTML = createProjectLinks(project);
    
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
  }
  
  /**
   * Get appropriate icon class based on project name
   * @param {string} projectName - Name of the project
   * @returns {string} - Icon class
   */
  function getProjectIcon(projectCategory) {
    const name = projectCategory.toLowerCase();
    
    if (['programming','python'].includes(name)) {
      return 'fas fa-code';
    } else if (['game'].includes(name)) {
      return 'fas fa-gamepad';
    }
    
    return 'fas fa-code';
  }
  
  /**
   * Create HTML for project links
   * @param {Object} project - Project data
   * @returns {string} - HTML for links
   */
  function createProjectLinks(project) {
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
  }
  
  /**
   * Throttle function to limit execution rate
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in ms
   * @returns {Function} - Throttled function
   */
  function throttle(func, limit) {
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
  
  /**
   * Initialize skills section
   */
  function initSkills() {
    updateSkills();
  }
  
  /**
   * Update skills based on current language
   */
  function updateSkills() {
    const skillsData = i18n.getTranslation('skills.skills');
    if (skillsData) {
      populateSkills(skillsData);
    }
  }

  /**
   * Populate skills with data from language file
   * @param {Array} skillsData - Array of skills from language file
   */
  function populateSkills(skillsData) {
    const skillsContainer = document.getElementById('skills-container');
    if (!skillsContainer || !skillsData) return;
    
    skillsContainer.innerHTML = '';

    skillsData.forEach(skill => {
      const skillElement = createSkillElement(skill);
      skillsContainer.appendChild(skillElement);
    });
  }
  
  /**
   * Create skill element from skill data
   * @param {string} skill - Skill name
   * @returns {HTMLElement} - Skill element
   */
  function createSkillElement(skill) {
    const skillElement = document.createElement('span');
    skillElement.classList.add('skill-tag');
    skillElement.textContent = skill;
    
    return skillElement;
  }
  
  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', init);
  
})(); 