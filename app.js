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
 * Personalize hero section with user's profile data
 */
/**
 * Generate a unique, personalized subtitle based on user profile
 */
function generatePersonalizedSubtitle(profile) {
    // Get specific profile details
    const brandName = profile.brand_name || 'your brand';
    const industry = profile.industry || 'content';
    const platform = profile.platforms?.[0] || 'social media';
    const audience = profile.target_audience || 'your audience';
    const cultureValue = profile.culture_values?.[0] || 'authentic';
    const goal = profile.content_goals || 'connect and inspire';
    const productionLevel = profile.production_level || 'intermediate';
    
    const templates = [
        // Hyper-personalized with multiple data points
        `${brandName}: where ${cultureValue} ${industry} meets ${platform} mastery`,
        `Building ${industry} content that makes ${audience} stop scrolling`,
        `${brandName}'s secret weapon for ${platform} domination`,
        `Turning ${goal} into ${platform} gold, one idea at a time`,
        
        // Goal + Audience specific
        `${audience} won't scroll past this—let's make it happen`,
        `Content that speaks ${audience}'s language on ${platform}`,
        `${goal}? We're about to make that your reality`,
        
        // Industry + Platform combo
        `${industry} content that ${platform} algorithms love`,
        `Your ${industry} brand's ${platform} breakthrough starts here`,
        `${platform}-native ${industry} ideas that actually convert`,
        
        // Culture + Production aware
        `${productionLevel === 'professional' ? 'Studio-grade' : productionLevel === 'basic' ? 'Raw & real' : 'Elevated'} ${cultureValue} content, zero BS`,
        `${cultureValue} storytelling meets ${platform} strategy`,
        
        // Motivational + Personal
        `${brandName}: Ideas worth filming right now`,
        `Your ${industry} content, but make it ${cultureValue}`,
        `${platform} success isn't luck—it's strategy. Let's build yours.`,
        
        // Additional context integration
        profile.additional_context 
            ? `"${profile.additional_context.substring(0, 50)}..." — Let's make this viral`
            : null,
        
        // Time-sensitive
        `Today's the day ${brandName} breaks through on ${platform}`,
        `${audience} is waiting for this. Let's give it to them.`,
        
        // Unique angles
        `${cultureValue} ${industry} content that ${audience} can't help but share`,
        `From concept to ${platform} viral: ${brandName}'s playbook`,
        `${goal}—but make it scroll-stopping`
    ].filter(Boolean);
    
    // Pick a random template
    return templates[Math.floor(Math.random() * templates.length)];
}

// Dynamic greeting phrases - casual and intimate
const greetingPhrases = [
    { text: "Hey there", time: "any" },
    { text: "Good morning", time: "morning" },
    { text: "Hey", time: "afternoon" },
    { text: "Good evening", time: "evening" },
    { text: "What's up", time: "any" },
    { text: "How's it going", time: "any" },
    { text: "Welcome back", time: "any" },
    { text: "Hey, how are you", time: "any" },
    { text: "Nice to see you", time: "any" },
    { text: "Back again", time: "any" },
    { text: "Rise and shine", time: "morning" },
    { text: "Good afternoon", time: "afternoon" },
    { text: "Evening", time: "evening" },
    { text: "Let's create", time: "any" },
    { text: "Ready to roll", time: "any" },
    { text: "Time to shine", time: "any" },
    { text: "Here we go", time: "any" },
    { text: "Let's get it", time: "any" },
    { text: "You're back", time: "any" },
    { text: "What's cooking", time: "any" }
];

// Dynamic textbox placeholders
const textboxPlaceholders = [
    "What's your idea?",
    "What's on your mind?",
    "Got something brewing?",
    "What are you thinking?",
    "Let's create something...",
    "What should we build?",
    "Spark of genius?",
    "What's the vibe?",
    "Ready to brainstorm?",
    "What's inspiring you?",
    "Tell me your vision...",
    "What are we making?",
    "Creative thought?",
    "What's next?",
    "Share your spark...",
    "What's the move?",
    "Dream it, type it...",
    "Your next big idea?",
    "What's the plan?",
    "Let's make magic..."
];

let currentGreetingIndex = 0;
let currentPlaceholderIndex = 0;
let rotatingTextInterval = null;
let currentProfile = null;
let currentBrandName = 'there';

function getRandomGreeting() {
    const hour = new Date().getHours();
    let timeOfDay = "any";
    
    if (hour >= 5 && hour < 12) timeOfDay = "morning";
    else if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
    else if (hour >= 17 && hour < 22) timeOfDay = "evening";
    
    // Filter greetings by time or any
    const suitable = greetingPhrases.filter(g => g.time === timeOfDay || g.time === "any");
    return suitable[Math.floor(Math.random() * suitable.length)].text;
}

function rotateGreeting() {
    const headerGreeting = document.getElementById('header-greeting');
    if (!headerGreeting) return;
    
    const hour = new Date().getHours();
    let timeOfDay = "any";
    
    if (hour >= 5 && hour < 12) timeOfDay = "morning";
    else if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
    else if (hour >= 17 && hour < 22) timeOfDay = "evening";
    
    const suitable = greetingPhrases.filter(g => g.time === timeOfDay || g.time === "any");
    currentGreetingIndex = (currentGreetingIndex + 1) % suitable.length;
    const greeting = suitable[currentGreetingIndex].text;
    
    // Smooth fade transition - 1 second total
    headerGreeting.style.transition = 'opacity 1s ease';
    headerGreeting.style.opacity = '0';
    setTimeout(() => {
        headerGreeting.innerHTML = `${greeting}, <span id="header-user-name">${currentBrandName}</span>`;
        headerGreeting.style.opacity = '1';
    }, 1000); // Slower fade
}

function rotatePlaceholder() {
    const headerInput = document.getElementById('header-idea-input');
    if (!headerInput) return;
    
    currentPlaceholderIndex = (currentPlaceholderIndex + 1) % textboxPlaceholders.length;
    const newPlaceholder = textboxPlaceholders[currentPlaceholderIndex];
    
    // Create a smooth fade for placeholder text via opacity
    headerInput.style.transition = 'opacity 0.8s ease';
    headerInput.style.opacity = '0.5';
    
    setTimeout(() => {
        headerInput.placeholder = newPlaceholder;
        headerInput.style.opacity = '1';
    }, 800); // Smooth fade timing
}

function startRotatingText() {
    // Stop any existing interval
    if (rotatingTextInterval) {
        clearInterval(rotatingTextInterval);
    }
    
    // Rotate greeting every 10 seconds (slower as requested)
    setInterval(rotateGreeting, 10000);
    
    // Rotate placeholder every 10 seconds, but offset by 5 seconds so they don't change at the same time
    setTimeout(() => {
        setInterval(rotatePlaceholder, 10000);
    }, 5000);
}

async function personalizeHeroSection() {
    const user = getUser();
    if (!user) return;
    
    try {
        const profile = await getUserProfile(user.id);
        if (!profile) return;
        
        currentProfile = profile;
        currentBrandName = profile.brand_name || user.user_metadata?.full_name || 'there';
        
        // Update OLD hero section (hidden but keep for compatibility)
        const userNameEl = document.getElementById('user-name');
        if (userNameEl) {
            userNameEl.textContent = currentBrandName;
        }
        
        const subtitleEl = document.querySelector('.hero-subtitle');
        if (subtitleEl) {
            const subtitle = generatePersonalizedSubtitle(profile);
            subtitleEl.textContent = subtitle;
        }
        
        // Update NEW header greeting
        const headerGreeting = document.getElementById('header-greeting');
        const headerUserName = document.getElementById('header-user-name');
        if (headerGreeting && headerUserName) {
            const greeting = getRandomGreeting();
            headerGreeting.innerHTML = `${greeting}, <span id="header-user-name">${currentBrandName}</span>`;
            headerGreeting.style.transition = 'opacity 0.3s ease';
        }
        
        // Set random initial placeholder
        const headerInput = document.getElementById('header-idea-input');
        if (headerInput) {
            currentPlaceholderIndex = Math.floor(Math.random() * textboxPlaceholders.length);
            headerInput.placeholder = textboxPlaceholders[currentPlaceholderIndex];
            headerInput.style.transition = 'opacity 0.2s ease';
        }
        
        // Start rotating text
        startRotatingText();
        
        console.log('✅ Hero section personalized for:', currentBrandName);
        
    } catch (error) {
        console.error('Error personalizing hero:', error);
    }
}

/**
 * Navigate between pages
 * @param {string} pageId - The ID of the page to navigate to
 */
