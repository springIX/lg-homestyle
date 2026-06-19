/***********************************************************************************
 * CSR  : http://clm.lge.com/issue/browse/BTOCSITE-113495
 * CODE : 운영 : EV00008801/ 개발 : EV00021111
 * TESTEXHCODE : 운영 : PE00827005/ 개발 : PE00423001
 * FILE : /kr/event/2025/12/12_home_coupon/js/event_layer.js
 * DESC : 홈스타일 쿠폰 발급 테스트 스크립트 (alert 보장 버전)
************************************************************************************/

import {
  retrieveEventPeriod,
  getConfValueMap,
  errorAlert,
  toDateString
} from "/kr/event/common/event_client.js";

/**
 * ✅ jQuery 2개 로드 환경에서도 안정적으로:
 * "이 파일 로드 시점의 jQuery"를 고정해서 사용
 */
const $CAP = window.jQuery;
window.__$CAP = $CAP;

console.log("[event_layer] LOADED", location.origin, $CAP?.fn?.jquery);

/**
 * ✅ 운영/개발 이벤트코드 분기
 */
const eventId = ["test.lge.co.kr", "wwwdev50.lge.co.kr"].includes(location.hostname)
  ? "EV00021111"
  : "EV00008801";

/**
 * ✅ 옵션:
 * - true: 로그인 필요 시 바로 로그인 페이지로 이동
 * - false: 로그인 필요 팝업만 띄움
 */
const GO_LOGIN_IMMEDIATELY = false;

/**
 * ✅ loginUrl 상대경로(/sso/...)를 안전하게 절대경로로 변환
 */
function buildLoginHref(loginUrl) {
  const raw = String(loginUrl || "");
  if (!raw) return "";
  if (raw.startsWith("http")) return raw;

  const path = raw.startsWith("/") ? raw : ("/" + raw);
  return "https://www.lge.co.kr" + path;
}

/**
 * ✅ 홈스타일 쿠폰 다운로드 API (절대경로 고정)
 */
async function downloadHomeStyleCoupons(couponNos = []) {
  const url = "https://livingapi.lge.co.kr/displaysvc/ajax/v1/coupons/download";

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ coupons: couponNos })
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }

  console.log("[coupon] download response", res.status, json);

  if (!res.ok) {
    const msg = json?.message || json?.raw || `HTTP ${res.status}`;
    throw new Error(`download failed: ${msg}`);
  }
  return json;
}

/**
 * ✅ 여기서부터 핵심: "무조건 피드백 보장"
 * - alert는 무조건 실행
 * - focusAlert은 있으면 시도(실패해도 무시)
 */
function fireUserFeedback(btnId, html) {
  // 1) alert 무조건
  try {
    alert(String(html).replace(/<br\s*\/?>/gi, "\n"));
  } catch (e) { }

  // 2) focusAlert 있으면 추가로 시도
  try {
    if (typeof focusAlert === "function") {
      // btnId가 "#" 같은 애매한 값이면 안전 셀렉터로 대체
      const safeFocus = (btnId && btnId !== "#") ? btnId : ".homeCoupon";
      focusAlert({ focusOk: safeFocus, title: html });
    }
  } catch (e) {
    // focusAlert이 내부에서 조용히 죽는 케이스 대비: 아무것도 안함
    console.log("[coupon] focusAlert failed", e);
  }
}

/**
 * ✅ 클릭 핸들러 바인딩 (위임 바인딩)
 */
