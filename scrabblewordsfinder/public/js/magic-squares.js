(function(){
var pz=null,sz=4,cells=[],sol=null,hints=0,tInt=null,t0=null,el=0,won=false,playedSent=false,typedCount=0;
var G=document.getElementById('ms-grid'),TM=document.getElementById('ms-tm');
var HC=document.getElementById('ms-hc');
var RL=document.getElementById('ms-rl');
var CL=document.getElementById('ms-cl'),WIN=document.getElementById('ms-win');
var WS=document.getElementById('ms-ws');

function fmt(s){var m=Math.floor(s/60),ss=s%60;return m+':'+(ss<10?'0':'')+ss;}
function gs(){try{return JSON.parse(localStorage.getItem('swf-ms-stats'))||{k:0,p:0,s:0,b:null};}catch(e){return{k:0,p:0,s:0,b:null};}}
function ss(o){localStorage.setItem('swf-ms-stats',JSON.stringify(o));}
function rs(){var o=gs();document.getElementById('ms-s1').textContent=o.k;document.getElementById('ms-s2').textContent=o.p;document.getElementById('ms-s3').textContent=o.s;document.getElementById('ms-s4').textContent=o.b?fmt(o.b):'—';}

function startT(){stopT();t0=Date.now();el=0;tInt=setInterval(function(){el=Math.floor((Date.now()-t0)/1000);TM.textContent=fmt(el);},1000);}
function stopT(){if(tInt)clearInterval(tInt);tInt=null;}

function build(size,rev){
  G.innerHTML='';G.style.gridTemplateColumns='repeat('+size+',1fr)';cells=[];
  for(var r=0;r<size;r++){cells[r]=[];for(var c=0;c<size;c++){
    var inp=document.createElement('input');inp.type='text';inp.maxLength=1;
    inp.dataset.r=r;inp.dataset.c=c;
    inp.className='w-10 h-10 sm:w-12 sm:h-12 text-center text-lg font-bold uppercase rounded border border-gray-700 bg-gray-900 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50';
    if(rev&&rev[r]&&rev[r][c]){inp.value=rev[r][c];inp.readOnly=true;inp.classList.remove('bg-gray-900');inp.classList.add('bg-gray-800/80','text-blue-400');}
    inp.addEventListener('input',onInp);inp.addEventListener('keydown',onKey);
    inp.addEventListener('focus',function(e){e.target.select();});
    G.appendChild(inp);cells[r][c]=inp;
  }}
}

function onInp(e){e.target.value=e.target.value.toUpperCase();if(e.target.value.length===1){typedCount++;nxt(+e.target.dataset.r,+e.target.dataset.c);if(!playedSent&&typedCount>=3&&pz){playedSent=true;fetch('/api/games/magic-squares/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({puzzle_id:pz.id,grid_size:sz,variant:pz.variant,solved:false,hints_used:0,solve_seconds:0,score:0,is_daily:document.getElementById('ms-mode').value==='daily',user_id:localStorage.getItem('swf-uid')||'anon'})}).catch(function(){});}}upd();}
function onKey(e){var r=+e.target.dataset.r,c=+e.target.dataset.c;
  if(e.key==='Backspace'&&!e.target.value){prv(r,c);e.preventDefault();}
  else if(e.key==='ArrowRight'&&c<sz-1)cells[r][c+1].focus();
  else if(e.key==='ArrowLeft'&&c>0)cells[r][c-1].focus();
  else if(e.key==='ArrowDown'&&r<sz-1)cells[r+1][c].focus();
  else if(e.key==='ArrowUp'&&r>0)cells[r-1][c].focus();
}
function nxt(r,c){for(var i=c+1;i<sz;i++)if(!cells[r][i].readOnly){cells[r][i].focus();return;}for(var j=r+1;j<sz;j++)for(var k=0;k<sz;k++)if(!cells[j][k].readOnly){cells[j][k].focus();return;}}
function prv(r,c){for(var i=c-1;i>=0;i--)if(!cells[r][i].readOnly){cells[r][i].focus();return;}for(var j=r-1;j>=0;j--)for(var k=sz-1;k>=0;k--)if(!cells[j][k].readOnly){cells[j][k].focus();return;}}

function upd(){
  if(!sol)return;RL.innerHTML='';CL.innerHTML='';
  // Reset highlights
  // (no grid highlights — only text labels change color)
  for(var a=0;a<sz;a++)for(var b=0;b<sz;b++){cells[a][b].classList.remove('border-red-500','text-red-400','border-green-500');}
  // Check rows — display as horizontal letter boxes
  for(var r=0;r<sz;r++){var w='';for(var c=0;c<sz;c++)w+=cells[r][c].value||'_';
    var rowCorrect=w===sol.rows[r];
    var rowDiv=document.createElement('div');rowDiv.className='flex items-center gap-0.5 justify-center mb-0.5';
    for(var i=0;i<w.length;i++){
      var letter=document.createElement('span');
      letter.className='text-xs font-mono w-5 h-5 flex items-center justify-center rounded '+(rowCorrect?'text-green-400 bg-green-900/30':w[i]==='_'?'text-gray-600':'text-gray-300');
      letter.textContent=w[i];rowDiv.appendChild(letter);
    }
    RL.appendChild(rowDiv);}
  // Check columns — display vertically, highlight text green when correct
  var colGrid=document.createElement('div');colGrid.className='flex gap-1 justify-center';
  for(var c2=0;c2<sz;c2++){var w2='';for(var r2=0;r2<sz;r2++)w2+=cells[r2][c2].value||'_';
    var colCorrect=w2===sol.cols[c2];
    var colDiv=document.createElement('div');colDiv.className='flex flex-col items-center gap-0.5';
    for(var i=0;i<w2.length;i++){
      var letter=document.createElement('span');
      letter.className='text-xs font-mono w-5 h-5 flex items-center justify-center rounded '+(colCorrect?'text-emerald-400 bg-emerald-900/30':w2[i]==='_'?'text-gray-600':'text-gray-300');
      letter.textContent=w2[i];colDiv.appendChild(letter);
    }
    colGrid.appendChild(colDiv);
  }
  CL.appendChild(colGrid);
  // Per-cell correctness: red border+text if wrong, green border if correct
  for(var a2=0;a2<sz;a2++)for(var b2=0;b2<sz;b2++){
    var v=cells[a2][b2].value;
    if(v&&!cells[a2][b2].readOnly){
      if(v.toUpperCase()===sol.rows[a2][b2]){cells[a2][b2].classList.add('border-green-500');}
      else{cells[a2][b2].classList.add('border-red-500','text-red-400');}
    }
  }
  var full=true;for(var a3=0;a3<sz;a3++)for(var b3=0;b3<sz;b3++)if(!cells[a3][b3].value)full=false;
  if(full&&!won)chk();
}

function chk(){
  if(!sol)return;var ok=true;
  for(var r=0;r<sz;r++)for(var c=0;c<sz;c++){
    if(cells[r][c].value.toUpperCase()!==sol.rows[r][c]){ok=false;cells[r][c].classList.add('border-red-500');(function(x){setTimeout(function(){x.classList.remove('border-red-500');},1500);})(cells[r][c]);}
    else cells[r][c].classList.add('border-green-500/50');
  }
  if(ok)win();
}

function win(){
  won=true;stopT();WIN.classList.remove('hidden');
  var sc=Math.max(0,1000-(hints*50)-Math.floor(el/2));
  WS.textContent=fmt(el)+' · '+hints+' hints · '+sc+' pts';
  for(var r=0;r<sz;r++)for(var c=0;c<sz;c++){cells[r][c].readOnly=true;cells[r][c].classList.add('border-green-500/30','text-green-400');}
  var o=gs();o.p++;o.s++;o.k++;if(!o.b||el<o.b)o.b=el;ss(o);rs();
  var uid=localStorage.getItem('swf-uid')||'anon';
  fetch('/api/games/magic-squares/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({puzzle_id:pz.id,grid_size:sz,variant:pz.variant,solved:true,hints_used:hints,solve_seconds:el,score:sc,is_daily:document.getElementById('ms-mode').value==='daily',user_id:uid})}).catch(function(){});
}

function hl(){if(won||!sol)return;var e=[];for(var r=0;r<sz;r++)for(var c=0;c<sz;c++)if(!cells[r][c].readOnly&&cells[r][c].value!==sol.rows[r][c])e.push([r,c]);if(!e.length)return;dimPrevHints();var p=e[Math.floor(Math.random()*e.length)];cells[p[0]][p[1]].value=sol.rows[p[0]][p[1]];cells[p[0]][p[1]].readOnly=true;cells[p[0]][p[1]].classList.remove('text-white');cells[p[0]][p[1]].classList.add('text-purple-400','border-purple-500','bg-purple-950/40','border-2');hints++;HC.textContent=hints;upd();}
function hr(){if(won||!sol)return;for(var r=0;r<sz;r++){var h=false;for(var c=0;c<sz;c++)if(!cells[r][c].readOnly&&cells[r][c].value!==sol.rows[r][c])h=true;if(h){dimPrevHints();for(var c2=0;c2<sz;c2++){cells[r][c2].classList.remove('text-white');cells[r][c2].value=sol.rows[r][c2];cells[r][c2].readOnly=true;cells[r][c2].classList.add('text-purple-400','border-purple-500','bg-purple-950/40','border-2');}hints+=sz;HC.textContent=hints;upd();return;}}}
function hc2(){if(won||!sol)return;for(var c=0;c<sz;c++){var h=false;for(var r=0;r<sz;r++)if(!cells[r][c].readOnly&&cells[r][c].value!==sol.rows[r][c])h=true;if(h){dimPrevHints();for(var r2=0;r2<sz;r2++){cells[r2][c].classList.remove('text-white');cells[r2][c].value=sol.rows[r2][c];cells[r2][c].readOnly=true;cells[r2][c].classList.add('text-purple-400','border-purple-500','bg-purple-950/40','border-2');}hints+=sz;HC.textContent=hints;upd();return;}}}
function dimPrevHints(){for(var r=0;r<sz;r++)for(var c=0;c<sz;c++){cells[r][c].classList.remove('border-2','border-purple-500');}}

document.getElementById('ms-h1').onclick=hl;
document.getElementById('ms-h2').onclick=hr;
document.getElementById('ms-h3').onclick=hc2;
document.getElementById('ms-chk').onclick=chk;
document.getElementById('ms-new').onclick=load;
document.getElementById('ms-ag').onclick=load;
document.getElementById('ms-sh').onclick=function(){
  var t='🪄 Magic Squares #'+pz.id+' ('+sz+'×'+sz+')\n⏱️ '+fmt(el)+' · 💡 '+hints+' hints\n'+(pz.variant==='classic'?'🔲 Classic':'🔳 Cross')+'\nhttps://www.scrabblewordsfinder.com/magic-squares/';
  if(navigator.share)navigator.share({text:t}).catch(function(){});
  else navigator.clipboard.writeText(t).then(function(){document.getElementById('ms-sh').textContent='✓ Copied!';setTimeout(function(){document.getElementById('ms-sh').textContent='📤 Share';},2000);});
};

function load(){
  won=false;hints=0;HC.textContent='0';WIN.classList.add('hidden');playedSent=false;typedCount=0;
  sz=parseInt(document.getElementById('ms-size').value);
  var diff=document.getElementById('ms-diff').value;
  savePrefs();
  var url='/api/games/magic-squares/?size='+sz+'&mode='+document.getElementById('ms-mode').value+'&variant='+document.getElementById('ms-var').value+'&difficulty='+diff;
  fetch(url).then(function(r){return r.json();}).then(function(d){
    if(d.error){G.innerHTML='<p class="text-red-400 text-sm p-6">'+d.error+'</p>';return;}
    pz=d;sol=d.solution;
    build(sz,d.revealed);upd();startT();
  }).catch(function(){G.innerHTML='<p class="text-red-400 text-sm p-6">Failed to load puzzle.</p>';});
}

// ─── Preferences (sticky via localStorage) ───
var PREFS_KEY='swf-ms-prefs';
function savePrefs(){
  localStorage.setItem(PREFS_KEY,JSON.stringify({mode:document.getElementById('ms-mode').value,size:document.getElementById('ms-size').value,diff:document.getElementById('ms-diff').value,variant:document.getElementById('ms-var').value}));
}
function loadPrefs(){
  try{var p=JSON.parse(localStorage.getItem(PREFS_KEY));if(!p)return;
    if(p.mode)document.getElementById('ms-mode').value=p.mode;
    if(p.size)document.getElementById('ms-size').value=p.size;
    if(p.diff)document.getElementById('ms-diff').value=p.diff;
    if(p.variant)document.getElementById('ms-var').value=p.variant;
  }catch(e){}
}

loadPrefs();rs();load();
})();
