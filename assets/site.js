// What If Chess landing site: small progressive enhancements. Every page works without this file.
// 1. Variant loops play only while on screen, and never with Reduce Motion.
// 2. Campaign source: /v/meteor/?src=instagram&ref=clip12 -> App Store link ct=instagram-meteor, the clip ref
//    goes to the app link and the sign-up form. Default source: tiktok (PROJECT.md §13.7, ct=tiktok-<variant>).
// 3. The TestFlight list form: while no form service is configured (no https action yet), it opens an email instead.
(function () {
  "use strict";
  var params = new URLSearchParams(location.search);
  var clean = function (v, max) { return (v || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, max); };
  var src = clean(params.get("src"), 20) || "";
  var ref = clean(params.get("ref"), 40);
  var fromVariant = clean(params.get("v"), 20);
  var known = ["tiktok", "instagram", "youtube", "x", "reddit", "site", "friend", "press"];
  if (known.indexOf(src) < 0) src = "";

  // 1. Loops
  var motionOK = !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var videos = Array.prototype.slice.call(document.querySelectorAll("video[data-loop]"));
  if (motionOK && videos.length) {
    var play = function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { if (e.target.preload !== "auto") e.target.preload = "auto"; play(e.target); }
          else e.target.pause();
        });
      }, { threshold: 0.35 });
      videos.forEach(function (v) { io.observe(v); });
    } else {
      videos.forEach(play);
    }
  }

  // 2. Campaign tokens
  document.querySelectorAll("a[data-appstore]").forEach(function (a) {
    if (!src) return;
    try {
      var u = new URL(a.href);
      u.searchParams.set("ct", (src + "-" + (a.getAttribute("data-appstore") || "site")).slice(0, 40));
      a.href = u.toString();
    } catch (e) { /* keep the static link */ }
  });
  document.querySelectorAll("a[data-deeplink]").forEach(function (a) {
    if (ref) a.href = a.href.split("?")[0] + "?ref=" + encodeURIComponent(ref);
  });
  document.querySelectorAll("a[data-keep-src]").forEach(function (a) {
    if (!src && !ref) return;
    var q = new URLSearchParams();
    if (src) q.set("src", src);
    if (ref) q.set("ref", ref);
    var own = new URLSearchParams((a.getAttribute("href").split("#")[0].split("?")[1]) || "");
    if (own.get("v")) q.set("v", own.get("v"));
    var parts = a.getAttribute("href").split("#");
    a.setAttribute("href", parts[0].split("?")[0] + "?" + q.toString() + (parts[1] ? "#" + parts[1] : ""));
  });

  // 3. Sign-up form
  var form = document.querySelector("form.signup");
  if (!form) return;
  var set = function (name, value) { var f = form.querySelector("[name='" + name + "']"); if (f && value) f.value = value; };
  set("source", src);
  set("ref", ref);
  set("variant", fromVariant);
  var note = form.querySelector(".form-note");
  form.addEventListener("submit", function (ev) {
    var action = form.getAttribute("action") || "";
    if (/^https:\/\//.test(action)) return; // a real form service (https endpoint): submit normally
    ev.preventDefault();
    var email = (form.querySelector("[name='email']") || {}).value || "";
    var platform = (form.querySelector("[name='platform']") || {}).value || "";
    var body = "Please add me to the TestFlight list.\n\nEmail: " + email + "\nPhone: " + platform +
      "\nSource: " + (src || "-") + (ref ? " / " + ref : "");
    location.href = form.getAttribute("data-mailto") + "?subject=" + encodeURIComponent("TestFlight list") +
      "&body=" + encodeURIComponent(body);
    if (note) note.textContent = note.getAttribute("data-mail-text") || "";
  });
})();
