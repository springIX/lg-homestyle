$(function () {
  const win = $(window);
  let win_w = win.width();
  const mo_break_point = 780;
  const remToPx = (rem) => rem * parseFloat(getComputedStyle(document.documentElement).fontSize);

  $('.lexon_jeffkoons_container .floating_btn').addClass('on');

  $('#product_details article').each(function () {
    const $article = $(this);

    $article.find('.info_box li').click(function () {
      const index = $(this).index();

      // li on
      $article.find('.info_box li').removeClass('on');
      $(this).addClass('on');

      // img on
      $article.find('.img_box img').removeClass('on')
        .eq(index).addClass('on');
    });
  });

  let swiper = new Swiper('#check_point .swiper', {
    speed: 1000,
    spaceBetween: remToPx(21),
    pagination: {
      el: '#check_point .pagi',
      clickable: true,
    },
  });
});
