<template>
  <div class="space-y-6">
    <!-- 云同步板块 -->
    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
      <h3 class="text-lg font-bold mb-6 flex items-center space-x-2">
        <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <span>配置备份</span>
      </h3>
      
      <div class="space-y-4">
        <p class="text-sm text-zinc-600 dark:text-zinc-400">
          将当前配置导出为 JSON 文件，或从备份文件恢复配置。
        </p>
        <div class="flex space-x-3">
          <button
            @click="handleExportConfig"
            class="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-xl font-semibold transition-all"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>导出配置</span>
          </button>
          
          <label class="flex-1">
            <input type="file" accept=".json" @change="handleImportConfig" class="hidden" />
            <div class="flex items-center justify-center space-x-2 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-xl font-semibold transition-all cursor-pointer">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>导入配置</span>
            </div>
          </label>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
      <h3 class="text-lg font-bold mb-6 flex items-center space-x-2">
        <svg class="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <span>Homebrew 设置</span>
      </h3>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">镜像源</label>
          <select
            v-model="brewMirror"
            @change="handleBrewMirrorChange"
            class="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
          >
            <option value="">官方源</option>
            <option value="https://mirrors.tuna.tsinghua.edu.cn/brew.git">清华大学</option>
            <option value="https://mirrors.aliyun.com/homebrew/brew.git">阿里云</option>
            <option value="https://mirrors.ustc.edu.cn/brew.git">中科大</option>
          </select>
          <p class="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            选择 Homebrew 镜像源以加速下载速度
          </p>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
      <h3 class="text-lg font-bold mb-6 flex items-center space-x-2">
        <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>Shell 配置</span>
      </h3>
      
      <div class="space-y-4">
        <div class="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <div>
            <p class="font-medium text-zinc-900 dark:text-zinc-100">自动加载 Shell 配置</p>
            <p class="text-sm text-zinc-500 dark:text-zinc-400">安装后自动配置环境变量</p>
          </div>
          <button
            @click="handleAutoSourceToggle"
            :class="[
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              store.settings?.autoSourceShell ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-600'
            ]"
          >
            <span
              :class="[
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                store.settings?.autoSourceShell ? 'translate-x-6' : 'translate-x-1'
              ]"
            />
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            @click="handleConfigureHomebrew"
            class="flex items-center justify-center space-x-2 px-4 py-3 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-xl font-semibold transition-all"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span>配置 Homebrew</span>
          </button>
          
          <button
            @click="handleConfigureNode"
            class="flex items-center justify-center space-x-2 px-4 py-3 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 rounded-xl font-semibold transition-all"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>配置 Node.js</span>
          </button>
          
          <button
            @click="handleConfigureGo"
            class="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl font-semibold transition-all"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>配置 Go</span>
          </button>
          
          <button
            @click="handleConfigurePython"
            class="flex items-center justify-center space-x-2 px-4 py-3 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400 rounded-xl font-semibold transition-all"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>配置 Python</span>
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
      <h3 class="text-lg font-bold mb-6 flex items-center space-x-2">
        <svg class="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>关于</span>
      </h3>
      
      <div class="space-y-3">
        <div class="flex items-center justify-between py-2 border-b border-zinc-200 dark:border-zinc-700">
          <span class="text-zinc-600 dark:text-zinc-400">版本</span>
          <span class="font-medium text-zinc-900 dark:text-zinc-100">1.0.0</span>
        </div>
        <div class="flex items-center justify-between py-2 border-b border-zinc-200 dark:border-zinc-700">
          <span class="text-zinc-600 dark:text-zinc-400">Electron</span>
          <span class="font-medium text-zinc-900 dark:text-zinc-100">{{ store.systemInfo?.nodeVersion || 'Unknown' }}</span>
        </div>
        <div class="flex items-center justify-between py-2">
          <span class="text-zinc-600 dark:text-zinc-400">平台</span>
          <span class="font-medium text-zinc-900 dark:text-zinc-100">{{ store.systemInfo?.platform || 'Unknown' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAppStore } from '../store/app';
import { ElMessage } from 'element-plus';

const store = useAppStore();
const brewMirror = ref('');

onMounted(() => {
  if (store.settings?.brewMirror) {
    brewMirror.value = store.settings.brewMirror;
  }
});

// 导出配置
async function handleExportConfig() {
  try {
    const config = {
      statuses: store.statuses,
      versions: store.versions,
      settings: store.settings,
      exportTime: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MacDevSetup_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert('配置已成功导出!');
  } catch (e) {
    alert('导出失败: ' + (e instanceof Error ? e.message : '未知错误'));
  }
}

// 导入配置
async function handleImportConfig(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    const config = JSON.parse(text);
    if (config.settings) {
      await store.updateSettings(config.settings);
    }
    alert('配置已成功导入！部分设置可能需要重启应用生效。');
  } catch (e) {
    alert('导入失败: ' + (e instanceof Error ? e.message : '文件格式错误'));
  }
  input.value = ''; // 重置输入
}

async function handleBrewMirrorChange() {
  await store.updateSettings({ brewMirror: brewMirror.value });
  // 显示切换成功提示
  const mirrorName = store.currentMirrorName;
  ElMessage.success({
    message: `镜像源已切换为：${mirrorName}`,
    duration: 2000,
    showClose: true
  });
}

async function handleAutoSourceToggle() {
  if (store.settings) {
    await store.updateSettings({ autoSourceShell: !store.settings.autoSourceShell });
  }
}

async function handleConfigureHomebrew() {
  const result = await store.configureShell('homebrew');
  if (result.success) {
    alert('Homebrew 配置成功！\n\n请运行以下命令使配置生效：\n' + result.message);
  } else {
    alert('配置失败：' + result.message);
  }
}

async function handleConfigureNode() {
  const result = await store.configureShell('node');
  if (result.success) {
    alert('Node.js 配置成功！\n\n请运行以下命令使配置生效：\n' + result.message);
  } else {
    alert('配置失败：' + result.message);
  }
}

async function handleConfigureGo() {
  const result = await store.configureShell('go');
  if (result.success) {
    alert('Go 配置成功！\n\n请运行以下命令使配置生效：\n' + result.message);
  } else {
    alert('配置失败：' + result.message);
  }
}

async function handleConfigurePython() {
  const result = await store.configureShell('python');
  if (result.success) {
    alert('Python 配置成功！\n\n请运行以下命令使配置生效：\n' + result.message);
  } else {
    alert('配置失败：' + result.message);
  }
}
</script>
