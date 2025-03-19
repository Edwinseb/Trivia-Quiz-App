
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
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', function () {
        window.location.href = "/logout";
        logoutBtn.textContent=`Profile`;

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
                    window.location.href = '/account.html#loginForm';
                    return;
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
        "fixed", "flex", "flex-shrink", "flex-wrap", "top-2", "right-2","w-fit", "text-lg", "font-bold", "text-center",
        "bg-[#3bc7ff]","text-black", "px-3", "py-1", "border-2", "border-black", "rounded-md"
    );
 
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
    const quizContainer = document.querySelector('.quiz-container');
    questions = questions.sort(() => Math.random() - 0.5).slice(0,20);
    
    questions.forEach((q, index) => {
        const questionDiv = document.createElement("div");
        questionDiv.classList.add("question");
        questionDiv.dataset.questionId = q.id; // Store question ID

        // Create answer choices as an array
        const choices = [
            `<label><input type="radio" name="q${index}" value="A"> ${q.a}</label>`,
            `<label><input type="radio" name="q${index}" value="B"> ${q.b}</label>`,
            `<label><input type="radio" name="q${index}" value="C"> ${q.c}</label>`,
            `<label><input type="radio" name="q${index}" value="D"> ${q.d}</label>`
        ];

        // Shuffle answer choices
        choices.sort(() => Math.random() - 0.5);

        // Insert question and shuffled choices into the div
        questionDiv.innerHTML = `<h3>${index + 1}. ${q.question_text}</h3>` + choices.join('<br>');

        quizContainer.appendChild(questionDiv);
    });

    createSubmitButton();
}


//function to run timer
let timerInterval;

// Modify the startTimer function to store the interval ID
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
    timerInterval = setInterval(updateTimer, 1000);
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
    clearInterval(document.getElementById('timer'));
}
//Submit the quiz
function submitQuiz() {
    clearInterval(timerInterval);
    timer.disabled = true;
    timer.style.visible = 'none'
    const quiz_id = `quiz-${Date.now()}`; // Unique quiz ID
    const userAnswers = [];
    let unanswered = false; // Flag to track unanswered questions

    document.querySelectorAll('.question').forEach((questionDiv, index) => {
        const question_id = questionDiv.dataset.questionId;
        const selectedOption = questionDiv.querySelector(`input[name="q${index}"]:checked`);

        if (selectedOption) {
            userAnswers.push({
                question_id: question_id,
                selected_option: selectedOption.value,
                questionDiv: questionDiv, // Store reference to question div for later highlighting
                index: index // Store the question index
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

    // Disable all inputs to prevent further changes
    document.querySelectorAll('.question input').forEach(input => {
        input.disabled = true;
    });

    // Replace the submit button with "Loading..." text
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.textContent = "Processing Results...";
    submitBtn.disabled = true;

    fetch('http://localhost:3000/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
            quiz_id, 
            answers: userAnswers.map(({ question_id, selected_option }) => ({ 
                question_id, 
                selected_option 
            }))
        })
    })
    .then(response => {
        console.log("Response status:", response.status);

        if (!response.ok) {
            return response.json().then(errorData => {
                console.error("Server error:", errorData);
                throw new Error(errorData.error || 'Server error');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log("Server response data:", data);
        if (!data.quiz_id) {
            throw new Error("No quiz_id returned from server.");
        }
        
        // Display results
        displayQuizResults(data, userAnswers);
    })
    .catch(error => {
        console.error("Error submitting quiz:", error);
        alert(`Error submitting quiz: ${error.message}`);
        // Re-enable the submit button in case of error
        submitBtn.textContent = "Submit";
        submitBtn.disabled = false;
    });
}

// Function to display quiz results
function displayQuizResults(data, userAnswers) {
    const quizContainer = document.querySelector('.quiz-container');
    const timer = document.querySelector('#timer');
    if (timer) {
        timer.remove();
    }
    // Clear the submit button
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.remove();
    
    // Create results summary at the top
    const resultsSummary = document.createElement('div');
    resultsSummary.classList.add('results-summary', 'p-4', 'mb-6', 'rounded-lg', 'text-center');
    
    // Set background color based on score percentage
    const scorePercentage = (data.score / data.total) * 100;
    let bgColor;
    if (scorePercentage >= 80) {
        bgColor = 'bg-green-100 border-green-500';
    } else if (scorePercentage >= 60) {
        bgColor = 'bg-yellow-100 border-yellow-500';
    } else {
        bgColor = 'bg-red-100 border-red-500';
    }
    
    bgColor.split(' ').forEach(cls => resultsSummary.classList.add(cls));
resultsSummary.classList.add('border-2');

    
    resultsSummary.innerHTML = `
        <h2 class="text-2xl text-black font-bold mb-2">Quiz Results</h2>
        <p class="text-xl text-black">Your Score: <span class="font-bold">${data.score}/${data.total}</span> (${scorePercentage.toFixed(1)}%)</p>
    `;
    
    // Insert before the first question
    const firstQuestion = document.querySelector('.question');
    quizContainer.insertBefore(resultsSummary, firstQuestion);
    
    // If we have a quiz_id, fetch the detailed results
    if (data.quiz_id) {
        fetch(`http://localhost:3000/quiz-results/${data.quiz_id}`, {
            credentials: 'include' // Important for session cookies
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch quiz results');
            }
            return response.json();
        })
        .then(resultsData => {
            // Create a map of question IDs to results data
            const resultsMap = {};
            resultsData.forEach(result => {
                resultsMap[result.id] = result;
            });
            
            // Highlight correct and incorrect answers
            userAnswers.forEach(answer => {
                const questionDiv = answer.questionDiv;
                const questionResult = resultsMap[answer.question_id];
                
                if (!questionResult) return; // Skip if no result data for this question
                
                // Find the user's selected option
                const selectedLabel = questionDiv.querySelector(`input[value="${answer.selected_option}"]`).parentNode;
                
                // Find the correct option's label
                const correctLabel = questionDiv.querySelector(`input[value="${questionResult.correct_option}"]`).parentNode;
                
                // Style the selected option
                if (questionResult.is_correct) {
                    // Correct answer
                    selectedLabel.classList.add('correct-answer', 'bg-green-100', 'text-black', 'p-2', 'rounded', 'border-2', 'border-green-500', 'block', 'my-1');
                } else {
                    // Incorrect answer
                    selectedLabel.classList.add('incorrect-answer', 'bg-red-100','text-black', 'p-2', 'rounded', 'border-2', 'border-red-500', 'block', 'my-1');
                    // Highlight the correct answer
                    correctLabel.classList.add('correct-answer', 'bg-green-100', 'text-black', 'p-2', 'rounded', 'border-2', 'border-green-500', 'block', 'my-1');
                }
            });
        })
        .catch(error => {
            console.error("Error fetching quiz results:", error);
        });
    } else {
        console.warn("No quiz_id provided, cannot fetch detailed results");
    }
    
    // Scroll to the top to show the results summary
    window.scrollTo(0, 0);
    
    // Stop the timer
}

