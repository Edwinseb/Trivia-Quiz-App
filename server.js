const express = require('express'); // For creating the server
const mysql = require('mysql2'); // For connecting to the database
const bodyParser = require('body-parser'); // For reading form data
const session = require('express-session');
const app = express(); // Create the Express app

// Use sessions
app.use(session({
  secret: 'Tyler_durden99', // Change this to a secure key
  resave: false,
  saveUninitialized: false, // Ensure session isn't created unless needed
  cookie: { secure: false } // Set to true if using HTTPS
}));

// To handle form data properly
app.use(bodyParser.urlencoded({ extended: true }));
// Serve static files (HTML, CSS, JS) from the public folder
app.use(express.static('public'));
app.use(express.json());

// Set up the database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Dexter_2024',
  database: 'quizapp'
});

// Connect to the database
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
    // Automatically log in the user
    const user_id = result.insertId; // Get newly created user's ID
    req.session.user = { user_id, username, email }; // Store user session
    res.redirect('http://localhost:3000/index.html');
  });
});

// User Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

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
      res.redirect('/index.html');
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
  const gamesPlayedQuery = new Promise((resolve, reject) => {
    db.query('SELECT COUNT(*) AS gamesPlayed FROM user_quiz WHERE user_id = ?', [user_id], (err, results) => {
      if (err) return reject("Error fetching quiz count");
      resolve(results[0].gamesPlayed || 0);
    });
  });

  // Query for high score
  const highScoreQuery = new Promise((resolve, reject) => {
    db.query('SELECT MAX(total_score) AS highScore FROM user_quiz WHERE user_id = ?', [user_id], (err, results) => {
      if (err) return reject("Error fetching High Score");
      resolve(results[0].highScore || 0);
    });
  });

  // Execute both queries and respond once
  Promise.all([gamesPlayedQuery, highScoreQuery])
    .then(([gamesPlayed, highScore]) => {
      res.json({ username, email, gamesPlayed, highScore });
    })
    .catch(error => {
      res.status(500).json({ error });
    });
});

// Fetch detailed quiz statistics for categories
app.get("/quiz-stats", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const userId = req.session.user.user_id;

  const query = `
    SELECT 
      uq.category,
      COUNT(uq.id) AS attempts,
      MAX(uq.total_score) AS highScore,
      ROUND(AVG(uq.total_score), 2) AS average
    FROM user_quiz uq
    WHERE uq.user_id = ?
    GROUP BY uq.category;
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching quiz stats:", err);
      return res.status(500).json({ error: "Failed to fetch quiz stats" });
    }
    console.log("Fetched quiz stats:", JSON.stringify(results, null, 2));
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

// Fetch questions dynamically based on category
app.get('/questions', (req, res) => {
  const category = req.query.category;

  if (!category) {
    return res.status(400).json({ error: 'Category is required' });
  }

  const sql = 'SELECT * FROM questions WHERE category = ?';
  db.query(sql, [category], (err, results) => {
    if (err) {
      console.error('Error fetching questions:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Storing quiz answers and validating them
app.post('/submit-quiz', (req, res) => {
  if (!req.session.user) {
    res.status(401).json({ error: "User not logged in" });
    return window.location.href('./account.html');
  }

  const { user_id } = req.session.user;
  const { quiz_id, category, answers } = req.body; // Add category to request body

  if (!quiz_id || !category) {
    return res.status(400).json({ error: "Quiz ID and category are required" });
  }

  if (!answers || answers.length === 0) {
    return res.status(400).json({ error: "No answers submitted" });
  }

  let correctAnswers = 0;
  let queries = answers.map(answer => {
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

app.get('/quiz-results/:quiz_id', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "User not logged in" });
  }

  const { user_id } = req.session.user;
  const { quiz_id } = req.params;

  const query = `
    SELECT q.id, q.question_text, a.selected_option, q.correct_option, a.is_correct 
    FROM answers a
    JOIN questions q ON a.question_id = q.id
    JOIN user_quiz uq ON uq.quiz_id = ? AND uq.user_id = a.user_id
    WHERE a.user_id = ?
  `;
  
  db.query(query, [quiz_id, user_id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    console.log(`Quiz results for quiz_id ${quiz_id}, user_id ${user_id}:`, results); // Debug
    res.json(results);
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
