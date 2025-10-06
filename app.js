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
        option.value = i;
        option.textContent = displayValue;
        selector.appendChild(option);
    }
}

// Populate the controls when the page loads
function loadDataAndPopulateControls() {
    // Populate Month (1 to 12)
    populateDropdown('monthSelector', 12);
    
    // Populate Day (1 to 31)
    populateDropdown('daySelector', 31);
}

// Load controls when the page loads
document.addEventListener('DOMContentLoaded', loadDataAndPopulateControls);


// --- 2. FUNCTION TO FETCH AND DISPLAY EVENTS ---

async function lookupEvent() {
    // We use .value to get the selected number
    const month = document.getElementById('monthSelector').value;
    const day = document.getElementById('daySelector').value;
    const eventList = document.getElementById('eventList');
    
    // Clear previous results and show loading message
    eventList.innerHTML = '<li class="event-item placeholder">Fetching data from Wikipedia...</li>'; 

    // Validation (Checks if a month and day were actually selected)
    if (!month || !day) {
        eventList.innerHTML = '<li class="event-item placeholder">Please select both a Month and a Day.</li>';
        return;
    }
    
    // Construct the API URL: API_BASE_URL + month_number + day_number
    const apiUrl = `${API_BASE_URL}${month}/${day}`;

    try {
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        // Wikipedia returns an array of events under the 'selected' key
        const events = data.selected || [];
        
        eventList.innerHTML = ''; // Clear loading message

        if (events.length > 0) {
            // Display each event
            events.forEach(item => {
                const li = document.createElement('li');
                li.className = 'event-item';
                
                // Format: Year: Description
                li.innerHTML = `<span class="year-label">${item.year}:</span> ${item.text}`;
                eventList.appendChild(li);
            });
        } else {
            // No results found
            eventList.innerHTML = '<li class="event-item placeholder">No major historical events found for this date.</li>';
        }

    } catch (error) {
        console.error("Error fetching Wikipedia data:", error);
        eventList.innerHTML = `<li class="event-item" style="color: red;">Error accessing Wikipedia data. (${error.message})</li>`;
    }
}