
document.addEventListener('DOMContentLoaded', () => {
    const categoryGrid = document.getElementById('category-grid');
    const startBtn = document.getElementById('startBtn');
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
    quizContainer.style.width = "fit-content"
    quizContainer.innerHTML = `<div class="quiz-heading">
                                    <h2>${category} Quiz</h2>
                               </div>`; //category based heading

    fetch(`http://localhost:3000/questions?category=${category}`)
        .then(response => response.json())
        .then(data => {
            console.log("Quiz Questions:", data); // Log to check response
            if (data.length === 0) {

                const alert = document.createElement('h4');
                alert.innerHTML = `No questions in this category, redirecting to Home Page`;
                quizContainer.appendChild(alert);

                setTimeout(() => {
                    window.location.href = './index.html';
                }, 3000);
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
    //quizContainer.innerHTML = ""; // Clear previous content

    questions.forEach((q, index) => {
        const questionDiv = document.createElement("div");
        questionDiv.classList.add("question");
        questionDiv.dataset.questionId = q.id; // Store question ID

        questionDiv.innerHTML = `
            <h3>${index + 1}. ${q.question_text}</h3>
            
                <label><input type="radio" name="q${index}" value="A"> ${q.a}</label><br>
                <label><input type="radio" name="q${index}" value="B"> ${q.b}</label><br>
                <label><input type="radio" name="q${index}" value="C"> ${q.c}</label><br>
                <label><input type="radio" name="q${index}" value="D"> ${q.d}</label><br>`;

        quizContainer.appendChild(questionDiv);

    });
    createSubmitButton();

}
//creating submit button
function createSubmitButton() {
    const quizContainer = document.querySelector('.quiz-container');
    const sub = document.createElement("button");
    sub.type = "button"; // Changed from "submit" to prevent form submission
    sub.textContent = "Submit";
    sub.id = "submitBtn";
    sub.classList = "m-0 py-2 px-5 font-bold text-black bg-[#ccf0ff] hover:bg-[#3bc7ff] hover:text-white rounded-md";
    quizContainer.appendChild(sub);

    // Add event listener to the button after creating it
    sub.addEventListener('click', submitQuiz);
}
//Submit the quiz
function submitQuiz() {
    const quiz_id = `quiz-${Date.now()}`; // Unique quiz ID
    const userAnswers = [];

    document.querySelectorAll('.question').forEach((questionDiv, index) => {
        const question_id = questionDiv.dataset.questionId;
        const selectedOption = questionDiv.querySelector(`input[name="q${index}"]:checked`);

        if (selectedOption) {
            userAnswers.push({
                question_id: question_id,
                selected_option: selectedOption.value
            });
        }
    });

    if (userAnswers.length === 0) {
        alert("Please select at least one answer!");
        return;
    }

    console.log("Submitting answers:", userAnswers); // Debug: Log answers being sent
    console.log("Payload being sent:", JSON.stringify({ quiz_id, answers: userAnswers }));
    fetch('http://localhost:3000/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Changed from 'same-origin' to 'include'
        body: JSON.stringify({ quiz_id, answers: userAnswers })
    })
    .then(response => {
        console.log("Response status:", response.status); // Debug: Log HTTP status
        
        if (!response.ok) {
            return response.json().then(errorData => {
                console.error("Server error:", errorData); // Debug: Log error data
                throw new Error(errorData.error || 'Server error');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log("Server response data:", data); // Debug: Log full response data
        
        if (data.score !== undefined && data.total !== undefined) {
            alert(`Quiz Submitted! Score: ${data.score}/${data.total}`);
        } else {
            console.warn("Score or total missing in response:", data);
            alert("Quiz submitted successfully!");
        }
        
        // Don't redirect immediately in development to see console logs
        setTimeout(() => {
            window.location.href = './index.html'; // Changed to relative path
        }, 2000);
    })
    .catch(error => {
        console.error("Error submitting quiz:", error);
        alert(`Error submitting quiz: ${error.message}`);
    });
}


