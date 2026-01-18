const getScreenType = () => {
  const width = window.innerWidth;
  let type = width > 1025 ? 'dsk' : window.innerWidth > 767 ? 'tb' : 'mb';
  let size = width;
  const isMobile = width <= 767;
  const isTablet = width > 767 && width <= 1025;
  const isDesktop = width > 1025;
  return { type, size, isMobile, isDesktop, isTablet };
}

const parseRem = (input) => {
  return (input / 10) * parseFloat(getComputedStyle(document.querySelector('html')).fontSize)
}

class TextSplit {
  constructor({ el, type }) {
      replaceHyphen(el);
      this.DOM = { el: el, splitType: new SplitType(el, { types: type || 'lines' }) };
      this.init()
  }
  async loadedFont() {
      document.fonts.ready.then((fontFaceSet) => {
          this.DOM.splitType = new SplitType(this.DOM.el, { types: 'lines' });
          console.log('reInit');
          this.DOM.splitType.lines?.length && gsap.set(this.DOM.splitType.lines, { yPercent: 110 });
      })
  }

  init() {
      this.DOM.el.classList.add('text__mask');
      this.DOM.splitType.lines &&
          this.DOM.splitType.lines.forEach((line) => {
              const div = document.createElement('div');
              div.appendChild(line);
              div.classList.add('line__mask');
              this.DOM.el.appendChild(div);
          });
  }
}

class MasterTimeline {

  constructor({ triggerInit, timeline, tweenArr, stagger = .1, scrollTrigger }) {
      this.timeline = timeline;
      this.triggerInit = triggerInit;
      this.scrollTrigger = scrollTrigger;
      this.tweenArr = tweenArr;
      this.stagger = stagger;
      this.setup();
  }
  setup() {
      gsap.timeline({
          scrollTrigger: {
              trigger: this.triggerInit,
              start: 'top bottom+=100vh',
              end: 'bottom top',
              once: true,
              scrub: false,
              onEnter: () => {
                  this.tweenArr.forEach((item) => item.init?.())
              }
          }
      });
      if (!this.timeline) {
          this.timeline = gsap.timeline({
              scrollTrigger: {
                  start: 'top top+=90%',
                  end: '+=100%',
                  scrub: false,
                  once: true,
                  ...this.scrollTrigger
              }
          })
      };
      this.tweenArr.forEach((item) => this.timeline.add(item.animation, item.delay || `<=${this.stagger}` || "<=.1"));
  }
}

