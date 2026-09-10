(function () {
  var current =
    document.currentScript ||
    document.querySelector('script[src*="embed.js"]');
  var origin = current
    ? new URL(current.getAttribute("src"), window.location.href).origin
    : window.location.origin;

  var overlayId = "fl-flipbook-overlay";
  var escapeListener = null;

  function getEmbedType(el) {
    var type = (el.getAttribute("type") || el.getAttribute("data-type") || "")
      .trim()
      .toLowerCase();
    return type === "button" ? "button" : "embed";
  }

  function buildEmbedUrl(src) {
    return origin + "/embed?url=" + encodeURIComponent(src);
  }

  function closeOverlay() {
    var overlay = document.getElementById(overlayId);
    if (!overlay) return;
    if (document.fullscreenElement === overlay) {
      document.exitFullscreen().catch(function () {});
    }
    if (escapeListener) {
      document.removeEventListener("keydown", escapeListener);
      escapeListener = null;
    }
    overlay.remove();
    document.body.style.overflow = "";
  }

  function openFullscreenCatalog(src, title) {
    closeOverlay();

    var overlay = document.createElement("div");
    overlay.id = overlayId;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", title || "PDF catalog");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483646;background:#1c1410;display:flex;flex-direction:column;";

    var toolbar = document.createElement("div");
    toolbar.style.cssText =
      "display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:10px 12px;background:#1c1410;border-bottom:1px solid rgba(255,255,255,0.1);";

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close catalog");
    closeBtn.textContent = "Close";
    closeBtn.style.cssText =
      "border:0;background:#6b2d5b;color:#fffaf3;font:600 13px/1 system-ui,sans-serif;padding:8px 14px;border-radius:999px;cursor:pointer;";

    var fsBtn = document.createElement("button");
    fsBtn.type = "button";
    fsBtn.setAttribute("aria-label", "Fullscreen");
    fsBtn.textContent = "Fullscreen";
    fsBtn.style.cssText =
      "border:1px solid rgba(255,255,255,0.2);background:transparent;color:#f3eadb;font:500 13px/1 system-ui,sans-serif;padding:8px 14px;border-radius:999px;cursor:pointer;";

    toolbar.appendChild(fsBtn);
    toolbar.appendChild(closeBtn);

    var stage = document.createElement("div");
    stage.style.cssText = "flex:1;min-height:0;position:relative;";

    var iframe = document.createElement("iframe");
    iframe.src = buildEmbedUrl(src);
    iframe.allow = "fullscreen";
    iframe.title = title || "PDF catalog";
    iframe.style.cssText = "border:0;display:block;width:100%;height:100%;";
    iframe.setAttribute("loading", "eager");

    stage.appendChild(iframe);
    overlay.appendChild(toolbar);
    overlay.appendChild(stage);
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    closeBtn.addEventListener("click", closeOverlay);
    fsBtn.addEventListener("click", function () {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(function () {});
      } else if (overlay.requestFullscreen) {
        overlay.requestFullscreen().catch(function () {});
      }
    });

    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) closeOverlay();
    });

    escapeListener = function (event) {
      if (event.key === "Escape") closeOverlay();
    };
    document.addEventListener("keydown", escapeListener);
  }

  function hydrateEmbed(el, src) {
    var iframe = document.createElement("iframe");
    iframe.src = buildEmbedUrl(src);
    iframe.allow = "fullscreen";
    iframe.title = el.getAttribute("data-title") || "PDF flipbook";
    iframe.style.border = "0";
    iframe.style.display = "block";
    iframe.style.width = el.getAttribute("data-width") || "100%";
    iframe.style.height = el.getAttribute("data-height") || "640px";
    iframe.style.maxWidth = "100%";
    iframe.setAttribute("loading", "lazy");
    el.appendChild(iframe);
  }

  function hydrateButton(el, src) {
    var label =
      el.getAttribute("data-label") ||
      el.getAttribute("data-button-label") ||
      "Open catalog";
    var title = el.getAttribute("data-title") || label;
    var customClass = (el.getAttribute("data-class") || "").trim();

    var button = document.createElement("button");
    button.type = "button";
    button.textContent = label;

    if (customClass) {
      button.className = customClass;
      button.style.cssText = "font:inherit;cursor:pointer;";
    } else {
      var bg = el.getAttribute("data-bg") || "#6b2d5b";
      var borderColor = el.getAttribute("data-border-color") || bg;
      var borderWidth = el.getAttribute("data-border-width") || "0px";
      var radius = el.getAttribute("data-radius") || "12px";
      var textColor = contrastText(bg);
      button.style.cssText =
        "display:inline-flex;align-items:center;justify-content:center;" +
        "border-style:solid;border-width:" +
        borderWidth +
        ";border-color:" +
        borderColor +
        ";background:" +
        bg +
        ";color:" +
        textColor +
        ";font:inherit;font-weight:600;padding:12px 20px;border-radius:" +
        radius +
        ";cursor:pointer;box-shadow:0 8px 24px rgba(26,20,16,0.18);";
      button.addEventListener("mouseenter", function () {
        button.style.filter = "brightness(0.94)";
      });
      button.addEventListener("mouseleave", function () {
        button.style.filter = "";
      });
    }

    button.addEventListener("click", function () {
      openFullscreenCatalog(src, title);
    });

    el.appendChild(button);
  }

  function contrastText(hex) {
    var raw = String(hex || "").replace("#", "");
    if (raw.length === 3) {
      raw = raw
        .split("")
        .map(function (c) {
          return c + c;
        })
        .join("");
    }
    if (raw.length !== 6) return "#fffaf3";
    var r = parseInt(raw.slice(0, 2), 16);
    var g = parseInt(raw.slice(2, 4), 16);
    var b = parseInt(raw.slice(4, 6), 16);
    var luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.62 ? "#1a1410" : "#fffaf3";
  }

  function hydrate(el) {
    if (!el || el.getAttribute("data-fl-hydrated") === "true") return;

    var src = el.getAttribute("data-src");
    if (!src) return;

    el.setAttribute("data-fl-hydrated", "true");
    el.style.display = el.style.display || "block";

    if (getEmbedType(el) === "button") {
      hydrateButton(el, src);
    } else {
      hydrateEmbed(el, src);
    }
  }

  function scan(root) {
    if (!root) return;
    if (root.nodeType === 1 && root.matches && root.matches(".fl-flipbook")) {
      hydrate(root);
    }
    if (!root.querySelectorAll) return;
    var nodes = root.querySelectorAll(".fl-flipbook");
    for (var i = 0; i < nodes.length; i++) hydrate(nodes[i]);
  }

  function start() {
    scan(document);
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          if (added[j].nodeType === 1) scan(added[j]);
        }
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
