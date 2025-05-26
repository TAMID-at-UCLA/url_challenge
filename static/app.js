/* ===========================================
   URL SHORTENER JAVASCRIPT
   Main functionality for the TAMID URL Shortener
   =========================================== */

// Debug log to confirm JavaScript file loads correctly
console.log('JavaScript file loaded successfully');

/* ===========================================
   GLOBAL VARIABLES & CONSTANTS
   =========================================== */

// Array to store shortened URLs in memory (max 5 items)
let shortenedUrls = [];
const MAX_URLS = 5; // Maximum number of URLs to keep in history

/* ===========================================
   INITIALIZATION & EVENT SETUP
   =========================================== */

// Wait for DOM to be fully loaded before setting up functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up event listeners');
    
    // Load any previously saved URLs from browser storage
    loadSavedUrls();
    
    // Get references to main DOM elements
    const urlInput = document.getElementById('url-input');
    const shortenButton = document.getElementById('shorten-button');
    const resultsContainer = document.getElementById('results-container');
    
    // Debug: Verify all required elements exist
    console.log('URL Input:', urlInput);
    console.log('Shorten Button:', shortenButton);
    console.log('Results Container:', resultsContainer);
    
    // Exit early if any required elements are missing
    if (!urlInput || !shortenButton || !resultsContainer) {
        console.error('One or more required elements not found!');
        return;
    }
    
    // Set up click event listener for the shorten button
    shortenButton.addEventListener('click', function(e) {
        console.log('Button clicked!');
        e.preventDefault(); // Prevent any form submission
        handleShortenUrl(); // Process the URL shortening
    });
    
    // Set up Enter key functionality for the input field
    urlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            console.log('Enter key pressed!');
            e.preventDefault(); // Prevent form submission
            handleShortenUrl(); // Process the URL shortening
        }
    });
    
    console.log('Event listeners added successfully');
});

/* ===========================================
   LOCAL STORAGE MANAGEMENT
   =========================================== */

// Load previously saved URLs from browser's localStorage
function loadSavedUrls() {
    try {
        // Retrieve saved URLs from localStorage
        const saved = localStorage.getItem('shortenedUrls');
        if (saved) {
            // Parse JSON data back into JavaScript array
            shortenedUrls = JSON.parse(saved);
            console.log('Loaded saved URLs:', shortenedUrls);
            
            // Display the saved URLs on the page
            renderResults();
            
            // Resume visit count polling for all saved URLs
            shortenedUrls.forEach(urlData => {
                startVisitPolling(urlData.slug);
            });
        }
    } catch (error) {
        // Handle any errors in loading/parsing saved data
        console.error('Error loading saved URLs:', error);
        shortenedUrls = []; // Reset to empty array on error
    }
}

// Save current URLs array to browser's localStorage
function saveUrls() {
    try {
        // Convert JavaScript array to JSON and save
        localStorage.setItem('shortenedUrls', JSON.stringify(shortenedUrls));
        console.log('URLs saved to localStorage');
    } catch (error) {
        // Handle storage errors (quota exceeded, etc.)
        console.error('Error saving URLs:', error);
    }
}

/* ===========================================
   URL SHORTENING FUNCTIONALITY
   =========================================== */

// Main function to handle URL shortening process
async function handleShortenUrl() {
    console.log('handleShortenUrl called');
    
    // Get the input field and extract the URL
    const urlInput = document.getElementById('url-input');
    const url = urlInput.value.trim(); // Remove whitespace
    
    console.log('URL to shorten:', url);
    
    // Validate that a URL was entered
    if (!url) {
        console.log('Empty URL');
        showError('Please enter a URL');
        return;
    }
    
    // Validate that the URL format is correct
    if (!isValidUrl(url)) {
        console.log('Invalid URL');
        showError('Please enter a valid URL (include http:// or https://)');
        return;
    }
    
    // Show loading state to user while processing
    setLoadingState(true);
    hideError(); // Clear any previous error messages
    
    try {
        console.log('Sending request to /api/shorten');
        
        // Make API call to Flask backend to shorten the URL
        const response = await fetch('/api/shorten', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url }) // Send URL in JSON format
        });
        
        console.log('Response received:', response);
        
        // Check if the API request was successful
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Parse the JSON response from the server
        const data = await response.json();
        console.log('Response data:', data);
        
        // Extract the shortened URL from the response
        const shortUrl = data.shortUrl;
        
        // Extract the unique slug from the shortened URL for tracking
        const slug = shortUrl.split('/').pop();
        console.log('Extracted slug:', slug);
        
        // Add the new shortened URL to our display
        addShortenedUrl({
            original: url,           // Original long URL
            shortened: shortUrl,     // New shortened URL
            slug: slug,             // Unique identifier for tracking
            visits: 0,             // Initial visit count
            timestamp: new Date().toISOString() // When URL was created
        });
        
        // Clear the input field for next use
        urlInput.value = '';
        
    } catch (error) {
        // Handle any errors in the shortening process
        console.error('Error in handleShortenUrl:', error);
        showError('Failed to shorten URL. Please try again.');
    } finally {
        // Always hide loading state when done (success or error)
        setLoadingState(false);
    }
}

/* ===========================================
   RESULTS DISPLAY MANAGEMENT
   =========================================== */

