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
  database: 'quizApp'
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
  const { username, email, password } = req.body;

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

// User login route
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('Login error:', err);
      res.status(500).send('Login failed. Please try again.');
      return;
    }

    if (results.length > 0) {
      req.session.user = results[0]; // Store user in session
      res.redirect('/index.html');
    } else {
      res.status(401).send('Invalid email or password');
    }
  });
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

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
