import { AppPackage, PackageCategory } from './types';

export const MARKETPLACE_PACKAGES: AppPackage[] = [
  {
    name: 'homebrew',
    description: 'macOS 必装软件包管理器',
    category: 'tool',
    installCmd: '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
    uninstallCmd: '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/uninstall.sh)"',
    checkCmd: 'command -v brew',
    status: 'missing',
    isCask: false
  },
  {
    name: 'node@20',
    description: 'JavaScript 运行时环境 (LTS)',
    category: 'language',
    installCmd: 'brew install node@20',
    uninstallCmd: 'brew uninstall node@20',
    checkCmd: 'node -v',
    status: 'missing',
    isCask: false
  },
  {
    name: 'git',
    description: '现代版本控制系统',
    category: 'tool',
    installCmd: 'brew install git',
    uninstallCmd: 'brew uninstall git',
    checkCmd: 'git --version',
    status: 'missing',
    isCask: false
  },
  {
    name: 'docker',
    description: 'Docker Desktop - 官方容器运行时',
    category: 'tool',
    installCmd: 'brew install --cask docker',
    uninstallCmd: 'brew uninstall --cask docker',
    checkCmd: 'ls /Applications/Docker.app',
    status: 'missing',
    isCask: true
  },
  {
    name: 'orbstack',
    description: 'OrbStack - 轻量级 Docker 替代方案 (推荐)',
    category: 'tool',
    installCmd: 'brew install --cask orbstack',
    uninstallCmd: 'brew uninstall --cask orbstack',
    checkCmd: 'ls /Applications/OrbStack.app',
    status: 'missing',
    isCask: true
  },
  {
    name: 'visual-studio-code',
    description: '流行的代码编辑器',
    category: 'ide',
    installCmd: 'brew install --cask visual-studio-code',
    uninstallCmd: 'brew uninstall --cask visual-studio-code',
    checkCmd: 'code --version',
    status: 'missing',
    isCask: true
  },
  {
    name: 'go',
    description: 'Google 开发的编程语言',
    category: 'language',
    installCmd: 'brew install go',
    uninstallCmd: 'brew uninstall go',
    checkCmd: 'go version',
    status: 'missing',
    isCask: false
  },
  {
    name: 'python@3.11',
    description: 'Python 编程语言 (3.11)',
    category: 'language',
    installCmd: 'brew install python@3.11',
    uninstallCmd: 'brew uninstall python@3.11',
    checkCmd: 'python3.11 --version',
    status: 'missing',
    isCask: false
  },
  {
    name: 'java',
    description: 'Java 开发工具包 (OpenJDK)',
    category: 'language',
    installCmd: 'brew install openjdk@17',
    uninstallCmd: 'brew uninstall openjdk@17',
    checkCmd: 'java -version',
    status: 'missing',
    isCask: false
  },
  {
    name: 'rust',
    description: 'Rust 系统编程语言',
    category: 'language',
    installCmd: 'brew install rust',
    uninstallCmd: 'brew uninstall rust',
    checkCmd: 'rustc --version',
    status: 'missing',
    isCask: false
  },
  {
    name: 'postgresql@15',
    description: 'PostgreSQL 关系型数据库',
    category: 'database',
    installCmd: 'brew install postgresql@15',
    uninstallCmd: 'brew uninstall postgresql@15',
    checkCmd: 'postgres --version',
    status: 'missing',
    isCask: false
  },
  {
    name: 'redis',
    description: 'Redis 内存数据库',
    category: 'database',
    installCmd: 'brew install redis',
    uninstallCmd: 'brew uninstall redis',
    checkCmd: 'redis-server --version',
    status: 'missing',
    isCask: false
  },
  {
    name: 'mongodb-community',
    description: 'MongoDB NoSQL 数据库',
    category: 'database',
    installCmd: 'brew install mongodb-community',
    uninstallCmd: 'brew uninstall mongodb-community',
    checkCmd: 'mongod --version',
    status: 'missing',
    isCask: false
  },
  {
    name: 'mysql',
    description: 'MySQL 关系型数据库',
    category: 'database',
    installCmd: 'brew install mysql',
    uninstallCmd: 'brew uninstall mysql',
    checkCmd: 'mysql --version',
    status: 'missing',
    isCask: false
  },
  {
    name: 'webstorm',
    description: 'JetBrains JavaScript IDE',
    category: 'ide',
    installCmd: 'brew install --cask webstorm',
    uninstallCmd: 'brew uninstall --cask webstorm',
    checkCmd: 'ls /Applications/WebStorm.app',
    status: 'missing',
    isCask: true
  },
  {
    name: 'intellij-idea-ce',
    description: 'JetBrains Java IDE (社区版)',
    category: 'ide',
    installCmd: 'brew install --cask intellij-idea-ce',
    uninstallCmd: 'brew uninstall --cask intellij-idea-ce',
    checkCmd: 'ls /Applications/IntelliJ\\ IDEA\\ CE.app',
    status: 'missing',
    isCask: true
  },
  {
    name: 'sublime-text',
    description: 'Sublime Text 文本编辑器',
    category: 'ide',
    installCmd: 'brew install --cask sublime-text',
    uninstallCmd: 'brew uninstall --cask sublime-text',
    checkCmd: 'ls /Applications/Sublime\\ Text.app',
    status: 'missing',
    isCask: true
  },
  {
    name: 'figma',
    description: '协作式界面设计工具',
    category: 'tool',
    installCmd: 'brew install --cask figma',
    uninstallCmd: 'brew uninstall --cask figma',
    checkCmd: 'ls /Applications/Figma.app',
    status: 'missing',
    isCask: true
  },
  {
    name: 'postman',
    description: 'API 开发和测试工具',
    category: 'tool',
    installCmd: 'brew install --cask postman',
    uninstallCmd: 'brew uninstall --cask postman',
    checkCmd: 'ls /Applications/Postman.app',
    status: 'missing',
    isCask: true
  },
  {
    name: 'slack',
    description: '团队协作和沟通工具',
    category: 'tool',
    installCmd: 'brew install --cask slack',
    uninstallCmd: 'brew uninstall --cask slack',
    checkCmd: 'ls /Applications/Slack.app',
    status: 'missing',
    isCask: true
  },
  {
    name: 'iterm2',
    description: '强大的终端模拟器',
    category: 'tool',
    installCmd: 'brew install --cask iterm2',
    uninstallCmd: 'brew uninstall --cask iterm2',
    checkCmd: 'ls /Applications/iTerm.app',
    status: 'missing',
    isCask: true
  }
];

export const CATEGORY_ICONS: Record<PackageCategory, string> = {
  language: '📝',
  database: '🗄️',
  ide: '💻',
  tool: '🛠️',
  cask: '📦'
};

export const CATEGORY_LABELS: Record<PackageCategory, string> = {
  language: '编程语言',
  database: '数据库',
  ide: '开发工具',
  tool: '实用工具',
  cask: '应用'
};
