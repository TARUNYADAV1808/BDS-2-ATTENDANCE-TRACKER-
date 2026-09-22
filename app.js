/* global supabase, Chart, XLSX, jspdf */
const {createClient}=window.supabase;
const sb=createClient(window.APP_CONFIG.SUPABASE_URL,window.APP_CONFIG.SUPABASE_ANON_KEY);

let user=null, attendance=new Map(), chart=null, deferredInstall=null, selectedDate=isoToday(), calendarMonth=isoToday().slice(0,7);
let settings={
  target:86, overallMode:"subject", reminderEnabled:false, reminderTime:"18:00", darkMode:false,
  sessions:[
    {id:"pre_s1",label:"Teaching → Sessional 1",start:"2026-09-22",end:"2026-12-20"},
    {id:"s1_s2",label:"Sessional 1 → Sessional 2",start:"2027-01-03",end:"2027-04-04"},
    {id:"s2_s3",label:"Sessional 2 → Sessional 3",start:"2027-04-21",end:"2027-07-18"},
    {id:"s3_final",label:"Sessional 3 → University Final",start:"2027-08-02",end:"2027-08-22"}
  ],
  exceptions:[
    ["2026-11-08","Diwali vacation"],["2026-11-09","Diwali vacation"],["2026-11-10","Diwali vacation"],["2026-11-11","Diwali vacation"],["2026-11-12","Diwali vacation"],["2026-11-13","Diwali vacation"],["2026-11-14","Diwali vacation"],["2026-11-15","Diwali vacation"],
    ["2026-12-21","Sessional 1"],["2026-12-22","Sessional 1"],["2026-12-23","Sessional 1"],["2026-12-24","Sessional 1"],["2026-12-25","Sessional 1"],["2026-12-26","Sessional 1"],["2026-12-27","Sessional 1"],["2026-12-28","Sessional 1"],["2026-12-29","Sessional 1"],["2026-12-30","Sessional 1"],["2026-12-31","Sessional 1"],["2027-01-01","Sessional 1"],["2027-01-02","Sessional 1"],
    ["2027-04-05","Sessional 2"],["2027-04-06","Sessional 2"],["2027-04-07","Sessional 2"],["2027-04-08","Sessional 2"],["2027-04-09","Sessional 2"],["2027-04-10","Sessional 2"],["2027-04-11","Sessional 2"],["2027-04-12","Sessional 2"],["2027-04-13","Sessional 2"],["2027-04-14","Sessional 2"],["2027-04-15","Sessional 2"],["2027-04-16","Sessional 2"],["2027-04-17","Sessional 2"],["2027-04-18","Sessional 2"],["2027-04-19","Sessional 2"],["2027-04-20","Sessional 2"],
    ["2027-05-16","Summer vacation"],["2027-05-17","Summer vacation"],["2027-05-18","Summer vacation"],["2027-05-19","Summer vacation"],["2027-05-20","Summer vacation"],["2027-05-21","Summer vacation"],["2027-05-22","Summer vacation"],["2027-05-23","Summer vacation"],["2027-05-24","Summer vacation"],["2027-05-25","Summer vacation"],
    ["2027-07-19","Sessional 3"],["2027-07-20","Sessional 3"],["2027-07-21","Sessional 3"],["2027-07-22","Sessional 3"],["2027-07-23","Sessional 3"],["2027-07-24","Sessional 3"],["2027-07-25","Sessional 3"],["2027-07-26","Sessional 3"],["2027-07-27","Sessional 3"],["2027-07-28","Sessional 3"],["2027-07-29","Sessional 3"],["2027-07-30","Sessional 3"],["2027-07-31","Sessional 3"],["2027-08-01","Sessional 3"],
    ["2027-08-16","Preparatory leave"],["2027-08-17","Preparatory leave"],["2027-08-18","Preparatory leave"],["2027-08-19","Preparatory leave"],["2027-08-20","Preparatory leave"],["2027-08-21","Preparatory leave"],["2027-08-22","Preparatory leave"]
  ].map(([date,label])=>({date,label}))
};

