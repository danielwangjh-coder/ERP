(function () {
  function markReady(element, key) {
    if (!element || element.dataset[key] === "true") return false;
    element.dataset[key] = "true";
    return true;
  }

  function closeDropdowns(except) {
    document.querySelectorAll(".pk-select.is-open, .pk-cascader.is-open").forEach(function (box) {
      if (box !== except) box.classList.remove("is-open");
    });
  }

  function closeReferencePopover() {
    var popover = document.querySelector("[data-pk-reference-popover]");
    if (popover) {
      popover.classList.remove("is-open");
      popover.setAttribute("aria-hidden", "true");
    }
    document.querySelectorAll("[data-pk-reference-trigger]").forEach(function (trigger) {
      trigger.setAttribute("aria-expanded", "false");
    });
  }

  function closeDatePanel() {
    var panel = document.querySelector("[data-pk-date-panel]");
    if (panel) {
      panel.classList.remove("is-open");
      panel.setAttribute("aria-hidden", "true");
    }
    document.querySelectorAll(".pk-date-input-shell").forEach(function (input) {
      input.classList.remove("is-open");
      input.setAttribute("aria-expanded", "false");
    });
  }

  function initTextarea(root) {
    root.querySelectorAll("[data-pk-count]").forEach(function (textarea) {
      var shell = textarea.closest(".pk-textarea-wrap, .pk-textarea-shell");
      var count = shell ? shell.querySelector(".pk-textarea-count") : null;
      var update = function () {
        if (!count) return;
        var max = Number(textarea.getAttribute("maxlength")) || 255;
        count.textContent = textarea.value.length + "/" + max;
      };
      if (markReady(textarea, "pkCountReady")) {
        textarea.addEventListener("input", update);
      }
      update();
    });
  }

  function initClearableInputs(root) {
    var getValueNode = function (shell) {
      return shell.querySelector(".pk-shell-input, .pk-textarea-input, [data-pk-date-value], .value");
    };

    var hasValue = function (shell) {
      var node = getValueNode(shell);
      if (!node) return false;
      if (node.matches && node.matches("input, textarea")) return node.value.trim() !== "";
      return !node.classList.contains("placeholder") && node.textContent.trim() !== "";
    };

    var update = function (shell) {
      shell.classList.toggle("has-clear-value", hasValue(shell));
    };

    root.querySelectorAll(".pk-input-shell, .pk-textarea-shell").forEach(function (shell) {
      if (shell.classList.contains("is-disabled")) return;
      var node = getValueNode(shell);
      if (!node) return;
      if (node.classList && node.classList.contains("placeholder") && !node.dataset.pkPlaceholder) {
        node.dataset.pkPlaceholder = node.textContent.trim();
      }

      var button = shell.querySelector(".input-clear-btn");
      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "input-clear-btn";
        button.setAttribute("aria-label", "清除");
        button.setAttribute("title", "清除");
        var suffix = shell.querySelector(".suffix-button");
        if (suffix) shell.insertBefore(button, suffix);
        else shell.appendChild(button);
      }
      shell.classList.add("is-clearable");

      if (markReady(shell, "pkClearableReady") && node.matches && node.matches("input, textarea")) {
        node.addEventListener("input", function () {
          update(shell);
        });
      }

      if (markReady(button, "pkClearButtonReady")) {
        button.addEventListener("click", function (event) {
          event.preventDefault();
          event.stopPropagation();
          if (node.matches && node.matches("input, textarea")) {
            node.value = "";
            node.dispatchEvent(new Event("input", { bubbles: true }));
            node.focus();
          } else {
            var placeholder = node.dataset.pkPlaceholder || "";
            node.textContent = placeholder;
            node.classList.toggle("placeholder", placeholder !== "");
          }
          update(shell);
          closeReferencePopover();
          closeDatePanel();
          if (!(node.matches && node.matches("input, textarea"))) shell.focus();
        });
      }

      update(shell);
    });
  }

  function initNumericInputs(root) {
    var sanitizeDecimal = function (value, scale) {
      var sanitized = String(value || "").replace(/[^\d.]/g, "");
      var firstDot = sanitized.indexOf(".");
      if (firstDot !== -1) {
        sanitized = sanitized.slice(0, firstDot + 1) + sanitized.slice(firstDot + 1).replace(/\./g, "");
      }
      if (scale !== null && firstDot !== -1) {
        var parts = sanitized.split(".");
        sanitized = parts[0] + "." + parts[1].slice(0, scale);
      }
      return sanitized;
    };

    root.querySelectorAll("[data-pk-numeric]").forEach(function (input) {
      var scaleAttr = input.getAttribute("data-pk-decimal-scale");
      var scale = scaleAttr === null ? null : Number(scaleAttr);
      if (!Number.isFinite(scale)) scale = null;

      if (markReady(input, "pkNumericReady")) {
        input.addEventListener("beforeinput", function (event) {
          if (!event.data || event.inputType.indexOf("insert") !== 0) return;
          var start = input.selectionStart || 0;
          var end = input.selectionEnd || start;
          var next = input.value.slice(0, start) + event.data + input.value.slice(end);
          if (sanitizeDecimal(next, scale) !== next) event.preventDefault();
        });

        input.addEventListener("input", function () {
          var next = sanitizeDecimal(input.value, scale);
          if (input.value !== next) input.value = next;
        });
      }
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  function initSelect(root) {
    root.querySelectorAll(".pk-select, .pk-cascader").forEach(function (box) {
      if (!markReady(box, "pkSelectReady")) return;
      var trigger = box.querySelector(".pk-select-trigger, .pk-cascader-trigger");
      var label = box.querySelector("[data-pk-value]");
      if (!trigger) return;
      trigger.addEventListener("click", function (event) {
        event.stopPropagation();
        var open = !box.classList.contains("is-open");
        closeDropdowns(box);
        box.classList.toggle("is-open", open);
      });
      box.querySelectorAll(".pk-option").forEach(function (option) {
        option.addEventListener("click", function (event) {
          event.stopPropagation();
          box.querySelectorAll(".pk-option").forEach(function (item) {
            item.classList.remove("is-selected");
          });
          option.classList.add("is-selected");
          if (label) label.textContent = option.textContent.trim();
          box.classList.remove("is-open");
        });
      });
    });
  }

  function initReference(root) {
    var popover = document.querySelector("[data-pk-reference-popover]");
    if (!popover) return;
    var popoverTable = popover.querySelector("table");
    var popoverHead = popover.querySelector("thead");
    var popoverBody = popover.querySelector("tbody");

    var referenceData = {
      sourceType: {
        valueKey: "name",
        columns: [
          { key: "seq", label: "序号", width: "70px" },
          { key: "name", label: "类型名称", width: "220px" }
        ],
        rows: [
          { seq: "1", name: "手工创建" },
          { seq: "2", name: "销售订单" }
        ]
      },
      businessType: {
        valueKey: "name",
        columns: [
          { key: "seq", label: "序号", width: "70px" },
          { key: "name", label: "类型名称", width: "220px" }
        ],
        rows: [
          { seq: "1", name: "默认类型" }
        ]
      },
      customer: {
        valueKey: "code",
        columns: [
          { key: "seq", label: "序号", width: "70px" },
          { key: "code", label: "客户编码", width: "220px" },
          { key: "name", label: "客户全名称", width: "260px" },
          { key: "short", label: "客户简称", width: "220px" },
          { key: "mnemonic", label: "助记码", width: "190px" }
        ],
        rows: [
          { seq: "1", code: "20221212-000001", name: "线索转换2条跟进测试客户", short: "", mnemonic: "" },
          { seq: "2", code: "20230103-000001", name: "okk客户", short: "", mnemonic: "OKK" }
        ]
      },
      salesOrg: {
        valueKey: "name",
        columns: [
          { key: "seq", label: "序号", width: "70px" },
          { key: "code", label: "销售组织编码", width: "300px" },
          { key: "name", label: "销售组织名称", width: "300px" },
          { key: "mnemonic", label: "助记码", width: "230px" }
        ],
        rows: [
          { seq: "1", code: "20230113-000006", name: "产品验收专用勿动！！", mnemonic: "" },
          { seq: "2", code: "SO-EAST", name: "华东销售组织", mnemonic: "HDSX" }
        ]
      },
      salesChannel: {
        valueKey: "name",
        columns: [
          { key: "seq", label: "序号", width: "70px" },
          { key: "code", label: "销售渠道编码", width: "300px" },
          { key: "name", label: "销售渠道名称", width: "300px" },
          { key: "mnemonic", label: "助记码", width: "230px" }
        ],
        rows: [
          { seq: "1", code: "20230112-000008", name: "产品验收专用勿动！！", mnemonic: "CPYSZYWD！！" },
          { seq: "2", code: "CH001", name: "直销", mnemonic: "ZX" }
        ]
      },
      keeper: {
        valueKey: "name",
        columns: [
          { key: "seq", label: "序号", width: "70px" },
          { key: "code", label: "用户编码", width: "220px" },
          { key: "name", label: "用户姓名", width: "220px" },
          { key: "org", label: "所属组织", width: "220px" },
          { key: "dept", label: "所属部门", width: "220px" }
        ],
        rows: [
          { seq: "1", code: "20230704-000001", name: "L-回归0704", org: "安琪酵母股份有限公司", dept: "工程设计部" },
          { seq: "2", code: "20230808000048", name: "姚琦", org: "安琪酵母股份有限公司", dept: "人力行政部" }
        ]
      },
      keeperDept: {
        valueKey: "name",
        columns: [
          { key: "seq", label: "序号", width: "70px" },
          { key: "code", label: "组织编码", width: "220px" },
          { key: "name", label: "组织名称", width: "220px" },
          { key: "short", label: "组织简称", width: "220px" },
          { key: "parent", label: "上级组织", width: "230px" }
        ],
        rows: [
          { seq: "1", code: "20231102000117", name: "工程设计部", short: "工程1部", parent: "安琪酵母股份有限公司" },
          { seq: "2", code: "20231102000119", name: "人力行政部", short: "", parent: "安琪酵母股份有限公司" }
        ]
      },
      materialCode: {
        valueKey: "materialCode",
        columns: [
          { key: "seq", label: "序号", width: "70px" },
          { key: "materialCode", label: "物料编码", width: "180px" },
          { key: "materialName", label: "物料名称", width: "240px" },
          { key: "spec", label: "规格", width: "180px" },
          { key: "model", label: "型号", width: "160px" }
        ],
        rows: [
          { seq: "1", materialCode: "000000", materialName: "yyy-测试物料", spec: "规格", model: "型号" },
          { seq: "2", materialCode: "000001", materialName: "测试物料0516", spec: "12", model: "252" }
        ]
      },
      warehouse: {
        valueKey: "warehouse",
        columns: [
          { key: "seq", label: "序号", width: "70px" },
          { key: "warehouseCode", label: "仓库编码", width: "180px" },
          { key: "warehouse", label: "仓库名称", width: "220px" },
          { key: "mnemonic", label: "助记码", width: "160px" }
        ],
        rows: [
          { seq: "1", warehouseCode: "000001", warehouse: "普通仓库", mnemonic: "PTCK" },
          { seq: "2", warehouseCode: "000000", warehouse: "库位仓库", mnemonic: "CSKWCK" }
        ]
      },
      location: {
        valueKey: "location",
        columns: [
          { key: "seq", label: "序号", width: "70px" },
          { key: "location", label: "库位编码", width: "180px" },
          { key: "locationName", label: "库位名称", width: "220px" },
          { key: "warehouse", label: "所属仓库", width: "220px" }
        ],
        rows: [
          { seq: "1", location: "000000", locationName: "库位1", warehouse: "库位仓库" },
          { seq: "2", location: "000013", locationName: "1", warehouse: "库位仓库" }
        ]
      },
      relatedCustomer: {
        valueKey: "relatedCustomer",
        columns: [
          { key: "seq", label: "序号", width: "70px" },
          { key: "customerCode", label: "客户编码", width: "190px" },
          { key: "relatedCustomer", label: "客户名称", width: "240px" },
          { key: "customerShortName", label: "客户简称", width: "220px" },
          { key: "mnemonic", label: "助记码", width: "180px" }
        ],
        rows: [
          { seq: "1", customerCode: "000000", relatedCustomer: "yyy-测试客户", customerShortName: "", mnemonic: "YYY-CSKH" },
          { seq: "2", customerCode: "", relatedCustomer: "AI客户接口测试052", customerShortName: "AI客户0451", mnemonic: "" }
        ]
      },
      task: {
        valueKey: "task",
        columns: [
          { key: "seq", label: "序号", width: "70px" },
          { key: "task", label: "名称", width: "180px" },
          { key: "status", label: "状态", width: "160px" },
          { key: "owner", label: "负责人", width: "160px" },
          { key: "stage", label: "所属阶段", width: "180px" },
          { key: "project", label: "所属项目", width: "180px" }
        ],
        rows: [
          { seq: "1", task: "1", status: "未开始", owner: "", stage: "需求检讨", project: "test0622-1" },
          { seq: "2", task: "子A", status: "未开始", owner: "", stage: "任务验证", project: "test0619" }
        ]
      },
      stage: {
        valueKey: "stage",
        columns: [
          { key: "seq", label: "序号", width: "70px" },
          { key: "stage", label: "阶段名称", width: "220px" },
          { key: "status", label: "状态", width: "180px" },
          { key: "project", label: "所属项目", width: "220px" }
        ],
        rows: [
          { seq: "1", stage: "需求检讨", status: "未开始", project: "test0618" },
          { seq: "2", stage: "任务验证", status: "进行中", project: "test0619" }
        ]
      },
      project: {
        valueKey: "project",
        columns: [
          { key: "seq", label: "序号", width: "70px" },
          { key: "projectCode", label: "项目编码", width: "180px" },
          { key: "externalNo", label: "外部编号", width: "180px" },
          { key: "project", label: "项目名称", width: "220px" },
          { key: "status", label: "状态", width: "160px" }
        ],
        rows: [
          { seq: "1", projectCode: "222", externalNo: "", project: "test0622-1", status: "已立项" },
          { seq: "2", projectCode: "333", externalNo: "", project: "test0619", status: "进行中" }
        ]
      }
    };

    var escapeHtml = function (value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    };

    var renderPopover = function (trigger) {
      if (!popoverTable || !popoverHead || !popoverBody) return;
      var key = trigger.getAttribute("data-pk-reference-trigger");
      var config = referenceData[key] || referenceData.customer;
      var valueKey = trigger.getAttribute("data-pk-reference-value-key") || config.valueKey;
      var currentInput = trigger.querySelector(".pk-table-reference-input");
      var currentValue = currentInput ? currentInput.value : ((trigger.querySelector(".value") || {}).textContent || "").trim();

      popoverTable.innerHTML = [
        "<colgroup>",
        config.columns.map(function (column) {
          return column.width ? '<col style="width: ' + column.width + '">' : "<col>";
        }).join(""),
        "</colgroup>",
        "<thead><tr>",
        config.columns.map(function (column) {
          return '<th><div class="cell">' + escapeHtml(column.label) + "</div></th>";
        }).join(""),
        "</tr></thead>",
        "<tbody>",
        config.rows.map(function (row) {
          var value = row[valueKey];
          var selected = String(value || "") === currentValue ? " is-selected" : "";
          var cells = config.columns.map(function (column) {
            return '<td><div class="cell">' + escapeHtml(row[column.key]) + "</div></td>";
          }).join("");
          return '<tr class="' + selected.trim() + '" data-pk-reference-value="' + escapeHtml(value) + '" data-pk-reference-name="' + escapeHtml(row.name || value) + '">' + cells + "</tr>";
        }).join(""),
        "</tbody>"
      ].join("");
    };

    var getPopoverWidth = function (trigger, config) {
      var maxWidth = trigger.closest(".pk-table-sample") ? 860 : 960;
      var contentWidth = config.columns.reduce(function (total, column) {
        var columnWidth = parseFloat(column.width);
        return total + (isFinite(columnWidth) ? columnWidth : 180);
      }, 0) + 26;
      return Math.min(Math.max(320, contentWidth), maxWidth, window.innerWidth - 24);
    };

    var positionPopover = function (trigger, config) {
      var rect = trigger.getBoundingClientRect();
      var width = getPopoverWidth(trigger, config);
      var left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
      var top = rect.bottom + 12;
      popover.style.width = width + "px";
      popover.style.left = left + "px";
      popover.style.top = top + "px";
      var arrow = popover.querySelector(".popper-arrow");
      if (arrow) {
        arrow.style.left = Math.max(12, Math.min(rect.left - left + 24, width - 24)) + "px";
      }
    };

    root.querySelectorAll("[data-pk-reference-trigger]").forEach(function (trigger) {
      if (trigger.dataset.pkReferenceReady === "true") return;
      trigger.dataset.pkReferenceReady = "true";
      trigger.addEventListener("click", function (event) {
        event.stopPropagation();
        if (trigger.classList.contains("is-disabled")) return;
        closeDropdowns();
        closeDatePanel();
        var open = trigger.getAttribute("aria-expanded") !== "true";
        closeReferencePopover();
        if (!open) return;
        var key = trigger.getAttribute("data-pk-reference-trigger");
        var config = referenceData[key] || referenceData.customer;
        renderPopover(trigger);
        positionPopover(trigger, config);
        popover.classList.add("is-open");
        popover.setAttribute("aria-hidden", "false");
        trigger.setAttribute("aria-expanded", "true");
        popover._activeTrigger = trigger;
      });
    });

    if (popover.dataset.pkReferencePopoverReady !== "true") {
      popover.dataset.pkReferencePopoverReady = "true";
      popover.addEventListener("click", function (event) {
        event.stopPropagation();
        var row = event.target.closest("[data-pk-reference-value]");
        var trigger = popover._activeTrigger;
        if (!row || !trigger) return;
        popover.querySelectorAll("[data-pk-reference-value]").forEach(function (item) {
          item.classList.remove("is-selected");
        });
        row.classList.add("is-selected");
        var valueNode = trigger.querySelector(".value");
        var inputNode = trigger.querySelector(".pk-table-reference-input");
        if (inputNode) {
          inputNode.value = row.getAttribute("data-pk-reference-value");
          trigger.classList.add("has-clear-value");
        }
        if (valueNode) {
          valueNode.textContent = trigger.getAttribute("data-pk-reference-value-key") === "name"
            ? row.getAttribute("data-pk-reference-name")
            : row.getAttribute("data-pk-reference-value");
          valueNode.classList.remove("placeholder");
          trigger.classList.add("has-clear-value");
        }
        closeReferencePopover();
      });
    }

    root.querySelectorAll(".pk-table-reference .pk-table-clear-btn").forEach(function (button) {
      if (button.dataset.pkReferenceClearReady === "true") return;
      button.dataset.pkReferenceClearReady = "true";
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        var reference = button.closest(".pk-table-reference");
        var input = reference ? reference.querySelector(".pk-table-reference-input") : null;
        if (input) input.value = "";
        if (reference) reference.classList.remove("has-clear-value");
        closeReferencePopover();
      });
    });
  }

  function initDatePanel(root) {
    var panel = document.querySelector("[data-pk-date-panel]");
    if (!panel) return;

    var readDateTime = function (input) {
      var value = input.querySelector("[data-pk-date-value]");
      var text = value ? value.textContent.trim() : "";
      var match = text.match(/^(\d{4}-\d{2}-\d{2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
      return {
        date: match ? match[1] : "2026-06-25",
        hour: match && match[2] ? match[2].padStart(2, "0") : "09",
        minute: match && match[3] ? match[3].padStart(2, "0") : "30",
        second: match && match[4] ? match[4].padStart(2, "0") : "00"
      };
    };

    var setTimeInputs = function (parts) {
      var picker = panel.querySelector("[data-pk-time-picker]");
      if (picker) picker.value = parts.hour + ":" + parts.minute + ":" + parts.second;
    };

    var readTimeInputs = function () {
      var picker = panel.querySelector("[data-pk-time-picker]");
      var value = picker && picker.value ? picker.value : "09:30:00";
      var parts = value.split(":");
      return {
        hour: (parts[0] || "00").padStart(2, "0"),
        minute: (parts[1] || "00").padStart(2, "0"),
        second: (parts[2] || "00").padStart(2, "0")
      };
    };

    var setActiveValue = function (dateValue) {
      var active = panel._activeInput;
      if (!active) return;
      var value = active.querySelector("[data-pk-date-value]");
      if (!value) return;
      if (active.classList.contains("pk-datetime-input-shell")) {
        var time = readTimeInputs();
        value.textContent = dateValue + " " + time.hour + ":" + time.minute + ":" + time.second;
      } else {
        value.textContent = dateValue;
      }
      value.classList.remove("placeholder");
      active.classList.add("has-clear-value");
    };

    var syncActiveTime = function () {
      var active = panel._activeInput;
      if (!active || !active.classList.contains("pk-datetime-input-shell")) return;
      setActiveValue(readDateTime(active).date);
    };

    var positionPanel = function (input) {
      var rect = input.getBoundingClientRect();
      var width = Math.min(322, window.innerWidth - 24);
      var left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
      var top = rect.bottom + 12;
      var timePanel = panel.querySelector("[data-pk-time-panel]");
      var days = panel.querySelector(".pk-date-days");
      if (timePanel && days) {
        panel.classList.toggle("is-datetime", input.classList.contains("pk-datetime-input-shell"));
        panel.insertBefore(
          timePanel,
          input.classList.contains("pk-datetime-input-shell") ? days : null
        );
      }
      panel.style.width = width + "px";
      panel.style.left = left + "px";
      panel.style.top = top + "px";
      panel.style.setProperty("--pk-date-arrow-left", Math.max(12, Math.min(rect.left - left + 24, width - 24)) + "px");
    };

    root.querySelectorAll(".pk-date-input-shell").forEach(function (input) {
      if (input.dataset.pkDateInputReady === "true") return;
      input.dataset.pkDateInputReady = "true";
      input.addEventListener("click", function (event) {
        event.stopPropagation();
        closeDropdowns();
        closeReferencePopover();
        var open = !input.classList.contains("is-open");
        closeDatePanel();
        if (!open) return;
        positionPanel(input);
        panel.classList.add("is-open");
        panel.setAttribute("aria-hidden", "false");
        input.classList.add("is-open");
        input.setAttribute("aria-expanded", "true");
        panel._activeInput = input;
        setTimeInputs(readDateTime(input));
      });
    });

    if (panel.dataset.pkDatePanelReady !== "true") {
      panel.dataset.pkDatePanelReady = "true";
      panel.addEventListener("click", function (event) {
        event.stopPropagation();
        var confirm = event.target.closest("[data-pk-date-confirm]");
        if (confirm) {
          closeDatePanel();
          return;
        }
        var day = event.target.closest(".pk-date-days button");
        if (!day || day.classList.contains("is-muted")) return;
        panel.querySelectorAll(".pk-date-days button").forEach(function (button) {
          button.classList.remove("is-selected");
        });
        day.classList.add("is-selected");
        if (panel._activeInput) {
          var value = panel._activeInput.querySelector("[data-pk-date-value]");
          if (value) {
            var dateValue = "2026-06-" + String(day.textContent.trim()).padStart(2, "0");
            setActiveValue(dateValue);
          }
        }
        if (!panel._activeInput || !panel._activeInput.classList.contains("pk-datetime-input-shell")) closeDatePanel();
      });
    }

    panel.querySelectorAll("[data-pk-time-part]").forEach(function (input) {
      if (!markReady(input, "pkTimePartReady")) return;
      var max = input.getAttribute("data-pk-time-part") === "hour" ? 23 : 59;
      input.addEventListener("input", function () {
        var value = input.value.replace(/\D/g, "").slice(0, 2);
        if (value !== "" && Number(value) > max) value = String(max);
        input.value = value;
        syncActiveTime();
      });
      input.addEventListener("blur", function () {
        input.value = String(input.value || "0").padStart(2, "0");
        syncActiveTime();
      });
    });

    var timePicker = panel.querySelector("[data-pk-time-picker]");
    if (timePicker && markReady(timePicker, "pkTimePickerReady")) {
      timePicker.addEventListener("input", syncActiveTime);
      timePicker.addEventListener("change", syncActiveTime);
    }
  }

  function initSwitch(root) {
    root.querySelectorAll(".pk-switch").forEach(function (button) {
      if (!markReady(button, "pkSwitchReady")) return;
      button.addEventListener("click", function () {
        button.setAttribute("aria-checked", button.getAttribute("aria-checked") === "true" ? "false" : "true");
      });
    });
  }

  function initUpload(root) {
    root.querySelectorAll(".pk-upload, .ddp-layout-upload").forEach(function (upload) {
      if (!markReady(upload, "pkUploadReady")) return;
      var input = upload.querySelector(".pk-upload-input, .el-upload__input");
      var button = upload.querySelector(".pk-upload-button, .ddp-layout-upload-click");
      var list = upload.querySelector(".pk-upload-list, .el-upload-list");
      if (!input || !button || !list) return;
      button.addEventListener("click", function () {
        input.click();
      });
      input.addEventListener("change", function () {
        list.innerHTML = "";
        Array.from(input.files || []).forEach(function (file) {
          var item = document.createElement("li");
          item.textContent = file.name;
          list.appendChild(item);
        });
      });
    });
  }

  function initRichText(root) {
    root.querySelectorAll(".pk-rich").forEach(function (rich) {
      if (!markReady(rich, "pkRichReady")) return;
      var editor = rich.querySelector(".pk-rich-editor");
      if (!editor) return;
      rich.querySelectorAll("[data-pk-command]").forEach(function (menu) {
        menu.addEventListener("click", function () {
          editor.focus();
          document.execCommand(menu.getAttribute("data-pk-command"), false, null);
        });
      });
    });
  }

  function closeSaveGroups(except) {
    document.querySelectorAll("[data-pk-save-group]").forEach(function (group) {
      if (group === except) return;
      group.classList.remove("is-open");
      var button = group.querySelector(".pk-save-drop-btn");
      if (button) button.setAttribute("aria-expanded", "false");
    });
  }

  function closeToolbarDropdowns(except) {
    document.querySelectorAll("[data-pk-toolbar-dropdown]").forEach(function (dropdown) {
      if (dropdown === except) return;
      dropdown.classList.remove("is-open");
      var trigger = dropdown.querySelector(".pk-toolbar-dropdown-trigger");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    });
  }

  function initButtonComponents(root) {
    root.querySelectorAll("[data-pk-save-group]").forEach(function (group) {
      if (!markReady(group, "pkSaveReady")) return;
      var submit = group.querySelector(".pk-save-submit-btn");
      var drop = group.querySelector(".pk-save-drop-btn");

      if (submit) {
        submit.addEventListener("click", function () {
          closeSaveGroups();
        });
      }

      if (drop) {
        drop.addEventListener("click", function (event) {
          event.stopPropagation();
          closeToolbarDropdowns();
          var open = !group.classList.contains("is-open");
          closeSaveGroups(group);
          group.classList.toggle("is-open", open);
          drop.setAttribute("aria-expanded", open ? "true" : "false");
        });
      }

      group.querySelectorAll(".pk-save-menu li").forEach(function (item) {
        item.addEventListener("click", function () {
          closeSaveGroups();
        });
      });
    });

    root.querySelectorAll("[data-pk-toolbar-dropdown]").forEach(function (dropdown) {
      if (!markReady(dropdown, "pkToolbarDropdownReady")) return;
      var trigger = dropdown.querySelector(".pk-toolbar-dropdown-trigger");
      if (!trigger) return;

      trigger.addEventListener("click", function (event) {
        event.stopPropagation();
        closeSaveGroups();
        var open = !dropdown.classList.contains("is-open");
        closeToolbarDropdowns(dropdown);
        dropdown.classList.toggle("is-open", open);
        trigger.setAttribute("aria-expanded", open ? "true" : "false");
      });

      dropdown.querySelectorAll(".pk-toolbar-dropdown-menu li").forEach(function (item) {
        item.addEventListener("click", function () {
          dropdown.classList.remove("is-open");
          trigger.setAttribute("aria-expanded", "false");
        });
      });
    });
  }

  function getTableDataRows(tbody) {
    return Array.from(tbody.querySelectorAll("tr")).filter(function (row) {
      return !row.classList.contains("pk-table-spacer-row");
    });
  }

  function ensureTableSpacer(table) {
    var wrap = table.closest(".pk-table-grid-wrap, .pk-table-sample");
    var tbody = table.querySelector("tbody");
    var tfoot = table.querySelector("tfoot");
    if (!wrap || !tbody || !tfoot) return;

    var spacer = tbody.querySelector(".pk-table-spacer-row");
    if (!spacer) {
      spacer = document.createElement("tr");
      spacer.className = "pk-table-spacer-row";
      var colCount = table.querySelectorAll("colgroup col").length || (table.rows[0] ? table.rows[0].cells.length : 1);
      var cell = document.createElement("td");
      cell.colSpan = colCount;
      cell.innerHTML = '<div class="cell"></div>';
      spacer.appendChild(cell);
      tbody.appendChild(spacer);
    }

    spacer.style.height = "0px";
    var header = table.querySelector("thead");
    var dataHeight = getTableDataRows(tbody).reduce(function (sum, row) {
      return sum + row.getBoundingClientRect().height;
    }, 0);
    var available = wrap.clientHeight
      - (header ? header.getBoundingClientRect().height : 0)
      - tfoot.getBoundingClientRect().height;
    spacer.style.height = Math.max(0, available - dataHeight) + "px";
  }

  function refreshTableSpacers(root) {
    var scope = root && typeof root.querySelectorAll === "function" ? root : document;
    scope.querySelectorAll(".pk-table-sample table, .pk-table-grid-wrap table").forEach(function (table) {
      ensureTableSpacer(table);
    });
  }

  function initTableExamples(root) {

    var syncFieldClear = function (field) {
      var control = field.querySelector(".pk-table-input, .pk-table-select");
      if (!control) return;
      field.classList.toggle("has-clear-value", String(control.value || "").trim() !== "");
    };

    var refreshIndexes = function (table) {
      getTableDataRows(table.querySelector("tbody")).forEach(function (row, index) {
        var indexCell = row.querySelector("[data-pk-row-index]");
        var selector = row.querySelector("[data-pk-row-select]");
        if (indexCell) indexCell.textContent = String(index + 1);
        if (selector) selector.setAttribute("aria-label", "选择第 " + (index + 1) + " 行");
      });
    };

    var syncSelectAll = function (table) {
      var selectAll = table.querySelector("[data-pk-table-select-all]");
      var rowChecks = Array.from(table.querySelectorAll("tbody [data-pk-row-select]"));
      if (!selectAll) return;
      var checkedCount = rowChecks.filter(function (checkbox) { return checkbox.checked; }).length;
      selectAll.checked = rowChecks.length > 0 && checkedCount === rowChecks.length;
      selectAll.indeterminate = checkedCount > 0 && checkedCount < rowChecks.length;
      selectAll.classList.toggle("is-indeterminate", selectAll.indeterminate);
    };

    var clearRowForNew = function (row) {
      row.querySelectorAll("[data-pk-row-select]").forEach(function (checkbox) {
        checkbox.checked = false;
      });
      row.querySelectorAll(".pk-table-reference").forEach(function (reference) {
        var input = reference.querySelector(".pk-table-reference-input");
        if (input && !input.disabled) input.value = "";
        if (!reference.classList.contains("is-disabled")) reference.classList.remove("has-clear-value");
      });
      row.querySelectorAll(".pk-table-field").forEach(function (field) {
        var input = field.querySelector(".pk-table-input");
        var select = field.querySelector(".pk-table-select");
        if (input) input.value = "";
        if (select) select.selectedIndex = -1;
        syncFieldClear(field);
      });
      row.querySelectorAll(".pk-table-date-field [data-pk-date-value]").forEach(function (value) {
        value.textContent = "";
        value.classList.add("placeholder");
      });
    };

    root.querySelectorAll(".pk-table-field").forEach(function (field) {
      if (field.dataset.pkTableFieldReady === "true") return;
      field.dataset.pkTableFieldReady = "true";
      var control = field.querySelector(".pk-table-input, .pk-table-select");
      var button = field.querySelector(".pk-table-clear-btn");
      if (control) {
        control.addEventListener("input", function () { syncFieldClear(field); });
        control.addEventListener("change", function () { syncFieldClear(field); });
      }
      if (button) {
        button.addEventListener("click", function (event) {
          event.preventDefault();
          event.stopPropagation();
          if (control) {
            if (control.matches("select")) control.selectedIndex = -1;
            else control.value = "";
            control.dispatchEvent(new Event("change", { bubbles: true }));
            if (!control.matches("select")) control.focus();
          }
          syncFieldClear(field);
          closeReferencePopover();
          closeDatePanel();
        });
      }
      syncFieldClear(field);
    });

    root.querySelectorAll("[data-pk-table-example]").forEach(function (example) {
      var table = example.querySelector("table");
      var tbody = table ? table.querySelector("tbody") : null;
      if (!table || !tbody || table.dataset.pkTableExampleReady === "true") return;
      table.dataset.pkTableExampleReady = "true";

      table.addEventListener("change", function (event) {
        var target = event.target;
        if (target.matches("[data-pk-table-select-all]")) {
          target.indeterminate = false;
          target.classList.remove("is-indeterminate");
          table.querySelectorAll("tbody [data-pk-row-select]").forEach(function (checkbox) {
            checkbox.checked = target.checked;
          });
          syncSelectAll(table);
        } else if (target.matches("[data-pk-row-select]")) {
          syncSelectAll(table);
        }
      });

      table.addEventListener("click", function (event) {
        var action = event.target.closest(".pk-row-actions button");
        var currentRow = action ? action.closest("tr") : null;
        if (!action || !currentRow) return;
        if (action.classList.contains("is-danger")) {
          if (getTableDataRows(tbody).length > 1) currentRow.remove();
          else clearRowForNew(currentRow);
        } else {
          var clone = currentRow.cloneNode(true);
          if (action.title !== "复制行") clearRowForNew(clone);
          currentRow.after(clone);
          window.initPrototypeKit(clone);
        }
        refreshIndexes(table);
        syncSelectAll(table);
        ensureTableSpacer(table);
      });

      refreshIndexes(table);
      syncSelectAll(table);
      ensureTableSpacer(table);
    });

    root.querySelectorAll("[data-pk-add-row]").forEach(function (button) {
      if (button.dataset.pkAddRowReady === "true") return;
      button.dataset.pkAddRowReady = "true";
      button.addEventListener("click", function () {
        var example = button.closest("[data-pk-table-example]");
        var table = example ? example.querySelector("table") : null;
        var tbody = table ? table.querySelector("tbody") : null;
        var firstRow = tbody ? getTableDataRows(tbody)[0] : null;
        if (!table || !tbody || !firstRow) return;
        var clone = firstRow.cloneNode(true);
        clearRowForNew(clone);
        var spacer = tbody.querySelector(".pk-table-spacer-row");
        tbody.insertBefore(clone, spacer || null);
        window.initPrototypeKit(clone);
        refreshIndexes(table);
        syncSelectAll(table);
        ensureTableSpacer(table);
      });
    });

    refreshTableSpacers(root);
  }

  function initSnippetCopy(root) {
    root.querySelectorAll("[data-pk-copy-target]").forEach(function (button) {
      if (!markReady(button, "pkCopyReady")) return;
      var updateButton = function (message) {
        var original = button.dataset.pkCopyLabel || button.textContent;
        button.dataset.pkCopyLabel = original;
        button.textContent = message;
        button.classList.toggle("is-copied", message === "已复制");
        window.setTimeout(function () {
          button.textContent = original;
          button.classList.remove("is-copied");
        }, 1200);
      };

      var fallbackCopy = function (text) {
        var textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        var success = false;
        try {
          success = document.execCommand("copy");
        } catch (error) {
          success = false;
        }
        textarea.remove();
        updateButton(success ? "已复制" : "复制失败");
      };

      button.addEventListener("click", function () {
        var target = document.querySelector(button.getAttribute("data-pk-copy-target"));
        var text = target ? target.textContent.trim() : "";
        if (!text) return;

        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(function () {
            updateButton("已复制");
          }).catch(function () {
            fallbackCopy(text);
          });
        } else {
          fallbackCopy(text);
        }
      });
    });
  }

  function closeListWorkbenchPopovers(root, except) {
    var scope = root && typeof root.querySelectorAll === "function" ? root : document;
    scope.querySelectorAll("[data-pk-query-filter].is-open, [data-pk-column-manager].is-open, [data-pk-row-menu].is-open").forEach(function (container) {
      if (container === except) return;
      container.classList.remove("is-open");
      var trigger = container.querySelector("[data-pk-query-filter-trigger], [data-pk-column-trigger], [data-pk-row-menu-trigger]");
      var panel = container.querySelector("[data-pk-query-filter-panel], [data-pk-column-panel], [data-pk-row-menu-panel]");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
      if (panel) panel.hidden = true;
    });
  }

  function initListWorkbenches(root) {
    var doc = root && root.nodeType === 9 ? root : (root.ownerDocument || document);

    root.querySelectorAll("[data-pk-list-workbench]").forEach(function (workbench) {
      if (!markReady(workbench, "pkListWorkbenchReady")) return;
      var surface = workbench.querySelector(".pk-list-surface");
      var table = workbench.querySelector("[data-pk-list-table]");
      var queryToggle = workbench.querySelector("[data-pk-query-toggle]");
      var advanced = workbench.querySelector("[data-pk-query-advanced]");
      var fullscreenToggle = workbench.querySelector("[data-pk-list-fullscreen]");

      if (queryToggle && advanced) {
        queryToggle.addEventListener("click", function () {
          var expanded = advanced.hidden;
          advanced.hidden = !expanded;
          queryToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
          queryToggle.textContent = expanded
            ? (queryToggle.dataset.pkCollapseLabel || "收起")
            : (queryToggle.dataset.pkExpandLabel || "展开");
        });
      }

      workbench.querySelectorAll("[data-pk-query-filter]").forEach(function (filter) {
        var trigger = filter.querySelector("[data-pk-query-filter-trigger]");
        var panel = filter.querySelector("[data-pk-query-filter-panel]");
        if (!trigger || !panel) return;

        trigger.addEventListener("click", function (event) {
          event.stopPropagation();
          var open = !filter.classList.contains("is-open");
          closeListWorkbenchPopovers(doc, filter);
          filter.classList.toggle("is-open", open);
          trigger.setAttribute("aria-expanded", open ? "true" : "false");
          panel.hidden = !open;
        });

        panel.addEventListener("click", function (event) {
          event.stopPropagation();
          var option = event.target.closest("[data-pk-query-filter-value]");
          if (!option) return;
          panel.querySelectorAll("[data-pk-query-filter-value]").forEach(function (item) {
            item.classList.toggle("is-selected", item === option);
          });
          var label = trigger.querySelector("[data-pk-query-filter-label]");
          if (label) label.textContent = option.textContent.trim();
          closeListWorkbenchPopovers(doc);
        });
      });

      workbench.querySelectorAll("[data-pk-column-manager]").forEach(function (manager) {
        var trigger = manager.querySelector("[data-pk-column-trigger]");
        var panel = manager.querySelector("[data-pk-column-panel]");
        if (!trigger || !panel) return;

        trigger.addEventListener("click", function (event) {
          event.stopPropagation();
          var open = !manager.classList.contains("is-open");
          closeListWorkbenchPopovers(doc, manager);
          manager.classList.toggle("is-open", open);
          trigger.setAttribute("aria-expanded", open ? "true" : "false");
          panel.hidden = !open;
        });

        panel.addEventListener("click", function (event) {
          event.stopPropagation();
        });

        panel.addEventListener("change", function (event) {
          var checkbox = event.target.closest("[data-pk-column-index]");
          if (!checkbox || !table) return;
          var columnIndex = Number(checkbox.dataset.pkColumnIndex);
          if (!Number.isInteger(columnIndex) || columnIndex < 1) return;
          var hidden = !checkbox.checked;
          var column = table.querySelector("col:nth-child(" + columnIndex + ")");
          if (column) column.classList.toggle("pk-list-column-hidden", hidden);
          table.querySelectorAll("tr").forEach(function (row) {
            var cell = row.children[columnIndex - 1];
            if (cell) cell.classList.toggle("pk-list-column-hidden", hidden);
          });
        });
      });

      workbench.addEventListener("click", function (event) {
        var trigger = event.target.closest("[data-pk-row-menu-trigger]");
        if (trigger) {
          event.stopPropagation();
          var menu = trigger.closest("[data-pk-row-menu]");
          var panel = menu ? menu.querySelector("[data-pk-row-menu-panel]") : null;
          if (!menu || !panel) return;
          var open = !menu.classList.contains("is-open");
          closeListWorkbenchPopovers(doc, menu);
          menu.classList.toggle("is-open", open);
          trigger.setAttribute("aria-expanded", open ? "true" : "false");
          panel.hidden = !open;
          return;
        }

        if (event.target.closest("[data-pk-row-menu-panel] button")) {
          closeListWorkbenchPopovers(doc);
        }
      });

      if (fullscreenToggle && surface) {
        fullscreenToggle.addEventListener("click", function () {
          var active = !surface.classList.contains("is-fullscreen");
          surface.classList.toggle("is-fullscreen", active);
          doc.body.classList.toggle("pk-list-fullscreen-active", active);
          fullscreenToggle.setAttribute("aria-pressed", active ? "true" : "false");
          fullscreenToggle.setAttribute("aria-label", active ? "退出全屏" : "全屏");
          fullscreenToggle.title = active ? "退出全屏" : "全屏";
          closeListWorkbenchPopovers(doc);
        });
      }
    });

    if (markReady(doc.documentElement, "pkListWorkbenchDocumentReady")) {
      doc.addEventListener("click", function () {
        closeListWorkbenchPopovers(doc);
      });
      doc.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") return;
        var fullscreen = doc.querySelector(".pk-list-surface.is-fullscreen");
        if (fullscreen) {
          fullscreen.classList.remove("is-fullscreen");
          doc.body.classList.remove("pk-list-fullscreen-active");
          var toggle = fullscreen.querySelector("[data-pk-list-fullscreen]");
          if (toggle) {
            toggle.setAttribute("aria-pressed", "false");
            toggle.setAttribute("aria-label", "全屏");
            toggle.title = "全屏";
          }
        }
        closeListWorkbenchPopovers(doc);
      });
    }
  }

  function setDialogVisible(mask, visible) {
    if (!mask) return;
    mask.classList.toggle("is-visible", visible);
    mask.setAttribute("aria-hidden", visible ? "false" : "true");
    var doc = mask.ownerDocument;
    doc.body.classList.toggle("pk-dialog-open", visible || !!doc.querySelector(".pk-dialog-mask.is-visible"));
    if (visible) {
      var firstControl = mask.querySelector("button, input, select, textarea, [tabindex='0']");
      if (firstControl) firstControl.focus();
    }
  }

  function initDialogs(root) {
    var doc = root && root.nodeType === 9 ? root : (root.ownerDocument || document);

    root.querySelectorAll("[data-pk-dialog-open]").forEach(function (button) {
      if (!markReady(button, "pkDialogOpenReady")) return;
      button.addEventListener("click", function () {
        var mask = doc.getElementById(button.getAttribute("data-pk-dialog-open"));
        setDialogVisible(mask, true);
      });
    });

    root.querySelectorAll(".pk-dialog-mask").forEach(function (mask) {
      if (!markReady(mask, "pkDialogReady")) return;
      mask.addEventListener("click", function (event) {
        if (event.target === mask || event.target.closest("[data-pk-dialog-close]")) {
          setDialogVisible(mask, false);
        }
      });
    });

    root.querySelectorAll("[data-pk-document-tabs]").forEach(function (tabs) {
      if (!markReady(tabs, "pkDocumentTabsReady")) return;
      tabs.addEventListener("click", function (event) {
        var tab = event.target.closest("[data-pk-document-tab]");
        if (!tab) return;
        var dialog = tab.closest(".pk-dialog--document-detail");
        if (!dialog) return;
        dialog.querySelectorAll("[data-pk-document-tab]").forEach(function (item) {
          item.classList.toggle("is-active", item === tab);
          item.setAttribute("aria-selected", item === tab ? "true" : "false");
        });
        dialog.querySelectorAll("[data-pk-document-panel]").forEach(function (panel) {
          panel.hidden = panel.dataset.pkDocumentPanel !== tab.dataset.pkDocumentTab;
        });
      });
    });

    if (markReady(doc.documentElement, "pkDialogDocumentReady")) {
      doc.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") return;
        var masks = Array.from(doc.querySelectorAll(".pk-dialog-mask.is-visible"));
        setDialogVisible(masks[masks.length - 1], false);
      });
    }
  }

  function initPrototypeKit(root) {
    var scope = root || document;
    initTextarea(scope);
    initNumericInputs(scope);
    initClearableInputs(scope);
    initSelect(scope);
    initReference(scope);
    initDatePanel(scope);
    initSwitch(scope);
    initUpload(scope);
    initRichText(scope);
    initButtonComponents(scope);
    initTableExamples(scope);
    initSnippetCopy(scope);
    initListWorkbenches(scope);
    initDialogs(scope);
    scope.querySelectorAll("[data-pk-indeterminate]").forEach(function (checkbox) {
      checkbox.indeterminate = true;
      checkbox.classList.add("is-indeterminate");
    });
  }

  window.PrototypeKit = {
    init: initPrototypeKit,
    refreshTables: refreshTableSpacers,
    closePopovers: function () {
      closeDropdowns();
      closeReferencePopover();
      closeDatePanel();
      closeSaveGroups();
      closeToolbarDropdowns();
      closeListWorkbenchPopovers(document);
    }
  };

  window.initPrototypeKit = initPrototypeKit;

  document.addEventListener("click", function () {
    closeDropdowns();
    closeReferencePopover();
    closeDatePanel();
    closeSaveGroups();
    closeToolbarDropdowns();
  });

  document.addEventListener("DOMContentLoaded", function () {
    window.initPrototypeKit(document);
  });

  window.addEventListener("resize", refreshTableSpacers);
})();
