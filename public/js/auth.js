// auth.js - handles login and registration
import { loginUser, registerUser } from './api.js';

// Detect page
const isLoginPage = document.querySelector("#login-form");
const isRegisterPage = document.querySelector('#register-form');

// Show error function
function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = "block";
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            element.style.display = "none";
        }, 5000);
    }
}

// Login
if (isLoginPage) {
    const loginForm = document.querySelector("#login-form");
    const loginError = document.querySelector(".auth-error");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        if (loginError) loginError.style.display = "none";
        
        // Get form values
        const email = loginForm.email.value.trim();
        const password = loginForm.password.value.trim();

        // Validation
        if (!email || !password) {
            showError(loginError, "Please fill in all fields");
            return;
        }

        // Email validation
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            showError(loginError, "Please enter a valid email address");
            return;
        }

        // Show loading state
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Logging in...";
        submitBtn.disabled = true;

        try {
            const response = await loginUser(email, password);
            
            if (!response || !response.success) {
                showError(loginError, response?.error || "Invalid email or password");
                return;
            }
            
            if (!response.token || !response.user) {
                showError(loginError, "Login failed. Please try again.");
                return;
            }
            
            // Save token and user session
            localStorage.setItem("token", response.token);
            localStorage.setItem("user", JSON.stringify(response.user));
            
            // Show success message
            showError(loginError, "Login successful! Redirecting...");
            loginError.style.color = "#28a745";
            loginError.style.backgroundColor = "#d4edda";
            loginError.style.borderColor = "#c3e6cb";
            
            // Redirect based on user role
            setTimeout(() => {
                if (response.user.role === 'admin') {
                    window.location.href = "admin.html";
                } else {
                    window.location.href = "index.html";
                }
            }, 1000);
            
        } catch (error) {
            console.error('Login error:', error);
            showError(loginError, error.message || "Login failed. Please try again.");
        } finally {
            // Restore button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Register
if (isRegisterPage) {
    const registerForm = document.querySelector("#register-form");
    const registerError = document.querySelector(".auth-error");
    
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        if (registerError) registerError.style.display = "none";
        
        // Get form values
        const name = registerForm.name.value.trim();
        const email = registerForm.email.value.trim();
        const password = registerForm.password.value.trim();
        
        // Validation
        if (!name || !email || !password) {
            showError(registerError, "All fields are required");
            return;
        }
        
        if (name.length < 2) {
            showError(registerError, "Name must be at least 2 characters");
            return;
        }
        
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            showError(registerError, "Please enter a valid email address");
            return;
        }
        
        if (password.length < 6) {
            showError(registerError, "Password must be at least 6 characters");
            return;
        }
        
        // Show loading state
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Creating Account...";
        submitBtn.disabled = true;

        try {
            const response = await registerUser({ name, email, password });
            
            if (!response || !response.success) {
                showError(registerError, response?.error || "Registration failed. Try again.");
                return;
            }
            
            if (!response.token || !response.user) {
                showError(registerError, "Registration completed but login failed.");
                return;
            }
            
            // Save token and user session
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            
            // Show success message
            showError(registerError, "Registration successful! Redirecting...");
            registerError.style.color = "#28a745";
            registerError.style.backgroundColor = "#d4edda";
            registerError.style.borderColor = "#c3e6cb";
            
            // Redirect based on user role
            setTimeout(() => {
                if (response.user.role === 'admin') {
                    window.location.href = "admin.html";
                } else {
                    window.location.href = "index.html";
                }
            }, 1000);
            
        } catch (error) {
            console.error('Registration error:', error);
            showError(registerError, error.message || "Registration failed. Try again.");
        } finally {
            // Restore button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Add input validation feedback
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('blur', function() {
        if (this.hasAttribute('required') && !this.value.trim()) {
            this.style.borderColor = '#dc3545';
        } else {
            this.style.borderColor = '#ddd';
        }
    });
});