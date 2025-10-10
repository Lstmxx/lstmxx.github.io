---
title: H5 Safari浏览器input自动聚焦问题
date: 2025-09-25 10:21:29
tags:
  - H5
  - Safari
categories:
  - 问题汇总
---

<video controls width="600">
  <source src="https://github.com/Lstmxx/picx-images-hosting/raw/refs/heads/master/006d784f475ef7ac7fb19ff012e36d28.6bhg49dfih.mov">
  Sorry, your browser doesn't support embedded videos.
</video>

# 问题描述

当用户在输入手机号后，自动获取验证码功能会将焦点从手机号输入框切换到验证码输入框，导致 `blur` 和 `focus` 事件被多次触发，从而引发 `window.scrollTo` 定位异常。

![](https://cdn.nlark.com/yuque/0/2025/png/411961/1758594336727-63c1c14f-239d-4754-bbe9-d9d242971aa7.png)

### window.scrollTo 的适配

为适配 iOS 设备，在 input 的 `blur` 和 `focus` 事件上绑定 `window.scrollTo`，以便在键盘弹出时，页面元素能够正确上移。实现代码如下：

```tsx
export function handleInputScroll(isBlur: boolean) {
  if (isBlur) {
    window.scrollTo(0, CacheData.cacheScroll)
  } else {
    CacheData.cacheScroll = window.screenY
  }
}
```

# 解决方案

### setTimeout 尝试

最初的思路是通过增加延迟（`setTimeout`）来避免事件触发过快。在 iOS 模拟器的 Safari 浏览器上，这一方案有效，但在真机上却无法生效。根本原因在于 Safari 的安全策略：**只有在用户主动、直接交互（如 `click`、`touchstart` 等）事件处理流程中，调用 `focus()` 方法才能成功弹出键盘**。

### debounce（最终解决方案）

通过防抖（debounce）机制，避免 `window.scrollTo` 被多次触发，从而保证页面滚动行为的正确性。

![](https://cdn.nlark.com/yuque/0/2025/png/411961/1758595775999-3e1593e0-6a80-4bea-982c-fcd9aa5633b7.png)
