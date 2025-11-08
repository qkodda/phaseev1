/* ============================================
   CONTENT IDEA GENERATOR APP
   Main JavaScript File
   ============================================ */

// ============================================
// IMPORTS
// ============================================
import {
    initAuth,
    isAuthenticated,
    getUser,
    handleSignUp,
    handleSignIn,
    handleSignOut,
    getUserProfile,
    updateUserProfile,
    hasCompletedOnboarding,
    markOnboardingComplete,
    startTrial,
    isTrialExpired,
    hasActiveSubscription,
    onAuthStateChange
} from './auth-integration.js';

// ============================================
// CULTURE VALUES CAROUSEL
// ============================================

/**
 * Initialize auto-scrolling carousels for culture values
 */
function initCultureValueCarousels() {
    const pillSelections = document.querySelectorAll('.pill-selection');
    
    pillSelections.forEach(container => {
        const rows = container.querySelectorAll('.pill-row');
        
        rows.forEach(row => {
            // Get speed from data attribute (default 30s)
            const speed = row.dataset.speed || 30;
            row.style.setProperty('--scroll-duration', `${speed}s`);
            
            // Duplicate pills for seamless infinite scroll
            const pills = Array.from(row.children);
            pills.forEach(pill => {
                const clone = pill.cloneNode(true);
                row.appendChild(clone);
            });
        });
    });
}

// ============================================
// PAGE NAVIGATION SYSTEM
// ============================================

/**
 * Confirm redo onboarding - custom modal
 */
function confirmRedoOnboarding() {
    showConfirmModal(
        'Redo Onboarding?',
        'Are you sure you want to redo the onboarding process? This will reset your preferences.',
        () => navigateTo('onboarding-1-page')
    );
}

/**
 * Handle change password
 */
function handleChangePassword() {
    const current = document.getElementById('current-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirm = document.getElementById('confirm-password').value;
    
    if (!current || !newPass || !confirm) {
        showAlertModal('Error', 'Please fill in all fields.');
        return;
    }
    
    if (newPass.length < 8) {
        showAlertModal('Error', 'New password must be at least 8 characters long.');
        return;
    }
    
    if (newPass !== confirm) {
        showAlertModal('Error', 'New passwords do not match.');
        return;
    }
    
    // Success
    showAlertModal('Success', 'Your password has been changed successfully.', () => navigateTo('account-details-page'));
}

/**
 * Handle delete account
 */
function handleDeleteAccount() {
    const password = document.getElementById('delete-confirm-password').value;
    
    if (!password) {
        showAlertModal('Error', 'Please enter your password to confirm.');
        return;
    }
    
    showConfirmModal(
        'Delete Account - Final Confirmation',
        'This is your last chance. Are you absolutely sure you want to delete your account? This action cannot be undone.',
        () => {
            showAlertModal('Account Deleted', 'Your account has been permanently deleted. We\'re sorry to see you go.', () => navigateTo('sign-in-page'));
        }
    );
}

/**
 * Show custom confirm modal
 */
function showConfirmModal(title, message, onConfirm) {
    const modal = document.getElementById('custom-confirm-modal');
    const titleEl = document.getElementById('confirm-modal-title');
    const messageEl = document.getElementById('confirm-modal-message');
    const cancelBtn = document.getElementById('confirm-modal-cancel');
    const confirmBtn = document.getElementById('confirm-modal-confirm');
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    modal.classList.add('active');
    
    // Remove old listeners
    const newCancelBtn = cancelBtn.cloneNode(true);
    const newConfirmBtn = confirmBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // Add new listeners
    newCancelBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    newConfirmBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        if (onConfirm) onConfirm();
    });
    
    // Close on outside click
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    };
}

/**
 * Show custom alert modal
 */
function showAlertModal(title, message, onClose) {
    const modal = document.getElementById('custom-alert-modal');
    const titleEl = document.getElementById('alert-modal-title');
    const messageEl = document.getElementById('alert-modal-message');
    const okBtn = document.getElementById('alert-modal-ok');
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    modal.classList.add('active');
    
    // Remove old listener
    const newOkBtn = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    
    // Add new listener
    newOkBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        if (onClose) onClose();
    });
    
    // Close on outside click
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            if (onClose) onClose();
        }
    };
}

/**
 * Initialize platform preference selection
 */
document.addEventListener('DOMContentLoaded', () => {
    const platformItems = document.querySelectorAll('.platform-select-item, .platform-select-icon');
    platformItems.forEach(item => {
        item.addEventListener('click', () => {
            item.classList.toggle('selected');
        });
    });

    enhanceCustomDropdowns();
    initLocationButtons();
    initCultureValueCarousel();
    loadProfileData();
    updateTrialCountdownDisplay();
});

/**
 * Navigate between pages
 * @param {string} pageId - The ID of the page to navigate to
 */
