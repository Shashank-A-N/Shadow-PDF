// ==========================================
//  PDF TOOLKIT ENGINE (Single-Line Description Fix)
// ==========================================

const tooltip = document.getElementById('tool-tooltip');
const tooltipLoader = document.getElementById('tooltip-loader');
const tooltipContent = document.getElementById('tooltip-content');
const tooltipCloseBtn = document.getElementById('tooltip-close');

// Internal Tooltip Elements
const ttTitle = document.getElementById('tooltip-title');
const ttDesc = document.getElementById('tooltip-desc');
const ttTech = document.getElementById('tooltip-tech');
const ttThumb = document.getElementById('tooltip-thumb');
const ttVideo = document.getElementById('tooltip-video');
const ttReadMore = document.getElementById('tooltip-readmore');
const ttActions = document.getElementById('tooltip-actions');
const ttOpenMain = document.getElementById('tooltip-open-main');

// Modal Elements
const modal = document.getElementById('full-view-modal');
const modalCard = document.getElementById('modal-card');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const modalTech = document.getElementById('modal-tech');
const modalVideo = document.getElementById('modal-video');
const modalThumb = document.getElementById('modal-thumb');
const modalClose = document.getElementById('modal-close');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalOpenTool = document.getElementById('modal-open-tool');

// --- 1. TOOL DATABASE ---
const toolDatabase = {
    "ai-summery/index.html": {
        repo: "https://github.com/yourusername/ai-summary",
        desc: "Leverage advanced Natural Language Processing to condense lengthy documents into concise, readable summaries.",
        video: "https://www.w3schools.com/html/mov_bbb.mp4"
    },
    "Q&A_pdf/index.html": {
        repo: "#",
        desc: "Transform your static documents into an interactive knowledge base. Upload any PDF and chat with it using our AI engine.",
        video: ""
    },
    "pdf-merger/index.html": {
        repo: "#",
        desc: "Combine multiple PDF files into a single, organized document. You can drag and drop to reorder files before merging.",
        video: ""
    },
    // ... (Other tools inherit defaults)
};

// --- 2. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // A. Inject Info Icons (MOBILE ONLY - Hidden on Desktop)
    document.querySelectorAll('.tool-card').forEach(card => {
        if (card.querySelector('.info-btn')) return;

        const infoBtn = document.createElement('button');
        // 'lg:hidden' ensures this only shows on mobile devices
        infoBtn.className = 'info-btn lg:hidden absolute top-7 right-3 z-30 p-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-indigo-600 border border-white/10 transition-all shadow-lg backdrop-blur-md';
        infoBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
        infoBtn.setAttribute('aria-label', 'View Details');

        card.style.position = 'relative';
        card.appendChild(infoBtn);

        // Icon Click -> Open Modal Directly
        infoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const href = card.getAttribute('href');
            const title = card.querySelector('h3, h4')?.textContent || 'Tool';
            const techStack = (card.dataset.tech || 'HTML5').split(',');
            const richData = toolDatabase[href] || { desc: "", video: "", repo: "" };
            const finalDesc = richData.desc || card.querySelector('p')?.textContent || '';

            openModal(title, finalDesc, techStack, richData, href);
        });
    });

    if (typeof renderRecentTools === 'function') renderRecentTools();
    if (typeof typeLine1 === 'function') setTimeout(typeLine1, 500);

    // ==========================================
    //  HOVER-TO-PLAY LOGIC (FIXED & ROBUST)
    // ==========================================
    const mediaContainer = document.getElementById('tooltip-media-container');
    const videoLoader = document.getElementById('video-loader');
    // Note: 'ttVideo' is already defined globally in your script

    // Add a timer variable at the top of this section
    let loadTimer;

    mediaContainer.addEventListener('mouseenter', () => {
        const videoUrl = ttVideo.dataset.videoToPlay;

        // Clear any existing timer
        clearTimeout(loadTimer);

        // Wait 200ms before starting to load
        loadTimer = setTimeout(() => {
            if (videoUrl && ttVideo.getAttribute('src') !== videoUrl) {
                ttVideo.src = videoUrl;
                ttVideo.load();
            }
        }, 200); // 200ms delay
    });

    mediaContainer.addEventListener('mouseleave', () => {
        // Cancel the loading if the mouse leaves before the 200ms is up!
        clearTimeout(loadTimer);

        // Stop everything immediately
        ttVideo.pause();
        ttVideo.classList.add('opacity-0');
        if (videoLoader) videoLoader.classList.add('opacity-0');
        ttVideo.src = "";
        ttVideo.removeAttribute('src');
    });

    if (mediaContainer && ttVideo) {

        // --- 1. Event Listeners for Smooth UI ---
        // These automatically handle the showing/hiding of the loader/video
        // based on what the video player is actually doing.

        ttVideo.addEventListener('loadstart', () => {
            // When loading starts, show loader, hide video
            if (videoLoader) videoLoader.classList.remove('opacity-0');
            ttVideo.classList.add('opacity-0');
        });

        ttVideo.addEventListener('canplay', () => {
            // Ready to play? Try to play.
            const playPromise = ttVideo.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // Auto-play was prevented or interrupted - quiet fail
                    console.log("Playback interrupted (mouse left early)");
                });
            }
        });

        ttVideo.addEventListener('playing', () => {
            // Once actually playing, hide loader, show video
            if (videoLoader) videoLoader.classList.add('opacity-0');
            ttVideo.classList.remove('opacity-0');
        });

        // --- 2. Mouse Interaction ---

        mediaContainer.addEventListener('mouseenter', () => {
            const videoUrl = ttVideo.dataset.videoToPlay;

            // Only start if we have a URL and it's not currently playing
            if (videoUrl && ttVideo.getAttribute('src') !== videoUrl) {
                ttVideo.src = videoUrl;
                ttVideo.load(); // <--- CRITICAL FIX: Forces browser to restart the cycle
            }
        });

        mediaContainer.addEventListener('mouseleave', () => {
            // Stop everything immediately
            ttVideo.pause();
            ttVideo.classList.add('opacity-0'); // Hide video
            if (videoLoader) videoLoader.classList.add('opacity-0'); // Hide loader

            // Clear source to save bandwidth and reset state
            ttVideo.src = "";
            ttVideo.removeAttribute('src');
        });
    }
});

