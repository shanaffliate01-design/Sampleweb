// ===== MAIN APPLICATION =====
class MonoCafeApp {
    constructor() {
        this.cart = [];
        this.currentCategory = 'all';
        this.init();
    }

    init() {
        this.renderCategories();
        this.renderMenu();
        this.bindEvents();
        this.updateCartUI();
    }

    // ===== RENDER CATEGORIES =====
    renderCategories() {
        const categories = dataStore.getCategories();
        const filterContainer = document.getElementById('categoryFilter');
        
        let html = '<button class="category-btn active" data-category="all">All</button>';
        categories.forEach(cat => {
            html += `<button class="category-btn" data-category="${cat}">${cat}</button>`;
        });
        filterContainer.innerHTML = html;

        // Bind category click events
        filterContainer.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterContainer.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.renderMenu();
            });
        });
    }

    // ===== RENDER MENU =====
    renderMenu() {
        const items = dataStore.getAvailableItems();
        const filtered = this.currentCategory === 'all' 
            ? items 
            : items.filter(item => item.category === this.currentCategory);
        
        const grid = document.getElementById('menuGrid');
        const emptyState = document.getElementById('emptyState');

        if (filtered.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        emptyState.style.display = 'none';

        grid.innerHTML = filtered.map(item => `
            <div class="menu-card" data-id="${item.id}">
                ${item.image 
                    ? `<img class="menu-card-image" src="${item.image}" alt="${item.name}" loading="lazy">`
                    : `<div class="menu-card-image menu-card-emoji">${item.emoji}</div>`
                }
                <div class="menu-card-body">
                    <span class="menu-card-category">${item.category}</span>
                    <h3 class="menu-card-title">${item.name}</h3>
                    <p class="menu-card-desc">${item.description}</p>
                    <div class="menu-card-footer">
                        <span class="menu-card-price">$${item.price.toFixed(2)}</span>
                        <button class="add-to-cart-btn" data-id="${item.id}" title="Add to cart">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Bind add to cart buttons
        grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.dataset.id);
                this.addToCart(id);
                btn.classList.add('added');
                btn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    btn.classList.remove('added');
                    btn.innerHTML = '<i class="fas fa-plus"></i>';
                }, 1000);
            });
        });
    }

    // ===== CART LOGIC =====
    addToCart(itemId) {
        const item = dataStore.getMenuItems().find(i => i.id === itemId);
        if (!item) return;

        const existing = this.cart.find(c => c.id === itemId);
        if (existing) {
            existing.qty++;
        } else {
            this.cart.push({ ...item, qty: 1 });
        }
        this.updateCartUI();
    }

    removeFromCart(itemId) {
        this.cart = this.cart.filter(c => c.id !== itemId);
        this.updateCartUI();
    }

    updateQty(itemId, delta) {
        const item = this.cart.find(c => c.id === itemId);
        if (!item) return;
        item.qty += delta;
        if (item.qty <= 0) {
            this.removeFromCart(itemId);
        } else {
            this.updateCartUI();
        }
    }

    getCartTotal() {
        return this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    }

    updateCartUI() {
        const count = this.cart.reduce((sum, item) => sum + item.qty, 0);
        document.getElementById('cartCount').textContent = count;

        const cartItems = document.getElementById('cartItems');
        const cartEmpty = document.getElementById('cartEmpty');
        const cartFooter = document.getElementById('cartFooter');

        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="cart-empty">
                    <i class="fas fa-shopping-bag"></i>
                    <p>Your cart is empty</p>
                    <span>Add items from the menu to get started</span>
                </div>
            `;
            cartFooter.style.display = 'none';
            return;
        }

        cartFooter.style.display = 'block';
        cartItems.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-emoji">${item.emoji}</div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" data-id="${item.id}" data-action="decrease">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="cart-item-qty">${item.qty}</span>
                    <button class="qty-btn" data-id="${item.id}" data-action="increase">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Bind qty buttons
        cartItems.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const action = btn.dataset.action;
                this.updateQty(id, action === 'increase' ? 1 : -1);
            });
        });

        // Update totals
        const subtotal = this.getCartTotal();
        const tax = subtotal * 0.10;
        const total = subtotal + tax;

        document.getElementById('cartSubtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('cartTax').textContent = `$${tax.toFixed(2)}`;
        document.getElementById('cartTotal').textContent = `$${total.toFixed(2)}`;
    }

    // ===== CHECKOUT =====
    checkout() {
        if (this.cart.length === 0) return;

        // Show order type selection modal first
        this.toggleCart(false);
        document.getElementById('orderTypeModal').style.display = 'flex';
    }

    placeOrder(orderType) {
        document.getElementById('orderTypeModal').style.display = 'none';

        const subtotal = this.getCartTotal();
        const tax = subtotal * 0.10;
        const total = subtotal + tax;

        const order = dataStore.addOrder({
            items: this.cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                qty: item.qty
            })),
            subtotal,
            tax,
            total,
            orderType
        });

        // Show success modal
        document.getElementById('orderNumber').textContent = order.id;
        document.getElementById('orderTypeDisplay').textContent = this.getOrderTypeLabel(orderType);
        document.getElementById('orderModal').style.display = 'flex';

        // Clear cart
        this.cart = [];
        this.updateCartUI();
    }

    getOrderTypeLabel(type) {
        const labels = { 'dine-in': 'Dine In', 'delivery': 'Delivery', 'takeout': 'Take Out' };
        return labels[type] || type;
    }

    // ===== CART TOGGLE =====
    toggleCart(show) {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('cartOverlay');
        
        if (show) {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // ===== EVENT BINDINGS =====
    bindEvents() {
        // Cart toggle
        document.getElementById('cartBtn').addEventListener('click', () => this.toggleCart(true));
        document.getElementById('cartClose').addEventListener('click', () => this.toggleCart(false));
        document.getElementById('cartOverlay').addEventListener('click', () => this.toggleCart(false));

        // Checkout
        document.getElementById('checkoutBtn').addEventListener('click', () => this.checkout());

        // Order type selection
        document.querySelectorAll('.order-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                this.placeOrder(type);
            });
        });

        // Order type modal cancel
        document.getElementById('orderTypeCancel').addEventListener('click', () => {
            document.getElementById('orderTypeModal').style.display = 'none';
            this.toggleCart(true);
        });

        // Order modal close
        document.getElementById('orderModalClose').addEventListener('click', () => {
            document.getElementById('orderModal').style.display = 'none';
        });
        document.getElementById('orderModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('orderModal')) {
                document.getElementById('orderModal').style.display = 'none';
            }
        });
        document.getElementById('orderTypeModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('orderTypeModal')) {
                document.getElementById('orderTypeModal').style.display = 'none';
                this.toggleCart(true);
            }
        });

        // Order tracker
        document.getElementById('trackOrderBtn').addEventListener('click', () => this.openTracker());
        document.getElementById('trackerClose').addEventListener('click', () => {
            document.getElementById('trackerModal').style.display = 'none';
        });
        document.getElementById('trackerModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('trackerModal')) {
                document.getElementById('trackerModal').style.display = 'none';
            }
        });

        // Smooth scroll for nav links
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    // ===== ORDER TRACKER =====
    openTracker() {
        const orders = dataStore.getOrders();
        const trackerOrders = document.getElementById('trackerOrders');
        const trackerEmpty = document.getElementById('trackerEmpty');

        if (orders.length === 0) {
            trackerEmpty.style.display = 'block';
            trackerOrders.innerHTML = '';
        } else {
            trackerEmpty.style.display = 'none';
            trackerOrders.innerHTML = orders.slice(0, 5).map(order => this.renderTrackerOrder(order)).join('');
        }

        document.getElementById('trackerModal').style.display = 'flex';
    }

    renderTrackerOrder(order) {
        const steps = ['pending', 'preparing', 'ready', 'completed'];
        const currentIndex = steps.indexOf(order.status);
        const progressWidth = currentIndex === 0 ? '0%' : currentIndex === 1 ? '33%' : currentIndex === 2 ? '66%' : '100%';

        const stepIcons = ['fa-clock', 'fa-fire-burner', 'fa-bell', 'fa-check'];
        const stepLabels = ['Pending', 'Preparing', 'Ready', 'Done'];

        const orderTypeLabels = { 'dine-in': '🍽️ Dine In', 'delivery': '🚗 Delivery', 'takeout': '🥡 Take Out' };
        const typeLabel = orderTypeLabels[order.orderType] || '';

        const timeAgo = this.formatTimeAgo(order.timestamp);
        const itemsSummary = order.items.map(i => `${i.name} x${i.qty}`).join(', ');

        return `
            <div class="tracker-order">
                <div class="tracker-order-header">
                    <span class="tracker-order-id">${order.id}</span>
                    <span class="tracker-order-time">${timeAgo}</span>
                </div>
                ${typeLabel ? `<div class="tracker-order-type">${typeLabel}</div>` : ''}
                <div class="tracker-steps">
                    <div class="tracker-progress" style="width: ${progressWidth};"></div>
                    ${steps.map((step, i) => `
                        <div class="tracker-step ${i < currentIndex ? 'completed' : ''} ${i === currentIndex ? 'active' : ''}">
                            <div class="tracker-step-icon">
                                <i class="fas ${i <= currentIndex ? (i < currentIndex ? 'fa-check' : stepIcons[i]) : stepIcons[i]}"></i>
                            </div>
                            <span class="tracker-step-label">${stepLabels[i]}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="tracker-items-summary">
                    ${itemsSummary} &mdash; <strong>$${order.total.toFixed(2)}</strong>
                </div>
            </div>
        `;
    }

    formatTimeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

// ===== SCROLL REVEAL ANIMATION (IntersectionObserver) =====
function initScrollReveal() {
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('scroll-revealed');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    // Observe all menu cards
    function observeCards() {
        const cards = document.querySelectorAll('.menu-card');
        cards.forEach(card => {
            if (!card.classList.contains('scroll-revealed')) {
                observer.observe(card);
            }
        });
    }

    // Initial observation
    observeCards();

    // Re-observe when menu is re-rendered (category change)
    const menuGrid = document.getElementById('menuGrid');
    if (menuGrid) {
        const mutationObserver = new MutationObserver(() => {
            // Small delay to let DOM settle after re-render
            setTimeout(observeCards, 50);
        });
        mutationObserver.observe(menuGrid, { childList: true });
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new MonoCafeApp();
    initScrollReveal();
});
