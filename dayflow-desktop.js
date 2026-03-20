const fallbackTasks = [
    { id: 1, title: 'Advanced Algorithms Final Prep', cat: 'college', time: '09:30', ampm: 'AM', done: false, tagLabel: 'ACADEMIC' },
    { id: 2, title: 'Submit Machine Learning Homework', cat: 'college', time: '11:00', ampm: 'AM', done: false, tagLabel: 'URGENT', notes: 'Complete the cross-validation section and plot the learning curves. Remember to export the notebook as PDF before uploading to the portal.\\n\\n- Check data cleaning step\\n- Verify hyperparameters\\n- Add conclusion paragraph', active: true },
    { id: 3, title: 'Grocery Shopping', cat: 'personal', time: '08:00', ampm: 'AM', done: true, tagLabel: 'HOUSEHOLD' },
    { id: 4, title: 'Evening Yoga Session', cat: 'personal', time: '06:00', ampm: 'PM', done: false, tagLabel: 'HEALTH' },
    { id: 5, title: 'Read 20 pages of "Deep Work"', cat: 'goal', time: '09:00', ampm: 'PM', done: false, tagLabel: 'GROWTH' }
];

const SUPA_URL_HARDCODED = 'https://dwyvtklbynsyrzjhvmtf.supabase.co'; // Enter your Supabase URL here for GitHub hosting
const SUPA_KEY_HARDCODED = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3eXZ0a2xieW5zeXJ6amh2bXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzQxMzMsImV4cCI6MjA4OTU1MDEzM30.7FeVfB3G3kwSX7DkQibJwEe4r-n1BBzBG0ZJCQfPFD4'
let appState = {
    tasks: JSON.parse(localStorage.getItem('df_tasks')) || fallbackTasks,
    selectedTaskId: null,
    supaUrl: SUPA_URL_HARDCODED || localStorage.getItem('df_supaUrl') || '',
    supaKey: SUPA_KEY_HARDCODED || localStorage.getItem('df_supaKey') || '',
    filter: 'all'
};

// Global Supabase Client
let supaClient = null;
if (appState.supaUrl && appState.supaKey) {
    try { supaClient = window.supabase.createClient(appState.supaUrl, appState.supaKey); } catch (e) { }
}

function renderAll() {
    let html = '';
    const categories = [
        { id: 'college', title: 'COLLEGE', color: 'var(--college)' },
        { id: 'personal', title: 'PERSONAL', color: 'var(--personal)' },
        { id: 'goal', title: 'GOALS', color: 'var(--goal)' }
    ];

    categories.forEach(catInfo => {
        let catTasks = appState.tasks.filter(t => t.cat === catInfo.id);
        if (appState.filter !== 'all' && appState.filter !== catInfo.id) {
            catTasks = [];
        }
        if (catTasks.length === 0) return;

        html += `<div class="group-header">
                            <span class="group-title" style="color: ${catInfo.color}">${catInfo.title}</span>
                            <span class="group-count">${catTasks.length} TASKS</span>
                        </div>
                        <div class="task-group">`;

        catTasks.forEach(t => {
            const isSelected = appState.selectedTaskId === t.id;
            const borderClass = isSelected ? 'active has-left-border' : '';
            html += `<div class="task-row ${t.done ? 'done' : ''} ${borderClass}" onclick="selectTask(${t.id})">
                        <div class="task-checkbox ${t.done ? 'checked' : ''}" onclick="event.stopPropagation(); toggleTask(${t.id})">
                            ${t.done ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                        </div>
                        <div class="task-title-wrap">
                            <div class="task-title">${t.title}</div>
                        </div>
                        <div class="task-tag ${t.cat}">${t.tagLabel || t.cat.toUpperCase()}</div>
                        <div class="task-time">${t.time || ''} ${t.ampm || ''}</div>
                    </div>`;
        });
        html += `</div>`;
    });
    document.getElementById('tasks-scroll-area').innerHTML = html;
}

