// 상품 리스트
const productList = [
  { id: "G25090013549", type: "standalone" },
  { id: "G25080009107", type: "standalone" },
  { id: "G25090019805", type: "standalone" },
  { id: "G25080008724", type: "standalone" },
  { id: "G25110022442", type: "recommended" },
  { id: "G25070006616", type: "recommended" },
  { id: "G25110024618", type: "recommended" },
  { id: "G25080009578", type: "recommended" }
];

const container = document.getElementById("products");

// 상품 데이터 가져오기
function fetchProduct(product) {
  const url = `https://livingapi.lge.co.kr/itemsvc/ajax/v1/pdp/goods/${product.id}`;

  return fetch(url)
    .then(res => res.json())
    .then(res => {
      const data = res.data;
      if (!data) return null;

      const salePrice = data.productStock?.[0]?.salePrice || 0;
      const currentPrice = data.productStock?.[0]?.discountPrice || salePrice;
      const discountRate =
        salePrice > currentPrice
          ? Math.round((salePrice - currentPrice) / salePrice * 100)
          : 0;

      return {
        id: product.id,
        type: product.type,
        productName: data.productName || "",
        salePrice,
        currentPrice,
        discountRate,
        imageUrl: data.images?.[0]?.imageUrl || ""
      };
    });
}

// DOM 준비되면 실행
if (container) {
  Promise.all(productList.map(fetchProduct))
    .then(products => {
      products.forEach(p => {
        if (!p) return;

        container.innerHTML += `
        <a href="https://homestyle.lge.co.kr/item?productId=${p.id}" class="product-card " data-type="${p.type}">
          <img src="https://static-store.lge.co.kr${p.imageUrl}" alt="${p.productName}" />
          <h3>${p.productName}</h3>
          <p>${p.id}</p>
          <div class="price1">할인가 ${p.salePrice.toLocaleString()}원</div>
          <div class="price2">최대혜택가 ${p.currentPrice.toLocaleString()}원</div>
          <!--${p.discountRate > 0 ? `<div>할인율: ${p.discountRate}%</div>` : ""}-->

        </a>
      `;
      });
    });
}

$('.api_products .products_tab button').click(function () {
  $(this).addClass('on').siblings().removeClass('on');
  const type = $(this).data('type');
  $('#products a').hide();
  $('#products a[data-type="' + type + '"]').show();

});