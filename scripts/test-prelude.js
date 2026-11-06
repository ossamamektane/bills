(function(){
  var RD = Date, realNow = RD.now.bind(RD), q = new URLSearchParams(location.search), off = 0;
  if(q.get("t")) off = new RD(q.get("t")).getTime() - realNow();
  function FD(){ if(!(this instanceof FD)) return new RD(realNow()+off).toString(); var a = [].slice.call(arguments); return a.length ? new (Function.prototype.bind.apply(RD, [null].concat(a)))() : new RD(realNow()+off); }
  FD.prototype = RD.prototype; FD.now = function(){ return realNow()+off; }; FD.parse = RD.parse; FD.UTC = RD.UTC;
  window.Date = FD;
  window.__setNow = function(s){ off = new RD(s).getTime() - realNow(); };
  window.__errs = []; window.addEventListener("error", function(e){ __errs.push(String(e.message)+" @"+e.lineno); });
  if(q.get("native")){ window.__msgs=[]; window.ReactNativeWebView={postMessage:function(s){ __msgs.push(JSON.parse(s)); }}; }
  if(q.get("fresh")) localStorage.clear();
  localStorage.setItem("r.test", "1");
  if(q.get("seed") && !localStorage.getItem("r.items")){
    var d = q.get("t").slice(0,10);
    localStorage.setItem("r.items", JSON.stringify([
      {id:"read", name:"Read 20 pages", kind:"flex", n:1, unit:"d", next:d},
      {id:"pill", name:"Vitamins", kind:"fixed", n:1, unit:"d", times:["09:00","21:00"], next:d},
      {id:"water", name:"Drink water", kind:"fixed", n:2, unit:"h", times:["08:00"], next:d, anchor:d, at0:"08:00"},
      {id:"walk", name:"Morning walk", kind:"fixed", n:1, unit:"d", wake:30, next:d},
      {id:"gym", name:"Gym", kind:"window", quota:3, period:"w", n:1, unit:"w", next:d},
      {id:"plants", name:"Water the plants", kind:"fixed", n:3, unit:"d", times:["18:00"], next:d},
      {id:"rent", name:"Pay rent", kind:"fixed", n:1, unit:"m", next:d}
    ]));
    if(q.get("lang")) localStorage.setItem("r.lang", q.get("lang"));
  }
})();
