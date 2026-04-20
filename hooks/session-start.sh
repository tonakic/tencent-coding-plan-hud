#!/bin/bash
# SessionStart Hook - 在会话开始时显示腾讯云 CodingPlan 用量

set -euo pipefail

# 配置文件路径
CONFIG_FILE="$HOME/.claude/tencent-coding-plan-hud/config.json"

# 检测插件是否已被卸载（缓存目录不存在）
PLUGIN_CACHE_DIR="$HOME/.claude/plugins/cache/tencent-coding-plan-hud"
if [[ ! -d "$PLUGIN_CACHE_DIR" ]]; then
    # 自动清理残留配置
    SETTINGS_FILE="$HOME/.claude/settings.json"
    CONFIG_DIR="$HOME/.claude/tencent-coding-plan-hud"

    # 清理 settings.json 中的 statusLine
    if [[ -f "$SETTINGS_FILE" ]] && grep -q "tencent-coding-plan-hud" "$SETTINGS_FILE" 2>/dev/null; then
        if command -v node &>/dev/null; then
            node -e "
const fs = require('fs');
const path = require('path');
const settingsPath = '$SETTINGS_FILE';
try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    if (settings.statusLine?.command?.includes('tencent-coding-plan-hud')) {
        delete settings.statusLine;
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    }
} catch (e) {}
" 2>/dev/null
        fi
    fi

    # 清理配置目录
    if [[ -d "$CONFIG_DIR" ]]; then
        rm -rf "$CONFIG_DIR" 2>/dev/null
    fi

    exit 0
fi

# 检查配置是否存在
if [[ ! -f "$CONFIG_FILE" ]]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📱 腾讯云 CodingPlan HUD"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "API未配置或者已失效过期，请输入 /tencent-coding-plan-hud:setup 配置。"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    exit 0
fi

# 读取配置
SECRET_ID=$(grep -o '"secretId"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | sed 's/"secretId"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/')
SECRET_KEY=$(grep -o '"secretKey"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | sed 's/"secretKey"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/')

# 检查凭证是否存在
if [[ -z "$SECRET_ID" || -z "$SECRET_KEY" ]]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📱 腾讯云 CodingPlan HUD"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "API密钥配置不完整，请输入 /tencent-coding-plan-hud:setup 重新配置。"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    exit 0
fi

# 调用 Node.js 脚本获取用量数据
# 注意：这需要 MCP server 已经构建
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-/workspace/projects/tencent-coding-plan-hud}"
QUERY_SCRIPT="$PLUGIN_ROOT/dist/query-usage.js"

if [[ -f "$QUERY_SCRIPT" ]]; then
    HUD_OUTPUT=$(node "$QUERY_SCRIPT" 2>/dev/null || echo "查询失败，请稍后重试")
else
    HUD_OUTPUT="插件尚未构建，请先运行 npm run build"
fi

# 输出 HUD
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 腾讯云 CodingPlan HUD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$HUD_OUTPUT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exit 0
