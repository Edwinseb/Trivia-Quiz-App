
document.addEventListener('DOMContentLoaded', () => {
    const categoryGrid = document.getElementById('category-grid');
    const startBtn = document.getElementById('start-btn');
    let selectedCategory = null;

    // Category selection
    categoryGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn')) {
            // Remove selected class from all buttons
            categoryGrid.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('selected');
            });

            // Add selected class to clicked button
            e.target.classList.add('selected');
            selectedCategory = e.target.dataset.category;

            // Enable start button
            startBtn.disabled = false;
        }
    });

    // Start quiz
    startBtn.addEventListener('click', () => {
        if (selectedCategory) {
            // TODO: Navigate to quiz page or start quiz
            console.log(`Starting quiz in category: ${selectedCategory}`);
            alert(`Starting quiz in ${selectedCategory} category!`);
        }
    });
});

// logout btn
document.getElementById('logoutBtn').addEventListener('click', function() {
    fetch('/logout', {
        method: 'GET',
        credentials: 'same-origin' // Ensure cookies are sent with the request
    })
    .then(response => window.location.href = '/public/index.html') // Redirect to index after logout
    .catch(error => console.error('Logout failed:', error));
});
