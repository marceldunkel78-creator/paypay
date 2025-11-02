// API Configuration
const API_BASE = 'http://localhost:3000/api';
let currentUser = null;
let authToken = null;
let userTimeBalance = 0;
let refreshInterval = null;
let householdTasks = []; // Cache für Hausarbeiten

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
});

// Auth Functions
function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginTab').classList.add('active');
    document.getElementById('registerTab').classList.remove('active');
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('registerTab').classList.add('active');
}

async function register(event) {
    event.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Registrierung erfolgreich! Sie können sich jetzt anmelden.', 'success');
            showLogin();
            // Reset the form properly
            document.getElementById('registerUsername').value = '';
            document.getElementById('registerPassword').value = '';
        } else {
            showMessage(data.message || 'Registrierung fehlgeschlagen', 'error');
        }
    } catch (error) {
        showMessage('Netzwerkfehler bei der Registrierung', 'error');
        console.error('Register error:', error);
    }
}

async function login(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            
            // Decode JWT token to get user info including role
            const tokenPayload = JSON.parse(atob(data.token.split('.')[1]));
            currentUser = { 
                username: tokenPayload.username, 
                role: tokenPayload.role,
                id: tokenPayload.id
            };
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showMessage('Anmeldung erfolgreich!', 'success');
            showMainApp();
            
            // Legacy function for compatibility
            // loadTimeAccounts();
        } else {
            showMessage(data.message || 'Anmeldung fehlgeschlagen', 'error');
        }
    } catch (error) {
        showMessage('Netzwerkfehler bei der Anmeldung', 'error');
        console.error('Login error:', error);
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    // Clear refresh interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    
    showAuthSection();
    showMessage('Sie wurden abgemeldet', 'info');
}

function checkAuthStatus() {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        showMainApp();
        loadTimeBalance();
        loadTimeEntries();
        // loadTimeAccounts(); // Legacy function - can be kept for compatibility
    } else {
        showAuthSection();
    }
}

function showAuthSection() {
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('userInfo').style.display = 'none';
}

function showMainApp() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('welcomeText').textContent = `Willkommen, ${currentUser.username}!`;
    
    // Für normale User: Zeiteinträge und Balance laden
    if (currentUser.role !== 'admin') {
        loadTimeBalance();
        loadTimeEntries();
        loadHouseholdTasks(); // Hausarbeiten für Dropdown laden
        initializeTimeEntryForm(); // Initialisiere das Zeiterfassungs-Formular
    }
    
    // Show admin section if user is admin
    if (currentUser.role === 'admin') {
        document.getElementById('adminSection').style.display = 'block';
        document.getElementById('timeEntrySection').style.display = 'none';
        document.getElementById('balanceSection').style.display = 'none';
        document.getElementById('timeEntriesSection').style.display = 'none';
        loadAdminStatistics();
        loadPendingEntries();
        loadAdminHouseholdTasks(); // Hausarbeiten für Admin laden
    } else {
        document.getElementById('adminSection').style.display = 'none';
        document.getElementById('timeEntrySection').style.display = 'block';
        document.getElementById('balanceSection').style.display = 'block';
        document.getElementById('timeEntriesSection').style.display = 'block';
    }
    
    // Set up auto-refresh every 30 seconds
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        if (currentUser.role === 'admin') {
            loadAdminStatistics();
            loadPendingEntries();
        } else {
            loadTimeBalance();
            loadTimeEntries();
        }
    }, 30000);
}

// Initialize time entry form with default states
function initializeTimeEntryForm() {
    // Set default entry type to productive
    const entryTypeSelect = document.getElementById('entryType');
    if (entryTypeSelect) {
        entryTypeSelect.value = 'productive';
    }
    
    // Initialize UI visibility
    toggleTimeEntryMode();
    updateTaskHoursDisplay();
}

// Household Tasks Functions
async function loadHouseholdTasks() {
    try {
        const response = await fetch(`${API_BASE}/household-tasks/active`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            }
        });
        
        if (response.ok) {
            householdTasks = await response.json();
            populateHouseholdTaskDropdown();
        } else {
            console.error('Failed to load household tasks');
        }
    } catch (error) {
        console.error('Error loading household tasks:', error);
    }
}

function populateHouseholdTaskDropdown() {
    const dropdown = document.getElementById('householdTask');
    if (!dropdown) return;
    
    // Clear existing options (except first placeholder)
    dropdown.innerHTML = '<option value="">-- Hausarbeit auswählen --</option>';
    
    // Add household tasks (already sorted alphabetically from API)
    householdTasks.forEach(task => {
        const option = document.createElement('option');
        option.value = task.id;
        option.textContent = `${task.name} (${task.hours}h)`;
        option.dataset.hours = task.hours;
        dropdown.appendChild(option);
    });
    
    // Add event listener for hours display
    dropdown.addEventListener('change', updateTaskHoursDisplay);
    
    // Add event listener for entry type changes
    const entryTypeDropdown = document.getElementById('entryType');
    if (entryTypeDropdown) {
        entryTypeDropdown.addEventListener('change', toggleTimeEntryMode);
    }
    
    // Add event listener for manual hours input
    const manualHoursInput = document.getElementById('manualHours');
    if (manualHoursInput) {
        manualHoursInput.addEventListener('input', updateTaskHoursDisplay);
    }
}

