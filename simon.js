// ==========================================================================
// Simon Says JS Logic System - Duolingo Edition
// ==========================================================================

// --- Core Game Sequence State ---
let gameSeq = [];
let userSeq = [];
let btns = ["yellow", "red", "purple", "green"];

let started = false;
let level = 0;
let hearts = 3;
let perfectRun = true;

// --- User Stats and Storage ---
let gems = parseInt(localStorage.getItem("simonGems")) || 0;
let highScore = parseInt(localStorage.getItem("simonHighScore")) || 0;
let gamesPlayed = parseInt(localStorage.getItem("simonGamesPlayed")) || 0;
let soundEnabled = localStorage.getItem("simonSoundEnabled") !== "false"; // default true
let theme = localStorage.getItem("simonTheme") || "light"; // default light

// --- DOM Selectors ---
const h2 = document.querySelector("#status-text"); // Duo Speech bubble text
const levelVal = document.querySelector("#level-val"); // Level indicator in widgets
const highScoreVal = document.querySelector("#high-score-val"); // High score indicator in widgets
const footerActionBtn = document.querySelector("#start-btn"); // Reused for footers
const heartsContainer = document.querySelector("#hearts-container");
const progressBarFill = document.querySelector("#progress-bar-fill");
const duoOwl = document.querySelector("#duo-owl");
const gemsVal = document.querySelector("#gems-val");
const feedbackFooter = document.querySelector("#feedback-footer");
const footerMessage = document.querySelector("#footer-message");
const exitBtn = document.querySelector("#exit-btn");

// Navigation elements
const navItems = document.querySelectorAll(".nav-item");
const tabSections = document.querySelectorAll(".tab-section");
const viewAllQuestsBtn = document.querySelector(".view-all-link");

// Preferences settings elements
const soundBtn = document.querySelector("#sound-btn");
const soundIcon = document.querySelector("#sound-icon");
const soundText = document.querySelector("#sound-text");
const themeToggleBtn = document.querySelector("#theme-toggle-btn");

// Profile Stats Elements
const profileHighScore = document.querySelector("#profile-high-score");
const profileTotalXp = document.querySelector("#profile-total-xp");
const profileGamesPlayed = document.querySelector("#profile-games-played");

// --- Sound Frequencies ---
const frequencies = {
    yellow: 261.63, // C4 note
    red: 329.63,    // Z4 / E4 note
    purple: 440.00, // A4 note
    green: 392.00   // G4 note
};

let audioCtx = null;

// Initialize Audio Context lazily
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}

// Play synth tone helper
function playTone(freq, type = "sine", duration = 0.35) {
    if (!soundEnabled) return;
    try {
        initAudio();
        let osc = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        
        // Clean fade out to prevent popping noises
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
        console.error("Audio playback error:", e);
    }
}

// Duolingo-style Level Up Success Chime
function playSuccessSound() {
    if (!soundEnabled) return;
    try {
        initAudio();
        const now = audioCtx.currentTime;
        
        // Play rapid arpeggio chord (C5 -> E5 -> G5 -> C6)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, index) => {
            let osc = audioCtx.createOscillator();
            let gainNode = audioCtx.createGain();
            
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, now + (index * 0.08));
            
            gainNode.gain.setValueAtTime(0.15, now + (index * 0.08));
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + (index * 0.08) + 0.35);
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            osc.start(now + (index * 0.08));
            osc.stop(now + (index * 0.08) + 0.35);
        });
    } catch (e) {
        console.error("Audio success playback error:", e);
    }
}

// Short sad tone when a heart is lost
function playHeartLostSound() {
    if (!soundEnabled) return;
    try {
        initAudio();
        const now = audioCtx.currentTime;
        
        // E4 down to C4
        const notes = [329.63, 261.63];
        notes.forEach((freq, index) => {
            let osc = audioCtx.createOscillator();
            let gainNode = audioCtx.createGain();
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + (index * 0.15));
            
            gainNode.gain.setValueAtTime(0.2, now + (index * 0.15));
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + (index * 0.15) + 0.25);
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            osc.start(now + (index * 0.15));
            osc.stop(now + (index * 0.15) + 0.25);
        });
    } catch (e) {
        console.error("Audio heart lost playback error:", e);
    }
}

