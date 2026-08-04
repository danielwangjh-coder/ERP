(function () {
  "use strict";

  const leaf = (id, label, route, page, views, workspaceLabel) => ({
    id,
    label,
    route,
    page: page || "",
    views: Array.isArray(views) ? views : [],
    workspaceLabel: workspaceLabel || ""
  });

  window.ERP_MENU = [
    {
      id: "basic-settings",
      label: "基础设置",
      children: [
        {
          id: "business-master-data",
          label: "业务基础资料",
          groups: [
            {
              id: "unit-data",
              label: "单位数据",
              items: [
                leaf("measurement-unit", "计量单位", "#/basic-settings/business-master-data/unit-data/measurement-unit"),
                leaf(
                  "general-unit-conversion",
                  "通用单位换算",
                  "#/basic-settings/business-master-data/unit-data/general-unit-conversion",
                  "通用单位换算-列表.html"
                ),
                leaf(
                  "material-unit-conversion",
                  "物料单位换算",
                  "#/basic-settings/business-master-data/unit-data/material-unit-conversion",
                  "物料单位换算-列表.html"
                )
              ]
            },
            {
              id: "supply-chain-data",
              label: "供应链数据",
              items: [
                leaf("organization-address", "组织地址列表", "#/basic-settings/business-master-data/supply-chain-data/organization-address"),
                leaf("purchase-allocation-strategy", "采购分配策略", "#/basic-settings/business-master-data/supply-chain-data/purchase-allocation-strategy"),
                leaf("purchase-organization", "采购组织", "#/basic-settings/business-master-data/supply-chain-data/purchase-organization"),
                leaf("purchase-group", "采购组", "#/basic-settings/business-master-data/supply-chain-data/purchase-group"),
                leaf("sales-group", "销售组", "#/basic-settings/business-master-data/supply-chain-data/sales-group"),
                leaf("warehouse-data", "仓库资料", "#/basic-settings/business-master-data/supply-chain-data/warehouse-data")
              ]
            },
            {
              id: "material-data",
              label: "物料资料",
              items: [
                leaf("material-information", "物料信息", "#/basic-settings/business-master-data/material-data/material-information"),
                leaf("return-reason", "退回原因", "#/basic-settings/business-master-data/material-data/return-reason"),
                leaf("material-category", "物料类别", "#/basic-settings/business-master-data/material-data/material-category"),
                leaf("material-mapping", "物料对应管理", "#/basic-settings/business-master-data/material-data/material-mapping")
              ]
            },
            {
              id: "supplier-data",
              label: "供应商资料",
              items: [
                leaf("supplier-information", "供应商信息", "#/basic-settings/business-master-data/supplier-data/supplier-information"),
                leaf("qualification-category", "资质类别", "#/basic-settings/business-master-data/supplier-data/qualification-category"),
                leaf("supplier-category", "供应商类别", "#/basic-settings/business-master-data/supplier-data/supplier-category")
              ]
            },
            {
              id: "sales-data",
              label: "销售资料",
              items: [
                leaf("sales-channel", "销售渠道", "#/basic-settings/business-master-data/sales-data/sales-channel"),
                leaf("sales-pricing", "销售定价", "#/basic-settings/business-master-data/sales-data/sales-pricing"),
                leaf("sales-organization", "销售组织", "#/basic-settings/business-master-data/sales-data/sales-organization")
              ]
            },
            {
              id: "customer-data",
              label: "客户资料",
              items: [
                leaf("customer-information", "客户信息", "#/basic-settings/business-master-data/customer-data/customer-information"),
                leaf("customer-category", "客户分类", "#/basic-settings/business-master-data/customer-data/customer-category")
              ]
            },
            {
              id: "financial-data",
              label: "财务资料",
              items: [
                leaf("income-item", "收入项目", "#/basic-settings/business-master-data/financial-data/income-item"),
                leaf("receipt-terms", "收款条件", "#/basic-settings/business-master-data/financial-data/receipt-terms"),
                leaf("expense-item", "支出项目", "#/basic-settings/business-master-data/financial-data/expense-item"),
                leaf("payment-terms", "付款条件", "#/basic-settings/business-master-data/financial-data/payment-terms"),
                leaf("settlement-method", "结算方式", "#/basic-settings/business-master-data/financial-data/settlement-method"),
                leaf("fund-account", "资金账户", "#/basic-settings/business-master-data/financial-data/fund-account"),
                leaf("contract-terms", "合同条款", "#/basic-settings/business-master-data/financial-data/contract-terms")
              ]
            }
          ]
        }
      ]
    },
    {
      id: "supply-chain-management",
      label: "供应链管理",
      children: [
        {
          id: "purchase-management",
          label: "采购管理",
          groups: [
            {
              id: "kit-purchase",
              label: "配套采购",
              items: [
                leaf("kit-purchase-analysis", "齐套采购分析单", "#/supply-chain-management/purchase-management/kit-purchase/kit-purchase-analysis")
              ]
            },
            {
              id: "application-management",
              label: "申请管理",
              items: [
                leaf("purchase-request", "采购申请单", "#/supply-chain-management/purchase-management/application-management/purchase-request")
              ]
            },
            {
              id: "contract-management",
              label: "合同管理",
              items: [
                leaf("purchase-contract", "采购合同", "#/supply-chain-management/purchase-management/contract-management/purchase-contract")
              ]
            },
            {
              id: "purchase-execution",
              label: "采购执行",
              items: [
                leaf(
                  "purchase-order",
                  "采购订单",
                  "#/supply-chain-management/purchase-management/purchase-execution/purchase-order",
                  "采购订单-列表.html",
                  [
                    {
                      id: "purchase-order-detail",
                      label: "采购订单详情",
                      route: "#/supply-chain-management/purchase-management/purchase-execution/purchase-order/detail",
                      page: "采购订单-详情.html"
                    }
                  ]
                ),
                leaf("purchase-order-change", "采购订单变更单", "#/supply-chain-management/purchase-management/purchase-execution/purchase-order-change"),
                leaf("purchase-receipt", "采购收货单", "#/supply-chain-management/purchase-management/purchase-execution/purchase-receipt"),
                leaf("purchase-inbound", "采购入库单", "#/supply-chain-management/purchase-management/purchase-execution/purchase-inbound"),
                leaf("purchase-acceptance", "采购验收单", "#/supply-chain-management/purchase-management/purchase-execution/purchase-acceptance")
              ]
            },
            {
              id: "purchase-return",
              label: "采购退货",
              items: [
                leaf("purchase-return-order", "采购退货单", "#/supply-chain-management/purchase-management/purchase-return/purchase-return-order"),
                leaf("purchase-return-request", "采购退申请单", "#/supply-chain-management/purchase-management/purchase-return/purchase-return-request"),
                leaf("purchase-replenishment-request", "采购补货申请单", "#/supply-chain-management/purchase-management/purchase-return/purchase-replenishment-request")
              ]
            },
            {
              id: "mrp-purchase-suggestion",
              label: "MRP采购建议",
              items: [
                leaf("purchase-request-pending", "采购申请待处理表", "#/supply-chain-management/purchase-management/mrp-purchase-suggestion/purchase-request-pending"),
                leaf("purchase-order-pending", "采购订单待处理表", "#/supply-chain-management/purchase-management/mrp-purchase-suggestion/purchase-order-pending")
              ]
            },
            {
              id: "purchase-detail-reports",
              label: "采购明细表",
              items: [
                leaf("purchase-order-top-10", "采购订单排名前10", "#/supply-chain-management/purchase-management/purchase-detail-reports/purchase-order-top-10"),
                leaf("purchase-request-detail", "采购申请明细表", "#/supply-chain-management/purchase-management/purchase-detail-reports/purchase-request-detail"),
                leaf("purchase-inbound-detail", "采购入库明细表", "#/supply-chain-management/purchase-management/purchase-detail-reports/purchase-inbound-detail"),
                leaf("purchase-order-change-detail", "采购订单变更明细表", "#/supply-chain-management/purchase-management/purchase-detail-reports/purchase-order-change-detail"),
                leaf("purchase-return-detail", "采购退货明细表", "#/supply-chain-management/purchase-management/purchase-detail-reports/purchase-return-detail"),
                leaf("purchase-application-detail", "采购申请明细表", "#/supply-chain-management/purchase-management/purchase-detail-reports/purchase-application-detail"),
                leaf("purchase-return-replenishment-detail", "采购退补货明细表", "#/supply-chain-management/purchase-management/purchase-detail-reports/purchase-return-replenishment-detail"),
                leaf("purchase-order-detail", "采购订单明细表", "#/supply-chain-management/purchase-management/purchase-detail-reports/purchase-order-detail"),
                leaf("purchase-receipt-detail", "采购收货明细表", "#/supply-chain-management/purchase-management/purchase-detail-reports/purchase-receipt-detail")
              ]
            }
          ]
        },
        {
          id: "sales-management",
          label: "销售管理",
          groups: [
            {
              id: "sales-execution",
              label: "销售执行",
              items: [
                leaf(
                  "sales-outbound-order",
                  "销售出库单",
                  "#/supply-chain-management/sales-management/sales-execution/sales-outbound-order",
                  "销售出库单-列表.html",
                  [
                    {
                      id: "sales-outbound-order-detail",
                      label: "销售出库单详情",
                      route: "#/supply-chain-management/sales-management/sales-execution/sales-outbound-order/detail",
                      page: "销售出库单-详情.html"
                    }
                  ]
                )
              ]
            }
          ]
        },
        leaf("consignment-management", "寄售管理", "#/supply-chain-management/consignment-management"),
        leaf("inventory-management", "库存管理", "#/supply-chain-management/inventory-management"),
        leaf("supply-chain-advanced-reports", "供应链高级报表", "#/supply-chain-management/supply-chain-advanced-reports"),
        leaf("supply-chain-warning-reports", "供应链预警表", "#/supply-chain-management/supply-chain-warning-reports")
      ]
    }
  ];
})();
