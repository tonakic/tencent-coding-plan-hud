#!/usr/bin/env node
/**
 * 命令行用量查询脚本
 * 供 SessionStart hook 使用
 */

import { getCodingPlanUsage } from './api.js';
import { generateHUD } from './hud.js';
import { loadConfig, getHUDConfig } from './config.js';

async function main() {
  const config = loadConfig();

  if (!config || !config.secretId || !config.secretKey) {
    console.log('API未配置或者已失效过期，请输入/tencent-coding-plan-hud:setup配置。');
    process.exit(0);
  }

  const hudConfig = getHUDConfig(config);
  const usageData = await getCodingPlanUsage(config.secretId, config.secretKey);
  const hud = generateHUD(usageData, hudConfig);

  console.log(hud);
}

main().catch((e) => {
  console.error('查询失败:', e.message);
  process.exit(1);
});
