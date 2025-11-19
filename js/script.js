// ===================================
// CARD RENDERING FROM JSON
// ===================================
function createScriptCard(script) {
  // tags HTML
  const tagsHtml = (script.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('');
  // card icon by category (opsional, bisa diimprove)
  let icon = "fa-code";
  if (script.category && script.category.toLowerCase().includes("utility")) icon = "fa-earth-americas";
  if (script.category && script.category.toLowerCase().includes("helper")) icon = "fa-tools";
  if (script.category && script.category.toLowerCase().includes("creative")) icon = "fa-palette";
  // card HTML
  return `
<article class="script-card" data-animate="fade-up" data-category="${script.category ? script.category.toLowerCase() : ''}">
  <div class="card-glow"></div>
  <div class="card-content">
    <div class="card-header">
      <div class="card-icon">
        <i class="fas ${icon}"></i>
      </div>
      <span class="card-badge">${script.category || ""}</span>
    </div>
    <div class="card-image-wrapper">
      <img
        alt="${script.title} Preview"
        class="card-image"
        loading="lazy"
        onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 400 300\\'%3E%3Crect fill=\\'%23111\\' width=\\'400\\' height=\\'300\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\' fill=\\'%23666\\' font-family=\\'monospace\\' font-size=\\'14\\'%3EImage Loading...%3C/text%3E%3C/svg%3E';"
        src="${script.image || ''}" />
      <div class="card-image-overlay"></div>
    </div>
    <h3 class="card-title" data-text="${script.title}">
      <span class="typing-wrapper"></span>
    </h3>
    <p class="card-description">${script.description || ""}</p>
    <div class="card-tags">${tagsHtml}</div>
    <div class="card-actions">
      <button class="btn-card view-code" data-script="${script.id}">
        <i class="fas fa-eye"></i>
        <span>View Code</span>
      </button>
      <button class="btn-card download" data-url="${script.url}">
        <i class="fas fa-download"></i>
        <span>Download</span>
      </button>
    </div>
  </div>
</article>
`;
}

function renderScriptCards() {
  const container = document.getElementById('scriptCards');
  if (!container) {
    console.error('Script cards container tidak ditemukan!');
    return;
  }
  
  // Check if scriptData exists
  if (!window.scriptData || !Array.isArray(window.scriptData)) {
    console.error('Script data tidak ditemukan atau bukan array!');
    container.innerHTML = '<p style="text-align: center; color: white;">No scripts available</p>';
    return;
  }
  
  console.log('Rendering', window.scriptData.length, 'script cards');
  container.innerHTML = window.scriptData.map(createScriptCard).join('');
}

// ===================================
// REST OF YOUR SCRIPT (original code)
// ===================================

let currentScript = null;

const elements = {
    exploreBtn: document.getElementById('exploreBtn'),
    codeModal: document.getElementById('codeModal'),
    closeCodeModal: document.getElementById('closeCodeModal'),
    codeContent: document.getElementById('codeContent'),
    copyCode: document.getElementById('copyCode'),
    downloadFromModal: document.getElementById('downloadFromModal'),
    // these will be updated after dynamic rendering
    viewCodeBtns: [],
    downloadBtns: [],
    statNumbers: document.querySelectorAll('.stat-number')
};

function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('Code copied to clipboard!');
        return true;
    } catch (err) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showNotification('Code copied to clipboard!');
            return true;
        } catch (err) {
            showNotification('Failed to copy code', 'error');
            return false;
        } finally {
            document.body.removeChild(textArea);
        }
    }
}

function showNotification(message, type = 'success') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
    });
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function downloadFile(url, filename) {
  fetch(url)
      .then(response => response.blob())
      .then(blob => {
          const LINK = document.createElement('a');
          LINK.href = URL.createObjectURL(blob);
          LINK.download = filename || "script.lua"
          document.body.appendChild(LINK);
          LINK.click();
          document.body.removeChild(LINK);
          URL.revokeObjectURL(LINK.href);
          showNotification('Download started!');
      })
      .catch(err => {
          console.error('Download error:', err);
          showNotification('Download failed!');
      });
}

// ===================================
// ANIMATION SYSTEM
// ===================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animated');
            if (entry.target.querySelector('.stat-number')) {
                animateCounters();
            }
        }
    });
}, observerOptions);

const cardObserverOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -50px 0px'
};

const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            const title = entry.target.querySelector('.card-title');
            if (title && !title.dataset.animated) {
                animateTypingTitles();
                title.dataset.animated = 'true';
            }
            cardObserver.unobserve(entry.target);
        }
    });
}, cardObserverOptions);

function initializeAnimations() {
    const animatedElements = document.querySelectorAll('[data-animate]');
    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

function initializeCardAnimations() {
    const cards = document.querySelectorAll('.script-card');
    cards.forEach(card => {
        cardObserver.observe(card);
    });
}

function animateCounters() {
    elements.statNumbers.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count')) || 0;
        const current = parseInt(counter.textContent) || 0;
        if (current !== target && target > 0) {
            const increment = Math.max(1, Math.ceil(target / 50));
            const timer = setInterval(() => {
                const currentValue = parseInt(counter.textContent) || 0;
                if (currentValue < target) {
                    counter.textContent = Math.min(currentValue + increment, target);
                } else {
                    counter.textContent = target;
                    clearInterval(timer);
                }
            }, 50);
        }
    });
}

