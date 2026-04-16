/* ==========================================================================
   JavaScript - Eghbal A. Hosseini Personal Website
   Theme toggle, smooth scroll, publication interactions, filtering
   ========================================================================== */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // Theme Management
  // --------------------------------------------------------------------------
  const ThemeManager = {
    STORAGE_KEY: 'theme-preference',

    init() {
      this.toggle = document.querySelector('.theme-toggle');
      if (!this.toggle) return;

      // Get saved preference or system preference
      const savedTheme = localStorage.getItem(this.STORAGE_KEY);
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

      this.setTheme(theme);
      this.toggle.addEventListener('click', () => this.toggleTheme());

      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      });
    },

    setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(this.STORAGE_KEY, theme);
    },

    toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      this.setTheme(next);
    }
  };

  // --------------------------------------------------------------------------
  // Mobile Navigation
  // --------------------------------------------------------------------------
  const MobileNav = {
    init() {
      this.toggle = document.querySelector('.nav-toggle');
      this.links = document.querySelector('.nav-links');

      if (!this.toggle || !this.links) return;

      this.toggle.addEventListener('click', () => {
        this.links.classList.toggle('active');
      });

      // Close menu when clicking a link
      this.links.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          this.links.classList.remove('active');
        });
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!this.toggle.contains(e.target) && !this.links.contains(e.target)) {
          this.links.classList.remove('active');
        }
      });
    }
  };

  // --------------------------------------------------------------------------
  // Publications Loader
  // --------------------------------------------------------------------------
  const PublicationsLoader = {
    async init() {
      this.container = document.querySelector('.publications-list');
      if (!this.container) return;

      try {
        const response = await fetch('data/publications.json');
        if (!response.ok) throw new Error('Failed to load publications');

        const data = await response.json();
        this.highlightAuthor = data.highlightAuthor || '';
        this.publications = data.publications || [];
        this.researchThemes = data.researchThemes || [];

        // Build a lookup map: pubId -> publication
        this.pubById = {};
        this.publications.forEach(pub => {
          this.pubById[pub.id] = pub;
        });

        this.render();
      } catch (error) {
        console.error('Error loading publications:', error);
        // Keep existing HTML as fallback
      }
    },

    formatAuthors(authors) {
      return authors.map(author => {
        if (author.includes(this.highlightAuthor)) {
          return `<span class="pub-author-highlight">${author}</span>`;
        }
        return author;
      }).join(', ');
    },

    createPublicationCard(pub) {
      const linksHtml = Object.entries(pub.links || {}).map(([label, url]) => {
        const icon = label.toLowerCase() === 'pdf'
          ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
             </svg>`
          : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
             </svg>`;
        return `<a href="${url}" class="pub-link" target="_blank">${icon}${label}</a>`;
      }).join('');

      return `
        <article class="pub-card fade-in" data-category="${pub.category}">
          <div class="pub-header">
            <div class="pub-info">
              <span class="pub-number">[${pub.id}]</span>
              <span class="pub-title">${pub.title}</span>
              <div class="pub-authors">${this.formatAuthors(pub.authors)}</div>
              <div class="pub-venue">${pub.venue} ${pub.year}</div>
            </div>
            <div class="pub-toggle">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
          <div class="pub-details">
            <div class="pub-abstract">
              <strong>Abstract</strong>
              ${pub.abstract}
            </div>
            <div class="pub-figure">
              <em>Figure placeholder — add research figure here</em>
            </div>
            <div class="pub-links">
              ${linksHtml}
            </div>
          </div>
        </article>
      `;
    },

    render() {
      // Sort by ID descending (newest first)
      const sorted = [...this.publications].sort((a, b) => b.id - a.id);
      this.container.innerHTML = sorted.map(pub => this.createPublicationCard(pub)).join('');

      // Re-initialize other modules that depend on publication cards
      Publications.init();
      PublicationFilter.init();
      ScrollAnimations.init();

      // Initialize citation tooltips (cite-refs are now in the hero bio)
      CiteTooltip.init(this.pubById);
    }
  };


  // --------------------------------------------------------------------------
  // Citation Tooltip
  // --------------------------------------------------------------------------
  const CiteTooltip = {
    init(pubById) {
      this.pubById = pubById || {};
      this.tooltip = document.getElementById('cite-tooltip');
      if (!this.tooltip) return;

      this.titleEl = this.tooltip.querySelector('.cite-tooltip-title');
      this.authorsEl = this.tooltip.querySelector('.cite-tooltip-authors');
      this.venueEl = this.tooltip.querySelector('.cite-tooltip-venue');
      this.linkEl = this.tooltip.querySelector('.cite-tooltip-link');

      this.hideTimer = null;
      this.isOverTooltip = false;

      // Tooltip hover: keep visible while cursor is inside
      this.tooltip.addEventListener('mouseenter', () => {
        this.isOverTooltip = true;
        clearTimeout(this.hideTimer);
      });

      this.tooltip.addEventListener('mouseleave', () => {
        this.isOverTooltip = false;
        this.scheduleHide();
      });

      // Delegate hover on cite-refs
      document.addEventListener('mouseover', (e) => {
        const ref = e.target.closest('.cite-ref');
        if (ref) this.show(ref);
      });

      document.addEventListener('mouseout', (e) => {
        const ref = e.target.closest('.cite-ref');
        if (ref) this.scheduleHide();
      });
    },

    show(refEl) {
      clearTimeout(this.hideTimer);

      const pubId = parseInt(refEl.dataset.pubId, 10);
      const pub = this.pubById[pubId];
      if (!pub) return;

      this.titleEl.textContent = pub.title;
      this.authorsEl.textContent = pub.authors.join(', ');
      this.venueEl.textContent = `${pub.venue} ${pub.year}`;

      // Set link to first available link
      const linkEntries = Object.entries(pub.links || {});
      if (linkEntries.length) {
        this.linkEl.href = linkEntries[0][1];
        this.linkEl.style.display = 'inline-block';
      } else {
        this.linkEl.style.display = 'none';
      }

      // Position the tooltip
      const rect = refEl.getBoundingClientRect();
      const tooltipWidth = 340;
      let left = rect.left + rect.width / 2 - tooltipWidth / 2;
      // Clamp to viewport
      left = Math.max(8, Math.min(left, window.innerWidth - tooltipWidth - 8));
      const top = rect.bottom + 8;

      this.tooltip.style.left = left + 'px';
      this.tooltip.style.top = top + 'px';
      this.tooltip.classList.add('visible');
    },

    scheduleHide() {
      this.hideTimer = setTimeout(() => {
        if (!this.isOverTooltip) {
          this.tooltip.classList.remove('visible');
        }
      }, 200);
    }
  };

  // --------------------------------------------------------------------------
  // Publication Interactions
  // --------------------------------------------------------------------------
  const Publications = {
    init() {
      this.cards = document.querySelectorAll('.pub-card');

      this.cards.forEach(card => {
        const header = card.querySelector('.pub-header');
        if (header) {
          // Remove existing listeners to prevent duplicates
          const newHeader = header.cloneNode(true);
          header.parentNode.replaceChild(newHeader, header);
          newHeader.addEventListener('click', () => this.toggleCard(card));
        }
      });
    },

    toggleCard(card) {
      const isExpanded = card.classList.contains('expanded');

      if (isExpanded) {
        card.classList.remove('expanded');
      } else {
        card.classList.add('expanded');
      }
    }
  };

  // --------------------------------------------------------------------------
  // Publication Filtering
  // --------------------------------------------------------------------------
  const PublicationFilter = {
    init() {
      this.buttons = document.querySelectorAll('.filter-btn');
      this.cards = document.querySelectorAll('.pub-card');

      if (!this.buttons.length) return;

      this.buttons.forEach(btn => {
        // Remove existing listeners to prevent duplicates
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => this.filter(newBtn));
      });

      // Re-query buttons after replacement
      this.buttons = document.querySelectorAll('.filter-btn');
    },

    filter(activeBtn) {
      const category = activeBtn.dataset.filter;

      // Update active button
      this.buttons.forEach(btn => btn.classList.remove('active'));
      activeBtn.classList.add('active');

      // Re-query cards (they may have been dynamically added)
      this.cards = document.querySelectorAll('.pub-card');

      // Filter cards
      this.cards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    }
  };

  // --------------------------------------------------------------------------
  // Scroll Animations
  // --------------------------------------------------------------------------
  const ScrollAnimations = {
    init() {
      this.elements = document.querySelectorAll('.fade-in');

      if (!this.elements.length) return;

      // Initial check
      this.checkVisibility();

      // Check on scroll (only add listener once)
      if (!this.listenerAdded) {
        let ticking = false;
        window.addEventListener('scroll', () => {
          if (!ticking) {
            window.requestAnimationFrame(() => {
              this.checkVisibility();
              ticking = false;
            });
            ticking = true;
          }
        });
        this.listenerAdded = true;
      }
    },

    checkVisibility() {
      // Re-query elements in case new ones were added
      this.elements = document.querySelectorAll('.fade-in');
      const windowHeight = window.innerHeight;

      this.elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const visible = rect.top < windowHeight - 100;

        if (visible) {
          el.classList.add('visible');
        }
      });
    }
  };

  // --------------------------------------------------------------------------
  // Smooth Scroll (fallback for browsers without native support)
  // --------------------------------------------------------------------------
  const SmoothScroll = {
    init() {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
          const targetId = anchor.getAttribute('href');
          if (targetId === '#') return;

          const target = document.querySelector(targetId);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        });
      });
    }
  };

  // --------------------------------------------------------------------------
  // Scroll Spy - Highlight active nav link based on scroll position
  // --------------------------------------------------------------------------
  const ScrollSpy = {
    init() {
      const self = this;
      self.links = document.querySelectorAll('.nav-link');
      self.sections = [];

      self.links.forEach(function (link) {
        const targetId = link.getAttribute('href');
        const section = document.querySelector(targetId);
        if (section) {
          self.sections.push({ id: targetId, el: section, link: link });
        }
      });

      if (!self.sections.length) return;

      // Set "About" as active by default
      self.setActive(self.links[0]);

      // Use scroll listener
      window.addEventListener('scroll', function () {
        self.update();
      });
    },

    setActive(activeLink) {
      this.links.forEach(function (link) {
        link.classList.remove('active');
      });
      if (activeLink) activeLink.classList.add('active');
    },

    update() {
      const navHeight = 80;

      // If at the very bottom, activate last section
      if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 10) {
        this.setActive(this.sections[this.sections.length - 1].link);
        return;
      }

      // Walk through sections; pick the last one whose top has scrolled past nav
      var activeLink = null;
      for (var i = 0; i < this.sections.length; i++) {
        var rect = this.sections[i].el.getBoundingClientRect();
        if (rect.top <= navHeight + 40) {
          activeLink = this.sections[i].link;
        }
      }

      this.setActive(activeLink || this.links[0]);
    }
  };

  // --------------------------------------------------------------------------
  // Initialize All Modules
  // --------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    MobileNav.init();
    SmoothScroll.init();
    ScrollSpy.init();

    // Set footer year dynamically
    const yearEl = document.getElementById('footer-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Load publications from JSON, then initialize dependent modules
    PublicationsLoader.init();
  });

})();