// Game Over slide-down buzzer
function playGameOverSound() {
    if (!soundEnabled) return;
    try {
        initAudio();
        let osc = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
        
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(160, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(70, audioCtx.currentTime + 0.6);
        
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
        console.error("Audio gameover playback error:", e);
    }
}

// --- Duo Mascot Expression Updates ---
function setDuoExpression(expr) {
    // Remove all layout classes
    duoOwl.classList.remove("neutral", "happy", "sad", "shocked");
    duoOwl.classList.add(expr);
}

function updateDuoSpeech(text) {
    h2.innerHTML = text;
}

// --- Hearts HUD System ---
function renderHearts() {
    let heartsStr = "";
    for (let i = 0; i < 3; i++) {
        if (i < hearts) {
            heartsStr += "❤️ ";
        } else {
            heartsStr += "💔 ";
        }
    }
    heartsContainer.innerHTML = heartsStr.trim();
    
    // Add micro-animation bounce effect
    heartsContainer.classList.add("heart-lost-pop");
    setTimeout(() => {
        heartsContainer.classList.remove("heart-lost-pop");
    }, 450);
}

// --- Sidebar Tab Navigation System ---
function initTabs() {
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetTab = item.getAttribute("data-tab");
            switchTab(targetTab);
        });
    });

    if (viewAllQuestsBtn) {
        viewAllQuestsBtn.addEventListener("click", () => {
            switchTab("quests");
        });
    }
}

function switchTab(tabName) {
    navItems.forEach(item => {
        if (item.getAttribute("data-tab") === tabName) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    tabSections.forEach(section => {
        if (section.id === `${tabName}-section`) {
            section.classList.add("active");
        } else {
            section.classList.remove("active");
        }
    });

    // Reset scroll offset
    const container = document.querySelector(".tab-content-container");
    if (container) container.scrollTop = 0;

    // Refresh display lists when entering tabs
    if (tabName === "leaderboard") {
        renderLeaderboard();
    } else if (tabName === "quests") {
        renderQuests();
    } else if (tabName === "profile") {
        updateProfileStats();
    }
}

// --- Light / Dark Mode Toggle ---
function initTheme() {
    if (theme === "dark") {
        document.body.classList.remove("light-theme");
        document.body.classList.add("dark-theme");
        if (themeToggleBtn) themeToggleBtn.innerHTML = "🌙 Dark Mode";
    } else {
        document.body.classList.remove("dark-theme");
        document.body.classList.add("light-theme");
        if (themeToggleBtn) themeToggleBtn.innerHTML = "☀️ Light Mode";
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            if (document.body.classList.contains("light-theme")) {
                theme = "dark";
                document.body.classList.replace("light-theme", "dark-theme");
                themeToggleBtn.innerHTML = "🌙 Dark Mode";
            } else {
                theme = "light";
                document.body.classList.replace("dark-theme", "light-theme");
                themeToggleBtn.innerHTML = "☀️ Light Mode";
            }
            localStorage.setItem("simonTheme", theme);
        });
    }
}

// --- Preferences Sound Settings ---
function initPreferences() {
    updateSoundBtnUI();

    if (soundBtn) {
        soundBtn.addEventListener("click", () => {
            soundEnabled = !soundEnabled;
            localStorage.setItem("simonSoundEnabled", soundEnabled);
            updateSoundBtnUI();
            if (soundEnabled) {
                playTone(392.00, "sine", 0.15); // soft beep confirmation
            }
        });
    }
}

function updateSoundBtnUI() {
    if (!soundBtn) return;
    if (soundEnabled) {
        soundBtn.classList.add("active");
        soundIcon.innerText = "🔊";
        soundText.innerText = "Sound On";
    } else {
        soundBtn.classList.remove("active");
        soundIcon.innerText = "🔇";
        soundText.innerText = "Sound Muted";
    }
}

