document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
        const token = await login(username, password);
        if (!token) {
            document.getElementById('errorMessage').innerText = 'Invalid credentials. Please try again.';
            document.getElementById('errorMessage').className = 'error-message show';
            // Clear input fields
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            setTimeout(() => {
                document.getElementById('errorMessage').className = 'error-message';
            }, 3000);
            return;
        }
        localStorage.setItem('jwt', token);
        window.location.href = 'profile.html';
    } catch (error) {
        document.getElementById('errorMessage').innerText = 'Invalid credentials. Please try again.';
        document.getElementById('errorMessage').className = 'error-message show';
        // Clear input fields
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        setTimeout(() => {
            document.getElementById('errorMessage').className = 'error-message';
        }, 3000);
    }
});
async function login(username, password) {
    const response = await fetch('https://learn.reboot01.com/api/auth/signin', {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + btoa(username + ':' + password),
            'Content-Type': 'application/json',
        },
    });
    
    if (!response.ok) {
        return null;
    }
    
    const data = await response.json();
    if (!data) {
        return null;
    }
    return data;
}