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
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-bold mb-4">Create Order</h2>
          <form @submit.prevent="saveOrder" class="space-y-4">
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-2">Customer ID:</label>
              <input 
                v-model="orderForm.customer_id"
                type="number"
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                required
              >
            </div>
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
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-2">Select Menu Items:</label>
              <div class="space-y-4">
                <div v-for="menu in menus" :key="menu.menu_id" class="flex items-center justify-between p-2">
                  <label class="flex items-center space-x-2">
                    <input 
                      type="checkbox"
                      :value="menu.menu_id"
                      v-model="selectedMenus"
                    >
                    <span>{{ menu.name }} - Rp {{ menu.price }}</span>
                  </label>
                  <input 
                    v-if="selectedMenus.includes(menu.menu_id)"
                    v-model="menuQuantities[menu.menu_id]"
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
              Create Order
            </button>
          </form>
        </div>

        <!-- New Order History Section -->
        <div class="bg-white rounded-lg shadow">
          <div class="p-6">
            <h2 class="text-2xl font-bold mb-4">Order History</h2>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer ID</th>
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
  </div>
</template>

<script>
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export default {
  data() {
    return {
      currentTab: 'FnB',
      tabs: ['FnB', 'Menu', 'Orders'],
      
      // FnB data
      fnbItems: [],
      fnbForm: {
        name: '',
        type: 'food',
        price: ''
      },
      
      // Menu data
      menus: [],
      selectedFnBItems: [], // New: Track selected FnB items
      fnbQuantities: {},    // New: Track quantities for each FnB item
      menuForm: {
        name: '',
        is_vegetarian: false,
        price: '',
        fnb_items: []      // Changed: Now includes quantities
      },
      
      // Order data
      orders: [],          // New: Store order history
      selectedMenus: [],
      menuQuantities: {},
      orderForm: {
        customer_id: '',
        delivery_option: 'delivery'
      }
    };
  },

  async created() {
    await this.fetchFnB();
    await this.fetchMenus();
    await this.fetchOrders();
  },

  methods: {
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

    // Add this method to handle FnB selection
    handleFnBSelection(fnbId) {
      if (this.selectedFnBItems.includes(fnbId)) {
        // When item is selected, initialize its quantity to 1
        this.fnbQuantities[fnbId] = 1;
      } else {
        // When item is deselected, remove its quantity
        delete this.fnbQuantities[fnbId];
      }
    },

    async saveMenu() {
      try {
        // Format the fnb_items array with selected items and their quantities
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

    // Add this new method to fetch orders
    async fetchOrders() {
      try {
        const response = await axios.get(`${API_URL}/orders`);
        this.orders = response.data;
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    },

    // Update the saveOrder method
    async saveOrder() {
      try {
        const menuItems = this.selectedMenus.map(menuId => ({
          menu_id: menuId,
          quantity: parseInt(this.menuQuantities[menuId] || 1)
        }));

        await axios.post(`${API_URL}/orders`, {
          customer_id: parseInt(this.orderForm.customer_id),
          delivery_option: this.orderForm.delivery_option,
          menu_items: menuItems
        });

        // Fetch updated orders
        await this.fetchOrders();

        // Reset form
        this.selectedMenus = [];
        this.menuQuantities = {};
        this.orderForm = {
          customer_id: '',
          delivery_option: 'delivery'
        };
      } catch (error) {
        console.error('Error saving order:', error);
      }
    }
  }
};
</script>