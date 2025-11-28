const API_BASE = 'http://localhost:3000/api/competitions';
let competitions = [];
let currentComp = null;
let autoRefreshInterval = null;
let currentUserRole = null;

// ===========================
// LOGIN & LOGOUT
// ===========================
function login(role) {
    currentUserRole = role;
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainDashboard').classList.remove('hidden');
    
    const roleEmoji = role === 'admin' ? '⚙️' : '👤';
    const roleText = role === 'admin' ? 'Admin' : 'User';
    document.getElementById('userRole').textContent = `${roleEmoji} ${roleText}`;
    
    if (role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
    } else {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
    }
    
    loadCompetitions();
    startAutoRefresh();
}

function logout() {
    currentUserRole = null;
    stopAutoRefresh();
    document.getElementById('mainDashboard').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
    
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('leaderboard').classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.tab-btn').classList.add('active');
}

// ===========================
// LOAD COMPETITIONS
// ===========================
async function loadCompetitions() {
    try {
        const res = await fetch(`${API_BASE}`);
        const data = await res.json();
        competitions = data.competitions || [];
        
        const selects = ['competitionSelect', 'historyCompSelect', 'tiebreakCompSelect', 'neighboursCompSelect', 'adminCompSelect', 'finalizeCompSelect', 'resetCompSelect'];
        
        // --- THIS IS THE FIX ---
        // This loop now populates ALL dropdowns with just the name.
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            select.innerHTML = competitions.map(c => `<option value="${c.unique_id}">${c.name}</option>`).join('');
        });
        // --- END OF FIX ---
        
        if (competitions.length > 0) {
            currentComp = competitions[0].unique_id;
            fetchLeaderboard();
        }
    } catch (err) {
        console.error('Error:', err);
    }
}
// ===========================
// LEADERBOARD FUNCTIONS
// ===========================
async function fetchLeaderboard() {
    try {
        const start = document.getElementById('startDate').value;
        const end = document.getElementById('endDate').value;
        let url = `${API_BASE}/${currentComp}/leaderboard`;
        if (start || end) url += `?${start ? `start=${start}` : ''}${start && end ? '&' : ''}${end ? `end=${end}` : ''}`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        let html = '';
        if (!data.leaderboard || data.leaderboard.length === 0) {
            html = '<div class="no-data">No results</div>';
        } else {
            html = `<table><thead><tr><th>Rank</th><th>Player</th><th>Score</th><th>Submitted</th></tr></thead><tbody>`;
            data.leaderboard.forEach(p => {
                html += `<tr><td><span class="rank-badge rank-${p.rank <= 3 ? p.rank : 'default'}">${p.rank}</span></td><td>${p.player_name}</td><td class="score">${p.score}</td><td>${new Date(p.timestamp).toLocaleString()}</td></tr>`;
            });
            html += '</tbody></table>';
        }
        document.getElementById('leaderboardContent').innerHTML = html;
    } catch (err) {
        document.getElementById('leaderboardError').innerHTML = `<div class="error">Error: ${err.message}</div>`;
    }
}

function handleCompChange() {
    currentComp = document.getElementById('competitionSelect').value;
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    fetchLeaderboard();
}

function filterLeaderboard() {
    fetchLeaderboard();
}

// ===========================
// HISTORY FUNCTIONS
// ===========================
async function fetchSnapshots() {
    const comp = document.getElementById('historyCompSelect').value;
    try {
        const res = await fetch(`${API_BASE}/${comp}/snapshots`);
        const data = await res.json();
        
        let html = '';
        if (!data.snapshots || data.snapshots.length === 0) {
            html = '<div class="no-data">No historical snapshots yet. Finalize the competition to create one.</div>';
        } else {
            html = '<div>';
            data.snapshots.forEach((snapshot, idx) => {
                html += `<div class="player-card"><h3>Snapshot ${idx + 1} - ${new Date(snapshot.date).toLocaleString()}</h3><p>Participants: ${snapshot.participants}</p><table><thead><tr><th>Rank</th><th>Player</th><th>Score</th></tr></thead><tbody>`;
                snapshot.results.forEach(r => {
                    html += `<tr><td><span class="rank-badge rank-${r.rank <= 3 ? r.rank : 'default'}">${r.rank}</span></td><td>${r.player_name}</td><td class="score">${r.score}</td></tr>`;
                });
                html += '</tbody></table></div>';
            });
            html += '</div>';
        }
        document.getElementById('historyContent').innerHTML = html;
    } catch (err) {
        document.getElementById('historyContent').innerHTML = `<div class="error">Error: ${err.message}</div>`;
    }
}

// ===========================
// PLAYER STATS FUNCTIONS
// ===========================
async function fetchPlayerHistory() {
    const name = document.getElementById('playerNameInput').value;
    if (!name) {
        document.getElementById('playerStatsContent').innerHTML = '<div class="error">Enter player name</div>';
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/players/${name}/history`);
        const data = await res.json();
        
        let html = `<div class="stat-grid"><div class="stat-box"><div class="stat-label">Competitions</div><div class="stat-value">${data.competitions_participated}</div></div></div>`;
        if (data.history && data.history.length > 0) {
            html += '<div>';
            data.history.forEach(h => {
                html += `<div class="player-card"><h3>${h.competition}</h3><p>Rank: <strong>#${h.rank}</strong> | Score: <strong>${h.score}</strong></p><p style="font-size: 0.9em; color: #666;">${new Date(h.completed_date).toLocaleDateString()}</p></div>`;
            });
            html += '</div>';
        }
        document.getElementById('playerStatsContent').innerHTML = html;
    } catch (err) {
        document.getElementById('playerStatsContent').innerHTML = `<div class="error">Error: ${err.message}</div>`;
    }
}

