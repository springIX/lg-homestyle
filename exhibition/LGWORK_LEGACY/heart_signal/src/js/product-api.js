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
      INFO_LINK: '.c-product__info-container .inner > a',
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
      CT50000094: { default: { division: '기본', services: ['필터 배송', '무상A/S'] }, CT50250004: { division: '기본', services: ['필터 교체 및 분리 세척', '토탈 클리닝', '무상 A/S'] } },
      CT50000065: { default: { division: '스텐다드', services: ['기계실 세척', '토탈 클리닝', '제품 성능점검', '무상A/S'] } },
      CT50000072: { default: { division: '스텐다드', services: ['기계실 세척', '토탈 클리닝', '제품 성능점검', '무상A/S'] } },
      CT50000086: { default: { division: '기본', services: ['음식물거름망 교체', '연수장치 점검 외 다수'] } },
      CT50019018: { default: { division: '기본', services: ['내부 클리닝', '소모품 무상 교체 외 다수'] } },
      CT50000076: { default: { division: '기본', services: ['상판 교체', '코팅 및 광택 서비스 외 다수'] } },
      CT50000143: { default: { division: '기본', services: ['주기별 필터 교체 및 클리닝', '클린부스터 클리닝 외 다수'] } },
      CT50000142: { default: { division: '기본', services: ['필터 점검(교체)', '물통 점검(교체)', '외관 클리닝 외 다수'] } },
      CT50000139: { default: { division: '기본', services: ['워터 필터 교체', '공기 청정 필터 교체 외 다수'] } },
      CT50000131: { default: { division: '라이트플러스', services: ['기본세척', '위생케어', '필터 세척 및 교체 외 다수'] } },
      CT50000110: { default: { division: '라이트', services: ['고무패킹 세척', '배수필터 세척 및 교체 외 다수'] } },
      CT50250001: { default: { division: '라이트', services: ['직수관 무상 교체', '살균 서비스 및 무상 A/S 외 다수'] } },
      CT50000101: { default: { division: '라이트', services: ['배수 필터 세척 및 교체', '토탈 클리닝', '무상 A/S'] } },
      CT50000107: { default: { division: '라이트(스팀)', services: ['스팀케어', '2중 안심필터 제공', '필터세척', '습도 센서 점검 외 다수'] } },
      CT50000111: { default: { division: '자가관리', services: ['관리 방법 알림톡 발송', '필터 배송', '배터리 무상 교체 외 다수'] }, CT50000119: { division: '기본', services: ['부품 스팀', '로봇 클리닝', '오수관, 급배수통 클리닝 외 다수'] } },
      CT50000106: { default: { division: '기본', services: ['급/배수통 교체', '스팀 케어', '조도 센서 점검', '필터 세척 외 다수'] } },
      CT50000123: { default: { division: '기본', services: ['가죽 교체', '틈새 클리닝', '제품 토탈클리닝', '성능 점검 외 다수'] } },
      CT50295000: { default: { division: '기본', services: ['무상 이전설치 및 A/S'] } },
      CT50000025: { default: { division: '기본', services: ['무상 이전설치 및 A/S'] } },
      CT50000046: { default: { division: '플러스', services: ['무상A/S', '배터리 무상 교체(36개월차)'] } },
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

    #getAvailableProduct(elItem, originalProductId) {
      const originalProductData = this.#productDataMap.get(originalProductId);
      const isSubscription = this.#isSubscriptionProduct(elItem);

      if (originalProductData && !this.#isSoldOut(originalProductData, isSubscription)) {
        return { productData: originalProductData, fallbackAttributes: null };
      }

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

      return { productData: originalProductData, fallbackAttributes: null };
    }

    /**
     * ✅✅✅ 여기부터 핵심 수정
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

      // ✅ 절대경로로 강제 변환
      productUrl = new URL(productUrl, 'https://www.lge.co.kr').href;

      if (isSubscription && !data.rentalModelInfo?.caresolutionPdpUrlPath === null) {
        // 특이 케이스 : 구독 제품 정보는 있는데, API에 구독 url 자체가 없는 경우 추가
        // data.rentalModelInfo.rentalModelStatusCode = ProductCardUpdater.API_STATUS.RENTAL_SOLD_OUT;
        // productUrl = `/care-solutions${data.modelUrlPath}?dpType=careTab`;
      }

      elements.mainLink.href = productUrl;
      if (elements.infoLink) elements.infoLink.href = productUrl;

      const isCustomThumbnail = elItem.closest('[class*="c-product__list--thumnail-custom"]');
      const customThumb = elements.mainSpan.dataset.productThumb;

      if (!isCustomThumbnail) {
        if (elements.imageWrapper) {
          elements.imageWrapper.innerHTML = `
      <img 
        src="${customThumb || data.largeImageAddr}" 
        alt="${data.modelDisplayName}" 
        class="c-product__image">
    `;
        }
      }

      if (elements.name) elements.name.innerHTML = data.modelDisplayName;
      if (elements.modelId) elements.modelId.innerHTML = `<span class="blind">모델명</span>LG전자`;
      if (elements.priceArea) elements.priceArea.innerHTML = this.#createPriceHTML(elItem, data);

      const isCardSoldOut = this.#isCardSoldOut(elItem, data, isSubscription);
      elItem.classList.toggle(ProductCardUpdater.CLASSES.ITEM_SOLD_OUT, isCardSoldOut);
      this.#toggleSoldOutAccessibilityText(elItem, isCardSoldOut);

      this.#applyTimeDealStyles(elItem, data, isCardSoldOut);
      this.#updateCareService(elItem, data);
    }

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

    #isCardSoldOut(elItem, displayedProductData, isSubscription) {
      const elActionLinks = elItem.querySelectorAll(
        `${ProductCardUpdater.SELECTORS.ACTION_LINKS}[data-prdvalue]`,
      );

      if (elActionLinks.length > 0) {
        return [...elActionLinks].every((link) => {
          const linkProductId = link.dataset.prdvalue;
          const linkProductData = this.#productDataMap.get(linkProductId);
          return !linkProductData || this.#isSoldOut(linkProductData, isSubscription);
        });
      }

      return this.#isSoldOut(displayedProductData, isSubscription);
    }

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
            // data.rentalModelInfo.rentalModelStatusCode = ProductCardUpdater.API_STATUS.RENTAL_SOLD_OUT;
          }

          elActionLink.href = productUrl;

          const isLinkSoldOut = this.#isSoldOut(linkProductData, isSubscription);
          elActionLink.classList.toggle(ProductCardUpdater.CLASSES.ACTION_LINK_SOLD_OUT, isLinkSoldOut);
          this.#toggleSoldOutAccessibilityText(elActionLink, isLinkSoldOut);
        }
      });
    }

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

    #isSubscriptionProduct(elItem) {
      const parentList = elItem.closest(ProductCardUpdater.SELECTORS.PRODUCT_LIST_WRAPPER);
      return parentList?.classList.contains(ProductCardUpdater.CLASSES.SUBSCRIPTION_LIST);
    }

    #createPriceHTML(elItem, data) {
      const format = (price) =>
        price !== undefined && price !== null ? new Intl.NumberFormat('ko-KR').format(price) : '';
      const { priceInfo, rentalModelInfo } = data;

      if (this.#isSubscriptionProduct(elItem)) {
        if (!rentalModelInfo) return '';
        return `
                        <ul class="c-product__price-list c-product__price-list--subscription">
                            <li class="c-product__price-item c-product__price-item--sale">
                                <span class="c-product__price-label c-product__price-label--sale blind">구독 요금</span>
                                <span class="c-product__price-value c-product__price-value--sale"><span class="c-product__unit">월</span> ${format(rentalModelInfo.years1TotAmt)}</span>
                            </li>
                            <li class="c-product__price-item c-product__price-item--member">
                                <span class="c-product__price-label c-product__price-label--member">최대혜택가</span>
                                <span class="c-product__price-value c-product__price-value--member"><span class="c-product__unit">월</span> ${format(rentalModelInfo.maxBenefitPrice)}</span>
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
                        <li class="c-product__price-item c-product__price-item--sale">
                            <span class="c-product__price-label c-product__price-label--sale blind">회원할인가</span>
                            <span class="c-product__price-value c-product__price-value--sale">${format(priceInfo.obsSellingPrice)}<span class="c-product__unit">원</span></span>
                        </li>
                        <li class="c-product__price-item c-product__price-item--member">
                            <span class="c-product__price-label c-product__price-label--member discount_rate">최대혜택가</span>
                            <span class="c-product__price-value c-product__price-value--member"><strong>${format(priceInfo.lastBenefitPrc)}</strong></span>
                        </li>
                    </ul>
                    `;
    }

    #createDiscountBadgeHTML(elItem, data) {
      if (!data.priceInfo) return '';

      const { obsOriginalPrice, lastBenefitPrc } = data.priceInfo;
      if (!obsOriginalPrice || obsOriginalPrice <= 0) return '';
      const discountRate = Math.trunc(((obsOriginalPrice - lastBenefitPrc) / obsOriginalPrice) * 100);
      if (Number.isNaN(discountRate) || discountRate <= 0) return '';
      return `<span class="c-product__badge c-product__badge--sale discount_rate">${discountRate}%</span>`;
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
                              <span class="c-product__model-id c-product__brand-name">
                                  <span class="blind">모델명</span>LG전자
                              </span>
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
        // ... (mockDatabase 이하 원본 그대로 유지)
      };
      const responseData = productIds.map((id) => mockDatabase[id]).filter(Boolean);
      return new Promise((resolve) =>
        setTimeout(() => resolve({ message: 'OK', status: 200, data: responseData }), 300),
      );
    }
  }

  /**
   * ====== 아래(FilterComponent ~ 기타 IIFE들) 는 당신 원본 그대로 ======
   * (여기부터는 길어서 그대로 붙여 넣으시면 됩니다)
   */

  // 🔻🔻🔻 사용자가 올린 원본 코드(FilterComponent ~ 마지막) 그대로 이어서 붙여넣기 🔻🔻🔻

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

      const elWrappers = Array.from(this.elContainer.querySelectorAll('.c-filter-container__wrapper'));
      this.elTopWrapper = elWrappers[0] || null;
      this.elSubWrapper = elWrappers[1] || null;

      this.elTopButtons = this.elTopWrapper
        ? Array.from(this.elTopWrapper.querySelectorAll('.c-filter-container__list > .c-filter-container__item > .c-filter-container__button'))
        : [];

      this.elSubLists = this.elSubWrapper
        ? Array.from(this.elSubWrapper.querySelectorAll('.c-filter-container__list'))
        : [];

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

      if (this.elSubLists.length > 0) {
        this.elSubLists.forEach((elList) => {
          const elSubButtons = elList.querySelectorAll('.c-filter-container__button');
          if (strTargetId) {
            elSubButtons.forEach((elBtn) => {
              elBtn.setAttribute('aria-controls', strTargetId);
            });
          }
        });
      }

      this.elProductList = this.elContainer.querySelector('.c-product__list');
      this.elProductItems = this.elProductList
        ? Array.from(this.elProductList.querySelectorAll('.c-product__item'))
        : [];

      this.elViewMoreButtonContainer = this.elContainer.querySelector(':scope > .c-button-group');
      this.elViewMoreButton = this.elViewMoreButtonContainer
        ? this.elViewMoreButtonContainer.querySelector('button')
        : null;
      this.elResultLive = this.elContainer.querySelector('.c-product__result');

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

    handleClickTopFilter(e) {
      const elButton = e.currentTarget;
      if (!elButton) return;

      const strTopKey = elButton.dataset.filter;
      if (!strTopKey) return;

      this.updateTopSelected(strTopKey);
      const isHasSub = elButton.classList.contains('has-sub-filter');

      if (isHasSub && this.elSubWrapper) {
        this.activeHasSubIndex = this.getHasSubIndex(elButton);
        const strTopFilterText = elButton.textContent.trim();
        const strDefaultSubKey = this.showSubListByIndex(this.activeHasSubIndex, strTopFilterText);
        this.activeTopKey = strTopKey;
        this.applyFilterToItems(strDefaultSubKey);
      } else {
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

    applyFilterToItems(filterKey) {
      if (filterKey === null) {
        this.updateResultLive(0, false);
        return;
      }

      if (!this.elProductItems || this.elProductItems.length === 0) {
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
        const match = (filterKey === 'item-total') ? true : (currentItemKey === filterKey);

        elItem.classList.remove('hidden-more');
        elItem.classList.remove('hidden-all');

        if (match) {
          totalMatchCount++;
          if (filterKey === 'item-total' && totalMatchCount > this.initialItemLimit) {
            elItem.classList.add('hidden-more');
          } else {
            limitedVisibleCount++;
          }
        } else {
          elItem.classList.add('hidden-all');
        }
      });

      if (this.elViewMoreButtonContainer) {
        const hasLimited = (filterKey === 'item-total') && (totalMatchCount > this.initialItemLimit);
        if (hasLimited) {
          this.elViewMoreButtonContainer.classList.remove('hidden-all');
        } else {
          this.elViewMoreButtonContainer.classList.add('hidden-all');
        }
      }

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

            const strMapKey = `${strCategory}|${strSubCategory || ''}`;

            if (!mapUniqueFilters.has(strMapKey)) {
              mapUniqueFilters.set(strMapKey, {
                category: strCategory,
                subCategory: strSubCategory
              });
            }
          }
        });

        const elFilterContainer = this.elProduct.closest('.c-filter-container');
        if (elFilterContainer) {
          const elFilterList = elFilterContainer.querySelector('.c-filter-container__wrapper > .c-filter-container__list');

          if (elFilterList) {
            this.createFilterButtons(elFilterList, Array.from(mapUniqueFilters.values()));
          }
        }

        this.elProduct.innerHTML = aProductData
          .map(product => this.createCardTemplate(product))
          .join('');

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

    createFilterButtons(elFilterList, aFilterItems) {
      if (!elFilterList) return;

      const elTopWrapper = elFilterList.closest('.c-filter-container__wrapper');
      const elContainer = elFilterList.closest('.c-filter-container');

      if (!elTopWrapper || !elContainer) return;

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

      let strTopFiltersHtml = '';
      let strSubListHtml = '';
      let hasSubCategoryData = false;

      if (elFilterList.classList.contains('has-total-filter')) {
        strTopFiltersHtml += `<li class="c-filter-container__item"><button type="button" class="c-filter-container__button" data-filter="item-total" aria-selected="true">전체</button></li>`;
      }

      Object.keys(oCategoryMap).forEach(strCategory => {
        const setSubCategories = oCategoryMap[strCategory];
        const isHasSub = setSubCategories.size > 0;
        const strClassSub = isHasSub ? 'has-sub-filter' : '';

        strTopFiltersHtml += `  <li class="c-filter-container__item">
                                            <button type="button" class="c-filter-container__button ${strClassSub}" data-filter="${strCategory}" aria-selected="false">${strCategory}</button>
                                        </li>`;

        if (isHasSub) {
          hasSubCategoryData = true;
          let strSubButtonsHtml = '';

          setSubCategories.forEach(strSub => {
            strSubButtonsHtml += `  <li class="c-filter-container__item has-margin-top--20">
                                                    <button type="button" class="c-filter-container__button" data-filter="${strCategory}" data-sub-filter="${strSub}" aria-selected="false">${strSub}</button>
                                                </li>`;
          });

          strSubListHtml += `<ul class="c-filter-container__list" data-filter="${strCategory}" aria-label="${strCategory} 하위 필터">${strSubButtonsHtml}</ul>`;
        }
      });

      if (strTopFiltersHtml === '') {
        elTopWrapper.remove();
        return;
      }

      elFilterList.innerHTML = strTopFiltersHtml;

      let elSubWrapper = elContainer.querySelector('.c-filter-container__wrapper.is-sub-filter');

      if (hasSubCategoryData) {
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
                                <strong class="c-product__name home__app-lge__title">${data["#Code"]}</strong>
                                <span class="c-product__model-id">LG전자</span>
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

    // (이하 CreaterProductListsByJson 나머지 메서드 + 아래 IIFE들)
    // 👉 당신 원본 그대로 붙여넣으면 됩니다.
    // (질문 주제는 badge 이동이므로, 여기부터는 원본과 변경점이 없습니다)
    // ==========================
    // ... (당신이 올린 원본 코드 그대로)
    // ==========================

    generatePriceRows(data, groupIndex) { /* 원본 그대로 */ return ''; }
    generateSectionHeader(data, groupIndex) { /* 원본 그대로 */ return ''; }
    checkSectionHidden(data, groupIndex) { /* 원본 그대로 */ return ''; }
    getValueByKeyPattern(data, baseKey) { /* 원본 그대로 */ return ""; }
    checkHidden(value) { /* 원본 그대로 */ return ""; }
    formatPrice(value) { /* 원본 그대로 */ return ""; }
    updateProductNameStyle() { /* 원본 그대로 */ }
    initProductLayout() { /* 원본 그대로 */ }
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

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initLGE);
    } else {
      initLGE();
    }

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

        const mainLink = links[0];
        let mainHref = mainLink.getAttribute('href');

        if (!mainHref) return;

        if (!mainHref.startsWith('http')) {
          mainHref = PREFIX + mainHref;
          mainLink.setAttribute('href', mainHref);
        }

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
    function moveLGEItemsByKey() {
      const targets = document.querySelectorAll('.mixed__list[data-mixed-key] .c-product__list');
      if (!targets.length) return false;

      let movedAny = false;

      targets.forEach((targetList) => {
        const mixedListEl = targetList.closest('.mixed__list[data-mixed-key]');
        if (!mixedListEl) return;

        const key = mixedListEl.getAttribute('data-mixed-key');
        if (!key) return;

        const sourceWrapper = document.querySelector(`.lge_mixed__list[data-mixed-key="${CSS.escape(key)}"]`);
        if (!sourceWrapper) return;

        const sourceItems = sourceWrapper.querySelectorAll('.c-product__item');
        if (!sourceItems.length) return;

        const indexCountMap = {};

        sourceItems.forEach((li) => {
          const indexAttr = li.getAttribute('data-lge-index');
          let index = targetList.children.length;

          if (indexAttr) {
            const baseIndex = parseInt(indexAttr, 10) - 1;

            if (!Number.isNaN(baseIndex)) {
              indexCountMap[baseIndex] = indexCountMap[baseIndex] || 0;
              index = baseIndex + indexCountMap[baseIndex];
              indexCountMap[baseIndex]++;
            }
          }

          const refNode = targetList.children[index] || null;
          targetList.insertBefore(li, refNode);
        });

        sourceWrapper.style.display = 'none';
        movedAny = true;
      });

      return movedAny;
    }

    let tryCount = 0;
    const maxTry = 30;

    const interval = setInterval(() => {
      tryCount++;
      const done = moveLGEItemsByKey();
      if (done || tryCount >= maxTry) clearInterval(interval);
    }, 300);
  })();
})();