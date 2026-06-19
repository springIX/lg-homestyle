$(function () {
  const win = $(window);
  let win_w = win.width();
  const mo_break_point = 780;
  const remToPx = (rem) => rem * parseFloat(getComputedStyle(document.documentElement).fontSize);

  $('.products_detail .lamp_box .power_btn').click(function () {
    $(this).closest('.lamp_box').toggleClass('off');
  });

  let bgColors = [
    '#EBE9F8',
    '#E6DCD8',
    '#F7EFE6',
    '#F4F4F4',
    '#EBF9FF'
  ];
  let swiper_tit = $('.check_point .tit_box ol li');
  let swiper = new Swiper('.check_point .swiper', {
    speed: 800,
    pagination: {
      el: '.check_point .pagi',
      clickable: true,
    },
    on: {
      slideChange: function () {
        var idx = this.realIndex;
        $('.check_point .tit_box').css('background-color', bgColors[idx] || '#000');

        swiper_tit.removeClass('active').eq(idx).addClass('active');
      }
    }
  });
  swiper_tit.on('click', function () {
    var idx = $(this).index(); // 0부터 시작
    swiper.slideTo(idx);       // loop 없을 때
  });

});
