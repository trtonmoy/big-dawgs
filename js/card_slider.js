jQuery(window).on('elementor/frontend/init', function () {
  elementorFrontend.hooks.addAction('frontend/element_ready/rkit-card-slider.default', function ($scope, $) {
    var wrapper = $scope.find('.rkit-slider-wrapper');
    var cards = $scope.find('.cards');
    var cardWidth = cards.first().find('.card').outerWidth();
    var cardsSlider = $scope.find('.cards-slider');
    var totalCards = cards.find('.card').length;
    var cardsInView = Math.floor(cardsSlider.outerWidth() / cardWidth);
    var maxTranslateX = 0;
    var minTranslateX = -(cards.outerWidth() - cardsSlider.width());
    var currentTranslateX = 0;
    var isDragging = false;
    var startX = 0;
    var startTranslateX = 0;
    var velocityX = 0;
    var animationFrame;

    var dotContainer = $scope.find('.dot-container');
    var dots;

    function createDots() {
      dotContainer.empty();
      dotsCount = Math.ceil(totalCards / cardsInView);
      for (var i = 0; i < dotsCount; i++) {
        dotContainer.append('<div class="dot" data-index="' + i + '"></div>');
      }
      dots = wrapper.find('.dot');
      dots.eq(0).addClass('active');
    }

    createDots();

    // Event ketika mouse ditekan pada slider
    cardsSlider.on('mousedown', function (event) {
      cardsSlider.addClass('dragging');
      startDrag(event.pageX);
    });

    // Event ketika touch dimulai pada slider
    cardsSlider.on('touchstart', function (event) {
      startDrag(event.originalEvent.touches[0].pageX);
    });

    // Event ketika mouse bergerak atau touch bergerak
    cardsSlider.on('mousemove touchmove', function (event) {
      event.preventDefault();
      if (isDragging) {
        var diffX;
        if (event.type === 'mousemove') {
          diffX = event.pageX - startX;
        } else if (event.type === 'touchmove') {
          diffX = event.originalEvent.touches[0].pageX - startX;
        }
        var translateX = startTranslateX + diffX;

        translateX = Math.max(Math.min(translateX, maxTranslateX), minTranslateX);

        cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(function () {
          cards.css({
            'transition': 'none',
            'transform': 'translate3d(' + translateX + 'px, 0, 0)'
          });

          currentTranslateX = translateX;
          velocityX = diffX;

          if (currentTranslateX === minTranslateX || currentTranslateX === maxTranslateX) {
            var maxDragDistance = cardsSlider.outerWidth() / 3;
            var bounceTranslateX = currentTranslateX + Math.min(Math.max(velocityX * 0.4, -maxDragDistance), maxDragDistance);

            cards.css({
              'transition': '', // Tambahkan transisi bounce
              'transform': 'translate3d(' + bounceTranslateX + 'px, 0, 0)'
            });

            currentTranslateX = bounceTranslateX;

            // Hentikan animasi setelah transisi bounce selesai
            cards.on('transitionend', function () {
              cards.css('transition', '');
            });
          }

        });
      }
    });

    // Event ketika mouse dilepas atau touch selesai di dokumen
    cardsSlider.on('mouseup mouseleave touchend', function () {
      if (isDragging) {
        isDragging = false;
        cardsSlider.removeClass('dragging');
        cards.css('transition', 'transform 0.3s ease-in-out'); // Tambahkan transisi
        // Hentikan animasi setelah transisi selesai
        cards.on('transitionend', function () {
          cards.css('transition', '');
        });

        // Kurangi kecepatan transform seiring waktu
        var deceleration = 0.75;
        var velocityThreshold = 0.65;

        function animateDeceleration() {
          if (Math.abs(velocityX) > velocityThreshold) {
            velocityX *= deceleration;
            var translateX = currentTranslateX + velocityX;

            translateX = Math.max(Math.min(translateX, maxTranslateX), minTranslateX);
            cancelAnimationFrame(animationFrame);
            animationFrame = requestAnimationFrame(function () {
              cards.css({
                'transition': 'none',
                'transform': 'translate3d(' + translateX + 'px, 0, 0)'
              });

              currentTranslateX = translateX;

              if (Math.abs(velocityX) > velocityThreshold) {
                animateDeceleration();
              }
              if (currentTranslateX == maxTranslateX || currentTranslateX == minTranslateX) {
                var bounceTranslateX = currentTranslateX + velocityX * 3.4;
                cards.css({
                  'transition': 'transform 0.4s', // Tambahkan transisi bounce
                  'transform': 'translate3d(' + bounceTranslateX + 'px, 0, 0)'
                });

                currentTranslateX = bounceTranslateX;

                // Hentikan animasi setelah transisi bounce selesai
                cards.on('transitionend', function () {
                  cards.css('transition', '');
                });
              }
            });
          }
          updateActiveDot();
        }

        animateDeceleration();
      }
    });

    // Event ketika dot diklik
    dots.click(function () {
      var dotIndex = $(this).data('index');
      var indexTranslate = (dotIndex / (dotsCount - 1));
      var translateX = indexTranslate * minTranslateX;

      cards.css({
        'transition': 'transform 0.3s ease-in-out', // Tambahkan transisi
        'transform': 'translate3d(' + translateX + 'px, 0, 0)'
      });

      currentTranslateX = translateX;
      updateActiveDot();

      // Hentikan animasi setelah transisi selesai
      cards.on('transitionend', function () {
        cards.css('transition', '');
      });
    });

    // Memperbarui dot yang aktif dan indeks dot berdasarkan nilai translateX saat ini
    function updateActiveDot() {
      dots.removeClass('active');

      // Perhitungan indeks dot aktif
      var dotIndex;
      if (currentTranslateX === maxTranslateX) {
        dotIndex = 0;
      } else if (currentTranslateX === minTranslateX) {
        dotIndex = dotsCount - 1;
      } else {
        dotIndex = Math.abs(Math.round(currentTranslateX / (cardWidth * cardsInView)));
      }
      dots.eq(dotIndex).addClass('active');
    }

    function startDrag(position) {
      isDragging = true;
      startX = position;
      startTranslateX = currentTranslateX;
    }

    $(window).on('resize', function () {
      // Jalankan kembali fungsi untuk mengupdate nilai yang berhubungan dengan ukuran dan tampilan slider
      cardWidth = cards.first().find('.card').outerWidth();
      cardsInView = Math.floor(cardsSlider.outerWidth() / cardWidth);
      minTranslateX = -(cards.outerWidth() - cardsSlider.width());

      // Perbarui posisi kartu berdasarkan perubahan ukuran jendela
      var translateX = (currentTranslateX / cardWidth) * cardWidth * cardsInView;
      translateX = Math.max(Math.min(translateX, maxTranslateX), minTranslateX);

      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(function () {
        cards.css({
          'transition': 'none',
          'transform': 'translate3d(' + translateX + 'px, 0, 0)'
        });

        currentTranslateX = translateX;

        // Perbarui dot yang aktif
        updateActiveDot();

        // Perbarui jumlah dot dan elemen dot
        createDots();
      });
    });
  });
});
