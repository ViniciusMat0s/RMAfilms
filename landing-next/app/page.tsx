"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Image from "next/image";
import {
  capabilities,
  footerLegalLinks,
  footerLinkColumns,
  navSections,
  process,
  projects,
  teamMembers,
} from "./content";

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
    let updateFilmStrip: (() => void) | null = null;
    const onLenisScroll = () => {
      ScrollTrigger.update();
      updateNavProgress?.();
      updateFilmStrip?.();
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
    let teamHoverCleanups: Array<() => void> = [];
    let roadmapHoverCleanups: Array<() => void> = [];
    let capabilityMobileTapCleanups: Array<() => void> = [];
    let ctaHoverCleanup: (() => void) | null = null;
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

      const marqueeTrack =
        rootRef.current?.querySelector<HTMLElement>(".marquee-track") ?? null;
      if (marqueeTrack) {
        const stripSpeed = 0.72;
        updateFilmStrip = () => {
          const loopWidth = marqueeTrack.scrollWidth / 2;
          if (loopWidth <= 0) return;
          const scrollPosition =
            typeof lenis.scroll === "number" ? lenis.scroll : window.scrollY;
          const offset = (scrollPosition * stripSpeed) % loopWidth;
          marqueeTrack.style.transform = `translate3d(${-offset}px, 0, 0)`;
        };
        updateFilmStrip();
        window.addEventListener("resize", updateFilmStrip);
      }

      {
        const cinematicSections = gsap.utils.toArray<HTMLElement>(
          ".section--cinematic"
        );

        cinematicSections.forEach((section, index) => {
          if (section.id === "capabilities") return;
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

        const sectionTitles = gsap.utils.toArray<HTMLElement>("[data-title-fx]");
        sectionTitles.forEach((title) => {
          const lines = gsap.utils.toArray<HTMLElement>(".title-line", title);
          const accent = title.querySelector<HTMLElement>("em");
          const titleTrigger =
            title.closest<HTMLElement>(".section-head, .rail-head, .cta-inner") ??
            title;
          const isWorkTitle = title.classList.contains(
            "section-title-cinematic--work"
          );

          if (!lines.length) return;

          gsap.set(title, {
            "--title-glow": 0,
            "--title-scan": 0,
          });

          if (accent) {
            gsap.set(accent, { "--title-accent": 0 });
          }

          gsap.set(lines, {
            autoAlpha: 0,
            yPercent: isWorkTitle ? 130 : 116,
            filter: "blur(10px)",
          });

          const titleTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: titleTrigger,
              start: isWorkTitle ? "top 88%" : "top 90%",
              end: isWorkTitle ? "top 28%" : "top 44%",
              scrub: isWorkTitle ? 0.68 : 0.56,
            },
          });

          titleTimeline.to(
            lines,
            {
              autoAlpha: 1,
              yPercent: 0,
              filter: "blur(0px)",
              xPercent: isWorkTitle ? (index: number) => (index === 1 ? 0 : -1.4) : 0,
              ease: "power3.out",
              stagger: isWorkTitle ? 0.16 : 0.12,
            },
            0
          );

          titleTimeline.to(
            title,
            {
              "--title-glow": isWorkTitle ? 1.36 : 1,
              "--title-scan": 1,
              ease: "none",
            },
            0.04
          );

          titleTimeline.to(
            title,
            {
              "--title-glow": isWorkTitle ? 0.66 : 0.46,
              "--title-scan": isWorkTitle ? 0.64 : 0.42,
              ease: "none",
            },
            0.74
          );

          if (accent) {
            titleTimeline.fromTo(
              accent,
              {
                autoAlpha: 0.22,
                yPercent: 32,
                filter: "blur(6px)",
              },
              {
                autoAlpha: 1,
                yPercent: 0,
                filter: "blur(0px)",
                ease: "power3.out",
              },
              0.18
            );

            titleTimeline.to(
              accent,
              {
                "--title-accent": 1,
                ease: "none",
              },
              0.24
            );
          }
        });

        const capabilityRows = gsap.utils.toArray<HTMLElement>(".capability-row");
        if (capabilityRows.length) {
          const capabilityMobileMq = window.matchMedia("(max-width: 900px)");
          let currentActiveIndex: number | null = null;

          const updateCapabilityBodyHeights = () => {
            capabilityRows.forEach((row) => {
              const body = row.querySelector<HTMLElement>(".capability-body");
              if (!body) return;
              row.style.setProperty("--capability-body-height", `${body.scrollHeight}px`);
            });
          };

          const setActiveRow = (activeIndex: number | null) => {
            if (currentActiveIndex === activeIndex) return;
            currentActiveIndex = activeIndex;

            capabilityRows.forEach((row, rowIndex) => {
              const isActive = activeIndex === rowIndex;
              row.classList.toggle("is-active", isActive);
              row.setAttribute("aria-expanded", String(isActive));
            });
          };

          const applyCapabilitiesMode = () => {
            if (capabilityMobileMq.matches) {
              capabilityRows.forEach((row) => {
                row.setAttribute("tabindex", "0");
                row.setAttribute("role", "button");
                if (!row.hasAttribute("aria-expanded")) {
                  row.setAttribute("aria-expanded", "false");
                }
              });
              return;
            }

            currentActiveIndex = null;
            capabilityRows.forEach((row) => {
              row.classList.remove("is-active");
              row.removeAttribute("tabindex");
              row.removeAttribute("role");
              row.removeAttribute("aria-expanded");
            });
          };

          capabilityRows.forEach((row, rowIndex) => {
            const toggleRow = () => {
              if (!capabilityMobileMq.matches) return;
              const nextIndex = currentActiveIndex === rowIndex ? null : rowIndex;
              setActiveRow(nextIndex);
            };

            const onKeyDown = (event: KeyboardEvent) => {
              if (!capabilityMobileMq.matches) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                toggleRow();
              }
            };

            row.addEventListener("click", toggleRow);
            row.addEventListener("keydown", onKeyDown);
            capabilityMobileTapCleanups.push(() => {
              row.removeEventListener("click", toggleRow);
              row.removeEventListener("keydown", onKeyDown);
              row.removeAttribute("tabindex");
              row.removeAttribute("role");
              row.removeAttribute("aria-expanded");
              row.classList.remove("is-active");
            });
          });

          const onCapabilitiesModeChange = () => applyCapabilitiesMode();
          if (capabilityMobileMq.addEventListener) {
            capabilityMobileMq.addEventListener("change", onCapabilitiesModeChange);
            capabilityMobileTapCleanups.push(() => {
              capabilityMobileMq.removeEventListener("change", onCapabilitiesModeChange);
            });
          } else {
            capabilityMobileMq.addListener(onCapabilitiesModeChange);
            capabilityMobileTapCleanups.push(() => {
              capabilityMobileMq.removeListener(onCapabilitiesModeChange);
            });
          }

          window.addEventListener("resize", updateCapabilityBodyHeights);
          capabilityMobileTapCleanups.push(() => {
            window.removeEventListener("resize", updateCapabilityBodyHeights);
          });

          setActiveRow(null);
          applyCapabilitiesMode();
          updateCapabilityBodyHeights();
        }

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

        const roadmapCardWraps =
          gsap.utils.toArray<HTMLElement>(".roadmap-card-wrap");
        const roadmapRevealFromRight = window.matchMedia("(max-width: 900px)").matches
          ? "56px"
          : "0px";
        roadmapCardWraps.forEach((wrap) => {
          gsap.set(wrap, {
            "--reveal-x": roadmapRevealFromRight,
            "--reveal-y": "28px",
            "--reveal-alpha": 0,
            "--reveal-blur": "8px",
          });
          gsap.to(wrap, {
            "--reveal-x": "0px",
            "--reveal-y": "0px",
            "--reveal-alpha": 1,
            "--reveal-blur": "0px",
            ease: "power2.out",
            scrollTrigger: {
              trigger: wrap,
              start: "top 92%",
              end: "top 48%",
              scrub: 0.9,
            },
          });
        });

        if (roadmapCardWraps.length && window.matchMedia("(pointer: fine)").matches) {
          roadmapCardWraps.forEach((wrap) => {
            gsap.set(wrap, {
              "--tilt-x": 0,
              "--tilt-y": 0,
              "--tilt-z": 0,
              "--tilt-scale": 1,
              "--tilt-glow": 0,
            });

            const setTiltX = gsap.quickTo(wrap, "--tilt-x", {
              duration: 0.28,
              ease: "power3.out",
            });
            const setTiltY = gsap.quickTo(wrap, "--tilt-y", {
              duration: 0.28,
              ease: "power3.out",
            });
            const setTiltZ = gsap.quickTo(wrap, "--tilt-z", {
              duration: 0.32,
              ease: "power3.out",
            });
            const setScale = gsap.quickTo(wrap, "--tilt-scale", {
              duration: 0.3,
              ease: "power3.out",
            });
            const setGlow = gsap.quickTo(wrap, "--tilt-glow", {
              duration: 0.3,
              ease: "power3.out",
            });

            const onMove = (event: MouseEvent) => {
              const bounds = wrap.getBoundingClientRect();
              const nx = gsap.utils.clamp(
                0,
                1,
                (event.clientX - bounds.left) / Math.max(bounds.width, 1)
              );
              const ny = gsap.utils.clamp(
                0,
                1,
                (event.clientY - bounds.top) / Math.max(bounds.height, 1)
              );

              setTiltY((nx - 0.5) * 8);
              setTiltX((0.5 - ny) * 7);
              setTiltZ(18);
              setScale(1.01);
              setGlow(1);
            };

            const onLeave = () => {
              setTiltX(0);
              setTiltY(0);
              setTiltZ(0);
              setScale(1);
              setGlow(0);
            };

            wrap.addEventListener("mousemove", onMove);
            wrap.addEventListener("mouseleave", onLeave);
            roadmapHoverCleanups.push(() => {
              wrap.removeEventListener("mousemove", onMove);
              wrap.removeEventListener("mouseleave", onLeave);
            });
          });
        }

        const roadmapSteps = gsap.utils.toArray<HTMLElement>(".roadmap-step");
        roadmapSteps.forEach((step) => {
          gsap.set(step, { "--step-focus": 0 });
          ScrollTrigger.create({
            trigger: step,
            start: "top 80%",
            end: "bottom 20%",
            scrub: true,
            onUpdate: (self) => {
              const focus = 1 - Math.abs(self.progress * 2 - 1);
              step.style.setProperty("--step-focus", focus.toFixed(3));
            },
          });
        });

        const roadmapTrack =
          rootRef.current?.querySelector<HTMLElement>(".process-roadmap") ?? null;
        if (roadmapTrack) {
          gsap.set(roadmapTrack, { "--roadmap-progress": 0 });
          gsap.to(roadmapTrack, {
            "--roadmap-progress": 1,
            ease: "none",
            scrollTrigger: {
              trigger: roadmapTrack,
              start: "top 80%",
              end: "bottom 30%",
              scrub: 0.6,
            },
          });
        }

        const ctaInner =
          rootRef.current?.querySelector<HTMLElement>(".cta-inner") ?? null;
        if (ctaInner) {
          gsap.set(ctaInner, {
            "--cta-glow": 0,
            "--cta-sweep": -1,
            "--cta-pulse": 0,
            "--cta-hover": 0,
            "--cta-x": 50,
            "--cta-y": 50,
          });

          gsap.to(ctaInner, {
            "--cta-glow": 1,
            "--cta-sweep": 1,
            "--cta-pulse": 1,
            ease: "none",
            scrollTrigger: {
              trigger: ctaInner,
              start: "top 82%",
              end: "top 30%",
              scrub: 0.7,
            },
          });

          const ctaButtons = ctaInner.querySelectorAll<HTMLElement>(
            ".cta-actions .button"
          );
          if (ctaButtons.length) {
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

          const ctaTitle =
            ctaInner.querySelector<HTMLElement>(".cta-title") ?? null;
          if (ctaTitle) {
            gsap.set(ctaTitle, {
              "--cta-glow-x": "20%",
              "--cta-glow-y": "10%",
              "--cta-glow-alpha": 0,
            });

            ScrollTrigger.create({
              trigger: ctaInner,
              start: "top 85%",
              end: "bottom 30%",
              scrub: true,
              onUpdate: (self) => {
                const progress = self.progress;
                const pulse = 1 - Math.abs(progress * 2 - 1);
                const alpha = 0.1 + pulse * 0.9;
                const x = 18 + progress * 64;
                const y = 8 + progress * 84;
                ctaTitle.style.setProperty("--cta-glow-x", `${x.toFixed(2)}%`);
                ctaTitle.style.setProperty("--cta-glow-y", `${y.toFixed(2)}%`);
                ctaTitle.style.setProperty("--cta-glow-alpha", alpha.toFixed(3));
              },
              onLeave: () => {
                ctaTitle.style.setProperty("--cta-glow-alpha", "0");
              },
              onLeaveBack: () => {
                ctaTitle.style.setProperty("--cta-glow-alpha", "0");
              },
            });
          }

          const ctaSurface =
            ctaInner.querySelector<HTMLElement>(".cta-surface");
          if (ctaSurface && window.matchMedia("(pointer: fine)").matches) {
            gsap.set(ctaSurface, {
              "--cta-tilt-x": 0,
              "--cta-tilt-y": 0,
              "--cta-tilt-z": 0,
            });

            const setX = gsap.quickTo(ctaInner, "--cta-x", {
              duration: 0.32,
              ease: "power3.out",
            });
            const setY = gsap.quickTo(ctaInner, "--cta-y", {
              duration: 0.32,
              ease: "power3.out",
            });
            const setHover = gsap.quickTo(ctaInner, "--cta-hover", {
              duration: 0.22,
              ease: "power2.out",
            });
            const setTiltX = gsap.quickTo(ctaSurface, "--cta-tilt-x", {
              duration: 0.32,
              ease: "power3.out",
            });
            const setTiltY = gsap.quickTo(ctaSurface, "--cta-tilt-y", {
              duration: 0.32,
              ease: "power3.out",
            });
            const setTiltZ = gsap.quickTo(ctaSurface, "--cta-tilt-z", {
              duration: 0.32,
              ease: "power3.out",
            });

            const onMove = (event: MouseEvent) => {
              const bounds = ctaInner.getBoundingClientRect();
              const nx = gsap.utils.clamp(
                0,
                1,
                (event.clientX - bounds.left) / Math.max(bounds.width, 1)
              );
              const ny = gsap.utils.clamp(
                0,
                1,
                (event.clientY - bounds.top) / Math.max(bounds.height, 1)
              );

              setX(nx * 100);
              setY(ny * 100);
              setTiltY((nx - 0.5) * 7.2);
              setTiltX((0.5 - ny) * 6.6);
              setTiltZ(16);
              setHover(1);
            };

            const onLeave = () => {
              setX(50);
              setY(50);
              setTiltX(0);
              setTiltY(0);
              setTiltZ(0);
              setHover(0);
            };

            const usePointerEvents = "onpointermove" in window;
            const moveEvent = usePointerEvents ? "pointermove" : "mousemove";
            const leaveEvent = usePointerEvents ? "pointerleave" : "mouseleave";
            ctaInner.addEventListener(moveEvent, onMove);
            ctaInner.addEventListener(leaveEvent, onLeave);
            ctaHoverCleanup = () => {
              ctaInner.removeEventListener(moveEvent, onMove);
              ctaInner.removeEventListener(leaveEvent, onLeave);
            };
          }
        }

        const teamCards = gsap.utils.toArray<HTMLElement>(".team-card");
        if (teamCards.length && window.matchMedia("(pointer: fine)").matches) {
          teamCards.forEach((card) => {
            gsap.set(card, {
              transformPerspective: 1200,
              transformOrigin: "50% 52%",
              "--team-mx": 50,
              "--team-my": 50,
              "--team-tilt-x": 0,
              "--team-tilt-y": 0,
            });

            const setTiltX = gsap.quickTo(card, "--team-tilt-x", {
              duration: 0.28,
              ease: "power3.out",
            });
            const setTiltY = gsap.quickTo(card, "--team-tilt-y", {
              duration: 0.28,
              ease: "power3.out",
            });
            const setMx = gsap.quickTo(card, "--team-mx", {
              duration: 0.22,
              ease: "power2.out",
            });
            const setMy = gsap.quickTo(card, "--team-my", {
              duration: 0.22,
              ease: "power2.out",
            });

            const onMove = (event: MouseEvent) => {
              const bounds = card.getBoundingClientRect();
              const nx = gsap.utils.clamp(
                0,
                1,
                (event.clientX - bounds.left) / Math.max(bounds.width, 1)
              );
              const ny = gsap.utils.clamp(
                0,
                1,
                (event.clientY - bounds.top) / Math.max(bounds.height, 1)
              );

              setMx(nx * 100);
              setMy(ny * 100);
              setTiltY((nx - 0.5) * 8.5);
              setTiltX((0.5 - ny) * 7.2);
            };

            const onLeave = () => {
              setTiltX(0);
              setTiltY(0);
              setMx(50);
              setMy(50);
            };

            card.addEventListener("mousemove", onMove);
            card.addEventListener("mouseleave", onLeave);
            teamHoverCleanups.push(() => {
              card.removeEventListener("mousemove", onMove);
              card.removeEventListener("mouseleave", onLeave);
            });
          });
        }

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

        const footerColumns =
          gsap.utils.toArray<HTMLElement>(".footer [data-footer-reveal]");
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
          Math.max(0, railTrack.scrollWidth - window.innerWidth + 120);
        const getRailStart = () => {
          if (window.innerWidth <= 610) {
            return "top 18%";
          }
          if (window.innerWidth <= 987) {
            return "top 15%";
          }
          if (window.innerWidth <= 1280) {
            return "top 12%";
          }
          return "top 10%";
        };
        const railSpeed = 0.6;

        const railTween = gsap.to(railTrack, {
          x: () => -getScrollDistance(),
          ease: "none",
            scrollTrigger: {
              trigger: ".rail-section",
            start: () => getRailStart(),
            end: () => `+=${getScrollDistance() * railSpeed}`,
            scrub: 0.5,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        {
          const railCards = gsap.utils.toArray<HTMLElement>(".rail-card");
          railCards.forEach((card, index) => {
            gsap.set(card, {
              transformPerspective: 1000,
              transformOrigin: "50% 50%",
            });

            gsap.to(card, {
              keyframes: [
                {
                  scale: 0.92,
                  rotateY: index % 2 === 0 ? -6 : 6,
                  "--rail-focus": 0.28,
                  duration: 0.28,
                  ease: "power2.out",
                },
                {
                  scale: 1,
                  rotateY: 0,
                  "--rail-focus": 1,
                  duration: 0.44,
                  ease: "power2.inOut",
                },
                {
                  scale: 0.92,
                  rotateY: index % 2 === 0 ? 6 : -6,
                  "--rail-focus": 0.28,
                  duration: 0.28,
                  ease: "power2.in",
                },
              ],
              scrollTrigger: {
                trigger: card,
                containerAnimation: railTween,
                start: "left 90%",
                end: "right 10%",
                scrub: 0.65,
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
      capabilityMobileTapCleanups.forEach((cleanup) => cleanup());
      capabilityMobileTapCleanups = [];
      teamHoverCleanups.forEach((cleanup) => cleanup());
      teamHoverCleanups = [];
      roadmapHoverCleanups.forEach((cleanup) => cleanup());
      roadmapHoverCleanups = [];
      if (ctaHoverCleanup) {
        ctaHoverCleanup();
        ctaHoverCleanup = null;
      }
      if (updateFilmStrip) {
        window.removeEventListener("resize", updateFilmStrip);
      }
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

      <a className="hud-contact-button magnetic" href="#contact">
        <span className="hud-contact-button-dot" aria-hidden="true" />
        Entre em contato
      </a>

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
                    </span>{" "}
                    <span className="hero-main-word hero-disintegrate-word" data-hero-main-word>
                      <span className="hero-text-core">PARA</span>
                      <span className="hero-text-fragments" aria-hidden="true">
                        PARA
                      </span>
                    </span>
                  </span>
                  <span className="hero-line hero-line--main">
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
          <div className="marquee-reel">
            <div className="marquee-track">
              {Array.from({ length: 24 }).map((_, index) => (
                <span className="film-frame" key={`film-frame-${index}`} aria-hidden="true" />
              ))}
            </div>
          </div>
        </div>

        <section className="section section--cinematic" id="capabilities">
          <div className="capabilities-bg" aria-hidden="true" />
          <div className="section-head section-head--split">
            <h2
              className="section-title--hero-font section-title-cinematic section-head-title"
              data-title-fx
            >
              <span className="title-line">
                AUDIOVISUAL ESTRAT&Eacute;GICO
              </span>
              <span className="title-line">
                QUE POSICIONA MARCAS.
              </span>
            </h2>
            <p className="section-lead section-lead--aux" data-reveal="right">
              Iniciativa, visão e evolução constante para transformar imagem em
              posicionamento e resultado.
            </p>
          </div>
          <div className="capabilities-stack">
            {capabilities.map((card, index) => (
              <article
                className="capability-row"
                key={card.title}
                data-card-id={card.label}
                style={{ "--stack-index": index } as CSSProperties}
              >
                <div className="capability-title">
                  <h3>{card.title}</h3>
                </div>
                <div className="capability-body">
                  <p>{card.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rail-section section--cinematic" id="work">
          <div className="rail-head">
            <div>
              <h2 className="rail-title section-title-cinematic section-title-cinematic--work" data-title-fx>
                <span className="title-line">N&atilde;o &eacute; s&oacute; v&iacute;deo.</span>
                <span className="title-line">
                  &Eacute;&nbsp;<em>POSICIONAMENTO</em>
                </span>
                <span className="title-line">
                  <span className="title-line-lock">
                    EM{" "}
                    <span className="title-glitch" data-text="MOVIMENTO">
                      MOVIMENTO
                    </span>
                  </span>
                </span>
              </h2>
            </div>
          </div>
          <div className="rail-track" ref={railRef}>
            {projects.map((project) => (
              <article className="rail-card" key={project.title}>
                <div className="rail-image" aria-hidden="true" />
                <div className="rail-body">
                  <div className="rail-top">
                    <span>{project.tag}</span>
                    <span>RMA FILMS</span>
                  </div>
                  <h3>{project.title}</h3>
                  <p>{project.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section section--cinematic" id="process">
          <div className="section-head section-head--split">
            <h2
              className="section-title--hero-font section-title-cinematic section-head-title"
              data-title-fx
            >
              <span className="title-line">
                ESTRAT&Eacute;GIA, EXECU&Ccedil;&Atilde;O
              </span>
              <span className="title-line">
                E RESULTADO.
              </span>
            </h2>
            <p className="section-lead section-lead--side" data-reveal="right">
              Método direto, criativo e consistente para transformar briefing em
              conteúdo que gera percepção de valor.
            </p>
          </div>
          <div className="process-roadmap">
            {process.map((step, index) => (
              <div
                className={`roadmap-step ${index % 2 === 0 ? "is-left" : "is-right"}`}
                key={step.step}
                style={{ "--roadmap-index": index } as CSSProperties}
              >
                <div className="roadmap-card-wrap">
                  <article className="process-card roadmap-card" data-step={step.step}>
                    <span className="roadmap-kicker">
                      ETAPA
                      <span className="roadmap-kicker-step" aria-hidden="true">
                        {index + 1}
                      </span>
                    </span>
                    <h3>{step.title}</h3>
                    <p>{step.copy}</p>
                  </article>
                </div>
                <div className="roadmap-node" aria-hidden="true" />
              </div>
            ))}
          </div>
        </section>

        <section className="section section--cinematic" id="team">
          <div className="section-flare section-flare--team" aria-hidden="true" />
          <div className="section-head">
            <h2
              className="section-title--hero-font section-title-cinematic section-title-cinematic--work"
              data-title-fx
            >
              <span className="title-line">
                PESSOAS POR TR&Aacute;S
              </span>
              <span className="title-line">
                DA{" "}
                <em>
                  <span className="title-glitch" data-text="DIRE&Ccedil;&Atilde;O">
                    DIRE&Ccedil;&Atilde;O
                  </span>
                </em>
                .
              </span>
            </h2>
            <p className="section-lead" data-reveal="right">
              Uma equipe de alto n&iacute;vel que une dire&ccedil;&atilde;o, execu&ccedil;&atilde;o
              precisa e resultado de marca.
            </p>
          </div>
          <div className="team-grid" data-stagger>
            {teamMembers.map((member) => (
              <article className="team-card" key={member.name} data-stagger-item>
                <div
                  className="team-photo"
                  role="img"
                  aria-label={member.name}
                  data-has-photo={member.photo ? "true" : "false"}
                >
                  {member.photo ? (
                    <Image
                      src={member.photo}
                      alt={member.name}
                      fill
                      sizes="(max-width: 610px) 90vw, (max-width: 987px) 48vw, 25vw"
                    />
                  ) : null}
                  <span aria-hidden="true">{member.initials}</span>
                  <div className="team-meta">
                    <p className="team-role">{member.role}</p>
                    <h3>{member.name}</h3>
                    <p className="team-bio">{member.bio}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="cta section--cinematic" id="contact">
          <div className="cta-inner" data-reveal="up">
            <div className="cta-effects" aria-hidden="true" />
            <div className="cta-surface">
              <div className="cta-copy">
                <h2
                  className="section-title--hero-font section-title-cinematic section-title-cinematic--cta cta-title"
                  data-title-fx
                >
                  <span className="title-line">
                    <span className="cta-title-core">SUA IDEIA EM IMAGEM</span>
                    <span className="cta-title-glow" aria-hidden="true">
                      SUA IDEIA EM IMAGEM
                    </span>
                  </span>
                  <span className="title-line">
                    <span className="cta-title-core">QUE GERA AUTORIDADE.</span>
                    <span className="cta-title-glow" aria-hidden="true">
                      QUE GERA AUTORIDADE.
                    </span>
                  </span>
                </h2>
                <p>
                  Envie seu briefing e receba uma direção criativa com proposta de
                  execução, formato ideal e próximos passos para seu projeto.
                </p>
              </div>
              <div className="cta-actions">
                <a className="button magnetic" href="mailto:contato@rmafilms.com.br">
                  contato@rmafilms.com.br
                </a>
                <a className="button button--ghost magnetic" href="#top">
                  Voltar ao topo
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="footer">
        <div className="footer-links" data-footer-reveal>
          {footerLinkColumns.map((column) => (
            <div className="footer-menu" key={column.title}>
              <span className="footer-menu-title">
                {"// "}
                {column.title}
              </span>
              <ul>
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    <a className="footer-menu-link" href={link.href}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-divider" aria-hidden="true" data-footer-reveal />

        <div className="footer-bottom" data-footer-reveal>
          <span>
            &copy;{new Date().getFullYear()} RMA Films. Todos os direitos reservados.
          </span>
          <div className="footer-bottom-links">
            {footerLegalLinks.map((item) => (
              <a key={item.label} href={item.href}>
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
