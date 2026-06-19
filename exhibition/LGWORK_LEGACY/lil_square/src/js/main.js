$(function () {
  const win = $(window);
  const mo_break_point = 780;
  const remToPx = (rem) => rem * parseFloat(getComputedStyle(document.documentElement).fontSize);

  const $swiper = $('#portfolio .swiper');
  const $wrapper = $('#portfolio .swiper .swiper-wrapper');

  let swiper = null;
  const originHtml = $wrapper.html();

  function buildSlides() {
    const isMo = win.width() <= mo_break_point;
    const groupSize = isMo ? 6 : 9;
    const cols = isMo ? 2 : 3;

    // 원본 복원
    $wrapper.html(originHtml);

    const $items = $wrapper.children('.swiper-slide');
    const groups = [];

    $items.each(function (i) {
      const groupIndex = Math.floor(i / groupSize);

      if (!groups[groupIndex]) {
        groups[groupIndex] = $(`
          <div class="swiper-slide">
            <div class="portfolio_grid_page cols-${cols}"></div>
          </div>
        `);
      }

      const $item = $(this).clone(true, true);
      $item.removeClass('swiper-slide').addClass('portfolio_item');
      groups[groupIndex].find('.portfolio_grid_page').append($item);
    });

    $wrapper.empty().append(groups);
  }

  function initSwiper() {
    const isMo = win.width() <= mo_break_point;

    swiper = new Swiper('#portfolio .swiper', {
      speed: 800,
      slidesPerView: isMo ? 1.05 : 1,
      slidesPerGroup: 1,
      spaceBetween: remToPx(12),
      scrollbar: {
        el: '#portfolio .scr_bar',
        draggable: true,
      },
      observer: true,
      observeParents: true,
      watchOverflow: true
    });
  }

  function setPortfolioSlides() {
    if (swiper) {
      swiper.destroy(true, true);
      swiper = null;
    }

    buildSlides();

    setTimeout(() => {
      initSwiper();
      swiper.update();
    }, 30);
  }

  setPortfolioSlides();

  let resizeTimer = null;
  win.on('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      setPortfolioSlides();
    }, 200);
  });
});