(function () {
  var eventConfig = {
    event_title: "Peril to Profit\u2122: The Goldspire Messengers",
    event_day: "Tuesday",
    event_time: "5:00 PM",
    event_date: "July 7, 2026",
    event_duration: "4 hours",
    event_price: "$25 per person",
    event_venue: "Mox Boarding House Chandler",
    event_venue_address: "1371 N Alma School Rd, Chandler, AZ 85224",
    event_venue_url: "https://www.moxboardinghouse.com/pages/chandler",
    event_signup_url: "coming-soon/",
    cta_text: "Registration has not started yet"
  };

  var nav = document.getElementById("nav");

  Array.prototype.forEach.call(document.querySelectorAll("[data-event-cta]"), function (link) {
    link.href = eventConfig.event_signup_url;
    link.textContent = eventConfig.cta_text;
  });

  function updateNav() {
    if (!nav) return;
    nav.classList.toggle("scrolled", window.scrollY > 18);
  }

  window.addEventListener("scroll", updateNav, { passive: true });
  updateNav();

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealElements = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if ("IntersectionObserver" in window && !reduceMotion) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1 });

    revealElements.forEach(function (element) {
      observer.observe(element);
    });
  } else {
    revealElements.forEach(function (element) {
      element.classList.add("in");
    });
  }
}());
