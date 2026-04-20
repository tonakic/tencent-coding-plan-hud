#!/usr/bin/env node
/**
 * Statusline 脚本 - 持续显示在 Claude Code 输入框下方
 * 通过 stdin 接收 Claude Code 数据，输出 HUD 内容
 */

import * as fs from 'fs';
import * as path from 'path';
import { getCodingPlanUsage, type UsageData } from './api.js';
import { generateHUD } from './hud.js';
import { loadConfig, getHUDConfig } from './config.js';

/**
 * 检测并清理卸载残留
 * 当插件缓存目录不存在时，自动清理 settings.json 中的 statusLine 配置
 */
function cleanupIfOrphaned(): boolean {
  const configDir = process.env.CLAUDE_CONFIG_DIR || path.join(process.env.HOME || '', '.claude');
  const pluginCacheDir = path.join(configDir, 'plugins', 'cache', 'tencent-coding-plan-hud');

  // 检查插件缓存目录是否存在
  if (!fs.existsSync(pluginCacheDir)) {
    // 插件已被卸载，清理 settings.json 中的 statusLine
    const settingsPath = path.join(configDir, 'settings.json');

    if (fs.existsSync(settingsPath)) {
      try {
        const content = fs.readFileSync(settingsPath, 'utf8');
        const settings = JSON.parse(content);

        // 检查 statusLine 是否指向本插件
        if (settings.statusLine?.command?.includes('tencent-coding-plan-hud')) {
          delete settings.statusLine;
          fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        }
      } catch {
        // 忽略错误，静默退出
      }
    }

    // 清理配置目录
    const pluginConfigDir = path.join(configDir, 'tencent-coding-plan-hud');
    if (fs.existsSync(pluginConfigDir)) {
      try {
        fs.rmSync(pluginConfigDir, { recursive: true });
      } catch {
        // 忽略错误
      }
    }

    return true; // 已清理，是孤儿状态
  }

  return false; // 正常状态
}

// Claude Code stdin 数据类型
interface StdinData {
  context_window?: {
    context_window_size?: number;
    used_percentage?: number;
    current_usage?: {
      input_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
  };
  model?: {
    id?: string;
    display_name?: string;
  };
  cwd?: string;
}

// 用量数据缓存
let cachedUsageData: UsageData | null = null;
let lastFetchTime = 0;
const MIN_FETCH_INTERVAL_MS = 60 * 1000; // 最小 1 分钟刷新间隔

/**
 * 从 stdin 读取数据
 */
async function readStdin(): Promise<StdinData | null> {
  // 检查是否是 TTY（交互模式）
  if (process.stdin.isTTY) {
    return null;
  }

  return new Promise((resolve) => {
    let raw = '';
    let settled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const cleanup = () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
      }
      process.stdin.off('data', onData);
      process.stdin.off('end', onEnd);
      process.stdin.off('error', onError);
      process.stdin.pause();
    };

    const finish = (value: StdinData | null) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };

    const tryParse = (): StdinData | null => {
      const trimmed = raw.trim();
      if (!trimmed) return null;
      try {
        return JSON.parse(trimmed) as StdinData;
      } catch {
        return null;
      }
    };

    const onData = (chunk: Buffer | string) => {
      raw += String(chunk);
      const parsed = tryParse();
      if (parsed) {
        finish(parsed);
      }
    };

    const onEnd = () => {
      finish(tryParse());
    };

    const onError = () => {
      finish(null);
    };

    // 超时 250ms（快速响应）
    timeout = setTimeout(() => {
      finish(tryParse());
    }, 250);

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', onData);
    process.stdin.on('end', onEnd);
    process.stdin.on('error', onError);
  });
}

/**
 * 获取用量数据（带缓存）
 */
async function getUsageData(config: { secretId: string; secretKey: string; refreshIntervalMinutes: number }): Promise<UsageData> {
  const now = Date.now();
  const refreshMs = Math.max(config.refreshIntervalMinutes * 60 * 1000, MIN_FETCH_INTERVAL_MS);

  // 使用缓存
  if (cachedUsageData && now - lastFetchTime < refreshMs) {
    return cachedUsageData;
  }

  // 刷新数据
  const result = await getCodingPlanUsage(config.secretId, config.secretKey);
  cachedUsageData = result;
  lastFetchTime = now;

  return result;
}

/**
 * 主函数
 */
async function main() {
  // 检测是否已被卸载，如果是则自动清理残留并退出
  if (cleanupIfOrphaned()) {
    // 插件已被卸载，静默退出（不输出任何内容）
    return;
  }

  const config = loadConfig();

  // 未配置时显示提示
  if (!config?.secretId || !config.secretKey) {
    console.log('📱 腾讯云 CodingPlan: 请运行 /tencent-coding-plan-hud:setup 配置 API 密钥');
    return;
  }

  // 读取 stdin 数据（可选）
  const stdin = await readStdin();

  // 获取用量数据
  const usageData = await getUsageData(config);

  // 获取 HUD 配置
  const hudConfig = getHUDConfig(config);

  // 提取上下文信息（如果可用）
  let contextUsage: { used: number; total: number } | undefined;
  if (stdin?.context_window) {
    const ctx = stdin.context_window;
    if (ctx.context_window_size && ctx.used_percentage !== undefined) {
      const total = ctx.context_window_size;
      const used = Math.floor(total * ctx.used_percentage / 100);
      contextUsage = { used, total };
    } else if (ctx.context_window_size && ctx.current_usage) {
      const total = ctx.context_window_size;
      const used = (ctx.current_usage.input_tokens || 0) +
                   (ctx.current_usage.cache_creation_input_tokens || 0) +
                   (ctx.current_usage.cache_read_input_tokens || 0);
      contextUsage = { used, total };
    }
  }

  // 提取模型信息（如果可用）
  const modelId = stdin?.model?.id;

  // 生成并输出 HUD
  const hud = generateHUD(usageData, hudConfig, contextUsage, modelId);
  console.log(hud);
}

main().catch((e) => {
  console.error('Statusline 错误:', e.message);
  process.exit(1);
});
