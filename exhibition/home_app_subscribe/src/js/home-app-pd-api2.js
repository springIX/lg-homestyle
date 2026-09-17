(function () {
  const API_URL =
    'https://apiv2stg.lge.co.kr'
    + '/subscriptionsvc/ajax/v1/direct-subscription'
    + '/best-ranking-list'
    + '?displaySpaceId=DP_HOME_001'
    + '&titleLinkUrl=subscribe'
    + '&displayObjectLevel=2'

  const VIEW_COUNTS = [5, 4, 3];
  const PRODUCT_BASE_URL = 'https://www.lge.co.kr';
  const IMAGE_BASE_URL = 'https://static-store.lge.co.kr';
  const MOBILE_BREAKPOINT = 767;
  const productSwipers = new Map();

  /*
   * 설치비 별도 노출 상품
   * API의 salesModelCode 기준
   */
  const INSTALLATION_FEE_MODELS = [
    'WD523VCT',
    'WD520VHT'
  ];

  const $serviceTabs = $(
    '.service-products-tabs'
  );

  const $tabs = $serviceTabs.find(
    '[data-service-tabs]'
  );

  const $buttons = $tabs.find(
    '.service-tabs__button'
  );

  const $panels = $serviceTabs.children(
    '.service-tabs__panel'
  );

  if (!$tabs.length || !$panels.length) {
    return;
  }

  /*
   * HTML 특수문자 처리
   */
  function escapeHTML(value) {
    return $('<div>')
      .text(
        value == null
          ? ''
          : String(value)
      )
      .html();
  }

  /*
   * 금액에 콤마 표시
   */
  function formatPrice(value) {
    return Number(value || 0)
      .toLocaleString('ko-KR');
  }

  /*
   * 상품 HTML 생성
   */
  function createProductHTML(
    product,
    index
  ) {
    const rank = index + 1;

    const title =
      product.modelDisplayName || '';

    const modelCode =
      product.salesModelCode
      || product.modelName
      || '';

    /*
     * 할인 전 월 구독료
     */
    const standardPrice = Number(
      product.subsMmStandardAmt || 0
    );

    /*
     * API에서 내려주는 혜택가
     */
    const apiBenefitPrice = Number(
      product.years1TotAmt || 0
    );

    /*
     * API 할인율
     * 0.5 → 50%
     * 0.12 → 12%
     */
    const discountRate = Number(
      product.subsMmAmtDcRate || 0
    );

    const discountPercent = Math.round(
      discountRate * 100
    );

    /*
     * 할인율을 적용한 금액
     * PDP와 동일하게 100원 단위 절사
     */
    const calculatedBenefitPrice =
      discountRate > 0
        ? Math.floor(
          standardPrice
          * (1 - discountRate)
          / 100
        ) * 100
        : standardPrice;

    /*
     * API 혜택가가 원가보다 낮으면
     * 계산한 금액과 비교해 더 낮은 금액 사용
     *
     * API 혜택가가 원가와 같다면
     * 할인율로 계산한 금액 사용
     */
    const benefitPrice =
      discountRate > 0
        ? (
          apiBenefitPrice > 0
            && apiBenefitPrice < standardPrice
            ? Math.min(
              apiBenefitPrice,
              calculatedBenefitPrice
            )
            : calculatedBenefitPrice
        )
        : (
          apiBenefitPrice
          || standardPrice
        );

    const imagePath =
      product.largeImageAddr
      || product.mediumImageAddr
      || product.smallImageAddr
      || '';

    const productUrl =
      PRODUCT_BASE_URL
      + (product.modelUrlPath || '');

    const imageUrl =
      IMAGE_BASE_URL
      + imagePath;

    /*
     * keywdNm 예시:
     * 865L^1등급
     */
    const specs = String(
      product.keywdNm || ''
    )
      .split('^')
      .map(function (value) {
        return value.trim();
      })
      .filter(Boolean)
      .map(function (value) {
        return `
          <span class="service-products__spec">
            ${escapeHTML(value)}
          </span>
        `;
      })
      .join('');

    /*
     * 할인율
     */
    const discountHTML =
      discountPercent > 0
        ? `
      <span class="service-products__discount">
        ${discountPercent}%
      </span>
    `
        : '';

    /*
     * 최대혜택가
     * 일반 구독료와 금액이 다를 때만 노출
     */
    const benefitPriceHTML =
      benefitPrice > 0
        && benefitPrice < standardPrice
        ? `
          <p class="service-products__benefit-price">
            <span>최대혜택가</span>

            <strong>
              ${formatPrice(benefitPrice)}
              <small>원</small>
            </strong>
          </p>
        `
        : '';

    /*
     * 설치비 별도
     * 지정한 상품에만 노출
     */
    const hasInstallationFee =
      INSTALLATION_FEE_MODELS.includes(
        product.salesModelCode
      );

    const installationFeeHTML =
      hasInstallationFee
        ? `
          <p class="service-products__note">
            설치비 별도
          </p>
        `
        : '';

    return `
      <li class="service-products__item">
        <a
          href="${escapeHTML(productUrl)}"
          class="service-products__link"
          aria-label="${rank}위 ${escapeHTML(title)} 자세히 보기"
        >
          <div class="service-products__media">
            <img
              src="${escapeHTML(imageUrl)}"
              class="service-products__image"
              alt="${escapeHTML(title)}"
              loading="lazy"
            >
          </div>

          <div class="service-products__info">
            <strong class="service-products__title">
              ${escapeHTML(title)}
              ${specs}
            </strong>

            <div class="service-products__meta">
              <span class="service-products__model">
                ${escapeHTML(modelCode)}
              </span>
            </div>

            <div class="service-products__prices">
              <p class="service-products__price">
                ${discountHTML}

                <strong>
                  ${formatPrice(standardPrice)}
                  <small>원</small>
                </strong>
              </p>

              ${benefitPriceHTML}
            </div>

            ${installationFeeHTML}
          </div>
        </a>
      </li>
    `;
  }

  /*
   * 카테고리별 상품 출력
   */
  function renderProducts(
    $panel,
    products
  ) {
    const $productList = $panel.find(
      '.service-products'
    );

    if (!products.length) {
      $productList.html(`
        <li class="service-products__empty">
          추천 제품을 준비 중입니다.
        </li>
      `);

      return;
    }

    const productHTML = products
      .slice(0, 5)
      .map(function (product, index) {
        return createProductHTML(
          product,
          index
        );
      })
      .join('');

    $productList.html(productHTML);
  }

  /*
   * 모바일 상품 스와이퍼
   */
  function destroyProductSwiper(container) {
    const swiper = productSwipers.get(
      container
    );

    if (swiper) {
      swiper.destroy(true, true);
      productSwipers.delete(container);
    }

    const $container = $(container);

    $container.removeClass(
      'swiper-container'
    );

    $container
      .find('.service-products')
      .removeClass('swiper-wrapper');

    $container
      .find('.service-products__item')
      .removeClass('swiper-slide');
  }

  function initProductSwiper($panel) {
    const container = $panel
      .find('.service-products-swiper')
      .get(0);

    if (
      !container
      || window.innerWidth > MOBILE_BREAKPOINT
      || typeof Swiper === 'undefined'
    ) {
      return;
    }

    const $container = $(container);
    const $items = $container.find(
      '.service-products__item'
    );

    if ($items.length < 2) {
      return;
    }

    if (productSwipers.has(container)) {
      productSwipers.get(container).update();
      return;
    }

    $container.addClass('swiper-container');
    $container
      .find('.service-products')
      .addClass('swiper-wrapper');
    $items.addClass('swiper-slide');

    const swiper = new Swiper(container, {
      slidesPerView: 'auto',
      spaceBetween: 8,
      speed: 500,
      observer: true,
      observeParents: true,
      pagination: {
        el: $container
          .find('.service-products-swiper__pagination')
          .get(0),
        type: 'progressbar'
      }
    });

    productSwipers.set(
      container,
      swiper
    );
  }

  function syncProductSwipers() {
    const isMobile =
      window.innerWidth <= MOBILE_BREAKPOINT;

    $panels.each(function () {
      const $panel = $(this);
      const container = $panel
        .find('.service-products-swiper')
        .get(0);

      if (!container) {
        return;
      }

      if (!isMobile) {
        destroyProductSwiper(container);
        return;
      }

      if (!$panel.prop('hidden')) {
        initProductSwiper($panel);
      }
    });
  }

  /*
   * API 카테고리와 HTML 패널 연결
   */
  /*
   * 여러 API 응답을 합쳐서
   * 카테고리별 상품이 가장 많은 결과 사용
   */
  function renderAllCategories(dataList) {
    const rankingMap = {};

    dataList.forEach(function (data) {
      const categoryList =
        data.bestRankingCategoryList || [];

      const rankingList =
        data.bestRankingList || [];

      categoryList.forEach(
        function (category, index) {
          const categoryId =
            category.displayTargetId;

          const products =
            rankingList[index] || [];

          /*
           * 기존 결과보다 상품이 많을 때만 저장
           */
          if (
            !rankingMap[categoryId]
            || products.length
            > rankingMap[categoryId].length
          ) {
            rankingMap[categoryId] =
              products;
          }
        }
      );
    });

    $panels.each(function () {
      const $panel = $(this);

      const categoryId =
        $panel.attr('data-category-id');

      const products =
        rankingMap[categoryId] || [];

      renderProducts(
        $panel,
        products
      );
    });
  }

  /*
   * 탭 활성화
   */
  function activateTab($button) {
    const panelId =
      $button.attr('aria-controls');

    $buttons
      .removeClass('is-active')
      .attr({
        'aria-selected': 'false',
        tabindex: '-1'
      });

    $button
      .addClass('is-active')
      .attr({
        'aria-selected': 'true',
        tabindex: '0'
      });

    $panels.prop('hidden', true);

    $('#' + panelId)
      .prop('hidden', false);

    window.requestAnimationFrame(
      syncProductSwipers
    );
  }

  /*
   * 탭 클릭
   */
  $buttons.on(
    'click',
    function () {
      activateTab($(this));
    }
  );

  /*
   * 탭 키보드 접근성
   */
  $buttons.on(
    'keydown',
    function (event) {
      const currentIndex =
        $buttons.index(this);

      let nextIndex =
        currentIndex;

      if (event.key === 'ArrowRight') {
        nextIndex =
          (currentIndex + 1)
          % $buttons.length;
      }

      if (event.key === 'ArrowLeft') {
        nextIndex =
          (
            currentIndex
            - 1
            + $buttons.length
          )
          % $buttons.length;
      }

      if (event.key === 'Home') {
        nextIndex = 0;
      }

      if (event.key === 'End') {
        nextIndex =
          $buttons.length - 1;
      }

      if (nextIndex === currentIndex) {
        return;
      }

      event.preventDefault();

      const $nextButton =
        $buttons.eq(nextIndex);

      activateTab($nextButton);
      $nextButton.trigger('focus');
    }
  );

  /*
   * 로딩 상태
   */
  $panels.addClass('is-loading');

  const rankingDataList = [];

  let completedRequestCount = 0;
  let successRequestCount = 0;

  /*
   * 5개부터 1개까지 각각 요청
   *
   * 5개가 있는 카테고리 → 5개
   * 3개만 있는 카테고리 → 3개
   * 2개만 있는 카테고리 → 2개
   * 1개만 있는 카테고리 → 1개
   */
  VIEW_COUNTS.forEach(function (viewCount) {
    $.ajax({
      url:
        API_URL
        + '&viewCnt='
        + viewCount,
      method: 'GET',
      dataType: 'json'
    })
      .done(function (response) {
        if (
          response.status === 200
          && response.data
        ) {
          rankingDataList.push(
            response.data
          );

          successRequestCount += 1;
        }
      })
      .fail(function (
        xhr,
        status,
        error
      ) {
        console.error(
          '[구독 추천 제품] API 호출 실패:',
          'viewCnt=' + viewCount,
          status,
          error
        );
      })
      .always(function () {
        completedRequestCount += 1;

        /*
         * 모든 요청이 끝난 후 한 번만 렌더링
         */
        if (
          completedRequestCount
          !== VIEW_COUNTS.length
        ) {
          return;
        }

        if (successRequestCount > 0) {
          renderAllCategories(
            rankingDataList
          );

          syncProductSwipers();
        } else {
          $panels.each(function () {
            $(this)
              .find('.service-products')
              .html(`
              <li class="service-products__empty">
                제품 정보를 불러오지 못했습니다.
              </li>
            `);
          });
        }

        $panels.removeClass(
          'is-loading'
        );
      });
  });

  let resizeTimer;

  $(window).on('resize', function () {
    window.clearTimeout(resizeTimer);

    resizeTimer = window.setTimeout(
      syncProductSwipers,
      150
    );
  });
})();
