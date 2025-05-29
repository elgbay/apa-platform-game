// engine.js
import { levelsConfig } from './levels.js';
import * as UI from './ui.js';

// --- DOM Element References ---
const gameArea = document.getElementById('game-area');
const player = document.getElementById('player');
const groundContainer = document.getElementById('ground-container');
const groundSegment = groundContainer ? groundContainer.querySelector('.ground-segment') : null;
const portal = document.getElementById('portal');
const allBlockElementsFromHTML = [];
for (let i = 1; i <= 8; i++) {
    allBlockElementsFromHTML.push(document.getElementById(`block-${i}`));
}
const allEnemyElementsFromHTML = [];
for (let i = 1; i <= 6; i++) {
    const enemyEl = document.getElementById(`enemy-${i}`);
    if (enemyEl) allEnemyElementsFromHTML.push(enemyEl);
}
const allCometElementsFromHTML = [];
for (let i = 1; i <= 4; i++) {
    const cometEl = document.getElementById(`comet-${i}`);
    if (cometEl) allCometElementsFromHTML.push(cometEl);
}

if (!gameArea) console.error("ENGINE FATAL: gameArea element not found!");
if (!player) console.error("ENGINE FATAL: player element not found!");
if (!groundSegment) console.error("ENGINE FATAL: groundSegment element not found!");
if (!portal) console.error("ENGINE FATAL: portal element not found!");

// === Web Audio API Sound Setup ===
let audioCtx = null;
function initAudio() {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') {
                audioCtx.resume().catch(err => console.error("Error resuming initial AudioContext:", err));
            }
        } catch (e) {
            console.error("ENGINE: Web Audio API is not supported or could not be initialized.", e);
            audioCtx = null;
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(err => console.error("Error resuming AudioContext in initAudio:", err));
    }
}

function playSound(type) {
    if (!audioCtx || audioCtx.state !== 'running') {
        if (audioCtx && audioCtx.state === 'suspended') {
             audioCtx.resume().catch(err => console.error("Error resuming audio context on play:", err));
        }
        if (!audioCtx || audioCtx.state !== 'running') {
            return;
        }
    }

    let oscillatorType = 'sine';
    let frequency = 440;
    let duration = 0.1;
    let gainValue = 0.3;
    let attackTime = 0.005;
    let decayTime = duration * 0.9;

    switch (type) {
        case 'jump': oscillatorType = 'triangle'; frequency = 500; gainValue = 0.15; duration = 0.15; decayTime = 0.1; break;
        case 'land': oscillatorType = 'square'; frequency = 100; gainValue = 0.25; duration = 0.1; decayTime = 0.08; break;
        case 'blockHit': oscillatorType = 'square'; frequency = 220; gainValue = 0.3; duration = 0.08; decayTime = 0.07; break;
        case 'stomp': oscillatorType = 'noise'; gainValue = 0.35; duration = 0.15; decayTime = 0.12; break;
        case 'playerHit': oscillatorType = 'sawtooth'; frequency = 160; gainValue = 0.35; duration = 0.3; decayTime = 0.25; break;
        case 'correct': oscillatorType = 'sine'; frequency = 700; gainValue = 0.25; duration = 0.2; decayTime = 0.18; break;
        case 'incorrect': oscillatorType = 'square'; frequency = 120; gainValue = 0.25; duration = 0.3; decayTime = 0.28; break;
        case 'cometGroundHit': oscillatorType = 'noise'; frequency = 80; gainValue = 0.2; duration = 0.2; decayTime = 0.18; break;
        case 'levelComplete': oscillatorType = 'triangle'; frequency = 880; gainValue = 0.3; duration = 0.5; decayTime = 0.4; break;
        case 'fail': oscillatorType = 'sawtooth'; frequency = 90; gainValue = 0.3; duration = 0.4; decayTime = 0.35; break;
        default: console.warn(`SOUND: Unknown sound type '${type}'`); return;
    }

    const now = audioCtx.currentTime;
    const gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(gainValue, now + attackTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + attackTime + decayTime);

    if (oscillatorType === 'noise') {
        const bufferSize = Math.floor(audioCtx.sampleRate * duration);
        if (bufferSize <= 0) { console.warn("SOUND: Invalid buffer size for noise."); return; }
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
        const noiseSource = audioCtx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.connect(gainNode);
        noiseSource.start(now);
        noiseSource.stop(now + duration + 0.01);
    } else {
        const oscillator = audioCtx.createOscillator();
        oscillator.type = oscillatorType;
        oscillator.frequency.setValueAtTime(frequency, now);
        if (type === 'playerHit') oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, now + duration * 0.8);
        if (type === 'jump') oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.8, now + duration * 0.6);
        if (type === 'correct') oscillator.frequency.setValueAtTime(frequency * 1.25, now + duration * 0.05);
        if (type === 'levelComplete') {
            oscillator.frequency.setValueAtTime(frequency * 0.8, now);
            oscillator.frequency.linearRampToValueAtTime(frequency * 1.2, now + duration * 0.4);
            oscillator.frequency.linearRampToValueAtTime(frequency * 1.5, now + duration);
        }
        oscillator.connect(gainNode);
        oscillator.start(now);
        oscillator.stop(now + duration + 0.01);
    }
}

