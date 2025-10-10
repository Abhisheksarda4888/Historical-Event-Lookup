// --- 1. CONFIGURATION AND CORE SETUP ---

const API_BASE_URL = 'https://en.wikipedia.org/api/rest_v1/feed/onthisday/selected/';
const WIKI_SEARCH_API = 'https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srsearch=';
const WIKI_PAGE_URL = 'https://en.wikipedia.org/wiki/';
const REST_COUNTRIES_API = 'https://restcountries.com/v3.1/all?fields=name,cca2'; 
const NEWS_PROXY_ENDPOINT = '/api/get-news'; 

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

let countryList = []; 


// --- 2. PROFILE & NAVIGATION CORE FUNCTIONS (MOVED TO TOP) ---
// These functions are critical for the HTML onclick to work immediately.

function createUserProfile() {
    // FIX: Get the name input element and its value
    const nameInput = document.getElementById('userNameInput');
    const newName = nameInput ? nameInput.value.trim() : '';

    if (newName.length < 2) {
        alert("Please enter a valid name (2+ characters).");
        return;
    }

    localStorage.setItem('archiveUserName', newName);
    checkUserStatus(); 
}

function checkUserStatus() {
    const userName = localStorage.getItem('archiveUserName');
    const registrationForm = document.getElementById('registrationForm');
    const pathSelection = document.getElementById('pathSelection');
    const welcomeHeader = document.getElementById('welcomeHeader');

    if (userName) {
        registrationForm.classList.add('hidden-app');
        pathSelection.classList.remove('hidden-app');
        welcomeHeader.textContent = `WELCOME BACK, ${userName.toUpperCase()}`;
        
    } else {
        registrationForm.classList.remove('hidden-app');
        pathSelection.classList.add('hidden-app');
    }
}

function showModal() {
    const modal = document.getElementById('initialModal');
    const mainApp = document.getElementById('mainApp');
    const scrollBtn = document.getElementById('scrollUpBtn');

    checkUserStatus(); 

    mainApp.classList.add('hidden-app');
    modal.classList.remove('hidden-app');
    scrollBtn.classList.add('hidden-app'); 
}

function selectPath(path) {
    const modal = document.getElementById('initialModal');
    const mainApp = document.getElementById('mainApp');
    const historicalView = document.getElementById('historicalView');
    const searchView = document.getElementById('searchView');
    const countryView = document.getElementById('countryView'); 
    const scrollBtn = document.getElementById('scrollUpBtn');

    modal.classList.add('hidden-app');
    mainApp.classList.remove('hidden-app');
    
    historicalView.classList.add('hidden-app');
    searchView.classList.add('hidden-app');
    countryView.classList.add('hidden-app');

    if (path === 'historical') {
        historicalView.classList.remove('hidden-app');
        loadDataAndPopulateControls(); 
    } else if (path === 'search') {
        searchView.classList.remove('hidden-app');
    } else if (path === 'country') { 
        countryView.classList.remove('hidden-app');
        loadCountrySelector(); 
    }
    
    scrollBtn.classList.remove('hidden-app');
}

// --- CLOCK, SCROLL & UTILITY FUNCTIONS ---

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

