import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import type { InstallationProgress as ApiInstallationProgress, InstallationLog } from '../types/electronAPI';

export type InstallationStatus = 'idle' | 'downloading' | 'installing' | 'completed' | 'failed' | 'cancelled';

// 本地 LogEntry 类型，增加了 time 和 isError 属性用于显示
export interface LogEntry {
  id: string;
  text: string;
  type: 'stdout' | 'stderr';
  timestamp: number;
  time: string;
  isError?: boolean;
}

export interface InstallationProgress extends ApiInstallationProgress {}

export interface SoftwareInfo {
  id: string;
  name: string;
  envPath?: string;
}

export function useInstaller() {
  const logs = ref<LogEntry[]>([]);
  const progress = ref<InstallationProgress | null>(null);
  const isRunning = ref(false);
  const currentSoftwareId = ref<string | null>(null);
  const currentSoftware = ref<SoftwareInfo | null>(null);
  const showEnvInjectDialog = ref(false);
  const lastInstallSuccess = ref(false);

  // 保存监听器引用，以便正确移除
  let terminalDataHandler: ((data: InstallationLog) => void) | null = null;
  let progressHandler: ((data: InstallationProgress) => void) | null = null;

  const handleTerminalData = (data: InstallationLog) => {
    const entry: LogEntry = {
      id: data.id,
      text: data.text,
      type: data.type,
      timestamp: data.timestamp,
      time: new Date(data.timestamp).toLocaleTimeString(),
      isError: data.type === 'stderr'
    };
    logs.value.push(entry);
  };

  const handleProgress = (data: InstallationProgress) => {
    progress.value = data;
    isRunning.value = data.status !== 'completed' && data.status !== 'failed' && data.status !== 'cancelled';

    if (data.status === 'completed') {
      lastInstallSuccess.value = true;
      if (currentSoftware.value?.envPath) {
        showEnvInjectDialog.value = true;
      }
    } else if (data.status === 'failed') {
      lastInstallSuccess.value = false;
    }
  };

  const install = async (software: SoftwareInfo): Promise<boolean> => {
    try {
      currentSoftware.value = software;
      currentSoftwareId.value = software.id;
      isRunning.value = true;
      logs.value = [];
      progress.value = {
        id: software.id,
        status: 'downloading',
        message: '开始安装...'
      };
      const result = await window.electronAPI.install(software.id);
      return result;
    } catch (error) {
      console.error('安装失败:', error);
      progress.value = {
        id: software.id,
        status: 'failed',
        message: '安装失败'
      };
      return false;
    } finally {
      isRunning.value = false;
    }
  };

  const handleEnvInjectConfirm = () => {
    showEnvInjectDialog.value = false;
  };

  const handleEnvInjectCancel = () => {
    showEnvInjectDialog.value = false;
  };

  const clearLogs = () => {
    logs.value = [];
  };

  const isIndeterminate = computed(() => {
    return progress.value?.status === 'downloading' && progress.value.progress === undefined;
  });

  const progressPercentage = computed(() => {
    if (!progress.value) return 0;
    if (progress.value.status === 'completed') return 100;
    if (progress.value.status === 'failed') return 0;
    return progress.value.progress ?? 0;
  });

  const statusMessage = computed(() => {
    if (!progress.value) return '';
    return progress.value.message || '';
  });

  const envInjectDialogProps = computed(() => {
    if (!currentSoftware.value) return null;
    return {
      visible: showEnvInjectDialog.value,
      softwareName: currentSoftware.value.name,
      path: currentSoftware.value.envPath || ''
    };
  });

  onMounted(() => {
    // 保存处理函数引用
    terminalDataHandler = handleTerminalData;
    progressHandler = handleProgress;

    window.electronAPI.onTerminalData(terminalDataHandler);
    window.electronAPI.onInstallationProgress(progressHandler);
  });

  onBeforeUnmount(() => {
    // 只移除当前组件添加的监听器，而不是所有监听器
    if (terminalDataHandler) {
      window.electronAPI.removeListeners();
    }
  });

  return {
    logs,
    progress,
    isRunning,
    currentSoftwareId,
    currentSoftware,
    install,
    clearLogs,
    isIndeterminate,
    progressPercentage,
    statusMessage,
    showEnvInjectDialog,
    envInjectDialogProps,
    handleEnvInjectConfirm,
    handleEnvInjectCancel,
    lastInstallSuccess
  };
}