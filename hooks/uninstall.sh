#!/bin/bash
# Uninstall hook for tencent-coding-plan-hud
# This script runs when the plugin is uninstalled

CONFIG_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
PLUGIN_CONFIG_DIR="$CONFIG_DIR/tencent-coding-plan-hud"

# 1. 清理配置目录
if [[ -d "$PLUGIN_CONFIG_DIR" ]]; then
    rm -rf "$PLUGIN_CONFIG_DIR"
    echo "已删除配置目录: $PLUGIN_CONFIG_DIR"
fi

# 2. 清理 settings.json 中的 statusLine
SETTINGS_FILE="$CONFIG_DIR/settings.json"
if [[ -f "$SETTINGS_FILE" ]]; then
    # 检查 statusLine 是否指向本插件
    if grep -q "tencent-coding-plan-hud" "$SETTINGS_FILE" 2>/dev/null; then
        # 使用 node 或 python 来处理 JSON
        if command -v node &>/dev/null; then
            node -e "
const fs = require('fs');
const settings = JSON.parse(fs.readFileSync('$SETTINGS_FILE', 'utf8'));
delete settings.statusLine;
if (settings.extraKnownMarketplaces) {
    delete settings.extraKnownMarketplaces['tencent-coding-plan-hud'];
}
fs.writeFileSync('$SETTINGS_FILE', JSON.stringify(settings, null, 2));
console.log('已清理 settings.json 中的插件配置');
"
        fi
    fi
fi

echo "tencent-coding-plan-hud 卸载清理完成"