function navigateTo(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    // Pages that require active subscription (allow settings and profile even when expired)
    const restrictedPages = new Set([
        'homepage'
    ]);
    
    // Settings and profile are always accessible to keep users engaged
    const alwaysAccessiblePages = new Set([
        'profile-page',
        'settings-page',
        'account-details-page',
        'change-password-page',
        'delete-account-page',
        'notifications-page',
        'privacy-page',
        'terms-page',
        'help-page',
        'subscription-page'
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
    
    // Track page view (exclude auth pages for privacy)
    const authPages = ['sign-in-page', 'sign-up-page'];
    if (!authPages.includes(pageId)) {
        trackPageView(pageId);
    }
    
    // Check subscription status and personalize when navigating to homepage
    if (pageId === 'homepage') {
        setTimeout(() => checkAndEnforceSubscription(), 100);
        // Personalize hero section
        personalizeHeroSection();
        
        // Reload saved ideas from Supabase (pinned/scheduled)
        loadIdeasFromSupabase().catch(err => {
            console.error('Failed to reload ideas:', err);
        });
        
        const cardStack = document.getElementById('card-stack');
        const existingCards = cardStack ? cardStack.querySelectorAll('.idea-card') : [];
        
        // Only generate if cards haven't been generated yet
        if (existingCards.length === 0) {
            generateNewIdeas({ showLoading: false });
        }
        
        // Update header button based on page
        const homeProfileBtn = document.querySelector('#homepage .profile-pill-btn');
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
    refreshPinnedCount();

    // Save to Supabase
    saveScheduledIdeaToSupabase(ideaData, selectedDateStr)
        .then(savedIdea => {
            if (savedIdea) {
                try {
                    scheduledCard.dataset.idea = JSON.stringify({
                        ...savedIdea,
                        scheduledDate: savedIdea.scheduled_date || ideaData.scheduledDate,
                        scheduledMonth: month,
                        scheduledDay: day,
                        platforms: savedIdea.platforms || ideaData.platforms || []
                    });
                    scheduledCard.dataset.platforms = (savedIdea.platforms || ideaData.platforms || []).join(', ');
                } catch (err) {
                    console.warn('Failed to sync scheduled card dataset with Supabase record:', err);
                }
            }
        })
        .catch(err => {
            console.error('Failed to save scheduled idea:', err);
        });
    
    generateScheduleCalendar();
    console.log('Scheduled idea for:', month, day);
}

/**
 * Create a scheduled card (with date, no expand/delete)
 */
function createScheduledCard(idea) {
    const iconMap = {
        'tiktok': '<img src="https://cdn.simpleicons.org/tiktok/000000" alt="TikTok" class="platform-icon">',
        'youtube': '<img src="https://cdn.simpleicons.org/youtube/FF0000" alt="YouTube" class="platform-icon">'
    };
    // Enforce single platform per idea
    const scheduledPlatforms = Array.isArray(idea.platforms) && idea.platforms.length > 0 ? [idea.platforms[0]] : ['tiktok'];
    const platformIconsHTML = scheduledPlatforms.map(p => iconMap[p] || '').filter(html => html).join('');
    const singlePlatform = scheduledPlatforms[0];

    const scheduledCard = document.createElement('div');
    scheduledCard.className = 'idea-card-collapsed';
    scheduledCard.dataset.platform = singlePlatform;
    scheduledCard.innerHTML = `
        <div class="collapsed-content">
            <div class="collapsed-title">
                <span class="title-text">"${idea.title}"</span>
            </div>
            <div class="collapsed-summary">${idea.summary}</div>
        </div>
    `;

    // Store full idea data with single platform enforced
    const ideaWithSinglePlatform = { ...idea, platforms: scheduledPlatforms };
    scheduledCard.dataset.idea = JSON.stringify(ideaWithSinglePlatform);
    scheduledCard.dataset.platforms = scheduledPlatforms[0];

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
        'youtube': '<img src="https://cdn.simpleicons.org/youtube/FF0000" alt="YouTube" class="platform-icon">'
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
window.deleteIdeaFromExpanded = function deleteIdeaFromExpanded() {
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
window.toggleEditMode = function toggleEditMode() {
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
            
            const allPlatforms = ['tiktok', 'youtube'];
            const iconMap = {
                'tiktok': '<img src="https://cdn.simpleicons.org/tiktok/000000" alt="TikTok" class="platform-icon">',
                'youtube': '<img src="https://cdn.simpleicons.org/youtube/FF0000" alt="YouTube" class="platform-icon">'
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
                'youtube': '<img src="https://cdn.simpleicons.org/youtube/FF0000" alt="YouTube" class="platform-icon">'
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

window.togglePlatformSelection = function togglePlatformSelection(wrapper) {
    // Single selection only
    const container = wrapper.closest('#expanded-platform-icons');
    if (!container) return;
    
    // Deselect all others
    container.querySelectorAll('.platform-icon-wrapper').forEach(w => {
        if (w !== wrapper) {
            w.classList.add('unselected');
        }
    });
    
    // Select this one
    wrapper.classList.remove('unselected');
}

/**
 * Schedule from expanded modal (pinned cards only)
 */
window.scheduleFromExpanded = function scheduleFromExpanded() {
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
window.copyIdeaToClipboard = function copyIdeaToClipboard() {
    const expandedCard = document.getElementById('expanded-idea-card');
    if (!expandedCard) return;

    const ideaData = JSON.parse(expandedCard.dataset.originalCard);
    
    // Format the idea content (clean, no emojis)
    let copyText = `${ideaData.title}\n\n`;
    copyText += `Summary: ${ideaData.summary}\n\n`;
    copyText += `Action/Story: ${ideaData.action}\n\n`;
    copyText += `Shot/Setup: ${ideaData.setup}\n\n`;
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

async function removeCollapsedCard(card) {
    if (!card) return;

    const ideaData = JSON.parse(card.dataset.idea || '{}');
    const isPinned = card.closest('.pinned-ideas');
    const scheduleList = document.querySelector('.schedule-list');

    // 🔴 CRITICAL FIX: Delete from database if it has an ID
    if (ideaData.id) {
        try {
            console.log('🗑️ Deleting idea from database:', ideaData.id);
            const { deleteIdea } = await import('./supabase.js');
            await deleteIdea(ideaData.id);
            console.log('✅ Idea deleted from database');
        } catch (err) {
            console.error('❌ Failed to delete idea from database:', err);
            // Continue with UI removal even if DB delete fails
        }
    }

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
        title: 'AI Got KO\'d - So Here\'s This',
        summary: 'Our AI is taking a nap. Just point camera at stuff until something happens.',
        action: 'Wave your phone around like you know what you\'re doing. You probably don\'t. That\'s fine.',
        setup: 'Any lighting works when expectations are this low. Seriously, we\'re not picky right now.',
        story: 'Start filming. Do some things. Stop filming. Boom - content. You\'re crushing it already.',
        hook: 'I was gonna make something good today but... *gestures vaguely at everything*',
        why: 'Because our AI took a sick day and this is all we got. At least you showed up.',
        platforms: ['tiktok']
    },
    {
        title: 'Just Film Your Coffee or Whatever',
        summary: 'No smart ideas here. Point camera at your drink and pretend it\'s profound.',
        action: 'Make a latte. Film it. Add a filter. Call it "aesthetic vibes" and watch the engagement roll in.',
        setup: 'Natural light is great. Artificial light is fine. Hell, film it in the dark. Who are we to judge?',
        story: 'Pour. Stir. Look pensively at cup. Sip. Deep sigh. That\'s the whole story.',
        hook: 'This coffee represents my entire personality...',
        why: 'Because the algorithm loves coffee content almost as much as it loves your existential dread.',
        platforms: ['tiktok']
    },
    {
        title: 'Dance Like Nobody\'s Watching (They Are)',
        summary: 'Do a little dance. Embarrass yourself. That\'s the content now.',
        action: 'Find a trending sound. Move your body in ways that technically qualify as "dancing." Post anyway.',
        setup: 'Ring light optional. Dignity optional. Commitment to the bit? Mandatory.',
        story: 'Three seconds of confidence, followed by instant regret. Perfect for TikTok.',
        hook: 'My therapist said I should step outside my comfort zone so...',
        why: 'Because our AI is sleeping and this is what creativity looks like without artificial intelligence.',
        platforms: ['tiktok']
    },
    {
        title: 'Point Camera at Face, Say Words',
        summary: 'Revolutionary concept: Just talk to the camera about literally anything.',
        action: 'Complain about something mildly inconvenient. Or share an opinion nobody asked for. Both work.',
        setup: 'Find a wall. Stand in front of wall. That\'s it. You did it.',
        story: 'Beginning, middle, end. Or just middle. Who has time for narrative structure?',
        hook: 'Hot take incoming... *pauses for effect I don\'t have*',
        why: 'Because sometimes the bar is in hell and we\'re all just trying to step over it.',
        platforms: ['youtube']
    },
    {
        title: 'Film Something, Add Text, Call it Art',
        summary: 'Take any video. Slap some text on it. Congratulations, you\'re a content creator.',
        action: 'Record 10 seconds of anything. Add text that says something relatable. Post. Repeat.',
        setup: 'Phone camera. Thumb. That\'s the whole production value right there.',
        story: 'The story is that you need to post something today and this is what you got.',
        hook: 'POV: You\'re pretending you planned this content...',
        why: 'Because our AI is out getting cigarettes and these are the ideas we\'re left with.',
        platforms: ['youtube']
    },
    {
        title: 'Behind the Scenes of Not Knowing What You\'re Doing',
        summary: 'Show your process. Your very confused, chaotic, barely-functional process.',
        action: 'Film yourself making mistakes in real-time. It\'s called "authenticity" now.',
        setup: 'Messy workspace = relatable content. Organized workspace = lies. Choose chaos.',
        story: 'Start with confidence. Descend into confusion. End with "well that happened."',
        hook: 'Watch me pretend I have my life together for 60 seconds...',
        why: 'Because vulnerability is trending and you\'re vulnerable AF right now.',
        platforms: ['youtube']
    },
    {
        title: 'Lipsyncing - Because Real Words Are Hard',
        summary: 'Let someone else do the talking while you just move your mouth. Iconic.',
        action: 'Find audio of someone saying something funny. Mouth the words. Barely try. Still gets views.',
        setup: 'Forward-facing camera. Your face. Maybe some mediocre lighting. We\'re not asking for much.',
        story: 'There is no story. Just vibes and borrowed audio.',
        hook: '*Points at text* "This is about to be relatable..."',
        why: 'Because our AI model is currently "unavailable" and so is our creativity, apparently.',
        platforms: ['tiktok']
    }
];

document.addEventListener('DOMContentLoaded', () => {
    // Initialize auto-scrolling carousels for culture values
    initCultureValueCarousels();

    // Generate initial 7 cards (only if homepage is active)
    if (document.getElementById('homepage').classList.contains('active')) {
        generateNewIdeas({ showLoading: false });
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
                    // Email confirmation required - show success message
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
                } else if (result.user) {
                    // Auto-signed in, start trial and go to onboarding
                    await startTrial(result.user.id);
                    navigateTo('onboarding-1-page');
                } else {
                    // Success but no user object (shouldn't happen)
                    showAlertModal('Account Created', 'Please check your email to confirm your account.');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            } else {
                // Generic error message for security (don't reveal email status)
                const errorMessage = result.error && result.error.includes('Password') 
                    ? result.error 
                    : 'This email cannot be used. Please try a different email address.';
                    
                showAlertModal('Sign Up Failed', errorMessage);
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        } catch (error) {
            console.error('Sign up error:', error);
            
            // Generic error message for security (don't reveal if email exists)
            let errorMessage = 'This email cannot be used. Please try a different email address.';
            
            // Only show specific errors for non-security issues
            if (error.message && error.message.includes('40 seconds')) {
                errorMessage = 'Please wait a moment before trying again.';
            } else if (error.message && error.message.includes('Password')) {
                errorMessage = error.message; // Show password requirements
            }
            
            showAlertModal('Sign Up Failed', errorMessage);
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    // Swipe handlers will be initialized when cards are generated

    // ============================================
    // SWIPE CARD SYSTEM
    // ============================================

    let isGeneratingIdeas = false;
    let generatorStatusTimer = null;

    /**
     * Update generator button/loading state
     * REMOVED - Generator UI removed, function kept for compatibility
     */
    function setGeneratorLoadingState(state, options = {}) {
        // Generator UI removed - will rebuild in future
        return;
    }

    /**
     * Generate 7 new AI-powered idea cards
     */
    async function generateNewIdeas(options = {}) {
        if (isGeneratingIdeas) {
            console.warn('⚠️ Already generating ideas. Please wait for current batch to finish.');
            return;
        }

        const {
            customDirection = '',
            isCampaign = false,
            preferredPlatforms = [],
            showLoading = true
        } = options;

        isGeneratingIdeas = true;
        if (showLoading) {
            isIdeasLoading = true;
            updateSwiperInfo();
        }
        setGeneratorLoadingState('building', { showLoading });
        if (showLoading) {
            if (generatorStatusTimer) clearTimeout(generatorStatusTimer);
            generatorStatusTimer = setTimeout(() => {
                setGeneratorLoadingState('incoming', { showLoading });
            }, 1000);
        }

        const cleanup = () => {
            if (generatorStatusTimer) {
                clearTimeout(generatorStatusTimer);
                generatorStatusTimer = null;
            }
            setGeneratorLoadingState('idle', { showLoading });
            isGeneratingIdeas = false;
            if (showLoading) {
                isIdeasLoading = false;
                lastRefreshTime = new Date();
                updateSwiperInfo();
            }
        };

        const cardStack = document.getElementById('card-stack');
        if (!cardStack) {
            console.warn('⚠️ Card stack not found.');
            cleanup();
            return;
        }

        // Remove all existing idea cards
        const existingCards = cardStack.querySelectorAll('.idea-card:not(.loading-placeholder)');
        existingCards.forEach(card => card.remove());

        // Reset cards remaining
        cardsRemaining = 7;
        ideasStack = [];
        ideasRemaining = 7;
        lastRefreshTime = new Date();

        // Show single loading placeholder
        const placeholder = createLoadingPlaceholder(1);
        cardStack.appendChild(placeholder);
        updateSwiperInfo();
        updateIdeaGeneratorVisibility();

        // Show loading state
        console.log('🤖 Generating AI-powered ideas (progressive loading)...', {
            customDirection,
            isCampaign,
            preferredPlatforms
        });
        
        try {
            // Import the AI service
            const { generateContentIdeas } = await import('./openai-service.js');
            
            // Get user profile from Supabase
            const user = getUser();
            let userProfile = {
                contentType: 'creator',
                targetAudience: 'Gen Z and Millennials',
                platforms: ['tiktok', 'youtube'],
                cultureValues: ['Authentic', 'Creative', 'Bold']
            };
            
            if (user) {
                const profile = await getUserProfile(user.id);
                if (profile) {
                    console.log('✅ Using user profile for AI generation:', profile);
                    userProfile = {
                        brandName: profile.brand_name || 'your brand',
                        contentType: profile.role || 'creator',
                        targetAudience: profile.target_audience || 'Gen Z and Millennials',
                        platforms: profile.platforms || ['tiktok', 'youtube'],
                        cultureValues: profile.culture_values || ['Authentic', 'Creative', 'Bold'],
                        contentGoals: profile.content_goals || '',
                        industry: profile.industry || '',
                        productionLevel: profile.production_level || 'intermediate',
                        preferredPlatforms: preferredPlatforms.length > 0 ? preferredPlatforms : undefined
                    };
                } else {
                    console.log('⚠️ No profile found, using defaults');
                }
            }
            
            if (preferredPlatforms.length > 0) {
                userProfile.preferredPlatforms = preferredPlatforms;
            }
            
            // INCREMENTAL LOADING: 3 → 2 → 2 with all ideas pre-generated
            
            // Get vibe context from selected chips
            const vibeContext = buildVibeContext();
            if (vibeContext) {
                console.log('🎨 Including vibe context:', vibeContext);
            }
            
            // Start live thinking animation with personalized steps
            startLiveThinking(userProfile);

            console.log('⚡ Generating full idea set (7 ideas)...');
            const allIdeasRaw = await generateContentIdeas(userProfile, customDirection + vibeContext, isCampaign, preferredPlatforms, 7);
            const allIdeas = Array.isArray(allIdeasRaw) ? allIdeasRaw.slice(0, 7) : [];

            if (allIdeas.length === 0) {
                throw new Error('No ideas returned from AI service');
            }

            const batches = [
                { ideas: allIdeas.slice(0, 3), delay: 0 },
                { ideas: allIdeas.slice(3, 5), delay: 150 },
                { ideas: allIdeas.slice(5, 7), delay: 300 }
            ];

            // Remove the single loading placeholder
            const placeholder = cardStack.querySelector('.loading-placeholder');
            if (placeholder) {
                placeholder.remove();
            }

            const revealBatch = async (batch) => {
                const { ideas: batchIdeas, delay } = batch;
                if (!batchIdeas.length) return;

                if (delay > 0) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

                batchIdeas.forEach((idea) => {
                    const ideaInstance = cloneIdeaTemplate(idea);
                    const card = createIdeaCard(ideaInstance);
                    cardStack.insertBefore(card, generatorCard);
                    ideasStack.push(ideaInstance);
                });

                initSwipeHandlers();
                updateIdeaGeneratorVisibility();
            };

            let processed = 0;
            for (const batch of batches) {
                await revealBatch(batch);
                processed += batch.ideas.length;
                if (processed >= 3) {
                    ideasRemaining = 7;
                    updateSwiperInfo();
                }
            }

            // Stop live thinking animation
            stopLiveThinking();
            
        } catch (error) {
            console.error('❌ AI generation failed, using fallback:', error);
            stopLiveThinking();
            
            // Update placeholder to show AI failed
            const placeholders = cardStack.querySelectorAll('.loading-placeholder');
            placeholders.forEach(placeholder => {
                const title = placeholder.querySelector('.loading-title');
                if (title) {
                    title.textContent = 'Service Unavailable';
                    title.style.color = 'rgba(255, 255, 255, 0.7)';
                }
            });
            
            // Wait 5 seconds, then show fallback cards
            setTimeout(() => {
                // Remove all placeholders
                const placeholders = cardStack.querySelectorAll('.loading-placeholder');
                placeholders.forEach(p => p.remove());
                
                // Fallback to template ideas - create 7 different random ideas
                ideasStack = [];
                for (let i = 0; i < 7; i++) {
                    const randomIdea = ideaTemplates[Math.floor(Math.random() * ideaTemplates.length)];
                    const ideaInstance = cloneIdeaTemplate(randomIdea);
                    ideasStack.push(ideaInstance);
                    const card = createIdeaCard(ideaInstance);
                    cardStack.appendChild(card);
                }
                
                initSwipeHandlers();
                
                // Update swiper info after fallback cards loaded
                lastRefreshTime = new Date();
                ideasRemaining = 7;
                updateSwiperInfo();
                updateIdeaGeneratorVisibility();
                
                console.log('✅ Created 7 fallback idea cards');
                
                // Reset generating flag
                cleanup();
            }, 5000);
            
            return; // Exit early, don't continue execution
        }

        // Ensure we have exactly 7 ideas
        if (ideasStack.length !== 7) {
            console.warn(`⚠️ Expected 7 ideas, got ${ideasStack.length}`);
        }

        // Update swiper info - ALWAYS show 7 regardless
        lastRefreshTime = new Date();
        ideasRemaining = 7;
        updateSwiperInfo();

        // Hide idea generator
        updateIdeaGeneratorVisibility();

        console.log('✅ Created', ideasStack.length, 'AI-powered idea cards');

        cleanup();
    }

    window.generateNewIdeas = generateNewIdeas;

    /**
     * Create a loading placeholder card with live AI thinking process
     */
    function createLoadingPlaceholder(number) {
        const placeholder = document.createElement('div');
        placeholder.className = 'idea-card loading-placeholder';
        placeholder.innerHTML = `
            <div class="loading-content">
                <div class="logo-loader" aria-hidden="true">
                    <img src="/PHasse-Logo.png" alt="" class="logo-fill-animated">
                </div>
                <h3 class="loading-title">Service Unavailable</h3>
                <div class="ai-thinking-window">
                    <div class="thinking-line">▸ Loading brand profile...</div>
                    <div class="thinking-line">▸ Analyzing target audience...</div>
                    <div class="thinking-line">▸ Scanning platform trends...</div>
                    <div class="thinking-line">▸ Generating unique concepts...</div>
                </div>
            </div>
        `;
        return placeholder;
    }

    /**
     * Animate AI thinking process with live updates
     */
    let thinkingInterval = null;
    function startLiveThinking(userProfile = {}) {
        // Personalize thinking steps with user's actual data
        const brandName = userProfile.brandName || 'your brand';
        const audience = userProfile.targetAudience || 'target audience';
        const platform = userProfile.platforms?.[0] || userProfile.preferredPlatforms?.[0] || 'platform';
        const industry = userProfile.industry || 'industry';
        const productionLevel = userProfile.productionLevel || 'production';
        const cultureValue = userProfile.cultureValues?.[0] || 'authentic';
        
        const thinkingSteps = [
            `▸ Loading ${brandName} profile...`,
            `▸ Analyzing ${audience} behavior...`,
            `▸ Scanning ${platform} trends...`,
            `▸ Studying ${industry} content gaps...`,
            `▸ Evaluating ${productionLevel} resources...`,
            `▸ Researching ${platform} algorithms...`,
            `▸ Generating ${cultureValue} concepts...`,
            `▸ Crafting ${audience} hooks...`,
            `▸ Optimizing for ${platform} virality...`,
            `▸ Refining ${brandName} voice...`,
            `▸ Building scroll-stopping ideas...`,
            `▸ Finalizing unique angles...`
        ];
        
        let stepIndex = 0;
        const windows = document.querySelectorAll('.ai-thinking-window');
        
        if (thinkingInterval) clearInterval(thinkingInterval);
        
        thinkingInterval = setInterval(() => {
            windows.forEach(window => {
                const lines = window.querySelectorAll('.thinking-line');
                
                // Shift lines up
                lines[0].textContent = lines[1].textContent;
                lines[1].textContent = lines[2].textContent;
                lines[2].textContent = lines[3].textContent;
                lines[3].textContent = thinkingSteps[stepIndex % thinkingSteps.length];
                
                // Add fade-in animation
                lines[3].style.animation = 'fadeInLine 0.3s ease';
                setTimeout(() => {
                    lines[3].style.animation = '';
                }, 300);
            });
            
            stepIndex++;
        }, 800); // Update every 800ms
    }

    function stopLiveThinking() {
        if (thinkingInterval) {
            clearInterval(thinkingInterval);
            thinkingInterval = null;
        }
    }

    /**
     * Expand idea card to show full details
     */
    window.expandIdeaCard = function(button) {
        const card = button.closest('.idea-card');
        if (!card) return;
        
        const ideaData = JSON.parse(card.dataset.idea);
        
        // Replace card content with expanded view
        const cardContent = card.querySelector('.card-content');
        cardContent.innerHTML = `
            <h3 class="card-title">"${ideaData.title}"</h3>
            
            <div class="card-section">
                <span class="section-label">Summary:</span>
                <p class="section-text">${ideaData.summary}</p>
            </div>

            <div class="card-section">
                <span class="section-label">Hook:</span>
                <p class="section-text">${ideaData.hook}</p>
            </div>

            <div class="card-section">
                <span class="section-label">Why:</span>
                <p class="section-text">${ideaData.why}</p>
            </div>

            <button class="collapse-idea-btn" onclick="collapseIdeaCard(this)">
                <svg viewBox="0 0 24 24" width="16" height="16" style="margin-right: 6px;">
                    <path fill="currentColor" d="M19 13H5v-2h14v2z"/>
                </svg>
                Collapse
            </button>
        `;
        
        // Add expanded class for styling
        card.classList.add('expanded');
    };

    /**
     * Collapse idea card back to summary view
     */
    window.collapseIdeaCard = function(button) {
        const card = button.closest('.idea-card');
        if (!card) return;
        
        const ideaData = JSON.parse(card.dataset.idea);
        
        // Replace card content with collapsed view
        const cardContent = card.querySelector('.card-content');
        cardContent.innerHTML = `
            <h3 class="card-title">"${ideaData.title}"</h3>
            
            <div class="card-section">
                <span class="section-label">Summary:</span>
                <p class="section-text">${ideaData.summary}</p>
            </div>

            <div class="card-section">
                <span class="section-label">Why It Works:</span>
                <p class="section-text">${ideaData.why}</p>
            </div>

            <button class="build-idea-btn" onclick="expandIdeaCard(this)">
                <svg viewBox="0 0 24 24" width="16" height="16" style="margin-right: 6px;">
                    <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Build Idea
            </button>
        `;
        
        // Remove expanded class
        card.classList.remove('expanded');
    };

    /**
     * Generate random ideas (dice button)
     */
    window.generateRandomIdeas = function() {
        console.log('🎲 Generating random ideas');
        generateNewIdeas({ showLoading: true });
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
        
        generateNewIdeas({
            customDirection: direction,
            isCampaign,
            preferredPlatforms: platforms,
            showLoading: true
        });
        
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
                    <span class="section-label">Hook:</span>
                    <p class="section-text">${idea.hook || 'Grab attention with the first 3 seconds!'}</p>
                </div>

                <div class="card-section">
                    <span class="section-label">Why It Works:</span>
                    <p class="section-text">${idea.why}</p>
                </div>
            </div>

            <div class="card-actions-bottom">
                <button class="card-action-btn skip-btn" onclick="skipCard(this)" aria-label="Skip">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                        <path fill="currentColor" d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/>
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
        // Safety check
        if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
            console.warn('⚠️ No platforms provided:', platforms);
            return '';
        }

        console.log('🎨 Generating platform icons for:', platforms);

        return platforms.map(platform => {
            const platformLower = platform.toLowerCase();
            if (platformLower === 'tiktok') {
                return `<img src="https://cdn.simpleicons.org/tiktok/000000" alt="TikTok" class="platform-icon">`;
            } else if (platformLower === 'youtube') {
                return `
                    <div class="platform-icon-group-collapsed">
                        <img src="https://cdn.simpleicons.org/youtube/FF0000" alt="YouTube" class="platform-icon-img">
                        <div class="platform-icon-indicator"></div>
                    </div>
                `;
            } else {
                console.warn(`⚠️ Unknown platform: ${platform}`);
                return '';
            }
        }).join('');
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

        const cards = cardStack.querySelectorAll('.idea-card:not(.loading-placeholder)');
        console.log(`🎯 Initializing swipe for ${cards.length} cards`);
        
        cards.forEach((card, index) => {
            // Skip if handlers already attached
            if (card.dataset.swipeHandlersAttached === 'true') {
                console.log(`⏭️ Skipping card ${index} - handlers already attached`);
                return;
            }
            
            // Mark this card as having handlers
            card.dataset.swipeHandlersAttached = 'true';
            console.log(`✅ Attaching handlers to card ${index}`);
            
            let touchStartX = 0;
            let touchStartY = 0;
            let touchCurrentX = 0;
            let touchCurrentY = 0;
            let isTouching = false;
            let hasMoved = false;

            // Touch Start
            card.addEventListener('touchstart', (e) => {
                // Block swipe if subscription expired
                if (window.swipeHandlersDisabled) {
                    return;
                }
                
                console.log(`📱 Card ${index} touchstart`);
                
                // Only allow dragging the current top idea card (ignore other siblings)
                const topCard = cardStack.querySelector('.idea-card:not(.swipe-left):not(.swipe-right)');
                if (!topCard || card !== topCard) {
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
                    card.style.transition = 'transform 0.3s ease-out'; /* Smooth return, no bounce */
                    card.style.transform = '';
                    setTimeout(() => {
                        card.style.transition = 'none';
                    }, 300);
                }
            });

            // Touch Cancel
            card.addEventListener('touchcancel', (e) => {
                console.log('❌ Touch cancelled');
                if (!isTouching) return;
                
                isTouching = false;
                card.classList.remove('swiping');
                card.style.transition = 'transform 0.3s ease-out'; /* Smooth return, no bounce */
                card.style.transform = '';
                setTimeout(() => {
                    card.style.transition = 'none';
                }, 300);
            });

            // Mouse events for desktop
            let mouseDown = false;
            let mouseStartX = 0;
            let mouseStartY = 0;

            card.addEventListener('mousedown', (e) => {
                const topCard = cardStack.querySelector('.idea-card:not(.swipe-left):not(.swipe-right)');
                if (!topCard || card !== topCard || e.target.closest('button')) return;

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
                    card.style.transition = 'transform 0.3s ease-out'; /* Smooth return, no bounce */
                    card.style.transform = '';
                    setTimeout(() => {
                        card.style.transition = 'none';
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
            const grid = document.querySelector('.pinned-ideas .ideas-grid');
            const existingPinnedCards = grid ? grid.querySelectorAll('.idea-card-collapsed') : [];
            
            console.log('🔍 Pin limit check: Current pinned count =', existingPinnedCards.length);
            
            if (existingPinnedCards.length >= 7) {
                // Show alert and return card to center
                console.warn('⚠️ Pin limit reached! Cannot pin more ideas.');
                showAlertModal('Pin Limit Reached', 'You can only pin up to 7 ideas at a time. Please schedule or delete an idea before pinning another.');
                card.style.transition = 'transform 0.3s ease-out'; /* Smooth return, no bounce */
                card.style.transform = '';
                card.classList.remove('swiping');
                setTimeout(() => {
                    card.style.transition = 'none';
                }, 300);
                return; // Don't swipe the card away
            }
            
            // Pin the card locally and persist
            const pinnedCard = addPinnedIdea(ideaData);
            
            if (pinnedCard) {
                console.log('💾 Saving pinned idea to Supabase:', {
                    title: ideaData.title,
                    is_pinned: true,
                    platforms: ideaData.platforms
                });
                
                savePinnedIdeaToSupabase(ideaData)
                    .then(savedIdea => {
                        if (savedIdea) {
                            console.log('✅ Successfully saved pinned idea:', savedIdea.id);
                            try {
                                pinnedCard.dataset.idea = JSON.stringify({
                                    ...savedIdea,
                                    platforms: savedIdea.platforms || ideaData.platforms || []
                                });
                                pinnedCard.dataset.platforms = (savedIdea.platforms || ideaData.platforms || []).join(', ');
                            } catch (err) {
                                console.warn('Failed to update pinned idea dataset with Supabase record:', err);
                            }
                        } else {
                            console.error('❌ Save returned null - removing from UI');
                            if (pinnedCard && pinnedCard.parentNode) {
                                pinnedCard.remove();
                                refreshPinnedCount();
                            }
                            showAlertModal('Save Failed', 'Could not save pinned idea. Please check your connection and try again.');
                        }
                    })
                    .catch(err => {
                        console.error('❌ Failed to save pinned idea:', err);
                        if (pinnedCard && pinnedCard.parentNode) {
                            pinnedCard.remove();
                            refreshPinnedCount();
                        }
                        showAlertModal('Save Failed', 'Could not save pinned idea. Please check your connection and try again.');
                    });
            }
        }

        // Clear inline styles and trigger clean animation
        card.style.transform = '';
        card.style.transition = '';
        card.classList.remove('swiping'); // Ensure swiping class is removed
        card.classList.add(`swipe-${direction}`); // Add swipe animation class

        // Remove card after animation completes (300ms animation + small buffer)
        setTimeout(() => {
            card.remove();
            cardsRemaining--;
            ideasRemaining--;
            updateSwiperInfo();
            updateIdeaGeneratorVisibility();
        }, 350); // Reduced from 500ms to match faster animation
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
        // Generator card removed - function kept for compatibility
        // Will rebuild in future
        return;
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
    function refreshPinnedCount() {
        const countElement = document.querySelector('.pinned-ideas .count');
        const grid = document.querySelector('.pinned-ideas .ideas-grid');
        if (!countElement || !grid) return;

        const total = grid.querySelectorAll('.idea-card-collapsed').length;
        countElement.textContent = `(${total})`;

        const existingEmptyState = grid.querySelector('.empty-state');
        if (total === 0) {
            if (!existingEmptyState) {
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.innerHTML = '<p>No pinned ideas yet. Start swiping!</p>';
                grid.appendChild(emptyState);
            }
        } else if (existingEmptyState) {
            existingEmptyState.remove();
        }
    }

    /**
     * Add a pinned idea to the pinned ideas section
     */
    function addPinnedIdea(idea) {
        const grid = document.querySelector('.pinned-ideas .ideas-grid');
        if (!grid) return null;

        if (!idea.id) {
            idea.id = generateIdeaId();
        }

        // Check if already at 7 pinned ideas limit
        const existingPinnedCards = grid.querySelectorAll('.idea-card-collapsed');
        if (existingPinnedCards.length >= 7) {
            showAlertModal('Pin Limit Reached', 'You can only pin up to 7 ideas at a time. Please schedule or delete an idea before pinning another.');
            return null;
        }

        // Remove empty state if present
        const emptyState = document.querySelector('.pinned-ideas .empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        // Create platform icons HTML
        const iconMap = {
            'tiktok': '<img src="https://cdn.simpleicons.org/tiktok/000000" alt="TikTok" class="platform-icon">',
            'youtube': '<img src="https://cdn.simpleicons.org/youtube/FF0000" alt="YouTube" class="platform-icon">'
        };
        // Enforce single platform per idea
        const platformsArray = Array.isArray(idea.platforms) && idea.platforms.length > 0 ? [idea.platforms[0]] : ['tiktok'];
        const platformIconsHTML = platformsArray.map(p => iconMap[p] || '').filter(html => html).join('');
        const singlePlatform = platformsArray[0];

        // Create collapsed card
        const collapsedCard = document.createElement('div');
        collapsedCard.className = 'idea-card-collapsed';
        collapsedCard.dataset.platform = singlePlatform;
        collapsedCard.innerHTML = `
            <div class="collapsed-content">
                <div class="collapsed-title">
                    <span class="title-text">"${idea.title}"</span>
                </div>
                <div class="collapsed-summary">${idea.summary}</div>
            </div>
        `;

        // Store full idea data with single platform enforced
        const ideaWithSinglePlatform = { ...idea, platforms: platformsArray };
        collapsedCard.dataset.idea = JSON.stringify(ideaWithSinglePlatform);
        collapsedCard.dataset.platforms = platformsArray[0];

        // Add click handler for expansion
        collapsedCard.addEventListener('click', (e) => {
            expandIdeaCard(collapsedCard);
        });

        grid.appendChild(collapsedCard);
        refreshPinnedCount();
        return collapsedCard;
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
    let isIdeasLoading = false;

    function updateSwiperInfo() {
        const ideasCountElement = document.getElementById('ideas-count');
        const refreshTimeElement = document.getElementById('refresh-time');
        
        // Count actual remaining cards in the DOM (excluding generator card and loading placeholders)
        const cardStack = document.getElementById('card-stack');
        const actualCards = cardStack ? cardStack.querySelectorAll('.idea-card:not(.loading-placeholder)').length : 0;
        ideasRemaining = actualCards;
        
        if (ideasCountElement) {
            if (isIdeasLoading) {
                ideasCountElement.textContent = 'Loading ideas…';
            } else if (ideasRemaining === 0) {
                ideasCountElement.textContent = 'No ideas left';
            } else {
                ideasCountElement.textContent = `${ideasRemaining} ${ideasRemaining === 1 ? 'Idea' : 'Ideas'}`;
            }
        }
        
        if (refreshTimeElement) {
            if (isIdeasLoading) {
                refreshTimeElement.textContent = 'Fetching fresh ideas…';
            } else {
                const hours = lastRefreshTime.getHours();
                const minutes = lastRefreshTime.getMinutes();
                const ampm = hours >= 12 ? 'PM' : 'AM';
                const displayHours = hours % 12 || 12;
                const displayMinutes = minutes.toString().padStart(2, '0');
                refreshTimeElement.textContent = `Refreshed ${displayHours}:${displayMinutes} ${ampm}`;
            }
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

    if (typeof window !== 'undefined') {
        window.refreshPinnedCount = refreshPinnedCount;
        window.addPinnedIdea = addPinnedIdea;
        window.createScheduledCard = createScheduledCard;
    }

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

if (typeof window !== 'undefined') {
    window.generateScheduleCalendar = generateScheduleCalendar;
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
    data.additionalContext = document.getElementById(`${prefix}-additional-context`)?.value.trim() || '';
    
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

async function loadProfileData() {
    console.log('📥 Loading profile data from Supabase...');
    
    try {
        const user = getUser();
        if (!user) {
            console.log('⚠️ No user found, skipping profile load');
            return;
        }
        
        const profile = await getUserProfile(user.id);
        if (!profile) {
            console.log('⚠️ No profile found in Supabase');
            return;
        }
        
        console.log('✅ Profile loaded from Supabase:', profile);
        populateProfileFields(profile);
    } catch (err) {
        console.error('❌ Failed to load profile data:', err);
    }
}

function populateProfileFields(data) {
    if (!data) return;
    const mapping = {
        'profile-brand-name': data.brand_name || data.brandName || '',
        'profile-role': data.role || '',
        'profile-founded': data.founded_year || data.founded || '',
        'profile-industry': data.industry || '',
        'profile-location': data.location || '',
        'profile-target-audience': data.target_audience || data.targetAudience || '',
        'profile-content-goals': data.content_goals || data.contentGoals || '',
        'profile-post-frequency': data.post_frequency || data.postFrequency || '',
        'profile-production-level': data.production_level || data.productionLevel || '',
        'profile-additional-context': data.additional_context || ''
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
        const cultureValues = data.culture_values || data.cultureValues || [];
        cultureContainer.querySelectorAll('.pill-btn').forEach(pill => {
            pill.classList.toggle('selected', cultureValues.includes(pill.dataset.value));
        });
    }

    const platformContainer = document.getElementById('profile-platforms');
    if (platformContainer) {
        const platforms = data.platforms || [];
        platformContainer.querySelectorAll('.platform-select-btn').forEach(btn => {
            btn.classList.toggle('selected', platforms.includes(btn.dataset.platform));
        });
    }
}

async function completeOnboarding() {
    console.log('🔄 Starting completeOnboarding...');
    
    // Get values from onboarding pages (with 'onb-' prefix)
    const brandName = document.getElementById('onb-brand-name')?.value;
    const role = document.getElementById('onb-role')?.value;
    const foundedYear = document.getElementById('onb-founded')?.value;
    const industry = document.getElementById('onb-industry')?.value;
    const targetAudience = document.getElementById('onb-target-audience')?.value;
    const contentGoals = document.getElementById('onb-content-goals')?.value;
    const postFrequency = document.getElementById('onb-post-frequency')?.value;
    const productionLevel = document.getElementById('onb-production-level')?.value;
    
    console.log('📝 Form values:', { brandName, role, foundedYear, industry, targetAudience, contentGoals, postFrequency, productionLevel });
    
    if (!brandName || brandName.trim() === '') {
        console.log('❌ Brand name is empty');
        showAlertModal('Required Field', 'Please enter your brand name to continue.');
        return;
    }
    
    // Get selected platforms from onboarding page 2
    const selectedPlatforms = Array.from(
        document.querySelectorAll('#onb-platforms .platform-select-btn.selected')
    ).map(btn => btn.dataset.platform);
    
    // Get selected culture values from onboarding page 2
    const selectedValues = Array.from(
        document.querySelectorAll('#onb-culture-values .pill-btn.selected')
    ).map(btn => btn.dataset.value);
    
    console.log('📱 Selected platforms:', selectedPlatforms);
    console.log('💎 Selected culture values:', selectedValues);
    
    try {
        const user = getUser();
        console.log('👤 Current user:', user);
        
        if (!user) {
            console.log('❌ No user session found');
            showAlertModal('Error', 'No user session found. Please sign in again.');
            navigateTo('sign-in-page');
            return;
        }
        
        console.log('💾 Saving profile to Supabase...');
        
        await updateUserProfile(user.id, {
            brand_name: brandName,
            role: role,
            founded_year: foundedYear || null,
            industry: industry,
            target_audience: targetAudience,
            content_goals: contentGoals,
            post_frequency: postFrequency,
            production_level: productionLevel,
            platforms: selectedPlatforms,
            culture_values: selectedValues,
            onboarding_complete: true
        });
        
        console.log('✅ Onboarding complete, profile saved to Supabase');
        
        navigateTo('paywall-page');
        
    } catch (error) {
        console.error('❌ Error completing onboarding:', error);
        console.error('Error details:', error.message, error.stack);
        showAlertModal('Error', `Could not save profile: ${error.message}`);
    }
}

async function saveProfileChanges() {
    console.log('💾 Saving profile changes to Supabase...');
    
    try {
        const user = getUser();
        if (!user) {
            showAlertModal('Error', 'No user session found. Please sign in again.');
            return;
        }
        
        const profileData = getProfileFormData('profile');
        console.log('📝 Profile data to save:', profileData);
        
        // Save to Supabase
        await updateUserProfile(user.id, profileData);
        
        // Also save to localStorage as backup
        saveProfileData(profileData);
        
        // Reload profile data to confirm
        await loadProfileData();
        
        showAlertModal('Profile Updated', 'Your profile details have been saved.');
        console.log('✅ Profile saved successfully');
    } catch (err) {
        console.error('❌ Failed to save profile:', err);
        showAlertModal('Error', 'Failed to save profile. Please try again.');
    }
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

async function hasAccessToPaidContent() {
    const user = getUser();
    if (user) {
        const hasSubscription = await hasActiveSubscription(user.id);
        if (hasSubscription) return true;
    }
    if (!isTrialStarted()) return false;
    const trialExpired = await isTrialExpired(user?.id);
    return !trialExpired;
}

async function startFreeTrial() {
    const user = getUser();
    
    if (user) {
        const hasSubscription = await hasActiveSubscription(user.id);
        if (hasSubscription) {
            // Mark onboarding as complete
            localStorage.setItem('onboardingComplete', 'true');
            navigateTo('homepage');
            return;
        }
    }

    if (isTrialStarted()) {
        const trialExpired = await isTrialExpired(user?.id);
        if (trialExpired) {
            showAlertModal('Trial Ended', 'Your free trial has expired. Subscribe to continue.');
            await updateTrialCountdownDisplay();
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
    await updateTrialCountdownDisplay();
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

async function updateTrialCountdownDisplay() {
    const countdownEl = document.getElementById('trial-countdown');
    const startBtn = document.getElementById('start-trial-btn');
    if (!countdownEl || !startBtn) return;

    // Check if user has active subscription
    const user = getUser();
    if (user) {
        const hasSubscription = await hasActiveSubscription(user.id);
        if (hasSubscription) {
            countdownEl.textContent = 'Thanks for subscribing!';
            startBtn.textContent = 'Manage Subscription';
            startBtn.disabled = false;
            return;
        }
    }

    if (!isTrialStarted()) {
        countdownEl.textContent = 'Begin your 3-day free trial to unlock Phasee.';
        startBtn.textContent = 'Start Free Trial';
        startBtn.disabled = false;
        return;
    }

    const trialExpired = await isTrialExpired(user?.id);
    if (trialExpired) {
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
        // NOTE: Analytics tracking not yet implemented in supabase.js
        // This function is a placeholder for future analytics integration
        const { getCurrentUser } = await import('./supabase.js');
        const { user, error } = await getCurrentUser();
        
        if (error || !user) return; // Don't track if not logged in
        
        // TODO: Implement analytics tracking in supabase.js when ready
        // await trackToSupabase(user.id, { event_type: eventType, ...context });
    } catch (error) {
        console.error('Error tracking generation event:', error);
    }
}

/**
 * Track app analytics (page views, errors, session duration)
 */
async function trackAppEvent(eventData) {
    try {
        // NOTE: Analytics tracking not yet implemented in supabase.js
        // This function is a placeholder for future analytics integration
        // TODO: Implement analytics tracking in supabase.js when ready
        // const { trackAppEvent: trackToSupabase } = await import('./supabase.js');
        // await trackToSupabase(eventData);
    } catch (error) {
        console.error('Error tracking app event:', error);
    }
}

/**
 * Track page view with session duration
 * NOTE: Auth pages (sign-in, sign-up) are excluded for privacy
 */
let pageStartTime = Date.now();
let currentPage = 'homepage';

function trackPageView(pageName) {
    // Exclude authentication pages from analytics
    const authPages = ['sign-in-page', 'sign-up-page'];
    
    // Track previous page session duration (if not auth page)
    if (currentPage && pageStartTime && !authPages.includes(currentPage)) {
        const sessionDuration = Math.floor((Date.now() - pageStartTime) / 1000);
        trackAppEvent({
            event_type: 'page_view',
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
        console.log('📡 Importing Supabase functions...');
        const { saveIdea, getCurrentUser } = await import('./supabase.js');
        const { user, error: userError } = await getCurrentUser();
        
        if (userError || !user) {
            console.warn('⚠️ User not logged in, idea saved locally only');
            return null;
        }
        
        console.log('👤 User authenticated:', user.id);
        console.log('📝 Idea data being saved:', {
            title: ideaData.title,
            summary: ideaData.summary?.substring(0, 50) + '...',
            platforms: ideaData.platforms,
            is_pinned: true,
            is_scheduled: false,
            action: ideaData.action ? 'present' : 'missing',
            setup: ideaData.setup ? 'present' : 'missing',
            story: ideaData.story ? 'present' : 'missing',
            hook: ideaData.hook ? 'present' : 'missing'
        });
        
        const { data: savedIdea, error: saveError } = await saveIdea({
            ...ideaData,
            user_id: user.id,
            type: 'pinned',
            is_pinned: true,
            is_scheduled: false
        });
        
        if (saveError || !savedIdea) {
            console.error('❌ saveIdea failed:', saveError);
            return null;
        }
        
        console.log('✅ Idea saved to Supabase with ID:', savedIdea.id);
        
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
        const { saveIdea, updateIdea, getCurrentUser } = await import('./supabase.js');
        const { user, error: userError } = await getCurrentUser();
        
        if (userError || !user) {
            console.warn('User not logged in, idea saved locally only');
            return null;
        }
        
        let savedIdea;
        if (ideaData.id) {
            const { data, error } = await updateIdea(ideaData.id, {
                ...ideaData,
                is_pinned: false,
                is_scheduled: true,
                scheduled_date: scheduledDate,
                status: 'scheduled'
            });
            if (error) {
                console.error('Error updating idea:', error);
                return null;
            }
            savedIdea = data;
        } else {
            const { data, error } = await saveIdea({
                ...ideaData,
                user_id: user.id,
                type: 'scheduled',
                is_pinned: false,
                is_scheduled: true,
                scheduled_date: scheduledDate,
                status: 'scheduled'
            });
            if (error) {
                console.error('Error saving idea:', error);
                return null;
            }
            savedIdea = data;
        }
        
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
let isLoadingIdeas = false;
async function loadIdeasFromSupabase() {
    try {
        // Prevent concurrent loads
        if (isLoadingIdeas) {
            console.log('⚠️ Already loading ideas, skipping...');
            return;
        }
        isLoadingIdeas = true;
        
        console.log('📥 Loading ideas from Supabase...');
        const user = getUser();
        
        if (!user) {
            console.log('⚠️ No user found, skipping idea load');
            isLoadingIdeas = false;
            return;
        }
        
        const addPinnedIdeaFn =
            (typeof window !== 'undefined' && typeof window.addPinnedIdea === 'function')
                ? window.addPinnedIdea
                : (typeof addPinnedIdea === 'function' ? addPinnedIdea : null);
        const refreshPinnedCountFn =
            (typeof window !== 'undefined' && typeof window.refreshPinnedCount === 'function')
                ? window.refreshPinnedCount
                : (typeof refreshPinnedCount === 'function' ? refreshPinnedCount : null);
        const createScheduledCardFn =
            (typeof window !== 'undefined' && typeof window.createScheduledCard === 'function')
                ? window.createScheduledCard
                : (typeof createScheduledCard === 'function' ? createScheduledCard : null);
        const generateScheduleCalendarFn =
            (typeof window !== 'undefined' && typeof window.generateScheduleCalendar === 'function')
                ? window.generateScheduleCalendar
                : (typeof generateScheduleCalendar === 'function' ? generateScheduleCalendar : null);

        // Clear existing pinned ideas to prevent duplicates
        const pinnedGrid = document.querySelector('.pinned-ideas .ideas-grid');
        if (pinnedGrid) {
            pinnedGrid.innerHTML = '';
        }
        
        // Clear existing scheduled ideas
        const scheduleList = document.querySelector('.schedule-list');
        if (scheduleList) {
            scheduleList.innerHTML = '';
        }
        
        // Import Supabase functions
        const { supabase } = await import('./supabase.js');
        
        // Load pinned ideas
        const { data: pinnedIdeas, error: pinnedError } = await supabase
            .from('ideas')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_pinned', true)
            .order('created_at', { ascending: false });
        
        if (pinnedError) {
            console.error('❌ Error loading pinned ideas:', pinnedError);
        } else if (pinnedIdeas && pinnedIdeas.length > 0) {
            console.log('✅ Loaded', pinnedIdeas.length, 'pinned ideas');
            if (!addPinnedIdeaFn) {
                console.warn('⚠️ addPinnedIdea helper not available; skipping pinned idea render.');
            } else {
                pinnedIdeas.forEach(idea => {
                    // Enforce single platform
                    const platforms = Array.isArray(idea.platforms) && idea.platforms.length > 0 ? [idea.platforms[0]] : ['tiktok'];
                    addPinnedIdeaFn({
                        id: idea.id,
                        title: idea.title,
                        summary: idea.summary,
                        action: idea.action,
                        setup: idea.setup,
                        hook: idea.hook,
                        story: idea.story,
                        why: idea.why,
                        platforms: platforms,
                        direction: idea.direction,
                        is_campaign: idea.is_campaign,
                        is_pinned: idea.is_pinned,
                        is_scheduled: idea.is_scheduled,
                        scheduledDate: idea.scheduled_date ? idea.scheduled_date.toString() : null
                    });
                });
            }
        } else {
            // Add empty state if no pinned ideas
            if (pinnedGrid) {
                pinnedGrid.innerHTML = '';
            }
        }
        
        refreshPinnedCountFn?.();
        
        // Load scheduled ideas
        const { data: scheduledIdeas, error: scheduledError } = await supabase
            .from('ideas')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_scheduled', true)
            .order('scheduled_date', { ascending: true });
        
        if (scheduledError) {
            console.error('❌ Error loading scheduled ideas:', scheduledError);
        } else if (scheduledIdeas && scheduledIdeas.length > 0) {
            console.log('✅ Loaded', scheduledIdeas.length, 'scheduled ideas');
            
            if (scheduleList) {
                if (!createScheduledCardFn) {
                    console.warn('⚠️ createScheduledCard helper not available; skipping scheduled idea render.');
                } else {
                    scheduledIdeas.forEach(idea => {
                        const selectedDate = new Date(idea.scheduled_date);
                        const month = selectedDate.toLocaleDateString('en-US', { month: 'short' });
                        const day = selectedDate.getDate();
                        
                        // Enforce single platform
                        const platforms = Array.isArray(idea.platforms) && idea.platforms.length > 0 ? [idea.platforms[0]] : ['tiktok'];
                        
                        const scheduledCard = createScheduledCardFn({
                            id: idea.id,
                            title: idea.title,
                            summary: idea.summary,
                            action: idea.action,
                            setup: idea.setup,
                            hook: idea.hook,
                            why: idea.why,
                            platforms: platforms,
                            scheduledDate: idea.scheduled_date,
                            scheduledMonth: month,
                            scheduledDay: day
                        });
                        
                        if (scheduledCard) {
                            scheduleList.appendChild(scheduledCard);
                        }
                    });
                }
            }
            
            generateScheduleCalendarFn?.();
        } else {
            // Add empty state if no scheduled ideas
            if (scheduleList) {
                scheduleList.innerHTML = '<div class="empty-state"><p>No scheduled ideas yet. Pin an idea and set a date!</p></div>';
            }
        }
        
    } catch (error) {
        console.error('❌ Error loading ideas from Supabase:', error);
    } finally {
        // Reset loading flag
        isLoadingIdeas = false;
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
        console.log('🔄 Starting sign out...');
        const result = await handleSignOut();
        
        console.log('📦 Sign out result:', result);
        
        // Always clear local storage and navigate, even if there's an error
        // (user might be offline, but we still want to sign them out locally)
        localStorage.clear();
        navigateTo('sign-in-page');
        
        // Only show error if there was a real problem
        if (result && !result.success && result.error) {
            console.warn('⚠️ Sign out had an error, but user is signed out locally:', result.error);
        } else {
            console.log('✅ Sign out completed successfully');
        }
    } catch (error) {
        console.error('❌ Sign out error:', error);
        // Still sign out locally even if there's an error
        localStorage.clear();
        navigateTo('sign-in-page');
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
        // Note: loadIdeasFromSupabase() is called by navigateTo('homepage'), no need to call it again here
        
    } catch (error) {
        console.error('Error initializing app:', error);
        navigateTo('sign-in-page');
    }
}

// completeOnboarding function is defined earlier in the file

// Initialize feedback character counter
document.addEventListener('DOMContentLoaded', async () => {
    updateFeedbackCharCount();
    
    // Initialize platform icon button click handlers for generator card
    const platformIconBtns = document.querySelectorAll('.platform-icon-btn');
    platformIconBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            btn.classList.toggle('selected');
            console.log('Platform toggled:', btn.dataset.platform, 'Selected:', btn.classList.contains('selected'));
        });
    });
    console.log('✅ Platform icon buttons initialized:', platformIconBtns.length);
    
    // Initialize header generate button
    const headerGenerateBtn = document.getElementById('header-generate-btn');
    const headerIdeaInput = document.getElementById('header-idea-input');
    
    if (headerGenerateBtn && headerIdeaInput) {
        // Click handler
        headerGenerateBtn.addEventListener('click', () => {
            const direction = headerIdeaInput.value.trim();
            if (direction) {
                console.log('🚀 Generating ideas from header input:', direction);
                generateNewIdeas({ 
                    customDirection: direction, 
                    showLoading: true 
                });
                // Clear input after generation starts
                headerIdeaInput.value = '';
            } else {
                // No input, generate random ideas
                console.log('🎲 Generating random ideas from header');
                generateNewIdeas({ showLoading: true });
            }
        });
        
        // Enter key handler
        headerIdeaInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                headerGenerateBtn.click();
            }
        });
        
        console.log('✅ Header generate button initialized');
    }
    
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
    
    // Only track page views if user is authenticated (to avoid RLS errors)
    const user = getUser();
    if (user) {
        const currentPage = document.querySelector('.page.active')?.id || 'sign-in-page';
        trackPageView(currentPage);
    }
});

// ============================================
// SUBSCRIPTION ENFORCEMENT
// ============================================

/**
 * Check subscription status and enforce hard paywall if trial expired
 */
async function checkAndEnforceSubscription() {
    const user = getUser();
    if (!user) return;
    
    const homePage = document.getElementById('homepage');
    if (!homePage || !homePage.classList.contains('active')) return;
    
    const trialExpired = await isTrialExpired(user.id);
    const hasSubscription = await hasActiveSubscription(user.id);
    
    if (trialExpired && !hasSubscription) {
        enforceSubscriptionPaywall();
    } else {
        removeSubscriptionPaywall();
    }
}

/**
 * Show unmovable subscription card and block all features
 */
function enforceSubscriptionPaywall() {
    const expiredCard = document.getElementById('subscription-expired-card');
    const generatorCard = document.getElementById('idea-generator-card');
    const pinnedSection = document.querySelector('.pinned-ideas');
    const scheduleSection = document.querySelector('.schedule-component');
    const ideaCards = document.querySelectorAll('.idea-card:not(.subscription-expired-card)');
    
    // Show expired card (unmovable)
    if (expiredCard) {
        expiredCard.classList.add('visible');
        expiredCard.style.display = 'flex';
    }
    
    // Hide generator card
    if (generatorCard) {
        generatorCard.classList.remove('visible');
        generatorCard.style.display = 'none';
    }
    
    // Hide all idea cards
    ideaCards.forEach(card => {
        card.style.display = 'none';
    });
    
    // Hide pinned and scheduled sections
    if (pinnedSection) pinnedSection.style.display = 'none';
    if (scheduleSection) scheduleSection.style.display = 'none';
    
    // Disable swipe functionality
    window.swipeHandlersDisabled = true;
}

/**
 * Remove subscription paywall and restore normal functionality
 */
function removeSubscriptionPaywall() {
    const expiredCard = document.getElementById('subscription-expired-card');
    const pinnedSection = document.querySelector('.pinned-ideas');
    const scheduleSection = document.querySelector('.schedule-component');
    const ideaCards = document.querySelectorAll('.idea-card:not(.subscription-expired-card)');
    
    // Hide expired card
    if (expiredCard) {
        expiredCard.classList.remove('visible');
        expiredCard.style.display = 'none';
    }
    
    // Show all idea cards again
    ideaCards.forEach(card => {
        card.style.display = '';  // Remove inline display:none
    });
    
    // Show pinned and scheduled sections
    if (pinnedSection) pinnedSection.style.display = 'block';
    if (scheduleSection) scheduleSection.style.display = 'block';
    
    // Re-enable swipe functionality
    window.swipeHandlersDisabled = false;
}

// Make functions globally accessible for onclick handlers
window.navigateTo = navigateTo;
window.completeOnboarding = completeOnboarding;
window.startFreeTrial = startFreeTrial;
// generateRandomIdeas and buildCustomIdeas already assigned to window where defined
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
// window.closeExpandedCard = closeExpandedCard; // TODO: Function not defined
// window.editIdeaCard = editIdeaCard; // TODO: Function not defined  
// window.saveIdeaCard = saveIdeaCard; // TODO: Function not defined
window.scheduleFromExpanded = scheduleFromExpanded;
window.checkAndEnforceSubscription = checkAndEnforceSubscription;

// ============================================
// DEBUG HELPERS
// ============================================

/**
 * Clear all pinned ideas from Supabase
 * Usage: Open browser console and type: clearAllPinnedIdeas()
 */
window.clearAllPinnedIdeas = async function() {
    try {
        const user = getUser();
        if (!user) {
            console.error('No user logged in');
            return;
        }
        
        const { supabase } = await import('./supabase.js');
        
        // Update all pinned ideas to unpinned
        const { data, error } = await supabase
            .from('ideas')
            .update({ is_pinned: false })
            .eq('user_id', user.id)
            .eq('is_pinned', true);
        
        if (error) {
            console.error('Error clearing pinned ideas:', error);
        } else {
            console.log('✅ All pinned ideas cleared!');
            
            // Clear the UI
            const pinnedGrid = document.querySelector('.pinned-ideas .ideas-grid');
            if (pinnedGrid) {
                pinnedGrid.innerHTML = '';
            }
            
            // Refresh count
            if (typeof window.refreshPinnedCount === 'function') {
                window.refreshPinnedCount();
            }
            
            console.log('🔄 Reload the page to see changes');
        }
    } catch (err) {
        console.error('Failed to clear pinned ideas:', err);
    }
}

/**
 * Delete all ideas from Supabase (use with caution!)
 * Usage: Open browser console and type: deleteAllMyIdeas()
 */
window.deleteAllMyIdeas = async function() {
    const confirmed = confirm('⚠️ WARNING: This will delete ALL your ideas permanently. Are you sure?');
    if (!confirmed) {
        console.log('Cancelled');
        return;
    }
    
    try {
        const user = getUser();
        if (!user) {
            console.error('No user logged in');
            return;
        }
        
        const { supabase } = await import('./supabase.js');
        
        const { data, error } = await supabase
            .from('ideas')
            .delete()
            .eq('user_id', user.id);
        
        if (error) {
            console.error('Error deleting ideas:', error);
        } else {
            console.log('✅ All ideas deleted!');
            
            // Clear the UI
            const pinnedGrid = document.querySelector('.pinned-ideas .ideas-grid');
            if (pinnedGrid) {
                pinnedGrid.innerHTML = '<div class="empty-state"><p>No pinned ideas yet. Start swiping!</p></div>';
            }
            
            const scheduleList = document.querySelector('.schedule-list');
            if (scheduleList) {
                scheduleList.innerHTML = '<div class="empty-state"><p>No scheduled content. Pin ideas and schedule them here!</p></div>';
            }
            
            // Update counts
            const pinnedCount = document.querySelector('.pinned-ideas .count');
            if (pinnedCount) {
                pinnedCount.textContent = '(0)';
            }
            
            console.log('🔄 Page will reload in 2 seconds...');
            setTimeout(() => location.reload(), 2000);
        }
    } catch (err) {
        console.error('Failed to delete ideas:', err);
    }
}

/**
 * EMERGENCY: Delete ONLY pinned ideas from database
 * Usage: deleteAllPinnedFromDB()
 */
window.deleteAllPinnedFromDB = async function() {
    try {
        const user = getUser();
        if (!user) {
            console.error('No user logged in');
            return;
        }
        
        const { supabase } = await import('./supabase.js');
        
        console.log('🔍 Finding all pinned ideas...');
        const { data: pinnedIdeas, error: fetchError } = await supabase
            .from('ideas')
            .select('id, title')
            .eq('user_id', user.id)
            .eq('is_pinned', true);
        
        if (fetchError) {
            console.error('Error fetching pinned ideas:', fetchError);
            return;
        }
        
        console.log(`Found ${pinnedIdeas.length} pinned ideas:`, pinnedIdeas);
        
        const { error: deleteError } = await supabase
            .from('ideas')
            .delete()
            .eq('user_id', user.id)
            .eq('is_pinned', true);
        
        if (deleteError) {
            console.error('Error deleting pinned ideas:', deleteError);
        } else {
            console.log(`✅ Deleted ${pinnedIdeas.length} pinned ideas from database!`);
            console.log('🔄 Reloading page...');
            setTimeout(() => location.reload(), 1000);
        }
    } catch (err) {
        console.error('Failed to delete pinned ideas:', err);
    }
}

// ============================================
// VIBE SELECTION & EXPANDABLE TEXTBOX
// ============================================

// Global state for selected vibes
let selectedVibes = [];

/**
 * Initialize vibe selector and expandable textbox
 */
function initVibeSelector() {
    const inputContainer = document.getElementById('header-input-container');
    const input = document.getElementById('header-idea-input');
    const vibePanel = document.getElementById('vibe-panel');
    const vibeChips = document.querySelectorAll('.vibe-chip');
    const selectedVibesDisplay = document.getElementById('selected-vibes-display');
    const heroHeader = document.getElementById('app-header');
    const homepageContent = document.getElementById('homepage-content');
    const trendStrip = document.getElementById('trend-strip-container');
    
    if (!inputContainer || !input || !vibePanel) return;
    
    // Expand panel on input focus/click - STAYS OPEN for multiple selections
    input.addEventListener('focus', () => {
        inputContainer.classList.add('expanded');
        
        // Move content down when expanded
        if (homepageContent) {
            homepageContent.classList.add('expanded'); // Use CSS class instead of inline style
        }
        // Trend strip is now part of homepage-content, so it moves automatically
        
        updateSelectedVibesDisplay();
    });
    
    // Panel STAYS OPEN - only close when clicking outside or pressing generate
    // Removed blur handler to allow multiple selections
    
    // Handle chip selection
    vibeChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const vibe = chip.dataset.vibe;
            const category = chip.dataset.category;
            
            // Toggle selection
            if (chip.classList.contains('selected')) {
                // Deselect
                chip.classList.remove('selected');
                selectedVibes = selectedVibes.filter(v => v.vibe !== vibe);
                
                // Visual spark feedback (removal)
                createSparkFeedback(chip, 'remove');
            } else {
                // Select
                chip.classList.add('selected');
                // Remove "+" prefix when storing the label
                const cleanLabel = chip.textContent.replace(/^\+\s*/, '');
                selectedVibes.push({ vibe, category, label: cleanLabel });
                
                // Visual spark feedback (add)
                createSparkFeedback(chip, 'add');
            }
            
            updateSelectedVibesDisplay();
            
            console.log('Selected vibes:', selectedVibes);
        });
    });
    
    // Close panel when clicking outside (but not on vibe chips)
    document.addEventListener('click', (e) => {
        if (!inputContainer.contains(e.target) && !e.target.closest('.vibe-chip')) {
            inputContainer.classList.remove('expanded');
            
            // Restore original positions
            if (homepageContent) {
                homepageContent.classList.remove('expanded'); // Remove expanded class to restore padding
            }
            // Trend strip is now part of homepage-content, so it moves automatically
        }
    });
    
    // Close panel and trigger generation when lightning bolt is clicked
    const generateBtn = document.getElementById('header-generate-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            inputContainer.classList.remove('expanded');
            
            // Restore original positions
            if (homepageContent) {
                homepageContent.classList.remove('expanded'); // Remove expanded class to restore padding
            }
            // Trend strip is now part of homepage-content, so it moves automatically
        });
    }
    
    console.log('✅ Vibe selector initialized');
}

/**
 * Create visual spark feedback when selecting/deselecting chips
 */
function createSparkFeedback(element, type) {
    const spark = document.createElement('div');
    spark.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        border-radius: inherit;
        pointer-events: none;
        z-index: 10;
        background: ${type === 'add' ? 'rgba(79, 209, 197, 0.4)' : 'rgba(0, 0, 0, 0.1)'};
        animation: sparkPulse 0.6s ease;
    `;
    
    element.style.position = 'relative';
    element.appendChild(spark);
    
    setTimeout(() => spark.remove(), 600);
}

/**
 * Update the selected vibes display in collapsed state
 */
function updateSelectedVibesDisplay() {
    const display = document.getElementById('selected-vibes-display');
    if (!display) return;
    
    display.innerHTML = '';
    
    if (selectedVibes.length === 0) return;
    
    // Show first 2-3 chips, then "+X" for the rest
    const maxVisible = 2;
    const visibleVibes = selectedVibes.slice(0, maxVisible);
    const remainingCount = selectedVibes.length - maxVisible;
    
    visibleVibes.forEach(vibe => {
        const miniChip = document.createElement('div');
        miniChip.className = 'selected-vibe-mini';
        miniChip.textContent = vibe.label;
        display.appendChild(miniChip);
    });
    
    if (remainingCount > 0) {
        const countBadge = document.createElement('div');
        countBadge.className = 'selected-vibe-count';
        countBadge.textContent = `+${remainingCount}`;
        display.appendChild(countBadge);
    }
}

/**
 * Get selected vibes for AI prompt
 */
window.getSelectedVibes = function() {
    return selectedVibes;
}

/**
 * Clear all selected vibes
 */
window.clearSelectedVibes = function() {
    selectedVibes = [];
    document.querySelectorAll('.vibe-chip.selected').forEach(chip => {
        chip.classList.remove('selected');
    });
    updateSelectedVibesDisplay();
}

// ============================================
// TREND FACTS STRIP
// ============================================

// Trend facts data - Platform-based (TikTok and YouTube) with balanced mix
const trendFacts = [
    // TikTok trends
    { platform: "tiktok", icon: "↑", text: "Voiceover Reels ↑ 18% this week" },
    { platform: "tiktok", icon: "🔥", text: "POV hooks trending ↑ 24%" },
    { platform: "tiktok", icon: "⚡", text: "Under 30 sec videos boost engagement" },
    { platform: "tiktok", icon: "🎯", text: "Jump cuts increase retention 32%" },
    { platform: "tiktok", icon: "✨", text: "Behind-the-scenes content ↑ 41%" },
    { platform: "tiktok", icon: "💡", text: "Story-driven hooks perform best" },
    { platform: "tiktok", icon: "🚀", text: "Tutorial formats ↑ 28% engagement" },
    { platform: "tiktok", icon: "⭐", text: "User-generated content 3x shares" },
    { platform: "tiktok", icon: "📱", text: "Vertical video dominates 2025" },
    { platform: "tiktok", icon: "🎬", text: "Day-in-the-life format ↑ 35%" },
    { platform: "tiktok", icon: "🔊", text: "Trending audio boosts reach 45%" },
    { platform: "tiktok", icon: "⏱️", text: "0-3 sec hooks = 3x retention" },
    { platform: "tiktok", icon: "🎭", text: "Relatable humor = highest shares" },
    // YouTube trends
    { platform: "youtube", icon: "📈", text: "3x weekly posts = 2x growth" },
    { platform: "youtube", icon: "🎨", text: "Bold text overlays ↑ 22% views" },
    { platform: "youtube", icon: "🌟", text: "Carousel posts get 1.4x more reach" },
    { platform: "youtube", icon: "📊", text: "Data storytelling ↑ 38% saves" },
    { platform: "youtube", icon: "💬", text: "Q&A content drives comments" },
    { platform: "youtube", icon: "🎥", text: "Long-form content ↑ 42% watch time" },
    { platform: "youtube", icon: "📊", text: "Thumbnail A/B testing ↑ 31% CTR" },
    { platform: "youtube", icon: "📺", text: "Series content builds 2.3x subscribers" },
    { platform: "youtube", icon: "🎯", text: "First 15 seconds critical for retention" },
    { platform: "youtube", icon: "💡", text: "Educational content ↑ 58% engagement" },
    { platform: "youtube", icon: "🔥", text: "Community posts boost visibility" },
    { platform: "youtube", icon: "⚡", text: "Shorts drive 3x channel growth" },
    { platform: "youtube", icon: "📱", text: "Mobile-first editing ↑ 27% views" }
];

/**
 * Initialize trend facts strip
 */
function initTrendStrip() {
    const stripContainer = document.getElementById('trend-strip');
    if (!stripContainer) return;
    
    // Create balanced mix of TikTok and YouTube trends (constant balance, not affected by platform switching)
    const tiktokFacts = trendFacts.filter(f => f.platform === 'tiktok');
    const youtubeFacts = trendFacts.filter(f => f.platform === 'youtube');
    
    // Interleave TikTok and YouTube trends for balanced mix
    const balancedFacts = [];
    const maxLength = Math.max(tiktokFacts.length, youtubeFacts.length);
    for (let i = 0; i < maxLength; i++) {
        if (i < tiktokFacts.length) balancedFacts.push(tiktokFacts[i]);
        if (i < youtubeFacts.length) balancedFacts.push(youtubeFacts[i]);
    }
    
    // Ensure at least 12 facts, duplicate for seamless infinite loop
    const allFacts = [...balancedFacts, ...balancedFacts, ...balancedFacts]; // Triple for smooth loop
    
    // Create chips
    allFacts.forEach(fact => {
        const chip = document.createElement('div');
        chip.className = 'trend-fact-chip';
        chip.innerHTML = `
            <span class="trend-fact-icon">${fact.icon || ''}</span>
            <span class="trend-fact-text">${fact.text}</span>
        `;
        stripContainer.appendChild(chip);
    });
    
    // Pause on hover (handled by CSS)
    let pauseTimeout;
    stripContainer.addEventListener('mouseenter', () => {
        clearTimeout(pauseTimeout);
    });
    
    stripContainer.addEventListener('mouseleave', () => {
        pauseTimeout = setTimeout(() => {
            // Resume scrolling
        }, 2000);
    });
    
    // Manual swipe support for mobile
    let startX = 0;
    let scrollLeft = 0;
    let isDragging = false;
    
    stripContainer.addEventListener('touchstart', (e) => {
        isDragging = true;
        startX = e.touches[0].pageX;
        stripContainer.style.animationPlayState = 'paused';
    });
    
    stripContainer.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const x = e.touches[0].pageX;
        const walk = (x - startX) * 2;
        stripContainer.scrollLeft = scrollLeft - walk;
    });
    
    stripContainer.addEventListener('touchend', () => {
        isDragging = false;
        setTimeout(() => {
            stripContainer.style.animationPlayState = 'running';
        }, 2000);
    });
    
    console.log('✅ Trend strip initialized with', trendFacts.length, 'unique facts (tripled for seamless loop)');
}

// ============================================
// WIRE VIBES INTO IDEA GENERATION
// ============================================

/**
 * Build AI prompt context from selected vibes
 */
function buildVibeContext() {
    if (selectedVibes.length === 0) return '';
    
    const toneVibes = selectedVibes.filter(v => v.category === 'tone').map(v => v.label);
    const contextVibes = selectedVibes.filter(v => v.category === 'context').map(v => v.label);
    const intentVibes = selectedVibes.filter(v => v.category === 'intent').map(v => v.label);
    
    let context = '\n\n**Content Style & Vibe:**\n';
    
    if (toneVibes.length > 0) {
        context += `- Tone/Emotion: ${toneVibes.join(', ')}\n`;
    }
    
    if (contextVibes.length > 0) {
        context += `- Context/Setting: ${contextVibes.join(', ')}\n`;
    }
    
    if (intentVibes.length > 0) {
        context += `- Intent/Format: ${intentVibes.join(', ')}\n`;
    }
    
    context += '\nGenerate ideas that specifically incorporate these vibes and styles.';
    
    return context;
}

// Expose for use in generation functions
window.buildVibeContext = buildVibeContext;

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================

// Add to existing DOMContentLoaded listener or create new one
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initVibeSelector();
        initTrendStrip();
        initPlatformSelector();
    });
} else {
    // DOM already loaded
    initVibeSelector();
    initTrendStrip();
    initPlatformSelector();
}

// ============================================
// PLATFORM SELECTOR ANIMATION
// ============================================

/**
 * Initialize platform selector with animation
 */
function initPlatformSelector() {
    // Get or initialize selected platform from localStorage
    let selectedPlatform = localStorage.getItem('selectedPlatform') || 'tiktok';
    
    // Set initial platform state
    setPlatformState(selectedPlatform);
    
    // Add click handlers to platform buttons
    const tiktokBtn = document.getElementById('platform-btn-tiktok');
    const youtubeBtn = document.getElementById('platform-btn-youtube');
    
    if (tiktokBtn) {
        tiktokBtn.addEventListener('click', () => {
            if (selectedPlatform !== 'tiktok') {
                selectedPlatform = 'tiktok';
                localStorage.setItem('selectedPlatform', selectedPlatform);
                setPlatformState(selectedPlatform);
            }
        });
    }
    
    if (youtubeBtn) {
        youtubeBtn.addEventListener('click', () => {
            if (selectedPlatform !== 'youtube') {
                selectedPlatform = 'youtube';
                localStorage.setItem('selectedPlatform', selectedPlatform);
                setPlatformState(selectedPlatform);
            }
        });
    }
}

/**
 * Set platform state and trigger distinctive animation sequence
 */
function setPlatformState(platform) {
    const homepage = document.getElementById('homepage');
    if (!homepage) return;
    
    const tiktokBtn = document.getElementById('platform-btn-tiktok');
    const youtubeBtn = document.getElementById('platform-btn-youtube');
    const platformGroup = document.querySelector('.platform-selector-group');
    const textboxContainer = document.getElementById('header-input-container');
    
    // Get the button that was just activated
    const activatingBtn = platform === 'tiktok' ? tiktokBtn : youtubeBtn;
    
    // 1. Tap feedback on hero icon - distinctive "I've been chosen" reaction
    if (activatingBtn) {
        activatingBtn.classList.add('activating');
        setTimeout(() => {
            activatingBtn.classList.remove('activating');
        }, 250);
    }
    
    // 2. Trigger color pulse/halo from the icon
    if (platformGroup) {
        platformGroup.classList.add('pulsing');
        setTimeout(() => {
            platformGroup.classList.remove('pulsing');
        }, 350);
    }
    
    // 3. Textbox icon swap animation
    if (textboxContainer) {
        textboxContainer.classList.add('swapping');
        setTimeout(() => {
            textboxContainer.classList.remove('swapping');
        }, 200);
    }
    
    // 4. Coordinated theme shift - remove old, add new platform class
    // This triggers CSS transitions for hero, swipe card, header, underlay
    homepage.classList.remove('platform--tiktok', 'platform--youtube');
    homepage.classList.add(`platform--${platform}`);
    
    // 5. Update platform button active states
    if (platform === 'tiktok') {
        tiktokBtn?.classList.add('active');
        youtubeBtn?.classList.remove('active');
    } else {
        youtubeBtn?.classList.add('active');
        tiktokBtn?.classList.remove('active');
    }
}

