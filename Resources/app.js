const native=window.webkit?.messageHandlers?.app;
let initial=window.__INITIAL_STATE__||{};
if(!native){try{initial=JSON.parse(localStorage.getItem('little-wonders-state')||'{}');}catch{}}
const model=new QuestModel(TASKS,initial);
const $=s=>document.querySelector(s);
let saveTimer,toastTimer;
function send(type,body={}){native?.postMessage({type,...body});}
function persist(){
  if(native){$('#save-status').textContent='正在保存…';send('save',{state:model.state});}
  else{try{localStorage.setItem('little-wonders-state',JSON.stringify(model.state));}catch{$('#save-status').textContent='保存失败，请暂时不要关闭';}}
}
window.saveResult=ok=>{$('#save-status').textContent=ok?'已保存在这台 Mac':'保存失败，请暂时不要关闭';};
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2200);}
function render(){
  const count=model.completed,done=count===3;
  document.body.classList.toggle('all-done',done);
  $('#date').textContent=new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'});
  $('#count').textContent=`今日份奇遇 · ${count} / 3`;
  $('#progress').style.width=`${count/3*100}%`;
  $('.progress').setAttribute('aria-valuenow',count);
  $('#dots').innerHTML=[0,1,2].map(i=>`<span class="${i<count?'filled':''}"></span>`).join('');
  $('#message').textContent=['做一点点就很好，不着急。','收集到一颗小小的开心。','又和世界靠近了一点点。','今天的小奇遇，圆满收集！'][count];
  $('#pin').classList.toggle('active',model.state.settings.pinned);
  $('#pin').setAttribute('aria-label',model.state.settings.pinned?'取消置顶':'窗口置顶');
  const names={cozy:'照顾自己',explore:'看看世界',silly:'可爱一下'};
  $('#cards').replaceChildren(...model.items.map(task=>{
    const el=document.createElement('article');el.className=`card ${task.done?'done':''}`;
    el.innerHTML=`<div class="card-top"><span class="tag-dot"></span><span>${names[task.group]}</span><span class="duration">${task.duration}</span></div><div class="task-row"><span class="emoji" aria-hidden="true">${task.emoji}</span><span class="task-title">${task.title}</span><button class="check" aria-pressed="${task.done}" aria-label="${task.done?'撤销完成':'完成'}：${task.title}">${task.done?'✓':''}</button></div><div class="card-bottom"><span class="detail">${task.detail}</span>${task.done?'':'<button class="swap" aria-label="换一个：'+task.title+'">↻ 换一个</button>'}</div>`;
    el.querySelector('.check').onclick=()=>{const celebrate=model.toggle(task.id);persist();render();if(celebrate)fireConfetti();else if(model.day.items.find(i=>i.id===task.id)?.done)toast('小兔子给你一颗星星 ✧');};
    const swap=el.querySelector('.swap');if(swap)swap.onclick=()=>{model.swap(task.id);persist();render();toast('换一个也很好 ♡');};
    const source=document.createElement('button');source.className='source-tag';source.textContent=TASK_SOURCES[task.source]?.name||'小小奇遇原创';source.setAttribute('aria-label','任务来源：'+source.textContent);source.onclick=()=>window.showTaskSource(task.source);el.append(source);
    return el;
  }));
}
function checkDay(){const key=model.key;model.ensureDay();if(key!==model.key){persist();render();toast('新一天的小奇遇来啦 ☀');}}
setInterval(checkDay,15000);document.addEventListener('visibilitychange',checkDay);window.addEventListener('focus',checkDay);window.refreshDay=checkDay;
$('#pin').onclick=()=>{model.state.settings.pinned=!model.state.settings.pinned;send('pin',{pinned:model.state.settings.pinned});persist();render();};
$('#hide').onclick=()=>native?send('hide'):toast('安装桌面版后，可以收起到菜单栏');
$('#drag').addEventListener('mousedown',e=>{if(!e.target.closest('button'))send('drag');});
$('#about').onclick=()=>$('#about-dialog').showModal();$('#close-about').onclick=()=>$('#about-dialog').close();
$('#celebrate').onclick=()=>{checkDay();if(model.completed===3)fireConfetti();};
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.showTaskSource=id=>{const source=TASK_SOURCES[id]||TASK_SOURCES.original;$('#source-title').textContent=source.name;$('#source-content').innerHTML=`<p>${escapeHTML(source.label)}</p><p>${escapeHTML(source.note)}</p>`;if(source.url){const p=document.createElement('p'),a=document.createElement('a');a.href=source.url;a.target='_blank';a.textContent='查看原始资料 ↗';p.append(a);$('#source-content').append(p);}$('#source-dialog').showModal();};
$('#source-close').onclick=()=>$('#source-dialog').close();
let animation;
function fireConfetti(message='耶！今天也发生了三件小美好 ♡'){
  toast(message);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const canvas=$('#confetti'),ctx=canvas.getContext('2d'),dpr=devicePixelRatio||1;
  const w=innerWidth,h=innerHeight;canvas.width=w*dpr;canvas.height=h*dpr;ctx.scale(dpr,dpr);
  const colors=['#eaa7ae','#b5c797','#b6a6d6','#edce88','#a4c8ca','#efa987'];
  const particles=Array.from({length:115},(_,i)=>({x:i%2?w-12:12,y:h*.68,vx:(i%2?-1:1)*(1+Math.random()*5),vy:-5-Math.random()*9,r:3+Math.random()*4,rotation:Math.random()*6,spin:(Math.random()-.5)*.18,color:colors[i%colors.length],star:i%5===0}));
  cancelAnimationFrame(animation);let start=performance.now(),last=start;
  function frame(now){const dt=Math.min((now-last)/16.67,2);last=now;ctx.clearRect(0,0,w,h);const age=now-start;
    particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.15*dt;p.rotation+=p.spin*dt;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rotation);ctx.globalAlpha=Math.min(1,(4300-age)/700);ctx.fillStyle=p.color;if(p.star){ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5,r=i%2?p.r*.45:p.r;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();}else{ctx.fillRect(-p.r/2,-p.r,p.r,p.r*1.6);}ctx.restore();});
    if(age<4300)animation=requestAnimationFrame(frame);else ctx.clearRect(0,0,w,h);
  }animation=requestAnimationFrame(frame);
}
render();persist();if(window.__LOAD_ERROR__)toast('原有记录读取失败，已保留备份');