// --- Game Settings & State ---
let currentScreenWidth = 700;
let currentScreenHeight = 400;
const defaultNumScreens = 4;
let worldWidth = currentScreenWidth * defaultNumScreens;
const playerWidth = 30;
const playerHeight = 20;
const playerSpeed = 4;
const jumpForce = 12;
const gravity = 0.6;
const groundHeight = 50; const groundSurfaceY = groundHeight;
let playerWorldX = 50, playerWorldY = groundSurfaceY;
let playerVelX = 0, playerVelY = 0;
let onGround = true;
let interactionPaused = false;
let gameActuallyPaused = false;

let currentLevelIndex = 0;
let levelScores = [];
let correctAnswers = 0;
let squashedAliens = 0;
let currentLevelTotalBlocks = 0;
let cameraX = 0;
const cameraScrollMarginBase = 1 / 3;
let cameraScrollMargin = currentScreenWidth * cameraScrollMarginBase;
const keysPressed = {};
const DEBUG_START_LEVEL_INDEX = 0;
let currentLevelQuestionObjects = [];
let currentLevelEnemyObjects = [];
let currentLevelComets = [];
let nextCometSpawnTime = 0;
let currentLevelCometParams = null;
let currentPortalWorldX, portalWorldY;
let currentQuizDataFromEngine = null; // This will hold qData including its .el property
let currentBlockElementHitByPlayer = null;

// --- Collision Helper Functions ---
function getBoundingRectForGameObject(element, worldX, worldY) {
    if (!element) return { left: 0, bottom: 0, right: 0, top: 0, width: 0, height: 0 };
    const width = element.offsetWidth || parseInt(element.style.width) || (element.id && element.id.includes('comet') ? 25 : (element.id === 'player' ? playerWidth : 30) );
    const height = element.offsetHeight || parseInt(element.style.height) || (element.id && element.id.includes('comet') ? 25 : (element.id === 'player' ? playerHeight : 30) );
    return { left: worldX, bottom: worldY, right: worldX + width, top: worldY + height, width: width, height: height };
}

function checkCollision(rect1, rect2) {
    if (!rect1 || !rect2 || rect1.width === 0 || rect2.width === 0) return false;
    return rect1.left < rect2.right && rect1.right > rect2.left && rect1.bottom < rect2.top && rect1.top > rect2.bottom;
}

// --- Core Game Logic Functions ---
function startNewGame() {
    currentLevelIndex = DEBUG_START_LEVEL_INDEX;
    levelScores = levelsConfig.map(_ => ({ questions: 0, aliens: 0 }));
    UI.uiResetUIForNewLevel();
    loadLevel(currentLevelIndex);
}

