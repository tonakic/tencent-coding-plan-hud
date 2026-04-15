/**
 * HUD 显示模块
 * 支持多种 UI 布局和进度条格式化
 */

import type { PeriodUsage, UsageData } from './api.js';

// UI 布局类型
export type UILayout = 'expanded-simple' | 'expanded-detailed' | 'stacked-simple' | 'stacked-detailed';

// HUD 配置
export interface HUDConfig {
  layout: UILayout;
  refreshIntervalMinutes: number;
}

// 默认配置
export const DEFAULT_HUD_CONFIG: HUDConfig = {
  layout: 'expanded-simple',
  refreshIntervalMinutes: 2,
};

// 颜色代码
const COLORS = {
  green: '\x1b[32m',
  orange: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
};

/**
 * 获取进度条颜色
 */
function getProgressColor(percent: number): string {
  if (percent < 70) return COLORS.green;
  if (percent < 90) return COLORS.orange;
  return COLORS.red;
}

/**
 * 生成进度条
 */
function generateProgressBar(percent: number, width: number = 10): string {
  const filled = Math.min(Math.floor(percent / 10), width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * 格式化数字（添加千位分隔符）
 */
function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * 格式化用量数据
 */
function formatUsage(name: string, usage: PeriodUsage, detailed: boolean): string {
  const percent = usage.UsagePercent;
  const color = getProgressColor(percent);
  const bar = generateProgressBar(percent);

  if (detailed) {
    const used = formatNumber(usage.Used);
    const total = formatNumber(usage.Total);
    return `${name}(${used}/${total})${color}${bar}${COLORS.reset} ${percent.toFixed(2)}%`;
  }

  return `${name}${color}${bar}${COLORS.reset} ${percent.toFixed(0)}%`;
}

/**
 * 生成 HUD 输出
 */
export function generateHUD(
  usageData: UsageData,
  config: HUDConfig = DEFAULT_HUD_CONFIG,
  contextUsage?: { used: number; total: number }
): string {
  if (!usageData.success || !usageData.data) {
    return `API未配置或者已失效过期，请输入/tencent-coding-plan-hud:setup配置。`;
  }

  const data = usageData.data;
  const timestamp = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const detailed = config.layout.includes('detailed');
  const stacked = config.layout.includes('stacked');

  // 上下文用量（如果提供）
  let contextStr = '';
  if (contextUsage) {
    const contextPercent = (contextUsage.used / contextUsage.total) * 100;
    const color = getProgressColor(contextPercent);
    const bar = generateProgressBar(contextPercent);

    if (detailed) {
      const usedK = Math.floor(contextUsage.used / 1000);
      const totalK = Math.floor(contextUsage.total / 1000);
      contextStr = `上下文用量（${usedK}K/${totalK}K）${color}${bar}${COLORS.reset} ${contextPercent.toFixed(2)}%`;
    } else {
      contextStr = `上下文用量${color}${bar}${COLORS.reset} ${contextPercent.toFixed(0)}%`;
    }
  }

  // 各周期用量
  const fiveHourStr = formatUsage('5h用量', data.perFiveHour, detailed);
  const weekStr = formatUsage('周用量', data.perWeek, detailed);
  const monthStr = formatUsage('月用量', data.perMonth, detailed);
  const pkgStr = `套餐: ${data.pkgName}`;
  const timeStr = `刷新时间：${timestamp}`;

  if (stacked) {
    // 堆叠布局
    const lines: string[] = [];
    if (contextStr) lines.push(contextStr);
    lines.push(fiveHourStr);
    lines.push(weekStr);
    lines.push(monthStr);
    lines.push(pkgStr);
    lines.push(timeStr);
    return lines.join('\n');
  } else {
    // 展开布局
    const parts: string[] = [];
    if (contextStr) parts.push(contextStr);
    parts.push(fiveHourStr);
    parts.push(weekStr);
    parts.push(monthStr);
    parts.push(pkgStr);
    parts.push(timeStr);
    return parts.join(' | ');
  }
}

/**
 * 格式化用量详情（用于查询结果显示）
 */
export function formatUsageDetail(usageData: UsageData): string {
  if (!usageData.success || !usageData.data) {
    return `❌ ${usageData.error || '获取用量失败'}`;
  }

  const data = usageData.data;
  const lines: string[] = [
    `\n${'='.repeat(60)}`,
    `📦 套餐: ${data.pkgName} (${data.pkgType})`,
    `💰 价格: ¥${data.price}/月`,
    `📊 状态: ${data.status}`,
    `⏰ 剩余天数: ${data.remainingDays} 天`,
    `📅 有效期: ${data.startTime} ~ ${data.endTime}`,
    `${'='.repeat(60)}`,
    '',
    '🔄 5小时周期:',
    `   时间范围: ${data.perFiveHour.StartTime} ~ ${data.perFiveHour.EndTime}`,
    `   用量: ${formatNumber(data.perFiveHour.Used)} / ${formatNumber(data.perFiveHour.Total)} tokens`,
    `   使用率: ${data.perFiveHour.UsagePercent.toFixed(2)}%`,
    `   剩余: ${formatNumber(data.perFiveHour.Total - data.perFiveHour.Used)} tokens`,
    '',
    '📅 每周:',
    `   时间范围: ${data.perWeek.StartTime} ~ ${data.perWeek.EndTime}`,
    `   用量: ${formatNumber(data.perWeek.Used)} / ${formatNumber(data.perWeek.Total)} tokens`,
    `   使用率: ${data.perWeek.UsagePercent.toFixed(2)}%`,
    `   剩余: ${formatNumber(data.perWeek.Total - data.perWeek.Used)} tokens`,
    '',
    '📆 每月:',
    `   时间范围: ${data.perMonth.StartTime} ~ ${data.perMonth.EndTime}`,
    `   用量: ${formatNumber(data.perMonth.Used)} / ${formatNumber(data.perMonth.Total)} tokens`,
    `   使用率: ${data.perMonth.UsagePercent.toFixed(2)}%`,
    `   剩余: ${formatNumber(data.perMonth.Total - data.perMonth.Used)} tokens`,
    `${'='.repeat(60)}`,
  ];

  return lines.join('\n');
}
