<template>
    <div class="bg-gray-100 font-sans leading-normal tracking-normal">
      <!-- Navigation -->
      <nav class="bg-gray-900 p-4 mt-0 w-full">
        <div class="container mx-auto flex items-center">
          <div class="flex text-white font-extrabold">
            <a class="flex text-white text-base no-underline hover:text-white hover:no-underline" href="#">
              <span class="hidden w-0 md:w-auto md:block pl-1">Catering Management</span>
            </a>
          </div>
          <div class="flex pl-4 text-sm">
            <ul class="list-reset flex justify-between flex-1 md:flex-none items-center">
              <li class="mr-2">
                <a class="inline-block py-2 px-2 text-white no-underline" href="#">Active</a>
              </li>
              <li class="mr-2">
                <a class="inline-block text-gray-400 no-underline hover:text-gray-200 hover:underline py-2 px-2" href="#">link</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
  
      <!-- Content -->
      <div class="container mx-auto px-4 py-8">
        <slot></slot>
      </div>
  
      <!-- Footer -->
      <footer class="bg-gray-900">
        <div class="container mx-auto px-8">
          <div class="w-full flex flex-col md:flex-row py-6">
            <div class="flex-1">
              <p class="uppercase text-gray-500 md:mb-6">Links</p>
              <ul class="list-reset mb-6">
                <li class="mt-2 inline-block mr-2 md:block md:mr-0">
                  <a href="#" class="text-gray-400 hover:text-gray-200">FAQ</a>
                </li>
                <li class="mt-2 inline-block mr-2 md:block md:mr-0">
                  <a href="#" class="text-gray-400 hover:text-gray-200">Help</a>
                </li>
                <li class="mt-2 inline-block mr-2 md:block md:mr-0">
                  <a href="#" class="text-gray-400 hover:text-gray-200">Support</a>
                </li>
              </ul>
            </div>
            <div class="flex-1">
              <p class="uppercase text-gray-500 md:mb-6">Legal</p>
              <ul class="list-reset mb-6">
                <li class="mt-2 inline-block mr-2 md:block md:mr-0">
                  <a href="#" class="text-gray-400 hover:text-gray-200">Terms</a>
                </li>
                <li class="mt-2 inline-block mr-2 md:block md:mr-0">
                  <a href="#" class="text-gray-400 hover:text-gray-200">Privacy</a>
                </li>
              </ul>
            </div>
            <div class="flex-1">
              <p class="uppercase text-gray-500 md:mb-6">Company</p>
              <ul class="list-reset mb-6">
                <li class="mt-2 inline-block mr-2 md:block md:mr-0">
                  <a href="#" class="text-gray-400 hover:text-gray-200">About Us</a>
                </li>
                <li class="mt-2 inline-block mr-2 md:block md:mr-0">
                  <a href="#" class="text-gray-400 hover:text-gray-200">Contact</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  </template>
  
  <script>
  export default {
    name: 'Layout'
  }
  </script>