function loadLevel(levelIdx) {
    gameActuallyPaused = true;
    currentScreenWidth = gameArea.offsetWidth || 700;
    currentScreenHeight = gameArea.offsetHeight || 400;
    cameraScrollMargin = currentScreenWidth * cameraScrollMarginBase;

    const config = levelsConfig[levelIdx];
    if (!config) {
        console.error(`ENGINE: Invalid level config for index ${levelIdx}. Cannot load level.`);
        gameActuallyPaused = false;
        return;
    }
    currentLevelIndex = levelIdx;

    UI.uiUpdateLevelDisplay(config.levelNumber);
    UI.uiUpdateInstructions(config.instructions);

    worldWidth = currentScreenWidth * (config.numScreens || defaultNumScreens);
    if (groundSegment) groundSegment.style.width = worldWidth + 'px';

    cameraX = 0; playerWorldX = 100; playerWorldY = groundSurfaceY;
    playerVelX = 0; playerVelY = 0; onGround = true;
    Object.keys(keysPressed).forEach(key => { keysPressed[key] = false; });

    correctAnswers = 0; squashedAliens = 0;
    currentLevelTotalBlocks = config.questions.length;
    UI.uiUpdateScoreDisplays(correctAnswers, currentLevelTotalBlocks, squashedAliens);

    currentLevelQuestionObjects = JSON.parse(JSON.stringify(config.questions));
    currentLevelQuestionObjects.forEach((qData, index) => {
        const blockEl = allBlockElementsFromHTML[index];
        if (blockEl) {
            qData.el = blockEl; // DOM element is attached here to the question data copy
            blockEl.style.display = 'flex';
            blockEl.classList.remove('hit', 'correct', 'incorrect');
            blockEl.innerHTML = '?';
            qData.done = false;
        }
    });
    allBlockElementsFromHTML.forEach(blockEl => {
         if (blockEl && !currentLevelQuestionObjects.some(q => q.el === blockEl)) blockEl.style.display = 'none';
    });

    currentLevelEnemyObjects = [];
    (config.enemies || []).forEach((enemyConfig) => {
        let enemyEl = document.getElementById(enemyConfig.htmlId);
        if (enemyEl) {
            enemyEl.style.display = 'flex'; enemyEl.textContent = '👾';
            currentLevelEnemyObjects.push({
                el: enemyEl, worldX: enemyConfig.worldX, originalX: enemyConfig.worldX,
                worldY: groundSurfaceY, speed: enemyConfig.speed, dir: enemyConfig.dir,
                range: enemyConfig.range, defeated: false,
                width: enemyEl.offsetWidth || 30, height: enemyEl.offsetHeight || 30
            });
        } else console.warn(`ENGINE: Enemy DOM element (htmlId: ${enemyConfig.htmlId}) not found.`);
    });
    allEnemyElementsFromHTML.forEach(enemyEl => {
        if (enemyEl && !currentLevelEnemyObjects.some(e => e.el === enemyEl)) enemyEl.style.display = 'none';
    });

    currentLevelCometParams = null;
    let tempCometPool = [];
    allCometElementsFromHTML.forEach(cometEl => { if(cometEl) cometEl.style.display = 'none'; });
    if (config.cometParams) {
        currentLevelCometParams = config.cometParams;
        for(let i = 0; i < Math.min(currentLevelCometParams.maxActive, allCometElementsFromHTML.length); i++) {
            const cometEl = allCometElementsFromHTML[i];
            if (cometEl) tempCometPool.push({
                el: cometEl, worldX: 0, worldY: 0, velocityY: 0, isActive: false,
                width: cometEl.offsetWidth || 25, height: cometEl.offsetHeight || 25
            });
            else console.warn(`ENGINE: Comet DOM element comet-${i+1} not found for pooling.`);
        }
        setNextCometSpawnTime();
    }
    currentLevelComets = tempCometPool;

    if (portal) {
        currentPortalWorldX = worldWidth - 150; portalWorldY = groundSurfaceY;
        portal.textContent = config.portalText || "Portal"; portal.style.display = 'flex';
    }
    if (document.activeElement) document.activeElement.blur();
    gameActuallyPaused = false; interactionPaused = false;
}

function setNextCometSpawnTime() {
    if (!currentLevelCometParams) return;
    const { spawnIntervalMin, spawnIntervalMax } = currentLevelCometParams;
    nextCometSpawnTime = Date.now() + (Math.random() * (spawnIntervalMax - spawnIntervalMin) + spawnIntervalMin);
}

