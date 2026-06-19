$(function () {
  const win = $(window);
  let win_w = win.width();
  const mo_break_point = 780;
  const remToPx = (rem) => rem * parseFloat(getComputedStyle(document.documentElement).fontSize);

  $('.brand_focus .coupon_notes button').click(function () {
    $(this).parent('.coupon_notes').toggleClass('on');
  });

  $('.brand_focus_list article').each(function () {
    const $article = $(this);
    const landingUrl = $article.data('landing-url');

    if (!landingUrl) return;

    $article.find('.landing_btn').each(function () {
      $(this).attr('href', landingUrl);
    });
  });
});
