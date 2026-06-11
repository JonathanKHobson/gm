(function () {
  var nav = document.querySelector("[data-anchor='Nav01']");
  var menuButton = document.getElementById("menuBtn");
  var navLinks = document.getElementById("navlinks");
  var form = document.getElementById("contactForm");
  var note = document.getElementById("formNote");

  function updateNav() {
    if (!nav) return;
    nav.classList.toggle("scrolled", window.scrollY > 18);
  }

  window.addEventListener("scroll", updateNav, { passive: true });
  updateNav();

  if (menuButton && navLinks) {
    menuButton.addEventListener("click", function () {
      var open = navLinks.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", open ? "true" : "false");
    });

    navLinks.addEventListener("click", function (event) {
      if (!event.target.closest("a")) return;
      navLinks.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    });

    window.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      navLinks.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.focus();
    });
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if ("IntersectionObserver" in window && !reduceMotion) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    reveals.forEach(function (element) {
      observer.observe(element);
    });
  } else {
    reveals.forEach(function (element) {
      element.classList.add("in");
    });
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  if (form && note) {
    var EMAILJS_PUBLIC = "DpN9hLocoU__4dYVX";
    var EMAILJS_SERVICE = "service_9wx16fe";
    var EMAILJS_TEMPLATE = "template_hjbmxbn";

    try {
      if (window.emailjs) {
        window.emailjs.init(EMAILJS_PUBLIC);
      }
    } catch (error) {
      console.warn("EmailJS init failed", error);
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var sendButton = form.querySelector("button[type='submit']");
      var name = document.getElementById("cf-name").value.trim();
      var email = document.getElementById("cf-email").value.trim();
      var message = document.getElementById("cf-msg").value.trim();

      if (name.length < 2) {
        note.textContent = "Add your name so I know who I am talking with.";
        document.getElementById("cf-name").focus();
        return;
      }

      if (!validEmail(email)) {
        note.textContent = "Enter a valid email, like name@example.com.";
        document.getElementById("cf-email").focus();
        return;
      }

      if (message.length < 12) {
        note.textContent = "Add a little detail about the event, group, or table.";
        document.getElementById("cf-msg").focus();
        return;
      }

      function resetButton() {
        if (!sendButton) return;
        sendButton.disabled = false;
        sendButton.textContent = "Send message";
      }

      function showFallback(error) {
        console.error(error);
        note.innerHTML = 'Could not send right now. Email me at <a href="mailto:jonathankylehobson@gmail.com?subject=Game%20Master%20inquiry">jonathankylehobson@gmail.com</a>.';
        resetButton();
      }

      if (sendButton) {
        sendButton.disabled = true;
        sendButton.textContent = "Sending...";
      }
      note.textContent = "Sending...";

      if (!window.emailjs || typeof window.emailjs.send !== "function") {
        showFallback(new Error("EmailJS is unavailable"));
        return;
      }

      var params = {
        title: "Portfolio contact",
        name: name,
        email: email,
        message: message,
        page: window.location.href
      };

      try {
        window.emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, params).then(function () {
          form.reset();
          note.textContent = "Thanks. Your message was sent. I will reply within a day or two.";
          resetButton();
        }, showFallback);
      } catch (error) {
        showFallback(error);
      }
    });
  }
})();
