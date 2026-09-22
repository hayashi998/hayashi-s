import { Game, FISH } from './game.mjs';
const game = new Game();
const $ = s => document.querySelector(s);
const fmt = n => n.toLocaleString('en-US');
let chip = 100, previousPhase = '', previousHistory = '', toastTimer;
$('#fish-grid').innerHTML = FISH.map((f, i) => `<article class="fish-card" data-fish="${i}"><button class="fish-button" data-bet="${i}" aria-label="向${f.name}投入"><span class="fish-icon">${f.icon}</span><span class="fish-name">${f.name}</span><span class="multiplier">×${f.multiplier}</span><span class="fish-bet">未投入</span></button><button class="withdraw" data-withdraw="${i}" disabled aria-label="撤回${f.name}全部投入">撤回</button></article>`).join('');
$('#fishes').innerHTML = [5,6,3,4,5,1,6,2,5].map((n,i)=>`<span class="swimmer" style="left:${5+(i*29)%82}%;top:${5+(i*23)%65}%;--duration:${3+i%4}s;animation-delay:-${i}s;font-size:${i%2?29:38}px">${FISH[n].icon}</span>`).join('');
function toast(text) { $('#toast').textContent=text; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2400); }
function render() {
  const now = Date.now(); game.advance(now);
  const open = game.phase === 'betting';
  const seconds = Math.max(0, Math.ceil((game.deadline-now)/1000));
  $('#balance').textContent=fmt(game.balance);
  $('#total').textContent=`本局投入 ${fmt(game.bets.reduce((a,b)=>a+b,0))}`;
  $('#round').textContent=String(game.round).padStart(3,'0');
  $('#seconds').textContent=String(seconds).padStart(2,'0');
  const duration = open ? 20 : game.phase === 'drawing' ? 5 : 2;
  $('#progress').style.width=`${Math.max(0,(game.deadline-now)/(duration*10))}%`;
  document.querySelectorAll('.fish-card').forEach((card,i)=>{
    card.classList.toggle('active',game.bets[i]>0);
    card.classList.toggle('winner',game.phase==='result'&&i===game.winner);
    card.querySelector('.fish-bet').textContent=game.bets[i]?`已投 ${fmt(game.bets[i])}`:'未投入';
    card.querySelector('.fish-button').disabled=!open;
    card.querySelector('.withdraw').disabled=!open||!game.bets[i];
  });
  if(previousPhase!==game.phase){
    previousPhase=game.phase;
    $('.scene').classList.toggle('drawing',game.phase==='drawing');
    $('#phase-title').textContent=open?'自由下注中':game.phase==='drawing'?'收竿开奖中':'本局已结算';
    $('#phase-note').textContent=open?'选择下方鱼种，等待好运上钩':game.phase==='drawing'?'投入已锁定 · 看看谁会上钩':'奖励已到账 · 即将自动开始下一局';
    $('#hint').textContent=open?'点鱼种加注 · 点「撤回」退回该鱼全部投入':'本局已封盘，下一局可继续操作';
    $('#result').hidden=game.phase!=='result';
    if(game.phase==='result'){
      const f=FISH[game.winner],r=game.last;
      $('#result').innerHTML=`<div class="result-icon">${f.icon}</div><h3>${f.name}上钩了！ ×${f.multiplier}</h3><p>投入 ${fmt(r.total)} · 到账 <strong>${fmt(r.payout)}</strong></p><p>${r.total ? `本局净收益 ${r.net>0?'+':''}${fmt(r.net)}` : '本局未参与，下局试试好运'}</p>`;
    }
  }
  const history=game.history.join(',');
  if(history!==previousHistory){previousHistory=history;$('#history').innerHTML=game.history.map(i=>`<span class="history-fish" title="${FISH[i].name} ×${FISH[i].multiplier}">${FISH[i].icon}</span>`).join('');}
}
$('#fish-grid').addEventListener('click',e=>{
  const bet=e.target.closest('[data-bet]'),withdraw=e.target.closest('[data-withdraw]');
  try {
    if(bet)game.bet(Number(bet.dataset.bet),chip);
    if(withdraw){const i=Number(withdraw.dataset.withdraw);const value=game.bets[i];game.withdraw(i);toast(`已撤回 ${FISH[i].name} · ${fmt(value)} 珍珠`);}
  }catch(err){toast(err.message);}
  render();
});
document.querySelectorAll('[data-chip]').forEach(button=>button.addEventListener('click',()=>{chip=Number(button.dataset.chip);document.querySelectorAll('[data-chip]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});}));
function modal(html){$('#modal-content').innerHTML=html;$('#modal').showModal();}
$('.close').addEventListener('click',()=>$('#modal').close());
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const r=$('#modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#modal').close();}});
$('#rules').addEventListener('click',()=>modal(`<span class="modal-label">HOW TO PLAY</span><h2 class="modal-title">一竿好运，轻松上手</h2><ol class="rules-list"><li>选择 100、1,000 或 10,000 珍珠档位，再点鱼种投入。可同时投入多种鱼。</li><li>下注限时 20 秒。可重复加注，或撤回某种鱼的全部投入。</li><li>封盘后开奖 5 秒，每局只开出一种鱼。命中到账 = 该鱼投入 × 倍率，包含本金。</li><li>结果展示 2 秒，随后自动开始下一局。未命中的投入不返还。</li></ol><div class="probability">7 种鱼初始概率均为 1/7。当前倍率用于演示，平均返还率约 285.71%。<br>资产仅在当前页面有效，刷新重置。切到后台时按时间补结算，返回后开始新一局。</div>`));
$('#recharge').addEventListener('click',()=>modal(`<span class="modal-label">PEARL STATION / 演示</span><h2 class="modal-title">补充一点好运</h2><p class="modal-copy">以下为占位入口，点击直接模拟到账。<br>不产生真实扣款，也不会播放真实广告。</p><button class="recharge-option" data-credit="10000"><span>🎁</span><div><strong>付费获取 · 占位</strong><small>模拟到账 10,000 珍珠</small></div><b>＋</b></button><button class="recharge-option" data-credit="1000"><span>🎬</span><div><strong>看广告获取 · 占位</strong><small>模拟到账 1,000 珍珠</small></div><b>＋</b></button>`));
$('#modal-content').addEventListener('click',e=>{const b=e.target.closest('[data-credit]');if(!b)return;const amount=Number(b.dataset.credit);game.balance+=amount;$('#modal').close();toast(`模拟成功，到账 ${fmt(amount)} 珍珠`);render();});
setInterval(render,100);document.addEventListener('visibilitychange',render);render();
