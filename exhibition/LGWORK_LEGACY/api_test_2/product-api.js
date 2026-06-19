/*
전체 페이지 공통 JS
*/

(() => {
  window.PV = window.PV || {
    siteType: 'P',      // PC 기준
    isLogin: false,     // 로그인 여부
    isMobile: false,
    isApp: false,
    memberGrade: null
  };

  /**
   * @description 제품 목록의 데이터를 가져와 UI를 렌더링하고 관리하는 역할을 합니다.
   */
  class ProductCardUpdater {
    /**
     * @description 코드에서 반복적으로 사용되는 CSS 셀렉터들을 상수로 관리합니다.
     */
    static SELECTORS = {
      PRODUCT_LIST: '.c-product:not(.c-product--home-style)',
      PRODUCT_ITEM: '.c-product__item',
      PRODUCT_LIST_WRAPPER: '.c-product__list',
      MAIN_PRODUCT_SPAN: 'span[data-prdvalue]',
      MAIN_PRODUCT_LINK: 'span[data-prdvalue] > a',
      INFO_LINK: '.c-product__info-container > a',
      ACTION_LINKS: '.c-product__actions a',
      IMAGE_VISUAL: '.c-product__visual',
      IMAGE_WRAPPER: '.c-product__image-wrapper',
      PRODUCT_NAME: '.c-product__name',
      MODEL_ID: '.c-product__model-id',
      PRICE_AREA: '.c-product__price-area',
      BADGE_CONTAINER: '.c-product__badge-container',
      SOLD_OUT_TEXT: '.c-product__sold-out-hidden-txt',
      SALE_BADGE: '.c-product__badge--sale',
    };

    /**
     * @description 코드에서 사용되는 CSS 클래스명을 상수로 관리합니다.
     */
    static CLASSES = {
      SUBSCRIPTION_LIST: 'c-product__list--subscription',
      ITEM_LOADING: 'c-product__item--loading',
      ITEM_ERROR: 'c-product__item--error',
      ITEM_SOLD_OUT: 'c-product__item--sold-out',
      ITEM_TIME_DEAL: 'c-product__item--time-deal',
      ACTION_LINK_SOLD_OUT: 'sold-out',
      ALL_SOLD_OUT: 'c-product--all-sold-out',
    };

    /**
     * @description API 응답에서 사용되는 상태 코드를 상수로 관리합니다.
     */
    static API_STATUS = {
      RENTAL_DISCONTINUED: 'DISCONTINUED',
      RENTAL_SOLD_OUT: 'SOLD_OUT',
      MODEL_ACTIVE: 'ACTIVE',
    };

    /**
     * @description 환경별 API URL을 상수로 관리합니다.
     */
    static API_URLS = {
      STG: 'https://apiv2stg.lge.co.kr/itemsvc/ajax/v1/model/retrieveMultipleModelInfo',
      PROD: 'https://apiv2.lge.co.kr/itemsvc/ajax/v1/model/retrieveMultipleModelInfo',
    };

    /**
     * @description 특정 MDID를 강제로 품절 처리하기 위한 설정입니다.
     * 여기에 강제 품절 처리할 MDID를 배열 형태로 추가해주세요.
     * @example ['MD00000001', 'MD00000002']
     */
    static #FORCE_SOLD_OUT_MD_IDS = [];

    #useMockData = false; // 로컬 API 테스트 용도. !! 주의 !! stg/prod 환경에서는 false로 설정해야 합니다.
    #productDataMap = new Map();

    #CARE_SERVICE_DEFINITIONS = {
      CT50000094: {
        // 정수기
        default: {
          division: '기본',
          services: ['필터 배송', '무상A/S'],
        },
        CT50250004: {
          // 얼음 정수기
          division: '기본',
          services: ['필터 교체 및 분리 세척', '토탈 클리닝', '무상 A/S'],
        },
      },
      CT50000065: {
        // 냉장고
        default: {
          division: '스텐다드',
          services: ['기계실 세척', '토탈 클리닝', '제품 성능점검', '무상A/S'],
        },
      },
      CT50000072: {
        // 김치냉장고
        default: {
          division: '스텐다드',
          services: ['기계실 세척', '토탈 클리닝', '제품 성능점검', '무상A/S'],
        },
      },
      CT50000086: {
        // 식기세척기
        default: {
          division: '기본',
          services: ['음식물거름망 교체', '연수장치 점검 외 다수'],
        },
      },
      CT50019018: {
        // 광파오븐/전자레인지
        default: {
          division: '기본',
          services: ['내부 클리닝', '소모품 무상 교체 외 다수'],
        },
      },
      CT50000076: {
        // 전기레인지
        default: {
          division: '기본',
          services: ['상판 교체', '코팅 및 광택 서비스 외 다수'],
        },
      },
      CT50000143: {
        // 공기청정기
        default: {
          division: '기본',
          services: ['주기별 필터 교체 및 클리닝', '클린부스터 클리닝 외 다수'],
        },
      },
      CT50000142: {
        // 제습기
        default: {
          division: '기본',
          services: ['필터 점검(교체)', '물통 점검(교체)', '외관 클리닝 외 다수'],
        },
      },
      CT50000139: {
        // 가습기
        default: {
          division: '기본',
          services: ['워터 필터 교체', '공기 청정 필터 교체 외 다수'],
        },
      },
      CT50000131: {
        // 에어컨
        default: {
          division: '라이트플러스',
          services: ['기본세척', '위생케어', '필터 세척 및 교체 외 다수'],
        },
      },
      CT50000110: {
        // 건조기
        default: {
          division: '라이트',
          services: ['고무패킹 세척', '배수필터 세척 및 교체 외 다수'],
        },
      },
      CT50250001: {
        // 정수기
        default: {
          division: '라이트',
          services: ['직수관 무상 교체', '살균 서비스 및 무상 A/S 외 다수'],
        },
      },
      CT50000101: {
        // 세탁기
        default: {
          division: '라이트',
          services: ['배수 필터 세척 및 교체', '토탈 클리닝', '무상 A/S'],
        },
      },
      CT50000107: {
        // 의류건조기(건조기)
        default: {
          division: '라이트(스팀)',
          services: ['스팀케어', '2중 안심필터 제공', '필터세척', '습도 센서 점검 외 다수'],
        },
      },
      CT50000111: {
        // 청소기
        default: {
          division: '자가관리',
          services: ['관리 방법 알림톡 발송', '필터 배송', '배터리 무상 교체 외 다수'],
        },
        CT50000119: {
          // 로봇청소기
          division: '기본',
          services: ['부품 스팀', '로봇 클리닝', '오수관, 급배수통 클리닝 외 다수'],
        },
      },
      CT50000106: {
        // 의류관리기(스타일러)
        default: {
          division: '기본',
          services: ['급/배수통 교체', '스팀 케어', '조도 센서 점검', '필터 세척 외 다수'],
        },
      },
      CT50000123: {
        // 안마의자
        default: {
          division: '기본',
          services: ['가죽 교체', '틈새 클리닝', '제품 토탈클리닝', '성능 점검 외 다수'],
        },
      },
      CT50295000: {
        // 스탠바이미
        default: {
          division: '기본',
          services: ['무상 이전설치 및 A/S'],
        },
      },
      CT50000025: {
        // TV
        default: {
          division: '기본',
          services: ['무상 이전설치 및 A/S'],
        },
      },
      CT50000046: {
        // 노트북
        default: {
          division: '플러스',
          services: ['무상A/S', '배터리 무상 교체(36개월차)'],
        },
      },
    };

    constructor() {

      const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
      if (isLocal && !this.#useMockData) {
        console.warn('[ProductCardUpdater] 로컬 환경에서는 일반 제품(일시불/구독) API를 호출하지 않습니다. 목업 데이터를 사용하려면 #useMockData를 true로 설정하세요.');
        return;
      }

      if (document.querySelector(ProductCardUpdater.SELECTORS.PRODUCT_LIST)) {
        this.#fetchProductData();
      }
    }

    /**
     * @description 제품 ID를 수집하고 API를 통해 제품 정보를 가져옵니다.
     */
    async #fetchProductData() {
      const elItems = document.querySelectorAll(`${ProductCardUpdater.SELECTORS.PRODUCT_LIST} ${ProductCardUpdater.SELECTORS.PRODUCT_ITEM}`);
      const productIds = [...document.querySelectorAll(`${ProductCardUpdater.SELECTORS.PRODUCT_LIST} [data-prdvalue]`)]
        .map((el) => el.dataset.prdvalue)
        .filter((id, index, self) => id && self.indexOf(id) === index);

      if (productIds.length === 0) return;

      elItems.forEach((elItem) => {
        this.#setLoadingState(elItem, true);
      });

      try {
        const result = this.#useMockData
          ? await this.#getMockData(productIds)
          : await this.#fetchRealData(productIds);

        if (result.message === 'OK' && result.status === 200) {
          result.data.forEach((item) => this.#productDataMap.set(item.modelId, item));

          this.#applyForcedSoldOutStatus();

          this.#renderProducts(elItems);
          this.#reOrderElAction();
          this.#updateProductListStatus();
        } else {
          throw new Error(`API Error: ${result.message}`);
        }
      } catch (error) {
        console.error('제품 정보를 가져오는 데 실패했습니다:', error);
        elItems.forEach((elItem) => this.#renderErrorState(elItem));
      }

      PV.appendEventCodeToLinks();

      PV.checkLoadImages.complete('.c-product img', (allImagesLoaded) => {
        if (allImagesLoaded) {
          PV.wrapper.classList.add('api-product-img-loaded');
          console.log('[fetchProductData] API 제품 썸네일의 이미지 모두 로드 완료');
          this.#setupScrollFeatures();
        } else {
          console.log('[fetchProductData] API 제품 썸네일의 이미지 로드 실패');
        }
      });
    }

    /**
     * @description 설정된 MDID 목록을 기반으로 특정 제품을 강제로 품절 처리합니다.
     */
    #applyForcedSoldOutStatus() {
      for (const mdid of ProductCardUpdater.#FORCE_SOLD_OUT_MD_IDS) {
        const productData = this.#productDataMap.get(mdid);
        if (productData) {
          productData.modelStatusCode = 'SOLD_OUT';
          productData.rentalModelInfo ??= {};
          productData.rentalModelInfo.rentalModelStatusCode = ProductCardUpdater.API_STATUS.RENTAL_SOLD_OUT;
        }
      }
    }

    /**
     * @description URL 파라미터에 따라 특정 요소로 스크롤하는 기능을 설정합니다.
     */
    #setupScrollFeatures() {
      PV.scrollToElementFromUrl({
        paramName: 'scroll-target',
        attributeName: 'data-scroll-target',
        offsetSelectors: {
          pc: ['.c-tab--main-switch', '.c-tab--main-sticky'],
          mobile: ['.c-tab--main-switch', '.c-tab--main-sticky', 'header'],
        },
        scrollBehavior: 'instant',
      });
    }

    /**
     * @description 가져온 제품 데이터로 각 제품 카드를 렌더링합니다.
     * @param {NodeListOf<Element>} elItems - 렌더링할 제품 아이템 요소 목록입니다.
     */
    #renderProducts(elItems) {
      elItems.forEach((elItem) => {
        const elMainProductSpan = elItem.querySelector(ProductCardUpdater.SELECTORS.MAIN_PRODUCT_SPAN);
        if (!elMainProductSpan) return;

        const originalProductId = elMainProductSpan.dataset.prdvalue;
        const originalProductData = this.#productDataMap.get(originalProductId);

        if (!originalProductData) {
          this.#renderErrorState(elItem);
          return;
        }

        const { productData, fallbackAttributes } = this.#getAvailableProduct(elItem, originalProductId);

        this.#setLoadingState(elItem, false);

        this.#updateProductCard(elItem, productData, fallbackAttributes);
        this.#setupActionLinks(elItem);
      });
    }

    /**
     * @description 기본 상품이 품절일 경우, 구매 가능한 대체 상품을 찾습니다.
     * @param {Element} elItem - 제품 아이템 요소입니다.
     * @param {string} originalProductId - 기본 상품의 ID입니다.
     * @returns {{productData: object, fallbackAttributes: object|null}} - 표시할 상품 데이터와 대체 속성입니다.
     */
    #getAvailableProduct(elItem, originalProductId) {
      const originalProductData = this.#productDataMap.get(originalProductId);
      const isSubscription = this.#isSubscriptionProduct(elItem);

      // 1. 기본 상품이 품절이 아니면 그대로 반환합니다.
      if (originalProductData && !this.#isSoldOut(originalProductData, isSubscription)) {
        return { productData: originalProductData, fallbackAttributes: null };
      }

      // 2. 기본 상품이 품절이면, 구매 가능한 첫 번째 대체 상품을 찾습니다.
      const elActionLinks = elItem.querySelectorAll(
        `${ProductCardUpdater.SELECTORS.ACTION_LINKS}[data-prdvalue]`,
      );
      const activeFallbackLink = [...elActionLinks].find((elActionLink) => {
        const fallbackId = elActionLink.dataset.prdvalue;
        const fallbackData = this.#productDataMap.get(fallbackId);
        return fallbackData && !this.#isSoldOut(fallbackData, isSubscription);
      });

      if (activeFallbackLink) {
        const fallbackId = activeFallbackLink.dataset.prdvalue;
        return {
          productData: this.#productDataMap.get(fallbackId),
          fallbackAttributes: {
            prdvalue: fallbackId,
            ecProduct: activeFallbackLink.dataset.ecProduct,
            contents: activeFallbackLink.dataset.contents,
          },
        };
      }

      // 3. 구매 가능한 대체 상품이 없으면, 품절 상태 표시를 위해 기본 상품 정보를 반환합니다.
      return { productData: originalProductData, fallbackAttributes: null };
    }

    /**
     * @description 제품 카드 UI를 최신 데이터로 업데이트합니다.
     * @param {Element} elItem - 업데이트할 제품 아이템 요소입니다.
     * @param {object} data - 제품 데이터입니다.
     * @param {object|null} fallbackAttributes - 대체 상품의 속성입니다.
     */
    #updateProductCard(elItem, data, fallbackAttributes = null) {
      const elements = this.#getCardElements(elItem);
      if (!elements.mainSpan || !elements.mainLink) return;

      if (fallbackAttributes) {
        elements.mainSpan.dataset.prdvalue = fallbackAttributes.prdvalue;
        elements.mainLink.dataset.ecProduct = fallbackAttributes.ecProduct;
        elements.mainLink.dataset.contents = fallbackAttributes.contents;
        if (elements.infoLink) {
          elements.infoLink.dataset.ecProduct = fallbackAttributes.ecProduct;
          elements.infoLink.dataset.contents = fallbackAttributes.contents;
        }
      }

      const isSubscription = this.#isSubscriptionProduct(elItem);
      let productUrl = data.modelUrlPath || '#';

      if (isSubscription && data.rentalModelInfo?.caresolutionPdpUrlPath) {
        productUrl = `${data.rentalModelInfo.caresolutionPdpUrlPath}?dpType=careTab`;
      }

      if (isSubscription && !data.rentalModelInfo?.caresolutionPdpUrlPath === null) {
        // 특이 케이스 : 구독 제품 정보는 있는데, API에 구독 url 자체가 없는 경우 추가
        // data.rentalModelInfo.rentalModelStatusCode = ProductCardUpdater.API_STATUS.RENTAL_SOLD_OUT;
        // productUrl = `/care-solutions${data.modelUrlPath}?dpType=careTab`;
      }

      elements.mainLink.href = productUrl;
      if (elements.infoLink) elements.infoLink.href = productUrl;

      const isCustomThumbnail = elItem.closest('[class*="c-product__list--thumnail-custom"]');
      if (!isCustomThumbnail) {
        if (elements.imageWrapper)
          elements.imageWrapper.innerHTML = `<img src="${data.largeImageAddr}" alt="${data.modelDisplayName}" class="c-product__image">`;
      }

      if (elements.name) elements.name.innerHTML = data.modelDisplayName;
      if (elements.modelId) elements.modelId.innerHTML = `<span class="blind">모델명</span>${data.modelName}`;
      if (elements.priceArea) elements.priceArea.innerHTML = this.#createPriceHTML(elItem, data);

      if (elements.badgeContainer) {
        elements.badgeContainer.querySelector(ProductCardUpdater.SELECTORS.SALE_BADGE)?.remove();

        if (!this.#isSubscriptionProduct(elItem))
          elements.badgeContainer.insertAdjacentHTML(
            'afterbegin',
            this.#createDiscountBadgeHTML(elItem, data),
          );
      }

      const isCardSoldOut = this.#isCardSoldOut(elItem, data, isSubscription);
      elItem.classList.toggle(ProductCardUpdater.CLASSES.ITEM_SOLD_OUT, isCardSoldOut);
      this.#toggleSoldOutAccessibilityText(elItem, isCardSoldOut);

      this.#applyTimeDealStyles(elItem, data, isCardSoldOut);
      this.#updateCareService(elItem, data);
    }

    /**
     * @description 제품 카드 내의 주요 DOM 요소들을 찾아 객체로 반환합니다.
     * @param {Element} elItem - 제품 아이템 요소입니다.
     * @returns {object} - DOM 요소들을 담은 객체입니다.
     */
    #getCardElements(elItem) {
      return {
        mainSpan: elItem.querySelector(ProductCardUpdater.SELECTORS.MAIN_PRODUCT_SPAN),
        mainLink: elItem.querySelector(ProductCardUpdater.SELECTORS.MAIN_PRODUCT_LINK),
        infoLink: elItem.querySelector(ProductCardUpdater.SELECTORS.INFO_LINK),
        imageWrapper: elItem.querySelector(ProductCardUpdater.SELECTORS.IMAGE_WRAPPER),
        name: elItem.querySelector(ProductCardUpdater.SELECTORS.PRODUCT_NAME),
        modelId: elItem.querySelector(ProductCardUpdater.SELECTORS.MODEL_ID),
        priceArea: elItem.querySelector(ProductCardUpdater.SELECTORS.PRICE_AREA),
        badgeContainer: elItem.querySelector(ProductCardUpdater.SELECTORS.BADGE_CONTAINER),
      };
    }

    /**
     * @description 제품 카드의 최종 품절 상태를 결정합니다. (옵션 상품 포함)
     * @param {Element} elItem - 제품 아이템 요소입니다.
     * @param {object} displayedProductData - 현재 카드에 표시된 제품의 데이터입니다.
     * @param {boolean} isSubscription - 구독 상품 여부입니다.
     * @returns {boolean} - 카드 전체의 품절 여부입니다.
     */
    #isCardSoldOut(elItem, displayedProductData, isSubscription) {
      const elActionLinks = elItem.querySelectorAll(
        `${ProductCardUpdater.SELECTORS.ACTION_LINKS}[data-prdvalue]`,
      );

      if (elActionLinks.length > 0) {
        // 옵션이 있는 경우: 모든 옵션이 품절이어야 카드 전체가 품절입니다.
        return [...elActionLinks].every((link) => {
          const linkProductId = link.dataset.prdvalue;
          const linkProductData = this.#productDataMap.get(linkProductId);
          return !linkProductData || this.#isSoldOut(linkProductData, isSubscription);
        });
      }

      // 옵션이 없는 경우: 현재 표시된 상품의 상태를 따릅니다.
      return this.#isSoldOut(displayedProductData, isSubscription);
    }

    /**
     * @description 타임딜 상품에 대한 스타일을 적용합니다.
     * @param {Element} elItem - 제품 아이템 요소입니다.
     * @param {object} data - 제품 데이터입니다.
     * @param {boolean} isSoldOut - 품절 여부입니다.
     */
    #applyTimeDealStyles(elItem, data, isSoldOut) {
      const isTimeDeal =
        typeof data.dealProductModel?.dealInventoryQty === 'number' &&
        elItem.classList.contains(ProductCardUpdater.CLASSES.ITEM_TIME_DEAL);

      const elImageVisual = elItem.querySelector(ProductCardUpdater.SELECTORS.IMAGE_VISUAL);
      if (elImageVisual) {
        const elTimeDealBadge = elImageVisual.querySelector('.c-product__image-badge--time-deal');
        if (isTimeDeal) {
          const stockQty = isSoldOut ? 0 : data.dealProductModel.dealInventoryQty;

          if (!elTimeDealBadge) {
            elImageVisual.insertAdjacentHTML(
              'beforeend',
              `<div class="c-product__image-badge c-product__image-badge--time-deal"><span class="blind">제품 재고</span> ${stockQty}개 남음</div>`,
            );
          }
        } else {
          elTimeDealBadge?.remove();
        }
      }
    }

    /**
     * @description 옵션 링크(actions)들의 품절 상태를 설정하고 UI를 업데이트합니다.
     * @param {Element} elItem - 제품 아이템 요소입니다.
     */
    #setupActionLinks(elItem) {
      const elActionLinks = elItem.querySelectorAll(
        `${ProductCardUpdater.SELECTORS.ACTION_LINKS}[data-prdvalue]`,
      );
      if (elActionLinks.length === 0) return;

      const isSubscription = this.#isSubscriptionProduct(elItem);

      elActionLinks.forEach((elActionLink) => {
        const linkProductId = elActionLink.dataset.prdvalue;
        const linkProductData = this.#productDataMap.get(linkProductId);

        if (linkProductData) {
          let productUrl = linkProductData.modelUrlPath || '#';

          if (isSubscription && linkProductData.rentalModelInfo?.caresolutionPdpUrlPath) {
            productUrl = `${linkProductData.rentalModelInfo.caresolutionPdpUrlPath}?dpType=careTab`;
          }

          if (isSubscription && !linkProductData.rentalModelInfo?.caresolutionPdpUrlPath) {
            // 특이 케이스 : 구독 제품 정보는 있는데, API에 구독 url 자체가 없는 경우 추가
            // data.rentalModelInfo.rentalModelStatusCode = ProductCardUpdater.API_STATUS.RENTAL_SOLD_OUT;
          }

          elActionLink.href = productUrl;

          const isLinkSoldOut = this.#isSoldOut(linkProductData, isSubscription);
          elActionLink.classList.toggle(ProductCardUpdater.CLASSES.ACTION_LINK_SOLD_OUT, isLinkSoldOut);
          this.#toggleSoldOutAccessibilityText(elActionLink, isLinkSoldOut);
        }
      });
    }

    /**
     * @description 요소에 '품절' 스크린리더 텍스트를 추가하거나 제거합니다.
     * @param {Element} element - 대상 요소입니다.
     * @param {boolean} isSoldOut - 품절 여부입니다.
     */
    #toggleSoldOutAccessibilityText(element, isSoldOut) {
      const elActionSoldOutText = element.querySelector(ProductCardUpdater.SELECTORS.SOLD_OUT_TEXT);
      if (isSoldOut && !elActionSoldOutText) {
        const elSoldOut = document.createElement('div');
        elSoldOut.className = 'c-product__sold-out-hidden-txt';
        elSoldOut.innerHTML = '<span class="blind">해당 제품은 현재 일시 품절입니다.</span>';
        element.insertBefore(elSoldOut, element.firstChild);
      } else if (!isSoldOut && elActionSoldOutText) {
        elActionSoldOutText.remove();
      }
    }

    /**
     * @description 주어진 데이터로 상품의 품절 여부를 확인합니다.
     * @param {object} data - 확인할 제품 데이터입니다.
     * @param {boolean} isSubscription - 구독 상품 여부입니다.
     * @returns {boolean} - 품절이면 true를 반환합니다.
     */
    #isSoldOut(data, isSubscription) {
      if (isSubscription) {
        const statusCode = data.rentalModelInfo?.rentalModelStatusCode;
        return (
          !data.rentalModelInfo ||
          statusCode === ProductCardUpdater.API_STATUS.RENTAL_DISCONTINUED ||
          statusCode === ProductCardUpdater.API_STATUS.RENTAL_SOLD_OUT
        );
      }
      return (
        data.modelStatusCode !== ProductCardUpdater.API_STATUS.MODEL_ACTIVE ||
        data.dealProductModel?.dealInventoryQty === 0
      );
    }

    /**
     * @description 해당 제품이 구독 상품인지 확인합니다.
     * @param {Element} elItem - 제품 아이템 요소입니다.
     * @returns {boolean} - 구독 상품이면 true를 반환합니다.
     */
    #isSubscriptionProduct(elItem) {
      const parentList = elItem.closest(ProductCardUpdater.SELECTORS.PRODUCT_LIST_WRAPPER);
      return parentList?.classList.contains(ProductCardUpdater.CLASSES.SUBSCRIPTION_LIST);
    }

    /**
     * @description 제품 데이터에 따라 가격 정보 HTML을 생성합니다.
     * @param {Element} elItem - 제품 아이템 요소입니다.
     * @param {object} data - 제품 데이터입니다.
     * @returns {string} - 가격 정보 HTML 문자열입니다.
     */
    #createPriceHTML(elItem, data) {
      const format = (price) =>
        price !== undefined && price !== null ? new Intl.NumberFormat('ko-KR').format(price) : '';
      const { priceInfo, rentalModelInfo } = data;

      if (this.#isSubscriptionProduct(elItem)) {
        if (!rentalModelInfo) return '';
        return `
                        <ul class="c-product__price-list c-product__price-list--subscription">
                            <li class="c-product__price-item c-product__price-item--member">
                                <span class="c-product__price-label c-product__price-label--member blind">구독 요금</span>
                                <span class="c-product__price-value c-product__price-value--member"><span class="c-product__unit">월</span> ${format(rentalModelInfo.years1TotAmt)}<span class="c-product__unit">원</span></span>
                            </li>
                            <li class="c-product__price-item c-product__price-item--final">
                                <span class="c-product__price-label c-product__price-label--final">최대혜택가</span>
                                <span class="c-product__price-value c-product__price-value--fianl"><span class="c-product__unit">월</span> ${format(rentalModelInfo.maxBenefitPrice)}<span class="c-product__unit">원</span></span>
                            </li>
                        </ul>
                        `;
      }

      if (!priceInfo) return '';
      return `
                    <ul class="c-product__price-list c-product__price-list--one-time-purchase">
                        <li class="c-product__price-item c-product__price-item--original">
                            <span class="c-product__price-label c-product__price-label--original blind">판매가</span>
                            <span class="c-product__price-value c-product__price-value--original"><del>${format(priceInfo.obsOriginalPrice)}</del>원</span>
                        </li>
                        <li class="c-product__price-item c-product__price-item--member">
                            <span class="c-product__price-label c-product__price-label--member blind">회원할인가</span>
                            <span class="c-product__price-value c-product__price-value--member">${format(priceInfo.obsSellingPrice)}<span class="c-product__unit">원</span></span>
                        </li>
                        <li class="c-product__price-item c-product__price-item--final">
                            <span class="c-product__price-label c-product__price-label--final">최대혜택가</span>
                            <span class="c-product__price-value c-product__price-value--fianl"><strong>${format(priceInfo.lastBenefitPrc)}</strong><span class="c-product__unit">원</span></span>
                        </li>
                    </ul>
                    `;
    }

    /**
     * @description 할인율에 따라 뱃지 HTML을 생성합니다.
     * @param {object} data - 제품 데이터입니다.
     * @returns {string} - 뱃지 HTML 문자열입니다.
     */
    #createDiscountBadgeHTML(elItem, data) {
      if (!data.priceInfo) return '';

      const { obsOriginalPrice, lastBenefitPrc } = data.priceInfo;
      if (!obsOriginalPrice || obsOriginalPrice <= 0) return '';
      const discountRate = Math.trunc(((obsOriginalPrice - lastBenefitPrc) / obsOriginalPrice) * 100);
      if (Number.isNaN(discountRate) || discountRate <= 0) return '';
      return `<span class="c-product__badge c-product__badge--sale discount_rate">${discountRate}</span>`;
    }

    #updateCareService(elItem, data) {
      if (!this.#isSubscriptionProduct(elItem)) return;

      const { defaultCategoryId, subCategoryId } = data;
      const categoryDefinition = this.#CARE_SERVICE_DEFINITIONS[defaultCategoryId];

      if (!categoryDefinition) return;

      const finalCareServiceInfo = categoryDefinition[subCategoryId] || categoryDefinition.default;

      if (!finalCareServiceInfo) return;

      const careServiceHTML = `
                <div class="c-product__care-service">
                    <div class="c-product__care-service-title">구독 케어 서비스 : <span class="c-product__care-service-division">${finalCareServiceInfo.division}</span></div>
                    <ul class="c-product__care-service-list">
                        ${finalCareServiceInfo.services.map((service) => `<li class="c-product__care-service-item">${service}</li>`).join('')}
                    </ul>
                </div>
            `;

      const elBadgeContainer = elItem.querySelector(ProductCardUpdater.SELECTORS.BADGE_CONTAINER);
      if (elBadgeContainer) {
        const elCareService = elItem.querySelector('.c-product__care-service');
        if (elCareService) {
          elCareService.remove();
        }
        elBadgeContainer.insertAdjacentHTML('afterend', careServiceHTML);
      }
    }

    #reOrderElAction() {
      const elOnlyHorizenLists = document.querySelectorAll('.c-product__list[class*="only-horizontal"]');
      const elPCHorizenLists = document.querySelectorAll('.c-product__list[class*="pc-horizontal"]');
      const elThumbnailCustomLists = document.querySelectorAll('.c-product__list[class*="c-product__list--thumnail-custom"]');

      elOnlyHorizenLists.forEach((elOnlyHorizenList) => {
        const elOnlyHorizenItems = elOnlyHorizenList.querySelectorAll('.c-product__item');
        elOnlyHorizenItems.forEach((elOnlyHorizenItem) => {
          const elActions = elOnlyHorizenItem.querySelector('.c-product__actions');
          const elModelId = elOnlyHorizenItem.querySelector('.c-product__model-id');
          if (elActions && elModelId) {
            elModelId.insertAdjacentElement('afterend', elActions);
          }
        });
      });

      if (window.innerWidth > PV.MO_BREAK_POINT) {
        elPCHorizenLists.forEach((elPCHorizenList) => {
          const elPCHorizenItems = elPCHorizenList.querySelectorAll('.c-product__item');
          elPCHorizenItems.forEach((elPCHorizenItem) => {
            const elActions = elPCHorizenItem.querySelector('.c-product__actions');
            const elModelId = elPCHorizenItem.querySelector('.c-product__model-id');
            if (elActions && elModelId) {
              elModelId.insertAdjacentElement('afterend', elActions);
            }
          });
        });
      }

      elThumbnailCustomLists.forEach((elThumbnailCustomList) => {
        const elThumbnailCustomItems = elThumbnailCustomList.querySelectorAll('.c-product__item');
        elThumbnailCustomItems.forEach((elThumbnailCustomItem) => {
          const elActions = elThumbnailCustomItem.querySelector('.c-product__actions');
          const elInfoContainer = elThumbnailCustomItem.querySelector('.c-product__info-container');
          if (elActions && elInfoContainer) {
            elInfoContainer.insertAdjacentElement('beforeend', elActions);
          }
        });
      });
    }

    /**
     * @description 로딩 상태 UI를 설정하거나 해제합니다.
     * @param {Element} elItem - 제품 아이템 요소입니다.
     * @param {boolean} isLoading - 로딩 중인지 여부입니다.
     */
    #setLoadingState(elItem, isLoading) {
      if (isLoading) {
        elItem.classList.add(ProductCardUpdater.CLASSES.ITEM_LOADING);
        const elMainProductSpan = elItem.querySelector(ProductCardUpdater.SELECTORS.MAIN_PRODUCT_SPAN);
        if (elMainProductSpan) {
          elMainProductSpan.innerHTML = this.#createLoadingSkeletonHTML(elMainProductSpan);
        }
      } else {
        elItem.classList.remove(ProductCardUpdater.CLASSES.ITEM_LOADING);
      }
    }

    /**
     * @description 로딩 스켈레톤 UI의 HTML을 생성합니다.
     * @param {Element} elMainProductSpan - 제품 정보를 감싸는 span 요소입니다.
     * @returns {string} - 스켈레톤 HTML 문자열입니다.
     */
    #createLoadingSkeletonHTML(elMainProductSpan) {
      const elOriginalLinker = elMainProductSpan.querySelector('a');
      const originalEcProduct = elOriginalLinker?.dataset.ecProduct || '{}';
      const originalContents = elOriginalLinker?.dataset.contents || '';
      const elActions = elMainProductSpan.querySelector('.c-product__actions');
      const actionsHTML = elActions ? elActions.outerHTML : '';
      const elVisual = elMainProductSpan.querySelector(ProductCardUpdater.SELECTORS.IMAGE_VISUAL);
      const visualHTML = elVisual
        ? elVisual.outerHTML
        : `
                <div class="c-product__visual">
                    <div class="c-product__image-wrapper">
                        <img class="c-product__image" src="https://www.lge.co.kr/lg5-common/images/icons/noimage.svg" alt="">
                    </div>
                </div>
            `;
      const elBadgeContainer = elMainProductSpan.querySelector(ProductCardUpdater.SELECTORS.BADGE_CONTAINER);
      const badgeContainerHTML = elBadgeContainer
        ? elBadgeContainer.outerHTML
        : '<ul class="c-product__badge-container"></ul>';

      return `
                    <a href="#" data-ec-product='${originalEcProduct}' data-contents='${originalContents}'>
                        <span class="blind">제품 바로가기</span>
                        ${visualHTML}
                        
                    </a>
                    <div class="c-product__info-container">
                      <div class="inner">
                        ${actionsHTML}
                        <a href="#" data-ec-product='${originalEcProduct}' data-contents='${originalContents}'>
                            <div class="c-product__info">
                                <div class="c-product__name home__app-lge__title">모델명 로딩 중</div>
                                <span class="c-product__model-id"><span class="blind">모델명</span>모델 ID 로딩 중</span>
                            </div>
                            <div class="c-product__price-area"><p>가격 로딩 중</p></div>
                        </a>
                        ${badgeContainerHTML}
                      </div>
                    </div>
                `;
    }

    /**
     * @description 에러 상태 UI를 렌더링합니다.
     * @param {Element} elItem - 제품 아이템 요소입니다.
     */
    #renderErrorState(elItem) {
      this.#setLoadingState(elItem, false);
      elItem.classList.add(ProductCardUpdater.CLASSES.ITEM_ERROR);
      const elements = this.#getCardElements(elItem);
      if (elements.name) elements.name.textContent = '제품 정보 조회 실패';
      if (elements.modelId) elements.modelId.textContent = '';
      if (elements.priceArea) elements.priceArea.innerHTML = '';
      if (elements.imageWrapper) {
        elements.imageWrapper.innerHTML =
          '<img class="c-product__image" src="https://www.lge.co.kr/lg5-common/images/icons/noimage.svg" alt="제품 정보 조회 실패">';
      }
    }

    /**
     * @description 실제 API를 호출하여 데이터를 가져옵니다.
     * @param {string[]} productIds - 조회할 제품 ID 목록입니다.
     * @returns {Promise<object>} - API 응답 데이터입니다.
     */
    async #fetchRealData(productIds) {
      const apiCurrentDomain = window.location.hostname;
      const apiUrl = apiCurrentDomain.includes('wwwstg.')
        ? ProductCardUpdater.API_URLS.STG
        : ProductCardUpdater.API_URLS.PROD;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelList: productIds }),
      });
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      return response.json();
    }

    /**
     * @description 각 제품 목록(.c-product)을 순회하며 모든 제품이 품절되었는지 확인하고,
     * 그렇다면 .c-product--all-sold-out 클래스를 추가
     */
    #updateProductListStatus() {
      const elProductLists = document.querySelectorAll(ProductCardUpdater.SELECTORS.PRODUCT_LIST);

      elProductLists.forEach((elProductList) => {
        const elItems = elProductList.querySelectorAll(ProductCardUpdater.SELECTORS.PRODUCT_ITEM);
        if (elItems.length === 0) return;

        const areAllItemsSoldOut = [...elItems].every((elItem) =>
          elItem.classList.contains(ProductCardUpdater.CLASSES.ITEM_SOLD_OUT),
        );
        elProductList.classList.toggle(ProductCardUpdater.CLASSES.ALL_SOLD_OUT, areAllItemsSoldOut);
      });
    }

    /**
     * @description 개발/테스트용 Mock 데이터를 반환합니다.
     * @param {string[]} productIds - 조회할 제품 ID 목록입니다.
     * @returns {Promise<object>} - Mock API 응답 데이터입니다.
     */
    #getMockData(productIds) {
      const mockDatabase = {
        MD10411859: {
          modelId: 'MD10411859',
          modelUrlPath: '/kimchi-refrigerator/MD10411859',
          largeImageAddr: 'https://placehold.co/400x400/FECACA/31343C?text=Kimchi(normal)',
          modelDisplayName: '디오스 김치톡톡 (일반)',
          modelName: 'K228S111',
          priceInfo: { obsOriginalPrice: 1500000, obsSellingPrice: 1400000, lastBenefitPrc: 1350000 },
          modelStatusCode: 'SOLD_OUT',
          dealProductModel: { dealInventoryQty: 10 },
          rentalModelInfo: {
            rentalModelStatusCode: 'DISCONTINUED',
            years1TotAmt: 800000,
            maxBenefitPrice: 100000,
            caresolutionPdpUrlPath: '/care/pdp/MD10411859',
          },
          defaultCategoryId: 'CT50000094',
          subCategoryId: 'CT50250004',
        },
        MD09322826: {
          modelId: 'MD09322826',
          modelUrlPath: '/kimchi-refrigerator/MD09322826',
          largeImageAddr: 'https://placehold.co/400x400/D1FAE5/31343C?text=landfill-product',
          modelDisplayName: '매립형 제품',
          modelName: 'K228S112',
          priceInfo: { obsOriginalPrice: 1550000, obsSellingPrice: 1450000, lastBenefitPrc: 1400000 },
          modelStatusCode: 'ACTIVE',
          dealProductModel: { dealInventoryQty: 70 },
          rentalModelInfo: {
            rentalModelStatusCode: 'ACTIVE',
            years1TotAmt: 650000,
            maxBenefitPrice: 180000,
            caresolutionPdpUrlPath: '/care/pdp/MD09322826',
          },
          defaultCategoryId: 'CT50000106',
          subCategoryId: 'CT50173000',
        },
        MD10319863: {
          modelId: 'MD10319863',
          modelUrlPath: '/refrigerator/MD10319863',
          largeImageAddr: 'https://placehold.co/400x400/FBCFE8/31343C?text=normal-product',
          modelDisplayName: '일반형 제품',
          modelName: 'A8704123',
          priceInfo: { obsOriginalPrice: 1100000, obsSellingPrice: 1000000, lastBenefitPrc: 950000 },
          modelStatusCode: 'SOLD_OUT',
          dealProductModel: { dealInventoryQty: 15 },
          rentalModelInfo: {
            rentalModelStatusCode: 'SOLD_OUT',
            years1TotAmt: 800000,
            maxBenefitPrice: 100000,
            caresolutionPdpUrlPath: '/care/pdp/MD10319863',
          },
          defaultCategoryId: 'CT50000094',
          subCategoryId: 'CT50250004',
        },
        MD10319861: {
          modelId: 'MD10319861',
          modelUrlPath: '/refrigerator/MD10319861',
          largeImageAddr: 'https://placehold.co/400x400/FBCFE8/37343C?text=lg-styler',
          modelDisplayName: 'LG 스타일러 오브제컬렉션 (NEW)',
          modelName: 'SC5MRR42',
          priceInfo: { obsOriginalPrice: 1100000, obsSellingPrice: 1000000, lastBenefitPrc: 950000 },
          modelStatusCode: 'SOLD_OUT',
          dealProductModel: { dealInventoryQty: 100 },
          rentalModelInfo: {
            rentalModelStatusCode: 'SOLD_OUT',
            years1TotAmt: 500000,
            maxBenefitPrice: 50000,
            caresolutionPdpUrlPath: '/care/pdp/MD10319861',
          },
          defaultCategoryId: 'CT50000106',
          subCategoryId: 'CT50173000',
        },
        MD10319905: {
          modelId: 'MD10319905',
          modelUrlPath: '/refrigerator/MD10319905',
          largeImageAddr: 'https://placehold.co/400x400/FBCFE8/37343C?text=lg-styler',
          modelDisplayName: 'LG 스타일러 오브제컬렉션 (NEW)',
          modelName: 'SC5MRR42',
          priceInfo: { obsOriginalPrice: 1100000, obsSellingPrice: 1000000, lastBenefitPrc: 950000 },
          modelStatusCode: 'SOLD_OUT',
          dealProductModel: { dealInventoryQty: 99 },
          rentalModelInfo: {
            rentalModelStatusCode: 'ACTIVE',
            years1TotAmt: 500000,
            maxBenefitPrice: 50000,
            caresolutionPdpUrlPath: '/care/pdp/MD10319905',
          },
          defaultCategoryId: 'CT50000106',
          subCategoryId: 'CT50173000',
        },
        MD10319903: {
          modelId: 'MD10319903',
          modelUrlPath: '/refrigerator/MD10319903',
          largeImageAddr: 'https://placehold.co/400x400/FBCFE8/37343C?text=lg-styler',
          modelDisplayName: 'MD10319903 LG 스타일러 오브제컬렉션 (NEW)',
          modelName: 'MD10319903',
          priceInfo: { obsOriginalPrice: 1100000, obsSellingPrice: 1000000, lastBenefitPrc: 950000 },
          modelStatusCode: 'SOLD_OUT',
          dealProductModel: { dealInventoryQty: 199 },
          rentalModelInfo: {
            rentalModelStatusCode: 'SOLD_OUT',
            years1TotAmt: 300000,
            maxBenefitPrice: 20000,
            caresolutionPdpUrlPath: '/care/pdp/MD10319903',
          },
          defaultCategoryId: 'CT50000106',
          subCategoryId: 'CT50173000',
        },
        MD10559863: {
          modelId: 'MD10559863',
          modelUrlPath: '/refrigerator/MD10559863',
          largeImageAddr: 'https://placehold.co/400x400/FBCFE8/37343C?text=lg-styler',
          modelDisplayName: 'MD10559863 LG 스타일러 오브제컬렉션 (NEW)',
          modelName: 'MD10559863',
          priceInfo: { obsOriginalPrice: 1100000, obsSellingPrice: 1000000, lastBenefitPrc: 950000 },
          modelStatusCode: 'SOLD_OUT',
          dealProductModel: { dealInventoryQty: 19 },
          rentalModelInfo: {
            rentalModelStatusCode: 'ACTIVE',
            years1TotAmt: 500000,
            maxBenefitPrice: 50000,
            caresolutionPdpUrlPath: '/care/pdp/MD10559863',
          },
          defaultCategoryId: 'CT50000106',
          subCategoryId: 'CT50173000',
        },
      };
      const responseData = productIds.map((id) => mockDatabase[id]).filter(Boolean);
      return new Promise((resolve) =>
        setTimeout(() => resolve({ message: 'OK', status: 200, data: responseData }), 300),
      );
    }
  }

  /**
   * @description c-filter-container 단위로 독립 동작. 상/하위 필터 노출/활성/필터링, '더보기'(10개 제한), 버튼 슬라이더(센터 스크롤) 관리.
   */
  class FilterComponent {
    static instanceCount = 0;
    constructor(elContainer) {
      if (!elContainer) {
        console.error('FilterComponent: elContainer가 없습니다.');
        return;
      }

      FilterComponent.instanceCount++;
      this.instanceId = FilterComponent.instanceCount;
      this.elContainer = elContainer;

      // 필터 래퍼 (상위/하위)
      const elWrappers = Array.from(this.elContainer.querySelectorAll('.c-filter-container__wrapper'));
      this.elTopWrapper = elWrappers[0] || null;
      this.elSubWrapper = elWrappers[1] || null;

      // 필터 버튼 (상위/하위)
      this.elTopButtons = this.elTopWrapper
        ? Array.from(this.elTopWrapper.querySelectorAll('.c-filter-container__list > .c-filter-container__item > .c-filter-container__button'))
        : [];

      this.elSubLists = this.elSubWrapper
        ? Array.from(this.elSubWrapper.querySelectorAll('.c-filter-container__list'))
        : [];

      // 상위 필터 : 하위 필터가 존재하는 경우 ID와 ARIA-CONTROLS 부여
      const elProductListTarget = this.elContainer.querySelector('.loaded-from-map');
      const strTargetId = elProductListTarget ? elProductListTarget.id : '';
      if (this.elSubWrapper && this.elTopButtons.length > 0 && this.elSubLists.length > 0) {
        const uniquePrefix = `c-filter-${this.instanceId}`;
        const elTopSubFilterButtons = this.elTopButtons.filter(btn => btn.classList.contains('has-sub-filter'));
        elTopSubFilterButtons.forEach((elButton, index) => {
          const elSubList = this.elSubLists[index];
          if (elSubList) {
            const generatedId = `${uniquePrefix}-list-${index + 1}`;

            elButton.setAttribute('aria-controls', generatedId);
            elSubList.setAttribute('id', generatedId);
          }
        });

        const elTopSingleButtons = this.elTopButtons.filter(btn => !btn.classList.contains('has-sub-filter'));
        if (strTargetId) {
          elTopSingleButtons.forEach(elButton => {
            elButton.setAttribute('aria-controls', strTargetId);
          });
        }
      }

      // 하위 필터(서브 버튼) : ID 및 ARIA-CONTROLS 부여
      if (this.elSubLists.length > 0) {
        this.elSubLists.forEach((elList, nListIndex) => {
          const elSubButtons = elList.querySelectorAll('.c-filter-container__button');
          if (strTargetId) {
            elSubButtons.forEach((elBtn, nBtnIndex) => {
              elBtn.setAttribute('aria-controls', strTargetId);
            });
          }
        });
      }

      // 필터 대상 (이 컴포넌트 하위에 존재한다고 가정)
      this.elProductList = this.elContainer.querySelector('.c-product__list');
      this.elProductItems = this.elProductList
        ? Array.from(this.elProductList.querySelectorAll('.c-product__item'))
        : [];

      // 더보기 및 라이브 영역
      this.elViewMoreButtonContainer = this.elContainer.querySelector(':scope > .c-button-group');
      this.elViewMoreButton = this.elViewMoreButtonContainer
        ? this.elViewMoreButtonContainer.querySelector('button')
        : null;
      this.elResultLive = this.elContainer.querySelector('.c-product__result');

      // 초기값
      this.initialItemLimit = 10;
      this.sliderScrollTimer = null;
      this.activeTopKey = null;
      this.activeHasSubIndex = -1;
      this.currentFilterKey = null;

      this.init();
    }

    init() {
      if (!this.elTopWrapper || !this.elProductList) {
        console.error('FilterComponent: 상위 필터 또는 상품 리스트가 없습니다.', this.elContainer);
        return;
      }

      this.elTopButtons.forEach((elBtn) => {
        elBtn.addEventListener('click', (e) => this.handleClickTopFilter(e));
      });

      if (this.elSubWrapper) {
        this.elSubWrapper.addEventListener('click', (e) => {
          const elBtn = e.target.closest('.c-filter-container__button');
          if (elBtn && this.elSubWrapper.contains(elBtn)) {
            this.handleClickSubFilter(elBtn);
          }
        });
        this.hideAllSubLists();
      }

      if (this.elViewMoreButton) {
        this.elViewMoreButton.addEventListener('click', () => this.showAllItems());
      }

      let initialActiveButton = this.elTopButtons.find(btn => btn.getAttribute('aria-selected') === 'true');
      if (!initialActiveButton) {
        initialActiveButton = this.elTopButtons.find(btn => btn.dataset.filter === 'item-total');
      }

      if (!initialActiveButton && this.elTopButtons.length > 0) {
        initialActiveButton = this.elTopButtons[0];
      }

      if (!initialActiveButton) {
        this.applyFilterToItems('none');
        return;
      }

      this.handleClickTopFilter({ currentTarget: initialActiveButton });
    }

    /** ===========================
     * 상위 필터 클릭
     * =========================== */
    handleClickTopFilter(e) {
      const elButton = e.currentTarget;
      if (!elButton) return;

      const strTopKey = elButton.dataset.filter;
      if (!strTopKey) return;

      this.updateTopSelected(strTopKey);
      const isHasSub = elButton.classList.contains('has-sub-filter');

      // 서브 필터가 있는 경우
      if (isHasSub && this.elSubWrapper) {
        this.activeHasSubIndex = this.getHasSubIndex(elButton);
        const strTopFilterText = elButton.textContent.trim();

        // 서브 리스트를 노출하고, 기본 선택된 서브 필터 키를 반환받음
        const strDefaultSubKey = this.showSubListByIndex(this.activeHasSubIndex, strTopFilterText);
        this.activeTopKey = strTopKey;
        this.applyFilterToItems(strDefaultSubKey);
      }
      // 서브 필터가 없는 경우
      else {
        this.activeHasSubIndex = -1;

        if (this.elSubWrapper) {
          this.hideAllSubLists();
        }

        this.activeTopKey = strTopKey;
        this.applyFilterToItems(strTopKey);
      }

      this.scrollToCenter(elButton);
    }

    getHasSubIndex(elHasSubButton) {
      if (!elHasSubButton || !this.elTopWrapper) return -1;

      const hasSubItems = Array.from(
        this.elTopWrapper.querySelectorAll('.c-filter-container__list > .c-filter-container__item > .c-filter-container__button.has-sub-filter')
      );

      return hasSubItems.findIndex(btn => btn === elHasSubButton);
    }

    updateTopSelected(activeTopKey) {
      this.elTopButtons.forEach((elBtn) => {
        const isActive = (elBtn.dataset.filter === activeTopKey);
        elBtn.setAttribute('aria-selected', String(isActive));

        const elItem = elBtn.closest('.c-filter-container__item');
        if (elItem) {
          elItem.classList.toggle('is-active', isActive);
        }

        if (elBtn.classList.contains('has-sub-filter')) {
          elBtn.setAttribute('aria-expanded', String(isActive));
        } else {
          elBtn.removeAttribute('aria-expanded');
        }
      });
    }

    /** ===========================
     * 하위 필터 클릭
     * =========================== */
    handleClickSubFilter(elBtn) {
      const filterKey = elBtn.dataset.filter + elBtn.dataset.subFilter;
      const topKey = this.activeTopKey;

      if (!filterKey || !topKey || topKey === 'item-total' || this.activeHasSubIndex < 0) return;

      const elActiveList = this.elSubLists[this.activeHasSubIndex];
      if (!elActiveList) return;

      const elButtonsInList = Array.from(elActiveList.querySelectorAll('.c-filter-container__item > .c-filter-container__button'));
      elButtonsInList.forEach((b) => {
        const isActive = (b === elBtn);
        b.setAttribute('aria-selected', String(isActive));

        const elItem = b.closest('.c-filter-container__item');
        if (elItem) {
          elItem.classList.toggle('is-active', isActive);
        }
      });

      this.applyFilterToItems(filterKey);
      this.scrollToCenter(elBtn);
    }

    hideAllSubLists() {
      this.activeHasSubIndex = -1;
      if (!this.elSubWrapper) return;

      this.elSubLists.forEach((ul) => ul.classList.remove('is-active'));

      const elAllSubButtons = Array.from(this.elSubWrapper.querySelectorAll('.c-filter-container__list > .c-filter-container__item > .c-filter-container__button'));
      elAllSubButtons.forEach((b) => {
        b.setAttribute('aria-selected', 'false');

        const elItem = b.closest('.c-filter-container__item');
        if (elItem) {
          elItem.classList.remove('is-active');
        }
      });
    }

    showSubListByIndex(index, topFilterText = '') {
      if (!this.elSubWrapper || index < 0) return null;

      this.elSubLists.forEach((ul, i) => {
        const active = (i === index);
        ul.classList.toggle('is-active', active);

        if (active && topFilterText) {
          ul.setAttribute('aria-label', `${topFilterText} 하위 필터`);
        }
      });

      this.elSubWrapper.classList.add('is-active');

      const elActiveList = this.elSubLists[index];
      if (!elActiveList) return null;

      const elButtons = Array.from(elActiveList.querySelectorAll('.c-filter-container__item > .c-filter-container__button'));
      let defaultFilterKey = null;
      elButtons.forEach((b, btnIndex) => {
        const isActive = (btnIndex === 0);
        b.setAttribute('aria-selected', String(isActive));

        const elItem = b.closest('.c-filter-container__item');
        if (elItem) {
          elItem.classList.toggle('is-active', isActive);
        }

        if (isActive) {
          defaultFilterKey = b.dataset.filter + b.dataset.subFilter;
        }
      });

      return defaultFilterKey;
    }

    /** ===========================
     * 리스트 필터링 + 더보기
     * =========================== */
    applyFilterToItems(filterKey) {
      if (filterKey === null) {
        this.updateResultLive(0, false);
        return;
      }

      if (!this.elProductItems || this.elProductItems.length === 0) {
        // 더보기 버튼도 숨김
        if (this.elViewMoreButtonContainer) {
          this.elViewMoreButtonContainer.classList.add('hidden-all');
        }
        this.updateResultLive(0, true);
        return;
      }

      this.currentFilterKey = filterKey;
      let totalMatchCount = 0;
      let limitedVisibleCount = 0;
      this.elProductItems.forEach((elItem) => {
        const itemKey = elItem.dataset.filter || '';
        const strItemSubKey = elItem.dataset.subFilter || '';
        const currentItemKey = itemKey + strItemSubKey;
        // 'item-total'이면 모두 일치, 아니면 키 비교
        const match = (filterKey === 'item-total') ? true : (currentItemKey === filterKey);

        // 상태 초기화
        elItem.classList.remove('hidden-more'); // 더보기로 숨겨진 상태
        elItem.classList.remove('hidden-all');  // 필터로 숨겨진 상태

        if (match) {
          totalMatchCount++;

          // '전체' 보기일 때만 더보기 제한 적용 (선택사항: 개별 필터에도 적용하려면 조건 수정)
          if (filterKey === 'item-total' && totalMatchCount > this.initialItemLimit) {
            elItem.classList.add('hidden-more');
          } else {
            limitedVisibleCount++;
          }
        } else {
          elItem.classList.add('hidden-all');
        }
      });

      // 더보기 버튼 노출 여부 결정
      if (this.elViewMoreButtonContainer) {
        // 1. '전체' 보기 모드이고
        // 2. 전체 매칭 개수가 제한(10개)보다 많을 때만 노출
        const hasLimited = (filterKey === 'item-total') && (totalMatchCount > this.initialItemLimit);
        if (hasLimited) {
          this.elViewMoreButtonContainer.classList.remove('hidden-all');
        } else {
          this.elViewMoreButtonContainer.classList.add('hidden-all');
        }
      }

      // 라이브 리전 업데이트 (실제 눈에 보이는 개수 기준? 아니면 전체 개수 기준?)
      // 보통 '더보기'가 있으면 전체 개수를 알려주는 것이 좋음 ("총 15개 결과")
      // 여기서는 limitedVisibleCount(10개)가 아니라 totalMatchCount(15개)를 넘겨줌
      const countForLiveRegion = totalMatchCount;
      this.updateResultLive(countForLiveRegion, true);
    }

    showAllItems() {
      if (!this.elProductList) return;
      this.elProductList.querySelectorAll('.c-product__item.hidden-more').forEach((el) => el.classList.remove('hidden-more'));
      if (this.elViewMoreButtonContainer) this.elViewMoreButtonContainer.classList.add('hidden-all');

      const totalCount = this.elProductList.querySelectorAll('.c-product__item:not(.hidden-all)').length;
      this.updateResultLive(totalCount, true);
    }

    updateResultLive(count, shouldAnnounce) {
      if (!this.elResultLive) return;
      if (!shouldAnnounce) {
        this.elResultLive.textContent = '';
        return;
      }

      this.elResultLive.textContent = `총 ${count}개 결과`;
    }

    /** ===========================
     * 유틸: 스크롤러
     * =========================== */
    startScroll(elWrapper, position) {
      if (!elWrapper) return;
      elWrapper.scrollTo({ left: position, behavior: 'smooth' });
    }

    scrollToCenter(activeButton) {
      const elWrapper = activeButton.closest('.c-filter-container__wrapper');
      if (!elWrapper) return;

      const buttonWidth = activeButton.offsetWidth;
      const containerWidth = elWrapper.offsetWidth;
      const scrollPosition = activeButton.offsetLeft - (containerWidth / 2) + (buttonWidth / 2);

      clearTimeout(this.sliderScrollTimer);
      this.sliderScrollTimer = setTimeout(() => {
        this.startScroll(elWrapper, scrollPosition);
      }, 10);
    }
  }

  /**
   * @description 
   * 외부 JSON 데이터(productLists.json)를 비동기로 호출하여, 
   * 규칙된 ID를 가진 DOM 요소에 상품 리스트(카드)를 동적으로 생성 및 렌더링하는 클래스입니다.
   * * [동작 원리]
   * 1. 지정된 JSON 파일을 fetch하여 데이터를 로드합니다.
   * 2. 문서 내 `id^="productListByAutoCreateSheet"` 셀렉터로 타겟 요소를 탐색합니다. 명세서 sheet 순서 번호에 해당(0부터)
   * 3. 요소의 ID 끝자리 2자리(Index)를 파싱하여, JSON 데이터의 Key 순서(Index)와 매핑합니다.
   * (예: id="...00" -> JSON의 0번째 Key 데이터 렌더링, id="...01" -> 1번째 Key 데이터)
   * 4. 데이터 유무에 따른 클래스 제어(hidden-all) 및 가격 콤마 포맷팅을 수행하여 HTML 템플릿을 생성.
   */
  class CreaterProductListsByJson {
    constructor(jsonUrl, id) {
      this.jsonUrl = jsonUrl;
      this.jsonData = null;
      this.productTargetSelector = id;
      this.elProduct = null;

      this.init();
    }

    async init() {
      try {
        await this.loadJson();
        this.render();
      } catch (error) {
        console.error(error);
      }
    }

    async loadJson() {
      const response = await fetch(this.jsonUrl);
      if (!response.ok) throw new Error(`Failed to load JSON from ${this.jsonUrl}`);
      this.jsonData = await response.json();
    }

    render() {
      this.elProduct = document.querySelector(this.productTargetSelector);
      if (!this.elProduct) return;

      const aDataKeys = Object.keys(this.jsonData);
      const strTargetId = this.elProduct.id;

      // ID 기반 데이터 인덱스 추출 (뒤 2자리)
      const strIndex = strTargetId.slice(-2);
      const nDataIndex = parseInt(strIndex, 10);
      if (isNaN(nDataIndex) || nDataIndex >= aDataKeys.length) {
        return;
      }

      const strMainKey = aDataKeys[nDataIndex];
      const aProductData = this.jsonData[strMainKey];
      if (Array.isArray(aProductData)) {
        const mapUniqueFilters = new Map();

        aProductData.forEach(item => {
          const strCat = item["#Category"];
          const strSub = item["#SubCategory"];

          if (strCat) {
            const strCategory = strCat.trim();
            const strSubCategory = strSub ? strSub.trim() : null;

            // 중복 체크 키 생성
            const strMapKey = `${strCategory}|${strSubCategory || ''}`;

            if (!mapUniqueFilters.has(strMapKey)) {
              mapUniqueFilters.set(strMapKey, {
                category: strCategory,
                subCategory: strSubCategory
              });
            }
          }
        });

        // 필터 버튼 생성 영역 탐색 및 호출
        const elFilterContainer = this.elProduct.closest('.c-filter-container');
        if (elFilterContainer) {
          const elFilterList = elFilterContainer.querySelector('.c-filter-container__wrapper > .c-filter-container__list');

          if (elFilterList) {
            // 추출된 필터 데이터를 배열로 변환하여 전달
            this.createFilterButtons(elFilterList, Array.from(mapUniqueFilters.values()));
          }
        }

        // 상품 리스트 렌더링
        this.elProduct.innerHTML = aProductData
          .map(product => this.createCardTemplate(product))
          .join('');

        // 렌더링 완료 이벤트 발송
        const oEventData = {
          detail: {
            id: strTargetId,
            element: this.elProduct
          }
        };
        document.dispatchEvent(new CustomEvent('AutoCreateProductListsRendered', oEventData));

        this.initProductLayout();
      }
    }

    /**
     * 필터 버튼 생성 (최적화 + 동적 DOM 생성 버전)
     * @param {HTMLElement} elFilterList - 상위 필터 리스트 요소 (ul)
     * @param {Array} aFilterItems - 필터 데이터 객체 배열
     */
    createFilterButtons(elFilterList, aFilterItems) {
      // 1. 필수 요소 체크
      if (!elFilterList) return;

      // 상위 필터의 래퍼(Wrapper) 및 컨테이너
      const elTopWrapper = elFilterList.closest('.c-filter-container__wrapper');
      const elContainer = elFilterList.closest('.c-filter-container');

      if (!elTopWrapper || !elContainer) return;

      // 2. 데이터 그룹화 (Grouping)
      const oCategoryMap = {};
      aFilterItems.forEach(item => {
        const { category, subCategory } = item;
        if (!category) return;

        if (!oCategoryMap[category]) {
          oCategoryMap[category] = new Set();
        }
        if (subCategory) {
          oCategoryMap[category].add(subCategory);
        }
      });

      // 3. HTML 문자열 생성
      let strTopFiltersHtml = '';
      let strSubListHtml = '';
      let hasSubCategoryData = false;

      // '전체' 버튼 (옵션)
      if (elFilterList.classList.contains('has-total-filter')) {
        strTopFiltersHtml += `<li class="c-filter-container__item"><button type="button" class="c-filter-container__button" data-filter="item-total" aria-selected="true">전체</button></li>`;
      }

      Object.keys(oCategoryMap).forEach(strCategory => {
        const setSubCategories = oCategoryMap[strCategory];
        const isHasSub = setSubCategories.size > 0;
        const strClassSub = isHasSub ? 'has-sub-filter' : '';

        // 상위 버튼 HTML
        strTopFiltersHtml += `  <li class="c-filter-container__item">
                                            <button type="button" class="c-filter-container__button ${strClassSub}" data-filter="${strCategory}" aria-selected="false">${strCategory}</button>
                                        </li>`;

        // 하위 버튼 HTML 조립
        if (isHasSub) {
          hasSubCategoryData = true;
          let strSubButtonsHtml = '';

          setSubCategories.forEach(strSub => {
            strSubButtonsHtml += `  <li class="c-filter-container__item has-margin-top--20">
                                                    <button type="button" class="c-filter-container__button" data-filter="${strCategory}" data-sub-filter="${strSub}" aria-selected="false">${strSub}</button>
                                                </li>`;
          });

          // 숨김 처리된 UL 생성
          strSubListHtml += `<ul class="c-filter-container__list" data-filter="${strCategory}" aria-label="${strCategory} 하위 필터">${strSubButtonsHtml}</ul>`;
        }
      });

      // 4. 카테고리가 없으면 (데이터 없음 & 전체 버튼 없음)
      if (strTopFiltersHtml === '') {
        elTopWrapper.remove();
        return;
      }

      // 5. 상위 필터 렌더링 (필터가 존재할 경우만 실행됨)
      elFilterList.innerHTML = strTopFiltersHtml;

      // 6. [동적 DOM 제어] 서브 필터 래퍼 처리
      let elSubWrapper = elContainer.querySelector('.c-filter-container__wrapper.is-sub-filter');

      if (hasSubCategoryData) {
        // 래퍼가 없으면 생성
        if (!elSubWrapper) {
          elSubWrapper = document.createElement('div');
          elSubWrapper.className = 'c-filter-container__wrapper is-sub-filter';
          elTopWrapper.after(elSubWrapper);
        }
        elSubWrapper.innerHTML = strSubListHtml;
      } else {
        if (elSubWrapper) {
          elSubWrapper.remove();
        }
      }
    }

    createCardTemplate(data) {
      const imgSrc = data["#Image"] ? data["#Image"] : "./images/default_product.png";
      const filterKey = data["#Category"] || "";
      const subFilterKey = data["#SubCategory"] || "";

      return `
                <li class="c-product__item" data-filter="${filterKey}" data-sub-filter="${subFilterKey}">
                    <div class="c-product__inner">
                        <div class="c-product__visual">
                            <div class="c-product__image-wrapper">
                                <img src="${imgSrc}" alt="${data["#Title"]}, 제품코드(${data["#Code"]})" class="c-product__image">
                            </div>
                        </div>
                        <div class="c-product__info-container has-margin-top--10">
                            <ul class="c-product__badge-container">
                                <li class="c-product__badge c-product__badge--black ${this.checkHidden(data["#Badge1"])}">${data["#Badge1"]}</li>
                                <li class="c-product__badge c-product__badge--red ${this.checkHidden(data["#Badge2"])}">${data["#Badge2"]}</li>
                                <li class="c-product__badge c-product__badge--seeblue ${this.checkHidden(data["#Badge3"])}">${data["#Badge3"]}</li>
                            </ul>
                            <div class="c-product__info has-padding-bottom--10 c-line c-line--bottom c-line--solid c-line--color-gray">
                                <strong class="c-product__name home__app-lge__title">${data["#Title"]}</strong>
                                <span class="c-product__model-id">${data["#Code"]}</span>
                            </div>
                            <span class="c-product__details has-padding-top--15 ${this.checkHidden(data["#Detail"])}">
                                ${data["#Detail"]}
                            </span>
                            <div class="c-product__price-area">
                                <ul class="c-product__prices ${this.checkSectionHidden(data, 1)}">
                                    ${this.generatePriceRows(data, 1)}
                                </ul>
                                <ul class="c-product__prices ${this.checkSectionHidden(data, 2)}">
                                    ${this.generateSectionHeader(data, 2)}
                                    ${this.generatePriceRows(data, 2)}
                                </ul>
                                <ul class="c-product__prices ${this.checkSectionHidden(data, 3)}">
                                    ${this.generateSectionHeader(data, 3)}
                                    ${this.generatePriceRows(data, 3)}
                                </ul>
                                <ul class="c-product__prices ${this.checkSectionHidden(data, 4)}">
                                    ${this.generateSectionHeader(data, 4)}
                                    ${this.generatePriceRows(data, 4)}
                                </ul>
                            </div>
                            <div class="c-button-group has-margin-top--20 ${this.checkHidden(data["#Link"])}">
                                <a class="c-button c-button--secondary c-button--horizontal-large" href="${data["#Link"]}" aria-label="${data["#Title"]}, 제품코드(${data["#Code"]}} 구독하러 가기">
                                    <span class="c-button__text">구독하러 가기</span>
                                    <span class="c-button__icon c-button__icon--arrow-right-black" aria-hidden="true"></span>
                                </a>
                            </div>
                        </div>
                    </div>
                </li>
            `;
    }

    /**
     * 섹션별 가격 Row 생성 (1.1 ~ 1.N / 2.1 ~ 2.N ...)
     */
    generatePriceRows(data, groupIndex) {
      let html = '';
      let maxLength = 8;
      const EX_NAME_KEY = '&color';
      const EX_PRICE_KEY = '&-'; // &~ 과 혼선되지 않도록 주의!

      for (let i = 1; i <= maxLength; i++) {
        let nameKey = `#Name${groupIndex}.${i}`;
        if (!data[nameKey]) nameKey = `#Name${groupIndex}.${i}${EX_NAME_KEY}`;

        // 없으면 해당 번호는 skip
        if (!data[nameKey]) {
          maxLength = i - 1;
          if (i > 1) break;
          continue;
        }
      }

      for (let i = 1; i <= maxLength; i++) {
        let hasLabelColor = '';
        let hasStrike = '';
        let nameKey = `#Name${groupIndex}.${i}`;
        let priceKey = `#Price${groupIndex}.${i}`;
        const detailKey = `#Detail${groupIndex}.${i}`;
        if (!data[nameKey]) {
          nameKey = `#Name${groupIndex}.${i}${EX_NAME_KEY}`;
          if (data[nameKey] && groupIndex === 4)
            hasLabelColor = 'has-color';
        }

        // 이름이나 가격 정보가 없으면 해당 번호는 skip
        if (!data[nameKey] && !data[priceKey]) {
          if (i > 1) break;
          continue;
        }

        const nameValue = data[nameKey] || '';
        const priceValue = this.getValueByKeyPattern(data, priceKey);
        const detailValue = data[detailKey] || '';

        // 스타일 결정: 1.1(정상가)만 취소선(strike), 나머지는 강조색(red) 혹은 일반
        let valueClass = 'c-product__price-value';
        if (data.hasOwnProperty(`#Price${groupIndex}.${i}${EX_PRICE_KEY}`)) {
          valueClass += ' strike'; // 취소선
        } else if (groupIndex > 1) {
          valueClass += ' red'; // 2.x, 3.x, 4.x 는 붉은색 강조
        }

        // 1.1 인 경우는 기존처럼 label 옆에 붙이고, 
        // 1.2 이상부터는 별도 div로 분리
        let labelContent = nameValue;
        let detailHtml = '';

        if (detailValue) {
          if (groupIndex === 1) {
            // 첫 번째 항목은 라벨 옆에 붙임 (기존 유지)
            labelContent += `<span class="c-product__details"> ${detailValue}</span>`;
          } else {
            // 두 번째 항목부터는 아래 라인에 별도 div로 생성
            detailHtml = `<span class="c-product__details">${detailValue}</span>`;
          }
        }

        // 구분선
        let hasSeperatorLine = '';
        if (groupIndex === 4 && (i === maxLength / 2)) {
          hasSeperatorLine = ' c-line c-line--bottom c-line--dashed c-line--color-gray has-padding-bottom--10 has-margin-bottom--10';
        }

        html += `
                <li class="c-product__price-item ${hasSeperatorLine}">
                    <span class="c-product__price-label ${hasLabelColor}">${labelContent}</span>
                    <span class="${valueClass}">${priceValue}</span>
                </li>
                ${detailHtml}
                `;
      }
      return html;
    }

    /**
     * 섹션 헤더 생성 (2.x, 3.x, 4.x 용)
     * - #Gubun{index} : 메인 타이틀
     * - #Detail{index} : 추가 설명 (bracket-note)
     */
    generateSectionHeader(data, groupIndex) {
      const gubunKey = `#Gubun${groupIndex}`;
      const detailKey = `#Detail${groupIndex}`;
      const title = data[gubunKey] + '  ';
      const detail = data[detailKey];

      if (!title) return '';
      const detailHtml = detail ? `<span class="bracket-note">${detail}</span>` : '';
      return `<div class="c-section-header">${title}${detailHtml}</div>`;
    }

    /**
     * 섹션 전체 숨김 여부 체크
     * 해당 그룹의 첫 번째 데이터(#NameX.1 또는 #GubunX)가 없으면 hidden-all 처리
     */
    checkSectionHidden(data, groupIndex) {
      if (data[`#Gubun${groupIndex}`] || data[`#Name${groupIndex}.1`]) {
        return '';
      }
      return 'hidden-all';
    }

    /**
     * Price 단위 포맷팅
     */
    getValueByKeyPattern(data, baseKey) {
      // strike (취소선)
      if (data.hasOwnProperty(baseKey + "&-")) {
        return this.formatPrice(data[baseKey + "&-"]);
      }
      // 원 ~
      if (data.hasOwnProperty(baseKey + "&~")) {
        return this.formatPrice(data[baseKey + "&~"]) + '<span class="price-unit">원 ~</span>';
      }
      // 기본 값
      if (data.hasOwnProperty(baseKey)) {
        return this.formatPrice(data[baseKey]);
      }
      return "";
    }
    checkHidden(value) {
      return (value === null || value === undefined || value === 'undefined' || value === "" || value === "null") ? "hidden-all" : "";
    }
    formatPrice(value) {
      if (!value && value !== 0) return "";
      if (typeof value === 'number') return value.toLocaleString() + '<span class="price-unit">원</span>';
      return value;
    }

    /**
     * 상품명 라인 수에 따른 스타일(여백 설정)
     */
    updateProductNameStyle() {
      if (!this.elProduct) return;

      const elNames = this.elProduct.querySelectorAll('.c-product__name');
      if (elNames.length === 0) return;

      elNames.forEach((elName) => {
        // 현재 적용된 스타일의 line-height 계산 (px 단위로 반환됨)
        const oStyle = window.getComputedStyle(elName);
        const nLineHeight = parseFloat(oStyle.lineHeight);
        const nClientHeight = elName.clientHeight;

        // line-height 값을 가져오지 못하는 경우(normal 등) 대비 예외 처리 혹은 기본값 설정 필요
        // 일반적으로 브라우저에서 px로 변환되어 들어오나, 안전장치로 로직 수행
        if (isNaN(nLineHeight)) {
          return;
        }

        // 높이 비교: 실제 높이가 라인 높이와 비슷하면 1줄로 판단
        // (오차 범위 고려하여 nLineHeight * 1.2 등으로 여유를 둘 수도 있음)
        const isSingleLine = (nClientHeight <= nLineHeight + 2); // +2는 렌더링 오차 보정
        elName.classList.toggle('is-single-line', isSingleLine);
      });
    };

    initProductLayout() {
      this.updateProductNameStyle();
      window.addEventListener('resize', () => {
        this.updateProductNameStyle();
      });
    };
  }

  function initAutoCreateProductListsFromJson() {
    const elTargetLists = document.querySelectorAll('.c-product__list.loaded-from-map');
    const arrProductListInstances = [];

    elTargetLists.forEach(elList => {
      const strJsonPath = elList.dataset.jsonPath;
      const strTargetId = elList.id;

      if (strJsonPath && strTargetId) {
        const instance = new CreaterProductListsByJson(strJsonPath, `#${strTargetId}`);
        arrProductListInstances.push(instance);
      }
    });

    document.addEventListener('AutoCreateProductListsRendered', (e) => {
      const targetElement = e.detail.element;
      const elContainer = targetElement.closest('.c-filter-container');

      if (elContainer && !elContainer.dataset.filterInitialized) {
        const filterComponent = new FilterComponent(elContainer);
        elContainer.dataset.filterInitialized = 'true';
      }
    });
  }

  (function () {
    console.log('[LG전자] script loaded');

    let initialized = false;

    function initLGE() {
      if (initialized) return;

      initialized = true;
      console.log('[LG전자] init HomeStyleProductUIController');
      const productUpdater = new ProductCardUpdater();

      initAutoCreateProductListsFromJson();
    }

    // DOM 상태 분기 (DOMContentLoaded 이미 지난 경우 대응)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initLGE);
    } else {
      initLGE();
    }

    // OMS / Ajax / SPA 대응
    const domObserver = new MutationObserver(() => {
      if (initialized) return;
      initLGE();
    });

    domObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  })();

  (function () {
    const PREFIX = 'https://www.lge.co.kr';

    function fixLinks() {
      const items = document.querySelectorAll('.lge__item');
      if (!items.length) return false;

      items.forEach(item => {
        const links = item.querySelectorAll('a[href]');
        if (!links.length) return;

        // 1️⃣ 첫 번째 a = 실제 상품 URL
        const mainLink = links[0];
        let mainHref = mainLink.getAttribute('href');

        if (!mainHref) return;

        // prefix 보정
        if (!mainHref.startsWith('http')) {
          mainHref = PREFIX + mainHref;
          mainLink.setAttribute('href', mainHref);
        }

        // 2️⃣ 나머지 a 태그들 (# 인 경우만 동기화)
        links.forEach((a, idx) => {
          if (idx === 0) return;

          const href = a.getAttribute('href');
          if (href === '#' || !href) {
            a.setAttribute('href', mainHref);
          }
        });
      });

      console.log('[LGE] all product links fixed');
      return true;
    }

    // LG product-api.js 렌더 완료 이후 대응
    let tryCount = 0;
    const maxTry = 30;

    const interval = setInterval(() => {
      tryCount++;

      const done = fixLinks();
      if (done || tryCount >= maxTry) {
        clearInterval(interval);
      }
    }, 300);
  })();

  (function () {
    // mixed LG가전 리스트를 mixed 홈스타일 리스트로 이동 (index 지정 가능)
    function moveLGEItems() {
      const targetList = document.querySelector(
        '.mixed__list .c-product__list'
      );
      const sourceWrapper = document.querySelector('.lge_mixed__list');
      const sourceItems = document.querySelectorAll(
        '.lge_mixed__list .c-product__item'
      );

      if (!targetList || !sourceItems.length) return false;

      const indexCountMap = {};

      sourceItems.forEach(li => {
        const indexAttr = li.getAttribute('data-lge-index');
        let index = targetList.children.length; // 기본: 맨뒤

        if (indexAttr) {
          const baseIndex = parseInt(indexAttr, 10) - 1;

          indexCountMap[baseIndex] = indexCountMap[baseIndex] || 0;
          index = baseIndex + indexCountMap[baseIndex];
          indexCountMap[baseIndex]++;
        }

        const refNode = targetList.children[index] || null;
        targetList.insertBefore(li, refNode);
      });

      // ✅ 모든 아이템 이동 후 source wrapper 숨김
      if (sourceWrapper) {
        sourceWrapper.style.display = 'none';
      }

      console.log('[MIXED] LGE items moved & source list hidden');
      return true;
    }

    let tryCount = 0;
    const maxTry = 30;

    const interval = setInterval(() => {
      tryCount++;
      const done = moveLGEItems();

      if (done || tryCount >= maxTry) {
        clearInterval(interval);
      }
    }, 300);
  })();




})();