// ===========================
// TIEBREAK FUNCTIONS
// ===========================
async function checkTiebreak() {
    const comp = document.getElementById('tiebreakCompSelect').value;
    const player = document.getElementById('tiebreakPlayer').value;
    if (!player) {
        document.getElementById('tiebreakContent').innerHTML = '<div class="error">Enter player name</div>';
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/${comp}/tiebreak`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ player_name: player }) 
        });
        const data = await res.json();
        let html = data.handled ? `<div class="success">${data.message}</div>` : `<div class="success">${data.message}</div>`;
        if (data.tied_players) {
            html += '<p>Tied players:</p>';
            data.tied_players.forEach(p => html += `<p>- ${p.player_name}: ${p.score}</p>`);
        }
        document.getElementById('tiebreakContent').innerHTML = html;
    } catch (err) {
        document.getElementById('tiebreakContent').innerHTML = `<div class="error">Error: ${err.message}</div>`;
    }
}

// ===========================
// NEIGHBOURS FUNCTIONS
// ===========================
async function fetchNeighbours() {
    const comp = document.getElementById('neighboursCompSelect').value;
    const player = document.getElementById('neighboursPlayer').value;
    if (!player) {
        document.getElementById('neighboursContent').innerHTML = '<div class="error">Enter player name</div>';
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/${comp}/neighbours/${player}`);
        const data = await res.json();
        let html = '<div style="text-align: center;">';
        data.above_players.forEach(p => html += `<p>↑ ${p.player_name}: ${p.score}</p>`);
        html += `<p style="font-size: 1.3em; font-weight: bold; color: #667eea;">👉 ${data.player.player_name}: ${data.player.score}</p>`;
        data.below_players.forEach(p => html += `<p>↓ ${p.player_name}: ${p.score}</p>`);
        html += '</div>';
        document.getElementById('neighboursContent').innerHTML = html;
    } catch (err) {
        document.getElementById('neighboursContent').innerHTML = `<div class="error">Error: ${err.message}</div>`;
    }
}

// ===========================
// ADMIN FUNCTIONS
// ===========================
async function createCompetition() {
    const name = document.getElementById('newCompName').value.trim();
    const uniqueId = document.getElementById('newCompId').value.trim();
    const scoreType = document.getElementById('newCompScoreType').value.trim();
    const sorting = document.getElementById('newCompSorting').value;

    if (!name || !uniqueId) {
        showAdminMessage('Please enter both Competition Name and Unique ID', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                unique_id: uniqueId,
                score_type: scoreType,
                sorting_order: sorting
            })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to create competition');
        }

        const data = await res.json();
        showAdminMessage(`✅ Competition created successfully: ${data.competition.name}`, 'success');
        
        document.getElementById('newCompName').value = '';
        document.getElementById('newCompId').value = '';
        document.getElementById('newCompScoreType').value = 'points';
        document.getElementById('newCompSorting').value = 'DESC';
        
        await loadCompetitions();
        
    } catch (err) {
        showAdminMessage(`Error: ${err.message}`, 'error');
    }
}

async function submitAdminScore() {
    const comp = document.getElementById('adminCompSelect').value;
    const player = document.getElementById('adminPlayerName').value;
    const score = document.getElementById('adminScore').value;
    if (!player || !score) {
        showAdminMessage('Enter all fields', 'error');
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/${comp}/scores`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ player_name: player, score: parseInt(score) }) 
        });
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.message || 'Failed to submit score');
        }
        
        showAdminMessage(`✅ Score submitted: ${player} - ${score}`, 'success');
        document.getElementById('adminPlayerName').value = '';
        document.getElementById('adminScore').value = '';
    } catch (err) {
        showAdminMessage(`❌ Error: ${err.message}`, 'error');
    }
}

async function finalizeCompetition() {
    const comp = document.getElementById('finalizeCompSelect').value;
    try {
        const res = await fetch(`${API_BASE}/${comp}/finalize`, { method: 'POST' });
        const data = await res.json();
        showAdminMessage('Competition finalized and snapshot saved!', 'success');
        await loadCompetitions();
    } catch (err) {
        showAdminMessage(`Error: ${err.message}`, 'error');
    }
}

async function resetCompetition() {
    const comp = document.getElementById('resetCompSelect').value;
    if (!confirm('Are you sure? This will delete ALL scores and history!')) return;
    try {
        const res = await fetch(`${API_BASE}/${comp}/reset`, { method: 'POST' });
        const data = await res.json();
        showAdminMessage('Competition reset successfully!', 'success');
        await loadCompetitions();
    } catch (err) {
        showAdminMessage(`Error: ${err.message}`, 'error');
    }
}

function showAdminMessage(msg, type) {
    const div = document.getElementById('adminMessage');
    div.innerHTML = `<div class="${type}">${msg}</div>`;
    setTimeout(() => {
        div.innerHTML = '';
    }, 5000);
}

// ===========================
// TAB SWITCHING
// ===========================
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
}

// ===========================
// AUTO-REFRESH
// ===========================
function startAutoRefresh() {
    autoRefreshInterval = setInterval(() => {
        if (document.getElementById('leaderboard').classList.contains('active')) {
            fetchLeaderboard();
        }
    }, 2000);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
}