// For profile/script.js
document.getElementById('logoutBtn').addEventListener('click', function() {
    fetch('/logout', {
        method: 'GET',
        credentials: 'same-origin' // Ensure cookies are sent with the request
    })
    .then(response => window.location.href = '/public/index.html') // Redirect to index after logout
    .catch(error => console.error('Logout failed:', error));
});
