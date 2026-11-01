const WHATSAPP_PHONE = "5542998152403";

    const dishes = [
      {
        id: 1,
        name: "Arroz",
        category: "acompanhamentos",
        desc: "Arroz branco soltinho, feito na hora.",
        image: "arroz.webp"
      },
      {
        id: 2,
        name: "Feijão",
        category: "acompanhamentos",
        desc: "Feijão preto cozido no ponto, com caldo grosso e temperado.",
        image: "feijao.webp"
      },
      {
        id: 3,
        name: "Virado de couve com bacon",
        category: "acompanhamentos",
        desc: "Couve fininha refogada com bacon crocante.",
        image: "couve-bacon.webp"
      },
      {
        id: 4,
        name: "Refogado de legumes",
        category: "acompanhamentos",
        desc: "Cenoura, brócolis, vagem e batata refogados com ervas.",
        image: "legumes.webp"
      },
      {
        id: 5,
        name: "Bolinho de arroz",
        category: "principais",
        desc: "Bolinho de arroz crocante por fora e macio por dentro.",
        image: "bolinho-arroz.webp"
      },
      {
        id: 6,
        name: "Ovo",
        category: "principais",
        desc: "Ovo frito com a borda crocante e a gema molinha.",
        image: "ovo.webp"
      },
      {
        id: 7,
        name: "Bife",
        category: "principais",
        desc: "Bife suculento grelhado com alecrim.",
        image: "bife.webp"
      }
    ];

    const SIZES = { pequena: 20, media: 25, grande: 30 };
    const MAX_DISHES = { pequena: 5, media: 7, grande: 7 };
    const SIZE_LABEL = { pequena: "Pequena", media: "Média", grande: "Grande" };
    const $ = (id) => document.getElementById(id);
    const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const orders = [];
    const draft = { size: 'media', dishes: new Set() };
    let favs = new Set();
    try { favs = new Set(JSON.parse(localStorage.getItem('mazuFavs') || '[]')); } catch (e) {}
    let currentFilter = 'all';

    const io = ('IntersectionObserver' in window)
      ? new IntersectionObserver((entries) => entries.forEach(e => e.target.classList.toggle('in', e.isIntersecting)), { threshold: 0.12 })
      : null;

    function toggleFav(id) {
      if (favs.has(id)) favs.delete(id); else favs.add(id);
      try { localStorage.setItem('mazuFavs', JSON.stringify([...favs])); } catch (e) {}
      renderDishes();
    }

    function renderDishes(filter = currentFilter, animate = false) {
      currentFilter = filter;
      const grid = $('dishesGrid');
      if (!grid) return;
      grid.innerHTML = '';
      (filter === 'all' ? dishes : dishes.filter(d => d.category === filter)).forEach((dish, i) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'dr reveal' + (animate ? '' : ' in');
        card.style.transitionDelay = (i % 3) * 90 + 'ms';
        card.setAttribute('onclick', `openBuilder(${dish.id})`);
        card.innerHTML = `
          <span class="dr-img"><img src="${dish.image}" alt="${dish.name}" loading="lazy" decoding="async"><i>+</i></span>
          <span class="dr-name">${dish.name}</span>`;
        grid.appendChild(card);
        if (io) io.observe(card); else card.classList.add('in');
      });
    }
    document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderDishes(btn.dataset.filter, true);
    }));

    // ---------- Monte sua marmita ----------
    $('plate').insertAdjacentHTML('beforeend', dishes.map(d => `<img class="pl" id="pl${d.id}" src="${d.image}" alt="" onclick="togglePick(${d.id})">`).join(''));
    $('dishPick').innerHTML = dishes.map(d => `<button type="button" class="dc" id="dc${d.id}" onclick="togglePick(${d.id})"><span class="dc-img"><img src="${d.image}" alt=""></span><small>${d.name}</small></button>`).join('');

    function layoutPlate() {
      const sel = dishes.filter(d => draft.dishes.has(d.id)), n = sel.length;
      const dia = n <= 1 ? 62 : n <= 3 ? 42 : n <= 5 ? 36 : 31;
      dishes.forEach(d => {
        const el = $('pl' + d.id), i = sel.indexOf(d);
        $('dc' + d.id).classList.toggle('on', i >= 0);
        if (i < 0) { el.style.opacity = 0; el.style.transform = 'translate(-50%,-50%) scale(0)'; return; }
        const a = n === 1 ? 0 : 2 * Math.PI * i / n - Math.PI / 2, r = n === 1 ? 0 : 30;
        el.style.width = el.style.height = dia + '%';
        el.style.left = (50 + r * Math.cos(a)) + '%';
        el.style.top = (50 + r * Math.sin(a)) + '%';
        el.style.opacity = 1;
        el.style.transform = 'translate(-50%,-50%) scale(1)';
      });
      $('plateHint').style.display = n ? 'none' : 'flex';
      $('bClear').style.visibility = n ? 'visible' : 'hidden';
      const max = MAX_DISHES[draft.size];
      $('pickTitle').textContent = `Escolha os pratos (${n}/${max})`;
      $('dishPick').classList.toggle('full', n >= max);
      saveState();
    }
    function updatePrice() {
      const p = $('bPrice');
      p.textContent = brl(SIZES[draft.size]);
      p.classList.remove('pop'); void p.offsetWidth; p.classList.add('pop');
      document.querySelectorAll('#bSizes .size-opt').forEach(b => b.classList.toggle('active', b.dataset.size === draft.size));
    }
    let msgTimer;
    function showMsg(t) {
      const m = $('bMsg'); m.textContent = t;
      clearTimeout(msgTimer); msgTimer = setTimeout(() => { m.textContent = ''; }, 3500);
    }
    function togglePick(id) {
      if (draft.dishes.has(id)) draft.dishes.delete(id);
      else {
        const max = MAX_DISHES[draft.size];
        if (draft.dishes.size >= max) {
          showMsg(`A marmita ${SIZE_LABEL[draft.size]} leva até ${max} pratos.` + (draft.size === 'pequena' ? ' Para mais, escolha a Média ou a Grande.' : ''));
          return;
        }
        draft.dishes.add(id);
      }
      layoutPlate();
    }
    function setDraftSize(s) {
      draft.size = s;
      const max = MAX_DISHES[s];
      if (draft.dishes.size > max) {
        draft.dishes = new Set([...draft.dishes].slice(0, max));
        showMsg(`A marmita ${SIZE_LABEL[s]} leva até ${max} pratos. Tiramos os últimos que você escolheu.`);
      }
      layoutPlate(); updatePrice();
    }
    document.querySelectorAll('#bSizes .size-opt').forEach(b => b.addEventListener('click', () => setDraftSize(b.dataset.size)));

    function resetBuilder(id) {
      draft.size = 'media'; draft.dishes = new Set(id ? [id] : []);
      layoutPlate(); updatePrice();
    }
    function clearPlate() { draft.dishes = new Set(); layoutPlate(); }
    function openBuilder(id) {
      resetBuilder(id);
      $('cardapio').scrollIntoView({ behavior: 'smooth' });
    }
    function closeBuilder() { resetBuilder(); }

    function confirmOrder() {
      if (!draft.dishes.size) { alert("Escolha pelo menos um prato!"); return; }
      const wrap = $('plateWrap');
      if (wrap.classList.contains('boxing') || wrap.dataset.busy) return;
      wrap.dataset.busy = '1';
      wrap.classList.add('boxing');
      setTimeout(() => {
        orders.push({ size: draft.size, dishes: dishes.filter(d => draft.dishes.has(d.id)).map(d => d.id) });
        updateOrdersUI();
        bumpCart();
        closeBuilder();
        openCart();
        setTimeout(() => {
          wrap.classList.remove('boxing'); wrap.removeAttribute('style'); delete wrap.dataset.busy;
        }, 500);
      }, 1000);
    }

    function bumpCart() {
      const c = $('cartCount'), t = $('openCartBtn');
      c.classList.remove('bump'); t.classList.remove('shake'); void c.offsetWidth;
      c.classList.add('bump'); t.classList.add('shake');
    }

    // ---------- Meus pedidos ----------
    function updateOrdersUI() {
      $('cartCount').textContent = orders.length;
      $('bCount').textContent = orders.length;
      $('cartTotalValue').textContent = brl(orders.reduce((s, o) => s + SIZES[o.size], 0));
      $('ordersList').innerHTML = orders.length ? orders.map((o, i) => `
        <div class="ord">
          <div class="ord-top"><b>Marmita ${i + 1}</b><button onclick="removeOrder(${i})" aria-label="Tirar marmita ${i + 1}">&times;</button></div>
          <p>${o.dishes.map(id => dishes.find(d => d.id === id).name).join(', ')}</p>
          <div class="chips">${Object.keys(SIZES).map(s => `<button class="chip ${o.size === s ? 'active' : ''}" onclick="setSize(${i}, '${s}')">${SIZE_LABEL[s]} · R$ ${SIZES[s]}</button>`).join('')}</div>
        </div>`).join('') : '<p class="empty">Nenhuma marmita ainda 🍽️</p>';
      saveState();
    }
    function setSize(i, s) {
      if (orders[i].dishes.length > MAX_DISHES[s]) {
        alert(`Essa marmita tem ${orders[i].dishes.length} pratos e a ${SIZE_LABEL[s]} leva até ${MAX_DISHES[s]}. Escolha outro tamanho ou monte de novo.`);
        return;
      }
      orders[i].size = s; updateOrdersUI();
    }
    function removeOrder(i) { orders.splice(i, 1); updateOrdersUI(); }

    const drawer = $('cartDrawer'), overlay = $('cartOverlay');
    function openCart() { drawer.classList.add('open'); overlay.classList.add('open'); }
    function closeCart() { drawer.classList.remove('open'); overlay.classList.remove('open'); }
    $('openCartBtn').addEventListener('click', openCart);
    $('closeCartBtn').addEventListener('click', closeCart);
    overlay.addEventListener('click', closeCart);

    let pay = 'Pix';
    document.querySelectorAll('.pay-opt').forEach(b => b.addEventListener('click', () => {
      pay = b.dataset.pay; saveState();
      document.querySelectorAll('.pay-opt').forEach(x => x.classList.toggle('active', x === b));
    }));

    $('sendWhatsAppBtn').addEventListener('click', () => {
      if (!orders.length) { alert("Monte pelo menos uma marmita!"); return; }
      const name = $('nameInp').value.trim(), addr = $('addrInp').value.trim(), obs = $('obsInp').value.trim();
      if (!name || !addr) { alert("Preencha seu nome e o endereço de entrega."); return; }
      let msg = "Olá! Gostaria de fazer um pedido na *Marmitas Mazu*:\n\n";
      orders.forEach((o, i) => {
        msg += `*Marmita ${i + 1}* (${SIZE_LABEL[o.size].toLowerCase()} – ${brl(SIZES[o.size])}): ${o.dishes.map(id => dishes.find(d => d.id === id).name).join(', ')}\n`;
      });
      msg += `\n*Nome:* ${name}\n*Endereço de entrega:* ${addr}\n*Pagamento:* ${pay}\n`;
      if (obs) msg += `*Observações:* ${obs}\n`;
      msg += `\n*Total: ${brl(orders.reduce((s, o) => s + SIZES[o.size], 0))}*`;
      window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
    });

    // ---------- Guardar o pedido no celular ----------
    const todayKey = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
    let stateReady = false;
    function saveState() {
      if (!stateReady) return;
      try {
        localStorage.setItem('mazuCliente', JSON.stringify({ name: $('nameInp').value, addr: $('addrInp').value, pay }));
        localStorage.setItem('mazuPedido', JSON.stringify({ day: todayKey(), orders, draft: { size: draft.size, dishes: [...draft.dishes] }, obs: $('obsInp').value }));
      } catch (e) {}
    }
    function loadState() {
      try {
        const c = JSON.parse(localStorage.getItem('mazuCliente') || 'null');
        if (c) {
          $('nameInp').value = c.name || ''; $('addrInp').value = c.addr || '';
          if (['Pix', 'Cartão', 'Dinheiro'].includes(c.pay)) {
            pay = c.pay;
            document.querySelectorAll('.pay-opt').forEach(x => x.classList.toggle('active', x.dataset.pay === pay));
          }
        }
        const s = JSON.parse(localStorage.getItem('mazuPedido') || 'null');
        if (s && s.day === todayKey()) {
          const valid = ids => (ids || []).filter(id => dishes.some(d => d.id === id));
          (s.orders || []).forEach(o => {
            const ids = valid(o.dishes);
            if (SIZES[o.size] && ids.length) orders.push({ size: o.size, dishes: ids });
          });
          if (s.draft && SIZES[s.draft.size]) {
            draft.size = s.draft.size;
            draft.dishes = new Set(valid(s.draft.dishes).slice(0, MAX_DISHES[draft.size]));
          }
          $('obsInp').value = s.obs || '';
        }
      } catch (e) {}
      stateReady = true;
    }
    ['nameInp', 'addrInp', 'obsInp'].forEach(id => $(id).addEventListener('input', saveState));

    // ---------- Aberto / Fechado (horário de Brasília) ----------
    function updateOpenStatus() {
      const parts = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
      const get = t => parseInt(parts.find(p => p.type === t).value, 10);
      const mins = get('hour') * 60 + get('minute');
      const el = $('openStatus');
      const open = mins >= 10 * 60 && mins < 13 * 60;
      el.className = 'open-status ' + (open ? 'is-open' : 'is-closed');
      el.textContent = open ? '🟢 Aberto agora · atendemos até as 13h'
        : mins < 10 * 60 ? '🔴 Fechado agora · abrimos hoje às 10h'
        : '🔴 Fechado agora · abrimos amanhã às 10h';
    }
    updateOpenStatus(); setInterval(updateOpenStatus, 60000);

    renderDishes('all', true);
    loadState();
    layoutPlate(); updatePrice();
    updateOrdersUI();