function navigateTo(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    const restrictedPages = new Set([
        'homepage',
        'profile-page',
        'settings-page',
        'account-details-page',
        'change-password-page',
        'delete-account-page',
        'notifications-page'
    ]);

    if (restrictedPages.has(pageId) && !hasAccessToPaidContent()) {
        const message = isTrialStarted()
            ? 'Your free trial has ended. Subscribe to continue.'
            : 'Start your free trial to unlock the full experience.';
        const paywallPage = document.getElementById('paywall-page');
        if (paywallPage) {
            paywallPage.classList.add('active');
        }
        startTrialCountdown();
        updateTrialCountdownDisplay();
        showAlertModal('Access Locked', message);
        window.scrollTo(0, 0);
        return;
    }
    
    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Track page view
    trackPageView(pageId);
    
    if (pageId === 'paywall-page') {
        startTrialCountdown();
        updateTrialCountdownDisplay();
    } else {
        stopTrialCountdown();
    }
    
    // Generate cards when navigating to homepage for the first time
    if (pageId === 'homepage') {
        const cardStack = document.getElementById('card-stack');
        const existingCards = cardStack ? cardStack.querySelectorAll('.idea-card') : [];
        
        // Only generate if cards haven't been generated yet
        if (existingCards.length === 0) {
            generateNewIdeas();
        }
    }
    
    // Update header button based on page
    const homeProfileBtn = document.querySelector('#homepage .profile-pill-btn');
    
    if (pageId === 'homepage') {
        // Show profile icon on homepage
        if (homeProfileBtn) {
            homeProfileBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="white" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
            `;
            homeProfileBtn.setAttribute('onclick', "navigateTo('profile-page')");
            homeProfileBtn.setAttribute('aria-label', 'Profile');
        }
    }
    
    if (pageId === 'profile-page') {
        loadProfileData();
    }
    
    // Scroll to top of new page
    window.scrollTo(0, 0);
}

// ============================================
// AUTH TOGGLE (Sign In / Sign Up)
// ============================================

// Global variables
let pendingScheduleCard = null; // For calendar date picker
let isEditMode = false; // Track edit mode state
let ideasStack = []; // Stack of idea cards
let cardsRemaining = 7; // Track remaining cards
const TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000;
let trialCountdownInterval = null;
const PROFILE_STORAGE_KEY = 'phasee_profile';

// ============================================
// COLLAPSED CARD ACTIONS (Global Functions)
// ============================================

/**
 * Schedule an idea from the pinned section (opens calendar)
 */
window.scheduleIdea = function(button) {
    const card = button.closest('.idea-card-collapsed');
    if (!card) return;

    // Store the card for later when date is selected
    pendingScheduleCard = card;

    // Open calendar modal and generate calendar picker
    const calendarModal = document.getElementById('calendar-modal');
    if (calendarModal) {
        generateCalendarPicker();
        calendarModal.classList.add('active');
    }

    console.log('Opening calendar for scheduling');
}

/**
 * Confirm schedule with selected date
 */
function confirmScheduleDate(selectedDateStr) {
    if (!pendingScheduleCard) return;
    if (!selectedDateStr) return;

    const selectedDate = new Date(selectedDateStr + 'T00:00:00');
    const month = selectedDate.toLocaleDateString('en-US', { month: 'short' });
    const day = selectedDate.getDate();

    const ideaData = JSON.parse(pendingScheduleCard.dataset.idea);
    ideaData.scheduledDate = selectedDateStr;
    ideaData.scheduledMonth = month;
    ideaData.scheduledDay = day;

    // Move to schedule section
    const scheduleList = document.querySelector('.schedule-list');
    if (!scheduleList) return;

    // Remove empty state if present
    const emptyState = scheduleList.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }

    // Create scheduled card (different from pinned)
    const scheduledCard = createScheduledCard(ideaData);
    
    // Insert in chronological order
    const existingCards = scheduleList.querySelectorAll('.idea-card-collapsed');
    let inserted = false;
    
    for (let card of existingCards) {
        const cardData = JSON.parse(card.dataset.idea);
        if (cardData.scheduledDate && ideaData.scheduledDate < cardData.scheduledDate) {
            scheduleList.insertBefore(scheduledCard, card);
            inserted = true;
            break;
        }
    }
    
    if (!inserted) {
        scheduleList.appendChild(scheduledCard);
    }

    // Remove from pinned
    pendingScheduleCard.remove();

    // Update pinned count
    const countElement = document.querySelector('.pinned-ideas .count');
    if (countElement) {
        const currentCount = parseInt(countElement.textContent.match(/\d+/)[0]);
        countElement.textContent = `(${Math.max(0, currentCount - 1)})`;
        
        // Re-add empty state if no cards left
        if (currentCount - 1 === 0) {
            const grid = document.querySelector('.ideas-grid');
            if (grid && grid.children.length === 0) {
                grid.innerHTML = '<div class="empty-state"><p>No pinned ideas yet. Start swiping!</p></div>';
            }
        }
    }

    // Close calendar modal
    const calendarModal = document.getElementById('calendar-modal');
    if (calendarModal) {
        calendarModal.classList.remove('active');
    }

    pendingScheduleCard = null;
    generateScheduleCalendar();
    console.log('Scheduled idea for:', month, day);
}

/**
 * Create a scheduled card (with date, no expand/delete)
 */
function createScheduledCard(idea) {
    const iconMap = {
        'tiktok': '<img src="https://cdn.simpleicons.org/tiktok/000000" alt="TikTok" class="platform-icon">',
        'instagram': '<img src="https://cdn.simpleicons.org/instagram/E4405F" alt="Instagram" class="platform-icon">',
        'youtube': '<img src="https://cdn.simpleicons.org/youtube/FF0000" alt="YouTube" class="platform-icon">',
        'twitter': '<img src="https://cdn.simpleicons.org/x/000000" alt="Twitter" class="platform-icon">',
        'facebook': '<img src="https://cdn.simpleicons.org/facebook/1877F2" alt="Facebook" class="platform-icon">'
    };
    const platformIconsHTML = idea.platforms.map(p => iconMap[p] || '').join('');

    const scheduledCard = document.createElement('div');
    scheduledCard.className = 'idea-card-collapsed';
    scheduledCard.innerHTML = `
        <div class="collapsed-content">
            <div class="collapsed-title">
                <span class="title-text">"${idea.title}"</span>
                <div class="collapsed-platforms">
                    ${platformIconsHTML}
                </div>
            </div>
            <div class="collapsed-summary">${idea.summary}</div>
        </div>
        <div class="collapsed-actions">
            <div class="collapsed-scheduled-date">
                <div class="date-month">${idea.scheduledMonth}</div>
                <div class="date-day">${idea.scheduledDay}</div>
            </div>
        </div>
    `;

    // Store full idea data
    scheduledCard.dataset.idea = JSON.stringify(idea);
    scheduledCard.dataset.platforms = (idea.platforms || []).join(', ');

    // Add click handler for expansion (entire card, except date badge)
    scheduledCard.addEventListener('click', (e) => {
        // Don't expand if clicking on the date badge
        if (e.target.closest('.collapsed-scheduled-date')) {
            return;
        }
        expandIdeaCard(scheduledCard);
    });

    return scheduledCard;
}

/**
 * Expand an idea to show full details (triggered by expand button)
 */
function expandIdea(button) {
    const card = button.closest('.idea-card-collapsed');
    if (!card) return;

    expandIdeaCard(card);
}

/**
 * Expand idea card into modal view
 */
function expandIdeaCard(card) {
    const ideaData = JSON.parse(card.dataset.idea);
    const isPinned = card.closest('.pinned-ideas') !== null;
    const isScheduled = card.closest('.schedule-list') !== null;
    
    // Get the expanded modal and card element
    const expandedModal = document.getElementById('expanded-idea-modal');
    const expandedCard = document.getElementById('expanded-idea-card');
    
    if (!expandedModal || !expandedCard) return;

    // Create platform icons HTML
    const iconMap = {
        'tiktok': '<img src="https://cdn.simpleicons.org/tiktok/000000" alt="TikTok" class="platform-icon">',
        'instagram': '<img src="https://cdn.simpleicons.org/instagram/E4405F" alt="Instagram" class="platform-icon">',
        'youtube': '<img src="https://cdn.simpleicons.org/youtube/FF0000" alt="YouTube" class="platform-icon">',
        'twitter': '<img src="https://cdn.simpleicons.org/x/000000" alt="Twitter" class="platform-icon">',
        'facebook': '<img src="https://cdn.simpleicons.org/facebook/1877F2" alt="Facebook" class="platform-icon">'
    };
    const platformIconsHTML = ideaData.platforms.map(p => iconMap[p] || '').join('');

    // Build action buttons based on card type
    let topActionsHTML = '';
    let bottomActionsHTML = '';

    // Top actions: trash icon (always present) + copy icon for scheduled cards
    const copyIconHTML = isScheduled ? `
        <button class="expanded-action-btn copy-btn" onclick="copyIdeaToClipboard()" aria-label="Copy" title="Copy to Clipboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
        </button>
    ` : '';

    topActionsHTML = `
        <div class="expanded-card-actions top-actions">
            <button class="expanded-action-btn" onclick="deleteIdeaFromExpanded()" aria-label="Delete" title="Delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
            ${copyIconHTML}
        </div>
    `;

    // Build bottom actions based on card type
    const editButtonHTML = `
        <button class="expanded-action-btn edit-btn" id="edit-btn-expanded" onclick="toggleEditMode()" aria-label="Edit" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
        </button>
    `;

    if (isPinned) {
        // Pinned card: schedule button on right
        bottomActionsHTML = `
            ${editButtonHTML}
            <button class="expanded-action-btn schedule-btn" onclick="scheduleFromExpanded()" aria-label="Schedule" title="Schedule">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
            </button>
        `;
    } else {
        // Scheduled card: green checkmark on right (closes modal)
        bottomActionsHTML = `
            ${editButtonHTML}
            <button class="expanded-action-btn checkmark-btn" onclick="closeExpandedModal()" aria-label="Close" title="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </button>
        `;
    }

    // Populate the expanded card with full details
    expandedCard.innerHTML = `
        ${topActionsHTML}
        <h3 class="card-title" contenteditable="false">"${ideaData.title}"</h3>
        
        <div class="card-content">
            <div class="card-section">
                <span class="section-label">Summary:</span>
                <p class="section-text" contenteditable="false">${ideaData.summary}</p>
            </div>

            <div class="card-section">
                <span class="section-label">Action/Story:</span>
                <p class="section-text" contenteditable="false">${ideaData.action}</p>
            </div>

            <div class="card-section">
                <span class="section-label">Shot/Setup:</span>
                <p class="section-text" contenteditable="false">${ideaData.setup}</p>
            </div>

            <div class="card-section">
                <span class="section-label">Story:</span>
                <p class="section-text" contenteditable="false">${ideaData.story}</p>
            </div>

            <div class="card-section">
                <span class="section-label">Hook:</span>
                <p class="section-text" contenteditable="false">${ideaData.hook}</p>
            </div>

            <div class="card-section">
                <span class="section-label">Why:</span>
                <p class="section-text" contenteditable="false">${ideaData.why}</p>
            </div>
        </div>

        <div class="card-actions-bottom">
            ${bottomActionsHTML}
            <div class="platform-icons" id="expanded-platform-icons">
                ${platformIconsHTML}
            </div>
        </div>
    `;

    // Store the original card reference
    expandedCard.dataset.originalCard = card.dataset.idea;
    expandedCard.dataset.isPinned = isPinned;
    expandedCard.dataset.isScheduled = isScheduled;

    // Show the modal
    expandedModal.classList.add('active');
    console.log('Expanded idea:', ideaData.title);
}

/**
 * Delete an idea from the expanded modal view
 */
function deleteIdeaFromExpanded() {
    const expandedCard = document.getElementById('expanded-idea-card');
    if (!expandedCard || !expandedCard.dataset.originalCard) return;

    const ideaData = JSON.parse(expandedCard.dataset.originalCard);
    
    showConfirmModal(
        `Delete "${ideaData.title}"?`,
        'This idea will be removed from your workspace.',
        () => {
            const allCollapsedCards = document.querySelectorAll('.idea-card-collapsed');
            let cardToDelete = null;

            allCollapsedCards.forEach(card => {
                const cardData = JSON.parse(card.dataset.idea || '{}');
                const matchesById = ideaData.id && cardData.id && ideaData.id === cardData.id;
                const matchesByTitle = !ideaData.id && cardData.title === ideaData.title;
                if (matchesById || matchesByTitle) {
                    cardToDelete = card;
                }
            });

            if (cardToDelete) {
                removeCollapsedCard(cardToDelete);
            }

            closeExpandedModal();
        }
    );
}

/**
 * Toggle edit mode for expanded idea card
 */
function toggleEditMode() {
    const expandedCard = document.getElementById('expanded-idea-card');
    const editBtn = document.getElementById('edit-btn-expanded');
    if (!expandedCard || !editBtn) return;

    isEditMode = !isEditMode;

    const editableElements = expandedCard.querySelectorAll('.card-title, .section-text');
    const platformIconsContainer = expandedCard.querySelector('#expanded-platform-icons');
    
    if (isEditMode) {
        // Enter edit mode
        editableElements.forEach(el => {
            el.contentEditable = 'true';
            el.classList.add('editable');
        });
        
        // Show ALL platform icons for selection
        if (platformIconsContainer) {
            const ideaData = JSON.parse(expandedCard.dataset.originalCard);
            const currentPlatforms = ideaData.platforms || [];
            
            const allPlatforms = ['tiktok', 'instagram', 'youtube', 'twitter', 'facebook'];
            const iconMap = {
                'tiktok': '<img src="https://cdn.simpleicons.org/tiktok/000000" alt="TikTok" class="platform-icon">',
                'instagram': '<img src="https://cdn.simpleicons.org/instagram/E4405F" alt="Instagram" class="platform-icon">',
                'youtube': '<img src="https://cdn.simpleicons.org/youtube/FF0000" alt="YouTube" class="platform-icon">',
                'twitter': '<img src="https://cdn.simpleicons.org/x/000000" alt="Twitter" class="platform-icon">',
                'facebook': '<img src="https://cdn.simpleicons.org/facebook/1877F2" alt="Facebook" class="platform-icon">'
            };
            
            platformIconsContainer.innerHTML = '';
            platformIconsContainer.classList.add('edit-mode');
            
            allPlatforms.forEach(platform => {
                const iconWrapper = document.createElement('div');
                iconWrapper.className = 'platform-icon-wrapper';
                iconWrapper.dataset.platform = platform;
                
                if (!currentPlatforms.includes(platform)) {
                    iconWrapper.classList.add('unselected');
                }
                
                iconWrapper.innerHTML = iconMap[platform];
                iconWrapper.onclick = () => togglePlatformSelection(iconWrapper);
                
                platformIconsContainer.appendChild(iconWrapper);
            });
        }
        
        // Change edit button to green checkmark (save)
        editBtn.className = 'expanded-action-btn save-btn';
        editBtn.setAttribute('title', 'Save');
        editBtn.setAttribute('aria-label', 'Save');
        editBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
        
        console.log('Edit mode: ON');
    } else {
        // Exit edit mode (save)
        editableElements.forEach(el => {
            el.contentEditable = 'false';
            el.classList.remove('editable');
        });
        
        // Save selected platforms and show only selected
        if (platformIconsContainer) {
            const selectedWrappers = platformIconsContainer.querySelectorAll('.platform-icon-wrapper:not(.unselected)');
            const selectedPlatforms = Array.from(selectedWrappers).map(w => w.dataset.platform);
            
            // Update the idea data
            const ideaData = JSON.parse(expandedCard.dataset.originalCard);
            ideaData.platforms = selectedPlatforms;
            expandedCard.dataset.originalCard = JSON.stringify(ideaData);
            
            // Show only selected platforms
            const iconMap = {
                'tiktok': '<img src="https://cdn.simpleicons.org/tiktok/000000" alt="TikTok" class="platform-icon">',
                'instagram': '<img src="https://cdn.simpleicons.org/instagram/E4405F" alt="Instagram" class="platform-icon">',
                'youtube': '<img src="https://cdn.simpleicons.org/youtube/FF0000" alt="YouTube" class="platform-icon">',
                'twitter': '<img src="https://cdn.simpleicons.org/x/000000" alt="Twitter" class="platform-icon">',
                'facebook': '<img src="https://cdn.simpleicons.org/facebook/1877F2" alt="Facebook" class="platform-icon">'
            };
            
            platformIconsContainer.innerHTML = selectedPlatforms.map(p => iconMap[p] || '').join('');
            platformIconsContainer.classList.remove('edit-mode');
        }
        
        const ideaData = JSON.parse(expandedCard.dataset.originalCard);
        syncCollapsedCards(ideaData);
        
        // Change back to edit icon
        editBtn.className = 'expanded-action-btn edit-btn';
        editBtn.setAttribute('title', 'Edit');
        editBtn.setAttribute('aria-label', 'Edit');
        editBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
        `;
        
        console.log('Edit mode: OFF (saved)');
    }
}

function togglePlatformSelection(wrapper) {
    wrapper.classList.toggle('unselected');
}

/**
 * Schedule from expanded modal (pinned cards only)
 */
function scheduleFromExpanded() {
    const expandedCard = document.getElementById('expanded-idea-card');
    if (!expandedCard) return;

    const ideaData = JSON.parse(expandedCard.dataset.originalCard);
    
    // Find the original collapsed card
    const allCollapsedCards = document.querySelectorAll('.idea-card-collapsed');
    let originalCard = null;
    
    allCollapsedCards.forEach(card => {
        const cardData = JSON.parse(card.dataset.idea);
        if (cardData.title === ideaData.title) {
            originalCard = card;
        }
    });

    if (originalCard) {
        // Close expanded modal
        const expandedModal = document.getElementById('expanded-idea-modal');
        if (expandedModal) {
            expandedModal.classList.remove('active');
        }

        // Store card for scheduling
        pendingScheduleCard = originalCard;

        // Open calendar modal and generate calendar picker
        const calendarModal = document.getElementById('calendar-modal');
        if (calendarModal) {
            generateCalendarPicker();
            calendarModal.classList.add('active');
        }
    }
}

/**
 * Copy idea to clipboard from expanded modal
 */
function copyIdeaToClipboard() {
    const expandedCard = document.getElementById('expanded-idea-card');
    if (!expandedCard) return;

    const ideaData = JSON.parse(expandedCard.dataset.originalCard);
    
    // Format the idea content (clean, no emojis)
    let copyText = `${ideaData.title}\n\n`;
    copyText += `Summary: ${ideaData.summary}\n\n`;
    copyText += `Action/Story: ${ideaData.action}\n\n`;
    copyText += `Shot/Setup: ${ideaData.setup}\n\n`;
    copyText += `Story: ${ideaData.story}\n\n`;
    copyText += `Hook: ${ideaData.hook}\n\n`;
    copyText += `Why: ${ideaData.why}\n\n`;
    copyText += `Platforms: ${ideaData.platforms.join(', ')}\n\n`;
    copyText += `Generated with Phasee - Experiential Storytelling`;

    // Copy to clipboard - try multiple methods
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(copyText).then(() => {
            showCopySuccess();
        }).catch(err => {
            console.error('Clipboard API failed:', err);
            fallbackCopy(copyText);
        });
    } else {
        fallbackCopy(copyText);
    }
}

function showCopySuccess() {
    const expandedCard = document.getElementById('expanded-idea-card');
    const copyBtn = expandedCard?.querySelector('.copy-btn');
    if (copyBtn) {
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
        setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
        }, 1500);
    }
}

function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        showCopySuccess();
    } catch (err) {
        console.error('Fallback copy failed:', err);
        showAlertModal('Copy Text', `Copy the idea manually:\n\n${text}`);
    }
    document.body.removeChild(textArea);
}