function renderRightPane() {
    const pane = document.getElementById('right-pane');
    const task = appState.tasks.find(t => t.id === appState.selectedTaskId);

    if (!task) {
        pane.innerHTML = `<div class="empty-state">Select a task to view details</div>`;
        pane.classList.remove('open');
        return;
    }

    pane.classList.add('open');

    let notesHtml = '';
    if (task.notes) {
        const parts = task.notes.split('\\n');
        let ulStarted = false;
        parts.forEach(p => {
            if (p.trim().startsWith('-')) {
                if (!ulStarted) { notesHtml += '<ul>'; ulStarted = true; }
                notesHtml += `<li>${p.trim().substring(1).trim()}</li>`;
            } else {
                if (ulStarted) { notesHtml += '</ul>'; ulStarted = false; }
                if (p.trim() !== '') notesHtml += `<p style="margin-bottom:8px">${p.trim()}</p>`;
            }
        });
        if (ulStarted) notesHtml += '</ul>';
    } else {
        notesHtml = '<p>No extra notes provided.</p>';
    }

    pane.innerHTML = `
                <div class="details-header">
                    <svg onclick="closePane()" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    <div class="header-actions">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" onclick="deleteTask(${task.id})"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </div>
                </div>
                
                <div><span class="det-tag" style="background: var(--${task.cat});">${task.cat.toUpperCase()}</span></div>
                <h2 class="det-title">${task.title}</h2>
                
                <div class="det-meta">
                    <div class="det-meta-row">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        Today, ${task.time || ''} ${task.ampm || ''}
                    </div>
                    <div class="det-meta-row">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                        15 minutes before
                    </div>
                </div>
                
                <div class="det-notes-label">NOTES</div>
                <div class="det-notes-box">${notesHtml}</div>
                
                <button class="mark-done-btn" onclick="toggleTask(${task.id})">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> 
                    ${task.done ? 'Unmark as Completed' : 'Mark as Completed'}
                </button>
            `;
}

function selectTask(id) {
    appState.selectedTaskId = id;
    renderAll();
    renderRightPane();
}
function closePane() {
    appState.selectedTaskId = null;
    renderRightPane();
    renderAll();
}

function toggleTask(id) {
    const task = appState.tasks.find(t => t.id === id);
    if (task) { task.done = !task.done; saveData(); }
}
function deleteTask(id) {
    appState.tasks = appState.tasks.filter(t => t.id !== id);
    appState.selectedTaskId = null;
    saveData();
}

async function saveData() {
    localStorage.setItem('df_tasks', JSON.stringify(appState.tasks));
    renderAll();
    renderRightPane();
    try {
        if (document.getElementById('nav-stats') && document.getElementById('nav-stats').classList.contains('active')) {
            updateStats();
        }
    } catch (e) { }

    if (supaClient) {
        try {
            await supaClient.from('dayflow_sync').upsert({ id: 1, data: { tasks: appState.tasks } });
        } catch (e) { console.error("Sync failed", e); }
    }
}



function showModal(id) {
    document.querySelectorAll('.modal-card').forEach(s => s.style.display = 'none');
    document.getElementById('overlay').classList.add('active');
    document.getElementById(id).style.display = 'block';
}
function closeModals() {
    document.getElementById('overlay').classList.remove('active');
    document.querySelectorAll('.modal-card').forEach(s => s.style.display = 'none');
}
function openFormModal() { showModal('sheet-add'); }
document.getElementById('overlay').addEventListener('click', (e) => {
    if (e.target.id === 'overlay') closeModals();
});

document.getElementById('add-submit').addEventListener('click', () => {
    const title = document.getElementById('add-title').value.trim();
    if (!title) return;
    const timeRaw = document.getElementById('add-time').value;
    let timeClean = '', ampm = '';
    if (timeRaw) {
        let [h, m] = timeRaw.split(':');
        ampm = parseInt(h) >= 12 ? 'PM' : 'AM';
        h = parseInt(h) % 12 || 12;
        timeClean = `${h.toString().padStart(2, '0')}:${m}`;
    }
    appState.tasks.unshift({
        id: Date.now(), title,
        cat: document.getElementById('add-cat').value,
        time: timeClean, ampm: ampm,
        done: false, tagLabel: 'NEW'
    });
    document.getElementById('add-title').value = '';
    closeModals(); saveData();
});

