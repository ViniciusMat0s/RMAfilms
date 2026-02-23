"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

const marqueeItems = [
  "story systems",
  "scroll choreography",
  "editorial grids",
  "cinematic motion",
  "tactile UI",
  "precision craft",
  "story systems",
  "scroll choreography",
  "editorial grids",
  "cinematic motion",
  "tactile UI",
  "precision craft",
];

const capabilities = [
  {
    label: "01",
    title: "Narrative architecture",
    copy: "We map stories like a film edit: tension, pause, release.",
  },
  {
    label: "02",
    title: "Motion direction",
    copy: "Micro and macro motion tuned to feel alive, never noisy.",
  },
  {
    label: "03",
    title: "Design systems",
    copy: "Tokenized grids, typography, and color for scalable rollouts.",
  },
  {
    label: "04",
    title: "Launch engineering",
    copy: "High performance builds with scroll triggers and responsive polish.",
  },
];

const projects = [
  {
    tag: "Luxury",
    title: "Velvet Signal",
    copy: "A gallery like launch that feels cinematic from the first scroll.",
    stats: ["12 scene rail", "parallax stack", "global press"],
  },
  {
    tag: "Culture",
    title: "Echo Atlas",
    copy: "Editorial landing experience with audio cues and kinetic type.",
    stats: ["94% scroll depth", "7 languages", "live debut"],
  },
  {
    tag: "Tech",
    title: "Polar Vector",
    copy: "Product reveal with interactive storytelling and rapid load times.",
    stats: ["2.1s load", "custom cursor", "GSAP core"],
  },
  {
    tag: "Retail",
    title: "Lumen Market",
    copy: "Shoppable narrative that blends tactile textures and data layers.",
    stats: ["24 modules", "soft scroll", "50% lift"],
  },
];

const process = [
  {
    step: "01",
    title: "Signal capture",
    copy: "We decode brand energy, audience intent, and launch purpose.",
  },
  {
    step: "02",
    title: "Experience map",
    copy: "We blueprint layout rhythm, motion beats, and interaction flow.",
  },
  {
    step: "03",
    title: "Build and polish",
    copy: "We craft components, animate with intent, and tune performance.",
  },
  {
    step: "04",
    title: "Launch system",
    copy: "We ship with documentation, analytics hooks, and future modules.",
  },
];

const studioValues = [
  "Bold typography",
  "Scroll storytelling",
  "Tactile color",
  "Premium motion",
  "Modular scenes",
];

const navSections = [
  { id: "capabilities", label: "Capacidades" },
  { id: "work", label: "Projetos" },
  { id: "process", label: "Processo" },
  { id: "studio", label: "Estúdio" },
];