/**
 * Close the expanded idea modal
 */
window.closeExpandedModal = function() {
    const expandedModal = document.getElementById('expanded-idea-modal');
    if (expandedModal) {
        expandedModal.classList.remove('active');
    }

    const expandedCard = document.getElementById('expanded-idea-card');
    if (expandedCard) {
        const editableFields = expandedCard.querySelectorAll('.editable');
        editableFields.forEach(field => {
            field.contentEditable = 'false';
            field.classList.remove('editable');
        });

        const platformIconsContainer = expandedCard.querySelector('#expanded-platform-icons');
        if (platformIconsContainer) {
            platformIconsContainer.classList.remove('edit-mode');
        }

        const editBtn = document.getElementById('edit-btn-expanded');
        if (editBtn) {
            editBtn.className = 'expanded-action-btn edit-btn';
            editBtn.setAttribute('title', 'Edit');
            editBtn.setAttribute('aria-label', 'Edit');
            editBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            `;
        }
    }

    isEditMode = false;
    console.log('Expanded modal closed');
};

/**
 * Delete an idea from pinned or scheduled
 */
function deleteIdea(button) {
    const card = button.closest('.idea-card-collapsed');
    if (!card) return;

    const ideaData = JSON.parse(card.dataset.idea || '{}');
    showConfirmModal(
        `Delete "${ideaData.title}"?`,
        'This idea will be removed from your workspace.',
        () => {
            removeCollapsedCard(card);
        }
    );
}

function removeCollapsedCard(card) {
    if (!card) return;

    const ideaData = JSON.parse(card.dataset.idea || '{}');
    const isPinned = card.closest('.pinned-ideas');
    const scheduleList = document.querySelector('.schedule-list');

    card.remove();

    if (isPinned) {
        const countElement = document.querySelector('.pinned-ideas .count');
        if (countElement) {
            const currentCount = parseInt(countElement.textContent.match(/\d+/)[0]);
            const newCount = Math.max(0, currentCount - 1);
            countElement.textContent = `(${newCount})`;

            if (newCount === 0) {
                const grid = document.querySelector('.ideas-grid');
                if (grid && grid.children.length === 0) {
                    grid.innerHTML = '<div class="empty-state"><p>No pinned ideas yet. Start swiping!</p></div>';
                }
            }
        }
    } else if (scheduleList) {
        if (scheduleList.children.length === 0) {
            scheduleList.innerHTML = '<div class="empty-state"><p>No scheduled content. Pin ideas and schedule them here!</p></div>';
        }
        generateScheduleCalendar();
    }

    syncCollapsedCards(ideaData);
    console.log('Deleted idea:', ideaData.title || '');
}

// ============================================
// IDEA DATA BANK
// ============================================

const ideaTemplates = [
    {
        title: 'Behind the Scenes Video',
        summary: 'Show your creative process from start to finish',
        action: 'Film your workspace, tools, and step-by-step creation',
        setup: 'Natural lighting, close-ups of hands working, wide shots of workspace',
        story: 'Take viewers on a journey from blank canvas to finished piece',
        hook: 'Ever wondered how this is made? Let me show you...',
        why: 'Builds trust and connection by showing the real work behind the magic',
        platforms: ['tiktok', 'instagram', 'youtube']
    },
    {
        title: 'Quick Tips Tutorial',
        summary: 'Share 3 essential tips in under 60 seconds',
        action: 'Fast-paced demonstration of each tip with text overlay',
        setup: 'Close-up shots, quick cuts, dynamic transitions',
        story: 'Hook viewers with a problem, deliver solutions rapidly',
        hook: 'Stop wasting time! Here are 3 game-changers...',
        why: 'High engagement, easy to consume, shareable content',
        platforms: ['tiktok', 'instagram']
    },
    {
        title: 'Day in the Life',
        summary: 'Document your typical day from morning to evening',
        action: 'Capture authentic moments throughout your day',
        setup: 'Natural lighting, handheld camera, vlog style',
        story: 'Take viewers through your routine with personality',
        hook: 'You asked what my days look like. Let\'s go!',
        why: 'Builds relatability and humanizes your brand',
        platforms: ['youtube', 'instagram', 'tiktok']
    },
    {
        title: 'Before & After Transformation',
        summary: 'Show dramatic change over time',
        action: 'Document initial state and final result with process',
        setup: 'Split screen, time-lapse, side-by-side comparison',
        story: 'Build anticipation then reveal the transformation',
        hook: 'Wait for the transformation... WOW!',
        why: 'Highly engaging visual storytelling that stops the scroll',
        platforms: ['tiktok', 'instagram', 'youtube']
    },
    {
        title: 'Common Mistakes to Avoid',
        summary: 'Educate viewers on what NOT to do',
        action: 'Show wrong way vs right way with clear examples',
        setup: 'Demonstration shots, text callouts, dramatic reactions',
        story: 'Build from "don\'t do this" to "do this instead"',
        hook: 'Are you making these mistakes? Here\'s what to do...',
        why: 'Problem-solving content performs well and positions you as expert',
        platforms: ['tiktok', 'youtube', 'instagram']
    },
    {
        title: 'Trending Audio Challenge',
        summary: 'Participate in viral trend with your unique twist',
        action: 'Execute trending challenge in your niche or style',
        setup: 'Match the trend format, add personal flair',
        story: 'Ride the trend wave while staying authentic to brand',
        hook: 'Okay I had to try this trend...',
        why: 'Algorithm boost from trending audio, high discoverability',
        platforms: ['tiktok', 'instagram']
    },
    {
        title: 'Q&A Session',
        summary: 'Answer your audience\'s burning questions',
        action: 'Select top questions and provide detailed answers',
        setup: 'Direct to camera, question text overlay, genuine responses',
        story: 'Create connection by addressing what viewers want to know',
        hook: 'You asked, I\'m answering! Let\'s dive in...',
        why: 'Increases engagement and shows you listen to your community',
        platforms: ['youtube', 'instagram', 'tiktok']
    }
];

document.addEventListener('DOMContentLoaded', () => {
    // Initialize auto-scrolling carousels for culture values
    initCultureValueCarousels();

    // Generate initial 7 cards (only if homepage is active)
    if (document.getElementById('homepage').classList.contains('active')) {
        generateNewIdeas();
    }

    // Platform selector toggle in generator card
    const platformBtns = document.querySelectorAll('.platform-icon-btn');
    platformBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            btn.classList.toggle('selected');
            console.log('Platform toggled:', btn.dataset.platform, btn.classList.contains('selected'));
        });
    });

    // Auth toggle button setup
    const authToggle = document.getElementById('auth-toggle');
    const signInForm = document.getElementById('sign-in-form');
    const signUpForm = document.getElementById('sign-up-form');
    
    console.log('Auth toggle setup:', { authToggle, signInForm, signUpForm });
    
    if (authToggle && signInForm && signUpForm) {
        let isSignIn = true;

        authToggle.addEventListener('click', (e) => {
            console.log('Auth toggle clicked!');
            e.preventDefault();
            isSignIn = !isSignIn;
            
            if (isSignIn) {
                signInForm.classList.add('active');
                signUpForm.classList.remove('active');
                authToggle.textContent = 'Create New Account';
                authToggle.className = 'btn-signup';
            } else {
                signInForm.classList.remove('active');
                signUpForm.classList.add('active');
                authToggle.textContent = 'Back to Sign In';
                authToggle.className = 'btn-primary btn-back-signin';
            }
        });
        console.log('✅ Auth toggle listener attached');
    } else {
        console.error('❌ Auth toggle elements not found!', { authToggle, signInForm, signUpForm });
    }

    // ============================================
    // FORM HANDLERS
    // ============================================

    // Sign In Form
    signInForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;
        
        const submitBtn = signInForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';
        
        try {
            const result = await handleSignIn(email, password);
            
            if (result.success) {
                console.log('✅ Sign in successful');
                
                const onboardingComplete = await hasCompletedOnboarding(result.user.id);
                
                if (onboardingComplete) {
                    const trialExpired = await isTrialExpired(result.user.id);
                    const hasSubscription = await hasActiveSubscription(result.user.id);
                    
                    if (trialExpired && !hasSubscription) {
                        navigateTo('paywall-page');
                    } else {
                        navigateTo('homepage');
                    }
                } else {
                    await startTrial(result.user.id);
                    navigateTo('onboarding-1-page');
                }
            } else {
                showAlertModal('Sign In Failed', result.error || 'Invalid email or password');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        } catch (error) {
            console.error('Sign in error:', error);
            showAlertModal('Error', 'An error occurred. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    // Sign Up Form
    signUpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        
        if (password.length < 6) {
            showAlertModal('Invalid Password', 'Password must be at least 6 characters long');
            return;
        }
        
        const submitBtn = signUpForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';
        
        try {
            const result = await handleSignUp(name, email, password);
            
            if (result.success) {
                if (result.requiresConfirmation) {
                    showAlertModal(
                        'Check Your Email',
                        'We sent you a confirmation email. Please click the link to verify your account before signing in.',
                        () => {
                            signUpForm.reset();
                            authToggle.click(); // Switch back to sign in
                        }
                    );
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                } else {
                    await startTrial(result.user.id);
                    navigateTo('onboarding-1-page');
                }
            } else {
                showAlertModal('Sign Up Failed', result.error || 'Could not create account');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        } catch (error) {
            console.error('Sign up error:', error);
            showAlertModal('Error', 'An error occurred. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    // Swipe handlers will be initialized when cards are generated

    // ============================================
    // SWIPE CARD SYSTEM
    // ============================================

    /**
     * Generate 7 new idea cards (all identical)
     */
    function generateNewIdeas() {
        const cardStack = document.getElementById('card-stack');
        const generatorCard = document.getElementById('idea-generator-card');
        if (!cardStack || !generatorCard) return;

        // Remove all existing idea cards
        const existingCards = cardStack.querySelectorAll('.idea-card');
        existingCards.forEach(card => card.remove());

        // Reset cards remaining
        cardsRemaining = 7;
        ideasStack = [];

        // Pick ONE random idea to use for all 7 cards
        const randomIdea = ideaTemplates[Math.floor(Math.random() * ideaTemplates.length)];

        // Create 7 IDENTICAL cards using the same idea
        // Insert BEFORE the generator card so nth-child CSS works correctly
        for (let i = 6; i >= 0; i--) {
            const ideaInstance = cloneIdeaTemplate(randomIdea);
            const card = createIdeaCard(ideaInstance);
            cardStack.insertBefore(card, generatorCard);
            ideasStack.push(ideaInstance);
        }

        // Initialize swipe handlers
        initSwipeHandlers();

        // Update swiper info
        lastRefreshTime = new Date();
        ideasRemaining = 7;
        updateSwiperInfo();

        // Hide idea generator
        updateIdeaGeneratorVisibility();

        console.log('Generated 7 identical idea cards');
    }

    window.generateNewIdeas = generateNewIdeas;

    /**
     * Generate random ideas (dice button)
     */
    window.generateRandomIdeas = function() {
        console.log('🎲 Generating random ideas');
        generateNewIdeas();
    };

    /**
     * Build custom ideas based on user input
     */
    window.buildCustomIdeas = function() {
        const directionInput = document.getElementById('idea-direction-input');
        const campaignToggle = document.getElementById('campaign-toggle');
        const selectedPlatforms = document.querySelectorAll('.platform-icon-btn.selected');
        
        const direction = directionInput ? directionInput.value.trim() : '';
        const isCampaign = campaignToggle ? campaignToggle.checked : false;
        const platforms = Array.from(selectedPlatforms).map(btn => btn.dataset.platform);
        
        console.log('🎨 Building custom ideas:', {
            direction,
            isCampaign,
            platforms
        });
        
        // For now, just generate ideas (later can be customized based on input)
        generateNewIdeas();
        
        // Clear inputs
        if (directionInput) directionInput.value = '';
        if (campaignToggle) campaignToggle.checked = false;
        selectedPlatforms.forEach(btn => btn.classList.remove('selected'));
    };

    /**
     * Create an idea card HTML element
     */
    function createIdeaCard(idea) {
        if (!idea.id) {
            idea.id = generateIdeaId();
        }
        const card = document.createElement('div');
        card.className = 'idea-card';
        card.dataset.idea = JSON.stringify(idea);

        card.innerHTML = `
            <div class="card-content">
                <h3 class="card-title">"${idea.title}"</h3>
                
                <div class="card-section">
                    <span class="section-label">Summary:</span>
                    <p class="section-text">${idea.summary}</p>
                </div>

                <div class="card-section">
                    <span class="section-label">Action/Story:</span>
                    <p class="section-text">${idea.action}</p>
                </div>

                <div class="card-section">
                    <span class="section-label">Shot/Setup:</span>
                    <p class="section-text">${idea.setup}</p>
                </div>

                <div class="card-section">
                    <span class="section-label">Story:</span>
                    <p class="section-text">${idea.story}</p>
                </div>

                <div class="card-section">
                    <span class="section-label">Hook:</span>
                    <p class="section-text">${idea.hook}</p>
                </div>

                <div class="card-section">
                    <span class="section-label">Why:</span>
                    <p class="section-text">${idea.why}</p>
                </div>
            </div>

            <div class="card-actions-bottom">
                <button class="card-action-btn skip-btn" onclick="skipCard(this)" aria-label="Skip">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>

                <div class="platform-icons">
                    ${generatePlatformIcons(idea.platforms)}
                </div>

                <button class="card-action-btn pin-btn" onclick="pinCard(this)" aria-label="Pin">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                        <path fill="currentColor" d="M16 12V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
                    </svg>
                </button>
            </div>
        `;

        return card;
    }

    /**
     * Generate platform icons HTML
     */
    function generatePlatformIcons(platforms) {
        const iconMap = {
            tiktok: 'https://cdn.simpleicons.org/tiktok/000000',
            instagram: 'https://cdn.simpleicons.org/instagram/E4405F',
            youtube: 'https://cdn.simpleicons.org/youtube/FF0000',
            twitter: 'https://cdn.simpleicons.org/x/000000',
            facebook: 'https://cdn.simpleicons.org/facebook/1877F2'
        };

        return platforms.map(platform => 
            `<img src="${iconMap[platform]}" alt="${platform}" class="platform-icon">`
        ).join('');
    }

    /**
     * Initialize swipe event handlers for all cards - Mobile-First Approach
     */
    function initSwipeHandlers() {
        const cardStack = document.getElementById('card-stack');
        if (!cardStack) {
            console.error('Card stack not found');
            return;
        }

        const cards = cardStack.querySelectorAll('.idea-card');
        console.log(`🎯 Initializing swipe for ${cards.length} cards`);
        
        cards.forEach((card, index) => {
            let touchStartX = 0;
            let touchStartY = 0;
            let touchCurrentX = 0;
            let touchCurrentY = 0;
            let isTouching = false;
            let hasMoved = false;

            // Touch Start
            card.addEventListener('touchstart', (e) => {
                console.log(`📱 Card ${index} touchstart`);
                
                // Only allow dragging the top card
                const topCard = cardStack.querySelector('.idea-card:first-child');
                if (card !== topCard) {
                    console.log('Not top card');
                    return;
                }
                
                // Don't drag if touching a button
                if (e.target.closest('button')) {
                    console.log('Button touched');
                    return;
                }

                const touch = e.touches[0];
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
                touchCurrentX = touchStartX;
                touchCurrentY = touchStartY;
                isTouching = true;
                hasMoved = false;
                
                card.classList.add('swiping');
                console.log('✅ Touch started', touchStartX, touchStartY);
            }, { passive: false });

            // Touch Move
            card.addEventListener('touchmove', (e) => {
                if (!isTouching) return;

                const touch = e.touches[0];
                touchCurrentX = touch.clientX;
                touchCurrentY = touch.clientY;
                
                const deltaX = touchCurrentX - touchStartX;
                const deltaY = touchCurrentY - touchStartY;
                
                if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                    hasMoved = true;
                    e.preventDefault(); // Prevent scrolling
                }
                
                const rotation = deltaX / 20;
                card.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;
                
                if (hasMoved) {
                    console.log(`📍 Moving: ${deltaX}px`);
                }
            }, { passive: false });

            // Touch End
            card.addEventListener('touchend', (e) => {
                if (!isTouching) return;
                
                console.log('🏁 Touch ended');
                isTouching = false;
                card.classList.remove('swiping');

                const deltaX = touchCurrentX - touchStartX;
                const threshold = 100;

                if (Math.abs(deltaX) > threshold && hasMoved) {
                    console.log(`✨ Swipe detected: ${deltaX > 0 ? 'right' : 'left'}`);
                    const direction = deltaX > 0 ? 'right' : 'left';
                    swipeCard(card, direction);
                } else {
                    console.log('↩️ Returning to center');
                    card.style.transition = 'transform 0.3s ease';
                    card.style.transform = '';
                    setTimeout(() => {
                        card.style.transition = '';
                    }, 300);
                }
            });

            // Touch Cancel
            card.addEventListener('touchcancel', (e) => {
                console.log('❌ Touch cancelled');
                if (!isTouching) return;
                
                isTouching = false;
                card.classList.remove('swiping');
                card.style.transition = 'transform 0.3s ease';
                card.style.transform = '';
                setTimeout(() => {
                    card.style.transition = '';
                }, 300);
            });

            // Mouse events for desktop
            let mouseDown = false;
            let mouseStartX = 0;
            let mouseStartY = 0;

            card.addEventListener('mousedown', (e) => {
                const topCard = cardStack.querySelector('.idea-card:first-child');
                if (card !== topCard || e.target.closest('button')) return;

                mouseDown = true;
                mouseStartX = e.clientX;
                mouseStartY = e.clientY;
                card.classList.add('swiping');
            });

            document.addEventListener('mousemove', (e) => {
                if (!mouseDown) return;

                const deltaX = e.clientX - mouseStartX;
                const deltaY = e.clientY - mouseStartY;
                const rotation = deltaX / 20;

                card.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;
            });

            document.addEventListener('mouseup', (e) => {
                if (!mouseDown) return;

                mouseDown = false;
                card.classList.remove('swiping');

                const deltaX = e.clientX - mouseStartX;
                const threshold = 100;

                if (Math.abs(deltaX) > threshold) {
                    const direction = deltaX > 0 ? 'right' : 'left';
                    swipeCard(card, direction);
                } else {
                    card.style.transition = 'transform 0.3s ease';
                    card.style.transform = '';
                    setTimeout(() => {
                        card.style.transition = '';
                    }, 300);
                }
            });
        });
    }

    /**
     * Swipe a card in the given direction
     */
    function swipeCard(card, direction) {
        const ideaData = JSON.parse(card.dataset.idea);

        if (direction === 'right') {
            // Check limit before pinning
            const grid = document.querySelector('.ideas-grid');
            const existingPinnedCards = grid ? grid.querySelectorAll('.idea-card-collapsed') : [];
            
            if (existingPinnedCards.length >= 7) {
                // Show alert and return card to center
                showAlertModal('Pin Limit Reached', 'You can only pin up to 7 ideas at a time. Please schedule or delete an idea before pinning another.');
                card.style.transition = 'transform 0.3s ease';
                card.style.transform = '';
                card.classList.remove('swiping');
                setTimeout(() => {
                    card.style.transition = '';
                }, 300);
                return; // Don't swipe the card away
            }
            
            // Pin the card
            addPinnedIdea(ideaData);
            updatePinnedCount();
        }

        // Clear inline styles and trigger animation
        card.style.transform = '';
        card.style.transition = '';
        card.classList.add(`swipe-${direction}`);

        // Remove card after animation
        setTimeout(() => {
            card.remove();
            cardsRemaining--;
            ideasRemaining--;
            updateSwiperInfo();
            updateIdeaGeneratorVisibility();
        }, 500);
    }

    /**
     * Skip card (swipe left)
     */
    window.skipCard = function(button) {
        const card = button.closest('.idea-card');
        if (card) {
            swipeCard(card, 'left');
        }
    };

    /**
     * Pin card (swipe right)
     */
    window.pinCard = function(button) {
        const card = button.closest('.idea-card');
        if (card) {
            swipeCard(card, 'right');
        }
    };

    /**
     * Show/hide idea generator card based on remaining cards
     */
    function updateIdeaGeneratorVisibility() {
        const generatorCard = document.getElementById('idea-generator-card');
        if (!generatorCard) return;

        if (cardsRemaining === 0) {
            generatorCard.classList.add('visible');
        } else {
            generatorCard.classList.remove('visible');
        }
    }

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    /**
     * Animate card swipe effect
     * @param {string} direction - 'left' or 'right'
     */
    function animateCardSwipe(direction) {
        const card = document.querySelector('.idea-card');
        if (!card) return;

        card.style.transition = 'transform 0.3s, opacity 0.3s';
        card.style.transform = direction === 'left' ? 'translateX(-400px)' : 'translateX(400px)';
        card.style.opacity = '0';

        setTimeout(() => {
            card.style.transition = 'none';
            card.style.transform = 'translateX(0)';
            card.style.opacity = '1';
            
            // Force reflow
            card.offsetHeight;
            
            card.style.transition = 'transform 0.3s, opacity 0.3s';
        }, 300);
    }

    /**
     * Update platform icons based on idea
     */
    function updatePlatformIcons(platforms) {
        const platformIconsContainer = document.getElementById('platform-icons');
        if (!platformIconsContainer) return;

        const iconMap = {
            'tiktok': '<img src="https://cdn.simpleicons.org/tiktok/000000" alt="TikTok" class="platform-icon">',
            'instagram': '<img src="https://cdn.simpleicons.org/instagram/E4405F" alt="Instagram" class="platform-icon">',
            'youtube': '<img src="https://cdn.simpleicons.org/youtube/FF0000" alt="YouTube" class="platform-icon">',
            'twitter': '<img src="https://cdn.simpleicons.org/x/000000" alt="Twitter" class="platform-icon">',
            'facebook': '<img src="https://cdn.simpleicons.org/facebook/1877F2" alt="Facebook" class="platform-icon">'
        };

        platformIconsContainer.innerHTML = platforms.map(p => iconMap[p] || '').join('');
    }

    /**
     * Update pinned ideas count
     */
    function updatePinnedCount() {
        const countElement = document.querySelector('.pinned-ideas .count');
        if (!countElement) return;

        const currentCount = parseInt(countElement.textContent.match(/\d+/)[0]);
        countElement.textContent = `(${currentCount + 1})`;
    }

    /**
     * Add a pinned idea to the pinned ideas section
     */
    function addPinnedIdea(idea) {
        const grid = document.querySelector('.ideas-grid');
        if (!grid) return;

        if (!idea.id) {
            idea.id = generateIdeaId();
        }

        // Check if already at 7 pinned ideas limit
        const existingPinnedCards = grid.querySelectorAll('.idea-card-collapsed');
        if (existingPinnedCards.length >= 7) {
            showAlertModal('Pin Limit Reached', 'You can only pin up to 7 ideas at a time. Please schedule or delete an idea before pinning another.');
            return;
        }

        // Remove empty state if present
        const emptyState = document.querySelector('.pinned-ideas .empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        // Create platform icons HTML
        const iconMap = {
            'tiktok': '<img src="https://cdn.simpleicons.org/tiktok/000000" alt="TikTok" class="platform-icon">',
            'instagram': '<img src="https://cdn.simpleicons.org/instagram/E4405F" alt="Instagram" class="platform-icon">',
            'youtube': '<img src="https://cdn.simpleicons.org/youtube/FF0000" alt="YouTube" class="platform-icon">',
            'twitter': '<img src="https://cdn.simpleicons.org/x/000000" alt="Twitter" class="platform-icon">',
            'facebook': '<img src="https://cdn.simpleicons.org/facebook/1877F2" alt="Facebook" class="platform-icon">'
        };
        const platformIconsHTML = idea.platforms.map(p => iconMap[p] || '').join('');

        // Create collapsed card
        const collapsedCard = document.createElement('div');
        collapsedCard.className = 'idea-card-collapsed';
        collapsedCard.innerHTML = `
            <div class="collapsed-content">
                <div class="collapsed-title">
                    <span class="title-text">"${idea.title}"</span>
                    <div class="collapsed-platforms">
                        ${platformIconsHTML}
                    </div>
                </div>
                <div class="collapsed-summary">${idea.summary}</div>
            </div>
            <div class="collapsed-actions">
                <button class="collapsed-action-btn" onclick="scheduleIdea(this)" aria-label="Schedule">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#6b46c1" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                </button>
            </div>
        `;

        // Store full idea data
        collapsedCard.dataset.idea = JSON.stringify(idea);
        collapsedCard.dataset.platforms = (idea.platforms || []).join(', ');

        // Add click handler for expansion (entire card, except buttons)
        collapsedCard.addEventListener('click', (e) => {
            // Don't expand if clicking on action buttons
            if (e.target.closest('.collapsed-action-btn')) {
                return;
            }
            expandIdeaCard(collapsedCard);
        });

        grid.appendChild(collapsedCard);
    }

    // ============================================
    // KEYBOARD SHORTCUTS (Optional Enhancement)
    // ============================================

    document.addEventListener('keydown', (e) => {
        const activePage = document.querySelector('.page.active');
        if (activePage && activePage.id === 'homepage') {
            switch(e.key) {
                case 'ArrowLeft':
                    skipBtn && skipBtn.click();
                    break;
                case 'ArrowRight':
                    pinBtn && pinBtn.click();
                    break;
            }
        }
    });

    // ============================================
    // HOW IT WORKS MODAL
    // ============================================

    const howItWorksBtn = document.getElementById('how-it-works-btn');
    const howItWorksModal = document.getElementById('how-it-works-modal');
    const closeHowItWorks = document.getElementById('close-how-it-works');

    if (howItWorksBtn) {
        howItWorksBtn.addEventListener('click', () => {
            howItWorksModal.classList.add('active');
        });
    }

    if (closeHowItWorks) {
        closeHowItWorks.addEventListener('click', () => {
            howItWorksModal.classList.remove('active');
        });
    }

    // Close modal when clicking outside
    if (howItWorksModal) {
        howItWorksModal.addEventListener('click', (e) => {
            if (e.target === howItWorksModal) {
                howItWorksModal.classList.remove('active');
            }
        });
    }

    // ============================================
    // CALENDAR MODAL
    // ============================================

    const calendarModal = document.getElementById('calendar-modal');
    const closeCalendar = document.getElementById('close-calendar');
    const confirmScheduleBtn = document.getElementById('confirm-schedule-date');

    if (closeCalendar) {
        closeCalendar.addEventListener('click', () => {
            calendarModal.classList.remove('active');
            pendingScheduleCard = null;
        });
    }

    if (confirmScheduleBtn) {
        confirmScheduleBtn.addEventListener('click', () => {
            confirmScheduleDate();
        });
    }

    // Close calendar modal when clicking outside
    if (calendarModal) {
        calendarModal.addEventListener('click', (e) => {
            if (e.target === calendarModal) {
                calendarModal.classList.remove('active');
                pendingScheduleCard = null;
            }
        });
    }

    // ============================================
    // EXPANDED IDEA MODAL
    // ============================================

    const expandedIdeaModal = document.getElementById('expanded-idea-modal');
    const closeExpandedIdea = document.getElementById('close-expanded-idea');

    if (closeExpandedIdea) {
        closeExpandedIdea.addEventListener('click', () => {
            expandedIdeaModal.classList.remove('active');
            if (isEditMode) {
                isEditMode = false;
                // Reset any editable elements
                const editableElements = document.querySelectorAll('.editable');
                editableElements.forEach(el => {
                    el.contentEditable = 'false';
                    el.classList.remove('editable');
                });
            }
        });
    }

    // Click outside handler is set up in DOMContentLoaded at the end of file

    // ============================================
    // SWIPER INFO - LIVE UPDATE
    // ============================================

    let ideasRemaining = 7;
    let lastRefreshTime = new Date();

    function updateSwiperInfo() {
        const ideasCountElement = document.getElementById('ideas-count');
        const refreshTimeElement = document.getElementById('refresh-time');
        
        if (ideasCountElement) {
            ideasCountElement.textContent = `${ideasRemaining} ${ideasRemaining === 1 ? 'Idea' : 'Ideas'}`;
        }
        
        if (refreshTimeElement) {
            const hours = lastRefreshTime.getHours();
            const minutes = lastRefreshTime.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            const displayMinutes = minutes.toString().padStart(2, '0');
            refreshTimeElement.textContent = `${displayHours}:${displayMinutes} ${ampm}`;
        }
    }

    // Update ideas count when cards are swiped
    window.decrementIdeasCount = function() {
        if (ideasRemaining > 0) {
            ideasRemaining--;
            updateSwiperInfo();
        }
    };

    window.refreshIdeas = function() {
        ideasRemaining = 7;
        lastRefreshTime = new Date();
        updateSwiperInfo();
    };

    // ============================================
    // INITIALIZE APP
    // ============================================

    console.log('Content Idea Generator initialized');
    console.log('Current page:', document.querySelector('.page.active').id);
    updateSwiperInfo();

    // ============================================
    // PILL & PLATFORM SELECTION HANDLERS
    // ============================================

    // Handle pill button selections (culture values)
    const pillContainers = document.querySelectorAll('.pill-selection');
    pillContainers.forEach(container => {
        container.addEventListener('click', (e) => {
            const pill = e.target.closest('.pill-btn');
            if (!pill || !container.contains(pill)) return;
            e.preventDefault();
            const value = pill.dataset.value;
            const currentlySelected = pill.classList.contains('selected');
            container.querySelectorAll(`.pill-btn[data-value=\"${value}\"]`).forEach(btn => {
                btn.classList.toggle('selected', !currentlySelected);
            });
        });
    });

    // Handle platform button selections
    const platformContainers = document.querySelectorAll('.platform-selection');
    platformContainers.forEach(container => {
        container.addEventListener('click', (e) => {
            const button = e.target.closest('.platform-select-btn');
            if (!button || !container.contains(button)) return;
            e.preventDefault();
            const value = button.dataset.platform;
            const newState = !button.classList.contains('selected');
            container.querySelectorAll(`.platform-select-btn[data-platform=\"${value}\"]`).forEach(btn => {
                btn.classList.toggle('selected', newState);
            });
        });
    });

    const shareFinalBtn = document.getElementById('share-final-btn');
    const shareIdeasList = document.getElementById('share-ideas-list');

    initNotificationSettings();
});

