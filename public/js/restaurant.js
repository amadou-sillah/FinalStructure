// restaurant.js - handles restaurant page
import { fetchRestaurant, fetchMenu, isAuthenticated } from './api.js';

// Get restaurant ID from URL
const urlParams = new URLSearchParams(window.location.search);
const restaurantId = urlParams.get('id');

// DOM Elements
const restaurantName = document.getElementById('restaurantName');
const restaurantDescription = document.getElementById('restaurantDescription');
const restaurantRating = document.getElementById('restaurantRating');
const restaurantLocation = document.getElementById('restaurantLocation');
const restaurantDeliveryTime = document.getElementById('restaurantDeliveryTime');
const restaurantImage = document.getElementById('restaurantImage');
const menuGrid = document.getElementById('menuGrid');

// Check if restaurant ID is provided
if (!restaurantId) {
    window.location.href = 'index.html';
}

// Add item to cart
function addToCart(item) {
    if (!isAuthenticated()) {
        if (confirm('You need to login to add items to cart. Go to login page?')) {
            window.location.href = 'login.html';
        }
        return;
    }
    
    let cart = JSON.parse(localStorage.getItem('cart')) || { items: [], restaurant: null };
    
    // Check if adding from different restaurant
    if (cart.restaurant && cart.restaurant !== restaurantId) {
        if (!confirm('Your cart contains items from another restaurant. Do you want to clear the cart and add items from this restaurant?')) {
            return;
        }
        cart.items = [];
        cart.restaurant = restaurantId;
    }
    
    // Set restaurant if not set
    if (!cart.restaurant) {
        cart.restaurant = restaurantId;
    }
    
    // Check if item already exists in cart
    const existingItem = cart.items.find(i => i.id === item._id);
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        cart.items.push({
            id: item._id,
            name: item.name,
            price: item.price,
            image: item.image || 'default-food.jpg',
            quantity: 1
        });
    }
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Show feedback
    showCartFeedback(`${item.name} added to cart!`);
    
    // Update cart count in navbar (if exists)
    updateCartCount();
}

// Show feedback message
function showCartFeedback(message) {
    // Remove existing feedback
    const existingFeedback = document.querySelector('.cart-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    // Create new feedback
    const feedback = document.createElement('div');
    feedback.className = 'cart-feedback';
    feedback.textContent = message;
    feedback.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(feedback);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        feedback.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => feedback.remove(), 300);
    }, 3000);
}

// Update cart count in navbar
function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        const cart = JSON.parse(localStorage.getItem('cart')) || { items: [] };
        const totalItems = cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        cartCount.textContent = totalItems > 0 ? `(${totalItems})` : '';
    }
}

// Load restaurant data
async function loadRestaurant() {
    try {
        // Show loading state
        restaurantName.textContent = 'Loading...';
        menuGrid.innerHTML = '<div class="loading-spinner"></div>';
        
        // Load restaurant info
        const restaurantResponse = await fetchRestaurant(restaurantId);
        
        if (!restaurantResponse || !restaurantResponse.success) {
            throw new Error(restaurantResponse?.error || 'Failed to load restaurant');
        }
        
        const restaurant = restaurantResponse.restaurant || restaurantResponse;
        
        // Update restaurant info
        restaurantName.textContent = restaurant.name;
        restaurantDescription.textContent = restaurant.description || 'No description available';
        restaurantRating.textContent = `⭐ ${restaurant.rating?.toFixed(1) || 'N/A'}`;
        restaurantLocation.textContent = `📍 ${restaurant.location || 'Location not specified'}`;
        restaurantDeliveryTime.textContent = `⏱️ ${restaurant.deliveryTime || 30} min`;
        
        if (restaurant.image) {
            restaurantImage.src = `images/${restaurant.image}`;
            restaurantImage.alt = restaurant.name;
        }
        restaurantImage.onerror = function() {
            this.src = 'images/default-restaurant.jpg';
        };

        // Load menu
        const menuResponse = await fetchMenu(restaurantId);
        
        if (!menuResponse || !menuResponse.success) {
            throw new Error(menuResponse?.error || 'Failed to load menu');
        }
        
        const menu = menuResponse.items || menuResponse;
        
        if (!Array.isArray(menu) || menu.length === 0) {
            menuGrid.innerHTML = '<p class="no-menu">No menu items available.</p>';
            return;
        }

        menuGrid.innerHTML = menu.map(item => `
            <div class="menu-item">
                <div class="menu-item-image">
                    <img src="${item.image ? `images/${item.image}` : 'images/default-food.jpg'}" 
                         alt="${item.name}"
                         onerror="this.src='images/default-food.jpg'">
                </div>
                <div class="menu-item-info">
                    <h3>${item.name}</h3>
                    <p class="menu-description">${item.description || 'No description available'}</p>
                    <div class="menu-item-footer">
                        <span class="price">$${item.price.toFixed(2)}</span>
                        <button class="btn-add-to-cart" data-id="${item._id}">
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Add event listeners to "Add to Cart" buttons
        document.querySelectorAll('.btn-add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = e.target.dataset.id;
                const item = menu.find(m => m._id === itemId);
                if (item) {
                    addToCart(item);
                }
            });
        });

    } catch (error) {
        console.error('Error loading restaurant:', error);
        menuGrid.innerHTML = `
            <div class="error-container">
                <p class="error">Failed to load restaurant data: ${error.message}</p>
                <button onclick="window.location.href='index.html'" class="btn">Back to Restaurants</button>
            </div>
        `;
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadRestaurant();
    updateCartCount();
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
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
    
    .loading-spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #007bff;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 20px auto;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .no-menu, .error-container {
        text-align: center;
        padding: 40px;
        grid-column: 1 / -1;
    }
    
    .error {
        color: #dc3545;
        margin-bottom: 20px;
    }
`;
document.head.appendChild(style);