export default function Home() {
  const rootRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
    });
    const enableHeroTrail = false;

    let updateNavProgress: (() => void) | null = null;
    const onLenisScroll = () => {
      ScrollTrigger.update();
      updateNavProgress?.();
    };
    lenis.on("scroll", onLenisScroll);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    let heroStage: HTMLElement | null = null;
    let onHeroMove: ((event: MouseEvent) => void) | null = null;
    let onHeroLeave: (() => void) | null = null;
    let onHeroLayoutRefresh: (() => void) | null = null;
    let onNavProgressRefresh: (() => void) | null = null;
    let recordingTimerId: ReturnType<typeof setInterval> | null = null;
    const pad2 = (value: number) => String(value).padStart(2, "0");

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        const direction = el.dataset.reveal || "up";
        const x = direction === "left" ? -80 : direction === "right" ? 80 : 0;
        const y = direction === "up" ? 60 : 0;

        gsap.fromTo(
          el,
          { autoAlpha: 0, x, y },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            duration: 1.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 82%",
            },
          }
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((wrapper) => {
        const items = wrapper.querySelectorAll<HTMLElement>("[data-stagger-item]");
        gsap.fromTo(
          items,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.16,
            scrollTrigger: {
              trigger: wrapper,
              start: "top 85%",
            },
          }
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const strength = Number(el.dataset.parallax || 0.2);
        gsap.to(el, {
          y: () => -120 * strength,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const target = Number(el.dataset.count || 0);
        const suffix = el.dataset.suffix || "";
        const counter = { value: 0 };
        gsap.to(counter, {
          value: target,
          duration: 1.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
          },
          onUpdate: () => {
            el.textContent = `${Math.round(counter.value)}${suffix}`;
          },
        });
      });

      gsap.to(".progress-bar", {
        scaleX: 1,
        ease: "none",
        transformOrigin: "left",
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.2,
        },
      });

      {
        const cinematicSections = gsap.utils.toArray<HTMLElement>(
          ".section--cinematic"
        );

        cinematicSections.forEach((section, index) => {
          gsap.set(section, {
            transformPerspective: 1000,
            transformOrigin: "50% 50%",
          });

          gsap.fromTo(
            section,
            {
              autoAlpha: 0.14,
              y: 112,
              scale: 0.96,
              rotateX: index % 2 === 0 ? 8 : -8,
            },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              rotateX: 0,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top 96%",
                end: "top 60%",
                scrub: 0.62,
              },
            }
          );
        });

        const capabilityCards = gsap.utils.toArray<HTMLElement>(".card-grid .card");
        capabilityCards.forEach((card, index) => {
          gsap.set(card, {
            transformPerspective: 980,
            transformOrigin: "50% 62%",
          });

          gsap.fromTo(
            card,
            {
              rotateX: 12,
              rotateY: index % 2 === 0 ? -7 : 7,
              scale: 0.92,
              "--card-glow": 0.14,
            },
            {
              rotateX: 0,
              rotateY: 0,
              scale: 1,
              "--card-glow": 1,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top 90%",
                end: "center 56%",
                scrub: 0.65,
              },
            }
          );

          gsap.to(card, {
            rotateX: -3,
            scale: 0.97,
            "--card-glow": 0.22,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "center 56%",
              end: "bottom 24%",
              scrub: 0.65,
            },
          });
        });

        const processCards = gsap.utils.toArray<HTMLElement>(".process-card");
        processCards.forEach((card, index) => {
          gsap.set(card, {
            transformPerspective: 960,
            transformOrigin: "50% 52%",
          });

          gsap.fromTo(
            card,
            {
              rotateX: index % 2 === 0 ? 7 : -7,
              scale: 0.95,
              "--process-scan": 0.04,
              "--process-glow": 0.12,
            },
            {
              rotateX: 0,
              scale: 1,
              "--process-scan": 1,
              "--process-glow": 1,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top 88%",
                end: "center 60%",
                scrub: 0.55,
              },
            }
          );

          gsap.to(card, {
            scale: 0.98,
            "--process-scan": 0.28,
            "--process-glow": 0.2,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "center 60%",
              end: "bottom 22%",
              scrub: 0.55,
            },
          });
        });

        const studioPills = gsap.utils.toArray<HTMLElement>(".pill-row .pill");
        studioPills.forEach((pill, index) => {
          gsap.fromTo(
            pill,
            {
              scale: 0.9,
              rotateZ: index % 2 === 0 ? -3 : 3,
              "--pill-pop": 0.08,
            },
            {
              scale: 1,
              rotateZ: 0,
              "--pill-pop": 1,
              ease: "none",
              scrollTrigger: {
                trigger: pill,
                start: "top 92%",
                end: "top 60%",
                scrub: 0.45,
              },
            }
          );

          gsap.to(pill, {
            scale: 0.98,
            "--pill-pop": 0.2,
            ease: "none",
            scrollTrigger: {
              trigger: pill,
              start: "top 60%",
              end: "bottom 28%",
              scrub: 0.45,
            },
          });
        });

        const statsPanel =
          rootRef.current?.querySelector<HTMLElement>(".stats-panel") ?? null;
        if (statsPanel) {
          gsap.fromTo(
            statsPanel,
            { "--panel-glow": 0.08 },
            {
              "--panel-glow": 1,
              ease: "none",
              scrollTrigger: {
                trigger: statsPanel,
                start: "top 86%",
                end: "bottom 34%",
                scrub: 0.6,
              },
            }
          );
        }

        const ctaInner =
          rootRef.current?.querySelector<HTMLElement>(".cta-inner") ?? null;
        if (ctaInner) {
          gsap.fromTo(
            ctaInner,
            { "--cta-glow": 0.12, "--cta-sweep": -1 },
            {
              "--cta-glow": 1,
              "--cta-sweep": 1,
              ease: "none",
              scrollTrigger: {
                trigger: ctaInner,
                start: "top 88%",
                end: "bottom 34%",
                scrub: 0.7,
              },
            }
          );

          const ctaButtons = ctaInner.querySelectorAll<HTMLElement>(
            ".cta-actions .button"
          );
          gsap.fromTo(
            ctaButtons,
            { autoAlpha: 0.45, scale: 0.92, rotateZ: -1.4 },
            {
              autoAlpha: 1,
              scale: 1,
              rotateZ: 0,
              duration: 0.8,
              ease: "power3.out",
              stagger: 0.1,
              scrollTrigger: {
                trigger: ctaInner,
                start: "top 82%",
              },
            }
          );
        }

        const footerColumns = gsap.utils.toArray<HTMLElement>(".footer > div");
        if (footerColumns.length) {
          gsap.fromTo(
            footerColumns,
            { autoAlpha: 0, y: 24, filter: "blur(6px)" },
            {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.9,
              ease: "power3.out",
              stagger: 0.14,
              scrollTrigger: {
                trigger: ".footer",
                start: "top 92%",
              },
            }
          );
        }
      }

      heroStage = document.querySelector<HTMLElement>(".hero-stage");
      const heroGrid =
        rootRef.current?.querySelector<HTMLElement>(".hero-grid") ?? null;
      const heroMainBlock =
        heroGrid?.querySelector<HTMLElement>(".hero-main-block") ?? null;
      const heroAccentLine =
        heroGrid?.querySelector<HTMLElement>(".hero-line--accent") ?? null;
      const heroTimeValue =
        rootRef.current?.querySelector<HTMLElement>("[data-recording-timer]") ??
        null;
      const heroZoomValue =
        heroStage?.querySelector<HTMLElement>(".hud-zoom-value") ?? null;
      const heroMainWords = gsap.utils.toArray<HTMLElement>("[data-hero-main-word]");
      const heroLideramWord =
        heroMainWords.find((word) => word.classList.contains("hero-highlight--glitch")) ??
        null;
      const heroWords = gsap.utils.toArray<HTMLElement>(".hero-word");
      const navItems = gsap.utils.toArray<HTMLElement>("[data-nav-item]");

      if (navItems.length) {
        const navStates = navItems
          .map((item) => {
            const sectionId = item.dataset.section;
            if (!sectionId) return null;

            const section = document.getElementById(sectionId);
            if (!section) return null;

            const setProgress = gsap.quickTo(item, "--progress", {
              duration: 0.38,
              ease: "power2.out",
            });
            const setScale = gsap.quickTo(item, "--dock-scale", {
              duration: 0.42,
              ease: "power2.out",
            });
            const setAlpha = gsap.quickTo(item, "--dock-alpha", {
              duration: 0.34,
              ease: "power2.out",
            });

            return { item, section, setProgress, setScale, setAlpha };
          })
          .filter(
            (
              state
            ): state is {
              item: HTMLElement;
              section: HTMLElement;
              setProgress: gsap.QuickToFunc;
              setScale: gsap.QuickToFunc;
              setAlpha: gsap.QuickToFunc;
            } => state !== null
          );

        const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
        const clamp = (value: number, min: number, max: number) =>
          Math.min(max, Math.max(min, value));
        updateNavProgress = () => {
          const scrollY = window.scrollY;
          const viewportHeight = window.innerHeight;
          let activeIndex = -1;
          let activeProgress = 0;
          const navSnapshot = navStates.map(({ item, section }) => {
            const sectionRect = section.getBoundingClientRect();
            const sectionTop = scrollY + sectionRect.top;
            const sectionBottom = sectionTop + sectionRect.height;

            const enterStart = sectionTop - viewportHeight * 0.7;
            const fillEnd = sectionBottom - viewportHeight * 0.42;
            const decayEnd = sectionBottom + viewportHeight * 0.42;

            let targetProgress = 0;
            if (scrollY < enterStart) {
              targetProgress = 0;
            } else if (scrollY <= fillEnd) {
              const growSpan = Math.max(fillEnd - enterStart, 1);
              targetProgress = clamp01((scrollY - enterStart) / growSpan);
            } else if (scrollY <= decayEnd) {
              const decaySpan = Math.max(decayEnd - fillEnd, 1);
              targetProgress = clamp01(1 - (scrollY - fillEnd) / decaySpan);
            } else {
              targetProgress = 0;
            }

            const passedDepth =
              scrollY <= fillEnd
                ? 0
                : clamp01(
                    (scrollY - fillEnd) / Math.max(decayEnd - fillEnd, 1)
                  );

            return { item, targetProgress, passedDepth };
          });

          navSnapshot.forEach((state, index) => {
            if (state.targetProgress > activeProgress) {
              activeProgress = state.targetProgress;
              activeIndex = index;
            }
          });

          navSnapshot.forEach((state, index) => {
            const { item, targetProgress, passedDepth } = state;
            const { setProgress, setScale, setAlpha } = navStates[index];
            const dockInfluence =
              activeIndex < 0
                ? 0
                : Math.max(0, 1 - Math.abs(index - activeIndex) * 0.55);
            const dockBoost = dockInfluence * 0.18;
            const scaleTarget = clamp(
              0.6,
              1.24,
              0.86 + targetProgress * 0.34 + dockBoost - passedDepth * 0.3
            );
            const alphaTarget = clamp(
              0.34,
              1,
              0.62 + targetProgress * 0.28 + dockBoost * 0.24 - passedDepth * 0.24
            );

            setProgress(targetProgress);
            setScale(scaleTarget);
            setAlpha(alphaTarget);
            item.classList.toggle("is-active", index === activeIndex && activeProgress > 0.08);
            item.classList.toggle("is-passed", passedDepth > 0.45 && targetProgress < 0.22);
          });
        };

        updateNavProgress();
        window.addEventListener("resize", updateNavProgress);
        ScrollTrigger.addEventListener("refresh", updateNavProgress);
        onNavProgressRefresh = updateNavProgress;
      }

      if (heroGrid && heroMainBlock && heroAccentLine) {
        const updateHeroBalance = () => {
          const gridBounds = heroGrid.getBoundingClientRect();
          const mainBounds = heroMainBlock.getBoundingClientRect();
          const accentBounds = heroAccentLine.getBoundingClientRect();

          const centerY = gridBounds.height / 2;
          const mainBottom = mainBounds.bottom - gridBounds.top;
          const accentHeight = accentBounds.height;
          const gapAboveCenter = Math.max(0, centerY - mainBottom);
          const accentOffset = gapAboveCenter + accentHeight / 2;

          heroGrid.style.setProperty("--hero-balance-offset", `${accentOffset}px`);
        };

        updateHeroBalance();
        requestAnimationFrame(updateHeroBalance);
        window.addEventListener("resize", updateHeroBalance);
        onHeroLayoutRefresh = updateHeroBalance;
        void document.fonts?.ready.then(updateHeroBalance);
      }

      if (heroTimeValue) {
        const startedAt = Date.now();
        const fps = 30;
        const tickMs = Math.round(1000 / fps);
        const updateTimecode = () => {
          const elapsedMs = Date.now() - startedAt;
          const totalSeconds = Math.floor(elapsedMs / 1000);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;
          const frames = Math.floor((elapsedMs % 1000) / tickMs) % fps;
          heroTimeValue.textContent = `${pad2(hours)}:${pad2(minutes)}:${pad2(
            seconds
          )}:${pad2(frames)}`;
        };

        updateTimecode();
        recordingTimerId = setInterval(updateTimecode, tickMs);
      }

      if (heroStage || heroWords.length || heroMainWords.length) {
        const heroTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: ".hero--statement",
            start: "top top",
            end: "+=160%",
            scrub: true,
            pin: true,
            anticipatePin: 1,
          },
        });

        if (heroStage) {
          heroTimeline.fromTo(
            heroStage,
            { "--zoom-level": 0 },
            { "--zoom-level": 1, ease: "none" },
            0
          );
          heroTimeline.eventCallback("onUpdate", () => {
            if (heroZoomValue) {
              const minZoom = 1;
              const maxZoom = 3;
              const zoom =
                minZoom + (maxZoom - minZoom) * heroTimeline.progress();
              heroZoomValue.textContent = `${zoom.toFixed(1)}x`;
            }

            if (heroLideramWord) {
              const alpha = Number(gsap.getProperty(heroLideramWord, "autoAlpha"));
              const disintegrate = Number(
                gsap.getProperty(heroLideramWord, "--lideram-disintegrate")
              );
              const rect = heroLideramWord.getBoundingClientRect();
              const isInViewport =
                rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0;
              const shouldRunGlitch =
                isInViewport && (alpha > 0.08 || disintegrate > 0.04);
              heroLideramWord.style.setProperty(
                "--lideram-play",
                shouldRunGlitch ? "running" : "paused"
              );
              heroLideramWord.style.setProperty(
                "--tv-scroll",
                shouldRunGlitch ? "1" : "0"
              );
            }
          });
        }

        if (heroMainWords.length) {
          gsap.set(heroMainWords, {
            autoAlpha: 0,
            y: 14,
            scale: 0.992,
            "--word-glow": 0,
            "--tv-scroll": 0,
            "--tv-hover": 0,
            "--hero-disintegrate": 0,
            "--hero-frag-opacity": 0,
            "--lideram-disintegrate": 0,
            "--lideram-frag-opacity": 0,
            "--lideram-play": "paused",
          });
          gsap.set(heroMainWords[0], {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            "--word-glow": 0,
            "--hero-disintegrate": 0,
            "--hero-frag-opacity": 0,
          });

          const mainWordStops = [0.14, 0.24, 0.34, 0.46, 0.6];
          const getMainWordPosition = (wordIndex: number) =>
            mainWordStops[wordIndex - 1] ??
            0.14 + (0.56 * (wordIndex - 1)) / Math.max(heroMainWords.length - 2, 1);

          heroMainWords.forEach((word, index) => {
            if (index === 0) return;
            const position = getMainWordPosition(index);
            const isLideramWord = word.classList.contains("hero-highlight--glitch");
            const disintegrateStart = 0.74 + index * 0.03;
            const disintegrateMotionStart = disintegrateStart + 0.05;

            heroTimeline.to(
              word,
              { autoAlpha: 1, y: 0, scale: 1, duration: 0.26, ease: "power2.out" },
              position
            );
            if (isLideramWord) {
              heroTimeline.set(word, { "--lideram-play": "running" }, position + 0.02);
              heroTimeline.to(
                word,
                {
                  "--lideram-frag-opacity": 1,
                  duration: 0.1,
                  ease: "power2.out",
                },
                disintegrateStart
              );
              heroTimeline.to(
                word,
                {
                  "--lideram-disintegrate": 1,
                  "--lideram-frag-opacity": 0,
                  "--word-glow": 0,
                  "--tv-scroll": 0,
                  y: -132,
                  scale: 0.84,
                  autoAlpha: 0,
                  duration: 0.36,
                  ease: "power3.in",
                },
                disintegrateMotionStart
              );
              heroTimeline.set(
                word,
                { "--lideram-play": "paused", "--lideram-frag-opacity": 0, autoAlpha: 0 },
                1.08
              );
            } else {
              heroTimeline.to(
                word,
                {
                  "--hero-frag-opacity": 0.92,
                  duration: 0.08,
                  ease: "power2.out",
                },
                disintegrateStart
              );
              heroTimeline.to(
                word,
                {
                  "--hero-disintegrate": 1,
                  "--hero-frag-opacity": 0,
                  "--word-glow": 0,
                  "--tv-scroll": 0,
                  y: -124,
                  scale: 0.86,
                  autoAlpha: 0,
                  duration: 0.34,
                  ease: "power3.in",
                },
                disintegrateMotionStart
              );
            }
            heroTimeline.to(
              word,
              { "--word-glow": 1.22, duration: 0.16, ease: "sine.out" },
              position + 0.04
            );
            heroTimeline.to(
              word,
              { "--word-glow": 0.18, duration: 0.2, ease: "sine.inOut" },
              position + 0.2
            );
            heroTimeline.to(
              word,
              { "--word-glow": 0, duration: 0.28, ease: "sine.inOut" },
              position + 0.34
            );
          });

          const firstMainWord = heroMainWords[0];
          if (
            firstMainWord &&
            !firstMainWord.classList.contains("hero-highlight--glitch")
          ) {
            heroTimeline.to(
              firstMainWord,
              {
                "--hero-frag-opacity": 0.9,
                duration: 0.08,
                ease: "power2.out",
              },
              0.72
            );
            heroTimeline.to(
              firstMainWord,
              {
                "--hero-disintegrate": 1,
                "--hero-frag-opacity": 0,
                "--word-glow": 0,
                "--tv-scroll": 0,
                y: -124,
                scale: 0.86,
                autoAlpha: 0,
                duration: 0.34,
                ease: "power3.in",
              },
              0.77
            );
          }
        }

        if (heroWords.length) {
          gsap.set(heroWords, {
            autoAlpha: 0,
            y: 14,
            "--tv-scroll": 0,
            "--hero-disintegrate": 0,
            "--hero-frag-opacity": 0,
          });
          gsap.set(heroWords[0], {
            autoAlpha: 1,
            y: 0,
            "--tv-scroll": 0,
            "--hero-disintegrate": 0,
            "--hero-frag-opacity": 0,
          });

          const wordStops = [0.2, 0.52, 0.84];
          const getWordPosition = (wordIndex: number) =>
            wordStops[wordIndex] ?? wordIndex / heroWords.length;
          heroWords.forEach((word, index) => {
            if (index === 0) return;
            const prev = heroWords[index - 1];
            const position = getWordPosition(index);
            const nextPosition =
              index < heroWords.length - 1 ? getWordPosition(index + 1) : null;
            const tvStart = position + 0.015;
            const tvDuration =
              nextPosition !== null
                ? Math.max(0.08, Math.min(0.14, (nextPosition - position) * 0.42))
                : 0.12;
            const tvFadeEnd = tvStart + tvDuration;
            const prevDissolveStart = Math.max(0, position - 0.04);

            heroTimeline.to(
              prev,
              {
                "--hero-frag-opacity": 0.84,
                duration: 0.07,
                ease: "power2.out",
              },
              prevDissolveStart
            );
            heroTimeline.to(
              prev,
              {
                autoAlpha: 0,
                y: -44,
                "--tv-scroll": 0,
                "--hero-disintegrate": 1,
                "--hero-frag-opacity": 0,
                duration: 0.22,
                ease: "power2.in",
              },
              position
            );
            heroTimeline.to(
              word,
              {
                autoAlpha: 1,
                y: 0,
                "--hero-disintegrate": 0,
                "--hero-frag-opacity": 0,
                duration: 0.18,
                ease: "power2.out",
              },
              position + 0.02
            );
            heroTimeline.set(word, { "--tv-scroll": 1 }, tvStart);
            heroTimeline.to(
              word,
              { "--tv-scroll": 0, duration: tvDuration, ease: "power2.out" },
              tvStart + 0.01
            );
            heroTimeline.set(word, { "--tv-scroll": 0 }, tvFadeEnd + 0.01);
          });

          const lastWord = heroWords[heroWords.length - 1];
          if (lastWord) {
            heroTimeline.to(
              lastWord,
              {
                "--hero-frag-opacity": 0.9,
                duration: 0.08,
                ease: "power2.out",
              },
              0.9
            );
            heroTimeline.to(
              lastWord,
              {
                "--hero-disintegrate": 1,
                "--hero-frag-opacity": 0,
                "--tv-scroll": 0,
                y: -96,
                autoAlpha: 0,
                duration: 0.32,
                ease: "power3.in",
              },
              0.94
            );
          }
        }
      }

      const railTrack = railRef.current;
      if (railTrack) {
        const getScrollDistance = () =>
          railTrack.scrollWidth - window.innerWidth + 120;

        const railTween = gsap.to(railTrack, {
          x: () => -getScrollDistance(),
          ease: "none",
          scrollTrigger: {
            trigger: ".rail-section",
            start: "top top",
            end: () => `+=${railTrack.scrollWidth}`,
            scrub: 0.6,
            pin: true,
            anticipatePin: 1,
          },
        });

        {
          const railCards = gsap.utils.toArray<HTMLElement>(".rail-card");
          railCards.forEach((card, index) => {
            gsap.set(card, {
              transformPerspective: 1000,
              transformOrigin: "50% 50%",
            });

            gsap.fromTo(
              card,
              {
                scale: 0.88,
                rotateY: index % 2 === 0 ? -7 : 7,
                "--rail-focus": 0.14,
              },
              {
                scale: 1,
                rotateY: 0,
                "--rail-focus": 1,
                ease: "none",
                scrollTrigger: {
                  trigger: card,
                  containerAnimation: railTween,
                  start: "left 82%",
                  end: "center center",
                  scrub: 0.5,
                },
              }
            );

            gsap.to(card, {
              scale: 0.9,
              rotateY: index % 2 === 0 ? 6 : -6,
              "--rail-focus": 0.2,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                containerAnimation: railTween,
                start: "center center",
                end: "right 18%",
                scrub: 0.5,
              },
            });
          });
        }
      }

      const magneticItems = gsap.utils.toArray<HTMLElement>(".magnetic");
      magneticItems.forEach((item) => {
        const strength = 16;
        const onMove = (event: MouseEvent) => {
          const bounds = item.getBoundingClientRect();
          const relX = event.clientX - bounds.left - bounds.width / 2;
          const relY = event.clientY - bounds.top - bounds.height / 2;
          gsap.to(item, {
            x: relX / strength,
            y: relY / strength,
            duration: 0.3,
            ease: "power3.out",
          });
        };
        const onLeave = () => {
          gsap.to(item, { x: 0, y: 0, duration: 0.4, ease: "power3.out" });
        };
        item.addEventListener("mousemove", onMove);
        item.addEventListener("mouseleave", onLeave);
      });

      const cursor = document.querySelector<HTMLElement>(".cursor");
      if (cursor && window.matchMedia("(pointer: fine)").matches) {
        const xTo = gsap.quickTo(cursor, "x", { duration: 0.2, ease: "power3" });
        const yTo = gsap.quickTo(cursor, "y", { duration: 0.2, ease: "power3" });

        const onMove = (event: MouseEvent) => {
          xTo(event.clientX);
          yTo(event.clientY);
        };

        window.addEventListener("mousemove", onMove);

        const hoverTargets = document.querySelectorAll<HTMLElement>(
          "a, button, .magnetic"
        );
        hoverTargets.forEach((el) => {
          el.addEventListener("mouseenter", () =>
            cursor.classList.add("cursor--active")
          );
          el.addEventListener("mouseleave", () =>
            cursor.classList.remove("cursor--active")
          );
        });
      }

      if (heroStage && enableHeroTrail) {
        const currentHeroStage = heroStage;
        const clampPercent = (value: number) => Math.min(100, Math.max(0, value));
        let lastX = 50;
        let lastY = 50;
        const setX = gsap.quickTo(heroStage, "--mx", {
          duration: 0.36,
          ease: "power3.out",
        });
        const setY = gsap.quickTo(heroStage, "--my", {
          duration: 0.36,
          ease: "power3.out",
        });
        const setTrailX1 = gsap.quickTo(heroStage, "--trail-x1", {
          duration: 0.72,
          ease: "power3.out",
        });
        const setTrailY1 = gsap.quickTo(heroStage, "--trail-y1", {
          duration: 0.72,
          ease: "power3.out",
        });
        const setTrailX2 = gsap.quickTo(heroStage, "--trail-x2", {
          duration: 1.04,
          ease: "power3.out",
        });
        const setTrailY2 = gsap.quickTo(heroStage, "--trail-y2", {
          duration: 1.04,
          ease: "power3.out",
        });
        const setTrailEnergy = gsap.quickTo(heroStage, "--trail-energy", {
          duration: 0.38,
          ease: "power2.out",
        });
        const setTrailActive = gsap.quickTo(heroStage, "--trail-active", {
          duration: 0.14,
          ease: "power2.out",
        });
        const setTrailStretch = gsap.quickTo(heroStage, "--trail-stretch", {
          duration: 0.46,
          ease: "power2.out",
        });
        const setTrailAngle = gsap.quickTo(heroStage, "--trail-angle", {
          duration: 0.14,
          ease: "power2.out",
        });

        onHeroMove = (event: MouseEvent) => {
          const bounds = currentHeroStage.getBoundingClientRect();
          const x = ((event.clientX - bounds.left) / bounds.width) * 100;
          const y = ((event.clientY - bounds.top) / bounds.height) * 100;
          const deltaX = x - lastX;
          const deltaY = y - lastY;
          lastX = x;
          lastY = y;
          const speed = Math.min(1, Math.hypot(deltaX, deltaY) / 8);
          const angleDeg = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
          const energy = 0.46 + speed * 0.34;
          const stretch = 0.16 + speed * 0.58;

          setX(x);
          setY(y);
          setTrailX1(clampPercent(x - deltaX * 8.4));
          setTrailY1(clampPercent(y - deltaY * 8.4));
          setTrailX2(clampPercent(x - deltaX * 14.8));
          setTrailY2(clampPercent(y - deltaY * 14.8));
          setTrailActive(1);
          setTrailEnergy(energy);
          setTrailStretch(stretch);
          setTrailAngle(angleDeg);
        };

        onHeroLeave = () => {
          lastX = 50;
          lastY = 50;
          setX(50);
          setY(50);
          setTrailX1(50);
          setTrailY1(50);
          setTrailX2(50);
          setTrailY2(50);
          setTrailActive(0);
          setTrailEnergy(0.02);
          setTrailStretch(0);
          setTrailAngle(0);
        };

        const usePointerEvents = "onpointermove" in window;
        if (usePointerEvents) {
          currentHeroStage.addEventListener("pointermove", onHeroMove);
          currentHeroStage.addEventListener("pointerleave", onHeroLeave);
        } else {
          currentHeroStage.addEventListener("mousemove", onHeroMove);
          currentHeroStage.addEventListener("mouseleave", onHeroLeave);
        }
      }
    }, rootRef);

    return () => {
      if (onHeroLayoutRefresh) {
        window.removeEventListener("resize", onHeroLayoutRefresh);
      }
      if (onNavProgressRefresh) {
        window.removeEventListener("resize", onNavProgressRefresh);
        ScrollTrigger.removeEventListener("refresh", onNavProgressRefresh);
      }
      if (heroStage && onHeroMove && onHeroLeave) {
        heroStage.removeEventListener("pointermove", onHeroMove);
        heroStage.removeEventListener("pointerleave", onHeroLeave);
        heroStage.removeEventListener("mousemove", onHeroMove);
        heroStage.removeEventListener("mouseleave", onHeroLeave);
      }
      if (recordingTimerId) {
        clearInterval(recordingTimerId);
      }
      lenis.destroy();
      ctx.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className="page">
      <div className="cursor">
        <span className="cursor-dot" />
        <span className="cursor-ring" />
      </div>

      <div className="progress">
        <span className="progress-bar" />
      </div>

      <header className="nav">
        <nav className="nav-links" aria-label="Section navigation">
          {navSections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="nav-link-hud"
              data-nav-item
              data-section={section.id}
            >
              <span className="nav-link-track" aria-hidden="true">
                <span className="nav-link-fill" />
              </span>
              <span className="nav-link-label" aria-hidden="true">
                {section.label.split("").map((character, index) => (
                  <span
                    key={`${section.id}-${character}-${index}`}
                    className={`nav-letter${
                      character === " " ? " nav-letter--space" : ""
                    }`}
                  >
                    {character === " " ? "\u00A0" : character}
                  </span>
                ))}
              </span>
              <span className="sr-only">{section.label}</span>
            </a>
          ))}
        </nav>
      </header>

      <main>
        <section className="hero hero--statement" id="top">
          <div className="hero-stage">
            <div className="hero-flash" aria-hidden="true" />
            <div className="hero-hud" aria-hidden="true">
              <span className="hud-corner hud-corner--tl" />
              <span className="hud-corner hud-corner--tr" />
              <span className="hud-corner hud-corner--bl" />
              <span className="hud-corner hud-corner--br" />
              <div className="hud-time" data-recording-timer>
                00:00:00:00
              </div>
              <div className="hud-mode">AUTO<br />AWB</div>
              <div className="hud-battery">
                <span />
                <span />
                <span />
              </div>
              <div className="hud-crosshair">
                <span />
                <span />
              </div>
              <div className="hud-zoom">
                <span>ZOOM</span>
                <strong className="hud-zoom-value">1.0x</strong>
                <div className="hud-zoom-bar">
                  <span />
                </div>
              </div>
              <div className="hud-meter">-3..2..1..1..2..3</div>
              <div className="hud-iso">ISO 100 1/100 F2.8</div>
              <div className="hud-audio">
                <span>L</span>
                <div className="hud-bars" />
                <span>R</span>
              </div>
              <div className="hud-res">
                HD 2K 4K 6K FPS60<br />3840x2160<br />1h30m
              </div>
            </div>
            <a className="hud-contact-button magnetic" href="#contact">
              <span className="hud-contact-button-dot" aria-hidden="true" />
              Entre em contato
            </a>
            <div className="hero-grid">
              <h1 className="hero-text">
                <span className="hero-main-block">
                  <span className="hero-line hero-line--main">
                    <span className="hero-main-word hero-disintegrate-word" data-hero-main-word>
                      <span className="hero-text-core">FILMES</span>
                      <span className="hero-text-fragments" aria-hidden="true">
                        FILMES
                      </span>
                    </span>{" "}
                    <span className="hero-main-word hero-disintegrate-word" data-hero-main-word>
                      <span className="hero-text-core">ESTRAT&Eacute;GICOS</span>
                      <span className="hero-text-fragments" aria-hidden="true">
                        ESTRAT&Eacute;GICOS
                      </span>
                    </span>
                  </span>
                  <span className="hero-line hero-line--main">
                    <span className="hero-main-word hero-disintegrate-word" data-hero-main-word>
                      <span className="hero-text-core">PARA</span>
                      <span className="hero-text-fragments" aria-hidden="true">
                        PARA
                      </span>
                    </span>{" "}
                    <span className="hero-main-word hero-disintegrate-word" data-hero-main-word>
                      <span className="hero-text-core">MARCAS</span>
                      <span className="hero-text-fragments" aria-hidden="true">
                        MARCAS
                      </span>
                    </span>{" "}
                    <span className="hero-main-word hero-disintegrate-word" data-hero-main-word>
                      <span className="hero-text-core">QUE</span>
                      <span className="hero-text-fragments" aria-hidden="true">
                        QUE
                      </span>
                    </span>
                  </span>
                </span>
                <span className="hero-line hero-line--accent">
                  <span
                    className="hero-highlight hero-main-word hero-highlight--glitch"
                    data-hero-main-word
                    data-text="LIDERAM"
                  >
                    <span className="hero-highlight-label" data-text="LIDERAM">
                      <span className="hero-highlight-core">LIDERAM</span>
                      <span className="hero-highlight-fragments" aria-hidden="true">
                        LIDERAM
                      </span>
                    </span>
                  </span>
                </span>
              </h1>
              <div className="hero-right">
                <div className="hero-words">
                  <span className="hero-word hero-disintegrate-word">
                    <span className="hero-text-core">Reputa&ccedil;&atilde;o.</span>
                    <span className="hero-text-fragments" aria-hidden="true">
                      Reputa&ccedil;&atilde;o.
                    </span>
                  </span>
                  <span className="hero-word hero-disintegrate-word">
                    <span className="hero-text-core">Marca.</span>
                    <span className="hero-text-fragments" aria-hidden="true">
                      Marca.
                    </span>
                  </span>
                  <span className="hero-word hero-disintegrate-word">
                    <span className="hero-text-core">Autoridade.</span>
                    <span className="hero-text-fragments" aria-hidden="true">
                      Autoridade.
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="marquee">
          <div className="marquee-track">
            {marqueeItems.map((item, index) => (
              <span key={`${item}-${index}`}>{item}</span>
            ))}
          </div>
        </div>

        <section className="section section--cinematic" id="capabilities">
          <div className="section-head">
            <p className="eyebrow" data-reveal="left">
              Capabilities
            </p>
            <h2 className="section-title--hero-font hero-line--main" data-reveal="left">
              A studio tuned for premium launches.
            </h2>
            <p className="section-lead" data-reveal="right">
              We combine editorial systems, motion direction, and technical
              excellence to shape experiences with intent.
            </p>
          </div>
          <div className="card-grid" data-stagger>
            {capabilities.map((card) => (
              <article className="card" key={card.title} data-stagger-item>
                <span className="card-label">{card.label}</span>
                <h3>{card.title}</h3>
                <p>{card.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rail-section section--cinematic" id="work">
          <div className="rail-head">
            <div>
              <p className="eyebrow" data-reveal="left">
                Selected work
              </p>
              <h2 data-reveal="left">A curated set of launches.</h2>
            </div>
            <p className="section-lead" data-reveal="right">
              Horizontal scroll storytelling inspired by the highest level
              award sites.
            </p>
          </div>
          <div className="rail-track" ref={railRef}>
            {projects.map((project) => (
              <article className="rail-card" key={project.title}>
                <div className="rail-image" aria-hidden="true" />
                <div className="rail-body">
                  <div className="rail-top">
                    <span>{project.tag}</span>
                    <span>2026</span>
                  </div>
                  <h3>{project.title}</h3>
                  <p>{project.copy}</p>
                  <ul>
                    {project.stats.map((stat) => (
                      <li key={stat}>{stat}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section section--cinematic" id="process">
          <div className="section-head">
            <p className="eyebrow" data-reveal="left">
              Process
            </p>
            <h2 className="section-title--hero-font hero-line--main" data-reveal="left">
              Precision, rhythm, velocity.
            </h2>
            <p className="section-lead" data-reveal="right">
              Every step is choreographed so the experience feels inevitable.
            </p>
          </div>
          <div className="process-grid" data-stagger>
            {process.map((step) => (
              <article className="process-card" key={step.step} data-stagger-item>
                <span>{step.step}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section section--cinematic" id="studio">
          <div className="split">
            <div>
              <p className="eyebrow" data-reveal="left">
                Studio lens
              </p>
              <h2 data-reveal="left">Built to feel tactile, never template.</h2>
              <p className="section-lead" data-reveal="right">
                We treat every landing as a stage. Typography moves from the
                side, sections breathe, and motion supports the narrative.
              </p>
              <div className="pill-row" data-stagger>
                {studioValues.map((pill) => (
                  <span className="pill" key={pill} data-stagger-item>
                    {pill}
                  </span>
                ))}
              </div>
            </div>
            <div className="stats-panel" data-reveal="right">
              <div className="stats-row">
                <div>
                  <strong data-count="96" data-suffix="%">
                    0
                  </strong>
                  <span>client retention</span>
                </div>
                <div>
                  <strong data-count="4" data-suffix="x">
                    0
                  </strong>
                  <span>scroll depth lift</span>
                </div>
                <div>
                  <strong data-count="18" data-suffix="">
                    0
                  </strong>
                  <span>countries shipped</span>
                </div>
              </div>
              <div className="stats-note">
                <p>
                  Built with Next.js, GSAP, and Lenis for silky scroll and
                  precise timing.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="cta section--cinematic" id="contact">
          <div className="cta-inner" data-reveal="up">
            <div>
              <p className="eyebrow">Ready to launch</p>
              <h2 className="section-title--hero-font hero-line--main">
                Lets craft a landing page that feels alive.
              </h2>
              <p>
                Share your brief and receive a concept outline with timelines,
                motion notes, and layout direction.
              </p>
            </div>
            <div className="cta-actions">
              <a className="button magnetic" href="mailto:hello@lumen.studio">
                hello@lumen.studio
              </a>
              <a className="button button--ghost magnetic" href="#top">
                Back to top
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div>
          <strong>Lumen Atelier</strong>
          <p>Immersive landing systems for brands that move fast.</p>
        </div>
        <div>
          <span>Based in Sao Paulo, Lisbon, and Paris</span>
          <span>2026</span>
        </div>
      </footer>
    </div>
  );
}