const SUBJECTS=[
["pc_prostho_theory","Pre Clinical Prostho Theory","Theory"],
["ortho_practical","Orthodontics Practical","Practical"],
["pc_conservative_theory","Pre Clinical Conservative Theory","Theory"],
["pc_conservative_practical","Pre Clinical Conservative Practical","Practical"],
["gen_path_theory","General Pathology Theory","Theory"],
["gen_path_practical","General Pathology Practical","Practical"],
["gen_path_interactive","General Pathology Interactive Session","Interactive"],
["pharm_theory","Pharmacology Theory","Theory"],
["pharm_interactive","Pharmacology Interactive Session","Interactive"],
["dms_prostho_lecture","DMS Prostho Lecture","Theory"],
["dms_conservative_lecture","DMS Conservative Lecture","Theory"],
["dms_prostho_practical","DMS Prosthodontics Practical","Practical"],
["dms_conservative_practical","DMS Conservative Practical","Practical"],
["prostho_cons_interactive","Prostho & Conservative Interactive Session","Interactive"],
["gen_pharm_practical","General Pharmacology Practical","Practical"],
["gen_micro_theory","General Microbiology Theory","Theory"],
["gen_micro_practical","General Microbiology Practical","Practical"],
["pc_prostho_practical","Preclinical Prostho Practical","Practical"],
["behavioural_science","Behavioural Science Lecture","Theory"],
["oral_pathology_practical","Oral Pathology Practical","Practical"],
["oral_pathology_theory","Oral Pathology Theory","Theory"]
].map(([id,name,type])=>({id,name,type}));
const SUBJECT=Object.fromEntries(SUBJECTS.map(s=>[s.id,s]));
const DAY=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

/* Exact Batch-B activities read from the supplied timetable. Batch-A-only blocks are excluded. */
const SCHEDULE={
1:[
["08:00","09:00","pc_prostho_theory","Pre Clinical Prostho Theory"],
["09:00","10:00","ortho_practical","Orthodontics Practical"],
["10:00","12:00","gen_pharm_practical","General Pharmacology Practical"],
["12:30","13:00","gen_path_theory","General Pathology Theory"],
["13:30","14:00","gen_path_interactive","General Pathology Interactive Session"],
["14:00","15:00","pharm_theory","Pharmacology Theory"]
],
2:[
["08:00","09:00","dms_prostho_lecture","DMS Prostho Lecture"],
["09:00","10:00","dms_conservative_lecture","DMS Conservative Lecture"],
["10:00","12:00","pc_prostho_practical","Preclinical Prostho Practical"],
["12:30","13:00","gen_path_theory","General Pathology Theory"],
["13:30","14:00","pharm_interactive","Pharmacology Interactive Session"],
["14:00","15:00","pharm_theory","Pharmacology Theory"]
],
3:[
["08:00","09:00","ortho_practical","Orthodontics Practical"],
["09:00","10:00","gen_micro_theory","General Microbiology Theory"],
["10:00","12:00","gen_path_practical","General Pathology Practical"],
["13:30","14:30","pc_conservative_practical","Pre Clinical Conservative Practical"],
["14:30","15:00","prostho_cons_interactive","Prostho & Conservative Interactive Session"]
],
4:[
["08:00","09:00","pc_conservative_theory","Pre Clinical Conservative Theory"],
["09:00","10:00","gen_micro_theory","General Microbiology Theory"],
["10:00","12:00","gen_micro_practical","General Microbiology Practical"],
["13:30","15:00","dms_prostho_practical","DMS Prosthodontics Practical"]
],
5:[
["08:00","09:00","behavioural_science","Behavioural Science Lecture"],
["09:00","11:00","pc_prostho_practical","Preclinical Prostho Practical"],
["11:00","12:00","pharm_theory","Pharmacology Theory"],
["13:30","15:00","dms_conservative_practical","DMS Conservative Practical"]
],
6:[
["08:00","10:00","pc_conservative_practical","Pre Clinical Conservative Practical"],
["10:00","11:00","oral_pathology_theory","Oral Pathology Theory"],
["11:00","13:00","oral_pathology_practical","Oral Pathology Practical"]
]};

