$(function () {
  $('.link_btn').click(function () {
    $('html, body').animate(
      { scrollTop: $(this).offset().top },
      300
    );
  });
});