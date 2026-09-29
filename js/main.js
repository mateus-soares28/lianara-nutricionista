/* Lia Prochn — navegação, cards e movimento progressivo. */
(function () {
  "use strict";

  const toggle = document.getElementById("menuToggle");
  const mobileNav = document.getElementById("mobileNav");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function closeMenu() {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menu");
    mobileNav.hidden = true;
  }

  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Abrir menu" : "Fechar menu");
      mobileNav.hidden = isOpen;
    });
    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !mobileNav.hidden) {
        closeMenu();
        toggle.focus();
      }
    });
    document.addEventListener("click", function (event) {
      if (!mobileNav.hidden && !event.target.closest(".site-header")) closeMenu();
    });
    window.matchMedia("(min-width: 1024px)").addEventListener("change", closeMenu);
  }

  const faqItems = document.querySelectorAll("#faqList .faq-item");
  faqItems.forEach(function (item, index) {
    const question = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");
    question.id = "faq-question-" + index;
    answer.id = "faq-answer-" + index;
    question.setAttribute("aria-controls", answer.id);
    answer.setAttribute("aria-labelledby", question.id);
    answer.setAttribute("role", "region");
    answer.classList.toggle("open", question.getAttribute("aria-expanded") === "true");

    question.addEventListener("click", function () {
      const wasOpen = question.getAttribute("aria-expanded") === "true";
      faqItems.forEach(function (other) {
        other.querySelector(".faq-question").setAttribute("aria-expanded", "false");
        other.querySelector(".faq-answer").classList.remove("open");
      });
      if (!wasOpen) {
        question.setAttribute("aria-expanded", "true");
        answer.classList.add("open");
      }
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });
  });

  const sections = ["inicio", "sobre", "especialidades", "como-funciona", "depoimentos", "faq"];
  const navLinks = document.querySelectorAll(".main-nav a");
  let scrollQueued = false;
  function updateActiveLink() {
    let current = "inicio";
    sections.forEach(function (id) {
      const section = document.getElementById(id);
      if (section && section.getBoundingClientRect().top <= 200) current = id;
    });
    navLinks.forEach(function (link) {
      const isActive = link.getAttribute("href") === "#" + current;
      link.classList.toggle("active", isActive);
      if (isActive) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    scrollQueued = false;
  }
  window.addEventListener("scroll", function () {
    if (!scrollQueued) {
      scrollQueued = true;
      window.requestAnimationFrame(updateActiveLink);
    }
  }, { passive: true });
  updateActiveLink();

  // O scroll nativo mantém os cards acessíveis por toque, teclado e sem GSAP.
  const track = document.getElementById("servicesTrack");
  const previous = document.getElementById("servicesPrev");
  const next = document.getElementById("servicesNext");
  const status = document.getElementById("serviceStatus");
  if (track && previous && next) {
    document.querySelector(".service-navigation").hidden = false;
    function updateCarousel() {
      const maxScroll = track.scrollWidth - track.clientWidth;
      previous.disabled = track.scrollLeft < 4;
      next.disabled = track.scrollLeft >= maxScroll - 4;
      const cardWidth = track.firstElementChild.getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const first = Math.round(track.scrollLeft / (cardWidth + gap)) + 1;
      const visible = Math.max(1, Math.floor((track.clientWidth + gap) / (cardWidth + gap)));
      const last = Math.min(track.children.length, first + visible - 1);
      status.textContent = (visible > 1 ? first + "–" + last : String(first).padStart(2, "0")) + " / 06";
    }
    function moveCarousel(direction) {
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const distance = track.firstElementChild.getBoundingClientRect().width + gap;
      track.scrollBy({ left: direction * distance, behavior: reducedMotion.matches ? "instant" : "smooth" });
    }
    previous.addEventListener("click", function () { moveCarousel(-1); });
    next.addEventListener("click", function () { moveCarousel(1); });
    track.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        moveCarousel(event.key === "ArrowLeft" ? -1 : 1);
      }
    });
    track.addEventListener("scroll", updateCarousel, { passive: true });
    new ResizeObserver(updateCarousel).observe(track);
    updateCarousel();
  }

  // Conteúdo visível por padrão: falhas de biblioteca nunca ocultam a página.
  if (!window.gsap || !window.ScrollTrigger) return;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();

  media.add("(prefers-reduced-motion: no-preference)", function () {
    function revealFromSide(element, direction, options) {
      const settings = options || {};
      return gsap.from(element, {
        // Compensate for the current translation when ScrollTrigger recalculates.
        x: function () {
          const bounds = element.getBoundingClientRect();
          const currentX = Number(gsap.getProperty(element, "x")) || 0;
          return direction < 0
            ? -(bounds.right - currentX + 32)
            : window.innerWidth - (bounds.left - currentX) + 32;
        },
        autoAlpha: 0,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: settings.trigger || element,
          start: settings.hero ? "top 95%" : "clamp(top 92%)",
          end: settings.hero ? "bottom top" : "clamp(top 62%)",
          // The first viewport enters on load; subsequent content follows scroll.
          scrub: settings.hero ? false : 0.6,
          once: true,
          invalidateOnRefresh: true
        }
      });
    }

    const revealGroups = [
      { selector: ".hero-text", direction: -2, hero: true },
      { selector: ".hero-media", direction: 2, hero: true },
      { selector: ".highlights", direction: -2 },
      { selector: ".about-media", direction: -2 },
      { selector: ".about-text", direction: 2 },
      { selector: ".services-heading > *" },
      { selector: ".service-navigation", direction: 2 },
      { selector: ".specialty-grid", direction: -2 },
      { selector: ".process-intro > *", direction: -2 },
      { selector: ".section > .container > .section-intro:not(.services-heading)" },
      { selector: ".result" },
      { selector: ".testimonial" },
      { selector: ".format-card" },
      { selector: ".faq-item", direction: 1 },
      { selector: ".cta-photo", direction: -1 },
      { selector: ".cta-inner", direction: 1 },
      { selector: ".footer-grid > div" },
      { selector: ".footer-bottom", direction: -1 }
    ];
    revealGroups.forEach(function (group) {
      gsap.utils.toArray(group.selector).forEach(function (element, index) {
        const direction = group.direction || (index % 2 === 0 ? -1 : 1);
        revealFromSide(element, direction, { hero: group.hero });
      });
    });

    gsap.utils.toArray(".step").forEach(function (step) {
      const content = step.querySelectorAll(".step-num, h3, p");
      const progress = step.querySelector(".step-rail > span");
      content.forEach(function (element) {
        revealFromSide(element, 1, { trigger: step });
      });
      ScrollTrigger.create({
        trigger: step,
        start: "top 78%",
        onEnter: function () { step.classList.add("is-active"); },
        onLeaveBack: function () { step.classList.remove("is-active"); }
      });
      if (progress) {
        gsap.to(progress, {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger: step, start: "top 78%", end: "bottom 78%", scrub: 0.6 }
        });
      }
    });
  });
  window.addEventListener("load", function () { ScrollTrigger.refresh(); }, { once: true });
  if (document.fonts) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