function clone(x){return JSON.parse(JSON.stringify(x))}
function isoToday(){return new Date().toLocaleDateString("en-CA")}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function fmtDate(s){return new Date(s+"T00:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short",year:"numeric"})}
function minutes(t){const [h,m]=t.split(":").map(Number);return h*60+m}
function weight(slot){return (minutes(slot.end)-minutes(slot.start))/60}
function isSunday(d){return new Date(d+"T00:00:00").getDay()===0}
function exception(d){return settings.exceptions.find(x=>x.date===d)}
function scheduled(d){
  if(d<"2026-09-22"||d>"2027-09-22"||isSunday(d)||exception(d))return [];
  const dow=new Date(d+"T00:00:00").getDay();
  return (SCHEDULE[dow]||[]).map((x,i)=>({slotId:`${dow}-${i}`,start:x[0],end:x[1],subjectId:x[2],name:x[3],weight:weight({start:x[0],end:x[1]})}));
}
function key(d,s){return `${d}|${s}`}
function status(d,s){return attendance.get(key(d,s))?.present??null}
function toast(m){const x=document.getElementById("toast");x.textContent=m;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),2300)}
function showPage(name){document.querySelectorAll(".page").forEach(x=>x.classList.add("hidden"));document.getElementById("page-"+name).classList.remove("hidden");document.querySelectorAll(".nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.page===name));({dashboard:renderDashboard,mark:renderMark,calendar:renderCalendar,sessionals:renderSessions,calculator:renderCalculators,history:renderHistory,export:()=>{},settings:renderSettings}[name]||(()=>{}))()}

async function load(){
  const p=await sb.from("profiles").select("settings").eq("user_id",user.id).maybeSingle();
  if(p.error)throw p.error;
  if(p.data?.settings)settings={...settings,...p.data.settings,sessions:p.data.settings.sessions||settings.sessions,exceptions:p.data.settings.exceptions||settings.exceptions};
  else await saveSettings();
  const a=await sb.from("attendance").select("class_date,slot_id,subject_id,present").eq("user_id",user.id);
  if(a.error)throw a.error;
  attendance=new Map((a.data||[]).map(x=>[key(x.class_date,x.slot_id),x]));
  applySettings();
}
async function saveSettings(){
  const r=await sb.from("profiles").upsert({user_id:user.id,settings,updated_at:new Date().toISOString()},{onConflict:"user_id"});
  if(r.error)throw r.error;
}
async function saveEntry(d,s,p){
  const payload={user_id:user.id,class_date:d,slot_id:s.slotId,subject_id:s.subjectId,present:p,updated_at:new Date().toISOString()};
  const r=await sb.from("attendance").upsert(payload,{onConflict:"user_id,class_date,slot_id"});if(r.error)throw r.error;
  attendance.set(key(d,s.slotId),payload);
}
async function clearEntry(d,s){
  const r=await sb.from("attendance").delete().eq("user_id",user.id).eq("class_date",d).eq("slot_id",s);if(r.error)throw r.error;attendance.delete(key(d,s));
}
function rows(filter=()=>true){return [...attendance.values()].filter(filter)}
function calc(subjectId=null,start=null,end=null){
  const rr=rows(x=>(!subjectId||x.subject_id===subjectId)&&(!start||x.class_date>=start)&&(!end||x.class_date<=end));
  const total=rr.reduce((a,x)=>a+(scheduled(x.class_date).find(s=>s.slotId===x.slot_id)?.weight||1),0);
  const present=rr.filter(x=>x.present).reduce((a,x)=>a+(scheduled(x.class_date).find(s=>s.slotId===x.slot_id)?.weight||1),0);
  return {total,present,pct:total?present/total*100:null};
}
function subjectAverage(start=null,end=null,type=null){
  const vals=SUBJECTS.filter(s=>!type||s.type===type).map(s=>calc(s.id,start,end).pct).filter(x=>x!==null);
  return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;
}
function neededToReach(x,target=settings.target){
  if(x.total<=0||x.pct===null)return null;
  if(x.pct>=target)return 0;
  return Math.ceil((target*x.total/100-x.present)/(1-target/100));
}
function overall(start=null,end=null){
  const subject=subjectAverage(start,end);
  const h=calc(null,start,end);
  return {subject,hours:h.pct};
}

function renderDashboard(){
  const o=overall(), target=settings.target;
  const p=o[settings.overallMode==="hours"?"hours":"subject"];
  const all=calc();
  document.getElementById("todayStrip").innerHTML=`<div class="today-card"><strong>${fmtDate(isoToday())}</strong> · ${scheduled(isoToday()).length} Batch B attendance block${scheduled(isoToday()).length===1?"":"s"} scheduled. <button class="ghost" id="quickMark">Open today's attendance →</button></div>`;
  document.getElementById("quickMark").onclick=()=>{selectedDate=isoToday();showPage("mark")};
  document.getElementById("overallCard").innerHTML=`<div class="overall"><div class="overall-grid"><div><div class="small">PRIMARY OVERALL · ${settings.overallMode==="subject"?"SUBJECT-EQUAL":"HOUR-WEIGHTED"}</div><div class="big">${p===null?"—":p.toFixed(1)+"%"}</div><div class="small">${p===null?"No attendance recorded yet":p>=target?"At or above target":`${(target-p).toFixed(1)} percentage points below ${target}%`}</div></div><div><div><strong>Subject-equal:</strong> ${o.subject===null?"—":o.subject.toFixed(1)+"%"}</div><div><strong>Hour-weighted:</strong> ${o.hours===null?"—":o.hours.toFixed(1)+"%"}</div><div><strong>Recorded:</strong> ${all.present.toFixed(1)} / ${all.total.toFixed(1)} hours</div><div class="progress"><span style="width:${Math.min(100,p||0)}%"></span></div></div></div></div>`;
  const subjects=SUBJECTS.filter(s=>!document.getElementById("typeFilter").value||s.type===document.getElementById("typeFilter").value);
  document.getElementById("subjectGrid").innerHTML=subjects.map(s=>{
    const x=calc(s.id),need=neededToReach(x),p=x.pct;return `<article class="subject-card"><h3>${esc(s.name)}</h3><div class="metric"><span class="percent ${p===null?"neutral":p>=target?"good":"bad"}">${p===null?"—":p.toFixed(1)+"%"}</span><span>${x.present.toFixed(1)}/${x.total.toFixed(1)} h</span></div><div class="mini-progress"><span style="width:${Math.min(100,p||0)}%"></span></div><div class="card-foot"><span>${s.type}</span><span>${p===null?"No records":need?`${need}h present needed`: `≥ ${target}%`}</span></div></article>`
  }).join("");
  document.getElementById("quickStats").innerHTML=[
    ["Theory",subjectAverage(null,null,"Theory")],["Practical",subjectAverage(null,null,"Practical")],["Interactive",subjectAverage(null,null,"Interactive")],["Subjects tracked",SUBJECTS.filter(s=>calc(s.id).total>0).length]
  ].map(x=>`<div class="quick"><span class="small muted">${x[0]}</span><strong>${typeof x[1]==="number"?(x[0]==="Subjects tracked"?x[1]:x[1].toFixed(1)+"%"):"—"}</strong></div>`).join("");
  renderTrend();
}
function renderTrend(){
  const labels=[],data=[];const end=new Date(),start=new Date();start.setDate(end.getDate()-29);
  for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){const s=d.toLocaleDateString("en-CA");labels.push(s.slice(5));data.push(subjectAverage(null,s))}
  if(chart)chart.destroy();chart=new Chart(document.getElementById("trendChart"),{type:"line",data:{labels,datasets:[{label:"Subject-equal attendance",data,borderWidth:2,tension:.3,spanGaps:true}]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{min:0,max:100}}}});
}
function renderMark(){
  document.getElementById("attendanceDate").value=selectedDate;
  const ex=exception(selectedDate), slots=scheduled(selectedDate);
  document.getElementById("dateBanner").innerHTML=ex?`${fmtDate(selectedDate)} · <span class="warning">No class: ${esc(ex.label)}</span>`:isSunday(selectedDate)?`${fmtDate(selectedDate)} · Sunday`: `${fmtDate(selectedDate)} · ${slots.length} Batch B attendance block${slots.length===1?"":"s"}`;
  document.getElementById("dailySchedule").innerHTML=slots.length?`<div class="att-list">${slots.map(s=>{const st=status(selectedDate,s.slotId);return `<div class="att-row"><div><strong>${esc(s.name)}</strong><div class="att-meta"><span class="time">${s.start}–${s.end}</span><span class="tag">${SUBJECT[s.subjectId].type} · ${s.weight.toFixed(1)}h</span></div></div><div class="att-controls"><label class="present-toggle"><input type="checkbox" data-p="${s.slotId}" ${st===true?"checked":""}> Present</label><button class="absent-btn" data-a="${s.slotId}">Absent</button></div></div>`}).join("")}</div>`:`<div class="panel"><strong>No tracked Batch B classes.</strong><p class="muted small">Sundays, holidays and exam/vacation dates are excluded.</p></div>`;
  document.querySelectorAll("[data-p]").forEach(x=>x.onchange=async()=>{const s=slots.find(z=>z.slotId===x.dataset.p);try{await saveEntry(selectedDate,s,x.checked);renderDashboard();toast(x.checked?"Present saved":"Absent saved")}catch(e){toast(e.message)}});
  document.querySelectorAll("[data-a]").forEach(x=>x.onclick=async()=>{const s=slots.find(z=>z.slotId===x.dataset.a);try{await saveEntry(selectedDate,s,false);renderMark();renderDashboard();toast("Absent saved")}catch(e){toast(e.message)}});
}
async function bulk(p){try{for(const s of scheduled(selectedDate))await saveEntry(selectedDate,s,p);renderMark();renderDashboard();toast(p?"All present":"All absent")}catch(e){toast(e.message)}}
async function clearDay(){try{for(const s of scheduled(selectedDate))await clearEntry(selectedDate,s.slotId);renderMark();renderDashboard();toast("Day cleared")}catch(e){toast(e.message)}}

