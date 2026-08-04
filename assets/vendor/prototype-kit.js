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
    root.querySelectorAll("textarea[data-pk-count]").forEach(function (textarea) {
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
          if (typeof window.CustomEvent === "function") {
            box.dispatchEvent(new window.CustomEvent("pk:select-change", {
              bubbles: true,
              detail: {
                value: option.dataset.value || option.textContent.trim(),
                option: option
              }
            }));
          }
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

    document.querySelectorAll('script[type="application/json"][data-pk-reference-data]').forEach(function (script) {
      try {
        var localReferenceData = JSON.parse(script.textContent || "{}");
        Object.keys(localReferenceData).forEach(function (key) {
          referenceData[key] = localReferenceData[key];
        });
      } catch (error) {
        // Invalid optional reference data falls back to the built-in examples.
      }
    });

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
        config.rows.map(function (row, rowIndex) {
          var value = row[valueKey];
          var selected = String(value || "") === currentValue ? " is-selected" : "";
          var cells = config.columns.map(function (column) {
            return '<td><div class="cell">' + escapeHtml(row[column.key]) + "</div></td>";
          }).join("");
          return '<tr class="' + selected.trim() + '" data-pk-reference-index="' + rowIndex + '" data-pk-reference-value="' + escapeHtml(value) + '" data-pk-reference-name="' + escapeHtml(row.name || row.materialName || value) + '">' + cells + "</tr>";
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
        var referenceKey = trigger.getAttribute("data-pk-reference-trigger");
        var referenceConfig = referenceData[referenceKey] || referenceData.customer;
        var rowIndex = Number(row.getAttribute("data-pk-reference-index"));
        var selectedRow = referenceConfig && Array.isArray(referenceConfig.rows) && Number.isInteger(rowIndex)
          ? referenceConfig.rows[rowIndex]
          : null;
        if (typeof window.CustomEvent === "function") {
          trigger.dispatchEvent(new window.CustomEvent("pk:reference-change", {
            bubbles: true,
            detail: {
              source: referenceKey,
              value: row.getAttribute("data-pk-reference-value"),
              row: selectedRow
            }
          }));
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
    scope.querySelectorAll("[data-pk-query-filter].is-open, [data-pk-column-manager].is-open, [data-pk-row-menu].is-open, [data-pk-query-reference-popover].is-open").forEach(function (container) {
      if (container === except) return;
      if (container.matches("[data-pk-query-reference-popover]")) {
        var activeTrigger = container._activeTrigger;
        if (activeTrigger) activeTrigger.setAttribute("aria-expanded", "false");
        container._activeTrigger = null;
        container.classList.remove("is-open");
        container.setAttribute("aria-hidden", "true");
        container.hidden = true;
        return;
      }
      container.classList.remove("is-open");
      var trigger = container.querySelector("[data-pk-query-filter-trigger], [data-pk-column-trigger], [data-pk-row-menu-trigger]");
      var panel = container.querySelector("[data-pk-query-filter-panel], [data-pk-column-panel], [data-pk-row-menu-panel]");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
      if (panel) panel.hidden = true;
    });
  }

  function initConfiguredListWorkbench(workbench, doc, syncSelection) {
    var configScript = workbench.querySelector('script[type="application/json"][data-pk-list-config]');
    if (!configScript) return;

    var config;
    try {
      config = JSON.parse(configScript.textContent || "{}");
    } catch (error) {
      showMessage(doc, "列表配置解析失败", "error");
      return;
    }

    var table = workbench.querySelector("[data-pk-list-table]");
    var tableBody = table ? table.querySelector("tbody") : null;
    if (!table || !tableBody || !Array.isArray(config.columns)) return;

    var view = doc.defaultView || window;
    var idKey = config.idKey || "id";
    var schemaVersion = Number(config.schemaVersion) || 1;
    var storageKey = config.storageKey || "";
    var filtersStorageKey = storageKey ? storageKey + ":filters" : "";
    var keywordInput = workbench.querySelector("[data-pk-query-keyword]");
    var queryControls = Array.from(workbench.querySelectorAll("[data-pk-query-field]"));
    var totalCount = workbench.querySelector("[data-pk-list-total-count]");
    var resultCount = workbench.querySelector("[data-pk-list-result-count]");
    var pageSizeControl = workbench.querySelector("[data-pk-list-page-size]");
    var pageButtons = workbench.querySelector("[data-pk-list-page-buttons]");
    var previousPageButton = workbench.querySelector('[data-pk-list-page-action="previous"]');
    var nextPageButton = workbench.querySelector('[data-pk-list-page-action="next"]');
    var pageInput = workbench.querySelector("[data-pk-list-page-input]");
    var filterLabel = workbench.querySelector("[data-pk-query-filter-label]");
    var presetFilterList = workbench.querySelector("[data-pk-query-filter-presets]");
    var personalFilterList = workbench.querySelector("[data-pk-query-filter-personal]");
    var surface = workbench.querySelector(".pk-list-surface");
    var formConfig = config.form || {};
    var deleteConfig = config.delete || {};
    var filterDialogConfig = config.filterDialog || {};
    var formDialog = formConfig.dialogId ? doc.getElementById(formConfig.dialogId) : null;
    var deleteDialog = deleteConfig.dialogId ? doc.getElementById(deleteConfig.dialogId) : null;
    var filterDialog = filterDialogConfig.dialogId ? doc.getElementById(filterDialogConfig.dialogId) : null;
    var formTitle = formDialog && formConfig.titleId ? formDialog.querySelector("#" + formConfig.titleId) : null;
    var formSaveButton = formDialog ? formDialog.querySelector("[data-pk-list-form-save]") : null;
    var deleteMessage = deleteDialog ? deleteDialog.querySelector("[data-pk-list-delete-message]") : null;
    var deleteConfirmButton = deleteDialog ? deleteDialog.querySelector("[data-pk-list-delete-confirm]") : null;
    var filterDialogTitle = filterDialog ? filterDialog.querySelector("[data-pk-list-filter-dialog-title]") : null;
    var filterNameInput = filterDialog ? filterDialog.querySelector("[data-pk-list-filter-name]") : null;
    var filterConfirmButton = filterDialog ? filterDialog.querySelector("[data-pk-list-filter-confirm]") : null;
    var defaultPageSize = Number(config.defaultPageSize) || 20;
    var currentPage = 1;
    var pageSize = defaultPageSize;
    var editingId = null;
    var pendingDeleteIds = [];
    var currentFilterId = null;
    var pendingFilterMode = "saveAs";
    var pendingFilterId = null;

    function escapeListHtml(value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function clone(value) {
      return JSON.parse(JSON.stringify(value));
    }

    function getStorage() {
      try {
        return view.localStorage;
      } catch (error) {
        return null;
      }
    }

    function normalizeRecords(value) {
      if (!Array.isArray(value)) return clone(config.records || []);
      return value.filter(function (record) {
        return record && typeof record === "object" && record[idKey] != null;
      }).map(function (record) {
        return Object.assign({}, record, (function () {
          var identity = {};
          identity[idKey] = String(record[idKey]);
          return identity;
        })());
      });
    }

    function loadRecords() {
      var storage = getStorage();
      if (!storageKey || !storage) return normalizeRecords(config.records || []);
      try {
        var stored = JSON.parse(storage.getItem(storageKey) || "null");
        if (stored && stored.version === schemaVersion && Array.isArray(stored.records)) {
          return normalizeRecords(stored.records);
        }
      } catch (error) {
        // Invalid local demo data is replaced with the deterministic seed.
      }
      return normalizeRecords(config.records || []);
    }

    function persistRecords() {
      var storage = getStorage();
      if (!storageKey || !storage) return;
      try {
        storage.setItem(storageKey, JSON.stringify({ version: schemaVersion, records: records }));
      } catch (error) {
        showMessage(doc, "本地演示数据保存失败", "error");
      }
    }

    function loadFilters() {
      var storage = getStorage();
      if (!filtersStorageKey || !storage) return [];
      try {
        var stored = JSON.parse(storage.getItem(filtersStorageKey) || "null");
        return stored && stored.version === schemaVersion && Array.isArray(stored.filters)
          ? stored.filters.filter(function (filter) { return filter && filter.id && filter.name && filter.criteria; })
          : [];
      } catch (error) {
        return [];
      }
    }

    function persistFilters() {
      var storage = getStorage();
      if (!filtersStorageKey || !storage) return;
      try {
        storage.setItem(filtersStorageKey, JSON.stringify({ version: schemaVersion, filters: personalFilters }));
      } catch (error) {
        showMessage(doc, "过滤方案保存失败", "error");
      }
    }

    function normalizeSearchValue(value) {
      return String(value == null ? "" : value).trim().toLowerCase();
    }

    function readQueryControl(control) {
      if (control.dataset.pkQueryMultiple === "true") {
        try {
          var parsed = JSON.parse(control.value || "[]");
          return Array.isArray(parsed) ? parsed.map(String) : [];
        } catch (error) {
          return [];
        }
      }
      if (control.matches(".pk-select, .pk-cascader")) {
        var label = control.querySelector("[data-pk-value]");
        var text = label ? label.textContent.trim() : "";
        return text === "全部" ? "" : text;
      }
      return control.value == null ? "" : String(control.value).trim();
    }

    function readCriteria() {
      var criteria = { keyword: keywordInput ? keywordInput.value.trim() : "" };
      queryControls.forEach(function (control) {
        criteria[control.dataset.pkQueryField] = readQueryControl(control);
      });
      return criteria;
    }

    function setQueryControl(control, value) {
      if (control.dataset.pkQueryMultiple === "true") {
        var values = Array.isArray(value) ? value.map(String) : [];
        control.value = JSON.stringify(values);
        var trigger = control.closest("[data-pk-query-reference-trigger]");
        var valueNode = trigger ? trigger.querySelector("[data-pk-query-reference-value]") : null;
        if (valueNode) {
          var placeholder = trigger.dataset.pkPlaceholder || "请选择";
          valueNode.textContent = values.length ? values.join("、") : placeholder;
          valueNode.classList.toggle("placeholder", values.length === 0);
          valueNode.title = values.join("、");
        }
        return;
      }
      if (control.matches(".pk-select, .pk-cascader")) {
        var displayValue = value || "全部";
        var label = control.querySelector("[data-pk-value]");
        if (label) label.textContent = displayValue;
        control.querySelectorAll(".pk-option").forEach(function (option) {
          var optionValue = option.dataset.value || option.textContent.trim();
          option.classList.toggle("is-selected", optionValue === displayValue);
        });
        return;
      }
      control.value = value == null ? "" : value;
    }

    function setCriteria(criteria) {
      var next = criteria || {};
      if (keywordInput) keywordInput.value = next.keyword || "";
      queryControls.forEach(function (control) {
        var value = Object.prototype.hasOwnProperty.call(next, control.dataset.pkQueryField)
          ? next[control.dataset.pkQueryField]
          : (control.dataset.pkQueryMultiple === "true" ? [] : "");
        setQueryControl(control, value);
      });
    }

    function matchesQueryValue(recordValue, queryValue, matchMode) {
      var normalizedRecord = normalizeSearchValue(recordValue);
      var candidates = Array.isArray(queryValue) ? queryValue : [queryValue];
      var activeCandidates = candidates.map(normalizeSearchValue).filter(Boolean);
      if (!activeCandidates.length) return true;
      return activeCandidates.some(function (candidate) {
        return matchMode === "exact" ? normalizedRecord === candidate : normalizedRecord.indexOf(candidate) !== -1;
      });
    }

    function getFilteredRecords() {
      var keyword = normalizeSearchValue(committedCriteria.keyword);
      var quickSearchFields = Array.isArray(config.quickSearchFields) ? config.quickSearchFields : [];
      return records.filter(function (record) {
        var matchesKeyword = !keyword || quickSearchFields.some(function (key) {
          return normalizeSearchValue(record[key]).indexOf(keyword) !== -1;
        });
        if (!matchesKeyword) return false;
        return queryControls.every(function (control) {
          var queryField = control.dataset.pkQueryField;
          var recordField = control.dataset.pkQueryRecordField || queryField;
          return matchesQueryValue(record[recordField], committedCriteria[queryField], control.dataset.pkQueryMatch || "contains");
        });
      });
    }

    function sortRecords() {
      var sortRules = Array.isArray(config.sort) ? config.sort : [];
      records.sort(function (left, right) {
        for (var index = 0; index < sortRules.length; index += 1) {
          var rule = sortRules[index];
          var leftValue = normalizeSearchValue(left[rule.key]);
          var rightValue = normalizeSearchValue(right[rule.key]);
          if (leftValue === rightValue) continue;
          var direction = rule.direction === "desc" ? -1 : 1;
          return leftValue > rightValue ? direction : -direction;
        }
        return String(left[idKey]).localeCompare(String(right[idKey]));
      });
    }

    function rowMenuMarkup(record, visibleIndex) {
      var recordId = escapeListHtml(record[idKey]);
      return [
        '<div class="pk-row-menu" data-pk-row-menu>',
        '<button class="pk-row-menu-trigger" type="button" data-pk-row-menu-trigger aria-label="第 ' + (visibleIndex + 1) + ' 行操作" aria-haspopup="true" aria-expanded="false">...</button>',
        '<div class="pk-row-menu-popover" data-pk-row-menu-panel hidden>',
        '<button type="button" data-pk-list-row-action="edit" data-pk-list-record-id="' + recordId + '">编辑</button>',
        '<button type="button" data-pk-list-row-action="delete" data-pk-list-record-id="' + recordId + '">删除</button>',
        "</div></div>"
      ].join("");
    }

    function renderCell(column, record) {
      var value = record[column.key] == null ? "" : record[column.key];
      var className = String(column.className || "").replace(/[^a-zA-Z0-9_-]/g, "");
      var content = column.link
        ? '<button class="pk-list-link" type="button" data-pk-list-row-action="edit" data-pk-list-record-id="' + escapeListHtml(record[idKey]) + '">' + escapeListHtml(value) + "</button>"
        : escapeListHtml(value);
      return '<td class="' + className + '">' + content + "</td>";
    }

    function applyColumnVisibility() {
      workbench.querySelectorAll("[data-pk-column-index]").forEach(function (checkbox) {
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
    }

    function renderPageButtons(totalPages) {
      if (!pageButtons) return;
      var pageNumbers = [];
      for (var page = 1; page <= totalPages; page += 1) {
        if (totalPages <= 7 || page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
          pageNumbers.push(page);
        }
      }
      var previous = 0;
      pageButtons.innerHTML = pageNumbers.map(function (page) {
        var gap = previous && page - previous > 1 ? '<span class="pk-pagination-gap">...</span>' : "";
        previous = page;
        return gap + '<button class="pk-pagination-page ' + (page === currentPage ? "is-active" : "") + '" type="button" data-pk-list-page="' + page + '" ' + (page === currentPage ? 'aria-current="page"' : "") + ">" + page + "</button>";
      }).join("");
    }

    function renderRows() {
      sortRecords();
      var filteredRecords = getFilteredRecords();
      var totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
      currentPage = Math.max(1, Math.min(currentPage, totalPages));
      var pageStart = (currentPage - 1) * pageSize;
      var visibleRecords = filteredRecords.slice(pageStart, pageStart + pageSize);
      var columnCount = config.columns.length + 3;

      tableBody.innerHTML = visibleRecords.length ? visibleRecords.map(function (record, index) {
        var visibleIndex = pageStart + index;
        return [
          '<tr data-pk-list-record-id="' + escapeListHtml(record[idKey]) + '">',
          "<td>" + rowMenuMarkup(record, index) + "</td>",
          "<td>" + (visibleIndex + 1) + "</td>",
          '<td class="is-center"><input class="pk-table-checkbox" type="checkbox" data-pk-list-row-select data-pk-list-record-id="' + escapeListHtml(record[idKey]) + '" aria-label="选择第 ' + (visibleIndex + 1) + ' 行"></td>',
          config.columns.map(function (column) { return renderCell(column, record); }).join(""),
          "</tr>"
        ].join("");
      }).join("") : '<tr class="pk-empty-row"><td colspan="' + columnCount + '">' + escapeListHtml(config.emptyText || "暂无符合条件的数据") + "</td></tr>";

      if (totalCount) totalCount.textContent = filteredRecords.length;
      if (resultCount) resultCount.textContent = filteredRecords.length;
      if (pageInput) pageInput.value = currentPage;
      if (pageSizeControl) pageSizeControl.value = String(pageSize);
      if (previousPageButton) previousPageButton.disabled = currentPage <= 1;
      if (nextPageButton) nextPageButton.disabled = currentPage >= totalPages;
      renderPageButtons(totalPages);
      applyColumnVisibility();
      syncSelection();
      if (typeof view.CustomEvent === "function") {
        workbench.dispatchEvent(new view.CustomEvent("pk:list-updated", {
          detail: { total: filteredRecords.length, page: currentPage, pageSize: pageSize }
        }));
      }
    }

    function selectedRecordIds() {
      return Array.from(workbench.querySelectorAll("[data-pk-list-row-select]:checked")).map(function (checkbox) {
        return checkbox.dataset.pkListRecordId;
      });
    }

    function getFormFields() {
      return formDialog ? Array.from(formDialog.querySelectorAll("[data-pk-list-form-field]")) : [];
    }

    function getFormFieldValue(field) {
      if (field.matches("input, textarea, select")) return String(field.value || "").trim();
      if (field.matches(".pk-select, .pk-cascader")) {
        var label = field.querySelector("[data-pk-value]");
        return label ? label.textContent.trim() : "";
      }
      var input = field.querySelector("input, textarea, select");
      if (input) return String(input.value || "").trim();
      var value = field.querySelector(".value, [data-pk-value]");
      return value && !value.classList.contains("placeholder") ? value.textContent.trim() : "";
    }

    function setFormFieldValue(field, value) {
      var nextValue = value == null ? "" : String(value);
      if (field.matches("input, textarea, select")) {
        field.value = nextValue;
        return;
      }
      if (field.matches(".pk-select, .pk-cascader")) {
        var label = field.querySelector("[data-pk-value]");
        if (label) label.textContent = nextValue;
        field.querySelectorAll(".pk-option").forEach(function (option) {
          var optionValue = option.dataset.value || option.textContent.trim();
          option.classList.toggle("is-selected", optionValue === nextValue);
        });
        return;
      }
      var input = field.querySelector("input, textarea, select");
      if (input) input.value = nextValue;
      var valueNode = field.querySelector(".value, [data-pk-value]");
      if (valueNode) {
        var placeholder = field.dataset.pkPlaceholder || "请选择";
        valueNode.textContent = nextValue || placeholder;
        valueNode.classList.toggle("placeholder", !nextValue);
      }
      field.classList.toggle("has-clear-value", !!nextValue);
    }

    function clearFieldError(field) {
      var wrapper = field.closest(".pk-field");
      if (!wrapper) return;
      wrapper.classList.remove("has-error");
      var error = wrapper.querySelector(".pk-field-error");
      if (error) error.remove();
    }

    function setFieldError(field, message) {
      var wrapper = field.closest(".pk-field");
      if (!wrapper) return;
      clearFieldError(field);
      wrapper.classList.add("has-error");
      var error = doc.createElement("div");
      error.className = "pk-field-error";
      error.setAttribute("role", "alert");
      error.textContent = message;
      wrapper.appendChild(error);
    }

    function resetFormFields(record) {
      getFormFields().forEach(function (field) {
        var fieldKey = field.dataset.pkListFormField;
        var defaultValue = field.dataset.pkListFormDefault || "";
        setFormFieldValue(field, record ? record[fieldKey] : defaultValue);
        clearFieldError(field);
      });
    }

    function openForm(recordId) {
      if (!formDialog) return;
      editingId = recordId || null;
      var record = editingId ? records.find(function (item) { return String(item[idKey]) === String(editingId); }) : null;
      resetFormFields(record || null);
      if (formTitle) formTitle.textContent = record ? (formConfig.editTitle || "编辑数据") : (formConfig.createTitle || "新增数据");
      setDialogVisible(formDialog, true);
    }

    function createRecordId() {
      var prefix = config.idPrefix || "pk-record-";
      var max = records.reduce(function (currentMax, record) {
        var match = String(record[idKey] || "").match(/(\d+)$/);
        return match ? Math.max(currentMax, Number(match[1])) : currentMax;
      }, 0);
      return prefix + String(max + 1).padStart(3, "0");
    }

    function validateForm(values) {
      var valid = true;
      getFormFields().forEach(function (field) {
        var fieldKey = field.dataset.pkListFormField;
        var label = field.dataset.pkListFormLabel || fieldKey;
        var value = values[fieldKey];
        clearFieldError(field);
        if (field.dataset.pkRequired === "true" && !String(value || "").trim()) {
          setFieldError(field, "请选择或填写" + label);
          valid = false;
          return;
        }
        if (field.dataset.pkListFieldType === "number" && value !== "") {
          var numberValue = Number(value);
          var minimum = Number(field.dataset.pkListFieldMin);
          if (!Number.isFinite(numberValue) || (Number.isFinite(minimum) && numberValue < minimum)) {
            setFieldError(field, label + "必须大于 0");
            valid = false;
          }
        }
      });

      var uniqueBy = Array.isArray(formConfig.uniqueBy) ? formConfig.uniqueBy : [];
      if (valid && uniqueBy.length) {
        var duplicate = records.some(function (record) {
          if (editingId && String(record[idKey]) === String(editingId)) return false;
          return uniqueBy.every(function (key) {
            return normalizeSearchValue(record[key]) === normalizeSearchValue(values[key]);
          });
        });
        if (duplicate) {
          var firstUniqueField = getFormFields().find(function (field) {
            return field.dataset.pkListFormField === uniqueBy[0];
          });
          if (firstUniqueField) setFieldError(firstUniqueField, formConfig.uniqueMessage || "已存在相同数据");
          valid = false;
        }
      }
      return valid;
    }

    function saveForm() {
      var wasEditing = !!editingId;
      var values = {};
      getFormFields().forEach(function (field) {
        values[field.dataset.pkListFormField] = getFormFieldValue(field);
      });
      if (!validateForm(values)) {
        showMessage(doc, "请检查表单中的错误项", "error");
        return;
      }

      if (editingId) {
        records = records.map(function (record) {
          return String(record[idKey]) === String(editingId) ? Object.assign({}, record, values) : record;
        });
      } else {
        values[idKey] = createRecordId();
        records.push(values);
      }
      persistRecords();
      currentPage = 1;
      renderRows();
      setDialogVisible(formDialog, false);
      showMessage(doc, wasEditing ? "修改成功" : "新增成功", "success");
      editingId = null;
      resetFormFields(null);
    }

    function requestDelete(recordIds) {
      var ids = recordIds.filter(Boolean).map(String);
      if (!ids.length) {
        showMessage(doc, deleteConfig.noSelectionMessage || "请先勾选需要删除的数据", "warning");
        return;
      }
      var selectedRecords = records.filter(function (record) {
        return ids.indexOf(String(record[idKey])) !== -1;
      });
      var blockField = deleteConfig.blockField;
      var blockers = blockField ? selectedRecords.filter(function (record) { return !!record[blockField]; }) : [];
      if (blockers.length) {
        var blockerNames = blockers.map(function (record) {
          var displayField = deleteConfig.displayField || idKey;
          return record[displayField] + "（" + record[blockField] + "）";
        }).join("、");
        showMessage(doc, (deleteConfig.blockedMessage || "存在被引用的数据，未执行删除：") + blockerNames, "error", 3600);
        return;
      }
      pendingDeleteIds = ids;
      if (deleteMessage) {
        deleteMessage.textContent = ids.length === 1
          ? (deleteConfig.singleConfirmMessage || "确定删除该条数据吗？删除后不可恢复。")
          : "确定删除已选择的 " + ids.length + " 条数据吗？删除后不可恢复。";
      }
      if (deleteDialog) setDialogVisible(deleteDialog, true);
    }

    function confirmDelete() {
      if (!pendingDeleteIds.length) return;
      var deleteCount = pendingDeleteIds.length;
      records = records.filter(function (record) {
        return pendingDeleteIds.indexOf(String(record[idKey])) === -1;
      });
      pendingDeleteIds = [];
      persistRecords();
      renderRows();
      if (deleteDialog) setDialogVisible(deleteDialog, false);
      showMessage(doc, "已删除 " + deleteCount + " 条数据", "success");
    }

    function csvCell(value) {
      var text = String(value == null ? "" : value).replace(/\r?\n/g, " ");
      if (/^[=+\-@]/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    }

    function exportRecords() {
      var rows = getFilteredRecords();
      if (!rows.length) {
        showMessage(doc, "当前没有可导出的数据", "warning");
        return;
      }
      var csv = [config.columns.map(function (column) { return csvCell(column.label); }).join(",")]
        .concat(rows.map(function (record) {
          return config.columns.map(function (column) { return csvCell(record[column.key]); }).join(",");
        })).join("\r\n");
      try {
        var blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
        var url = view.URL.createObjectURL(blob);
        var link = doc.createElement("a");
        link.href = url;
        link.download = config.exportFileName || "列表数据.csv";
        doc.body.appendChild(link);
        link.click();
        link.remove();
        view.URL.revokeObjectURL(url);
        showMessage(doc, "已导出 " + rows.length + " 条数据", "success");
      } catch (error) {
        showMessage(doc, "导出失败，请稍后重试", "error");
      }
    }

    function setFilterLabel(name) {
      if (filterLabel) filterLabel.textContent = name || "选择过滤器";
    }

    function renderFilters() {
      var presets = Array.isArray(config.presets) ? config.presets : [];
      if (presetFilterList) {
        presetFilterList.innerHTML = presets.length ? presets.map(function (filter) {
          return '<button class="pk-query-filter-option ' + (currentFilterId === "preset:" + filter.id ? "is-selected" : "") + '" type="button" data-pk-query-filter-value="' + escapeListHtml(filter.id) + '" data-pk-query-filter-kind="preset">' + escapeListHtml(filter.name) + "</button>";
        }).join("") : '<div class="pk-query-filter-empty">暂无过滤器</div>';
      }
      if (personalFilterList) {
        personalFilterList.innerHTML = personalFilters.length ? personalFilters.map(function (filter) {
          return [
            '<div class="pk-query-filter-entry">',
            '<button class="pk-query-filter-option ' + (currentFilterId === filter.id ? "is-selected" : "") + '" type="button" data-pk-query-filter-value="' + escapeListHtml(filter.id) + '" data-pk-query-filter-kind="personal">' + escapeListHtml(filter.name) + "</button>",
            '<button class="pk-query-filter-entry-action" type="button" data-pk-query-filter-edit="' + escapeListHtml(filter.id) + '" title="重命名">改名</button>',
            '<button class="pk-query-filter-entry-action" type="button" data-pk-query-filter-delete="' + escapeListHtml(filter.id) + '" title="删除">删除</button>',
            "</div>"
          ].join("");
        }).join("") : '<div class="pk-query-filter-empty">暂无过滤器</div>';
      }
    }

    function applyFilter(filter, filterId) {
      if (!filter) return;
      setCriteria(clone(filter.criteria || {}));
      committedCriteria = readCriteria();
      currentFilterId = filterId;
      currentPage = 1;
      setFilterLabel(filter.name);
      renderFilters();
      renderRows();
    }

    function nextFilterId() {
      var max = personalFilters.reduce(function (currentMax, filter) {
        var match = String(filter.id).match(/(\d+)$/);
        return match ? Math.max(currentMax, Number(match[1])) : currentMax;
      }, 0);
      return "filter-" + String(max + 1).padStart(3, "0");
    }

    function openFilterDialog(mode, filterId) {
      if (!filterDialog || !filterNameInput) return;
      pendingFilterMode = mode;
      pendingFilterId = filterId || null;
      var filter = pendingFilterId ? personalFilters.find(function (item) { return item.id === pendingFilterId; }) : null;
      filterNameInput.value = filter ? filter.name : "";
      if (filterDialogTitle) filterDialogTitle.textContent = mode === "rename" ? "重命名过滤方案" : (mode === "save" ? "保存过滤方案" : "另存过滤方案");
      setDialogVisible(filterDialog, true);
      view.setTimeout(function () { filterNameInput.focus(); }, 0);
    }

    function confirmFilterDialog() {
      var name = filterNameInput ? filterNameInput.value.trim() : "";
      if (!name) {
        showMessage(doc, "请输入过滤方案名称", "warning");
        return;
      }
      var duplicate = personalFilters.some(function (filter) {
        return filter.id !== pendingFilterId && filter.name === name;
      });
      if (duplicate) {
        showMessage(doc, "过滤方案名称已存在", "warning");
        return;
      }

      if (pendingFilterMode === "rename") {
        var renameTarget = personalFilters.find(function (filter) { return filter.id === pendingFilterId; });
        if (renameTarget) renameTarget.name = name;
      } else {
        var newFilter = { id: nextFilterId(), name: name, criteria: readCriteria() };
        personalFilters.push(newFilter);
        currentFilterId = newFilter.id;
      }
      persistFilters();
      renderFilters();
      var activeFilter = personalFilters.find(function (filter) { return filter.id === currentFilterId; });
      if (activeFilter) setFilterLabel(activeFilter.name);
      setDialogVisible(filterDialog, false);
      showMessage(doc, pendingFilterMode === "rename" ? "过滤方案已重命名" : "过滤方案已保存", "success");
    }

    function saveCurrentFilter() {
      var activeFilter = personalFilters.find(function (filter) { return filter.id === currentFilterId; });
      if (!activeFilter) {
        openFilterDialog("save");
        return;
      }
      activeFilter.criteria = readCriteria();
      persistFilters();
      showMessage(doc, "过滤方案已更新", "success");
    }

    var records = loadRecords();
    var personalFilters = loadFilters();
    var committedCriteria = readCriteria();

    if (pageSizeControl) {
      var pageSizes = Array.isArray(config.pageSizes) && config.pageSizes.length ? config.pageSizes : [10, 20, 50];
      pageSizeControl.innerHTML = pageSizes.map(function (size) {
        return '<option value="' + Number(size) + '">' + Number(size) + "条/页</option>";
      }).join("");
      if (pageSizes.indexOf(defaultPageSize) === -1) defaultPageSize = Number(pageSizes[0]);
      pageSize = defaultPageSize;
    }

    function handleFilterPanelAction(event) {
      var filterOption = event.target.closest("[data-pk-query-filter-kind]");
      if (filterOption) {
        var filterId = filterOption.dataset.pkQueryFilterValue;
        if (filterOption.dataset.pkQueryFilterKind === "preset") {
          var preset = (config.presets || []).find(function (filter) { return String(filter.id) === String(filterId); });
          applyFilter(preset, "preset:" + filterId);
        } else {
          var personalFilter = personalFilters.find(function (filter) { return String(filter.id) === String(filterId); });
          applyFilter(personalFilter, filterId);
        }
        return;
      }

      var editFilter = event.target.closest("[data-pk-query-filter-edit]");
      if (editFilter) {
        openFilterDialog("rename", editFilter.dataset.pkQueryFilterEdit);
        return;
      }

      var deleteFilter = event.target.closest("[data-pk-query-filter-delete]");
      if (!deleteFilter) return;
      var deletingId = deleteFilter.dataset.pkQueryFilterDelete;
      personalFilters = personalFilters.filter(function (filter) { return filter.id !== deletingId; });
      if (currentFilterId === deletingId) {
        currentFilterId = null;
        setFilterLabel();
      }
      persistFilters();
      renderFilters();
      showMessage(doc, "过滤方案已删除", "success");
    }

    var queryFilterPanel = workbench.querySelector("[data-pk-query-filter-panel]");
    if (queryFilterPanel) queryFilterPanel.addEventListener("click", handleFilterPanelAction);

    workbench.addEventListener("click", function (event) {
      var actionButton = event.target.closest("[data-pk-list-action]");
      if (actionButton && workbench.contains(actionButton)) {
        var action = actionButton.dataset.pkListAction;
        if (action === "search") {
          committedCriteria = readCriteria();
          currentFilterId = null;
          currentPage = 1;
          setFilterLabel();
          renderFilters();
          renderRows();
        }
        if (action === "reset") {
          setCriteria({});
          committedCriteria = readCriteria();
          currentFilterId = null;
          currentPage = 1;
          setFilterLabel();
          renderFilters();
          renderRows();
        }
        if (action === "create") openForm();
        if (action === "delete") requestDelete(selectedRecordIds());
        if (action === "export") exportRecords();
        if (action === "refresh") {
          setLoadingState(surface, true);
          view.setTimeout(function () {
            records = loadRecords();
            currentPage = 1;
            renderRows();
            setLoadingState(surface, false);
            showMessage(doc, "数据已刷新", "success");
          }, 260);
        }
        if (action === "save-filter") saveCurrentFilter();
        if (action === "save-filter-as") openFilterDialog("saveAs");
      }

      var rowAction = event.target.closest("[data-pk-list-row-action]");
      if (rowAction && workbench.contains(rowAction)) {
        var recordId = rowAction.dataset.pkListRecordId;
        if (rowAction.dataset.pkListRowAction === "edit") openForm(recordId);
        if (rowAction.dataset.pkListRowAction === "delete") requestDelete([recordId]);
      }

      var pageButton = event.target.closest("[data-pk-list-page]");
      if (pageButton) {
        currentPage = Number(pageButton.dataset.pkListPage) || 1;
        renderRows();
      }

    });

    workbench.addEventListener("pk:select-change", function (event) {
      var querySelect = event.target.closest("[data-pk-query-field]");
      if (!querySelect || !workbench.contains(querySelect)) return;
      committedCriteria = readCriteria();
      currentFilterId = null;
      currentPage = 1;
      setFilterLabel();
      renderFilters();
      renderRows();
    });

    workbench.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && (event.target === keywordInput || event.target.matches("[data-pk-query-field]"))) {
        event.preventDefault();
        committedCriteria = readCriteria();
        currentFilterId = null;
        currentPage = 1;
        setFilterLabel();
        renderFilters();
        renderRows();
      }
      if (event.key === "Enter" && event.target === pageInput) {
        event.preventDefault();
        currentPage = Number(pageInput.value) || 1;
        renderRows();
      }
    });

    if (previousPageButton) previousPageButton.addEventListener("click", function () {
      if (currentPage > 1) {
        currentPage -= 1;
        renderRows();
      }
    });
    if (nextPageButton) nextPageButton.addEventListener("click", function () {
      currentPage += 1;
      renderRows();
    });
    if (pageSizeControl) pageSizeControl.addEventListener("change", function () {
      pageSize = Number(pageSizeControl.value) || defaultPageSize;
      currentPage = 1;
      renderRows();
    });
    if (pageInput) pageInput.addEventListener("change", function () {
      currentPage = Number(pageInput.value) || 1;
      renderRows();
    });

    if (formSaveButton) formSaveButton.addEventListener("click", saveForm);
    if (deleteConfirmButton) deleteConfirmButton.addEventListener("click", confirmDelete);
    if (filterConfirmButton) filterConfirmButton.addEventListener("click", confirmFilterDialog);
    if (filterNameInput) filterNameInput.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      confirmFilterDialog();
    });

    if (formDialog) {
      formDialog.addEventListener("click", function (event) {
        if (!event.target.closest("[data-pk-dialog-close]")) return;
        editingId = null;
        resetFormFields(null);
      });
      formDialog.addEventListener("input", function (event) {
        var field = event.target.closest("[data-pk-list-form-field]");
        if (field) clearFieldError(field);
      });
      formDialog.addEventListener("pk:reference-change", function (event) {
        var sourceField = event.target.closest("[data-pk-list-form-field]");
        var linkage = formConfig.linkage && sourceField ? formConfig.linkage[sourceField.dataset.pkListFormField] : null;
        if (!linkage || !event.detail || !event.detail.row) return;
        Object.keys(linkage).forEach(function (targetKey) {
          var targetField = formDialog.querySelector('[data-pk-list-form-field="' + targetKey + '"]');
          if (targetField) setFormFieldValue(targetField, event.detail.row[linkage[targetKey]]);
        });
        clearFieldError(sourceField);
      });
    }

    renderFilters();
    renderRows();
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
      var listSelectAll = workbench.querySelector("[data-pk-list-select-all]");
      var listSelectedCount = workbench.querySelector("[data-pk-list-selected-count]");
      var queryReferencePopover = workbench.querySelector("[data-pk-query-reference-popover]");
      var queryReferenceTable = workbench.querySelector("[data-pk-query-reference-table]");
      var queryReferenceCount = workbench.querySelector("[data-pk-query-reference-count]");
      var queryReferenceDataScript = workbench.querySelector("[data-pk-query-reference-data]");
      var queryReferenceData = {};
      var pendingQueryReferenceValues = [];

      if (queryReferenceDataScript) {
        try {
          queryReferenceData = JSON.parse(queryReferenceDataScript.textContent || "{}");
        } catch (error) {
          queryReferenceData = {};
        }
      }

      function escapeListHtml(value) {
        return String(value == null ? "" : value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
      }

      function getListRowCheckboxes() {
        return Array.from(workbench.querySelectorAll("[data-pk-list-row-select]"));
      }

      function syncListSelection() {
        var rowCheckboxes = getListRowCheckboxes();
        var selected = rowCheckboxes.filter(function (checkbox) { return checkbox.checked; }).length;
        if (listSelectedCount) listSelectedCount.textContent = selected;
        if (!listSelectAll) return;
        listSelectAll.checked = rowCheckboxes.length > 0 && selected === rowCheckboxes.length;
        listSelectAll.indeterminate = selected > 0 && selected < rowCheckboxes.length;
        listSelectAll.classList.toggle("is-indeterminate", listSelectAll.indeterminate);
      }

      function readQueryReferenceValues(trigger) {
        var input = trigger ? trigger.querySelector("[data-pk-query-reference-input]") : null;
        if (!input || !input.value) return [];
        try {
          var parsed = JSON.parse(input.value);
          return Array.isArray(parsed) ? parsed.map(String) : [];
        } catch (error) {
          return [];
        }
      }

      function setQueryReferenceValue(trigger, values) {
        var input = trigger.querySelector("[data-pk-query-reference-input]");
        var value = trigger.querySelector("[data-pk-query-reference-value]");
        var placeholder = trigger.dataset.pkPlaceholder || "请选择";
        if (input) input.value = JSON.stringify(values);
        if (value) {
          value.textContent = values.length ? values.join("、") : placeholder;
          value.classList.toggle("placeholder", values.length === 0);
          value.title = values.join("、");
        }
        if (input && doc.defaultView && typeof doc.defaultView.Event === "function") {
          input.dispatchEvent(new doc.defaultView.Event("change", { bubbles: true }));
        }
      }

      function syncQueryReferenceSelection() {
        if (!queryReferencePopover) return;
        var rows = Array.from(queryReferencePopover.querySelectorAll("[data-pk-query-reference-value]"));
        rows.forEach(function (row) {
          var value = row.dataset.pkQueryReferenceValue;
          var selected = pendingQueryReferenceValues.indexOf(value) !== -1;
          var checkbox = row.querySelector("[data-pk-query-reference-checkbox]");
          row.classList.toggle("is-selected", selected);
          if (checkbox) checkbox.checked = selected;
        });
        var selectAll = queryReferencePopover.querySelector("[data-pk-query-reference-select-all]");
        if (selectAll) {
          var selectedInView = rows.filter(function (row) {
            return pendingQueryReferenceValues.indexOf(row.dataset.pkQueryReferenceValue) !== -1;
          }).length;
          selectAll.checked = rows.length > 0 && selectedInView === rows.length;
          selectAll.indeterminate = selectedInView > 0 && selectedInView < rows.length;
          selectAll.classList.toggle("is-indeterminate", selectAll.indeterminate);
        }
        if (queryReferenceCount) queryReferenceCount.textContent = "已选 " + pendingQueryReferenceValues.length + " 项";
      }

      function renderQueryReferenceOptions(trigger) {
        if (!queryReferenceTable) return null;
        var source = trigger.dataset.pkQueryReferenceTrigger;
        var config = queryReferenceData[source];
        if (!config || !Array.isArray(config.columns) || !Array.isArray(config.rows)) return null;
        var valueKey = config.valueKey || "value";
        pendingQueryReferenceValues = readQueryReferenceValues(trigger);
        queryReferenceTable.innerHTML = [
          "<colgroup><col style=\"width: 42px\">",
          config.columns.map(function (column) {
            var width = Number(column.width);
            return '<col style="width: ' + (Number.isFinite(width) ? width : 160) + 'px">';
          }).join(""),
          "</colgroup><thead><tr>",
          '<th class="is-center"><input class="pk-table-checkbox" type="checkbox" data-pk-query-reference-select-all aria-label="全选"></th>',
          config.columns.map(function (column) { return "<th>" + escapeListHtml(column.label) + "</th>"; }).join(""),
          "</tr></thead><tbody>",
          config.rows.map(function (row) {
            var rowValue = String(row[valueKey] == null ? "" : row[valueKey]);
            var selected = pendingQueryReferenceValues.indexOf(rowValue) !== -1;
            return [
              '<tr class="' + (selected ? "is-selected" : "") + '" data-pk-query-reference-value="' + escapeListHtml(rowValue) + '">',
              '<td class="is-center"><input class="pk-table-checkbox" type="checkbox" data-pk-query-reference-checkbox aria-label="选择' + escapeListHtml(rowValue) + '" ' + (selected ? "checked" : "") + "></td>",
              config.columns.map(function (column) { return "<td>" + escapeListHtml(row[column.key]) + "</td>"; }).join(""),
              "</tr>"
            ].join("");
          }).join(""),
          "</tbody>"
        ].join("");
        syncQueryReferenceSelection();
        return config;
      }

      function positionQueryReferencePopover(trigger, config) {
        if (!queryReferencePopover) return;
        var rect = trigger.getBoundingClientRect();
        var contentWidth = 42 + config.columns.reduce(function (total, column) {
          var width = Number(column.width);
          return total + (Number.isFinite(width) ? width : 160);
        }, 0);
        var width = Math.min(Math.max(380, contentWidth), 720, window.innerWidth - 24);
        var left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
        queryReferencePopover.style.width = width + "px";
        queryReferencePopover.style.left = left + "px";
        queryReferencePopover.style.top = rect.bottom + 10 + "px";
        var arrow = queryReferencePopover.querySelector(".pk-query-reference-arrow");
        if (arrow) arrow.style.left = Math.max(12, Math.min(rect.left - left + 24, width - 24)) + "px";
      }

      function closeQueryReferencePopover() {
        if (!queryReferencePopover) return;
        closeListWorkbenchPopovers(doc);
      }

      function toggleQueryReferencePopover(trigger) {
        if (!queryReferencePopover) return;
        var sameOpen = queryReferencePopover.classList.contains("is-open") && queryReferencePopover._activeTrigger === trigger;
        closeListWorkbenchPopovers(doc);
        if (sameOpen) return;
        var config = renderQueryReferenceOptions(trigger);
        if (!config) return;
        queryReferencePopover._activeTrigger = trigger;
        queryReferencePopover.hidden = false;
        queryReferencePopover.classList.add("is-open");
        queryReferencePopover.setAttribute("aria-hidden", "false");
        trigger.setAttribute("aria-expanded", "true");
        positionQueryReferencePopover(trigger, config);
      }

      syncListSelection();

      if (queryToggle && advanced) {
        queryToggle.addEventListener("click", function () {
          closeListWorkbenchPopovers(doc);
          var expanded = advanced.hidden;
          advanced.hidden = !expanded;
          queryToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
          queryToggle.textContent = expanded
            ? (queryToggle.dataset.pkCollapseLabel || "收起")
            : (queryToggle.dataset.pkExpandLabel || "展开");
        });
      }

      workbench.addEventListener("change", function (event) {
        if (event.target === listSelectAll) {
          getListRowCheckboxes().forEach(function (checkbox) {
            checkbox.checked = listSelectAll.checked;
          });
          syncListSelection();
          return;
        }
        if (event.target.matches("[data-pk-list-row-select]")) syncListSelection();
      });

      workbench.querySelectorAll("[data-pk-query-reference-trigger]").forEach(function (trigger) {
        trigger.addEventListener("click", function (event) {
          event.stopPropagation();
          toggleQueryReferencePopover(trigger);
        });
        trigger.addEventListener("keydown", function (event) {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          event.stopPropagation();
          toggleQueryReferencePopover(trigger);
        });
      });

      if (queryReferencePopover) {
        queryReferencePopover.addEventListener("click", function (event) {
          event.stopPropagation();
          var action = event.target.closest("[data-pk-query-reference-action]");
          if (action) {
            var activeTrigger = queryReferencePopover._activeTrigger;
            if (action.dataset.pkQueryReferenceAction === "clear") {
              pendingQueryReferenceValues = [];
              syncQueryReferenceSelection();
            }
            if (action.dataset.pkQueryReferenceAction === "cancel") {
              closeQueryReferencePopover();
              if (activeTrigger) activeTrigger.focus();
            }
            if (action.dataset.pkQueryReferenceAction === "confirm" && activeTrigger) {
              setQueryReferenceValue(activeTrigger, pendingQueryReferenceValues.slice());
              closeQueryReferencePopover();
              activeTrigger.focus();
            }
            return;
          }

          var row = event.target.closest("[data-pk-query-reference-value]");
          if (!row || event.target.closest("input")) return;
          var checkbox = row.querySelector("[data-pk-query-reference-checkbox]");
          if (!checkbox) return;
          checkbox.checked = !checkbox.checked;
          checkbox.dispatchEvent(new doc.defaultView.Event("change", { bubbles: true }));
        });

        queryReferencePopover.addEventListener("change", function (event) {
          var selectAll = event.target.closest("[data-pk-query-reference-select-all]");
          if (selectAll) {
            pendingQueryReferenceValues = selectAll.checked
              ? Array.from(queryReferencePopover.querySelectorAll("[data-pk-query-reference-value]")).map(function (row) {
                  return row.dataset.pkQueryReferenceValue;
                })
              : [];
            syncQueryReferenceSelection();
            return;
          }

          var checkbox = event.target.closest("[data-pk-query-reference-checkbox]");
          if (!checkbox) return;
          var row = checkbox.closest("[data-pk-query-reference-value]");
          if (!row) return;
          var value = row.dataset.pkQueryReferenceValue;
          var index = pendingQueryReferenceValues.indexOf(value);
          if (checkbox.checked && index === -1) pendingQueryReferenceValues.push(value);
          if (!checkbox.checked && index !== -1) pendingQueryReferenceValues.splice(index, 1);
          syncQueryReferenceSelection();
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

      initConfiguredListWorkbench(workbench, doc, syncListSelection);
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

  function syncOverlayLock(doc) {
    var hasVisibleLayer = !!doc.querySelector(".pk-dialog-mask.is-visible, .pk-drawer-mask.is-visible");
    doc.body.classList.toggle("pk-dialog-open", hasVisibleLayer);
  }

  function initErpModules(root) {
    var doc = root && root.nodeType === 9 ? root : (root.ownerDocument || document);

    root.querySelectorAll("[data-pk-erp-column-manager]").forEach(function (manager) {
      if (!markReady(manager, "pkErpColumnReady")) return;
      var trigger = manager.querySelector("[data-pk-erp-column-trigger]");
      var panel = manager.querySelector("[data-pk-erp-column-panel]");
      var module = manager.closest("[data-pk-erp-module]");
      var table = module ? module.querySelector("[data-pk-erp-table]") : null;
      if (!trigger || !panel || !table) return;

      trigger.addEventListener("click", function () {
        var opening = panel.hidden;
        doc.querySelectorAll("[data-pk-erp-column-panel]").forEach(function (item) {
          item.hidden = true;
        });
        panel.hidden = !opening;
        trigger.setAttribute("aria-expanded", opening ? "true" : "false");
      });

      manager.addEventListener("change", function (event) {
        var checkbox = event.target.closest("[data-pk-erp-column-index]");
        if (!checkbox) return;
        var index = Number(checkbox.dataset.pkErpColumnIndex);
        table.querySelectorAll("tr").forEach(function (row) {
          if (row.children[index]) row.children[index].hidden = !checkbox.checked;
        });
      });
    });

    root.querySelectorAll("[data-pk-erp-fullscreen]").forEach(function (button) {
      if (!markReady(button, "pkErpFullscreenReady")) return;
      button.addEventListener("click", function () {
        var module = button.closest("[data-pk-erp-module]");
        if (!module) return;
        var fullscreen = !module.classList.contains("is-fullscreen");
        module.classList.toggle("is-fullscreen", fullscreen);
        button.setAttribute("aria-pressed", fullscreen ? "true" : "false");
        button.setAttribute("aria-label", fullscreen ? "退出全屏" : "全屏");
        button.title = fullscreen ? "退出全屏" : "全屏";
        doc.body.classList.toggle("pk-erp-fullscreen-active", !!doc.querySelector("[data-pk-erp-module].is-fullscreen"));
      });
    });

    root.querySelectorAll("[data-pk-audit-log]").forEach(function (panel) {
      if (!markReady(panel, "pkAuditLogReady")) return;
      var userInput = panel.querySelector("[data-pk-audit-user]");
      var startInput = panel.querySelector("[data-pk-audit-start-date]");
      var endInput = panel.querySelector("[data-pk-audit-end-date]");
      var keywordInput = panel.querySelector("[data-pk-audit-keyword]");
      var searchButton = panel.querySelector("[data-pk-audit-search]");
      var rows = Array.from(panel.querySelectorAll("[data-pk-audit-row]"));
      var emptyRow = panel.querySelector("[data-pk-audit-empty]");
      var count = panel.querySelector("[data-pk-audit-count]");

      function applyFilters() {
        var user = userInput ? userInput.value.trim().toLowerCase() : "";
        var startDate = startInput ? startInput.value.trim() : "";
        var endDate = endInput ? endInput.value.trim() : "";
        var keyword = keywordInput ? keywordInput.value.trim().toLowerCase() : "";
        var visibleCount = 0;

        rows.forEach(function (row) {
          var rowUser = String(row.dataset.pkAuditUser || "").toLowerCase();
          var rowDate = String(row.dataset.pkAuditDate || "");
          var rowText = row.textContent.toLowerCase();
          var visible = (!user || rowUser.indexOf(user) >= 0) &&
            (!startDate || rowDate >= startDate) &&
            (!endDate || rowDate <= endDate) &&
            (!keyword || rowText.indexOf(keyword) >= 0);
          row.hidden = !visible;
          if (visible) visibleCount += 1;
        });

        if (emptyRow) emptyRow.hidden = visibleCount !== 0;
        if (count) count.textContent = String(visibleCount);
      }

      if (searchButton) searchButton.addEventListener("click", applyFilters);
      [userInput, startInput, endInput, keywordInput].forEach(function (input) {
        if (!input) return;
        input.addEventListener("keydown", function (event) {
          if (event.key === "Enter") applyFilters();
        });
      });
    });

    if (markReady(doc.documentElement, "pkErpModuleDocumentReady")) {
      doc.addEventListener("click", function (event) {
        if (event.target.closest("[data-pk-erp-column-manager]")) return;
        doc.querySelectorAll("[data-pk-erp-column-panel]").forEach(function (panel) {
          panel.hidden = true;
          var trigger = panel.parentElement && panel.parentElement.querySelector("[data-pk-erp-column-trigger]");
          if (trigger) trigger.setAttribute("aria-expanded", "false");
        });
      });
      doc.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") return;
        var fullscreenModule = doc.querySelector("[data-pk-erp-module].is-fullscreen");
        if (!fullscreenModule) return;
        fullscreenModule.classList.remove("is-fullscreen");
        var button = fullscreenModule.querySelector("[data-pk-erp-fullscreen]");
        if (button) {
          button.setAttribute("aria-pressed", "false");
          button.setAttribute("aria-label", "全屏");
          button.title = "全屏";
        }
        doc.body.classList.remove("pk-erp-fullscreen-active");
      });
    }
  }

  function initTabs(root) {
    root.querySelectorAll("[data-pk-tabs]").forEach(function (tabs) {
      if (!markReady(tabs, "pkTabsReady")) return;
      var tabButtons = Array.from(tabs.querySelectorAll("[data-pk-tab]"));

      function activateTab(tab) {
        tabButtons.forEach(function (item) {
          var active = item === tab;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-selected", active ? "true" : "false");
          item.setAttribute("tabindex", active ? "0" : "-1");
        });
        tabs.querySelectorAll("[data-pk-tab-panel]").forEach(function (panel) {
          panel.hidden = panel.dataset.pkTabPanel !== tab.dataset.pkTab;
        });
      }

      tabs.addEventListener("click", function (event) {
        var tab = event.target.closest("[data-pk-tab]");
        if (tab && tabs.contains(tab)) activateTab(tab);
      });

      tabs.addEventListener("keydown", function (event) {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        var activeIndex = tabButtons.indexOf(event.target.closest("[data-pk-tab]"));
        if (activeIndex < 0) return;
        event.preventDefault();
        var offset = event.key === "ArrowRight" ? 1 : -1;
        var next = tabButtons[(activeIndex + offset + tabButtons.length) % tabButtons.length];
        activateTab(next);
        next.focus();
      });

      var activeTab = tabs.querySelector("[data-pk-tab].is-active") || tabButtons[0];
      if (activeTab) activateTab(activeTab);
    });
  }

  function initAlerts(root) {
    root.querySelectorAll("[data-pk-alert-close]").forEach(function (button) {
      if (!markReady(button, "pkAlertCloseReady")) return;
      button.addEventListener("click", function () {
        var alert = button.closest(".pk-alert");
        if (alert) alert.hidden = true;
      });
    });
  }

  function setLoadingState(target, loading) {
    if (!target) return;
    target.classList.toggle("is-loading", loading);
    target.setAttribute("aria-busy", loading ? "true" : "false");
    var loadingMask = target.querySelector(".pk-loading-mask");
    if (loadingMask) loadingMask.setAttribute("aria-hidden", loading ? "false" : "true");
  }

  function initLoading(root) {
    var doc = root && root.nodeType === 9 ? root : (root.ownerDocument || document);
    root.querySelectorAll("[data-pk-loading-toggle]").forEach(function (button) {
      if (!markReady(button, "pkLoadingToggleReady")) return;
      button.addEventListener("click", function () {
        var target = doc.getElementById(button.getAttribute("data-pk-loading-toggle"));
        if (!target) return;
        var loading = !target.classList.contains("is-loading");
        setLoadingState(target, loading);
        button.textContent = loading ? "结束加载" : "模拟加载";
      });
    });
  }

  function showMessage(doc, message, type, duration) {
    var host = doc.querySelector("[data-pk-message-host]");
    if (!host) {
      host = doc.createElement("div");
      host.className = "pk-message-host";
      host.setAttribute("data-pk-message-host", "");
      host.setAttribute("aria-live", "polite");
      host.setAttribute("aria-atomic", "true");
      doc.body.appendChild(host);
    }
    var normalizedType = type === "warning" || type === "error" ? type : "success";
    var item = doc.createElement("div");
    item.className = "pk-message is-" + normalizedType;
    item.setAttribute("role", normalizedType === "error" ? "alert" : "status");
    item.textContent = message || "操作成功";
    host.appendChild(item);
    window.setTimeout(function () {
      if (item.parentNode) item.parentNode.removeChild(item);
    }, duration || 2200);
    return item;
  }

  function initMessages(root) {
    var doc = root && root.nodeType === 9 ? root : (root.ownerDocument || document);
    root.querySelectorAll("[data-pk-message-text]").forEach(function (button) {
      if (!markReady(button, "pkMessageReady")) return;
      button.addEventListener("click", function () {
        showMessage(doc, button.dataset.pkMessageText, button.dataset.pkMessageType);
      });
    });
  }

  function setDrawerVisible(mask, visible) {
    if (!mask) return;
    mask.classList.toggle("is-visible", visible);
    mask.setAttribute("aria-hidden", visible ? "false" : "true");
    var doc = mask.ownerDocument;
    syncOverlayLock(doc);
    if (visible) {
      refreshTableSpacers(mask);
      var firstControl = mask.querySelector("button, input, select, textarea, [tabindex='0']");
      if (firstControl) firstControl.focus();
    }
  }

  function initDrawers(root) {
    var doc = root && root.nodeType === 9 ? root : (root.ownerDocument || document);
    root.querySelectorAll("[data-pk-drawer-open]").forEach(function (button) {
      if (!markReady(button, "pkDrawerOpenReady")) return;
      button.addEventListener("click", function () {
        setDrawerVisible(doc.getElementById(button.getAttribute("data-pk-drawer-open")), true);
      });
    });
    root.querySelectorAll(".pk-drawer-mask").forEach(function (mask) {
      if (!markReady(mask, "pkDrawerReady")) return;
      mask.addEventListener("click", function (event) {
        if (event.target === mask || event.target.closest("[data-pk-drawer-close]")) {
          setDrawerVisible(mask, false);
        }
      });
    });
    if (markReady(doc.documentElement, "pkDrawerDocumentReady")) {
      doc.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") return;
        var drawers = Array.from(doc.querySelectorAll(".pk-drawer-mask.is-visible"));
        setDrawerVisible(drawers[drawers.length - 1], false);
      });
    }
  }

  function setDialogVisible(mask, visible) {
    if (!mask) return;
    mask.classList.toggle("is-visible", visible);
    mask.setAttribute("aria-hidden", visible ? "false" : "true");
    var doc = mask.ownerDocument;
    syncOverlayLock(doc);
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
        var group = tab.closest("[data-pk-document-tab-group]") || tab.closest(".pk-dialog--document-detail");
        if (!group) return;
        group.querySelectorAll("[data-pk-document-tab]").forEach(function (item) {
          item.classList.toggle("is-active", item === tab);
          item.setAttribute("aria-selected", item === tab ? "true" : "false");
        });
        group.querySelectorAll("[data-pk-document-panel]").forEach(function (panel) {
          panel.hidden = panel.dataset.pkDocumentPanel !== tab.dataset.pkDocumentTab;
        });
        refreshTableSpacers(group);
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
    initErpModules(scope);
    initTabs(scope);
    initAlerts(scope);
    initLoading(scope);
    initMessages(scope);
    initDrawers(scope);
    initDialogs(scope);
    scope.querySelectorAll("[data-pk-indeterminate]").forEach(function (checkbox) {
      checkbox.indeterminate = true;
      checkbox.classList.add("is-indeterminate");
    });
  }

  window.PrototypeKit = {
    init: initPrototypeKit,
    refreshTables: refreshTableSpacers,
    message: function (message, type, duration) {
      return showMessage(document, message, type, duration);
    },
    setLoading: setLoadingState,
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
