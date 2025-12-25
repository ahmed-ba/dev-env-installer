<template>
  <div class="space-y-6">
    <!-- 初始化加载提示 -->
    <div v-if="store.isInitializing" class="flex items-center justify-center py-16">
      <div class="flex flex-col items-center space-y-6">
        <!-- 动画图标 -->
        <div class="relative">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <!-- 扫描动画环 -->
          <div class="absolute inset-0 rounded-2xl border-2 border-blue-400 animate-ping opacity-30"></div>
        </div>
        
        <!-- 文字提示 -->
        <div class="text-center space-y-2">
          <p class="text-lg font-semibold text-zinc-700 dark:text-zinc-200">正在扫描本机环境</p>
          <p class="text-sm text-zinc-500 dark:text-zinc-400">检测已安装的开发工具和软件包...</p>
        </div>
        
        <!-- 进度指示器 -->
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style="animation-delay: 0ms;"></div>
          <div class="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style="animation-delay: 150ms;"></div>
          <div class="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style="animation-delay: 300ms;"></div>
        </div>
      </div>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div class="flex items-center justify-between mb-4">
            <span class="text-zinc-500 dark:text-zinc-400 text-sm">系统平台</span>
            <div class="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p class="text-2xl font-bold">{{ platformLabel }}</p>
          <p class="text-sm text-zinc-500 dark:text-zinc-400">{{ store.systemInfo?.arch }}</p>
        </div>

        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div class="flex items-center justify-between mb-4">
            <span class="text-zinc-500 dark:text-zinc-400 text-sm">Homebrew</span>
            <div class="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg">
              <svg class="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
          </div>
          <p class="text-2xl font-bold">{{ store.systemInfo?.brewVersion || '未安装' }}</p>
          <p class="text-sm text-zinc-500 dark:text-zinc-400">包管理器</p>
        </div>

        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div class="flex items-center justify-between mb-4">
            <span class="text-zinc-500 dark:text-zinc-400 text-sm">已安装</span>
            <div class="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
              <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p class="text-2xl font-bold">{{ store.systemInfo?.installedCount || 0 }}</p>
          <p class="text-sm text-zinc-500 dark:text-zinc-400">个工具</p>
        </div>

        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div class="flex items-center justify-between mb-4">
            <span class="text-zinc-500 dark:text-zinc-400 text-sm">Node.js</span>
            <div class="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
              <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
          </div>
          <p class="text-2xl font-bold">{{ nodeVersion }}</p>
          <p class="text-sm text-zinc-500 dark:text-zinc-400">运行时</p>
        </div>
      </div>

      <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 class="text-lg font-bold mb-4">快速操作</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            @click="handleConfigureAll"
            :disabled="!store.isInitialized"
            class="flex items-center justify-center space-x-2 px-6 py-4 bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-900 dark:hover:bg-zinc-600 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>配置环境变量</span>
          </button>
          
          <button
            @click="store.setPage('marketplace')"
            class="flex items-center justify-center space-x-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span>应用商店</span>
          </button>
        </div>
      </div>

      <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold">已安装工具 ({{ installedPackages.length }})</h3>
          <span class="text-sm text-zinc-500 dark:text-zinc-400">本机检测到的开发工具</span>
        </div>
        <div class="space-y-3 max-h-96 overflow-y-auto">
          <div
            v-for="pkg in installedPackages"
            :key="pkg.name"
            class="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <div class="flex items-center space-x-3">
              <div :class="[
                'p-2 rounded-lg',
                getCategoryColor(pkg.category)
              ]">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p class="font-medium text-zinc-900 dark:text-zinc-100">{{ pkg.name }}</p>
                <p class="text-sm text-zinc-500 dark:text-zinc-400">{{ pkg.description }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <span class="text-xs px-2 py-1 rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                {{ getCategoryLabel(pkg.category) }}
              </span>
              <span class="text-sm font-mono text-emerald-600 dark:text-emerald-400">
                {{ store.versions[pkg.name] || 'installed' }}
              </span>
            </div>
          </div>
          <div v-if="installedPackages.length === 0" class="text-center py-12 text-zinc-500 dark:text-zinc-400">
            <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>暂无已安装的工具</p>
            <p class="text-sm mt-1">前往应用商店安装开发工具</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '../store/app';
import type { AppPackage } from '../../../main/types';

const store = useAppStore();

const platformLabel = computed(() => {
  const platform = store.systemInfo?.platform;
  if (platform === 'darwin') return 'macOS';
  if (platform === 'linux') return 'Linux';
  if (platform === 'win32') return 'Windows';
  return platform || 'Unknown';
});

const nodeVersion = computed(() => {
  const version = store.systemInfo?.nodeVersion;
  if (!version) return '未安装';
  return version.replace('v', '');
});

// 已安装的所有软件包
const installedPackages = computed(() => {
  return store.marketplace.filter((p: AppPackage) => store.statuses[p.name] === 'installed');
});

// 分类颜色
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

// 分类标签
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

async function handleConfigureAll() {
  const result = await store.configureShell('all');
  if (result.success) {
    alert('环境变量配置成功！\n\n请运行以下命令使配置生效：\n' + result.message);
  } else {
    alert('配置失败：' + result.message);
  }
}
</script>
