function initSwiper(container) {
    const wrapper = container.querySelector('.swiper-content-wrapper');
    const slides = wrapper.querySelectorAll('div');
    const prevBtn = container.querySelector('.prev');
    const nextBtn = container.querySelector('.next');
    const pagination = container.querySelector('.swiper-pagination');

    let currentIndex = 0;
    const totalSlides = slides.length;

    pagination.innerHTML = Array.from({ length: slides.length }, () => `<button></button>`).join('');
    const paginationBtns = pagination.querySelectorAll('button');

    function updateButtons() {
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === totalSlides - 1;
    }

    function goToSlide(index, withTransition = true) {
        if (index < 0) index = 0;
        if (index >= totalSlides) index = totalSlides - 1;
        currentIndex = index;

        wrapper.style.transition = withTransition ? "transform 0.3s ease" : "none";
        wrapper.style.transform = `translateX(-${index * container.clientWidth}px)`;

        paginationBtns.forEach((btn, i) => {
            btn.classList.toggle('active', i === index);
        });

        updateButtons();
    }


    prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
    nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
    paginationBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => goToSlide(index));
    });


    let startX = 0;
    let isDragging = false;
    let currentTranslate = 0;

    function handleMove(clientX) {
        if (!isDragging) return;
        const diff = clientX - startX;
        currentTranslate = -currentIndex * container.clientWidth + diff;
        wrapper.style.transform = `translateX(${currentTranslate}px)`;
    }

    function handleEnd(clientX) {
        if (!isDragging) return;
        isDragging = false;

        const diff = startX - clientX;
        if (Math.abs(diff) > 50) {
            if (diff > 0 && currentIndex < totalSlides - 1) {
                goToSlide(currentIndex + 1);
            } else if (diff < 0 && currentIndex > 0) {
                goToSlide(currentIndex - 1);
            } else {
                goToSlide(currentIndex);
            }
        } else {
            goToSlide(currentIndex);
        }
    }


    wrapper.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        wrapper.style.transition = "none";
    }, { passive: true });

    wrapper.addEventListener('touchmove', (e) => handleMove(e.touches[0].clientX), { passive: true });
    wrapper.addEventListener('touchend', (e) => handleEnd(e.changedTouches[0].clientX));


    wrapper.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        isDragging = true;
        wrapper.style.transition = "none";
        e.preventDefault();
    });

    wrapper.addEventListener('mousemove', (e) => { if (isDragging) handleMove(e.clientX); });
    wrapper.addEventListener('mouseup', (e) => handleEnd(e.clientX));
    wrapper.addEventListener('mouseleave', (e) => { if (isDragging) handleEnd(e.clientX); });


    goToSlide(0);
}

if (document.querySelectorAll('.swiper-container')) {
    document.querySelectorAll('.swiper-container').forEach(initSwiper);
}