let hoverTimer;
let activeCard = null;

// --- 3. EVENT LISTENERS ---
document.querySelectorAll('.tool-card').forEach(card => {
    // Desktop Hover
    card.addEventListener('mouseenter', () => {
        // screen check
        if (window.innerWidth < 1024) return;

        console.log("1. Mouse Enter - Starting 3.5s Timer...");

        // 1. Stop any pending actions
        clearTimeout(hoverTimer);

        // 2. Close other popups immediately
        if (activeCard && activeCard !== card) {
            console.log("   Closing previous card");
            hidePopOut();
        }

        // 3. Start the 3.5 second countdown
        hoverTimer = setTimeout(() => {
            console.log("2. Timer Finished! Showing Popup now.");
            showPopOut(card);
        }, 2000);
    });

    card.addEventListener('mouseleave', () => {
        if (window.innerWidth < 1024) return;

        console.log("3. Mouse Left - Cancelling Timer!");

        // 4. CANCEL THE TIMER (This stops the popup)
        clearTimeout(hoverTimer);

        // 5. Hide if it was open
        hoverTimer = setTimeout(() => hidePopOut(), 150);
    });

    // Mobile Click Logic
    card.addEventListener('click', (e) => {
        if (window.innerWidth < 1024) {
            // e.preventDefault(); 
        }
    });
});

if (tooltip) {
    tooltip.addEventListener('mouseenter', () => clearTimeout(hoverTimer));
    tooltip.addEventListener('mouseleave', () => {
        if (window.innerWidth >= 1024) hidePopOut();
    });
}

if (tooltipCloseBtn) {
    tooltipCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        hidePopOut();
    });
}

// --- 4. SHOW POPOUT (Desktop Logic) ---
function showPopOut(card) {
    activeCard = card;
    const href = card.getAttribute('href');

    const title = card.querySelector('h3, h4')?.textContent || 'Tool';
    const techStack = (card.dataset.tech || 'HTML5').split(',');
    const richData = toolDatabase[href] || { desc: "", video: "", repo: "#" };
    const displayDesc = richData.desc || card.querySelector('p')?.textContent || '';

    // Populate Text
    ttTitle.textContent = title;
    ttDesc.textContent = displayDesc;
    ttTech.innerHTML = techStack.map(t => `<span class="text-[10px] bg-white/10 px-1 rounded text-slate-300 border border-white/5">${t.trim()}</span>`).join('');

    // Populate Image
    ttThumb.src = richData.thumb || "https://via.placeholder.com/320x160/1e293b/ffffff?text=Preview";

    // --- HEADER BUTTONS (Desktop Only) ---
    if (ttActions) {
        ttActions.innerHTML = '';

        // 1. Details Button
        const btnDetails = document.createElement('button');
        btnDetails.className = 'p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors';
        btnDetails.title = "View Details";
        btnDetails.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
        btnDetails.onclick = (e) => {
            e.stopPropagation();
            openModal(title, displayDesc, techStack, richData, href);
        };

        // 2. GitHub Button
        const btnRepo = document.createElement('a');
        btnRepo.className = 'p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors';
        btnRepo.href = richData.repo || "#";
        btnRepo.target = "_blank";
        btnRepo.title = "View Source";
        btnRepo.innerHTML = `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`;
        btnRepo.onclick = (e) => e.stopPropagation();

        // 3. Live Demo Button
        const btnLive = document.createElement('a');
        btnLive.className = 'p-1.5 rounded-md hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors';
        btnLive.href = href;
        btnLive.title = "Open Tool";
        btnLive.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;

        ttActions.appendChild(btnDetails);
        ttActions.appendChild(btnRepo);
        ttActions.appendChild(btnLive);
    }

    // Configure Main Button
    if (ttOpenMain) {
        ttOpenMain.onclick = (e) => {
            e.stopPropagation();
            window.location.href = href;
        };
    }

    // --- NEW: STRICT SINGLE LINE TRUNCATION ---
    ttDesc.classList.remove('line-clamp-1', 'line-clamp-3'); // Reset
    if (ttReadMore) ttReadMore.classList.add('hidden');

    // Check if text is roughly longer than 1 line (approx 55-60 chars for this width)
    if (displayDesc.length > 55) {
        ttDesc.classList.add('line-clamp-1'); // Force 1 line
        if (ttReadMore) {
            ttReadMore.classList.remove('hidden');
            ttReadMore.onclick = (e) => {
                e.stopPropagation();
                openModal(title, displayDesc, techStack, richData, href);
            };
        }
    }

    // --- DOM PREP & POSITIONING ---
    if (tooltipLoader) tooltipLoader.classList.add('hidden');
    tooltipContent.classList.remove('hidden');
    tooltip.classList.remove('hidden');

    tooltip.style.width = '340px';
    tooltip.style.height = 'auto';
    tooltip.style.visibility = 'hidden';
    tooltip.style.display = 'flex';

    const cardRect = card.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 20;

    // Horizontal
    const cardCenter = cardRect.left + (cardRect.width / 2);
    let left = cardCenter - (340 / 2);
    if (left < gap) left = gap;
    if (left + 340 > vw - gap) left = vw - 340 - gap;
    tooltip.style.left = `${left}px`;

    // Vertical Zone Logic
    if (vw < 1024) {
        // Mobile: Center
        tooltip.classList.add('mobile-center');
        tooltip.style.top = '50%';
        tooltip.style.left = '50%';
        tooltip.style.bottom = 'auto';
        tooltip.style.transform = 'translate(-50%, -50%)';
        if (tooltipCloseBtn) tooltipCloseBtn.classList.remove('hidden');
    } else {
        // Desktop
        tooltip.classList.remove('mobile-center');
        tooltip.style.transform = 'scale(0.95)';
        if (tooltipCloseBtn) tooltipCloseBtn.classList.add('hidden');

        const isLow = cardRect.top > (vh * 0.60);
        if (isLow) {
            tooltip.style.top = 'auto';
            tooltip.style.bottom = `${gap}px`;
        } else {
            let idealTop = cardRect.top - 10;
            if (idealTop < gap) idealTop = gap;
            tooltip.style.bottom = 'auto';
            tooltip.style.top = `${idealTop}px`;
        }

        // if (richData.video) {
        //     ttVideo.src = richData.video;
        //     ttVideo.play().then(() => ttVideo.classList.remove('opacity-0')).catch(() => { });
        // }
        // --- CHANGED: Don't play yet, just store the URL ---
        ttVideo.dataset.videoToPlay = richData.video || "";
        ttVideo.src = ""; // Clear any previous source
        ttVideo.classList.add('opacity-0'); // Ensure it is hidden
    }

    tooltip.style.visibility = 'visible';
    requestAnimationFrame(() => {
        tooltip.classList.add('active');
    });
}

