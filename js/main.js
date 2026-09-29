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
    gsap.from(".hero-text > *", {
      opacity: 0, y: 20, duration: 1, stagger: 0.1, ease: "power3.out", clearProps: "all"
    });
    gsap.from(".hero-media", {
      opacity: 0, y: 24, duration: 1.2, ease: "power3.out", clearProps: "all"
    });
    // A leitura permanece estável; apenas a fotografia acompanha a rolagem.
    gsap.to(".hero-photo img", {
      yPercent: 2, scale: 1.06, ease: "none",
      scrollTrigger: { trigger: ".hero-photo", start: "top top", end: "bottom top", scrub: 1 }
    });
    gsap.utils.toArray(".about-media, .about-text, .services-heading, .process-intro, .result, .testimonial, .format-card, .faq-grid, .cta-inner").forEach(function (element) {
      gsap.from(element, {
        opacity: 0.2, y: 22, duration: 0.9, ease: "power3.out", clearProps: "all",
        scrollTrigger: { trigger: element, start: "top 94%", end: "top 73%", scrub: 0.6, once: true }
      });
    });
    gsap.from(".specialty", {
      opacity: 0.25, y: 18, stagger: 0.08, duration: 0.7, ease: "power3.out", clearProps: "all",
      scrollTrigger: { trigger: track, start: "top 92%", once: true }
    });
    gsap.utils.toArray(".step").forEach(function (step) {
      const content = step.querySelectorAll(".step-num, h3, p");
      const progress = step.querySelector(".step-rail > span");
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: step,
          start: "top 78%",
          end: "top 58%",
          scrub: 0.6,
          once: true
        }
      });
      timeline.fromTo(content, { autoAlpha: 0, y: 14 }, {
        autoAlpha: 1, y: 0, duration: 1, stagger: 0.12, ease: "power2.out"
      }, 0);
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