// Toggle between different time entry modes
function toggleTimeEntryMode() {
    const entryType = document.getElementById('entryType').value;
    const householdTaskGroup = document.getElementById('householdTaskGroup');
    const manualTimeGroup = document.getElementById('manualTimeGroup');
    const householdTaskSelect = document.getElementById('householdTask');
    
    if (entryType === 'screen_time') {
        // Bildschirmzeit: Manuelle Eingabe anzeigen, Hausarbeiten verstecken
        householdTaskGroup.style.display = 'none';
        manualTimeGroup.style.display = 'block';
        householdTaskSelect.required = false;
        householdTaskSelect.value = ''; // Clear selection
    } else {
        // Produktive Zeit: Hausarbeiten-Auswahl anzeigen, manuelle Eingabe verstecken
        householdTaskGroup.style.display = 'block';
        manualTimeGroup.style.display = 'none';
        householdTaskSelect.required = true;
        // Clear manual input
        const manualHoursInput = document.getElementById('manualHours');
        if (manualHoursInput) {
            manualHoursInput.value = '';
        }
    }
    updateTaskHoursDisplay();
}

function updateTaskHoursDisplay() {
    const entryType = document.getElementById('entryType').value;
    
    if (entryType === 'screen_time') {
        // Handle manual time input display for screen time
        const manualHours = document.getElementById('manualHours').value;
        const manualDisplay = document.querySelector('.manual-hours-display');
        if (manualDisplay) {
            if (manualHours && parseFloat(manualHours) > 0) {
                const hours = parseFloat(manualHours);
                manualDisplay.textContent = `Zeitwert: -${hours}h (negative Zeit)`;
                manualDisplay.style.color = '#ef4444';
            } else {
                manualDisplay.textContent = 'Zeitwert: wird als negative Zeit gerechnet';
                manualDisplay.style.color = '#666';
            }
        }
    } else {
        // Handle household task selection display for productive time
        const dropdown = document.getElementById('householdTask');
        const display = document.getElementById('taskHoursDisplay');
        
        if (!dropdown || !display) return;
        
        const selectedOption = dropdown.options[dropdown.selectedIndex];
        
        if (selectedOption.value === '') {
            display.textContent = 'Zeitwert wird angezeigt';
            display.style.color = '#666';
        } else {
            const hours = parseFloat(selectedOption.dataset.hours);
            display.textContent = `Zeitwert: +${hours}h`;
            display.style.color = '#10b981';
        }
    }
}

// New Time Entry Functions
async function createTimeEntry(event) {
    event.preventDefault();
    
    const entryType = document.getElementById('entryType').value;
    const description = document.getElementById('timeDescription').value;
    
    let taskId = null;
    let manualHours = null;
    
    // Validate input based on entry type
    if (entryType === 'productive') {
        // Productive time always requires a household task
        taskId = document.getElementById('householdTask').value;
        if (!taskId) {
            showMessage('Bitte wählen Sie eine Hausarbeit aus', 'error');
            return;
        }
    } else if (entryType === 'screen_time') {
        // Screen time uses manual input
        manualHours = parseFloat(document.getElementById('manualHours').value);
        if (!manualHours || manualHours <= 0) {
            showMessage('Bitte geben Sie eine gültige Stundenzahl ein', 'error');
            return;
        }
    }
    
    try {
        const requestBody = {
            entry_type: entryType,
            description: description
        };
        
        if (taskId) {
            requestBody.task_id = parseInt(taskId);
        } else if (manualHours) {
            requestBody.hours = -manualHours; // Negative for screen time
        }
        
        const response = await fetch(`${API_BASE}/timeentries`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Zeiterfassung erstellt und wartet auf Genehmigung!', 'success');
            // Reset form
            document.getElementById('householdTask').value = '';
            document.getElementById('timeDescription').value = '';
            document.getElementById('manualHours').value = '';
            document.getElementById('entryType').value = 'productive';
            toggleTimeEntryMode(); // Reset UI visibility
            updateTaskHoursDisplay(); // Update display after reset
            
            // Reload data
            loadTimeEntries();
            loadTimeBalance();
        } else {
            showMessage(data.error || 'Fehler beim Erstellen der Zeiterfassung', 'error');
        }
    } catch (error) {
        showMessage('Netzwerkfehler beim Erstellen der Zeiterfassung', 'error');
        console.error('Create time entry error:', error);
    }
}

async function loadTimeBalance() {
    try {
        const response = await fetch(`${API_BASE}/timeentries/balance`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            userTimeBalance = data.current_balance;
            updateBalanceDisplay();
        } else {
            console.error('Failed to load time balance');
        }
    } catch (error) {
        console.error('Error loading time balance:', error);
    }
}

