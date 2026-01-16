const engine = new AudioEngine();

// --- Notes Frequencies ---
const notes = {
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
    'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25,
    'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99
};

// --- Configs ---
const row1Keys = ['a', 'z', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
const row1Notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];

const row2Keys = ['q', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm'];
const row2Notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];

const specificDrumKeys = {
    'w': 'kick', 'x': 'snare', 'c': 'hihat', 'v': 'openhat',
    'b': 'tom1', 'n': 'crash', ' ': 'kick', 'enter': 'crash'
};
const randomDrumSounds = ['kick', 'snare', 'hihat', 'tom1', 'tom2', 'clap', 'cowbell', 'ride', 'crash'];

// --- State ---
let isLocked = false;
let instRow1 = 'piano';
let instRow2 = 'guitar';

// --- Lock Handling ---
const lockBtn = document.getElementById('lock-btn');
const lockTrap = document.getElementById('lock-trap');

if (lockBtn) lockBtn.addEventListener('click', toggleLock);
if (lockTrap) lockTrap.addEventListener('click', () => enterFullscreen());

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && isLocked) {
        if (lockTrap) lockTrap.style.display = 'flex';
    } else if (document.fullscreenElement && isLocked) {
        if (lockTrap) lockTrap.style.display = 'none';
        document.body.focus();
    }
});

function toggleLock() {
    isLocked = !isLocked;
    const body = document.body;
    const btn = document.getElementById('lock-btn');
    if (isLocked) {
        body.classList.add('locked');
        btn.innerHTML = '🔒';
        btn.classList.add('locked-state');
        enterFullscreen();
    } else {
        body.classList.remove('locked');
        btn.innerHTML = '🔓';
        btn.classList.remove('locked-state');
        if (lockTrap) lockTrap.style.display = 'none';
        exitFullscreen();
    }
}
function enterFullscreen() {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(err => console.log(err));
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
}
function exitFullscreen() {
    if (document.fullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
}

// --- Instrument Selection ---
function selectInstrument(row, name) {
    if (row === 1) instRow1 = name;
    if (row === 2) instRow2 = name;

    // Update UI for that specific list
    const container = document.getElementById(`bar-row-${row}`);
    if (container) {
        container.querySelectorAll('.inst-icon').forEach(el => {
            el.classList.remove('active');
            if (el.dataset.inst === name) el.classList.add('active');
        });
    }

    engine.resume();
    // Play a preview note
    engine.playInstrument(name, 440, 0.2);
}

// Bind Listeners for both bars
document.querySelectorAll('.inst-icon').forEach(icon => {
    icon.addEventListener('click', (e) => {
        e.stopPropagation();
        const row = parseInt(icon.parentElement.dataset.row); // get row from parent
        selectInstrument(row, icon.dataset.inst);
    });
    icon.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const row = parseInt(icon.parentElement.dataset.row);
        selectInstrument(row, icon.dataset.inst);
    });
});


// --- Interaction Logic ---
function triggerAction(source, value, element) {
    engine.resume();

    // Determine Instrument
    if (source === 'row1') {
        engine.playInstrument(instRow1, notes[value]);
    } else if (source === 'row2') {
        engine.playInstrument(instRow2, notes[value]);
    } else if (source === 'drum') {
        engine.playDrum(value);
    }

    // Visuals
    if (element) {
        element.classList.add('active');
        createSparkles(element);
        setTimeout(() => element.classList.remove('active'), 150);
    }
}

// --- Input Handling ---
document.addEventListener('keydown', (e) => {
    if (isLocked) { e.preventDefault(); e.stopPropagation(); }
    if (e.repeat) return;

    const key = e.key.toLowerCase();

    // 1. Top Row
    const pIndex = row1Keys.indexOf(key);
    if (pIndex !== -1) {
        const note = row1Notes[pIndex];
        const el = document.querySelector(`.key[data-row="1"][data-note="${note}"]`);
        triggerAction('row1', note, el);
        return;
    }

    // 2. Mid Row
    const tIndex = row2Keys.indexOf(key);
    if (tIndex !== -1) {
        const note = row2Notes[tIndex];
        const el = document.querySelector(`.key[data-row="2"][data-note="${note}"]`);
        triggerAction('row2', note, el);
        return;
    }

    // 3. Drums
    if (specificDrumKeys[key]) {
        const sound = specificDrumKeys[key];
        const el = document.querySelector(`.key[data-row="3"][data-sound="${sound}"]`);
        triggerAction('drum', sound, el);
        return;
    }

    // 4. Random Drum
    const randSound = randomDrumSounds[Math.floor(Math.random() * randomDrumSounds.length)];
    const drumPads = document.querySelectorAll(`.key[data-row="3"]`);
    const randomPad = drumPads[Math.floor(Math.random() * drumPads.length)];
    triggerAction('drum', randSound, randomPad);
});

function attachListeners() {
    document.querySelectorAll('.key').forEach(el => {
        const handle = (e) => {
            e.preventDefault();
            const row = el.dataset.row;
            let type = 'drum';
            if (row === '1') type = 'row1';
            if (row === '2') type = 'row2';

            const noteOrSound = el.dataset.note || el.dataset.sound;
            triggerAction(type, noteOrSound, el);
        };
        el.addEventListener('mousedown', handle);
        el.addEventListener('touchstart', handle);
    });
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', attachListeners); }
else { attachListeners(); }


// --- Visual Effects ---
function createSparkles(element) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    for (let i = 0; i < 8; i++) {
        const sparkle = document.createElement('div');
        Object.assign(sparkle.style, {
            position: 'fixed', left: centerX + 'px', top: centerY + 'px',
            width: '12px', height: '12px', borderRadius: '50%',
            backgroundColor: getRandomColor(), pointerEvents: 'none',
            transition: 'transform 0.4s ease-out, opacity 0.4s',
            zIndex: 9999
        });
        document.body.appendChild(sparkle);
        const angle = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 60;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        sparkle.getBoundingClientRect();
        sparkle.style.transform = `translate(${tx}px, ${ty}px) scale(0)`;
        sparkle.style.opacity = '0';
        setTimeout(() => sparkle.remove(), 400);
    }
}
function getRandomColor() {
    const colors = ['#FDA7DF', '#D980FA', '#12CBC4', '#A3CB38', '#FFC312', '#ffffff'];
    return colors[Math.floor(Math.random() * colors.length)];
}