// --- Profile Statistics Updating ---
function updateProfileStats() {
    if (profileHighScore) profileHighScore.innerText = highScore;
    if (profileTotalXp) profileTotalXp.innerText = gems; // Gems double as XP
    if (profileGamesPlayed) profileGamesPlayed.innerText = gamesPlayed;
}

// --- Dynamic Leaderboards Tab Bots System ---
function renderLeaderboard() {
    const listContainer = document.getElementById("leaderboard-list");
    if (!listContainer) return;

    // Define standard Duolingo names with static XP baselines
    let players = [
        { name: "Duo 🦉", xp: gems + 280, avatar: "🟢", self: false },
        { name: "Lily 👧", xp: 480, avatar: "🟣", self: false },
        { name: "Zari 👩", xp: 340, avatar: "💖", self: false },
        { name: "You (Student) 🦉", xp: gems, avatar: "🎓", self: true },
        { name: "Oscar 👨", xp: 190, avatar: "🟠", self: false },
        { name: "Junior 👦", xp: 90, avatar: "🟡", self: false }
    ];

    // Sort descending by XP score
    players.sort((a, b) => b.xp - a.xp);

    let html = "";
    players.forEach((player, index) => {
        const rank = index + 1;
        let rankEmoji = rank;
        if (rank === 1) rankEmoji = "🥇";
        else if (rank === 2) rankEmoji = "🥈";
        else if (rank === 3) rankEmoji = "🥉";

        html += `
            <div class="leaderboard-row ${player.self ? 'highlight-self' : ''}">
                <div class="row-rank">${rankEmoji}</div>
                <div class="row-avatar">${player.avatar}</div>
                <div class="row-name">${player.name}</div>
                <div class="row-xp">${player.xp} XP</div>
            </div>
        `;
    });

    listContainer.innerHTML = html;
}

// --- Dynamic Quests Tab System ---
function renderQuests() {
    const questsList = document.getElementById("quests-list");
    const widgetQuests = document.getElementById("widget-quests-list");
    if (!questsList) return;

    // Define three daily tasks and calculate progress
    const questData = [
        {
            title: "Earn 50 XP",
            desc: "Play games and match sequences to stack experience points",
            curr: gems,
            target: 50,
            reward: "15 💎",
            icon: "⚡",
            unit: "XP"
        },
        {
            title: "Reach Level 5",
            desc: "Challenge your memory to advance into deep levels",
            curr: highScore,
            target: 5,
            reward: "20 💎",
            icon: "👑",
            unit: "Lvl"
        },
        {
            title: "Perfect Completion",
            desc: "Finish a level without hitting any single error hearts",
            curr: perfectRun ? 1 : 0,
            target: 1,
            reward: "10 💎",
            icon: "🎯",
            unit: ""
        }
    ];

    let fullTabHtml = "";
    let tinyWidgetHtml = "";

    questData.forEach(q => {
        const percent = Math.min(100, Math.floor((q.curr / q.target) * 100));
        const isCompleted = percent >= 100;
        const progressStr = q.unit ? `${q.curr}/${q.target} ${q.unit}` : (isCompleted ? "Done" : "Pending");

        // Quests Tab Panel Card
        fullTabHtml += `
            <div class="quest-card ${isCompleted ? 'completed' : ''}">
                <div class="quest-icon">${q.icon}</div>
                <div class="quest-details">
                    <div class="quest-title">${q.title}</div>
                    <div class="quest-progress-wrap">
                        <div class="quest-progress-bg">
                            <div class="quest-progress-fill" style="width: ${percent}%;"></div>
                        </div>
                        <span class="quest-progress-text">${progressStr}</span>
                    </div>
                </div>
                <div class="quest-reward">${q.reward}</div>
            </div>
        `;

        // Tiny Widget Sidebar Panel Row
        tinyWidgetHtml += `
            <div class="widget-quest-item ${isCompleted ? 'completed' : ''}">
                <div class="widget-quest-header">
                    <span>${q.title}</span>
                    <span>${percent}%</span>
                </div>
                <div class="widget-quest-bar-bg">
                    <div class="widget-quest-bar-fill" style="width: ${percent}%;"></div>
                </div>
            </div>
        `;
    });

    questsList.innerHTML = fullTabHtml;
    if (widgetQuests) {
        widgetQuests.innerHTML = tinyWidgetHtml;
    }
}

