---
name: uninstall
description: 清理 tencent-coding-plan-hud 插件的所有残留配置。当用户想要完全卸载插件、或卸载后仍有 HUD 显示时使用此命令。
user-invocable: true
allowed-tools: [Bash, Read, Edit]
---

# /tencent-coding-plan-hud:uninstall — 清理残留配置

完全清理 tencent-coding-plan-hud 插件的所有配置和残留文件。

## 问题说明

由于 Claude Code 不支持 `Uninstall` 钩子，通过 `/plugin uninstall` 卸载插件后，以下残留不会被自动清理：
- `~/.claude/settings.json` 中的 `statusLine` 配置
- `~/.claude/tencent-coding-plan-hud/` 配置目录
- 插件缓存目录

此命令用于手动清理这些残留。

## Step 1: 终止运行中的 HUD 进程

```bash
# 查找并终止 HUD 相关进程
pkill -f "tencent-coding-plan-hud" 2>/dev/null || echo "No HUD process found"
pkill -f "statusline.js" 2>/dev/null || echo "No statusline process found"
```

## Step 2: 清理配置目录

```bash
# 删除插件配置目录
rm -rf ~/.claude/tencent-coding-plan-hud 2>/dev/null && echo "✓ 已删除配置目录" || echo "配置目录不存在"
```

## Step 3: 清理 settings.json 中的 statusLine

读取 settings.json：
```bash
cat ~/.claude/settings.json 2>/dev/null
```

如果存在 `statusLine` 配置且指向 `tencent-coding-plan-hud`，则移除它：

- 使用 Read 工具读取 `~/.claude/settings.json`
- 检查是否包含 `tencent-coding-plan-hud` 的 statusLine 配置
- 如果存在，使用 Edit 工具移除整个 `statusLine` 字段

示例需要移除的内容：
```json
"statusLine": {
  "type": "command",
  "command": "bash -c 'plugin_dir=...tencent-coding-plan-hud...'"
},
```

## Step 4: 清理插件缓存（可选）

```bash
# 删除插件缓存目录
rm -rf ~/.claude/plugins/cache/tencent-coding-plan-hud 2>/dev/null && echo "✓ 已删除缓存目录" || echo "缓存目录不存在"
```

## Step 5: 验证清理结果

```bash
# 检查进程
ps aux | grep -i hud | grep -v grep || echo "✓ 无 HUD 进程"

# 检查配置目录
ls ~/.claude/tencent-coding-plan-hud 2>/dev/null || echo "✓ 配置目录已删除"

# 检查 settings.json
grep -i "tencent-coding-plan-hud" ~/.claude/settings.json || echo "✓ settings.json 已清理"
```

## 完成提示

清理完成后告诉用户：

> ✅ 清理完成！
> 
> 已清理以下内容：
> - HUD 进程
> - 配置目录 (~/.claude/tencent-coding-plan-hud/)
> - settings.json 中的 statusLine 配置
> - 插件缓存目录
> 
> 请重启 Claude Code 以确保更改生效。