// --- 5. HIDE POPOUT ---
function hidePopOut() {
    if (!tooltip) return;
    tooltip.classList.remove('active');
    activeCard = null;
    if (ttVideo) {
        ttVideo.pause();
        ttVideo.classList.add('opacity-0');
    }
    setTimeout(() => {
        if (!activeCard) {
            tooltip.classList.add('hidden');
            if (ttVideo) ttVideo.src = "";
        }
    }, 200);
}

// --- 6. MODAL LOGIC ---
function openModal(title, desc, tech, richData, href) {
    hidePopOut();

    modalTitle.textContent = title;
    modalDesc.textContent = desc;
    modalTech.innerHTML = tech.map(t =>
        `<span class="text-xs font-bold bg-indigo-500/20 text-indigo-200 px-2 py-1 rounded border border-indigo-500/30">${t.trim()}</span>`
    ).join('');

    modalThumb.src = richData.thumb || "https://via.placeholder.com/320x160/1e293b/ffffff?text=Preview";

    if (richData.video) {
        modalVideo.src = richData.video;
        modalVideo.classList.remove('hidden');
        modalVideo.play().catch(() => { });
    } else {
        modalVideo.classList.add('hidden');
    }

    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        modalCard.classList.remove('scale-95');
        modalCard.classList.add('scale-100');
    });

    if (modalOpenTool) {
        modalOpenTool.onclick = () => window.location.href = href;
    }
}

function closeModal() {
    modal.classList.add('opacity-0');
    modalCard.classList.remove('scale-100');
    modalCard.classList.add('scale-95');
    if (modalVideo) modalVideo.pause();
    setTimeout(() => {
        modal.classList.add('hidden');
        modalVideo.src = "";
    }, 300);
}

if (modalClose) modalClose.addEventListener('click', closeModal);
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

// --- 7. UTILITIES ---
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('tool-search');
        if (searchInput) searchInput.focus();
    }
    if (e.key === 'Escape') {
        if (modal && !modal.classList.contains('hidden')) closeModal();
        else hidePopOut();
    }
});

const text1 = "Transform Documents";
const text2 = "With Intelligent AI";
const element1 = document.getElementById("typewriter-text-1");
const element2 = document.getElementById("typewriter-text-2");
let charIndex = 0;

function typeLine1() {
    if (!element1) return;
    if (charIndex < text1.length) {
        element1.textContent += text1.charAt(charIndex);
        charIndex++;
        setTimeout(typeLine1, 60);
    } else {
        charIndex = 0;
        setTimeout(typeLine2, 300);
    }
}
function typeLine2() {
    if (!element2) return;
    if (charIndex < text2.length) {
        element2.textContent += text2.charAt(charIndex);
        charIndex++;
        setTimeout(typeLine2, 60);
    }
}

document.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
        const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -8;
        const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 8;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    });
});

const toolSearch = document.getElementById('tool-search');
const mobileToolSearch = document.getElementById('mobile-tool-search');
const clearSearchBtn = document.getElementById('clear-search');
const toolCards = document.querySelectorAll('.tool-card');

