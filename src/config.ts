/**
 * 配置管理模块
 * 管理用户配置、API 密钥、UI 设置等
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { HUDConfig, UILayout } from './hud.js';

// 配置目录
const CONFIG_DIR = path.join(os.homedir(), '.claude', 'tencent-coding-plan-hud');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// 完整配置接口
export interface Config {
  secretId: string;
  secretKey: string;
  layout: UILayout;
  refreshIntervalMinutes: number;
}

// 默认配置
const DEFAULT_CONFIG: Omit<Config, 'secretId' | 'secretKey'> = {
  layout: 'expanded-simple',
  refreshIntervalMinutes: 2,
};

/**
 * 确保配置目录存在
 */
function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
}

/**
 * 加载配置
 */
export function loadConfig(): Config | null {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return null;
    }

    const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(content) as Config;

    // 合并默认值
    return {
      ...DEFAULT_CONFIG,
      ...config,
    };
  } catch (e) {
    console.error(`加载配置失败: ${e}`);
    return null;
  }
}

/**
 * 保存配置
 */
export function saveConfig(config: Config): boolean {
  try {
    ensureConfigDir();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), {
      encoding: 'utf-8',
      mode: 0o600, // 只有用户可读写
    });
    return true;
  } catch (e) {
    console.error(`保存配置失败: ${e}`);
    return false;
  }
}

/**
 * 验证 API 凭证
 */
export function validateCredentials(secretId: string, secretKey: string): boolean {
  // SecretId 格式: AKID 开头
  if (!secretId.startsWith('AKID') || secretId.length < 20) {
    return false;
  }

  // SecretKey 格式: 32 位字母数字
  if (secretKey.length < 20) {
    return false;
  }

  return true;
}

/**
 * 获取 HUD 配置
 */
export function getHUDConfig(config: Config | null): HUDConfig {
  if (!config) {
    return {
      layout: DEFAULT_CONFIG.layout,
      refreshIntervalMinutes: DEFAULT_CONFIG.refreshIntervalMinutes,
    };
  }

  return {
    layout: config.layout,
    refreshIntervalMinutes: config.refreshIntervalMinutes,
  };
}

/**
 * 更新 HUD 配置
 */
export function updateHUDConfig(updates: Partial<HUDConfig>): Config | null {
  const config = loadConfig();
  if (!config) {
    return null;
  }

  const newConfig = {
    ...config,
    ...updates,
  };

  saveConfig(newConfig);
  return newConfig;
}

/**
 * 设置 API 凭证
 */
export function setCredentials(secretId: string, secretKey: string): boolean {
  if (!validateCredentials(secretId, secretKey)) {
    return false;
  }

  const existingConfig = loadConfig();
  const config: Config = {
    ...(existingConfig || DEFAULT_CONFIG),
    secretId,
    secretKey,
  };

  return saveConfig(config);
}

/**
 * 检查配置是否完整
 */
export function isConfigured(): boolean {
  const config = loadConfig();
  return !!(config?.secretId && config?.secretKey);
}

/**
 * 获取配置文件路径
 */
export function getConfigPath(): string {
  return CONFIG_FILE;
}

/**
 * UI 布局选项
 */
export const LAYOUT_OPTIONS: { value: UILayout; label: string; description: string }[] = [
  { value: 'expanded-simple', label: '展开（简洁）', description: '单行显示，简洁格式' },
  { value: 'expanded-detailed', label: '展开（详细）', description: '单行显示，包含具体数值' },
  { value: 'stacked-simple', label: '堆叠（简洁）', description: '多行显示，简洁格式' },
  { value: 'stacked-detailed', label: '堆叠（详细）', description: '多行显示，包含具体数值' },
];

/**
 * 刷新频率选项
 */
export const REFRESH_OPTIONS: { value: number; label: string }[] = [
  { value: 0.5, label: '30秒/次' },
  { value: 1, label: '1分钟/次' },
  { value: 2, label: '2分钟/次' },
  { value: 3, label: '3分钟/次' },
  { value: 5, label: '5分钟/次' },
  { value: 10, label: '10分钟/次' },
];
