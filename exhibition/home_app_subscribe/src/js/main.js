$(function () {
  const win = $(window);
  let win_w = win.width();
  const mo_break_point = 767;

  // 1DEP 헤더
  $(window).on('scroll', function () {
    $('.care-subcp-header-menu').toggleClass(
      'on',
      $(this).scrollTop() >= $('.care-subcp-header-wrap').offset().top
    );
  });

  // 아코디언 콘텐츠
  $('#home-app-subscribe').on('click', '.accordion-btn', function () {
    const $btn = $(this);
    const $accordion = $btn.closest('.accordion');
    const $content = $accordion.find('.accordion-cont');
    const isOpen = $accordion.hasClass('on');

    const $otherAccordions = $accordion
      .siblings('.accordion')
      .filter('.on');

    // 열려 있는 다른 아코디언 닫기
    $otherAccordions
      .removeClass('on')
      .find('.accordion-btn')
      .attr('aria-expanded', 'false');

    $otherAccordions
      .find('.accordion-cont')
      .stop(true, true)
      .slideUp(300);

    // 선택한 아코디언 토글
    $accordion.toggleClass('on', !isOpen);
    $btn.attr('aria-expanded', String(!isOpen));

    $content
      .stop(true, true)
    [isOpen ? 'slideUp' : 'slideDown'](300);
  });

  // 한눈에 보는 구독 혜택 버튼 이동
  $('.overview-list a[data-target]').on('click', function (e) {
    e.preventDefault();

    const $target = $($(this).attr('data-target'));

    if (!$target.length) return;

    // 대상 아코디언 열기
    if (!$target.hasClass('on')) {
      $target
        .children('.accordion-btn')
        .trigger('click');
    }

    // 다른 아코디언이 닫히고 대상이 열린 후 이동
    $('#home-app-subscribe .accordion-cont')
      .promise()
      .done(function () {
        window.scrollTo({
          top: $target.offset().top - 80,
          behavior: 'smooth'
        });
      });
  });

  //
  $('.card-recommendation-list > ul > li').on('click', function (e) {
    if (window.innerWidth > mo_break_point) return;
    if ($(e.target).closest('.btn-box').length) return;

    const $item = $(this);
    const $btnBox = $item.find('.btn-box');
    const isOpen = $item.hasClass('on');

    $item.toggleClass('on', !isOpen);

    if (isOpen) {
      $btnBox.stop(true, true).slideUp(300);
    } else {
      $btnBox.stop(true, true).slideDown({
        duration: 300,
        start: function () {
          $(this).css('display', 'grid');
        }
      });
    }
  });

  // 제휴카드별 상세 혜택 스와이퍼
  const cardList = new Swiper('.card-list', {
    slidesPerView: 'auto',
    spaceBetween: 6,
    centeredSlides: true,
    slideToClickedSlide: true,
    watchSlidesProgress: true,
    watchSlidesVisibility: true,
    speed: 800,
    threshold: 30,
    breakpoints: {
      [mo_break_point + 1]: {
        spaceBetween: 42,
        loop: true,
        loopedSlides: 9,
      }
    }
  });

  const cardInfo = new Swiper('.card-info', {
    slidesPerView: 1,
    spaceBetween: 20,
    speed: 800,
    centeredSlides: true,
    threshold: 30,
    noSwiping: true,
    noSwipingClass: 'table-box',
    navigation: {
      nextEl: '#detail-affiliated-card .nxt',
      prevEl: '#detail-affiliated-card .prv'
    },
    breakpoints: {
      [mo_break_point + 1]: {
        slidesPerView: 'auto',
        spaceBetween: 32,
        loop: true,
        loopedSlides: 9,
      }
    }
  });

  function updateCardListActive(index) {
    $('.card-list .swiper-slide')
      .removeClass('swiper-slide-thumb-active')
      .filter(`[data-swiper-slide-index="${index}"]`)
      .addClass('swiper-slide-thumb-active');
  }

  function syncCard(index) {
    $('.card-info .accordion.on').each(function () {
      const $accordion = $(this);

      $accordion
        .removeClass('on')
        .find('.accordion-cont')
        .stop(true, false)
        .slideUp(800);

      $accordion
        .find('.accordion-btn')
        .attr('aria-expanded', 'false');
    });

    updateCardListActive(index);

    if (cardList.realIndex !== index) {
      cardList.slideToLoop(index);
    }

    if (cardInfo.realIndex !== index) {
      cardInfo.slideToLoop(index);
    }
  }

  cardList.on('slideChange', function () {
    syncCard(this.realIndex);
  });

  cardInfo.on('slideChange', function () {
    syncCard(this.realIndex);
  });

  // 최초 활성화
  syncCard(cardList.realIndex);

  $(document).on('click', '[data-tab-btn] > *', function (e) {
    e.preventDefault();

    const $btnWrap = $(this).parent();
    const key = $btnWrap.data('tab-btn');
    const idx = $(this).index();

    // 버튼 on
    $btnWrap.children('button').removeClass('on');
    $(this).addClass('on');

    // 같은 key 컨텐츠 찾기 (같은 섹션/블록 안에서만)
    const $scope = $btnWrap.closest('section, article, .wrap, .container');
    const $contWrap = ($scope.length ? $scope : $(document)).find('[data-tab-cont="' + key + '"]').first();

    // 컨텐츠 on (직속자식 index 매칭)
    $contWrap.children().removeClass('on').eq(idx).addClass('on');
  });
});