function renderCalendar(){
  document.getElementById("calendarMonth").value=calendarMonth;
  const [y,m]=calendarMonth.split("-").map(Number), first=new Date(y,m-1,1), days=new Date(y,m,0).getDate(), lead=first.getDay();
  let html=DAY.map(d=>`<div class="dow">${d.slice(0,3)}</div>`).join("");
  for(let i=0;i<lead;i++)html+=`<div class="day muted-day"></div>`;
  for(let d=1;d<=days;d++){
    const date=`${calendarMonth}-${String(d).padStart(2,"0")}`, slots=scheduled(date), rr=slots.map(s=>status(date,s.slotId)).filter(x=>x!==null), present=rr.filter(Boolean).length;
    const cls=rr.length?present===rr.length?"good-day":present===0?"bad-day":"":"";
    html+=`<div class="day ${cls}" data-day="${date}"><div class="day-num">${d}</div>${slots.length?`<div class="day-summary">${present}/${rr.length||slots.length} marked<br>${rr.length<slots.length?"Unmarked":present===rr.length?"All present":"Some absent"}</div>`:`<div class="day-summary muted">${exception(date)?.label||"No tracked classes"}</div>`}</div>`;
  }
  document.getElementById("monthCalendar").innerHTML=html;
  document.querySelectorAll("[data-day]").forEach(x=>x.onclick=()=>{selectedDate=x.dataset.day;showPage("mark")});
  document.getElementById("calendarLegend").innerHTML=`<span><i class="dot" style="background:var(--good)"></i>All marked present</span><span><i class="dot" style="background:var(--bad)"></i>All marked absent</span><span><i class="dot" style="background:var(--primary)"></i>Mixed / unmarked</span>`;
}

