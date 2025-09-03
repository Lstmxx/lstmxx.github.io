---
title: 基于webtorrent和Electron的磁力链下载器
date: 2024-10-18 10:56:48
tags:
  - Electron
  - WebTorrent
categories:
  - Electron
---

**bt-downloader**是一个基于**webtorrent**和**electron**的磁力链下载器。

项目地址：<https://github.com/Lstmxx/bt-downloader>

![bt-downloader](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/985191f134e147cb973f7983d7aca489~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgTHN0bXh4:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMTU3NDE1NjM4MzgyNTIyOSJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1729825025&x-orig-sign=8r4OYl0iN7opYc4gzzrJw2Df6XU%3D)

## 技术栈

- 框架：electron + vite + Vue3 + Typescript
- 前端持久化 pinia
- 磁力链下载：webtorrent
- UI：TailwindCSS PrimeVue
- 数据库: better-sqlite3
- ORM: Typeorm
- 配置保存：electron-store

对于想上手 electron 的朋友，可以看看

### webtorrent

webtorrent 是一个基于 WebRTC 的磁力链下载客户端。对比 Aria2 的优势在于 webtorrent 使用 js 写的，同时也有对应的 types 包，所以对于 electron 开发会比较友好。

### better-sqlite3

对于桌面端应用的数据库选择，一般是选择 sqlite3。而 better-sqlite3 要比 sqlite3 性能好一些，所以选择了 better-sqlite3

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/d395897663ef402598dea133a9e13af3~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgTHN0bXh4:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMTU3NDE1NjM4MzgyNTIyOSJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1729825025&x-orig-sign=6%2FoPZNbUv2%2F9KnvRqAh7bayFxvA%3D)

ORM 方面则选择了 Typeorm。

### electron-store

对于一些比较简单的数据，例如系统配置等数据，可以直接用来保存，非常快捷方便。

### UI

ui 方面 taliwindcss 是必选的，这个习惯之后真的太香了。而 PrimeVue 则是因为还没用过所作出的选择，不必太过在意。

## 结语

经过这次开发，大概是掌握和熟悉了 electron 的开发了，有一说一开发桌面应用的好玩程度比 web 端要好玩很多，主要是可以操作的范围多了很多，使得一些想法和实现变得可能。
