(() => {
  class HomeStyleProductApi {
    constructor() {
      this.baseUrl = 'https://livingapi.lge.co.kr';
      this.imageBaseUrl = 'https://static-store.lge.co.kr';
      this.endpoints = { goods: '/itemsvc/ajax/v2/goods' };
    }

    async #request(url, options = {}) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        return await response.json();
      } catch (error) {
        console.error(`[HomeStyleProductApi.request] 통신 오류: ${error.message}`);
        return null;
      }
    }

    async fetchProducts(goodsNos) {
      if (!goodsNos || !Array.isArray(goodsNos) || goodsNos.length === 0) {
        console.log('[HomeStyleProductApi.fetchProducts] 상품 번호 목록이 유효하지 않음');
        return null;
      }

      const url = `${this.baseUrl}${this.endpoints.goods}`;
      const response = await this.#request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goodsNos })
      });

      return response && response.data ? response.data : null;
    }
  }

  class HomeStyleProductUIController {
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
      INFO_LINK: '.c-product__info-container .inner > a',
    };

    static CLASSES = {
      LOADING: 'c-product__item--loading',
      ERROR: 'c-product__item--error',
      SOLD_OUT: 'c-product__item--sold-out',
    };

    #useMockData = false;
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

    async #init() {
      const elProductList = document.querySelector(HomeStyleProductUIController.SELECTORS.PRODUCT_WRAPPER);
      if (!elProductList) return;
      await this.#updateProducts();
    }

    async #updateProducts() {
      const elItems = document.querySelectorAll(HomeStyleProductUIController.SELECTORS.PRODUCT_ITEM);
      const productIds = [...document.querySelectorAll(HomeStyleProductUIController.SELECTORS.MAIN_SPAN)]
        .map(el => el.dataset.homeStyleProduct)
        .filter((id, index, self) => id && self.indexOf(id) === index);

      if (productIds.length === 0) {
        console.log('[HomeStyleProductUIController.updateProducts] 업데이트할 상품 ID가 없습니다.');
        return;
      }

      elItems.forEach(elItem => this.#setLoadingState(elItem, true));

      try {
        let productList = [];
        if (this.#useMockData) productList = await this.#getMockData(productIds);
        else productList = await this.apiService.fetchProducts(productIds);

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
    }

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
     * ✅ 여기에서 "카드 최대 혜택가" 뱃지 복구
     */
    #updateProductCard(elItem, data) {
      const elements = this.#getCardElements(elItem);
      if (!elements.mainSpan || !elements.mainLink) return;

      const isCardSoldOut = this.#isSoldOut(data);

      elements.mainLink.href = `https://homestyle.lge.co.kr/item?productId=${data.goodsNo}`;
      if (elements.infoLink) elements.infoLink.href = `https://homestyle.lge.co.kr/item?productId=${data.goodsNo}`;

      if (elements.imageWrapper) {
        const imageUrl = data.imgPath || '';
        elements.imageWrapper.innerHTML = `
          <img src="${this.apiService.imageBaseUrl}${imageUrl}?aw=1&ah=1&rw=500&rh=500"
               alt="${data.imgAlt || ''}"
               class="c-product__image">
        `;
      }

      if (elements.brandName) elements.brandName.textContent = data.brandNm || '';
      if (elements.name) elements.name.textContent = data.goodsNm || '';

      /** ============================
       *  가격 처리
       *  → 품절 여부와 상관없이 항상 노출
       * ============================ */
      if (elements.priceArea && data.price) {
        elements.priceArea.innerHTML = this.#createPriceHTML(data.price);
      }

      let container = elements.badgeContainer;
      if (!container) {
        container = document.createElement('div');
        container.className = 'c-product__badge-container';

        const inner = elItem.querySelector('.c-product__info-container .inner');
        if (inner) inner.appendChild(container);
        else elItem.querySelector('.c-product__info-container')?.appendChild(container);
      }

      container.innerHTML = '';

      if (isCardSoldOut) {
        // 품절일 때는 가격은 그대로 두고,
        // 필요하면 품절 배지만 추가
        container.insertAdjacentHTML('afterbegin', `<span class="c-product__badge c-product__badge--soldout">일시 품절</span>`);
      } else {
        /** ============================
         *  뱃지 생성
         * ============================ */
        const badgeHTML = `
        ${this.#createDiscountBadgeHTML(data)}
        ${this.#renderCardDiscountBadge(data)}
        `.trim();

        if (badgeHTML) {
          container.insertAdjacentHTML('afterbegin', badgeHTML);
        }
      }

      elItem.classList.toggle(HomeStyleProductUIController.CLASSES.SOLD_OUT, isCardSoldOut);
      this.#toggleSoldOutAccessibilityText(elItem, isCardSoldOut);

      this.#ensurePriceVisible(elItem);

      // ✅ [추가] badge-container를 member li 자식으로 "안전하게" 이동 (DOM 파싱 끝난 뒤)
      this.#moveBadgeContainerIntoMemberPrice(elItem);
    }

    #createDiscountBadgeHTML(data) {
      if (!data.price) return '';
      const { marketPrice, bestPrice } = data.price;
      if (!marketPrice || marketPrice <= 0) return '';
      if (!bestPrice || bestPrice <= 0) return '';
      const discountRate = Math.trunc(((marketPrice - bestPrice) / marketPrice) * 100);
      if (Number.isNaN(discountRate) || discountRate <= 0) return '';
      return `<span class="c-product__badge c-product__badge--sale discount_rate">${discountRate}</span>`;
    }

    /**
     * ✅ "카드 최대 혜택가" 뱃지 복구 메서드
     * - cardDcRate가 있으면 뱃지 노출
     */
    #renderCardDiscountBadge(data) {
      if (data?.price?.cardDcRate && data.price.cardDcRate > 0) {
        return `<span class="c-product__badge c-product__badge--sale maximum_benefit_price">최대혜택가</span>`;
      }
      return '';
    }

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

    #isSoldOut(data) {
      return data.soldOutYn === 'Y';
    }

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

    #ensurePriceVisible(elItem) {
      const priceArea = elItem.querySelector(HomeStyleProductUIController.SELECTORS.PRICE_AREA);
      if (!priceArea) return;

      const originalItem = priceArea.querySelector('.c-product__price-item--original');
      if (originalItem) return;

      const memberValueEl = priceArea.querySelector('.c-product__price-value--member');
      if (!memberValueEl) return;

      const memberText = (memberValueEl.textContent || '').trim();
      if (!memberText) return;

      priceArea.innerHTML = `
        <ul class="c-product__price-list c-product__price-list--one-time-purchase">
          <li class="c-product__price-item c-product__price-item--member">
            <span class="c-product__price-label c-product__price-label--member blind"></span>
            <span class="c-product__price-value c-product__price-value--member">${memberText}<span class="c-product__unit"></span></span>
          </li>
        </ul>
      `;
    }

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
                <div class="c-product__name">모델명 로딩 중</div>
              </div>
              <div class="c-product__price-area"><p>가격 로딩 중</p></div>
            </a>
            ${badgeContainerHTML}
          </div>
        </div>
      `;
    }

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
          price: { marketPrice: 800000, bestPrice: 100000, cpnDcRate: 15, cardDcRate: 7 }
        },
        G25070005743: {
          goodsNo: "G25070005743",
          goodsNm: "사브르 비스트로 펄리핸들 핑크 디너 4P 세트",
          brandNo: "2500000089",
          brandNm: "사브르",
          soldOutYn: "Y",
          imgPath: "/goods/org/285/250908000060285.jpg",
          imgAlt: "사브르 비스트로 펄리핸들 핑크 디너 4P 세트 메인이미지 1",
          price: { marketPrice: 1500000, bestPrice: 200000, cpnDcRate: 0, cardDcRate: 0 }
        },
        G25070001706: {
          goodsNo: "G25070001706",
          goodsNm: "사브르 비스트로 펄리핸들 핑크 디너 4P 세트",
          brandNo: "2500000089",
          brandNm: "사브르",
          soldOutYn: "N",
          imgPath: "/goods/org/285/250908000060285.jpg",
          imgAlt: "33asdf as dfas df333이미지 1",
          price: { marketPrice: 1045000, bestPrice: 250000, cpnDcRate: 0, cardDcRate: 0 }
        },
      };
      const responseData = productIds.map((id) => mockDatabase[id]).filter(Boolean);
      return new Promise((resolve) => setTimeout(() => resolve(responseData), 300));
    }

    /**
 * ✅ [추가] .c-product__badge-container 를
 * .c-product__price-item--member 자식으로 안전하게 이동
 * - innerHTML 사용 X (DOM API만 사용)
 * - 렌더 완료 후 1프레임 뒤에 실행해서 DOM 안정화
 */
    #moveBadgeContainerIntoMemberPrice(elItem) {
      requestAnimationFrame(() => {
        const badgeContainer = elItem.querySelector('.c-product__badge-container');
        const memberLi = elItem.querySelector('.c-product__price-item--member');

        if (!badgeContainer || !memberLi) return;

        // 이미 이동되어 있으면 아무것도 안 함
        if (memberLi.contains(badgeContainer)) return;

        // ✅ 안전 이동 (기존 위치에서 떼어내서 memberLi 끝에 붙임)
        memberLi.appendChild(badgeContainer);
      });
    }
  }

  (function () {
    console.log('[HomeStyle] script loaded');

    let initialized = false;
    function initScrollNavTab() {
      const $navWrap = $('.navigation_tab');
      if (!$navWrap.length) return;

      const $nav = $navWrap.find('nav');
      const $ul = $navWrap.find('ul');
      const $links = $navWrap.find('a');
      const $items = $navWrap.find('li');

      if (!$links.length) return;

      let currentId = '';
      let isClickScrolling = false;
      let scrollEndTimer = null;
      let ticking = false;

      // 중복 바인딩 방지
      $(window).off('scroll.scrollNavTab');
      $navWrap.off('click.scrollNavTab');

      function getScrollContainer() {
        // 실제 x 스크롤이 걸린 요소를 우선 탐색
        const candidates = [
          $navWrap.get(0),
          $nav.get(0),
          $ul.get(0)
        ].filter(Boolean);

        for (let i = 0; i < candidates.length; i++) {
          const el = candidates[i];
          if (el.scrollWidth > el.clientWidth) return el;
        }

        // 못 찾으면 section 자체를 기본값으로
        return $navWrap.get(0);
      }

      function getMoveLeft($li) {
        const container = getScrollContainer();
        const li = $li.get(0);

        if (!container || !li) return 0;

        const containerRect = container.getBoundingClientRect();
        const liRect = li.getBoundingClientRect();

        const currentScrollLeft = container.scrollLeft;
        const liCenter = (liRect.left - containerRect.left) + currentScrollLeft + (liRect.width / 2);
        const targetLeft = liCenter - (container.clientWidth / 2);

        const maxScroll = container.scrollWidth - container.clientWidth;

        return Math.max(0, Math.min(targetLeft, maxScroll));
      }

      function centerTab($li) {
        if (!$li.length) return;
        const container = getScrollContainer();
        container.scrollLeft = getMoveLeft($li); // 즉시 이동
      }

      function clearActive() {
        currentId = '';
        $items.removeClass('on');
      }

      function setActive(id) {
        if (!id) {
          clearActive();
          return;
        }

        const $targetLi = $links.filter('[href="#' + id + '"]').closest('li');

        if (!$targetLi.length) {
          clearActive();
          return;
        }

        // 같은 탭이면 클래스 재처리는 생략, 가운데 정렬만 보정
        if (currentId === id && $targetLi.hasClass('on')) {
          centerTab($targetLi);
          return;
        }

        currentId = id;
        $items.removeClass('on');
        $targetLi.addClass('on');
        centerTab($targetLi);
      }

      function getCurrentSectionId() {
        const scrollTop = $(window).scrollTop();
        const offset = 100; // 상단 고정영역 높이에 맞게 조정 가능
        let foundId = '';

        $links.each(function () {
          const href = $(this).attr('href');
          const $section = $(href);

          if (!$section.length) return;

          const top = $section.offset().top - offset;
          const bottom = top + $section.outerHeight();

          if (scrollTop >= top && scrollTop < bottom) {
            foundId = $section.attr('id');
          }
        });

        return foundId;
      }

      function syncActiveByScroll() {
        if (isClickScrolling) return;

        const id = getCurrentSectionId();

        if (!id) {
          clearActive();
          return;
        }

        setActive(id);
      }

      // 클릭: 탭 on + x축 가운데 + 해당 섹션으로 즉시 이동
      $navWrap.on('click.scrollNavTab', 'a', function (e) {
        e.preventDefault();

        const href = $(this).attr('href');
        const $target = $(href);
        if (!$target.length) return;

        const id = $target.attr('id');

        isClickScrolling = true;
        clearTimeout(scrollEndTimer);

        setActive(id);

        $('html, body').stop(true, true).scrollTop($target.offset().top - 80);

        scrollEndTimer = setTimeout(function () {
          isClickScrolling = false;
          syncActiveByScroll();
        }, 50);
      });

      // 스크롤: 현재 섹션 기준으로 탭 on + x축 가운데
      $(window).on('scroll.scrollNavTab', function () {
        if (ticking) return;

        ticking = true;
        requestAnimationFrame(function () {
          syncActiveByScroll();
          ticking = false;
        });
      });

      // 최초 1회
      syncActiveByScroll();
    }

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

      const observer = new MutationObserver(() => {
        document.querySelectorAll('.c-product__item').forEach(item => {
          const badge = item.querySelector('.c-product__badge--sale');
          const memberPrice = item.querySelector('.c-product__price-item--member');

          if (badge && memberPrice && !memberPrice.contains(badge)) {
            memberPrice.prepend(badge);
          }
        });

        // 새 인터렉션
        $(document).off('click.coupon').on('click.coupon', '.brand_focus .notice_box button', function (e) {
          e.preventDefault();
          $(this).closest('.notice_box').toggleClass('on');
        });

        $('.brand_focus_list article').each(function () {
          const $article = $(this);
          const landingUrl = $article.data('landing-url');
          if (!landingUrl) return;
          $article.find('.landing_btn').attr('href', landingUrl);
        });
      });

      initScrollNavTab(); // 추가

      observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initHomeStyle);
    } else {
      initHomeStyle();
    }

    const domObserver = new MutationObserver(() => {
      if (initialized) return;
      initHomeStyle();
    });

    domObserver.observe(document.body, { childList: true, subtree: true });
  })();
})();
