(() => {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({
    ignoreMobileResize: true
  });

  /* SWIPER */
  const remToPx = (rem) => {
    const isMobile = window.matchMedia(
      '(max-width: 767px)'
    ).matches;

    if (isMobile) {
      return rem * (
        document.documentElement.clientWidth / 390
      );
    }

    return rem * parseFloat(
      getComputedStyle(
        document.documentElement
      ).fontSize
    );
  };

  $('.common_swiper').each(function () {
    const $swiper = $(this);

    const viewValue =
      $swiper.attr('data-swiper-view');

    const spaceValue = parseFloat(
      $swiper.attr('data-swiper-space-between')
    );

    const paginationType =
      $swiper.attr('data-swiper-pagination');

    const slidesPerView =
      viewValue === 'auto'
        ? 'auto'
        : parseFloat(viewValue) || 1.1;

    const spaceBetween = Number.isNaN(spaceValue)
      ? remToPx(12)
      : remToPx(spaceValue);

    const scrollbarEl =
      $swiper.find('.scr_bar')[0];

    const paginationEl =
      $swiper.find('.swiper-pagination')[0];

    const options = {
      slidesPerView,
      spaceBetween,
      speed: 800,
      observer: true,
      observeParents: true,
      resizeObserver: true
    };

    if (scrollbarEl) {
      options.scrollbar = {
        el: scrollbarEl,
        draggable: true
      };
    }

    if (paginationType && paginationEl) {
      options.pagination = {
        el: paginationEl,
        type: paginationType,
        clickable: paginationType === 'bullets'
      };
    }

    // Swiper는 한 번만 생성
    const swiper = new Swiper(this, options);
    this.swiperInstance = swiper;

    const $tabButtons = $swiper
      .children('.swiper_tab')
      .find('button');

    function setActiveTab(index) {
      $tabButtons
        .removeClass('on')
        .attr('aria-selected', 'false')
        .eq(index)
        .addClass('on')
        .attr('aria-selected', 'true');
    }

    $tabButtons
      .off('click.swiperTab')
      .on('click.swiperTab', function () {
        const index = $(this).index();

        if (swiper.params.loop) {
          swiper.slideToLoop(index);
        } else {
          swiper.slideTo(index);
        }
      });

    swiper.on('slideChange', function () {
      setActiveTab(swiper.realIndex);
    });

    // 최초 활성화
    setActiveTab(swiper.realIndex);
  });

  /* HANDLE BOX */
  document
    .querySelectorAll('.handle_box')
    .forEach(compare => {
      const range = compare.querySelector(
        'input[type="range"]'
      );

      range.addEventListener('input', function () {
        compare.style.setProperty(
          '--position',
          `${this.value}%`
        );
      });
    });

  /* NAVIGATION TAB */
  function initScrollNavTab() {
    const $navWrap = $('#navigation_tab');
    if (!$navWrap.length) return;
    const $nav = $navWrap.find('nav');
    const $ul = $navWrap.find('ul');
    const $links = $navWrap.find('a');
    const $items = $navWrap.find('li');
    const ACTIVE_BUFFER = 2;
    if (!$links.length) return;

    let currentId = '';
    let isClickScrolling = false;
    let scrollEndTimer = null;
    let ticking = false;

    // 중복 바인딩 방지
    $(window).off('scroll.scrollNavTab');
    $navWrap.off('click.scrollNavTab');

    /**
     * 콘텐츠 위치 보정값
     *
     * PC: 탭 높이
     * 모바일: 탭 높이 + 고정 헤더 56px
     */
    function getContentOffset() {
      const tabHeight = $navWrap.outerHeight() || 0;

      const isMobile = window.matchMedia(
        '(max-width: 767px)'
      ).matches;

      return isMobile
        ? tabHeight + 56
        : tabHeight;
    }

    // 실제 가로 스크롤이 적용된 요소 찾기
    function getScrollContainer() {
      const candidates = [
        $navWrap.get(0),
        $nav.get(0),
        $ul.get(0)
      ].filter(Boolean);

      for (
        let i = 0;
        i < candidates.length;
        i++
      ) {
        const element = candidates[i];

        if (
          element.scrollWidth >
          element.clientWidth
        ) {
          return element;
        }
      }

      return $navWrap.get(0);
    }

    // 활성화된 탭의 가로 중앙 위치 계산
    function getMoveLeft($item) {
      const container = getScrollContainer();
      const item = $item.get(0);

      if (!container || !item) return 0;

      const containerRect =
        container.getBoundingClientRect();

      const itemRect =
        item.getBoundingClientRect();

      const itemCenter =
        itemRect.left -
        containerRect.left +
        container.scrollLeft +
        itemRect.width / 2;

      const targetLeft =
        itemCenter -
        container.clientWidth / 2;

      const maxScroll =
        container.scrollWidth -
        container.clientWidth;

      return Math.max(
        0,
        Math.min(targetLeft, maxScroll)
      );
    }

    // 활성화된 탭을 가로 중앙으로 이동
    function centerTab($item) {
      if (!$item.length) return;

      const container = getScrollContainer();

      container.scrollLeft =
        getMoveLeft($item);
    }

    function clearActive() {
      currentId = '';
      $items.removeClass('on');
    }

    function setActive(id) {
      if (!id) {
        clearActive();
        return;
      }

      const $targetItem = $links
        .filter(`[href="#${id}"]`)
        .closest('li');

      if (!$targetItem.length) {
        clearActive();
        return;
      }

      if (
        currentId === id &&
        $targetItem.hasClass('on')
      ) {
        centerTab($targetItem);
        return;
      }

      currentId = id;

      $items.removeClass('on');
      $targetItem.addClass('on');

      centerTab($targetItem);
    }

    // 현재 보이는 콘텐츠 ID 확인
    function getCurrentSectionId() {
      const checkPoint =
        $(window).scrollTop() +
        getContentOffset();

      let foundId = '';

      $links.each(function () {
        const href = $(this).attr('href');
        const $section = $(href);

        if (!$section.length) return;

        const top = $section.offset().top;
        const bottom =
          top + $section.outerHeight();

        if (
          checkPoint >= top &&
          checkPoint < bottom
        ) {
          foundId = $section.attr('id');
        }
      });

      return foundId;
    }

    function syncActiveByScroll() {
      if (isClickScrolling) return;

      const id = getCurrentSectionId();

      if (!id) {
        clearActive();
        return;
      }

      setActive(id);
    }

    // 탭 클릭
    $navWrap.on(
      'click.scrollNavTab',
      'a',
      function (event) {
        event.preventDefault();

        const href = $(this).attr('href');
        const $target = $(href);

        if (!$target.length) return;

        const id = $target.attr('id');

        isClickScrolling = true;
        clearTimeout(scrollEndTimer);

        setActive(id);

        const targetTop =
          $target.offset().top -
          getContentOffset() +
          ACTIVE_BUFFER;

        $('html, body')
          .stop(true, true)
          .scrollTop(targetTop);

        scrollEndTimer = setTimeout(
          function () {
            isClickScrolling = false;
            syncActiveByScroll();
          },
          50
        );
      }
    );

    // 페이지 스크롤
    $(window).on(
      'scroll.scrollNavTab',
      function () {
        if (ticking) return;

        ticking = true;

        requestAnimationFrame(function () {
          syncActiveByScroll();
          ticking = false;
        });
      }
    );

    // 최초 실행
    syncActiveByScroll();
  }
  initScrollNavTab();

  /* SPACE DETAILES : BEFORE AFTER */
  $('#space_detail article .before_after').each(function () {
    const $wrap = $(this);
    const $after = $wrap.find('.after');
    const $before = $wrap.find('.before');
    $after.css({
      transform: `translateY(${$before.outerHeight()}px)`
    });

    gsap.to($after, {
      y: 0,
      ease: 'none',

      scrollTrigger: {
        trigger: this,
        start: 'top top',
        end: '+=300',
        scrub: true,
        invalidateOnRefresh: true,
      }
    });
  });

  /* PRODUCTS ANCHER */
  $(document).on('click', function (e) {
    const $target = $(e.target);

    // 상품 정보 영역 클릭 시 on 상태 유지
    if ($target.closest('.pd_anchor_info').length) {
      return;
    }

    const $pin = $target.closest('.pd_anchor_pin');

    // 핀 클릭 시 해당 앵커 토글
    if ($pin.length) {
      const $anchor = $pin.closest('.pd_anchor');

      $('.pd_anchor').not($anchor).removeClass('on');
      $anchor.toggleClass('on');

      return;
    }

    // 그 외 영역 클릭 시 모두 닫기
    $('.pd_anchor').removeClass('on');
  });

  /* AOS */
  function initAos() {
    $('[data-aos-stragger]').each(function () {
      const $parent = $(this);

      const effect =
        $parent.attr('data-aos-effect') ||
        'fade-up';

      const delayStep =
        parseInt(
          $parent.attr('data-aos-delay-step'),
          10
        ) || 50;

      $parent.children().each(function (index) {
        $(this).attr({
          'data-aos': effect,
          'data-aos-delay': index * delayStep
        });
      });
    });

    AOS.init({
      duration: 1000,
      offset: 50,
      once: true
    });
  }

  initAos();

  // $(window).on('load pageshow', function () {
  //   requestAnimationFrame(function () {
  //     AOS.refreshHard();
  //     ScrollTrigger.refresh();
  //   });
  // });

  function startLibraryRefresh() {
    let count = 0;

    const timer = setInterval(function () {
      $('.common_swiper').each(function () {
        const swiper = this.swiperInstance;
        if (!swiper) return;

        const spaceValue = parseFloat(
          $(this).attr(
            'data-swiper-space-between'
          )
        );

        swiper.params.spaceBetween = remToPx(
          Number.isNaN(spaceValue)
            ? 12
            : spaceValue
        );

        swiper.updateSize();
        swiper.updateSlides();
        swiper.update();
      });

      AOS.refreshHard();
      ScrollTrigger.refresh();

      if (++count === 3) {
        clearInterval(timer);
      }
    }, 1000);
  }

  if (document.readyState === 'complete') {
    startLibraryRefresh();
  } else {
    $(window).one(
      'load',
      startLibraryRefresh
    );
  }
})();
