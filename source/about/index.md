---
title: 关于我
date: 2024-08-02 16:43:01
layout: 
---

## Hi there 👋

### 关于我

大家好，这里是 Lstmxx，一个全干工程师，可以叫我小 L。可以在以下地方找到我:

- 微信: &nbsp; [LsmTxx](https://raw.githubusercontent.com/Lstmxx/picx-images-hosting/master/20240805/WechatIMG145.1seybke27q.webp)
- email: &nbsp; <740719284@qq.com> &nbsp; <negi740719284@gmail.com>
- 博客会在&nbsp;[掘金](https://juejin.cn/user/1574156383825229)&nbsp;和&nbsp;[个人主页](https://lstmxx.github.io/)&nbsp;同步更新
- [github](https://github.com/Lstmxx)

### 技术栈

**语言**

[![language](https://skillicons.dev/icons?i=js,ts,python)](https://skillicons.dev)

**前端**

[![frontend](https://skillicons.dev/icons?i=html,css)](https://skillicons.dev)

[![frontend](https://skillicons.dev/icons?i=vue,react,electron,nextjs,antdesign)](https://skillicons.dev)

[![frontend](https://skillicons.dev/icons?i=tailwind,scss,less)](https://skillicons.dev)

[![frontend](https://skillicons.dev/icons?i=pnpm,npm,vite,webpack)](https://skillicons.dev)

**后端**

[![backend](https://skillicons.dev/icons?i=nodejs,nestjs,mysql,redis)](https://skillicons.dev)

**通用**

[![noraml](https://skillicons.dev/icons?i=git,jenkins,gitlab,docker,nginx)](https://skillicons.dev)

**工具**

[![noraml](https://skillicons.dev/icons?i=vscode,postman,notion)](https://skillicons.dev)

### 其他

![Lstmxx's GitHub stats](https://github-readme-stats.vercel.app/api?username=Lstmxx&count_private=true)

![Top Langs](https://github-readme-stats.vercel.app/api/top-langs/?username=Lstmxx&layout=compact&hide=jupyter%20notebook)

### 工作经历

**广州致景信息科技有限公司—高级前端工程师(2021 - 至今)**

- 先后负责 APS 系统、PIMS 系统和 AI 相关业务等的需求沟通和前端开发工作
- 负责 BG 前端团队基建如组件库、公共库的开发和维护，提高工作效率
- 参与编写、审核公司新版前端规范，减少 CR 时间

**康爱多数字健康科技有限公司—前端工程师(2020 - 2021)**

- 负责数字化营销平台的前端开发工作
- 设计 IM 系统前端架构
- 负责制定团队前端规范

**小贝区块链科技有限公司—前端工程师 (2019 - 2020)**

- 负责公司前端项目的开发和技术选型

### 项目经历

**Fashion Mind (2024-01 - 至今)** `Vue3` `TypeScript` `Element UI` `Tailwindcss`

背景：Fashion Mind 是一个基于大模型打造智能设计系统。
我在项目中担任主前端，负责需求沟通工作安排和主要开发工作，推动项目准时上线。

- 为了解决服务端叠图时间过长的问题和减少图片传输占用时间，利用 opencvjs 在 web 端实现了 mask 区的识别，并通过 opencvjs 和 canvas 将印花图以正片叠底的方式生成展示图片，将原来需要 10s+的时间，减少到了 5s 以下，减轻了服务端压力的同时，优化了用户交互。
- 为了使用户处理图片更加便捷，利用 fabricjs 实现了截图、矩形选区、索套功能，使用户能够自定义原图区域和 mask 区域。
- 为了解决算法识别出来的动态标签问题，拉通了后端和另一个项目的负责人，制定了标签存储的 json 数据结构；为了统一性，封装了通用解析函数到公共包中供其他项目使用。

**Fashion Admin (2024-01 - 至今)** `Vue3` `TypeScript` `Element UI` `Tailwindcss`

背景：Fashion Admin 是一个 Fashion Mind 的后台管理系统。
我在项目中的标签模块管理担任主开发，负责对接算法组标签数据的开发工作，同时负责 Fashion Design 数据的报表可视化工作。

- 完成数据报表、配置等前端开发工作。
- 为了解决标签依赖算法组的树形标签数据库带来的不稳定性，将数据树形可视化展示出来用于勾选同步。同时为了避免标签一次性的大量渲染导致的卡顿，使用虚拟列表来重新编写树形组件，将每次渲染稳定在了 16.7ms 左右。

**toy-monorepo (2022-01 - 至今)** `pnpm` `Vue3` `TypeScript` `Element UI` `Tailwindcss`

背景：toy-monorepo 是 BG 内部的公共库，用于抽离业务通用组件、通用 hooks 和配置。
我在项目中担任组件开发维护的工作。

- 为了提升分页数据报表的开发效率，将 elementui 中的 table 进行二次开发封装，统一了项目中的 table 对于时间、数字的格式化；同时为了解决 template 中 ElTableColumn 对 row 类型支持不友好的问题，增加了 columns 传参来支持 tsx 的形式来编写 column。组件在项目中使用率达到了 100%。
- 为了统一项目组内项目的编码风格减少 cr 时间，收集和整理所有项目的 eslint，并将其抽离出来变成公共包，

**APS 系统 (2022-01 - 2023-10)** `Vue3` `TypeScript` `Element UI`

背景：APS 是一个排厂系统，用于简化和数字化工厂对面料进行排产和加工流程。
我在项目中担任主前端，负责需求沟通工作安排和主要开发工作，带领实习生应届生完成项目开发工作。

- 为了可视化排厂派厂流程从而减少流程来提高效率，利用原生 drag drop mouse 事件来实现了甘特图组件; 基于可视区域的大小计算出范围内可视任务，减少了不必要的渲染。
- 为了提高开发效率和提升打包速度，将项目打包和构建从 wepback 迁移到了 vite，使得 jenkins 中构建所需时间从原本的 5 分钟缩减到了 2 分半钟左右；将迁移过程整理成了文档并在团队内部进行分享，帮助其他项目迁移至 vite。
