// ===== MAIN APPLICATION =====
class SmartMenuApp {
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
                <div class="menu-card-image">${item.emoji}</div>
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
            total
        });

        // Show success modal
        document.getElementById('orderNumber').textContent = order.id;
        document.getElementById('orderModal').style.display = 'flex';

        // Clear cart
        this.cart = [];
        this.updateCartUI();
        this.toggleCart(false);
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

        // Order modal close
        document.getElementById('orderModalClose').addEventListener('click', () => {
            document.getElementById('orderModal').style.display = 'none';
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
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new SmartMenuApp();
});
