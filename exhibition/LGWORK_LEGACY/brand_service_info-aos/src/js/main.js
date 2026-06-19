$(function () {
  const win = $(window);
  let win_w = win.width();
  const mo_break_point = 780;
  const remToPx = (rem) => rem * parseFloat(getComputedStyle(document.documentElement).fontSize);

  /* 모바일에서만 스와이퍼 */
  if (win_w <= mo_break_point) {
    $('.mo_swiper').addClass('swiper');
    $('.mo_swiper > ul').addClass('swiper-wrapper');
    $('.mo_swiper > ul > li').addClass('swiper-slide');
  }

  /* 버튼 연동 */
  $('[data-pop]').on('click', function () {
    $('.popup_wrap').toggleClass('on');
    $('.popup_wrap .popup').removeClass('on');
  });
  $('[data-btn]').on('click', function () {
    const target = $(this).data('btn');
    $(`[data-toggle="${target}"]`).toggleClass('on');
  });

  /* PC <-> 모바일 전환 시 리로드 */
  // let currentMode = window.innerWidth > mo_break_point ? "pc" : "mo";
  // window.addEventListener("resize", () => {
  //   const newMode = window.innerWidth > mo_break_point ? "pc" : "mo";

  //   if (newMode !== currentMode) {
  //     currentMode = newMode;
  //     location.reload(); // ✅ 새로고침 딱 한 번만
  //   }
  // });

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
    breakpoints: {
      781: {
        spaceBetween: 0,
      },
    }
  });

  /* SERVICE */
  $('.sub_slide').html('<ul class="swiper-wrapper">' + $('.main_slide .swiper-wrapper').html() + '</ul>');

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
    spaceBetween: remToPx(30),
    centeredSlides: true,
    loop: true,
    loopedSlides: 5,
    breakpoints: {
      781: {
        spaceBetween: remToPx(60),
      },
    }
  });
  swiper2.controller.control = swiper2_1;
  swiper2_1.controller.control = swiper2;

  const $vidBox = $('.vid_box');
  const video = $vidBox.find('video')[0];

  const observer = new MutationObserver(m => {
    if ($vidBox.hasClass('aos-animate')) {
      setTimeout(() => video.play(), 1500);
    }
  });

  observer.observe($vidBox[0], { attributes: true, attributeFilter: ['class'] });

  /* AOS */
  AOS.init({ duration: 1000, offset: 100, easing: 'cubic-bezier(0.25, 1, 0.5, 1);' });
  setInterval(function () {
    AOS.refresh();
  }, 1000);
});
