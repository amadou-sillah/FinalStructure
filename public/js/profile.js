// profile.js - handles user profile page
import { fetchProfile, fetchMyOrders, updateProfile, isAuthenticated } from './api.js';

// DOM Elements
const userNameEl = document.querySelector('#userName');
const userEmailEl = document.querySelector('#userEmail');
const memberSinceEl = document.querySelector('#memberSince');
const orderList = document.querySelector('#orderList');
const editProfileBtn = document.querySelector('#editProfileBtn');

// Check authentication on page load
if (!isAuthenticated()) {
    alert('Please login to view your profile');
    window.location.href = 'login.html';
}

// Load profile data
async function loadProfile() {
    try {
        showLoading('profile');
        
        const response = await fetchProfile();
        
        if (!response || !response.success) {
            throw new Error(response?.error || 'Failed to load profile');
        }
        
        const user = response.user || response;
        
        // Update profile information
        userNameEl.textContent = user.name || '';
        userEmailEl.textContent = user.email || '';
        
        if (user.createdAt) {
            const date = new Date(user.createdAt);
            memberSinceEl.textContent = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
    } catch (error) {
        console.error('Profile load error:', error);
        
        if (error.message.includes('401') || error.message.includes('token')) {
            // Token expired or invalid
            localStorage.clear();
            alert('Session expired. Please login again.');
            window.location.href = 'login.html';
        } else {
            showError('Failed to load profile: ' + error.message);
        }
    }
}

// Load user's orders
async function loadOrders() {
    try {
        showLoading('orders');
        
        const response = await fetchMyOrders();
        
        if (!response || !response.success) {
            throw new Error(response?.error || 'Failed to load orders');
        }
        
        const orders = response.orders || response;
        
        if (!Array.isArray(orders) || orders.length === 0) {
            orderList.innerHTML = `
                <div class="empty-orders">
                    <p>No orders yet</p>
                    <p>Start ordering from our delicious restaurants!</p>
                    <a href="index.html" class="btn btn-primary">Browse Restaurants</a>
                </div>
            `;
            return;
        }
        
        orderList.innerHTML = orders.map(order => {
            const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const itemCount = order.items?.length || 0;
            const statusClass = order.status || 'pending';
            
            return `
                <div class="order-item">
                    <div class="order-header">
                        <div>
                            <h4>Order #${order._id.slice(-8).toUpperCase()}</h4>
                            <p class="order-date">${orderDate}</p>
                        </div>
                        <span class="order-status ${statusClass}">${order.status}</span>
                    </div>
                    
                    <div class="order-details">
                        <p><strong>Items:</strong> ${itemCount} item${itemCount !== 1 ? 's' : ''}</p>
                        <p><strong>Restaurant:</strong> ${order.restaurant?.name || 'Not specified'}</p>
                        <p><strong>Total:</strong> $${order.totalPrice?.toFixed(2) || '0.00'}</p>
                    </div>
                    
                    <div class="order-items">
                        ${order.items?.slice(0, 3).map(item => `
                            <span class="order-item-tag">${item.quantity}x ${item.name}</span>
                        `).join('')}
                        ${order.items?.length > 3 ? `<span class="order-item-tag">+${order.items.length - 3} more</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Orders load error:', error);
        orderList.innerHTML = `
            <div class="error-message">
                <p>Failed to load orders: ${error.message}</p>
                <button onclick="loadOrders()" class="btn">Retry</button>
            </div>
        `;
    }
}

// Edit profile functionality
if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
        showEditProfileModal();
    });
}