// --- Lesson Bottom Footer States Handler ---
function updateFooter(state, msgHtml, btnText, btnCallback) {
    // Clear footer modifier classes
    feedbackFooter.classList.remove("state-correct", "state-incorrect");
    
    // Set dynamic HTML
    footerMessage.innerHTML = msgHtml;
    
    // Set button content
    footerActionBtn.innerText = btnText;
    footerActionBtn.className = "action-btn primary-action";
    
    // Bind click callback cleanly
    // Clone and replace button node to wipe all previous event listeners
    const newBtn = footerActionBtn.cloneNode(true);
    footerActionBtn.parentNode.replaceChild(newBtn, footerActionBtn);
    
    newBtn.addEventListener("click", () => {
        initAudio(); // Initialize audio context on click
        if (btnCallback) btnCallback();
    });

    if (state === "correct") {
        feedbackFooter.classList.add("state-correct");
    } else if (state === "incorrect") {
        feedbackFooter.classList.add("state-incorrect");
    }
}

// --- Start Game / Lesson Initialization ---
function startGame() {
    console.log("game is started");
    started = true;
    hearts = 3;
    level = 0;
    perfectRun = true;
    
    // Save lesson run stat count
    gamesPlayed++;
    localStorage.setItem("simonGamesPlayed", gamesPlayed);

    progressBarFill.style.width = "0%";
    renderHearts();
    
    // Cheerful starting C5 note
    playTone(523.25, "sine", 0.2); 
    
    setDuoExpression("neutral");
    updateDuoSpeech("Awesome! Let's start. Watch the sequence closely!");
    
    // Show loading text in footer while sequence generates
    updateFooter("idle", "<span class='footer-msg-desc'>Lesson in progress...</span>", "Running...", null);
    document.querySelector("#start-btn").disabled = true;

    setTimeout(levelUp, 1000);
}

// --- Simon Sequence Level Up ---
function levelUp() {
    userSeq = [];
    level++;
    
    // Update labels
    document.getElementById("level-val").innerText = level;

    // Reset progress bar back to 0% for the new level
    progressBarFill.style.width = "0%";
    
    setDuoExpression("neutral");
    updateDuoSpeech(`Level ${level}! Watch Simon Says...`);
    
    // Disable clicks during playing demo
    document.querySelector("#simon-btn-grid").classList.add("simon-turn-active");
    updateFooter("idle", "<span class='footer-msg-desc'>Observe the pattern!</span>", "Watching...", null);
    const watchBtn = document.querySelector("#start-btn");
    if (watchBtn) watchBtn.disabled = true;

    // Select random color pad (0-3 index)
    let randIdx = Math.floor(Math.random() * 4); 
    let randColor = btns[randIdx];
    gameSeq.push(randColor);
    console.log("Game sequence:", gameSeq);

    // Playback sequence to player
    playFullSequence();
}

// --- Sequential playback of completed pattern ---
function playFullSequence() {
    let delay = 0;
    
    gameSeq.forEach((color, index) => {
        setTimeout(() => {
            let currentBtn = document.querySelector(`#${color}`);
            gameFlash(currentBtn);
            playTone(frequencies[color]);
            
            // On playing last index, hand control back to the user
            if (index === gameSeq.length - 1) {
                setTimeout(() => {
                    setDuoExpression("neutral");
                    updateDuoSpeech("Your turn! Repeat the pattern.");
                    document.querySelector("#simon-btn-grid").classList.remove("simon-turn-active");
                    
                    // Allow input and set footer message
                    updateFooter("idle", "<span class='footer-msg-desc'>Tap the pads in order!</span>", "Tap Pads", null);
                    const tapBtn = document.querySelector("#start-btn");
                    if (tapBtn) tapBtn.disabled = true;
                }, 500);
            }
        }, delay);
        delay += 600;
    });
}

