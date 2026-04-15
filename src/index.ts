#!/usr/bin/env node
/**
 * 腾讯云 CodingPlan HUD MCP Server
 * 提供 API 查询工具供 Claude Code 使用
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { getCodingPlanUsage, type UsageData } from './api.js';
import { generateHUD, formatUsageDetail, type UILayout } from './hud.js';
import {
  loadConfig,
  saveConfig,
  setCredentials,
  isConfigured,
  getHUDConfig,
  updateHUDConfig,
  LAYOUT_OPTIONS,
  REFRESH_OPTIONS,
  type Config,
} from './config.js';

// 缓存的用量数据
let cachedUsageData: UsageData | null = null;
let lastFetchTime = 0;
let refreshIntervalMs = 2 * 60 * 1000; // 默认 2 分钟

// 创建 MCP Server
const server = new Server(
  { name: 'tencent-coding-plan-hud', version: '1.0.0' },
  {
    capabilities: { tools: {} },
    instructions: `腾讯云 CodingPlan 用量监控插件。

安装后请先运行 /tencent-coding-plan-hud:setup 配置 API 密钥。
使用 /tencent-coding-plan-hud:query 查询当前用量。
使用 /tencent-coding-plan-hud:configure 配置 UI 和刷新频率。`,
  }
);

// 获取用量数据（带缓存）
async function getUsageData(): Promise<UsageData> {
  const config = loadConfig();

  if (!config || !config.secretId || !config.secretKey) {
    return { success: false, error: 'API 未配置' };
  }

  // 检查是否需要刷新
  const now = Date.now();
  refreshIntervalMs = (config.refreshIntervalMinutes || 2) * 60 * 1000;

  if (cachedUsageData && now - lastFetchTime < refreshIntervalMs) {
    return cachedUsageData;
  }

  // 刷新数据
  const result = await getCodingPlanUsage(config.secretId, config.secretKey);
  cachedUsageData = result;
  lastFetchTime = now;

  return result;
}

// 定义工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_usage_hud',
      description: '获取腾讯云 CodingPlan 用量的 HUD 显示文本',
      inputSchema: {
        type: 'object',
        properties: {
          contextUsed: { type: 'number', description: '上下文已用 token 数' },
          contextTotal: { type: 'number', description: '上下文总 token 数' },
          layout: { type: 'string', description: 'UI 布局' },
        },
      },
    },
    {
      name: 'get_usage_detail',
      description: '获取腾讯云 CodingPlan 用量详细信息',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'setup_credentials',
      description: '配置腾讯云 API 密钥',
      inputSchema: {
        type: 'object',
        properties: {
          secretId: { type: 'string', description: '腾讯云 SecretId' },
          secretKey: { type: 'string', description: '腾讯云 SecretKey' },
        },
        required: ['secretId', 'secretKey'],
      },
    },
    {
      name: 'configure_hud',
      description: '配置 HUD 显示选项',
      inputSchema: {
        type: 'object',
        properties: {
          layout: { type: 'string', description: 'UI 布局类型' },
          refreshMinutes: { type: 'number', description: '刷新频率（分钟）' },
        },
      },
    },
    {
      name: 'get_config_status',
      description: '获取配置状态',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ],
}));

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const arguments_ = args || {};

  try {
    switch (name) {
      case 'get_usage_hud': {
        const config = loadConfig();
        const hudConfig = getHUDConfig(config);
        const usageData = await getUsageData();

        const contextUsed = arguments_.contextUsed as number | undefined;
        const contextTotal = arguments_.contextTotal as number | undefined;
        const layoutOverride = arguments_.layout as UILayout | undefined;

        if (layoutOverride) {
          hudConfig.layout = layoutOverride;
        }

        const contextUsage = contextUsed && contextTotal
          ? { used: contextUsed, total: contextTotal }
          : undefined;

        const hud = generateHUD(usageData, hudConfig, contextUsage);
        return {
          content: [{ type: 'text', text: hud }],
        };
      }

      case 'get_usage_detail': {
        const usageData = await getUsageData();
        const detail = formatUsageDetail(usageData);
        return {
          content: [{ type: 'text', text: detail }],
        };
      }

      case 'setup_credentials': {
        const secretId = arguments_.secretId as string;
        const secretKey = arguments_.secretKey as string;

        if (!secretId || !secretKey) {
          return {
            content: [{
              type: 'text',
              text: '请提供 SecretId 和 SecretKey',
            }],
            isError: true,
          };
        }

        const success = setCredentials(secretId, secretKey);
        if (success) {
          // 立即测试连接
          const testResult = await getCodingPlanUsage(secretId, secretKey);
          if (testResult.success) {
            return {
              content: [{
                type: 'text',
                text: `✅ API 密钥配置成功！\n\n${formatUsageDetail(testResult)}`,
              }],
            };
          } else {
            return {
              content: [{
                type: 'text',
                text: `⚠️ API 密钥已保存，但连接测试失败：${testResult.error}\n\n请检查密钥是否正确，或稍后重试。`,
              }],
            };
          }
        } else {
          return {
            content: [{
              type: 'text',
              text: '❌ 保存配置失败，请检查文件权限',
            }],
            isError: true,
          };
        }
      }

      case 'configure_hud': {
        const layout = arguments_.layout as UILayout | undefined;
        const refreshMinutes = arguments_.refreshMinutes as number | undefined;

        const updates: { layout?: UILayout; refreshIntervalMinutes?: number } = {};

        if (layout) {
          updates.layout = layout;
        }
        if (refreshMinutes !== undefined) {
          updates.refreshIntervalMinutes = refreshMinutes;
          refreshIntervalMs = refreshMinutes * 60 * 1000;
        }

        const newConfig = updateHUDConfig(updates);
        if (newConfig) {
          const layoutLabel = LAYOUT_OPTIONS.find(o => o.value === newConfig.layout)?.label || newConfig.layout;
          return {
            content: [{
              type: 'text',
              text: `✅ 配置已更新\n\n布局: ${layoutLabel}\n刷新频率: ${newConfig.refreshIntervalMinutes}分钟/次`,
            }],
          };
        } else {
          return {
            content: [{
              type: 'text',
              text: '❌ 更新配置失败，请先使用 /tencent-coding-plan-hud:setup 配置 API 密钥',
            }],
            isError: true,
          };
        }
      }

      case 'get_config_status': {
        const configured = isConfigured();
        const config = loadConfig();

        let status = '📋 插件配置状态\n\n';
        status += `API 配置: ${configured ? '✅ 已配置' : '❌ 未配置'}\n`;

        if (config) {
          const layoutLabel = LAYOUT_OPTIONS.find(o => o.value === config.layout)?.label || config.layout;
          const refreshLabel = REFRESH_OPTIONS.find(o => o.value === config.refreshIntervalMinutes)?.label || `${config.refreshIntervalMinutes}分钟/次`;
          status += `UI 布局: ${layoutLabel}\n`;
          status += `刷新频率: ${refreshLabel}\n`;

          if (config.secretId) {
            status += `SecretId: ${config.secretId.slice(0, 8)}...${config.secretId.slice(-4)}\n`;
          }
        }

        status += '\n📁 配置文件位置: ~/.claude/tencent-coding-plan-hud/config.json';

        return {
          content: [{ type: 'text', text: status }],
        };
      }

      default:
        return {
          content: [{ type: 'text', text: `未知工具: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `工具调用失败: ${error instanceof Error ? error.message : String(error)}`,
      }],
      isError: true,
    };
  }
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Tencent CodingPlan HUD MCP Server started');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
