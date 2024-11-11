<template>
    <div class="min-h-screen bg-gray-100">
      <!-- Navigation -->
      <nav class="bg-gray-900 p-4">
        <div class="container mx-auto">
          <div class="flex items-center justify-between">
            <h1 class="text-white text-xl font-bold">SmartFella Kitchen</h1>
            <div class="space-x-4">
              <button 
                v-for="tab in tabs" 
                :key="tab"
                @click="currentTab = tab"
                :class="[
                  'px-4 py-2 rounded',
                  currentTab === tab 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white'
                ]"
              >
                {{ tab }}
              </button>
            </div>
            <button 
                @click="handleLogout"
                class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 ml-4"
            >
                Logout
            </button>
          </div>
        </div>
      </nav>

      <div class="container mx-auto px-4 py-8">
      <!-- FnB Management -->
      <div v-if="currentTab === 'FnB'" class="space-y-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-bold mb-4">Add Food & Beverage Item</h2>
          <form @submit.prevent="saveFnB" class="space-y-4">
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-2">Name:</label>
              <input 
                v-model="fnbForm.name" 
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                required
              >
            </div>
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-2">Type:</label>
              <select 
                v-model="fnbForm.type"
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                required
              >
                <option value="food">Food</option>
                <option value="beverage">Beverage</option>
              </select>
            </div>
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-2">Price:</label>
              <input 
                v-model="fnbForm.price"
                type="number"
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                required
              >
            </div>
            <button 
              type="submit"
              class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Add Item
            </button>
          </form>
        </div>

        <div class="bg-white rounded-lg shadow">
          <div class="p-6">
            <h2 class="text-2xl font-bold mb-4">Food & Beverage Items</h2>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr v-for="item in fnbItems" :key="item.fnb_id">
                    <td class="px-6 py-4 whitespace-nowrap">{{ item.name }}</td>
                    <td class="px-6 py-4 whitespace-nowrap capitalize">{{ item.type }}</td>
                    <td class="px-6 py-4 whitespace-nowrap">Rp {{ item.price }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Menu Management -->
      <div v-if="currentTab === 'Menu'" class="space-y-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-bold mb-4">Create Menu Package</h2>
          <form @submit.prevent="saveMenu" class="space-y-4">
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-2">Name:</label>
              <input 
                v-model="menuForm.name" 
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                required
              >
            </div>
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-2">
                <input 
                  type="checkbox" 
                  v-model="menuForm.is_vegetarian"
                  class="mr-2"
                >
                Vegetarian
              </label>
            </div>
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-2">Price:</label>
              <input 
                v-model="menuForm.price"
                type="number"
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                required
              >
            </div>
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-2">Select Food and Beverage:</label>
              <div class="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
                <div v-for="item in fnbItems" :key="item.fnb_id" class="flex items-center justify-between p-2">
                  <label class="flex items-center space-x-2">
                    <input 
                      type="checkbox"
                      :value="item.fnb_id"
                      v-model="selectedFnBItems"
                      @change="handleFnBSelection(item.fnb_id)"
                    >
                    <span>{{ item.name }} - Rp {{ item.price }}</span>
                  </label>
                  <input 
                    v-if="selectedFnBItems.includes(item.fnb_id)"
                    v-model="fnbQuantities[item.fnb_id]"
                    type="number"
                    min="1"
                    class="shadow appearance-none border rounded w-20 py-1 px-2 text-gray-700"
                    placeholder="Qty"
                  >
                </div>
              </div>
            </div>
            <button 
              type="submit"
              class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Create Menu Package
            </button>
          </form>
        </div>

        <div class="bg-white rounded-lg shadow">
          <div class="p-6">
            <h2 class="text-2xl font-bold mb-4">Menu Packages</h2>
            <div class="grid gap-6 md:grid-cols-2">
              <div v-for="menu in menus" :key="menu.menu_id" class="border rounded-lg p-4">
                <h3 class="text-xl font-bold">{{ menu.name }}</h3>
                <p class="text-gray-600">Rp {{ menu.price }}</p>
                <div class="mt-2">
                  <span 
                    v-if="menu.is_vegetarian" 
                    class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm"
                  >
                    Vegetarian
                  </span>
                </div>
                <div class="mt-4">
                  <h4 class="font-bold text-sm text-gray-600">Included Items:</h4>
                  <ul class="list-disc list-inside">
                    <li v-for="fnb in menu.fnbs" :key="fnb.fnb_id">
                      {{ fnb.name }} (x{{ fnb.quantity }})
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Order Management -->
      <div v-if="currentTab === 'Orders'" class="space-y-6">
        <div class="bg-white rounded-lg shadow">
          <div class="p-6">
            <h2 class="text-2xl font-bold mb-4">Order History</h2>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer ID</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr v-for="order in orders" :key="order.order_id">
                    <td class="px-6 py-4 whitespace-nowrap">#{{ order.order_id }}</td>
                    <td class="px-6 py-4 whitespace-nowrap">{{ order.customer_id }}</td>
                    <td class="px-6 py-4 whitespace-nowrap">{{ order.address }}</td>
                  <td class="px-6 py-4">
                    <ul class="list-disc list-inside">
                      <li v-for="(item, index) in order.items" :key="index">
                        {{ item.name }} (x{{ item.quantity }})
                      </li>
                    </ul>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">Rp {{ order.total_amount }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span 
                      :class="{
                        'px-2 py-1 rounded text-sm': true,
                        'bg-yellow-100 text-yellow-800': order.status === 'PENDING',
                        'bg-blue-100 text-blue-800': order.status === 'PREPARING',
                        'bg-purple-100 text-purple-800': ['DELIVERING', 'READY'].includes(order.status),
                        'bg-green-100 text-green-800': ['FINISHED', 'PICKED UP'].includes(order.status)
                      }"
                    >
                      {{ order.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {{ new Date(order.order_date).toLocaleString() }}
                  </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Delivery Management -->
    <div v-if="currentTab === 'Delivery'" class="space-y-6">
    <div class="bg-white rounded-lg shadow">
        <div class="p-6">
        <h2 class="text-2xl font-bold mb-4">Delivery Management</h2>
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
            <thead>
                <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Info</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
                <tr v-for="delivery in deliveries" :key="delivery.delivery_id">
                <td class="px-6 py-4 whitespace-nowrap">#{{ delivery.delivery_id }}</td>
                <td class="px-6 py-4">
                    <div class="space-y-1">
                    <p class="font-medium">Order #{{ delivery.order_id }}</p>
                    <p class="text-sm text-gray-500">{{ delivery.customer_name }}</p>
                    <p class="text-sm text-gray-500">{{ delivery.address }}</p>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span 
                    :class="{
                        'px-2 py-1 rounded text-sm': true,
                        'bg-yellow-100 text-yellow-800': delivery.status === 'PENDING',
                        'bg-blue-100 text-blue-800': delivery.status === 'PREPARING',
                        'bg-purple-100 text-purple-800': ['DELIVERING', 'READY'].includes(delivery.status),
                        'bg-green-100 text-green-800': ['FINISHED', 'PICKED UP'].includes(delivery.status)
                    }"
                    >
                    {{ delivery.status }}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <select 
                    :value="delivery.status"
                    @change="updateDeliveryStatus(delivery.order_id, $event.target.value)"
                    class="shadow border rounded py-1 px-2 text-gray-700"
                    >
                    <option 
                        v-for="status in getAvailableStatuses(delivery.address)" 
                        :key="status" 
                        :value="status"
                    >
                        {{ status }}
                    </option>
                    </select>
                </td>
                </tr>
            </tbody>
            </table>
        </div>
        </div>
    </div>
    </div>
    <!-- Reviews Tab -->
    <div v-if="currentTab === 'Reviews'" class="space-y-6">
          <div class="bg-white rounded-lg shadow">
            <div class="p-6">
              <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold">Customer Reviews</h2>
                <div class="flex items-center space-x-4">
                  <select 
                    v-model="reviewsFilter"
                    class="shadow border rounded py-2 px-3 text-gray-700"
                  >
                    <option value="all">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>
              </div>

              <!-- Reviews Summary -->
              <div class="bg-gray-50 p-4 rounded-lg mb-6">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div class="text-center">
                    <div class="text-2xl font-bold">{{ averageRating.toFixed(1) }}</div>
                    <div class="text-yellow-400 text-xl">
                      <span v-for="i in 5" :key="i">
                        {{ i <= Math.round(averageRating) ? '★' : '☆' }}
                      </span>
                    </div>
                    <div class="text-sm text-gray-600">Average Rating</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold">{{ reviews.length }}</div>
                    <div class="text-sm text-gray-600">Total Reviews</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold text-green-600">
                      {{ ((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100).toFixed(1) }}%
                    </div>
                    <div class="text-sm text-gray-600">Positive Reviews</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold">{{ latestReviewDate }}</div>
                    <div class="text-sm text-gray-600">Latest Review</div>
                  </div>
                </div>
              </div>

              <!-- Reviews Table -->
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="review in filteredReviews" :key="review.review_id">
                      <td class="px-6 py-4 whitespace-nowrap">#{{ review.order_id }}</td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center text-yellow-400">
                          <span v-for="i in 5" :key="i">
                            {{ i <= review.rating ? '★' : '☆' }}
                          </span>
                        </div>
                      </td>
                      <td class="px-6 py-4">{{ review.comment }}</td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        {{ formatDate(review.created_at) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>

<script>
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export default {
  data() {
    return {
      currentTab: 'FnB',
      tabs: ['FnB', 'Menu', 'Orders', 'Delivery', 'Reviews'],
      
      // FnB data
      fnbItems: [],
      fnbForm: {
        name: '',
        type: 'food',
        price: ''
      },
      
      // Menu data
      menus: [],
      selectedFnBItems: [],
      fnbQuantities: {},
      menuForm: {
        name: '',
        is_vegetarian: false,
        price: '',
        fnb_items: []
      },
      
    // Order data
    orders: [],

      // Delivery data
      deliveries: [],
      deliveryStatuses: ['PENDING', 'PREPARING', 'DELIVERING', 'FINISHED'],
      pickupStatuses: ['PENDING', 'PREPARING', 'READY', 'PICKED UP'],

      reviews: [],
      reviewsFilter: 'all',
      selectedOrder: null,
      showOrderModal: false,
    };
  },

  async created() {
    await this.fetchFnB();
    await this.fetchMenus();
    await this.fetchOrders();
    await this.fetchDeliveries();
    await this.fetchReviews();
  },

  computed: {
    filteredReviews() {
      if (this.reviewsFilter === 'all') {
        return this.reviews;
      }
      return this.reviews.filter(review => 
        review.rating === parseInt(this.reviewsFilter)
      );
    },

    averageRating() {
      if (this.reviews.length === 0) return 0;
      const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
      return sum / this.reviews.length;
    },

    latestReviewDate() {
      if (this.reviews.length === 0) return 'No reviews yet';
      const latest = new Date(Math.max(...this.reviews.map(r => new Date(r.created_at))));
      return this.formatDate(latest);
    }
  },

  methods: {
    // Add logout method
    async handleLogout() {
      try {
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        
        // Redirect to login page
        this.$router.push('/');
      } catch (error) {
        console.error('Error during logout:', error);
      }
    },
    
    // FnB methods
    async fetchFnB() {
      try {
        const response = await axios.get(`${API_URL}/fnb`);
        this.fnbItems = response.data;
      } catch (error) {
        console.error('Error fetching FnB:', error);
      }
    },

    async saveFnB() {
      try {
        await axios.post(`${API_URL}/fnb`, this.fnbForm);
        await this.fetchFnB();
        this.fnbForm = { name: '', type: 'food', price: '' };
      } catch (error) {
        console.error('Error saving FnB:', error);
      }
    },

    // Menu methods
    async fetchMenus() {
      try {
        const response = await axios.get(`${API_URL}/menu`);
        this.menus = response.data;
      } catch (error) {
        console.error('Error fetching menus:', error);
      }
    },

    handleFnBSelection(fnbId) {
      if (this.selectedFnBItems.includes(fnbId)) {
        this.fnbQuantities[fnbId] = 1;
      } else {
        delete this.fnbQuantities[fnbId];
      }
    },

    async saveMenu() {
      try {
        const fnb_items = this.selectedFnBItems.map(fnbId => ({
          fnb_id: fnbId,
          quantity: parseInt(this.fnbQuantities[fnbId] || 1)
        }));

        const menuData = {
          name: this.menuForm.name,
          is_vegetarian: this.menuForm.is_vegetarian,
          price: parseInt(this.menuForm.price),
          fnb_items: fnb_items
        };

        await axios.post(`${API_URL}/menu`, menuData);
        await this.fetchMenus();
        
        // Reset form and selections
        this.menuForm = {
          name: '',
          is_vegetarian: false,
          price: '',
        };
        this.selectedFnBItems = [];
        this.fnbQuantities = {};
      } catch (error) {
        console.error('Error saving menu:', error);
      }
    },

    async fetchOrders() {
      try {
        // Get the JWT token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          this.$router.push('/login');
          return;
        }

        const response = await axios.get(`${API_URL}/orders`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        this.orders = response.data;
      } catch (error) {
        console.error('Error fetching orders:', error);
        if (error.response && error.response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          this.$router.push('/login');
        }
      }
    },

    async fetchDeliveries() {
      try {
          const response = await axios.get(`${API_URL}/delivery`);
          this.deliveries = response.data;
      } catch (error) {
          console.error('Error fetching deliveries:', error);
      }
    },

    getAvailableStatuses(address) {
            return address === 'PICKUP' ? this.pickupStatuses : this.deliveryStatuses;
    },

    async updateDeliveryStatus(orderId, status) {
      try {
          await axios.put(`${API_URL}/delivery/${orderId}`, { status });
          await this.fetchDeliveries();
          await this.fetchOrders(); // Refresh orders too since status is updated
      } catch (error) {
          console.error('Error updating delivery status:', error);
      }
    },

    async fetchReviews() {
      try {
        const response = await axios.get(`${API_URL}/reviews`);
        this.reviews = response.data;
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }
};
</script>