function performSearch(term) {
    const searchTerm = term.toLowerCase().trim();
    toolCards.forEach(card => {
        const title = card.querySelector('h3, h4')?.textContent.toLowerCase() || '';
        const desc = card.querySelector('p')?.textContent.toLowerCase() || '';
        const tech = card.dataset.tech ? card.dataset.tech.toLowerCase() : '';
        const isMatch = title.includes(searchTerm) || desc.includes(searchTerm) || tech.includes(searchTerm);
        if (isMatch || searchTerm === '') {
            card.style.display = "";
            card.classList.remove('hidden');
        } else {
            card.style.display = "none";
        }
    });
    if (clearSearchBtn) clearSearchBtn.style.display = searchTerm ? 'block' : 'none';
}

if (toolSearch) toolSearch.addEventListener('input', (e) => performSearch(e.target.value));
if (mobileToolSearch) mobileToolSearch.addEventListener('input', (e) => performSearch(e.target.value));
if (clearSearchBtn) clearSearchBtn.addEventListener('click', () => {
    if (toolSearch) toolSearch.value = '';
    performSearch('');
});

// ==========================================
//  MOBILE MENU LOGIC (Auto-Close & Search)
// ==========================================

const mobileMenu = document.getElementById("mobile-menu");
const mobileToggle = document.getElementById("mobile-menu-toggle");
const mobileCloseBtn = document.getElementById("mobile-menu-close");
const mobileLinks = document.querySelectorAll('#mobile-menu a'); // Selects all links inside menu
const mobileSearchInput = document.getElementById('mobile-tool-search');

// 1. Function to Open Menu
function openMenu() {
    mobileMenu.classList.add("open");
    mobileToggle.classList.add("active"); // Turns lines to red/X if styled
    document.body.style.overflow = "hidden"; // Prevent scrolling background
}

// 2. Function to Close Menu
function closeMenu() {
    mobileMenu.classList.remove("open");
    mobileToggle.classList.remove("active"); // Resets hamburger icon
    document.body.style.overflow = ""; // Restore scrolling
}

// 3. Toggle Button Click
if (mobileToggle) {
    mobileToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        if (mobileMenu.classList.contains("open")) {
            closeMenu();
        } else {
            openMenu();
        }
    });
}

// 4. Close Button (X) Click
if (mobileCloseBtn) {
    mobileCloseBtn.addEventListener("click", closeMenu);
}

// 5. AUTO-CLOSE: Click on any link inside the menu
mobileLinks.forEach(link => {
    link.addEventListener("click", () => {
        closeMenu();
        // The browser will automatically scroll to the section ID in the href
    });
});

// 6. SEARCH BEHAVIOR: Close menu on 'Enter' key
if (mobileToolSearch) {
    mobileToolSearch.addEventListener('input', (e) => performSearch(e.target.value))
    mobileToolSearch.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            closeMenu();
            // Optional: Scroll to the tools section to see results
            const toolsSection = document.getElementById('ai-tools'); // or your first section
            if (toolsSection) toolsSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
    mobileToolSearch.addEventListener('input', (e) => toolSearch.value = mobileToolSearch.value)
}
// 7. Click Outside to Close (Optional Polish)
document.addEventListener('click', (e) => {
    if (mobileMenu.classList.contains('open') &&
        !mobileMenu.contains(e.target) &&
        !mobileToggle.contains(e.target)) {
        closeMenu();
    }
});

const docSection = document.getElementById('documentary-section');
const showDocBtns = document.querySelectorAll('#show-documentary, #show-documentary-nav, #show-documentary-mobile');
const closeDocBtn = document.getElementById('close-documentary');

showDocBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (docSection) docSection.classList.add('visible');
    });
});
if (closeDocBtn) closeDocBtn.addEventListener('click', () => docSection.classList.remove('visible'));

const recentStorageKey = 'pdf-toolkit-recents';
function saveRecentTool(href, title, iconHTML) {
    let recents = JSON.parse(localStorage.getItem(recentStorageKey) || '[]');
    recents = recents.filter(t => t.href !== href);
    recents.unshift({ href, title, iconHTML });
    if (recents.length > 4) recents.pop();
    localStorage.setItem(recentStorageKey, JSON.stringify(recents));
}

document.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('click', (e) => {
        if (e.target.closest('.info-btn')) return; // Ignore info button clicks for recents
        const href = card.getAttribute('href');
        const title = card.querySelector('h3, h4')?.innerText || "Tool";
        const iconDiv = card.querySelector('div.rounded-lg');
        if (href && title && iconDiv) saveRecentTool(href, title, iconDiv.innerHTML);
    });
});

function renderRecentTools() {
    const container = document.getElementById('recent-tools-container');
    if (!container) return;
    const recents = JSON.parse(localStorage.getItem(recentStorageKey) || '[]');
    if (recents.length === 0) return;

    let html = `<section class="mb-12 animate-fade-in-up"><div class="flex items-center gap-2 mb-4 px-2"><h3 class="text-sm font-bold uppercase tracking-wider text-slate-400">Jump Back In</h3></div><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">`;
    recents.forEach(tool => {
        html += `<a href="${tool.href}" class="tool-card p-4 rounded-xl flex items-center gap-3 bg-slate-800/40 border border-white/5 hover:border-purple-500/50 hover:bg-slate-800 transition-all group"><div class="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">${tool.iconHTML}</div><div class="overflow-hidden"><h4 class="font-semibold text-slate-200 text-sm truncate">${tool.title}</h4><p class="text-xs text-slate-500">Resume working</p></div></a>`;
    });
    html += `</div></section>`;
    container.innerHTML = html;
}

