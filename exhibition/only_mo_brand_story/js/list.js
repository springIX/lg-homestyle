(() => {
  const base = 'https://www.lge.co.kr/home_style_pages/2026/03/only_mo_brand_story/html/';

  const files = [
    'herman_miller_url.html', 'de_bejarry_url.html', 'lemnos_url.html', 'flos_url.html',
    'villeroy_and_boch_url.html', 'de_sede_url.html', 'zanotta_url.html', 'ferm_living_url.html',
    'ginori_url.html', 'pappelina_url.html', 'magis_url.html', 'donna_wilson_url.html',
    'neva_url.html', 'perceval_url.html', 'martinelli_luce.html', 'kartell.html', 'debuyer.html',
    'bert_frank.html', 'knoll_url.html', 'true_tower.html', 'ton.html', 'pyrenex.html', 'larochere.html',
    'alessi.html', 'string_furniture.html', 'porro.html', 'jean_dubost.html', 'ferroluce.html',
    'volta.html', 'ligne_roset.html', 'bosse.html', 'artisan.html', 'humanscale.html', 'mara.html', 'lapalma.html'
  ];

  const current = location.pathname.split('/').pop();

  const box = document.createElement('div');
  box.style = 'position:fixed;top:100px;right:20px;z-index:9999;background:#000;padding:10px;color:#fff;';

  // 🔽 버튼
  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = '목록 열기';
  toggleBtn.style = 'margin-bottom:8px;width:100%;cursor:pointer;';
  box.appendChild(toggleBtn);

  // 🔽 리스트 영역
  const list = document.createElement('div');
  list.style = 'display:none;max-height:60vh;overflow:auto;';

  files.forEach((file, i) => {
    const a = document.createElement('a');
    a.href = base + file;

    const name = file.replace('.html', '').replace(/_/g, ' ');

    a.textContent = `${i + 1}. ${name}`;
    a.style = `
      display:block;
      color:${file === current ? '#ff3b3b' : '#fff'};
      font-size:12px;
      margin-bottom:5px;
      font-weight:${file === current ? 'bold' : 'normal'};
    `;

    list.appendChild(a);
  });

  box.appendChild(list);

  // 🔥 토글 기능
  let isOpen = false;
  toggleBtn.addEventListener('click', () => {
    isOpen = !isOpen;
    list.style.display = isOpen ? 'block' : 'none';
    toggleBtn.textContent = isOpen ? '△' : '▽';
  });

  document.body.appendChild(box);
})();