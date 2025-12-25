<template>
  <div class="space-y-6">
    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
      <div class="flex items-center space-x-4">
        <div class="flex-1 relative group">
          <input
            ref="searchInputRef"
            v-model="searchKeyword"
            @input="handleSearchInput"
            @keydown.enter="performSearchNow"
            type="text"
            placeholder="搜索 Homebrew 包..."
            class="w-full px-4 py-3 pl-12 pr-10 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/20 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 transition-all duration-300"
          />
          <svg class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <!-- 清除按钮 -->
          <button
            v-if="searchKeyword"
            @click="clearSearch"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
          >
            <svg class="w-4 h-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <button
          @click="searchType = 'formula'"
          :class="[
            'px-4 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2',
            searchType === 'formula'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'
          ]"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Formula</span>
        </button>
        <button
          @click="searchType = 'cask'"
          :class="[
            'px-4 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2',
            searchType === 'cask'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'
          ]"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>Cask</span>
        </button>
      </div>
      <!-- 镜像源提示 -->
      <div class="mt-3 flex items-center space-x-2 text-xs text-zinc-500 dark:text-zinc-400">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>当前镜像源：<span class="font-medium text-zinc-600 dark:text-zinc-300">{{ store.currentMirrorName }}</span></span>
        <span class="text-zinc-400 dark:text-zinc-500">·</span>
        <span>按 Enter 快速搜索</span>
      </div>
    </div>

    <div v-if="store.isSearching" class="flex items-center justify-center py-16">
      <div class="flex flex-col items-center space-y-6">
        <!-- 搜索动画 -->
        <div class="relative">
          <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg class="w-7 h-7 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div class="absolute inset-0 rounded-xl border-2 border-blue-400 animate-ping opacity-30"></div>
        </div>
        
        <div class="text-center space-y-2">
          <p class="text-base font-semibold text-zinc-700 dark:text-zinc-200">正在搜索</p>
          <p class="text-sm text-zinc-500 dark:text-zinc-400">从 Homebrew 仓库获取结果...</p>
        </div>
        
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style="animation-delay: 0ms;"></div>
          <div class="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style="animation-delay: 150ms;"></div>
          <div class="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style="animation-delay: 300ms;"></div>
        </div>
      </div>
    </div>

    <div v-else-if="store.searchResults.length > 0" class="space-y-3">
      <div
        v-for="pkg in store.searchResults"
        :key="pkg.name"
        class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-lg transition-all"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-2">
              <h4 class="text-lg font-bold text-zinc-900 dark:text-zinc-100">{{ pkg.name }}</h4>
              <span
                :class="[
                  'px-2 py-1 rounded-md text-xs font-semibold',
                  pkg.isCask
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                ]"
              >
                {{ pkg.isCask ? 'Cask' : 'Formula' }}
              </span>
              <span
                v-if="pkg.installed"
                class="px-2 py-1 rounded-md text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
              >
                已安装
              </span>
            </div>
            <p class="text-zinc-600 dark:text-zinc-400 mb-3">{{ pkg.description }}</p>
            
            <!-- 进度条 -->
            <div v-if="store.installProgress[pkg.name]" class="mb-3">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs text-zinc-500">{{ store.installProgress[pkg.name].message }}</span>
                <span v-if="store.installProgress[pkg.name].progress !== undefined" class="text-xs text-zinc-500">
                  {{ store.installProgress[pkg.name].progress }}%
                </span>
              </div>
              <ProgressBar 
                :status="store.installProgress[pkg.name].status" 
                :progress="store.installProgress[pkg.name].progress || 0"
                :is-indeterminate="store.installProgress[pkg.name].status === 'downloading' && store.installProgress[pkg.name].progress === undefined"
              />
            </div>
            
            <div v-if="pkg.version" class="text-sm text-zinc-500 dark:text-zinc-500">
              版本: {{ pkg.version }}
            </div>
            <div v-if="pkg.installedVersion" class="text-sm text-zinc-500 dark:text-zinc-500">
              已安装版本: {{ pkg.installedVersion }}
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <button
              v-if="!pkg.installed && store.statuses[pkg.name] !== 'uninstalling'"
              @click="handleInstall(pkg.name, pkg.isCask)"
              :disabled="!store.isInitialized || store.statuses[pkg.name] === 'processing'"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all"
            >
              {{ store.statuses[pkg.name] === 'processing' ? '安装中...' : '安装' }}
            </button>
            <button
              v-else
              @click="handleUninstall(pkg.name, pkg.isCask)"
              :disabled="!store.isInitialized || store.statuses[pkg.name] === 'uninstalling'"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all"
            >
              {{ store.statuses[pkg.name] === 'uninstalling' ? '卸载中...' : '卸载' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="searchKeyword" class="flex flex-col items-center justify-center py-16 text-zinc-500 dark:text-zinc-400">
      <div class="relative mb-6">
        <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
          <svg class="w-10 h-10 text-amber-500 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      <p class="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">未找到 "{{ searchKeyword }}"</p>
      <p class="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-md">
        没有找到匹配的软件包，请尝试其他关键词或切换 Formula/Cask 类型
      </p>
    </div>

    <div v-else class="flex flex-col items-center justify-center py-16 text-zinc-500 dark:text-zinc-400">
      <div class="relative mb-6">
        <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center">
          <svg class="w-10 h-10 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      <p class="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">搜索 Homebrew 软件包</p>
      <p class="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-md">
        输入软件名称或关键词，从 Homebrew 仓库中搜索并安装开发工具
      </p>
      <div class="flex items-center space-x-4 mt-6 text-xs text-zinc-400 dark:text-zinc-500">
        <span class="flex items-center space-x-1">
          <span class="w-2 h-2 rounded-full bg-blue-500"></span>
          <span>Formula - 命令行工具</span>
        </span>
        <span class="flex items-center space-x-1">
          <span class="w-2 h-2 rounded-full bg-purple-500"></span>
          <span>Cask - GUI 应用</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAppStore } from '../store/app';
import ProgressBar from '../components/ProgressBar.vue';

const store = useAppStore();

const searchInputRef = ref<HTMLInputElement | null>(null);
const searchKeyword = ref('');
const searchType = ref<'formula' | 'cask'>('formula');
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function handleSearchInput() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    performSearch();
  }, 500);
}

// 立即执行搜索（回车触发）
function performSearchNow() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  performSearch();
}

// 清除搜索
function clearSearch() {
  searchKeyword.value = '';
  store.searchResults = [];
  searchInputRef.value?.focus();
}

async function performSearch() {
  if (!searchKeyword.value.trim()) {
    store.searchResults = [];
    return;
  }

  await store.searchPackages(searchKeyword.value, searchType.value === 'cask');
}

watch(searchType, () => {
  if (searchKeyword.value.trim()) {
    performSearch();
  }
});

async function handleInstall(name: string, isCask: boolean) {
  await store.installPackage(name);
  await performSearch();
}

async function handleUninstall(name: string, isCask: boolean) {
  await store.uninstallPackage(name);
  await performSearch();
}
</script>
