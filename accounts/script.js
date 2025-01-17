function toggleForms() {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    
    if (registerForm.style.display === 'none') {
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
    } else {
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    }
}