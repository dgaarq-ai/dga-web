/* Menú móvil (toggle por click, accesible) */
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Cerrar al elegir un link
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Aparición al hacer scroll */
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && els.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }
})();

/* Contexto de compra/oferta vía ?motivo= — evita que el usuario sienta que "rebotó" a la home */
(function () {
  const params = new URLSearchParams(window.location.search);
  const motivo = params.get('motivo');
  if (!motivo) return;
  const banner = document.getElementById('promo-banner');
  if (banner) {
    banner.style.display = 'block';
    banner.textContent = 'Recibimos tu interés en: ' + motivo + '. Completá tus datos y te confirmamos el pago y la activación.';
  }
  const direccion = params.get('direccion');
  const tipo = params.get('tipo_inmueble');
  const score = params.get('home_score');
  const detalles = [
    direccion ? 'Dirección: ' + direccion : '',
    tipo ? 'Tipo de inmueble: ' + tipo : '',
    score ? 'HOME SCORE®: ' + score : '',
  ].filter(Boolean).join(' · ');
  const mensaje = document.getElementById('mensaje');
  if (mensaje && !mensaje.value) mensaje.value = 'Quiero: ' + motivo + (detalles ? '\n' + detalles : '');
  const subject = document.querySelector('input[name="_subject"]');
  if (subject) subject.value = 'Nuevo interés de compra — ' + motivo;
})();

/* Formulario de contacto → Formspree (envío por AJAX, sin recargar la página) */
(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;
  var status = document.getElementById('form-status');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.textContent = 'Enviando…';
    status.className = 'form-status';
    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    }).then(function (response) {
      if (response.ok) {
        form.reset();
        status.textContent = '¡Gracias! Recibimos tu consulta y te vamos a contactar a la brevedad.';
        status.className = 'form-status form-status--ok';
      } else {
        status.textContent = 'Hubo un problema al enviar. Probá de nuevo o escribinos por WhatsApp.';
        status.className = 'form-status form-status--err';
      }
    }).catch(function () {
      status.textContent = 'Hubo un problema al enviar. Probá de nuevo o escribinos por WhatsApp.';
      status.className = 'form-status form-status--err';
    });
  });
})();

/* Lightbox de galería de obras */
(function () {
  var lb = document.getElementById('lightbox');
  if (!lb) return;
  var imgEl = lb.querySelector('.lb-img');
  var capEl = lb.querySelector('.lb-cap');
  var list = [], idx = 0;
  function show(i) { idx = (i + list.length) % list.length; imgEl.src = list[idx]; capEl.textContent = (idx + 1) + ' / ' + list.length; }
  function open(imgs) { list = imgs; show(0); lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
  function close() { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; imgEl.src = ''; }
  document.querySelectorAll('.work--gallery').forEach(function (card) {
    card.addEventListener('click', function (e) {
      e.preventDefault();
      var imgs = (card.getAttribute('data-imgs') || '').split(',').filter(Boolean);
      if (imgs.length) open(imgs);
    });
  });
  lb.querySelector('.lb-close').addEventListener('click', close);
  lb.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); show(idx + 1); });
  lb.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); show(idx - 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') show(idx + 1);
    else if (e.key === 'ArrowLeft') show(idx - 1);
  });
})();