async function loadTimeEntries() {
    try {
        const response = await fetch(`${API_BASE}/timeentries`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            }
        });
        
        if (response.ok) {
            const entries = await response.json();
            displayTimeEntries(entries);
        } else {
            console.error('Failed to load time entries');
        }
    } catch (error) {
        console.error('Error loading time entries:', error);
    }
}

function updateBalanceDisplay() {
    const balanceElement = document.getElementById('currentBalance');
    if (balanceElement) {
        balanceElement.textContent = userTimeBalance.toFixed(2);
        balanceElement.className = userTimeBalance >= 0 ? 'balance-positive' : 'balance-negative';
    }
}

function displayTimeEntries(entries) {
    const entriesContainer = document.getElementById('timeEntriesList');
    if (!entriesContainer) return;
    
    if (entries.length === 0) {
        entriesContainer.innerHTML = '<p>Noch keine Zeiteinträge vorhanden.</p>';
        return;
    }
    
    const entriesHTML = entries.map(entry => {
        const date = new Date(entry.created_at).toLocaleDateString('de-DE');
        const time = new Date(entry.created_at).toLocaleTimeString('de-DE');
        const typeLabel = entry.entry_type === 'productive' ? 'Produktive Zeit' : 'Bildschirmzeit';
        const hoursDisplay = entry.hours >= 0 ? `+${entry.hours}h` : `${entry.hours}h`;
        
        let statusClass = 'entry-pending';
        let statusLabel = 'Wartet auf Genehmigung';
        
        if (entry.status === 'approved') {
            statusClass = entry.hours >= 0 ? 'entry-positive' : 'entry-negative';
            statusLabel = 'Genehmigt';
        } else if (entry.status === 'rejected') {
            statusClass = 'entry-rejected';
            statusLabel = 'Abgelehnt';
        }
        
        return `
            <div class="time-entry ${statusClass}">
                <div class="entry-header">
                    <span class="entry-type">${typeLabel}</span>
                    <span class="entry-hours">${hoursDisplay}</span>
                    <span class="entry-status">${statusLabel}</span>
                    ${entry.status === 'pending' ? `<button onclick="deleteTimeEntry(${entry.id})" class="delete-btn">×</button>` : ''}
                </div>
                <div class="entry-details">
                    <p class="entry-description">${formatEntryDescription(entry)}</p>
                    <small class="entry-timestamp">${date} um ${time}</small>
                </div>
            </div>
        `;
    }).join('');
    
    entriesContainer.innerHTML = entriesHTML;
}

async function deleteTimeEntry(entryId) {
    if (!confirm('Möchten Sie diesen Zeiteintrag wirklich löschen?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/timeentries/${entryId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            }
        });
        
        if (response.ok) {
            showMessage('Zeiteintrag erfolgreich gelöscht!', 'success');
            loadTimeBalance();
            loadTimeEntries();
        } else {
            showMessage('Fehler beim Löschen des Zeiteintrags', 'error');
        }
    } catch (error) {
        showMessage('Netzwerkfehler beim Löschen', 'error');
        console.error('Delete time entry error:', error);
    }
}

// Admin Functions
async function loadAdminStatistics() {
    try {
        const response = await fetch(`${API_BASE}/timeentries/admin/statistics`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            }
        });
        
        if (response.ok) {
            const statistics = await response.json();
            displayAdminStatistics(statistics);
        } else {
            console.error('Failed to load admin statistics');
        }
    } catch (error) {
        console.error('Error loading admin statistics:', error);
    }
}

