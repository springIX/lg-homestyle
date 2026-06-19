$(function () {
  const win = $(window);
  const mo_break_point = 780;
  const remToPx = (rem) => rem * parseFloat(getComputedStyle(document.documentElement).fontSize);

  swiper = new Swiper('#portfolio .swiper', {
    speed: 800,
    slidesPerView: 1,
    slidesPerGroup: 1,
    spaceBetween: remToPx(21),
    scrollbar: {
      el: '#portfolio .scr_bar',
      draggable: true,
    },
    observer: true,
    observeParents: true,
    watchOverflow: true
  });
});