// ============================================
// SCHEDULE CALENDAR FUNCTIONALITY
// ============================================

let currentCalendarMonth = new Date();

document.addEventListener('DOMContentLoaded', () => {
    const calendarToggleBtn = document.getElementById('calendar-toggle-btn');
    const scheduleCalendarContainer = document.getElementById('schedule-calendar-container');
    let calendarExpanded = false;

    if (calendarToggleBtn) {
        calendarToggleBtn.addEventListener('click', () => {
            calendarExpanded = !calendarExpanded;
            
            if (calendarExpanded) {
                scheduleCalendarContainer.classList.add('expanded');
                currentCalendarMonth = new Date();
                generateScheduleCalendar();
            } else {
                scheduleCalendarContainer.classList.remove('expanded');
            }
        });
    }
});

function generateScheduleCalendar() {
    const calendarEl = document.getElementById('schedule-calendar');
    if (!calendarEl) return;

    calendarEl.innerHTML = '';

    const scheduledDates = getScheduledDates();

    // Add month header with navigation
    const monthHeader = document.createElement('div');
    monthHeader.className = 'calendar-month-header';
    
    const prevBtn = document.createElement('button');
    prevBtn.className = 'calendar-nav-btn';
    prevBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>';
    prevBtn.onclick = () => navigateMonth(-1);
    
    const monthTitle = document.createElement('div');
    monthTitle.className = 'calendar-month-title';
    monthTitle.textContent = currentCalendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'calendar-nav-btn';
    nextBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>';
    nextBtn.onclick = () => navigateMonth(1);
    
    monthHeader.appendChild(prevBtn);
    monthHeader.appendChild(monthTitle);
    monthHeader.appendChild(nextBtn);
    calendarEl.appendChild(monthHeader);

    const weekdaysRow = document.createElement('div');
    weekdaysRow.className = 'calendar-weekdays';
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        const weekdayEl = document.createElement('div');
        weekdayEl.className = 'calendar-weekday';
        weekdayEl.textContent = day;
        weekdaysRow.appendChild(weekdayEl);
    });
    calendarEl.appendChild(weekdaysRow);

    // Create dates container
    const datesContainer = document.createElement('div');
    datesContainer.className = 'calendar-dates-grid';

    // Helper function to get ordinal suffix
    function getOrdinal(day) {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }

    // Get first day of month and number of days
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    for (let i = 0; i < startDay; i++) {
        const placeholder = document.createElement('div');
        placeholder.className = 'calendar-date placeholder';
        datesContainer.appendChild(placeholder);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        const day = date.getDate();
        const ordinal = getOrdinal(day);
        
        const dateEl = document.createElement('div');
        dateEl.className = 'calendar-date';
        dateEl.innerHTML = `<span class="date-number">${day}</span><span class="date-ordinal">${ordinal}</span>`;
        dateEl.dataset.date = date.toISOString().split('T')[0];

        // Check if this date has scheduled ideas
        if (scheduledDates.includes(dateEl.dataset.date)) {
            dateEl.classList.add('has-scheduled');
        }

        // Highlight today
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            dateEl.classList.add('today');
        }

        dateEl.addEventListener('click', () => {
            showScheduledIdeasForDate(dateEl.dataset.date);
        });

        datesContainer.appendChild(dateEl);
    }

    const totalCells = startDay + daysInMonth;
    const trailingPlaceholders = (7 - (totalCells % 7)) % 7;
    for (let i = 0; i < trailingPlaceholders; i++) {
        const placeholder = document.createElement('div');
        placeholder.className = 'calendar-date placeholder';
        datesContainer.appendChild(placeholder);
    }

    calendarEl.appendChild(datesContainer);
}

