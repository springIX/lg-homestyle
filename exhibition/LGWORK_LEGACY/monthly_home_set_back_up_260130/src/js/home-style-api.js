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

    #updateProductCard(elItem, data) {
      const elements = this.#getCardElements(elItem);
      if (!elements.mainSpan || !elements.mainLink) return;

      const isCardSoldOut = this.#isSoldOut(data);

      elements.mainLink.href = `https://homestyle.lge.co.kr/item?productId=${data.goodsNo}`;
      if (elements.infoLink) {
        elements.infoLink.href = `https://homestyle.lge.co.kr/item?productId=${data.goodsNo}`;
      }

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
       *  품절 처리
       * ============================ */
      if (isCardSoldOut) {
        if (elements.priceArea) {
          elements.priceArea.innerHTML = `<p class="c-product__soldout-price">일시 품절</p>`;
        }

        // ✅ 품절이면 뱃지 컨테이너 자체 제거
        elements.badgeContainer?.remove();

      } else {
        /** ============================
         *  가격 처리
         * ============================ */
        if (elements.priceArea && data.price) {
          elements.priceArea.innerHTML = this.#createPriceHTML(data.price);
        }

        /** ============================
         *  뱃지 생성
         * ============================ */
        const badgeHTML = `
      ${this.#createDiscountBadgeHTML(data)}
      ${this.#renderCardDiscountBadge(data)}
    `.trim();

        // ✅ 뱃지가 하나도 없으면 컨테이너 제거
        if (!badgeHTML) {
          elements.badgeContainer?.remove();
        } else {
          // 컨테이너가 없으면 생성
          let container = elements.badgeContainer;

          if (!container) {
            container = document.createElement('div');
            container.className = 'c-product__badge-container';

            const inner = elItem.querySelector('.c-product__info-container .inner');
            if (inner) inner.appendChild(container);
            else elItem.querySelector('.c-product__info-container')?.appendChild(container);
          }

          // 기존 sale 뱃지 제거 후 다시 삽입
          container.querySelectorAll('.c-product__badge--sale').forEach(el => el.remove());
          container.insertAdjacentHTML('afterbegin', badgeHTML);
        }
      }

      elItem.classList.toggle(
        HomeStyleProductUIController.CLASSES.SOLD_OUT,
        isCardSoldOut
      );

      this.#toggleSoldOutAccessibilityText(elItem, isCardSoldOut);

      if (!isCardSoldOut) {
        this.#ensurePriceVisible(elItem);
      }
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

    #renderCardDiscountBadge(data) {
      if (data?.price?.cardDcRate && data.price.cardDcRate > 0) {
        return `<span class="c-product__badge c-product__badge--sale">카드 최대 혜택가</span>`;
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
  }

  (function () {
    console.log('[HomeStyle] script loaded');

    let initialized = false;
    let uiBound = false;
    let swiperInited = false;

    const remToPx = (rem) => rem * parseFloat(getComputedStyle(document.documentElement).fontSize);

    function bindUIOnce() {
      if (uiBound) return;
      uiBound = true;

      // ✅ 탭-콘텐츠 on 토글 (capture 1회만)
      document.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-home-set-tab] button');
        if (!btn) return;

        e.preventDefault();

        const tabWrap = btn.closest('[data-home-set-tab]');
        const key = tabWrap?.getAttribute('data-home-set-tab');
        if (!key) return;

        const buttons = tabWrap.querySelectorAll('button');
        const idx = Array.prototype.indexOf.call(buttons, btn);

        const scope = tabWrap.closest('section') || document;
        const contentWrap = scope.querySelector(`[data-home-set-cont="${key}"]`);
        if (!contentWrap) return;

        buttons.forEach(b => b.classList.remove('on'));
        btn.classList.add('on');

        const articles = contentWrap.querySelectorAll('article');
        articles.forEach(a => a.classList.remove('on'));
        if (articles[idx]) articles[idx].classList.add('on');
      }, true);

      // ✅ 네임스페이스로만 off (전체 click off 금지)
      $(document).off('click.notice').on('click.notice', '.monthly_home_set .notice_box button', function (e) {
        e.preventDefault();
        $(this).closest('.notice_box').toggleClass('on');
      });

      $(document).off('click.signatureMore')
        .on('click.signatureMore', '#weeklysale .home_set_btn', function (e) {
          e.preventDefault();
          $('#weeklysale .c-product__item').show();
          $(this).hide();
        });

      $(document).on('click', '[data-tab-btn] > button', function (e) {
        e.preventDefault();

        const $btnWrap = $(this).parent();              // [data-tab-btn]
        const key = $btnWrap.data('tab-btn');           // "A"
        const idx = $(this).index();                    // 버튼 index

        // 버튼 on
        $btnWrap.children('button').removeClass('on');
        $(this).addClass('on');

        // 같은 key 컨텐츠 찾기 (같은 섹션/블록 안에서만)
        const $scope = $btnWrap.closest('section, article, .wrap, .container');
        const $contWrap = ($scope.length ? $scope : $(document)).find('[data-tab-cont="' + key + '"]').first();

        // 컨텐츠 on (직속자식 index 매칭)
        $contWrap.children().removeClass('on').eq(idx).addClass('on');
      });

    }



    function initSwipersOnce() {
      if (swiperInited) return;

      // Swiper 로드 체크 (없으면 그냥 종료)
      if (typeof Swiper === 'undefined') {
        console.warn('[HomeStyle] Swiper is not loaded yet');
        return;
      }

      // 필요한 DOM이 생겼을 때만 init
      const hasBenefits = document.querySelector('#benefits .benefits_info .swiper');
      const hasCrosssale = document.querySelector('#crosssale .nav_type.swiper');
      const hasHomestyling = document.querySelector('#homestyling .swiper');
      const hasInterior = document.querySelector('#interior .swiper');
      const hasHowToApply = document.querySelector('#how_to_apply .swiper'); // ✅ 추가
      const hasCategoryPd = document.querySelector('#category_pd .m_swiper_ty_col2')

      if (!hasBenefits && !hasCrosssale && !hasHomestyling && !hasInterior && !hasHowToApply && !hasCategoryPd) return;

      swiperInited = true;

      // ✅ 공통
      const win = $(window);
      const mo_break_point = 780;
      const remToPx = (rem) => rem * parseFloat(getComputedStyle(document.documentElement).fontSize);

      // ✅ how_to_apply 전용 swiper 인스턴스
      let swiperHowToApply = null;

      // ✅ 모바일에서만 생성 / PC에서는 destroy
      function syncHowToApplySwiper() {
        // DOM 없으면 정리만
        const exists = document.querySelector('#how_to_apply .swiper');
        if (!exists) {
          if (swiperHowToApply) {
            swiperHowToApply.destroy(true, true);
            swiperHowToApply = null;
          }
          return;
        }

        const win_w = win.width();

        if (win_w <= mo_break_point) {
          if (!swiperHowToApply) {
            swiperHowToApply = new Swiper('#how_to_apply .swiper', {
              speed: 800,
              spaceBetween: 8,
              slidesPerView: 1,
              pagination: {
                el: '#how_to_apply .pagi',
                clickable: true,
              },
            });
          }
        } else {
          if (swiperHowToApply) {
            swiperHowToApply.destroy(true, true);
            swiperHowToApply = null;
          }
        }
      }

      // ✅ 최초 1회 + 리사이즈 때마다 동기화
      syncHowToApplySwiper();
      win.off('resize.howToApply').on('resize.howToApply', syncHowToApplySwiper);

      // 1) benefits
      let swiperBenefits = null;
      if (hasBenefits) {
        swiperBenefits = new Swiper('#benefits .benefits_info .swiper', {
          speed: 800,
          spaceBetween: remToPx(12),
          scrollbar: {
            el: '#benefits .benefits_info .scr_bar',
            draggable: true,
          },
          breakpoints: {
            781: {
              slidesPerView: 2,
              grid: { rows: 2, fill: 'row' },
            }
          },
        });

        $(document).off('click.tabMo').on('click.tabMo', '.home_set_tab.mo button', function (e) {
          e.preventDefault();
          const $btn = $(this);
          const idx = $btn.index();
          $btn.addClass('on').siblings().removeClass('on');
          swiperBenefits.slideTo(idx);
        });

        swiperBenefits.on('slideChange', function () {
          $('.home_set_tab.mo button').eq(swiperBenefits.activeIndex).addClass('on').siblings().removeClass('on');
        });
      }

      // 2) crosssale
      if (hasCrosssale) {
        new Swiper('#crosssale .nav_type.swiper', {
          speed: 800,
          spaceBetween: remToPx(12),
          slidesPerView: 1,
          autoHeight: true,
          scrollbar: {
            el: '#crosssale .nav_type .scr_bar',
            draggable: true,
          },
          navigation: {
            nextEl: '#crosssale .nav_type .nxt',
            prevEl: '#crosssale .nav_type .prv',
          },
          on: {
            init: function () {
              const total = this.slides.length;
              $('#crosssale .nav_type .total').text(total.toString().padStart(2, '0'));
              $('#crosssale .nav_type .crnt').text((this.realIndex + 1).toString().padStart(2, '0'));
            },
            slideChange: function () {
              $('#crosssale .nav_type .crnt').text((this.realIndex + 1).toString().padStart(2, '0'));
              $('#crosssale .nav_type .cp_tab li').removeClass('on').eq(this.realIndex).addClass('on');
            }
          }
        });
      }

      // 3) homestyling
      if (hasHomestyling) {
        new Swiper('#homestyling .swiper', {
          speed: 800,
          spaceBetween: remToPx(10),
          slidesPerView: 1,
          pagination: {
            el: '#homestyling .pagi',
            clickable: true,
          },
          navigation: {
            nextEl: '#homestyling .nxt',
            prevEl: '#homestyling .prv',
          },
          breakpoints: {
            781: {
              slidesPerView: 3,
              spaceBetween: remToPx(24),
            }
          },
        });
      }

      // 4) interior
      if (hasInterior) {
        new Swiper('#interior .swiper', {
          speed: 800,
          spaceBetween: remToPx(12),
          pagination: {
            el: '#interior .pagi',
            clickable: true,
          },
          navigation: {
            nextEl: '#interior .nxt',
            prevEl: '#interior .prv',
          },
          breakpoints: {
            781: {
              spaceBetween: remToPx(24),
            }
          },
        });
      }

      // ✅ category_pd: .m_swiper_ty_col2 (모바일 전용)
      if (hasCategoryPd) {
        let col2Swipers = [];

        function wrap4($ul) {
          if ($ul.children('.swiper-slide').length) return;
          const $items = $ul.children('.c-product__item');
          for (let i = 0; i < $items.length; i += 4) {
            const $slide = $('<li class="swiper-slide"></li>');
            $slide.append($items.slice(i, i + 4));
            $ul.append($slide);
          }
        }

        function syncCol2Swipers() {
          const isMo = win.width() <= mo_break_point;

          if (isMo) {
            $('#category_pd .m_swiper_ty_col2').each(function () {
              const $box = $(this);
              if ($box.data('col2Inited')) return;

              const $ul = $box.find('> .c-product__list');
              if (!$ul.length) return;

              $box.addClass('swiper m_col2_swiper');
              $ul.addClass('swiper-wrapper');

              wrap4($ul);

              const $pagi = $('<div class="scr_bar mo m_col2_pagi"></div>');
              $box.append($pagi);

              const sw = new Swiper($box.get(0), {
                speed: 800,
                slidesPerView: 1,
                spaceBetween: remToPx(12),
                autoHeight: true,
                scrollbar: {
                  el: $pagi.get(0),
                  draggable: true,
                },
              });

              col2Swipers.push(sw);
              $box.data('col2Inited', true);
            });

          } else {
            col2Swipers.forEach(sw => { try { sw.destroy(true, true); } catch (e) { } });
            col2Swipers = [];

            $('#category_pd .m_swiper_ty_col2').each(function () {
              const $box = $(this);
              if (!$box.data('col2Inited')) return;

              const $ul = $box.find('> .c-product__list');

              $ul.children('.swiper-slide').each(function () {
                $(this).children('.c-product__item').appendTo($ul);
                $(this).remove();
              });

              $ul.removeClass('swiper-wrapper');
              $box.removeClass('swiper m_col2_swiper');
              $box.find('.m_col2_pagi').remove();
              $box.removeData('col2Inited');
            });
          }
        }

        syncCol2Swipers();
        win.off('resize.col2Swiper').on('resize.col2Swiper', syncCol2Swipers);
      }

      console.log('[HomeStyle] Swipers initialized');
    }


    function normalizeBadgePlacementLight() {
      // ✅ Observer에서 할 일은 이것 정도만 (DOM 크게 바꾸지 말기)
      document.querySelectorAll('.c-product__item').forEach(item => {
        const badge = item.querySelector('.c-product__badge--sale');
        const memberPrice = item.querySelector('.c-product__price-item--member');
        if (badge && memberPrice && !memberPrice.contains(badge)) {
          memberPrice.prepend(badge);
        }
      });
    }

    (function toggleEmptyBadgeContainers() {
      function apply() {
        document
          .querySelectorAll('.c-product__badge-container')
          .forEach(el => {
            const hasBadge = el.querySelector('.c-product__badge');
            el.style.display = hasBadge ? '' : 'none';
          });
      }

      // 최초 실행
      apply();

      // 이후 DOM 변경 대응
      const observer = new MutationObserver(apply);
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    })();

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

      bindUIOnce();
      initSwipersOnce();

      function initMoveMixedItemsOnce() {
        // 중복 실행 방지
        if (window.__mixedMoveInited) return;
        window.__mixedMoveInited = true;

        function moveLGEItemsByMixedKey() {
          const sources = document.querySelectorAll('.lge_mixed__list[data-mixed-key]');
          if (!sources.length) return false;

          let movedAny = false;

          sources.forEach((source) => {
            // Swiper loop duplicate 슬라이드 제외
            if (source.closest('.swiper-slide-duplicate')) return;

            const key = source.getAttribute('data-mixed-key');
            if (!key) return;

            const target = document.querySelector(
              `.mixed__list[data-mixed-key="${key}"] .c-product__list`
            );
            const sourceList = source.querySelector('.c-product__list');
            if (!target || !sourceList) return;

            const items = Array.from(sourceList.querySelectorAll('.c-product__item'));
            if (!items.length) return;

            const indexCountMap = {};

            items.forEach((li) => {
              const indexAttr = li.getAttribute('data-lge-index');
              let insertIndex = target.children.length;

              if (indexAttr) {
                const baseIndex = parseInt(indexAttr, 10) - 1;
                indexCountMap[baseIndex] = indexCountMap[baseIndex] || 0;
                insertIndex = baseIndex + indexCountMap[baseIndex];
                indexCountMap[baseIndex]++;
              }

              const refNode = target.children[insertIndex] || null;
              target.insertBefore(li, refNode);
            });

            source.style.display = 'none';
            movedAny = true;
          });

          return movedAny;
        }

        // 렌더/Swiper 타이밍 대응: 여러 번 시도
        let tryCount = 0;
        const maxTry = 60;

        const interval = setInterval(() => {
          tryCount++;
          const moved = moveLGEItemsByMixedKey();
          if (moved || tryCount >= maxTry) clearInterval(interval);
        }, 200);
      }

      initMoveMixedItemsOnce();

      // ✅ MutationObserver는 "가벼운 보정" + "swiper 로딩 지연 대응" 용도로만
      const observer = new MutationObserver(() => {
        normalizeBadgePlacementLight();
        initSwipersOnce();
      });
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