function showEditProfileModal() {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Edit Profile</h3>
                <button class="close-modal">&times;</button>
            </div>
            <form id="editProfileForm">
                <div class="form-group">
                    <label for="editName">Name</label>
                    <input type="text" id="editName" value="${userNameEl.textContent}" required>
                </div>
                <div class="form-group">
                    <label for="editEmail">Email</label>
                    <input type="email" id="editEmail" value="${userEmailEl.textContent}" required>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                    <button type="button" class="btn btn-secondary close-modal">Cancel</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    const form = modal.querySelector('#editProfileForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = modal.querySelector('#editName').value.trim();
        const email = modal.querySelector('#editEmail').value.trim();
        
        // Validation
        if (!name || !email) {
            alert('Please fill in all fields');
            return;
        }
        
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Saving...';
        submitBtn.disabled = true;
        
        try {
            const response = await updateProfile({ name, email });
            
            if (response && response.success) {
                // Update displayed data
                userNameEl.textContent = name;
                userEmailEl.textContent = email;
                
                // Update localStorage
                const user = JSON.parse(localStorage.getItem('user'));
                user.name = name;
                user.email = email;
                localStorage.setItem('user', JSON.stringify(user));
                
                // Close modal
                modal.remove();
                
                // Show success message
                showMessage('Profile updated successfully!', 'success');
            } else {
                throw new Error(response?.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            alert('Failed to update profile: ' + error.message);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
    
    // Handle modal close
    modal.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.remove();
        });
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Helper functions
function showLoading(type) {
    if (type === 'profile') {
        userNameEl.textContent = 'Loading...';
        userEmailEl.textContent = 'Loading...';
        memberSinceEl.textContent = 'Loading...';
    } else if (type === 'orders') {
        orderList.innerHTML = '<div class="loading">Loading orders...</div>';
    }
}

function showError(message) {
    orderList.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
            <button onclick="window.location.reload()" class="btn">Refresh Page</button>
        </div>
    `;
}

function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMsg = document.querySelector('.profile-message');
    if (existingMsg) existingMsg.remove();
    
    // Create message element
    const msg = document.createElement('div');
    msg.className = `profile-message profile-message-${type}`;
    msg.textContent = message;
    msg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 8px;
        color: white;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    if (type === 'success') {
        msg.style.backgroundColor = '#28a745';
    } else if (type === 'error') {
        msg.style.backgroundColor = '#dc3545';
    } else {
        msg.style.backgroundColor = '#007bff';
    }
    
    document.body.appendChild(msg);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        msg.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => msg.remove(), 300);
    }, 3000);
}

// Initialize profile page
document.addEventListener('DOMContentLoaded', async () => {
    await loadProfile();
    await loadOrders();
});

// Add CSS for profile page enhancements
const profileStyle = document.createElement('style');
profileStyle.textContent = `
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    
    .modal-content {
        background: white;
        padding: 2rem;
        border-radius: 10px;
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }
    
    .close-modal {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
    }
    
    .order-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
    }
    
    .order-date {
        color: #666;
        font-size: 0.9rem;
    }
    
    .order-status {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;
        text-transform: uppercase;
    }
    
    .order-status.pending {
        background: #ffc107;
        color: #212529;
    }
    
    .order-status.confirmed {
        background: #17a2b8;
        color: white;
    }
    
    .order-status.preparing {
        background: #007bff;
        color: white;
    }
    
    .order-status.delivered {
        background: #28a745;
        color: white;
    }
    
    .order-status.cancelled {
        background: #dc3545;
        color: white;
    }
    
    .order-details {
        margin: 1rem 0;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
    }
    
    .order-details p {
        margin: 0.5rem 0;
    }
    
    .order-items {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 1rem;
    }
    
    .order-item-tag {
        background: #e9ecef;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.85rem;
        color: #495057;
    }
    
    .empty-orders {
        text-align: center;
        padding: 3rem;
        color: #666;
    }
    
    .empty-orders p {
        margin-bottom: 1rem;
    }
    
    .loading {
        text-align: center;
        padding: 2rem;
        color: #666;
    }
    
    .error-message {
        text-align: center;
        padding: 2rem;
        color: #dc3545;
    }
    
    .error-message button {
        margin-top: 1rem;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(profileStyle);