function navigateMonth(direction) {
    currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() + direction);
    generateScheduleCalendar();
}

let pickerCalendarMonth = new Date();

function generateCalendarPicker() {
    const calendarPickerEl = document.getElementById('calendar-picker-container');
    if (!calendarPickerEl) return;

    calendarPickerEl.innerHTML = '';

    // Add month header with navigation
    const monthHeader = document.createElement('div');
    monthHeader.className = 'calendar-month-header';
    
    const prevBtn = document.createElement('button');
    prevBtn.className = 'calendar-nav-btn';
    prevBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>';
    prevBtn.onclick = () => navigatePickerMonth(-1);
    
    const monthTitle = document.createElement('div');
    monthTitle.className = 'calendar-month-title';
    monthTitle.textContent = pickerCalendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'calendar-nav-btn';
    nextBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>';
    nextBtn.onclick = () => navigatePickerMonth(1);
    
    monthHeader.appendChild(prevBtn);
    monthHeader.appendChild(monthTitle);
    monthHeader.appendChild(nextBtn);
    calendarPickerEl.appendChild(monthHeader);

    const weekdaysRow = document.createElement('div');
    weekdaysRow.className = 'calendar-weekdays';
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        const weekdayEl = document.createElement('div');
        weekdayEl.className = 'calendar-weekday';
        weekdayEl.textContent = day;
        weekdaysRow.appendChild(weekdayEl);
    });
    calendarPickerEl.appendChild(weekdaysRow);

    // Create dates container
    const datesContainer = document.createElement('div');
    datesContainer.className = 'calendar-dates-grid';

    // Helper function to get ordinal suffix
    function getOrdinal(day) {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }

    // Get first day of month and number of days
    const year = pickerCalendarMonth.getFullYear();
    const month = pickerCalendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const startDay = firstDay.getDay();

    for (let i = 0; i < startDay; i++) {
        const placeholder = document.createElement('div');
        placeholder.className = 'calendar-date placeholder';
        datesContainer.appendChild(placeholder);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        const day = date.getDate();
        const ordinal = getOrdinal(day);
        
        const dateEl = document.createElement('div');
        dateEl.className = 'calendar-date calendar-date-selectable';
        dateEl.innerHTML = `<span class="date-number">${day}</span><span class="date-ordinal">${ordinal}</span>`;
        dateEl.dataset.date = date.toISOString().split('T')[0];

        // Highlight today
        if (date.toDateString() === today.toDateString()) {
            dateEl.classList.add('today');
        }

        // Disable past dates
        if (date < today && date.toDateString() !== today.toDateString()) {
            dateEl.classList.add('disabled');
        } else {
            dateEl.addEventListener('click', () => {
                selectScheduleDate(dateEl.dataset.date);
            });
        }

        datesContainer.appendChild(dateEl);
    }

    calendarPickerEl.appendChild(datesContainer);
}