function displayAdminStatistics(statistics) {
    const statsContainer = document.getElementById('adminStatistics');
    if (!statsContainer) return;
    
    if (statistics.length === 0) {
        statsContainer.innerHTML = '<p>Keine Benutzerstatistiken verfügbar.</p>';
        return;
    }
    
    const statsHTML = statistics.map(stat => {
        const balanceClass = stat.current_balance >= 0 ? 'balance-positive' : 'balance-negative';
        const balanceDisplay = stat.current_balance >= 0 ? `+${stat.current_balance.toFixed(2)}h` : `${stat.current_balance.toFixed(2)}h`;
        
        return `
            <div class="user-stat-card" onclick="viewUserEntries(${stat.user_id}, '${stat.username}')">
                <div class="user-stat-header">
                    <h4>${stat.username}</h4>
                    <span class="user-balance ${balanceClass}">${balanceDisplay}</span>
                </div>
                <div class="user-stat-details">
                    <div class="stat-item">
                        <span class="stat-label">Einträge (7 Tage):</span>
                        <span class="stat-value">${stat.total_entries}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Wartend:</span>
                        <span class="stat-value pending">${stat.pending_entries}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Produktive Zeit:</span>
                        <span class="stat-value productive">+${stat.productive_hours.toFixed(2)}h</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Bildschirmzeit:</span>
                        <span class="stat-value screen-time">-${stat.screen_time_hours.toFixed(2)}h</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    statsContainer.innerHTML = statsHTML;
}

async function loadPendingEntries() {
    try {
        const response = await fetch(`${API_BASE}/timeentries/admin/pending`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            }
        });
        
        if (response.ok) {
            const entries = await response.json();
            displayPendingEntries(entries);
        } else {
            console.error('Failed to load pending entries');
        }
    } catch (error) {
        console.error('Error loading pending entries:', error);
    }
}

function displayPendingEntries(entries) {
    const pendingContainer = document.getElementById('pendingEntriesList');
    if (!pendingContainer) return;
    
    if (entries.length === 0) {
        pendingContainer.innerHTML = '<p>Keine wartenden Einträge vorhanden.</p>';
        return;
    }
    
    const entriesHTML = entries.map(entry => {
        const date = new Date(entry.created_at).toLocaleDateString('de-DE');
        const time = new Date(entry.created_at).toLocaleTimeString('de-DE');
        const typeLabel = entry.entry_type === 'productive' ? 'Produktive Zeit' : 'Bildschirmzeit';
        const hoursDisplay = entry.hours >= 0 ? `+${entry.hours}h` : `${entry.hours}h`;
        
        return `
            <div class="pending-entry">
                <div class="pending-header">
                    <span class="pending-user">${entry.username}</span>
                    <span class="pending-type">${typeLabel}</span>
                    <span class="pending-hours">${hoursDisplay}</span>
                </div>
                <div class="pending-details">
                    <p class="pending-description">${entry.description || 'Keine Beschreibung'}</p>
                    <small class="pending-timestamp">${date} um ${time}</small>
                </div>
                <div class="pending-actions">
                    <input type="number" id="hours-${entry.id}" value="${entry.hours}" step="0.25" class="hours-input">
                    <button onclick="approveEntry(${entry.id})" class="btn btn-success">✓ Genehmigen</button>
                    <button onclick="rejectEntry(${entry.id})" class="btn btn-danger">✗ Ablehnen</button>
                    <button onclick="updateEntry(${entry.id})" class="btn btn-warning">📝 Ändern</button>
                </div>
            </div>
        `;
    }).join('');
    
    pendingContainer.innerHTML = entriesHTML;
}

async function viewUserEntries(userId, username) {
    try {
        const response = await fetch(`${API_BASE}/timeentries?userId=${userId}&limit=50`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            }
        });
        
        if (response.ok) {
            const entries = await response.json();
            showUserEntriesModal(username, entries);
        } else {
            showMessage('Fehler beim Laden der Benutzereinträge', 'error');
        }
    } catch (error) {
        showMessage('Netzwerkfehler beim Laden der Benutzereinträge', 'error');
        console.error('Error loading user entries:', error);
    }
}

function showUserEntriesModal(username, entries) {
    // Create modal HTML
    const modalHTML = `
        <div id="userEntriesModal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Zeiteinträge von ${username}</h3>
                    <button onclick="closeUserEntriesModal()" class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <div id="modalEntriesList" class="modal-entries-list">
                        ${generateUserEntriesHTML(entries)}
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="closeUserEntriesModal()" class="btn btn-secondary">Schließen</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add event listener for outside click
    document.getElementById('userEntriesModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeUserEntriesModal();
        }
    });
}

function generateUserEntriesHTML(entries) {
    if (entries.length === 0) {
        return '<p class="no-entries">Keine Zeiteinträge vorhanden.</p>';
    }
    
    return entries.map(entry => {
        const date = new Date(entry.created_at).toLocaleDateString('de-DE');
        const time = new Date(entry.created_at).toLocaleTimeString('de-DE');
        const typeLabel = entry.entry_type === 'productive' ? 'Produktive Zeit' : 'Bildschirmzeit';
        const hoursDisplay = entry.hours >= 0 ? `+${entry.hours}h` : `${entry.hours}h`;
        
        let statusClass = 'entry-pending';
        let statusLabel = 'Wartet auf Genehmigung';
        let actionButtons = '';
        
        if (entry.status === 'approved') {
            statusClass = entry.hours >= 0 ? 'entry-positive' : 'entry-negative';
            statusLabel = 'Genehmigt';
            // Add delete button for approved entries
            actionButtons = `
                <div class="modal-entry-actions">
                    <button onclick="adminDeleteTimeEntry(${entry.id})" class="btn btn-danger">🗑️ Löschen</button>
                </div>
            `;
        } else if (entry.status === 'rejected') {
            statusClass = 'entry-rejected';
            statusLabel = 'Abgelehnt';
        } else if (entry.status === 'pending') {
            actionButtons = `
                <div class="modal-entry-actions">
                    <input type="number" id="modal-hours-${entry.id}" value="${entry.hours}" step="0.25" class="hours-input">
                    <button onclick="approveEntryFromModal(${entry.id})" class="btn btn-success">✓ Genehmigen</button>
                    <button onclick="rejectEntryFromModal(${entry.id})" class="btn btn-danger">✗ Ablehnen</button>
                    <button onclick="updateEntryFromModal(${entry.id})" class="btn btn-warning">📝 Ändern</button>
                </div>
            `;
        }
        
        return `
            <div class="modal-entry ${statusClass}">
                <div class="modal-entry-header">
                    <span class="modal-entry-type">${typeLabel}</span>
                    <span class="modal-entry-hours">${hoursDisplay}</span>
                    <span class="modal-entry-status">${statusLabel}</span>
                </div>
                <div class="modal-entry-details">
                    <p class="modal-entry-description">${formatEntryDescription(entry)}</p>
                    <small class="modal-entry-timestamp">${date} um ${time}</small>
                </div>
                ${actionButtons}
            </div>
        `;
    }).join('');
}

