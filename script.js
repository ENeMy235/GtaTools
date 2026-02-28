// Vehicle Testing Tracker - Main Script
// State Management
let vehicles = [];
let testedVehicles = [];
let deliveryTime = null;
let timerInterval = null;
let currentVehicle = null;
let timerExpired = false; // Track if timer has expired to avoid duplicate resets

// DOM Elements
const vehicleGrid = document.getElementById('vehicleGrid');
const timerValue = document.getElementById('timerValue');
const markDeliveryBtn = document.getElementById('markDeliveryBtn');
const resetProgressBtn = document.getElementById('resetProgressBtn');
const tipsModal = document.getElementById('tipsModal');
const tooltip = document.getElementById('tooltip');
const vehicleModal = document.getElementById('vehicleModal');
const vehicleModalClose = document.getElementById('vehicleModalClose');
const vehicleDetailImage = document.getElementById('vehicleDetailImage');
const vehicleDetailName = document.getElementById('vehicleDetailName');
const vehicleDetailGroups = document.getElementById('vehicleDetailGroups');
const vehicleDetailTooltip = document.getElementById('vehicleDetailTooltip');
const vehicleDetailTestedBtn = document.getElementById('vehicleDetailTestedBtn');
const vehicleDetailWikiBtn = document.getElementById('vehicleDetailWikiBtn');
const mapImage = document.getElementById('mapImage');
const mapModal = document.getElementById('mapModal');
const mapModalClose = document.getElementById('mapModalClose');
const vehicleNavPrev = document.getElementById('vehicleNavPrev');
const vehicleNavNext = document.getElementById('vehicleNavNext');

// Swipe detection state
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;

// Initialize Application
async function init() {
    loadStateFromLocalStorage();
    await loadVehicles();
    renderVehicles();
    setupEventListeners();
    startTimer();
}

// Load vehicles from config.json
async function loadVehicles() {
    try {
        const response = await fetch('config.json');
        const data = await response.json();
        vehicles = data.vehicles || [];
    } catch (error) {
        console.error('Error loading vehicles:', error);
        vehicles = [];
        alert('Error loading vehicle configuration. Please check config.json');
    }
}

// Load state from localStorage
function loadStateFromLocalStorage() {
    const saved = localStorage.getItem('vehicleTestingState');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            testedVehicles = state.testedVehicles || state.exportedVehicles || [];
            deliveryTime = state.deliveryTime || null;
        } catch (error) {
            console.error('Error parsing saved state:', error);
            testedVehicles = [];
            deliveryTime = null;
        }
    }
}

// Save state to localStorage
function saveStateToLocalStorage() {
    const state = {
        testedVehicles: testedVehicles,
        deliveryTime: deliveryTime
    };
    localStorage.setItem('vehicleTestingState', JSON.stringify(state));
}

// Render all vehicles
function renderVehicles() {
    vehicleGrid.innerHTML = '';

    vehicles.forEach(vehicle => {
        const card = createVehicleCard(vehicle);
        vehicleGrid.appendChild(card);
    });
}

