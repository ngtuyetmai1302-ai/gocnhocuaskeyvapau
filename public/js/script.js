// Run after every feature script has loaded. Inline HTML handlers use their globals.
function initializePage() {
    checkSavedLockState();
    setInterval(changePhotoAndQuote, 120000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage, { once: true });
} else {
    initializePage();
}