function navigatePickerMonth(direction) {
    pickerCalendarMonth.setMonth(pickerCalendarMonth.getMonth() + direction);
    generateCalendarPicker();
}

function selectScheduleDate(dateStr) {
    // Close the modal
    const calendarModal = document.getElementById('calendar-modal');
    if (calendarModal) {
        calendarModal.classList.remove('active');
    }
    
    // Confirm the schedule with the selected date
    confirmScheduleDate(dateStr);
}

function getScheduledDates() {
    // Get all scheduled ideas and extract their dates
    const scheduleList = document.querySelector('#schedule-component .schedule-list');
    if (!scheduleList) return [];

    const scheduledCards = scheduleList.querySelectorAll('.idea-card-collapsed');
    const dates = [];

    scheduledCards.forEach(card => {
        const dateEl = card.querySelector('.scheduled-date');
        if (dateEl && dateEl.dataset.date) {
            dates.push(dateEl.dataset.date);
        }
    });

    return [...new Set(dates)]; // Remove duplicates
}

function showScheduledIdeasForDate(dateStr) {
    // Find scheduled ideas for this date and highlight them
    const scheduleList = document.querySelector('#schedule-component .schedule-list');
    if (!scheduleList) return;

    const scheduledCards = scheduleList.querySelectorAll('.idea-card-collapsed');
    
    // Remove previous highlights
    scheduledCards.forEach(card => card.classList.remove('highlight'));

    // Highlight cards for this date
    scheduledCards.forEach(card => {
        const dateEl = card.querySelector('.scheduled-date');
        if (dateEl && dateEl.dataset.date === dateStr) {
            card.classList.add('highlight');
            // Scroll to the card
            setTimeout(() => {
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    });
}

// ============================================
// SHARE FUNCTIONALITY
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const shareBtn = document.getElementById('share-btn');
    const shareModal = document.getElementById('share-modal');
    const selectAllBtn = document.getElementById('select-all-btn');
    const shareFinalBtn = document.getElementById('share-final-btn');
    const shareIdeasList = document.getElementById('share-ideas-list');

    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            openShareModal();
        });
    }

    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
            const cards = shareIdeasList.querySelectorAll('.idea-card-collapsed');
            const allSelected = Array.from(cards).every(card => card.classList.contains('selected'));
            
            cards.forEach(card => {
                if (allSelected) {
                    card.classList.remove('selected');
                } else {
                    card.classList.add('selected');
                }
            });

            selectAllBtn.textContent = allSelected ? 'Select All' : 'Deselect All';
        });
    }

    if (shareFinalBtn) {
        shareFinalBtn.addEventListener('click', () => {
            shareSelectedIdeas();
        });
    }

    // Close modal when clicking outside (on backdrop)
    if (shareModal) {
        shareModal.addEventListener('click', (e) => {
            if (e.target === shareModal) {
                closeShareModal();
            }
        });
    }

    // Close expanded idea modal when clicking outside
    const expandedIdeaModal = document.getElementById('expanded-idea-modal');
    if (expandedIdeaModal) {
        expandedIdeaModal.addEventListener('click', (e) => {
            if (e.target === expandedIdeaModal) {
                closeExpandedModal();
            }
        });
    }

    // Close how it works modal when clicking outside
    const howItWorksModal = document.getElementById('how-it-works-modal');
    if (howItWorksModal) {
        howItWorksModal.addEventListener('click', (e) => {
            if (e.target === howItWorksModal) {
                howItWorksModal.classList.remove('active');
            }
        });
    }

    // Close calendar modal when clicking outside
    const calendarModal = document.getElementById('calendar-modal');
    if (calendarModal) {
        calendarModal.addEventListener('click', (e) => {
            if (e.target === calendarModal) {
                calendarModal.classList.remove('active');
                pendingScheduleCard = null;
            }
        });
    }
});

function openShareModal() {
    const shareModal = document.getElementById('share-modal');
    const shareIdeasList = document.getElementById('share-ideas-list');
    
    if (!shareModal || !shareIdeasList) return;

    // Clear previous content
    shareIdeasList.innerHTML = '';

    // Get all pinned and scheduled ideas
    const pinnedIdeas = getAllPinnedIdeas();
    const scheduledIdeas = getAllScheduledIdeas();
    const allIdeas = [...pinnedIdeas, ...scheduledIdeas];

    if (allIdeas.length === 0) {
        shareIdeasList.innerHTML = '<p style="text-align: center; color: rgba(40, 40, 40, 0.6); padding: 20px;">No ideas to share yet!</p>';
    } else {
        allIdeas.forEach(idea => {
            const collapsedCard = createShareCollapsedCard(idea);
            shareIdeasList.appendChild(collapsedCard);
        });
    }

    shareModal.classList.add('active');
    
    // Reset select all button
    const selectAllBtn = document.getElementById('select-all-btn');
    if (selectAllBtn) {
        selectAllBtn.textContent = 'Select All';
    }
}

function closeShareModal() {
    const shareModal = document.getElementById('share-modal');
    if (shareModal) {
        shareModal.classList.remove('active');
    }
}

function getAllPinnedIdeas() {
    const pinnedList = document.querySelector('#pinned-component .ideas-grid');
    if (!pinnedList) return [];

    const pinnedCards = pinnedList.querySelectorAll('.idea-card-collapsed');
    const ideas = [];

    pinnedCards.forEach(card => {
        ideas.push(extractIdeaFromCard(card, 'pinned'));
    });

    return ideas;
}

function getAllScheduledIdeas() {
    const scheduleList = document.querySelector('#schedule-component .schedule-list');
    if (!scheduleList) return [];

    const scheduledCards = scheduleList.querySelectorAll('.idea-card-collapsed');
    const ideas = [];

    scheduledCards.forEach(card => {
        ideas.push(extractIdeaFromCard(card, 'scheduled'));
    });

    return ideas;
}

function extractIdeaFromCard(card, type) {
    const title = card.querySelector('.collapsed-title')?.textContent.replace(/^["']|["']$/g, '') || '';
    const summary = card.querySelector('.collapsed-summary')?.textContent || '';
    const platforms = card.dataset.platforms || '';
    
    let date = '';
    let rawDate = '';
    if (type === 'scheduled') {
        const dateEl = card.querySelector('.scheduled-date');
        if (dateEl) {
            rawDate = dateEl.dataset.date || '';
            if (rawDate) {
                date = new Date(rawDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                });
            }
        }
    }

    return {
        title,
        summary,
        platforms,
        date,
        rawDate,
        type,
        cardElement: card
    };
}

function createShareCollapsedCard(idea) {
    const card = document.createElement('div');
    card.className = 'idea-card-collapsed';
    card.dataset.platforms = idea.platforms;

    const content = document.createElement('div');
    content.className = 'collapsed-content';

    const title = document.createElement('div');
    title.className = 'collapsed-title';
    title.textContent = idea.title;

    const summary = document.createElement('div');
    summary.className = 'collapsed-summary';
    summary.textContent = idea.summary;

    content.appendChild(title);
    content.appendChild(summary);

    // Add date if it's a scheduled card
    if (idea.type === 'scheduled' && idea.date) {
        const dateEl = document.createElement('div');
        dateEl.className = 'scheduled-date';
        dateEl.textContent = idea.date;
        dateEl.dataset.date = idea.rawDate || idea.date;
        content.appendChild(dateEl);
    }

    card.appendChild(content);

    // Add click handler to toggle selection
    card.addEventListener('click', () => {
        card.classList.toggle('selected');
        
        // Update select all button text
        const selectAllBtn = document.getElementById('select-all-btn');
        const shareIdeasList = document.getElementById('share-ideas-list');
        const allCards = shareIdeasList.querySelectorAll('.idea-card-collapsed');
        const allSelected = Array.from(allCards).every(c => c.classList.contains('selected'));
        
        if (selectAllBtn) {
            selectAllBtn.textContent = allSelected ? 'Deselect All' : 'Select All';
        }
    });

    return card;
}

async function shareSelectedIdeas() {
    const shareIdeasList = document.getElementById('share-ideas-list');
    if (!shareIdeasList) return;

    const selectedCards = shareIdeasList.querySelectorAll('.idea-card-collapsed.selected');
    
    if (selectedCards.length === 0) {
        showAlertModal('No Ideas Selected', 'Please select at least one idea to share.');
        return;
    }

    // Format selected ideas for sharing (clean, no emojis)
    let shareText = 'Content Ideas:\n\n';
    
    selectedCards.forEach((card, index) => {
        const title = card.querySelector('.collapsed-title')?.textContent.replace(/^["']|["']$/g, '') || '';
        const summary = card.querySelector('.collapsed-summary')?.textContent || '';
        const platforms = card.dataset.platforms || '';
        
        shareText += `${index + 1}. ${title}\n`;
        shareText += `   Summary: ${summary}\n`;
        if (platforms) {
            shareText += `   Platforms: ${platforms}\n`;
        }
        shareText += '\n';
    });

    shareText += '\nGenerated with Phasee - Experiential Storytelling';

    // Try to use Web Share API (native iOS share)
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Content Ideas from Phasee',
                text: shareText
            });
            
            // Close modal after successful share
            closeShareModal();
        } catch (err) {
            // User cancelled or error occurred
            if (err.name !== 'AbortError') {
                console.error('Error sharing:', err);
                fallbackShare(shareText);
            }
        }
    } else {
        // Fallback for browsers that don't support Web Share API
        fallbackShare(shareText);
    }
}

function fallbackShare(text) {
    // Copy to clipboard as fallback
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showAlertModal('Copied to Clipboard', 'Ideas copied to clipboard! You can now paste and share them.');
            closeShareModal();
        }).catch(err => {
            console.error('Failed to copy:', err);
            showAlertModal('Share Unavailable', 'Unable to share these ideas right now. Please try again.');
        });
    } else {
        // Last resort: show text in alert
        showAlertModal('Share This', text);
    }
}

// ============================================
// EXPORT NAVIGATION FUNCTION FOR INLINE USE
// ============================================

window.navigateTo = navigateTo;
window.startFreeTrial = startFreeTrial;
window.completeOnboarding = completeOnboarding;
window.saveProfileChanges = saveProfileChanges;

function syncCollapsedCards(updatedIdea) {
    if (!updatedIdea) return;
    const collapsedCards = document.querySelectorAll('.idea-card-collapsed');
    collapsedCards.forEach(card => {
        try {
            const cardData = JSON.parse(card.dataset.idea || '{}');
            const matchesById = updatedIdea.id && cardData.id && updatedIdea.id === cardData.id;
            const matchesByTitle = !updatedIdea.id && cardData.title === updatedIdea.title;
            if (matchesById || matchesByTitle) {
                const mergedData = { ...cardData, ...updatedIdea };
                card.dataset.idea = JSON.stringify(mergedData);
                card.dataset.platforms = (mergedData.platforms || []).join(', ');

                const titleEl = card.querySelector('.title-text');
                if (titleEl) {
                    titleEl.textContent = `"${mergedData.title}"`;
                }

                const summaryEl = card.querySelector('.collapsed-summary');
                if (summaryEl) {
                    summaryEl.textContent = mergedData.summary || '';
                }

                const platformsEl = card.querySelector('.collapsed-platforms');
                if (platformsEl) {
                    platformsEl.innerHTML = generatePlatformIcons(mergedData.platforms || []);
                }

                const dateMonthEl = card.querySelector('.date-month');
                const dateDayEl = card.querySelector('.date-day');
                if (dateMonthEl && mergedData.scheduledMonth) {
                    dateMonthEl.textContent = mergedData.scheduledMonth;
                }
                if (dateDayEl && mergedData.scheduledDay) {
                    dateDayEl.textContent = mergedData.scheduledDay;
                }
            }
        } catch (err) {
            console.error('Failed to sync collapsed card:', err);
        }
    });
}

