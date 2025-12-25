<template>
  <div class="min-h-screen bg-zinc-950 p-6">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-white mb-8">开发环境管理器</h1>
      
      <SystemInfoLoader :systemInfo="systemInfo" />
      
      <!-- 其他页面内容 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import SystemInfoLoader from '../components/SystemInfoLoader.vue';

interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  brewVersion?: string;
  installedCount: number;
  totalPackages: number;
}

const systemInfo = ref<SystemInfo | null>(null);

onMounted(async () => {
  try {
    systemInfo.value = await window.electronAPI.getSystemInfo();
  } catch (error) {
    console.error('获取系统信息失败:', error);
  }
});
</script>