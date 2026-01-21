// cart.js - handles cart functionality
import { createOrder, isAuthenticated } from "./api.js";

// DOM Elements
const cartContainer = document.querySelector("#cartItems") || document.querySelector(".cart-items");
const subtotalEl = document.querySelector("#subtotal") || document.querySelector(".cart-total");
const totalEl = document.querySelector("#total");
const checkoutBtn = document.querySelector("#checkoutBtn") || document.querySelector(".checkout-btn");

// Check authentication on page load
if (!isAuthenticated()) {
    if (confirm('You need to login to access the cart. Go to login page?')) {
        window.location.href = 'login.html';
    } else {
        window.location.href = 'index.html';
    }
}

// Local cart functions
function readLocalCart() {
    try {
        const cart = localStorage.getItem('cart');
        if (!cart) {
            return { items: [], restaurant: null };
        }
        return JSON.parse(cart);
    } catch (e) {
        console.error('Error reading cart:', e);
        return { items: [], restaurant: null };
    }
}

function writeLocalCart(cart) {
    try {
        localStorage.setItem('cart', JSON.stringify(cart));
    } catch (e) {
        console.error('Error writing cart:', e);
    }
}

// Clear cart after successful order
function clearCart() {
    writeLocalCart({ items: [], restaurant: null });
}

// Load cart from localStorage
function loadCart() {
    const cart = readLocalCart();
    
    if (!cart.items || cart.items.length === 0) {
        renderEmptyCart();
        return;
    }
    
    renderCartItems(cart.items);
    updateTotals(cart.items);
}

function renderCartItems(items) {
    cartContainer.innerHTML = items.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <img src="images/${item.image || 'default-food.jpg'}" alt="${item.name}" 
                 onerror="this.src='images/default-food.jpg'">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p class="price">$${item.price.toFixed(2)}</p>
            </div>
            <div class="cart-quantity">
                <button class="qty-btn minus" data-id="${item.id}">-</button>
                <span class="qty">${item.quantity || 1}</span>
                <button class="qty-btn plus" data-id="${item.id}">+</button>
            </div>
            <button class="remove-btn" data-id="${item.id}">Remove</button>
        </div>
    `).join('');
    
    attachCartEvents();
}

function attachCartEvents() {
    // Remove item buttons
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = e.target.dataset.id;
            const cart = readLocalCart();
            cart.items = cart.items.filter(i => String(i.id) !== String(itemId));
            
            // If cart is empty, clear restaurant reference
            if (cart.items.length === 0) {
                cart.restaurant = null;
            }
            
            writeLocalCart(cart);
            loadCart();
        });
    });

    // Increase quantity buttons
    document.querySelectorAll('.plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = e.target.dataset.id;
            const cart = readLocalCart();
            const item = cart.items.find(i => String(i.id) === String(itemId));
            
            if (item) {
                item.quantity = (item.quantity || 1) + 1;
                writeLocalCart(cart);
                loadCart();
            }
        });
    });

    // Decrease quantity buttons
    document.querySelectorAll('.minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = e.target.dataset.id;
            const cart = readLocalCart();
            const item = cart.items.find(i => String(i.id) === String(itemId));
            
            if (item && item.quantity > 1) {
                item.quantity -= 1;
                writeLocalCart(cart);
                loadCart();
            }
        });
    });
}

function updateTotals(items) {
    const subtotal = items.reduce((total, item) => {
        return total + (item.price * (item.quantity || 1));
    }, 0);
    
    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    
    // Delivery fee
    const deliveryFee = 2.00;
    const total = subtotal + deliveryFee;
    
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    if (checkoutBtn) checkoutBtn.disabled = items.length === 0;
}

function renderEmptyCart() {
    cartContainer.innerHTML = `
        <div class="empty-cart">
            <p>Your cart is empty</p>
            <p class="empty-cart-message">Add some delicious food from our restaurants!</p>
            <a href="index.html" class="btn btn-primary">Browse Restaurants</a>
        </div>`;
    
    if (subtotalEl) subtotalEl.textContent = "$0.00";
    if (totalEl) totalEl.textContent = "$0.00";
    if (checkoutBtn) checkoutBtn.disabled = true;
}

// Checkout functionality
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
        const cart = readLocalCart();
        
        if (!cart.items || cart.items.length === 0) {
            alert('Your cart is empty');
            return;
        }

        // Get delivery address (simple implementation)
        const deliveryAddress = prompt('Please enter your delivery address:', '123 Main St, City, State');
        if (!deliveryAddress) {
            alert('Delivery address is required');
            return;
        }

        // Get payment method
        const paymentMethod = prompt('Payment method (cash/card/online):', 'cash');
        if (!paymentMethod || !['cash', 'card', 'online'].includes(paymentMethod.toLowerCase())) {
            alert('Please select a valid payment method: cash, card, or online');
            return;
        }

        // Prepare order payload
        const items = cart.items.map(item => ({
            menuItem: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity || 1
        }));

        const payload = {
            items,
            restaurant: cart.restaurant,
            deliveryAddress,
            paymentMethod: paymentMethod.toLowerCase()
        };

        // Disable checkout button and show loading
        checkoutBtn.textContent = 'Processing...';
        checkoutBtn.disabled = true;

        try {
            const response = await createOrder(payload);
            
            if (response && response.success) {
                // Clear cart
                clearCart();
                
                // Show success message
                alert(`Order placed successfully!\nOrder ID: ${response.order._id}\nTotal: $${response.order.totalPrice.toFixed(2)}`);
                
                // Redirect to profile to view orders
                window.location.href = 'profile.html';
            } else {
                alert('Order failed: ' + (response?.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Order failed: ' + error.message);
        } finally {
            // Restore checkout button
            checkoutBtn.textContent = 'Proceed to Checkout';
            checkoutBtn.disabled = false;
        }
    });
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', loadCart);