function renderSessions(){
  document.getElementById("sessionCards").innerHTML=settings.sessions.map(s=>{
    const o=overall(s.start,s.end), p=o[settings.overallMode==="hours"?"hours":"subject"], target=settings.target;
    const subs=SUBJECTS.map(sub=>({sub,x:calc(sub.id,s.start,s.end)})).filter(z=>z.x.total);
    return `<article class="session-card"><h3>${esc(s.label)}</h3><div class="small muted">${s.start} → ${s.end}</div><div class="session-head"><strong class="${p!==null&&p>=target?"good":"warning"}">${p===null?"No records":p.toFixed(1)+"%"}</strong><span>${o.hours===null?"":o.hours.toFixed(1)+"% weighted"}</span></div><div class="mini-progress"><span style="width:${Math.min(100,p||0)}%"></span></div>${subs.map(z=>`<div class="session-subject"><span>${esc(z.sub.name)}</span><strong class="${z.x.pct>=target?"good":"warning"}">${z.x.pct.toFixed(1)}%</strong></div>`).join("")||`<p class="small muted">No attendance recorded in this interval.</p>`}</article>`
  }).join("");
}

function futureStats(subjectId){
  const out={total:0,present:0};const today=isoToday();
  const final=settings.sessions.at(-1).end;
  const d=new Date(today+"T00:00:00");d.setDate(d.getDate()+1);
  while(d.toISOString().slice(0,10)<=final){const ds=d.toISOString().slice(0,10);for(const s of scheduled(ds)){if(s.subjectId===subjectId)out.total+=s.weight}d.setDate(d.getDate()+1)}
  return out;
}
function renderCalculators(){
  const options=`<option value="">Choose a subject</option>`+SUBJECTS.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("");
  document.getElementById("calcSubject").innerHTML=options;document.getElementById("mustSubject").innerHTML=options;
  updateBunk();updateMust();renderProjection();
}
function updateBunk(){
  const id=document.getElementById("calcSubject").value,x=calc(id),r=document.getElementById("bunkResult");
  if(!id){r.innerHTML="Select a subject.";return} if(x.pct===null){r.innerHTML="No attendance recorded for this subject yet.";return}
  const target=settings.target;
  if(x.pct<target){const need=neededToReach(x);r.innerHTML=`Current: <strong>${x.pct.toFixed(1)}%</strong>. You are below ${target}%. You need <strong>${need} hours</strong> of future attendance with no further absence to reach the target.`;return}
  const can=Math.floor((x.present-target*x.total/100)/(target/100));r.innerHTML=`Current: <strong>${x.pct.toFixed(1)}%</strong>. At the current balance, you can miss approximately <strong>${can} scheduled hours</strong> and remain at or above ${target}%. This is a mathematical estimate, not a guarantee of what your college will accept.`
}
function updateMust(){
  const id=document.getElementById("mustSubject").value,n=Math.max(0,Number(document.getElementById("futureClasses").value)||0),r=document.getElementById("mustResult");
  if(!id){r.innerHTML="Select a subject.";return}const x=calc(id),target=settings.target,future=n; if(x.pct===null){r.innerHTML="No current attendance recorded.";return}
  const required=Math.max(0,Math.ceil((target/100*(x.total+future)-x.present)));r.innerHTML=`If the next <strong>${future}</strong> scheduled hours are treated as one-hour units, you need to attend <strong>${required}</strong> of them to finish that window at ${target}%. For exact timetable-weighted planning, use the projection below.`
}
function renderProjection(){
  document.getElementById("projectionTable").innerHTML=`<table><thead><tr><th>Subject</th><th>Current</th><th>Remaining hours</th><th>Projected if all attended</th><th>Extra hours needed now</th></tr></thead><tbody>${SUBJECTS.map(s=>{const x=calc(s.id),f=futureStats(s.id),proj=x.total+f.total?((x.present+f.total)/(x.total+f.total)*100):null,need=neededToReach(x);return `<tr><td>${esc(s.name)}</td><td>${x.pct===null?"—":x.pct.toFixed(1)+"%"}</td><td>${f.total.toFixed(1)}</td><td>${proj===null?"—":proj.toFixed(1)+"%"}</td><td>${need===null?"—":need+"h"}</td></tr>`}).join("")}</tbody></table>`;
}
function renderHistory(){
  const id=document.getElementById("historySubject").value,st=document.getElementById("historyStatus").value;
  const rr=rows(x=>(!id||x.subject_id===id)&&(!st||(st==="present"?x.present:!x.present))).sort((a,b)=>b.class_date.localeCompare(a.class_date));
  document.getElementById("historyTable").innerHTML=`<table><thead><tr><th>Date</th><th>Time</th><th>Subject</th><th>Type</th><th>Status</th><th>Edit</th></tr></thead><tbody>${rr.map(x=>{const s=scheduled(x.class_date).find(z=>z.slotId===x.slot_id);return `<tr><td>${x.class_date}</td><td>${s?s.start+"–"+s.end:"—"}</td><td>${esc(SUBJECT[x.subject_id]?.name||x.subject_id)}</td><td>${SUBJECT[x.subject_id]?.type||""}</td><td class="${x.present?"good":"warning"}">${x.present?"Present":"Absent"}</td><td><button class="ghost" data-edit="${x.class_date}">Open</button></td></tr>`}).join("")||`<tr><td colspan="6" class="muted">No saved records.</td></tr>`}</tbody></table>`;
  document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>{selectedDate=b.dataset.edit;showPage("mark")});
}
function renderSettings(){
  document.getElementById("targetInput").value=settings.target;document.getElementById("overallMode").value=settings.overallMode;document.getElementById("reminderEnabled").checked=settings.reminderEnabled;document.getElementById("reminderTime").value=settings.reminderTime;document.getElementById("darkMode").checked=settings.darkMode;
  document.getElementById("sessionSettings").innerHTML=settings.sessions.map((s,i)=>`<div class="panel" style="box-shadow:none;margin:8px 0;padding:12px"><strong>${esc(s.label)}</strong><div class="inline-form"><input data-ss="${i}" type="date" value="${s.start}"><input data-se="${i}" type="date" value="${s.end}"><span></span></div></div>`).join("");
  const ex=settings.exceptions.slice().sort((a,b)=>a.date.localeCompare(b.date));document.getElementById("exceptionList").innerHTML=ex.map(x=>`<div class="exception-item"><span><strong>${x.date}</strong> · ${esc(x.label)}</span><button class="ghost" data-rm="${x.date}">Remove</button></div>`).join("");
  document.querySelectorAll("[data-rm]").forEach(b=>b.onclick=async()=>{settings.exceptions=settings.exceptions.filter(x=>x.date!==b.dataset.rm);await saveSettings();renderSettings();renderCalendar();toast("Removed")});
  document.getElementById("timetableTable").innerHTML=`<table><thead><tr><th>Day</th><th>Time</th><th>Batch B activity</th><th>Type</th><th>Hours</th></tr></thead><tbody>${Object.entries(SCHEDULE).flatMap(([d,a])=>a.map(x=>`<tr><td>${DAY[d]}</td><td>${x[0]}–${x[1]}</td><td>${esc(x[3])}</td><td>${SUBJECT[x[2]].type}</td><td>${weight({start:x[0],end:x[1]}).toFixed(1)}</td></tr>`)).join("")}</tbody></table>`;
}
function applySettings(){document.body.classList.toggle("dark",settings.darkMode)}
async function exportRows(){
  return rows().sort((a,b)=>a.class_date.localeCompare(b.class_date)).map(x=>{const s=scheduled(x.class_date).find(z=>z.slotId===x.slot_id);return {Date:x.class_date,Day:DAY[new Date(x.class_date+"T00:00:00").getDay()],Start:s?.start||"",End:s?.end||"",Subject:SUBJECT[x.subject_id]?.name||x.subject_id,Type:SUBJECT[x.subject_id]?.type||"",Hours:s?.weight||1,Status:x.present?"Present":"Absent"}})
}
function downloadBlob(name,blob){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
async function doXlsx(){const data=await exportRows();const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(data),"Attendance");XLSX.writeFile(wb,"BDS-II-Batch-B-Attendance.xlsx")}
async function doCsv(){const data=await exportRows();const ws=XLSX.utils.json_to_sheet(data);const csv=XLSX.utils.sheet_to_csv(ws);downloadBlob("BDS-II-Batch-B-Attendance.csv",new Blob([csv],{type:"text/csv;charset=utf-8"}))}
async function doJson(){const payload={version:3,exportedAt:new Date().toISOString(),settings,attendance:[...attendance.values()]};downloadBlob("BDS-II-Batch-B-Backup.json",new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}))}
async function doPdf(){
  const {jsPDF}=window.jspdf;const doc=new jsPDF();const o=overall();doc.setFontSize(18);doc.text("DPU BDS II — Batch B Attendance Report",14,18);doc.setFontSize(10);doc.text(`Generated ${new Date().toLocaleString("en-IN")}`,14,25);doc.text(`Overall (${settings.overallMode}): ${o[settings.overallMode==="hours"?"hours":"subject"]?.toFixed(1)||"—"}% · Target ${settings.target}%`,14,32);
  doc.autoTable({startY:39,head:[["Subject","Type","Present h","Total h","Attendance"]],body:SUBJECTS.map(s=>{const x=calc(s.id);return [s.name,s.type,x.present.toFixed(1),x.total.toFixed(1),x.pct===null?"—":x.pct.toFixed(1)+"%"]})});
  let y=doc.lastAutoTable.finalY+10;doc.text("Sessional intervals",14,y);y+=5;
  doc.autoTable({startY:y,head:[["Interval","Subject avg","Hour weighted"]],body:settings.sessions.map(s=>{const o=overall(s.start,s.end);return [s.label,o.subject===null?"—":o.subject.toFixed(1)+"%",o.hours===null?"—":o.hours.toFixed(1)+"%"]})});
  doc.save("BDS-II-Batch-B-Attendance-Report.pdf")
}
async function importBackup(file){
  const data=JSON.parse(await file.text());if(!data||!Array.isArray(data.attendance))throw Error("Invalid backup");
  settings={...settings,...(data.settings||{})};await saveSettings();
  for(const x of data.attendance)await sb.from("attendance").upsert({...x,user_id:user.id,id:undefined},{onConflict:"user_id,class_date,slot_id"});
  await load();renderDashboard();toast("Backup restored")
}
async function reminderTick(){
  if(!settings.reminderEnabled||Notification.permission!=="granted")return;
  const now=new Date(), hh=String(now.getHours()).padStart(2,"0"),mm=String(now.getMinutes()).padStart(2,"0");
  if(`${hh}:${mm}`!==settings.reminderTime)return;
  const today=scheduled(isoToday()), unmarked=today.filter(s=>status(isoToday(),s.slotId)===null);
  const stamp=`reminded-${isoToday()}`;if(unmarked.length&&!localStorage.getItem(stamp)){new Notification("BDS attendance reminder",{body:`You have ${unmarked.length} unmarked Batch B class${unmarked.length===1?"":"es"} today.`});localStorage.setItem(stamp,"1")}
}
async function init(){
  await load();
  document.getElementById("historySubject").innerHTML=`<option value="">All subjects</option>`+SUBJECTS.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("");
  document.getElementById("calcSubject").innerHTML=`<option value="">Choose a subject</option>`+SUBJECTS.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("");
  document.getElementById("mustSubject").innerHTML=document.getElementById("calcSubject").innerHTML;
  selectedDate=isoToday();showPage("dashboard");
  setInterval(reminderTick,30000);reminderTick();
}

