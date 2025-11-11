// API Configuration - Dynamic base URL to work from any device
const API_BASE = `http://${window.location.hostname}:3000/api`;
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
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Registrierung erfolgreich! Ihre Registrierung wartet auf Admin-Genehmigung. Sie erhalten eine Benachrichtigung, sobald Ihr Account freigeschaltet wurde.', 'success');
            showLogin();
            // Reset the form properly
            document.getElementById('registerUsername').value = '';
            document.getElementById('registerEmail').value = '';
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
        
        // Nur für normale User, nicht für Admins
        if (currentUser.role !== 'admin') {
            loadTransferHistory();
        }
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
        // Transfer-Historie nur für normale User laden
        if (currentUser.role !== 'admin') {
            loadTransferHistory();
        }
        loadHouseholdTasks(); // Hausarbeiten für Dropdown laden
        initializeTimeEntryForm(); // Initialisiere das Zeiterfassungs-Formular
    }
    
    // Show admin section if user is admin
    if (currentUser.role === 'admin') {
        document.getElementById('adminSection').style.display = 'block';
        document.getElementById('timeEntrySection').style.display = 'none';
        document.getElementById('balanceSection').style.display = 'none';
        document.getElementById('timeEntriesSection').style.display = 'none';
        document.getElementById('userTransferSection').style.display = 'none'; // Ausblenden für Admins
        loadAdminStatistics();
        loadPendingEntries();
        loadAdminHouseholdTasks(); // Hausarbeiten für Admin laden
    } else {
        document.getElementById('adminSection').style.display = 'none';
        document.getElementById('timeEntrySection').style.display = 'block';
        document.getElementById('balanceSection').style.display = 'block';
        document.getElementById('timeEntriesSection').style.display = 'block';
        document.getElementById('userTransferSection').style.display = 'block';
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
            // Transfer-Historie nur für normale User laden
            if (currentUser.role !== 'admin') {
                loadTransferHistory();
            }
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
    
    // Add household tasks with weight factor information
    householdTasks.forEach(task => {
        const option = document.createElement('option');
        option.value = task.id;
        const taskMinutes = Math.round(task.hours * 60);
        option.textContent = `${task.name} (${taskMinutes} min, Faktor ${task.weight_factor})`;
        option.dataset.hours = task.hours; // Keep hours for backend calculations
        option.dataset.minutes = taskMinutes; // Add minutes for display
        option.dataset.weightFactor = task.weight_factor;
        option.dataset.description = task.description || '';
        dropdown.appendChild(option);
    });
    
    // Add event listeners
    dropdown.addEventListener('change', updateTaskDisplay);
    
    const entryTypeDropdown = document.getElementById('entryType');
    if (entryTypeDropdown) {
        entryTypeDropdown.addEventListener('change', toggleTimeEntryMode);
    }
    
    const manualHoursInput = document.getElementById('manualHours');
    if (manualHoursInput) {
        manualHoursInput.addEventListener('input', updateTaskDisplay);
    }
    
    const inputMinutesInput = document.getElementById('inputMinutes');
    if (inputMinutesInput) {
        inputMinutesInput.addEventListener('input', updateCalculationDisplay);
    }
}

// Toggle between different time entry modes
function toggleTimeEntryMode() {
    const entryType = document.getElementById('entryType').value;
    const householdTaskGroup = document.getElementById('householdTaskGroup');
    const productiveTimeGroup = document.getElementById('productiveTimeGroup');
    const manualTimeGroup = document.getElementById('manualTimeGroup');
    const householdTaskSelect = document.getElementById('householdTask');
    
    if (entryType === 'screen_time') {
        // Bildschirmzeit: Manuelle Eingabe anzeigen, Hausarbeiten verstecken
        householdTaskGroup.style.display = 'none';
        productiveTimeGroup.style.display = 'none';
        manualTimeGroup.style.display = 'block';
        householdTaskSelect.required = false;
        householdTaskSelect.value = ''; // Clear selection
        
        // Clear productive time inputs
        const inputMinutes = document.getElementById('inputMinutes');
        if (inputMinutes) inputMinutes.value = '';
    } else {
        // Produktive Zeit: Hausarbeiten-Auswahl und Minuteneingabe anzeigen
        householdTaskGroup.style.display = 'block';
        productiveTimeGroup.style.display = 'block';
        manualTimeGroup.style.display = 'none';
        householdTaskSelect.required = true;
        
        // Clear manual input
        const manualHoursInput = document.getElementById('manualHours');
        if (manualHoursInput) manualHoursInput.value = '';
    }
    updateTaskDisplay();
}