// Voice API logic
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let parsedVoiceDraft = null;
let isRecording = false;

function openVoice() {
    if (recognition && isRecording) {
        try { recognition.stop(); } catch (e) { }
    }
    resetVoice();
    document.getElementById('voiceOverlay').classList.add('show');
    document.getElementById('voicePanel').classList.add('open');
}

function closeVoice() {
    if (recognition && isRecording) {
        try { recognition.stop(); } catch (e) { }
    }
    document.getElementById('voiceOverlay').classList.remove('show');
    document.getElementById('voicePanel').classList.remove('open');
}

function resetVoice() {
    document.getElementById('transcript').innerText = 'Tap the mic and start speaking...';
    document.getElementById('transcript').style.fontStyle = 'italic';
    document.getElementById('parsedAction').style.display = 'none';
    document.getElementById('confirmBtn').style.display = 'none';
    document.getElementById('waveform').style.display = 'none';
    document.getElementById('micBtn').classList.remove('recording');
    document.getElementById('micBtn').classList.remove('processing');
    parsedVoiceDraft = null;
    isRecording = false;
}

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = function () {
        isRecording = true;
        document.getElementById('transcript').innerText = 'Listening... Speak now';
        document.getElementById('transcript').style.fontStyle = 'normal';
        document.getElementById('waveform').style.display = 'flex';
        document.getElementById('micBtn').classList.add('recording');
        document.getElementById('parsedAction').style.display = 'none';
        document.getElementById('confirmBtn').style.display = 'none';
    };
    recognition.onresult = function (event) {
        isRecording = false;
        document.getElementById('waveform').style.display = 'none';
        document.getElementById('micBtn').classList.remove('recording');
        document.getElementById('micBtn').classList.add('processing');

        const text = event.results[0][0].transcript;
        document.getElementById('transcript').innerText = `"${text}"`;

        setTimeout(() => {
            processVoiceNLP(text);
        }, 500); // simulate processing
    };
    recognition.onerror = function (event) {
        isRecording = false;
        document.getElementById('waveform').style.display = 'none';
        document.getElementById('micBtn').classList.remove('recording');
        document.getElementById('transcript').innerText = 'Voice not recognized. Try again.';
        document.getElementById('transcript').style.fontStyle = 'italic';
    };
    recognition.onend = function () {
        if (isRecording) {
            isRecording = false;
            document.getElementById('waveform').style.display = 'none';
            document.getElementById('micBtn').classList.remove('recording');
        }
    };
}

function toggleRecording() {
    if (!SpeechRecognition) {
        alert("Speech Recognition is not supported in this browser.");
        return;
    }

    if (isRecording) {
        try { recognition.stop(); } catch (e) { }
    } else {
        resetVoice();
        try { recognition.start(); } catch (e) { }
    }
}

function processVoiceNLP(text) {
    document.getElementById('micBtn').classList.remove('processing');

    const t = text.toLowerCase();
    let intent = 'personal';
    if (t.match(/(assignment|homework|lab|submit|college)/)) { intent = 'college'; }
    else if (t.match(/(run|workout|practice|goal|exercise)/)) { intent = 'goal'; }

    const timeRemoved = text.replace(/(at|by|for)\s*[0-9:amp\s]+/ig, '').trim();
    const title = timeRemoved.charAt(0).toUpperCase() + timeRemoved.slice(1);

    parsedVoiceDraft = {
        title: title || "New Task from Voice",
        cat: intent,
        time: "", ampm: "", tagLabel: 'VOICE'
    };

    const catLabel = intent.charAt(0).toUpperCase() + intent.slice(1);
    const parsedBox = document.getElementById('parsedAction');
    parsedBox.innerHTML = `<strong>Action:</strong> Add to ${catLabel}<br/><strong>Title:</strong> ${parsedVoiceDraft.title}`;
    parsedBox.style.display = 'block';

    document.getElementById('confirmBtn').style.display = 'block';
}