document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
document.getElementById("attendanceDate").onchange=e=>{selectedDate=e.target.value;renderMark()};
document.getElementById("todayBtn").onclick=()=>{selectedDate=isoToday();showPage("mark")};
document.getElementById("allPresent").onclick=()=>bulk(true);document.getElementById("allAbsent").onclick=()=>bulk(false);document.getElementById("clearDay").onclick=clearDay;
document.getElementById("typeFilter").onchange=renderDashboard;
document.getElementById("calendarMonth").onchange=e=>{calendarMonth=e.target.value;renderCalendar()};
document.getElementById("prevMonth").onclick=()=>{const d=new Date(calendarMonth+"-01T00:00:00");d.setMonth(d.getMonth()-1);calendarMonth=d.toISOString().slice(0,7);renderCalendar()};
document.getElementById("nextMonth").onclick=()=>{const d=new Date(calendarMonth+"-01T00:00:00");d.setMonth(d.getMonth()+1);calendarMonth=d.toISOString().slice(0,7);renderCalendar()};
document.getElementById("historySubject").onchange=renderHistory;document.getElementById("historyStatus").onchange=renderHistory;
document.getElementById("calcSubject").onchange=updateBunk;document.getElementById("mustSubject").onchange=updateMust;document.getElementById("futureClasses").oninput=updateMust;
document.getElementById("exportXlsx").onclick=doXlsx;document.getElementById("exportCsv").onclick=doCsv;document.getElementById("exportJson").onclick=doJson;document.getElementById("exportPdf").onclick=doPdf;
document.getElementById("importJson").onchange=e=>e.target.files[0]&&importBackup(e.target.files[0]).catch(err=>toast(err.message));

