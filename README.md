# 腾讯云 CodingPlan HUD

<div align="center">

**Claude Code CLI 插件 - 实时监控腾讯云 CodingPlan Token 用量**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

</div>

---

## 📖 简介

**tencent-coding-plan-hud** 是一款专为 [Claude Code](https://claude.ai/code) 设计的 MCP 插件，帮助用户实时监控腾讯云 CodingPlan 的 Token 使用情况。

该插件通过腾讯云混元大模型 API 获取用量数据，并在 Claude Code 会话中直观地展示：
- 🤖 当前使用的大模型名称
- 📊 上下文用量（Context Window 使用率）
- 🕐 5 小时周期用量
- 📅 每周用量统计
- 📆 每月用量统计
- 📦 当前套餐信息

无论你是个人开发者还是团队用户，都能轻松掌握 Token 消耗情况，避免额度不足影响工作。

---

## ✨ 特性

| 特性 | 描述 |
|------|------|
| 🤖 **模型名称显示** | 显示当前使用的大模型名称（支持 Claude 系列简短名称转换） |
| 📊 **上下文用量** | 显示 Context Window 使用率，直观了解上下文占用情况 |
| 📈 **实时用量监控** | 显示 5 小时、每周、每月三个维度的 Token 使用量 |
| 🎨 **多种 UI 布局** | 支持展开/堆叠、简洁/详细 4 种显示布局 |
| 🔄 **智能缓存刷新** | 可配置刷新频率（30秒 ~ 10分钟），数据缓存优化 API 调用 |
| 🚀 **会话自动显示** | 通过 SessionStart Hook 在新会话自动展示用量信息 |
| 💬 **持续状态栏显示** | 通过 Statusline 功能在输入框下方持续显示用量信息 |
| 🔐 **安全密钥存储** | API 密钥本地加密存储，权限严格限制 |
| 🛠️ **MCP 工具集成** | 提供多个 MCP 工具供 Claude Code 调用 |
| 📝 **Slash 命令** | 支持 `/setup`、`/query`、`/configure` 快捷命令 |

---

## 📋 可配置项

### UI 布局

| 布局类型 | 描述 |
|----------|------|
| `expanded-simple` | 展开（简洁）- 单行显示，简洁格式（默认） |
| `expanded-detailed` | 展开（详细）- 单行显示，包含具体数值 |
| `stacked-simple` | 堆叠（简洁）- 多行显示，简洁格式 |
| `stacked-detailed` | 堆叠（详细）- 多行显示，包含具体数值 |

### 刷新频率

| 选项 | 说明 |
|------|------|
| `0.5` | 30 秒/次 |
| `1` | 1 分钟/次 |
| `2` | 2 分钟/次（默认） |
| `3` | 3 分钟/次 |
| `5` | 5 分钟/次 |
| `10` | 10 分钟/次 |

---

## 🛠️ 技术栈

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.0
- **Protocol**: MCP (Model Context Protocol)
- **SDK**: @modelcontextprotocol/sdk
- **API**: 腾讯云混元大模型 API (TC3-HMAC-SHA256 签名)

---

## 📁 项目结构

```
tencent-coding-plan-hud/
├── .claude-plugin/
│   └── plugin.json          # 插件元数据
├── .mcp.json                # MCP 服务器配置
├── src/
│   ├── index.ts             # MCP Server 入口
│   ├── api.ts               # 腾讯云 API 调用（TC3签名）
│   ├── hud.ts               # HUD 显示逻辑
│   ├── config.ts            # 配置管理
│   ├── query-usage.ts       # 命令行查询脚本
│   └── statusline.ts        # Statusline 持续显示脚本
├── hooks/
│   ├── hooks.json           # Hook 配置
│   ├── session-start.sh     # SessionStart Hook 脚本
│   └── user-prompt-submit.sh # UserPromptSubmit Hook 脚本
├── skills/
│   ├── setup/SKILL.md       # /setup 配置命令
│   ├── configure/SKILL.md   # /configure 设置命令
│   └── query/SKILL.md       # /query 查询命令
├── dist/                    # 编译输出目录
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ 配置文件

### 插件配置 (`~/.claude/tencent-coding-plan-hud/config.json`)

```json
{
  "secretId": "AKIDxxxxxxxxxxxxxxxx",
  "secretKey": "yyyyyyyyyyyyyyyyyyyyyyyy",
  "layout": "expanded-simple",
  "refreshIntervalMinutes": 2
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `secretId` | string | 腾讯云 API SecretId |
| `secretKey` | string | 腾讯云 API SecretKey |
| `layout` | string | UI 布局类型 |
| `refreshIntervalMinutes` | number | 刷新频率（分钟） |

> ⚠️ 配置文件权限为 `600`，仅用户可读写，请勿提交到版本控制。

---

## 🚀 安装与使用

### 一键安装

在 Claude Code 中运行以下命令：

```
/plugin marketplace add https://github.com/tonakic/tencent-coding-plan-hud
/plugin install tencent-coding-plan-hud
```

安装完成后，运行 `/reload-plugins` 或重启 Claude Code 即可使用。

> 💡 插件会在安装时自动构建，无需手动操作。

### 验证安装

安装完成后，运行以下命令验证：

```
/plugin list
```

应看到 `tencent-coding-plan-hud` 出现在已安装列表中。

### 卸载

卸载插件后会自动清理残留配置：

```
/plugin uninstall tencent-coding-plan-hud
```

卸载后下次启动 Claude Code 时，会自动清理：
- `~/.claude/tencent-coding-plan-hud/` - 配置文件和缓存
- `~/.claude/settings.json` 中的 statusLine 配置

> 💡 **自动清理原理**：statusline 脚本和 SessionStart 钩子会检测插件是否存在，如果检测到插件已被卸载，会自动清理残留配置。

---

## 📝 使用说明

### 1️⃣ 配置 API 密钥

首次使用需要配置腾讯云 API 密钥：

```
/tencent-coding-plan-hud:setup <SecretId> <SecretKey>
```

示例：
```
/tencent-coding-plan-hud:setup AKIDxxxxxxxxxxxxxxxx yyyyyyyyyyyyyyyyyyyyyyyy
```

### 2️⃣ 查询用量

```
/tencent-coding-plan-hud:query
```

输出示例：
```
============================================================
📦 套餐: Coding Plan Pro (pro)
💰 价格: ¥200/月
📊 状态: Normal
⏰ 剩余天数: 10 天
📅 有效期: 2026-03-25 09:59:58 ~ 2026-04-25 09:59:58
============================================================

🔄 5小时周期:
   时间范围: 2026-04-15 06:13:50 ~ 2026-04-15 11:13:50
   用量: 90 / 6,000 tokens
   使用率: 1.50%
   剩余: 5,910 tokens

📅 每周:
   用量: 2,124 / 45,000 tokens
   使用率: 4.72%
   剩余: 42,876 tokens

📆 每月:
   用量: 19,492 / 90,000 tokens
   使用率: 21.66%
   剩余: 70,508 tokens
============================================================
```

### 3️⃣ 配置显示

```
/tencent-coding-plan-hud:configure layout=stacked-detailed refresh=5
```

### 命令速查

| 命令 | 说明 |
|------|------|
| `/tencent-coding-plan-hud:setup` | 配置 API 密钥 |
| `/tencent-coding-plan-hud:query` | 查询当前用量 |
| `/tencent-coding-plan-hud:configure` | 配置 UI 布局和刷新频率 |

---

## 🔑 腾讯云 API 创建指南

### 步骤 1：登录腾讯云控制台

访问 [腾讯云 API 密钥管理](https://console.cloud.tencent.com/cam/capi)

### 步骤 2：创建 API 密钥

1. 点击 **「新建密钥」** 按钮
2. 选择密钥类型：
   - **主账号 API 密钥**（推荐）：拥有完整权限
   - **子账号 API 密钥**：需要授予 `hunyuan:DescribePkg` 权限

### 步骤 3：复制密钥信息

创建成功后，复制以下信息：
- **SecretId**：以 `AKID` 开头
- **SecretKey**：32位字母数字组合

> ⚠️ **安全提示**：SecretKey 只显示一次，请立即保存！

### 步骤 4：配置插件

将密钥配置到插件：

```
/tencent-coding-plan-hud:setup AKIDxxxxxxxx yyyyyyyyyyyyyyyyyyyy
```

### 权限说明

本插件只需要以下 API 权限：
- `hunyuan:DescribePkg` - 查询套餐用量

如果使用子账号，请确保已授予该权限。

### 相关链接

- [腾讯云 API 密钥管理](https://console.cloud.tencent.com/cam/capi)
- [TokenHub 控制台](https://console.cloud.tencent.com/tokenhub/codingplan)
- [混元大模型文档](https://cloud.tencent.com/document/product/1729)
- [TC3-HMAC-SHA256 签名算法](https://cloud.tencent.com/document/api/213/30654)

---

## 🎨 UI 布局示例

### 展开（简洁）- 默认

```
🤖 Sonnet 4.6 | 上下文用量█████░░░░░ 45% | 5h用量██░░░░░░░░ 25% | 周用量██░░░░░░░░ 25% | 月用量██░░░░░░░░ 25% | 套餐: Coding Plan Pro | 刷新时间：2026-04-15 12:30:39
```

### 展开（详细）

```
🤖 Sonnet 4.6 | 上下文用量（90K/200K）█████░░░░░ 45% | 5h用量(1500/6000)██░░░░░░░░ 25% | 周用量(11250/45000)██░░░░░░░░ 25% | 月用量（22500/90000）██░░░░░░░░ 25% | 套餐: Coding Plan Pro | 刷新时间：2026-04-15 12:30:39
```

### 堆叠（简洁）

```
🤖 Sonnet 4.6
上下文用量█████░░░░░ 45%
5h用量██░░░░░░░░ 25%
周用量██░░░░░░░░ 25%
月用量██░░░░░░░░ 25%
套餐: Coding Plan Pro
刷新时间：2026-04-15 12:30:39
```

### 堆叠（详细）

```
🤖 Sonnet 4.6
上下文用量（90K/200K）█████░░░░░ 45%
5h用量(1500/6000)██░░░░░░░░ 25%
周用量(11250/45000)██░░░░░░░░ 25%
月用量（22500/90000）██░░░░░░░░ 25%
套餐: Coding Plan Pro
刷新时间：2026-04-15 12:30:39
```

### 模型名称显示

| 模型 ID | 显示名称 |
|---------|----------|
| `claude-sonnet-4-6` | 🤖 Sonnet 4.6 |
| `claude-opus-4-7` | 🤖 Opus 4.7 |
| `claude-haiku-4-5` | 🤖 Haiku 4.5 |
| `glm-5` | 🤖 glm-5 |
| 其他 | 🤖 原始 ID |

### 进度条颜色规则

| 颜色 | 使用率 | 说明 |
|------|--------|------|
| 🟢 绿色 | 0% - 69% | 用量正常 |
| 🟠 橙色 | 70% - 89% | 即将达到限额 |
| 🔴 红色 | 90% - 100% | 已接近限额 |

---

## 🔒 安全说明

- ✅ API 密钥存储在 `~/.claude/tencent-coding-plan-hud/config.json`
- ✅ 配置文件权限设置为 `600`（仅用户可读写）
- ✅ 密钥不会硬编码到代码中
- ✅ 不会上传到任何远程服务器（仅调用腾讯云官方 API）
- ⚠️ 请勿将配置文件提交到 Git
- ⚠️ 建议定期轮换 API 密钥

---

## 🧪 开发

```bash
# 克隆仓库
git clone https://github.com/tonakic/tencent-coding-plan-hud.git
cd tencent-coding-plan-hud

# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 构建
npm run build

# 查询用量（测试）
npm run query

# 启动 MCP Server（调试）
npm run start
```

---

## 📄 许可证

[MIT License](LICENSE)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

<div align="center">

**Made with ❤️ for Claude Code users**

</div>
