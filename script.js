// Vehicle Testing Tracker - Main Script
// State Management
let vehicles = [];
let testedVehicles = [];
let deliveryTime = null;
let timerInterval = null;
let currentVehicle = null;

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
        // Tested through groups - check how many groups remain untested
        const vehicleGroups = vehicle.groups;
        const testedCount = vehicleGroups.filter(g => testedGroups.has(g)).length;
        const untestedCount = vehicleGroups.length - testedCount;

        if (untestedCount === 0) {
            // All groups are tested - fully grayed
            testedClass = 'fully-tested';
        } else if (untestedCount === 1) {
            // Only one group left untested - no grey out (still testable)
            testedClass = '';
        } else {
            // Multiple groups still untested - partially grayed
            testedClass = 'partial-tested';
        }
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
    testedBtn.textContent = isDirectlyTested ? 'Uncheck' : 'Tested';
    testedBtn.onclick = (e) => {
        e.stopPropagation();
        toggleVehicleTested(vehicle);
    };
    imageContainer.appendChild(testedBtn);

    // Wiki link button (if wiki URL exists)
    if (vehicle.wiki) {
        const wikiBtn = document.createElement('a');
        wikiBtn.className = 'btn-wiki';
        wikiBtn.href = vehicle.wiki;
        wikiBtn.target = '_blank';
        wikiBtn.onclick = (e) => {
            e.stopPropagation();
        };
        imageContainer.appendChild(wikiBtn);
    }

    card.appendChild(imageContainer);

    // Vehicle info section
    const info = document.createElement('div');
    info.className = 'vehicle-info';

    const name = document.createElement('div');
    name.className = 'vehicle-name';
    name.textContent = vehicle.name;
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

    // Tooltip on hover
    if (vehicle.tooltip) {
        card.addEventListener('mouseenter', (e) => showTooltip(e, vehicle.tooltip));
        card.addEventListener('mousemove', (e) => updateTooltipPosition(e));
        card.addEventListener('mouseleave', hideTooltip);
    }

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

    // Tooltip on hover
    if (vehicle.tooltip) {
        card.addEventListener('mouseenter', (e) => showTooltip(e, vehicle.tooltip));
        card.addEventListener('mousemove', (e) => updateTooltipPosition(e));
        card.addEventListener('mouseleave', hideTooltip);
    }

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
        return;
    }

    const now = Date.now();
    const elapsed = now - deliveryTime;
    const remaining = (24 * 60 * 60 * 1000) - elapsed; // 24 hours in milliseconds

    if (remaining <= 0) {
        timerValue.textContent = '00:00:00';
        timerValue.className = 'timer-value expired';
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
    saveStateToLocalStorage();
    updateTimerDisplay();
}

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

// Tooltip Functions
function showTooltip(event, text) {
    tooltip.textContent = text;
    tooltip.classList.add('visible');
    updateTooltipPosition(event);
}

function updateTooltipPosition(event) {
    const offset = 15;
    tooltip.style.left = (event.clientX + offset) + 'px';
    tooltip.style.top = (event.clientY + offset) + 'px';
}

function hideTooltip() {
    tooltip.classList.remove('visible');
}

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

function updateVehicleDetailModal(vehicle) {
    const isDirectlyTested = testedVehicles.includes(vehicle.id);
    const testedGroups = getTestedGroups();

    // Update image
    vehicleDetailImage.src = vehicle.image;
    vehicleDetailImage.alt = vehicle.name;

    // Update name
    vehicleDetailName.textContent = vehicle.name;

    // Update groups with grayed out styling for tested groups
    vehicleDetailGroups.innerHTML = '';
    vehicle.groups.forEach(group => {
        const badge = document.createElement('span');
        const isGroupTested = testedGroups.has(group);
        badge.className = `group-badge group-${group}${isGroupTested ? ' group-tested' : ''}`;
        badge.textContent = `Group ${group}`;
        vehicleDetailGroups.appendChild(badge);
    });

    // Update tooltip/description
    vehicleDetailTooltip.textContent = vehicle.tooltip || '';
    vehicleDetailTooltip.style.display = vehicle.tooltip ? 'block' : 'none';

    // Update tested button
    vehicleDetailTestedBtn.textContent = isDirectlyTested ? 'Uncheck' : 'Tested';
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

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideTipsModal();
            hideVehicleDetail();
            hideMapModal();
        }
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
