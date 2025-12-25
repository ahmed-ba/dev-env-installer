<template>
  <div v-if="visible" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
    <div class="bg-zinc-900 rounded-xl shadow-2xl w-96 overflow-hidden">
      <div class="px-6 py-4 border-b border-zinc-800">
        <h3 class="text-lg font-semibold text-white">环境变量配置</h3>
      </div>
      <div class="px-6 py-4">
        <p class="text-zinc-400 mb-4">
          是否将 <span class="text-blue-400 font-mono">{{ softwareName }}</span> 添加到全局环境变量？
        </p>
        <div class="bg-zinc-800 rounded-lg p-3 mb-4">
          <pre class="text-xs text-zinc-500">{{ path }}</pre>
        </div>
        <p v-if="injectResult" :class="injectResult.success ? 'text-green-400' : 'text-red-400'" class="text-sm mb-4">
          {{ injectResult.message }}
        </p>
      </div>
      <div class="px-6 py-4 border-t border-zinc-800 flex justify-end space-x-3">
        <button
          @click="handleCancel"
          :disabled="isInjecting"
          class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors disabled:opacity-50"
        >
          取消
        </button>
        <button
          @click="handleConfirm"
          :disabled="isInjecting || injectResult?.success"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {{ isInjecting ? '配置中...' : '确认' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  visible: boolean;
  softwareName: string;
  path: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
  'confirm': [];
  'cancel': [];
}>();

const isInjecting = ref(false);
const injectResult = ref<{ success: boolean; message: string } | null>(null);

watch(() => props.visible, (newVal) => {
  if (newVal) {
    injectResult.value = null;
  }
});

const handleConfirm = async () => {
  if (isInjecting.value) return;
  
  isInjecting.value = true;
  try {
    const result = await window.electronAPI.injectEnv(props.path);
    injectResult.value = result;
    
    if (result.success) {
      setTimeout(() => {
        emit('confirm');
        emit('update:visible', false);
      }, 1500);
    }
  } catch (error) {
    injectResult.value = {
      success: false,
      message: error instanceof Error ? error.message : '未知错误'
    };
  } finally {
    isInjecting.value = false;
  }
};

const handleCancel = () => {
  emit('cancel');
  emit('update:visible', false);
};
</script>