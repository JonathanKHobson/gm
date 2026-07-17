(function () {
  "use strict";

  function openHashTarget() {
    if (!window.location.hash) return;
    var target = document.querySelector(window.location.hash);
    if (!target) return;
    if (target.tagName.toLowerCase() === "details") {
      target.open = true;
    }
    var parentDetails = target.closest("details");
    if (parentDetails) parentDetails.open = true;
  }

  Array.prototype.forEach.call(document.querySelectorAll("details"), function (detail) {
    detail.addEventListener("toggle", function () {
      detail.setAttribute("data-open", detail.open ? "true" : "false");
    });
  });

  window.addEventListener("hashchange", openHashTarget);
  openHashTarget();
}());
