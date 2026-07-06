$(function () {
  const win = $(window);
  let win_w = win.width();
  const mo_break_point = 780;
  const remToPx = (rem) => rem * parseFloat(getComputedStyle(document.documentElement).fontSize);

  var swiper = new Swiper('#ending .swiper', {
    speed: 1000,
    spaceBetween: remToPx(10),
    scrollbar: {
      el: '#ending .scr_bar',
      draggable: true,
    },
  });

  // 새 인터렉션
  $(document).on('click', '.notice_box button', function (e) {
    e.preventDefault();
    $(this).closest('.notice_box').toggleClass('on');
  });
});