function generateIdeaId() {
    return `idea-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cloneIdeaTemplate(template) {
    const clone = JSON.parse(JSON.stringify(template));
    clone.id = generateIdeaId();
    return clone;
}

function getProfileFormData(prefix) {
    const data = {};
    data.brandName = document.getElementById(`${prefix}-brand-name`)?.value.trim() || '';
    data.role = document.getElementById(`${prefix}-role`)?.value || '';
    data.founded = document.getElementById(`${prefix}-founded`)?.value || '';
    data.industry = document.getElementById(`${prefix}-industry`)?.value || '';
    data.location = document.getElementById(`${prefix}-location`)?.value.trim() || '';
    data.targetAudience = document.getElementById(`${prefix}-target-audience`)?.value.trim() || '';
    data.contentGoals = document.getElementById(`${prefix}-content-goals`)?.value.trim() || '';
    data.postFrequency = document.getElementById(`${prefix}-post-frequency`)?.value || '';
    data.productionLevel = document.getElementById(`${prefix}-production-level`)?.value || '';
    const cultureSet = new Set();
    document.querySelectorAll(`#${prefix}-culture-values .pill-btn.selected`).forEach(pill => {
        if (pill.dataset.value) {
            cultureSet.add(pill.dataset.value);
        }
    });
    data.cultureValues = Array.from(cultureSet);

    const platformSet = new Set();
    document.querySelectorAll(`#${prefix}-platforms .platform-select-btn.selected`).forEach(btn => {
        if (btn.dataset.platform) {
            platformSet.add(btn.dataset.platform);
        }
    });
    data.platforms = Array.from(platformSet);
    return data;
}

function saveProfileData(data) {
    if (!data) return;
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data));
}

function loadProfileData() {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!stored) return;
    try {
        const data = JSON.parse(stored);
        populateProfileFields(data);
    } catch (err) {
        console.error('Failed to parse profile data:', err);
    }
}

function populateProfileFields(data) {
    if (!data) return;
    const mapping = {
        'profile-brand-name': data.brandName || '',
        'profile-role': data.role || '',
        'profile-founded': data.founded || '',
        'profile-industry': data.industry || '',
        'profile-location': data.location || '',
        'profile-target-audience': data.targetAudience || '',
        'profile-content-goals': data.contentGoals || '',
        'profile-post-frequency': data.postFrequency || '',
        'profile-production-level': data.productionLevel || ''
    };

    Object.entries(mapping).forEach(([id, value]) => {
        const field = document.getElementById(id);
        if (!field) return;
        if (field.tagName === 'SELECT') {
            field.value = value;
            updateDropdownTrigger(field);
        } else {
            field.value = value;
        }
    });

    const cultureContainer = document.getElementById('profile-culture-values');
    if (cultureContainer) {
        cultureContainer.querySelectorAll('.pill-btn').forEach(pill => {
            pill.classList.toggle('selected', data.cultureValues?.includes(pill.dataset.value));
        });
    }

    const platformContainer = document.getElementById('profile-platforms');
    if (platformContainer) {
        platformContainer.querySelectorAll('.platform-select-btn').forEach(btn => {
            btn.classList.toggle('selected', data.platforms?.includes(btn.dataset.platform));
        });
    }
}

async function completeOnboarding() {
    const brandName = document.getElementById('brand-name')?.value;
    const role = document.getElementById('role')?.value;
    const foundedYear = document.getElementById('founded-year')?.value;
    const industry = document.getElementById('industry')?.value;
    
    if (!brandName || brandName.trim() === '') {
        showAlertModal('Required Field', 'Please enter your brand name to continue.');
        return;
    }
    
    const selectedPlatforms = Array.from(
        document.querySelectorAll('.platform-select-btn.selected')
    ).map(btn => btn.dataset.platform);
    
    const selectedValues = Array.from(
        document.querySelectorAll('.pill-btn.selected')
    ).map(btn => btn.textContent);
    
    try {
        const user = getUser();
        
        if (!user) {
            showAlertModal('Error', 'No user session found. Please sign in again.');
            navigateTo('sign-in-page');
            return;
        }
        
        await updateUserProfile(user.id, {
            brand_name: brandName,
            role: role,
            founded_year: foundedYear ? parseInt(foundedYear) : null,
            industry: industry,
            platforms: selectedPlatforms,
            culture_values: selectedValues,
            onboarding_complete: true
        });
        
        console.log('✅ Onboarding complete, profile saved to Supabase');
        
        navigateTo('paywall-page');
        
    } catch (error) {
        console.error('Error completing onboarding:', error);
        showAlertModal('Error', 'Could not save profile. Please try again.');
    }
}

function saveProfileChanges() {
    const profileData = getProfileFormData('profile');
    saveProfileData(profileData);
    loadProfileData();
    showAlertModal('Profile Updated', 'Your profile details have been saved.');
}

function updateDropdownTrigger(select) {
    if (!select) return;
    const trigger = select._dropdownTrigger;
    const optionsContainer = select._dropdownOptions;
    const selectedOption = select.options[select.selectedIndex];
    const label = selectedOption ? selectedOption.textContent : (select.getAttribute('data-placeholder') || 'Select option');
    if (trigger) {
        trigger.textContent = label;
    }
    if (optionsContainer) {
        optionsContainer.querySelectorAll('.dropdown-option').forEach(optionBtn => {
            optionBtn.classList.toggle('active', optionBtn.dataset.value === select.value);
        });
    }
}

function enhanceCustomDropdowns() {
    const selects = document.querySelectorAll('select.custom-dropdown');
    selects.forEach(select => {
        if (select.dataset.enhanced === 'true') {
            updateDropdownTrigger(select);
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'custom-dropdown-wrapper';
        select.parentNode.insertBefore(wrapper, select);
        wrapper.appendChild(select);

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'dropdown-trigger';
        wrapper.appendChild(trigger);

        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'dropdown-options';
        Array.from(select.options).forEach(option => {
            const optionBtn = document.createElement('button');
            optionBtn.type = 'button';
            optionBtn.className = 'dropdown-option';
            optionBtn.textContent = option.textContent;
            optionBtn.dataset.value = option.value;
            optionBtn.disabled = option.disabled;
            optionBtn.addEventListener('click', () => {
                select.value = option.value;
                select.dispatchEvent(new Event('change'));
                updateDropdownTrigger(select);
                optionsContainer.classList.remove('open');
            });
            optionsContainer.appendChild(optionBtn);
        });
        wrapper.appendChild(optionsContainer);

        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.dropdown-options.open').forEach(panel => {
                if (panel !== optionsContainer) panel.classList.remove('open');
            });
            optionsContainer.classList.toggle('open');
        });

        select.addEventListener('change', () => updateDropdownTrigger(select));
        select.dataset.enhanced = 'true';
        select._dropdownTrigger = trigger;
        select._dropdownOptions = optionsContainer;
        updateDropdownTrigger(select);
    });
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-dropdown-wrapper')) {
        document.querySelectorAll('.dropdown-options.open').forEach(panel => panel.classList.remove('open'));
    }
});

function initLocationButtons() {
    const buttons = document.querySelectorAll('.find-location-btn');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            handleFindLocation(targetId);
        });
    });
}

function initCultureValueCarousel() {
    document.querySelectorAll('.pill-selection .pill-row').forEach(row => {
        if (row.dataset.processed === 'true') return;
        const pills = Array.from(row.querySelectorAll('.pill-btn'));
        if (pills.length === 0) return;
        pills.forEach(pill => {
            const clone = pill.cloneNode(true);
            clone.classList.add('pill-clone');
            row.appendChild(clone);
        });
        const duration = row.dataset.speed || 30;
        row.style.setProperty('--scroll-duration', `${duration}s`);
        row.dataset.processed = 'true';
    });
}

function handleFindLocation(targetId) {
    const input = document.getElementById(targetId);
    if (!input) return;

    if (!('geolocation' in navigator)) {
        fetchApproximateLocation(input);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            input.value = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            showAlertModal('Location Found', 'We filled in your coordinates. You can adjust them if needed.');
        },
        (error) => {
            console.error('Geolocation error:', error);
            fetchApproximateLocation(input);
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

async function fetchApproximateLocation(input) {
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('Failed to fetch location');
        const data = await response.json();
        if (data && data.city && data.country_name) {
            input.value = `${data.city}, ${data.country_name}`;
            showAlertModal('Location Found', 'We filled in your approximate city and country. Please confirm or adjust.');
            return;
        }
    } catch (err) {
        console.error('IP location lookup failed:', err);
    }

    showAlertModal('Location Error', 'We could not retrieve your location. Please enter it manually.');
}

function initNotificationSettings() {
    const generalToggle = document.getElementById('general-notifications');
    const dailyToggle = document.getElementById('daily-ideas');

    setupNotificationToggle(generalToggle, 'general');
    setupNotificationToggle(dailyToggle, 'daily');
}

function setupNotificationToggle(toggle, key) {
    if (!toggle) return;
    const storageKey = `notification_pref_${key}`;
    const storedValue = localStorage.getItem(storageKey);
    if (storedValue !== null) {
        toggle.checked = storedValue === 'true';
    }

    toggle.addEventListener('change', async () => {
        if (toggle.checked) {
            const permissionGranted = await ensureNotificationPermission();
            if (!permissionGranted) {
                toggle.checked = false;
                localStorage.setItem(storageKey, 'false');
                showAlertModal('Notifications Disabled', 'We could not enable notifications without permission.');
                return;
            }
        }

        localStorage.setItem(storageKey, String(toggle.checked));

        if (key === 'daily') {
            if (toggle.checked) {
                scheduleDailyIdeaReminder();
            } else {
                cancelDailyIdeaReminder();
            }
        }
    });
}

async function ensureNotificationPermission() {
    if (!('Notification' in window)) {
        showAlertModal('Not Supported', 'Notifications are not supported on this device.');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission === 'denied') {
        showAlertModal('Permission Denied', 'Notifications have been blocked. Please enable them in your browser settings.');
        return false;
    }

    const result = await Notification.requestPermission();
    return result === 'granted';
}

function scheduleDailyIdeaReminder() {
    console.log('Daily idea notifications scheduled (placeholder).');
}

function cancelDailyIdeaReminder() {
    console.log('Daily idea notifications cancelled (placeholder).');
}

function getTrialStartTimestamp() {
    const stored = Number(localStorage.getItem('trialStartedAt'));
    return Number.isFinite(stored) ? stored : null;
}

function isTrialStarted() {
    return !!getTrialStartTimestamp();
}

function getTrialTimeRemaining() {
    const start = getTrialStartTimestamp();
    if (!start) return TRIAL_DURATION_MS;
    const elapsed = Date.now() - start;
    return Math.max(0, TRIAL_DURATION_MS - elapsed);
}

// isTrialExpired and hasActiveSubscription are now imported from auth-integration.js

function hasAccessToPaidContent() {
    if (hasActiveSubscription()) return true;
    if (!isTrialStarted()) return false;
    return !isTrialExpired();
}

function startFreeTrial() {
    if (hasActiveSubscription()) {
        // Mark onboarding as complete
        localStorage.setItem('onboardingComplete', 'true');
        navigateTo('homepage');
        return;
    }

    if (isTrialStarted()) {
        if (isTrialExpired()) {
            showAlertModal('Trial Ended', 'Your free trial has expired. Subscribe to continue.');
            updateTrialCountdownDisplay();
            navigateTo('paywall-page');
            return;
        }

        // Mark onboarding as complete
        localStorage.setItem('onboardingComplete', 'true');
        navigateTo('homepage');
        return;
    }

    // This should not happen as trial starts on sign-in now
    // But keep as fallback
    localStorage.setItem('trialStartedAt', Date.now().toString());
    localStorage.setItem('onboardingComplete', 'true');
    updateTrialCountdownDisplay();
    navigateTo('homepage');
}

function startTrialCountdown() {
    if (trialCountdownInterval) {
        clearInterval(trialCountdownInterval);
    }
    updateTrialCountdownDisplay();
    trialCountdownInterval = setInterval(updateTrialCountdownDisplay, 1000);
}

function stopTrialCountdown() {
    if (trialCountdownInterval) {
        clearInterval(trialCountdownInterval);
        trialCountdownInterval = null;
    }
}

function updateTrialCountdownDisplay() {
    const countdownEl = document.getElementById('trial-countdown');
    const startBtn = document.getElementById('start-trial-btn');
    if (!countdownEl || !startBtn) return;

    if (hasActiveSubscription()) {
        countdownEl.textContent = 'Thanks for subscribing!';
        startBtn.textContent = 'Manage Subscription';
        startBtn.disabled = false;
        return;
    }

    if (!isTrialStarted()) {
        countdownEl.textContent = 'Begin your 3-day free trial to unlock Phasee.';
        startBtn.textContent = 'Start Free Trial';
        startBtn.disabled = false;
        return;
    }

    if (isTrialExpired()) {
        countdownEl.textContent = 'Your free trial has ended.';
        startBtn.textContent = 'Subscribe to Continue';
        startBtn.disabled = false;
        return;
    }

    const remaining = getTrialTimeRemaining();
    countdownEl.textContent = `Time remaining: ${formatTrialDuration(remaining)}`;
    startBtn.textContent = 'Start Building!';
    startBtn.disabled = false;
}

function formatTrialDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const segments = [];
    if (days > 0) segments.push(`${days}d`);
    segments.push(`${hours.toString().padStart(2, '0')}h`);
    segments.push(`${minutes.toString().padStart(2, '0')}m`);
    segments.push(`${seconds.toString().padStart(2, '0')}s`);
    return segments.join(' ');
}

