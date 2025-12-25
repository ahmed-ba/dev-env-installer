<template>
  <div class="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
    <div
      class="h-full transition-all duration-300 ease-out"
      :class="progressClass"
      :style="progressStyle"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  status?: 'idle' | 'downloading' | 'installing' | 'completed' | 'failed';
  progress?: number;
  isIndeterminate?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  status: 'idle',
  progress: 0,
  isIndeterminate: false
});

const progressStyle = computed(() => {
  if (props.status === 'completed') {
    return { width: '100%' };
  }
  if (props.status === 'failed') {
    return { width: '100%' };
  }
  if (props.isIndeterminate) {
    return { width: '100%', animation: 'shimmer 1.5s infinite' };
  }
  if (props.progress !== undefined) {
    return { width: `${Math.max(0, Math.min(100, props.progress))}%` };
  }
  return { width: '0%' };
});

const progressClass = computed(() => {
  if (props.isIndeterminate && props.status === 'downloading') {
    return 'shimmer-gradient';
  }
  switch (props.status) {
    case 'downloading':
      return 'bg-blue-500';
    case 'installing':
      return 'bg-green-500';
    case 'completed':
      return 'bg-green-500';
    case 'failed':
      return 'bg-red-500';
    default:
      return 'bg-zinc-600';
  }
});
</script>

<style scoped>
.shimmer-gradient {
  background: linear-gradient(
    90deg,
    #3b82f6 0%,
    #60a5fa 25%,
    #93c5fd 50%,
    #60a5fa 75%,
    #3b82f6 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>