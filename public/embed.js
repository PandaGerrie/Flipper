(function () {
  var current =
    document.currentScript ||
    document.querySelector('script[src*="embed.js"]');
  var origin = current
    ? new URL(current.getAttribute("src"), window.location.href).origin
    : window.location.origin;

  function hydrate(el) {
    if (!el || el.getAttribute("data-fl-hydrated") === "true") return;

    var src = el.getAttribute("data-src");
    if (!src) return;

    el.setAttribute("data-fl-hydrated", "true");

    var iframe = document.createElement("iframe");
    iframe.src = origin + "/embed?url=" + encodeURIComponent(src);
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