// Updated function with new naming
function updateTaskDisplay() {
    const entryType = document.getElementById('entryType').value;
    
    if (entryType === 'screen_time') {
        // Handle manual time input display for screen time
        const manualMinutes = document.getElementById('manualHours').value; // Jetzt Minuten-Eingabe
        const manualDisplay = document.querySelector('.manual-hours-display');
        if (manualDisplay) {
            if (manualMinutes && parseFloat(manualMinutes) > 0) {
                const minutes = parseFloat(manualMinutes);
                manualDisplay.textContent = `Zeitwert: -${minutes} min (negative Zeit)`;
                manualDisplay.style.color = '#ef4444';
            } else {
                manualDisplay.textContent = 'Zeitwert: wird als negative Zeit gerechnet';
                manualDisplay.style.color = '#666';
            }
        }
    } else {
        // Handle household task selection display for productive time
        const dropdown = document.getElementById('householdTask');
        const display = document.getElementById('taskInfoDisplay');
        
        if (!dropdown || !display) return;
        
        const selectedOption = dropdown.options[dropdown.selectedIndex];
        
        if (selectedOption.value === '') {
            display.textContent = 'Wählen Sie eine Hausarbeit aus';
            display.style.color = '#666';
            // Clear inputMinutes when no task is selected
            const inputMinutes = document.getElementById('inputMinutes');
            if (inputMinutes) {
                inputMinutes.value = '';
            }
        } else {
            const hours = parseFloat(selectedOption.dataset.hours);
            const minutes = parseInt(selectedOption.dataset.minutes || Math.round(hours * 60));
            const weightFactor = parseFloat(selectedOption.dataset.weightFactor);
            const description = selectedOption.dataset.description;
            
            display.innerHTML = `
                <strong>Referenz:</strong> ${minutes} min | <strong>Faktor:</strong> ${weightFactor}<br>
                <em>${description}</em>
            `;
            display.style.color = '#10b981';
            
            // Auto-fill inputMinutes with reference time converted to minutes
            const inputMinutes = document.getElementById('inputMinutes');
            if (inputMinutes && hours > 0) {
                const referenceMinutes = Math.round(hours * 60);
                inputMinutes.value = referenceMinutes;
                
                // Trigger calculation display update to show the new values
                updateCalculationDisplay();
            }
        }
        
        // Update calculation display
        updateCalculationDisplay();
    }
}

// New function to update calculation display
function updateCalculationDisplay() {
    const entryType = document.getElementById('entryType').value;
    if (entryType !== 'productive') return;
    
    const dropdown = document.getElementById('householdTask');
    const inputMinutes = document.getElementById('inputMinutes');
    const calculationDisplay = document.getElementById('calculationDisplay');
    
    if (!dropdown || !inputMinutes || !calculationDisplay) return;
    
    const selectedOption = dropdown.options[dropdown.selectedIndex];
    const minutes = parseInt(inputMinutes.value);
    
    if (!selectedOption.value || !minutes || minutes <= 0) {
        calculationDisplay.textContent = 'Gutschrift wird berechnet';
        calculationDisplay.style.color = '#666';
        return;
    }
    
    const weightFactor = parseFloat(selectedOption.dataset.weightFactor);
    const calculatedMinutes = Math.round(minutes * weightFactor);
    const calculatedHours = (calculatedMinutes / 60).toFixed(2);
    
    calculationDisplay.innerHTML = `
        <strong>${minutes} min × ${weightFactor} = ${calculatedMinutes} min (+${calculatedHours}h)</strong>
    `;
    calculationDisplay.style.color = '#10b981';
}

// Legacy function for backward compatibility
function updateTaskHoursDisplay() {
    updateTaskDisplay();
}

