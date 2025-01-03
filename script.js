let timeLeft;
let timeLimit;
let timer;
let isTyping = false;
let currentText = '';
let typedCharacters = 0;
let errors = 0;
let totalTestTime = 0;
let wpmHistory = [];
let isTestComplete = false;
let startTime;
let wpmChart;

// DOM Elements
const textDisplay = document.getElementById('text-display');
const inputField = document.getElementById('input');
const timerElement = document.getElementById('timer');
const wpmElement = document.getElementById('wpm');
const accuracyElement = document.getElementById('accuracy');
const charactersElement = document.getElementById('characters');
const errorsElement = document.getElementById('errors');
const restartButton = document.getElementById('restart-button');
const shareButton = document.getElementById('share-button');
const modeSelect = document.getElementById('mode-select');
const timeSelect = document.getElementById('time-select');
const languageSelect = document.getElementById('language-select');
const codeCategorySelect = document.getElementById('code-category-select');
const themeSelect = document.getElementById('theme-select');
const resultsContainer = document.querySelector('.results-container');
const gameContainer = document.querySelector('.game-container');

// Initialize the application
function init() {
    loadTheme();
    setupEventListeners();
    resetTest();
}

// Set up event listeners
function setupEventListeners() {
    inputField.addEventListener('input', handleTyping);
    restartButton.addEventListener('click', resetTest);
    shareButton.addEventListener('click', shareResult);
    modeSelect.addEventListener('change', handleModeChange);
    themeSelect.addEventListener('change', handleThemeChange);
    timeSelect.addEventListener('change', () => resetTest());
    languageSelect.addEventListener('change', () => resetTest());
    codeCategorySelect.addEventListener('change', () => resetTest());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' && e.target === inputField) {
            e.preventDefault();
            if (e.shiftKey) {
                handleThemeChange();
            } else {
                resetTest();
            }
        }
        if (e.key === 'Escape') {
            resetTest();
        }
    });
}

// Handle typing input
function handleTyping(e) {
    if (!isTyping && !isTestComplete) {
        startTest();
    }

    const inputValue = e.target.value;
    const currentChar = inputValue[inputValue.length - 1];
    
    if (inputValue.length <= currentText.length) {
        updateStats(inputValue);
        checkCompletion(inputValue);
    } else {
        e.target.value = inputValue.slice(0, currentText.length);
    }
}

// Start the typing test
function startTest() {
    isTyping = true;
    startTime = Date.now();
    timeLimit = parseInt(timeSelect.value);
    timeLeft = timeLimit;
    timer = setInterval(updateTimer, 1000);
    wpmHistory = [];
}

// Update timer
function updateTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        timerElement.textContent = timeLeft + 's';
        updateWPM();
        wpmHistory.push(calculateWPM());
    } else {
        finishTest();
    }
}

// Calculate WPM
function calculateWPM() {
    if (!isTyping) return 0;
    
    const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
    const wordsTyped = typedCharacters / 5; // standard word length
    return Math.round(wordsTyped / timeElapsed);
}

// Update statistics
function updateStats(inputValue) {
    let correctChars = 0;
    errors = 0;

    for (let i = 0; i < inputValue.length; i++) {
        if (inputValue[i] === currentText[i]) {
            correctChars++;
        } else {
            errors++;
        }
    }

    typedCharacters = correctChars;
    const accuracy = Math.round((correctChars / inputValue.length) * 100) || 100;

    // Update DOM
    wpmElement.textContent = calculateWPM();
    accuracyElement.textContent = accuracy + '%';
    charactersElement.textContent = typedCharacters;
    errorsElement.textContent = errors;

    // Update text display
    updateTextDisplay(inputValue);
}

// Check if the test is complete
function checkCompletion(inputValue) {
    if (inputValue === currentText && !isTestComplete) {
        finishTest();
    }
}

// Finish the typing test
function finishTest() {
    isTestComplete = true;
    clearInterval(timer);
    inputField.disabled = true;
    
    const finalWPM = calculateWPM();
    const finalAccuracy = Math.round((typedCharacters / currentText.length) * 100);
    const finalTime = timeLimit - timeLeft;

    // Show results
    document.getElementById('final-wpm').textContent = finalWPM;
    document.getElementById('final-accuracy').textContent = finalAccuracy + '%';
    document.getElementById('final-time').textContent = finalTime + 's';

    // Save to history
    saveToHistory(finalWPM, finalAccuracy, finalTime);

    // Show results container
    gameContainer.style.display = 'none';
    resultsContainer.style.display = 'block';

    // Create WPM chart
    createWPMChart();
}

