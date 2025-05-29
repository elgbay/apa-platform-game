// ui.js
import {
    // engineProcessPlayerAnswer, // No longer directly called by UI, callback is used
    engineRequestNextLevel,
    engineRequestRetryCurrentLevel,
    engineRequestRestartGame,
    engineRequestSkipToLevel
} from './engine.js';

// --- UI Element References ---
const instructionsDisplay = document.getElementById('instructions');
const levelDisplay = document.getElementById('level-display');
const correctAnswersDisplay = document.getElementById('correct-answers-display');
const alienScoreDisplay = document.getElementById('alien-score-display');
const finalScoreSummaryDisplay = document.getElementById('final-score-summary');

const quizOverlay = document.getElementById('quiz-overlay');
const quizQuestionText = document.getElementById('quiz-question-text');
const quizOptionsContainer = document.getElementById('quiz-options');
const quizFeedback = document.getElementById('quiz-feedback');

const levelTransitionMessageOverlay = document.getElementById('level-transition-message-overlay');
const levelTransitionMessageText = document.getElementById('level-transition-message-text');
const proceedButton = document.getElementById('proceed-button');

const retryMessageOverlay = document.getElementById('retry-message-overlay');
const retryMessageText = document.getElementById('retry-message-text');
const retryLevelButton = document.getElementById('retry-level-button');
const restartGameButton = document.getElementById('restart-game-button');
const skipToLevel2Button = document.getElementById('skip-lvl-2-button');

let currentQuizAnswerHandler = null; // To store the callback from engine.js

// --- UI Update Functions (Exported for Engine to use) ---
export function uiUpdateLevelDisplay(levelNum) {
    if (levelDisplay) levelDisplay.textContent = `Level: ${levelNum}`;
}
export function uiUpdateInstructions(text) {
    if (instructionsDisplay) instructionsDisplay.textContent = text;
}
export function uiUpdateScoreDisplays(correct, totalBlocks, aliens) {
    if (correctAnswersDisplay) correctAnswersDisplay.textContent = `Questions Right: ${correct} / ${totalBlocks}`;
    if (alienScoreDisplay) alienScoreDisplay.textContent = `Aliens Squashed: ${aliens}`;
}

// REPLACED with "Hard-proof quiz code"
export function uiShowQuiz (q, handler) {
  try {
    // Log the raw question object (q) here if needed, but avoid JSON.stringify if q contains DOM elements (q.el)
    // console.log('[UI] Showing quiz for question object:', q); // Be careful if q.el is present

    // Ensure critical DOM elements for the quiz are present
    if (!quizOverlay || !quizQuestionText || !quizOptionsContainer || !quizFeedback) {
        console.error('[QUIZ-ERROR] Critical quiz DOM elements are missing!');
        // Attempt to show some error to the user if possible, though quiz box might be broken
        if (quizOverlay) { // If overlay exists, try to show an error message within it
            quizOverlay.innerHTML = '<div id="quiz-box" style="background-color:white; padding:20px; border-radius:5px; text-align:center;">Critical UI Error: Quiz components missing.</div>';
            quizOverlay.classList.add('show');
        }
        return; // Cannot proceed
    }

    if (!q || !Array.isArray(q.opts)) { // q is the questionData object from engine
      console.error('[QUIZ-ERROR] Quiz data missing or malformed. `q` or `q.opts` is invalid.', q);
      throw new Error('Quiz data missing or malformed: `opts` is not an array or `q` is null/undefined.');
    }

    quizQuestionText.textContent = q.q ?? '⚠️ No question text';
    quizOptionsContainer.innerHTML = ''; // Clear previous options
    quizFeedback.textContent = '';    // Clear previous feedback
    currentQuizAnswerHandler = handler; // Store the callback

    q.opts.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.textContent = String(opt); // Ensure option text is a string
      btn.onclick = () => {
        // Disable all option buttons after one is clicked
        if (quizOptionsContainer) { // Check if container exists before accessing children
            [...quizOptionsContainer.children].forEach(b => {
                if (b.tagName === 'BUTTON') b.disabled = true;
            });
        }
        currentQuizAnswerHandler?.(i); // Call the stored handler (engineProcessPlayerAnswer)
      };
      quizOptionsContainer.appendChild(btn);
    });

    quizOverlay.classList.add('show'); // Show the quiz overlay

  } catch (err) {
    console.error('[QUIZ-ERROR]', err);
    // Try to display the error within the quiz UI itself
    if (quizQuestionText) quizQuestionText.textContent = '⚠️ Error building quiz!';
    if (quizOptionsContainer) quizOptionsContainer.innerHTML = `<p style="color:red;">${err.message}</p>`;
    if (quizFeedback) quizFeedback.textContent = 'Please try refreshing or contact support.';
    
    // Ensure the overlay is shown so the user sees the error message
    if (quizOverlay && !quizOverlay.classList.contains('show')) {
        quizOverlay.classList.add('show');
    }
    // NOTE: If this error occurs, `interactionPaused` in engine.js might remain `true`.
    // The game might need a mechanism to recover or an explicit way to hide the broken quiz.
  }
}