// Format entry description with household task details
function formatEntryDescription(entry) {
    let description = '';
    
    // Add household task name if available
    if (entry.task_name) {
        description = entry.task_name;
        
        // Add user description in parentheses if available
        if (entry.description && entry.description.trim()) {
            description += ` (${entry.description.trim()})`;
        }
    } else {
        // For manual entries or entries without task
        if (entry.description && entry.description.trim()) {
            description = entry.description.trim();
        } else {
            description = entry.entry_type === 'screen_time' ? 
                'Manuelle Bildschirmzeit-Eingabe' : 
                'Keine Beschreibung';
        }
    }
    
    return description;
}

function closeUserEntriesModal() {
    const modal = document.getElementById('userEntriesModal');
    if (modal) {
        modal.remove();
    }
}

async function approveEntryFromModal(entryId) {
    await approveEntry(entryId);
    // Refresh modal content
    const modal = document.getElementById('userEntriesModal');
    if (modal) {
        closeUserEntriesModal();
    }
}

async function rejectEntryFromModal(entryId) {
    await rejectEntry(entryId);
    // Refresh modal content
    const modal = document.getElementById('userEntriesModal');
    if (modal) {
        closeUserEntriesModal();
    }
}

async function updateEntryFromModal(entryId) {
    const hoursInput = document.getElementById(`modal-hours-${entryId}`);
    const newHours = parseFloat(hoursInput.value);
    
    if (isNaN(newHours)) {
        showMessage('Ungültige Stundenanzahl', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/timeentries/admin/update/${entryId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ hours: newHours })
        });
        
        if (response.ok) {
            showMessage('Zeiteintrag aktualisiert!', 'success');
            closeUserEntriesModal();
            loadAdminStatistics();
            loadPendingEntries();
        } else {
            showMessage('Fehler beim Aktualisieren', 'error');
        }
    } catch (error) {
        showMessage('Netzwerkfehler beim Aktualisieren', 'error');
        console.error('Error updating entry:', error);
    }
}

async function approveEntry(entryId) {
    try {
        const response = await fetch(`${API_BASE}/timeentries/admin/approve/${entryId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            }
        });
        
        if (response.ok) {
            showMessage('Zeiteintrag genehmigt!', 'success');
            loadPendingEntries();
            loadAdminStatistics();
        } else {
            showMessage('Fehler beim Genehmigen', 'error');
        }
    } catch (error) {
        showMessage('Netzwerkfehler beim Genehmigen', 'error');
        console.error('Error approving entry:', error);
    }
}

async function rejectEntry(entryId) {
    if (!confirm('Möchten Sie diesen Zeiteintrag wirklich ablehnen?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/timeentries/admin/reject/${entryId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            }
        });
        
        if (response.ok) {
            showMessage('Zeiteintrag abgelehnt!', 'success');
            loadPendingEntries();
            loadAdminStatistics();
        } else {
            showMessage('Fehler beim Ablehnen', 'error');
        }
    } catch (error) {
        showMessage('Netzwerkfehler beim Ablehnen', 'error');
        console.error('Error rejecting entry:', error);
    }
}

async function updateEntry(entryId) {
    const hoursInput = document.getElementById(`hours-${entryId}`);
    const newHours = parseFloat(hoursInput.value);
    
    if (isNaN(newHours)) {
        showMessage('Ungültige Stundenanzahl', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/timeentries/admin/update/${entryId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ hours: newHours })
        });
        
        if (response.ok) {
            showMessage('Zeiteintrag aktualisiert!', 'success');
            loadPendingEntries();
            loadAdminStatistics();
        } else {
            showMessage('Fehler beim Aktualisieren', 'error');
        }
    } catch (error) {
        showMessage('Netzwerkfehler beim Aktualisieren', 'error');
        console.error('Error updating entry:', error);
    }
}

async function cleanupOldEntries() {
    if (!confirm('Möchten Sie wirklich alle Einträge älter als 1 Woche löschen?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/timeentries/admin/cleanup`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            showMessage(`Bereinigung abgeschlossen: ${data.deletedEntries} Einträge gelöscht`, 'success');
            loadAdminStatistics();
        } else {
            showMessage('Fehler bei der Bereinigung', 'error');
        }
    } catch (error) {
        showMessage('Netzwerkfehler bei der Bereinigung', 'error');
        console.error('Cleanup error:', error);
    }
}