const backToTop = document.getElementById('back-to-top');
if (backToTop) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) backToTop.classList.add('visible');
        else backToTop.classList.remove('visible');
    });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const section = document.getElementById('documentary-section');
    const container = document.getElementById('doc-container');
    const tabs = document.querySelectorAll('.doc-tab');
    const panes = document.querySelectorAll('.doc-pane');
    const closeBtns = document.querySelectorAll('#close-documentary, #close-doc-mobile');
    const backdrop = document.getElementById('doc-backdrop');

    // 1. Tab Switching Functionality
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // Handle bubbling if icon is clicked
            const clickedTab = e.target.closest('.doc-tab');
            if (!clickedTab) return;

            // Deactivate all
            tabs.forEach(t => t.classList.remove('active'));
            panes.forEach(p => {
                p.classList.remove('active-pane');
                p.classList.add('hidden-pane');
            });

            // Activate current
            clickedTab.classList.add('active');
            const targetId = clickedTab.dataset.target;
            const targetPane = document.getElementById(targetId);

            if (targetPane) {
                targetPane.classList.remove('hidden-pane');
                targetPane.classList.add('active-pane');
            }
        });
    });

    // 2. Open/Close Logic
    // Function to close the modal
    function closeDocs() {
        section.classList.remove('flex'); // Remove flex display
        section.classList.add('hidden');  // Hide it
        section.style.opacity = '0';
        container.style.transform = 'scale(0.95)';
    }

    // Attach Close Events
    closeBtns.forEach(btn => btn.addEventListener('click', closeDocs));
    if (backdrop) backdrop.addEventListener('click', closeDocs);

    // 3. Animation Observer
    // Detects when the section class changes (e.g., when your navbar script removes 'hidden')
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === "attributes" && mutation.attributeName === "class") {
                // If the section is now visible (checked via absence of 'hidden' or presence of 'flex')
                if (!section.classList.contains('hidden')) {
                    section.classList.add('flex'); // Ensure flex is applied for centering
                    // Slight delay to trigger CSS transition
                    setTimeout(() => {
                        section.style.opacity = '1';
                        container.style.transform = 'scale(1)';
                    }, 10);
                }
            }
        });
    });

    // Start observing
    observer.observe(section, { attributes: true });
});
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('emailForm');
    const sendBtn = document.getElementById('sendBtn');
    const btnIcon = sendBtn.querySelector('.btn-icon');
    const spinner = sendBtn.querySelector('.spinner');
    const successOverlay = document.getElementById('successOverlay');
    const resetBtn = document.getElementById('resetBtn');

    const TARGET_EMAIL = "shashankan077@gmail.com";

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const from = document.getElementById('from').value;
            const subject = "Shadow Protocol Subscription";
            const message = "New subscriber via Shadow Protocol: " + from;

            // 1. UI Loading State
            sendBtn.disabled = true;
            if (btnIcon) btnIcon.classList.add('hidden');
            if (spinner) spinner.classList.remove('hidden');

            // 2. Fetch Request
            fetch(`https://formsubmit.co/ajax/${TARGET_EMAIL}`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: from,
                    _subject: subject,
                    message: message,
                    _captcha: "false"
                })
            })
                .then(response => response.json())
                .then(data => {
                    // 3. Success Animation
                    setTimeout(() => {
                        successOverlay.classList.remove('hidden');
                        requestAnimationFrame(() => {
                            successOverlay.classList.remove('opacity-0');
                        });
                    }, 800);
                })
                .catch(error => {
                    console.error(error);
                    alert("Transmission Failed. Check connection.");
                    // Reset UI
                    sendBtn.disabled = false;
                    if (btnIcon) btnIcon.classList.remove('hidden');
                    if (spinner) spinner.classList.add('hidden');
                });
        });

        // Reset Logic
        resetBtn.addEventListener('click', () => {
            successOverlay.classList.add('opacity-0');
            setTimeout(() => {
                successOverlay.classList.add('hidden');
                form.reset();
                sendBtn.disabled = false;
                if (btnIcon) btnIcon.classList.remove('hidden');
                if (spinner) spinner.classList.add('hidden');
            }, 300);
        });
    }
});

// Helper: Copy to Clipboard
window.copyToClipboard = function (text) {
    navigator.clipboard.writeText(text).then(() => {
        alert("Email copied to clipboard: " + text);
    });
}
// --- 1. Initialize Lucide Icons for New Sections ---
lucide.createIcons();

// --- 2. FAQ Accordion Logic ---
function toggleFaq(contentId, iconId) {
    const content = document.getElementById(contentId);
    const icon = document.getElementById(iconId);

    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        icon.setAttribute('data-lucide', 'chevron-up');
    } else {
        content.classList.add('hidden');
        icon.setAttribute('data-lucide', 'chevron-down');
    }
    lucide.createIcons();
}

