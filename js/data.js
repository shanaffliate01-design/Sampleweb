// ===== DEFAULT MENU DATA =====
const DEFAULT_MENU_ITEMS = [
    {
        id: 1,
        name: "Classic Burger",
        description: "Juicy beef patty with lettuce, tomato, and our secret sauce",
        price: 12.99,
        category: "Burgers",
        emoji: "🍔",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop",
        available: true
    },
    {
        id: 2,
        name: "Margherita Pizza",
        description: "Fresh mozzarella, basil, and tomato sauce on crispy dough",
        price: 14.99,
        category: "Pizza",
        emoji: "🍕",
        image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&h=400&fit=crop",
        available: true
    },
    {
        id: 3,
        name: "Caesar Salad",
        description: "Crisp romaine lettuce, parmesan, croutons, and Caesar dressing",
        price: 9.99,
        category: "Salads",
        emoji: "🥗",
        image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&h=400&fit=crop",
        available: true
    },
    {
        id: 4,
        name: "Grilled Salmon",
        description: "Atlantic salmon fillet with lemon herb butter and asparagus",
        price: 22.99,
        category: "Mains",
        emoji: "🐟",
        image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=400&fit=crop",
        available: true
    },
    {
        id: 5,
        name: "Pasta Carbonara",
        description: "Spaghetti with crispy pancetta, egg, pecorino, and black pepper",
        price: 15.99,
        category: "Pasta",
        emoji: "🍝",
        image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&h=400&fit=crop",
        available: true
    },
    {
        id: 6,
        name: "Chicken Wings",
        description: "Crispy wings tossed in your choice of buffalo or BBQ sauce",
        price: 11.99,
        category: "Starters",
        emoji: "🍗",
        image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&h=400&fit=crop",
        available: true
    },
    {
        id: 7,
        name: "Mushroom Risotto",
        description: "Creamy arborio rice with wild mushrooms and truffle oil",
        price: 16.99,
        category: "Mains",
        emoji: "🍄",
        image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&h=400&fit=crop",
        available: true
    },
    {
        id: 8,
        name: "Fish Tacos",
        description: "Battered fish with slaw, avocado crema, and lime",
        price: 13.99,
        category: "Mains",
        emoji: "🌮",
        image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&h=400&fit=crop",
        available: true
    },
    {
        id: 9,
        name: "Tiramisu",
        description: "Classic Italian dessert with espresso-soaked ladyfingers",
        price: 8.99,
        category: "Desserts",
        emoji: "🍰",
        image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&h=400&fit=crop",
        available: true
    },
    {
        id: 10,
        name: "Smoothie Bowl",
        description: "Acai blend topped with granola, berries, and coconut",
        price: 10.99,
        category: "Beverages",
        emoji: "🫐",
        image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&h=400&fit=crop",
        available: true
    },
    {
        id: 11,
        name: "Iced Latte",
        description: "Double shot espresso with cold milk over ice",
        price: 5.99,
        category: "Beverages",
        emoji: "☕",
        image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=400&fit=crop",
        available: true
    },
    {
        id: 12,
        name: "Cheese Fries",
        description: "Crispy fries loaded with melted cheddar and bacon bits",
        price: 7.99,
        category: "Starters",
        emoji: "🍟",
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&h=400&fit=crop",
        available: true
    }
];

// ===== DATA MANAGEMENT =====
class DataStore {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem('smartmenu_items')) {
            localStorage.setItem('smartmenu_items', JSON.stringify(DEFAULT_MENU_ITEMS));
        }
        if (!localStorage.getItem('smartmenu_orders')) {
            localStorage.setItem('smartmenu_orders', JSON.stringify([]));
        }
        if (!localStorage.getItem('smartmenu_next_id')) {
            localStorage.setItem('smartmenu_next_id', '13');
        }
    }

    getMenuItems() {
        return JSON.parse(localStorage.getItem('smartmenu_items')) || [];
    }

    getAvailableItems() {
        return this.getMenuItems().filter(item => item.available);
    }

    saveMenuItems(items) {
        localStorage.setItem('smartmenu_items', JSON.stringify(items));
    }

    addMenuItem(item) {
        const items = this.getMenuItems();
        const nextId = parseInt(localStorage.getItem('smartmenu_next_id'));
        item.id = nextId;
        localStorage.setItem('smartmenu_next_id', (nextId + 1).toString());
        items.push(item);
        this.saveMenuItems(items);
        return item;
    }

    updateMenuItem(id, updates) {
        const items = this.getMenuItems();
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updates };
            this.saveMenuItems(items);
            return items[index];
        }
        return null;
    }

    deleteMenuItem(id) {
        const items = this.getMenuItems().filter(item => item.id !== id);
        this.saveMenuItems(items);
    }

    getCategories() {
        const items = this.getMenuItems();
        return [...new Set(items.map(item => item.category))];
    }

    // Orders
    getOrders() {
        return JSON.parse(localStorage.getItem('smartmenu_orders')) || [];
    }

    addOrder(order) {
        const orders = this.getOrders();
        order.id = 'ORD-' + Date.now().toString(36).toUpperCase();
        order.timestamp = new Date().toISOString();
        order.status = 'pending';
        orders.unshift(order);
        localStorage.setItem('smartmenu_orders', JSON.stringify(orders));
        return order;
    }

    updateOrderStatus(orderId, status) {
        const orders = this.getOrders();
        const index = orders.findIndex(o => o.id === orderId);
        if (index !== -1) {
            orders[index].status = status;
            localStorage.setItem('smartmenu_orders', JSON.stringify(orders));
        }
    }

    getStats() {
        const orders = this.getOrders();
        const items = this.getMenuItems();
        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => o.status === 'pending').length;

        return {
            totalRevenue,
            totalOrders,
            pendingOrders,
            totalItems: items.length,
            categories: this.getCategories().length
        };
    }
}

// Global instance
const dataStore = new DataStore();
