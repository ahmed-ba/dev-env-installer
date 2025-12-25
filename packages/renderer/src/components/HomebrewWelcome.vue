<template>
  <div class="fixed inset-0 bg-zinc-950 flex items-center justify-center p-8">
    <div class="w-full max-w-2xl">
      <!-- Welcome Card -->
      <div 
        v-if="!isInstalling" 
        class="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 shadow-2xl"
      >
        <!-- Icon -->
        <div class="flex justify-center mb-6">
          <div class="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center">
            <span class="text-5xl">🍺</span>
          </div>
        </div>

        <!-- Title -->
        <h1 class="text-3xl font-bold text-center text-white mb-3">
          Welcome to Mac Dev Setup
        </h1>

        <!-- Description -->
        <p class="text-zinc-400 text-center mb-8 leading-relaxed">
          检测到您的系统尚未安装 Homebrew。<br />
          这是 macOS 必备的包管理工具，我们需要先安装它。
        </p>

        <!-- Source Selector -->
        <div class="mb-8">
          <label class="block text-sm font-medium text-zinc-300 mb-3">
            选择安装源
          </label>
          <div class="space-y-2">
            <label 
              v-for="option in mirrorOptions" 
              :key="option.value"
              class="flex items-center p-3 rounded-xl border cursor-pointer transition-all"
              :class="[
                selectedSource === option.value
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'
              ]"
            >
              <input 
                type="radio" 
                :value="option.value" 
                v-model="selectedSource"
                class="sr-only"
              />
              <div 
                class="w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center"
                :class="[
                  selectedSource === option.value
                    ? 'border-blue-500'
                    : 'border-zinc-500'
                ]"
              >
                <div 
                  v-if="selectedSource === option.value"
                  class="w-2 h-2 rounded-full bg-blue-500"
                />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-white">{{ option.label }}</span>
                  <span 
                    v-if="option.recommended" 
                    class="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full"
                  >
                    推荐
                  </span>
                </div>
                <p class="text-sm text-zinc-500">{{ option.description }}</p>
              </div>
            </label>
          </div>
        </div>

        <!-- Error Message -->
        <div 
          v-if="store.brewInstallError" 
          class="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
        >
          <p class="text-red-400 text-sm">{{ store.brewInstallError }}</p>
        </div>

        <!-- Install Button -->
        <button
          @click="startInstall"
          class="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Install Homebrew
        </button>
      </div>

      <!-- Installation Terminal -->
      <div 
        v-else 
        class="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl"
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-white">正在安装 Homebrew...</h2>
            <p class="text-sm text-zinc-400">请在下方终端中按提示操作（可能需要输入密码）</p>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-red-500"></div>
            <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div class="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
        </div>

        <!-- Terminal -->
        <div 
          ref="terminalContainer" 
          class="h-96"
        />

        <!-- Success Message -->
        <div 
          v-if="installSuccess" 
          class="px-6 py-4 bg-green-500/10 border-t border-green-500/30"
        >
          <p class="text-green-400 font-medium flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Homebrew 安装成功！正在进入应用...
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import { useAppStore, MirrorSource } from '../store/app';

const store = useAppStore();

const mirrorOptions = [
  { value: 'tsinghua' as MirrorSource, label: '清华镜像', description: '国内速度快，推荐使用', recommended: true },
  { value: 'ustc' as MirrorSource, label: '中科大镜像', description: '国内速度快' },
  { value: 'official' as MirrorSource, label: '官方源', description: '速度较慢，但最稳定' }
];

const selectedSource = ref<MirrorSource>('tsinghua');
const isInstalling = ref(false);
const installSuccess = ref(false);
const terminalContainer = ref<HTMLElement | null>(null);

let terminal: Terminal | null = null;
let fitAddon: FitAddon | null = null;

function startInstall() {
  isInstalling.value = true;
  store.startBrewInstall(selectedSource.value);
  
  nextTick(() => {
    initTerminal();
  });
}

function initTerminal() {
  if (!terminalContainer.value) return;

  terminal = new Terminal({
    cursorBlink: true,
    fontSize: 13,
    fontFamily: '"JetBrains Mono", "Fira Code", "Menlo", "Monaco", "Courier New", monospace',
    lineHeight: 1.4,
    scrollback: 1000,
    theme: {
      background: '#09090b',
      foreground: '#a1a1aa',
      cursor: '#a1a1aa',
      cursorAccent: '#09090b',
      black: '#09090b',
      red: '#ef4444',
      green: '#22c55e',
      yellow: '#eab308',
      blue: '#3b82f6',
      magenta: '#a855f7',
      cyan: '#06b6d4',
      white: '#f4f4f5',
      brightBlack: '#52525b',
      brightRed: '#f87171',
      brightGreen: '#4ade80',
      brightYellow: '#facc15',
      brightBlue: '#60a5fa',
      brightMagenta: '#c084fc',
      brightCyan: '#22d3ee',
      brightWhite: '#ffffff'
    }
  });

  fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);
  terminal.loadAddon(new WebLinksAddon());

  terminal.open(terminalContainer.value);
  fitAddon.fit();

  // Handle user input
  terminal.onData((data) => {
    (window as any).electronAPI.brew.sendInput(data);
  });

  // Handle window resize
  window.addEventListener('resize', handleResize);
}

function handleResize() {
  if (fitAddon && terminal) {
    fitAddon.fit();
    const dims = fitAddon.proposeDimensions();
    if (dims) {
      (window as any).electronAPI.brew.resize(dims.cols, dims.rows);
    }
  }
}

function handleInstallData(data: string) {
  if (terminal) {
    terminal.write(data);
  }
}

function handleInstallComplete(result: any) {
  if (result.success && result.installed) {
    installSuccess.value = true;
    if (terminal) {
      terminal.write('\r\n\x1b[32m✓ Homebrew 安装成功！\x1b[0m\r\n');
    }
    // Wait 2 seconds then update store
    setTimeout(() => {
      store.handleBrewInstallComplete(result);
    }, 2000);
  } else {
    if (terminal) {
      terminal.write('\r\n\x1b[31m✗ 安装失败，请重试\x1b[0m\r\n');
    }
    store.handleBrewInstallComplete(result);
    // Allow retry
    setTimeout(() => {
      isInstalling.value = false;
    }, 1000);
  }
}

onMounted(() => {
  // Register IPC listeners
  (window as any).electronAPI.brew.onInstallData(handleInstallData);
  (window as any).electronAPI.brew.onInstallComplete(handleInstallComplete);
});

onBeforeUnmount(() => {
  // Cleanup
  window.removeEventListener('resize', handleResize);
  (window as any).electronAPI.brew.removeListeners();
  
  if (terminal) {
    terminal.dispose();
    terminal = null;
  }
});
</script>