function confirmVoiceAction() {
    if (!parsedVoiceDraft) return;
    appState.tasks.unshift({
        id: Date.now(), title: parsedVoiceDraft.title,
        cat: parsedVoiceDraft.cat, time: parsedVoiceDraft.time,
        ampm: parsedVoiceDraft.ampm, done: false, tagLabel: parsedVoiceDraft.tagLabel
    });
    saveData();
    closeVoice();
}

// Auth functions
function switchAuthTab(tab) {
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(t => {
        t.classList.remove('active');
        t.style.background = 'transparent';
        t.style.color = 'var(--text-muted)';
    });

    const activeTab = document.querySelector(`.auth-tab[data-tab="${tab}"]`);
    activeTab.classList.add('active');
    activeTab.style.background = 'var(--primary)';
    activeTab.style.color = 'white';

    if (tab === 'signin') {
        document.getElementById('signInForm').style.display = 'flex';
        document.getElementById('signUpForm').style.display = 'none';
        document.getElementById('authError').style.display = 'none';
        document.getElementById('authSuccess').style.display = 'none';
    } else {
        document.getElementById('signInForm').style.display = 'none';
        document.getElementById('signUpForm').style.display = 'flex';
        document.getElementById('authError').style.display = 'none';
        document.getElementById('authSuccess').style.display = 'none';
    }
}

async function signIn() {
    const email = document.getElementById('signInEmail').value;
    const pwd = document.getElementById('signInPassword').value;
    if (!email || !pwd) return showError('Please enter email and password');

    if (supaClient) {
        const { data, error } = await supaClient.auth.signInWithPassword({ email, password: pwd });
        if (error) return showError(error.message);
        showSuccess('Signed in successfully!');
        setTimeout(() => completeAuth(email, data.user?.user_metadata?.full_name || 'User'), 1000);
    } else {
        showError('NOTE: You are in Local Mode. Deploying requires Supabase URL in dayflow-desktop.js.');
        showSuccess('Logging in locally...');
        setTimeout(() => completeAuth(email, 'User'), 2500);
    }
}

async function signUp() {
    const name = document.getElementById('signUpName').value;
    const email = document.getElementById('signUpEmail').value;
    const pwd = document.getElementById('signUpPassword').value;
    if (!name || !email || !pwd) return showError('Please fill all fields');
    if (pwd.length < 6) return showError('Password must be at least 6 characters');

    if (supaClient) {
        const { data, error } = await supaClient.auth.signUp({ email, password: pwd, options: { data: { full_name: name } } });
        if (error) return showError(error.message);
        showSuccess('Account created! Please verify your email if required.');
        setTimeout(() => completeAuth(email, name), 1000);
    } else {
        showSuccess('Account created (Local Mode)! Set Supabase credentials to sync.');
        setTimeout(() => completeAuth(email, name), 1000);
    }
}

async function signInWithGoogle() {
    if (supaClient) {
        const { data, error } = await supaClient.auth.signInWithOAuth({ provider: 'google' });
        if (error) return showError(error.message);
    } else {
        showSuccess('Signing in with Google (Local Mode)...');
        setTimeout(() => completeAuth('user@gmail.com', 'Google User'), 1000);
    }
}

async function signInWithGitHub() {
    if (supaClient) {
        const { data, error } = await supaClient.auth.signInWithOAuth({ provider: 'github' });
        if (error) return showError(error.message);
    } else {
        showSuccess('Signing in with GitHub (Local Mode)...');
        setTimeout(() => completeAuth('user@github.com', 'GitHub User'), 1000);
    }
}

async function resetPassword() {
    const email = document.getElementById('signInEmail').value;
    if (!email) return showError('Provide your email in the Sign In tab first.');

    if (supaClient) {
        const { data, error } = await supaClient.auth.resetPasswordForEmail(email);
        if (error) return showError(error.message);
        showSuccess('Password reset link sent to your email.');
    } else {
        showError('Set up Supabase credentials first to use this feature.');
    }
}

