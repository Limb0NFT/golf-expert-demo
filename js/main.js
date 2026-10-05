(() => {
  "use strict";

  const body = document.body;
  const header = document.querySelector("[data-header]");
  const nav = document.querySelector("[data-nav]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const dialog = document.querySelector("[data-dialog]");
  let dialogOpener = null;

  const updateHeader = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24 || !document.querySelector(".hero"));
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const closeMenu = () => {
    if (!nav || !menuToggle) return;
    nav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.textContent = "Меню";
    body.classList.remove("menu-open");
  };

  menuToggle?.addEventListener("click", () => {
    const isOpen = nav?.classList.toggle("is-open") ?? false;
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.textContent = isOpen ? "Закрыть" : "Меню";
    body.classList.toggle("menu-open", isOpen);
  });

  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

  document.addEventListener("click", (event) => {
    if (!nav?.classList.contains("is-open") || !header || header.contains(event.target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dialog?.open) {
      dialog.close();
      return;
    }
    if (event.key === "Escape" && nav?.classList.contains("is-open")) closeMenu();
  });

  const setDialogContext = (context) => {
    if (!dialog) return;
    const contextLabel = dialog.querySelector("[data-dialog-context]");
    const contextInput = dialog.querySelector("[data-context-input]");
    if (contextLabel) contextLabel.textContent = context;
    if (contextInput) contextInput.value = context;
  };

  document.querySelectorAll("[data-dialog-open]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!dialog) return;
      dialogOpener = button;
      setDialogContext(button.dataset.dialogOpen || "Общий запрос");
      dialog.showModal();
      window.setTimeout(() => dialog.querySelector("input:not([type='hidden'])")?.focus(), 0);
    });
  });

  dialog?.querySelector("[data-dialog-close]")?.addEventListener("click", () => dialog.close());

  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog?.addEventListener("close", () => {
    dialogOpener?.focus();
    dialogOpener = null;
  });

  document.querySelectorAll("[data-prototype-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const context = form.querySelector("[data-context-input]")?.value || "Общий запрос";
      const status = form.querySelector("[data-form-status]");
      if (status) status.textContent = `Демонстрационная форма: запрос не отправлен. Тема: «${context}».`;
    });
  });

  document.querySelector("[data-region-cta]")?.addEventListener("click", () => {
    const consultation = document.querySelector("#consultation");
    const form = consultation?.querySelector("[data-prototype-form]");
    const contextInput = form?.querySelector("[data-context-input]");
    if (contextInput) contextInput.value = "Условия для региона";
    consultation?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    window.setTimeout(() => form?.querySelector("input:not([type='hidden'])")?.focus(), 420);
  });

  const productTabs = document.querySelectorAll("[data-product-filter]");
  const featuredCards = document.querySelectorAll("[data-product-grid] [data-category]");
  productTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const category = tab.dataset.productFilter;
      productTabs.forEach((item) => item.classList.toggle("is-active", item === tab));
      featuredCards.forEach((card) => {
        card.hidden = category !== "all" && card.dataset.category !== category;
      });
    });
  });

  const catalogProducts = Array.isArray(window.GOLF_CATALOG) ? window.GOLF_CATALOG : [];

  const optimizedCatalogImage = (src, width) => {
    if (width === 1600 && /\.(?:avif|webp)$/i.test(src)) return src;
    return src
      .replace("assets/catalog/", "assets/optimized/catalog/")
      .replace(/\.[^.]+$/, `-${width}.webp`);
  };

  const createProductCard = (product) => {
    const article = document.createElement("article");
    article.className = "product-card";
    article.dataset.category = product.group;
    article.dataset.brand = product.brandSlug;
    article.dataset.number = String(product.number);

    const link = document.createElement("a");
    link.href = `product.html?product=${encodeURIComponent(product.slug)}`;

    const media = document.createElement("div");
    media.className = "product-card__media";
    const image = document.createElement("img");
    image.src = optimizedCatalogImage(product.images[0], 800);
    image.srcset = `${optimizedCatalogImage(product.images[0], 480)} 480w, ${optimizedCatalogImage(product.images[0], 800)} 800w`;
    image.sizes = "(max-width: 520px) calc(100vw - 52px), (max-width: 1360px) calc((100vw - 142px) / 2), calc((100vw - 470px) / 3)";
    image.alt = `${product.name} — ${product.brand}`;
    image.loading = "lazy";
    image.decoding = "async";
    media.append(image);

    const body = document.createElement("div");
    body.className = "product-card__body";
    const meta = document.createElement("div");
    meta.className = "product-card__meta";
    const brand = document.createElement("span");
    brand.className = "mock-badge";
    brand.textContent = product.brand;
    const category = document.createElement("span");
    category.textContent = product.category;
    meta.append(brand, category);

    const heading = document.createElement("h2");
    heading.textContent = product.name;
    const foot = document.createElement("div");
    foot.className = "product-card__foot";
    const action = document.createElement("span");
    action.className = "text-link";
    action.textContent = "Подробнее";
    foot.append(action);
    body.append(meta, heading, foot);
    link.append(media, body);
    article.append(link);
    return article;
  };

  const catalogGrid = document.querySelector("[data-catalog-grid]");
  if (catalogGrid) {
    const brandFilters = document.querySelector("[data-brand-filters]");
    const brandCounts = new Map();
    catalogProducts.forEach((product) => brandCounts.set(product.brandSlug, {
      name: product.brand,
      count: (brandCounts.get(product.brandSlug)?.count || 0) + 1
    }));
    [...brandCounts.entries()]
      .sort((a, b) => a[1].name.localeCompare(b[1].name, "ru"))
      .forEach(([brandSlug, brandInfo]) => {
        const button = document.createElement("button");
        button.className = "filter-option";
        button.type = "button";
        button.dataset.brandFilter = brandSlug;
        button.dataset.count = String(brandInfo.count).padStart(2, "0");
        button.textContent = brandInfo.name;
        brandFilters?.append(button);
      });

    const cards = catalogProducts.map((product) => {
      const card = createProductCard(product);
      card.productData = product;
      catalogGrid.append(card);
      return card;
    });
    const categoryButtons = [...document.querySelectorAll("[data-catalog-filter]")];
    const brandButtons = [...document.querySelectorAll("[data-brand-filter]")];
    const countLabel = document.querySelector("[data-catalog-count]");
    const emptyState = document.querySelector("[data-empty-state]");
    const sortSelect = document.querySelector("[data-catalog-sort]");
    const params = new URLSearchParams(window.location.search);
    let activeCategory = params.get("category") || "all";
    let activeBrand = params.get("brand") || "all";

    if (!categoryButtons.some((button) => button.dataset.catalogFilter === activeCategory)) activeCategory = "all";
    if (!brandButtons.some((button) => button.dataset.brandFilter === activeBrand)) activeBrand = "all";

    const renderCatalog = () => {
      const sortMode = sortSelect?.value || "default";
      const orderedCards = [...cards].sort((a, b) => {
        if (sortMode === "brand") return a.productData.brand.localeCompare(b.productData.brand, "ru") || a.productData.number - b.productData.number;
        if (sortMode === "category") return a.productData.category.localeCompare(b.productData.category, "ru") || a.productData.number - b.productData.number;
        return a.productData.number - b.productData.number;
      });
      let visibleCount = 0;
      orderedCards.forEach((card) => {
        catalogGrid.append(card);
        const categoryMatch = activeCategory === "all" || card.dataset.category === activeCategory;
        const brandMatch = activeBrand === "all" || card.dataset.brand === activeBrand;
        card.hidden = !(categoryMatch && brandMatch);
        if (!card.hidden) visibleCount += 1;
      });
      categoryButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.catalogFilter === activeCategory));
      brandButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.brandFilter === activeBrand));
      if (countLabel) {
        const lastTwoDigits = visibleCount % 100;
        const lastDigit = visibleCount % 10;
        const isSingular = lastDigit === 1 && lastTwoDigits !== 11;
        const noun = lastTwoDigits >= 11 && lastTwoDigits <= 14
          ? "позиций"
          : isSingular || (lastDigit >= 2 && lastDigit <= 4)
            ? "позиции"
            : "позиций";
        countLabel.textContent = `${isSingular ? "Показана" : "Показано"} ${visibleCount} ${isSingular ? "позиция" : noun}`;
      }
      if (emptyState) emptyState.hidden = visibleCount !== 0;

      const nextParams = new URLSearchParams();
      if (activeCategory !== "all") nextParams.set("category", activeCategory);
      if (activeBrand !== "all") nextParams.set("brand", activeBrand);
      const query = nextParams.toString();
      try {
        window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
      } catch {
        // Local file previews may not allow History API URL updates.
      }
    };

    categoryButtons.forEach((button) => button.addEventListener("click", () => {
      activeCategory = button.dataset.catalogFilter || "all";
      renderCatalog();
    }));
    brandButtons.forEach((button) => button.addEventListener("click", () => {
      activeBrand = button.dataset.brandFilter || "all";
      renderCatalog();
    }));
    sortSelect?.addEventListener("change", renderCatalog);
    renderCatalog();
  }

  const productPage = document.querySelector("[data-product-page]");
  if (productPage && catalogProducts.length) {
    const params = new URLSearchParams(window.location.search);
    const requestedSlug = params.get("product");
    const product = requestedSlug
      ? catalogProducts.find((item) => item.slug === requestedSlug)
      : catalogProducts[0];

    if (!product) {
      productPage.innerHTML = '<section class="product-detail"><div class="container empty-state"><h1>Товар не найден</h1><p><a class="text-link" href="catalog.html">Вернуться в каталог</a></p></div></section>';
      document.title = "Товар не найден — GOLF EXPERT";
    } else {
      document.title = `${product.name} — ${product.brand} — GOLF EXPERT`;
      const descriptionMeta = document.querySelector('meta[name="description"]');
      if (descriptionMeta) descriptionMeta.content = product.description;
      document.querySelectorAll("[data-product-name], [data-product-breadcrumb]").forEach((node) => { node.textContent = product.name; });
      document.querySelectorAll("[data-product-brand]").forEach((node) => { node.textContent = product.brand; });
      document.querySelectorAll("[data-product-category]").forEach((node) => { node.textContent = product.category; });
      document.querySelectorAll("[data-product-description]").forEach((node) => { node.textContent = product.description; });
      const dialogButton = document.querySelector("[data-product-dialog]");
      if (dialogButton) dialogButton.dataset.dialogOpen = `${product.brand} — ${product.name}`;

      const thumbs = document.querySelector("[data-product-thumbs]");
      const galleryMainContainer = document.querySelector("[data-gallery-main-container]");
      const galleryMain = document.createElement("img");
      if (galleryMainContainer) {
        galleryMain.dataset.galleryMain = "";
        galleryMain.src = optimizedCatalogImage(product.images[0], 1600);
        galleryMain.alt = `${product.name} — ${product.brand}, изображение 1`;
        galleryMainContainer.append(galleryMain);
      }
      product.images.forEach((src, index) => {
        const thumb = document.createElement("button");
        thumb.className = `gallery-thumb${index === 0 ? " is-active" : ""}`;
        thumb.type = "button";
        thumb.dataset.gallerySrc = src;
        thumb.setAttribute("aria-label", `Показать изображение ${index + 1} товара ${product.name}`);
        const image = document.createElement("img");
        image.src = optimizedCatalogImage(src, 240);
        image.alt = "";
        image.decoding = "async";
        thumb.append(image);
        thumb.addEventListener("click", () => {
          if (!galleryMain) return;
          galleryMain.src = optimizedCatalogImage(src, 1600);
          galleryMain.alt = `${product.name} — ${product.brand}, изображение ${index + 1}`;
          thumbs?.querySelectorAll(".gallery-thumb").forEach((item) => item.classList.toggle("is-active", item === thumb));
        });
        thumbs?.append(thumb);
      });

    }
  }

  const filterToggle = document.querySelector("[data-filter-toggle]");
  const catalogSidebar = document.querySelector("[data-catalog-sidebar]");
  filterToggle?.addEventListener("click", () => {
    const isOpen = catalogSidebar?.classList.toggle("is-open") ?? false;
    filterToggle.setAttribute("aria-expanded", String(isOpen));
    filterToggle.textContent = isOpen ? "Скрыть фильтры" : "Фильтры каталога";
  });

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motionItems = document.querySelectorAll("[data-motion]");
  if (motionItems.length && "IntersectionObserver" in window && !prefersReducedMotion) {
    try {
      const motionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-motion-visible");
            motionObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -10%", threshold: 0.12 });

      body.classList.add("motion-ready", "motion-preparing");
      motionItems.forEach((item) => {
        item.classList.add("is-motion-pending");
      });
      void body.offsetWidth;
      body.classList.remove("motion-preparing");
      motionItems.forEach((item) => motionObserver.observe(item));
    } catch {
      body.classList.remove("motion-ready", "motion-preparing");
      motionItems.forEach((item) => item.classList.remove("is-motion-pending"));
    }
  } else {
    motionItems.forEach((item) => item.classList.add("is-motion-visible"));
  }

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8%", threshold: 0.08 });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }
})();
