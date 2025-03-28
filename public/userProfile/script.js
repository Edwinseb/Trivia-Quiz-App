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
      })
      .catch(error => {
        console.error('Failed to load user profile:', error);
        document.getElementById('userInfo').innerHTML += '<p class="text-red-500">Error loading profile</p>';
      });
  
    // Fetch quiz statistics and update table
    fetch('/quiz-stats', {
      method: 'GET',
      credentials: 'same-origin'
    })
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(stats => {
        if (!Array.isArray(stats)) {
          throw new Error('Invalid data format received from /quiz-stats');
        }
        console.log('Received Stats:', stats); // Debugging
        updateQuizTable(stats);
      })
      .catch(error => {
        console.error('Failed to load quiz stats:', error);
        document.querySelector('.quiz-stats').innerHTML += '<p class="text-red-500">Error loading stats</p>';
      });
  
    // Update quiz stats table
    function updateQuizTable(stats) {
      const categoryMap = {
        'Computer Science': 'cs',
        'GK': 'gk',
        'Movies': 'movies',
        'Psychology': 'psych'
      };
  
      // Reset all table cells to 0
      Object.values(categoryMap).forEach(prefix => {
        document.getElementById(`${prefix}_attempts`).textContent = '0';
        document.getElementById(`${prefix}_high`).textContent = '0';
        document.getElementById(`${prefix}_avg`).textContent = '0';
      });
  
      // Update table with received stats
      stats.forEach(stat => {
        const prefix = categoryMap[stat.category];
        if (!prefix) {
          console.warn('No matching table row for category:', stat.category);
          return;
        }
        document.getElementById(`${prefix}_attempts`).textContent = stat.attempts || '0';
        document.getElementById(`${prefix}_high`).textContent = stat.highScore || '0';
        document.getElementById(`${prefix}_avg`).textContent = stat.average || '0';
      });
    }
  
    // Dashboard button
    document.getElementById('homeBtn').addEventListener('click', () => {
      window.location.href = '/index.html';
    });
  
    // Logout button
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