// Create a single vehicle card
function createVehicleCard(vehicle) {
    // Special handling for tips tile
    if (vehicle.isTipsTile) {
        return createTipsTileCard(vehicle);
    }

    const isDirectlyTested = testedVehicles.includes(vehicle.id);
    const isTested = isVehicleTested(vehicle.id);
    const testedGroups = getTestedGroups();

    // Determine gray-out level
    let testedClass = '';

    if (isDirectlyTested) {
        // Directly tested vehicles are always fully grayed
        testedClass = 'fully-tested';
    } else if (isTested) {
        // Tested through groups - check if ALL groups are tested
        const vehicleGroups = vehicle.groups;
        const allGroupsTested = vehicleGroups.every(g => testedGroups.has(g));

        if (allGroupsTested) {
            // All groups are tested - fully grayed
            testedClass = 'fully-tested';
        }
        // Otherwise no gray out - vehicle is still testable
    }

    const card = document.createElement('div');
    card.className = `vehicle-card ${testedClass}`;
    card.dataset.vehicleId = vehicle.id;

    // Image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'vehicle-image-container';

    const img = document.createElement('img');
    img.className = 'vehicle-image';
    img.src = vehicle.image;
    img.alt = vehicle.name;
    img.onclick = () => showVehicleDetail(vehicle);
    img.onerror = function () {
        this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23ddd" width="300" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
    };

    imageContainer.appendChild(img);

    // Tested badge (shown ONLY if vehicle is DIRECTLY tested)
    if (isDirectlyTested) {
        const testedBadge = document.createElement('div');
        testedBadge.className = 'tested-badge';
        testedBadge.textContent = 'TESTED';
        imageContainer.appendChild(testedBadge);
    }

    // Tested button (always visible for user to toggle)
    const testedBtn = document.createElement('button');
    testedBtn.className = `btn-tested ${isDirectlyTested ? 'tested' : ''}`;
    testedBtn.textContent = isDirectlyTested ? 'Uncheck' : 'Check';
    testedBtn.onclick = (e) => {
        e.stopPropagation();
        toggleVehicleTested(vehicle);
    };
    imageContainer.appendChild(testedBtn);

    card.appendChild(imageContainer);

    // Vehicle info section
    const info = document.createElement('div');
    info.className = 'vehicle-info';

    const name = document.createElement('div');
    name.className = 'vehicle-name';

    // Add brand if available
    if (vehicle.brand) {
        const brandSpan = document.createElement('span');
        brandSpan.className = 'vehicle-brand';
        brandSpan.textContent = vehicle.brand + ' ';
        name.appendChild(brandSpan);
    }

    const nameSpan = document.createElement('span');
    nameSpan.textContent = vehicle.name;
    name.appendChild(nameSpan);

    info.appendChild(name);

    // Group badges
    const groupsContainer = document.createElement('div');
    groupsContainer.className = 'vehicle-groups';

    vehicle.groups.forEach(group => {
        const badge = document.createElement('span');
        const isGroupTested = testedGroups.has(group);
        badge.className = `group-badge group-${group}${isGroupTested ? ' group-tested' : ''}`;
        badge.textContent = `Group ${group}`;
        groupsContainer.appendChild(badge);
    });

    info.appendChild(groupsContainer);
    card.appendChild(info);

    return card;
}

// Create a special tips tile card
function createTipsTileCard(vehicle) {
    const card = document.createElement('div');
    card.className = 'vehicle-card tips-tile';
    card.dataset.vehicleId = vehicle.id;

    // Image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'vehicle-image-container';

    const img = document.createElement('img');
    img.className = 'vehicle-image';
    img.src = vehicle.image;
    img.alt = vehicle.name;
    img.onclick = () => showTipsModal();
    img.onerror = function () {
        this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23667eea" width="300" height="200"/%3E%3Ctext fill="white" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E📍 TIPS%3C/text%3E%3C/svg%3E';
    };

    imageContainer.appendChild(img);
    card.appendChild(imageContainer);

    // Vehicle info section
    const info = document.createElement('div');
    info.className = 'vehicle-info';

    const name = document.createElement('div');
    name.className = 'vehicle-name';
    name.textContent = vehicle.name;
    info.appendChild(name);

    card.appendChild(info);

    // Click handler
    card.onclick = () => showTipsModal();

    return card;
}

// Check if a vehicle is tested (or belongs to tested groups)
function isVehicleTested(vehicleId) {
    // Direct test
    if (testedVehicles.includes(vehicleId)) {
        return true;
    }

    // Check if any group this vehicle belongs to has been tested
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return false;

    const testedGroups = getTestedGroups();
    return vehicle.groups.some(group => testedGroups.has(group));
}

// Get all groups that have been tested
function getTestedGroups() {
    const groups = new Set();

    testedVehicles.forEach(vehicleId => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
            vehicle.groups.forEach(group => groups.add(group));
        }
    });

    return groups;
}

// Toggle a vehicle's tested state
function toggleVehicleTested(vehicle) {
    const index = testedVehicles.indexOf(vehicle.id);

    if (index > -1) {
        // Remove from tested
        testedVehicles.splice(index, 1);
    } else {
        // Add to tested
        testedVehicles.push(vehicle.id);
    }

    saveStateToLocalStorage();
    renderVehicles();

    // Update modal if it's showing the current vehicle
    if (currentVehicle && currentVehicle.id === vehicle.id) {
        updateVehicleDetailModal(vehicle);
    }
}

// Mark a vehicle as tested (kept for backwards compatibility)
function markVehicleAsTested(vehicle) {
    if (testedVehicles.includes(vehicle.id)) {
        return; // Already tested
    }

    testedVehicles.push(vehicle.id);
    saveStateToLocalStorage();
    renderVehicles();
}

// Timer Functions
function startTimer() {
    // Clear any existing timer
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    updateTimerDisplay();
    timerInterval = setInterval(updateTimerDisplay, 1000);
}