// Time Account Functions
async function createTimeAccount(event) {
    event.preventDefault();
    
    const hours = parseFloat(document.getElementById('hours').value);
    const description = document.getElementById('description').value;
    
    try {
        const response = await fetch(`${API_BASE}/timeaccounts/time-accounts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                // Note: You might need to add x-password header if password protection is enabled
                // 'x-password': 'your_app_password'
            },
            body: JSON.stringify({ 
                userId: 1, // This should be the actual user ID
                hours: hours,
                description: description 
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Zeiterfassung erfolgreich erstellt!', 'success');
            // Reset the form properly
            document.getElementById('hours').value = '';
            document.getElementById('description').value = '';
            loadTimeAccounts();
        } else {
            showMessage(data.message || 'Fehler beim Erstellen der Zeiterfassung', 'error');
        }
    } catch (error) {
        showMessage('Netzwerkfehler beim Erstellen der Zeiterfassung', 'error');
        console.error('Create time account error:', error);
    }
}

async function loadTimeAccounts() {
    try {
        const response = await fetch(`${API_BASE}/timeaccounts/time-accounts`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                // 'x-password': 'your_app_password'
            }
        });
        
        if (response.ok) {
            const timeAccounts = await response.json();
            displayTimeAccounts(timeAccounts);
        } else {
            showMessage('Fehler beim Laden der Zeiterfassungen', 'error');
        }
    } catch (error) {
        showMessage('Netzwerkfehler beim Laden der Zeiterfassungen', 'error');
        console.error('Load time accounts error:', error);
    }
}

function displayTimeAccounts(timeAccounts) {
    const container = document.getElementById('timeAccountsList');
    
    if (timeAccounts.length === 0) {
        container.innerHTML = '<p>Keine Zeiterfassungen vorhanden.</p>';
        return;
    }
    
    container.innerHTML = timeAccounts.map(account => `
        <div class="time-account-item">
            <h3>${account.hours} Stunden</h3>
            <p><strong>Datum:</strong> ${new Date(account.request_date).toLocaleDateString('de-DE')}</p>
            <p><strong>Status:</strong> <span class="status ${account.status}">${getStatusText(account.status)}</span></p>
            ${account.description ? `<p><strong>Beschreibung:</strong> ${account.description}</p>` : ''}
        </div>
    `).join('');
}

// Admin Functions
async function loadPendingRequests() {
    try {
        const response = await fetch(`${API_BASE}/admin/requests`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                // 'x-password': 'your_app_password'
            }
        });
        
        if (response.ok) {
            const requests = await response.json();
            displayPendingRequests(requests);
        } else {
            showMessage('Fehler beim Laden der Anfragen', 'error');
        }
    } catch (error) {
        showMessage('Netzwerkfehler beim Laden der Anfragen', 'error');
        console.error('Load pending requests error:', error);
    }
}

function displayPendingRequests(requests) {
    const container = document.getElementById('pendingRequestsList');
    
    if (requests.length === 0) {
        container.innerHTML = '<p>Keine wartenden Anfragen vorhanden.</p>';
        return;
    }
    
    container.innerHTML = requests.map(request => `
        <div class="request-item">
            <h3>Anfrage #${request.id}</h3>
            <p><strong>Benutzer:</strong> ${request.userEmail || request.username}</p>
            <p><strong>Stunden:</strong> ${request.hours}</p>
            <p><strong>Datum:</strong> ${new Date(request.request_date).toLocaleDateString('de-DE')}</p>
            <p><strong>Status:</strong> <span class="status ${request.status}">${getStatusText(request.status)}</span></p>
            <div class="request-actions">
                <button onclick="approveRequest(${request.id})" class="btn btn-success">Genehmigen</button>
                <button onclick="rejectRequest(${request.id})" class="btn btn-danger">Ablehnen</button>
            </div>
        </div>
    `).join('');
}

async function approveRequest(requestId) {
    try {
        const response = await fetch(`${API_BASE}/admin/approve/${requestId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                // 'x-password': 'your_app_password'
            }
        });
        
        if (response.ok) {
            showMessage('Anfrage erfolgreich genehmigt!', 'success');
            loadPendingRequests();
        } else {
            showMessage('Fehler beim Genehmigen der Anfrage', 'error');
        }
    } catch (error) {
        showMessage('Netzwerkfehler beim Genehmigen', 'error');
        console.error('Approve request error:', error);
    }
}

