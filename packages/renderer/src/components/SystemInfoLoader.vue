<template>
  <div v-if="isLoading" class="flex flex-col items-center justify-center py-12">
    <div class="relative">
      <div class="w-16 h-16 border-4 border-zinc-700 rounded-full animate-spin border-t-blue-500"></div>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
      </div>
    </div>
    <p class="mt-6 text-zinc-400 text-sm">正在获取系统信息...</p>
    <div class="mt-4 space-y-1">
      <div class="flex items-center space-x-2">
        <div class="w-2 h-2 rounded-full bg-zinc-700"></div>
        <span class="text-xs text-zinc-500">检查系统环境</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-2 h-2 rounded-full bg-zinc-700"></div>
        <span class="text-xs text-zinc-500">检测已安装软件</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-2 h-2 rounded-full bg-zinc-700"></div>
        <span class="text-xs text-zinc-500">加载软件列表</span>
      </div>
    </div>
  </div>
  
  <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 class="text-sm text-zinc-400">系统平台</h3>
          <p class="text-lg font-semibold text-white">{{ systemInfo?.platform || 'Unknown' }}</p>
        </div>
      </div>
    </div>
    
    <div class="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 class="text-sm text-zinc-400">已安装软件</h3>
          <p class="text-lg font-semibold text-white">{{ systemInfo?.installedCount || 0 }} / {{ systemInfo?.totalPackages || 0 }}</p>
        </div>
      </div>
    </div>
    
    <div class="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 class="text-sm text-zinc-400">Brew 版本</h3>
          <p class="text-lg font-semibold text-white">{{ systemInfo?.brewVersion || '未安装' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  brewVersion?: string;
  installedCount: number;
  totalPackages: number;
}

interface Props {
  systemInfo: SystemInfo | null;
}

const props = defineProps<Props>();
const isLoading = ref(true);

onMounted(() => {
  // 模拟加载延迟，实际使用时可以去掉
  setTimeout(() => {
    isLoading.value = false;
  }, 1500);
});
</script>