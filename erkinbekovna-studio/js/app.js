(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var selected = {};      // "cat:index" -> {n,p,v,cat}
  var chosenTime = "";
  var activeTab = PRICES[0].id;
  var activePicker = PRICES[0].id;

  /* ---------- Ссылки WhatsApp ---------- */
  function waLink(text) {
    var base = "https://wa.me/" + STUDIO.whatsapp;
    return text ? base + "?text=" + encodeURIComponent(text) : base;
  }
  var hello = "Здравствуйте! Хочу узнать подробнее об услугах " + STUDIO.name;
  ["waAdmin", "waContact", "waFab"].forEach(function (id) { $(id).href = waLink(hello); });

  /* ---------- Шапка ---------- */
  $("year").textContent = new Date().getFullYear();
  var total = PRICES.reduce(function (s, c) { return s + c.items.length; }, 0);
  $("servicesCount").textContent = total;

  window.addEventListener("scroll", function () {
    $("header").classList.toggle("header--solid", window.scrollY > 24);
  }, { passive: true });

  var burger = $("burger"), nav = $("nav");
  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("nav--open");
    burger.setAttribute("aria-expanded", open);
  });
  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") { nav.classList.remove("nav--open"); burger.setAttribute("aria-expanded", "false"); }
  });

  /* ---------- Прайс ---------- */
  function renderTabs() {
    var box = $("tabs");
    box.innerHTML = "";
    PRICES.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "tab" + (c.id === activeTab ? " tab--on" : "");
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", c.id === activeTab);
      b.textContent = c.title;
      b.addEventListener("click", function () { activeTab = c.id; renderTabs(); renderPrices(); });
      box.appendChild(b);
    });
  }
  function renderPrices() {
    var cat = PRICES.filter(function (c) { return c.id === activeTab; })[0];
    var panel = $("pricePanel");
    panel.innerHTML = "";
    var ul = document.createElement("ul");
    ul.className = "price-list";
    cat.items.forEach(function (it) {
      var li = document.createElement("li");
      li.innerHTML = '<span class="price-list__n"></span><span class="price-list__dots"></span><span class="price-list__p"></span>';
      li.children[0].textContent = it.n;
      li.children[2].textContent = it.p + " сом";
      ul.appendChild(li);
    });
    panel.appendChild(ul);
  }

  /* ---------- Выбор услуг в форме ---------- */
  function renderPickerCats() {
    var box = $("pickerCats");
    box.innerHTML = "";
    PRICES.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (c.id === activePicker ? " chip--on" : "");
      b.textContent = c.title;
      b.addEventListener("click", function () { activePicker = c.id; renderPickerCats(); renderPickerList(); });
      box.appendChild(b);
    });
  }
  function renderPickerList() {
    var cat = PRICES.filter(function (c) { return c.id === activePicker; })[0];
    var box = $("pickerList");
    box.innerHTML = "";
    cat.items.forEach(function (it, i) {
      var key = cat.id + ":" + i;
      var label = document.createElement("label");
      label.className = "check";
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = !!selected[key];
      cb.addEventListener("change", function () {
        if (cb.checked) selected[key] = { n: it.n, p: it.p, v: it.v };
        else delete selected[key];
        renderChosen();
      });
      var t = document.createElement("span");
      t.className = "check__t";
      t.textContent = it.n;
      var p = document.createElement("span");
      p.className = "check__p";
      p.textContent = it.p;
      label.appendChild(cb); label.appendChild(t); label.appendChild(p);
      box.appendChild(label);
    });
  }
  function selectedList() { return Object.keys(selected).map(function (k) { return selected[k]; }); }
  function renderChosen() {
    var list = selectedList();
    var box = $("chosen");
    if (!list.length) { box.textContent = "Услуги не выбраны"; return; }
    var sum = list.reduce(function (s, x) { return s + x.v; }, 0);
    var hasFrom = list.some(function (x) { return /от|–|\//.test(x.p); });
    box.textContent = "Выбрано: " + list.length + ". Примерно " + (hasFrom ? "от " : "") + sum + " сом";
    $("errServices").hidden = true;
  }

  /* ---------- Дата и время ---------- */
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function isoDate(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  var dateInput = $("date");
  var today = new Date();
  dateInput.min = isoDate(today);
  var maxD = new Date(); maxD.setDate(maxD.getDate() + 60);
  dateInput.max = isoDate(maxD);

  function renderSlots() {
    var box = $("slots");
    box.innerHTML = "";
    chosenTime = "";
    var v = dateInput.value;
    if (!v) { $("slotHint").hidden = false; $("slotHint").textContent = "Сначала выберите дату."; return; }
    var parts = v.split("-").map(Number);
    var d = new Date(parts[0], parts[1] - 1, parts[2]);
    if (STUDIO.closedWeekdays.indexOf(d.getDay()) !== -1) {
      $("slotHint").hidden = false; $("slotHint").textContent = "В этот день студия не работает."; return;
    }
    var isToday = isoDate(d) === isoDate(new Date());
    var nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    var count = 0;
    for (var m = STUDIO.openHour * 60; m < STUDIO.closeHour * 60; m += STUDIO.slotMinutes) {
      var label = pad(Math.floor(m / 60)) + ":" + pad(m % 60);
      var b = document.createElement("button");
      b.type = "button";
      b.className = "slot";
      b.textContent = label;
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", "false");
      if (isToday && m <= nowMin + 30) { b.disabled = true; }
      else { count++; }
      b.addEventListener("click", (function (btn, lb) { return function () {
        chosenTime = lb;
        Array.prototype.forEach.call(box.children, function (x) { x.classList.remove("slot--on"); x.setAttribute("aria-checked", "false"); });
        btn.classList.add("slot--on"); btn.setAttribute("aria-checked", "true");
        $("errTime").hidden = true;
      }; })(b, label));
      box.appendChild(b);
    }
    $("slotHint").hidden = count > 0;
    if (!count) $("slotHint").textContent = "На сегодня время закончилось, выберите другую дату.";
    $("errDate").hidden = true;
  }
  dateInput.addEventListener("change", renderSlots);

  /* ---------- Отправка в WhatsApp ---------- */
  function formatDate(v) {
    var p = v.split("-");
    var months = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
    var days = ["воскресенье","понедельник","вторник","среда","четверг","пятница","суббота"];
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return +p[2] + " " + months[+p[1] - 1] + " (" + days[d.getDay()] + ")";
  }
  $("bookingForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var list = selectedList();
    var name = $("name").value.trim();
    var ok = true;
    var firstBad = null;
    function bad(id, el) { $(id).hidden = false; ok = false; if (!firstBad) firstBad = el; }
    $("errServices").hidden = $("errDate").hidden = $("errTime").hidden = $("errName").hidden = true;
    if (!list.length) bad("errServices", $("chosen"));
    if (!dateInput.value || dateInput.value < dateInput.min) bad("errDate", dateInput);
    else if (!chosenTime) bad("errTime", $("slots"));
    if (!name) bad("errName", $("name"));
    if (!ok) { firstBad.scrollIntoView({ behavior: "smooth", block: "center" }); return; }

    var sum = list.reduce(function (s, x) { return s + x.v; }, 0);
    var hasFrom = list.some(function (x) { return /от|–|\//.test(x.p); });
    var lines = [];
    lines.push("Здравствуйте! Хочу записаться в " + STUDIO.name + ".");
    lines.push("");
    lines.push("Имя: " + name);
    var phone = $("phone").value.trim();
    if (phone) lines.push("Телефон: " + phone);
    lines.push("Дата: " + formatDate(dateInput.value));
    lines.push("Время: " + chosenTime);
    lines.push("");
    lines.push("Услуги:");
    list.forEach(function (x) { lines.push("• " + x.n + " — " + x.p + " сом"); });
    lines.push("Примерно: " + (hasFrom ? "от " : "") + sum + " сом");
    var c = $("comment").value.trim();
    if (c) { lines.push(""); lines.push("Комментарий: " + c); }
    lines.push(""); lines.push("Подтвердите, пожалуйста, запись.");

    window.open(waLink(lines.join("\n")), "_blank", "noopener");
  });

  renderTabs(); renderPrices(); renderPickerCats(); renderPickerList(); renderChosen();
})();
