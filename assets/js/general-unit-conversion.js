(function () {
  "use strict";

  var STORAGE_VERSION = 2;
  var STORAGE_KEY = "smartone.general-unit-conversions.v2";
  var PAGE_SIZE = 10;
  var defaultRecords = [
    { id: "GUC-0013", sourceCoefficient: 1, sourceUnit: "千克", targetCoefficient: 1000, targetUnit: "克", conversionType: "固定", systemPreset: true, createdAt: "2026-08-03T09:12:00+08:00" },
    { id: "GUC-0012", sourceCoefficient: 1, sourceUnit: "吨", targetCoefficient: 1000, targetUnit: "千克", conversionType: "固定", systemPreset: true, createdAt: "2026-08-03T09:11:00+08:00" },
    { id: "GUC-0011", sourceCoefficient: 1, sourceUnit: "克", targetCoefficient: 1000, targetUnit: "毫克", conversionType: "固定", systemPreset: true, createdAt: "2026-08-03T09:10:00+08:00" },
    { id: "GUC-0010", sourceCoefficient: 1, sourceUnit: "千米", targetCoefficient: 1000, targetUnit: "米", conversionType: "固定", systemPreset: true, createdAt: "2026-08-03T09:09:00+08:00" },
    { id: "GUC-0009", sourceCoefficient: 1, sourceUnit: "米", targetCoefficient: 100, targetUnit: "厘米", conversionType: "固定", systemPreset: true, createdAt: "2026-08-03T09:08:00+08:00" },
    { id: "GUC-0008", sourceCoefficient: 1, sourceUnit: "米", targetCoefficient: 1000, targetUnit: "毫米", conversionType: "固定", systemPreset: true, createdAt: "2026-08-03T09:07:00+08:00" },
    { id: "GUC-0007", sourceCoefficient: 1, sourceUnit: "双", targetCoefficient: 2, targetUnit: "个", conversionType: "固定", systemPreset: true, createdAt: "2026-08-03T09:06:00+08:00" },
    { id: "GUC-0006", sourceCoefficient: 1, sourceUnit: "打", targetCoefficient: 12, targetUnit: "个", conversionType: "固定", systemPreset: true, createdAt: "2026-08-03T09:05:00+08:00" },
    { id: "GUC-0005", sourceCoefficient: 1, sourceUnit: "升", targetCoefficient: 1000, targetUnit: "毫升", conversionType: "固定", systemPreset: true, createdAt: "2026-08-03T09:04:00+08:00" },
    { id: "GUC-0004", sourceCoefficient: 1, sourceUnit: "分", targetCoefficient: 60, targetUnit: "秒", conversionType: "固定", systemPreset: true, createdAt: "2026-08-03T09:03:00+08:00" },
    { id: "GUC-0003", sourceCoefficient: 1, sourceUnit: "小时", targetCoefficient: 60, targetUnit: "分", conversionType: "固定", systemPreset: true, createdAt: "2026-08-03T09:02:00+08:00" },
    { id: "GUC-0002", sourceCoefficient: 1, sourceUnit: "平方米", targetCoefficient: 100, targetUnit: "平方分米", conversionType: "固定", systemPreset: true, createdAt: "2026-08-03T09:01:00+08:00" },
    { id: "GUC-0001", sourceCoefficient: 1, sourceUnit: "平方分米", targetCoefficient: 100, targetUnit: "平方厘米", conversionType: "固定", systemPreset: true, createdAt: "2026-08-03T09:00:00+08:00" }
  ];
  var units = [
    { code: "UNIT-EACH", name: "个", status: "启用" },
    { code: "UNIT-PAIR", name: "双", status: "启用" },
    { code: "UNIT-DOZEN", name: "打", status: "启用" },
    { code: "UNIT-G", name: "克", status: "启用" },
    { code: "UNIT-KG", name: "千克", status: "启用" },
    { code: "UNIT-MG", name: "毫克", status: "启用" },
    { code: "UNIT-T", name: "吨", status: "启用" },
    { code: "UNIT-KM", name: "千米", status: "启用" },
    { code: "UNIT-M", name: "米", status: "启用" },
    { code: "UNIT-CM", name: "厘米", status: "启用" },
    { code: "UNIT-MM", name: "毫米", status: "启用" },
    { code: "UNIT-ML", name: "毫升", status: "启用" },
    { code: "UNIT-L", name: "升", status: "启用" },
    { code: "UNIT-SEC", name: "秒", status: "启用" },
    { code: "UNIT-MIN", name: "分", status: "启用" },
    { code: "UNIT-HOUR", name: "小时", status: "启用" },
    { code: "UNIT-SQM", name: "平方米", status: "启用" },
    { code: "UNIT-SQDM", name: "平方分米", status: "启用" },
    { code: "UNIT-SQCM", name: "平方厘米", status: "启用" },
    { code: "UNIT-STOPPED", name: "停用单位", status: "停用" }
  ];

  var records = loadRecords();
  var editingId = "";
  var currentPage = 1;
  var selectedIds = new Set();
  var hiddenColumnIndexes = new Set();
  var activeRowMenu = null;
  var rowMenuCloseTimer = null;
  var activeFormReference = "";
  var activeQueryReference = "";
  var querySourceUnits = [];
  var queryTargetUnits = [];
  var draftQueryUnits = new Set();
  var pendingConfirmAction = null;
  var toastTimer = null;

  var modal = document.getElementById("detailModal");
  var form = document.getElementById("conversionForm");
  var tableBody = document.getElementById("conversionBody");
  var dialogTitle = document.getElementById("dialogTitle");
  var sourceCoefficientInput = document.getElementById("sourceCoefficientInput");
  var sourceUnitReference = document.getElementById("sourceUnitReference");
  var sourceUnitValue = document.getElementById("sourceUnitValue");
  var targetCoefficientInput = document.getElementById("targetCoefficientInput");
  var targetUnitReference = document.getElementById("targetUnitReference");
  var targetUnitValue = document.getElementById("targetUnitValue");
  var conversionTypeSelect = document.getElementById("conversionTypeSelect");
  var conversionTypeValue = conversionTypeSelect.querySelector("[data-pk-value]");
  var systemPresetInput = document.getElementById("systemPresetInput");
  var systemPresetText = document.getElementById("systemPresetText");
  var referencePopover = document.getElementById("conversionReferencePopover");
  var formErrorSummary = document.getElementById("formErrorSummary");
  var saveButton = form.querySelector('[type="submit"]');
  var selectedCount = document.getElementById("selectedCount");
  var totalCount = document.getElementById("totalCount");
  var selectAll = document.getElementById("selectAll");
  var successToast = document.getElementById("successToast");
  var keywordInput = document.getElementById("keywordInput");
  var querySourceUnitReference = document.getElementById("querySourceUnitReference");
  var queryTargetUnitReference = document.getElementById("queryTargetUnitReference");
  var querySourceUnitValue = document.getElementById("querySourceUnitValue");
  var queryTargetUnitValue = document.getElementById("queryTargetUnitValue");
  var queryConversionType = document.getElementById("queryConversionType");
  var querySystemPreset = document.getElementById("querySystemPreset");
  var queryConversionTypeSelect = document.getElementById("queryConversionTypeSelect");
  var querySystemPresetSelect = document.getElementById("querySystemPresetSelect");
  var queryReferencePopover = document.getElementById("queryReferencePopover");
  var searchRoot = document.querySelector(".ddp-search");
  var expandSearchButton = document.getElementById("expandSearchButton");
  var expandSearchText = document.getElementById("expandSearchText");
  var advancedSearchPanel = document.getElementById("advancedSearchPanel");
  var listViewSelect = document.getElementById("listViewSelect");
  var listViewInput = document.getElementById("listViewInput");
  var listViewDropdown = document.getElementById("listViewDropdown");
  var personalFilter = document.getElementById("personalFilter");
  var personalFilterButton = document.getElementById("personalFilterButton");
  var personalFilterPopover = document.getElementById("personalFilterPopover");
  var listTableShell = document.querySelector(".list-table-shell");
  var columnDisplayControl = document.getElementById("columnDisplayControl");
  var columnDisplayButton = document.getElementById("columnDisplayButton");
  var columnDisplayPopover = document.getElementById("columnDisplayPopover");
  var fullscreenButton = document.getElementById("fullscreenButton");
  var confirmModal = document.getElementById("confirmModal");
  var confirmTitle = document.getElementById("confirmTitle");
  var confirmMessage = document.getElementById("confirmMessage");
  var confirmActionButton = document.getElementById("confirmActionButton");
  var previousPageButton = document.getElementById("previousPageButton");
  var nextPageButton = document.getElementById("nextPageButton");
  var pageNumbers = document.getElementById("pageNumbers");
  var pagerInput = document.querySelector(".pager-input");

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeRecord(record, index) {
    var createdAt = record && record.createdAt ? new Date(record.createdAt) : null;
    return {
      id: String(record && record.id ? record.id : "GUC-LEGACY-" + String(index + 1).padStart(4, "0")),
      sourceCoefficient: Number(record && record.sourceCoefficient) || 1,
      sourceUnit: String(record && record.sourceUnit ? record.sourceUnit : ""),
      targetCoefficient: Number(record && record.targetCoefficient) || 1,
      targetUnit: String(record && record.targetUnit ? record.targetUnit : ""),
      conversionType: record && record.conversionType === "浮动" ? "浮动" : "固定",
      systemPreset: Boolean(record && record.systemPreset),
      createdAt: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.toISOString() : new Date(0).toISOString()
    };
  }

  function loadRecords() {
    try {
      var stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!stored || stored.version !== STORAGE_VERSION || !Array.isArray(stored.records)) return clone(defaultRecords);
      return stored.records.map(normalizeRecord).filter(function (record) {
        return record.sourceUnit && record.targetUnit;
      });
    } catch (error) {
      return clone(defaultRecords);
    }
  }

  function persistRecords() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, records: records }));
  }

  function sortRecords() {
    records.sort(function (left, right) {
      var createdDifference = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      return createdDifference || right.id.localeCompare(left.id, "zh-CN");
    });
  }

  function createId() {
    return "GUC-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 7).toUpperCase();
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeSearchValue(value) {
    return String(value || "").trim().toLocaleLowerCase("zh-CN");
  }

  function formatInteger(value) {
    return Number(value).toLocaleString("zh-CN", { maximumFractionDigits: 0 });
  }

  function getFilteredRecords() {
    var keyword = normalizeSearchValue(keywordInput.value);
    var conversionType = queryConversionType.value;
    var systemPreset = querySystemPreset.value;
    return records.filter(function (record) {
      var quickSearchText = normalizeSearchValue(record.sourceUnit + " " + record.targetUnit);
      if (keyword && !quickSearchText.includes(keyword)) return false;
      if (querySourceUnits.length && !querySourceUnits.includes(record.sourceUnit)) return false;
      if (queryTargetUnits.length && !queryTargetUnits.includes(record.targetUnit)) return false;
      if (conversionType && record.conversionType !== conversionType) return false;
      if (systemPreset && (record.systemPreset ? "是" : "否") !== systemPreset) return false;
      return true;
    });
  }

  function checkboxMarkup(recordId) {
    return '<label class="purchase-th-checkbox-wrap"><input class="purchase-th-checkbox-input row-checkbox" type="checkbox" data-record-id="' + escapeHtml(recordId) + '"' + (selectedIds.has(recordId) ? " checked" : "") + '><span class="purchase-th-checkbox-face" aria-hidden="true"></span></label>';
  }

  function rowActionMenuMarkup(recordId, visibleIndex) {
    var menuId = "row-action-menu-" + recordId;
    return [
      '<div class="dropdown_box_button sone-table-buttonList el-dropdown" data-row-menu>',
      '<span class="el-dropdown-link color-span menu-more el-dropdown-selfdefine" data-row-menu-trigger aria-label="第 ' + (visibleIndex + 1) + ' 行操作" aria-haspopup="menu" aria-expanded="false" aria-controls="' + menuId + '" role="button" tabindex="0">',
      '<button type="button" class="el-button el-button--text el-button--mini" tabindex="-1" aria-hidden="true"><span><i class="el-icon-more more-handel"></i></span></button>',
      '</span>',
      '<ul class="el-dropdown-menu el-popper el-dropdown-menu--mini" id="' + menuId + '" role="menu" aria-hidden="true" hidden>',
      '<li class="el-dropdown-menu__item sone-table-dropdown" role="none"><button type="button" role="menuitem" data-row-action="edit" data-record-id="' + escapeHtml(recordId) + '">编辑</button></li>',
      '<li class="el-dropdown-menu__item sone-table-dropdown" role="none"><button type="button" role="menuitem" data-row-action="delete" data-record-id="' + escapeHtml(recordId) + '">删除</button></li>',
      '</ul>',
      '</div>'
    ].join("");
  }

  function renderRows() {
    sortRecords();
    var filtered = getFilteredRecords();
    var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    currentPage = Math.min(Math.max(1, currentPage), totalPages);
    var offset = (currentPage - 1) * PAGE_SIZE;
    var pageRecords = filtered.slice(offset, offset + PAGE_SIZE);
    if (!pageRecords.length) {
      tableBody.innerHTML = '<tr class="table-empty"><td colspan="9">暂无符合条件的通用单位换算关系</td></tr>';
    } else {
      tableBody.innerHTML = pageRecords.map(function (record, index) {
        return [
          '<tr data-record-id="' + escapeHtml(record.id) + '">',
          '<td class="operation-cell">' + rowActionMenuMarkup(record.id, offset + index) + "</td>",
          '<td class="center">' + (offset + index + 1) + "</td>",
          '<td class="center">' + checkboxMarkup(record.id) + "</td>",
          '<td class="number">' + formatInteger(record.sourceCoefficient) + "</td>",
          '<td class="unit-name-cell"><button class="link-blue" type="button" data-detail-id="' + escapeHtml(record.id) + '">' + escapeHtml(record.sourceUnit) + "</button></td>",
          '<td class="number">' + formatInteger(record.targetCoefficient) + "</td>",
          '<td>' + escapeHtml(record.targetUnit) + "</td>",
          '<td>' + escapeHtml(record.conversionType) + "</td>",
          '<td class="center">' + (record.systemPreset ? '<span class="system-preset-check" aria-label="是">✓</span>' : '<span aria-label="否"></span>') + "</td>",
          "</tr>"
        ].join("");
      }).join("");
    }
    totalCount.textContent = "共 " + filtered.length + " 条";
    renderPagination(filtered.length, totalPages);
    applyColumnVisibility();
    syncSelectedCount(pageRecords);
  }

  function renderPagination(total, totalPages) {
    previousPageButton.disabled = currentPage <= 1;
    nextPageButton.disabled = currentPage >= totalPages || total === 0;
    pageNumbers.innerHTML = Array.from({ length: totalPages }, function (_, index) {
      var page = index + 1;
      return '<button class="pager-num' + (page === currentPage ? " active" : "") + '" type="button" data-page="' + page + '">' + page + "</button>";
    }).join("");
    pagerInput.value = String(currentPage);
  }

  function syncSelectedCount(pageRecords) {
    var visibleIds = pageRecords.map(function (record) { return record.id; });
    var visibleSelectedCount = visibleIds.filter(function (id) { return selectedIds.has(id); }).length;
    selectedCount.textContent = selectedIds.size;
    selectAll.checked = visibleIds.length > 0 && visibleSelectedCount === visibleIds.length;
    selectAll.indeterminate = visibleSelectedCount > 0 && visibleSelectedCount < visibleIds.length;
  }

  function applyColumnVisibility() {
    var table = document.querySelector(".conversion-table");
    table.querySelectorAll("col").forEach(function (column, index) {
      column.style.display = hiddenColumnIndexes.has(index) ? "none" : "";
    });
    table.querySelectorAll("thead th").forEach(function (cell, index) {
      cell.style.display = hiddenColumnIndexes.has(index) ? "none" : "";
    });
    table.querySelectorAll("tbody tr:not(.table-empty)").forEach(function (row) {
      Array.from(row.children).forEach(function (cell, index) {
        cell.style.display = hiddenColumnIndexes.has(index) ? "none" : "";
      });
    });
  }

  function setSearchExpanded(expanded) {
    searchRoot.classList.toggle("is-expanded", expanded);
    expandSearchButton.setAttribute("aria-expanded", String(expanded));
    advancedSearchPanel.setAttribute("aria-hidden", String(!expanded));
    expandSearchText.textContent = expanded ? "收起" : "展开";
  }

  function updateQueryReferenceDisplay(type) {
    var values = type === "source" ? querySourceUnits : queryTargetUnits;
    var element = type === "source" ? querySourceUnitValue : queryTargetUnitValue;
    var placeholder = type === "source" ? "请选择 源单位" : "请选择 目标单位名称";
    element.textContent = values.length ? values.join("、") : placeholder;
    element.classList.toggle("placeholder", !values.length);
  }

  function renderQueryReferenceOptions() {
    queryReferencePopover.querySelector("tbody").innerHTML = units.filter(function (unit) {
      return unit.status === "启用";
    }).map(function (unit) {
      var selected = draftQueryUnits.has(unit.name);
      return '<tr class="' + (selected ? "is-selected" : "") + '" data-query-unit="' + escapeHtml(unit.name) + '"><td><span class="query-reference-check">' + (selected ? "✓" : "") + '</span></td><td>' + escapeHtml(unit.code) + "</td><td>" + escapeHtml(unit.name) + "</td></tr>";
    }).join("");
  }

  function openQueryReference(type) {
    closeFormReference();
    activeQueryReference = type;
    draftQueryUnits = new Set(type === "source" ? querySourceUnits : queryTargetUnits);
    renderQueryReferenceOptions();
    var trigger = type === "source" ? querySourceUnitReference : queryTargetUnitReference;
    var rect = trigger.getBoundingClientRect();
    var width = Math.min(360, window.innerWidth - 24);
    queryReferencePopover.style.width = width + "px";
    queryReferencePopover.style.left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)) + "px";
    queryReferencePopover.style.top = rect.bottom + 8 + "px";
    queryReferencePopover.classList.add("is-open");
    queryReferencePopover.setAttribute("aria-hidden", "false");
    trigger.setAttribute("aria-expanded", "true");
  }

  function closeQueryReference() {
    queryReferencePopover.classList.remove("is-open");
    queryReferencePopover.setAttribute("aria-hidden", "true");
    querySourceUnitReference.setAttribute("aria-expanded", "false");
    queryTargetUnitReference.setAttribute("aria-expanded", "false");
    activeQueryReference = "";
  }

  function setDisplayValue(element, value, placeholder) {
    element.textContent = value || placeholder;
    element.classList.toggle("placeholder", !value);
  }

  function setConversionType(value) {
    var normalized = value === "浮动" ? "浮动" : "固定";
    conversionTypeValue.textContent = normalized;
    conversionTypeSelect.querySelectorAll(".pk-option").forEach(function (option) {
      option.classList.toggle("is-selected", option.dataset.value === normalized);
    });
    conversionTypeSelect.classList.remove("is-open");
  }

  function setSystemPreset(value) {
    systemPresetInput.checked = Boolean(value);
    systemPresetText.textContent = value ? "是" : "否";
  }

  function renderFormReferenceOptions(type) {
    var currentValue = type === "source" ? sourceUnitValue.textContent.trim() : targetUnitValue.textContent.trim();
    var candidates = units.filter(function (unit) {
      if (unit.status !== "启用") return false;
      return type !== "target" || sourceUnitValue.classList.contains("placeholder") || unit.name !== sourceUnitValue.textContent.trim();
    });
    referencePopover.querySelector("thead").innerHTML = "<tr><th>单位编码</th><th>单位名称</th><th>使用状态</th></tr>";
    referencePopover.querySelector("tbody").innerHTML = candidates.map(function (unit) {
      return '<tr class="' + (unit.name === currentValue ? "is-selected" : "") + '" data-unit-name="' + escapeHtml(unit.name) + '"><td>' + escapeHtml(unit.code) + "</td><td>" + escapeHtml(unit.name) + "</td><td>" + unit.status + "</td></tr>";
    }).join("");
  }

  function openFormReference(type) {
    closeQueryReference();
    activeFormReference = type;
    renderFormReferenceOptions(type);
    var trigger = type === "source" ? sourceUnitReference : targetUnitReference;
    var rect = trigger.getBoundingClientRect();
    var width = Math.min(480, window.innerWidth - 24);
    referencePopover.style.width = width + "px";
    referencePopover.style.left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)) + "px";
    referencePopover.style.top = rect.bottom + 10 + "px";
    referencePopover.classList.add("is-open");
    referencePopover.setAttribute("aria-hidden", "false");
    trigger.setAttribute("aria-expanded", "true");
  }

  function closeFormReference() {
    referencePopover.classList.remove("is-open");
    referencePopover.setAttribute("aria-hidden", "true");
    sourceUnitReference.setAttribute("aria-expanded", "false");
    targetUnitReference.setAttribute("aria-expanded", "false");
    activeFormReference = "";
  }

  function clearErrors() {
    form.querySelectorAll(".pk-field.has-error").forEach(function (field) {
      field.classList.remove("has-error");
    });
    formErrorSummary.hidden = true;
    formErrorSummary.textContent = "";
  }

  function setFieldError(fieldName, message) {
    var field = form.querySelector('[data-field="' + fieldName + '"]');
    if (!field) return;
    field.classList.add("has-error");
    var error = field.querySelector(".field-error");
    if (error) error.textContent = message;
  }

  function resetForm() {
    clearErrors();
    sourceCoefficientInput.value = "1";
    setDisplayValue(sourceUnitValue, "", "请选择源单位");
    targetCoefficientInput.value = "1";
    setDisplayValue(targetUnitValue, "", "请选择目标单位");
    setConversionType("固定");
    setSystemPreset(false);
  }

  function fillForm(record) {
    clearErrors();
    sourceCoefficientInput.value = String(record.sourceCoefficient);
    setDisplayValue(sourceUnitValue, record.sourceUnit, "请选择源单位");
    targetCoefficientInput.value = String(record.targetCoefficient);
    setDisplayValue(targetUnitValue, record.targetUnit, "请选择目标单位");
    setConversionType(record.conversionType);
    setSystemPreset(record.systemPreset);
  }

  function openDialog(recordId) {
    var record = records.find(function (item) { return item.id === recordId; });
    editingId = record ? record.id : "";
    dialogTitle.textContent = record ? "编辑通用单位换算" : "新增通用单位换算";
    if (record) fillForm(record);
    else resetForm();
    modal.classList.add("is-visible");
    modal.setAttribute("aria-hidden", "false");
    window.setTimeout(function () { sourceCoefficientInput.focus(); }, 0);
  }

  function closeDialog() {
    closeFormReference();
    conversionTypeSelect.classList.remove("is-open");
    modal.classList.remove("is-visible");
    modal.setAttribute("aria-hidden", "true");
    editingId = "";
  }

  function getFormData() {
    return {
      sourceCoefficient: sourceCoefficientInput.value.trim(),
      sourceUnit: sourceUnitValue.classList.contains("placeholder") ? "" : sourceUnitValue.textContent.trim(),
      targetCoefficient: targetCoefficientInput.value.trim(),
      targetUnit: targetUnitValue.classList.contains("placeholder") ? "" : targetUnitValue.textContent.trim(),
      conversionType: conversionTypeValue.textContent.trim(),
      systemPreset: systemPresetInput.checked
    };
  }

  function isPositiveInteger(value) {
    return /^[1-9]\d*$/.test(value);
  }

  function validateForm(data) {
    clearErrors();
    var errors = [];
    function addError(field, message) {
      errors.push({ field: field, message: message });
      if (!form.querySelector('[data-field="' + field + '"].has-error')) setFieldError(field, message);
    }
    if (!isPositiveInteger(data.sourceCoefficient)) addError("sourceCoefficient", "源单位换算系数必须大于0，请重新输入。");
    if (!data.sourceUnit) addError("sourceUnit", "请选择源单位");
    if (!isPositiveInteger(data.targetCoefficient)) addError("targetCoefficient", "目标单位换算系数必须大于0，请重新输入。");
    if (!data.targetUnit) addError("targetUnit", "请选择目标单位");
    if (!data.conversionType) addError("conversionType", "请选择换算类型");
    if (data.sourceUnit && data.targetUnit && data.sourceUnit === data.targetUnit) {
      addError("targetUnit", "源单位与目标单位不能相同，请重新选择。");
    }
    [
      { field: "sourceUnit", value: data.sourceUnit },
      { field: "targetUnit", value: data.targetUnit }
    ].forEach(function (item) {
      if (!item.value) return;
      var unit = units.find(function (candidate) { return candidate.name === item.value; });
      if (!unit || unit.status !== "启用") addError(item.field, "计量单位【" + item.value + "】已停用，请重新选择。");
    });
    if (data.sourceUnit && data.targetUnit && data.sourceUnit !== data.targetUnit && records.some(function (record) {
      if (record.id === editingId) return false;
      return (record.sourceUnit === data.sourceUnit && record.targetUnit === data.targetUnit) ||
        (record.sourceUnit === data.targetUnit && record.targetUnit === data.sourceUnit);
    })) {
      addError("targetUnit", "源单位【" + data.sourceUnit + "】与目标单位【" + data.targetUnit + "】之间已存在换算关系，请勿重复新增。");
    }
    if (!errors.length) return true;
    var uniqueMessages = errors.map(function (item) { return item.message; }).filter(function (message, index, values) {
      return values.indexOf(message) === index;
    });
    formErrorSummary.textContent = "请检查：" + uniqueMessages.join("；");
    formErrorSummary.hidden = false;
    var firstField = form.querySelector('[data-field="' + errors[0].field + '"]');
    var firstControl = firstField ? firstField.querySelector("input, button, [tabindex]") : null;
    if (firstControl) firstControl.focus();
    return false;
  }

  function setSaving(saving) {
    saveButton.disabled = saving;
    saveButton.textContent = saving ? "保存中..." : "保存";
  }

  function saveRecord(data) {
    var existing = records.find(function (record) { return record.id === editingId; });
    if (existing) {
      existing.sourceCoefficient = Number(data.sourceCoefficient);
      existing.sourceUnit = data.sourceUnit;
      existing.targetCoefficient = Number(data.targetCoefficient);
      existing.targetUnit = data.targetUnit;
      existing.conversionType = data.conversionType;
    } else {
      records.push({
        id: createId(),
        sourceCoefficient: Number(data.sourceCoefficient),
        sourceUnit: data.sourceUnit,
        targetCoefficient: Number(data.targetCoefficient),
        targetUnit: data.targetUnit,
        conversionType: data.conversionType,
        systemPreset: false,
        createdAt: new Date().toISOString()
      });
    }
    sortRecords();
    persistRecords();
    currentPage = 1;
    selectedIds.clear();
    renderRows();
    closeDialog();
    showToast("操作成功", "success");
  }

  function showToast(message, type, duration) {
    successToast.textContent = message;
    successToast.classList.toggle("is-error", type === "error");
    successToast.classList.toggle("is-warning", type === "warning");
    successToast.setAttribute("role", type === "error" ? "alert" : "status");
    successToast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { successToast.hidden = true; }, duration || 2200);
  }

  function openConfirm(action) {
    pendingConfirmAction = action;
    confirmTitle.textContent = "操作确认";
    confirmMessage.textContent = "单位换算关系删除后不可恢复，是否确认删除？";
    confirmActionButton.textContent = "确认";
    confirmModal.classList.add("is-visible");
    confirmModal.setAttribute("aria-hidden", "false");
    window.setTimeout(function () { confirmActionButton.focus(); }, 0);
  }

  function closeConfirm() {
    pendingConfirmAction = null;
    confirmModal.classList.remove("is-visible");
    confirmModal.setAttribute("aria-hidden", "true");
  }

  function requestDelete(recordId) {
    var record = records.find(function (item) { return item.id === recordId; });
    if (!record) return;
    if (record.systemPreset) {
      showToast("系统预设的单位换算关系不允许删除", "error", 3200);
      return;
    }
    openConfirm(function () {
      records = records.filter(function (item) { return item.id !== recordId; });
      selectedIds.delete(recordId);
      persistRecords();
      renderRows();
      showToast("操作成功", "success");
    });
  }

  function requestBatchDelete() {
    if (!selectedIds.size) {
      showToast("请至少选择一条数据。", "warning");
      return;
    }
    var selectedRecords = records.filter(function (record) { return selectedIds.has(record.id); });
    if (selectedRecords.some(function (record) { return record.systemPreset; })) {
      showToast("系统预设的单位换算关系不允许删除", "error", 3200);
      return;
    }
    openConfirm(function () {
      records = records.filter(function (record) { return !selectedIds.has(record.id); });
      selectedIds.clear();
      persistRecords();
      renderRows();
      showToast("操作成功", "success");
    });
  }

  function closeRowMenu() {
    window.clearTimeout(rowMenuCloseTimer);
    rowMenuCloseTimer = null;
    if (!activeRowMenu) return;
    var trigger = activeRowMenu.querySelector("[data-row-menu-trigger]");
    var menu = activeRowMenu.querySelector(".el-dropdown-menu");
    activeRowMenu.classList.remove("is-open");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
    if (menu) {
      menu.hidden = true;
      menu.setAttribute("aria-hidden", "true");
      menu.style.left = "";
      menu.style.top = "";
    }
    activeRowMenu = null;
  }

  function positionRowMenu(dropdown) {
    var trigger = dropdown.querySelector("[data-row-menu-trigger]");
    var menu = dropdown.querySelector(".el-dropdown-menu");
    if (!trigger || !menu) return;
    var triggerRect = trigger.getBoundingClientRect();
    var menuRect = menu.getBoundingClientRect();
    var left = Math.max(8, Math.min(triggerRect.left, window.innerWidth - menuRect.width - 8));
    var top = triggerRect.bottom + 4;
    if (top + menuRect.height > window.innerHeight - 8) top = triggerRect.top - menuRect.height - 4;
    menu.style.left = left + "px";
    menu.style.top = Math.max(8, top) + "px";
  }

  function openRowMenu(dropdown, focusFirstItem) {
    if (!dropdown) return;
    if (activeRowMenu !== dropdown) closeRowMenu();
    window.clearTimeout(rowMenuCloseTimer);
    activeRowMenu = dropdown;
    var trigger = dropdown.querySelector("[data-row-menu-trigger]");
    var menu = dropdown.querySelector(".el-dropdown-menu");
    dropdown.classList.add("is-open");
    if (trigger) trigger.setAttribute("aria-expanded", "true");
    if (menu) {
      menu.hidden = false;
      menu.setAttribute("aria-hidden", "false");
      positionRowMenu(dropdown);
      if (focusFirstItem) {
        var firstItem = menu.querySelector('[role="menuitem"]');
        if (firstItem) firstItem.focus();
      }
    }
  }

  function scheduleRowMenuClose() {
    window.clearTimeout(rowMenuCloseTimer);
    rowMenuCloseTimer = window.setTimeout(closeRowMenu, 140);
  }

  function setQuerySelect(select, input, value) {
    var normalized = String(value || "");
    input.value = normalized;
    select.querySelector("[data-pk-value]").textContent = normalized || "全部";
    select.querySelectorAll(".pk-option").forEach(function (option) {
      var selected = option.dataset.value === normalized;
      option.classList.toggle("is-selected", selected);
      option.setAttribute("aria-selected", String(selected));
      option.tabIndex = selected ? 0 : -1;
    });
    select.classList.remove("is-open");
    select.querySelector(".pk-select-trigger").setAttribute("aria-expanded", "false");
  }

  function closeQuerySelects() {
    [queryConversionTypeSelect, querySystemPresetSelect].forEach(function (select) {
      select.classList.remove("is-open");
      select.querySelector(".pk-select-trigger").setAttribute("aria-expanded", "false");
    });
  }

  function bindQuerySelect(select, input) {
    select.addEventListener("click", function (event) {
      event.stopPropagation();
      var option = event.target.closest(".pk-option");
      if (option) {
        setQuerySelect(select, input, option.dataset.value);
        return;
      }
      if (!event.target.closest(".pk-select-trigger") && !event.target.closest(".pk-caret")) return;
      var opening = !select.classList.contains("is-open");
      closeQuerySelects();
      select.classList.toggle("is-open", opening);
      select.querySelector(".pk-select-trigger").setAttribute("aria-expanded", String(opening));
    });
  }

  function setTableFullscreen(active) {
    listTableShell.classList.toggle("is-fullscreen", active);
    document.body.classList.toggle("table-fullscreen-active", active);
    fullscreenButton.setAttribute("aria-pressed", String(active));
    fullscreenButton.textContent = active ? "退出全屏" : "全屏";
  }

  function closeListViewDropdown() {
    listViewDropdown.hidden = true;
    listViewDropdown.setAttribute("aria-hidden", "true");
    listViewInput.setAttribute("aria-expanded", "false");
  }

  function closePersonalFilter() {
    personalFilterPopover.hidden = true;
    personalFilterPopover.setAttribute("aria-hidden", "true");
    personalFilterButton.setAttribute("aria-expanded", "false");
  }

  function closeColumnDisplay() {
    columnDisplayPopover.hidden = true;
    columnDisplayPopover.setAttribute("aria-hidden", "true");
    columnDisplayButton.setAttribute("aria-expanded", "false");
  }

  document.getElementById("createButton").addEventListener("click", function () { openDialog(); });
  document.getElementById("closeDialogButton").addEventListener("click", closeDialog);
  document.getElementById("cancelButton").addEventListener("click", closeDialog);
  document.getElementById("batchDeleteButton").addEventListener("click", requestBatchDelete);
  document.getElementById("searchButton").addEventListener("click", function () {
    currentPage = 1;
    selectedIds.clear();
    renderRows();
  });
  document.getElementById("resetButton").addEventListener("click", function () {
    keywordInput.value = "";
    querySourceUnits = [];
    queryTargetUnits = [];
    setQuerySelect(queryConversionTypeSelect, queryConversionType, "");
    setQuerySelect(querySystemPresetSelect, querySystemPreset, "");
    updateQueryReferenceDisplay("source");
    updateQueryReferenceDisplay("target");
    currentPage = 1;
    selectedIds.clear();
    renderRows();
  });
  document.getElementById("refreshButton").addEventListener("click", function () {
    records = loadRecords();
    currentPage = 1;
    selectedIds.clear();
    renderRows();
  });
  expandSearchButton.addEventListener("click", function () {
    setSearchExpanded(!searchRoot.classList.contains("is-expanded"));
  });
  keywordInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      currentPage = 1;
      selectedIds.clear();
      renderRows();
    }
  });
  querySourceUnitReference.addEventListener("click", function () { openQueryReference("source"); });
  queryTargetUnitReference.addEventListener("click", function () { openQueryReference("target"); });
  querySourceUnitReference.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openQueryReference("source"); }
  });
  queryTargetUnitReference.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openQueryReference("target"); }
  });
  bindQuerySelect(queryConversionTypeSelect, queryConversionType);
  bindQuerySelect(querySystemPresetSelect, querySystemPreset);
  queryReferencePopover.addEventListener("click", function (event) {
    event.stopPropagation();
    var row = event.target.closest("[data-query-unit]");
    if (!row) return;
    var value = row.dataset.queryUnit;
    if (draftQueryUnits.has(value)) draftQueryUnits.delete(value);
    else draftQueryUnits.add(value);
    renderQueryReferenceOptions();
  });
  document.getElementById("clearQueryReferenceButton").addEventListener("click", function () {
    draftQueryUnits.clear();
    renderQueryReferenceOptions();
  });
  document.getElementById("confirmQueryReferenceButton").addEventListener("click", function () {
    if (activeQueryReference === "source") querySourceUnits = Array.from(draftQueryUnits);
    if (activeQueryReference === "target") queryTargetUnits = Array.from(draftQueryUnits);
    updateQueryReferenceDisplay(activeQueryReference);
    closeQueryReference();
  });
  sourceUnitReference.addEventListener("click", function () { openFormReference("source"); });
  targetUnitReference.addEventListener("click", function () { openFormReference("target"); });
  sourceUnitReference.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openFormReference("source"); }
  });
  targetUnitReference.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openFormReference("target"); }
  });
  referencePopover.addEventListener("click", function (event) {
    var row = event.target.closest("[data-unit-name]");
    if (!row) return;
    var value = row.dataset.unitName;
    if (activeFormReference === "source") setDisplayValue(sourceUnitValue, value, "请选择源单位");
    if (activeFormReference === "target") setDisplayValue(targetUnitValue, value, "请选择目标单位");
    closeFormReference();
    clearErrors();
  });
  conversionTypeSelect.querySelector(".pk-select-trigger").addEventListener("click", function (event) {
    event.stopPropagation();
    conversionTypeSelect.classList.toggle("is-open");
  });
  conversionTypeSelect.querySelectorAll(".pk-option").forEach(function (option) {
    option.addEventListener("click", function () { setConversionType(option.dataset.value); });
  });
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (saveButton.disabled) return;
    var data = getFormData();
    if (!validateForm(data)) return;
    setSaving(true);
    window.setTimeout(function () {
      saveRecord(data);
      setSaving(false);
    }, 180);
  });
  tableBody.addEventListener("click", function (event) {
    var detailLink = event.target.closest("[data-detail-id]");
    if (detailLink) {
      sessionStorage.setItem("smartone.general-unit-conversion.current-record-id", detailLink.dataset.detailId);
      return;
    }
    var rowMenuTrigger = event.target.closest("[data-row-menu-trigger]");
    if (rowMenuTrigger) {
      event.preventDefault();
      event.stopPropagation();
      openRowMenu(rowMenuTrigger.closest("[data-row-menu]"), false);
      return;
    }
    var action = event.target.closest("[data-row-action]");
    if (action) {
      closeRowMenu();
      if (action.dataset.rowAction === "edit") openDialog(action.dataset.recordId);
      if (action.dataset.rowAction === "delete") requestDelete(action.dataset.recordId);
      return;
    }
  });
  tableBody.addEventListener("mouseover", function (event) {
    var dropdown = event.target.closest("[data-row-menu]");
    if (!dropdown || dropdown.contains(event.relatedTarget)) return;
    openRowMenu(dropdown, false);
  });
  tableBody.addEventListener("mouseout", function (event) {
    var dropdown = event.target.closest("[data-row-menu]");
    if (!dropdown || dropdown.contains(event.relatedTarget)) return;
    scheduleRowMenuClose();
  });
  tableBody.addEventListener("keydown", function (event) {
    var detailLink = event.target.closest("[data-detail-id]");
    if (!detailLink || (event.key !== "Enter" && event.key !== " ")) return;
    sessionStorage.setItem("smartone.general-unit-conversion.current-record-id", detailLink.dataset.detailId);
  });
  tableBody.addEventListener("change", function (event) {
    if (!event.target.classList.contains("row-checkbox")) return;
    if (event.target.checked) selectedIds.add(event.target.dataset.recordId);
    else selectedIds.delete(event.target.dataset.recordId);
    renderRows();
  });
  selectAll.addEventListener("change", function () {
    var visible = getFilteredRecords().slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    visible.forEach(function (record) {
      if (selectAll.checked) selectedIds.add(record.id);
      else selectedIds.delete(record.id);
    });
    renderRows();
  });
  previousPageButton.addEventListener("click", function () {
    if (currentPage <= 1) return;
    currentPage -= 1;
    renderRows();
  });
  nextPageButton.addEventListener("click", function () {
    var totalPages = Math.max(1, Math.ceil(getFilteredRecords().length / PAGE_SIZE));
    if (currentPage >= totalPages) return;
    currentPage += 1;
    renderRows();
  });
  pageNumbers.addEventListener("click", function (event) {
    var button = event.target.closest("[data-page]");
    if (!button) return;
    currentPage = Number(button.dataset.page);
    renderRows();
  });
  pagerInput.addEventListener("keydown", function (event) {
    if (event.key !== "Enter") return;
    var totalPages = Math.max(1, Math.ceil(getFilteredRecords().length / PAGE_SIZE));
    var nextPage = Math.min(totalPages, Math.max(1, Number.parseInt(pagerInput.value, 10) || 1));
    currentPage = nextPage;
    renderRows();
  });
  columnDisplayButton.addEventListener("click", function (event) {
    event.stopPropagation();
    var opening = columnDisplayPopover.hidden;
    closeColumnDisplay();
    if (opening) {
      columnDisplayPopover.hidden = false;
      columnDisplayPopover.setAttribute("aria-hidden", "false");
      columnDisplayButton.setAttribute("aria-expanded", "true");
    }
  });
  columnDisplayPopover.addEventListener("change", function (event) {
    if (!event.target.matches("[data-column-index]")) return;
    var index = Number(event.target.dataset.columnIndex);
    if (event.target.checked) hiddenColumnIndexes.delete(index);
    else hiddenColumnIndexes.add(index);
    applyColumnVisibility();
  });
  fullscreenButton.addEventListener("click", function () {
    setTableFullscreen(!listTableShell.classList.contains("is-fullscreen"));
  });
  listViewInput.addEventListener("click", function () {
    var opening = listViewDropdown.hidden;
    closeListViewDropdown();
    if (opening) {
      listViewDropdown.hidden = false;
      listViewDropdown.setAttribute("aria-hidden", "false");
      listViewInput.setAttribute("aria-expanded", "true");
    }
  });
  listViewDropdown.addEventListener("click", function (event) {
    var option = event.target.closest("[data-list-view-label]");
    if (!option) return;
    listViewInput.value = option.dataset.listViewLabel;
    closeListViewDropdown();
  });
  personalFilterButton.addEventListener("click", function () {
    var opening = personalFilterPopover.hidden;
    closePersonalFilter();
    if (opening) {
      personalFilterPopover.hidden = false;
      personalFilterPopover.setAttribute("aria-hidden", "false");
      personalFilterButton.setAttribute("aria-expanded", "true");
    }
  });
  document.getElementById("closeConfirmButton").addEventListener("click", closeConfirm);
  document.getElementById("cancelConfirmButton").addEventListener("click", closeConfirm);
  confirmActionButton.addEventListener("click", function () {
    var action = pendingConfirmAction;
    closeConfirm();
    if (action) action();
  });
  modal.addEventListener("click", function (event) {
    if (event.target === modal) closeDialog();
  });
  confirmModal.addEventListener("click", function (event) {
    if (event.target === confirmModal) closeConfirm();
  });
  document.addEventListener("click", function (event) {
    if (!event.target.closest("[data-row-menu]")) closeRowMenu();
    if (!event.target.closest("#columnDisplayControl")) closeColumnDisplay();
    if (!event.target.closest("#listViewSelect")) closeListViewDropdown();
    if (!event.target.closest("#personalFilter")) closePersonalFilter();
    if (!event.target.closest("#queryReferencePopover") && !event.target.closest("[data-query-reference]")) closeQueryReference();
    if (!event.target.closest("#queryConversionTypeSelect") && !event.target.closest("#querySystemPresetSelect")) closeQuerySelects();
    if (!event.target.closest("#conversionReferencePopover") && !event.target.closest("[data-conversion-reference]")) closeFormReference();
    if (!event.target.closest("#conversionTypeSelect")) conversionTypeSelect.classList.remove("is-open");
  });
  document.addEventListener("keydown", function (event) {
    var rowMenuTrigger = event.target.closest("[data-row-menu-trigger]");
    if (rowMenuTrigger && ["Enter", " ", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      openRowMenu(rowMenuTrigger.closest("[data-row-menu]"), event.key === "ArrowDown");
      return;
    }
    if (event.key !== "Escape") return;
    if (confirmModal.classList.contains("is-visible")) { closeConfirm(); return; }
    if (queryReferencePopover.classList.contains("is-open")) { closeQueryReference(); return; }
    if (referencePopover.classList.contains("is-open")) { closeFormReference(); return; }
    if (activeRowMenu) { closeRowMenu(); return; }
    closeQuerySelects();
    if (modal.classList.contains("is-visible")) closeDialog();
  });
  document.querySelector(".purchase-table-wrap").addEventListener("scroll", closeRowMenu);
  window.addEventListener("resize", function () {
    closeRowMenu();
    closeQueryReference();
    closeFormReference();
    closeListViewDropdown();
    closePersonalFilter();
    closeColumnDisplay();
  });

  sortRecords();
  persistRecords();
  setSearchExpanded(false);
  updateQueryReferenceDisplay("source");
  updateQueryReferenceDisplay("target");
  setQuerySelect(queryConversionTypeSelect, queryConversionType, "");
  setQuerySelect(querySystemPresetSelect, querySystemPreset, "");
  setTableFullscreen(false);
  closeListViewDropdown();
  closePersonalFilter();
  closeColumnDisplay();
  renderRows();
})();
