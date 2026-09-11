const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const Model=require('../Resources/model');const tasks=require('../Resources/tasks');
function withSources(){const all=structuredClone(tasks);const context={window:{},TASKS:all};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../Resources/sources.js'),'utf8'),context);return {tasks:all,sources:context.window.TASK_SOURCES};}
test('three unique categories, fixed within a day and persisted across relaunch',()=>{
 const m=new Model(tasks);assert.equal(m.items.length,3);assert.equal(new Set(m.items.map(t=>t.group)).size,3);
 const id=m.items[0].id;m.toggle(id);const r=new Model(tasks,JSON.parse(JSON.stringify(m.state)));
 assert.deepEqual(r.items,m.items);assert.equal(r.completed,1);
});
test('celebration only on last completion and never repeated by reopening or undoing',()=>{
 const m=new Model(tasks);assert.equal(m.toggle(m.items[0].id),false);assert.equal(m.toggle(m.items[1].id),false);assert.equal(m.toggle(m.items[2].id),true);
 assert.equal(new Model(tasks,m.state).day.celebrated,true);m.toggle(m.items[2].id);assert.equal(m.toggle(m.items[2].id),false);
});
test('swap keeps completed items, avoids same task, and survives exhausting category',()=>{
 const m=new Model(tasks);const id=m.items[0].id;m.toggle(id);assert.equal(m.swap(id),false);
 for(let i=0;i<70;i++){const before=m.items[1].id;assert.equal(m.swap(before),true);assert.notEqual(m.items[1].id,before);assert.equal(m.items[0].done,true);}
});
test('local midnight renews, old completion retained, previous 7 days avoided',()=>{
 let d=new Date(2026,8,9,23,59);const m=new Model(tasks,{},()=>d);m.items.forEach(i=>m.toggle(i.id));
 const ids=new Set(m.items.map(t=>t.id));d=new Date(2026,8,10,0,1);m.ensureDay();assert.equal(m.key,'2026-09-10');assert.equal(m.completed,0);assert.equal(m.day.celebrated,false);assert(m.items.every(i=>!ids.has(i.id)));assert(m.state.days['2026-09-09'].items.every(i=>i.done));
});
test('stale pre-midnight click cannot complete a new unrelated task',()=>{
 let d=new Date(2026,8,9);const m=new Model(tasks,{},()=>d);const old=m.items[0].id;d=new Date(2026,8,10);assert.equal(m.toggle(old),false);assert.equal(m.completed,0);
});
test('malformed day repairs safely and task IDs are unique',()=>{
 const m=new Model(tasks,{days:[]});assert.equal(m.items.length,3);assert.equal(new Set(tasks.map(t=>t.id)).size,tasks.length);assert.equal(tasks.length,72);
});
test('sourced tasks load, every task names a source, and new days include one sourced activity',()=>{
 const {tasks:all,sources}=withSources();assert.equal(all.length,84);assert.equal(new Set(all.map(t=>t.id)).size,84);assert(all.every(t=>sources[t.source]));
 const q=new Model(all,{},()=>new Date(2026,8,12),()=>0.95);assert(q.items.some(t=>['afh','superbetter','cci'].includes(t.source)));assert.equal(new Set(q.items.map(t=>t.group)).size,3);
});
test('page has no leftover lab or shelf markup and loads only the four remaining scripts',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../Resources/index.html'),'utf8');
 for(const bad of ['lab-','#lab','shelf','vibe','experiments.js','lab.css','class="tabs"'])assert(!html.includes(bad),'found '+bad);
 assert.deepEqual([...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]),['tasks.js','sources.js','model.js','app.js']);
 for(const f of ['tasks.js','sources.js','model.js','app.js','index.html','AppIcon.icns'])assert(fs.existsSync(path.join(__dirname,'../Resources',f)));
 assert.deepEqual(fs.readdirSync(path.join(__dirname,'../Resources')).sort(),['AppIcon.icns','app.js','index.html','model.js','sources.js','tasks.js']);
});
