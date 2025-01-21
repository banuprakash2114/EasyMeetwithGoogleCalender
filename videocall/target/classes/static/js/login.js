document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Get form data
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    // Validate inputs
    if (!email || !password) {
      alert('Please fill in all fields.');
      return;
    }

    try {
      // Make a POST request to the login API
      const response = await fetch('/api/v1/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const userData = await response.json();

        // Save the entire user object in localStorage (serialized)
        localStorage.setItem('connectedUser', JSON.stringify(userData));

        alert(`Welcome ${userData.username}!`);
        window.location.href = '/index.html'; // Redirect to home page
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert('Login and/or password is incorrect.');
    }
  });
});