class RevealText {
  constructor({ el, color, delay, isDisableRevert, isHighlight = false, isFast = false, allowMobile, ...props }) {
      this.DOM = { el: el };
      this.color = color;
      this.textSplit = [];
      this.delay = delay;
      this.allowMobile = getScreenType().isMobile ? allowMobile : true;
      this.textSplit = this.allowMobile && (new SplitType(this.DOM.el, { types: 'lines, words' }));
      const isColorDefault = this.color === 'white' || this.color === 'black';
      this.fromColor = !isColorDefault ? 'rgba(255,255,255, 0)' : this.color == 'white' ? 'rgba(255,255,255, 0)' : 'rgba(29,29,29, 0)';
      this.toColor = !isColorDefault ? this.color : this.color == 'white' ? 'rgba(255,255,255, 1)' : 'rgba(29,29,29, 1)';

      if (isHighlight) {
          this.animation = this.allowMobile && gsap.timeline({
              onComplete: () => {
                  if (!isDisableRevert) {
                      this.textSplit.revert();
                  }
              },
              ...props
          });
          this.allowMobile && this.textSplit.words.forEach((word, idx) => {
              let toColor = word.closest('.txt-highlight') ? '#137fec' : this.toColor;
              this.animation.to(word, {
                  keyframes: {
                      color: [this.fromColor, '#137fec', toColor],
                      easeEach: 'power2.in',
                      ease: 'power1.out',
                  },
                  duration: isFast ? 0.8 : 1
              }, idx * (isFast ? 0.03 : 0.08))
          });
      }
      else {
          this.animation = this.allowMobile && gsap.to(this.textSplit.words, {
              keyframes: {
                  color: [this.fromColor, '#137fec', this.toColor],
                  easeEach: 'power2.in',
                  ease: 'power1.out',
              },
              duration: isFast ? 0.8 : 1,
              stagger: isFast ? 0.03 : 0.08,
              onComplete: () => {
                  if (!isDisableRevert) {
                      this.textSplit.revert();
                  }
              },
              ...props
          })
      }
  }
  init() {
      this.allowMobile && gsap.set(this.textSplit.words, { color: this.fromColor });
  }
}
class RevealTextReset {
  constructor({ el, color, delay, isFast = false, isHighlight = false, allowMobile, ...props }) {
      this.DOM = { el: el };
      this.color = color;
      this.textSplit = [];
      this.delay = delay;
      this.isHighlight = isHighlight
      this.isFast = isFast;
      this.allowMobile = getScreenType().isMobile ? allowMobile : true;

      this.textSplit = new SplitType(this.DOM.el, { types: 'lines, words' });
      this.isColorDefault = this.color === 'white' || this.color === 'black';
      this.fromColor = !this.isColorDefault ? 'rgba(255,255,255, 0)' : this.color == 'white' ? 'rgba(255,255,255, 0)' : 'rgba(29,29,29, 0)';
      this.toColor = !this.isColorDefault ? this.color : this.color == 'white' ? 'rgba(255,255,255, 1)' : 'rgba(29,29,29, 1)';

      if (this.isHighlight) {
          this.animation = this.allowMobile && gsap.timeline({
              onComplete: () => {
                  this.reset();
              },
              ...props
          });

          this.textSplit.words.forEach((word, idx) => {
              let toColor = word.closest('.txt-highlight') ? '#137fec' : this.toColor;
              this.animation.to(word, {
                  keyframes: {
                      color: [this.fromColor, '#137fec', toColor],
                      easeEach: 'power2.in',
                      ease: 'power1.out',
                  },
                  duration: isFast ? 0.8 : 1
              }, idx * (isFast ? 0.03 : 0.08))
          });
      }
      else {
          this.animation = this.allowMobile && gsap.to(this.textSplit.words, {
              keyframes: {
                  color: [this.fromColor, '#137fec', this.toColor],
                  easeEach: 'power2.in',
                  ease: 'power1.out',
              },
              duration: isFast ? 0.8 : 1,
              stagger: isFast ? 0.03 : 0.08,
              onComplete: () => {
                  this.reset();
              },
              ...props
          })
      }
  }
  init() {
      this.allowMobile ? gsap.set(this.textSplit.words, { color: this.fromColor }) : this.reset();
  }
  reset() {
      let isReset = true;
      let isInit = getScreenType().isMobile ? true : false;

      if (getScreenType().isMobile) {
          this.fromColor = !this.isColorDefault ? 'rgba(255,255,255, .1)' : this.color == 'white' ? 'rgba(255,255,255, .1)' : 'rgba(29,29,29, .1)';
      }

      let tlText = gsap.timeline();
      let tl = gsap.timeline({
          scrollTrigger: {
              trigger: this.DOM.el,
              start: 'top top+=65%',
              end: 'bottom top+=65%',
              onEnter: () => {
                  if (isReset && isInit) {
                      isReset = false;
                      if (this.isHighlight) {
                          this.textSplit.words.forEach((word, idx) => {
                              let toColor = word.closest('.txt-highlight') ? '#137fec' : this.toColor;
                              tlText.to(word, {
                                  keyframes: {
                                      color: [this.fromColor, '#137fec', toColor],
                                      easeEach: 'power2.in',
                                      ease: 'power1.out',
                                  },
                                  duration: this.isFast ? 0.8 : 1
                              }, idx * (this.isFast ? 0.03 : 0.08))
                          });
                      }
                      else {
                          gsap.to(this.textSplit.words, {
                              keyframes: {
                                  color: [this.fromColor, '#137fec', this.toColor],
                                  easeEach: 'power2.in',
                                  ease: 'power1.out',
                              },
                              overwrite: true,
                              duration: this.isFast ? .8 : 1,
                              stagger: this.isFast ? .03 : .08,
                          })
                      }
                  }
              },
          }
      })
      let resetTL = gsap.timeline({
          scrollTrigger: {
              trigger: this.DOM.el,
              start: 'top bottom',
              end: 'bottom top',
              onLeaveBack: () => {
                  if (!isInit) {
                      this.fromColor = !this.isColorDefault ? 'rgba(255,255,255, .1)' : this.color == 'white' ? 'rgba(255,255,255, .1)' : 'rgba(29,29,29, .1)';
                  }
                  isInit = true;

                  if (!isReset) isReset = true;
                  gsap.set(this.textSplit.words, { color: this.fromColor, overwrite: true })
              },
          }
      })
  }
}

