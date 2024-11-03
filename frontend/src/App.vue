<template>
  <Layout>
    <div class="max-w-4xl mx-auto">
      <!-- Create/Edit Form -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          {{ editingItem ? 'Edit Item' : 'Create New Item' }}
        </h2>
        <form @submit.prevent="saveItem">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">Name:</label>
            <input 
              v-model="form.name" 
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">Description:</label>
            <textarea 
              v-model="form.description" 
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            ></textarea>
          </div>
          <div class="flex gap-2">
            <button 
              type="submit"
              class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              {{ editingItem ? 'Update' : 'Create' }}
            </button>
            <button 
              v-if="editingItem"
              @click="cancelEdit"
              type="button"
              class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <!-- Items List -->
      <div class="space-y-4">
        <div v-for="item in items" :key="item.id" class="bg-white rounded-lg shadow-lg p-6">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-xl font-bold text-gray-800 mb-2">{{ item.name }}</h3>
              <p class="text-gray-600">{{ item.description }}</p>
            </div>
            <div class="flex gap-2">
              <button 
                @click="editItem(item)"
                class="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 rounded"
              >
                Edit
              </button>
              <button 
                @click="deleteItem(item.id)"
                class="text-red-500 hover:text-red-700 font-bold py-1 px-2 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script>
import axios from 'axios';
import Layout from './components/Layout.vue';

const API_URL = 'http://localhost:3000/api';

export default {
  components: {
    Layout
  },
  data() {
    return {
      items: [],
      form: {
        name: '',
        description: ''
      },
      editingItem: null
    };
  },
  
  async created() {
    await this.fetchItems();
  },
  
  methods: {
    async fetchItems() {
      try {
        const response = await axios.get(`${API_URL}/items`);
        this.items = response.data;
      } catch (error) {
        console.error('Error fetching items:', error);
      }
    },
    
    async saveItem() {
      try {
        if (this.editingItem) {
          await axios.put(`${API_URL}/items/${this.editingItem.id}`, this.form);
        } else {
          await axios.post(`${API_URL}/items`, this.form);
        }
        await this.fetchItems();
        this.resetForm();
      } catch (error) {
        console.error('Error saving item:', error);
      }
    },
    
    async deleteItem(id) {
      if (!confirm('Are you sure you want to delete this item?')) return;
      
      try {
        await axios.delete(`${API_URL}/items/${id}`);
        await this.fetchItems();
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    },
    
    editItem(item) {
      this.editingItem = item;
      this.form = {
        name: item.name,
        description: item.description
      };
    },
    
    cancelEdit() {
      this.resetForm();
    },
    
    resetForm() {
      this.form = {
        name: '',
        description: ''
      };
      this.editingItem = null;
    }
  }
};
</script>