async function rejectRequest(requestId) {
    try {
        const response = await fetch(`${API_BASE}/admin/reject/${requestId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                // 'x-password': 'your_app_password'
            }
        });
        
        if (response.ok) {
            showMessage('Anfrage erfolgreich abgelehnt!', 'success');
            loadPendingRequests();
        } else {
            showMessage('Fehler beim Ablehnen der Anfrage', 'error');
        }
    } catch (error) {
        showMessage('Netzwerkfehler beim Ablehnen', 'error');
        console.error('Reject request error:', error);
    }
}

// Utility Functions
function getStatusText(status) {
    const statusMap = {
        'pending': 'Wartend',
        'approved': 'Genehmigt',
        'rejected': 'Abgelehnt'
    };
    return statusMap[status] || status;
}

function showMessage(message, type = 'info') {
    const messagesContainer = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    
    messagesContainer.appendChild(messageElement);
    
    // Auto-remove message after 5 seconds
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }, 5000);
}

// Password Change Functions
function showChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'block';
}

function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'none';
    // Clear form
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

async function changePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showMessage('Die neuen Passwörter stimmen nicht überein', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showMessage('Das neue Passwort muss mindestens 6 Zeichen lang sein', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ 
                currentPassword, 
                newPassword 
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Passwort erfolgreich geändert!', 'success');
            closeChangePasswordModal();
        } else {
            showMessage(data.message || 'Fehler beim Ändern des Passworts', 'error');
        }
    } catch (error) {
        showMessage('Netzwerkfehler beim Ändern des Passworts', 'error');
        console.error('Change password error:', error);
    }
}

// Admin Delete Function
async function adminDeleteTimeEntry(entryId) {
    if (!confirm('Sind Sie sicher, dass Sie diesen Zeiteintrag löschen möchten? Die Zeitbalance wird entsprechend aktualisiert.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/timeentries/admin/delete/${entryId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            showMessage('Zeiteintrag erfolgreich gelöscht!', 'success');
            // Refresh the modal if it's open
            const modal = document.getElementById('userEntriesModal');
            if (modal && modal.style.display !== 'none') {
                // Extract username from modal header
                const headerElement = modal.querySelector('.modal-header h3');
                if (headerElement) {
                    const headerText = headerElement.textContent;
                    const username = headerText.replace('Zeiteinträge von ', '');
                    // Reload entries for this user
                    await refreshUserEntriesModal(username);
                }
            }
            // Refresh admin statistics
            loadAdminStatistics();
        } else {
            const data = await response.json();
            showMessage(data.error || 'Fehler beim Löschen des Zeiteintrags', 'error');
        }
    } catch (error) {
        showMessage('Netzwerkfehler beim Löschen', 'error');
        console.error('Admin delete error:', error);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const changePasswordModal = document.getElementById('changePasswordModal');
    const userEntriesModal = document.getElementById('userEntriesModal');
    
    if (event.target === changePasswordModal) {
        closeChangePasswordModal();
    }
    if (event.target === userEntriesModal) {
        closeUserEntriesModal();
    }
}

// Refresh User Entries Modal
async function refreshUserEntriesModal(username) {
    try {
        // Find user in statistics to get their entries
        const response = await fetch(`${API_BASE}/timeentries/admin/statistics`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const statistics = await response.json();
            const user = statistics.find(stat => stat.username === username);
            
            if (user) {
                // Get user entries
                const entriesResponse = await fetch(`${API_BASE}/timeentries?userId=${user.user_id}&limit=50`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });
                
                if (entriesResponse.ok) {
                    const entries = await entriesResponse.json();
                    
                    // Update modal content
                    const modalEntriesList = document.getElementById('modalEntriesList');
                    if (modalEntriesList) {
                        modalEntriesList.innerHTML = generateUserEntriesHTML(entries);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error refreshing user entries modal:', error);
    }
}

// Hausarbeiten-Verwaltung Funktionen
function showHouseholdTasksManagement() {
    // Hausarbeiten-Sektion zeigen
    const householdTasksSection = document.getElementById('householdTasksManagement');
    if (householdTasksSection) {
        householdTasksSection.style.display = 'block';
        loadAdminHouseholdTasks();
    }
}

function hideHouseholdTasksManagement() {
    // Hausarbeiten-Sektion verstecken
    const householdTasksSection = document.getElementById('householdTasksManagement');
    if (householdTasksSection) {
        householdTasksSection.style.display = 'none';
    }
}

async function loadAdminHouseholdTasks() {
    try {
        const response = await fetch(`${API_BASE}/household-tasks/admin/all`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const tasks = await response.json();
            displayAdminHouseholdTasks(tasks);
        } else {
            console.error('Failed to load household tasks');
        }
    } catch (error) {
        console.error('Error loading household tasks:', error);
    }
}

function displayAdminHouseholdTasks(tasks) {
    const tasksList = document.getElementById('adminTasksList');
    if (!tasksList) return;
    
    if (tasks.length === 0) {
        tasksList.innerHTML = '<p class="no-tasks">Keine Hausarbeiten vorhanden</p>';
        return;
    }
    
    tasksList.innerHTML = tasks.map(task => `
        <div class="task-item">
            <div class="task-info">
                <h4>${task.name}</h4>
                <span class="task-hours">${task.hours} Stunden</span>
                <span class="task-status ${task.is_active ? 'active' : 'inactive'}">
                    ${task.is_active ? 'Aktiv' : 'Inaktiv'}
                </span>
            </div>
            <div class="task-actions">
                <button onclick="editHouseholdTask(${task.id})" class="btn-edit">Bearbeiten</button>
                <button onclick="toggleHouseholdTaskStatus(${task.id}, ${!task.is_active})" 
                        class="btn-toggle ${task.is_active ? 'deactivate' : 'activate'}">
                    ${task.is_active ? 'Deaktivieren' : 'Aktivieren'}
                </button>
                <button onclick="deleteHouseholdTask(${task.id})" class="btn-delete">Löschen</button>
            </div>
        </div>
    `).join('');
}

async function createHouseholdTask(event) {
    // Verhindere das normale Form-Submit
    if (event) {
        event.preventDefault();
    }
    
    const nameInput = document.getElementById('taskName');
    const hoursInput = document.getElementById('taskHours');
    
    const name = nameInput.value.trim();
    const hours = parseFloat(hoursInput.value);
    
    if (!name) {
        showMessage('Bitte geben Sie einen Namen für die Hausarbeit ein', 'error');
        return;
    }
    
    if (!hours || hours <= 0) {
        showMessage('Bitte geben Sie eine gültige Stundenzahl ein', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/household-tasks/admin/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ name, hours })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Hausarbeit erfolgreich erstellt!', 'success');
            nameInput.value = '';
            hoursInput.value = '';
            loadAdminHouseholdTasks();
            
            // Auch das User-Dropdown aktualisieren falls vorhanden
            if (currentUser.role !== 'admin') {
                loadHouseholdTasks();
            }
        } else {
            showMessage(data.message || 'Fehler beim Erstellen der Hausarbeit', 'error');
        }
    } catch (error) {
        console.error('Error creating household task:', error);
        showMessage('Fehler beim Erstellen der Hausarbeit', 'error');
    }
}

async function editHouseholdTask(taskId) {
    try {
        // Zuerst die aktuellen Daten der Hausarbeit laden
        const response = await fetch(`${API_BASE}/household-tasks/admin/${taskId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const task = await response.json();
            // Modal mit aktuellen Werten füllen
            document.getElementById('editTaskName').value = task.name;
            document.getElementById('editTaskHours').value = task.hours;
            document.getElementById('editTaskModal').dataset.taskId = taskId;
            showEditTaskModal();
        } else {
            showMessage('Fehler beim Laden der Hausarbeit', 'error');
        }
    } catch (error) {
        console.error('Error loading task for edit:', error);
        showMessage('Netzwerkfehler beim Laden der Hausarbeit', 'error');
    }
}

function showEditTaskModal() {
    document.getElementById('editTaskModal').style.display = 'block';
}

function closeEditTaskModal() {
    document.getElementById('editTaskModal').style.display = 'none';
}

async function saveEditedTask(event) {
    event.preventDefault();
    
    const taskId = document.getElementById('editTaskModal').dataset.taskId;
    const newName = document.getElementById('editTaskName').value.trim();
    const newHours = parseFloat(document.getElementById('editTaskHours').value);
    
    if (!newName) {
        showMessage('Bitte geben Sie einen Namen ein', 'error');
        return;
    }
    
    if (!newHours || newHours <= 0) {
        showMessage('Bitte geben Sie eine gültige Stundenzahl ein', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/household-tasks/admin/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ 
                name: newName, 
                hours: newHours 
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Hausarbeit erfolgreich aktualisiert!', 'success');
            closeEditTaskModal();
            loadAdminHouseholdTasks(); // Liste aktualisieren
        } else {
            showMessage(data.error || 'Fehler beim Aktualisieren der Hausarbeit', 'error');
        }
    } catch (error) {
        showMessage('Netzwerkfehler beim Aktualisieren der Hausarbeit', 'error');
        console.error('Update household task error:', error);
    }
}

async function toggleHouseholdTaskStatus(taskId, newStatus) {
    try {
        const response = await fetch(`${API_BASE}/household-tasks/admin/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ is_active: newStatus })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(`Hausarbeit erfolgreich ${newStatus ? 'aktiviert' : 'deaktiviert'}!`, 'success');
            loadAdminHouseholdTasks();
            
            // Auch das User-Dropdown aktualisieren falls vorhanden
            if (currentUser.role !== 'admin') {
                loadHouseholdTasks();
            }
        } else {
            showMessage(data.message || 'Fehler beim Ändern des Status', 'error');
        }
    } catch (error) {
        console.error('Error toggling household task status:', error);
        showMessage('Fehler beim Ändern des Status', 'error');
    }
}

async function deleteHouseholdTask(taskId) {
    if (!confirm('Sind Sie sicher, dass Sie diese Hausarbeit löschen möchten?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/household-tasks/admin/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Hausarbeit erfolgreich gelöscht!', 'success');
            loadAdminHouseholdTasks();
            
            // Auch das User-Dropdown aktualisieren falls vorhanden
            if (currentUser.role !== 'admin') {
                loadHouseholdTasks();
            }
        } else {
            showMessage(data.message || 'Fehler beim Löschen der Hausarbeit', 'error');
        }
    } catch (error) {
        console.error('Error deleting household task:', error);
        showMessage('Fehler beim Löschen der Hausarbeit', 'error');
    }
}