// Simon's pad flash illumination
function gameFlash(btn) {
    btn.classList.add("flash");
    setTimeout(() => {
        btn.classList.remove("flash");
    }, 300);
}

// User click flash visual feedback
function userFlash(btn) {
    btn.classList.add("userflash");
    setTimeout(() => {
        btn.classList.remove("userflash");
    }, 200);
}

// --- Core Check Answer Match Logic ---
function checkAns(idx) {
    const clickedColor = userSeq[idx];
    const targetColor = gameSeq[idx];

    if (clickedColor === targetColor) {
        // Sequence correct so far, calculate partial level progress percentage
        const progressPercent = Math.floor((userSeq.length / gameSeq.length) * 100);
        progressBarFill.style.width = `${progressPercent}%`;

        // If complete sequence successfully repeated
        if (userSeq.length === gameSeq.length) {
            playSuccessSound();
            setDuoExpression("happy");
            
            // Add +10 Gems/XP points
            gems += 10;
            localStorage.setItem("simonGems", gems);
            gemsVal.innerText = gems;
            updateProfileStats();

            // Check High Score updates
            if (level > highScore) {
                highScore = level;
                localStorage.setItem("simonHighScore", highScore);
                highScoreVal.innerText = highScore;
                updateProfileStats();
            }

            // Sync Leaderboard rankings and Quests
            renderLeaderboard();
            renderQuests();

            // Slide up correct feedback footer
            const successMsg = `
                <div class="footer-message">
                    <span class="footer-msg-icon">✨</span>
                    <div>
                        <div class="footer-msg-title">Awesome! Level completed!</div>
                        <div class="footer-msg-desc">+10 XP earned! Ready for next level?</div>
                    </div>
                </div>
            `;
            updateFooter("correct", successMsg, "CONTINUE", levelUp);
        }
    } else {
        // Mistake hit: deplete heart
        hearts--;
        perfectRun = false;
        renderHearts();

        // Check if user still has hearts left
        if (hearts > 0) {
            playHeartLostSound();
            setDuoExpression("sad");
            
            // Lock grid interactions
            document.querySelector("#simon-btn-grid").classList.add("simon-turn-active");

            // Red mistake slide-up footer with retry option
            const heartMsg = `
                <div class="footer-message">
                    <span class="footer-msg-icon">💔</span>
                    <div>
                        <div class="footer-msg-title">Oh no! Heart lost!</div>
                        <div class="footer-msg-desc">Incorrect color clicked. ${hearts} heart(s) left!</div>
                    </div>
                </div>
            `;
            updateFooter("incorrect", heartMsg, "TRY LEVEL AGAIN", retryLevel);
        } else {
            // No hearts left: Game Over
            playGameOverSound();
            setDuoExpression("shocked");
            
            // Lock grid interactions
            document.querySelector("#simon-btn-grid").classList.add("simon-turn-active");

            // Check if high score was updated
            if (level > highScore) {
                highScore = level;
                localStorage.setItem("simonHighScore", highScore);
                highScoreVal.innerText = highScore;
                updateProfileStats();
            }

            renderLeaderboard();
            renderQuests();

            const gameOverMsg = `
                <div class="footer-message">
                    <span class="footer-msg-icon">🦉</span>
                    <div>
                        <div class="footer-msg-title">Lesson Over!</div>
                        <div class="footer-msg-desc">You completed ${level - 1} level(s). High Score: ${highScore}.</div>
                    </div>
                </div>
            `;
            updateFooter("incorrect", gameOverMsg, "START NEW LESSON", resetGame);
        }
    }
}

