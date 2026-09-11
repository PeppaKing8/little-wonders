(function(root){
class QuestModel {
  constructor(tasks,saved={},clock=()=>new Date(),random=Math.random){
    this.tasks=tasks;this.clock=clock;this.random=random;
    this.state={version:1,days:{},settings:{pinned:true},...saved};
    if(!this.state.days || typeof this.state.days!=='object' || Array.isArray(this.state.days))this.state.days={};
    this.state.settings={pinned:true,...this.state.settings};
    this.ensureDay();
  }
  dateKey(){const d=this.clock();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  pick(group,exclude=[]){
    const all=this.tasks.filter(t=>t.group===group && !exclude.includes(t.id));
    const recent=new Set(Object.entries(this.state.days).filter(([date])=>date<this.dateKey()).sort(([a],[b])=>b.localeCompare(a)).slice(0,7).flatMap(([,d])=>d.seen||d.items?.map(t=>t.id)||[]));
    const fresh=all.filter(t=>!recent.has(t.id));const pool=fresh.length?fresh:all;
    return pool[Math.floor(this.random()*pool.length)];
  }
  ensureDay(){
    const key=this.dateKey();let day=this.state.days[key];
    if(!day || !Array.isArray(day.items) || day.items.length!==3 || new Set(day.items.map(i=>i.id)).size!==3 || day.items.some(i=>!this.tasks.find(t=>t.id===i.id))){
      const items=['cozy','explore','silly'].map(g=>({id:this.pick(g).id,done:false}));
      // Keep the existing day intact; new days include one attributed activity.
      if(!items.some(i=>['afh','superbetter','cci'].includes(this.tasks.find(t=>t.id===i.id)?.source))){
        const sourced=this.tasks.filter(t=>['afh','superbetter','cci'].includes(t.source));
        const recent=new Set(Object.entries(this.state.days).filter(([date])=>date<key).sort(([a],[b])=>b.localeCompare(a)).slice(0,7).flatMap(([,d])=>d.seen||d.items?.map(t=>t.id)||[]));
        const fresh=sourced.filter(t=>!recent.has(t.id));const pool=fresh.length?fresh:sourced;
        if(pool.length){const t=pool[Math.floor(this.random()*pool.length)];const index=items.findIndex(i=>this.tasks.find(task=>task.id===i.id).group===t.group);items[index]={id:t.id,done:false};}
      }
      day=this.state.days[key]={items,seen:items.map(i=>i.id),celebrated:false};
    }
    if(!Array.isArray(day.seen))day.seen=day.items.map(i=>i.id);
    this.day=day;this.key=key;return day;
  }
  toggle(id){this.ensureDay();const t=this.day.items.find(i=>i.id===id);if(!t)return false;t.done=!t.done;const celebrate=this.day.items.every(i=>i.done)&&!this.day.celebrated;if(celebrate)this.day.celebrated=true;return celebrate;}
  swap(id){this.ensureDay();const item=this.day.items.find(i=>i.id===id);if(!item || item.done)return false;const task=this.tasks.find(t=>t.id===id);let next=this.pick(task.group,this.day.seen);if(!next)next=this.pick(task.group,this.day.items.map(i=>i.id));if(!next)return false;item.id=next.id;this.day.seen.push(next.id);return true;}
  get items(){return this.day.items.map(i=>({...this.tasks.find(t=>t.id===i.id),done:i.done}));}
  get completed(){return this.day.items.filter(i=>i.done).length;}
}
if(typeof module!=='undefined')module.exports=QuestModel;else root.QuestModel=QuestModel;
})(typeof window!=='undefined'?window:globalThis);
