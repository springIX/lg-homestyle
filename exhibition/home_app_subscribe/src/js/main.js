$(function () {
  const win = $(window);
  let win_w = win.width();
  const mo_break_point = 767;

  $(document).on('click', function () {
    setTimeout(function () {
      $('video:hidden').each(function () {
        this.pause();
      });
    }, 0);
  });

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
  // 제휴카드별 상세 혜택 스와이퍼
  const $cardSection = $('#detail-affiliated-card');
  if ($cardSection.length) {
    const CARD_SPEED = 800;

    const cardList = new Swiper(
      '#detail-affiliated-card .card-list',
      {
        slidesPerView: 'auto',
        spaceBetween: 6,
        centeredSlides: true,
        watchSlidesProgress: true,
        speed: CARD_SPEED,
        threshold: 30,

        breakpoints: {
          [mo_break_point + 1]: {
            spaceBetween: 42
          }
        }
      }
    );

    const cardInfo = new Swiper(
      '#detail-affiliated-card .card-info',
      {
        slidesPerView: 1,
        spaceBetween: 20,
        centeredSlides: true,
        speed: CARD_SPEED,
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
            spaceBetween: 32
          }
        }
      }
    );

    let isCardSyncing = false;
    let currentCardIndex = 0;

    /*
    * 썸네일 활성화
    */
    function updateCardListActive(index) {
      $cardSection
        .find('.card-list .swiper-slide')
        .removeClass('swiper-slide-thumb-active')
        .eq(index)
        .addClass('swiper-slide-thumb-active');
    }

    /*
    * 열린 카드 아코디언 닫기
    */
    function closeCardAccordions() {
      const $accordions = $cardSection.find(
        '.card-info .accordion.on'
      );

      $accordions
        .removeClass('on')
        .find('.accordion-btn')
        .attr('aria-expanded', 'false');

      $accordions
        .find('.accordion-cont')
        .stop(true, true)
        .hide();
    }

    /*
    * card-list → card-info
    */
    function syncFromCardList(index) {
      if (isCardSyncing) return;

      isCardSyncing = true;
      currentCardIndex = index;

      updateCardListActive(index);
      closeCardAccordions();

      if (cardInfo.activeIndex !== index) {
        cardInfo.slideTo(
          index,
          CARD_SPEED,
          false
        );
      }

      requestAnimationFrame(function () {
        isCardSyncing = false;
      });
    }

    /*
    * card-info → card-list
    */
    function syncFromCardInfo(index) {
      if (isCardSyncing) return;

      isCardSyncing = true;
      currentCardIndex = index;

      updateCardListActive(index);
      closeCardAccordions();

      if (cardList.activeIndex !== index) {
        cardList.slideTo(
          index,
          CARD_SPEED,
          false
        );
      }

      requestAnimationFrame(function () {
        isCardSyncing = false;
      });
    }

    /*
    * card-list를 스와이프하면
    * card-info 즉시 이동
    */
    cardList.on('slideChange', function () {
      syncFromCardList(
        this.activeIndex
      );
    });

    /*
    * card-info를 스와이프하거나
    * 네비게이션 버튼을 누르면
    * card-list 즉시 이동
    */
    cardInfo.on('slideChange', function () {
      syncFromCardInfo(
        this.activeIndex
      );
    });

    /*
    * 썸네일 클릭
    */
    cardList.on('tap', function () {
      if (
        !this.allowClick ||
        this.clickedIndex == null
      ) {
        return;
      }

      const index = this.clickedIndex;

      cardList.slideTo(
        index,
        CARD_SPEED
      );

      /*
      * 이미 활성화된 썸네일을 클릭하면
      * slideChange가 발생하지 않으므로 직접 동기화
      */
      if (cardList.activeIndex === index) {
        syncFromCardList(index);
      }
    });

    /*
    * 최초 위치 동기화
    */
    currentCardIndex = cardInfo.activeIndex;

    cardList.slideTo(
      currentCardIndex,
      0,
      false
    );

    cardInfo.slideTo(
      currentCardIndex,
      0,
      false
    );

    updateCardListActive(
      currentCardIndex
    );

    /*
    * 모바일 ↔ PC 전환 시 갱신
    */
    const cardMediaQuery = window.matchMedia(
      `(min-width: ${mo_break_point + 1}px)`
    );

    function refreshCardSwiper() {
      isCardSyncing = true;

      setTimeout(function () {
        cardList.update();
        cardInfo.update();

        cardList.slideTo(
          currentCardIndex,
          0,
          false
        );

        cardInfo.slideTo(
          currentCardIndex,
          0,
          false
        );

        updateCardListActive(
          currentCardIndex
        );

        requestAnimationFrame(function () {
          isCardSyncing = false;
        });
      }, 100);
    }

    if (cardMediaQuery.addEventListener) {
      cardMediaQuery.addEventListener(
        'change',
        refreshCardSwiper
      );
    } else {
      cardMediaQuery.addListener(
        refreshCardSwiper
      );
    }
  }

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
  const tabButtons = document.querySelectorAll('[data-service-tabs] [role="tab"]');

  // 초기화
  tabButtons.forEach(btn => {
    if (btn.getAttribute('aria-selected') !== 'true') btn.setAttribute('tabindex', '-1');
  });

  document.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-service-tabs] [role="tab"]');
    if (!tab) return;

    const tabRoot = tab.closest('[data-service-tabs-root]');
    const tabList = tab.closest('[data-service-tabs]');

    if (!tabRoot || !tabList) return;

    const panelId = tab.getAttribute('aria-controls');
    const allTabs = tabList.querySelectorAll('[role="tab"]');
    const allPanels = Array.from(tabRoot.children).filter(panel => panel.classList.contains('service-tabs__panel'));
    const targetPanel = allPanels.find(panel => panel.id === panelId);

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
    if (targetPanel) targetPanel.hidden = false;
  });

  // 탭 키보드(방향키) 접근성
  document.addEventListener('keydown', (e) => {
    const tab = e.target.closest('[data-service-tabs] [role="tab"]');
    if (!tab) return;

    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(e.key)) return;

    e.preventDefault();
    const tabList = tab.closest('[data-service-tabs]');

    if (!tabList) return;

    const allTabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
    let index = allTabs.indexOf(tab);

    if (e.key === 'Home') index = 0;
    if (e.key === 'End') index = allTabs.length - 1;
    if (e.key === 'ArrowLeft') index = (index - 1 + allTabs.length) % allTabs.length;
    if (e.key === 'ArrowRight') index = (index + 1) % allTabs.length;

    allTabs[index].click();
    allTabs[index].focus({ preventScroll: true });
  });

  const desktopChecklistMedia = window.matchMedia('(min-width: 768px)');

  function syncChecklistAccordions() {
    const checklistButtons = document.querySelectorAll('.service-checklist__button');

    checklistButtons.forEach((button, index) => {
      const contentId = button.getAttribute('aria-controls');
      const content = document.getElementById(contentId);

      if (!content) return;

      if (desktopChecklistMedia.matches) {
        button.setAttribute('aria-expanded', 'true');
        button.setAttribute('aria-disabled', 'true');
        button.setAttribute('tabindex', '-1');
        button.disabled = false;
        content.hidden = false;
        return;
      }

      const isFirstItem = index === 0;

      button.setAttribute('aria-expanded', String(isFirstItem));
      button.disabled = false;
      button.removeAttribute('aria-disabled');
      button.removeAttribute('tabindex');
      content.hidden = !isFirstItem;
    });
  }

  syncChecklistAccordions();

  if (desktopChecklistMedia.addEventListener) {
    desktopChecklistMedia.addEventListener('change', syncChecklistAccordions);
  } else {
    desktopChecklistMedia.addListener(syncChecklistAccordions);
  }


  /* =======================================================
     2. 아코디언 (Accordion) 공통 제어
  ======================================================== */
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.faq-accordion__button, .service-accordion__button, .service-cancel__return-fee-button, .service-checklist__button');

    if (!btn) return;

    if (btn.classList.contains('service-checklist__button') && desktopChecklistMedia.matches) return;

    const isExpanded = btn.getAttribute('aria-expanded') === 'true';
    const targetId = btn.getAttribute('aria-controls');
    const targetContent = document.getElementById(targetId);

    if (!targetContent) return;

    if (btn.classList.contains('service-checklist__button')) {
      if (isExpanded) {
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-expanded', 'false');
        targetContent.hidden = true;
        return;
      }

      btn.setAttribute('aria-pressed', 'true');

      const checklist = btn.closest('.service-checklist');

      if (checklist) {
        checklist.querySelectorAll('.service-checklist__button[aria-expanded="true"]').forEach(function (openButton) {
          if (openButton === btn) return;

          openButton.setAttribute('aria-expanded', 'false');
          const openContent = document.getElementById(openButton.getAttribute('aria-controls'));

          if (openContent) {
            openContent.hidden = true;
          }
        });
      }

      btn.setAttribute('aria-expanded', 'true');
      targetContent.hidden = false;
      return;
    }

    if (btn.closest('.service-page__section--cancel')) {
      btn.setAttribute('aria-expanded', String(!isExpanded));
      targetContent.hidden = isExpanded;
      return;
    }

    // 1. 이미 열려있는 상태에서 클릭한 경우 (현재 항목 닫기)
    if (isExpanded) {
      btn.setAttribute('aria-expanded', 'false');
      targetContent.hidden = true;
    }
    else {
      const openButtons = document.querySelectorAll('.faq-accordion__button[aria-expanded="true"], .service-accordion__button[aria-expanded="true"], .service-cancel__return-fee-button[aria-expanded="true"], .service-checklist__button[aria-expanded="true"]');

      openButtons.forEach(function (openBtn) {
        if (openBtn.classList.contains('service-checklist__button') && desktopChecklistMedia.matches) return;
        if (openBtn.closest('.service-page__section--cancel')) return;

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

    // X 버튼 클릭
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

  const initialFaqItemCount = 10;
  const faqPanels = document.querySelectorAll('.service-faq-tabs > .service-tabs__panel');

  faqPanels.forEach(panel => {
    const faqItems = Array.from(panel.querySelectorAll('.faq-accordion > .faq-accordion__item'));
    const moreWrap = panel.querySelector('.faq-more');
    const moreButton = panel.querySelector('.faq-more__button');

    faqItems.slice(initialFaqItemCount).forEach(item => {
      item.hidden = true;
    });

    if (!moreWrap || !moreButton) return;

    moreButton.addEventListener('click', () => {
      faqItems.slice(initialFaqItemCount).forEach(item => {
        item.hidden = false;
      });

      moreButton.setAttribute('aria-expanded', 'true');
      moreWrap.hidden = true;
    });
  });

});



// 테스트용 api 
// 현재 접속한 환경이 로컬인지 확인
// const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// const baseUrl = isLocal ? 'https://www.lge.co.kr' : '';

// function fetchProducts(categoryId) {
//   const apiUrl = `${baseUrl}https://www.lge.co.kr/kr/home_app_subscribe/service_info.html=${categoryId}`;

//   fetch('https://apiv2.lge.co.kr/subscriptionsvc/ajax/v1/direct-subscription/best-ranking-list?displaySpaceId=DP_HOME_001&titleLinkUrl=subscribe&displayObjectLevel=2&viewCnt=5', {
//     method: 'GET',
//     headers: {
//     }
//   })
//     .then(response => response.json())
//     .then(data => {
//       renderProducts(categoryId, data);
//     })
//     .catch(error => {
//       console.error('데이터를 불러오지 못했습니다:', error);
//     });
// }
