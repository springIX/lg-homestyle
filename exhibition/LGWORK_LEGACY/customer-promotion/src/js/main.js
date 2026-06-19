$(function () {
  const win = $(window);
  let win_w = win.width();
  const mo_break_point = 780;
  const remToPx = (rem) => rem * parseFloat(getComputedStyle(document.documentElement).fontSize);

  /* SIGNATURE DEAL */
  var swiper = new Swiper('.signature_deal .swiper', {
    speed: 800,
    spaceBetween: 20,
    slidesPerView: 4, // 기본 PC용 (1줄 4개)
    grid: {
      rows: 1,
      fill: 'row',
    },
    breakpoints: {
      0: { // 모바일
        slidesPerView: 2,
        grid: {
          rows: 2, // 두 줄
        },
        spaceBetween: 10,
      },
      781: { // PC
        slidesPerView: 4,
        grid: {
          rows: 1,
        },
        spaceBetween: 20,
      }
    },
    pagination: {
      el: '.signature_deal .pagi',
      clickable: true,
    },
    navigation: {
      nextEl: '.signature_deal .nxt',
      prevEl: '.signature_deal .prv',
    },
    on: {
      init: function () {
        const total = this.slides.length;
        $('.signature_deal .total').text(total.toString().padStart(2, '0'));
        $('.signature_deal .crnt').text((this.realIndex + 1).toString().padStart(2, '0'));
      },
      slideChange: function () {
        $('.signature_deal .crnt').text((this.realIndex + 1).toString().padStart(2, '0'));
      }
    }
  });

  /* SPECIAL BRAND RELAY */
  var swiper = new Swiper('.special_brand_relay .swiper', {
    speed: 800,
    spaceBetween: 20,
    pagination: {
      el: '.special_brand_relay .pagi',
      clickable: true,
    },
    navigation: {
      nextEl: '.special_brand_relay .nxt',
      prevEl: '.special_brand_relay .prv',
    },
    on: {
      init: function () {
        const total = this.slides.length;
        $('.special_brand_relay .total').text(total.toString().padStart(2, '0'));
        $('.special_brand_relay .crnt').text((this.realIndex + 1).toString().padStart(2, '0'));
      },
      slideChange: function () {
        $('.special_brand_relay .crnt').text((this.realIndex + 1).toString().padStart(2, '0'));
        $('.special_brand_relay .cp_tab li').removeClass('on').eq(this.realIndex).addClass('on');
      }
    }
  });
  $('.special_brand_relay .cp_tab li').on('click', function () {
    const idx = $(this).index(); // ← li의 순서(index)를 구함
    swiper.slideTo(idx);
  });

  const targetDate = new Date("2025-12-10T16:00:00");
  const sbr_timer = $('#sbr_timer');

  function updateTimer() {
    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) {
      sbr_timer.text("00일 00시간 00분 00초");
      clearInterval(timerInterval);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    const format = (n) => (n < 10 ? "0" + n : n);

    sbr_timer.text(
      `${days}일 ${format(hours)}시간 ${format(minutes)}분 ${format(seconds)}초`
    );
  }

  const timerInterval = setInterval(updateTimer, 1000); // ✅ 먼저 선언
  updateTimer(); // ✅ 초기 호출

  $('.tab_slide_cont').each(function () {
    const $container = $(this);

    // x_scr_box prev/next 버튼 연동
    const $tabControls = $container.find('.cp_tab');
    $tabControls.each(function () {
      const $tabCtrl = $(this);
      const $ul = $tabCtrl.find('.x_scr_box');
      const $prev = $tabCtrl.find('.prv');
      const $next = $tabCtrl.find('.nxt');

      function updateNav() {
        const scrollLeft = $ul.scrollLeft();
        const maxScroll = $ul[0].scrollWidth - $ul.outerWidth();

        if (scrollLeft <= 1) $prev.addClass('disabled');
        else $prev.removeClass('disabled');

        if (scrollLeft >= maxScroll - 1) $next.addClass('disabled');
        else $next.removeClass('disabled');
      }

      updateNav();

      $next.on('click', function () {
        const maxScroll = $ul[0].scrollWidth - $ul.outerWidth();
        $ul.animate({ scrollLeft: maxScroll }, 300, updateNav);
      });

      $prev.on('click', function () {
        $ul.animate({ scrollLeft: 0 }, 300, updateNav);
      });

      $ul.on('scroll', function () {
        updateNav();
      });
    });
  });

  /* PREMIUN SELECTION */
  var swiper2 = new Swiper('.premium_selection .swiper', {
    speed: 800,
    spaceBetween: 20,
    pagination: {
      el: '.premium_selection .pagi',
      clickable: true,
    },
    navigation: {
      nextEl: '.premium_selection .nxt',
      prevEl: '.premium_selection .prv',
    },
    on: {
      init: function () {
        const total = this.slides.length;
        $('.premium_selection .total').text(total.toString().padStart(2, '0'));
        $('.premium_selection .crnt').text((this.realIndex + 1).toString().padStart(2, '0'));
      },
      slideChange: function () {
        $('.premium_selection .crnt').text((this.realIndex + 1).toString().padStart(2, '0'));
        $('.premium_selection .cp_tab li').removeClass('on').eq(this.realIndex).addClass('on');
      }
    }
  });
  $('.premium_selection .cp_tab li').on('click', function () {
    const idx = $(this).index(); // ← li의 순서(index)를 구함
    swiper2.slideTo(idx);
  });

  /* CURATION BY CASE */
  var swiper3 = new Swiper('.curation_by_space .swiper', {
    speed: 800,
    spaceBetween: 20,
    pagination: {
      el: '.curation_by_space .pagi',
      clickable: true,
    },
    navigation: {
      nextEl: '.curation_by_space .nxt',
      prevEl: '.curation_by_space .prv',
    },
    on: {
      slideChange: function () {
        $('.curation_by_space .cp_tab li').removeClass('on').eq(this.realIndex).addClass('on');
      }
    }
  });

  $('.curation_by_space .cp_tab li').on('click', function () {
    const idx = $(this).index(); // ← li의 순서(index)를 구함
    swiper3.slideTo(idx);
  });

  // 공통: 모바일 컨텐츠 내용 복제
  $('.benefit_cont_mo').html($('.benefit_cont').html());

  // 반응형 동작 함수
  function setBenefitEvent() {
    let win_w = win.width();

    // 기존 이벤트 제거 (중복 방지)
    $('.payment_benefits .benefit_pop_btn').off('click');

    if (win_w > mo_break_point) {
      // PC
      $('.benefit_cont_mo').removeClass('on');
      $('.payment_benefits .benefit_pop_btn').on('click', function () {
        $('.payment_benefits .popup_wrap').toggleClass('on');
      });
    } else {
      // MO
      $('.payment_benefits .popup_wrap').removeClass('on');
      $('.payment_benefits .benefit_pop_btn').on('click', function () {
        $('.benefit_cont_mo').toggleClass('on');
      });
    }
  }

  // 초기 실행
  setBenefitEvent();

  // 리사이즈 시 실시간 반응
  win.on('resize', function () {
    setBenefitEvent();
  });

});
