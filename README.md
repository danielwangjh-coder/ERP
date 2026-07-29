# SmartOne ERP Demo

统一承载 ERP 静态 HTML 原型的演示门户。

## 项目结构

```text
index.html                  统一入口
assets/css/app.css          门户布局与导航样式
assets/js/menu-data.js      四级菜单及页面映射
assets/js/app.js            菜单、搜索、Hash 路由和页面加载
assets/vendor/              Prototype Kit 共享资源
```

## 接入页面

1. 将 HTML 页面及其本地资源放入项目目录。
2. 在 `assets/js/menu-data.js` 对应叶子菜单中配置相对路径 `page`。
3. 保留 `route` 不变，以便页面地址可刷新和分享。

示例：

```js
leaf(
  "sales-delivery-list",
  "销售出库单",
  "#/supply-chain-management/sales-management/sales-delivery-list",
  "pages/sales-delivery-list.html"
)
```

## 本地预览

静态文件可直接打开，也可以在项目根目录启动任意静态 Web 服务。
