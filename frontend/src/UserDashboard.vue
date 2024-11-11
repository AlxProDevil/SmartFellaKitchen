<template>
  <div class="min-h-screen bg-gray-100">
   <!-- Navigation -->
   <nav class="bg-gray-900 p-4">
      <div class="container mx-auto">
        <div class="flex items-center justify-between">
          <h1 class="text-white text-xl font-bold">SmartFella Kitchen</h1>
          <!-- Updated user menu section -->
          <div class="relative">
            <button 
              @click="isDropdownOpen = !isDropdownOpen"
              class="text-white hover:text-gray-200 flex items-center space-x-2 focus:outline-none"
            >
              <span>Welcome, {{ currentUser?.username }}</span>
              <svg 
                class="w-4 h-4 ml-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  stroke-width="2" 
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <!-- Dropdown Menu -->
            <div 
              v-if="isDropdownOpen"
              class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1"
            >
              <button
                @click="handleLogout"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <div class="container mx-auto px-4 py-8">
      <!-- Order Creation -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-2xl font-bold mb-4">Create Order</h2>
        <form @submit.prevent="saveOrder" class="space-y-4">
          <div class="space-y-4">
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-2">Delivery Option:</label>
              <select 
                v-model="orderForm.delivery_option"
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                required
              >
                <option value="delivery">Delivery</option>
                <option value="pickup">Pickup</option>
              </select>
            </div>
            <div v-if="orderForm.delivery_option === 'delivery'">
              <label class="block text-gray-700 text-sm font-bold mb-2">Delivery Address:</label>
              <input 
                v-model="orderForm.address"
                type="text"
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                placeholder="Enter your delivery address"
                required
              >
            </div>
          </div>

          <!-- Menu Packages Section -->
          <div class="space-y-4">
            <h3 class="text-xl font-bold">Menu Packages</h3>
            <div class="grid gap-4 md:grid-cols-2">
              <div v-for="menu in menus" :key="menu.menu_id" 
                class="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="text-lg font-bold">{{ menu.name }}</h4>
                    <p class="text-gray-600">Rp {{ menu.price }}</p>
                    <div class="mt-2">
                      <span v-if="menu.is_vegetarian" 
                        class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                        Vegetarian
                      </span>
                    </div>
                    <div class="mt-2">
                      <h5 class="font-bold text-sm text-gray-600">Included Items:</h5>
                      <ul class="list-disc list-inside">
                        <li v-for="fnb in menu.fnbs" :key="fnb.fnb_id">
                          {{ fnb.name }} (x{{ fnb.quantity }})
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div class="flex flex-col items-end space-y-2">
                    <label class="flex items-center space-x-2">
                      <input 
                        type="checkbox"
                        :value="menu.menu_id"
                        v-model="selectedMenus"
                        class="h-5 w-5"
                      >
                      <span class="text-sm font-medium">Select</span>
                    </label>
                    <input 
                      v-if="selectedMenus.includes(menu.menu_id)"
                      v-model="menuQuantities[menu.menu_id]"
                      type="number"
                      min="1"
                      class="shadow appearance-none border rounded w-20 py-1 px-2 text-gray-700 mt-2"
                      placeholder="Qty"
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Individual Items Section -->
          <div class="space-y-4">
            <h3 class="text-xl font-bold">Individual Items</h3>
            <div class="grid gap-4 md:grid-cols-3">
              <div v-for="item in fnbItems" :key="item.fnb_id" 
                class="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="text-lg font-bold">{{ item.name }}</h4>
                    <p class="text-gray-600">Rp {{ item.price }}</p>
                    <p class="text-sm text-gray-500 capitalize">{{ item.type }}</p>
                  </div>
                  <div class="flex flex-col items-end space-y-2">
                    <input 
                      type="checkbox"
                      :value="item.fnb_id"
                      v-model="selectedFnBItems"
                      class="h-5 w-5"
                    >
                    <input 
                      v-if="selectedFnBItems.includes(item.fnb_id)"
                      v-model="fnbQuantities[item.fnb_id]"
                      type="number"
                      min="1"
                      class="shadow appearance-none border rounded w-20 py-1 px-2 text-gray-700 mt-2"
                      placeholder="Qty"
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
          >
            Place Order
          </button>
        </form>
      </div>

      <!-- Order History -->
      <div class="bg-white rounded-lg shadow">
        <div class="p-6">
          <h2 class="text-2xl font-bold mb-4">Order History</h2>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <!-- Replace the existing table body with this -->
              <tbody class="divide-y divide-gray-200">
                <tr v-for="order in filteredOrders" :key="order.order_id">
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
                  <td class="px-6 py-4 whitespace-nowrap">
                    <button
                      v-if="['FINISHED', 'PICKED UP'].includes(order.status) || order.hasReview"
                      @click="handleReviewClick(order)"
                      :class="{
                        'px-4 py-2 rounded font-bold': true,
                        'bg-yellow-500 hover:bg-yellow-600 text-white': !order.hasReview,
                        'bg-green-500 hover:bg-green-600 text-white': order.hasReview
                      }"
                    >
                      {{ order.hasReview ? 'See Review' : 'Review Now' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <!-- Review Modal -->
    <div v-if="showReviewModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-xl font-bold mb-4">
          {{ selectedOrderReview ? 'Review Details' : 'Submit Review' }}
        </h3>
        
        <div v-if="selectedOrderReview">
          <!-- View existing review -->
          <div class="mb-4">
            <div class="flex items-center mb-2">
              <span class="text-yellow-400 text-xl">
                {{ '★'.repeat(selectedOrderReview.rating) }}{{ '☆'.repeat(5 - selectedOrderReview.rating) }}
              </span>
            </div>
            <p class="text-gray-700">{{ selectedOrderReview.comment }}</p>
          </div>
        </div>
        <div v-else>
          <!-- Create new review -->
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">Rating:</label>
            <div class="flex items-center">
              <button 
                v-for="i in 5" 
                :key="i"
                @click="newReview.rating = i"
                class="text-2xl focus:outline-none"
                :class="i <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'"
              >
                ★
              </button>
            </div>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">Comment:</label>
            <textarea
              v-model="newReview.comment"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              rows="4"
            ></textarea>
          </div>
          <button 
            @click="submitReview"
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
          >
            Submit Review
          </button>
        </div>
        
        <button 
          @click="closeReviewModal"
          class="mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded w-full"
        >
          Close
        </button>
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
      isDropdownOpen: false,
      currentUser: null,

      // FnB and Menu data
      fnbItems: [],
      menus: [],
      
      // Order form data
      selectedFnBItems: [],
      fnbQuantities: {},
      selectedMenus: [],
      menuQuantities: {},
      orderForm: {
        delivery_option: 'delivery',
        address: ''
      },
      
      // Order history
      orders: [],

      currentView: 'orders',
      reviews: [],
      showReviewModal: false,
      selectedOrder: null,
      selectedOrderReview: null,
      newReview: {
        rating: 0,
        comment: ''
      }
    };
  },

  // Add click outside directive to close dropdown when clicking outside
  mounted() {
    document.addEventListener('click', this.closeDropdown);
  },

  beforeDestroy() {
    document.removeEventListener('click', this.closeDropdown);
  },

  computed: {
    filteredOrders() {
      // This is now redundant since the server filters the orders,
      // but we'll keep it as an extra safety measure
      return this.orders.filter(order => order.customer_id === this.currentUser.userId);
    }
  },

  async created() {
    // Load user data from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    } else {
      // Redirect to login if no user data found
      this.$router.push('/login');
      return;
    }
    
    await this.fetchFnB();
    await this.fetchMenus();
    await this.fetchOrders();
    await this.fetchReviews();
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

    async fetchFnB() {
      try {
        const response = await axios.get(`${API_URL}/fnb`);
        this.fnbItems = response.data;
      } catch (error) {
        console.error('Error fetching FnB:', error);
      }
    },

    async fetchMenus() {
      try {
        const response = await axios.get(`${API_URL}/menu`);
        this.menus = response.data;
      } catch (error) {
        console.error('Error fetching menus:', error);
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

    async saveOrder() {
      try {
        // Prepare menu items (from menu packages)
        const menuItems = this.selectedMenus.map(menuId => ({
          menu_id: menuId,
          quantity: parseInt(this.menuQuantities[menuId] || 1)
        }));

        // Prepare individual FnB items
        const fnbItems = this.selectedFnBItems.map(fnbId => ({
          fnb_id: fnbId,
          quantity: parseInt(this.fnbQuantities[fnbId] || 1)
        }));

        const orderData = {
          customer_id: this.currentUser.userId,
          delivery_option: this.orderForm.delivery_option,
          address: this.orderForm.delivery_option === 'pickup' ? 'PICKUP' : this.orderForm.address,
          menu_items: menuItems,
          fnb_items: fnbItems
        };

        await axios.post(`${API_URL}/orders`, orderData);
        await this.fetchOrders();

        // Reset form
        this.selectedMenus = [];
        this.menuQuantities = {};
        this.selectedFnBItems = [];
        this.fnbQuantities = {};
        this.orderForm = {
          delivery_option: 'delivery',
          address: ''
        };
      } catch (error) {
        console.error('Error saving order:', error);
      }
    },

    async fetchReviews() {
      try {
        const response = await axios.get(`${API_URL}/reviews`);
        this.reviews = response.data;
        
        // Update orders with review status
        this.orders = this.orders.map(order => ({
          ...order,
          hasReview: this.reviews.some(review => review.order_id === order.order_id)
        }));
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    },

    async handleReviewClick(order) {
      this.selectedOrder = order;
      if (order.hasReview) {
        try {
          const response = await axios.get(`${API_URL}/reviews/${order.order_id}`);
          this.selectedOrderReview = response.data;
        } catch (error) {
          console.error('Error fetching review:', error);
        }
      } else {
        this.selectedOrderReview = null;
        this.newReview = {
          rating: 0,
          comment: ''
        };
      }
      this.showReviewModal = true;
    },

    async submitReview() {
      try {
        await axios.post(`${API_URL}/reviews`, {
          order_id: this.selectedOrder.order_id,
          rating: this.newReview.rating,
          comment: this.newReview.comment
        });
        await this.fetchReviews();
        this.closeReviewModal();
      } catch (error) {
        console.error('Error submitting review:', error);
      }
    },

    closeReviewModal() {
      this.showReviewModal = false;
      this.selectedOrder = null;
      this.selectedOrderReview = null;
      this.newReview = {
        rating: 0,
        comment: ''
      };
    }
  }
};
</script>