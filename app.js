// --- 1. SETUP AND SELECTOR POPULATION ---

// The base URL for the Wikipedia API "On This Day" data
const API_BASE_URL = 'https://en.wikipedia.org/api/rest_v1/feed/onthisday/selected/';


// Helper function to dynamically add options to a dropdown
function populateDropdown(selectorId, count, startValue = 1) {
    const selector = document.getElementById(selectorId);
    for (let i = startValue; i <= count; i++) {
        const option = document.createElement('option');
        // Add a leading zero if the number is less than 10 (e.g., 01, 02)
        const displayValue = i.toString().padStart(2, '0');
        option.value = displayValue; // Use padded value for setting selection
        option.textContent = displayValue;
        selector.appendChild(option);
    }
}

// Function to populate controls AND update the "TODAY'S HISTORY" button text
function loadDataAndPopulateControls() {
    // Populate Month (1 to 12)
    populateDropdown('monthSelector', 12);
    
    // Populate Day (1 to 31)
    populateDropdown('daySelector', 31);

    // --- Update TODAY'S HISTORY button text with the current date ---
    const today = new Date();
    // Format the date professionally (e.g., Oct 7)
    const formattedDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(today);
    
    const todayButton = document.querySelector('.quick-searches-wrapper .quick-button:first-child');
    if (todayButton) {
        // Use innerHTML to inject the two-line structure
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

// Load controls when the page loads
document.addEventListener('DOMContentLoaded', loadDataAndPopulateControls);


// --- 2. FUNCTION TO FETCH AND DISPLAY EVENTS ---

async function lookupEvent() {
    const month = document.getElementById('monthSelector').value;
    const day = document.getElementById('daySelector').value;
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
        const events = data.selected || [];
        
        eventList.innerHTML = ''; 

        if (events.length > 0) {
            events.forEach(item => {
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
            eventList.innerHTML = '<li class="event-item placeholder">No major historical events found for this date.</li>';
        }

    } catch (error) {
        console.error("Error fetching Wikipedia data:", error);
        eventList.innerHTML = `<li class="event-item" style="color: red;">Error accessing Wikipedia data. (${error.message})</li>`;
    }
}


// --- 3. NEW QUICK SEARCH FUNCTIONS (FIXED) ---

function searchToday() {
    const today = new Date();
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    const currentDay = today.getDate().toString().padStart(2, '0');

    // Set the dropdown values
    document.getElementById('monthSelector').value = currentMonth;
    document.getElementById('daySelector').value = currentDay;

    // Trigger the main search function
    lookupEvent();
}

function searchRandom() {
    // Function to get a random number between min (inclusive) and max (inclusive)
    const getRandomNumber = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    // Get a random month (1 to 12) and pad it
    const randomMonth = getRandomNumber(1, 12).toString().padStart(2, '0');
    
    // Get a random day (1 to 31) and pad it
    const randomDay = getRandomNumber(1, 31).toString().padStart(2, '0');

    // Set the dropdown values
    document.getElementById('monthSelector').value = randomMonth;
    document.getElementById('daySelector').value = randomDay;

    // Trigger the main search function
    lookupEvent();
}