function animateTypingTitles() {
    const titles = document.querySelectorAll('.card-title');
    titles.forEach(title => {
        const text = title.getAttribute('data-text') || '';
        const wrapper = title.querySelector('.typing-wrapper');
        if (!wrapper || !text) return;
        wrapper.innerHTML = '';
        text.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.className = 'typing-char';
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.setAttribute('aria-hidden', 'true');
            wrapper.appendChild(span);
            setTimeout(() => {
                span.classList.add('visible');
            }, index * 50);
        });
    });
}

// ===================================
// MODAL FUNCTIONALITY
// ===================================
async function openCodeModal(scriptId) {
    const script = (window.scriptData || []).find(s => s.id === scriptId);
    if (!script) {
        showNotification('Script not found', 'error');
        return;
    }
    currentScript = script;
    elements.codeModal.classList.add('active');
    elements.codeContent.textContent = 'Loading script...';
    try {
        const response = await fetch(script.url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const code = await response.text();
        elements.codeContent.textContent = code;
        const modalTitle = document.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.textContent = script.title;
        }
        Prism.highlightElement(elements.codeContent);
    } catch (error) {
        console.error('Error loading script:', error);
        elements.codeContent.textContent = `-- Error loading script: ${error.message}\n-- Please check your internet connection or try again later`;
        showNotification('Failed to load script', 'error');
    }
}

function closeCodeModal() {
    if (elements.codeModal) {
        elements.codeModal.classList.remove('active');
    }
    currentScript = null;
}

// ===================================
// EVENT LISTENERS
// ===================================
function initializeEventListeners() {
    if (elements.exploreBtn) {
        elements.exploreBtn.addEventListener('click', () => {
            smoothScrollTo('scripts');
        });
    }
    
    // Update dynamic button references AFTER cards are rendered
    updateDynamicButtons();
    
    if (elements.closeCodeModal) {
        elements.closeCodeModal.addEventListener('click', closeCodeModal);
    }
    if (elements.copyCode) {
        elements.copyCode.addEventListener('click', () => {
            if (currentScript && elements.codeContent) {
                copyToClipboard(elements.codeContent.textContent);
            }
        });
    }
    if (elements.downloadFromModal) {
        elements.downloadFromModal.addEventListener('click', () => {
            if (currentScript) {
                const filename = currentScript.url.split('/').pop();
                downloadFile(currentScript.url, filename);
            }
        });
    }
    if (elements.codeModal) {
        elements.codeModal.addEventListener('click', (e) => {
            if (e.target === elements.codeModal) {
                closeCodeModal();
            }
        });
    }
    const menuToggleBtn = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    if (menuToggleBtn) {
        menuToggleBtn.addEventListener('click', () => {
            menuToggleBtn.classList.toggle('active');
            mobileMenu.classList.toggle('show');
        });
    }
    document.addEventListener('keydown', (e) => {
        if (elements.codeModal && elements.codeModal.classList.contains('active')) {
            if (e.key === 'Escape') {
                closeCodeModal();
            }
        }
    });
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = anchor.getAttribute('href').slice(1);
            if (targetId) {
                smoothScrollTo(targetId);
            }
        });
    });
}

// Fungsi untuk update button references setelah cards di-render
function updateDynamicButtons() {
    // Re-query dynamic buttons
    elements.viewCodeBtns = document.querySelectorAll('.view-code');
    elements.downloadBtns = document.querySelectorAll('.download');
    
    console.log('Found', elements.viewCodeBtns.length, 'view-code buttons');
    console.log('Found', elements.downloadBtns.length, 'download buttons');
    
    elements.viewCodeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const scriptId = btn.getAttribute('data-script');
            console.log('Clicked view-code for script:', scriptId);
            if (scriptId) {
                openCodeModal(scriptId);
            }
        });
    });
    
    elements.downloadBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const url = btn.getAttribute('data-url');
            console.log('Clicked download for URL:', url);
            if (url) {
                const filename = url.split('/').pop();
                downloadFile(url, filename);
            }
        });
    });
}

// ===================================
// LOADING STATES & ERROR HANDLING
// ===================================
function handleImageErrors() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('error', (e) => {
            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23111' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23666' font-family='monospace' font-size='14'%3EImage not found%3C/text%3E%3C/svg%3E";
        });
    });
}

// ===================================
// INITIALIZATION
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    renderScriptCards(); // <-- generate card dari JSON
    initializeEventListeners(); // <-- event click dll (sekarang include updateDynamicButtons)
    initializeAnimations();
    initializeCardAnimations();
    handleImageErrors();
    
    setTimeout(() => {
        showNotification('Welcome to Script Vault! 🚀');
    }, 1000);
    
    console.log('Script Vault initialized successfully');
});

if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            if (perfData) {
                console.log(`Page loaded in ${Math.round(perfData.loadEventEnd - perfData.fetchStart)}ms`);
            }
        }, 0);
    });
}