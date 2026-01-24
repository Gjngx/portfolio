
const script = () => {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.defaults({
        invalidateOnRefresh: true
    });

    const cvUnit = (val, unit) => {
        let result;
        switch (true) {
            case unit === 'vw':
                result = window.innerWidth * (val / 100);
                break;
            case unit === 'vh':
                result = window.innerHeight * (val / 100);
                break;
            case unit === 'rem':
                result = val / 10 * parseFloat($('html').css('font-size'));
                break;
            default: break;
        }
        return result;
    }
    const viewport = {
        get w() {
            return window.innerWidth;
        },
        get h() {
            return window.innerHeight;
        },
    }
    const device = { desktop: 991, tablet: 767, mobile: 479 }

    const debounce = (func, timeout = 300) => {
        let timer

        return (...args) => {
            clearTimeout(timer)
            timer = setTimeout(() => { func.apply(this, args) }, timeout)
        }
    }
    const isInViewport = (el, orientation = 'vertical') => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (orientation == 'horizontal') {
            return (
                rect.left <= (window.innerWidth) &&
                rect.right >= 0
            );
        } else {
            return (
                rect.top <= (window.innerHeight) &&
                rect.bottom >= 0
            );
        }
    }
    const refreshOnBreakpoint = () => {
        const breakpoints = Object.values(device).sort((a, b) => a - b);
        const initialViewportWidth = window.innerWidth || document.documentElement.clientWidth;
        const breakpoint = breakpoints.find(bp => initialViewportWidth < bp) || breakpoints[breakpoints.length - 1];
        window.addEventListener('resize', debounce(function () {
            const newViewportWidth = window.innerWidth || document.documentElement.clientWidth;
            if ((initialViewportWidth < breakpoint && newViewportWidth >= breakpoint) ||
                (initialViewportWidth >= breakpoint && newViewportWidth < breakpoint)) {
                location.reload();
            }
        }));
    }
    const documentHeightObserver = (() => {
        let previousHeight = document.documentElement.scrollHeight;
        let resizeObserver;
        let debounceTimer;

        function refreshScrollTrigger() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const currentHeight = document.documentElement.scrollHeight;

                if (currentHeight !== previousHeight) {
                    console.log("Document height changed. Refreshing ScrollTrigger...");
                    ScrollTrigger.refresh();
                    previousHeight = currentHeight;
                }
            }, 200); // Adjust the debounce delay as needed
        }

        return (action) => {
            if (action === "init") {
                console.log("Initializing document height observer...");
                resizeObserver = new ResizeObserver(refreshScrollTrigger);
                resizeObserver.observe(document.documentElement);
            }
            else if (action === "disconnect") {
                console.log("Disconnecting document height observer...");
                if (resizeObserver) {
                    resizeObserver.disconnect();
                }
            }
        };
    })();
    const getAllScrollTrigger = (fn) => {
        let triggers = ScrollTrigger.getAll();
        triggers.forEach(trigger => {
            if (fn === "refresh") {
                if (trigger.progress === 0) {
                    trigger[fn]?.();
                }
            } else {
                trigger[fn]?.();
            }
        });
    };
    function resetScroll() {
        if (window.location.hash !== '') {
            if ($(window.location.hash).length >= 1) {
                $("html").animate({ scrollTop: $(window.location.hash).offset().top - 100 }, 1200);

                setTimeout(() => {
                    $("html").animate({ scrollTop: $(window.location.hash).offset().top - 100 }, 1200);
                }, 300);
            } else {
                scrollTop()
            }
        } else if (window.location.search !== '') {
            let searchObj = JSON.parse('{"' + decodeURI(location.search.substring(1)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}')
            if (searchObj.sc) {
                if ($(`#${searchObj.sc}`).length >= 1) {
                    let target = `#${searchObj.sc}`;
                    setTimeout(() => {
                        smoothScroll.scrollTo(`#${searchObj.sc}`, {
                            offset: -100
                        })
                    }, 500);
                } else {
                    scrollTop()
                }
            }
        } else {
            scrollTop()
        }
    };
    function scrollTop(onComplete) {
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);
        smoothScroll.scrollToTop({
            onComplete: () => {
                onComplete?.();
                getAllScrollTrigger("refresh");
            }
        });
    }
    class ParallaxImage {
        constructor({ el, scaleOffset = 0.1 }) {
            this.el = el;
            this.elWrap = null;
            this.scaleOffset = scaleOffset;
            this.init();
        }
        init() {
            this.elWrap = this.el.parentElement;
            this.setup();
        }
        setup() {
            const scalePercent = 100 + 5 + ((this.scaleOffset - 0.1) * 100);
            gsap.set(this.el, {
                width: scalePercent + '%',
                height: $(this.el).hasClass('img-fill') ? scalePercent + '%' : 'auto'
            });
            this.scrub();
        }
        scrub() {
            let dist = this.el.offsetHeight - this.elWrap.offsetHeight;
            let total = this.elWrap.getBoundingClientRect().height + window.innerHeight;
            this.updateOnScroll(dist, total);
            smoothScroll.lenis.on('scroll', () => {
                this.updateOnScroll(dist, total);
            });
        }
        updateOnScroll(dist, total) {
            if (this.el) {
                if (isInViewport(this.elWrap)) {
                    let percent = this.elWrap.getBoundingClientRect().top / total;
                    gsap.quickSetter(this.el, 'y', 'px')(-dist * percent * 1.2);
                    gsap.set(this.el, { scale: 1 + (percent * this.scaleOffset) });
                }
            }
        }
    }
    class SmoothScroll {
        constructor() {
            this.lenis = null;
            this.scroller = {
                scrollX: window.scrollX,
                scrollY: window.scrollY,
                velocity: 0,
                direction: 0,
            };
            this.lastScroller = {
                scrollX: window.scrollX,
                scrollY: window.scrollY,
                velocity: 0,
                direction: 0,
            };
        }

        init() {
            this.reInit();

            // Initialize jQuery easing if not exists
            if (typeof $ !== 'undefined' && $) {
                if (!$.easing) {
                    $.easing = {};
                }
                $.easing.lenisEase = function (t) {
                    return Math.min(1, 1.001 - Math.pow(2, -10 * t));
                };
            }

            gsap.ticker.add((time) => {
                if (this.lenis) {
                    this.lenis.raf(time * 1000);
                }
            });
            gsap.ticker.lagSmoothing(0);
        }

        reInit() {
            if (this.lenis) {
                this.lenis.destroy();
            }
            this.lenis = new Lenis();
            this.lenis.on("scroll", (e) => {
                this.updateOnScroll(e);
                ScrollTrigger.update();
            });
        }
        reachedThreshold(threshold) {
            if (!threshold) return false;
            const dist = distance(
                this.scroller.scrollX,
                this.scroller.scrollY,
                this.lastScroller.scrollX,
                this.lastScroller.scrollY
            );

            if (dist > threshold) {
                this.lastScroller = { ...this.scroller };
                return true;
            }
            return false;
        }

        updateOnScroll(e) {
            this.scroller.scrollX = e.scroll;
            this.scroller.scrollY = e.scroll;
            this.scroller.velocity = e.velocity;
            this.scroller.direction = e.direction;
            if (header) {
                header.updateOnScroll(this.lenis);
            }
        }

        start() {
            if (this.lenis) {
                this.lenis.start();
            }
            $(".body").css("overflow", "initial");
        }

        stop() {
            if (this.lenis) {
                this.lenis.stop();
            }
            $(".body").css("overflow", "hidden");
        }

        scrollTo(target, options = {}) {
            if (this.lenis) {
                this.lenis.scrollTo(target, options);
            }
        }

        scrollToTop(options = {}) {
            if (this.lenis) {
                this.lenis.scrollTo("top", { duration: .0001, immediate: true, lock: true, ...options });
            }
        }

        destroy() {
            if (this.lenis) {
                gsap.ticker.remove((time) => {
                    this.lenis.raf(time * 1000);
                });
                this.lenis.destroy();
                this.lenis = null;
            }
        }
    }
    const smoothScroll = new SmoothScroll();
    smoothScroll.init();

    class TriggerSetup extends HTMLElement {
        constructor() {
            super();
            this.tlTrigger = null;
            this.onTrigger = () => { };
        }
        connectedCallback() {
            this.tlTrigger = gsap.timeline({
                scrollTrigger: {
                    trigger: $(this).find('section'),
                    start: 'top bottom+=50%',
                    end: 'bottom top-=50%',
                    once: true,
                    onEnter: () => {
                        this.onTrigger?.();
                    }
                }
            });
        }
        destroy() {
            if (this.tlTrigger) {
                this.tlTrigger.kill();
                this.tlTrigger = null;
            }
        }
    }

    class Header {
        constructor() {
            this.el = null;
            this.isOpen = false;
        }
        init(data) {
            this.el = document.querySelector('.header');
            if (viewport.w <= 991) {
                this.toggleNav();
            }
        }
        updateOnScroll(inst) {
            this.toggleHide(inst);
            this.toggleScroll(inst);
        }
        toggleScroll(inst) {
            if (inst.scroll > cvUnit(44, 'rem')) $(this.el).addClass("on-scroll");
            else $(this.el).removeClass("on-scroll");
        }
        toggleHide(inst) {
            if (inst.direction == 1) {
                if (inst.scroll > ($(this.el).height() * 3)) {
                    $(this.el).addClass('on-hide');
                }
            } else if (inst.direction == -1) {
                if (inst.scroll > ($(this.el).height() * 3)) {
                    $(this.el).addClass("on-hide");
                    $(this.el).removeClass("on-hide");
                }
            }
            else {
                $(this.el).removeClass("on-hide");
            }
        }
        toggleNav() {
            $(this.el).find('.header-toggle').on('click', this.handleClick.bind(this));
            $(window).on('click', (e) => {
                if (!$(e.target).closest('.header-toggle').length) {
                    this.close();
                }
            });
        }
        handleClick(e) {
            e.preventDefault();
            this.isOpen ? this.close() : this.open();
        }
        open() {
            if (this.isOpen) return;
            const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
            if (scrollbarW > 0) document.body.style.paddingRight = scrollbarW + 'px';
            $(this.el).addClass('on-open-nav');
            $(this.el).find('.header-toggle').addClass('active');
            const $mobileMenu = $(this.el).find('.header-act-mobile');
            $mobileMenu.stop(true, true).addClass('active');
            this.isOpen = true;
            smoothScroll.lenis.stop();
        }
        close() {
            if (!this.isOpen) return;
            this.isOpen = false;
            const $mobileMenu = $(this.el).find('.header-act-mobile');
            $mobileMenu.removeClass('active');
            $(this.el).find('.header-toggle').removeClass('active');
            const duration = 400;
            setTimeout(() => {
                if (!$mobileMenu.hasClass('active')) {
                    document.documentElement.style.overflow = '';
                    document.body.style.overflow = '';
                    document.body.style.paddingRight = '';
                    $(this.el).removeClass('on-open-nav');
                    smoothScroll.lenis.start();
                }
            }, duration);
        }
    }
    const header = new Header();
    header.init();

    class Marquee {
        constructor(list, duration = 40) {
            this.list = list;
            this.duration = duration;
        }
        setup(isReverse) {
            const cloneAmount = Math.ceil($(window).width() / this.list.width()) + 1;

            let itemClone = this.list.find('[data-marquee="item"]').clone();
            let itemWidth = this.list.find('[data-marquee="item"]').width();
            this.list.html('');
            new Array(cloneAmount).fill().forEach(() => {
                let html = itemClone.clone()
                html.css('animation-duration', `${Math.ceil(itemWidth / this.duration)}s`);
                if (isReverse) {
                    html.css('animation-direction', 'reverse');
                }
                html.addClass('anim-marquee');
                this.list.append(html);
            });
        }
    }

    function initGlobalHoverMask(options = {}) {
        const el = document.querySelector('.page-mask-layer');
        if (!el) return;

        const {
            minWidth = 992,
            followSpeed = 0.12,
            hideOffset = -100,
        } = options;

        const mm = gsap.matchMedia();

        mm.add(`(min-width: ${minWidth}px)`, () => {
            let mouse = { x: hideOffset, y: hideOffset };
            let pos = { x: hideOffset, y: hideOffset };
            let isActivated = false;

            const update = () => {
                pos.x += (mouse.x - pos.x) * followSpeed;
                pos.y += (mouse.y - pos.y) * followSpeed;

                el.style.setProperty('--mouse-x', `${pos.x}px`);
                el.style.setProperty('--mouse-y', `${pos.y}px`);
            };

            const onMove = (e) => {
                mouse.x = e.clientX;
                mouse.y = e.clientY;

                /* First mouse move → fade in */
                if (!isActivated) {
                    isActivated = true;
                    gsap.to(el, {
                        opacity: 1,
                        duration: 0.4,
                        ease: 'power2.out',
                    });
                }
            };

            const onLeave = () => {
                mouse.x = hideOffset;
                mouse.y = hideOffset;
            };

            gsap.ticker.add(update);
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseleave', onLeave);

            /* Cleanup */
            return () => {
                gsap.ticker.remove(update);
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseleave', onLeave);
            };
        });
    }

    initGlobalHoverMask();
    const PortfolioPage = {
        'portfolio-hero': class extends TriggerSetup {
            constructor() {
                super();
                this.onTrigger = () => {
                    this.setup();
                    this.animationReveal();
                    this.interact();
                };
            }
            setup() {
                new Marquee($(this).find('.pfolio-hero-marquee-inner'), 30).setup();
                if (viewport.w <= 767) {
                    $(this).find('.pfolio-hero-tech-stack-list').addClass('embla__viewport');
                    $(this).find('.pfolio-hero-tech-stack-wrap').addClass('embla__container');
                    $(this).find('.pfolio-hero-tech-stack-item').addClass('embla__slide');
                }
            }
            animationReveal() {
                this.tl = gsap.timeline({
                    delay: .5,
                    onStart: () => {
                        this.querySelectorAll('[data-init-hidden]').forEach((el) => { el.removeAttribute('data-init-hidden') });
                    },
                })
                new MasterTimeline({
                    triggerInit: this,
                    timeline: this.tl,
                    tweenArr: [
                        new FadeIn({ el: this.querySelector('.pfolio-hero-tag'), allowMobile: true }),
                        new RevealText({ el: this.querySelector('.pfolio-hero-title'), color: 'white', allowMobile: true, isHighlight: true, }),
                        new ScaleInset({ el: this.querySelector('.pfolio-hero-thumb-image'), allowMobile: true }),
                        new RevealText({ el: this.querySelector('.pfolio-hero-description .txt'), color: '#94a3b8', allowMobile: true }),
                        new RevealText({ el: this.querySelector('.pfolio-hero-tech-stack-label .txt'), color: '#cbd5e1', allowMobile: true }),
                        ...Array.from(this.querySelectorAll('.pfolio-hero-tech-stack-item')).map(el => {
                            return new FadeIn({ el, allowMobile: true })
                        }),
                        new FadeIn({ el: this.querySelector('.pfolio-hero-tech-stack-dots'), allowMobile: true }),
                        ...Array.from(this.querySelectorAll('.pfolio-hero-action .btn')).map(el => {
                            return new FadeIn({ el, allowMobile: true })
                        }),
                        new RevealText({ el: this.querySelector('.pfolio-hero-marquee-label .txt'), color: '#cbd5e1', allowMobile: true }),
                        ...Array.from(this.querySelectorAll('.pfolio-hero-marquee-item')).map(el => {
                            return new FadeIn({ el, allowMobile: true })
                        }),
                        new FadeIn({ el: this.querySelector('.pfolio-hero-scroll-down'), allowMobile: false })
                    ]
                })
            }
            interact() {
                if (viewport.w <= 767) {
                    this.initSlider();
                }
            }
            initSlider() {
                const slidesInner = $(this).find('.pfolio-hero-tech-stack-list').get(0);
                const dotsNode = $(this).find('.pfolio-hero-tech-stack-dots').get(0);
                const dotNodeTemplate = $(this).find('.pfolio-hero-tech-stack-dot').get(0);
                const autoplay = EmblaCarouselAutoplay({
                    delay: 3000,
                    stopOnInteraction: false,
                    stopOnMouseEnter: true
                });
                this.emblaApi = EmblaCarousel(slidesInner, {
                    align: 'start',
                    containScroll: 'trimSnaps',
                    loop: true
                }, [autoplay]);
                if (dotsNode && dotNodeTemplate) {
                    this.dotButtons = new DotButtons(this.emblaApi, dotsNode, dotNodeTemplate);
                }
            }
            destroy() {
                super.destroy();
            }
        },
        'portfolio-about': class extends TriggerSetup {
            constructor() {
                super();
                this.onTrigger = () => {
                    this.setup();
                    this.animationReveal();
                    this.interact();
                };
            }
            setup() {
                if (viewport.w <= 767) {
                    $(this).find('.pfolio-about-skills-list').addClass('embla__viewport');
                    $(this).find('.pfolio-about-skills-list-wrap').addClass('embla__container');
                    $(this).find('.pfolio-about-skills-item').addClass('embla__slide');
                }
            }
            animationReveal() {
                const descriptionTimeline = new MasterTimeline({
                    allowMobile: true,
                    tweenArr: Array.from(
                        this.querySelectorAll('.pfolio-about-content-description .txt')
                    ).map(el => {
                        return new RevealText({
                            el,
                            color: '#94a3b8',
                            allowMobile: true
                        });
                    })
                });
                new MasterTimeline({
                    triggerInit: this,
                    scrollTrigger: { trigger: $(this).find('.pfolio-about') },
                    allowMobile: true,
                    tweenArr: [
                        new RevealText({ el: this.querySelector('.pfolio-about-lable .txt'), color: '#137fec', allowMobile: true, isHighlight: true, }),
                        new RevealText({ el: this.querySelector('.pfolio-about-title .heading'), color: 'white', allowMobile: true }),
                        new ScaleInset({ el: this.querySelector('.pfolio-about-thumb-image'), allowMobile: true }),
                        new RevealText({ el: this.querySelector('.pfolio-about-content-title .heading'), color: 'white', allowMobile: true }),
                        descriptionTimeline,
                        new FadeIn({ el: this.querySelector('.separator-line-w'), allowMobile: true }),
                        ...Array.from(this.querySelectorAll('.pfolio-about-content-item')).map(el => {
                            return new FadeIn({ el, allowMobile: true })
                        }),
                        new RevealText({ el: this.querySelector('.pfolio-about-skills-lable .txt'), color: '#137fec', allowMobile: true, isHighlight: true, }),
                        new RevealText({ el: this.querySelector('.pfolio-about-skills-title .heading'), color: 'white', allowMobile: true }),
                        ...Array.from(this.querySelectorAll('.pfolio-about-skills-item')).map(el => {
                            return new FadeIn({ el, allowMobile: true })
                        }),
                    ]
                })
            }
            interact() {
                if (viewport.w <= 767) {
                    this.initSlider();
                }
            }
            initSlider() {
                const slidesInner = $(this).find('.pfolio-about-skills-list').get(0);
                const dotsNode = $(this).find('.pfolio-about-skills-dots').get(0);
                const dotNodeTemplate = $(this).find('.pfolio-about-skills-dot').get(0);
                this.emblaApi = EmblaCarousel(slidesInner);
                if (dotsNode && dotNodeTemplate) {
                    this.dotButtons = new DotButtons(this.emblaApi, dotsNode, dotNodeTemplate);
                }
            }
            destroy() {
                super.destroy();
            }
        },
        'portfolio-expertise': class extends TriggerSetup {
            constructor() {
                super();
                this.onTrigger = () => {
                    this.setup();
                    this.animationReveal();
                    this.interact();
                };
            }
            setup() {
                if (viewport.w <= 767) {
                    // $(this).find('.pfolio-about-skills-list').addClass('embla__viewport');
                    // $(this).find('.pfolio-about-skills-list-wrap').addClass('embla__container');
                    // $(this).find('.pfolio-about-skills-item').addClass('embla__slide');
                }
            }
            animationReveal() {

                new MasterTimeline({
                    triggerInit: this,
                    scrollTrigger: { trigger: $(this).find('.pfolio-expertise') },
                    allowMobile: true,
                    tweenArr: [

                    ]
                })
            }
            interact() {
                if (viewport.w <= 767) {
                    // this.initSlider();
                }else{
                    this.animateLine();
                }
            }
            initSlider() {
                // const slidesInner = $(this).find('.pfolio-about-skills-list').get(0);
                // const dotsNode = $(this).find('.pfolio-about-skills-dots').get(0);
                // const dotNodeTemplate = $(this).find('.pfolio-about-skills-dot').get(0);
                // this.emblaApi = EmblaCarousel(slidesInner);
                // if (dotsNode && dotNodeTemplate) {
                //     this.dotButtons = new DotButtons(this.emblaApi, dotsNode, dotNodeTemplate);
                // }
            }
            animateLine() {
                const $wrap = $(this);
                const line = $wrap.find('.pfolio-expertise-line').get(0);
                const lineScale = $wrap.find('.pfolio-expertise-line-scale').get(0);
                const lineBox = $wrap.find('.pfolio-expertise-line-item').get(0);
                const items = $wrap.find('.pfolio-expertise-main-item');

                if (!line || !lineScale || !lineBox || !items.length) return;
            
                const steps = items.length;
                const lineHeight = line.offsetHeight;
                const boxHeight = lineBox.offsetHeight;
                const maxY = lineHeight - boxHeight ;
                const maxScaleY = maxY / lineHeight;
            
                gsap.timeline({
                    scrollTrigger: {
                        trigger: line,
                        start: 'top 80%',
                        end: 'bottom 20%',
                        scrub: true,
                        onUpdate: self => {
                            const progress = self.progress;
                            const boxY = progress * maxY;
                        
                            let activeIndex = -1;
                        
                            items.each((i, el) => {
                                const itemTop =
                                    el.getBoundingClientRect().top -
                                    line.getBoundingClientRect().top;
                        
                                if (boxY >= itemTop) {
                                    activeIndex = i;
                                }
                            });
                        
                            // Update step number
                            const step = Math.min(steps, activeIndex + 1);
                        
                            if (step > 0) {
                                $wrap
                                    .find('.pfolio-expertise-line-title .txt')
                                    .text(String(step).padStart(2, '0'));
                            }

                            items.each((i, el) => {
                                if (i === activeIndex) {
                                    $(el).addClass('is-active');
                                } else {
                                    $(el).removeClass('is-active');
                                }
                            });
                        }
                    }
                })
                .fromTo(
                    lineScale,
                    { scaleY: 0 },
                    { scaleY: maxScaleY, ease: 'none' },
                    0
                )
                .fromTo(
                    lineBox,
                    { y: 0 },
                    { y: maxY, ease: 'none' },
                    0
                );
            }
            destroy() {
                super.destroy();
            }
        },
    }
    class PageManager {
        constructor(page) {
            if (!page || typeof page !== 'object') {
                throw new Error('Invalid page configuration');
            }
            // Store registered component names to prevent duplicate registration
            this.registeredComponents = new Set();

            this.sections = Object.entries(page).map(([name, Component]) => {
                if (typeof Component !== 'function') {
                    throw new Error(`Section "${name}" must be a class constructor`);
                }

                // Only register the custom element if not already registered
                if (!this.registeredComponents.has(name)) {
                    try {
                        customElements.define(name, Component);
                        this.registeredComponents.add(name);
                    } catch (error) {
                        // Handle case where element is already defined
                        console.warn(`Custom element "${name}" is already registered`);
                    }
                }

                return new Component();
            });
        }

        // Method to cleanup sections if needed
        destroy() {
            this.sections.forEach(section => {
                if (typeof section.destroy === 'function') {
                    section.destroy();
                }
            });
        }
    }
    const pageName = $('.main-inner').attr('data-namespace');
    const pageConfig = {
        portfolio: PortfolioPage
    };
    const registry = {};
    registry[pageName]?.destroy();

    documentHeightObserver("init");
    refreshOnBreakpoint();
    scrollTop(() => pageConfig[pageName] && (registry[pageName] = new PageManager(pageConfig[pageName])));
}
window.onload = script