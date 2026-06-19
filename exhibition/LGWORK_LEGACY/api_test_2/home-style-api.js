(() => {
  /**
   * @description 상품 데이터 조회 API 서비스 클래스
   * API 통신과 관련된 로직만을 전담합니다.
   */
  class HomeStyleProductApi {
    constructor() {
      this.baseUrl = 'https://livingapi.lge.co.kr';
      this.imageBaseUrl = 'https://static-store.lge.co.kr'; // 이미지 경로
      this.endpoints = {
        goods: '/itemsvc/ajax/v2/goods',
      };
    }

    /**
     * 공통 요청 처리 및 에러 핸들링
     * @param {string} url - 요청 URL
     * @param {object} options - fetch 옵션
     * @returns {Promise<object|null>} 응답 데이터
     */
    async #request(url, options = {}) {
      try {
        // console.log(`[HomeStyleProductApi.request] 요청 시작: ${url}`);

        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        // console.log('[HomeStyleProductApi.request] 요청 성공');

        return data;
      } catch (error) {
        console.error(`[HomeStyleProductApi.request] 통신 오류: ${error.message}`);
        return null;
      }
    }

    /**
     * 상품 목록 조회 (Bulk)
     * @param {string[]} goodsNos - 상품 번호 목록
     * @returns {Promise<object[]|null>} 상품 목록 데이터
     */
    async fetchProducts(goodsNos) {
      if (!goodsNos || !Array.isArray(goodsNos) || goodsNos.length === 0) {
        console.log('[HomeStyleProductApi.fetchProducts] 상품 번호 목록이 유효하지 않음');
        return null;
      }

      const url = `${this.baseUrl}${this.endpoints.goods}`;
      const response = await this.#request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ goodsNos })
      });

      return response && response.data ? response.data : null;
    }
  }

  /**
   * @description DOM 조작 및 UI 렌더링을 담당하는 클래스
   * 비즈니스 로직(데이터 페칭)과 뷰 로직(렌더링)을 분리합니다.
   */
  class HomeStyleProductUIController {
    /**
     * CSS 셀렉터 상수
     */
    static SELECTORS = {
      PRODUCT_WRAPPER: '.c-product--home-style',
      PRODUCT_ITEM: '.c-product--home-style .c-product__item',
      MAIN_SPAN: 'span[data-home-style-product]',
      MAIN_LINK: 'span[data-home-style-product] > a',
      IMAGE_WRAPPER: '.c-product__image-wrapper',
      PRODUCT_BRAND_NAME: '.c-product__brand-name',
      PRODUCT_NAME: '.c-product__name',
      PRICE_AREA: '.c-product__price-area',
      BADGE_CONTAINER: '.c-product__badge-container',
      SOLD_OUT_TEXT: '.c-product__sold-out-hidden-txt',
      IMAGE_VISUAL: '.c-product__visual',
      INFO_LINK: '.c-product__info-container > a',
    };

    /**
     * 상태 클래스 상수
     */
    static CLASSES = {
      LOADING: 'c-product__item--loading',
      ERROR: 'c-product__item--error',
      SOLD_OUT: 'c-product__item--sold-out',
    };

    #useMockData = true; // 로컬 API 테스트 용도. !! 주의 !! stg/prod 환경에서는 false로 설정해야 합니다.
    #productDataMap = new Map();

    constructor() {
      this.apiService = new HomeStyleProductApi();
      const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
      if (isLocal && !this.#useMockData) {
        console.warn('[HomeStyleProductUIController] 로컬 환경에서는 홈스타일 API를 호출하지 않습니다. 목업 데이터를 사용하려면 #useMockData를 true로 설정하세요.');
        return;
      }

      this.#init();
    }

    /**
     * 초기화 메서드
     */
    async #init() {
      const elProductList = document.querySelector(HomeStyleProductUIController.SELECTORS.PRODUCT_WRAPPER);
      if (!elProductList) return;

      // console.log('[HomeStyleProductUIController.init] 제품 리스트 초기화 시작');
      await this.#updateProducts();
    }

    /**
     * 제품 정보를 수집하고 업데이트를 수행합니다.
     */
    async #updateProducts() {
      const elItems = document.querySelectorAll(HomeStyleProductUIController.SELECTORS.PRODUCT_ITEM);
      const productIds = [...document.querySelectorAll(HomeStyleProductUIController.SELECTORS.MAIN_SPAN)]
        .map(el => el.dataset.homeStyleProduct)
        .filter((id, index, self) => id && self.indexOf(id) === index);

      if (productIds.length === 0) {
        console.log('[HomeStyleProductUIController.updateProducts] 업데이트할 상품 ID가 없습니다.');
        return;
      }

      // 2. 로딩 상태 표시
      elItems.forEach(elItem => {
        this.#setLoadingState(elItem, true);
      });

      try {
        // 3. 데이터 요청 (일괄 처리)
        let productList = [];
        if (this.#useMockData) {
          productList = await this.#getMockData(productIds);
        } else {
          productList = await this.apiService.fetchProducts(productIds);
        }

        if (productList && productList.length > 0) {
          productList.forEach(item => this.#productDataMap.set(item.goodsNo, item));
          this.#renderProducts(elItems);
        } else {
          throw new Error('No valid product data returned');
        }

      } catch (error) {
        console.error('제품 정보를 가져오는 데 실패했습니다:', error);
        elItems.forEach(elItem => this.#renderErrorState(elItem));
      }


      // PV.checkLoadImages는 https://www.lge.co.kr/kr/event/promotions/js/common.js에 있는 기능으로 내부적으로 사용하고 있어 주석 처리함.
      /* PV.checkLoadImages.complete('.c-product img', (allImagesLoaded) => {
          if (allImagesLoaded) {
              PV.wrapper.classList.add('home-style-api-product-img-loaded');
              console.log('[HomeStyleProductUIController] API 제품 썸네일의 이미지 모두 로드 완료');
          } else {
              console.log('[HomeStyleProductUIController] API 제품 썸네일의 이미지 로드 실패');
          }
      }); */
    }

    /**
     * 가져온 제품 데이터로 각 제품 카드를 렌더링합니다.
     * @param {NodeListOf<Element>} elItems
     */
    #renderProducts(elItems) {
      elItems.forEach((elItem) => {
        const elMainSpan = elItem.querySelector(HomeStyleProductUIController.SELECTORS.MAIN_SPAN);
        if (!elMainSpan) return;

        const productId = elMainSpan.dataset.homeStyleProduct;
        const productData = this.#productDataMap.get(productId);

        if (!productData) {
          this.#renderErrorState(elItem);
          return;
        }

        this.#setLoadingState(elItem, false);
        this.#updateProductCard(elItem, productData);
      });
    }

    /**
     * 제품 카드 UI를 최신 데이터로 업데이트합니다.
     * @param {Element} elItem
     * @param {object} data
     */
    #updateProductCard(elItem, data) {
      const elements = this.#getCardElements(elItem);
      if (!elements.mainSpan || !elements.mainLink) return;

      // main Link Update
      if (elements.mainLink) elements.mainLink.href = `https://homestyle.lge.co.kr/item?productId=${data.goodsNo}`;

      // info Link Update
      if (elements.infoLink) elements.infoLink.href = `https://homestyle.lge.co.kr/item?productId=${data.goodsNo}`;

      // Image Update
      if (elements.imageWrapper) {
        const imageUrl = data.imgPath || '';
        // const modifiedImageUrl = imageUrl.replace(/rw=\d+/g, 'rw=500').replace(/rh=\d+/g, 'rh=500'); // TODO: 필요시 리사이징 로직 추가
        elements.imageWrapper.innerHTML = `<img src="${this.apiService.imageBaseUrl}${imageUrl}?aw=1&ah=1&rw=500&rh=500" alt="${data.imgAlt || ''}" class="c-product__image">`;
      }

      if (elements.brandName) elements.brandName.innerHTML = data.brandNm;

      // Text Update
      if (elements.name) elements.name.innerHTML = data.goodsNm;

      // Price Update
      if (elements.priceArea && data.price) {
        elements.priceArea.innerHTML = this.#createPriceHTML(data.price);
      }

      // Badge Update
      if (elements.badgeContainer) {
        elements.badgeContainer.querySelector('.c-product__badge--sale')?.remove();

        const badgeHTML = `
                    ${this.#createDiscountBadgeHTML(data)}
                    ${this.#renderCardDiscountBadge(data)}
                `;
        if (badgeHTML.trim()) {
          elements.badgeContainer.insertAdjacentHTML('afterbegin', badgeHTML);
        }
      }

      // Sold Out Check
      const isCardSoldOut = this.#isSoldOut(data);
      elItem.classList.toggle(HomeStyleProductUIController.CLASSES.SOLD_OUT, isCardSoldOut);
      this.#toggleSoldOutAccessibilityText(elItem, isCardSoldOut);
    }

    /**
     * @description 할인율에 따라 뱃지 HTML을 생성합니다.
     * @param {object} data - 제품 데이터입니다.
     * @returns {string} - 뱃지 HTML 문자열입니다.
     */
    #createDiscountBadgeHTML(data) {
      if (!data.price) return '';

      const { marketPrice, bestPrice } = data.price;
      if (!marketPrice || marketPrice <= 0) return '';
      const discountRate = Math.trunc(((marketPrice - bestPrice) / marketPrice) * 100);
      if (Number.isNaN(discountRate) || discountRate <= 0) return '';
      return `<span class="c-product__badge c-product__badge--sale discount_rate">${discountRate}</span>`;
    }

    /**
     * 상세 가격 데이터에서 카드 타이틀을 확인하고 할인 뱃지 HTML을 반환합니다.
     * @param {Object} data - 제품 상세 정보를 포함하는 객체
     * @returns {string} 할인 뱃지 HTML 문자열 또는 빈 문자열
     */
    #renderCardDiscountBadge(data) {
      if (data.price.cardDcRate && data.price.cardDcRate > 0) {
        // return `<span class="c-product__badge c-product__badge--sale">카드할인 ${data.price.cardDcRate}% 적용가</span>`; // gt.yang 251209 고객 요청으로 아래로 변경
        return `<span class="c-product__badge c-product__badge--sale">카드 최대 헤택가</span>`;
      }
      return '';
    }

    /**
     * 제품 카드 내의 주요 DOM 요소들을 찾아 객체로 반환합니다.
     * @param {Element} elItem
     */
    #getCardElements(elItem) {
      return {
        mainSpan: elItem.querySelector(HomeStyleProductUIController.SELECTORS.MAIN_SPAN),
        mainLink: elItem.querySelector(HomeStyleProductUIController.SELECTORS.MAIN_LINK),
        infoLink: elItem.querySelector(HomeStyleProductUIController.SELECTORS.INFO_LINK),
        imageWrapper: elItem.querySelector(HomeStyleProductUIController.SELECTORS.IMAGE_WRAPPER),
        brandName: elItem.querySelector(HomeStyleProductUIController.SELECTORS.PRODUCT_BRAND_NAME),
        name: elItem.querySelector(HomeStyleProductUIController.SELECTORS.PRODUCT_NAME),
        priceArea: elItem.querySelector(HomeStyleProductUIController.SELECTORS.PRICE_AREA),
        badgeContainer: elItem.querySelector(HomeStyleProductUIController.SELECTORS.BADGE_CONTAINER),
      };
    }

    /**
     * 주어진 데이터로 상품의 품절 여부를 확인합니다.
     * @param {object} data
     */
    #isSoldOut(data) {
      return data.soldOutYn === 'Y';
    }

    /**
     * 요소에 '품절' 스크린리더 텍스트를 추가하거나 제거합니다.
     * @param {Element} element
     * @param {boolean} isSoldOut
     */
    #toggleSoldOutAccessibilityText(element, isSoldOut) {
      const elSoldOutText = element.querySelector(HomeStyleProductUIController.SELECTORS.SOLD_OUT_TEXT);
      if (isSoldOut && !elSoldOutText) {
        const elSoldOut = document.createElement('div');
        elSoldOut.className = 'c-product__sold-out-hidden-txt';
        elSoldOut.innerHTML = '<span class="blind">해당 제품은 현재 일시 품절입니다.</span>';
        element.insertBefore(elSoldOut, element.firstChild);
      } else if (!isSoldOut && elSoldOutText) {
        elSoldOutText.remove();
      }
    }

    /**
     * 가격 HTML 생성
     * @param {object} priceData 
     */
    #createPriceHTML(priceData) {
      const { bestPrice, marketPrice } = priceData;
      const format = (num) => new Intl.NumberFormat('ko-KR').format(num);

      if (!bestPrice) return '';

      if (bestPrice === marketPrice) {
        return `
                    <ul class="c-product__price-list c-product__price-list--one-time-purchase">
                        <li class="c-product__price-item c-product__price-item--member">
                            <span class="c-product__price-label c-product__price-label--member blind"></span>
                            <span class="c-product__price-value c-product__price-value--member">${format(bestPrice)}<span class="c-product__unit"></span></span>
                        </li>
                    </ul>
                `;
      } else {
        return `
                    <ul class="c-product__price-list c-product__price-list--one-time-purchase">
                        <li class="c-product__price-item c-product__price-item--original">
                            <span class="c-product__price-label c-product__price-label--original blind"></span>
                            <span class="c-product__price-value c-product__price-value--original"><del>${format(marketPrice)}</del></span>
                        </li>                        
						<li class="c-product__price-item c-product__price-item--member">
                            <span class="c-product__price-label c-product__price-label--member blind"></span>
                            <span class="c-product__price-value c-product__price-value--member">${format(bestPrice)}<span class="c-product__unit"></span></span>
                        </li>
                    </ul>
                `;
      }
    }

    /**
     * 로딩 상태 UI를 설정하거나 해제합니다.
     * @param {Element} elItem
     * @param {boolean} isLoading
     */
    #setLoadingState(elItem, isLoading) {
      if (isLoading) {
        elItem.classList.add(HomeStyleProductUIController.CLASSES.LOADING);
        const elMainSpan = elItem.querySelector(HomeStyleProductUIController.SELECTORS.MAIN_SPAN);
        if (elMainSpan) {
          elMainSpan.innerHTML = this.#createLoadingSkeletonHTML(elMainSpan);
        }
      } else {
        elItem.classList.remove(HomeStyleProductUIController.CLASSES.LOADING);
      }
    }

    /**
     * 로딩 스켈레톤 UI의 HTML을 생성합니다.
     * @param {Element} elMainSpan
     */
    #createLoadingSkeletonHTML(elMainSpan) {
      const elMainLinker = elMainSpan.querySelector('a');
      const elMainLinkerEcProduct = elMainLinker?.dataset.ecProduct || '{}';
      const elMainLinkerContents = elMainLinker?.dataset.contents || '';
      const elVisual = elMainSpan.querySelector(HomeStyleProductUIController.SELECTORS.IMAGE_VISUAL);
      const visualHTML = elVisual
        ? elVisual.outerHTML
        : `
                <div class="c-product__visual">
                    <div class="c-product__image-wrapper">
                        <img class="c-product__image" src="https://www.lge.co.kr/lg5-common/images/icons/noimage.svg" alt="">
                    </div>
                </div>
            `;
      const elBadgeContainer = elMainSpan.querySelector(HomeStyleProductUIController.SELECTORS.BADGE_CONTAINER);
      const badgeContainerHTML = elBadgeContainer
        ? elBadgeContainer.outerHTML
        : '<div class="c-product__badge-container"></div>';

      return `
                    <a href="#" data-ec-product='${elMainLinkerEcProduct}' data-contents='${elMainLinkerContents}'>
                        ${visualHTML}
                    </a>
                    <div class="c-product__info-container">
						<div class="inner">
                        <a href="#" data-ec-product='${elMainLinkerEcProduct}' data-contents='${elMainLinkerContents}'>
                            <div class="c-product__info">
                                <div class="c-product__brand-name">브랜드명 로딩 중</div>
                                <strong class="c-product__name">모델명 로딩 중</strong>
                            </div>
							<div class="c-product__price-area"><p>가격 로딩 중</p></div>
                        </a>
                        ${badgeContainerHTML}
                    </div>
					</div>
                `;
    }

    /**
     * 에러 상태 UI를 렌더링합니다.
     * @param {Element} elItem
     */
    #renderErrorState(elItem) {
      this.#setLoadingState(elItem, false);
      elItem.classList.add(HomeStyleProductUIController.CLASSES.ERROR);
      const elements = this.#getCardElements(elItem);
      if (elements.brandName) elements.brandName.textContent = '제품 정보 조회 실패';
      if (elements.name) elements.name.textContent = '제품 정보 조회 실패';
      if (elements.priceArea) elements.priceArea.innerHTML = '';
      if (elements.imageWrapper) {
        elements.imageWrapper.innerHTML =
          '<img class="c-product__image" src="https://www.lge.co.kr/lg5-common/images/icons/noimage.svg" alt="제품 정보 조회 실패">';
      }
    }

    /**
     * @description 개발/테스트용 Mock 데이터를 반환합니다. API 중 사용되고 있는 데이터만 나열되어 있음.
     * @param {string[]} productIds - 조회할 제품 ID 목록입니다.
     * @returns {Promise<object[]>} - Mock API 응답 데이터입니다.
     */
    #getMockData(productIds) {
      const mockDatabase = {
        G25070000656: {
          goodsNo: "G25070000656",
          goodsNm: "사브르 비스트로 펄리핸들 핑크 디너 4P 세트",
          brandNo: "2500000089",
          brandNm: "사브르",
          soldOutYn: "Y",
          imgPath: "/goods/org/285/250908000060285.jpg",
          imgAlt: "사브르 비스트로 펄리핸들 핑크 디너 4P 세트 메인이미지 1",
          price: {
            marketPrice: 800000,
            bestPrice: 100000,
            cpnDcRate: 15,
            cardDcRate: 7,
          }
        },
        G25070005743: {
          goodsNo: "G25070005743",
          goodsNm: "사브르 비스트로 펄리핸들 핑크 디너 4P 세트",
          brandNo: "2500000089",
          brandNm: "사브르",
          soldOutYn: "Y",
          imgPath: "/goods/org/285/250908000060285.jpg",
          imgAlt: "사브르 비스트로 펄리핸들 핑크 디너 4P 세트 메인이미지 1",
          price: {
            marketPrice: 1500000,
            bestPrice: 200000,
            cpnDcRate: 0,
            cardDcRate: 0,
          }
        },
        G25070001706: {
          goodsNo: "G25070001706",
          goodsNm: "사브르 비스트로 펄리핸들 핑크 디너 4P 세트",
          brandNo: "2500000089",
          brandNm: "사브르",
          soldOutYn: "N",
          imgPath: "/goods/org/285/250908000060285.jpg",
          imgAlt: "33asdf as dfas df333이미지 1",
          price: {
            marketPrice: 1045000,
            bestPrice: 250000,
            cpnDcRate: 0,
            cardDcRate: 0,
          }
        },
      };
      const responseData = productIds.map((id) => mockDatabase[id]).filter(Boolean);
      return new Promise((resolve) =>
        setTimeout(() => resolve(responseData), 300),
      );
    }
  }

  (function () {
    console.log('[HomeStyle] script loaded');

    let initialized = false;

    function initHomeStyle() {
      if (initialized) return;

      const targets = document.querySelectorAll('[data-home-style-product]');
      if (!targets.length) {
        console.log('[HomeStyle] product DOM not found yet');
        return;
      }

      initialized = true;
      console.log('[HomeStyle] init HomeStyleProductUIController');
      new HomeStyleProductUIController();

      // 기존 뱃지 위치 보정 로직 유지
      const observer = new MutationObserver(() => {
        document.querySelectorAll('.c-product__item').forEach(item => {
          const badge = item.querySelector('.c-product__badge--sale');
          const memberPrice = item.querySelector('.c-product__price-item--member');

          if (badge && memberPrice && !memberPrice.contains(badge)) {
            memberPrice.prepend(badge);
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    // DOM 상태 분기 (DOMContentLoaded 이미 지난 경우 대응)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initHomeStyle);
    } else {
      initHomeStyle();
    }

    // OMS / Ajax / SPA 대응
    const domObserver = new MutationObserver(() => {
      if (initialized) return;
      initHomeStyle();
    });

    domObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  })();
})();