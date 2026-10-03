/* Bag: the Madu idea (a count in every header) plus a panel that lists what was added, because a count alone reads as broken.
   Session only. Nothing is sent anywhere; there is no checkout behind the taster. */
(function(){
  var KEY='herbase-bag-v2', panel=null, veil=null, list=null, total=null, closeBtn=null;
  function read(){ try{ var v=JSON.parse(sessionStorage.getItem(KEY)||'[]'); return Array.isArray(v)?v:[]; }catch(e){ return []; } }
  function write(items){ try{ sessionStorage.setItem(KEY,JSON.stringify(items)); }catch(e){} }
  function count(items){ return items.reduce(function(n,i){ return n+i.qty; },0); }
  function money(n){ return '£'+n.toFixed(2); }
  function el(tag,cls,text){ var e=document.createElement(tag); if(cls) e.className=cls; if(text!=null) e.textContent=text; return e; }
  function paint(items){ var n=count(items), open=panel&&!panel.hidden;
    document.querySelectorAll('[data-bag],.nav__bag').forEach(function(a){ var c=a.querySelector('.bag__n'); if(c) c.textContent=String(n); a.setAttribute('aria-label','Bag, '+n+(n===1?' item':' items')); a.setAttribute('aria-expanded',open?'true':'false'); }); }
  function build(){
    veil=el('div','bagpanel__veil'); veil.hidden=true; veil.setAttribute('data-bag-close','');
    panel=el('aside','bagpanel'); panel.hidden=true; panel.setAttribute('aria-label','Your bag');
    var head=el('div','bagpanel__head'); head.appendChild(el('h2',null,'Your bag'));
    closeBtn=el('button','bagpanel__close','Close'); closeBtn.type='button'; closeBtn.setAttribute('data-bag-close',''); head.appendChild(closeBtn);
    list=el('ul','bagpanel__list'); total=el('p','bagpanel__total');
    var note=el('p','bagpanel__note','The taster has no checkout, so nothing is charged and nothing is sent. The real shop is herbase.earth.');
    panel.append(head,list,total,note); document.body.append(veil,panel);
  }
  function fill(items){ list.replaceChildren();
    if(!items.length) list.appendChild(el('li','bagpanel__empty','Nothing in the bag yet.'));
    items.forEach(function(it,idx){ var li=el('li'); li.appendChild(el('b',null,it.name)); li.appendChild(el('span',null,(it.qty>1?it.qty+' × ':'')+(it.price?money(it.price):'')));
      var rm=el('button',null,'Remove'); rm.type='button'; rm.setAttribute('aria-label','Remove '+it.name);
      rm.addEventListener('click',function(){ var cur=read(); cur.splice(idx,1); write(cur); paint(cur); fill(cur); }); li.appendChild(rm); list.appendChild(li); });
    var sum=items.reduce(function(s,i){ return s+(i.price||0)*i.qty; },0); total.textContent=items.length?'Subtotal '+money(sum):''; }
  function open(){ if(!panel) build(); fill(read()); panel.hidden=false; veil.hidden=false; document.documentElement.setAttribute('data-bag-open',''); paint(read()); closeBtn.focus(); }
  function close(){ if(!panel||panel.hidden) return; panel.hidden=true; veil.hidden=true; document.documentElement.removeAttribute('data-bag-open'); paint(read()); }
  function active(){ return document.querySelector('#sticky-rail span[data-active]'); }
  function nameFor(b){ var a=b.closest('#sticky')&&active(); return (b.getAttribute('data-name')||(a&&a.getAttribute('data-name'))||(document.querySelector('#sticky b')||{}).textContent||(document.querySelector('h1')||{}).textContent||'Item').trim(); }
  function priceFor(b){ var p=b.getAttribute('data-price'); var a=b.closest('#sticky')&&active(); if(!p&&a) p=a.getAttribute('data-price');
    if(!p){ var sp=document.getElementById('stickyprice')||document.querySelector('#sticky span'); var m=sp&&sp.textContent.match(/£\s*([0-9]+(?:\.[0-9]+)?)/); if(m) p=m[1]; } return Number(p)||0; }
  paint(read());
  document.addEventListener('click',function(e){
    if(e.target.closest('[data-bag-close]')){ close(); return; }
    var bag=e.target.closest('[data-bag],.nav__bag'); if(bag){ e.preventDefault(); if(panel&&!panel.hidden) close(); else open(); return; }
    var b=e.target.closest('[data-add]'); if(!b||b.hasAttribute('data-added')) return;
    e.preventDefault();
    var qty=1; if(b.hasAttribute('data-add-qty')){ var q=document.querySelector('.qty output'); if(q) qty=Math.max(1,Number(q.textContent)||1); }
    var name=nameFor(b), price=priceFor(b), items=read(), hit=items.find(function(i){ return i.name===name; });
    if(hit) hit.qty+=qty; else items.push({name:name,price:price,qty:qty}); write(items); paint(items); if(panel&&!panel.hidden) fill(items);
    var label=b.querySelector('span')||b, old=label.textContent; b.setAttribute('data-added',''); label.textContent=qty>1?'Added ×'+qty:'Added';
    setTimeout(function(){ label.textContent=old; b.removeAttribute('data-added'); },1100);
    if(b.hasAttribute('data-open-bag')) open();
  });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') close(); });
  /* share: the system share sheet where there is one, the clipboard where there is not */
  document.addEventListener('click',function(e){ var s=e.target.closest('[data-share]'); if(!s) return;
    var url=new URL(s.getAttribute('data-share-url')||location.href,location.href).href, title=s.getAttribute('data-share-title')||document.title;
    var done=function(t){ var sp=s.querySelector('span')||s, old=sp.textContent; s.setAttribute('data-done',''); sp.textContent=t; setTimeout(function(){ sp.textContent=old; s.removeAttribute('data-done'); },1400); };
    if(navigator.share){ navigator.share({title:title,url:url}).then(function(){ done('Shared'); }).catch(function(){}); }
    else if(navigator.clipboard){ navigator.clipboard.writeText(url).then(function(){ done('Link copied'); },function(){ done('Copy failed'); }); } });
})();