function bindCoupon() {
  console.log("[event_layer] BIND", Date.now());

  $CAP(document).off("click.homeCoupon");

  $CAP(document).on("click.homeCoupon", ".homeCoupon", async function () {
    console.log("[coupon] 0 click enter", this.id);

    if (typeof dblBtnChk === "function" && !dblBtnChk()) {
      console.log("[coupon] 0-1 dblBtnChk blocked");
      return;
    }

    // 버튼 id 없으면 focusAlert 쪽에서 실패할 수 있어서 보정
    const btnId = this.id ? ("#" + this.id) : ".homeCoupon";

    // data-coupons 파싱
    const couponsAttr = String($CAP(this).data("coupons") || "");
    const couponNos = couponsAttr.split(",").map(s => s.trim()).filter(Boolean);

    try {
      if (window.lgkorUI?.showLoading) window.lgkorUI.showLoading();
      console.log("[coupon] 1 showLoading", { btnId, eventId, couponNos });

      // === [2] 이벤트 기간/로그인 판단 ===
      console.log("[coupon] 2 retrieveEventPeriod start");
      const periodRes = await retrieveEventPeriod({ eventId });
      const periodData = periodRes?.data || {};
      const timestamp = periodRes?.timestamp;
      console.log("[coupon] 2-1 retrieveEventPeriod done", { periodData, timestamp });

      // 이벤트 기간 체크
      if (!(periodData.viewFlag == "Y" || periodData.tempViewFlag == "Y")) {
        fireUserFeedback(btnId, "이벤트 기간이 아닙니다");
        return;
      }

      // from/to 구성코드 조회
      console.log("[coupon] 4 getConfValueMap start");
      const confValueMap = await getConfValueMap([
        `evt_${eventId}_fromDate`,
        `evt_${eventId}_toDate`
      ]);
      console.log("[coupon] 4-1 confValueMap", confValueMap);

      const fromDate = confValueMap[`evt_${eventId}_fromDate`];
      const toDate = confValueMap[`evt_${eventId}_toDate`];
      const nowDate = toDateString(timestamp);
      console.log("[coupon] 5 dates", { fromDate, toDate, nowDate });

      if (fromDate && Number(nowDate) < Number(fromDate)) {
        fireUserFeedback(btnId, "이벤트 오픈을 기대해 주세요");
        return;
      }
      if (toDate && Number(nowDate) > Number(toDate)) {
        fireUserFeedback(btnId, "종료된 이벤트입니다");
        return;
      }

      // 로그인 체크
      console.log("[coupon] 6 loginUrl?", periodData.loginUrl, "origin", location.origin);
      if (periodData.loginUrl) {
        const loginHref = buildLoginHref(periodData.loginUrl);
        console.log("[coupon] 6-1 loginHref", loginHref);

        if (GO_LOGIN_IMMEDIATELY && loginHref) {
          location.href = loginHref;
          return;
        }

        fireUserFeedback(btnId, "LG전자 회원 로그인 후 참여 가능합니다");
        return;
      }

      // 쿠폰번호 체크
      if (!couponNos.length) {
        fireUserFeedback(btnId, "쿠폰번호(data-coupons)가 없습니다");
        return;
      }

      // === [8] 다운로드 호출 ===
      console.log("[coupon] 8 download start", couponNos);
      const downRes = await downloadHomeStyleCoupons(couponNos);
      console.log("[coupon] 8-1 download done", downRes);

      // === [9] 결과 메시지 구성 ===
      const data = downRes?.data || {};
      const coupons = Array.isArray(data.coupons) ? data.coupons : [];

      // 쿠폰별 메시지 만들기
      const lines = coupons.map(c => {
        const no = c?.couponNo || "";
        const ok = c?.isIssue === true;
        const msg = c?.message || "";
        return `${ok ? "✅" : "❌"} ${no}${msg ? " - " + msg : ""}`;
      });

      // 서버가 result=false라도 message가 상세히 올 수 있음
      // totalCount/errorCount가 있으면 함께 표기
      const totalCount = Number.isFinite(data.totalCount) ? data.totalCount : undefined;
      const errorCount = Number.isFinite(data.errorCount) ? data.errorCount : undefined;

      let summary = "";
      if (totalCount !== undefined && errorCount !== undefined) {
        summary = `\n(총 ${totalCount}건 / 실패 ${errorCount}건)`;
      }

      // 최종 문구: 성공/부분성공/실패
      const issuedCnt = coupons.filter(c => c?.isIssue === true).length;
      const failedCnt = coupons.length - issuedCnt;

      if (issuedCnt > 0 && failedCnt === 0) {
        fireUserFeedback(btnId, `쿠폰이 발급되었습니다.\n(마이페이지>쿠폰)${summary}\n\n${lines.join("\n")}`);
        return;
      }
      if (issuedCnt > 0 && failedCnt > 0) {
        fireUserFeedback(btnId, `일부 쿠폰이 발급되었습니다.\n(마이페이지>쿠폰)${summary}\n\n${lines.join("\n")}`);
        return;
      }

      // 전부 실패
      fireUserFeedback(btnId, `쿠폰 발급에 실패했습니다.${summary}\n\n${lines.join("\n") || "응답을 확인해주세요."}`);
    } catch (e) {
      console.log("[coupon] CATCH", e);

      // 에러도 무조건 사용자에게 보여주기
      try {
        alert("오류가 발생했습니다.\n" + (e?.message || e));
      } catch (err) { }

      if (typeof errorAlert === "function") {
        errorAlert(e, { focus: btnId });
      }
    } finally {
      console.log("[coupon] FINALLY hideLoading");
      if (window.lgkorUI?.hideLoading) window.lgkorUI.hideLoading();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bindCoupon);
} else {
  bindCoupon();
}