// ============================================
// FEEDBACK SYSTEM
// ============================================

/**
 * Submit user feedback
 */
async function submitFeedback() {
    const textarea = document.getElementById('feedback-textarea');
    const submitBtn = document.querySelector('.feedback-submit-btn');
    const successMsg = document.getElementById('feedback-success');
    
    if (!textarea || !submitBtn) return;
    
    const message = textarea.value.trim();
    
    if (!message) {
        showAlertModal('Empty Feedback', 'Please enter your feedback before submitting.');
        return;
    }
    
    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    try {
        // Try to submit to Supabase if available
        try {
            const { submitFeedback: submitToSupabase } = await import('./supabase.js');
            await submitToSupabase(message);
        } catch (supabaseError) {
            // If Supabase fails, store locally as fallback
            console.warn('Supabase not available, storing feedback locally:', supabaseError);
            const localFeedback = JSON.parse(localStorage.getItem('phasee_feedback') || '[]');
            localFeedback.push({
                message,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('phasee_feedback', JSON.stringify(localFeedback));
        }
        
        // Show success message
        textarea.value = '';
        textarea.style.display = 'none';
        submitBtn.style.display = 'none';
        document.querySelector('.feedback-char-count').style.display = 'none';
        successMsg.style.display = 'flex';
        
        // Track analytics
        try {
            trackAppEvent({
                page_name: 'feedback',
                event_type: 'feedback_submitted'
            });
        } catch (e) {
            console.warn('Analytics tracking failed:', e);
        }
        
        // Reset after 2 seconds
        setTimeout(() => {
            navigateTo('settings-page');
        }, 2000);
        
    } catch (error) {
        console.error('Error submitting feedback:', error);
        showAlertModal('Error', 'Failed to submit feedback. Please try again later.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Feedback';
    }
}

/**
 * Update character count for feedback textarea
 */
function updateFeedbackCharCount() {
    const textarea = document.getElementById('feedback-textarea');
    const charCount = document.getElementById('feedback-char-count');
    
    if (textarea && charCount) {
        textarea.addEventListener('input', () => {
            charCount.textContent = textarea.value.length;
        });
    }
}

// ============================================
// ANALYTICS TRACKING
// ============================================

/**
 * Track generation event (generated, pinned, scheduled, swiped_left)
 */
async function trackGenerationEvent(eventType, context = {}) {
    try {
        const { trackGenerationEvent: trackToSupabase, getCurrentUser } = await import('./supabase.js');
        const user = await getCurrentUser();
        
        if (!user) return; // Don't track if not logged in
        
        await trackToSupabase(user.id, {
            event_type: eventType,
            ...context
        });
    } catch (error) {
        console.error('Error tracking generation event:', error);
    }
}

/**
 * Track app analytics (page views, errors, session duration)
 */
async function trackAppEvent(eventData) {
    try {
        const { trackAppEvent: trackToSupabase } = await import('./supabase.js');
        await trackToSupabase(eventData);
    } catch (error) {
        console.error('Error tracking app event:', error);
    }
}

/**
 * Track page view with session duration
 */
let pageStartTime = Date.now();
let currentPage = 'homepage';

function trackPageView(pageName) {
    // Track previous page session duration
    if (currentPage && pageStartTime) {
        const sessionDuration = Math.floor((Date.now() - pageStartTime) / 1000);
        trackAppEvent({
            page_name: currentPage,
            session_duration: sessionDuration
        });
    }
    
    // Start tracking new page
    currentPage = pageName;
    pageStartTime = Date.now();
}

// ============================================
// HYBRID STORAGE SYSTEM
// ============================================

/**
 * Local Storage for temporary swiper ideas
 */
const LocalStorage = {
    SWIPER_IDEAS_KEY: 'phasee_swiper_ideas',
    
    // Save swiper ideas to local storage
    saveSwiperIdeas(ideas) {
        try {
            localStorage.setItem(this.SWIPER_IDEAS_KEY, JSON.stringify(ideas));
        } catch (error) {
            console.error('Error saving to local storage:', error);
        }
    },
    
    // Get swiper ideas from local storage
    getSwiperIdeas() {
        try {
            const ideas = localStorage.getItem(this.SWIPER_IDEAS_KEY);
            return ideas ? JSON.parse(ideas) : [];
        } catch (error) {
            console.error('Error reading from local storage:', error);
            return [];
        }
    },
    
    // Clear swiper ideas
    clearSwiperIdeas() {
        try {
            localStorage.removeItem(this.SWIPER_IDEAS_KEY);
        } catch (error) {
            console.error('Error clearing local storage:', error);
        }
    }
};

/**
 * Save pinned idea to Supabase
 */
async function savePinnedIdeaToSupabase(ideaData) {
    try {
        const { createIdea, getCurrentUser } = await import('./supabase.js');
        const user = await getCurrentUser();
        
        if (!user) {
            console.warn('User not logged in, idea saved locally only');
            return null;
        }
        
        const savedIdea = await createIdea(user.id, {
            ...ideaData,
            is_pinned: true,
            is_scheduled: false
        });
        
        // Track pinned event
        await trackGenerationEvent('pinned', {
            direction: ideaData.direction,
            is_campaign: ideaData.is_campaign,
            platforms: ideaData.platforms
        });
        
        return savedIdea;
    } catch (error) {
        console.error('Error saving pinned idea to Supabase:', error);
        
        // Track error
        trackAppEvent({
            page_name: 'home',
            error_type: 'save_pinned_error',
            error_message: error.message
        });
        
        return null;
    }
}

/**
 * Save scheduled idea to Supabase
 */
async function saveScheduledIdeaToSupabase(ideaData, scheduledDate) {
    try {
        const { createIdea, getCurrentUser } = await import('./supabase.js');
        const user = await getCurrentUser();
        
        if (!user) {
            console.warn('User not logged in, idea saved locally only');
            return null;
        }
        
        const savedIdea = await createIdea(user.id, {
            ...ideaData,
            is_pinned: false,
            is_scheduled: true,
            scheduled_date: scheduledDate
        });
        
        // Track scheduled event
        await trackGenerationEvent('scheduled', {
            direction: ideaData.direction,
            is_campaign: ideaData.is_campaign,
            platforms: ideaData.platforms
        });
        
        return savedIdea;
    } catch (error) {
        console.error('Error saving scheduled idea to Supabase:', error);
        
        // Track error
        trackAppEvent({
            page_name: 'calendar',
            error_type: 'save_scheduled_error',
            error_message: error.message
        });
        
        return null;
    }
}

/**
 * Load pinned and scheduled ideas from Supabase on app start
 */
async function loadIdeasFromSupabase() {
    try {
        const { getIdeas, getCurrentUser } = await import('./supabase.js');
        const user = await getCurrentUser();
        
        if (!user) return;
        
        // Load pinned ideas
        const pinnedIdeas = await getIdeas(user.id, { isPinned: true });
        // TODO: Render pinned ideas to UI
        
        // Load scheduled ideas
        const scheduledIdeas = await getIdeas(user.id, { isScheduled: true });
        // TODO: Render scheduled ideas to calendar
        
    } catch (error) {
        console.error('Error loading ideas from Supabase:', error);
    }
}

// ============================================
// INITIALIZATION
// ============================================

// ============================================
// AUTH & ONBOARDING FLOW
// ============================================

/**
 * Check if user is authenticated
 */
function isUserAuthenticated() {
    return localStorage.getItem('userAuthenticated') === 'true';
}

/**
 * Check if onboarding is complete
 */
function isOnboardingComplete() {
    return localStorage.getItem('onboardingComplete') === 'true';
}

/**
 * Handle user sign-in (start trial immediately)
 */
function handleUserSignIn(email) {
    // Mark user as authenticated
    localStorage.setItem('userAuthenticated', 'true');
    localStorage.setItem('userEmail', email);
    
    // Start trial immediately on first sign-in
    if (!isTrialStarted()) {
        localStorage.setItem('trialStartedAt', Date.now().toString());
        console.log('✅ Trial started on sign-in');
    }
    
    // Check if onboarding is complete
    if (isOnboardingComplete()) {
        // User has completed onboarding before, go to homepage
        navigateTo('homepage');
    } else {
        // First time user, start onboarding
        navigateTo('onboarding-1-page');
    }
}

/**
 * Handle user sign-out
 */
async function handleUserSignOutLocal() {
    try {
        const result = await handleSignOut();
        
        if (result.success) {
            localStorage.clear();
            navigateTo('sign-in-page');
        } else {
            showAlertModal('Error', 'Could not sign out. Please try again.');
        }
    } catch (error) {
        console.error('Sign out error:', error);
        showAlertModal('Error', 'Could not sign out. Please try again.');
    }
}

// Make it globally accessible
window.handleUserSignOut = handleUserSignOutLocal;

/**
 * Initialize app on load
 */
async function initializeApp() {
    try {
        const user = await initAuth();
        
        if (!user) {
            navigateTo('sign-in-page');
            return;
        }
        
        console.log('✅ User authenticated:', user.email);
        
        const onboardingComplete = await hasCompletedOnboarding(user.id);
        
        if (!onboardingComplete) {
            navigateTo('onboarding-1-page');
            return;
        }
        
        const trialExpired = await isTrialExpired(user.id);
        const hasSubscription = await hasActiveSubscription(user.id);
        
        if (trialExpired && !hasSubscription) {
            navigateTo('paywall-page');
            return;
        }
        
        navigateTo('homepage');
        
    } catch (error) {
        console.error('Error initializing app:', error);
        navigateTo('sign-in-page');
    }
}

// completeOnboarding function is defined earlier in the file

// Initialize feedback character counter
document.addEventListener('DOMContentLoaded', async () => {
    updateFeedbackCharCount();
    
    // Listen for auth state changes
    onAuthStateChange((event, session) => {
        console.log('Auth event:', event);
        
        if (event === 'SIGNED_OUT') {
            localStorage.clear();
            navigateTo('sign-in-page');
        }
        
        if (event === 'SIGNED_IN') {
            console.log('User signed in:', session.user.email);
        }
        
        if (event === 'TOKEN_REFRESHED') {
            console.log('Token refreshed');
        }
    });
    
    // Initialize app with auth check
    await initializeApp();
    
    // Track initial page view
    const currentPage = document.querySelector('.page.active')?.id || 'sign-in-page';
    trackPageView(currentPage);
});

// Make functions globally accessible for onclick handlers
window.navigateTo = navigateTo;
window.completeOnboarding = completeOnboarding;
window.startFreeTrial = startFreeTrial;
window.generateRandomIdeas = generateRandomIdeas;
window.buildCustomIdeas = buildCustomIdeas;
window.saveProfileChanges = saveProfileChanges;
window.handleChangePassword = handleChangePassword;
window.handleDeleteAccount = handleDeleteAccount;
window.handleUserSignOut = handleUserSignOut;
window.submitFeedback = submitFeedback;
window.trackGenerationEvent = trackGenerationEvent;
window.trackAppEvent = trackAppEvent;
window.savePinnedIdeaToSupabase = savePinnedIdeaToSupabase;
window.saveScheduledIdeaToSupabase = saveScheduledIdeaToSupabase;
window.scheduleIdea = scheduleIdea;
window.expandIdeaCard = expandIdeaCard;
window.closeExpandedCard = closeExpandedCard;
window.editIdeaCard = editIdeaCard;
window.saveIdeaCard = saveIdeaCard;
window.scheduleFromExpanded = scheduleFromExpanded;