function trySpawnComet() {
    if (!currentLevelCometParams || Date.now() < nextCometSpawnTime || interactionPaused) return;
    let spawned = false;
    for (let comet of currentLevelComets) {
        if (comet.el && !comet.isActive) {
            comet.isActive = true;
            comet.worldX = cameraX + (Math.random() * currentScreenWidth * 0.9) + (currentScreenWidth * 0.05);
            comet.worldY = currentScreenHeight + 20 + (Math.random() * 30);
            comet.velocityY = Math.random() * (currentLevelCometParams.speedMax - currentLevelCometParams.speedMin) + currentLevelCometParams.speedMin;
            comet.el.style.display = 'block';
            comet.width = comet.el.offsetWidth || 25; comet.height = comet.el.offsetHeight || 25;
            spawned = true; break;
        }
    }
    if (spawned) setNextCometSpawnTime(); else nextCometSpawnTime = Date.now() + 500;
}

function updateComets() {
    if (!currentLevelCometParams) return;
    trySpawnComet();
    currentLevelComets.forEach(comet => {
        if (comet.isActive && comet.el) {
            comet.worldY -= comet.velocityY;
            if (comet.worldY <= groundSurfaceY) {
                comet.isActive = false; comet.el.style.display = 'none'; playSound('cometGroundHit');
            } else if (comet.worldY < -(comet.height || 25)) {
                comet.isActive = false; comet.el.style.display = 'none';
            }
        }
    });
}

function handlePlayerInput() {
    playerVelX = 0;
    if (!interactionPaused) {
        if (keysPressed['ArrowLeft'] || keysPressed['KeyA']) playerVelX = -playerSpeed;
        if (keysPressed['ArrowRight'] || keysPressed['KeyD']) playerVelX = playerSpeed;
        if ((keysPressed['Space'] || keysPressed['ArrowUp'] || keysPressed['KeyW']) && onGround) {
            playerVelY = jumpForce; onGround = false; playSound('jump');
        }
    }
}

function updatePlayer() {
    playerWorldX += playerVelX;
    if (!onGround) { playerVelY -= gravity; playerWorldY += playerVelY; }
    if (playerWorldY <= groundSurfaceY) {
        playerWorldY = groundSurfaceY;
        if (playerVelY < 0 && !onGround) playSound('land');
        playerVelY = 0; onGround = true;
    }
    const effectivePlayerWidth = player.offsetWidth || playerWidth;
    if (playerWorldX < 0) playerWorldX = 0;
    if (playerWorldX + effectivePlayerWidth > worldWidth) playerWorldX = worldWidth - effectivePlayerWidth;
}

function updateEnemies() {
    currentLevelEnemyObjects.forEach(enemy => {
        if (enemy.defeated || !enemy.el) return;
        enemy.worldX += enemy.speed * enemy.dir;
        if (enemy.dir === 1 && enemy.worldX > enemy.originalX + enemy.range) {
            enemy.dir = -1; enemy.worldX = enemy.originalX + enemy.range;
        } else if (enemy.dir === -1 && enemy.worldX < enemy.originalX - enemy.range) {
            enemy.dir = 1; enemy.worldX = enemy.originalX - enemy.range;
        }
        enemy.worldY = groundSurfaceY;
    });
}

function updateCamera() {
    const effectivePlayerWidth = player.offsetWidth || playerWidth;
    const rightScrollTrigger = cameraX + currentScreenWidth - cameraScrollMargin;
    if (playerWorldX + effectivePlayerWidth > rightScrollTrigger) cameraX = playerWorldX + effectivePlayerWidth - (currentScreenWidth - cameraScrollMargin);
    const leftScrollTrigger = cameraX + cameraScrollMargin;
    if (playerWorldX < leftScrollTrigger) cameraX = playerWorldX - cameraScrollMargin;
    cameraX = Math.max(0, Math.min(cameraX, worldWidth - currentScreenWidth));
    if (groundSegment) groundSegment.style.transform = `translateX(${-cameraX}px)`;
}

