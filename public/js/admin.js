// admin.js - admin dashboard functionality
import { 
    fetchRestaurants, 
    createRestaurant, 
    deleteRestaurant, 
    fetchMenu, 
    createMenuItem, 
    deleteMenuItem,
    isAuthenticated,
    isAdmin 
} from './api.js';

// Check admin access on page load
document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) {
        alert('Please login to access admin dashboard');
        window.location.href = 'login.html';
        return;
    }
    
    if (!isAdmin()) {
        alert('Admin access required');
        window.location.href = 'index.html';
        return;
    }
    
    // Initialize admin page
    initAdminPage();
});

// DOM Elements
const adminRestaurants = document.querySelector('.admin-restaurants');
const adminMenu = document.querySelector('.admin-menu');
const addRestaurantBtn = document.getElementById('addRestaurantBtn');
const restaurantForm = document.getElementById('restaurant-form');
const cancelRestaurant = document.getElementById('cancel-restaurant');
const menuItemForm = document.getElementById('menu-item-form');
const cancelMenuItem = document.getElementById('cancel-menu-item');
let selectedRestaurantId = null;

// State management
let restaurants = [];
let selectedRestaurant = null;

// Toggle forms
if (addRestaurantBtn) {
    addRestaurantBtn.addEventListener('click', () => {
        restaurantForm.style.display = restaurantForm.style.display === 'none' ? 'block' : 'none';
        if (restaurantForm.style.display === 'block') {
            restaurantForm.scrollIntoView({ behavior: 'smooth' });
        }
    });
}

if (cancelRestaurant) {
    cancelRestaurant.addEventListener('click', () => {
        restaurantForm.style.display = 'none';
        restaurantForm.reset();
    });
}

if (cancelMenuItem) {
    cancelMenuItem.addEventListener('click', () => {
        menuItemForm.style.display = 'none';
        menuItemForm.reset();
    });
}

// Initialize admin page
async function initAdminPage() {
    try {
        showLoading();
        await loadAdminRestaurants();
    } catch (error) {
        console.error('Admin init error:', error);
        showError('Failed to initialize admin dashboard');
    }
}

// Show loading state
function showLoading() {
    if (adminRestaurants) {
        adminRestaurants.innerHTML = '<div class="loading">Loading restaurants...</div>';
    }
    if (adminMenu) {
        adminMenu.innerHTML = '';
    }
}

// Show error message
function showError(message) {
    if (adminRestaurants) {
        adminRestaurants.innerHTML = `<div class="error">${message}</div>`;
    }
}

// Load restaurants for admin
async function loadAdminRestaurants() {
    try {
        const response = await fetchRestaurants();
        
        if (!response || !response.success) {
            throw new Error(response?.error || 'Failed to load restaurants');
        }
        
        restaurants = response.restaurants || response;
        
        if (!restaurants || restaurants.length === 0) {
            adminRestaurants.innerHTML = '<p>No restaurants found. Add your first restaurant!</p>';
            return;
        }

        adminRestaurants.innerHTML = restaurants.map(rest => `
            <div class="admin-card ${selectedRestaurantId === rest._id ? 'selected' : ''}" data-id="${rest._id}">
                <div class="admin-card-header">
                    <h4>${rest.name}</h4>
                    <div class="admin-actions">
                        <button class="btn-small btn-view-menu" data-id="${rest._id}">View Menu</button>
                        <button class="btn-small btn-danger btn-delete" data-id="${rest._id}">Delete</button>
                    </div>
                </div>
                <p>${rest.description || 'No description'}</p>
                <div class="admin-card-footer">
                    <small>📍 ${rest.location || 'No location'}</small>
                    <small>⭐ ${rest.rating || '0'}</small>
                    <small>⏱️ ${rest.deliveryTime || '30'} min</small>
                </div>
            </div>
        `).join('');

        // Add event listeners
        document.querySelectorAll('.btn-view-menu').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                selectRestaurant(id);
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                const restaurant = restaurants.find(r => r._id === id);
                
                if (restaurant && confirm(`Are you sure you want to delete "${restaurant.name}" and all its menu items?`)) {
                    try {
                        await deleteRestaurant(id);
                        await loadAdminRestaurants();
                        
                        // Clear menu if deleted restaurant was selected
                        if (selectedRestaurantId === id) {
                            selectedRestaurantId = null;
                            adminMenu.innerHTML = '';
                            menuItemForm.style.display = 'none';
                        }
                        
                        showMessage('Restaurant deleted successfully', 'success');
                    } catch (error) {
                        showMessage('Failed to delete restaurant: ' + error.message, 'error');
                    }
                }
            });
        });

    } catch (error) {
        console.error('Error loading restaurants:', error);
        showError('Failed to load restaurants: ' + error.message);
    }
}