function updateTimerDisplay() {
    if (!deliveryTime) {
        timerValue.textContent = '--:--:--';
        timerValue.className = 'timer-value';
        timerExpired = false; // Reset flag when no delivery time
        return;
    }

    const now = Date.now();
    const elapsed = now - deliveryTime;
    const remaining = (24 * 60 * 60 * 1000) - elapsed; // 24 hours in milliseconds

    if (remaining <= 0) {
        timerValue.textContent = '00:00:00';
        timerValue.className = 'timer-value expired';

        // Auto-reset progress and show notification (only once)
        if (!timerExpired) {
            timerExpired = true;
            autoResetProgress();
        }
        return;
    }

    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

    const timeString = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    timerValue.textContent = timeString;

    // Add warning class if less than 2 hours remaining
    if (remaining < 2 * 60 * 60 * 1000) {
        timerValue.className = 'timer-value warning';
    } else {
        timerValue.className = 'timer-value';
    }
}

function pad(num) {
    return num.toString().padStart(2, '0');
}

function markDelivery() {
    deliveryTime = Date.now();
    timerExpired = false; // Reset the expired flag for new timer
    saveStateToLocalStorage();
    updateTimerDisplay();
}

function autoResetProgress() {
    // Reset all progress
    testedVehicles = [];
    deliveryTime = null;
    localStorage.removeItem('vehicleTestingState');
    renderVehicles();
    updateTimerDisplay();

    // Show notification
    showNotification('Timer expired! Progress has been reset. You can begin your next search.');

    // Request browser notification permission if supported
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Simeon\'s Export Requests', {
            body: 'Timer expired! You can begin your next search.',
            icon: 'favicon.svg'
        });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('Simeon\'s Export Requests', {
                    body: 'Timer expired! You can begin your next search.',
                    icon: 'favicon.svg'
                });
            }
        });
    }
}

function showNotification(message) {
    // Create a custom notification element
    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    notification.textContent = message;
    document.body.appendChild(notification);

    // Show notification with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Hide and remove notification after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Testing function - Set timer to 20 seconds remaining
function testTimer20s() {
    const twentySecondsBeforeExpiry = Date.now() - (24 * 60 * 60 * 1000) + (20 * 1000);
    deliveryTime = twentySecondsBeforeExpiry;
    timerExpired = false;
    saveStateToLocalStorage();
    updateTimerDisplay();
    console.log('Timer set to 20 seconds remaining for testing');
}

// Make testTimer20s available globally for console access
window.testTimer20s = testTimer20s;

function resetProgress() {
    const confirmed = confirm('Are you sure you want to reset all progress? This cannot be undone.');
    if (confirmed) {
        testedVehicles = [];
        deliveryTime = null;
        localStorage.removeItem('vehicleTestingState');
        renderVehicles();
        updateTimerDisplay();
    }
}

// Tooltip Functions (removed - no longer used)

// Modal Functions
function showTipsModal() {
    tipsModal.classList.add('show');
}

function hideTipsModal() {
    tipsModal.classList.remove('show');
}

// Map Modal Functions
function showMapModal() {
    mapModal.classList.add('show');
}

function hideMapModal() {
    mapModal.classList.remove('show');
}

// Vehicle Detail Modal Functions
function showVehicleDetail(vehicle) {
    currentVehicle = vehicle;
    updateVehicleDetailModal(vehicle);
    vehicleModal.classList.add('show');
}

function hideVehicleDetail() {
    vehicleModal.classList.remove('show');
    currentVehicle = null;
}

// Get list of non-tips vehicles
function getNonTipsVehicles() {
    return vehicles.filter(v => !v.isTipsTile);
}

// Navigate to next vehicle
function showNextVehicle() {
    if (!currentVehicle) return;

    const nonTipsVehicles = getNonTipsVehicles();
    const currentIndex = nonTipsVehicles.findIndex(v => v.id === currentVehicle.id);

    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + 1) % nonTipsVehicles.length;
    const nextVehicle = nonTipsVehicles[nextIndex];

    showVehicleDetail(nextVehicle);
}

// Navigate to previous vehicle
function showPreviousVehicle() {
    if (!currentVehicle) return;

    const nonTipsVehicles = getNonTipsVehicles();
    const currentIndex = nonTipsVehicles.findIndex(v => v.id === currentVehicle.id);

    if (currentIndex === -1) return;

    const prevIndex = (currentIndex - 1 + nonTipsVehicles.length) % nonTipsVehicles.length;
    const prevVehicle = nonTipsVehicles[prevIndex];

    showVehicleDetail(prevVehicle);
}

// Handle swipe gestures
function handleTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}