function handleBlockCollisions() {
    if (!player) return;
    const effectivePlayerHeight = player.offsetHeight || playerHeight;
    const playerRect = getBoundingRectForGameObject(player, playerWorldX, playerWorldY);
    const playerHeadRect = {
        left: playerRect.left + playerWidth * 0.25, right: playerRect.right - playerWidth * 0.25,
        bottom: playerRect.top - 5, top: playerRect.top, width: playerWidth * 0.5, height: 5
    };
    currentLevelQuestionObjects.forEach(qData => {
        if (qData.el && !qData.done && qData.el.style.display !== 'none') {
            const blockRect = getBoundingRectForGameObject(qData.el, qData.worldX, qData.worldY);
            if (playerVelY > 0 && checkCollision(playerHeadRect, blockRect) && playerHeadRect.top > blockRect.bottom && (playerHeadRect.bottom - playerVelY * 0.5) <= blockRect.bottom ) {
                 playSound('blockHit'); triggerQuiz(qData, qData.el);
                 playerWorldY = blockRect.bottom - effectivePlayerHeight - 0.1; playerVelY = -1; return;
            }
            if (checkCollision(playerRect, blockRect)) {
                 const overlapX = Math.min(playerRect.right, blockRect.right) - Math.max(playerRect.left, blockRect.left);
                 const overlapY = Math.min(playerRect.top, blockRect.top) - Math.max(playerRect.bottom, blockRect.bottom);
                 const effectivePlayerWidth = player.offsetWidth || playerWidth;
                 if (overlapX < overlapY && Math.abs(playerVelX) > 0.1) {
                    if (playerVelX > 0 && playerRect.right > blockRect.left && playerRect.left < blockRect.left) { playerWorldX = blockRect.left - effectivePlayerWidth; playerVelX = 0; }
                    else if (playerVelX < 0 && playerRect.left < blockRect.right && playerRect.right > blockRect.right) { playerWorldX = blockRect.right; playerVelX = 0; }
                 } else if (playerVelY < 0 && playerRect.bottom < blockRect.top && playerRect.top > blockRect.top + playerVelY ) {
                    playerWorldY = blockRect.top; playerVelY = 0; if(!onGround) playSound('land'); onGround = true;
                 }
            }
        }
    });
}

function handleEnemyCollisions() {
    if (!player || !currentLevelEnemyObjects) return;
    const playerRect = getBoundingRectForGameObject(player, playerWorldX, playerWorldY);
    currentLevelEnemyObjects.forEach(enemy => {
        if (!enemy.el || enemy.defeated || enemy.el.style.display === 'none') return;
        const enemyRect = getBoundingRectForGameObject(enemy.el, enemy.worldX, enemy.worldY);
        if (checkCollision(playerRect, enemyRect)) {
            const playerIsFalling = playerVelY < -0.1;
            const playerFeetY = playerRect.bottom; const enemyHeadY = enemyRect.top;
            const prevPlayerFeetY = playerFeetY - playerVelY;
            const verticalAlignmentForStomp = playerFeetY <= enemyHeadY && playerFeetY >= enemyHeadY - (enemy.height * 0.75);
            if (playerIsFalling && verticalAlignmentForStomp && prevPlayerFeetY >= enemyHeadY - 5 ) {
                enemy.defeated = true; squashedAliens++;
                UI.uiUpdateScoreDisplays(correctAnswers, currentLevelTotalBlocks, squashedAliens);
                playerVelY = jumpForce * 0.6; onGround = false; playSound('stomp');
            } else {
                playSound('playerHit'); interactionPaused = true;
                UI.uiShowRetryMessage("Ouch! You bumped into an APA-wrecker!");
            }
        }
    });
}

function handleCometCollisions() {
    if (!player || !currentLevelComets || !currentLevelCometParams) return;
    const playerRect = getBoundingRectForGameObject(player, playerWorldX, playerWorldY);
    currentLevelComets.forEach(comet => {
        if (comet.isActive && comet.el && comet.el.style.display !== 'none') {
            const cometRect = getBoundingRectForGameObject(comet.el, comet.worldX, comet.worldY);
            if (checkCollision(playerRect, cometRect)) {
                playSound('playerHit'); comet.isActive = false;
                if (comet.el) comet.el.style.display = 'none';
                interactionPaused = true; UI.uiShowRetryMessage("Watch out! Hit by a falling APA-comet!");
            }
        }
    });
}