// Create WPM progress chart
function createWPMChart() {
    const ctx = document.getElementById('wpm-chart').getContext('2d');
    
    if (wpmChart) {
        wpmChart.destroy();
    }

    wpmChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: wpmHistory.map((_, i) => i + 1),
            datasets: [{
                label: 'WPM Progress',
                data: wpmHistory,
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color'),
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Reset the typing test
function resetTest() {
    clearInterval(timer);
    isTyping = false;
    isTestComplete = false;
    typedCharacters = 0;
    errors = 0;
    timeLeft = parseInt(timeSelect.value);
    timerElement.textContent = timeLeft + 's';
    inputField.value = '';
    inputField.disabled = false;
    
    // Reset statistics
    wpmElement.textContent = '0';
    accuracyElement.textContent = '100%';
    charactersElement.textContent = '0';
    errorsElement.textContent = '0';

    // Hide results and show game
    resultsContainer.style.display = 'none';
    gameContainer.style.display = 'block';

    // Get new text
    currentText = getRandomText();
    updateTextDisplay('');
}

// Handle mode change
function handleModeChange() {
    const mode = modeSelect.value;
    languageSelect.style.display = mode === 'code' ? 'block' : 'none';
    codeCategorySelect.style.display = mode === 'code' ? 'block' : 'none';
    resetTest();
}

// Handle theme change
function handleThemeChange() {
    const currentTheme = themeSelect.value;
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
}

// Load theme from localStorage
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    themeSelect.value = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// Update text display with current progress
function updateTextDisplay(inputValue) {
    let html = '';
    for (let i = 0; i < currentText.length; i++) {
        if (i < inputValue.length) {
            if (inputValue[i] === currentText[i]) {
                html += `<span class="correct">${currentText[i]}</span>`;
            } else {
                html += `<span class="incorrect">${currentText[i]}</span>`;
            }
        } else if (i === inputValue.length) {
            html += `<span class="current">${currentText[i]}</span>`;
        } else {
            html += currentText[i];
        }
    }
    textDisplay.innerHTML = html;
}

// Save result to history
function saveToHistory(wpm, accuracy, time) {
    const history = JSON.parse(localStorage.getItem('typingHistory') || '[]');
    const result = {
        wpm,
        accuracy,
        time,
        mode: modeSelect.value,
        date: new Date().toISOString()
    };
    history.unshift(result);
    if (history.length > 10) history.pop();
    localStorage.setItem('typingHistory', JSON.stringify(history));
    updateHistoryDisplay();
}

// Update history display
function updateHistoryDisplay() {
    const history = JSON.parse(localStorage.getItem('typingHistory') || '[]');
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';

    history.forEach(result => {
        const date = new Date(result.date).toLocaleDateString();
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div class="history-info">
                <span class="history-wpm">${result.wpm} WPM</span>
                <span class="history-accuracy">${result.accuracy}%</span>
                <span class="history-mode">${result.mode}</span>
            </div>
            <div class="history-date">${date}</div>
        `;
        historyList.appendChild(item);
    });
}

// Share result
function shareResult() {
    const wpm = document.getElementById('final-wpm').textContent;
    const accuracy = document.getElementById('final-accuracy').textContent;
    const text = `🎯 Typing Speed: ${wpm} WPM\n📊 Accuracy: ${accuracy}\n🌐 Try it yourself at [Your Website]`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My Typing Test Result',
            text: text
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(text)
            .then(() => alert('Result copied to clipboard!'))
            .catch(console.error);
    }
}

// Get random text based on mode
function getRandomText() {
    const mode = modeSelect.value;
    switch (mode) {
        case 'words':
            return getRandomWords();
        case 'quotes':
            return getRandomQuote();
        case 'code':
            return getRandomCodeSnippet();
        default:
            return getRandomWords();
    }
}

// Get random words
function getRandomWords() {
    const words = commonWords.sort(() => Math.random() - 0.5).slice(0, 50);
    return words.join(' ');
}

// Get random quote
function getRandomQuote() {
    return quotes[Math.floor(Math.random() * quotes.length)];
}

// Get random code snippet
function getRandomCodeSnippet() {
    const language = languageSelect.value;
    const category = codeCategorySelect.value;
    const snippets = codeSnippets[language][category];
    return snippets[Math.floor(Math.random() * snippets.length)];
}

// Data
const commonWords = [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "I",
    "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
    "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
    "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
    "so", "up", "out", "if", "about", "who", "get", "which", "go", "me"
];

const quotes = [
    "The only way to do great work is to love what you do.",
    "Innovation distinguishes between a leader and a follower.",
    "Stay hungry, stay foolish.",
    "The future belongs to those who believe in the beauty of their dreams.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts."
];

const codeSnippets = {
    javascript: {
        algorithms: [
            "function bubbleSort(arr) {\n  let len = arr.length;\n  for (let i = 0; i < len; i++) {\n    for (let j = 0; j < len - i - 1; j++) {\n      if (arr[j] > arr[j + 1]) {\n        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];\n      }\n    }\n  }\n  return arr;\n}",
            "function binarySearch(arr, target) {\n  let left = 0;\n  let right = arr.length - 1;\n  while (left <= right) {\n    let mid = Math.floor((left + right) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}"
        ],
        datastructures: [
            "class Node {\n  constructor(value) {\n    this.value = value;\n    this.next = null;\n  }\n}\n\nclass LinkedList {\n  constructor() {\n    this.head = null;\n  }\n\n  append(value) {\n    if (!this.head) {\n      this.head = new Node(value);\n      return;\n    }\n    let current = this.head;\n    while (current.next) {\n      current = current.next;\n    }\n    current.next = new Node(value);\n  }\n}"
        ]
    },
    python: {
        algorithms: [
            "def quick_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quick_sort(left) + middle + quick_sort(right)",
            "def merge_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    mid = len(arr) // 2\n    left = merge_sort(arr[:mid])\n    right = merge_sort(arr[mid:])\n    return merge(left, right)"
        ]
    }
};

// Initialize the application
init();
updateHistoryDisplay();