// --- Retry current level sequence (heart remaining) ---
function retryLevel() {
    userSeq = [];
    progressBarFill.style.width = "0%";
    setDuoExpression("neutral");
    updateDuoSpeech("Let's try that sequence again. You got this!");

    // Disable clicks during playing demo
    document.querySelector("#simon-btn-grid").classList.add("simon-turn-active");
    updateFooter("idle", "<span class='footer-msg-desc'>Observe the pattern!</span>", "Watching...", null);
    const watchBtn = document.querySelector("#start-btn");
    if (watchBtn) watchBtn.disabled = true;

    setTimeout(playFullSequence, 1000);
}

// --- Simon Pad Button Press Callback ---
function btnPress() {
    // If not started, ignore input clicks
    if (!started) return;

    let btn = this;
    userFlash(btn);
    let userColor = btn.getAttribute("id");
    
    playTone(frequencies[userColor]);
    userSeq.push(userColor);
    
    checkAns(userSeq.length - 1);
}

// --- Reset / Clear Game State ---
function resetGame() {
    started = false;
    gameSeq = [];
    userSeq = [];
    level = 0;
    hearts = 3;
    perfectRun = true;

    progressBarFill.style.width = "0%";
    renderHearts();
    setDuoExpression("neutral");
    updateDuoSpeech("Hi! I am Simon! Click <strong>Start Game</strong> or press <strong>Enter</strong> to challenge your memory!");

    document.querySelector("#simon-btn-grid").classList.remove("simon-turn-active");

    // Standard start footer state
    const welcomeMsg = `<span class='footer-msg-desc'>Ready to train your memory?</span>`;
    updateFooter("idle", welcomeMsg, "START GAME", startGame);
}

// --- Quit Lesson / Reset to Dashboard ---
function exitLesson() {
    if (confirm("Are you sure you want to quit the current lesson? Your progress for this run will be lost!")) {
        resetGame();
    }
}

// --- Keyboard Shortcuts & Accessibility Controls ---
function initKeyboardShortcuts() {
    document.addEventListener("keydown", function (event) {
        // If user presses Enter
        if (event.key === "Enter") {
            const primaryBtn = document.querySelector("#start-btn");
            // Trigger action only if start button is not disabled
            if (primaryBtn && !primaryBtn.disabled) {
                primaryBtn.click();
            }
        }
        
        // Match numbers 1, 2, 3, 4 with Simon pads (only when game is active)
        if (started && !document.querySelector("#simon-btn-grid").classList.contains("simon-turn-active")) {
            let keyColor = null;
            if (event.key === "1") keyColor = "yellow";
            else if (event.key === "2") keyColor = "red";
            else if (event.key === "3") keyColor = "purple";
            else if (event.key === "4") keyColor = "green";

            if (keyColor) {
                const btnNode = document.getElementById(keyColor);
                if (btnNode) btnNode.click();
            }
        }
    });
}

// --- Initialize App Page Elements ---
document.addEventListener("DOMContentLoaded", () => {
    // Initial stat readouts in headers/widgets
    gemsVal.innerText = gems;
    highScoreVal.innerText = highScore;
    document.getElementById("level-val").innerText = level;

    // Set theme and settings
    initTheme();
    initPreferences();
    updateProfileStats();

    // Hook listeners
    initTabs();
    initKeyboardShortcuts();

    // Map pad listener clicks
    let allBtns = document.querySelectorAll(".btn");
    for (let btn of allBtns) {
        btn.addEventListener("click", btnPress);
    }

    if (exitBtn) {
        exitBtn.addEventListener("click", exitLesson);
    }

    // Set initial Leaderboard ranks and Quest lists
    renderLeaderboard();
    renderQuests();

    // Render original hearts state
    renderHearts();

    // Standard start footer state
    const welcomeMsg = `<span class='footer-msg-desc'>Ready to train your memory?</span>`;
    updateFooter("idle", welcomeMsg, "START GAME", startGame);
});