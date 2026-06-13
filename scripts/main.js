(function () {
  var nav = document.querySelector("[data-anchor='Nav01']");
  var menuButton = document.getElementById("menuBtn");
  var navLinks = document.getElementById("navlinks");
  var form = document.getElementById("contactForm");
  var note = document.getElementById("formNote");
  var shareModal = document.getElementById("shareModal");
  var shareOpenButtons = [
    document.getElementById("shareCardBtn"),
    document.getElementById("shareCardSideBtn")
  ].filter(Boolean);
  var shareCloseButton = document.getElementById("shareModalClose");
  var sharePanel = shareModal ? shareModal.querySelector(".share-modal-panel") : null;
  var shareUrlField = document.getElementById("shareUrlField");
  var copyShareLinkButton = document.getElementById("copyShareLinkBtn");
  var nativeShareButton = document.getElementById("nativeShareBtn");
  var copyDiscordMessageButton = document.getElementById("copyDiscordMessageBtn");
  var shareStatus = document.getElementById("shareStatus");
  var shareQrImage = document.getElementById("shareQrImage");
  var shareQrCaption = document.getElementById("shareQrCaption");
  var shareModeButtons = Array.prototype.slice.call(document.querySelectorAll("[data-qr-mode]"));
  var lastShareFocus = null;
  var shareUrl = shareUrlField ? shareUrlField.value : "https://jonathankhobson.github.io/g/";
  var shareMessage = "GameMasterKyle digital card: " + shareUrl;
  var qrModes = {
    portfolio: {
      title: "Let them scan this.",
      copy: "Show this QR code on your phone, copy the short link, or send the card through the share sheet.",
      src: "assets/brand/gamemasterkyle-link-qr-code.png",
      alt: "QR code for the GameMasterKyle digital business card.",
      caption: "jonathankhobson.github.io/g",
      assetId: "LinkCardQRCode01"
    },
    discord: {
      title: "Add me on Discord.",
      copy: "Use this when someone is standing with you and wants to add gamemaster_kyle without searching.",
      src: "assets/brand/gamemasterkyle-discord-friend-qr-code.png",
      alt: "QR code to add gamemaster_kyle as a Discord friend.",
      caption: "Discord friend QR for gamemaster_kyle",
      assetId: "DiscordFriendQRCode01"
    }
  };

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

  function setShareStatus(message) {
    if (!shareStatus) return;
    shareStatus.textContent = message;
  }

  function copyText(value, successMessage) {
    function fallbackCopy() {
      if (shareUrlField) {
        shareUrlField.focus();
        shareUrlField.select();
        shareUrlField.setSelectionRange(0, shareUrlField.value.length);
      }
      try {
        document.execCommand("copy");
        setShareStatus(successMessage);
      } catch (error) {
        setShareStatus("Copy failed. The link is selected.");
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(function () {
        setShareStatus(successMessage);
      }, fallbackCopy);
    } else {
      fallbackCopy();
    }
  }

  function setQrMode(mode) {
    var next = qrModes[mode] || qrModes.portfolio;
    var title = document.getElementById("share-modal-title");
    var copy = document.getElementById("share-modal-copy");
    if (title) title.textContent = next.title;
    if (copy) copy.textContent = next.copy;
    if (shareQrImage) {
      shareQrImage.src = next.src;
      shareQrImage.alt = next.alt;
      shareQrImage.setAttribute("data-asset-id", next.assetId);
    }
    if (shareQrCaption) {
      shareQrCaption.textContent = next.caption;
    }
    shareModeButtons.forEach(function (button) {
      var active = button.getAttribute("data-qr-mode") === mode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    setShareStatus("");
  }

  function openShareModal(trigger) {
    if (!shareModal || !sharePanel) return;
    lastShareFocus = trigger || document.activeElement;
    shareModal.hidden = false;
    document.body.classList.add("modal-open");
    setShareStatus("");
    window.setTimeout(function () {
      sharePanel.focus();
    }, 0);
  }

  function closeShareModal() {
    if (!shareModal) return;
    shareModal.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastShareFocus && typeof lastShareFocus.focus === "function") {
      lastShareFocus.focus();
    }
  }

  if (shareModal) {
    shareOpenButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        openShareModal(button);
      });
    });

    if (shareCloseButton) {
      shareCloseButton.addEventListener("click", closeShareModal);
    }

    shareModal.addEventListener("click", function (event) {
      if (!event.target.closest("[data-share-close]")) return;
      closeShareModal();
    });

    window.addEventListener("keydown", function (event) {
      if (shareModal.hidden || event.key !== "Escape") return;
      closeShareModal();
    });
  }

  if (copyShareLinkButton && shareUrlField) {
    copyShareLinkButton.addEventListener("click", function () {
      copyText(shareUrl, "Link copied.");
    });
  }

  if (copyDiscordMessageButton) {
    copyDiscordMessageButton.addEventListener("click", function () {
      copyText(shareMessage, "Discord-ready message copied.");
    });
  }

  shareModeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setQrMode(button.getAttribute("data-qr-mode"));
    });
  });

  if (nativeShareButton) {
    if (!navigator.share) {
      nativeShareButton.hidden = true;
    } else {
      nativeShareButton.addEventListener("click", function () {
        navigator.share({
          title: "GameMasterKyle",
          text: "GameMasterKyle digital business card",
          url: shareUrl
        }).then(function () {
          setShareStatus("Share sheet opened.");
        }, function () {
          setShareStatus("Share cancelled.");
        });
      });
    }
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
