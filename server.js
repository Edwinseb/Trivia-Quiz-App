const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();

app.use(session({
  secret: 'Tyler_durden99',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Dexter_2024',
  database: 'quizapp'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to the database!');
});

// User Registration
app.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send("All fields are required.");
  }

  const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  db.query(query, [username, email, password], (err, result) => {
    if (err) {
      console.error('Error inserting user:', err);
      return res.status(500).send('Registration failed.');
    }
    req.session.user = { user_id: result.insertId, username, email };
    res.redirect('http://localhost:3000/index.html');
  });
});

// User Login with redirect support
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const redirectCategory = req.query.category || ''; // Get category from query param

  const checkUserQuery = 'SELECT * FROM users WHERE email = ?';
  db.query(checkUserQuery, [email], (err, results) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).send('Login failed.');
    }

    if (results.length === 0) {
      return res.status(401).send('User not registered.');
    }

    const user = results[0];
    if (user.password === password) {
      req.session.user = { user_id: user.id, username: user.username, email: user.email };
      const redirectUrl = redirectCategory 
        ? `/index.html?category=${encodeURIComponent(redirectCategory)}`
        : '/index.html';
      res.redirect(redirectUrl);
    } else {
      res.status(401).send('Invalid password.');
    }
  });
});

// Fetch logged-in user details
app.get('/api/user', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const { user_id, username, email } = req.session.user;

  // Query for games played
  db.query('SELECT COUNT(*) AS gamesPlayed FROM user_quiz WHERE user_id = ?', [user_id], (err, gamesPlayedResults) => {
    if (err) {
      console.error('Error fetching games played:', err);
      return res.status(500).json({ error: "Error fetching quiz count" });
    }

    // Query for high score
    db.query('SELECT MAX(total_score) AS highScore FROM user_quiz WHERE user_id = ?', [user_id], (err, highScoreResults) => {
      if (err) {
        console.error('Error fetching high score:', err);
        return res.status(500).json({ error: "Error fetching high score" });
      }

      res.json({
        username,
        email,
        gamesPlayed: gamesPlayedResults[0].gamesPlayed || 0,
        highScore: highScoreResults[0].highScore || 0
      });
    });
  });
});

// Update user profile
app.put('/api/update-profile', (req, res) => {
  if (!req.session.user) {
      return res.status(401).json({ error: "Not logged in" });
  }

  const { user_id } = req.session.user;
  const { username, email, password } = req.body;

  // Build the update query dynamically based on provided fields
  let query = 'UPDATE users SET ';
  const fields = [];
  const values = [];

  if (username) {
      fields.push('username = ?');
      values.push(username);
  }
  if (email) {
      fields.push('email = ?');
      values.push(email);
  }
  if (password) {
      fields.push('password = ?');
      values.push(password);
  }

  if (fields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
  }

  query += fields.join(', ') + ' WHERE id = ?';
  values.push(user_id);

  db.query(query, values, (err, result) => {
      if (err) {
          console.error('Error updating profile:', err);
          return res.status(500).json({ error: "Failed to update profile" });
      }

      // Update session with new values
      if (username) req.session.user.username = username;
      if (email) req.session.user.email = email;

      res.json({
          username: req.session.user.username,
          email: req.session.user.email
      });
  });
});

// Fetch quiz statistics
app.get("/quiz-stats", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }
  const userId = req.session.user.user_id;

  db.query(`
    SELECT 
      uq.category,
      COUNT(uq.id) AS attempts,
      MAX(uq.total_score) AS highScore,
      ROUND(AVG(uq.total_score), 2) AS average
    FROM user_quiz uq
    WHERE uq.user_id = ?
    GROUP BY uq.category
  `, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching quiz stats:", err);
      return res.status(500).json({ error: "Failed to fetch quiz stats" });
    }
    res.json(results);
  });
});

// Check login status
app.get('/isLoggedIn', (req, res) => {
  res.json({ loggedIn: !!req.session.user });
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/index.html');
  });
});

// Fetch questions (require login)
app.get('/questions', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "User not logged in" });
  }
  const category = req.query.category;

  if (!category) {
    return res.status(400).json({ error: 'Category is required' });
  }

  db.query('SELECT * FROM questions WHERE category = ?', [category], (err, results) => {
    if (err) {
      console.error('Error fetching questions:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Submit quiz
app.post('/submit-quiz', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "User not logged in" });
  }
  const { user_id } = req.session.user;
  const { quiz_id, category, answers } = req.body;

  if (!quiz_id || !category) {
    return res.status(400).json({ error: "Quiz ID and category are required" });
  }
  if (!answers || answers.length === 0) {
    return res.status(400).json({ error: "No answers submitted" });
  }

  let correctAnswers = 0;
  const queries = answers.map(answer => {
    return new Promise((resolve, reject) => {
      db.query('SELECT correct_option FROM questions WHERE id = ?', [answer.question_id], (err, results) => {
        if (err) return reject(err);
        if (results.length === 0) return reject(new Error("Question not found"));

        const is_correct = results[0].correct_option === answer.selected_option ? 1 : 0;
        if (is_correct) correctAnswers++;

        db.query(
          'INSERT INTO answers (user_id, question_id, selected_option, is_correct) VALUES (?, ?, ?, ?)',
          [user_id, answer.question_id, answer.selected_option, is_correct],
          (err) => err ? reject(err) : resolve()
        );
      });
    });
  });

  Promise.all(queries)
    .then(() => {
      const totalQuestions = answers.length;
      db.query(
        `INSERT INTO user_quiz (user_id, quiz_id, category, total_score, questions_attempted, correct_answers)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user_id, quiz_id, category, correctAnswers, totalQuestions, correctAnswers],
        (err) => {
          if (err) return res.status(500).json({ error: "Error saving quiz results" });
          res.json({
            message: "Quiz submitted successfully",
            score: correctAnswers,
            total: totalQuestions,
            quiz_id: quiz_id
          });
        }
      );
    })
    .catch(err => {
      console.error("Quiz submission error:", err);
      res.status(500).json({ error: "Database error", details: err.message });
    });
});

// Fetch quiz results
app.get('/quiz-results/:quiz_id', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "User not logged in" });
  }
  const { user_id } = req.session.user;
  const { quiz_id } = req.params;

  db.query(`
    SELECT q.id, q.question_text, a.selected_option, q.correct_option, a.is_correct 
    FROM answers a
    JOIN questions q ON a.question_id = q.id
    JOIN user_quiz uq ON uq.quiz_id = ? AND uq.user_id = a.user_id
    WHERE a.user_id = ?
  `, [quiz_id, user_id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    //console.log(`Quiz results for quiz_id ${quiz_id}, user_id ${user_id}:`, results);
    res.json(results);
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});