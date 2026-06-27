"# Cline 扩展模型切换及认证故障排查指南

## 1. 配置模型 ID

确保 `settings.json` 中模型 ID 使用带 Provider 前缀的完整格式，例如：

```json
\"cline.apiProvider\": \"openai\",
\"cline.openAiBaseUrl\": \"https://api.deepseek.com/v1\",
\"cline.openAiModelId\": \"anthropic/claude-sonnet-4.6\",
\"cline.planModeSettings\": {
    \"apiProvider\": \"openai\",
    \"openAiBaseUrl\": \"https://api.deepseek.com/v1\",
    \"openAiModelId\": \"anthropic/claude-opus-4.8\"
}
```

## 2. 统一且有效的 API Key 配置

- 确认 `settings.json` 中 API Key 正确，无拼写或格式错误
- API Key 是当前所用中转服务（如 DeepSeek、Yunwu）的有效 Key
- 避免同时维护多套（如 `roo_cline` 与 `cline`）配置，防止冲突

## 3. 清理扩展缓存与同步配置

- 在 VS Code 中执行 `Developer: Reload Window` 重载扩展环境
- 关闭并重新打开 VS Code，确保扩展读取最新设置
- 在 Cline 扩展 UI 内手动检查并选择模型，优先覆盖缓存值

## 4. 认证失败（Invalid token）排查

- 确认 API Key 是否被支持且没过期
- 如果用中转服务，确认服务端是否支持你当前模型 ID 格式和 API Key
- 若仍有问题，尝试换用官方或更稳定的中转服务地址

## 5. 简洁配置建议示例

只保留 `cline` 配置，移除 `roo_cline`，示例如下：

```json
{
  \"cline.apiProvider\": \"openai\",
  \"cline.openAiBaseUrl\": \"https://api.deepseek.com/v1\",
  \"cline.openAiApiKey\": \"你的DeepSeek API Key\",
  \"cline.openAiModelId\": \"anthropic/claude-sonnet-4.6\",
  \"cline.planModeSettings\": {
    \"apiProvider\": \"openai\",
    \"openAiBaseUrl\": \"https://api.deepseek.com/v1\",
    \"openAiModelId\": \"anthropic/claude-opus-4.8\"
  }
}
```

---

按照这份指南排查一步步配置后，模型切换和认证问题将大概率解决。

如需我帮你一键落地修改配置文件或分析其它问题，请告诉我。"