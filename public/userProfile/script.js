document.addEventListener('DOMContentLoaded', function () {
    // Fetch user data from the backend
    fetch('/api/user', {
        method: 'GET',
        credentials: 'same-origin' // Ensure session cookies are sent
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            window.location.href = 'http://localhost:3000/account.html#loginForm'; // Redirect if not logged in
            return;
        }

        // Update profile with actual user data
        document.getElementById('username').innerText = data.username;
        document.getElementById('email').innerText = data.email;
        document.getElementById('gamesPlayed').innerText = data.gamesPlayed;
        document.getElementById('highScore').innerText = `${data.highScore}/15`;
    })
    .catch(error => console.error('Failed to load user profile:', error));
});

// Logout button functionality
document.getElementById('logoutBtn').addEventListener('click', function () {
    fetch('/logout', {
        method: 'GET',
        credentials: 'same-origin'
    })
    .then(alert('Logged out!'))
    .then(response => window.location.href = '/index.html') // Redirect to index after logout
    .catch(error => console.error('Logout failed:', error));
});

//dashboard function
document.getElementById('homeBtn').addEventListener('click', function(){
    window.location.href = '/index.html';
});
