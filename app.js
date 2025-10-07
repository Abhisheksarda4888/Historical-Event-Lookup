// --- 1. CONFIGURATION AND CORE SETUP ---

// The base URL for the Wikipedia API "On This Day" data
const API_BASE_URL = 'https://en.wikipedia.org/api/rest_v1/feed/onthisday/selected/';


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

// Function to update the clock display
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
    
    // START THE CLOCK TIMER
    updateClock(); 
    setInterval(updateClock, 1000); 
}

// Load controls and start clock when the page loads
document.addEventListener('DOMContentLoaded', loadDataAndPopulateControls);


// --- FILTERING LOGIC ---

function applyYearFilter(events, filterValue) {
    if (filterValue === 'all') {
        return events;
    }
    
    return events.filter(item => {
        const year = parseInt(item.year);
        
        switch (filterValue) {
            case '2000': // 21st Century (2001 - Present)
                return year >= 2001;
            case '1900': // 20th Century (1901 - 2000)
                return year >= 1901 && year <= 2000;
            case '1800': // 19th Century (1801 - 1900)
                return year >= 1801 && year <= 1900;
            case 'before1800': // Events before 1800
                return year <= 1800;
            default:
                return true;
        }
    });
}


// --- 2. FUNCTION TO FETCH, FILTER, AND DISPLAY EVENTS ---

async function lookupEvent() {
    const monthSelector = document.getElementById('monthSelector');
    const daySelector = document.getElementById('daySelector');
    const yearFilter = document.getElementById('yearFilter');
    
    const month = monthSelector.value;
    const day = daySelector.value;
    const filterValue = yearFilter.value; // Read the filter value
    
    const eventList = document.getElementById('eventList');
    
    eventList.innerHTML = '<li class="event-item placeholder">Fetching data from Wikipedia...</li>'; 

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
        
        // --- UX FIX: FILTERING ---
        const filteredEvents = applyYearFilter(rawEvents, filterValue);

        eventList.innerHTML = ''; 

        if (filteredEvents.length > 0) {
            // Display each event
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
            eventList.innerHTML = `<li class="event-item placeholder">No events found matching your selected date and filter.</li>`;
        }

        // --- UX FIX: PRESERVE DROPDOWN STATE AFTER SUCCESSFUL SEARCH ---
        // This ensures the Month and Day remain selected.
        monthSelector.value = month;
        daySelector.value = day;


    } catch (error) {
        console.error("Error fetching Wikipedia data:", error);
        eventList.innerHTML = `<li class="event-item" style="color: red;">Error accessing Wikipedia data. (${error.message})</li>`;
    }
}


// --- 3. QUICK SEARCH FUNCTIONS ---

function searchToday() {
    const today = new Date();
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    const currentDay = today.getDate().toString().padStart(2, '0');

    // Set dropdowns and trigger search
    document.getElementById('monthSelector').value = currentMonth;
    document.getElementById('daySelector').value = currentDay;
    
    // We do NOT reset the yearFilter here; it uses the default or user's last setting

    lookupEvent();
}

function searchRandom() {
    const getRandomNumber = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    const randomMonth = getRandomNumber(1, 12).toString().padStart(2, '0');
    // Note: Choosing a random day between 1 and 28 avoids date validation errors in Feb/30-day months
    const randomDay = getRandomNumber(1, 28).toString().padStart(2, '0');

    // Set dropdowns and trigger search
    document.getElementById('monthSelector').value = randomMonth;
    document.getElementById('daySelector').value = randomDay;
    
    // We do NOT reset the yearFilter here; it uses the default or user's last setting

    lookupEvent();
}