function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
}

function handleSwipe() {
    const swipeThreshold = 50; // minimum distance for swipe
    const swipeRatioThreshold = 2; // ratio of horizontal to vertical movement

    const deltaX = touchEndX - touchStartX;
    const deltaY = Math.abs(touchEndY - touchStartY);

    // Check if horizontal swipe is dominant
    if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaX) > deltaY * swipeRatioThreshold) {
        if (deltaX > 0) {
            // Swipe right - show previous
            showPreviousVehicle();
        } else {
            // Swipe left - show next
            showNextVehicle();
        }
    }
}

function updateVehicleDetailModal(vehicle) {
    const isDirectlyTested = testedVehicles.includes(vehicle.id);
    const testedGroups = getTestedGroups();

    // Update image
    vehicleDetailImage.src = vehicle.image;
    vehicleDetailImage.alt = vehicle.name;

    // Update name with brand
    vehicleDetailName.innerHTML = '';
    if (vehicle.brand) {
        const brandSpan = document.createElement('span');
        brandSpan.className = 'vehicle-brand';
        brandSpan.textContent = vehicle.brand + ' ';
        vehicleDetailName.appendChild(brandSpan);
    }
    const nameSpan = document.createElement('span');
    nameSpan.textContent = vehicle.name;
    vehicleDetailName.appendChild(nameSpan);

    // Update groups with grayed out styling for tested groups
    vehicleDetailGroups.innerHTML = '';
    vehicle.groups.forEach(group => {
        const badge = document.createElement('span');
        const isGroupTested = testedGroups.has(group);
        badge.className = `group-badge group-${group}${isGroupTested ? ' group-tested' : ''}`;
        badge.textContent = `Group ${group}`;
        vehicleDetailGroups.appendChild(badge);
    });

    // Hide tooltip element (no longer used)
    vehicleDetailTooltip.style.display = 'none';

    // Update tested button
    vehicleDetailTestedBtn.textContent = isDirectlyTested ? 'Uncheck' : 'Check';
    vehicleDetailTestedBtn.className = `btn btn-success ${isDirectlyTested ? 'tested' : ''}`;
    vehicleDetailTestedBtn.onclick = () => {
        toggleVehicleTested(vehicle);
    };

    // Update wiki button
    if (vehicle.wiki) {
        vehicleDetailWikiBtn.href = vehicle.wiki;
        vehicleDetailWikiBtn.style.display = 'inline-flex';
    } else {
        vehicleDetailWikiBtn.style.display = 'none';
    }
}

// Event Listeners
function setupEventListeners() {
    markDeliveryBtn.addEventListener('click', markDelivery);
    resetProgressBtn.addEventListener('click', resetProgress);

    // Tips modal close handlers
    const tipsCloseBtn = tipsModal.querySelector('.close');
    tipsCloseBtn.addEventListener('click', hideTipsModal);

    tipsModal.addEventListener('click', (e) => {
        if (e.target === tipsModal) {
            hideTipsModal();
        }
    });

    // Map modal handlers
    mapImage.addEventListener('click', showMapModal);
    mapModalClose.addEventListener('click', hideMapModal);

    mapModal.addEventListener('click', (e) => {
        if (e.target === mapModal) {
            hideMapModal();
        }
    });

    // Vehicle detail modal close handlers
    vehicleModalClose.addEventListener('click', hideVehicleDetail);

    vehicleModal.addEventListener('click', (e) => {
        if (e.target === vehicleModal) {
            hideVehicleDetail();
        }
    });

    // Vehicle navigation arrows
    vehicleNavPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        showPreviousVehicle();
    });

    vehicleNavNext.addEventListener('click', (e) => {
        e.stopPropagation();
        showNextVehicle();
    });

    // Swipe detection for vehicle modal
    const vehicleDetailContent = document.querySelector('.vehicle-detail-content');
    if (vehicleDetailContent) {
        vehicleDetailContent.addEventListener('touchstart', handleTouchStart, { passive: true });
        vehicleDetailContent.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideTipsModal();
            hideVehicleDetail();
            hideMapModal();
        }

        // Testing shortcut: Ctrl+Shift+T to set timer to 20s remaining
        if (e.ctrlKey && e.shiftKey && e.key === 'T') {
            e.preventDefault();
            testTimer20s();
            showNotification('Testing mode: Timer set to 20 seconds remaining');
        }

        // Arrow keys for vehicle navigation when modal is open
        if (vehicleModal.classList.contains('show')) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                showPreviousVehicle();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                showNextVehicle();
            }
        }
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