// Add a new shortened URL to the display and storage
function addShortenedUrl(urlData) {
    console.log('Adding shortened URL:', urlData);
    
    // Add new URL to the beginning of the array (most recent first)
    shortenedUrls.unshift(urlData);
    
    // Remove the oldest URL if we exceed the maximum limit
    if (shortenedUrls.length > MAX_URLS) {
        shortenedUrls.pop(); // Remove last item
    }
    
    // Save updated array to localStorage for persistence
    saveUrls();
    
    // Re-render all results to update the display
    renderResults();
}

// Render all shortened URLs with separator between new and old links
function renderResults() {
    console.log('Rendering results:', shortenedUrls);
    
    // Get the container element and clear previous content
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = '';
    
    // Loop through all shortened URLs and create display elements
    shortenedUrls.forEach((urlData, index) => {
        // Add "Previous Links" separator before the second item
        if (index === 1 && shortenedUrls.length > 1) {
            const separator = document.createElement('div');
            separator.className = 'previous-links-separator';
            separator.innerHTML = '<span>Previous Links</span>';
            resultsContainer.appendChild(separator);
        }
        
        // Create and add the result box for this URL
        const resultBox = createResultBox(urlData, index);
        resultsContainer.appendChild(resultBox);
    });
}

// Create a single result box element for displaying a shortened URL
function createResultBox(urlData, index) {
    // Create the main container div
    const resultBox = document.createElement('div');
    resultBox.className = 'result-box';
    // Stagger animation delay for smooth appearance
    resultBox.style.animationDelay = `${index * 0.1}s`;
    
    // Set the HTML content for the result box
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
    
    // Start polling for visit count updates for this URL
    startVisitPolling(urlData.slug);
    
    return resultBox;
}

/* ===========================================
   CLIPBOARD FUNCTIONALITY
   =========================================== */

// Copy shortened URL to user's clipboard with visual feedback
async function copyToClipboard(text, button) {
    console.log('Copying to clipboard:', text);
    
    try {
        // Try modern clipboard API first
        await navigator.clipboard.writeText(text);
        
        // Provide visual feedback to user
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.classList.add('copied'); // Add CSS class for styling
        
        // Reset button text after 2 seconds
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
        
    } catch (error) {
        console.log('Clipboard API failed, using fallback');
        
        // Fallback method for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select(); // Select the text
        document.execCommand('copy'); // Copy selected text
        document.body.removeChild(textArea); // Clean up
        
        // Show feedback even with fallback method
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = 'Copy';
        }, 2000);
    }
}

/* ===========================================
   VISIT TRACKING & POLLING
   =========================================== */

// Start polling the server for visit count updates
function startVisitPolling(slug) {
    // Prevent duplicate polling for the same URL
    if (window.visitPolls && window.visitPolls[slug]) {
        clearInterval(window.visitPolls[slug]);
    }
    
    // Poll server every 5 seconds for updated visit counts
    const pollInterval = setInterval(async () => {
        try {
            // Make API call to get current stats for this URL
            const response = await fetch(`/api/stats/${slug}`);
            if (response.ok) {
                const stats = await response.json();
                // Update the display with new visit count
                updateVisitCount(slug, stats.visits);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }, 5000); // 5 second interval
    
    // Store interval ID for cleanup if needed
    window.visitPolls = window.visitPolls || {};
    window.visitPolls[slug] = pollInterval;
}

// Update visit count in the UI and save to localStorage
function updateVisitCount(slug, visits) {
    // Find the element displaying visit count for this URL
    const visitElement = document.querySelector(`[data-slug="${slug}"]`);
    if (visitElement) {
        // Update the displayed visit count
        visitElement.textContent = `${visits} visits`;
        
        // Update the count in our local data array
        const urlData = shortenedUrls.find(url => url.slug === slug);
        if (urlData) {
            urlData.visits = visits;
            // Save updated data to localStorage for persistence
            saveUrls();
        }
    }
}

/* ===========================================
   UTILITY FUNCTIONS
   =========================================== */

// Validate if a string is a properly formatted URL
function isValidUrl(string) {
    try {
        new URL(string); // This will throw if invalid
        return true;
    } catch (_) {
        return false; // Invalid URL format
    }
}

// Show/hide loading state on the shorten button
function setLoadingState(loading) {
    const shortenButton = document.getElementById('shorten-button');
    shortenButton.disabled = loading; // Disable button while loading
    shortenButton.classList.toggle('loading', loading); // Add/remove CSS class
    // Change button text to show current state
    shortenButton.textContent = loading ? 'Shortening...' : 'Shorten URL';
}

// Display error message to user
function showError(message) {
    const urlInput = document.getElementById('url-input');
    // Check if error message element already exists
    let errorDiv = document.querySelector('.error-message');
    if (!errorDiv) {
        // Create error message element if it doesn't exist
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        // Insert after the input container
        urlInput.parentNode.insertAdjacentElement('afterend', errorDiv);
    }
    // Set error message and make it visible
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Hide any displayed error messages
function hideError() {
    const errorDiv = document.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

/* ===========================================
   GLOBAL EXPORTS
   =========================================== */

// Make copyToClipboard function available globally for inline onclick handlers
window.copyToClipboard = copyToClipboard;