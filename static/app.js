// Add this at the very beginning to confirm JS is loading
console.log('JavaScript file loaded successfully');

// Array to store shortened URLs (max 5)
let shortenedUrls = [];
const MAX_URLS = 5;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up event listeners');
    
    // Load saved URLs from localStorage
    loadSavedUrls();
    
    // DOM elements
    const urlInput = document.getElementById('url-input');
    const shortenButton = document.getElementById('shorten-button');
    const resultsContainer = document.getElementById('results-container');
    
    // Debug: Check if elements exist
    console.log('URL Input:', urlInput);
    console.log('Shorten Button:', shortenButton);
    console.log('Results Container:', resultsContainer);
    
    if (!urlInput || !shortenButton || !resultsContainer) {
        console.error('One or more required elements not found!');
        return;
    }
    
    // Add event listeners
    shortenButton.addEventListener('click', function(e) {
        console.log('Button clicked!');
        e.preventDefault();
        handleShortenUrl();
    });
    
    urlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            console.log('Enter key pressed!');
            e.preventDefault();
            handleShortenUrl();
        }
    });
    
    console.log('Event listeners added successfully');
});

// Load saved URLs from localStorage
function loadSavedUrls() {
    try {
        const saved = localStorage.getItem('shortenedUrls');
        if (saved) {
            shortenedUrls = JSON.parse(saved);
            console.log('Loaded saved URLs:', shortenedUrls);
            
            // Re-render saved URLs
            renderResults();
            
            // Restart polling for all saved URLs
            shortenedUrls.forEach(urlData => {
                startVisitPolling(urlData.slug);
            });
        }
    } catch (error) {
        console.error('Error loading saved URLs:', error);
        shortenedUrls = [];
    }
}

// Save URLs to localStorage
function saveUrls() {
    try {
        localStorage.setItem('shortenedUrls', JSON.stringify(shortenedUrls));
        console.log('URLs saved to localStorage');
    } catch (error) {
        console.error('Error saving URLs:', error);
    }
}

// Main function to handle URL shortening
async function handleShortenUrl() {
    console.log('handleShortenUrl called');
    
    const urlInput = document.getElementById('url-input');
    const url = urlInput.value.trim();
    
    console.log('URL to shorten:', url);
    
    // Validate URL
    if (!url) {
        console.log('Empty URL');
        showError('Please enter a URL');
        return;
    }
    
    if (!isValidUrl(url)) {
        console.log('Invalid URL');
        showError('Please enter a valid URL (include http:// or https://)');
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    hideError();
    
    try {
        console.log('Sending request to /api/shorten');
        
        // Call your Flask API
        const response = await fetch('/api/shorten', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url })
        });
        
        console.log('Response received:', response);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        const shortUrl = data.shortUrl;
        
        // Extract slug from short URL for stats
        const slug = shortUrl.split('/').pop();
        console.log('Extracted slug:', slug);
        
        // Add to results
        addShortenedUrl({
            original: url,
            shortened: shortUrl,
            slug: slug,
            visits: 0,
            timestamp: new Date().toISOString()
        });
        
        // Clear input
        urlInput.value = '';
        
    } catch (error) {
        console.error('Error in handleShortenUrl:', error);
        showError('Failed to shorten URL. Please try again.');
    } finally {
        setLoadingState(false);
    }
}

// Add a shortened URL to the display
function addShortenedUrl(urlData) {
    console.log('Adding shortened URL:', urlData);
    
    // Add to beginning of array
    shortenedUrls.unshift(urlData);
    
    // Remove oldest if we exceed max
    if (shortenedUrls.length > MAX_URLS) {
        shortenedUrls.pop();
    }
    
    // Save to localStorage
    saveUrls();
    
    // Re-render all results
    renderResults();
}

// Render all results with "Previous Links" separator
function renderResults() {
    console.log('Rendering results:', shortenedUrls);
    
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = '';
    
    shortenedUrls.forEach((urlData, index) => {
        // Add "Previous Links" separator before the second item
        if (index === 1 && shortenedUrls.length > 1) {
            const separator = document.createElement('div');
            separator.className = 'previous-links-separator';
            separator.innerHTML = '<span>Previous Links</span>';
            resultsContainer.appendChild(separator);
        }
        
        const resultBox = createResultBox(urlData, index);
        resultsContainer.appendChild(resultBox);
    });
}

// Create a single result box
function createResultBox(urlData, index) {
    const resultBox = document.createElement('div');
    resultBox.className = 'result-box';
    resultBox.style.animationDelay = `${index * 0.1}s`;
    
    resultBox.innerHTML = `
        <div class="result-content">
            <div class="url-section">
                <div class="short-url">
                    <a href="${urlData.shortened}" target="_blank">${urlData.shortened}</a>
                </div>
                <p class="original-url">${urlData.original}</p>
            </div>
            <div class="stats-section">
                <div class="visits-count" data-slug="${urlData.slug}">
                    ${urlData.visits} visits
                </div>
                <button class="copy-btn" onclick="copyToClipboard('${urlData.shortened}', this)">
                    Copy
                </button>
            </div>
        </div>
    `;
    
    // Start polling for visit count updates
    startVisitPolling(urlData.slug);
    
    return resultBox;
}

// Copy shortened URL to clipboard
async function copyToClipboard(text, button) {
    console.log('Copying to clipboard:', text);
    
    try {
        await navigator.clipboard.writeText(text);
        
        // Visual feedback
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
        
    } catch (error) {
        console.log('Clipboard API failed, using fallback');
        
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = 'Copy';
        }, 2000);
    }
}

// Start polling for visit count updates
function startVisitPolling(slug) {
    // Avoid duplicate polling for the same slug
    if (window.visitPolls && window.visitPolls[slug]) {
        clearInterval(window.visitPolls[slug]);
    }
    
    // Poll every 5 seconds for visit count updates
    const pollInterval = setInterval(async () => {
        try {
            const response = await fetch(`/api/stats/${slug}`);
            if (response.ok) {
                const stats = await response.json();
                updateVisitCount(slug, stats.visits);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }, 5000);
    
    // Store interval ID for cleanup if needed
    window.visitPolls = window.visitPolls || {};
    window.visitPolls[slug] = pollInterval;
}

// Update visit count in the UI and save to localStorage
function updateVisitCount(slug, visits) {
    const visitElement = document.querySelector(`[data-slug="${slug}"]`);
    if (visitElement) {
        visitElement.textContent = `${visits} visits`;
        
        // Update in our local array too
        const urlData = shortenedUrls.find(url => url.slug === slug);
        if (urlData) {
            urlData.visits = visits;
            // Save updated data to localStorage
            saveUrls();
        }
    }
}

// Utility functions
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function setLoadingState(loading) {
    const shortenButton = document.getElementById('shorten-button');
    shortenButton.disabled = loading;
    shortenButton.classList.toggle('loading', loading);
    shortenButton.textContent = loading ? 'Shortening...' : 'Shorten URL';
}

function showError(message) {
    const urlInput = document.getElementById('url-input');
    let errorDiv = document.querySelector('.error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        urlInput.parentNode.insertAdjacentElement('afterend', errorDiv);
    }
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function hideError() {
    const errorDiv = document.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

// Make copyToClipboard available globally for inline onclick
window.copyToClipboard = copyToClipboard;