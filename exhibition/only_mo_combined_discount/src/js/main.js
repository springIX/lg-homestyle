$(function () {
  const win = $(window);
  const mo_break_point = 780;
  const remToPx = (rem) => rem * parseFloat(getComputedStyle(document.documentElement).fontSize);

  let swiper = null; // Swiper 인스턴스를 저장

  function initSwiper() {
    if (!swiper) { // 이미 없을 때만 새로 생성
      swiper = new Swiper('.how_to_apply .swiper', {
        speed: 800,
        spaceBetween: remToPx(8),
        slidesPerView: 1,
        pagination: {
          el: '.how_to_apply .pagi',
          clickable: true,
        },
      });
    }
  }

  // 초기 실행
  initSwiper();

  // 화면 리사이즈 시 실시간 적용 (디바운스 적용)
  let resizeTimer;
  win.on('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      initSwiper();
    }, 500);
  });
  const tagSpans = $('.review .tag_pagi span');
  var swiper2 = new Swiper('.review .swiper', {
    speed: 800,
    pagination: {
      el: '.review .pagi',
      clickable: true,
    },
    autoHeight: true,
    spaceBetween: remToPx(20),
    navigation: {
      prevEl: '.review .prv',
      nextEl: '.review .nxt',
    },
    on: {
      init: function () {
        const total = this.slides.length;
        $('.review .total').text(total.toString().padStart(2, '0'));
        $('.review .crnt').text((this.realIndex + 1).toString().padStart(2, '0'));
      },
      slideChange: function () {
        $('.review .crnt').text((this.realIndex + 1).toString().padStart(2, '0'));
        $('.review .cp_tab li').removeClass('on').eq(this.realIndex).addClass('on');

        tagSpans.removeClass('on').eq(this.realIndex).addClass('on');
      }
    }
  });
  tagSpans.on('click', function () {
    const idx = $(this).index();
    tagSpans.removeClass('on');
    $(this).addClass('on');
    swiper2.slideTo(idx);
  });
});