// New Time Entry Functions with Weight Factor Support
async function createTimeEntry(event) {
    event.preventDefault();
    
    const entryType = document.getElementById('entryType').value;
    const description = document.getElementById('timeDescription').value;
    
    let taskId = null;
    let inputMinutes = null;
    let manualHours = null;
    
    // Validate input based on entry type
    if (entryType === 'productive') {
        // Productive time requires household task and minutes input
        taskId = document.getElementById('householdTask').value;
        inputMinutes = parseInt(document.getElementById('inputMinutes').value);
        
        if (!taskId) {
            showMessage('Bitte wählen Sie eine Hausarbeit aus', 'error');
            return;
        }
        
        if (!inputMinutes || inputMinutes <= 0) {
            showMessage('Bitte geben Sie die tatsächlich gearbeiteten Minuten ein', 'error');
            return;
        }
    } else if (entryType === 'screen_time') {
        // Screen time uses manual input (jetzt in Minuten)
        const manualMinutes = parseFloat(document.getElementById('manualHours').value);
        if (!manualMinutes || manualMinutes <= 0) {
            showMessage('Bitte geben Sie eine gültige Minutenzahl ein', 'error');
            return;
        }
        manualHours = manualMinutes / 60; // Konvertiere zu Stunden für Backend
    }
    
    try {
        const requestBody = {
            entry_type: entryType,
            description: description
        };
        
        if (taskId && inputMinutes) {
            requestBody.task_id = parseInt(taskId);
            requestBody.input_minutes = inputMinutes;
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
            document.getElementById('inputMinutes').value = '';
            document.getElementById('timeDescription').value = '';
            document.getElementById('manualHours').value = '';
            document.getElementById('entryType').value = 'productive';
            toggleTimeEntryMode(); // Reset UI visibility
            updateTaskDisplay(); // Update display after reset
            
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
        // Verwende die neue timeaccount API für konsistente Balance-Werte
        const response = await fetch(`${API_BASE}/timeaccount/balance`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            userTimeBalance = data.balance; // Neue API verwendet 'balance' statt 'current_balance'
            updateBalanceDisplay();
        } else {
            // Fallback zur alten API falls neue nicht funktioniert
            console.warn('New balance API failed, trying fallback...');
            const fallbackResponse = await fetch(`${API_BASE}/timeentries/balance`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                }
            });
            
            if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                userTimeBalance = fallbackData.current_balance;
                updateBalanceDisplay();
            } else {
                console.error('Both balance APIs failed');
            }
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
        const balanceInMinutes = Math.round(userTimeBalance * 60); // Konvertiere zu Minuten
        balanceElement.textContent = `${balanceInMinutes} min`;
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
        const minutesDisplay = Math.round(entry.hours * 60); // Konvertiere zu Minuten
        const hoursDisplay = entry.hours >= 0 ? `+${minutesDisplay} min` : `${minutesDisplay} min`;
        
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

// Hilfsfunktion zum Formatieren von Stunden zu "h:min"
function formatHoursToHourMin(hours) {
    if (hours === 0) return '0:00';
    
    const isNegative = hours < 0;
    const absHours = Math.abs(hours);
    const fullHours = Math.floor(absHours);
    const minutes = Math.round((absHours - fullHours) * 60);
    
    // Handle case where rounding minutes results in 60
    if (minutes === 60) {
        return `${isNegative ? '-' : ''}${fullHours + 1}:00`;
    }
    
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${isNegative ? '-' : ''}${fullHours}:${formattedMinutes}`;
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
        const balanceFormatted = formatHoursToHourMin(stat.current_balance);
        const balanceDisplay = stat.current_balance >= 0 ? `+${balanceFormatted}` : balanceFormatted;
        
        return `
            <div class="user-stat-card">
                <div class="user-stat-header">
                    <h4 onclick="viewUserEntries(${stat.user_id}, '${stat.username}')" style="cursor: pointer;">${stat.username}</h4>
                    <div class="balance-controls">
                        <span class="user-balance ${balanceClass}">${balanceDisplay}</span>
                        <button data-user-id="${stat.user_id}" data-username="${stat.username}" data-balance="${stat.current_balance}" class="btn-adjust-balance" title="Zeitkonto anpassen">⚖️</button>
                    </div>
                </div>
                <div class="user-stat-details" onclick="viewUserEntries(${stat.user_id}, '${stat.username}')" style="cursor: pointer;">
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
                        <span class="stat-value productive">+${formatHoursToHourMin(stat.productive_hours)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Bildschirmzeit:</span>
                        <span class="stat-value screen-time">-${formatHoursToHourMin(stat.screen_time_hours)}</span>
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
        
        // Alle Einträge in Minuten anzeigen
        const minutes = Math.round(entry.hours * 60);
        const timeDisplay = entry.hours >= 0 ? `+${minutes} min` : `${minutes} min`;
        
        return `
            <div class="pending-entry">
                <div class="pending-header">
                    <span class="pending-user">${entry.username}</span>
                    <span class="pending-type">${typeLabel}</span>
                    <span class="pending-hours">${timeDisplay}</span>
                </div>
                <div class="pending-details">
                    <p class="pending-description">${formatEntryDescription(entry)}</p>
                    <small class="pending-timestamp">${date} um ${time}</small>
                </div>
                <div class="pending-actions">
                    <input type="number" id="minutes-${entry.id}" value="${minutes}" step="1" class="minutes-input" placeholder="Minuten"> min
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
        const minutes = Math.round(entry.hours * 60);
        const hoursDisplay = entry.hours >= 0 ? `+${minutes} min` : `${minutes} min`;
        
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
            const inputMinutes = Math.round(entry.hours * 60);
            actionButtons = `
                <div class="modal-entry-actions">
                    <input type="number" id="modal-hours-${entry.id}" value="${inputMinutes}" step="1" class="hours-input" title="Minuten">
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

// Format entry description with household task details and weight factor info
function formatEntryDescription(entry) {
    let description = '';
    
    // Add household task name if available
    if (entry.task_name) {
        description = entry.task_name;
        
        // Add weight factor calculation if available
        if (entry.input_minutes && entry.calculated_hours) {
            const calculatedHours = parseFloat(entry.calculated_hours).toFixed(2);
            description += ` (${entry.input_minutes} min → +${calculatedHours}h)`;
        }
        
        // Add user description if available
        if (entry.description && entry.description.trim()) {
            description += ` - ${entry.description.trim()}`;
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
    const minutesInput = document.getElementById(`modal-hours-${entryId}`);
    const newMinutes = parseInt(minutesInput.value);
    
    if (isNaN(newMinutes)) {
        showMessage('Ungültige Minutenanzahl', 'error');
        return;
    }
    
    const newHours = newMinutes / 60; // Convert minutes to hours for backend
    
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
    const minutesInput = document.getElementById(`minutes-${entryId}`);
    
    if (!minutesInput) {
        showMessage('Eingabefeld nicht gefunden', 'error');
        return;
    }
    
    const newMinutes = parseInt(minutesInput.value);
    if (isNaN(newMinutes)) {
        showMessage('Ungültige Minutenanzahl', 'error');
        return;
    }
    
    // Convert minutes to hours for backend
    const newHours = newMinutes / 60;
    const requestBody = { hours: newHours };
    
    try {
        const response = await fetch(`${API_BASE}/timeentries/admin/update/${entryId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify(requestBody)
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

function cleanupOldEntries() {
    showConfirmModal(
        'Alte Zeiteinträge bereinigen',
        'Möchten Sie wirklich alle Zeiteinträge älter als 1 Woche löschen?\n\nDiese Einträge werden permanent entfernt, aber die Zeitbalance der Benutzer bleibt unverändert.',
        async () => {
            await performCleanupOldEntries();
        },
        false,
        'cleanup'
    );
}

async function performCleanupOldEntries() {
    try {
        const response = await fetch(`${API_BASE}/timeentries/admin/cleanup`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            showMessage(`Bereinigung abgeschlossen: ${data.deletedEntries} Einträge gelöscht (Zeitkontostände unverändert)`, 'success');
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
function adminDeleteTimeEntry(entryId) {
    showConfirmModal(
        'Zeiteintrag löschen',
        'Sind Sie sicher, dass Sie diesen Zeiteintrag löschen möchten?\nDie Zeitbalance wird entsprechend aktualisiert.',
        async () => {
            await performDeleteTimeEntry(entryId);
        }
    );
}

// Actual delete function
async function performDeleteTimeEntry(entryId) {
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
            console.log('Loaded tasks with weight factors:', tasks.map(t => ({id: t.id, name: t.name, weight_factor: t.weight_factor})));
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
                <div class="task-details">
                    <span class="task-hours">${Math.round(task.hours * 60)} min (Referenz)</span>
                    <span class="task-weight-factor">Faktor: ${(task.weight_factor || 1.00).toFixed(2)}x</span>
                </div>
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
    const weightFactorInput = document.getElementById('taskWeightFactor');
    
    const name = nameInput.value.trim();
    const minutes = parseInt(hoursInput.value);
    const weight_factor = parseFloat(weightFactorInput.value);
    
    if (!name) {
        showMessage('Bitte geben Sie einen Namen für die Hausarbeit ein', 'error');
        return;
    }
    
    if (!minutes || minutes <= 0) {
        showMessage('Bitte geben Sie eine gültige Minutenzahl ein', 'error');
        return;
    }
    
    const hours = minutes / 60; // Convert minutes to hours for backend
    
    if (!weight_factor || weight_factor <= 0 || weight_factor > 5) {
        showMessage('Bitte geben Sie einen gültigen Zeitgewichtungsfaktor ein (0.01 - 5.00)', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/household-tasks/admin/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ name, hours, weight_factor })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Hausarbeit erfolgreich erstellt!', 'success');
            nameInput.value = '';
            hoursInput.value = '';
            weightFactorInput.value = '1.00';
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
            // Modal mit aktuellen Werten füllen (Stunden zu Minuten konvertieren)
            document.getElementById('editTaskName').value = task.name;
            document.getElementById('editTaskHours').value = Math.round(task.hours * 60);
            document.getElementById('editTaskWeightFactor').value = task.weight_factor || 1.00;
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
    const newMinutes = parseInt(document.getElementById('editTaskHours').value);
    const newWeightFactor = parseFloat(document.getElementById('editTaskWeightFactor').value);
    
    if (!newName) {
        showMessage('Bitte geben Sie einen Namen ein', 'error');
        return;
    }
    
    if (!newMinutes || newMinutes <= 0) {
        showMessage('Bitte geben Sie eine gültige Minutenzahl ein', 'error');
        return;
    }
    
    const newHours = newMinutes / 60; // Convert minutes to hours for backend
    
    if (!newWeightFactor || newWeightFactor <= 0 || newWeightFactor > 5) {
        showMessage('Bitte geben Sie einen gültigen Zeitgewichtungsfaktor ein (0.01 - 5.00)', 'error');
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
                hours: newHours,
                weight_factor: newWeightFactor
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

function deleteHouseholdTask(taskId) {
    showConfirmModal(
        'Hausarbeit löschen',
        'Sind Sie sicher, dass Sie diese Hausarbeit löschen möchten?',
        async () => {
            await performDeleteHouseholdTask(taskId);
        }
    );
}

async function performDeleteHouseholdTask(taskId) {
    
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

// User Management Functions
function showUserManagement() {
    document.getElementById('userManagement').style.display = 'block';
    loadPendingUsers();
    loadAllUsers();
}

function hideUserManagement() {
    document.getElementById('userManagement').style.display = 'none';
}

async function loadPendingUsers() {
    try {
        const response = await fetch(`${API_BASE}/admin/users/pending`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayPendingUsers(data);
        } else {
            console.error('Failed to load pending users');
        }
    } catch (error) {
        console.error('Error loading pending users:', error);
    }
}

async function loadAllUsers() {
    try {
        const response = await fetch(`${API_BASE}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayAllUsers(data);
        } else {
            console.error('Failed to load all users');
        }
    } catch (error) {
        console.error('Error loading all users:', error);
    }
}

function displayPendingUsers(users) {
    const container = document.getElementById('pendingUsers');
    
    if (users.length === 0) {
        container.innerHTML = '<p class="no-data">Keine wartenden Registrierungen</p>';
        return;
    }
    
    container.innerHTML = users.map(user => `
        <div class="pending-user-card">
            <div class="user-info">
                <strong>${user.username}</strong><br>
                <small>${user.email}</small><br>
                <small>Benutzer-ID: ${user.id}</small>
            </div>
            <div class="user-actions">
                <button onclick="approveUser(${user.id})" class="btn btn-success btn-sm">✅ Genehmigen</button>
                <button onclick="deleteUser(${user.id}, '${user.username}')" class="btn btn-danger btn-sm">❌ Ablehnen</button>
            </div>
        </div>
    `).join('');
}

function displayAllUsers(users) {
    const container = document.getElementById('allUsers');
    
    if (users.length === 0) {
        container.innerHTML = '<p class="no-data">Keine Benutzer gefunden</p>';
        return;
    }
    
    container.innerHTML = users.map(user => `
        <div class="user-card ${user.status}">
            <div class="user-info">
                <strong>${user.username}</strong>
                <span class="user-role ${user.role}">${user.role === 'admin' ? '👨‍💼 Admin' : '👤 Benutzer'}</span><br>
                <small>${user.email}</small><br>
                <small>Status: <span class="user-status ${user.status}">${getStatusLabel(user.status)}</span></small><br>
                <small>Benutzer-ID: ${user.id}</small>
            </div>
            <div class="user-actions">
                ${user.status === 'active' ? `
                    <button onclick="suspendUser(${user.id}, '${user.username}')" class="btn btn-warning btn-sm">⏸️ Sperren</button>
                ` : user.status === 'suspended' ? `
                    <button onclick="activateUser(${user.id})" class="btn btn-success btn-sm">✅ Aktivieren</button>
                ` : user.status === 'pending' ? `
                    <button onclick="approveUser(${user.id})" class="btn btn-success btn-sm">✅ Genehmigen</button>
                ` : ''}
                ${user.role !== 'admin' ? `
                    <button onclick="deleteUser(${user.id}, '${user.username}')" class="btn btn-danger btn-sm">🗑️ Löschen</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function getStatusLabel(status) {
    switch(status) {
        case 'active': return '✅ Aktiv';
        case 'pending': return '⏳ Wartend';
        case 'suspended': return '⏸️ Gesperrt';
        default: return status;
    }
}

async function approveUser(userId) {
    try {
        const response = await fetch(`${API_BASE}/admin/users/${userId}/approve`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Benutzer erfolgreich genehmigt!', 'success');
            loadPendingUsers();
            loadAllUsers();
        } else {
            showMessage(data.message || 'Fehler beim Genehmigen des Benutzers', 'error');
        }
    } catch (error) {
        console.error('Error approving user:', error);
        showMessage('Fehler beim Genehmigen des Benutzers', 'error');
    }
}

async function activateUser(userId) {
    try {
        const response = await fetch(`${API_BASE}/admin/users/${userId}/activate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Benutzer erfolgreich aktiviert!', 'success');
            loadAllUsers();
        } else {
            showMessage(data.message || 'Fehler beim Aktivieren des Benutzers', 'error');
        }
    } catch (error) {
        console.error('Error activating user:', error);
        showMessage('Fehler beim Aktivieren des Benutzers', 'error');
    }
}

function suspendUser(userId, username) {
    showConfirmModal(
        'Benutzer sperren',
        `Möchten Sie den Benutzer "${username}" wirklich sperren?\n\nDer Benutzer kann sich danach nicht mehr anmelden.`,
        async () => {
            await performSuspendUser(userId, username);
        },
        false,
        'suspend'
    );
}

async function performSuspendUser(userId, username) {
    try {
        const response = await fetch(`${API_BASE}/admin/users/${userId}/suspend`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Benutzer erfolgreich gesperrt!', 'success');
            loadAllUsers();
        } else {
            showMessage(data.message || 'Fehler beim Sperren des Benutzers', 'error');
        }
    } catch (error) {
        console.error('Error suspending user:', error);
        showMessage('Fehler beim Sperren des Benutzers', 'error');
    }
}

function deleteUser(userId, username) {
    showConfirmModal(
        'BENUTZER PERMANENT LÖSCHEN',
        `ACHTUNG: Möchten Sie den Benutzer "${username}" und ALLE seine Daten wirklich PERMANENT löschen?\n\nDiese Aktion kann NICHT rückgängig gemacht werden!`,
        async () => {
            await performDeleteUser(userId, username);
        },
        true // isCritical = true
    );
}

async function performDeleteUser(userId, username) {
    try {
        const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Benutzer und alle zugehörigen Daten erfolgreich gelöscht!', 'success');
            loadPendingUsers();
            loadAllUsers();
        } else {
            showMessage(data.message || 'Fehler beim Löschen des Benutzers', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showMessage('Fehler beim Löschen des Benutzers', 'error');
    }
}

// Balance Adjustment Management
let adjustBalanceData = {};

window.adjustUserBalance = function(userId, username, currentBalance) {
    console.log('adjustUserBalance called with:', { userId, username, currentBalance });
    
    // Store data for modal
    adjustBalanceData = {
        userId: parseInt(userId),
        username: username,
        currentBalance: parseFloat(currentBalance)
    };
    
    // Update modal content
    document.getElementById('adjustBalanceUsername').textContent = username;
    const currentBalanceSpan = document.getElementById('adjustBalanceCurrentBalance');
    const currentBalanceInMinutes = Math.round(currentBalance * 60);
    currentBalanceSpan.textContent = `${currentBalanceInMinutes} Minuten`;
    currentBalanceSpan.className = 'balance-display ' + (currentBalance >= 0 ? 'positive' : 'negative');
    
    // Reset form - show minutes
    document.getElementById('newBalanceInput').value = currentBalanceInMinutes;
    document.getElementById('balancePreview').style.display = 'none';
    
    // Show modal
    document.getElementById('adjustBalanceModal').style.display = 'block';
};

function closeAdjustBalanceModal() {
    document.getElementById('adjustBalanceModal').style.display = 'none';
    adjustBalanceData = {};
}

function updateBalancePreview() {
    const newBalanceInput = document.getElementById('newBalanceInput');
    const preview = document.getElementById('balancePreview');
    
    if (adjustBalanceData.currentBalance === undefined || !newBalanceInput.value) {
        preview.style.display = 'none';
        return;
    }
    
    const newBalanceMinutes = parseInt(newBalanceInput.value);
    if (isNaN(newBalanceMinutes)) {
        preview.style.display = 'none';
        return;
    }
    
    const oldBalanceMinutes = Math.round(adjustBalanceData.currentBalance * 60);
    const differenceMinutes = newBalanceMinutes - oldBalanceMinutes;
    
    // Update preview elements
    document.getElementById('previewOldBalance').textContent = `${oldBalanceMinutes} min`;
    document.getElementById('previewOldBalance').className = 'balance-display ' + (oldBalanceMinutes >= 0 ? 'positive' : 'negative');
    
    document.getElementById('previewNewBalance').textContent = `${newBalanceMinutes} min`;
    document.getElementById('previewNewBalance').className = 'balance-display ' + (newBalanceMinutes >= 0 ? 'positive' : 'negative');
    
    document.getElementById('previewDifference').textContent = `${differenceMinutes >= 0 ? '+' : ''}${differenceMinutes} min`;
    document.getElementById('previewDifference').className = 'balance-display ' + (differenceMinutes >= 0 ? 'positive' : 'negative');
    
    preview.style.display = 'block';
}

async function submitBalanceAdjustment(event) {
    event.preventDefault();
    
    const newBalanceMinutes = parseInt(document.getElementById('newBalanceInput').value);
    
    if (isNaN(newBalanceMinutes)) {
        showMessage('Bitte geben Sie eine gültige Zahl ein', 'error');
        return;
    }
    
    try {
        // Konvertiere Minuten zu Stunden für das Backend
        const balanceInHours = newBalanceMinutes / 60;
        const reason = document.getElementById('balanceReasonInput').value;
        
        const response = await fetch(`${API_BASE}/admin/users/${adjustBalanceData.userId}/balance`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ 
                balance: balanceInHours,
                reason: reason || undefined 
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(`Zeitkonto von ${adjustBalanceData.username} erfolgreich angepasst!`, 'success');
            closeAdjustBalanceModal();
            loadAdminStatistics(); // Statistiken aktualisieren
        } else {
            showMessage(data.error || 'Fehler beim Anpassen des Zeitkontos', 'error');
        }
    } catch (error) {
        console.error('Error adjusting user balance:', error);
        showMessage('Fehler beim Anpassen des Zeitkontos', 'error');
    }
}

// Confirmation Modal Functions
function showConfirmModal(title, message, onConfirm, isCritical = false, modalType = 'delete') {
    const modal = document.getElementById('confirmModal');
    const confirmButton = document.getElementById('confirmOkButton');
    
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    
    // Apply styling and button text based on type and criticality
    if (isCritical) {
        modal.classList.add('critical');
        confirmButton.textContent = 'PERMANENT LÖSCHEN';
        confirmButton.className = 'btn btn-danger';
    } else {
        modal.classList.remove('critical');
        
        // Set button text and style based on modal type
        switch (modalType) {
            case 'cleanup':
                confirmButton.textContent = 'Ja, bereinigen';
                confirmButton.className = 'btn btn-cleanup';
                break;
            case 'suspend':
                confirmButton.textContent = 'Ja, sperren';
                confirmButton.className = 'btn btn-suspend';
                break;
            case 'delete':
            default:
                confirmButton.textContent = 'Ja, löschen';
                confirmButton.className = 'btn btn-danger';
                break;
        }
    }
    
    // Remove existing event listeners
    const newConfirmButton = confirmButton.cloneNode(true);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
    
    // Add new event listener
    newConfirmButton.addEventListener('click', async function() {
        closeConfirmModal();
        if (onConfirm) {
            await onConfirm();
        }
    });
    
    modal.style.display = 'block';
}

function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    modal.style.display = 'none';
    modal.classList.remove('critical'); // Reset critical styling
}

// Weight Factor Management is now integrated into the main edit modal

// Make functions globally accessible
window.closeConfirmModal = closeConfirmModal;

// Debug: Make sure adjustUserBalance is globally accessible
console.log('adjustUserBalance function available:', typeof window.adjustUserBalance);

// Event listener for balance adjustment buttons
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('btn-adjust-balance')) {
        const userId = event.target.getAttribute('data-user-id');
        const username = event.target.getAttribute('data-username');
        const balance = parseFloat(event.target.getAttribute('data-balance'));
        
        console.log('Balance button clicked:', { userId, username, balance });
        
        if (userId && username && !isNaN(balance)) {
            window.adjustUserBalance(userId, username, balance);
        }
    }
});

// Add input event listener for balance preview
document.addEventListener('DOMContentLoaded', function() {
    const newBalanceInput = document.getElementById('newBalanceInput');
    if (newBalanceInput) {
        newBalanceInput.addEventListener('input', updateBalancePreview);
    }
});

// ================================
// Zeit Transfer Funktionen
// ================================

async function openTransferModal() {
    try {
        // Modal öffnen
        document.getElementById('transferHoursModal').style.display = 'block';
        
        // Aktuelle Balance laden
        await loadCurrentBalance();
        
        // User-Liste laden
        await loadUsersForTransfer();
        
        // Event Listener für Preview-Update
        setupTransferPreview();
        
    } catch (error) {
        console.error('Error opening transfer modal:', error);
        showMessage('Fehler beim Öffnen des Transfer-Modals', 'error');
    }
}

function closeTransferModal() {
    document.getElementById('transferHoursModal').style.display = 'none';
    // Form zurücksetzen
    document.getElementById('transferToUserSelect').value = '';
    document.getElementById('transferHoursInput').value = '';
    document.getElementById('transferReasonInput').value = '';
    document.getElementById('transferPreview').style.display = 'none';
}

async function loadCurrentBalance() {
    try {
        const response = await fetch(`${API_BASE}/timeaccount/balance`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const balanceInMinutes = Math.round(data.balance * 60);
            document.getElementById('transferCurrentBalance').textContent = `${balanceInMinutes} Minuten`;
            document.getElementById('transferCurrentBalance').className = 'balance-display ' + (data.balance >= 0 ? 'positive' : 'negative');
            userTimeBalance = data.balance; // Keep in hours for calculations
        } else {
            document.getElementById('transferCurrentBalance').textContent = 'Fehler beim Laden';
        }
    } catch (error) {
        console.error('Error loading balance:', error);
        document.getElementById('transferCurrentBalance').textContent = 'Fehler beim Laden';
    }
}

async function loadUsersForTransfer() {
    try {
        const response = await fetch(`${API_BASE}/auth/users`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const users = await response.json();
            const select = document.getElementById('transferToUserSelect');
            
            // Clear existing options (keep first placeholder option)
            select.innerHTML = '<option value="">-- Benutzer auswählen --</option>';
            
            // Add users (exclude current user)
            users.forEach(user => {
                if (user.id !== currentUser.id) {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = user.username;
                    select.appendChild(option);
                }
            });
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showMessage('Fehler beim Laden der Benutzerliste', 'error');
    }
}

function setupTransferPreview() {
    const hoursInput = document.getElementById('transferHoursInput');
    const userSelect = document.getElementById('transferToUserSelect');
    
    const updatePreview = () => {
        const minutes = parseInt(hoursInput.value) || 0;
        const selectedUser = userSelect.value;
        
        if (minutes > 0 && selectedUser) {
            const hoursToTransfer = minutes / 60; // Convert minutes to hours for calculation
            const newBalanceHours = userTimeBalance - hoursToTransfer;
            const newBalanceMinutes = Math.round(newBalanceHours * 60);
            
            document.getElementById('transferPreviewHours').textContent = `${minutes} Minuten`;
            document.getElementById('transferPreviewNewBalance').textContent = `${newBalanceMinutes} Minuten`;
            document.getElementById('transferPreviewNewBalance').className = 'preview-value balance-display ' + (newBalanceHours >= 0 ? 'positive' : 'negative');
            document.getElementById('transferPreview').style.display = 'block';
        } else {
            document.getElementById('transferPreview').style.display = 'none';
        }
    };
    
    hoursInput.addEventListener('input', updatePreview);
    userSelect.addEventListener('change', updatePreview);
}

async function submitHourTransfer(event) {
    event.preventDefault();
    
    const toUserId = document.getElementById('transferToUserSelect').value;
    const minutes = parseInt(document.getElementById('transferHoursInput').value);
    const reason = document.getElementById('transferReasonInput').value;
    
    if (!toUserId || !minutes) {
        showMessage('Bitte wählen Sie einen Empfänger und geben Sie die Minuten ein', 'error');
        return;
    }
    
    const hours = minutes / 60; // Convert minutes to hours for backend
    if (hours > userTimeBalance) {
        const balanceInMinutes = Math.round(userTimeBalance * 60);
        showMessage(`Nicht genügend Guthaben. Ihr Kontostand: ${balanceInMinutes} Minuten`, 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/timeaccount/transfer-hours`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                toUserId: parseInt(toUserId),
                hours: hours,
                reason: reason || undefined
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const recipientName = document.getElementById('transferToUserSelect').selectedOptions[0].textContent;
            showMessage(`Erfolgreich ${minutes} Minuten an ${recipientName} verschenkt!`, 'success');
            closeTransferModal();
            
            // Balance und Transfer-Historie aktualisieren
            loadTimeBalance();
            loadTransferHistory();
        } else {
            showMessage(data.message || 'Fehler beim Übertragen der Stunden', 'error');
        }
        
    } catch (error) {
        console.error('Error transferring hours:', error);
        showMessage('Fehler beim Übertragen der Stunden', 'error');
    }
}

async function loadTransferHistory() {
    try {
        const response = await fetch(`${API_BASE}/timeaccount/transfer-history`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const transfers = await response.json();
            displayTransferHistory(transfers);
        } else {
            document.getElementById('transferHistoryList').innerHTML = '<p class="error-message">Fehler beim Laden der Transfer-Historie</p>';
        }
    } catch (error) {
        console.error('Error loading transfer history:', error);
        document.getElementById('transferHistoryList').innerHTML = '<p class="error-message">Fehler beim Laden der Transfer-Historie</p>';
    }
}

function displayTransferHistory(transfers) {
    const container = document.getElementById('transferHistoryList');
    
    if (transfers.length === 0) {
        container.innerHTML = '<p class="no-data-message">Noch keine Zeit-Transfers getätigt</p>';
        return;
    }
    
    const transfersHTML = transfers.map(transfer => {
        const isSent = transfer.type === 'sent';
        const typeClass = isSent ? 'transfer-sent' : 'transfer-received';
        const typeIcon = isSent ? '📤' : '📥';
        const otherUser = isSent ? transfer.toUsername : transfer.fromUsername;
        const actionText = isSent ? 'an' : 'von';
        const hoursText = isSent ? `-${transfer.hours}` : `+${transfer.hours}`;
        
        return `
            <div class="transfer-item ${typeClass}">
                <div class="transfer-header">
                    <span class="transfer-icon">${typeIcon}</span>
                    <span class="transfer-action">
                        <strong>${hoursText} Stunden</strong> ${actionText} <strong>${otherUser}</strong>
                    </span>
                    <span class="transfer-date">${new Date(transfer.createdAt).toLocaleDateString('de-DE')}</span>
                </div>
                ${transfer.reason ? `<div class="transfer-reason">"${transfer.reason}"</div>` : ''}
            </div>
        `;
    }).join('');
    
    container.innerHTML = transfersHTML;
}

async function resetTransferHistory() {
    if (!confirm('Sind Sie sicher, dass Sie Ihre komplette Transfer-Historie löschen möchten?\n\nDiese Aktion kann nicht rückgängig gemacht werden!')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/timeaccount/reset-transfer-history`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            showMessage('Transfer-Historie erfolgreich zurückgesetzt!', 'success');
            loadTransferHistory(); // Historie neu laden (sollte jetzt leer sein)
        } else {
            const errorData = await response.json();
            showMessage(errorData.message || 'Fehler beim Zurücksetzen der Transfer-Historie', 'error');
        }
    } catch (error) {
        console.error('Error resetting transfer history:', error);
        showMessage('Fehler beim Zurücksetzen der Transfer-Historie', 'error');
    }
}

// Make modal functions globally accessible
window.closeAdjustBalanceModal = closeAdjustBalanceModal;
window.submitBalanceAdjustment = submitBalanceAdjustment;
window.updateBalancePreview = updateBalancePreview;
window.openTransferModal = openTransferModal;
window.closeTransferModal = closeTransferModal;
window.submitHourTransfer = submitHourTransfer;
window.loadTransferHistory = loadTransferHistory;
window.resetTransferHistory = resetTransferHistory;

// Error handling for debugging
window.addEventListener('error', function(event) {
    console.error('JavaScript Error:', event.error);
});