document.getElementById("saveGeneral").onclick=async()=>{settings.target=Number(document.getElementById("targetInput").value)||86;settings.overallMode=document.getElementById("overallMode").value;settings.reminderEnabled=document.getElementById("reminderEnabled").checked;settings.reminderTime=document.getElementById("reminderTime").value;await saveSettings();applySettings();renderDashboard();renderSessions();toast("Settings saved")};
document.getElementById("enableNotifications").onclick=async()=>{if(!("Notification"in window))return toast("Notifications are not supported in this browser");const p=await Notification.requestPermission();toast(p==="granted"?"Notifications enabled":"Notifications not enabled")};
document.getElementById("darkMode").onchange=async e=>{settings.darkMode=e.target.checked;applySettings();await saveSettings()};
document.getElementById("saveSessions").onclick=async()=>{settings.sessions=settings.sessions.map((s,i)=>({...s,start:document.querySelector(`[data-ss="${i}"]`).value,end:document.querySelector(`[data-se="${i}"]`).value}));await saveSettings();renderSessions();renderProjection();toast("Sessional dates saved")};
document.getElementById("addException").onclick=async()=>{const d=document.getElementById("exceptionDate").value,l=document.getElementById("exceptionLabel").value.trim()||"No class";if(!d)return toast("Choose a date");if(!settings.exceptions.some(x=>x.date===d))settings.exceptions.push({date:d,label:l});await saveSettings();renderSettings();renderCalendar();toast("No-class date added")};
document.getElementById("resetDemo").onclick=async()=>{if(!confirm("Delete ALL your saved attendance? This cannot be undone."))return;const r=await sb.from("attendance").delete().eq("user_id",user.id);if(r.error)toast(r.error.message);else{attendance.clear();renderDashboard();toast("Attendance deleted")}};

