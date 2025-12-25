<template>
  <!-- Homebrew Welcome Guard -->
  <HomebrewWelcome v-if="showBrewWelcome" />

  <!-- Main App -->
  <div v-else class="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
    <aside class="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
      <div class="p-6 border-b border-zinc-200 dark:border-zinc-800">
        <div class="flex items-center space-x-3">
          <div class="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h1 class="text-lg font-black tracking-tight">Dev Installer</h1>
            <p class="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Pro Edition</p>
          </div>
        </div>
      </div>

      <nav class="flex-1 p-4 space-y-1">
        <button
          v-for="item in navItems"
          :key="item.id"
          @click="store.setPage(item.id)"
          :class="[
            'w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all',
            store.currentPage === item.id
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          ]"
        >
          <component :is="item.icon" class="w-5 h-5" />
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <div class="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
        <div class="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-4">
          <p class="text-xs text-zinc-500 dark:text-zinc-400 mb-2">系统状态</p>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">{{ store.systemInfo?.installedCount || 0 }} / {{ store.systemInfo?.totalPackages || 0 }}</span>
            <div class="w-24 h-2 bg-zinc-300 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div 
                class="h-full bg-blue-500 rounded-full transition-all"
                :style="{ width: `${((store.systemInfo?.installedCount || 0) / (store.systemInfo?.totalPackages || 1)) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
        <!-- 当前镜像源 -->
        <div class="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-3 border border-orange-100 dark:border-orange-900/30">
          <div class="flex items-center space-x-2">
            <svg class="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
            <div class="flex-1 min-w-0">
              <p class="text-[10px] text-orange-600 dark:text-orange-400 uppercase tracking-wider font-semibold">镜像源</p>
              <p class="text-sm font-bold text-orange-700 dark:text-orange-300 truncate">{{ store.currentMirrorName }}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <main class="flex-1 flex flex-col overflow-hidden">
      <header class="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6">
        <h2 class="text-xl font-bold">{{ currentPageTitle }}</h2>
        <div class="flex items-center space-x-4">
          <button 
            @click="store.refreshStatuses({ force: true })"
            :disabled="store.isRefreshing"
            class="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
            title="刷新状态"
          >
            <svg 
              :class="['w-5 h-5 text-zinc-500', store.isRefreshing && 'animate-spin']" 
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </header>

      <div class="flex-1 overflow-auto p-6">
        <DashboardPage v-if="store.currentPage === 'dashboard'" />
        <MarketplacePage v-else-if="store.currentPage === 'marketplace'" />
        <SearchPage v-else-if="store.currentPage === 'search'" />
        <SettingsPage v-else-if="store.currentPage === 'settings'" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useAppStore } from './store/app';
import DashboardPage from './pages/DashboardPage.vue';
import MarketplacePage from './pages/MarketplacePage.vue';
import SearchPage from './pages/SearchPage.vue';
import SettingsPage from './pages/SettingsPage.vue';
import HomebrewWelcome from './components/HomebrewWelcome.vue';

const store = useAppStore();

// Show Homebrew welcome when not installed and not checking
const showBrewWelcome = computed(() => {
  return !store.isBrewInstalled && !store.isBrewChecking;
});

const navItems = [
  { id: 'dashboard', label: '概览', icon: 'DashboardIcon' },
  { id: 'marketplace', label: '应用商店', icon: 'StoreIcon' },
  { id: 'search', label: '搜索', icon: 'SearchIcon' },
  { id: 'settings', label: '设置', icon: 'SettingsIcon' }
];

const currentPageTitle = computed(() => {
  const item = navItems.find(i => i.id === store.currentPage);
  return item?.label || '';
});

const DashboardIcon = {
  template: `
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  `
};

const StoreIcon = {
  template: `
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  `
};

const SearchIcon = {
  template: `
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  `
};

const SettingsIcon = {
  template: `
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  `
};

onMounted(() => {
  store.init();
});

onUnmounted(() => {
  (window as any).electronAPI.removeListeners();
});
</script>
