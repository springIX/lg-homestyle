$(function () {
  const win = $(window);
  let win_w = win.width();
  const mo_break_point = 767;

  // 아코디언 컨텐츠
  $('#home-app-subscribe').on('click', '.accordion-btn', function () {
    const $btn = $(this);
    const $accordion = $btn.closest('.accordion');
    const $content = $accordion.find('.accordion-cont');
    const isOpen = $accordion.hasClass('on');

    $accordion.toggleClass('on', !isOpen);
    $btn.attr('aria-expanded', !isOpen);
    $content.stop(true, true)[isOpen ? 'slideUp' : 'slideDown'](300);
  });

  // 한눈에 보는 구독 혜택 버튼이동
  $('.overview-list a[data-target]').on('click', function (e) {
    e.preventDefault();

    const targetSelector = $(this).attr('data-target');
    const $target = $(targetSelector);

    if (!$target.length) return;


    if (!$target.hasClass('on')) {
      $target.children('.accordion-btn').trigger('click');
    }
    window.scrollTo({
      top: $target.offset().top - 80,
      behavior: 'smooth'
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
    loop: true,
    loopedSlides: 9,
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

/* benefit_service.html */
$(function () {
  const $servicePage = $('.service-page');

  if (!$servicePage.length) return;

  // 기존 아코디언 동작과 hidden 속성을 동기화해 보조기기에도 상태를 전달합니다.
  $servicePage.on('click', '.accordion-btn', function () {
    const $button = $(this);
    const $content = $button.closest('.accordion').children('.accordion-cont');
    const isExpanded = $button.attr('aria-expanded') === 'true';

    $content.prop('hidden', !isExpanded);
  });

  // 제품별 케어 탭: 클릭과 방향키 탐색을 모두 지원합니다.
  $servicePage.on('click keydown', '[data-service-tabs] [role="tab"]', function (event) {
    const $tabs = $(this).parent().children('[role="tab"]');
    let index = $tabs.index(this);

    if (event.type === 'keydown') {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'Home') index = 0;
      if (event.key === 'End') index = $tabs.length - 1;
      if (event.key === 'ArrowLeft') index = (index - 1 + $tabs.length) % $tabs.length;
      if (event.key === 'ArrowRight') index = (index + 1) % $tabs.length;
      $tabs.eq(index).focus();
    }

    const $activeTab = $tabs.eq(index);
    const panelId = $activeTab.attr('aria-controls');

    $tabs.removeClass('is-active').attr({ 'aria-selected': 'false', tabindex: '-1' });
    $activeTab.addClass('is-active').attr({ 'aria-selected': 'true', tabindex: '0' });
    $activeTab.closest('.service-tabs').children('.service-tabs__panel').prop('hidden', true);
    $('#' + panelId).prop('hidden', false);
  });

  $servicePage.find('[data-service-tabs] [role="tab"]').attr('tabindex', '-1').filter('[aria-selected="true"]').attr('tabindex', '0');
});
