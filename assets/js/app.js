(function () {
  "use strict";

  const menuData = Array.isArray(window.ERP_MENU) ? window.ERP_MENU : [];
  const app = document.getElementById("erpApp");
  const sidebarMenu = document.getElementById("sidebarMenu");
  const menuTrigger = document.getElementById("menuTrigger");
  const mobileBackdrop = document.getElementById("mobileBackdrop");
  const breadcrumb = document.getElementById("breadcrumb");
  const emptyView = document.getElementById("emptyView");
  const emptyDescription = document.getElementById("emptyDescription");
  const pageFrame = document.getElementById("pageFrame");
  const thirdMenuPanel = document.getElementById("thirdMenuPanel");
  const thirdMenuMask = document.getElementById("thirdMenuMask");
  const thirdMenuClose = document.getElementById("thirdMenuClose");
  const thirdMenuModule = document.getElementById("thirdMenuModule");
  const thirdMenuTitle = document.getElementById("thirdMenuTitle");
  const thirdMenuContent = document.getElementById("thirdMenuContent");
  const thirdMenuAnchor = document.getElementById("thirdMenuAnchor");
  const searchRoot = document.getElementById("globalSearch");
  const searchInput = document.getElementById("globalSearchInput");
  const searchResults = document.getElementById("searchResults");
  const homeAction = document.getElementById("homeAction");
  const fullscreenAction = document.getElementById("fullscreenAction");

  let currentItem = null;
  let activeThirdMenu = null;

  const create = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (typeof text === "string") element.textContent = text;
    return element;
  };

  const flatItems = [];
  menuData.forEach((module) => {
    (module.children || []).forEach((second) => {
      if (Array.isArray(second.groups)) {
        second.groups.forEach((group) => {
          (group.items || []).forEach((item) => {
            flatItems.push(Object.assign({}, item, { module, second, group }));
          });
        });
        return;
      }

      flatItems.push(Object.assign({}, second, {
        module,
        second,
        group: null
      }));
    });
  });

  const defaultItem = flatItems[0] || null;

  function isMobile() {
    return window.matchMedia("(max-width: 760px)").matches;
  }

  function itemPath(item) {
    const labels = [item.module.label];
    if (item.second && item.second.label !== item.label) labels.push(item.second.label);
    if (item.group) labels.push(item.group.label);
    labels.push(item.label);
    return labels;
  }

  function closeThirdMenu() {
    activeThirdMenu = null;
    thirdMenuPanel.hidden = true;
  }

  function closeMobileMenu() {
    app.classList.remove("mobile-menu-open");
  }

  function renderSidebar() {
    sidebarMenu.replaceChildren();

    menuData.forEach((module) => {
      const section = create("div", "menu-section");
      const isCurrentModule = currentItem && currentItem.module.id === module.id;
      if (isCurrentModule) section.classList.add("open");

      const moduleButton = create("button", "menu-item");
      moduleButton.type = "button";
      moduleButton.title = module.label;
      moduleButton.setAttribute("aria-expanded", String(isCurrentModule));
      if (isCurrentModule) moduleButton.classList.add("active");
      moduleButton.append(
        create("span", "menu-icon"),
        create("span", "menu-label", module.label),
        create("span", "menu-arrow")
      );

      const submenu = create("div", "submenu");
      (module.children || []).forEach((second) => {
        const secondButton = create("button", "submenu-item");
        secondButton.type = "button";
        secondButton.title = second.label;
        if (currentItem && currentItem.second.id === second.id) {
          secondButton.classList.add("current");
        }
        secondButton.append(create("span", "submenu-title", second.label));
        if (Array.isArray(second.groups)) {
          secondButton.append(create("span", "submenu-arrow"));
        }

        secondButton.addEventListener("click", () => {
          if (Array.isArray(second.groups)) {
            openThirdMenu(module, second);
          } else {
            navigateTo(Object.assign({}, second, { module, second, group: null }));
          }
        });
        submenu.append(secondButton);
      });

      moduleButton.addEventListener("click", () => {
        if (app.classList.contains("sidebar-collapsed") && !isMobile()) {
          app.classList.remove("sidebar-collapsed");
          return;
        }
        const willOpen = !section.classList.contains("open");
        section.classList.toggle("open", willOpen);
        moduleButton.setAttribute("aria-expanded", String(willOpen));
      });

      section.append(moduleButton, submenu);
      sidebarMenu.append(section);
    });
  }

  function openThirdMenu(module, second) {
    activeThirdMenu = { module, second };
    thirdMenuModule.textContent = module.label;
    thirdMenuTitle.textContent = second.label;
    thirdMenuContent.replaceChildren();
    thirdMenuAnchor.replaceChildren();

    (second.groups || []).forEach((group) => {
      const section = create("section", "third-menu-section");
      section.id = "menu-group-" + group.id;
      section.append(create("h3", "third-menu-section-title", group.label));

      const list = create("div", "third-menu-list");
      (group.items || []).forEach((rawItem) => {
        const item = flatItems.find((candidate) => candidate.route === rawItem.route);
        const button = create("button", "third-menu-link");
        button.type = "button";
        button.title = rawItem.label;
        if (rawItem.page) button.classList.add("has-page");
        if (currentItem && currentItem.route === rawItem.route) button.classList.add("selected");
        button.append(
          create("span", "third-menu-link-label", rawItem.label),
          create("span", "third-menu-link-state", rawItem.page ? "已接入" : "待接入")
        );
        button.addEventListener("click", () => navigateTo(item));
        list.append(button);
      });
      section.append(list);
      thirdMenuContent.append(section);

      const anchor = create("button", "anchor-link", group.label);
      anchor.type = "button";
      anchor.addEventListener("click", () => {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      thirdMenuAnchor.append(anchor);
    });

    thirdMenuPanel.hidden = false;
  }

  function renderBreadcrumb(item) {
    breadcrumb.replaceChildren();
    itemPath(item).forEach((label, index, labels) => {
      breadcrumb.append(create("span", "breadcrumb-item", label));
      if (index < labels.length - 1) {
        breadcrumb.append(create("span", "breadcrumb-separator", "/"));
      }
    });
  }

  function prepareEmbeddedPage() {
    try {
      const frameDocument = pageFrame.contentDocument;
      if (!frameDocument || frameDocument.getElementById("erp-demo-embedded-style")) return;

      const style = frameDocument.createElement("style");
      style.id = "erp-demo-embedded-style";
      style.textContent = [
        ".topbar,.sidebar,.third-menu-panel{display:none!important}",
        ".srm-prototype{min-width:0!important;border:0!important}",
        ".layout{min-height:0!important}",
        "html,body{margin:0!important;background:#fff!important}"
      ].join("");
      frameDocument.head.append(style);
    } catch (error) {
      console.info("Embedded page uses an isolated origin; shell styling was not injected.", error);
    }
  }

  function renderPage(item) {
    currentItem = item;
    renderBreadcrumb(item);
    renderSidebar();
    document.title = item.label + " - SmartOne ERP Demo";

    if (item.page) {
      emptyView.hidden = true;
      pageFrame.hidden = false;
      if (pageFrame.getAttribute("src") !== item.page) {
        pageFrame.setAttribute("src", item.page);
      }
      return;
    }

    pageFrame.hidden = true;
    pageFrame.removeAttribute("src");
    emptyView.hidden = false;
    emptyDescription.textContent = "“" + item.label + "”尚未配置原型页面";
  }

  function navigateTo(item) {
    if (!item) return;
    closeThirdMenu();
    closeMobileMenu();
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

  function closeSearch() {
    searchResults.hidden = true;
  }

  function renderSearchResults(query) {
    const normalized = query.trim().toLocaleLowerCase("zh-CN");
    searchResults.replaceChildren();
    if (!normalized) {
      closeSearch();
      return;
    }

    const matches = flatItems.filter((item) => {
      return itemPath(item).join(" ").toLocaleLowerCase("zh-CN").includes(normalized);
    }).slice(0, 12);

    if (!matches.length) {
      searchResults.append(create("div", "search-empty", "未找到匹配菜单"));
      searchResults.hidden = false;
      return;
    }

    matches.forEach((item) => {
      const button = create("button", "search-result");
      button.type = "button";
      button.append(
        create("span", "search-result-title", item.label),
        create("span", "search-result-path", itemPath(item).slice(0, -1).join(" / "))
      );
      button.addEventListener("click", () => {
        searchInput.value = "";
        closeSearch();
        navigateTo(item);
      });
      searchResults.append(button);
    });
    searchResults.hidden = false;
  }

  menuTrigger.addEventListener("click", () => {
    closeThirdMenu();
    if (isMobile()) {
      app.classList.toggle("mobile-menu-open");
      return;
    }
    app.classList.toggle("sidebar-collapsed");
  });

  mobileBackdrop.addEventListener("click", closeMobileMenu);
  thirdMenuMask.addEventListener("click", closeThirdMenu);
  thirdMenuClose.addEventListener("click", closeThirdMenu);
  pageFrame.addEventListener("load", prepareEmbeddedPage);

  searchInput.addEventListener("input", (event) => renderSearchResults(event.target.value));
  searchInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const firstResult = searchResults.querySelector(".search-result");
    if (firstResult) firstResult.click();
  });

  document.addEventListener("click", (event) => {
    if (!searchRoot.contains(event.target)) closeSearch();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeSearch();
    closeThirdMenu();
    closeMobileMenu();
  });

  homeAction.addEventListener("click", () => navigateTo(defaultItem));
  fullscreenAction.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.info("Fullscreen is not available in this browser.", error);
    }
  });

  window.addEventListener("hashchange", handleRouteChange);
  window.addEventListener("resize", () => {
    if (!isMobile()) closeMobileMenu();
  });

  window.PrototypeKit && window.PrototypeKit.init(document);
  handleRouteChange();
})();
