(function () {
  'use strict';

  var EMAIL = 'iukrio@inbox.lv';

  /* Iekārtu veidi: tikai tie darbi, kas norādīti uzņēmuma kartītē. */
  var TYPES = {
    'gaisa-siltumsuknis': {
      name: 'Gaisa siltumsūknis (gaiss–gaiss)',
      works: ['Uzstādīšana', 'Apkope', 'Remonts', 'Konsultācija'],
      area: 'Apsildāmās telpas platība, m²'
    },
    'gaiss-udens': {
      name: 'Gaiss–ūdens siltumsūknis',
      works: ['Uzstādīšana', 'Remonts', 'Konsultācija'],
      area: 'Apkurināmā platība, m²'
    },
    'kondicionieris': {
      name: 'Kondicionieris',
      works: ['Uzstādīšana', 'Apkope', 'Remonts', 'Konsultācija'],
      area: 'Telpas platība, m²'
    },
    'aukstuma-iekartas': {
      name: 'Aukstuma iekārtas',
      works: ['Uzstādīšana', 'Apkope', 'Remonts', 'Konsultācija'],
      area: 'Kameras vai telpas platība, m²'
    },
    'konsultacija': {
      name: 'Vēl nezinu — vajag konsultāciju',
      works: ['Konsultācija'],
      area: 'Telpas platība, m²'
    }
  };

  var $ = function (id) { return document.getElementById(id); };
  var form = $('order-form');
  var sel = $('f-type');
  var err = $('f-type-err');
  var areaLabel = $('f-area-label');
  var summary = $('summary');
  var area = $('f-area');
  var place = $('f-place');
  var nameInp = $('f-name');
  var phone = $('f-phone');
  var note = $('f-note');
  var radios = [].slice.call(form.querySelectorAll('input[name="darbs"]'));
  var cards = [].slice.call(document.querySelectorAll('.type-card'));
  var orderBox = $('pieteikums');

  function currentWork() {
    for (var i = 0; i < radios.length; i++) if (radios[i].checked) return radios[i].value;
    return '';
  }

  function cleanArea(v) {
    v = v.replace(',', '.').replace(/[^\d.]/g, '');
    return v;
  }

  function syncType() {
    var key = sel.value;
    var t = TYPES[key];

    cards.forEach(function (c) {
      var on = c.getAttribute('data-type') === key;
      c.classList.toggle('is-picked', on);
      var b = c.querySelector('.pick');
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.textContent = on ? 'Izvēlēts' : 'Izvēlēties';
    });

    var allowed = t ? t.works : ['Uzstādīšana', 'Apkope', 'Remonts', 'Konsultācija'];
    var keep = currentWork();
    radios.forEach(function (r) {
      var ok = allowed.indexOf(r.value) !== -1;
      r.parentNode.hidden = !ok;
      r.disabled = !ok;
    });
    if (allowed.indexOf(keep) === -1) {
      radios.forEach(function (r) { r.checked = r.value === allowed[0]; });
    }

    areaLabel.textContent = t ? t.area : 'Telpas platība, m²';

    if (key) {
      err.textContent = '';
      sel.classList.remove('is-invalid');
      sel.removeAttribute('aria-invalid');
    }
    redraw();
  }

  function parts() {
    var t = TYPES[sel.value];
    if (!t) return null;
    var a = cleanArea(area.value.trim());
    return {
      type: t.name,
      work: currentWork(),
      area: a ? a + ' m²' : '',
      place: place.value.trim(),
      name: nameInp.value.trim(),
      phone: phone.value.trim(),
      note: note.value.trim()
    };
  }

  function redraw() {
    var p = parts();
    if (!p) {
      summary.innerHTML = '<em>Izvēlieties iekārtu — te parādīsies pieteikuma teksts.</em>';
      return;
    }
    var line = [p.type, p.work.toLowerCase()];
    if (p.area) line.push(p.area);
    if (p.place) line.push(p.place);
    if (p.name) line.push(p.name);
    if (p.phone) line.push(p.phone);
    summary.textContent = line.join(' · ');
  }

  function pick(key, scroll) {
    if (!TYPES[key]) return;
    sel.value = key;
    syncType();
    if (!scroll) return;
    orderBox.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    if (matchMedia('(pointer: fine)').matches) {
      setTimeout(function () { area.focus({ preventScroll: true }); }, 450);
    }
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-pick]');
    if (!b) return;
    pick(b.getAttribute('data-pick'), true);
  });

  sel.addEventListener('change', syncType);
  radios.forEach(function (r) { r.addEventListener('change', redraw); });
  [area, place, nameInp, phone, note].forEach(function (el) { el.addEventListener('input', redraw); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var p = parts();
    if (!p) {
      err.textContent = 'Vispirms izvēlieties iekārtu.';
      sel.classList.add('is-invalid');
      sel.setAttribute('aria-invalid', 'true');
      sel.focus();
      return;
    }
    var body = [
      'Labdien!',
      '',
      'Pieteikums no mājaslapas:',
      'Iekārta: ' + p.type,
      'Kas jādara: ' + p.work,
      'Platība: ' + (p.area || '—'),
      'Objekta vieta: ' + (p.place || '—'),
      'Vārds: ' + (p.name || '—'),
      'Tālrunis: ' + (p.phone || '—')
    ];
    if (p.note) body.push('', 'Papildu informācija:', p.note);
    var subject = 'Pieteikums: ' + p.type + ', ' + p.work.toLowerCase();
    var url = 'mailto:' + EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body.join('\r\n'));
    form.setAttribute('data-mailto', url);
    window.location.href = url;
  });

  /* ---------- galerijas filtrs ---------- */
  var filters = [].slice.call(document.querySelectorAll('.filter'));
  var tiles = [].slice.call(document.querySelectorAll('#gallery [data-cat]'));
  var status = $('filter-status');
  filters.forEach(function (f) {
    f.addEventListener('click', function () {
      var cat = f.getAttribute('data-filter');
      filters.forEach(function (o) {
        var on = o === f;
        o.classList.toggle('is-on', on);
        o.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var shown = 0;
      tiles.forEach(function (t) {
        var vis = cat === 'visi' || t.getAttribute('data-cat') === cat;
        t.hidden = !vis;
        if (vis) shown++;
      });
      status.textContent = 'Rādīti: ' + f.textContent.trim() + ' (' + shown + ')';
    });
  });

  /* ---------- foto palielinājumā ---------- */
  var box = $('lightbox');
  var boxImg = $('lightbox-img');
  var boxCap = $('lightbox-cap');
  document.querySelectorAll('[data-zoom]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var img = btn.querySelector('img');
      var cap = btn.parentNode.querySelector('.tile-caption');
      boxImg.src = img.currentSrc || img.src;
      boxImg.alt = img.alt;
      boxCap.textContent = cap ? cap.textContent : '';
      if (typeof box.showModal === 'function') {
        box.showModal();
      } else {
        window.open(boxImg.src, '_blank', 'noopener');
      }
    });
  });
  box.addEventListener('click', function (e) {
    if (e.target === box) box.close();
  });

  syncType();
})();
