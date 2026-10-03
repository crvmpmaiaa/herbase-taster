/* Bag count, the Madu cart idea in the taster's hand. Product pages add, every page shows the number.
   Session only: nothing is sent anywhere, there is no checkout behind the taster. */
(function(){
  var KEY='herbase-bag';
  function read(){ try{ return Number(sessionStorage.getItem(KEY))||0; }catch(e){ return 0; } }
  function write(n){ try{ sessionStorage.setItem(KEY,String(n)); }catch(e){} }
  function paint(n){
    document.querySelectorAll('[data-bag],.nav__bag').forEach(function(a){
      var c=a.querySelector('.bag__n'); if(c) c.textContent=String(n);
      a.setAttribute('aria-label','Bag, '+n+(n===1?' item':' items'));
    });
  }
  paint(read());
  document.addEventListener('click',function(e){
    var bag=e.target.closest('[data-bag],.nav__bag'); if(bag){ e.preventDefault(); return; }
    var el=e.target.closest('[data-add]'); if(!el||el.hasAttribute('data-added')) return;
    e.preventDefault();
    var qty=1;
    if(el.hasAttribute('data-add-qty')){ var q=document.querySelector('.qty output'); if(q) qty=Math.max(1,Number(q.textContent)||1); }
    var n=read()+qty; write(n); paint(n);
    var label=el.querySelector('span')||el, old=label.textContent;
    el.setAttribute('data-added',''); label.textContent=qty>1?'Added ×'+qty:'Added';
    setTimeout(function(){ label.textContent=old; el.removeAttribute('data-added'); },1100);
  });
})();
