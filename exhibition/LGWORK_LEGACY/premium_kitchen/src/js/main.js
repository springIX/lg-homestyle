$(function () {
  const win = $(window);
  let win_w = win.width();
  const mo_break_point = 780;
  const remToPx = (rem) => rem * parseFloat(getComputedStyle(document.documentElement).fontSize);

  var swiper = new Swiper('.kitchen_renovation_reviews .swiper', {
    speed: 800,
    spaceBetween: 10,
    pagination: {
      el: '.kitchen_renovation_reviews .pagi',
      clickable: true,
    },
    navigation: {
      nextEl: '.kitchen_renovation_reviews .nxt',
      prevEl: '.kitchen_renovation_reviews .prv',
    },
  });

  var swiper2 = new Swiper('.all_about_kitchen .swiper', {
    speed: 800,
    spaceBetween: 20,
    pagination: {
      el: '.all_about_kitchen .pagi',
      clickable: true,
    },
  });
});
