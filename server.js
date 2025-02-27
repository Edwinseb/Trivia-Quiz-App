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
    res.redirect('/index.html');
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

  const { username, email } = req.session.user;
  res.json({ username, email });
});

// Check login status
app.get('/isLoggedIn', (req, res) => {
  res.json({ loggedIn: !!req.session.user });
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/account.html');
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
  console.log("Session Data:", req.session); // Debugging session

  if (!req.session.user) {
    return res.status(401).json({ error: "User not logged in" });
  }

  const { user_id } = req.session.user;
  console.log("Extracted user_id:", user_id);

  if (!user_id) {
    return res.status(400).json({ error: "User ID is missing from session" });
  }

  const { quiz_id, answers } = req.body;

  if (!answers || answers.length === 0) {
    return res.status(400).json({ error: "No answers submitted" });
  }

  let correctAnswers = 0;
  let queries = answers.map(answer => {
    return new Promise((resolve, reject) => {
      db.query('SELECT correct_option FROM questions WHERE id = ?', [answer.question_id], (err, results) => {
        if (err) return reject(err);
        
        const is_correct = results[0]?.correct_option === answer.selected_option ? 1 : 0;
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
        `INSERT INTO user_quiz (user_id, quiz_id, total_score, questions_attempted, correct_answers)
        VALUES (?, ?, ?, ?, ?)`,
        [user_id, quiz_id, correctAnswers, totalQuestions, correctAnswers],
        (err) => {
          if (err) return res.status(500).json({ error: "Error saving quiz results" });

          res.json({ message: "Quiz submitted successfully", score: correctAnswers, total: totalQuestions });
        }
      );
    })
    .catch(err => {
      console.error("Quiz submission error:", err);
      res.status(500).json({ error: "Database error", details: err.message });
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