/* service_info.html - JS */
document.addEventListener('DOMContentLoaded', () => {

  /* =======================================================
     1. 탭 (Tabs) 공통 제어
  ======================================================== */
  const tabButtons = document.querySelectorAll('[data-service-tabs] [role="tab"], .service-tabs__button');

  // 초기화
  tabButtons.forEach(btn => {
    if (btn.getAttribute('aria-selected') !== 'true') btn.setAttribute('tabindex', '-1');
  });

  document.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-service-tabs] [role="tab"], .service-tabs__button');
    if (!tab) return;

    const tabList = tab.closest('.service-tabs');
    const panelId = tab.getAttribute('aria-controls');
    const allTabs = tabList.querySelectorAll('[role="tab"], .service-tabs__button');
    const allPanels = tabList.querySelectorAll('.service-tabs__panel');

    // 탭 상태 초기화 후 클릭한 탭 활성화
    allTabs.forEach(t => {
      t.classList.remove('is-active');
      t.setAttribute('aria-selected', 'false');
      t.setAttribute('tabindex', '-1');
    });
    tab.classList.add('is-active');
    tab.setAttribute('aria-selected', 'true');
    tab.setAttribute('tabindex', '0');

    allPanels.forEach(p => p.hidden = true);
    if (panelId) document.getElementById(panelId).hidden = false;
  });

  // 탭 키보드(방향키) 접근성
  document.addEventListener('keydown', (e) => {
    const tab = e.target.closest('[data-service-tabs] [role="tab"], .service-tabs__button');
    if (!tab) return;

    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(e.key)) return;

    e.preventDefault();
    const tabList = tab.closest('.service-tabs');
    const allTabs = Array.from(tabList.querySelectorAll('[role="tab"], .service-tabs__button'));
    let index = allTabs.indexOf(tab);

    if (e.key === 'Home') index = 0;
    if (e.key === 'End') index = allTabs.length - 1;
    if (e.key === 'ArrowLeft') index = (index - 1 + allTabs.length) % allTabs.length;
    if (e.key === 'ArrowRight') index = (index + 1) % allTabs.length;

    allTabs[index].click();
    allTabs[index].focus();
  });


  /* =======================================================
     2. 아코디언 (Accordion) 공통 제어 - 덜컹거림 완벽 개선
  ======================================================== */
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.faq-accordion__button, .service-accordion__button, .service-cancel__return-fee-button, .service-checklist__button');

    if (!btn) return;
    const isExpanded = btn.getAttribute('aria-expanded') === 'true';
    const targetId = btn.getAttribute('aria-controls');
    const targetContent = document.getElementById(targetId);

    if (!targetContent) return;

    // 1. 이미 열려있는 상태에서 클릭한 경우 (현재 항목 닫기)
    if (isExpanded) {
      btn.setAttribute('aria-expanded', 'false');
      targetContent.hidden = true;
    }
    else {
      const openButtons = document.querySelectorAll('.faq-accordion__button[aria-expanded="true"], .service-accordion__button[aria-expanded="true"], .service-cancel__return-fee-button[aria-expanded="true"], .service-checklist__button[aria-expanded="true"]');

      openButtons.forEach(function (openBtn) {
        openBtn.setAttribute('aria-expanded', 'false');
        const openContentId = openBtn.getAttribute('aria-controls');
        const openContent = document.getElementById(openContentId);
        if (openContent) {
          openContent.hidden = true;
        }
      });

      // 현재 클릭한 항목 열기
      btn.setAttribute('aria-expanded', 'true');
      targetContent.hidden = false;
    }
  });


  /* =======================================================
     3. 툴팁 (Tooltip) 제어
  ======================================================== */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.service-tooltip__btn');
    const closeBtn = e.target.closest('.service-tooltip__close');
    const isInsideTooltip = e.target.closest('.service-tooltip');
    const allTooltips = document.querySelectorAll('.service-tooltip');

    // X 버튼 클릭이거나, 툴팁 외부 영역 클릭 시 모두 닫기
    if (closeBtn || (!btn && !isInsideTooltip)) {
      allTooltips.forEach(t => t.hidden = true);
      return;
    }

    // 툴팁 버튼 클릭 시
    if (btn) {
      e.stopPropagation();
      const myTooltip = btn.closest('.service-tooltip__wrap').querySelector('.service-tooltip');
      const isCurrentlyOpen = myTooltip && !myTooltip.hidden;

      allTooltips.forEach(t => t.hidden = true);
      if (!isCurrentlyOpen && myTooltip) myTooltip.hidden = false;
    }
  });


  /* =======================================================
     4. FAQ 카테고리 필터
  ======================================================== */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-service-faq-filter]');
    if (!btn) return;

    const selectedCategory = btn.getAttribute('data-service-faq-filter');
    const filterButtons = document.querySelectorAll('[data-service-faq-filter]');
    const faqItems = document.querySelectorAll('[data-service-faq-category]');

    filterButtons.forEach(b => {
      b.classList.remove('is-active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('is-active');
    btn.setAttribute('aria-pressed', 'true');

    faqItems.forEach(item => {
      const itemCategory = item.getAttribute('data-service-faq-category');
      item.hidden = !(selectedCategory === 'all' || itemCategory === selectedCategory);
    });
  });

});