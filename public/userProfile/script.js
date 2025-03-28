document.addEventListener('DOMContentLoaded', () => {
  // Fetch user basic info
  fetch('/api/user', {
      method: 'GET',
      credentials: 'same-origin'
  })
  .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
  })
  .then(data => {
      if (data.error) {
          window.location.href = 'http://localhost:3000/account.html#loginForm';
          return;
      }
      document.getElementById('username').textContent = data.username || 'Unknown User';
      document.getElementById('email').textContent = data.email || 'No email';
      // Pre-fill edit form with current values
      document.getElementById('editUsername').value = data.username || '';
      document.getElementById('editEmail').value = data.email || '';
  })
  .catch(error => {
      console.error('Failed to load user profile:', error);
      document.getElementById('userInfo').innerHTML += '<p class="text-red-500">Error loading profile</p>';
  });

  // Fetch quiz statistics
  fetch('/quiz-stats', {
      method: 'GET',
      credentials: 'same-origin'
  })
  .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
  })
  .then(stats => {
      if (!Array.isArray(stats)) throw new Error('Invalid data format');
      updateQuizTable(stats);
  })
  .catch(error => {
      console.error('Failed to load quiz stats:', error);
      document.querySelector('.quiz-stats').innerHTML += '<p class="text-red-500">Error loading stats</p>';
  });

  function updateQuizTable(stats) {
      const categoryMap = {
          'Computer Science': 'cs',
          'GK': 'gk',
          'Movies': 'movies',
          'Psychology': 'psych'
      };
      Object.values(categoryMap).forEach(prefix => {
          document.getElementById(`${prefix}_attempts`).textContent = '0';
          document.getElementById(`${prefix}_high`).textContent = '0';
          document.getElementById(`${prefix}_avg`).textContent = '0';
      });
      stats.forEach(stat => {
          const prefix = categoryMap[stat.category];
          if (prefix) {
              document.getElementById(`${prefix}_attempts`).textContent = stat.attempts || '0';
              document.getElementById(`${prefix}_high`).textContent = stat.highScore || '0';
              document.getElementById(`${prefix}_avg`).textContent = stat.average || '0';
          }
      });
  }

  // Edit Profile Logic
  const editBtn = document.getElementById('editBtn');
  const editForm = document.getElementById('editForm');
  const cancelBtn = document.getElementById('cancelBtn');
  const quizStats = document.querySelector('.quiz-stats');

  editBtn.addEventListener('click', () => {
      editForm.classList.remove('hidden'); // Show the edit form
      editBtn.classList.add('hidden');     // Hide the edit button
      quizStats.classList.add('hidden');   // Hide the quiz stats
  });

  cancelBtn.addEventListener('click', () => {
      editForm.classList.add('hidden');    // Hide the edit form
      editBtn.classList.remove('hidden');  // Show the edit button
      quizStats.classList.remove('hidden'); // Show the quiz stats
  });

  editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newUsername = document.getElementById('editUsername').value;
      const newEmail = document.getElementById('editEmail').value;
      const newPassword = document.getElementById('editPassword').value;

      fetch('/api/update-profile', {
          method: 'PUT',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              username: newUsername,
              email: newEmail,
              password: newPassword
          })
      })
      .then(response => {
          if (!response.ok) throw new Error('Update failed');
          return response.json();
      })
      .then(data => {
          document.getElementById('username').textContent = data.username;
          document.getElementById('email').textContent = data.email;
          editForm.classList.add('hidden');    // Hide the edit form
          editBtn.classList.remove('hidden');  // Show the edit button
          quizStats.classList.remove('hidden'); // Show the quiz stats
          alert('Profile updated successfully!');
      })
      .catch(error => {
          console.error('Error updating profile:', error);
          alert('Failed to update profile. Please try again.');
      });
  });

  // Dashboard and Logout buttons
  document.getElementById('homeBtn').addEventListener('click', () => {
      window.location.href = '/index.html';
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
      fetch('/logout', {
          method: 'GET',
          credentials: 'same-origin'
      })
      .then(() => {
          alert('Logged out!');
          window.location.href = '/index.html';
      })
      .catch(error => {
          console.error('Logout failed:', error);
          alert('Logout failed. Please try again.');
      });
  });
});