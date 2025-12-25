<template>
  <div 
    class="relative group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
  >
    <!-- 状态装饰条 (流光效果) -->
    <div 
      v-if="status === 'installing'" 
      class="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl animate-pulse"
    ></div>

    <div class="flex justify-between items-start">
      <div class="space-y-1">
        <h3 class="text-lg font-bold text-zinc-900 dark:text-zinc-100">{{ software.name }}</h3>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 max-w-[200px]">{{ software.description }}</p>
      </div>
      
      <div class="flex flex-col items-end space-y-3">
        <!-- 状态标签 (macOS 样式) -->
        <span 
          :class="[
            'px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
            statusStyles[status]
          ]"
        >
          {{ statusLabels[status] }}
        </span>

        <!-- 操作按钮 -->
        <button 
          v-if="status === 'uninstalled' || status === 'failed'"
          @click="$emit('install', software.id)"
          class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-sm font-medium transition-all shadow-sm"
        >
          {{ status === 'failed' ? '重试' : '安装' }}
        </button>
        
        <div v-else-if="status === 'installing'" class="flex items-center space-x-2 text-blue-500 text-sm">
          <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="animate-pulse">部署中...</span>
        </div>

        <svg v-else-if="status === 'installed'" class="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import type { SoftwareStatus } from '../store/app';

const props = defineProps<{
  software: any;
  status: SoftwareStatus;
}>();

defineEmits(['install']);

const statusLabels: Record<SoftwareStatus, string> = {
  uninstalled: '未安装',
  installing: '正在安装',
  installed: '已就绪',
  failed: '安装失败'
};

const statusStyles: Record<SoftwareStatus, string> = {
  uninstalled: 'bg-zinc-100 border-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400',
  installing: 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-400',
  installed: 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/30 dark:border-emerald-800/50 dark:text-emerald-400',
  failed: 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/30 dark:border-red-800/50 dark:text-red-400'
};
</script>