function handlePortalCollision() {
    if (!player || !portal || portal.style.display === 'none') return;
    const playerRect = getBoundingRectForGameObject(player, playerWorldX, playerWorldY);
    if (typeof currentPortalWorldX === 'undefined' || typeof portalWorldY === 'undefined') return;
    const portalRect = getBoundingRectForGameObject(portal, currentPortalWorldX, portalWorldY);

    if (checkCollision(playerRect, portalRect)) {
        interactionPaused = true; gameActuallyPaused = true;
        if (currentLevelIndex < levelScores.length) levelScores[currentLevelIndex] = { questions: correctAnswers, aliens: squashedAliens };
        else levelScores.push({ questions: correctAnswers, aliens: squashedAliens });

        const currentLvlCfg = levelsConfig[currentLevelIndex];
        if (currentLevelIndex === 0) {
            const passThr = currentLvlCfg.passThreshold !== undefined ? currentLvlCfg.passThreshold : 7;
            if (correctAnswers >= passThr) {
                playSound('levelComplete'); UI.uiUpdateInstructions("Level 1 Cleared! Well Done!");
                UI.uiShowLevelTransitionMessage(`Level 1 Cleared!\nCorrect Answers: ${correctAnswers}/${currentLevelTotalBlocks}\nProceeding to Level 2...`);
            } else {
                playSound('fail'); UI.uiShowRetryMessage(`Almost! You need ${passThr} correct answers to pass Level 1.\nYou got ${correctAnswers}/${currentLevelTotalBlocks}.\nTry again?`);
            }
        } else if (currentLevelIndex === levelsConfig.length - 1) {
            playSound('levelComplete'); UI.uiUpdateInstructions("Congratulations! Game Cleared!");
            engineRequestNextLevel();
        } else {
            playSound('levelComplete'); UI.uiUpdateInstructions(`Level ${currentLevelIndex + 1} Cleared!`);
            UI.uiShowLevelTransitionMessage(`Level ${currentLevelIndex + 1} Cleared!\nProceeding to next level...`);
        }
    }
}

function renderGameObjects() {
    if (!player || !gameArea) return;
    player.style.left = (playerWorldX - cameraX) + 'px';
    player.style.bottom = playerWorldY + 'px'; player.style.display = 'block';
    currentLevelQuestionObjects.forEach(qData => {
        if (qData.el) { qData.el.style.left = (qData.worldX - cameraX) + 'px'; qData.el.style.bottom = qData.worldY + 'px'; }
    });
    currentLevelEnemyObjects.forEach(enemy => {
        if (enemy.el && !enemy.defeated) { enemy.el.style.left = (enemy.worldX - cameraX) + 'px'; enemy.el.style.bottom = enemy.worldY + 'px'; enemy.el.style.display = 'flex'; }
        else if (enemy.el && enemy.defeated) enemy.el.style.display = 'none';
    });
    if (currentLevelComets) currentLevelComets.forEach(comet => {
        if (comet.isActive && comet.el) { comet.el.style.left = (comet.worldX - cameraX) + 'px'; comet.el.style.bottom = comet.worldY + 'px';}
    });
    if (portal && portal.style.display !== 'none') { portal.style.left = (currentPortalWorldX - cameraX) + 'px'; portal.style.bottom = portalWorldY + 'px'; }
}

function triggerQuiz(qData, blockEl) {
  if (qData.done || interactionPaused) return;
  interactionPaused = true;
  currentQuizDataFromEngine = qData; // qData here includes .el
  currentBlockElementHitByPlayer = blockEl;
  // Pass qData (which includes .el) to uiShowQuiz.
  // The new uiShowQuiz should handle this without JSON.stringify issues for its own logging.
  UI.uiShowQuiz(qData, idx => engineProcessPlayerAnswer(idx));
}

export function engineProcessPlayerAnswer(selectedIndex) {
    if (!currentQuizDataFromEngine || !currentBlockElementHitByPlayer) return;
    const qData = currentQuizDataFromEngine; const blockEl = currentBlockElementHitByPlayer;
    const correct = selectedIndex === qData.ans;
    qData.done = true;
    blockEl.classList.remove('correct', 'incorrect'); blockEl.classList.add('hit');
    if (correct) {
        correctAnswers++; UI.uiUpdateQuizFeedback("Correct!", true);
        blockEl.innerHTML = '<span class="correct-tick">&#x2713;&#xFE0E;</span>'; blockEl.classList.add('correct'); playSound('correct');
    } else {
        UI.uiUpdateQuizFeedback(`Incorrect. The answer was: ${qData.opts[qData.ans]}`, false);
        blockEl.innerHTML = '<span class="incorrect-cross">X</span>'; blockEl.classList.add('incorrect'); playSound('incorrect');
    }
    UI.uiUpdateScoreDisplays(correctAnswers, currentLevelTotalBlocks, squashedAliens);
    setTimeout(() => {
        UI.uiHideQuiz(); interactionPaused = false;
        currentQuizDataFromEngine = null; currentBlockElementHitByPlayer = null;
    }, correct ? 1200 : 2500);
}

