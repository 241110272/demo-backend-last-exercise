// Load quotes when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadQuotes();
});

async function loadQuotes() {
    const container = document.getElementById('quotes-container');

    // Show loading state
    container.innerHTML = `
    <div class="loading" style="grid-column: 1 / -1;">
      <div class="spinner"></div>
      <p>Loading quotes...</p>
    </div>
  `;

    try {
        // Fetch 9 random quotes from API
        const response = await fetch('/api/quotes/');
        const quotes = await response.json();

        if (quotes && quotes.length > 0) {
            renderQuotes(quotes);
        } else {
            container.innerHTML = '<div class="loading" style="grid-column: 1 / -1;"><p>No quotes available</p></div>';
        }
    } catch (error) {
        console.error('Error loading quotes:', error);
        container.innerHTML = `
      <div class="loading" style="grid-column: 1 / -1;">
        <p>Error loading quotes. Please try again.</p>
      </div>
    `;
    }
}

function renderQuotes(quotes) {
    const container = document.getElementById('quotes-container');

    container.innerHTML = quotes.map(quote => `
    <div class="quote-card">
      <p class="quote-text">${escapeHtml(quote.text)}</p>
      <p class="quote-author">${escapeHtml(quote.author)}</p>
    </div>
  `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
