document.addEventListener('DOMContentLoaded', () => {
    const categoryGrid = document.getElementById('category-grid');
    const startBtn = document.getElementById('startBtn');
    let selectedCategory = null;
  
    // Category selection
    categoryGrid.addEventListener('click', (e) => {
      if (e.target.classList.contains('category-btn')) {
        categoryGrid.querySelectorAll('.category-btn').forEach(btn => {
          btn.removeAttribute('aria-selected');
        });
        e.target.setAttribute('aria-selected', 'true');
        selectedCategory = e.target.dataset.category;
        startBtn.disabled = false;
      }
    });
  
    // Start quiz
    startBtn.addEventListener('click', () => {
      if (selectedCategory) {
        console.log(`Starting quiz in category: ${selectedCategory}`);
        alert(`Starting quiz in ${selectedCategory} category!`);
        loadQuiz(selectedCategory);
      }
    });
  
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', () => {
      window.location.href = '/logout';
      logoutBtn.textContent = 'Profile'; // Note: This won’t persist after redirect
    });
  
    // Profile button
    const profileBtn = document.getElementById('profileBtn');
    fetch('/api/user', { method: 'GET', credentials: 'same-origin' })
      .then(response => response.json())
      .then(data => {
        profileBtn.textContent = data.username ? `Welcome, ${data.username}` : 'My Profile';
      })
      .catch(error => console.error('Could not fetch user data:', error));
  
    profileBtn.addEventListener('click', () => {
      fetch('/api/user', { method: 'GET', credentials: 'same-origin' })
        .then(response => {
          if (!response.ok) {
            alert('Login to view profile');
            window.location.href = '/account.html#loginForm';
            return;
          }
          window.location.href = '/userProfile/userProfile.html';
        })
        .catch(error => console.error('Could not load user profile:', error));
    });
  });
  
  // Load quiz based on category
  function loadQuiz(category) {
    document.body.classList.add('flex', 'flex-row', 'justify-center', 'items-center', 'm-0', 'bg-black/75', 'bg-blend-overlay', 'bg-center', 'bg-cover', 'bg-repeat-y');
    const quizContainer = document.querySelector('.quiz-container');
    quizContainer.style.height = 'fit-content';
    quizContainer.style.width = 'fit-content';
    quizContainer.innerHTML = `
      <div class="quiz-heading">
        <h2>${category} Quiz</h2>
        <a href="/index.html" class="mb-7.5" id="homeLink">Home</a>
      </div>
    `;
  
    const timerDiv = document.createElement('div');
    timerDiv.id = 'timer';
    timerDiv.classList.add('fixed', 'flex', 'flex-shrink', 'flex-wrap', 'top-2', 'right-2', 'w-fit', 'text-lg', 'font-bold', 'text-center', 'bg-[#3bc7ff]', 'text-black', 'px-3', 'py-1', 'border-2', 'border-black', 'rounded-md');
    document.body.appendChild(timerDiv);
  
    fetch(`http://localhost:3000/questions?category=${encodeURIComponent(category)}`)
      .then(response => response.json())
      .then(data => {
        console.log('Quiz Questions:', data);
        if (data.length === 0) {
          document.getElementById('homeLink').style.display = 'none';
          const notice = document.createElement('h4');
          notice.innerHTML = `No questions in this category, redirecting to Home Page`;
          quizContainer.appendChild(notice);
          setTimeout(() => window.location.href = './index.html', 3000);
          return;
        }
        displayQuestions(data, category); // Pass category to displayQuestions
        startTimer(5 * 60); // 5-minute timer
      })
      .catch(error => console.error('Error fetching questions:', error));
  }
  
  // Display questions
  function displayQuestions(questions, category) {
    const quizContainer = document.querySelector('.quiz-container');
    questions = questions.sort(() => Math.random() - 0.5).slice(0, 20);
  
    questions.forEach((q, index) => {
      const questionDiv = document.createElement('div');
      questionDiv.classList.add('question');
      questionDiv.dataset.questionId = q.id;
  
      const choices = [
        `<label><input type="radio" name="q${index}" value="A"> ${q.a}</label>`,
        `<label><input type="radio" name="q${index}" value="B"> ${q.b}</label>`,
        `<label><input type="radio" name="q${index}" value="C"> ${q.c}</label>`,
        `<label><input type="radio" name="q${index}" value="D"> ${q.d}</label>`
      ].sort(() => Math.random() - 0.5);
  
      questionDiv.innerHTML = `<h3>${index + 1}. ${q.question_text}</h3>` + choices.join('<br>');
      quizContainer.appendChild(questionDiv);
    });
  
    createSubmitButton(category);
  }
  
  // Timer function
  let timerInterval;
  
  function startTimer(duration) {
    const timerElement = document.getElementById('timer');
    let timeLeft = duration;
  
    function updateTimer() {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      timerElement.innerHTML = `Time Left:<br>${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        alert('Time is up! Submitting quiz...');
        submitQuiz();
      }
      timeLeft--;
    }
  
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
  }
  
  // Create submit button
  function createSubmitButton(category) {
    const quizContainer = document.querySelector('.quiz-container');
    const sub = document.createElement('button');
    sub.type = 'button';
    sub.textContent = 'Submit';
    sub.id = 'submitBtn';
    sub.classList = 'm-0 py-2 px-5 font-bold text-black bg-[#ccf0ff] hover:bg-[#3bc7ff] hover:text-white rounded-md';
    quizContainer.appendChild(sub);
  
    sub.addEventListener('click', () => submitQuiz(category));
  }
  
  // Submit the quiz
  function submitQuiz(category) {
    clearInterval(timerInterval);
    const timer = document.getElementById('timer');
    if (timer) timer.style.display = 'none';
  
    const quiz_id = `quiz-${Date.now()}`;
    const userAnswers = [];
    let unanswered = false;
  
    document.querySelectorAll('.question').forEach((questionDiv, index) => {
      const question_id = questionDiv.dataset.questionId;
      const selectedOption = questionDiv.querySelector(`input[name="q${index}"]:checked`);
  
      if (selectedOption) {
        userAnswers.push({
          question_id: question_id,
          selected_option: selectedOption.value,
          questionDiv: questionDiv,
          index: index
        });
      } else {
        alert(`You have not answered question no. ${index + 1}, please select an option.`);
        unanswered = true;
      }
    });
  
    if (unanswered) return;
    if (userAnswers.length === 0) {
      alert('Please select at least one answer!');
      return;
    }
  
    document.querySelectorAll('.question input').forEach(input => input.disabled = true);
  
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.textContent = 'Processing Results...';
    submitBtn.disabled = true;
  
    fetch('http://localhost:3000/submit-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        quiz_id,
        category, // Include category here
        answers: userAnswers.map(({ question_id, selected_option }) => ({
          question_id,
          selected_option
        }))
      })
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(errorData => {
            throw new Error(errorData.error || 'Server error');
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Server response data:', data);
        if (!data.quiz_id) throw new Error('No quiz_id returned from server');
        displayQuizResults(data, userAnswers);
      })
      .catch(error => {
        console.error('Error submitting quiz:', error);
        alert(`Error submitting quiz: ${error.message}`);
        submitBtn.textContent = 'Submit';
        submitBtn.disabled = false;
      });
  }
  
  // Display quiz results
  function displayQuizResults(data, userAnswers) {
    const quizContainer = document.querySelector('.quiz-container');
    const timer = document.querySelector('#timer');
    if (timer) timer.remove();
  
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.remove();
  
    const resultsSummary = document.createElement('div');
    resultsSummary.classList.add('results-summary', 'p-4', 'mb-6', 'rounded-lg', 'text-center');
    
    const scorePercentage = (data.score / data.total) * 100;
    let bgColor = scorePercentage >= 80 ? 'bg-green-100 border-green-500' :
                 scorePercentage >= 60 ? 'bg-yellow-100 border-yellow-500' :
                 'bg-red-100 border-red-500';
    bgColor.split(' ').forEach(cls => resultsSummary.classList.add(cls));
    resultsSummary.classList.add('border-2');
  
    resultsSummary.innerHTML = `
      <h2 class="text-2xl text-black font-bold mb-2">Quiz Results</h2>
      <p class="text-xl text-black">Your Score: <span class="font-bold">${data.score}/${data.total}</span> (${scorePercentage.toFixed(1)}%)</p>
    `;
    
    const firstQuestion = document.querySelector('.question');
    quizContainer.insertBefore(resultsSummary, firstQuestion);
  
    if (data.quiz_id) {
      console.log('Fetching results for quiz_id:', data.quiz_id); // Debug
      fetch(`http://localhost:3000/quiz-results/${data.quiz_id}`, {
        method: 'GET', // Ensure method is explicit
        credentials: 'include'
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch quiz results: ${response.status}`);
          }
          return response.json();
        })
        .then(resultsData => {
          console.log('Quiz results data:', resultsData); // Debug raw data
  
          const resultsMap = {};
          resultsData.forEach(result => {
            resultsMap[result.id] = result; // Map by question ID
          });
          console.log('Results map:', resultsMap); // Debug mapped data
  
          userAnswers.forEach(answer => {
            const questionDiv = answer.questionDiv;
            const questionResult = resultsMap[answer.question_id];
            
            if (!questionResult) {
              console.warn(`No result data for question ID: ${answer.question_id}`);
              return;
            }
  
            console.log(`Processing answer for question ${answer.question_id}:`, {
              selected: answer.selected_option,
              correct: questionResult.correct_option,
              is_correct: questionResult.is_correct
            });
  
            const selectedLabel = questionDiv.querySelector(`input[value="${answer.selected_option}"]`)?.parentNode;
            const correctLabel = questionDiv.querySelector(`input[value="${questionResult.correct_option}"]`)?.parentNode;
  
            if (!selectedLabel || !correctLabel) {
              console.error(`Could not find labels for question ${answer.question_id}`, {
                selectedLabel: !!selectedLabel,
                correctLabel: !!correctLabel
              });
              return;
            }
  
            if (questionResult.is_correct) {
              selectedLabel.classList.add('correct-answer', 'bg-green-100', 'text-black', 'p-2', 'rounded', 'border-2', 'border-green-500', 'block', 'my-1');
            } else {
              selectedLabel.classList.add('incorrect-answer', 'bg-red-100', 'text-black', 'p-2', 'rounded', 'border-2', 'border-red-500', 'block', 'my-1');
              correctLabel.classList.add('correct-answer', 'bg-green-100', 'text-black', 'p-2', 'rounded', 'border-2', 'border-green-500', 'block', 'my-1');
            }
          });
        })
        .catch(error => {
          console.error('Error fetching quiz results:', error);
          resultsSummary.innerHTML += `<p class="text-red-500">Could not load detailed results: ${error.message}</p>`;
        });
    } else {
      console.warn('No quiz_id provided, skipping detailed results');
    }
  
    window.scrollTo(0, 0);
  }