export function engineRequestNextLevel() {
    UI.uiHideLevelTransitionMessage();
    currentLevelIndex++;
    if (currentLevelIndex < levelsConfig.length) loadLevel(currentLevelIndex);
    else {
        interactionPaused = true; gameActuallyPaused = true;
        let summary = '<div class="final-score-title">Game Completed!</div><div class="final-score-heading">Final Scores Per Level:</div>';
        levelScores.forEach((score, index) => {
            summary += `<div class="final-score-level-line">Level ${index + 1}: <span class="final-score-level-questions">${score.questions || 0} Questions</span> <span class="final-score-level-aliens">(${score.aliens || 0} Aliens)</span></div>`;
        });
        const totalQs = levelScores.reduce((sum, score) => sum + (score.questions || 0), 0);
        const totalAliensScored = levelScores.reduce((sum, score) => sum + (score.aliens || 0), 0);
        summary += `<div class="final-score-total-heading">Overall Summary:</div><div class="final-score-total-questions">${totalQs} Questions Right!</div><div class="final-score-total-aliens-secondary">(Total Aliens Squashed: ${totalAliensScored})</div>`;
        UI.uiShowFinalSummary(summary);
    }
}
export function engineRequestRetryCurrentLevel() { UI.uiHideRetryMessage(); loadLevel(currentLevelIndex); }
export function engineRequestRestartGame() { UI.uiHideRetryMessage(); startNewGame(); }
export function engineRequestSkipToLevel(levelIdx) {
    if (levelIdx >= 0 && levelIdx < levelsConfig.length) {
        UI.uiHideRetryMessage(); UI.uiHideLevelTransitionMessage();
        startNewGame(); if (levelIdx !== DEBUG_START_LEVEL_INDEX) loadLevel(levelIdx);
    } else console.warn(`ENGINE: Invalid level index ${levelIdx} for skipping.`);
}

// MODIFIED gameLoop with try...catch
function gameLoop() {
    // console.log("tick; interactionPaused:", interactionPaused, "gameActuallyPaused:", gameActuallyPaused); // Optional: keep for detailed ticking
    try {
        if (gameActuallyPaused) {
            renderGameObjects();
            requestAnimationFrame(gameLoop); // Keep loop going even if paused
            return;
        }

        handlePlayerInput();

        if (!interactionPaused) {
            updatePlayer();
            handleBlockCollisions();
            handleEnemyCollisions();
            handleCometCollisions();
            handlePortalCollision();
        }

        updateEnemies();
        updateComets();
        updateCamera();
        renderGameObjects();

    } catch (e) {
        console.error('[LOOP-CRASH]', e); // <-- Will show the *real* offender
        // Optionally, you might want to stop the game or show an error message to the user here
        // For now, it will just log and try to continue if requestAnimationFrame is reached.
        // However, if the error is persistent, it might spam the console.
    }
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if (!gameActuallyPaused) keysPressed[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
});
document.addEventListener('keyup', (e) => { keysPressed[e.code] = false; });

window.addEventListener('DOMContentLoaded', () => {
    if (!gameArea || !player || !groundSegment || !portal) {
        console.error("ENGINE: Critical DOM elements missing. Check HTML IDs.");
        document.body.innerHTML = '<h1 style="color:red; text-align:center;">Error: Game assets missing. Check console (F12).</h1>';
        return;
    }
    initAudio();
    function resumeAudioOnFirstInteraction() {
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(err => console.error("Error resuming AudioContext:", err));
        }
        if (!audioCtx) initAudio();
    }
    ['click', 'keydown', 'touchstart'].forEach(eventType => {
        document.body.addEventListener(eventType, resumeAudioOnFirstInteraction, { once: true });
    });

    currentScreenWidth = gameArea.offsetWidth || 700;
    currentScreenHeight = gameArea.offsetHeight || 400;
    cameraScrollMargin = currentScreenWidth * cameraScrollMarginBase;
    UI.uiSetupEventListeners();
    startNewGame();
    gameLoop();
});