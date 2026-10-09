//creating the elements
const note=document.querySelector("#note-text");
const charCounter=document.querySelector("#char-count");
const wordCounter= document.querySelector("#word-count");
const clearBtn=document.querySelector("#clear-button");
const themeBtn=document.querySelector("#toggle-button");

// ---------- Constants ----------
const MAX      = 200;
const WARN_AT  = 180;
const DRAFT_KEY = 'day4-note-draft';
const THEME_KEY = 'day4-theme';

// ---------- Counting ----------
function countWords(text) {
  const trimmed = text.trim();
  if (trimmed === '') return 0;
  return trimmed.split(/\s+/).length;
}

function updateCounts() {
  const text = note.value;
  const chars = text.length;
  const words = countWords(text);

  charCounter.textContent = `${chars} / ${MAX} characters`;
  wordCounter.textContent = `${words} words`;

  charCounter.classList.toggle('warning', chars > WARN_AT && chars <= MAX);
  charCounter.classList.toggle('over',    chars > MAX);
}

// ---------- Draft save ----------
function saveDraft() {
  localStorage.setItem(DRAFT_KEY, note.value);
}

// ---------- Clear ----------
function clearNote() {
  note.value = '';
  localStorage.removeItem(DRAFT_KEY);
  updateCounts();
  note.focus();
}

// ---------- Theme ----------
function applyTheme(isDark) {
  document.body.classList.toggle('dark', isDark);
  themeBtn.textContent = isDark ? 'Light mode' : 'Dark mode';
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
}

function toggleTheme() {
  applyTheme(!document.body.classList.contains('dark'));
}

// ---------- Init (runs after DOM is parsed, thanks to defer) ----------
function init() {
  // Restore draft
  const savedDraft = localStorage.getItem(DRAFT_KEY);
  if (savedDraft !== null) note.value = savedDraft;

  // Restore theme
  const savedTheme = localStorage.getItem(THEME_KEY);
  applyTheme(savedTheme === 'dark'); // default = light

  // Initial counter render (important after restoring draft)
  updateCounts();
}

// ---------- Events ----------
note.addEventListener('input', () => {
  updateCounts();
  saveDraft();
});

note.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.preventDefault();
    clearNote();
  }
});

clearBtn.addEventListener('click', clearNote);
themeBtn.addEventListener('click', toggleTheme);

// Kick things off
init();
