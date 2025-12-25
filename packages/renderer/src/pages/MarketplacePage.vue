<template>
  <div class="space-y-6">
    <!-- 初始化加载提示 -->
    <div v-if="store.isInitializing" class="flex items-center justify-center py-16">
      <div class="flex flex-col items-center space-y-6">
        <!-- 动画图标 -->
        <div class="relative">
          <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </div>
          <!-- 扫描动画环 -->
          <div class="absolute inset-0 rounded-xl border-2 border-emerald-400 animate-ping opacity-30"></div>
        </div>
        
        <!-- 文字提示 -->
        <div class="text-center space-y-2">
          <p class="text-base font-semibold text-zinc-700 dark:text-zinc-200">正在加载软件列表</p>
          <p class="text-sm text-zinc-500 dark:text-zinc-400">获取软件包安装状态...</p>
        </div>
        
        <!-- 进度指示器 -->
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style="animation-delay: 0ms;"></div>
          <div class="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style="animation-delay: 150ms;"></div>
          <div class="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style="animation-delay: 300ms;"></div>
        </div>
      </div>
    </div>

    <template v-else>
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <select
            v-model="selectedCategory"
            class="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
          >
            <option value="all">全部类别</option>
            <option value="language">编程语言</option>
            <option value="database">数据库</option>
            <option value="ide">开发工具</option>
            <option value="tool">实用工具</option>
            <option value="cask">应用软件</option>
          </select>
        </div>
        <div class="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
          <span>已安装: {{ installedCount }}</span>
          <span>/</span>
          <span>总计: {{ filteredPackages.length }}</span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="pkg in filteredPackages"
          :key="pkg.name"
          class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-lg transition-all"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div
                :class="[
                  'p-3 rounded-xl',
                  getCategoryColor(pkg.category)
                ]"
              >
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getCategoryIcon(pkg.category)" />
                </svg>
              </div>
              <div>
                <h4 class="font-bold text-zinc-900 dark:text-zinc-100">{{ pkg.name }}</h4>
                <span
                  :class="[
                    'text-xs px-2 py-1 rounded-md font-semibold',
                    getCategoryBadgeColor(pkg.category)
                  ]"
                >
                  {{ getCategoryLabel(pkg.category) }}
                </span>
              </div>
            </div>
            <div
              :class="[
                'w-3 h-3 rounded-full',
                store.statuses[pkg.name] === 'installed' ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'
              ]"
            />
          </div>

          <p class="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">{{ pkg.description }}</p>

          <!-- 进度条 -->
          <div v-if="store.installProgress[pkg.name]" class="mb-4">
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs text-zinc-500">{{ store.installProgress[pkg.name].message }}</span>
              <div class="flex items-center space-x-2">
                <span v-if="store.installProgress[pkg.name].progress !== undefined" class="text-xs text-zinc-500">
                  {{ store.installProgress[pkg.name].progress }}%
                </span>
                <!-- 取消按钮 -->
                <button
                  @click="handleCancel(pkg.name)"
                  class="text-xs text-red-500 hover:text-red-600 font-medium"
                  title="取消"
                >
                  取消
                </button>
              </div>
            </div>
            <ProgressBar 
              :status="store.installProgress[pkg.name].status" 
              :progress="store.installProgress[pkg.name].progress || 0"
              :is-indeterminate="store.installProgress[pkg.name].status === 'downloading' && store.installProgress[pkg.name].progress === undefined"
            />
          </div>

          <div class="flex items-center justify-between">
            <span v-if="store.versions[pkg.name]" class="text-xs text-zinc-500 dark:text-zinc-500">
              {{ store.versions[pkg.name] }}
            </span>
            <div class="flex-1"></div>
            <button
              v-if="store.statuses[pkg.name] !== 'installed' && store.statuses[pkg.name] !== 'uninstalling'"
              @click="handleInstall(pkg.name)"
              :disabled="!store.isInitialized || store.statuses[pkg.name] === 'processing'"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-all"
            >
              {{ store.statuses[pkg.name] === 'processing' ? '安装中...' : '安装' }}
            </button>
            <button
              v-else-if="store.statuses[pkg.name] === 'installed' || store.statuses[pkg.name] === 'uninstalling'"
              @click="handleUninstall(pkg.name)"
              :disabled="!store.isInitialized || store.statuses[pkg.name] === 'uninstalling'"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-all"
            >
              {{ store.statuses[pkg.name] === 'uninstalling' ? '卸载中...' : '卸载' }}
            </button>
          </div>

          <!-- 错误 Banner -->
          <div 
            v-if="store.errors[pkg.name]" 
            class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-start space-x-2">
                <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p class="text-sm text-red-600 dark:text-red-400 font-medium">安装失败</p>
                  <p class="text-xs text-red-500 dark:text-red-400 mt-1">{{ store.errors[pkg.name].message }}</p>
                </div>
              </div>
              <button 
                @click="handleClearError(pkg.name)"
                class="text-red-400 hover:text-red-600"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div v-if="store.errors[pkg.name].retryable" class="mt-2">
              <button
                @click="handleInstall(pkg.name); handleClearError(pkg.name);"
                class="text-xs px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-medium"
              >
                重试
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="filteredPackages.length === 0" class="flex flex-col items-center justify-center py-16 text-zinc-500 dark:text-zinc-400">
        <div class="relative mb-6">
          <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center">
            <svg class="w-10 h-10 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
        </div>
        <p class="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">暂无相关工具</p>
        <p class="text-sm text-zinc-500 dark:text-zinc-400">当前分类下没有可用的软件包</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '../store/app';
import ProgressBar from '../components/ProgressBar.vue';
import type { AppPackage } from '../../../main/types';

const store = useAppStore();

const selectedCategory = ref('all');

const filteredPackages = computed(() => {
  if (selectedCategory.value === 'all') {
    return store.marketplace;
  }
  return store.marketplace.filter((p: AppPackage) => p.category === selectedCategory.value);
});

const installedCount = computed(() => {
  return filteredPackages.value.filter((p: AppPackage) => store.statuses[p.name] === 'installed').length;
});

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    language: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    database: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    ide: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    tool: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    cask: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
  };
  return colors[category] || 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400';
}

function getCategoryBadgeColor(category: string): string {
  const colors: Record<string, string> = {
    language: 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200',
    database: 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200',
    ide: 'bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200',
    tool: 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200',
    cask: 'bg-pink-200 dark:bg-pink-800 text-pink-800 dark:text-pink-200'
  };
  return colors[category] || 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200';
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    language: '编程语言',
    database: '数据库',
    ide: '开发工具',
    tool: '实用工具',
    cask: '应用软件'
  };
  return labels[category] || category;
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    language: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    database: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
    ide: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    tool: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    cask: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
  };
  return icons[category] || 'M4 6h16M4 12h16M4 18h16';
}

async function handleInstall(name: string) {
  await store.installPackage(name);
}

async function handleUninstall(name: string) {
  await store.uninstallPackage(name);
}

async function handleCancel(name: string) {
  await store.cancelInstall(name);
}

function handleClearError(name: string) {
  store.clearError(name);
}
</script>
