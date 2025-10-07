// --- 1. CONFIGURATION AND CORE SETUP ---

const API_BASE_URL = 'https://en.wikipedia.org/api/rest_v1/feed/onthisday/selected/';
const WIKI_SEARCH_API = 'https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srsearch=';
const WIKI_PAGE_URL = 'https://en.wikipedia.org/wiki/';

// Mapping of category names to keywords for client-side filtering
const CATEGORY_KEYWORDS = {
    'science': ['science', 'discover', 'space', 'astronomy', 'physics', 'invention', 'technology', 'nobel', 'experiment'],
    'wars': ['war', 'battle', 'army', 'conflict', 'invasion', 'treaty', 'military', 'siege', 'bombing', 'assassin', 'killed', 'forces'],
    'art': ['art', 'literature', 'novel', 'painting', 'sculpture', 'music', 'album', 'theater', 'poet', 'author', 'written', 'book'],
    'politics': ['president', 'prime minister', 'elected', 'legislation', 'government', 'signed', 'vote', 'republic', 'state', 'cabinet'],
    'disaster': ['earthquake', 'flood', 'hurricane', 'volcano', 'disaster', 'accident', 'crash', 'sinks', 'storm'],
    'sports': ['championship', 'olympic', 'world cup', 'game', 'team', 'match', 'record', 'won', 'league', 'final'],
    'economy': ['bank', 'company', 'market', 'stock', 'finance', 'dollar', 'gold', 'currency', 'business', 'founded'],
    'births': ['born'],
    'all': [''], 
};


// Helper function to dynamically add options to a dropdown
function populateDropdown(selectorId, count, startValue = 1) {
    const selector = document.getElementById(selectorId);
    for (let i = startValue; i <= count; i++) {
        const option = document.createElement('option');
        const displayValue = i.toString().padStart(2, '0');
        option.value = displayValue; 
        option.textContent = displayValue;
        selector.appendChild(option);
    }
}

// Function to update the clock display (dd-mm-yyyy hr:mm:ss IST)
function updateClock() {
    const now = new Date();
    
    const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const formattedDate = now.toLocaleDateString('en-GB', dateOptions).replace(/\//g, '-');
    
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' };
    const formattedTime = now.toLocaleTimeString('en-US', timeOptions);
    
    const clockElement = document.getElementById('realTimeClock');
    if (clockElement) {
        clockElement.textContent = `${formattedDate} ${formattedTime} IST`;
    }
}

// Function to populate controls AND update the "TODAY'S HISTORY" button text
function loadDataAndPopulateControls() {
    // Populate Month (1 to 12) and Day (1 to 31) dropdowns
    populateDropdown('monthSelector', 12);
    populateDropdown('daySelector', 31);

    // Update TODAY'S HISTORY button text
    const today = new Date();
    const formattedDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(today);
    
    const todayButton = document.querySelector('.quick-searches-wrapper .quick-button:first-child');
    if (todayButton) {
        todayButton.innerHTML = `TODAY'S HISTORY<br>
                                 <span>${formattedDate}</span>`;
    }
    
    // Update RANDOM DATE button text
    const randomButton = document.querySelector('.quick-searches-wrapper .quick-button:last-child');
    if (randomButton) {
        randomButton.innerHTML = `RANDOM DATE<br>
                                 <span>Unlock New History</span>`;
    }
}

// --- NEW NAVIGATION LOGIC ---

// Function to show the initial decision modal (used by the back button)
function showModal() {
    const modal = document.getElementById('initialModal');
    const mainApp = document.getElementById('mainApp');
    const scrollBtn = document.getElementById('scrollUpBtn');

    mainApp.classList.add('hidden-app');
    modal.classList.remove('hidden-app');
    scrollBtn.classList.add('hidden-app'); // Hide scroll button
}

function selectPath(path) {
    const modal = document.getElementById('initialModal');
    const mainApp = document.getElementById('mainApp');
    const historicalView = document.getElementById('historicalView');
    const searchView = document.getElementById('searchView');
    const scrollBtn = document.getElementById('scrollUpBtn');

    // 1. Hide the modal and show the main app container
    modal.classList.add('hidden-app');
    mainApp.classList.remove('hidden-app');
    
    // 2. Determine which specific view to show
    if (path === 'historical') {
        historicalView.classList.remove('hidden-app');
        searchView.classList.add('hidden-app');
        loadDataAndPopulateControls(); // Initialize controls and clock updates
    } else if (path === 'search') {
        searchView.classList.remove('hidden-app');
        historicalView.classList.add('hidden-app');
    }
    
    // Show scroll button after a path is selected
    scrollBtn.classList.remove('hidden-app');
}

// Ensure the clock starts running immediately on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Start the clock interval
    updateClock(); 
    setInterval(updateClock, 1000); 

    // Add scroll event listener to show/hide the scroll-up button
    window.addEventListener('scroll', toggleScrollUpButton);
});

// --- NEW SCROLL UP LOGIC ---

// Function to check scroll position and toggle button visibility
function toggleScrollUpButton() {
    const scrollBtn = document.getElementById('scrollUpBtn');
    if (window.scrollY > 300) { // Show button if scrolled down more than 300px
        scrollBtn.classList.remove('hidden-app');
    } else {
        scrollBtn.classList.add('hidden-app');
    }
}

// Function to scroll the page smoothly to the top
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


// --- 2. FILTERING LOGIC (Existing) ---

function applyYearFilter(events, filterValue) {
    if (filterValue === 'all') {
        return events;
    }
    
    return events.filter(item => {
        const year = parseInt(item.year);
        
        switch (filterValue) {
            case '2000': 
                return year >= 2001;
            case '1900': 
                return year >= 1901 && year <= 2000;
            case '1800': 
                return year >= 1801 && year <= 1900;
            case 'before1800': 
                return year <= 1800;
            default:
                return true;
        }
    });
}