// Select restaurant and show its menu
async function selectRestaurant(id) {
    selectedRestaurantId = id;
    selectedRestaurant = restaurants.find(r => r._id === id);
    
    if (!selectedRestaurant) {
        showError('Restaurant not found');
        return;
    }
    
    // Highlight selected restaurant
    document.querySelectorAll('.admin-card').forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.id === id) {
            card.classList.add('selected');
        }
    });

    // Show menu item form
    menuItemForm.style.display = 'block';
    menuItemForm.scrollIntoView({ behavior: 'smooth' });
    
    // Load menu items
    try {
        adminMenu.innerHTML = '<div class="loading">Loading menu...</div>';
        
        const response = await fetchMenu(id);
        
        if (!response || !response.success) {
            throw new Error(response?.error || 'Failed to load menu');
        }
        
        const menu = response.items || response;
        
        adminMenu.innerHTML = `
            <div class="menu-header">
                <h4>Menu for ${selectedRestaurant.name}</h4>
                <small>${menu.length} item${menu.length !== 1 ? 's' : ''}</small>
            </div>
            <div class="menu-items-list">
                ${menu.length === 0 ? '<p class="no-items">No menu items yet. Add your first item!</p>' : ''}
                ${menu.map(item => `
                    <div class="menu-item-row" data-item-id="${item._id}">
                        <div class="menu-item-info">
                            <div class="menu-item-header">
                                <strong>${item.name}</strong>
                                <span class="menu-item-price">$${item.price.toFixed(2)}</span>
                            </div>
                            <p class="menu-item-desc">${item.description || 'No description'}</p>
                        </div>
                        <button class="btn-small btn-danger btn-delete-item" data-id="${item._id}">Delete</button>
                    </div>
                `).join('')}
            </div>
        `;

        // Add delete handlers for menu items
        document.querySelectorAll('.btn-delete-item').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const itemId = e.target.dataset.id;
                const menuItem = menu.find(m => m._id === itemId);
                
                if (menuItem && confirm(`Delete "${menuItem.name}" from menu?`)) {
                    try {
                        await deleteMenuItem(itemId);
                        await selectRestaurant(id); // Reload menu
                        showMessage('Menu item deleted successfully', 'success');
                    } catch (error) {
                        showMessage('Failed to delete menu item: ' + error.message, 'error');
                    }
                }
            });
        });

    } catch (error) {
        console.error('Error loading menu:', error);
        adminMenu.innerHTML = `<div class="error">Failed to load menu: ${error.message}</div>`;
    }
}

// Handle restaurant form submission
if (restaurantForm) {
    restaurantForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('rest-name').value.trim(),
            description: document.getElementById('rest-desc').value.trim(),
            location: document.getElementById('rest-location').value.trim(),
            image: document.getElementById('rest-image').value.trim() || 'default-restaurant.jpg',
            rating: 0,
            deliveryTime: 30
        };

        // Validation
        if (!formData.name) {
            alert('Restaurant name is required');
            return;
        }

        const submitBtn = restaurantForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creating...';
        submitBtn.disabled = true;

        try {
            const response = await createRestaurant(formData);
            
            if (response && response.success) {
                restaurantForm.reset();
                restaurantForm.style.display = 'none';
                await loadAdminRestaurants();
                showMessage('Restaurant created successfully!', 'success');
            } else {
                throw new Error(response?.error || 'Failed to create restaurant');
            }
        } catch (error) {
            console.error('Create restaurant error:', error);
            alert('Failed to create restaurant: ' + error.message);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Handle menu item form submission
if (menuItemForm) {
    menuItemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!selectedRestaurantId) {
            alert('Please select a restaurant first');
            return;
        }

        const formData = {
            name: document.getElementById('menu-name').value.trim(),
            description: document.getElementById('menu-desc').value.trim(),
            price: parseFloat(document.getElementById('menu-price').value),
            image: document.getElementById('menu-image').value.trim() || 'default-food.jpg',
            restaurant: selectedRestaurantId,
        };

        // Validation
        if (!formData.name) {
            alert('Menu item name is required');
            return;
        }
        
        if (isNaN(formData.price) || formData.price < 0) {
            alert('Please enter a valid price');
            return;
        }

        const submitBtn = menuItemForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Adding...';
        submitBtn.disabled = true;

        try {
            const response = await createMenuItem(formData);
            
            if (response && response.success) {
                menuItemForm.reset();
                await selectRestaurant(selectedRestaurantId); // Reload menu
                showMessage('Menu item added successfully!', 'success');
            } else {
                throw new Error(response?.error || 'Failed to add menu item');
            }
        } catch (error) {
            console.error('Add menu item error:', error);
            alert('Failed to add menu item: ' + error.message);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Show message
function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMsg = document.querySelector('.admin-message');
    if (existingMsg) existingMsg.remove();
    
    // Create message element
    const msg = document.createElement('div');
    msg.className = `admin-message admin-message-${type}`;
    msg.textContent = message;
    msg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 8px;
        color: white;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
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
        msg.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => msg.remove(), 300);
    }, 3000);
}

// Add CSS for admin messages
const adminStyle = document.createElement('style');
adminStyle.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .loading {
        text-align: center;
        padding: 40px;
        color: #666;
    }
    
    .error {
        color: #dc3545;
        padding: 20px;
        text-align: center;
        background: #f8d7da;
        border-radius: 8px;
        margin: 10px 0;
    }
    
    .admin-card-footer {
        display: flex;
        gap: 10px;
        margin-top: 10px;
        font-size: 0.8rem;
        color: #666;
    }
    
    .menu-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid #eee;
    }
    
    .menu-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
    }
    
    .menu-item-price {
        color: #007bff;
        font-weight: bold;
    }
    
    .menu-item-desc {
        color: #666;
        font-size: 0.9rem;
        margin: 0;
    }
    
    .no-items {
        text-align: center;
        color: #999;
        padding: 20px;
    }
`;
document.head.appendChild(adminStyle);