#!/bin/bash
# SessionStart Hook - 在会话开始时显示腾讯云 CodingPlan 用量

set -euo pipefail

# 配置文件路径
CONFIG_FILE="$HOME/.claude/tencent-coding-plan-hud/config.json"

# 检测插件是否已被卸载
# 条件1: 缓存目录不存在
# 条件2: 缓存目录存在但存在 .orphaned_at 标记文件（Claude Code 卸载时创建）
PLUGIN_CACHE_DIR="$HOME/.claude/plugins/cache/tencent-coding-plan-hud"
IS_ORPHANED=false

if [[ ! -d "$PLUGIN_CACHE_DIR" ]]; then
    IS_ORPHANED=true
else
    # 检查是否有 .orphaned_at 标记文件（递归查找）
    if find "$PLUGIN_CACHE_DIR" -name ".orphaned_at" -type f 2>/dev/null | head -1 | grep -q .; then
        IS_ORPHANED=true
    fi
fi

if [[ "$IS_ORPHANED" == "true" ]]; then
    # 自动清理残留配置
    SETTINGS_FILE="$HOME/.claude/settings.json"
    CONFIG_DIR="$HOME/.claude/tencent-coding-plan-hud"

    # 清理 settings.json 中的 statusLine 和 extraKnownMarketplaces
    if [[ -f "$SETTINGS_FILE" ]] && grep -q "tencent-coding-plan-hud" "$SETTINGS_FILE" 2>/dev/null; then
        if command -v node &>/dev/null; then
            node -e "
const fs = require('fs');
const settingsPath = '$SETTINGS_FILE';
try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    let modified = false;

    // 清理 statusLine
    if (settings.statusLine?.command?.includes('tencent-coding-plan-hud')) {
        delete settings.statusLine;
        modified = true;
    }

    // 清理 extraKnownMarketplaces
    if (settings.extraKnownMarketplaces?.['tencent-coding-plan-hud']) {
        delete settings.extraKnownMarketplaces['tencent-coding-plan-hud'];
        modified = true;
    }

    // 清理空的 extraKnownMarketplaces
    if (settings.extraKnownMarketplaces && Object.keys(settings.extraKnownMarketplaces).length === 0) {
        delete settings.extraKnownMarketplaces;
        modified = true;
    }

    if (modified) {
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

    # 清理插件缓存目录
    if [[ -d "$PLUGIN_CACHE_DIR" ]]; then
        rm -rf "$PLUGIN_CACHE_DIR" 2>/dev/null
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