function loadDataAndPopulateControls() {
    populateDropdown('monthSelector', 12);
    populateDropdown('daySelector', 31);

    const today = new Date();
    const formattedDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(today);
    
    const todayButton = document.querySelector('.quick-searches-wrapper .quick-button:first-child');
    if (todayButton) {
        todayButton.innerHTML = `TODAY'S HISTORY<br>
                                 <span>${formattedDate}</span>`;
    }
    
    const randomButton = document.querySelector('.quick-searches-wrapper .quick-button:last-child');
    if (randomButton) {
        randomButton.innerHTML = `RANDOM DATE<br>
                                 <span>Unlock New History</span>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateClock(); 
    setInterval(updateClock, 1000); 
    
    checkUserStatus(); 

    window.addEventListener('scroll', toggleScrollUpButton);
});

function toggleScrollUpButton() {
    const scrollBtn = document.getElementById('scrollUpBtn');
    if (window.scrollY > 300) { 
        scrollBtn.classList.remove('hidden-app');
    } else {
        scrollBtn.classList.add('hidden-app');
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


// --- 3. FILTERING LOGIC ---

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


// --- 4. HISTORICAL LOOKUP FUNCTION ---

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


// --- 5. QUICK SEARCH AND TOPIC SEARCH FUNCTIONS ---

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

function clearCountryResults() {
    const resultList = document.getElementById('countryResultList');
    const searchInput = document.getElementById('countrySearchInput');
    
    resultList.innerHTML = `<li class="event-item placeholder">
        <span class="year-label">System:</span> Select a country and category above.
    </li>`;
    searchInput.value = ''; // Clear the input bar
}


// --- 7. GLOBAL UTILITY FUNCTIONS (Country Selector/News) ---

async function fetchCountries() {
    try {
        const response = await fetch(REST_COUNTRIES_API);
        const data = await response.json();
        
        let countryList = data.sort((a, b) => a.name.common.localeCompare(b.name.common));

        const dropdown = document.getElementById('countryListDropdown');
        dropdown.innerHTML = '';
        countryList.forEach(country => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = country.name.common;
            item.setAttribute('data-code', country.cca2);
            
            item.onclick = (e) => selectCountry(e.target.textContent, e.target.getAttribute('data-code'));
            dropdown.appendChild(item);
        });

    } catch (error) {
        console.error("Error loading countries:", error);
        const dropdown = document.getElementById('countryListDropdown');
        dropdown.innerHTML = '<div class="autocomplete-item" style="color: red;">Error loading country list.</div>';
    }
}

function filterCountries() {
    const input = document.getElementById('countrySearchInput').value.toLowerCase();
    const dropdown = document.getElementById('countryListDropdown');
    const items = dropdown.getElementsByClassName('autocomplete-item');

    let matchesFound = false;

    for (let i = 0; i < items.length; i++) {
        const countryName = items[i].textContent.toLowerCase();
        if (countryName.includes(input)) {
            items[i].style.display = 'block';
            matchesFound = true;
        } else {
            items[i].style.display = 'none';
        }
    }

    if (input.length > 0 && matchesFound) {
        dropdown.classList.remove('hidden-app');
    } else if (input.length === 0) {
        for (let i = 0; i < items.length; i++) { items[i].style.display = 'block'; }
        dropdown.classList.remove('hidden-app');
    } else {
         dropdown.classList.add('hidden-app');
    }
}

function selectCountry(name, code) {
    document.getElementById('countrySearchInput').value = name;
    document.getElementById('countryListDropdown').classList.add('hidden-app');
}

function showCountryList() {
    document.getElementById('countryListDropdown').classList.remove('hidden-app');
    document.addEventListener('scroll', () => {
        document.getElementById('countryListDropdown').classList.add('hidden-app');
    });
}

function loadCountrySelector() {
    const dropdown = document.getElementById('countryListDropdown');
    if (dropdown.children.length <= 1) { 
        fetchCountries();
    }
    document.getElementById('countrySearchInput').value = '';
}

// Function to handle the final news search query (using country name from input)
async function fetchCountryNews() {
    const countryName = document.getElementById('countrySearchInput').value.trim();
    const category = document.getElementById('newsCategorySelector').value;
    const resultList = document.getElementById('countryResultList');

    if (!countryName) {
        resultList.innerHTML = '<li class="event-item placeholder">Please enter or select a Country.</li>';
        return;
    }

    // --- FIX: Dynamic Search Query based on Category ---
    let searchQuery;
    let displayCategory = category;

    if (category === "ALL") {
        // If ALL is selected, send a broad query for the country's main news
        searchQuery = `top headlines ${countryName} OR ${countryName} general facts`;
        displayCategory = "Top Headlines/General"; // For the user message
    } else {
        // Use the selected category and country for a focused search
        searchQuery = `${category} news in ${countryName}`;
    }

    resultList.innerHTML = `<li class="event-item placeholder">Searching for LIVE ${displayCategory} in ${countryName}...</li>`;

    // --- EXECUTES SECURE VERCEL PROXY CALL ---
    try {
        const newsResponse = await fetch(NEWS_PROXY_ENDPOINT, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: searchQuery })
        });
        
        const newsData = await newsResponse.json();

        resultList.innerHTML = ''; // Clear loading message

        if (newsData.error) {
            return resultList.innerHTML = `<li class="event-item" style="border-left-color: red;">
                <span class="year-label">API ERROR:</span> ${newsData.error}
            </li>`;
        }
        
        const articles = newsData.articles;
        
        if (articles && articles.length > 0) {
            articles.forEach(article => {
                const li = document.createElement('li');
                li.className = 'event-item';
                
                li.innerHTML = `<a href="${article.url}" target="_blank" class="event-link">
                                    <span class="year-label">${article.source.name} (${article.publishedAt ? article.publishedAt.substring(0, 10) : 'Date N/A'})</span><br>
                                    ${article.title}
                                </a>`;
                resultList.appendChild(li);
            });
        } else {
            resultList.innerHTML = `<li class="event-item placeholder">No recent news articles found for "${searchQuery}".</li>`;
        }
    } catch (error) {
        console.error("Frontend Fetch Error:", error);
        resultList.innerHTML = `<li class="event-item" style="border-left-color: red;">
            <span class="year-label">CONNECTION FAILED:</span> Could not reach the news proxy function. Check Vercel logs.
        </li>`;
    }
}
