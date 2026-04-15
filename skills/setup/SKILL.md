---
name: setup
description: 配置腾讯云 CodingPlan HUD 插件 — 设置 API 密钥和 statusline。使用此命令初始化插件，当用户提供 SecretId/SecretKey，或询问"如何配置"、"怎么设置"时触发。
user-invocable: true
argument-hint: <SecretId> <SecretKey>
allowed-tools: [Bash, Read, Edit]
---

# /tencent-coding-plan-hud:setup — 插件配置

配置腾讯云 API 密钥和 statusline，使 HUD 能够持续显示在输入框下方。

## Step 0: 处理 API 密钥参数

Arguments: `$ARGUMENTS`

### 有参数 — 直接配置 API 密钥

如果用户提供了 SecretId 和 SecretKey：

1. 解析 `$ARGUMENTS`，获取 SecretId（第一个参数）和 SecretKey（第二个参数）
2. 验证格式：
   - SecretId 应以 `AKID` 开头
   - SecretKey 长度应大于 20
3. 使用 MCP 工具 `mcp__plugin_tencent-coding-plan-hud_tencent-coding-plan-hud__setup_credentials` 保存配置
4. 显示配置结果，然后继续 Step 1 配置 statusline

### 无参数 — 检查现有配置

如果没有参数，检查是否已配置：

```bash
cat ~/.claude/tencent-coding-plan-hud/config.json 2>/dev/null | head -5
```

- 如果已配置：显示当前配置状态，询问是否需要更新
- 如果未配置：显示获取密钥的指南

## 获取 API 密钥指南

在配置前，请按照以下步骤获取 API 密钥：

1. **打开腾讯云控制台**
   浏览器访问 https://console.cloud.tencent.com/cam/capi

2. **登录账号**
   使用已开通腾讯 Coding Plan 的账号登录

3. **创建 API 密钥**
   - 点击「新建密钥」
   - 使用主账号 API 访问密钥（推荐）
   - 复制 SecretId 和 SecretKey

## Step 1: 检测运行环境

**macOS/Linux**:
```bash
# 检测 bun 或 node
command -v bun 2>/dev/null || command -v node 2>/dev/null
```

**Windows + PowerShell**:
```powershell
if (Get-Command node -ErrorAction SilentlyContinue) { (Get-Command node).Source } else { "node not found" }
```

如果找不到运行时：
- 建议安装 Node.js LTS: https://nodejs.org/
- 或 Bun: https://bun.sh/

## Step 2: 获取插件路径并测试

**macOS/Linux**:
```bash
# 获取插件路径
PLUGIN_DIR="${CLAUDE_CONFIG_DIR:-$HOME}/.claude/plugins/cache/tencent-coding-plan-hud"
if [[ -d "$PLUGIN_DIR" ]]; then
  echo "Plugin found: $PLUGIN_DIR"
  ls -la "$PLUGIN_DIR"
else
  echo "Plugin not installed"
fi
```

**开发模式检测**（当前在插件源码目录时）:
```bash
# 检查是否在开发目录
if [[ -f "./dist/statusline.js" ]]; then
  echo "Using development build"
  node ./dist/statusline.js
fi
```

## Step 3: 配置 Statusline

读取 Claude Code settings 文件：
- **macOS/Linux**: `~/.claude/settings.json`
- **Windows**: `%USERPROFILE%\.claude\settings.json`

如果文件不存在则创建。

生成 statusline 命令：

**macOS/Linux**:
```bash
# 动态查找插件路径
RUNTIME=$(command -v node 2>/dev/null || command -v bun 2>/dev/null)
PLUGIN_PATH='bash -c '\''plugin_dir=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/tencent-coding-plan-hud/*/ 2>/dev/null | head -1); if [[ -n "$plugin_dir" ]]; then exec '"$RUNTIME"' "${plugin_dir}dist/statusline.js"; elif [[ -f "./dist/statusline.js" ]]; then exec '"$RUNTIME"' "./dist/statusline.js"; else echo "Plugin not found"; fi'\'
```

**简化版本**（推荐，用于开发测试）:
```bash
# 直接使用当前目录（开发模式）
RUNTIME=$(command -v node || command -v bun)
SCRIPT_PATH="/workspace/projects/tencent-coding-plan-hud/dist/statusline.js"
```

写入 settings.json：
```json
{
  "statusLine": {
    "type": "command",
    "command": "{GENERATED_COMMAND}"
  }
}
```

**重要**：保留 settings.json 中的其他配置，只更新 statusLine 字段。

## Step 4: 验证配置

测试 statusline 命令是否正常工作：
```bash
node /workspace/projects/tencent-coding-plan-hud/dist/statusline.js
```

应该输出类似：
```
5h用量(231/6,000)░░░░░░░░░░ 3.85% | 周用量(2,370/45,000)░░░░░░░░░░ 5.27% | ...
```

## Step 5: 完成提示

配置成功后，告诉用户：

> ✅ 配置完成！
> 
> **请重启 Claude Code** — 完全退出并重新运行 `claude` 命令。
> 
> 重启后，HUD 将显示在输入框下方，实时显示 CodingPlan 用量。

## 注意事项

- API 密钥存储在 `~/.claude/tencent-coding-plan-hud/config.json`
- 文件权限设置为 600（仅用户可读写）
- 请勿将密钥提交到 Git 或公开分享
- 如需更换密钥，重新运行 setup 命令即可
- statusline 更新频率默认 2 分钟，可通过 `/tencent-coding-plan-hud:configure` 调整
