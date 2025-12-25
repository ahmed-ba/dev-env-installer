<template>
  <div class="bg-zinc-900 rounded-xl shadow-lg border border-zinc-800 overflow-hidden">
    <div class="p-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-xl font-semibold text-white">{{ software.name }}</h3>
          <p class="text-zinc-500 text-sm mt-1">{{ software.description }}</p>
        </div>
        <span
          class="px-3 py-1 rounded-full text-xs font-medium"
          :class="statusClass"
        >
          {{ statusText }}
        </span>
      </div>

      <div v-if="progress" class="mb-4">
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs text-zinc-500">{{ progress.message }}</span>
          <span class="text-xs text-zinc-500">{{ isIndeterminate ? '' : progressPercentage + '%' }}</span>
        </div>
        <ProgressBar :status="progress.status" :progress="progressPercentage" :is-indeterminate="isIndeterminate" />
      </div>

      <div v-if="isRunning && logs.length > 0" class="mb-4">
        <div class="bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden">
          <div class="flex items-center justify-between px-3 py-2 bg-zinc-900/50 border-b border-zinc-800">
            <span class="text-xs text-zinc-500 font-mono">安装日志</span>
            <button @click="clearLogs" class="text-[10px] text-zinc-500 hover:text-white transition-colors">
              清除
            </button>
          </div>
          <div class="max-h-48 overflow-y-auto p-2 font-mono text-xs space-y-1">
            <div
              v-for="(log, index) in logs"
              :key="index"
              class="break-all"
              :class="log.isError ? 'text-red-400' : 'text-zinc-300'"
            >
              <span class="text-zinc-600">{{ log.time }}</span> {{ log.text }}
            </div>
          </div>
        </div>
      </div>

      <div class="flex space-x-3">
        <button
          @click="handleInstall"
          :disabled="isRunning"
          class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {{ isRunning ? '安装中...' : '安装' }}
        </button>
        <button
          @click="handleUninstall"
          :disabled="isRunning"
          class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors disabled:opacity-50"
        >
          卸载
        </button>
      </div>
    </div>

    <EnvInjectDialog
      v-if="envInjectDialogProps"
      v-bind="envInjectDialogProps"
      @update:visible="showEnvInjectDialog = $event"
      @confirm="handleEnvInjectConfirm"
      @cancel="handleEnvInjectCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ProgressBar from './ProgressBar.vue';
import EnvInjectDialog from './EnvInjectDialog.vue';
import { useInstaller, type SoftwareInfo } from '../composables/useInstaller';

interface Props {
  software: any;
}

const props = defineProps<Props>();

const {
  install,
  logs,
  progress,
  isRunning,
  isIndeterminate,
  progressPercentage,
  clearLogs,
  envInjectDialogProps,
  showEnvInjectDialog,
  handleEnvInjectConfirm,
  handleEnvInjectCancel
} = useInstaller();

const statusClass = computed(() => {
  if (isRunning.value) return 'bg-blue-500/20 text-blue-400';
  if (progress.value?.status === 'completed') return 'bg-green-500/20 text-green-400';
  if (progress.value?.status === 'failed') return 'bg-red-500/20 text-red-400';
  return 'bg-zinc-700/20 text-zinc-400';
});

const statusText = computed(() => {
  if (isRunning.value) return '安装中';
  if (progress.value?.status === 'completed') return '已完成';
  if (progress.value?.status === 'failed') return '失败';
  return '未安装';
});

const handleInstall = async () => {
  const softwareInfo: SoftwareInfo = {
    id: props.software.name,
    name: props.software.name,
    envPath: props.software.envPath
  };
  await install(softwareInfo);
};

const handleUninstall = () => {
  console.log('卸载功能待实现');
};
</script>