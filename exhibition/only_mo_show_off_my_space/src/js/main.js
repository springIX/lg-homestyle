$(function () {
  setInterval(function () {
    document.querySelectorAll(".notice_box > button").forEach(function (button) {
      button.onclick = function () {
        this.parentElement.classList.toggle("on");
      };
    });
  }, 1000);
});
