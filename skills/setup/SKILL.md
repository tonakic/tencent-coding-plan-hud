---
name: setup
description: 配置腾讯云 CodingPlan HUD 插件 — 设置 API 密钥。使用此命令初始化插件，当用户提供 SecretId/SecretKey，或询问"如何配置"、"怎么设置"时触发。
user-invocable: true
argument-hint: <SecretId> <SecretKey>
allowed-tools: [Bash]
---

# /tencent-coding-plan-hud:setup — API 密钥配置

配置腾讯云 API 密钥，使插件能够查询 CodingPlan 用量数据。

## 配置指南

在配置前，请按照以下步骤获取 API 密钥：

1. **打开腾讯云控制台**
   浏览器访问 https://console.cloud.tencent.com/cam/capi

2. **登录账号**
   使用已开通腾讯 Coding Plan 的账号登录

3. **创建 API 密钥**
   - 点击「新建密钥」
   - 使用主账号 API 访问密钥（推荐）
   - 复制 SecretId 和 SecretKey

4. **发送密钥给 Claude Code**
   将 SecretId 和 SecretKey 发送给 Claude Code 进行配置

   格式：`/tencent-coding-plan-hud:setup <SecretId> <SecretKey>`

   示例：
   ```
   /tencent-coding-plan-hud:setup AKIDxxxxxxxxxxxxxxxx yyyyyyyyyyyyyyyyyyyyyyyy
   ```

## 处理参数

Arguments: `$ARGUMENTS`

### 有参数 — 直接配置

如果用户提供了 SecretId 和 SecretKey：

1. 解析 `$ARGUMENTS`，获取 SecretId（第一个参数）和 SecretKey（第二个参数）
2. 验证格式：
   - SecretId 应以 `AKID` 开头
   - SecretKey 长度应大于 20
3. 使用 MCP 工具 `mcp__tencent-coding-plan-hud__setup_credentials` 保存配置
4. 显示配置结果

### 无参数 — 显示指南

如果没有参数，显示上面的配置指南，引导用户获取密钥。

## 注意事项

- API 密钥存储在 `~/.claude/tencent-coding-plan-hud/config.json`
- 文件权限设置为 600（仅用户可读写）
- 请勿将密钥提交到 Git 或公开分享
- 如需更换密钥，重新运行 setup 命令即可