document.querySelectorAll("[data-auth]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-auth]").forEach(x=>x.classList.toggle("active",x===b));document.getElementById("authSubmit").textContent=b.dataset.auth==="login"?"Login":"Create account";document.getElementById("authForm").dataset.mode=b.dataset.auth});
document.getElementById("authForm").dataset.mode="login";
document.getElementById("authForm").onsubmit=async e=>{e.preventDefault();const email=document.getElementById("email").value.trim(),password=document.getElementById("password").value,mode=e.currentTarget.dataset.mode,msg=document.getElementById("authMsg");msg.textContent="Working…";try{if(mode==="login"){const r=await sb.auth.signInWithPassword({email,password});if(r.error)throw r.error}else{const r=await sb.auth.signUp({email,password});if(r.error)throw r.error;msg.textContent=r.data.session?"Account created.":"Account created. Check your email if confirmation is enabled."}}catch(err){msg.textContent=err.message}};

window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;document.getElementById("installBtn").classList.remove("hidden")});
document.getElementById("installBtn").onclick=async()=>{if(!deferredInstall)return;deferredInstall.prompt();deferredInstall=null};
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));

sb.auth.onAuthStateChange(async(_event,session)=>{user=session?.user||null;document.getElementById("authView").classList.toggle("hidden",!!user);document.getElementById("appView").classList.toggle("hidden",!user);if(user){try{await init()}catch(e){console.error(e);toast(e.message)}}});
