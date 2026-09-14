(function () {
  const API_URL =
    'https://apiv2.lge.co.kr'
    + '/subscriptionsvc/ajax/v1/direct-subscription'
    + '/best-ranking-list'
    + '?displaySpaceId=DP_HOME_001'
    + '&titleLinkUrl=subscribe'
    + '&displayObjectLevel=2'
    + '&viewCnt=5';

  const PRODUCT_BASE_URL = 'https://www.lge.co.kr';
  const IMAGE_BASE_URL = 'https://static-store.lge.co.kr';

  /*
   * 설치비 별도 노출 상품
   * API의 salesModelCode 기준
   */
  const INSTALLATION_FEE_MODELS = [
    'WD523VCT',
    'WD520VHT'
  ];

  const $tabs = $('[data-service-tabs]');
  const $buttons = $tabs.find(
    '.service-tabs__button'
  );
  const $panels = $('.service-tabs__panel');

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
   * 일반 구독료와 혜택가 차이로 할인율 계산
   */
  function getDiscountRate(
    standardPrice,
    benefitPrice
  ) {
    if (
      !standardPrice ||
      !benefitPrice ||
      benefitPrice >= standardPrice
    ) {
      return 0;
    }

    return Math.round(
      (
        1
        - benefitPrice / standardPrice
      )
      * 100
    );
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

    const standardPrice = Number(
      product.subsMmStandardAmt || 0
    );

    const benefitPrice = Number(
      product.years1TotAmt
      || standardPrice
    );

    const discountRate =
      getDiscountRate(
        standardPrice,
        benefitPrice
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
      discountRate > 0
        ? `
          <span class="service-products__discount">
            ${discountRate}%
          </span>
        `
        : '';

    /*
     * 최대혜택가
     * 일반 구독료와 금액이 다를 때만 노출
     */
    const benefitPriceHTML =
      benefitPrice > 0
        && benefitPrice !== standardPrice
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
   * API 카테고리와 HTML 패널 연결
   */
  function renderAllCategories(data) {
    const categoryList =
      data.bestRankingCategoryList || [];

    const rankingList =
      data.bestRankingList || [];

    const rankingMap = {};

    categoryList.forEach(
      function (category, index) {
        rankingMap[
          category.displayTargetId
        ] = rankingList[index] || [];
      }
    );

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

  /*
   * API 호출
   */
  $.ajax({
    url: API_URL,
    method: 'GET',
    dataType: 'json'
  })
    .done(function (response) {
      if (
        response.status !== 200
        || !response.data
      ) {
        console.error(
          '[구독 추천 제품] API 응답 오류:',
          response.message
        );

        $panels.each(function () {
          $(this)
            .find('.service-products')
            .html(`
              <li class="service-products__empty">
                제품 정보를 불러오지 못했습니다.
              </li>
            `);
        });

        return;
      }

      renderAllCategories(
        response.data
      );
    })
    .fail(
      function (
        xhr,
        status,
        error
      ) {
        console.error(
          '[구독 추천 제품] API 호출 실패:',
          status,
          error
        );

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
    )
    .always(function () {
      $panels.removeClass(
        'is-loading'
      );
    });
})();