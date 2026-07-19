let gameSeq = [];
let userSeq = [];
let btns = ["yellow", "red", "purple", "green"]; // Charo colors ka array

let h2 = document.querySelector("#status-text"); // Status bar text update krne ke liye
let levelVal = document.querySelector("#level-val"); // Level score update krne ke liye
let highScoreVal = document.querySelector("#high-score-val"); // High score element
let startBtn = document.querySelector("#start-btn"); // Mobile start button
let soundBtn = document.querySelector("#sound-btn"); // Sound toggle button
let soundIcon = document.querySelector("#sound-icon"); // Sound icon element
let soundText = document.querySelector("#sound-text"); // Sound text element
let gameContainer = document.querySelector("#game-container"); // Container shake animation ke liye

let started = false;
let level = 0;
let highScore = localStorage.getItem("simonHighScore") || 0; // Local storage se high score read kiya
highScoreVal.innerText = highScore; // High score UI par dikhayenge

// Web Audio API config for game sounds
let audioCtx = null;
let soundEnabled = true;

// Sound frequencies har button ke liye (standard musical tones)
const frequencies = {
    yellow: 261.63, // C4 note
    red: 329.63,    // E4 note
    purple: 440.00, // A4 note
    green: 392.00   // G4 note
};

// Web Audio API lazily initialization logic (Browser restriction ke karan user action ke bad init hota hai)
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Sound play krne ka utility function
function playTone(freq, type = "sine", duration = 0.35) {
    if (!soundEnabled) return;
    initAudio();
    
    // Nodes create krenge oscillator or gain nodes
    let osc = audioCtx.createOscillator();
    let gainNode = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    // Smooth volume fade-out simulation to avoid clicking noise
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// Error tone for Game Over (sliding frequency buzz)
function playGameOverSound() {
    if (!soundEnabled) return;
    initAudio();
    
    let osc = audioCtx.createOscillator();
    let gainNode = audioCtx.createGain();
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(160, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(70, audioCtx.currentTime + 0.6); // slide down freq
    
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
}

// Start Game trigger logic (Enter keypress ya direct keypress par start)
document.addEventListener("keypress", function (event) {
    // Agar game abhi start nahi hua aur enter/koi aur key dabayi toh
    if (started == false) {
        startGame();
    }
});

// Click interface mobile user ke liye
startBtn.addEventListener("click", function () {
    if (started == false) {
        startGame();
    }
});

// Sound button toggle behavior control
soundBtn.addEventListener("click", function () {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
        soundIcon.innerText = "🔊";
        soundText.innerText = "Sound On";
        playTone(392.00, "sine", 0.15); // visual status notification audio
    } else {
        soundIcon.innerText = "🔇";
        soundText.innerText = "Sound Muted";
    }
});

// Start button and state initializing
function startGame() {
    console.log("game is started");
    started = true;
    startBtn.innerText = "Running...";
    startBtn.disabled = true;
    
    // Cheerful starting note
    playTone(523.25, "sine", 0.2); // C5 sound
    setTimeout(levelUp, 600);
}

// Simon ki selection flash animation
function gameFlash(btn) {
    btn.classList.add("flash"); // flash class css overlay add
    setTimeout(function () {
        btn.classList.remove("flash");
    }, 250);
}

// User click selection action animation
function userFlash(btn) {
    btn.classList.add("userflash"); // user click trigger userflash
    setTimeout(function () {
        btn.classList.remove("userflash");
    }, 200);
}

// Level validation and increment
function levelUp() {
    userSeq = []; // user seq ko khali krenge or reset karenge
    level++;
    levelVal.innerText = level; // update current progress level in UI
    
    h2.innerHTML = `Simon's Turn <span class="accent">...</span>`;
    document.querySelector(".btn-container").classList.add("simon-turn-active"); // Disable clicks during demo

    // Math.random() * 4 kia hai jisse 0-3 range mile (green pad includes index 3)
    let randIdx = Math.floor(Math.random() * 4); 
    let randColor = btns[randIdx];
    let randBtn = document.querySelector(`#${randColor}`);
    
    gameSeq.push(randColor);
    console.log("Game sequence:", gameSeq);

    // Poore sequence ko dubara play krenge sequence demo me
    playFullSequence();
}

// Sequential playback of complete pattern to user
function playFullSequence() {
    let delay = 0;
    
    gameSeq.forEach((color, index) => {
        setTimeout(() => {
            let currentBtn = document.querySelector(`#${color}`);
            gameFlash(currentBtn);
            playTone(frequencies[color]);
            
            // Pattern print khatam hone pr control wapas user ko do
            if (index === gameSeq.length - 1) {
                setTimeout(() => {
                    h2.innerHTML = `Your Turn <span class="accent">!</span>`;
                    document.querySelector(".btn-container").classList.remove("simon-turn-active"); // Input click open
                }, 400);
            }
        }, delay);
        delay += 600; // interval gap elements me pattern ke dauran
    });
}

// Check game answer logic input
function checkAns(idx) {
    if (userSeq[idx] === gameSeq[idx]) {
        // Pattern matches so far. Verify full pattern progress
        if (userSeq.length === gameSeq.length) {
            setTimeout(levelUp, 1000);
        }
    } else {
        // Game Over triggers here
        h2.innerHTML = `Game Over! Score was <span class="accent">${level}</span>.<br>Press any key or Start to reset.`;
        
        // Storing High Score in local storage
        if (level > highScore) {
            highScore = level;
            localStorage.setItem("simonHighScore", highScore);
            highScoreVal.innerText = highScore;
            highScoreVal.parentElement.classList.add("highlight"); // Glow high score badge
        }

        // Error notification effects
        playGameOverSound();
        
        // Red flash and card shake screen visuals
        document.querySelector("body").classList.add("red-flash-bg");
        gameContainer.classList.add("game-over-shake");
        
        setTimeout(function () {
            document.querySelector("body").classList.remove("red-flash-bg");
        }, 300);
        
        setTimeout(function () {
            gameContainer.classList.remove("game-over-shake");
        }, 500);

        reset();
    }
}

// User click handler callback function
function btnPress() {
    let btn = this;
    
    // User response control block
    userFlash(btn);
    let userColor = btn.getAttribute("id");
    
    playTone(frequencies[userColor]); // user clicks has distinct audio
    userSeq.push(userColor);
    
    checkAns(userSeq.length - 1); // last entry verification check
}

// All Simon buttons callback registers
let allBtns = document.querySelectorAll(".btn");
for (let btn of allBtns) {
    btn.addEventListener("click", btnPress); // sab btns ko callback add kiya
}

// Reset variables on game failure
function reset() {
    started = false;
    gameSeq = [];
    userSeq = [];
    level = 0;
    
    startBtn.innerText = "Start Game";
    startBtn.disabled = false;
    document.querySelector(".btn-container").classList.remove("simon-turn-active");
}