function toggleForms() {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

//
const registerForm = document.getElementById('registerForm');
registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    //const submitBtn = document.getElementById('submitBtn');

    if (password.length < 8) {
        alert("Password length must be greater than 8");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    alert("registered");
});

document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Temporarily prevent form submission
    
    console.log('Form submitted!');
    
    const formData = {
        username: document.getElementById('registerName').value,
        email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value
    };
    
    console.log('Form data:', formData);
    
    // Now manually submit the form
    this.submit();
});
