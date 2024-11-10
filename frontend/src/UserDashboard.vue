<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Navigation -->
    <nav class="bg-gray-900 p-4">
      <div class="container mx-auto">
        <div class="flex items-center justify-between">
          <h1 class="text-white text-xl font-bold">SmartFella Kitchen - Customer Portal</h1>
          <div class="text-white">
            Welcome, {{ currentUser?.username }}
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
                    <label class="flex items-center space-x-2">
                      <input 
                        type="checkbox"
                        :value="item.fnb_id"
                        v-model="selectedFnBItems"
                        class="h-5 w-5"
                      >
                      <span class="text-sm font-medium">Select</span>
                    </label>
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

          <div class="pt-4 border-t">
            <button 
              type="submit"
              class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!hasSelectedItems"
            >
              Place Order
            </button>
          </div>
        </form>
      </div>

      <!-- Order History -->
      <div class="bg-white rounded-lg shadow">
        <div class="p-6">
          <h2 class="text-2xl font-bold mb-4">Your Order History</h2>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
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
                  <td class="px-6 py-4 whitespace-nowrap">{{ order.address }}</td>
                  <td class="px-6 py-4">
                    <ul class="list-disc list-inside">
                      <li v-for="(name, index) in order.menu_names" :key="index">
                        {{ name }} (x{{ order.quantities[index] }})
                      </li>
                    </ul>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">Rp {{ order.total_amount }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span 
                      :class="{
                        'px-2 py-1 rounded text-sm': true,
                        'bg-yellow-100 text-yellow-800': order.status === 'PENDING',
                        'bg-green-100 text-green-800': order.status === 'COMPLETED',
                        'bg-red-100 text-red-800': order.status === 'CANCELLED'
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
  </div>
</template>

<script>
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export default {
  data() {
    return {
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
      
      // User data
      currentUser: null
    };
  },

  computed: {
    hasSelectedItems() {
      return this.selectedMenus.length > 0 || this.selectedFnBItems.length > 0;
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
  },

  methods: {
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
    }
  }
};
</script>