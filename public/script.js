async function handleSearch() {
    const input = document.querySelector('input[list="mylist"]').value;
    const date = document.querySelector('input.date').value;

    if (input === "Check Leave Status") {
        try {
            const response = await fetch('/api/checkLeaveStatus', {
                method: 'GET',
            });
            const data = await response.json();
            alert(`Your leave status: ${data.status}`);
        } catch (error) {
            alert('Error checking leave status.');
            console.error(error);
        }
    } else if (input === "Check Off Days") {
        try {
            const response = await fetch('/api/checkOffDays', {
                method: 'GET',
            });
            const data = await response.json();
            alert(`You have ${data.offDays} off days.`);
        } catch (error) {
            alert('Error checking off days.');
            console.error(error);
        }
    } else if (input === "Request Leave") {
        if (date) {
            try {
                const response = await fetch('/api/requestLeave', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ date: date }),
                });
                const data = await response.json();
                if (data.success) {
                    alert(`Leave requested for ${date}.`);
                } else {
                    alert('Error requesting leave.');
                }
            } catch (error) {
                alert('Error requesting leave.');
                console.error(error);
            }
        } else {
            alert("Please select a date for your leave request.");
        }
    } else {
        alert("Please select a valid option.");
    }
}

function showLogin() {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('signup-section').style.display = 'none';
}

function showSignUp() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('signup-section').style.display = 'block';
}

async function signUp() {
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const role = document.getElementById('signup-role').value;

    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password, role}),
        });
        const data = await response.json();
        if (data.success) {
            alert('Sign up successful, please login.');
            showLogin();
        } else {
            alert('Sign up failed');
        }
    } catch (error) {
        alert('Error signing up');
        console.error(error);
    }
}

async function addLeaveStatus() {
    const userId = document.getElementById('userId').value;
    const status = document.getElementById('leaveStatus').value;

    try {
        const response = await fetch('/api/addLeaveStatus', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: userId, status: status }),
        });
        const data = await response.json();
        if (data.success) {
            alert('Leave status added successfully');
        } else {
            alert('Error adding leave status');
        }
    } catch (error) {
        alert('Error adding leave status');
        console.error(error);
    }
}

async function addOffDays() {
    const userId = document.getElementById('offUserId').value;
    const offDays = document.getElementById('offDays').value;

    try {
        const response = await fetch('/api/addOffDays', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: userId, offDays: offDays }),
        });
        const data = await response.json();
        if (data.success) {
            alert('Off days added successfully');
        } else {
            alert('Error adding off days');
        }
    } catch (error) {
        alert('Error adding off days');
        console.error(error);
    }
}

// Handle user login
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        const data = await response.json();
        if (data.success) {
            alert('Login successful');
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('main-content').style.display = 'block';
            checkUserRole();
        } else {
            alert('Login failed');
        }
    } catch (error) {
        alert('Error logging in');
        console.error(error);
    }
}

// Check user role and show/hide admin panel
async function checkUserRole() {
    try {
        const response = await fetch('/api/checkUserRole', {
            method: 'GET',
        });
        const data = await response.json();
        if (data.role === 'admin') {
            document.getElementById('admin-section').style.display = 'block';
        } else {
            document.getElementById('admin-section').style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking user role', error);
    }
}

// On page load, check if user is logged in and their role
window.onload = async function() {
    await checkUserRole();
}