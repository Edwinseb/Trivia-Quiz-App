
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
            loadQuiz(selectedCategory);
        }
    });

    // logout btn
    document.getElementById('logoutBtn').addEventListener('click', function () {
        fetch('/logout', {
            method: 'GET',
            credentials: 'same-origin' // Ensure cookies are sent with the request
        })
            .then(response => {
                alert('Logged out');
                window.location.href = '/index.html'
            }) // Redirect to index after logout
            .catch(error => console.error('Logout failed:', error));


    });

    //profile button
    document.getElementById('profileBtn').addEventListener('click', function () {
        fetch('/api/user', {
            method: 'GET', credentials: 'same-origin'
        })
            .then(response => window.location.href = '/userProfile/userProfile.html') //redirect to profile
            .catch(error => console.error('could not load user profile', error))
    });
});



//loading quiz based on category
function loadQuiz(category) {
    const quizContainer = document.querySelector('.quiz-container')
    quizContainer.style.height = "fit-content"; //to display all questions uniformly within the quiz-container
    fetch(`http://localhost:3000/questions?category=${category}`)
        .then(response => response.json())
        .then(data => {
            console.log("Quiz Questions:", data); // Log to check response
            if (data.length === 0) {
                alert("No questions found for this category!");
                return;
            }
            displayQuestions(data); // Ensure questions are displayed
        })
        .catch(error => console.error("Error fetching questions:", error));
}

//displaying questions
function displayQuestions(questions) {
    console.log("Displaying Questions:", questions);
    const quizContainer = document.querySelector('.quiz-container');
    quizContainer.innerHTML = ""; // Clear previous content
    
    questions.forEach((q, index) => {
        const questionDiv = document.createElement("div");
        questionDiv.classList.add("question");

        questionDiv.innerHTML = `
            <h3>${index + 1}. ${q.question_text}</h3>
            
                <label><input type="radio" name="q${index}" value="A"> ${q.a}</label><br>
                <label><input type="radio" name="q${index}" value="B"> ${q.b}</label><br>
                <label><input type="radio" name="q${index}" value="C"> ${q.c}</label><br>
                <label><input type="radio" name="q${index}" value="D"> ${q.d}</label><br>`;

        quizContainer.appendChild(questionDiv);
    });
}


// Example usage
//loadQuiz("Math");
