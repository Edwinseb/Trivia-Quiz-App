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

// Middleware to check if user is an admin
function isAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  next();
}

// user registration to support role
app.post('/register', (req, res) => {
  const { username, email, password, role = 'user' } = req.body; // Default role is 'user'

  if (!username || !email || !password) {
    return res.status(400).send("All fields are required.");
  }

  const query = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
  db.query(query, [username, email, password, role], (err, result) => {
    if (err) {
      console.error('Error inserting user:', err);
      return res.status(500).send('Registration failed.');
    }
    req.session.user = { user_id: result.insertId, username, email, role };
    res.redirect('/index.html');
  });
});

// Modify login to fetch the role
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) return res.status(500).send('Login failed.');

    if (results.length === 0) {
      return res.status(401).send('User not registered.');
    }

    const user = results[0];
    if (user.password === password) {
      req.session.user = { user_id: user.id, username: user.username, email: user.email, role: user.role };
      res.redirect('/index.html');
    } else {
      res.status(401).send('Invalid password.');
    }
  });
});

// ✅ Admin: Get questions by category
app.get('/admin/questions', isAdmin, (req, res) => {
  const { category } = req.query;

  if (!category) {
    return res.status(400).json({ error: 'Category is required' });
  }

  db.query('SELECT * FROM questions WHERE category = ?', [category], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// ✅ Admin: Add a question
app.post('/admin/add-question', isAdmin, (req, res) => {
  console.log("Received Data:", req.body);
  const { question_text, option_a, option_b, option_c, option_d, correct_option, category } = req.body;
  
  if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_option || !category) {
    return res.status(400).json({ error: "All fields are required." });
  }
  
  const query = `INSERT INTO questions (question_text, a, b, c, d, correct_option, category)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  db.query(query, [question_text, option_a, option_b, option_c, option_d, correct_option, category], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error", details: err });
    }
    res.json({ message: "Question added successfully!", question_id: result.insertId });
  });
});

// ✅ Admin: View questions by category
app.get('/admin/view-questions', isAdmin, (req, res) => {
  const { category } = req.query;

  if (!category) {
    return res.status(400).json({ error: 'Category is required' });
  }

  db.query('SELECT * FROM questions WHERE category = ? ORDER BY id DESC', [category], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    res.json(results);
  });
});

// ✅ Admin: Delete a question
app.delete('/admin/delete-question/:id', isAdmin, (req, res) => {
  const questionId = req.params.id;

  db.query('DELETE FROM questions WHERE id = ?', [questionId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({ message: 'Question deleted successfully' });
  });
});

// ✅ Check user role
app.get('/api/user', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const { user_id, username, email, role } = req.session.user;
  res.json({ user_id, username, email, role });
});

//load-quiz
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

// ✅ Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/index.html');
  });
});

// Add this endpoint to your Express server code

// Get user quiz statistics
app.get('/quiz-stats', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const userId = req.session.user.user_id;
  
  const query = `
    SELECT 
      category,
      COUNT(*) as attempts,
      MAX(total_score) as highScore,
      AVG(total_score) as average
    FROM 
      user_quiz
    WHERE 
      user_id = ?
    GROUP BY 
      category
  `;
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: "Failed to fetch quiz statistics" });
    }
    
    res.json(results);
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
