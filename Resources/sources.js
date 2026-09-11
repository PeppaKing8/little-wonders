window.TASK_SOURCES={
 afh:{name:'Action for Happiness',label:'活动改编 · 2026 年 9 月日历',url:'https://actionforhappiness.org/calendar-monthly',note:'根据 2026 年 9 月自我照顾日历改写成更短的小任务。不是官方翻译，也不是实时同步。'},
 superbetter:{name:'SuperBetter',label:'活动改编 · 作者演讲',url:'https://janemcgonigal.com/2014/01/06/',note:'选自 Jane McGonigal 的演讲中具体小挑战，作中文转述或缩短。这里只引用活动点子，不沿用演讲中的疗效或寿命承诺。'},
 cci:{name:'CCI',label:'活动改编 · Fun Activities Catalogue',url:'https://cci.health.wa.gov.au/-/media/CCI/Consumer-Modules/Back-from-The-Bluez/Back-from-the-Bluez---02---Behavioural-Strategies.pdf',note:'根据 CCI 活动清单改编，时长由本应用建议。'},
 original:{name:'小小奇遇原创',label:'原创趣味任务',note:'根据你喜欢的短小、有点奇怪的日常活动风格编写。'},
 user:{name:'你的点子',label:'来自你的例子',note:'温水洗脸、带水果散步、模仿动物和四位数乘法来自你最初提供的例子。'}
};
const sourced=[
 ['afh-photos','cozy','🖼️','翻一张喜欢的旧照片','只停留一会儿，不用整理整个相册。','1 分钟','afh'],
 ['afh-note','cozy','💌','留一句愿意听到的话','写在纸上，放在自己看得到的地方。','1 分钟','afh'],
 ['afh-strength','silly','✨','夸夸自己三个小地方','可以很具体：比如今天的配色。','2 分钟','afh'],
 ['afh-pause','cozy','🌙','暂停一会儿，什么都不赶','把手里的事放下，舒服地待一小会儿。','1 分钟','afh'],
 ['afh-enjoy','explore','🌷','做一小段自己喜欢的事','听歌、翻书、看看树，挑一个就好。','2 分钟','afh'],
 ['sb-snap','silly','🫰','给响指数到五十','慢慢来；不方便响指，就轻点手指。','1 分钟','superbetter'],
 ['sb-count','silly','🔢','从一百开始，每次减七','100、93、86……尝试一小段也可以。','1 分钟','superbetter'],
 ['sb-animal','silly','🐣','找一张动物幼崽的照片','挑你最喜欢的一种动物。','1 分钟','superbetter'],
 ['sb-steps','explore','👣','起身，慢慢走三步','留意这三步，走到哪里都可以。','30 秒','superbetter'],
 ['sb-thanks','explore','💬','给一个人写一句谢谢','想一件具体的小事，再决定要不要发。','1 分钟','superbetter'],
 ['cci-flower','cozy','🌼','闻一闻一朵花','也可以闻闻茶叶，留意一点点香气。','30 秒','cci'],
 ['cci-birds','explore','🐦','听一会儿外面的鸟叫','没听到也没关系，留意别的声音。','1 分钟','cci']
];
for(const [id,group,emoji,title,detail,duration,source] of sourced)TASKS.push({id,group,emoji,title,detail,duration,source});
for(const task of TASKS)task.source ||= ['cozy-0','explore-0','silly-0','silly-1'].includes(task.id)?'user':'original';
