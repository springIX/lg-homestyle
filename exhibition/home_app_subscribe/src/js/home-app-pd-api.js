(function () {
  'use strict';

  /**
   * 구독 추천 제품 API
   */
  const API_URL =
    'https://apiv2.lge.co.kr'
    + '/subscriptionsvc/ajax/v1/direct-subscription'
    + '/best-ranking-list'
    + '?displaySpaceId=DP_HOME_001'
    + '&titleLinkUrl=subscribe'
    + '&displayObjectLevel=2';

  /**
   * viewCnt별로 API를 호출합니다.
   *
   * viewCnt=5:
   * 상품이 5개 이상 있는 카테고리
   *
   * viewCnt=1:
   * 상품이 1개 이상 있는 전체 카테고리
   */
  const VIEW_COUNTS = [
    5,
    4,
    3,
    2,
    1
  ];

  /**
   * 카테고리별 최대 노출 상품 수
   */
  const MAX_PRODUCT_COUNT = 5;

  /**
   * 모바일 기준
   */
  const MOBILE_BREAKPOINT = 767;

  /**
   * API 요청 제한 시간
   */
  const API_TIMEOUT = 15000;

  const PRODUCT_BASE_URL =
    'https://www.lge.co.kr';

  const IMAGE_BASE_URL =
    'https://static-store.lge.co.kr';

  /**
   * 설치비 별도 노출 상품
   */
  const INSTALLATION_FEE_MODELS = [
    'WD523VCT',
    'WD520VHT'
  ];

  /**
   * 모바일 Swiper 저장
   */
  const productSwipers =
    new Map();

  let resizeTimer = null;

  /**
   * HTML 특수문자 변환
   */
  function escapeHTML(value) {
    const element =
      document.createElement('div');

    element.textContent =
      value == null
        ? ''
        : String(value);

    return element.innerHTML;
  }

  /**
   * ID에서 사용할 수 없는 문자 제거
   */
  function createSafeId(value) {
    return String(value || '')
      .replace(
        /[^a-zA-Z0-9_-]/g,
        '-'
      );
  }

  /**
   * 금액 콤마
   */
  function formatPrice(value) {
    return Number(value || 0)
      .toLocaleString('ko-KR');
  }

  /**
   * 숫자 변환
   */
  function toNumber(value) {
    const number =
      Number(value);

    return Number.isFinite(number)
      ? number
      : 0;
  }

  /**
   * 상품 URL
   */
  function createProductUrl(path) {
    if (!path) {
      return '#';
    }

    if (
      /^https?:\/\//i.test(path)
    ) {
      return path;
    }

    return (
      PRODUCT_BASE_URL
      + (
        String(path).startsWith('/')
          ? path
          : '/' + path
      )
    );
  }

  /**
   * 이미지 URL
   */
  function createImageUrl(path) {
    if (!path) {
      return '';
    }

    if (
      /^https?:\/\//i.test(path)
    ) {
      return path;
    }

    return (
      IMAGE_BASE_URL
      + (
        String(path).startsWith('/')
          ? path
          : '/' + path
      )
    );
  }

  /**
   * 최대혜택가 계산
   */
  function getBenefitPrice(product) {
    const standardPrice =
      toNumber(
        product.subsMmStandardAmt
      );

    const apiBenefitPrice =
      toNumber(
        product.years1TotAmt
      );

    const discountRate =
      toNumber(
        product.subsMmAmtDcRate
      );

    /**
     * 할인율 계산 가격
     * 100원 단위 절사
     */
    const calculatedPrice =
      discountRate > 0
        ? Math.floor(
          (
            standardPrice
            * (1 - discountRate)
          )
          / 100
        ) * 100
        : 0;

    const benefitCandidates = [];

    if (
      apiBenefitPrice > 0
      && (
        standardPrice <= 0
        || apiBenefitPrice
        < standardPrice
      )
    ) {
      benefitCandidates.push(
        apiBenefitPrice
      );
    }

    if (
      calculatedPrice > 0
      && (
        standardPrice <= 0
        || calculatedPrice
        < standardPrice
      )
    ) {
      benefitCandidates.push(
        calculatedPrice
      );
    }

    if (
      benefitCandidates.length
      === 0
    ) {
      return standardPrice;
    }

    /**
     * API 혜택가와 할인율 계산 가격 중
     * 가장 낮은 금액을 최대혜택가로 사용
     */
    return Math.min.apply(
      null,
      benefitCandidates
    );
  }

  /**
   * 상품 HTML
   */
  function createProductHTML(
    product,
    index
  ) {
    const rank =
      index + 1;

    const title =
      product.modelDisplayName
      || product.modelName
      || '';

    const modelCode =
      product.salesModelCode
      || product.modelName
      || '';

    const standardPrice =
      toNumber(
        product.subsMmStandardAmt
      );

    const benefitPrice =
      getBenefitPrice(product);

    const discountRate =
      toNumber(
        product.subsMmAmtDcRate
      );

    const discountPercent =
      Math.round(
        discountRate * 100
      );

    const imagePath =
      product.largeImageAddr
      || product.mediumImageAddr
      || product.smallImageAddr
      || '';

    const imageUrl =
      createImageUrl(imagePath);

    const productUrl =
      createProductUrl(
        product.modelUrlPath
      );

    /**
     * 상품 스펙
     */
    const specs =
      String(
        product.keywdNm
        || ''
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

    /**
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

    /**
     * 최대혜택가
     */
    const benefitPriceHTML =
      benefitPrice > 0
        && (
          standardPrice <= 0
          || benefitPrice
          < standardPrice
        )
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

    /**
     * 설치비 별도
     */
    const installationFeeHTML =
      INSTALLATION_FEE_MODELS
        .includes(modelCode)
        ? `
          <p class="service-products__note">
            설치비 별도
          </p>
        `
        : '';

    const imageHTML =
      imageUrl
        ? `
          <img
            src="${escapeHTML(imageUrl)}"
            class="service-products__image"
            alt="${escapeHTML(title)}"
            loading="lazy"
          >
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
            ${imageHTML}
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

  /**
   * 상품 목록 HTML
   */
  function createProductsHTML(products) {
    if (
      !Array.isArray(products)
      || products.length === 0
    ) {
      return `
        <li class="service-products__empty">
          추천 제품을 준비 중입니다.
        </li>
      `;
    }

    return products
      .slice(
        0,
        MAX_PRODUCT_COUNT
      )
      .map(function (
        product,
        index
      ) {
        return createProductHTML(
          product,
          index
        );
      })
      .join('');
  }

  /**
   * API 요청
   */
  function requestRanking(viewCount) {
    const controller =
      typeof AbortController
        !== 'undefined'
        ? new AbortController()
        : null;

    const timeoutId =
      window.setTimeout(
        function () {
          if (controller) {
            controller.abort();
          }
        },
        API_TIMEOUT
      );

    const requestOptions = {
      method: 'GET',
      credentials: 'omit'
    };

    if (controller) {
      requestOptions.signal =
        controller.signal;
    }

    return fetch(
      API_URL
      + '&viewCnt='
      + viewCount,
      requestOptions
    )
      .then(function (response) {
        if (!response.ok) {
          throw new Error(
            'HTTP '
            + response.status
          );
        }

        return response.json();
      })
      .then(function (response) {
        if (
          !response
          || response.status !== 200
          || !response.data
        ) {
          throw new Error(
            '올바르지 않은 API 응답'
          );
        }

        return {
          viewCount:
            viewCount,

          data:
            response.data
        };
      })
      .catch(function (error) {
        console.error(
          '[구독 추천 제품] API 호출 실패:',
          'viewCnt=' + viewCount,
          error
        );

        return null;
      })
      .finally(function () {
        window.clearTimeout(
          timeoutId
        );
      });
  }

  /**
   * 카테고리와 상품 목록 추출
   */
  function getResponseCategories(
    responseData
  ) {
    if (
      !responseData
      || !responseData.data
    ) {
      return [];
    }

    const data =
      responseData.data;

    const categoryList =
      Array.isArray(
        data.bestRankingCategoryList
      )
        ? data.bestRankingCategoryList
        : [];

    const rankingList =
      Array.isArray(
        data.bestRankingList
      )
        ? data.bestRankingList
        : [];

    return categoryList
      .map(function (
        category,
        index
      ) {
        const categoryId =
          category.displayTargetId
          || category.categoryId
          || '';

        const categoryName =
          category.displayTargetName
          || category.categoryName
          || categoryId;

        let products =
          rankingList[index];

        /**
         * 배열이 아닌 객체 형태로 오는 경우 대응
         */
        if (
          products
          && !Array.isArray(products)
        ) {
          products =
            products.productList
            || products.products
            || products.bestRankingList
            || [];
        }

        return {
          id:
            categoryId,

          name:
            categoryName,

          products:
            Array.isArray(products)
              ? products
              : []
        };
      })
      .filter(function (category) {
        return Boolean(category.id);
      });
  }

  /**
   * 여러 API 응답 병합
   */
  function mergeRankingData(
    responseList
  ) {
    const validResponses =
      responseList.filter(Boolean);

    const categoryMap =
      new Map();

    /**
     * 같은 카테고리 중
     * 상품이 가장 많은 결과를 저장
     */
    validResponses.forEach(
      function (responseData) {
        const categories =
          getResponseCategories(
            responseData
          );

        categories.forEach(
          function (category) {
            const savedCategory =
              categoryMap.get(
                category.id
              );

            if (
              !savedCategory
              || category.products.length
              > savedCategory.products.length
            ) {
              categoryMap.set(
                category.id,
                {
                  id:
                    category.id,

                  name:
                    category.name,

                  products:
                    category.products
                }
              );
            }
          }
        );
      }
    );

    /**
     * viewCnt=1의 순서를 기준으로 사용
     */
    const broadestResponse =
      validResponses.find(
        function (responseData) {
          return (
            responseData.viewCount
            === 1
          );
        }
      );

    const orderedCategoryIds = [];
    const categoryIdSet =
      new Set();

    function addCategoryId(
      categoryId
    ) {
      if (
        !categoryId
        || categoryIdSet.has(
          categoryId
        )
      ) {
        return;
      }

      categoryIdSet.add(
        categoryId
      );

      orderedCategoryIds.push(
        categoryId
      );
    }

    if (broadestResponse) {
      getResponseCategories(
        broadestResponse
      ).forEach(
        function (category) {
          addCategoryId(
            category.id
          );
        }
      );
    }

    /**
     * viewCnt=1에 없는 카테고리도 추가
     */
    validResponses.forEach(
      function (responseData) {
        getResponseCategories(
          responseData
        ).forEach(
          function (category) {
            addCategoryId(
              category.id
            );
          }
        );
      }
    );

    return orderedCategoryIds
      .map(function (categoryId) {
        return categoryMap.get(
          categoryId
        );
      })
      .filter(function (category) {
        return (
          category
          && category.products.length > 0
        );
      });
  }

  /**
   * Swiper 제거
   */
  function destroyProductSwiper(
    container
  ) {
    if (!container) {
      return;
    }

    const swiper =
      productSwipers.get(
        container
      );

    if (
      swiper
      && !swiper.destroyed
    ) {
      swiper.destroy(
        true,
        true
      );
    }

    productSwipers.delete(
      container
    );

    container.classList.remove(
      'swiper',
      'swiper-container'
    );

    const wrapper =
      container.querySelector(
        '.service-products'
      );

    if (wrapper) {
      wrapper.classList.remove(
        'swiper-wrapper'
      );

      wrapper.removeAttribute(
        'style'
      );
    }

    container
      .querySelectorAll(
        '.service-products__item'
      )
      .forEach(function (item) {
        item.classList.remove(
          'swiper-slide',
          'swiper-slide-active',
          'swiper-slide-next',
          'swiper-slide-prev',
          'swiper-slide-visible'
        );

        item.removeAttribute(
          'style'
        );
      });

    const pagination =
      container.querySelector(
        '.service-products-swiper__pagination'
      );

    if (pagination) {
      pagination.innerHTML = '';

      pagination.removeAttribute(
        'style'
      );
    }
  }

  /**
   * 모든 Swiper 제거
   */
  function destroyAllProductSwipers() {
    Array.from(
      productSwipers.keys()
    ).forEach(
      function (container) {
        destroyProductSwiper(
          container
        );
      }
    );
  }

  /**
   * 모바일 Swiper 생성
   */
  function initProductSwiper(
    panel
  ) {
    if (
      !panel
      || window.innerWidth
      > MOBILE_BREAKPOINT
      || typeof window.Swiper
      === 'undefined'
    ) {
      return;
    }

    const container =
      panel.querySelector(
        '.service-products-swiper'
      );

    if (!container) {
      return;
    }

    const wrapper =
      container.querySelector(
        '.service-products'
      );

    const items =
      container.querySelectorAll(
        '.service-products__item'
      );

    /**
     * 상품이 하나면 Swiper 생성 안 함
     */
    if (
      !wrapper
      || items.length < 2
    ) {
      destroyProductSwiper(
        container
      );

      return;
    }

    const savedSwiper =
      productSwipers.get(
        container
      );

    if (
      savedSwiper
      && !savedSwiper.destroyed
    ) {
      savedSwiper.update();

      if (savedSwiper.pagination) {
        savedSwiper.pagination.render();
        savedSwiper.pagination.update();
      }

      return;
    }

    container.classList.add(
      'swiper'
    );

    wrapper.classList.add(
      'swiper-wrapper'
    );

    items.forEach(function (item) {
      item.classList.add(
        'swiper-slide'
      );
    });

    const pagination =
      container.querySelector(
        '.service-products-swiper__pagination'
      );

    const swiper =
      new window.Swiper(
        container,
        {
          slidesPerView:
            'auto',

          spaceBetween:
            8,

          speed:
            500,

          observer:
            true,

          observeParents:
            true,

          watchOverflow:
            true,

          pagination:
            pagination
              ? {
                el:
                  pagination,

                type:
                  'progressbar'
              }
              : undefined
        }
      );

    productSwipers.set(
      container,
      swiper
    );
  }

  /**
   * 화면 크기에 따라 Swiper 처리
   */
  function syncProductSwipers(
    panels
  ) {
    const isMobile =
      window.innerWidth
      <= MOBILE_BREAKPOINT;

    panels.forEach(
      function (panel) {
        const container =
          panel.querySelector(
            '.service-products-swiper'
          );

        if (!container) {
          return;
        }

        if (!isMobile) {
          destroyProductSwiper(
            container
          );

          return;
        }

        if (!panel.hidden) {
          initProductSwiper(
            panel
          );
        }
      }
    );
  }

  /**
   * 전체 초기화
   */
  function initServiceProducts() {
    /**
     * 추천 제품 영역만 정확하게 선택
     *
     * data-service-tabs-root는
     * 케어, FAQ에도 사용 중이므로
     * 단독으로 선택하면 안 됨
     */
    const root =
      document.querySelector(
        '.service-products-tabs[data-service-tabs-root]'
      );

    if (!root) {
      console.error(
        '[구독 추천 제품] '
        + '.service-products-tabs 영역을 찾을 수 없습니다.'
      );

      return;
    }

    const tabsRoot =
      root.querySelector(
        '[data-service-tabs]'
      );

    const panelsRoot =
      root.querySelector(
        '[data-service-panels]'
      );

    if (!tabsRoot) {
      console.error(
        '[구독 추천 제품] '
        + '[data-service-tabs] 영역을 찾을 수 없습니다.'
      );

      return;
    }

    if (!panelsRoot) {
      console.error(
        '[구독 추천 제품] '
        + '[data-service-panels] 영역을 찾을 수 없습니다.'
      );

      return;
    }

    /**
     * 필요한 HTML을 모두 찾은 다음
     * 중복 실행 여부 확인
     */
    if (
      root.dataset
        .serviceProductsInitialized
      === 'true'
    ) {
      return;
    }

    root.dataset
      .serviceProductsInitialized =
      'true';

    let buttons = [];
    let panels = [];

    /*
     * 여기 아래부터 기존 코드의
     * 탭 활성화 함수가 그대로 이어짐
     */
    function activateTab(
      button,
      shouldFocus
    ) {
      if (!button) {
        return;
      }

      const panelId =
        button.getAttribute(
          'aria-controls'
        );

      const activePanel =
        document.getElementById(
          panelId
        );

      if (!activePanel) {
        return;
      }

      buttons.forEach(
        function (tabButton) {
          const isActive =
            tabButton === button;

          tabButton.classList.toggle(
            'is-active',
            isActive
          );

          tabButton.setAttribute(
            'aria-selected',
            isActive
              ? 'true'
              : 'false'
          );

          tabButton.setAttribute(
            'tabindex',
            isActive
              ? '0'
              : '-1'
          );
        }
      );

      panels.forEach(
        function (panel) {
          panel.hidden =
            panel !== activePanel;
        }
      );

      if (shouldFocus) {
        button.focus();
      }

      window.requestAnimationFrame(
        function () {
          syncProductSwipers(
            panels
          );

          const container =
            activePanel.querySelector(
              '.service-products-swiper'
            );

          const swiper =
            productSwipers.get(
              container
            );

          if (
            swiper
            && !swiper.destroyed
          ) {
            swiper.update();

            swiper.slideTo(
              0,
              0
            );

            if (swiper.pagination) {
              swiper.pagination.render();
              swiper.pagination.update();
            }
          }
        }
      );
    }

    /**
     * 카테고리 렌더링
     */
    function renderCategories(
      categories
    ) {
      destroyAllProductSwipers();

      if (
        !Array.isArray(categories)
        || categories.length === 0
      ) {
        tabsRoot.innerHTML = '';

        panelsRoot.innerHTML = `
          <p
            class="service-products__empty"
            role="status"
          >
            추천 제품을 준비 중입니다.
          </p>
        `;

        buttons = [];
        panels = [];

        return;
      }

      const buttonHTML = [];
      const panelHTML = [];

      categories.forEach(
        function (
          category,
          index
        ) {
          const safeCategoryId =
            createSafeId(
              category.id
            );

          const buttonId =
            'service-products-tab-'
            + safeCategoryId;

          const panelId =
            'service-products-panel-'
            + safeCategoryId;

          const isFirst =
            index === 0;

          buttonHTML.push(`
            <button
              type="button"
              class="service-tabs__button${isFirst ? ' is-active' : ''}"
              role="tab"
              id="${escapeHTML(buttonId)}"
              aria-selected="${isFirst ? 'true' : 'false'}"
              aria-controls="${escapeHTML(panelId)}"
              tabindex="${isFirst ? '0' : '-1'}"
            >
              ${escapeHTML(category.name)}
            </button>
          `);

          panelHTML.push(`
            <div
              id="${escapeHTML(panelId)}"
              class="service-tabs__panel"
              role="tabpanel"
              aria-labelledby="${escapeHTML(buttonId)}"
              tabindex="0"
              data-category-id="${escapeHTML(category.id)}"
              ${isFirst ? '' : 'hidden'}
            >
              <div class="service-products-swiper">
                <ol
                  class="service-products"
                  aria-label="${escapeHTML(category.name)} 구독 추천 제품 순위"
                  aria-live="polite"
                >
                  ${createProductsHTML(category.products)}
                </ol>

                <div
                  class="service-products-swiper__pagination"
                  aria-hidden="true"
                ></div>
              </div>
            </div>
          `);
        }
      );

      tabsRoot.innerHTML =
        buttonHTML.join('');

      panelsRoot.innerHTML =
        panelHTML.join('');

      buttons =
        Array.from(
          tabsRoot.querySelectorAll(
            '.service-tabs__button'
          )
        );

      panels =
        Array.from(
          panelsRoot.querySelectorAll(
            '.service-tabs__panel'
          )
        );

      syncProductSwipers(
        panels
      );
    }

    /**
     * 탭 클릭
     */
    tabsRoot.addEventListener(
      'click',
      function (event) {
        const button =
          event.target.closest(
            '.service-tabs__button'
          );

        if (
          !button
          || !tabsRoot.contains(button)
        ) {
          return;
        }

        activateTab(
          button,
          false
        );
      }
    );

    /**
     * 탭 키보드 접근성
     */
    tabsRoot.addEventListener(
      'keydown',
      function (event) {
        const button =
          event.target.closest(
            '.service-tabs__button'
          );

        if (
          !button
          || buttons.length === 0
        ) {
          return;
        }

        const currentIndex =
          buttons.indexOf(
            button
          );

        let nextIndex =
          currentIndex;

        if (
          event.key === 'ArrowRight'
        ) {
          nextIndex =
            (
              currentIndex + 1
            )
            % buttons.length;
        }

        if (
          event.key === 'ArrowLeft'
        ) {
          nextIndex =
            (
              currentIndex
              - 1
              + buttons.length
            )
            % buttons.length;
        }

        if (
          event.key === 'Home'
        ) {
          nextIndex = 0;
        }

        if (
          event.key === 'End'
        ) {
          nextIndex =
            buttons.length - 1;
        }

        if (
          nextIndex === currentIndex
        ) {
          return;
        }

        event.preventDefault();

        activateTab(
          buttons[nextIndex],
          true
        );
      }
    );

    /**
     * 리사이즈 대응
     */
    window.addEventListener(
      'resize',
      function () {
        window.clearTimeout(
          resizeTimer
        );

        resizeTimer =
          window.setTimeout(
            function () {
              syncProductSwipers(
                panels
              );
            },
            150
          );
      }
    );

    /**
     * API 전체 호출
     */
    function loadAllCategories() {
      root.classList.add(
        'is-loading'
      );

      const requests =
        VIEW_COUNTS.map(
          function (viewCount) {
            return requestRanking(
              viewCount
            );
          }
        );

      Promise
        .all(requests)
        .then(function (
          responseList
        ) {
          const categories =
            mergeRankingData(
              responseList
            );

          console.log(
            '[구독 추천 제품] 카테고리:',
            categories
          );

          renderCategories(
            categories
          );
        })
        .catch(function (error) {
          console.error(
            '[구독 추천 제품] 전체 처리 실패:',
            error
          );

          tabsRoot.innerHTML = '';

          panelsRoot.innerHTML = `
            <p
              class="service-products__empty"
              role="alert"
            >
              제품 정보를 불러오지 못했습니다.
            </p>
          `;
        })
        .finally(function () {
          root.classList.remove(
            'is-loading'
          );
        });
    }

    loadAllCategories();
  }

  /**
   * HTML 생성 후 실행
   */
  if (
    document.readyState
    === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      initServiceProducts,
      {
        once: true
      }
    );
  } else {
    initServiceProducts();
  }
})();