#!/bin/bash
# UserPromptSubmit Hook - 在每次用户提交消息时显示腾讯云 CodingPlan 用量

set -euo pipefail

# 配置文件路径
CONFIG_FILE="$HOME/.claude/tencent-coding-plan-hud/config.json"
CACHE_FILE="$HOME/.claude/tencent-coding-plan-hud/usage_cache.json"

# 检查配置是否存在
if [[ ! -f "$CONFIG_FILE" ]]; then
    exit 0
fi

# 读取配置
SECRET_ID=$(grep -o '"secretId"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | sed 's/"secretId"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/')
SECRET_KEY=$(grep -o '"secretKey"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | sed 's/"secretKey"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/')
REFRESH_INTERVAL=$(grep -o '"refreshIntervalMinutes"[[:space:]]*:[[:space:]]*[0-9.]*' "$CONFIG_FILE" | sed 's/"refreshIntervalMinutes"[[:space:]]*:[[:space:]]*//' || echo "2")

# 检查凭证是否存在
if [[ -z "$SECRET_ID" || -z "$SECRET_KEY" ]]; then
    exit 0
fi

# 检查缓存是否有效（避免频繁调用 API）
CACHE_VALID=false
if [[ -f "$CACHE_FILE" ]]; then
    CACHE_AGE=$(( $(date +%s) - $(stat -c %Y "$CACHE_FILE" 2>/dev/null || echo 0) ))
    CACHE_INTERVAL=$(awk "BEGIN {print int($REFRESH_INTERVAL * 60)}" 2>/dev/null || echo "120")
    if [[ "$CACHE_AGE" -lt "${CACHE_INTERVAL:-120}" ]]; then
        CACHE_VALID=true
    fi
fi

# 调用 Node.js 脚本获取用量数据
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-/workspace/projects/tencent-coding-plan-hud}"
QUERY_SCRIPT="$PLUGIN_ROOT/dist/query-usage.js"

if [[ -f "$QUERY_SCRIPT" ]]; then
    # 如果缓存有效，使用缓存；否则调用 API
    if [[ "$CACHE_VALID" == "true" ]]; then
        HUD_OUTPUT=$(cat "$CACHE_FILE" 2>/dev/null || node "$QUERY_SCRIPT" 2>/dev/null)
    else
        HUD_OUTPUT=$(node "$QUERY_SCRIPT" 2>/dev/null || echo "")
        # 更新缓存
        if [[ -n "$HUD_OUTPUT" ]]; then
            echo "$HUD_OUTPUT" > "$CACHE_FILE"
        fi
    fi
else
    exit 0
fi

# 输出 HUD（简洁格式，不带大边框）
if [[ -n "$HUD_OUTPUT" ]]; then
    echo ""
    echo "📱 CodingPlan: $HUD_OUTPUT"
fi

exit 0