export function uiUpdateQuizFeedback(message, isCorrect) {
    if (!quizFeedback) return;
    quizFeedback.textContent = message;
    quizFeedback.style.color = isCorrect ? '#2E7D32' : '#B71C1C'; // Using explicit colors from CSS
}
export function uiHideQuiz() {
    if (quizOverlay) {
        quizOverlay.classList.remove('show');
        // It might be good to also clear the quiz content when hiding
        // if (quizQuestionText) quizQuestionText.textContent = '';
        // if (quizOptionsContainer) quizOptionsContainer.innerHTML = '';
        // if (quizFeedback) quizFeedback.textContent = '';
    }
    if (document.activeElement) document.activeElement.blur(); // Remove focus from any quiz button
}

export function uiShowLevelTransitionMessage(message) {
    if (levelTransitionMessageText) levelTransitionMessageText.textContent = message;
    if (levelTransitionMessageOverlay) levelTransitionMessageOverlay.style.display = 'flex';
}
export function uiHideLevelTransitionMessage() {
    if (levelTransitionMessageOverlay) levelTransitionMessageOverlay.style.display = 'none';
}
export function uiShowRetryMessage(message) {
    if (retryMessageText) retryMessageText.textContent = message;
    if (retryMessageOverlay) retryMessageOverlay.style.display = 'flex';
}
export function uiHideRetryMessage() {
    if (retryMessageOverlay) retryMessageOverlay.style.display = 'none';
}
export function uiShowFinalSummary(summaryText) {
    if (finalScoreSummaryDisplay) {
        finalScoreSummaryDisplay.innerHTML = summaryText;
        finalScoreSummaryDisplay.style.display = 'block';
    }
    if (correctAnswersDisplay) correctAnswersDisplay.style.display = 'none';
    if (alienScoreDisplay) alienScoreDisplay.style.display = 'none';
    if (levelDisplay) levelDisplay.style.display = 'none';
    if (instructionsDisplay) instructionsDisplay.textContent = "Game Over. Thanks for playing!";
}
export function uiResetUIForNewLevel() {
    uiHideRetryMessage();
    uiHideLevelTransitionMessage();
    if (finalScoreSummaryDisplay) finalScoreSummaryDisplay.style.display = 'none';
    if (correctAnswersDisplay) correctAnswersDisplay.style.display = 'block';
    if (alienScoreDisplay) alienScoreDisplay.style.display = 'block';
    if (levelDisplay) levelDisplay.style.display = 'block';
    if (quizOverlay) quizOverlay.classList.remove('show');
}

export function uiSetupEventListeners() {
    if (skipToLevel2Button) {
        skipToLevel2Button.addEventListener('click', () => {
            engineRequestSkipToLevel(1); // Assuming level 2 is index 1
        });
    }
    if (proceedButton) proceedButton.addEventListener('click', engineRequestNextLevel);
    if (retryLevelButton) retryLevelButton.addEventListener('click', engineRequestRetryCurrentLevel);
    if (restartGameButton) restartGameButton.addEventListener('click', engineRequestRestartGame);
}