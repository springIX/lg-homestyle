$(function () {
  const win = $(window);
  let win_w = win.width();
  const mo_break_point = 780;
  const remToPx = (rem) => rem * parseFloat(getComputedStyle(document.documentElement).fontSize);

  /* HOME STYLING */
  var swiper = new Swiper('.only_home_style .swiper', {
    pagination: {
      el: '.only_home_style .pagi',
      type: 'bullets',
    },
    navigation: {
      prevEl: '.only_home_style .prv',
      nextEl: '.only_home_style .nxt',
    },
    speed: 1000,
    slidesPerView: "auto",
    centeredSlides: true,
    loop: true,
    loopedSlides: 5,
  });
});