function showError(msg) {
    const err = document.getElementById('authError');
    err.textContent = msg;
    err.style.display = 'block';
    document.getElementById('authSuccess').style.display = 'none';
}

function showSuccess(msg) {
    const s = document.getElementById('authSuccess');
    s.textContent = msg;
    s.style.display = 'block';
    document.getElementById('authError').style.display = 'none';
}

function completeAuth(email, name) {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('app').style.display = 'grid';

    document.getElementById('userName').textContent = name;
    document.getElementById('userEmail').textContent = email;
    document.getElementById('userInitials').textContent = name.charAt(0).toUpperCase();

    localStorage.setItem('df_auth_email', email);
    localStorage.setItem('df_auth_name', name);
}

async function checkAuthOnLoad() {
    if (supaClient) {
        const { data: { session } } = await supaClient.auth.getSession();
        if (session) {
            completeAuth(session.user.email, session.user.user_metadata?.full_name || 'User');

            // Supabase auto-auth redirect hash check logic
            supaClient.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    completeAuth(session.user.email, session.user.user_metadata?.full_name || 'User');
                }
            });
        } else {
            // Fallback to local
            const email = localStorage.getItem('df_auth_email');
            const name = localStorage.getItem('df_auth_name');
            if (email && name) completeAuth(email, name);
        }
    } else {
        const email = localStorage.getItem('df_auth_email');
        const name = localStorage.getItem('df_auth_name');
        if (email && name) {
            completeAuth(email, name);
        }
    }
}

async function signOut() {
    if (supaClient) {
        await supaClient.auth.signOut();
    }
    localStorage.removeItem('df_auth_email');
    localStorage.removeItem('df_auth_name');
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';

    document.getElementById('signInEmail').value = '';
    document.getElementById('signInPassword').value = '';
    document.getElementById('signUpName').value = '';
    document.getElementById('signUpEmail').value = '';
    document.getElementById('signUpPassword').value = '';
    document.getElementById('signUpConfirm').value = '';
}

// View Switching Logic
function switchView(viewName) {
    document.querySelectorAll('nav .nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
    appState.filter = 'all';

    if (viewName === 'tasks') {
        document.getElementById('nav-tasks').classList.add('active');
        document.getElementById('tasks-scroll-area').style.display = 'block';
        document.querySelector('.center-header').style.display = 'flex';
        document.getElementById('right-pane').style.display = 'flex';
        document.getElementById('app').style.gridTemplateColumns = '260px 1fr 360px';
        document.getElementById('fab-voice').style.display = 'flex';
        renderAll();
    } else {
        document.querySelector('.center-header').style.display = 'none';
        document.getElementById('right-pane').style.display = 'none';
        document.getElementById('app').style.gridTemplateColumns = '260px 1fr';
        document.getElementById('fab-voice').style.display = 'none';

        if (viewName === 'calendar') {
            document.getElementById('nav-calendar').classList.add('active');
            document.getElementById('calendar-view').style.display = 'block';
        }
        else if (viewName === 'focus') {
            document.getElementById('nav-focus').classList.add('active');
            document.getElementById('focus-view').style.display = 'flex';
        }
        else if (viewName === 'stats') {
            document.getElementById('nav-stats').classList.add('active');
            document.getElementById('stats-view').style.display = 'block';
            updateStats();
        }
    }
}

function filterByProject(projId) {
    switchView('tasks');
    appState.filter = projId;
    document.querySelectorAll('nav .nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`nav-proj-${projId}`).classList.add('active');
    renderAll();
}

// Focus Timer Logic
let focusInt;
let initialFocusMinutes = 25;
let focusTime = initialFocusMinutes * 60;
let isFocusing = false;

function setFocusTime(minutes) {
    if (isFocusing) return alert('Pause or reset the timer first');
    initialFocusMinutes = minutes;
    focusTime = minutes * 60;
    updateTimerDisplay();

    const btns = document.querySelectorAll('#focus-view .gap-4.mb-10 button');
    btns.forEach(b => {
        if (parseInt(b.innerText) === minutes) {
            b.className = "px-5 py-2 rounded-full border border-[#DD5734] bg-[#FDEEE9] text-sm font-semibold text-[#DD5734] transition shadow-sm";
        } else {
            b.className = "px-5 py-2 rounded-full border border-[#EDF0F3] text-sm font-semibold text-[#8E95A1] hover:text-[#DD5734] hover:border-[#DD5734] transition bg-white shadow-sm";
        }
    });
}

function updateTimerDisplay() {
    const m = Math.floor(focusTime / 60).toString().padStart(2, '0');
    const s = (focusTime % 60).toString().padStart(2, '0');
    document.getElementById('timer-display').innerText = `${m}:${s}`;
}

function startFocusTimer() {
    if (isFocusing) {
        clearInterval(focusInt);
        document.getElementById('start-timer').innerText = 'Resume Focus';
        isFocusing = false;
    } else {
        isFocusing = true;
        document.getElementById('start-timer').innerText = 'Pause Focus';

        const elem = document.documentElement; // Make entire browser go true F11 Fullscreen
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => console.log(err));
        }

        focusInt = setInterval(() => {
            if (focusTime > 0) {
                focusTime--;
                updateTimerDisplay();

                const circle = document.querySelector('.timer-circle');
                if (focusTime % 2 === 0) {
                    circle.style.boxShadow = '0 10px 40px rgba(221,87,52,0.3)';
                } else {
                    circle.style.boxShadow = '0 10px 40px rgba(221,87,52,0.15)';
                }
            } else {
                clearInterval(focusInt);
                alert("Focus Session Complete!");
                resetFocusTimer();
                if (document.exitFullscreen) document.exitFullscreen();
            }
        }, 1000);
    }
}

