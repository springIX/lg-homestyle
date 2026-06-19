$(function () {
  const win = $(window);
  let win_w = win.width();
  const mo_break_point = 780;
  const remToPx = (rem) => rem * parseFloat(getComputedStyle(document.documentElement).fontSize);

  function initSwipers() {
    /* HOME STYLING */
    var swiper = new Swiper('.home_styling .swiper', {
      pagination: {
        el: '.home_styling .pagi',
        type: 'bullets',
      },
      navigation: {
        prevEl: '.home_styling .prv',
        nextEl: '.home_styling .nxt',
      },
      speed: 1000,
      spaceBetween: remToPx(10),
    });

    /* SERVICE */
    var swiper2 = new Swiper('.service .main_slide', {
      pagination: {
        el: '.service .pagi',
        type: 'bullets',
      },
      navigation: {
        prevEl: '.service .prv',
        nextEl: '.service .nxt',
      },
      speed: 1000,
      loop: true,
      loopedSlides: 5,
      on: {
        activeIndexChange: function () {
          $('.service .txt_box ol li').eq(this.realIndex).addClass('on').siblings().removeClass('on');
        }
      },
    });
    var swiper2_1 = new Swiper('.service .sub_slide', {
      speed: 1000,
      slidesPerView: 5,
      spaceBetween: 30,
      centeredSlides: true,
      loop: true,
      loopedSlides: 5,
    });
    swiper2.controller.control = swiper2_1;
    swiper2_1.controller.control = swiper2;
  }

  setTimeout(function () {
    initSwipers();
  }, 1000)
});
