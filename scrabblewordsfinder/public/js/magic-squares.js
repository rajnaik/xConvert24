(function(){
var pz=null,sz=4,cells=[],sol=null,hints=0,tInt=null,t0=null,el=0,won=false,playedSent=false,typedCount=0;
var solveHistory=[]; // Records [{r,c,letter,time,source}] for replay
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

function onInp(e){e.target.value=e.target.value.toUpperCase();if(e.target.value.length===1){typedCount++;var r=+e.target.dataset.r,c=+e.target.dataset.c;solveHistory.push({r:r,c:c,letter:e.target.value,time:el,source:'player'});if(sol&&e.target.value!==sol.rows[r][c])wrongCount++;nxt(r,c);if(!playedSent&&typedCount>=3&&pz){playedSent=true;fetch('/api/games/magic-squares/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({puzzle_id:pz.id,grid_size:sz,variant:pz.variant,solved:false,hints_used:0,solve_seconds:0,score:0,is_daily:document.getElementById('ms-mode').value==='daily',user_id:localStorage.getItem('swf-uid')||'anon'})}).catch(function(){});}}upd();}
function onKey(e){var r=+e.target.dataset.r,c=+e.target.dataset.c;
  if(e.key==='Backspace'&&!e.target.value){prv(r,c);e.preventDefault();}
  else if(e.key==='ArrowRight'&&c<sz-1)cells[r][c+1].focus();
  else if(e.key==='ArrowLeft'&&c>0)cells[r][c-1].focus();
  else if(e.key==='ArrowDown'&&r<sz-1)cells[r+1][c].focus();
  else if(e.key==='ArrowUp'&&r>0)cells[r-1][c].focus();
}
function nxt(r,c){for(var i=c+1;i<sz;i++)if(!cells[r][i].readOnly){cells[r][i].focus();return;}for(var j=r+1;j<sz;j++)for(var k=0;k<sz;k++)if(!cells[j][k].readOnly){cells[j][k].focus();return;}}
function prv(r,c){for(var i=c-1;i>=0;i--)if(!cells[r][i].readOnly){cells[r][i].focus();return;}for(var j=r-1;j>=0;j--)for(var k=sz-1;k>=0;k--)if(!cells[j][k].readOnly){cells[j][k].focus();return;}}

var wrongCount=0; // track wrong letter entries for scoring

function upd(){
  if(!sol)return;RL.innerHTML='';CL.innerHTML='';
  // Determine row/col validity
  var rowValid=[],colValid=[];
  for(var r=0;r<sz;r++){var w='';for(var c=0;c<sz;c++)w+=cells[r][c].value||'_';rowValid[r]=w===sol.rows[r];}
  for(var c2=0;c2<sz;c2++){var w2='';for(var r2=0;r2<sz;r2++)w2+=cells[r2][c2].value||'_';colValid[c2]=w2===sol.cols[c2];}

  // Cell coloring: ⬜empty, 🟨invalid row, 🟧invalid col, 🟩row valid, 🟦col valid, 💚both
  for(var a=0;a<sz;a++)for(var b=0;b<sz;b++){
    var cell=cells[a][b];
    if(cell.readOnly&&cell.classList.contains('text-purple-400'))continue; // hint cell — keep purple
    if(cell.readOnly&&cell.classList.contains('text-blue-400'))continue; // initial reveal — keep blue
    cell.classList.remove('border-red-500','border-green-500','border-emerald-400','border-amber-400','border-orange-400','text-red-400','bg-green-900/20','bg-emerald-900/20','bg-amber-900/10','bg-orange-900/10');
    var v=cell.value;
    if(!v){
      cell.classList.add('border-gray-700'); // empty — default
    } else if(rowValid[a]&&colValid[b]){
      cell.classList.add('border-green-500','bg-green-900/20'); // both valid 💚
    } else if(rowValid[a]){
      cell.classList.add('border-green-500','bg-green-900/20'); // row valid 🟩
    } else if(colValid[b]){
      cell.classList.add('border-emerald-400','bg-emerald-900/20'); // col valid 🟦
    } else if(v&&v.toUpperCase()!==sol.rows[a][b]){
      cell.classList.add('border-red-500','text-red-400'); // wrong letter
    } else {
      cell.classList.add('border-amber-400','bg-amber-900/10'); // filled but row/col not yet complete
    }
  }

  // Row labels
  for(var r3=0;r3<sz;r3++){var w3='';for(var c3=0;c3<sz;c3++)w3+=cells[r3][c3].value||'_';
    var rowDiv=document.createElement('div');rowDiv.className='flex items-center gap-0.5 justify-center mb-0.5';
    for(var i=0;i<w3.length;i++){
      var letter=document.createElement('span');
      letter.className='text-xs font-mono w-5 h-5 flex items-center justify-center rounded '+(rowValid[r3]?'text-green-400 bg-green-900/30':w3[i]==='_'?'text-gray-600':'text-gray-300');
      letter.textContent=w3[i];rowDiv.appendChild(letter);
    }
    RL.appendChild(rowDiv);}

  // Column labels
  var colGrid=document.createElement('div');colGrid.className='flex gap-1 justify-center';
  for(var c4=0;c4<sz;c4++){var w4='';for(var r4=0;r4<sz;r4++)w4+=cells[r4][c4].value||'_';
    var colDiv=document.createElement('div');colDiv.className='flex flex-col items-center gap-0.5';
    for(var i2=0;i2<w4.length;i2++){
      var letter2=document.createElement('span');
      letter2.className='text-xs font-mono w-5 h-5 flex items-center justify-center rounded '+(colValid[c4]?'text-emerald-400 bg-emerald-900/30':w4[i2]==='_'?'text-gray-600':'text-gray-300');
      letter2.textContent=w4[i2];colDiv.appendChild(letter2);
    }
    colGrid.appendChild(colDiv);
  }
  CL.appendChild(colGrid);

  // Live progress tracker
  var rowsDone=rowValid.filter(function(v){return v;}).length;
  var colsDone=colValid.filter(function(v){return v;}).length;
  var lettersCorrect=0,totalCells=sz*sz;
  for(var a2=0;a2<sz;a2++)for(var b2=0;b2<sz;b2++){if(cells[a2][b2].value&&cells[a2][b2].value.toUpperCase()===sol.rows[a2][b2])lettersCorrect++;}
  var pct=Math.round((lettersCorrect/totalCells)*100);
  var pe=document.getElementById('ms-prog-rows');if(pe)pe.textContent=rowsDone+'/'+sz;
  var pe2=document.getElementById('ms-prog-cols');if(pe2)pe2.textContent=colsDone+'/'+sz;
  var pe3=document.getElementById('ms-prog-letters');if(pe3)pe3.textContent=lettersCorrect+'/'+totalCells;
  var pe4=document.getElementById('ms-prog-pct');if(pe4)pe4.textContent=pct+'%';

  // Update live score breakdown
  updateScoreDisplay();

  // Auto-check if all cells filled
  var full=true;for(var a3=0;a3<sz;a3++)for(var b3=0;b3<sz;b3++)if(!cells[a3][b3].value)full=false;
  if(full&&!won)chk();
}

function updateScoreDisplay(){
  var diffMult={easy:1,medium:1.5,hard:2};
  var sizeMult={4:1,5:1.5,6:2};
  var diff=document.getElementById('ms-diff').value;
  var mult=(diffMult[diff]||1)*(sizeMult[sz]||1);
  var timeBonus=Math.max(0,300-el);
  var perfectBonus=(wrongCount===0)?100:0;
  var noHintBonus=(hints===0)?150:0;
  var streakBonus=Math.min(gs().k*10,100);
  var hintPen=hints*10;
  var errPen=wrongCount*5;
  var base=1000-hintPen-errPen+timeBonus+perfectBonus+noHintBonus+streakBonus;
  var total=Math.max(0,Math.round(base*mult));
  var e1=document.getElementById('ms-sc-hints');if(e1)e1.textContent='−'+hintPen;
  var e2=document.getElementById('ms-sc-errors');if(e2)e2.textContent='−'+errPen;
  var e3=document.getElementById('ms-sc-time');if(e3)e3.textContent='+'+timeBonus;
  var e4=document.getElementById('ms-sc-perfect');if(e4)e4.textContent=perfectBonus?'+100':'—';
  var e5=document.getElementById('ms-sc-nohint');if(e5)e5.textContent=noHintBonus?'+150':'—';
  var e6=document.getElementById('ms-sc-streak');if(e6)e6.textContent='+'+streakBonus;
  var e7=document.getElementById('ms-sc-mult');if(e7)e7.textContent='×'+mult;
  var e8=document.getElementById('ms-sc-total');if(e8)e8.textContent=total;
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
  var replaySec=document.getElementById('ms-replay-section');if(replaySec)replaySec.classList.remove('hidden');
  // Enhanced scoring: base 1000, -10/hint, -5/wrong, time bonus, difficulty multiplier, no-hint bonus, streak bonus
  var diffMult={easy:1,medium:1.5,hard:2};
  var sizeMult={4:1,5:1.5,6:2};
  var diff=document.getElementById('ms-diff').value;
  var mult=(diffMult[diff]||1)*(sizeMult[sz]||1);
  var timeBonus=Math.max(0,300-el); // bonus for finishing under 5 min
  var perfectBonus=(wrongCount===0)?100:0;
  var noHintBonus=(hints===0)?150:0;
  var streakBonus=Math.min(gs().k*10,100); // up to 100 pts from streak
  var base=1000-(hints*10)-(wrongCount*5)+timeBonus+perfectBonus+noHintBonus+streakBonus;
  var sc=Math.max(0,Math.round(base*mult));
  WS.textContent=fmt(el)+' · '+hints+' hints · '+wrongCount+' errors · '+sc+' pts';
  for(var r=0;r<sz;r++)for(var c=0;c<sz;c++){cells[r][c].readOnly=true;cells[r][c].classList.add('border-green-500/30','text-green-400');}
  var o=gs();o.p++;o.s++;o.k++;if(!o.b||el<o.b)o.b=el;ss(o);rs();
  var uid=localStorage.getItem('swf-uid')||'anon';
  fetch('/api/games/magic-squares/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({puzzle_id:pz.id,grid_size:sz,variant:pz.variant,solved:true,hints_used:hints,solve_seconds:el,score:sc,is_daily:document.getElementById('ms-mode').value==='daily',user_id:uid})}).catch(function(){});
  // Post to leaderboard
  fetch('/api/leaderboard/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({game:'magic-squares',user_id:uid,best_word:sz+'x'+sz+' '+pz.variant+' · '+hints+' hints, '+fmt(el),best_score:sc,total_score:sc,words_played:1})}).catch(function(){});
}

function hl(){if(won||!sol)return;var e=[];for(var r=0;r<sz;r++)for(var c=0;c<sz;c++)if(!cells[r][c].readOnly&&cells[r][c].value!==sol.rows[r][c])e.push([r,c]);if(!e.length)return;dimPrevHints();var p=e[Math.floor(Math.random()*e.length)];cells[p[0]][p[1]].value=sol.rows[p[0]][p[1]];cells[p[0]][p[1]].readOnly=true;cells[p[0]][p[1]].classList.remove('text-white');cells[p[0]][p[1]].classList.add('text-purple-400','border-purple-500','bg-purple-950/40','border-2');solveHistory.push({r:p[0],c:p[1],letter:sol.rows[p[0]][p[1]],time:el,source:'hint'});hints++;HC.textContent=hints;upd();}
function hr(){if(won||!sol)return;for(var r=0;r<sz;r++){var h=false;for(var c=0;c<sz;c++)if(!cells[r][c].readOnly&&cells[r][c].value!==sol.rows[r][c])h=true;if(h){dimPrevHints();for(var c2=0;c2<sz;c2++){cells[r][c2].classList.remove('text-white');cells[r][c2].value=sol.rows[r][c2];cells[r][c2].readOnly=true;cells[r][c2].classList.add('text-purple-400','border-purple-500','bg-purple-950/40','border-2');solveHistory.push({r:r,c:c2,letter:sol.rows[r][c2],time:el,source:'hint'});}hints+=sz;HC.textContent=hints;upd();return;}}}
function hc2(){if(won||!sol)return;for(var c=0;c<sz;c++){var h=false;for(var r=0;r<sz;r++)if(!cells[r][c].readOnly&&cells[r][c].value!==sol.rows[r][c])h=true;if(h){dimPrevHints();for(var r2=0;r2<sz;r2++){cells[r2][c].classList.remove('text-white');cells[r2][c].value=sol.rows[r2][c];cells[r2][c].readOnly=true;cells[r2][c].classList.add('text-purple-400','border-purple-500','bg-purple-950/40','border-2');solveHistory.push({r:r2,c:c,letter:sol.rows[r2][c],time:el,source:'hint'});}hints+=sz;HC.textContent=hints;upd();return;}}}
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

// ─── Puzzle Replay ───
var replayBtn=document.getElementById('ms-replay');
var expertBtn2=document.getElementById('ms-replay-expert-btn');
if(replayBtn)replayBtn.onclick=function(){playReplay('player');};
if(expertBtn2)expertBtn2.onclick=function(){playReplay('expert');};

function playReplay(mode){
  if(!sol)return;
  var container=document.getElementById('ms-replay-content');
  if(!container)return;
  container.innerHTML='<div id="ms-rg" class="inline-grid gap-0.5 bg-gray-800 p-1 rounded-xl border border-gray-700 mb-2"></div><p id="ms-replay-step" class="text-xs text-gray-500 mt-2"></p>';
  var rg=document.getElementById('ms-rg');
  rg.style.gridTemplateColumns='repeat('+sz+',1fr)';
  var rCells=[];
  for(var r=0;r<sz;r++){rCells[r]=[];for(var c=0;c<sz;c++){
    var d=document.createElement('div');
    d.className='w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-sm font-bold uppercase rounded border border-gray-700 bg-gray-900 text-gray-600';
    if(pz.revealed&&pz.revealed[r]&&pz.revealed[r][c]){d.textContent=pz.revealed[r][c];d.classList.remove('text-gray-600');d.classList.add('text-blue-400','bg-gray-800/80');}
    rg.appendChild(d);rCells[r][c]=d;
  }}
  var steps=(mode==='expert')?computeOptimalOrder():solveHistory;
  if(!steps||!steps.length){document.getElementById('ms-replay-step').textContent='No steps recorded';return;}
  var stepEl=document.getElementById('ms-replay-step');
  var idx=0;
  stepEl.textContent=(mode==='expert'?'🧠 Optimal':'▶ Your path')+': 0/'+steps.length;
  var intv=setInterval(function(){
    if(idx>=steps.length){clearInterval(intv);return;}
    var s=steps[idx];
    var cell=rCells[s.r][s.c];
    var letter=(mode==='expert')?sol.rows[s.r][s.c]:s.letter;
    cell.textContent=letter;
    cell.classList.remove('text-gray-600','bg-gray-900');
    if(mode==='expert'){cell.classList.add('text-cyan-400','bg-cyan-900/20','border-cyan-500');}
    else if(s.source==='hint'){cell.classList.add('text-purple-400','bg-purple-950/40','border-purple-500');}
    else if(letter===sol.rows[s.r][s.c]){cell.classList.add('text-green-400','bg-green-900/20');}
    else{cell.classList.add('text-red-400','bg-red-950/20');}
    idx++;
    stepEl.textContent=(mode==='expert'?'🧠 Optimal':'▶ Your path')+': '+idx+'/'+steps.length;
  },400);
}

function computeOptimalOrder(){
  var order=[],filled=[];
  for(var r=0;r<sz;r++){filled[r]=[];for(var c=0;c<sz;c++){filled[r][c]=!!(pz.revealed&&pz.revealed[r]&&pz.revealed[r][c]);}}
  var remaining=[];
  for(var r2=0;r2<sz;r2++)for(var c2=0;c2<sz;c2++){if(!filled[r2][c2])remaining.push({r:r2,c:c2});}
  while(remaining.length>0){
    var best=-1,bestIdx=0;
    for(var i=0;i<remaining.length;i++){var p=remaining[i],score=0;for(var k=0;k<sz;k++){if(filled[p.r][k])score++;if(filled[k][p.c])score++;}if(score>best){best=score;bestIdx=i;}}
    var pick=remaining.splice(bestIdx,1)[0];filled[pick.r][pick.c]=true;order.push(pick);
  }
  return order;
}

function load(){
  won=false;hints=0;HC.textContent='0';WIN.classList.add('hidden');playedSent=false;typedCount=0;wrongCount=0;solveHistory=[];
  var replaySec=document.getElementById('ms-replay-section');if(replaySec)replaySec.classList.add('hidden');
  sz=parseInt(document.getElementById('ms-size').value);
  var diff=document.getElementById('ms-diff').value;
  savePrefs();
  var url='/api/games/magic-squares/?size='+sz+'&mode='+document.getElementById('ms-mode').value+'&variant='+document.getElementById('ms-var').value+'&difficulty='+diff;
  fetch(url).then(function(r){return r.json();}).then(function(d){
    if(d.error){G.innerHTML='<p class="text-red-400 text-sm p-6">'+d.error+'</p>';return;}
    pz=d;sol=d.solution;
    // Show difficulty rating
    var dr=document.getElementById('ms-diff-rating');
    if(dr&&d.difficulty_score!==undefined){
      var stars=d.difficulty_score<=6?'⭐':d.difficulty_score<=12?'⭐⭐':d.difficulty_score<=18?'⭐⭐⭐':d.difficulty_score<=24?'⭐⭐⭐⭐':'⭐⭐⭐⭐⭐';
      dr.textContent=stars+' '+d.difficulty_score+'/30';
    }
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

// ─── Daily Grid Tracker ───
var DAILY_KEY='swf-ms-daily';
function getDailySolved(){try{var d=JSON.parse(localStorage.getItem(DAILY_KEY));if(d&&d.date===new Date().toISOString().split('T')[0])return d.solved||{};return{};}catch(e){return{};}}
function markDailySolved(size,diff){var today=new Date().toISOString().split('T')[0];var d=getDailySolved();if(!d[size])d[size]={};d[size][diff]=true;localStorage.setItem(DAILY_KEY,JSON.stringify({date:today,solved:d}));updateDailyTracker();}
function updateDailyTracker(){
  var tracker=document.getElementById('ms-daily-tracker');
  var mode=document.getElementById('ms-mode').value;
  if(mode!=='daily'){tracker.classList.add('hidden');return;}
  tracker.classList.remove('hidden');
  var solved=getDailySolved();
  [4,5,6].forEach(function(s){
    var btn=document.getElementById('ms-daily-'+s);
    if(!btn)return;
    var sizeSolved=solved[s]||{};
    var allDone=sizeSolved['easy']&&sizeSolved['medium']&&sizeSolved['hard'];
    var someDone=sizeSolved['easy']||sizeSolved['medium']||sizeSolved['hard'];
    var count=(sizeSolved['easy']?1:0)+(sizeSolved['medium']?1:0)+(sizeSolved['hard']?1:0);
    if(allDone){
      btn.className='px-2.5 py-1 rounded-lg text-xs border border-green-500/50 bg-green-900/20 text-green-400 transition-colors';
      btn.textContent='✓ '+s+'×'+s+' (3/3)';
    } else if(someDone){
      btn.className='px-2.5 py-1 rounded-lg text-xs border border-amber-500/40 bg-amber-900/20 text-amber-400 hover:bg-amber-900/40 transition-colors cursor-pointer';
      btn.textContent='◐ '+s+'×'+s+' ('+count+'/3)';
    } else {
      btn.className='px-2.5 py-1 rounded-lg text-xs border border-indigo-500/40 bg-indigo-900/20 text-indigo-400 hover:bg-indigo-900/40 transition-colors cursor-pointer';
      btn.textContent='▶ '+s+'×'+s;
    }
    btn.onclick=function(){document.getElementById('ms-size').value=s;document.getElementById('ms-mode').value='daily';load();};
  });
}

// Hook into win to mark daily solved with difficulty
var origWin=win;
win=function(){origWin();if(document.getElementById('ms-mode').value==='daily'){var diff=document.getElementById('ms-diff').value;markDailySolved(sz,diff);}};

// Show/hide tracker when mode changes
document.getElementById('ms-mode').addEventListener('change',updateDailyTracker);

loadPrefs();rs();updateDailyTracker();load();
})();
