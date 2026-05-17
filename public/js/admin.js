// ===== ADMIN PANEL APPLICATION =====
class AdminPanel {
    constructor() {
        this.currentSection = 'dashboard';
        this.editingItemId = null;
        this.deletingItemId = null;
        this.init();
    }

    init() {
        this.bindNavigation();
        this.bindMenuToggle();
        this.renderDashboard();
        this.renderMenuItems();
        this.renderOrders();
        this.renderCategories();
        this.bindItemModal();
        this.bindDeleteModal();
        this.bindOrderFilter();
    }

    // ===== NAVIGATION =====
    bindNavigation() {
        document.querySelectorAll('.sidebar-link[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.switchSection(section);
            });
        });
    }

    switchSection(section) {
        // Update nav links
        document.querySelectorAll('.sidebar-link[data-section]').forEach(l => l.classList.remove('active'));
        document.querySelector(`.sidebar-link[data-section="${section}"]`).classList.add('active');

        // Update sections
        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`section-${section}`).classList.add('active');

        // Update title
        const titles = {
            'dashboard': 'Dashboard',
            'menu-items': 'Menu Items',
            'orders': 'Orders',
            'categories': 'Categories'
        };
        document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';

        // Refresh data
        this.renderDashboard();
        this.renderOrders();
        this.renderCategories();

        // Close mobile sidebar
        document.getElementById('adminSidebar').classList.remove('active');

        this.currentSection = section;
    }

    bindMenuToggle() {
        document.getElementById('menuToggle').addEventListener('click', () => {
            document.getElementById('adminSidebar').classList.toggle('active');
        });
    }

    // ===== DASHBOARD =====
    renderDashboard() {
        const stats = dataStore.getStats();
        document.getElementById('statRevenue').textContent = `$${stats.totalRevenue.toFixed(2)}`;
        document.getElementById('statOrders').textContent = stats.totalOrders;
        document.getElementById('statPending').textContent = stats.pendingOrders;
        document.getElementById('statItems').textContent = stats.totalItems;

        // Recent orders
        const orders = dataStore.getOrders().slice(0, 5);
        const tbody = document.getElementById('recentOrdersTable');
        const empty = document.getElementById('dashEmptyOrders');

        if (orders.length === 0) {
            tbody.innerHTML = '';
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td><strong>${order.id}</strong></td>
                <td>${order.items.map(i => i.name).join(', ')}</td>
                <td>$${order.total.toFixed(2)}</td>
                <td><span class="status-badge status-${order.status}">${this.capitalize(order.status)}</span></td>
                <td>${order.orderType ? `<span class="order-type-tag">${this.getOrderTypeLabel(order.orderType)}</span>` : '-'}</td>
                <td>${this.formatTime(order.timestamp)}</td>
            </tr>
        `).join('');
    }

    // ===== MENU ITEMS =====
    renderMenuItems() {
        const items = dataStore.getMenuItems();
        const tbody = document.getElementById('menuItemsTable');

        tbody.innerHTML = items.map(item => `
            <tr>
                <td><span class="item-emoji">${item.emoji}</span></td>
                <td><strong>${item.name}</strong></td>
                <td>${item.category}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>
                    <span class="status-badge ${item.available ? 'status-available' : 'status-unavailable'}">
                        ${item.available ? 'Available' : 'Unavailable'}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit-item-btn" data-id="${item.id}" title="Edit">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="action-btn danger delete-item-btn" data-id="${item.id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Bind edit buttons
        tbody.querySelectorAll('.edit-item-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                this.openEditModal(id);
            });
        });

        // Bind delete buttons
        tbody.querySelectorAll('.delete-item-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.deletingItemId = parseInt(btn.dataset.id);
                document.getElementById('deleteModal').style.display = 'flex';
            });
        });
    }

    // ===== ITEM MODAL =====
    bindItemModal() {
        const modal = document.getElementById('itemModal');
        const form = document.getElementById('itemForm');

        document.getElementById('addItemBtn').addEventListener('click', () => {
            this.editingItemId = null;
            this.resetForm();
            document.getElementById('itemModalTitle').textContent = 'Add Menu Item';
            modal.style.display = 'flex';
        });

        document.getElementById('itemModalClose').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        document.getElementById('itemFormCancel').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveItem();
        });
    }

    openEditModal(id) {
        const item = dataStore.getMenuItems().find(i => i.id === id);
        if (!item) return;

        this.editingItemId = id;
        document.getElementById('itemModalTitle').textContent = 'Edit Menu Item';
        document.getElementById('itemId').value = id;
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemDesc').value = item.description;
        document.getElementById('itemPrice').value = item.price;
        document.getElementById('itemEmoji').value = item.emoji;
        document.getElementById('itemImage').value = item.image || '';
        document.getElementById('itemCategory').value = item.category;
        document.getElementById('itemAvailable').checked = item.available;

        this.populateCategoryList();
        document.getElementById('itemModal').style.display = 'flex';
    }

    resetForm() {
        document.getElementById('itemForm').reset();
        document.getElementById('itemId').value = '';
        document.getElementById('itemAvailable').checked = true;
        this.populateCategoryList();
    }

    populateCategoryList() {
        const categories = dataStore.getCategories();
        const datalist = document.getElementById('categoryList');
        datalist.innerHTML = categories.map(c => `<option value="${c}">`).join('');
    }

    saveItem() {
        const itemData = {
            name: document.getElementById('itemName').value.trim(),
            description: document.getElementById('itemDesc').value.trim(),
            price: parseFloat(document.getElementById('itemPrice').value),
            emoji: document.getElementById('itemEmoji').value.trim(),
            image: document.getElementById('itemImage').value.trim() || '',
            category: document.getElementById('itemCategory').value.trim(),
            available: document.getElementById('itemAvailable').checked
        };

        if (this.editingItemId) {
            dataStore.updateMenuItem(this.editingItemId, itemData);
        } else {
            dataStore.addMenuItem(itemData);
        }

        document.getElementById('itemModal').style.display = 'none';
        this.renderMenuItems();
        this.renderDashboard();
        this.renderCategories();
    }

    // ===== DELETE MODAL =====
    bindDeleteModal() {
        document.getElementById('deleteCancel').addEventListener('click', () => {
            document.getElementById('deleteModal').style.display = 'none';
            this.deletingItemId = null;
        });

        document.getElementById('deleteConfirm').addEventListener('click', () => {
            if (this.deletingItemId) {
                dataStore.deleteMenuItem(this.deletingItemId);
                this.deletingItemId = null;
                document.getElementById('deleteModal').style.display = 'none';
                this.renderMenuItems();
                this.renderDashboard();
                this.renderCategories();
            }
        });
    }

    // ===== ORDERS =====
    renderOrders(filter = 'all') {
        let orders = dataStore.getOrders();
        if (filter !== 'all') {
            orders = orders.filter(o => o.status === filter);
        }

        const tbody = document.getElementById('ordersTable');
        const empty = document.getElementById('ordersEmpty');

        if (orders.length === 0) {
            tbody.innerHTML = '';
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td><strong>${order.id}</strong></td>
                <td>${order.items.map(i => `${i.name} x${i.qty}`).join(', ')}</td>
                <td>$${order.total.toFixed(2)}</td>
                <td><span class="status-badge status-${order.status}">${this.capitalize(order.status)}</span></td>
                <td>${order.orderType ? `<span class="order-type-tag">${this.getOrderTypeLabel(order.orderType)}</span>` : '-'}</td>
                <td>${this.formatTime(order.timestamp)}</td>
                <td>
                    <select class="status-select" data-order-id="${order.id}" ${order.status === 'completed' ? 'disabled' : ''}>
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                        <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                    </select>
                </td>
            </tr>
        `).join('');

        // Bind status change
        tbody.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', () => {
                const orderId = select.dataset.orderId;
                dataStore.updateOrderStatus(orderId, select.value);
                this.renderOrders(document.getElementById('orderStatusFilter').value);
                this.renderDashboard();
            });
        });
    }

    bindOrderFilter() {
        document.getElementById('orderStatusFilter').addEventListener('change', (e) => {
            this.renderOrders(e.target.value);
        });
    }

    // ===== CATEGORIES =====
    renderCategories() {
        const items = dataStore.getMenuItems();
        const categories = dataStore.getCategories();
        const grid = document.getElementById('categoriesGrid');

        const categoryEmojis = {};
        items.forEach(item => {
            if (!categoryEmojis[item.category]) {
                categoryEmojis[item.category] = item.emoji;
            }
        });

        grid.innerHTML = categories.map(cat => {
            const count = items.filter(i => i.category === cat).length;
            return `
                <div class="category-card">
                    <div class="category-card-icon">${categoryEmojis[cat] || '📁'}</div>
                    <h4>${cat}</h4>
                    <p>${count} item${count !== 1 ? 's' : ''}</p>
                </div>
            `;
        }).join('');
    }

    // ===== UTILITIES =====
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    getOrderTypeLabel(type) {
        const labels = { 'dine-in': '🍽️ Dine In', 'delivery': '🚗 Delivery', 'takeout': '🥡 Take Out' };
        return labels[type] || type;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    new AdminPanel();
});
