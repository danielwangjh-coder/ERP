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

  const openModules = new Set(["supply-chain-management"]);
  const flatItems = [];
  let currentItem = null;
  let activeThirdMenu = null;

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
            flatItems.push(Object.assign({}, item, { module, second, group }));
          });
        });
        return;
      }

      flatItems.push(Object.assign({}, second, { module, second, group: null }));
    });
  });

  const defaultItem = flatItems.find((item) => item.id === "sales-management") || flatItems[0] || null;

  function selectedSecondId() {
    if (activeThirdMenu) return activeThirdMenu.second.id;
    return currentItem && currentItem.second ? currentItem.second.id : "";
  }

  function renderSidebar() {
    sidebarMenu.replaceChildren();

    menuData.forEach((module) => {
      const section = create("div", "menu-section");
      const isOpen = openModules.has(module.id);
      const isActive = currentItem && currentItem.module.id === module.id;
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
        if (Array.isArray(second.groups)) submenuItem.append(create("span", "submenu-arrow"));

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
        menuLink.classList.toggle("selected", currentItem && currentItem.route === rawItem.route);
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
      console.info("Embedded page styling was not injected.", error);
    }
  }

  function renderPage(item) {
    currentItem = item;
    openModules.add(item.module.id);
    document.title = item.label + " - SmartOne ERP Demo";
    renderSidebar();

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

  menuTrigger.addEventListener("click", () => {
    closeThirdMenu();
    sidebar.classList.toggle("collapsed");
  });
  thirdMenuMask.addEventListener("click", closeThirdMenu);
  pageFrame.addEventListener("load", prepareEmbeddedPage);
  window.addEventListener("hashchange", handleRouteChange);

  window.PrototypeKit && window.PrototypeKit.init(document);
  handleRouteChange();
})();
