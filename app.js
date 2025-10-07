// --- 1. CONFIGURATION AND CORE SETUP ---

// The base URL for the Wikipedia API "On This Day" data
const API_BASE_URL = 'https://en.wikipedia.org/api/rest_v1/feed/onthisday/selected/';


// Helper function to dynamically add options to a dropdown
function populateDropdown(selectorId, count, startValue = 1) {
    const selector = document.getElementById(selectorId);
    for (let i = startValue; i <= count; i++) {
        const option = document.createElement('option');
        // Pad numbers with a leading zero (e.g., 01, 02)
        const displayValue = i.toString().padStart(2, '0');
        option.value = displayValue; 
        option.textContent = displayValue;
        selector.appendChild(option);
    }
}

// --- NEW CLOCK FUNCTION ---
function updateClock() {
    const now = new Date();
    
    // Formatting the Date (dd-mm-yyyy)
    // Uses en-GB locale for dd/mm/yyyy structure, then replaces slashes
    const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const formattedDate = now.toLocaleDateString('en-GB', dateOptions).replace(/\//g, '-');
    
    // Formatting the Time (hr:mm:ss IST)
    // Uses Asia/Kolkata timezone and 24-hour format
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' };
    const formattedTime = now.toLocaleTimeString('en-US', timeOptions);
    
    // Combine the output and display
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

    // Update TODAY'S HISTORY button text with the current date
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
    
    // START THE CLOCK TIMER (UPDATES EVERY SECOND)
    updateClock(); 
    setInterval(updateClock, 1000); 
}

// Load controls and start clock when the page loads
document.addEventListener('DOMContentLoaded', loadDataAndPopulateControls);


// --- 2. FUNCTION TO FETCH AND DISPLAY EVENTS ---

async function lookupEvent() {
    const month = document.getElementById('monthSelector').value;
    const day = document.getElementById('daySelector').value;
    const eventList = document.getElementById('eventList');
    
    // Show loading state
    eventList.innerHTML = '<li class="event-item placeholder">Fetching data from Wikipedia...</li>'; 

    if (!month || !day) {
        eventList.innerHTML = '<li class="event-item placeholder">Please select both a Month and a Day.</li>';
        return;
    }
    
    // Construct the final Wikipedia API URL
    const apiUrl = `${API_BASE_URL}${month}/${day}`;

    try {
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const events = data.selected || []; // Access the 'selected' events array
        
        eventList.innerHTML = ''; // Clear loading message

        if (events.length > 0) {
            // Display each event
            events.forEach(item => {
                const li = document.createElement('li');
                li.className = 'event-item';
                
                // Get the link to the full article
                const articleLink = item.pages && item.pages.length > 0 ? item.pages[0].content_urls.desktop.page : null;
                const eventText = `${item.text}`;
                
                if (articleLink) {
                    // Create a clickable link
                    li.innerHTML = `<a href="${articleLink}" target="_blank" class="event-link">
                                        <span class="year-label">${item.year}:</span> ${eventText}
                                    </a>`;
                } else {
                    // Display as plain text if no link is found
                    li.innerHTML = `<span class="year-label">${item.year}:</span> ${eventText}`;
                }
                
                eventList.appendChild(li);
            });
        } else {
            eventList.innerHTML = '<li class="event-item placeholder">No major historical events found for this date.</li>';
        }

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

    lookupEvent();
}

function searchRandom() {
    // Helper to get a random number
    const getRandomNumber = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    const randomMonth = getRandomNumber(1, 12).toString().padStart(2, '0');
    const randomDay = getRandomNumber(1, 31).toString().padStart(2, '0');

    // Set dropdowns and trigger search
    document.getElementById('monthSelector').value = randomMonth;
    document.getElementById('daySelector').value = randomDay;

    lookupEvent();
}