function applyCategoryFilter(events, category) {
    if (category === 'all') {
        return events;
    }

    const keywords = CATEGORY_KEYWORDS[category];
    if (!keywords || keywords.length === 0) {
        return events;
    }

    return events.filter(item => {
        const eventText = item.text.toLowerCase();
        
        return keywords.some(keyword => eventText.includes(keyword));
    });
}


// --- 3. HISTORICAL LOOKUP FUNCTION (Existing) ---

async function lookupEvent() {
    const monthSelector = document.getElementById('monthSelector');
    const daySelector = document.getElementById('daySelector');
    const yearFilter = document.getElementById('yearFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    
    const month = monthSelector.value;
    const day = daySelector.value;
    const filterValue = yearFilter.value;
    const categoryFilterValue = categoryFilter.value;
    
    const eventList = document.getElementById('eventList');
    
    eventList.innerHTML = `<li class="event-item placeholder">Fetching data for ${month}-${day}...</li>`; 

    if (!month || !day) {
        eventList.innerHTML = '<li class="event-item placeholder">Please select both a Month and a Day.</li>';
        return;
    }
    
    const apiUrl = `${API_BASE_URL}${month}/${day}`;

    try {
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const rawEvents = data.selected || [];
        
        // Apply Filters
        const yearFilteredEvents = applyYearFilter(rawEvents, filterValue);
        const filteredEvents = applyCategoryFilter(yearFilteredEvents, categoryFilterValue);

        eventList.innerHTML = ''; // Clear loading message

        if (filteredEvents.length > 0) {
            filteredEvents.forEach(item => {
                const li = document.createElement('li');
                li.className = 'event-item';
                
                const articleLink = item.pages && item.pages.length > 0 ? item.pages[0].content_urls.desktop.page : null;
                const eventText = `${item.text}`;
                
                if (articleLink) {
                    li.innerHTML = `<a href="${articleLink}" target="_blank" class="event-link">
                                        <span class="year-label">${item.year}:</span> ${eventText}
                                    </a>`;
                } else {
                    li.innerHTML = `<span class="year-label">${item.year}:</span> ${eventText}`;
                }
                
                eventList.appendChild(li);
            });
        } else {
            eventList.innerHTML = `<li class="event-item placeholder">No ${categoryFilterValue} events found matching your selected date and filter.</li>`;
        }

        // Preserve Dropdown State After Successful Search
        monthSelector.value = month;
        daySelector.value = day;
        yearFilter.value = filterValue;
        categoryFilter.value = categoryFilterValue;

    } catch (error) {
        console.error("Error fetching Wikipedia data:", error);
        eventList.innerHTML = `<li class="event-item" style="color: red;">Error accessing Wikipedia data. (${error.message})</li>`;
    }
}


// --- 4. QUICK SEARCH AND TOPIC SEARCH FUNCTIONS ---

function searchToday() {
    const today = new Date();
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    const currentDay = today.getDate().toString().padStart(2, '0');

    document.getElementById('monthSelector').value = currentMonth;
    document.getElementById('daySelector').value = currentDay;

    lookupEvent();
}

function searchRandom() {
    const getRandomNumber = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    const randomMonth = getRandomNumber(1, 12).toString().padStart(2, '0');
    const randomDay = getRandomNumber(1, 28).toString().padStart(2, '0');

    document.getElementById('monthSelector').value = randomMonth;
    document.getElementById('daySelector').value = randomDay;

    lookupEvent();
}

async function searchTopic() {
    const query = document.getElementById('topicSearchInput').value.trim();
    const resultList = document.getElementById('topicResultList');
    
    if (query === "") {
        resultList.innerHTML = '<li class="event-item placeholder">Please enter a search topic.</li>';
        return;
    }

    // Show loading state
    resultList.innerHTML = `<li class="event-item placeholder">Searching Wikipedia for "${query}"...</li>`;
    
    const apiUrl = `${WIKI_SEARCH_API}${encodeURIComponent(query)}&origin=*`;

    try {
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const searchResults = data.query.search || [];

        resultList.innerHTML = ''; // Clear loading message

        if (searchResults.length > 0) {
            searchResults.forEach(item => {
                const li = document.createElement('li');
                li.className = 'event-item';
                
                // Construct the direct link using the page title
                const articleUrl = WIKI_PAGE_URL + encodeURIComponent(item.title.replace(/ /g, '_'));

                li.innerHTML = `<a href="${articleUrl}" target="_blank" class="event-link">
                                    <span class="year-label">${item.title}</span><br>
                                    ${item.snippet}...
                                </a>`;
                resultList.appendChild(li);
            });
        } else {
            resultList.innerHTML = `<li class="event-item placeholder">No results found for "${query}".</li>`;
        }

    } catch (error) {
        console.error("Error fetching search results:", error);
        resultList.innerHTML = `<li class="event-item" style="color: red;">Error accessing Wikipedia Search. (${error.message})</li>`;
    }
}


// --- 6. CLEAR SEARCH FUNCTIONS ---

function clearHistoryResults() {
    const eventList = document.getElementById('eventList');
    eventList.innerHTML = `<li class="event-item placeholder">
        <span class="year-label">System:</span> Results cleared. Select a new date.
    </li>`;
}

function clearTopicResults() {
    const resultList = document.getElementById('topicResultList');
    const searchInput = document.getElementById('topicSearchInput');
    
    resultList.innerHTML = `<li class="event-item placeholder">
        <span class="year-label">System:</span> Enter a topic to begin searching.
    </li>`;
    searchInput.value = ''; // Clear the input bar as well
}
