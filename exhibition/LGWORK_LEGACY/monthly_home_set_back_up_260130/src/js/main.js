$(function () {
  const win = $(window);
  let win_w = win.width();
  const mo_break_point = 780;
  const remToPx = (rem) => rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
  // ✅ 탭-콘텐츠 on 토글 (캡처링으로 먼저 받기)
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-home-set-tab] button');
    if (!btn) return;

    e.preventDefault();

    const tabWrap = btn.closest('[data-home-set-tab]');
    const key = tabWrap?.getAttribute('data-home-set-tab');
    if (!key) return;

    const idx = Array.prototype.indexOf.call(tabWrap.querySelectorAll('button'), btn);

    const scope = tabWrap.closest('section') || document;
    const contentWrap = scope.querySelector(`[data-home-set-cont="${key}"]`);
    if (!contentWrap) return;

    // 버튼 on
    tabWrap.querySelectorAll('button').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');

    // article on
    const articles = contentWrap.querySelectorAll('article');
    articles.forEach(a => a.classList.remove('on'));
    if (articles[idx]) articles[idx].classList.add('on');

  }, true); // ✅ true = capture (중요)


  $(document).off('click').on('click', '.monthly_home_set .notice_box button', function (e) {
    e.preventDefault();
    $(this).closest('.notice_box').toggleClass('on');
  });

  var swiper = new Swiper('#benefits .benefits_info .swiper', {
    speed: 800,
    spaceBetween: remToPx(12),
    scrollbar: {
      el: '#benefits .benefits_info .scr_bar',
      draggable: true,
    },
    breakpoints: {
      781: {
        slidesPerView: 2,
        grid: { rows: 2, fill: 'row' }, // ✅ PC에서 2x2
      }
    },
  });

  $(document).off('click.tabMo').on('click.tabMo', '.home_set_tab.mo button', function (e) {
    e.preventDefault();
    const $btn = $(this);
    const idx = $btn.index();
    $btn.addClass('on').siblings().removeClass('on');
    swiper.slideTo(idx);
  });
  swiper.on('slideChange', function () {
    $('.home_set_tab.mo button').eq(swiper.activeIndex).addClass('on').siblings().removeClass('on');
  });

  var swiper1 = new Swiper('#crosssale .swiper', {
    speed: 800,
    spaceBetween: remToPx(12),
    slidesPerView: 1,
    scrollbar: {
      el: '#crosssale .scr_bar',
      draggable: true,
    },
    navigation: {
      nextEl: '#crosssale .nxt',
      prevEl: '#crosssale .prv',
    },
    on: {
      init: function () {
        const total = this.slides.length;
        $('#crosssale .total').text(total.toString().padStart(2, '0'));
        $('#crosssale .crnt').text((this.realIndex + 1).toString().padStart(2, '0'));
      },
      slideChange: function () {
        $('#crosssale .crnt').text((this.realIndex + 1).toString().padStart(2, '0'));
        $('#crosssale .cp_tab li').removeClass('on').eq(this.realIndex).addClass('on');

        tagSpans.removeClass('on').eq(this.realIndex).addClass('on');
      }
    }
  });

  var swiper2 = new Swiper('#homestyling .swiper', {
    speed: 800,
    spaceBetween: remToPx(10),
    slidesPerView: 1,
    pagination: {
      el: '#homestyling .pagi',
      clickable: true,
    },
    navigation: {
      nextEl: '#homestyling .nxt',
      prevEl: '#homestyling .prv',
    },
    breakpoints: {
      781: {
        slidesPerView: 3,
        spaceBetween: remToPx(24),

      }
    },
  });

  var swiper3 = new Swiper('#interior .swiper', {
    speed: 800,
    spaceBetween: remToPx(12),
    pagination: {
      el: '#interior .pagi',
      clickable: true,
    },
    navigation: {
      nextEl: '#interior .nxt',
      prevEl: '#interior .prv',
    },
    breakpoints: {
      781: {
        spaceBetween: remToPx(24),
      }
    },
  });
});