// --- 3. Footer Animations (Souls & Seal) ---
(function () {
    let isFooterVisible = true;
    const footerObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isFooterVisible = entry.isIntersecting;
            const grid = document.getElementById('abyss-grid-el');
            if (grid) {
                grid.style.animationPlayState = isFooterVisible ? 'running' : 'paused';
            }
        });
    }, { threshold: 0.1 });

    const footerEl = document.getElementById('main-footer');
    if (footerEl) footerObserver.observe(footerEl);

    // Soul/Particle Animation
    const canvas = document.getElementById('soul-layer');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let w, h;
        let particles = [];

        function resize() {
            if (footerEl && canvas) {
                w = canvas.width = footerEl.offsetWidth;
                h = canvas.height = footerEl.offsetHeight;
            }
        }
        window.addEventListener('resize', resize);
        setTimeout(resize, 100);

        class Soul {
            constructor() { this.reset(); }
            reset() {
                this.x = Math.random() * w;
                this.y = h + Math.random() * 100;
                this.speed = Math.random() * 0.8 + 0.2;
                this.size = Math.random() * 2 + 0.5;
                this.opacity = Math.random() * 0.5;
                this.wobble = Math.random() * Math.PI * 2;
                this.life = 1;
            }
            update() {
                this.y -= this.speed;
                this.wobble += 0.02;
                this.x += Math.sin(this.wobble) * 0.3;
                this.life -= 0.002;
                if (this.y < 0 || this.life <= 0) this.reset();
            }
            draw() {
                const alpha = this.opacity * this.life;
                ctx.fillStyle = `rgba(168, 85, 247, ${alpha})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (let i = 0; i < 40; i++) particles.push(new Soul());

        function animateSouls() {
            if (!ctx) return;
            if (isFooterVisible) {
                ctx.clearRect(0, 0, w, h);
                particles.forEach(p => {
                    p.update();
                    p.draw();
                });
            }
            requestAnimationFrame(animateSouls);
        }
        animateSouls();
    }

    // Seal Animation
    const sealCanvas = document.getElementById('seal-canvas');
    if (sealCanvas) {
        const bCtx = sealCanvas.getContext('2d');
        let bw, bh;
        let tick = 0;
        const runes = "01XA9F4B3C7D8E2501XA9F4B";

        function resizeSeal() {
            const card = document.getElementById('seal-card');
            if (card) {
                bw = sealCanvas.width = card.offsetWidth;
                bh = sealCanvas.height = card.offsetHeight;
            }
        }
        window.addEventListener('resize', resizeSeal);
        setTimeout(resizeSeal, 100);

        function drawPoly(ctx, x, y, radius, sides, rotation, color, width) {
            ctx.beginPath();
            for (let i = 0; i < sides; i++) {
                const theta = (i / sides) * 2 * Math.PI + rotation;
                const px = x + radius * Math.cos(theta);
                const py = y + radius * Math.sin(theta);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.lineWidth = width;
            ctx.strokeStyle = color;
            ctx.stroke();
        }

        function drawDashedRing(ctx, x, y, radius, dashArray, rotation, color, width) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.beginPath();
            ctx.setLineDash(dashArray);
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.lineWidth = width;
            ctx.strokeStyle = color;
            ctx.stroke();
            ctx.restore();
        }

        function drawRunesRing(ctx, x, y, radius, count, rotation, color) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.font = '10px monospace';
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const step = (Math.PI * 2) / count;
            for (let i = 0; i < count; i++) {
                ctx.save();
                ctx.rotate(i * step);
                ctx.translate(0, -radius);
                ctx.fillText(runes[i % runes.length], 0, 0);
                ctx.restore();
            }
            ctx.restore();
        }

        function animateSeal() {
            if (!bCtx) return;
            if (isFooterVisible) {
                bCtx.globalCompositeOperation = 'source-over';
                bCtx.clearRect(0, 0, bw, bh);
                bCtx.globalCompositeOperation = 'lighter';

                const cx = bw / 2;
                const cy = bh / 2;
                tick += 0.002;

                const cRed = '#e11d48';
                const cDark = '#881337';
                const cHot = '#fb7185';

                drawDashedRing(bCtx, cx, cy, 140, [5, 10], tick * 0.5, cDark, 1);
                drawDashedRing(bCtx, cx, cy, 135, [10, 5], -tick * 0.5, cRed, 1.5);
                drawRunesRing(bCtx, cx, cy, 120, 24, tick * 0.2, cHot);
                drawPoly(bCtx, cx, cy, 95, 6, tick, cRed, 1);
                drawPoly(bCtx, cx, cy, 95, 6, tick + Math.PI / 6, cRed, 1);
                drawDashedRing(bCtx, cx, cy, 85, [2, 4], tick * 2, cHot, 1);

                const pulse = (Math.sin(tick * 10) + 1) / 2;
                bCtx.beginPath();
                bCtx.arc(cx, cy, 10 + (pulse * 5), 0, Math.PI * 2);
                bCtx.fillStyle = cRed;
                bCtx.fill();
            }
            requestAnimationFrame(animateSeal);
        }
        animateSeal();
    }
})();

function toggleThemeAnimation() {
    const overlay = document.getElementById('candle-overlay');
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');

    // 1. Show Animation Overlay
    overlay.classList.remove('hidden');

    // 2. Wait for the "Flash" part of the animation (approx 1.5s - 1.8s in)
    // The background flickers from white to black. We switch themes then.
    setTimeout(() => {
        body.classList.toggle('light-mode');

        // Update Icon
        if (body.classList.contains('light-mode')) {
            themeIcon.setAttribute('data-lucide', 'sun');
            themeIcon.classList.replace('text-gray-300', 'text-orange-500'); // Optional color change
        } else {
            themeIcon.setAttribute('data-lucide', 'moon');
            themeIcon.classList.replace('text-orange-500', 'text-gray-300');
        }
        lucide.createIcons();
    }, 1800);

    // 3. Hide Overlay after animation finishes (3s total cycle)
    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 3000);
}

// ==========================================
//  SCROLL SPY (Navigation Highlighter)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

    // 1. Select all sections that match your nav links
    // (We assume sections have IDs like: ai-tools, pdf-organization, etc.)
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    // 2. Configuration for the observer
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.3 // Trigger when 30% of the section is visible
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // A. Get the ID of the section currently in view
                const currentId = entry.target.getAttribute('id');

                // B. Remove 'active' class from ALL links
                navLinks.forEach(link => {
                    link.classList.remove('active');

                    // C. Add 'active' class ONLY to the matching link
                    // Checks if href="#sectionID" matches the current ID
                    if (link.getAttribute('href') === `#${currentId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    // 3. Start observing all sections
    sections.forEach(section => {
        observer.observe(section);
    });
});
// ==========================================
//  SMART HOVER NAVIGATION (Intent System)
// ==========================================
const navTriggers = document.querySelectorAll('.mega-menu-trigger');
let activeNavItem = null;
let navCloseTimer = null;

