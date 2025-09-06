const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

function getCart(){ 
  try { return JSON.parse(localStorage.getItem('cart')||'[]'); } 
  catch { return []; } 
}
function setCart(items){ 
  localStorage.setItem('cart', JSON.stringify(items)); 
  updateCartCount(); 
}
function updateCartCount(){
  const items = getCart(); 
  const count = items.reduce((a,i)=>a + (i.qty||1), 0);
  const el = document.getElementById('cart-count'); 
  if (el) el.textContent = count;
}

function initShop(){
  const grid = $('#product-grid'); if (!grid) return;
  const search = $('#search');
  if (search){
    search.addEventListener('input', () => {
      const q = search.value.toLowerCase();
      $$('.product', grid).forEach(card => {
        const name = card.dataset.name.toLowerCase();
        card.style.display = name.includes(q) ? '' : 'none';
      });
    });
  }
  $$('.add-to-cart', grid).forEach(btn => {
    btn.addEventListener('click', e => {
      const card = e.target.closest('.product');
      const id = card.dataset.id; 
      const name = card.dataset.name;
      const price = Number(card.dataset.price); 
      const img = card.querySelector('img').src;
      const cart = getCart(); 
      const existing = cart.find(i => i.id === id);
      if (existing) existing.qty += 1; 
      else cart.push({ id, name, price, img, qty: 1 });
      setCart(cart); 
      btn.textContent = 'Added ✓'; 
      setTimeout(()=>btn.textContent='Add to Cart', 1000);
    });
  });
}

function initCart(){
  const list = $('#cart-list'); if (!list) return;
  const items = getCart();
  if (!items.length){ 
    list.innerHTML = '<p style="padding:12px;color:#666">Your cart is empty.</p>'; 
  } else {
    list.innerHTML = items.map((it, idx)=>`
      <div class="cart-item" data-index="${idx}">
        <img src="${it.img}" alt="${it.name}" style="width:80px;height:80px;object-fit:cover;border-radius:10px">
        <div>
          <div style="font-weight:700">${it.name}</div>
          <div class="muted">₹${it.price}</div>
          <div class="qty" style="margin-top:6px">
            <button class="dec">-</button>
            <span style="min-width:24px;text-align:center">${it.qty}</span>
            <button class="inc">+</button>
          </div>
        </div>
        <button class="remove-btn">Remove</button>
      </div>`).join('');
  }
  bindCartEvents(); updateSummary();
}

function bindCartEvents(){
  $$('.cart-item').forEach(row => {
    row.querySelector('.inc').addEventListener('click', ()=>changeQty(row, 1));
    row.querySelector('.dec').addEventListener('click', ()=>changeQty(row, -1));
    row.querySelector('.remove-btn').addEventListener('click', ()=>removeItem(row));
  });
}
function changeQty(row, delta){
  const idx = Number(row.dataset.index); const cart = getCart();
  cart[idx].qty = Math.max(1, (cart[idx].qty||1) + delta); 
  setCart(cart); initCart();
}
function removeItem(row){
  const idx = Number(row.dataset.index); 
  const cart = getCart();
  cart.splice(idx,1); 
  setCart(cart); initCart();
}

function updateSummary(){
  const items = getCart();
  const subtotal = items.reduce((a,i)=>a + i.price*(i.qty||1), 0);
  const shipping = items.length ? 49 : 0;
  const total = subtotal + shipping;
  const subEl = $('#subtotal'); 
  const shipEl = $('#shipping'); 
  const totEl = $('#total');
  if (subEl) subEl.textContent = `₹${subtotal}`;
  if (shipEl) shipEl.textContent = `₹${shipping}`;
  if (totEl) totEl.textContent = `₹${total}`;
  const ck = $('#checkoutSummary');
  if (ck){ 
    ck.innerHTML = `<p>Subtotal: <strong>₹${subtotal}</strong></p>
                    <p>Shipping: <strong>₹${shipping}</strong></p>
                    <p>Total: <strong>₹${total}</strong></p>`; 
  }
}

function initCheckout() {
  const form = $('#checkoutForm');
  if (!form) return;

  // Show summary when page loads
  updateSummary();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const items = getCart();
    const subtotal = items.reduce((a, i) => a + i.price * (i.qty || 1), 0);
    const shipping = items.length ? 49 : 0;
    const total = subtotal + shipping;

    localStorage.setItem('orderSummary', JSON.stringify({
      subtotal: `₹${subtotal}`,
      shipping: `₹${shipping}`,
      total: `₹${total}`
    }));

    localStorage.removeItem('cart');
    window.location.href = 'thankyou.html';
  });
}

function revealOnScroll(){
  const els = $$('.section');
  const onScroll = () => {
    const trigger = window.innerHeight * 0.9;
    els.forEach(el => { 
      const r = el.getBoundingClientRect(); 
      if (r.top < trigger) el.classList.add('visible'); 
    });
  };
  onScroll(); 
  window.addEventListener('scroll', onScroll, { passive: true });
}

function initThankYou(){
  const summary = localStorage.getItem('orderSummary');
  if (!summary) return;
  try {
    const data = JSON.parse(summary);
    const subtotal = document.getElementById('summarySubtotal');
    const shipping = document.getElementById('summaryShipping');
    const total = document.getElementById('summaryTotal');
    if (subtotal) subtotal.textContent = data.subtotal;
    if (shipping) shipping.textContent = data.shipping;
    if (total) total.textContent = data.total;
    localStorage.removeItem('orderSummary');
  } catch (err) {
    console.error("Error reading order summary:", err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  initShop();
  initCart();
  initCheckout();
  initThankYou();
  revealOnScroll();
});
