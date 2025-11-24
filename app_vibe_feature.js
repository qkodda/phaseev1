
/**
 * Initialize vibe selector functionality
 */
function initVibeSelector() {
    const inputContainer = document.getElementById('header-input-container');
    const vibePanel = document.getElementById('vibe-panel');
    const headerInput = document.getElementById('header-idea-input');
    const selectedVibesDisplay = document.getElementById('selected-vibes-display');
    const vibeChips = document.querySelectorAll('.vibe-chip');
    const heroSection = document.querySelector('.hero-section');
    
    if (!inputContainer || !vibePanel || !headerInput || !heroSection) return;
    
    // Toggle expander when input is focused or container clicked
    const toggleExpand = (e) => {
        // Don't toggle if clicking a chip or close button
        if (e.target.closest('.vibe-chip') || e.target.closest('.close-vibe-panel')) return;
        
        const isExpanded = heroSection.classList.contains('expanded');
        
        if (!isExpanded) {
            heroSection.classList.add('expanded');
            inputContainer.classList.add('expanded');
            headerInput.focus();
        }
        // Only close if clicking outside (handled by document listener) or explicit close
    };
    
    headerInput.addEventListener('focus', toggleExpand);
    heroSection.addEventListener('click', toggleExpand);
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!heroSection.contains(e.target) && !e.target.closest('.vibe-chip')) {
            heroSection.classList.remove('expanded');
            inputContainer.classList.remove('expanded');
        }
    });
    
    // Handle chip selection
    vibeChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent closing panel
            const vibe = chip.dataset.vibe;
            const category = chip.dataset.category;
            const label = chip.textContent.replace('+ ', '');
            
            // Toggle selection
            if (chip.classList.contains('selected')) {
                chip.classList.remove('selected');
                removeVibe(vibe);
            } else {
                chip.classList.add('selected');
                addVibe(vibe, category, label);
            }
            
            updateVibeDisplay();
        });
    });
    
    function addVibe(vibe, category, label) {
        // Check if already exists
        if (!selectedVibes.find(v => v.vibe === vibe)) {
            selectedVibes.push({ vibe, category, label });
        }
    }
    
    function removeVibe(vibe) {
        selectedVibes = selectedVibes.filter(v => v.vibe !== vibe);
    }
    
    function updateVibeDisplay() {
        if (!selectedVibesDisplay) return;
        
        selectedVibesDisplay.innerHTML = '';
        
        if (selectedVibes.length > 0) {
            // Show count badge
            const countBadge = document.createElement('span');
            countBadge.className = 'selected-vibe-mini';
            countBadge.textContent = selectedVibes.length;
            selectedVibesDisplay.appendChild(countBadge);
        }
    }
}

let selectedVibes = [];