class FadeIn {
  constructor({ el, type, delay, isDisableRevert, allowMobile, from, to, ...props }) {
      this.DOM = { el: el };
      this.type = type || 'default';
      this.delay = delay;
      this.allowMobile = getScreenType().isMobile ? allowMobile : true;
      this.options = {
          bottom: {
              set: { opacity: 0, y: parseRem(32), ...from },
              to: { opacity: 1, y: 0, ...to }
          },
          left: {
              set: { opacity: 0, x: parseRem(32), ...from },
              to: { opacity: 1, x: 0, ...to },
          },
          right: {
              set: { opacity: 0, x: parseRem(-32), ...from },
              to: { opacity: 1, x: 0, ...to }
          },
          default: {
              set: { opacity: 0, y: parseRem(32), ...from },
              to: { opacity: 1, y: 0, ...to }
          }
      };

      if (!this.DOM.el) return;
      this.animation = this.allowMobile && gsap.fromTo(this.DOM.el,
          { ...this.options[this.type]?.set || this.options.default.set },
          {
              ...this.options[this.type]?.to || this.options.default.to,
              duration: 1,
              ease: 'power3',
              clearProps: isDisableRevert ? '' : 'all',
              ...props
          });
  }
  init() {
      if (!this.DOM.el) return;
      this.allowMobile && gsap.set(this.DOM.el, { ...this.options[this.type]?.set || this.options.default.set });
  }
}
class ScaleLine {
  constructor({ el, type, isCenter, delay, isDisableRevert, allowMobile, ...props }) {
      if (!el) return;

      this.DOM = { el: el };
      this.type = type || 'default';
      this.delay = delay;
      this.allowMobile = getScreenType().isMobile ? allowMobile : true;
      this.options = {
          top: {
              set: { scaleY: 0, transformOrigin: isCenter ? 'center center' : 'top left' },
              to: { scaleY: 1 }
          },
          left: {
              set: { scaleX: 0, transformOrigin: isCenter ? 'center center' : 'top left' },
              to: { scaleX: 1 }
          },
          right: {
              set: { scaleX: 0, transformOrigin: isCenter ? 'center center' : 'top right' },
              to: { scaleX: 1 }
          },
          default: {
              set: { scaleX: 0, transformOrigin: isCenter ? 'center center' : 'top left' },
              to: { scaleX: 1 }
          }
      };
      this.animation = this.allowMobile && gsap.fromTo(this.DOM.el,
          { ...this.options[this.type]?.set || this.options.default.set },
          {
              ...this.options[this.type]?.to || this.options.default.to,
              duration: 1.2,
              ease: 'power1.out',
              clearProps: isDisableRevert ? '' : 'all',
              ...props
          });
  }
  init() {
      if (!this.DOM?.el) return;

      this.allowMobile && gsap.set(this.DOM.el, { ...this.options[this.type]?.set || this.options.default.set });
  }
}
class ScaleInset {
  constructor({ el, elInner, type, options, allowMobile }) {
      this.DOM = { el: el, elInner: elInner || el.querySelector('img') };
      this.type = type;
      this.allowMobile = getScreenType().isMobile ? allowMobile : true;
      this.options = {
          default: {
              set: {
                  scale: 1.2,
                  autoAlpha: 0,
              },
              to: {
                  transformOrigin: 'center',
                  scale: 1,
                  autoAlpha: 1,
              }
          }
      };
      this.animation = this.allowMobile && gsap.fromTo(this.DOM.elInner,
          { ...this.options[this.type]?.set || this.options.default.set },
          {
              ...this.options[this.type]?.to || this.options.default.to, duration: 1.5, ease: 'circ.out',
              ...options,
              onComplete: () => {
                  gsap.set([this.DOM.el, this.DOM.elInner], { clearProps: 'all' });
              }
          });
  }
  init() {
      if (!this.DOM.el) return;
      if (this.allowMobile) {
          gsap.set(this.DOM.el, { overflow: 'hidden' });
          gsap.set(this.DOM.elInner, { ...this.options[this.type]?.set || this.options.default.set });
      }
  }
}

class FadeSplitText {
  constructor({ el, delay, breakType, isDisableRevert, allowMobile, ...props }) {
      if (!el) return;
      this.DOM = { el: el };
      this.allowMobile = getScreenType().isMobile ? allowMobile : true;
      this.breakType = breakType || 'lines';
      this.textSplit = this.allowMobile && (new TextSplit({ el: this.DOM.el, type: this.breakType })).DOM.splitType;
      this.delay = delay;
      this.animation = this.allowMobile && gsap.from(this.textSplit[this.breakType], {
          autoAlpha: 0,
          yPercent: 100,
          stagger: this.breakType == 'lines' ? 0.1 : 0.04,
          duration: this.breakType == 'lines' ? .6 : 1,
          ease: 'power2.out',
          clearProps: isDisableRevert ? '' : 'all',
          onComplete: () => {
              if (!isDisableRevert) {
                  this.textSplit.revert();
              }
          },
          ...props
      });
  }
  init() {
      document.fonts.onloadingdone = () => {
          this.allowMobile && gsap.set(this.textSplit[this.breakType], { autoAlpha: 0, yPercent: 100 });
      }
  }
}