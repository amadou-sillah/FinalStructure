// main.js - render homepage restaurant list dynamically
import { fetchRestaurants, isAuthenticated, getCurrentUser } from './api.js';

const listContainer = document.querySelector('.restaurant-list');
const navLinks = document.querySelector('.nav-links');

// Update navigation based on auth status
function updateNavigation() {
  if (!navLinks) return;
  
  const isLoggedIn = isAuthenticated();
  const user = getCurrentUser();
  
  // Clear existing navigation
  navLinks.innerHTML = '';
  
  // Always show Home
  navLinks.innerHTML += '<a href="index.html" class="active">Home</a>';
  
  if (isLoggedIn) {
    // Show Cart for all users
    navLinks.innerHTML += '<a href="cart.html">Cart</a>';
    
    // Show Profile for all users
    navLinks.innerHTML += '<a href="profile.html">Profile</a>';
    
    // Show Admin if user is admin
    if (user && user.role === 'admin') {
      navLinks.innerHTML += '<a href="admin.html">Admin</a>';
    }
    
    // Add logout
    navLinks.innerHTML += '<a href="#" id="logoutBtn">Logout</a>';
  } else {
    // Show login/register for non-logged in users
    navLinks.innerHTML += '<a href="login.html">Login</a>';
    navLinks.innerHTML += '<a href="register.html">Register</a>';
  }
  
  // Add logout handler
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = 'index.html';
    });
  }
}

function renderLoading() {
  if (!listContainer) return;
  listContainer.innerHTML = `
    <div class="loading-container">
      <div class="spinner"></div>
      <p>Loading restaurants...</p>
    </div>
  `;
}

function renderError(msg) {
  if (!listContainer) return;
  listContainer.innerHTML = `
    <div class="error-container">
      <p class="error">${msg}</p>
      <button onclick="window.location.reload()" class="btn">Retry</button>
    </div>
  `;
}

function renderRestaurants(restaurants) {
  if (!listContainer) return;
  
  if (!Array.isArray(restaurants) || restaurants.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <p>No restaurants found. Check back later!</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = restaurants.map(r => {
    const id = r._id || r.id || '';
    const image = r.image ? `images/${r.image}` : 'images/default-restaurant.jpg';
    const rating = r.rating ? `<span class="rating">⭐ ${r.rating.toFixed(1)}</span>` : '';
    const delivery = r.deliveryTime ? `<span class="delivery">⏱️ ${r.deliveryTime} min</span>` : '';
    
    return `
      <article class="restaurant-card">
        <a href="restaurant.html?id=${id}">
          <div class="restaurant-thumb">
            <img src="${image}" alt="${r.name}" onerror="this.src='images/default-restaurant.jpg'">
          </div>
          <div class="restaurant-body">
            <h3>${r.name}</h3>
            <p class="desc">${r.description || 'No description available'}</p>
            <div class="meta">
              ${rating}
              ${delivery}
              <span class="location">📍 ${r.location || 'Location not specified'}</span>
            </div>
          </div>
        </a>
      </article>
    `;
  }).join('');
}

async function initHomePage() {
  if (!listContainer) return;
  
  // Update navigation
  updateNavigation();
  
  try {
    renderLoading();
    const response = await fetchRestaurants();
    
    if (!response || !response.success) {
      renderError(response?.error || 'Failed to load restaurants');
      return;
    }
    
    renderRestaurants(response.restaurants || response);
  } catch (err) {
    console.error('Failed to init homepage', err);
    renderError('An unexpected error occurred. Please try again.');
  }
}

// Run automatically on page load
document.addEventListener('DOMContentLoaded', initHomePage);