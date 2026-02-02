// API Base URL
const API_URL = 'http://localhost:3000/api/users';

let currentEditingUserId = null;

// Load all users when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
});

// Load users from server
async function loadUsers(sortBy = '', order = 'asc', search = '') {
    showLoading();
    
    try {
        let url = API_URL;
        const params = new URLSearchParams();
        
        if (sortBy) params.append('sortBy', sortBy);
        if (order) params.append('order', order);
        if (search) params.append('search', search);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        
        const users = await response.json();
        displayUsers(users);
    } catch (error) {
        console.error('Error loading users:', error);
        alert('Failed to load users. Make sure the server is running!');
        hideLoading();
    }
}

// Display users in table
function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    const loading = document.getElementById('loading');
    const noResults = document.getElementById('noResults');
    
    loading.style.display = 'none';
    
    if (users.length === 0) {
        tbody.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user._id.substring(0, 8)}...</td>
            <td>${user.firstName}</td>
            <td>${user.lastName}</td>
            <td>${user.email}</td>
            <td>${user.age}</td>
            <td>${user.role || 'user'}</td>
            <td class="actions">
                <button class="btn btn-edit" onclick="editUser('${user._id}')">Edit</button>
                <button class="btn btn-delete" onclick="deleteUser('${user._id}', '${user.firstName} ${user.lastName}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Show loading spinner
function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('usersTableBody').innerHTML = '';
    document.getElementById('noResults').style.display = 'none';
}

// Hide loading spinner
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Search users
function searchUsers() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    const sortBy = document.getElementById('sortBy').value;
    const order = document.getElementById('sortOrder').value;
    
    loadUsers(sortBy, order, searchTerm);
}

// Clear search
function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('sortBy').value = '';
    loadUsers();
}

// Sort users
function sortUsers() {
    const sortBy = document.getElementById('sortBy').value;
    const order = document.getElementById('sortOrder').value;
    const search = document.getElementById('searchInput').value.trim();
    
    if (!sortBy) {
        alert('Please select a field to sort by');
        return;
    }
    
    loadUsers(sortBy, order, search);
}

// Show add user modal
function showAddUserModal() {
    currentEditingUserId = null;
    document.getElementById('modalTitle').textContent = 'Add New User';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('userModal').style.display = 'block';
}

// Edit user
async function editUser(userId) {
    try {
        const response = await fetch(`${API_URL}/${userId}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch user details');
        }
        
        const user = await response.json();
        
        currentEditingUserId = userId;
        document.getElementById('modalTitle').textContent = 'Edit User';
        document.getElementById('userId').value = userId;
        document.getElementById('firstName').value = user.firstName;
        document.getElementById('lastName').value = user.lastName;
        document.getElementById('email').value = user.email;
        document.getElementById('age').value = user.age;
        document.getElementById('password').value = user.password || '';
        document.getElementById('role').value = user.role || 'user';
        
        document.getElementById('userModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading user for edit:', error);
        alert('Failed to load user details');
    }
}

// Delete user
async function deleteUser(userId, userName) {
    if (!confirm(`Are you sure you want to delete ${userName}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/${userId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete user');
        }
        
        alert('User deleted successfully!');
        loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
    }
}

// Handle form submission (Add or Edit)
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const userData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        age: parseInt(document.getElementById('age').value),
        password: document.getElementById('password').value,
        role: document.getElementById('role').value
    };
    
    try {
        let response;
        
        if (userId) {
            // Update existing user
            response = await fetch(`${API_URL}/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
        } else {
            // Create new user
            response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save user');
        }
        
        alert(userId ? 'User updated successfully!' : 'User added successfully!');
        closeModal();
        loadUsers();
    } catch (error) {
        console.error('Error saving user:', error);
        alert(error.message);
    }
}

// Close modal
function closeModal() {
    document.getElementById('userModal').style.display = 'none';
    document.getElementById('userForm').reset();
    currentEditingUserId = null;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('userModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Allow Enter key to trigger search
document.getElementById('searchInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        searchUsers();
    }
});
