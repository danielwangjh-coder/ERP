(function () {
  "use strict";

  const menuData = Array.isArray(window.ERP_MENU) ? window.ERP_MENU : [];
  const sidebar = document.getElementById("sidebar");
  const sidebarMenu = document.getElementById("sidebarMenu");
  const menuTrigger = document.getElementById("menuTrigger");
  const thirdMenuPanel = document.getElementById("thirdMenuPanel");
  const thirdMenuMask = document.getElementById("thirdMenuMask");
  const thirdMenuContent = document.getElementById("thirdMenuContent");
  const thirdMenuAnchor = document.getElementById("thirdMenuAnchor");
  const anchorSlider = document.getElementById("anchorSlider");
  const emptyView = document.getElementById("emptyView");
  const emptyDescription = document.getElementById("emptyDescription");
  const pageFrame = document.getElementById("pageFrame");
  const workspaceTabs = document.getElementById("workspaceTabs");
  const workspaceTabsNav = document.getElementById("workspaceTabsNav");
  const workspaceTabsActiveBar = document.getElementById("workspaceTabsActiveBar");
  const menuSearch = document.getElementById("menuSearch");
  const menuSearchControl = document.getElementById("menuSearchControl");
  const menuSearchInput = document.getElementById("menuSearchInput");
  const menuSearchClear = document.getElementById("menuSearchClear");
  const menuSearchPanel = document.getElementById("menuSearchPanel");
  const menuSearchSummaryText = document.getElementById("menuSearchSummaryText");
  const menuSearchTotal = document.getElementById("menuSearchTotal");
  const menuSearchResults = document.getElementById("menuSearchResults");
  const menuSearchEmpty = document.getElementById("menuSearchEmpty");

  const openModules = new Set(["supply-chain-management"]);
  const flatItems = [];
  const openTabs = [];
  let currentItem = null;
  let activeThirdMenu = null;
  let menuSearchMatches = [];
  let menuSearchActiveIndex = -1;

  const create = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (typeof text === "string") element.textContent = text;
    return element;
  };

  menuData.forEach((module) => {
    (module.children || []).forEach((second) => {
      if (Array.isArray(second.groups)) {
        second.groups.forEach((group) => {
          (group.items || []).forEach((item) => {
            const menuItem = Object.assign({}, item, { module, second, group });
            flatItems.push(menuItem);
            (item.views || []).forEach((view) => {
              flatItems.push(Object.assign({}, menuItem, view, { menuRoute: item.route }));
            });
          });
        });
        return;
      }

      flatItems.push(Object.assign({}, second, { module, second, group: null }));
    });
  });

  function menuSearchPath(item) {
    const labels = [];
    if (item.module && item.module.label) labels.push(item.module.label);
    if (item.second && item.second.id !== item.id && item.second.label) labels.push(item.second.label);
    if (item.group && item.group.label) labels.push(item.group.label);
    return labels.slice(0, 3);
  }

  function normalizeMenuSearchValue(value) {
    return String(value || "").trim().toLowerCase();
  }

  const searchableMenuItems = flatItems
    .filter((item) => !item.menuRoute)
    .map((item) => {
      const path = menuSearchPath(item);
      return {
        item,
        path,
        searchText: normalizeMenuSearchValue([item.label].concat(path).join(" "))
      };
    });

  function appendHighlightedText(container, text, keyword) {
    const source = String(text || "");
    const normalizedSource = source.toLowerCase();
    const normalizedKeyword = normalizeMenuSearchValue(keyword);
    if (!normalizedKeyword) {
      container.textContent = source;
      return;
    }

    let cursor = 0;
    let matchIndex = normalizedSource.indexOf(normalizedKeyword, cursor);
    while (matchIndex >= 0) {
      if (matchIndex > cursor) container.append(document.createTextNode(source.slice(cursor, matchIndex)));
      const mark = create("mark", "", source.slice(matchIndex, matchIndex + normalizedKeyword.length));
      container.append(mark);
      cursor = matchIndex + normalizedKeyword.length;
      matchIndex = normalizedSource.indexOf(normalizedKeyword, cursor);
    }
    if (cursor < source.length) container.append(document.createTextNode(source.slice(cursor)));
  }

  function setMenuSearchOpen(isOpen) {
    const shouldOpen = Boolean(isOpen);
    menuSearchPanel.hidden = !shouldOpen;
    menuSearchControl.classList.toggle("is-open", shouldOpen);
    menuSearchControl.setAttribute("aria-expanded", String(shouldOpen));
    if (!shouldOpen) menuSearchInput.removeAttribute("aria-activedescendant");
  }

  function setActiveMenuSearchResult(index, shouldScroll) {
    menuSearchActiveIndex = index;
    const resultButtons = menuSearchResults.querySelectorAll(".menu-search-result");
    resultButtons.forEach((button, buttonIndex) => {
      const isActive = buttonIndex === index;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });

    const activeButton = index >= 0 ? resultButtons[index] : null;
    if (!activeButton) {
      menuSearchInput.removeAttribute("aria-activedescendant");
      return;
    }
    menuSearchInput.setAttribute("aria-activedescendant", activeButton.id);
    if (shouldScroll) activeButton.scrollIntoView({ block: "nearest" });
  }

  function closeMenuSearch(clearValue) {
    setMenuSearchOpen(false);
    menuSearchActiveIndex = -1;
    if (!clearValue) return;
    menuSearchInput.value = "";
    menuSearchClear.hidden = true;
    menuSearchResults.replaceChildren();
    menuSearchEmpty.hidden = true;
  }

  function selectMenuSearchResult(index) {
    const match = menuSearchMatches[index];
    if (!match) return;
    closeMenuSearch(true);
    navigateTo(match.item);
  }

  function renderMenuSearchResults() {
    const keyword = menuSearchInput.value.trim();
    const normalizedKeyword = normalizeMenuSearchValue(keyword);
    menuSearchClear.hidden = menuSearchInput.value.length === 0;
    menuSearchResults.replaceChildren();
    menuSearchMatches = [];
    menuSearchActiveIndex = -1;

    if (!normalizedKeyword) {
      menuSearchEmpty.hidden = true;
      setMenuSearchOpen(false);
      return;
    }

    menuSearchMatches = searchableMenuItems.filter((entry) => entry.searchText.includes(normalizedKeyword));
    menuSearchSummaryText.textContent = "搜索 \"" + keyword + "\"";
    menuSearchTotal.textContent = String(menuSearchMatches.length);
    menuSearchEmpty.hidden = menuSearchMatches.length > 0;

    menuSearchMatches.forEach((entry, index) => {
      const resultButton = create("button", "menu-search-result");
      const title = create("span", "menu-search-result-title");
      const icon = create("span", "menu-search-result-icon");
      const label = create("span", "menu-search-result-label");
      const path = create("span", "menu-search-result-path");

      resultButton.type = "button";
      resultButton.id = "menu-search-result-" + index;
      resultButton.setAttribute("role", "option");
      resultButton.setAttribute("aria-selected", "false");
      resultButton.title = entry.item.label;
      appendHighlightedText(label, entry.item.label, keyword);
      title.append(icon, label);

      entry.path.forEach((pathLabel, pathIndex) => {
        if (pathIndex > 0) path.append(create("span", "menu-search-result-separator", ">"));
        path.append(create("span", "", pathLabel));
      });

      resultButton.append(title, path);
      resultButton.addEventListener("mouseenter", () => setActiveMenuSearchResult(index, false));
      resultButton.addEventListener("click", () => selectMenuSearchResult(index));
      menuSearchResults.append(resultButton);
    });

    setMenuSearchOpen(true);
    setActiveMenuSearchResult(menuSearchMatches.length ? 0 : -1, false);
  }

  const defaultItem = flatItems.find((item) => item.id === "sales-outbound-order") || flatItems[0] || null;

  function selectedSecondId() {
    if (activeThirdMenu) return activeThirdMenu.second.id;
    return currentItem && currentItem.second ? currentItem.second.id : "";
  }

  function renderSidebar() {
    sidebarMenu.replaceChildren();
    const activeModuleId = activeThirdMenu
      ? activeThirdMenu.module.id
      : currentItem && currentItem.module
        ? currentItem.module.id
        : "";

    menuData.forEach((module) => {
      const section = create("div", "menu-section");
      const isOpen = openModules.has(module.id);
      const isActive = activeModuleId === module.id;
      section.classList.toggle("open", isOpen);

      const menuItem = create("button", "menu-item");
      menuItem.type = "button";
      menuItem.title = module.label;
      menuItem.classList.toggle("active", isActive);
      menuItem.append(
        create("span", "menu-icon"),
        create("span", "menu-label", module.label),
        create("span", "menu-arrow")
      );

      const submenu = create("div", "submenu");
      (module.children || []).forEach((second) => {
        const submenuItem = create("button", "submenu-item");
        submenuItem.type = "button";
        submenuItem.title = second.label;
        submenuItem.classList.toggle("current", selectedSecondId() === second.id);
        submenuItem.append(create("span", "submenu-title", second.label));

        submenuItem.addEventListener("click", (event) => {
          event.stopPropagation();
          openModules.add(module.id);
          if (Array.isArray(second.groups)) {
            openThirdMenu(module, second);
          } else {
            navigateTo(Object.assign({}, second, { module, second, group: null }));
          }
        });
        submenu.append(submenuItem);
      });

      menuItem.addEventListener("click", () => {
        if (sidebar.classList.contains("collapsed")) sidebar.classList.remove("collapsed");
        if (openModules.has(module.id)) {
          openModules.delete(module.id);
        } else {
          openModules.add(module.id);
        }
        renderSidebar();
      });

      section.append(menuItem, submenu);
      sidebarMenu.append(section);
    });
  }

  function moveAnchorSlider(link) {
    if (!anchorSlider || !link) return;
    anchorSlider.style.top = (link.offsetTop + 8) + "px";
  }

  function setActiveAnchor(activeLink) {
    thirdMenuAnchor.querySelectorAll(".kd-anchor-link").forEach((link) => {
      link.classList.toggle("kd-anchor-link-active", link === activeLink);
      const title = link.querySelector(".kd-anchor-link-title");
      if (title) title.classList.toggle("kd-anchor-link-title-active", link === activeLink);
    });
    moveAnchorSlider(activeLink);
  }

  function openThirdMenu(module, second) {
    activeThirdMenu = { module, second };
    thirdMenuContent.replaceChildren();
    thirdMenuAnchor.replaceChildren();

    (second.groups || []).forEach((group, index) => {
      const card = create("div", "menu-section-card");
      card.dataset.anchorSection = group.label;

      const top = create("div", "menu-top");
      top.append(create("span", "top-border"), create("span", "top-title", group.label));

      const content = create("div", "menu-content");
      (group.items || []).forEach((rawItem) => {
        const item = flatItems.find((candidate) => candidate.route === rawItem.route);
        const menuLink = create("button", "menu-list-wrap");
        menuLink.type = "button";
        menuLink.title = rawItem.label;
        const currentMenuRoute = currentItem && (currentItem.menuRoute || currentItem.route);
        menuLink.classList.toggle("selected", currentMenuRoute === rawItem.route);
        const left = create("span", "menu-list-left");
        left.append(create("span", "text", rawItem.label));
        menuLink.append(left);
        menuLink.addEventListener("click", () => navigateTo(item));
        content.append(menuLink);
      });
      card.append(top, content);
      thirdMenuContent.append(card);

      const anchor = create("div", "kd-anchor-link");
      anchor.tabIndex = 0;
      anchor.setAttribute("role", "button");
      anchor.append(create("span", "kd-anchor-link-title", group.label));
      if (index === 0) {
        anchor.classList.add("kd-anchor-link-active");
        anchor.firstElementChild.classList.add("kd-anchor-link-title-active");
      }
      anchor.addEventListener("click", () => {
        setActiveAnchor(anchor);
        card.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      anchor.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") anchor.click();
      });
      thirdMenuAnchor.append(anchor);
    });

    renderSidebar();
    thirdMenuPanel.classList.remove("hidden");
    moveAnchorSlider(thirdMenuAnchor.querySelector(".kd-anchor-link-active"));
  }

  function closeThirdMenu() {
    activeThirdMenu = null;
    thirdMenuPanel.classList.add("hidden");
    renderSidebar();
  }

  function workspaceTabLabel(item) {
    if (item.workspaceLabel) return item.workspaceLabel;
    if (!item.menuRoute && item.page && Array.isArray(item.views) && item.views.length) {
      return item.label + "列表";
    }
    return item.label;
  }

  function ensureWorkspaceTab(item) {
    if (!item) return;
    const existingTab = openTabs.find((tab) => tab.route === item.route);
    if (existingTab) {
      existingTab.item = item;
      return;
    }
    openTabs.push({
      route: item.route,
      label: workspaceTabLabel(item),
      item
    });
  }

  function registerWorkspaceRoute(item) {
    if (item.menuRoute) {
      const listItem = flatItems.find((candidate) => !candidate.menuRoute && candidate.route === item.menuRoute);
      ensureWorkspaceTab(listItem);
    }
    ensureWorkspaceTab(item);
  }

  function positionWorkspaceActiveBar() {
    const activeTab = workspaceTabsNav.querySelector(".workspace-tab.active");
    if (!activeTab) {
      workspaceTabsActiveBar.style.width = "0";
      return;
    }
    workspaceTabsActiveBar.style.width = activeTab.offsetWidth + "px";
    workspaceTabsActiveBar.style.transform = "translateX(" + activeTab.offsetLeft + "px)";

    const activeLeft = activeTab.offsetLeft;
    const activeRight = activeLeft + activeTab.offsetWidth;
    if (activeLeft < workspaceTabs.scrollLeft) workspaceTabs.scrollLeft = activeLeft;
    if (activeRight > workspaceTabs.scrollLeft + workspaceTabs.clientWidth) {
      workspaceTabs.scrollLeft = activeRight - workspaceTabs.clientWidth;
    }
  }

  function showEmptyWorkspace() {
    currentItem = null;
    document.title = "SmartOne ERP Demo";
    pageFrame.hidden = true;
    pageFrame.removeAttribute("src");
    emptyView.hidden = false;
    emptyDescription.textContent = "请从左侧菜单打开页面";
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    renderSidebar();
    renderWorkspaceTabs();
  }

  function closeWorkspaceTab(route) {
    const tabIndex = openTabs.findIndex((tab) => tab.route === route);
    if (tabIndex < 0) return;
    const wasActive = currentItem && currentItem.route === route;
    openTabs.splice(tabIndex, 1);

    if (!wasActive) {
      renderWorkspaceTabs();
      return;
    }

    const replacementTab = openTabs[Math.min(tabIndex, openTabs.length - 1)];
    if (replacementTab) {
      navigateTo(replacementTab.item);
      return;
    }
    showEmptyWorkspace();
  }

  function renderWorkspaceTabs() {
    workspaceTabsNav.querySelectorAll(".workspace-tab").forEach((tab) => tab.remove());
    openTabs.forEach((tab) => {
      const tabButton = create("div", "workspace-tab");
      const tabLabel = create("span", "workspace-tab-label", tab.label);
      const closeButton = create("button", "workspace-tab-close");
      const isActive = currentItem && currentItem.route === tab.route;
      tabButton.id = "workspace-tab-" + tab.item.id;
      tabButton.title = tab.label;
      tabButton.setAttribute("role", "tab");
      tabButton.setAttribute("aria-label", tab.label);
      tabButton.setAttribute("aria-selected", String(isActive));
      tabButton.tabIndex = isActive ? 0 : -1;
      tabButton.classList.toggle("active", isActive);
      tabButton.addEventListener("click", () => navigateTo(tab.item));
      tabButton.addEventListener("keydown", (event) => {
        if (event.target !== tabButton || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        navigateTo(tab.item);
      });

      closeButton.type = "button";
      closeButton.title = "关闭";
      closeButton.setAttribute("aria-label", "关闭" + tab.label);
      closeButton.tabIndex = isActive ? 0 : -1;
      closeButton.addEventListener("click", (event) => {
        event.stopPropagation();
        closeWorkspaceTab(tab.route);
      });
      tabButton.append(tabLabel, closeButton);
      workspaceTabsNav.append(tabButton);
    });
    window.requestAnimationFrame(positionWorkspaceActiveBar);
  }

  function syncDetailTabLabel(frameDocument) {
    if (!currentItem || !currentItem.menuRoute) return;
    const sourceActiveTab = frameDocument.querySelector(".page-tabs .page-tab.active, .page-tabs .page-tab.is-active");
    if (!sourceActiveTab) return;
    const sourceLabel = Array.from(sourceActiveTab.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent)
      .join("")
      .trim();
    const currentTab = openTabs.find((tab) => tab.route === currentItem.route);
    if (!sourceLabel || !currentTab || currentTab.label === sourceLabel) return;
    currentTab.label = sourceLabel;
    renderWorkspaceTabs();
  }

  function bindEmbeddedPageNavigation(frameDocument) {
    if (!currentItem || currentItem.menuRoute) return;
    const detailItem = flatItems.find((item) => item.menuRoute === currentItem.route);
    if (!detailItem) return;

    const navigateToDetail = () => navigateTo(detailItem);
    const newButton = frameDocument.querySelector(".list-toolbar-left .btn.primary:not([data-erp-demo-local-create])");
    if (newButton && !newButton.dataset.erpDemoDetailNavigation) {
      newButton.dataset.erpDemoDetailNavigation = "true";
      newButton.addEventListener("click", navigateToDetail);
    }

    frameDocument.querySelectorAll(".purchase-list-table tbody .link-blue").forEach((documentCode) => {
      if (documentCode.dataset.erpDemoDetailNavigation) return;
      documentCode.dataset.erpDemoDetailNavigation = "true";
      documentCode.setAttribute("role", "link");
      documentCode.setAttribute("tabindex", "0");
      documentCode.addEventListener("click", navigateToDetail);
      documentCode.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        navigateToDetail();
      });
    });
  }

  function prepareEmbeddedListPage(frameDocument) {
    const listToolbar = frameDocument.querySelector(".list-toolbar");
    if (!listToolbar) return;

    if (!frameDocument.querySelector('link[href="assets/vendor/prototype-kit.css"]')) {
      const kitStyle = frameDocument.createElement("link");
      kitStyle.id = "erp-demo-prototype-kit-style";
      kitStyle.rel = "stylesheet";
      kitStyle.href = "assets/vendor/prototype-kit.css";
      frameDocument.head.prepend(kitStyle);
    }

    listToolbar.querySelectorAll("button:not(.primary)").forEach((button) => {
      if (button.dataset.erpDemoPrototypeKitButton) return;
      button.dataset.erpDemoPrototypeKitButton = "true";
      const label = button.textContent.trim();
      const isDropdown = button.classList.contains("dropdown");
      button.classList.remove("btn", "dropdown", "list-icon-btn");
      button.type = "button";

      if (label === "列展示" || label === "全屏") {
        button.classList.add("pk-grid-icon-btn");
        button.textContent = label === "列展示" ? "☰" : "⛶";
        button.title = label;
        button.setAttribute("aria-label", label);
        return;
      }

      if (isDropdown) {
        const labelElement = frameDocument.createElement("span");
        const caretElement = frameDocument.createElement("span");
        labelElement.textContent = label;
        caretElement.className = "pk-toolbar-dropdown-caret";
        button.replaceChildren(labelElement, caretElement);
        button.classList.add("pk-toolbar-dropdown-trigger");
        button.setAttribute("aria-haspopup", "true");
        button.setAttribute("aria-expanded", "false");
        return;
      }

      button.classList.add("pk-toolbar-btn");
    });

    frameDocument.querySelectorAll(".purchase-list-table tbody tr.active-row").forEach((row) => {
      row.classList.remove("active-row");
    });
  }

  function prepareEmbeddedPage() {
    try {
      const frameDocument = pageFrame.contentDocument;
      if (!frameDocument) return;
      // Copied source files can contain BOM text nodes that render as an empty line.
      Array.from(frameDocument.body.childNodes).forEach((node) => {
        if (node.nodeType !== 3 || !node.textContent.includes("\uFEFF")) return;
        if (node.textContent.replace(/\uFEFF/g, "").trim() === "") node.remove();
      });
      if (!frameDocument.getElementById("erp-demo-embedded-style")) {
        const style = frameDocument.createElement("style");
        style.id = "erp-demo-embedded-style";
        style.textContent = [
          ".topbar,.sidebar,.third-menu-panel,.page-tabs{display:none!important}",
          ".list-toolbar{border-bottom:0!important}",
          ".purchase-list-table tbody td.link-blue{color:#409eff!important}",
          ".purchase-list-table tbody tr:hover td{background:#e6f7ff!important}",
          ".srm-prototype{min-width:0!important;border:0!important}",
          ".layout{min-height:0!important}",
          "html,body{margin:0!important;background:#fff!important}"
        ].join("");
        frameDocument.head.append(style);
      }
      syncDetailTabLabel(frameDocument);
      prepareEmbeddedListPage(frameDocument);
      bindEmbeddedPageNavigation(frameDocument);
    } catch (error) {
      console.info("Embedded page styling was not injected.", error);
    }
  }

  function renderPage(item) {
    currentItem = item;
    openModules.add(item.module.id);
    registerWorkspaceRoute(item);
    document.title = item.label + " - SmartOne ERP Demo";
    renderSidebar();
    renderWorkspaceTabs();

    if (item.page) {
      emptyView.hidden = true;
      pageFrame.hidden = false;
      if (pageFrame.getAttribute("src") !== item.page) pageFrame.setAttribute("src", item.page);
      return;
    }

    pageFrame.hidden = true;
    pageFrame.removeAttribute("src");
    emptyView.hidden = false;
    emptyDescription.textContent = "“" + item.label + "”尚未配置原型页面";
  }

  function navigateTo(item) {
    if (!item) return;
    closeMenuSearch(true);
    closeThirdMenu();
    if (window.location.hash === item.route) {
      renderPage(item);
      return;
    }
    window.location.hash = item.route.slice(1);
  }

  function handleRouteChange() {
    if (!defaultItem) return;
    const route = window.location.hash || defaultItem.route;
    const item = flatItems.find((candidate) => candidate.route === route);
    if (!item) {
      window.history.replaceState(null, "", defaultItem.route);
      renderPage(defaultItem);
      return;
    }
    renderPage(item);
  }

  menuSearchInput.addEventListener("input", renderMenuSearchResults);
  menuSearchInput.addEventListener("focus", () => {
    if (menuSearchInput.value.trim()) renderMenuSearchResults();
  });
  menuSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenuSearch(false);
      return;
    }
    if (event.key === "Enter") {
      if (!menuSearchPanel.hidden && menuSearchActiveIndex >= 0) {
        event.preventDefault();
        selectMenuSearchResult(menuSearchActiveIndex);
      }
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

    if (menuSearchPanel.hidden && menuSearchInput.value.trim()) renderMenuSearchResults();
    if (!menuSearchMatches.length) return;
    event.preventDefault();
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = (menuSearchActiveIndex + direction + menuSearchMatches.length) % menuSearchMatches.length;
    setActiveMenuSearchResult(nextIndex, true);
  });

  menuSearchClear.addEventListener("mousedown", (event) => event.preventDefault());
  menuSearchClear.addEventListener("click", () => {
    menuSearchInput.value = "";
    renderMenuSearchResults();
    menuSearchInput.focus();
  });

  document.addEventListener("mousedown", (event) => {
    if (!menuSearch.contains(event.target)) closeMenuSearch(false);
  });

  menuTrigger.addEventListener("click", () => {
    closeThirdMenu();
    sidebar.classList.toggle("collapsed");
  });
  thirdMenuMask.addEventListener("click", closeThirdMenu);
  pageFrame.addEventListener("load", prepareEmbeddedPage);
  window.addEventListener("hashchange", handleRouteChange);
  window.addEventListener("resize", positionWorkspaceActiveBar);

  window.PrototypeKit && window.PrototypeKit.init(document);
  handleRouteChange();
})();
