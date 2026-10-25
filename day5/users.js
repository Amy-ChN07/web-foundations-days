// DOM Elements
const loadBtn = document.getElementById('load-users');
const statusEl = document.getElementById('status');
const usersList = document.getElementById('users-list');
const filterInput = document.getElementById('filter-input');

// State to store the fetched users so we don't have to re-fetch
let allUsers = [];

// Function to render a given list of users
function renderUsers(list) {
    // Clear current list
    usersList.innerHTML = ''; 

    if (list.length === 0) {
        statusEl.textContent = "No users match your filter.";
        return;
    }

    // Build DOM elements securely
    list.forEach(user => {
        const li = document.createElement('li');
        li.className = 'user-card';

        const name = document.createElement('h2');
        name.textContent = user.name;

        const email = document.createElement('p');
        email.textContent = `Email: ${user.email}`;

        const city = document.createElement('p');
        city.textContent = `City: ${user.address.city}`; // Note: JSONPlaceholder nests city in address

        const company = document.createElement('p');
        company.textContent = `Company: ${user.company.name}`;

        li.appendChild(name);
        li.appendChild(email);
        li.appendChild(city);
        li.appendChild(company);

        usersList.appendChild(li);
    });
}

// Async function to load users
async function loadUsers() {
    // Disable button and set loading message
    loadBtn.disabled = true;
    statusEl.textContent = 'Loading users...';
    usersList.innerHTML = ''; // Clear previous results
    
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/users');
        
        // Check if response is OK (status 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        allUsers = await response.json();
        
        statusEl.textContent = `Successfully loaded ${allUsers.length} users.`;
        
        // Render the full list initially
        renderUsers(allUsers);

    } catch (error) {
        // Error handling
        statusEl.textContent = `Error loading users: ${error.message}`;
    } finally {
        // Re-enable button regardless of success or failure
        loadBtn.disabled = false;
    }
}

// Event Listeners
loadBtn.addEventListener('click', loadUsers);

filterInput.addEventListener('input', (e) => {
    // Get typed text, convert to lowercase for case-insensitive matching
    const searchTerm = e.target.value.toLowerCase();
    
    // If the search is empty, show all users again
    if (searchTerm === '') {
        statusEl.textContent = `Showing all ${allUsers.length} users.`;
        renderUsers(allUsers);
        return;
    }

    // Filter the stored array
    const filteredUsers = allUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm)
    );

    // Update status text depending on results
    if (filteredUsers.length > 0) {
        statusEl.textContent = `Showing ${filteredUsers.length} user(s).`;
    }
    
    // Pass the filtered result to the render function
    renderUsers(filteredUsers);
});