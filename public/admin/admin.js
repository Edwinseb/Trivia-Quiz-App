// Handle the add question form submission
document.getElementById('homeBtn').addEventListener('click', function (e) {
    window.location.href = '/index.html'
})

document.getElementById('addQuestionForm').addEventListener('submit', function (e) {
    e.preventDefault();
    
    const category = document.getElementById('category').value;
    const question_text = document.getElementById('question').value;
    const option_a = document.getElementById('optionA').value;
    const option_b = document.getElementById('optionB').value;
    const option_c = document.getElementById('optionC').value;
    const option_d = document.getElementById('optionD').value;
    const correct_option = document.getElementById('correctOption').value; // ✅ FIXED

    fetch('/admin/add-question', {  // ✅ Corrected URL
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ category, question_text, option_a, option_b, option_c, option_d, correct_option })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        document.getElementById('addQuestionForm').reset();
        loadQuestions();
    })
    .catch(err => console.error('Error:', err));
});


// Load questions when the view button is clicked or on page load
document.getElementById('viewBtn').addEventListener('click', loadQuestions);

function loadQuestions() {
    const viewCategorySelect = document.getElementById('viewCategory');
    const selectedOption = viewCategorySelect.options[viewCategorySelect.selectedIndex];
    const viewCategory = selectedOption.getAttribute('data-category');

    let url = '/admin/view-questions';

    if (viewCategory) {
        url += `?category=${encodeURIComponent(viewCategory)}`;
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('Received data:', data); // Debugging output

            if (!Array.isArray(data)) {
                console.error('Unexpected response:', data);
                throw new Error('Invalid response format');
            }

            const listDiv = document.getElementById('questionsList');
            listDiv.innerHTML = '';

            if (data.length === 0) {
                listDiv.innerHTML = '<p>No questions found.</p>';
            } else {
                data.forEach(q => {
                    const div = document.createElement('div');
                    div.className = 'question-item';
                    div.innerHTML = `
                        <strong>Category:</strong> ${q.category}<br/>
                        <strong>Question:</strong> ${q.question_text}<br/>
                        <strong>A:</strong> ${q.a} <br/>
                        <strong>B:</strong> ${q.b} <br/>
                        <strong>C:</strong> ${q.c} <br/>
                        <strong>D:</strong> ${q.d} <br/>
                        <strong>Answer:</strong> ${q.correct_option} <br/>
                        <button class="delete-btn" data-id="${q.id}">Delete</button>
                    `;
                    listDiv.appendChild(div);
                });
            }
        })
        .catch(err => console.error('Error:', err));
}



// Handle deletion of a question
document.getElementById('questionsList').addEventListener('click', function (e) {
    if (e.target.classList.contains('delete-btn')) {
        const questionId = e.target.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this question?')) {
            fetch(`/admin/delete-question/${questionId}`, {  // ✅ Corrected URL
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                loadQuestions();
            })
            .catch(err => console.error('Error:', err));
        }
    }
});

// Load questions initially when the page loads
loadQuestions();
