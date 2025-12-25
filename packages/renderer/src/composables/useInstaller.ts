import { ref, onMounted, onBeforeUnmount, computed } from 'vue';

export type InstallationStatus = 'idle' | 'downloading' | 'installing' | 'completed' | 'failed';

export interface LogEntry {
  text: string;
  time: string;
  isError?: boolean;
}

export interface InstallationProgress {
  id: string;
  status: InstallationStatus;
  progress?: number;
  message?: string;
}

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

  const handleTerminalData = (data: any) => {
    const time = new Date(data.timestamp || Date.now()).toLocaleTimeString();
    logs.value.push({
      text: data.text,
      time,
      isError: data.type === 'stderr'
    });
  };

  const handleProgress = (data: InstallationProgress) => {
    progress.value = data;
    isRunning.value = data.status !== 'completed' && data.status !== 'failed';
    
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
    window.electronAPI.onTerminalData(handleTerminalData);
    window.electronAPI.onInstallationProgress(handleProgress);
  });

  onBeforeUnmount(() => {
    window.electronAPI.removeListeners();
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