function resetFocusTimer() {
    clearInterval(focusInt);
    isFocusing = false;
    focusTime = initialFocusMinutes * 60;
    document.getElementById('start-timer').innerText = 'Start Focus';
    document.querySelector('.timer-circle').style.boxShadow = '0 10px 40px rgba(221,87,52,0.15)';
    updateTimerDisplay();
    if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(e => console.log(e));
    }
}

// Statistics Logic
function updateStats() {
    const completed = appState.tasks.filter(t => t.done).length;
    const total = appState.tasks.length;
    document.getElementById('stat-completed').innerText = completed;
    document.getElementById('stat-total').innerText = total;
}

// Init
const activeTask = appState.tasks.find(t => t.active);
if (activeTask) appState.selectedTaskId = activeTask.id;
// Detect when user exits Fullscreen (e.g., pressing ESC)
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && isFocusing) {
        // If they exit fullscreen while focusing, stop focus and return to normal tasks
        resetFocusTimer();
        switchView('tasks');
    }
});

// Live Clock
setInterval(() => {
    const clockEl = document.getElementById('live-clock');
    if (clockEl) {
        clockEl.innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}, 1000);

// Calendar Logic
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const header = document.getElementById('calendar-month-year');
    if (!grid || !header) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    header.innerText = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    grid.innerHTML = '';

    for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += `<div style="background:var(--bg-secondary); border-radius:8px; opacity:0.5;"></div>`;
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const isToday = (i === now.getDate());
        const bg = isToday ? 'var(--primary-light)' : 'white';
        const color = isToday ? 'var(--primary)' : 'var(--text-main)';
        const border = isToday ? '1px solid var(--primary)' : '1px solid var(--border)';
        const todayBadge = isToday ? `<div style="font-size:10px; margin-right:auto; background:var(--primary); color:white; padding:2px 6px; border-radius:4px;">TODAY</div>` : '';

        grid.innerHTML += `
                    <div style="background:${bg}; color:${color}; border:${border}; border-radius:8px; display:flex; justify-content:space-between; padding:8px; font-weight:600; font-size:14px; min-height:80px;">
                        ${todayBadge}
                        ${i}
                    </div>
                `;
    }
}

// Initialize 
renderAll();
renderCalendar();
renderRightPane();
checkAuthOnLoad();
