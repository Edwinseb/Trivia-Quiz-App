
document.addEventListener('DOMContentLoaded', () => {
    const categoryGrid = document.getElementById('category-grid');
    const startBtn = document.getElementById('startBtn');
    let selectedCategory = null;

    // Category selection
    categoryGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn')) {
            // Remove aria-selected from all buttons
            categoryGrid.querySelectorAll('.category-btn').forEach(btn => {
                btn.removeAttribute('aria-selected');
            });

            // Set aria-selected on the clicked button
            e.target.setAttribute('aria-selected', 'true');
            selectedCategory = e.target.dataset.category;

            // Enable start button
            startBtn.disabled = false;
        }
    });

    // Start quiz
    startBtn.addEventListener('click', () => {
        if (selectedCategory ) {
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
            .then(response => response.json())
            .then(data => {
                alert('Logged out');
                window.location.href = '/index.html'
            }) // Redirect to index after logout
            .catch(error => console.error('Logout failed:', error));


    });

    const profileBtn = document.getElementById('profileBtn');
    fetch('/api/user', { method: 'GET', credentials: 'same-origin' })
        .then(response => response.json())
        .then(data => {
            if (data.username) {
                profileBtn.textContent = `Welcome, ${data.username}`; // Set username on button
            } else {
                profileBtn.textContent = `My Profile`;
            }
        })
        .catch(error => console.error('Could not fetch user data:', error));

    //profile page
    profileBtn.addEventListener('click', function () {
        fetch('/api/user', {
            method: 'GET', credentials: 'same-origin'
        })
            .then(response => {
                if (!response.ok) {
                    alert('Login to view profile');
                }
                window.location.href = '/userProfile/userProfile.html'; // Redirect if logged in
            })
            .catch(error => console.error('Could not load user profile:', error));
    });
});


//loading quiz based on category
function loadQuiz(category) {
    document.body.classList.add("flex", "flex-row", "justify-center", "items-center", "m-0", "bg-black/75", "bg-blend-overlay", "bg-center", "bg-cover", "bg-repeat-y");
    const quizContainer = document.querySelector('.quiz-container');
    quizContainer.style.height = "fit-content"; //to display all questions uniformly within the quiz-container
    quizContainer.style.width = "fit-content";
    quizContainer.innerHTML = `<div class="quiz-heading">
                                    <h2>${category} Quiz</h2>
                                    <a href="/index.html" class="mb-7.5" id="homeLink">Home</a>
                               </div>`;

    let timerDiv = document.createElement('div');
    timerDiv.id = 'timer';
    timerDiv.classList.add(
        "fixed", "flex", "flex-shrink", "flex-wrap", "top-2", "right-2", "text-lg", "font-bold", "text-center",
        "bg-[#3bc7ff]","text-black", "px-3", "py-1", "border-2", "border-black", "rounded-md"
    );
    //document.querySelector('.quiz-heading').appendChild(timerDiv);
    document.body.appendChild(timerDiv);
    

    fetch(`http://localhost:3000/questions?category=${category}`)
        .then(response => response.json())
        .then(data => {
            console.log("Quiz Questions:", data); // Log to check response
            if (data.length === 0) {
                document.getElementById('homeLink').style.display = 'none';
                const notice = document.createElement('h4');
                notice.innerHTML = `No questions in this category, redirecting to Home Page`;
                quizContainer.appendChild(notice);

                setTimeout(() => {
                    window.location.href = './index.html';
                }, 3000);
                return;
            }
            displayQuestions(data); // Ensure questions are displayed
            startTimer(5 * 60); // Start 5-minute timer
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

//function to run timer
function startTimer(duration) {
    let timerElement = document.getElementById('timer');
    let timeLeft = duration;

    function updateTimer() {
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;
        timerElement.innerHTML = `Time Left:<br>
                                  ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert('Time is up! Submitting quiz...');
            submitQuiz();
        }
        timeLeft--;
    }

    updateTimer(); // Show timer immediately
    let timerInterval = setInterval(updateTimer, 1000);
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
    let unanswered = false; // Flag to track unanswered questions

    document.querySelectorAll('.question').forEach((questionDiv, index) => {
        const question_id = questionDiv.dataset.questionId;
        const selectedOption = questionDiv.querySelector(`input[name="q${index}"]:checked`);

        if (selectedOption) {
            userAnswers.push({
                question_id: question_id,
                selected_option: selectedOption.value
            });
        } else {
            alert(`You have not answered question no. ${index + 1}, please select an option.`);
            unanswered = true; // Set flag to true
        }
    });

    if (unanswered) {
        return; // Stop function execution if any question is unanswered
    }

    if (userAnswers.length === 0) {
        alert("Please select at least one answer!");
        return;
    }

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


