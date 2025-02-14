const express = require('express'); // For creating the server
const mysql = require('mysql2'); // For connecting to the database
const bodyParser = require('body-parser'); // For reading form data
const session = require('express-session');
const app = express(); // Create the Express app

// Use sessions
app.use(session({
  secret: 'your_secret_key', // Change this to a secure key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// To handle form data properly
app.use(bodyParser.urlencoded({ extended: true }));
// Serve static files (HTML, CSS, JS) from the public folder
app.use(express.static('public'));

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

// Create a route to handle user registration
app.post('/register', (req, res) => {
  console.log('Received data:', req.body); // Debugging line

  console.log('Received data:', { username, email, password });

  // Insert the data into the users table
  const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  db.query(query, [username, email, password], (err, result) => {
    if (err) {
      console.error('Error inserting user:', err);
      res.status(500).send('Registration failed. Please try again.');
      return;
    }
    res.redirect('/index.html');
  });
});

// User login route with user existence check
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const checkUserQuery = 'SELECT * FROM users WHERE email = ?';
  db.query(checkUserQuery, [email], (err, results) => {
    if (err) {
      console.error('Login error:', err);
      res.status(500).send('Login failed. Please try again.');
      return;
    }

    if (results.length === 0) {
      // No user found with this email
      res.status(401).send('User not registered.');
      return;
    }

    // User exists, now check password
    const user = results[0];
    if (user.password === password) {
      req.session.user = user; // Store user in session
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
  if (req.session.user) {
    res.json({ loggedIn: true });
  } else {
    res.json({ loggedIn: false });
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/account.html'); // Redirect to homepage after logout
  });
});


//quiz content
// Fetch questions dynamically based on category
app.get('/questions', (req, res) => {
  const category = req.query.category; // Get category from query params

  if (!category) {
    return res.status(400).json({ error: 'Category is required' });
  }

  const sql = 'SELECT * FROM questions WHERE category = ?';
  db.query(sql, [category], (err, results) => {
    if (err) {
      console.error('Error fetching questions:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results); // Send questions as JSON
  });
});


// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