navTriggers.forEach(trigger => {
    // 1. Mouse Enter: Open this menu, Close others instantly
    trigger.addEventListener('mouseenter', () => {
        // A. Cancel any pending close timer (user came back!)
        if (navCloseTimer) {
            clearTimeout(navCloseTimer);
            navCloseTimer = null;
        }

        // B. If a different menu is open, close it IMMEDIATELY (No delay)
        if (activeNavItem && activeNavItem !== trigger) {
            activeNavItem.classList.remove('hover-active');
        }

        // C. Open the current menu
        trigger.classList.add('hover-active');
        activeNavItem = trigger;
    });

    // 2. Mouse Leave: Wait before closing (Allows diagonal movement)
    trigger.addEventListener('mouseleave', () => {
        // Start a 300ms timer. If user doesn't come back or enter another menu, CLOSE IT.
        navCloseTimer = setTimeout(() => {
            trigger.classList.remove('hover-active');
            if (activeNavItem === trigger) {
                activeNavItem = null;
            }
        }, 300); // <--- Adjust this delay (in ms) if you need more/less time
    });
});
(function initTrustVault() {
    // Check if vault exists to prevent errors
    const vaultWrapper = document.getElementById('vault-wrapper');
    if (!vaultWrapper) return;

    // --- 1. SETUP & REFS ---
    const vaultAttacks = [
        { id: 'crowbar', label: 'KINETIC RAM', icon: 'hammer', colorClass: 'text-amber-500 dark:text-amber-400', duration: 2500 },
        { id: 'laser', label: 'PLASMA BEAM', icon: 'zap', colorClass: 'text-cyan-500 dark:text-cyan-400', duration: 2500 },
        { id: 'explosive', label: 'THERMAL CHARGE', icon: 'flame', colorClass: 'text-orange-500 dark:text-orange-500', duration: 3000 },
        { id: 'hack', label: 'QUANTUM DECRYPT', icon: 'terminal', colorClass: 'text-emerald-500 dark:text-emerald-400', duration: 3000 },
        { id: 'nuke', label: 'OMEGA STRIKE', icon: 'skull', colorClass: 'text-rose-500 dark:text-rose-500', duration: 5000 }
    ];

    const progressBar = document.getElementById('vault-progress-bar');
    const shieldLayer = document.getElementById('shield-layer');
    const messageContainer = document.getElementById('vault-message-container');
    const messageText = document.getElementById('vault-message-text');
    const particleContainer = document.getElementById('vault-particle-container');
    const lockBg = document.getElementById('vault-lock-bg');
    const lockIcon = document.getElementById('vault-lock-icon');
    const attackIconContainer = document.getElementById('vault-attack-icon');
    const attackLabel = document.getElementById('vault-attack-label');

    let currentIndex = 0;
    let isAttacking = false;

    // --- 2. 3D MOUSE PARALLAX (DISABLED) ---
    // Code removed to stop tilting effect
    /*
    document.addEventListener('mousemove', (e) => {
        if (window.innerWidth < 768) return; 
        const x = (window.innerWidth / 2 - e.pageX) / 40;
        const y = (window.innerHeight / 2 - e.pageY) / 40;
        vaultWrapper.style.transform = `rotateY(${-x}deg) rotateX(${y}deg)`;
        particleContainer.style.transform = `translate(${x * 2}px, ${y * 2}px)`;
    });
    */

    // --- 3. PARTICLE SYSTEM ---
    function spawnParticles(type, count = 10) {
        // Detect current theme based on body class
        const isLight = document.body.classList.contains('light-mode');

        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.classList.add('vault-particle');

            // Visual Config
            let bgClass = 'bg-slate-400';
            let shadowClass = '';
            let content = '';
            let sizeClass = 'w-1 h-1';

            if (type === 'spark') {
                bgClass = isLight ? 'bg-amber-500' : 'bg-amber-200';
                shadowClass = 'shadow-[0_0_10px_orange]';
            } else if (type === 'fire') {
                bgClass = 'bg-orange-500';
                shadowClass = 'shadow-[0_0_15px_red]';
                sizeClass = 'w-1.5 h-1.5';
            } else if (type === 'laser') {
                bgClass = isLight ? 'bg-cyan-500' : 'bg-cyan-200';
                shadowClass = 'shadow-[0_0_10px_cyan]';
            } else if (type === 'nuclear') {
                bgClass = 'bg-rose-500';
                sizeClass = 'w-2 h-2';
            } else if (type === 'binary') {
                bgClass = isLight ? 'bg-emerald-600' : 'bg-emerald-400';
                p.classList.add('font-mono', 'text-[8px]', 'flex', 'items-center', 'justify-center', 'text-white');
                content = Math.random() > 0.5 ? '1' : '0';
                sizeClass = 'w-auto h-auto px-0.5';
            }

            p.className = `vault-particle ${sizeClass} ${bgClass} ${shadowClass}`;
            if (content) p.innerText = content;

            const startX = 50 + (Math.random() * 60 - 30);
            const startY = 40 + (Math.random() * 60 - 30);

            p.style.left = `${startX}%`;
            p.style.top = `${startY}%`;

            const angle = Math.random() * 360;
            const distance = 150 + Math.random() * 100;
            const tx = (Math.cos(angle) * distance) + 'px';
            const ty = (Math.sin(angle) * distance) + 'px';

            p.style.setProperty('--tx', tx);
            p.style.setProperty('--ty', ty);

            p.style.animation = `flyOut 0.8s forwards cubic-bezier(0,0.9,0.57,1)`;

            particleContainer.appendChild(p);
            p.addEventListener('animationend', () => p.remove());
        }
    }

    // --- 4. ATTACK LOGIC ---
    function performAttack(attack) {
        const isLight = document.body.classList.contains('light-mode');

        // Update Lock Status
        lockBg.className = "absolute inset-0 bg-red-500/20 transition-colors duration-200";
        lockIcon.classList.remove('text-purple-600', 'dark:text-purple-400');
        lockIcon.classList.add('text-red-600', 'dark:text-red-500');

        // Show Shield
        shieldLayer.classList.remove('opacity-0', 'scale-95');
        shieldLayer.classList.add('opacity-100', 'scale-105', 'shadow-[0_0_30px_rgba(139,92,246,0.4)]');

        let particleType = 'spark';
        let visualText = '';
        let particleCount = 30;
        let msgColor = 'text-white';

        switch (attack.id) {
            case 'crowbar':
                particleType = 'dust'; visualText = 'IMPACT // ABSORBED';
                msgColor = 'text-amber-400';
                break;
            case 'explosive':
                particleType = 'fire'; visualText = 'BLAST // NULLIFIED';
                msgColor = 'text-orange-400';
                break;
            case 'laser':
                particleType = 'laser'; visualText = 'ENERGY // DEFLECTED';
                msgColor = 'text-cyan-400';
                break;
            case 'hack':
                particleType = 'binary'; visualText = 'ACCESS // DENIED';
                msgColor = 'text-emerald-400';
                break;
            case 'nuke':
                particleType = 'nuclear'; visualText = 'DAMAGE // ZERO';
                particleCount = 60;
                msgColor = 'text-rose-400';
                break;
        }

        // Show Message
        messageText.innerText = visualText;
        messageText.className = `text-2xl md:text-3xl font-black italic text-center whitespace-nowrap font-orbitron text-glow ${msgColor}`;
        messageContainer.style.opacity = '1';
        messageContainer.style.transform = 'translate(-50%, -50%) scale(1.1)';

        setTimeout(() => {
            messageContainer.style.opacity = '0';
            messageContainer.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 1200);

        spawnParticles(particleType, particleCount);

        // Reset
        setTimeout(() => {
            // Restore Lock
            lockBg.className = "absolute inset-0 bg-purple-500/10 transition-colors duration-300";
            lockIcon.classList.remove('text-red-600', 'dark:text-red-500');
            lockIcon.classList.add('text-purple-600', 'dark:text-purple-400');

            // Hide Shield
            shieldLayer.classList.add('opacity-0', 'scale-95');
            shieldLayer.classList.remove('opacity-100', 'scale-105');
        }, 1000);
    }

    function updateMonitor(attack) {
        if (window.lucide) {
            attackIconContainer.innerHTML = `<i data-lucide="${attack.icon}" class="w-5 h-5 ${attack.colorClass}"></i>`;
            window.lucide.createIcons();
        }
        attackLabel.innerText = attack.label;
        attackLabel.className = `text-xs font-bold font-orbitron tracking-wide transition-colors duration-300 ${attack.colorClass}`;
    }

    // --- 5. LOOP ---
    function startLoop() {
        if (isAttacking) return;

        const currentAttack = vaultAttacks[currentIndex];
        updateMonitor(currentAttack);

        let timeLeft = 35;

        const interval = setInterval(() => {
            timeLeft--;
            const percentage = (timeLeft / 35) * 100;
            progressBar.style.width = `${percentage}%`;

            if (timeLeft <= 0) {
                clearInterval(interval);
                isAttacking = true;

                performAttack(currentAttack);

                setTimeout(() => {
                    isAttacking = false;
                    currentIndex = (currentIndex + 1) % vaultAttacks.length;
                    startLoop();
                }, currentAttack.duration);
            }
        }, 100);
    }

    startLoop();
})();