"use client";
import { useState } from "react";

/* ══════════════════════════════════════════════════════════
   CSS
══════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}

:root{
  --bg:#f4f1ec;--bg2:#ece7df;--sur:#fff;--sur2:#f8f5f0;
  --bor:#e6dfd5;--bor2:#cfc7b8;
  --txt:#1a1510;--mu:#8c8070;--mu2:#b5a898;
  --acc:#a8721e;--acc-bg:#fdf0d8;--acc-lt:#e5c06a;
  --gr:#257a50;--gr-bg:#e8f5ee;--gr-lt:#a8d8bc;
  --re:#b83224;--re-bg:#fcecea;--re-lt:#f0a89e;
  --bl:#2450a8;--bl-bg:#eaf0fc;--bl-lt:#a8c0f0;
  --pu:#6030b0;--pu-bg:#f0eafa;--pu-lt:#c0a0e8;
  --am:#b06010;--am-bg:#fef2e4;--am-lt:#edb87a;
  --te:#157068;--te-bg:#e6f6f4;--te-lt:#90d0ca;
  --pk:#982050;--pk-bg:#faedf3;--pk-lt:#e899bc;
  --r:14px;--r2:20px;
  --sh:0 1px 3px rgba(0,0,0,.06),0 0 0 1px rgba(0,0,0,.04);
  --sh2:0 4px 16px rgba(0,0,0,.09),0 1px 3px rgba(0,0,0,.05);
  --sh3:0 12px 40px rgba(0,0,0,.13),0 2px 8px rgba(0,0,0,.06);
}

body{font-family:'Cairo',sans-serif;background:var(--bg);color:var(--txt);direction:rtl;min-height:100vh;-webkit-font-smoothing:antialiased}

/* scrollbar */
::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-thumb{background:var(--bor2);border-radius:3px}

/* ── animations ── */
@keyframes up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fi{from{opacity:0}to{opacity:1}}
@keyframes si{from{opacity:0;transform:scale(.94) translateY(6px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes gb{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes sd{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
@keyframes bk{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.65)}}

.u0{animation:up .4s cubic-bezier(.22,.68,0,1.2) both}
.u1{animation:up .4s .06s cubic-bezier(.22,.68,0,1.2) both}
.u2{animation:up .4s .12s cubic-bezier(.22,.68,0,1.2) both}
.u3{animation:up .4s .18s cubic-bezier(.22,.68,0,1.2) both}

/* ── base components ── */
.card{background:var(--sur);border:1px solid var(--bor);border-radius:var(--r2);box-shadow:var(--sh);transition:box-shadow .2s,transform .2s,border-color .2s}
.card:hover{box-shadow:var(--sh2);border-color:var(--bor2);transform:translateY(-1px)}

.row{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:var(--r);border:1px solid transparent;transition:background .14s,border-color .14s;cursor:default}
.row:hover{background:var(--sur2);border-color:var(--bor)}

.chip{display:inline-flex;align-items:center;gap:3px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:700;font-family:'Cairo',sans-serif;white-space:nowrap}

.ibox{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 18px;border-radius:12px;font-family:'Cairo',sans-serif;font-size:13px;font-weight:700;cursor:pointer;border:none;transition:all .17s;white-space:nowrap}
.ba{background:var(--acc);color:#fff}
.ba:hover{background:#8f6018;transform:translateY(-1px);box-shadow:0 5px 16px rgba(168,114,30,.28)}
.bg{background:var(--sur2);color:var(--txt);border:1px solid var(--bor)}
.bg:hover{background:var(--bg2);border-color:var(--bor2)}
.bsm{padding:6px 14px;font-size:12px;border-radius:10px}

.inp,.sel{width:100%;padding:10px 13px;background:var(--sur2);border:1.5px solid var(--bor);border-radius:var(--r);color:var(--txt);font-family:'Cairo',sans-serif;font-size:14px;outline:none;transition:border-color .18s,box-shadow .18s}
.inp:focus,.sel:focus{border-color:var(--acc);box-shadow:0 0 0 3px rgba(168,114,30,.1)}
.inp::placeholder{color:var(--mu2)}
.sel{cursor:pointer;direction:rtl}

/* ── modal ── */
.ov{position:fixed;inset:0;z-index:200;background:rgba(26,21,16,.4);backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;padding:0;animation:fi .18s both}
@media(min-width:600px){.ov{align-items:center;padding:20px}}
.mb{background:var(--sur);width:100%;max-width:460px;max-height:92vh;overflow-y:auto;border-radius:24px 24px 0 0;padding:24px 20px 32px;box-shadow:var(--sh3);animation:si .26s cubic-bezier(.22,.68,0,1.2) both}
@media(min-width:600px){.mb{border-radius:24px;padding:26px}}
.mh{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
.mc{background:var(--bg2);border:1px solid var(--bor);color:var(--mu);width:30px;height:30px;border-radius:8px;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;transition:background .14s}
.mc:hover{background:var(--bg)}

/* ── progress ── */
.pt{height:6px;background:var(--bg2);border-radius:10px;overflow:hidden}
.pf{height:100%;border-radius:10px;transform-origin:right;animation:gb .8s .2s cubic-bezier(.34,1.2,.64,1) both}

/* ── header ── */
.hdr{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.88);backdrop-filter:blur(20px) saturate(1.5);border-bottom:1px solid var(--bor);height:56px;padding:0 16px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 1px 0 var(--bor),0 2px 10px rgba(0,0,0,.04)}

/* ── tab bar ── */
.tbar{display:flex;gap:3px;padding:4px;background:var(--sur);border:1px solid var(--bor);border-radius:16px;overflow-x:auto;scrollbar-width:none;box-shadow:var(--sh);-webkit-overflow-scrolling:touch}
.tbar::-webkit-scrollbar{display:none}
.tbtn{flex-shrink:0;display:flex;align-items:center;gap:5px;padding:7px 13px;border-radius:11px;font-family:'Cairo',sans-serif;font-size:12.5px;font-weight:600;color:var(--mu);border:none;background:transparent;cursor:pointer;transition:all .17s;white-space:nowrap;-webkit-tap-highlight-color:transparent}
.tbtn:hover{color:var(--txt);background:var(--bg2)}
.tbtn.on{color:#fff;font-weight:700}

/* ── dropdown ── */
.drop{position:absolute;top:calc(100% + 8px);left:50%;transform:translateX(-50%);background:var(--sur);border:1px solid var(--bor2);border-radius:18px;box-shadow:var(--sh3);padding:8px;min-width:250px;z-index:300;animation:sd .18s cubic-bezier(.22,.68,0,1.2) both}
.di{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:11px;cursor:pointer;transition:background .13s;font-family:'Cairo',sans-serif;font-size:13px;font-weight:600;border:none;background:transparent;width:100%;text-align:right;color:var(--txt);-webkit-tap-highlight-color:transparent}
.di:hover{background:var(--sur2)}

/* ── slabel ── */
.sl{font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--mu2);font-family:'DM Mono',monospace}

/* ── notif dot ── */
.nd{position:absolute;top:-2px;right:-2px;width:8px;height:8px;border-radius:50%;background:var(--re);border:2px solid #fff;animation:bk 1.6s infinite}

/* ── tooltip ── */
.tt{position:relative;display:inline-flex}
.tt .tip{position:absolute;bottom:calc(100%+5px);left:50%;transform:translateX(-50%);background:var(--txt);color:#fff;font-size:11px;white-space:nowrap;padding:4px 9px;border-radius:7px;opacity:0;pointer-events:none;transition:opacity .14s;font-family:'Cairo',sans-serif;z-index:10}
.tt:hover .tip{opacity:1}

/* ── jam grid ── */
.jg{display:grid;grid-template-columns:repeat(auto-fill,minmax(30px,1fr));gap:4px}
.jc{aspect-ratio:1;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:10px;font-family:'DM Mono',monospace;font-weight:600;transition:transform .14s;cursor:default}
.jc:hover{transform:scale(1.15)}

/* ── donut ── */
.dw{position:relative;display:inline-flex;align-items:center;justify-content:center}
.dc{position:absolute;text-align:center}

/* ── section header inside card ── */
.sh2{display:flex;align-items:center;gap:9px;padding-bottom:14px;margin-bottom:16px;border-bottom:1.5px solid var(--bor)}

/* ── main ── */
.main{max-width:900px;margin:0 auto;padding:18px 14px 90px}
@media(min-width:700px){.main{padding:26px 22px 90px}}

/* ── stat grid ── */
.sgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
@media(min-width:600px){.sgrid{grid-template-columns:repeat(3,1fr)}}
@media(min-width:900px){.sgrid{grid-template-columns:repeat(5,1fr)}}

/* ── scard ── */
.sc{background:var(--sur);border:1px solid var(--bor);border-radius:18px;box-shadow:var(--sh);padding:16px 16px 14px;position:relative;overflow:hidden;transition:box-shadow .2s,transform .2s,border-color .2s;cursor:default}
.sc:hover{box-shadow:var(--sh2);border-color:var(--bor2);transform:translateY(-2px)}
.sc .be{position:absolute;left:-4px;bottom:-8px;font-size:64px;opacity:.055;user-select:none;pointer-events:none}

/* ── month nav ── */
.mnav{display:flex;align-items:center;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px;-webkit-overflow-scrolling:touch}
.mnav::-webkit-scrollbar{display:none}
.mbtn{flex-shrink:0;padding:7px 14px;border-radius:20px;font-family:'Cairo',sans-serif;font-size:12.5px;font-weight:600;border:none;cursor:pointer;transition:all .16s;-webkit-tap-highlight-color:transparent}

/* ── search bar ── */
.sb{display:flex;align-items:center;gap:7px;background:var(--sur2);border:1.5px solid var(--bor);border-radius:11px;padding:0 12px;transition:border-color .18s}
.sb:focus-within{border-color:var(--acc)}
.sb input{background:none;border:none;outline:none;color:var(--txt);font-family:'Cairo',sans-serif;font-size:13px;padding:7px 0;width:150px}
.sb input::placeholder{color:var(--mu2)}

/* ── hide on mobile ── */
.hm{display:none}
@media(min-width:640px){.hm{display:flex}}

/* ── fab ── */
.fab{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:50;display:flex;gap:8px}
@media(min-width:640px){.fab{display:none}}
`;

/* ══════════════════════════════════════════════════════════
   DATA
══════════════════════════════════════════════════════════ */
const MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

const MONTH_DATA = {
  "يناير":  {income:18500, expenses:6900,  incomeList:[{id:1,source:"مرتب",amount:18500,date:"01 يناير",recurring:true,type:"salary"}], expensesList:[{id:1,category:"أكل وشرب",amount:2100,date:"05 يناير",method:"كاش",place:"سوبرماركت"},{id:2,category:"مواصلات",amount:700,date:"08 يناير",method:"فيزا",place:"أوبر"},{id:3,category:"فواتير",amount:950,date:"10 يناير",method:"تحويل",place:"كهربا ونت"},{id:4,category:"إيجار/سكن",amount:2200,date:"01 يناير",method:"تحويل",place:"إيجار"},{id:5,category:"مشتريات",amount:950,date:"20 يناير",method:"فيزا",place:"مول"}]},
  "فبراير": {income:19200, expenses:7400,  incomeList:[{id:1,source:"مرتب",amount:18000,date:"01 فبراير",recurring:true,type:"salary"},{id:2,source:"عمولة",amount:1200,date:"15 فبراير",recurring:false,type:"freelance"}], expensesList:[{id:1,category:"أكل وشرب",amount:2300,date:"05 فبراير",method:"كاش",place:"سوبرماركت"},{id:2,category:"مواصلات",amount:850,date:"07 فبراير",method:"فيزا",place:"أوبر"},{id:3,category:"فواتير",amount:950,date:"10 فبراير",method:"تحويل",place:"كهربا ونت"},{id:4,category:"صحة",amount:600,date:"14 فبراير",method:"كاش",place:"دكتور"},{id:5,category:"ترفيه",amount:800,date:"20 فبراير",method:"فيزا",place:"مطعم"},{id:6,category:"مشتريات",amount:900,date:"25 فبراير",method:"فيزا",place:"موقع"}]},
  "مارس":   {income:22000, expenses:7750,  incomeList:[{id:1,source:"مرتب أساسي",amount:18000,date:"01 مارس",recurring:true,type:"salary"},{id:2,source:"شغل حر",amount:3000,date:"10 مارس",recurring:false,type:"freelance"},{id:3,source:"مكافأة",amount:1000,date:"15 مارس",recurring:false,type:"bonus"}], expensesList:[{id:1,category:"أكل وشرب",amount:2200,date:"05 مارس",method:"كاش",place:"سوبرماركت"},{id:2,category:"مواصلات",amount:800,date:"06 مارس",method:"فيزا",place:"أوبر"},{id:3,category:"فواتير",amount:950,date:"07 مارس",method:"تحويل",place:"كهربا ونت"},{id:4,category:"صحة",amount:400,date:"12 مارس",method:"كاش",place:"صيدلية"},{id:5,category:"ترفيه",amount:600,date:"14 مارس",method:"فيزا",place:"سينما"},{id:6,category:"مشتريات",amount:1800,date:"18 مارس",method:"فيزا",place:"مول"},{id:7,category:"تعليم",amount:1000,date:"20 مارس",method:"تحويل",place:"دروس"}]},
  "أبريل":  {income:18000, expenses:6200,  incomeList:[{id:1,source:"مرتب",amount:18000,date:"01 أبريل",recurring:true,type:"salary"}], expensesList:[{id:1,category:"أكل وشرب",amount:1900,date:"05 أبريل",method:"كاش",place:"سوبرماركت"},{id:2,category:"مواصلات",amount:700,date:"06 أبريل",method:"فيزا",place:"أوبر"},{id:3,category:"فواتير",amount:950,date:"07 أبريل",method:"تحويل",place:"فواتير"},{id:4,category:"مشتريات",amount:1300,date:"15 أبريل",method:"فيزا",place:"مشتريات"},{id:5,category:"ترفيه",amount:550,date:"22 أبريل",method:"كاش",place:"نزهة"},{id:6,category:"تعليم",amount:800,date:"25 أبريل",method:"تحويل",place:"دروس"}]},
  "مايو":   {income:20500, expenses:8100,  incomeList:[{id:1,source:"مرتب",amount:18000,date:"01 مايو",recurring:true,type:"salary"},{id:2,source:"مشروع",amount:2500,date:"20 مايو",recurring:false,type:"freelance"}], expensesList:[{id:1,category:"أكل وشرب",amount:2400,date:"05 مايو",method:"كاش",place:"سوبرماركت"},{id:2,category:"مواصلات",amount:900,date:"08 مايو",method:"فيزا",place:"أوبر"},{id:3,category:"فواتير",amount:950,date:"10 مايو",method:"تحويل",place:"كهربا"},{id:4,category:"ترفيه",amount:1200,date:"18 مايو",method:"فيزا",place:"رحلة"},{id:5,category:"مشتريات",amount:1650,date:"24 مايو",method:"فيزا",place:"مشتريات"},{id:6,category:"صحة",amount:1000,date:"28 مايو",method:"كاش",place:"طبيب"}]},
  "يونيو":  {income:18000, expenses:7000,  incomeList:[{id:1,source:"مرتب",amount:18000,date:"01 يونيو",recurring:true,type:"salary"}], expensesList:[{id:1,category:"أكل وشرب",amount:2100,date:"05 يونيو",method:"كاش",place:"سوبرماركت"},{id:2,category:"مواصلات",amount:800,date:"07 يونيو",method:"فيزا",place:"أوبر"},{id:3,category:"فواتير",amount:950,date:"10 يونيو",method:"تحويل",place:"فواتير"},{id:4,category:"مشتريات",amount:1500,date:"20 يونيو",method:"فيزا",place:"مشتريات"},{id:5,category:"ترفيه",amount:700,date:"25 يونيو",method:"كاش",place:"ترفيه"},{id:6,category:"تعليم",amount:950,date:"28 يونيو",method:"تحويل",place:"دروس"}]},
};

const BASE = MONTH_DATA["مارس"];

const SUBSCRIPTIONS = [
  {id:1,name:"Netflix",amount:89,renewal:"05 أبريل",daysLeft:3},
  {id:2,name:"انترنت منزلي",amount:350,renewal:"01 أبريل",daysLeft:27},
  {id:3,name:"جيم",amount:200,renewal:"10 أبريل",daysLeft:36},
  {id:4,name:"Spotify",amount:45,renewal:"08 أبريل",daysLeft:34},
  {id:5,name:"ChatGPT Plus",amount:150,renewal:"02 أبريل",daysLeft:28},
];

const COMMITMENTS = [
  {id:1,name:"إيجار شقة",amount:3500,dueDate:"01 أبريل",priority:"عالي",status:"مدفوع"},
  {id:2,name:"قسط موبايل",amount:450,dueDate:"10 أبريل",priority:"متوسط",status:"مستحق"},
  {id:3,name:"مصاريف مدرسة",amount:1200,dueDate:"05 أبريل",priority:"عالي",status:"مدفوع"},
  {id:4,name:"دين لصديق",amount:2000,dueDate:"20 أبريل",priority:"متوسط",status:"مستحق"},
];

const JAMIAT = [
  {id:1,name:"جمعية الشغل",monthlyPayment:2000,members:10,myTurn:3,totalAmount:20000,startDate:"يناير 2024",endDate:"أكتوبر 2024",paidMonths:3,received:true,color:"#257a50"},
  {id:2,name:"جمعية العيلة",monthlyPayment:1500,members:8,myTurn:7,totalAmount:12000,startDate:"فبراير 2024",endDate:"سبتمبر 2024",paidMonths:2,received:false,color:"#2450a8"},
  {id:3,name:"جمعية الأصدقاء",monthlyPayment:500,members:6,myTurn:5,totalAmount:3000,startDate:"يناير 2024",endDate:"يونيو 2024",paidMonths:3,received:false,color:"#6030b0"},
];

const SAVINGS = [
  {id:1,name:"صندوق طوارئ",target:30000,current:12000,deadline:"ديسمبر 2024",emoji:"🛡️"},
  {id:2,name:"رحلة إجازة",target:8000,current:3500,deadline:"أغسطس 2024",emoji:"✈️"},
  {id:3,name:"لاب توب جديد",target:15000,current:6000,deadline:"يونيو 2024",emoji:"💻"},
];

const ZAKAT = {required:1500,paid:1500,paidDate:"01 مارس",entity:"جمعية خيرية"};
const CHARITY = {monthlyGoal:500,paidThisMonth:320,payments:[{amount:200,date:"05 مارس",notes:"صدقة جارية"},{amount:120,date:"15 مارس",notes:"إفطار صائم"}]};

const NOTIFS = [
  {id:1,text:"Netflix بتتجدد بعد 3 أيام",type:"warn",time:"منذ ساعة"},
  {id:2,text:"تم استلام المرتب 18,000 جنيه",type:"ok",time:"منذ يومين"},
  {id:3,text:"تجاوزت 80% من ميزانية المشتريات",type:"alert",time:"منذ 3 أيام"},
];

const BUDGET_LIMITS = {"أكل وشرب":2500,"مواصلات":1000,"فواتير":1200,"مشتريات":2000,"ترفيه":800,"صحة":600,"تعليم":1500};

/* ══════════════════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════════════════ */
const N = v => new Intl.NumberFormat("ar-EG").format(Math.round(v||0));
const CE = {"أكل وشرب":"🍽️","مواصلات":"🚗","فواتير":"⚡","مشتريات":"🛍️","صحة":"💊","تعليم":"📚","ترفيه":"🎬","إيجار/سكن":"🏠","مصروفات أخرى":"📦"};
const PAL = ["#a8721e","#257a50","#2450a8","#6030b0","#b83224","#b06010","#157068","#982050"];

/* ══════════════════════════════════════════════════════════
   SHARED PRIMITIVES
══════════════════════════════════════════════════════════ */
function Prog({pct,color}){
  return<div className="pt"><div className="pf" style={{width:`${Math.min(pct||0,100)}%`,background:color||"var(--acc)"}}/></div>;
}

function Spark({vals,color,h=28}){
  if(!vals||vals.length<2) return null;
  const max=Math.max(...vals),min=Math.min(...vals),range=(max-min)||1,w=64;
  const pts=vals.map((v,i)=>`${(i/(vals.length-1))*w},${h-((v-min)/range)*h}`).join(" ");
  return(
    <svg width={w} height={h} style={{overflow:"visible",flexShrink:0}}>
      <polyline points={pts} fill="none" stroke={color||"var(--acc)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={w} cy={h-((vals[vals.length-1]-min)/range)*h} r="3" fill={color||"var(--acc)"}/>
    </svg>
  );
}

function Donut({slices,size=100,sw=12}){
  const r=(size-sw)/2,circ=2*Math.PI*r,cx=size/2,cy=size/2;
  let cum=0;const tot=slices.reduce((s,sl)=>s+sl.value,0)||1;
  return(
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg2)" strokeWidth={sw}/>
      {slices.map((sl,i)=>{
        const pct=sl.value/tot,dash=pct*circ,off=(1-cum)*circ;cum+=pct;
        return<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={sl.color} strokeWidth={sw}
          strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={off} strokeLinecap="round"
          style={{transition:"stroke-dasharray .8s ease"}}/>;
      })}
    </svg>
  );
}

function Modal({open,onClose,title,children}){
  if(!open) return null;
  return(
    <div className="ov" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
      <div className="mb">
        <div className="mh">
          <span style={{fontWeight:800,fontSize:16}}>{title}</span>
          <button className="mc" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FR({label,children}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      <label style={{fontSize:12,color:"var(--mu)",fontWeight:700}}>{label}</label>
      {children}
    </div>
  );
}

function SaveBtn({onClick,label="💾 حفظ"}){
  return<button className="btn ba" style={{marginTop:6,width:"100%",fontSize:14}} onClick={onClick}>{label}</button>;
}

/* ══════════════════════════════════════════════════════════
   MODAL FORMS  — trimmed to essentials only
══════════════════════════════════════════════════════════ */
function AddIncomeModal({open,onClose}){
  return(
    <Modal open={open} onClose={onClose} title="💵 إضافة دخل">
      <div style={{display:"flex",flexDirection:"column",gap:13}}>
        <FR label="المصدر"><input className="inp" placeholder="مرتب، عمولة، هدية…"/></FR>
        <FR label="المبلغ (جنيه)"><input className="inp" type="number" placeholder="0"/></FR>
        <FR label="النوع">
          <select className="sel"><option>مرتب</option><option>شغل حر</option><option>مكافأة</option><option>تحويل</option></select>
        </FR>
        <FR label="التاريخ"><input className="inp" type="date"/></FR>
        <SaveBtn onClick={onClose} label="💾 حفظ الدخل"/>
      </div>
    </Modal>
  );
}

function AddExpenseModal({open,onClose}){
  return(
    <Modal open={open} onClose={onClose} title="💸 إضافة مصروف">
      <div style={{display:"flex",flexDirection:"column",gap:13}}>
        <FR label="التصنيف">
          <select className="sel">{Object.keys(CE).map(c=><option key={c}>{c}</option>)}</select>
        </FR>
        <FR label="المبلغ (جنيه)"><input className="inp" type="number" placeholder="0"/></FR>
        <FR label="المكان"><input className="inp" placeholder="سوبرماركت، أوبر…"/></FR>
        <FR label="التاريخ"><input className="inp" type="date"/></FR>
        <SaveBtn onClick={onClose} label="💾 حفظ المصروف"/>
      </div>
    </Modal>
  );
}

function AddCommitModal({open,onClose}){
  return(
    <Modal open={open} onClose={onClose} title="📋 إضافة التزام">
      <div style={{display:"flex",flexDirection:"column",gap:13}}>
        <FR label="الاسم"><input className="inp" placeholder="إيجار، قسط، دين…"/></FR>
        <FR label="المبلغ (جنيه)"><input className="inp" type="number" placeholder="0"/></FR>
        <FR label="تاريخ الاستحقاق"><input className="inp" type="date"/></FR>
        <FR label="الأولوية"><select className="sel"><option>عالي</option><option>متوسط</option><option>منخفض</option></select></FR>
        <SaveBtn onClick={onClose} label="💾 حفظ"/>
      </div>
    </Modal>
  );
}

function AddSubModal({open,onClose}){
  return(
    <Modal open={open} onClose={onClose} title="🔄 اشتراك جديد">
      <div style={{display:"flex",flexDirection:"column",gap:13}}>
        <FR label="الاسم"><input className="inp" placeholder="Netflix، Spotify، جيم…"/></FR>
        <FR label="المبلغ الشهري (جنيه)"><input className="inp" type="number" placeholder="0"/></FR>
        <FR label="تاريخ التجديد"><input className="inp" type="date"/></FR>
        <SaveBtn onClick={onClose} label="💾 حفظ"/>
      </div>
    </Modal>
  );
}

function AddJamiaModal({open,onClose}){
  return(
    <Modal open={open} onClose={onClose} title="👥 جمعية جديدة">
      <div style={{display:"flex",flexDirection:"column",gap:13}}>
        <FR label="الاسم"><input className="inp" placeholder="جمعية الشغل…"/></FR>
        <FR label="القسط الشهري (جنيه)"><input className="inp" type="number" placeholder="2000"/></FR>
        <FR label="عدد الأشهر / الأعضاء"><input className="inp" type="number" placeholder="10"/></FR>
        <FR label="رقم دوري"><input className="inp" type="number" placeholder="3"/></FR>
        <FR label="تاريخ البداية"><input className="inp" type="date"/></FR>
        <SaveBtn onClick={onClose} label="💾 حفظ"/>
      </div>
    </Modal>
  );
}

function AddSavingModal({open,onClose}){
  return(
    <Modal open={open} onClose={onClose} title="🎯 هدف ادخار">
      <div style={{display:"flex",flexDirection:"column",gap:13}}>
        <FR label="الاسم"><input className="inp" placeholder="طوارئ، رحلة…"/></FR>
        <FR label="المبلغ المستهدف"><input className="inp" type="number" placeholder="10000"/></FR>
        <FR label="المبلغ الحالي"><input className="inp" type="number" placeholder="0"/></FR>
        <FR label="الموعد"><input className="inp" type="date"/></FR>
        <SaveBtn onClick={onClose} label="💾 حفظ"/>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   STAT CARDS
══════════════════════════════════════════════════════════ */
function StatCards({income,expenses,prevIncome,prevExpenses}){
  const net=income-expenses;
  const budget=10000;
  const bu=Math.round((expenses/budget)*100);
  const ic=Math.round(((income-(prevIncome||income))/((prevIncome||income)||1))*100);

  const cards=[
    {lbl:"الرصيد",val:N(income-expenses+14250-net),unit:"جنيه",e:"💰",c:"var(--acc)",bg:"var(--acc-bg)",spark:[11200,12400,10900,13200,income-expenses+14250-net],cls:"u0"},
    {lbl:"الدخل",val:N(income),unit:"جنيه",e:"📈",c:"var(--gr)",bg:"var(--gr-bg)",chg:ic,chgUp:true,spark:[15000,17000,prevIncome||19000,income],cls:"u1"},
    {lbl:"المصروف",val:N(expenses),unit:"جنيه",e:"📉",c:"var(--re)",bg:"var(--re-bg)",spark:[8500,7800,prevExpenses||8000,expenses],cls:"u2"},
    {lbl:"الصافي",val:(net>=0?"+":"")+N(net),unit:"جنيه",e:"⚖️",c:net>=0?"var(--te)":"var(--re)",bg:net>=0?"var(--te-bg)":"var(--re-bg)",cls:"u3"},
    {lbl:"الميزانية",val:`${bu}%`,unit:`متبقي ${N(budget-expenses)}`,e:"🎯",c:bu>80?"var(--re)":"var(--pu)",bg:bu>80?"var(--re-bg)":"var(--pu-bg)",prog:bu,cls:"u3"},
  ];

  return(
    <div className="sgrid">
      {cards.map((c,i)=>(
        <div key={i} className={`sc ${c.cls}`} style={{animationDelay:`${i*.05}s`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <div style={{width:36,height:36,borderRadius:10,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{c.e}</div>
            {c.chg!==undefined&&<span style={{fontSize:10.5,fontFamily:"DM Mono",fontWeight:700,padding:"2px 7px",borderRadius:20,background:c.chgUp?"var(--gr-bg)":"var(--re-bg)",color:c.chgUp?"var(--gr)":"var(--re)"}}>{c.chgUp?"▲":"▼"}{Math.abs(c.chg)}%</span>}
          </div>
          <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:6}}>
            <div>
              <div style={{fontFamily:"DM Mono",fontSize:22,fontWeight:500,color:c.c,letterSpacing:"-.5px",lineHeight:1}}>{c.val}</div>
              <div style={{fontSize:11,color:"var(--mu2)",marginTop:3,fontFamily:"DM Mono"}}>{c.unit}</div>
            </div>
            {c.spark&&<Spark vals={c.spark} color={c.c}/>}
          </div>
          <div style={{marginTop:10,fontSize:11.5,color:"var(--mu)",fontWeight:600}}>{c.lbl}</div>
          {c.prog!==undefined&&<div style={{marginTop:8}}><Prog pct={c.prog} color={c.c}/></div>}
          <div className="be">{c.e}</div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MONTH PREVIEW — bar chart + income vs expenses per month
══════════════════════════════════════════════════════════ */
function MonthPreview({selectedMonth,onSelectMonth}){
  const months=Object.keys(MONTH_DATA);
  const selData=MONTH_DATA[selectedMonth]||BASE;
  const net=selData.income-selData.expenses;

  const byCat=selData.expensesList.reduce((acc,e)=>{acc[e.category]=(acc[e.category]||0)+e.amount;return acc;},{});
  const sorted=Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
  const maxIncome=Math.max(...months.map(m=>MONTH_DATA[m].income));
  const maxExp=Math.max(...months.map(m=>MONTH_DATA[m].expenses));
  const maxBar=Math.max(maxIncome,maxExp);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Month selector */}
      <div className="mnav">
        {months.map(m=>{
          const on=m===selectedMonth;
          return(
            <button key={m} className="mbtn"
              onClick={()=>onSelectMonth(m)}
              style={{background:on?"var(--acc)":"var(--sur2)",color:on?"#fff":"var(--mu)",border:on?"none":"1px solid var(--bor)"}}>
              {m}
            </button>
          );
        })}
      </div>

      {/* Summary chips for selected month */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        {[{l:"الدخل",v:N(selData.income),c:"var(--gr)",bg:"var(--gr-bg)",bo:"var(--gr-lt)"},
          {l:"المصروف",v:N(selData.expenses),c:"var(--re)",bg:"var(--re-bg)",bo:"var(--re-lt)"},
          {l:"الصافي",v:(net>=0?"+":"")+N(net),c:net>=0?"var(--te)":"var(--re)",bg:net>=0?"var(--te-bg)":"var(--re-bg)",bo:net>=0?"var(--te-lt)":"var(--re-lt)"}
        ].map((s,i)=>(
          <div key={i} style={{background:s.bg,borderRadius:14,padding:"12px 14px",border:`1px solid ${s.bo}`,textAlign:"center"}}>
            <div className="sl" style={{marginBottom:5}}>{s.l}</div>
            <div style={{fontFamily:"DM Mono",fontSize:16,color:s.c,fontWeight:600}}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Bar chart — all months comparison */}
      <div className="card" style={{padding:18}}>
        <div style={{fontWeight:700,fontSize:13.5,marginBottom:16}}>📊 مقارنة شهرية</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:6,height:90}}>
          {months.map((m,i)=>{
            const md=MONTH_DATA[m];
            const hInc=Math.round((md.income/maxBar)*76);
            const hExp=Math.round((md.expenses/maxBar)*76);
            const isSel=m===selectedMonth;
            return(
              <div key={m} className="tt" style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer"}}
                onClick={()=>onSelectMonth(m)}>
                <div style={{width:"100%",display:"flex",gap:2,alignItems:"flex-end",height:80}}>
                  <div style={{flex:1,height:hInc,borderRadius:"5px 5px 0 0",background:isSel?"var(--gr)":"var(--gr-lt)",transition:"height .7s cubic-bezier(.34,1.2,.64,1)"}}/>
                  <div style={{flex:1,height:hExp,borderRadius:"5px 5px 0 0",background:isSel?"var(--re)":"var(--re-lt)",transition:"height .7s cubic-bezier(.34,1.2,.64,1)"}}/>
                </div>
                <div style={{fontSize:9.5,color:isSel?"var(--acc)":"var(--mu2)",fontFamily:"DM Mono",fontWeight:isSel?700:400,textAlign:"center"}}>{m.slice(0,3)}</div>
                <span className="tip">{m}: دخل {N(md.income)} / مصروف {N(md.expenses)}</span>
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:14,marginTop:10}}>
          {[{c:"var(--gr-lt)",l:"الدخل"},{c:"var(--re-lt)",l:"المصروف"}].map((lg,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"var(--mu)"}}>
              <span style={{width:10,height:10,borderRadius:3,background:lg.c,display:"inline-block"}}/>
              {lg.l}
            </div>
          ))}
        </div>
      </div>

      {/* Selected month details */}
      <div className="card" style={{padding:18}}>
        <div style={{fontWeight:700,fontSize:13.5,marginBottom:14}}>تفاصيل {selectedMonth}</div>

        {/* income */}
        <div style={{marginBottom:14}}>
          <div className="sl" style={{marginBottom:8}}>مصادر الدخل</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {selData.incomeList.map((it,i)=>(
              <div key={i} className="row" style={{background:"var(--gr-bg)",borderRadius:12}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div className="ibox" style={{background:"rgba(255,255,255,.6)",width:32,height:32,fontSize:15}}>💵</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:13}}>{it.source}</div>
                    <div style={{fontSize:11,color:"var(--mu2)",fontFamily:"DM Mono"}}>{it.date}</div>
                  </div>
                </div>
                <div style={{fontFamily:"DM Mono",fontSize:15,color:"var(--gr)",fontWeight:600}}>+{N(it.amount)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* donut + expenses */}
        <div className="sl" style={{marginBottom:8}}>توزيع المصروفات</div>
        <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap",marginBottom:12}}>
          <div className="dw">
            <Donut slices={sorted.map(([,v],i)=>({value:v,color:PAL[i%PAL.length]}))} size={90} sw={10}/>
            <div className="dc">
              <div style={{fontFamily:"DM Mono",fontSize:12,fontWeight:600,color:"var(--re)"}}>{N(selData.expenses)}</div>
              <div style={{fontSize:9,color:"var(--mu)"}}>جنيه</div>
            </div>
          </div>
          <div style={{flex:1,minWidth:160,display:"flex",flexDirection:"column",gap:8}}>
            {sorted.slice(0,4).map(([cat,amt],i)=>{
              const pct=Math.round((amt/selData.expenses)*100);
              return(
                <div key={cat}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,marginBottom:4}}>
                    <span style={{display:"flex",alignItems:"center",gap:5,fontWeight:600}}>
                      <span style={{width:7,height:7,borderRadius:"50%",background:PAL[i],display:"inline-block",flexShrink:0}}/>
                      {CE[cat]||"💳"} {cat}
                    </span>
                    <span style={{fontFamily:"DM Mono",color:"var(--mu)",fontSize:11.5}}>{N(amt)}</span>
                  </div>
                  <Prog pct={pct} color={PAL[i]}/>
                </div>
              );
            })}
          </div>
        </div>

        {/* transactions */}
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {selData.expensesList.map((it,i)=>(
            <div key={i} className="row" style={{background:"var(--re-bg)",borderRadius:12}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div className="ibox" style={{background:"rgba(255,255,255,.6)",width:32,height:32,fontSize:15}}>{CE[it.category]||"💳"}</div>
                <div>
                  <div style={{fontWeight:700,fontSize:13}}>{it.category}</div>
                  <div style={{fontSize:11,color:"var(--mu2)"}}>{it.place} · <span style={{fontFamily:"DM Mono"}}>{it.date}</span></div>
                </div>
              </div>
              <div style={{fontFamily:"DM Mono",fontSize:14,color:"var(--re)",fontWeight:600}}>−{N(it.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TABS CONTENT
══════════════════════════════════════════════════════════ */

/* Income Tab (current month = مارس) */
function IncomeTab({d}){
  const [m,setM]=useState(false);
  const tot=d.incomeList.reduce((s,i)=>s+i.amount,0);
  const TC={salary:"var(--bl)",freelance:"var(--pu)",bonus:"var(--acc)",transfer:"var(--te)"};
  const TCB={salary:"var(--bl-bg)",freelance:"var(--pu-bg)",bonus:"var(--acc-bg)",transfer:"var(--te-bg)"};
  const TL={salary:"مرتب",freelance:"شغل حر",bonus:"مكافأة",transfer:"تحويل"};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {d.incomeList.map((item,i)=>(
          <div key={item.id} className="row" style={{animation:`up .38s ${i*.07}s both`,borderRadius:14,border:"1px solid var(--bor)",background:"var(--sur)"}}>
            <div style={{display:"flex",alignItems:"center",gap:11}}>
              <div className="ibox" style={{background:"var(--gr-bg)"}}>💵</div>
              <div>
                <div style={{fontWeight:700,fontSize:13.5}}>{item.source}</div>
                <div style={{display:"flex",gap:6,marginTop:4,alignItems:"center",flexWrap:"wrap"}}>
                  <span className="chip" style={{background:TCB[item.type],color:TC[item.type]}}>{TL[item.type]||item.type}</span>
                  {item.recurring&&<span className="chip" style={{background:"var(--bl-bg)",color:"var(--bl)"}}>🔄</span>}
                  <span style={{fontSize:11,color:"var(--mu2)",fontFamily:"DM Mono"}}>{item.date}</span>
                </div>
              </div>
            </div>
            <div style={{fontFamily:"DM Mono",fontWeight:600,fontSize:16,color:"var(--gr)",whiteSpace:"nowrap"}}>+{N(item.amount)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Expenses Tab */
function ExpensesTab({d}){
  const [m,setM]=useState(false);
  const tot=d.expensesList.reduce((s,e)=>s+e.amount,0);
  const byCat=d.expensesList.reduce((acc,e)=>{acc[e.category]=(acc[e.category]||0)+e.amount;return acc;},{});
  const sorted=Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <AddExpenseModal open={m} onClose={()=>setM(false)}/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div>
          <div className="sl" style={{marginBottom:5}}>إجمالي المصروف — مارس</div>
          <div style={{fontFamily:"DM Mono",fontSize:28,fontWeight:500,color:"var(--re)",lineHeight:1}}>{N(tot)}<span style={{fontSize:13,color:"var(--mu)",fontFamily:"Cairo",marginRight:5,fontWeight:600}}>جنيه</span></div>
        </div>
        <button className="btn ba bsm" onClick={()=>setM(true)}>+ إضافة</button>
      </div>
      {/* donut */}
      <div className="card" style={{padding:18,display:"flex",gap:20,alignItems:"center",flexWrap:"wrap"}}>
        <div className="dw">
          <Donut slices={sorted.map(([,v],i)=>({value:v,color:PAL[i%PAL.length]}))} size={100} sw={11}/>
          <div className="dc"><div style={{fontFamily:"DM Mono",fontSize:13,fontWeight:600,color:"var(--re)"}}>{N(tot)}</div><div style={{fontSize:9,color:"var(--mu)"}}>جنيه</div></div>
        </div>
        <div style={{flex:1,minWidth:160,display:"flex",flexDirection:"column",gap:9}}>
          {sorted.slice(0,5).map(([cat,amt],i)=>{
            const pct=Math.round((amt/tot)*100);
            const over=BUDGET_LIMITS[cat]&&amt>BUDGET_LIMITS[cat];
            return(
              <div key={cat}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,marginBottom:4}}>
                  <span style={{display:"flex",alignItems:"center",gap:5,fontWeight:600}}>
                    <span style={{width:7,height:7,borderRadius:"50%",background:PAL[i],display:"inline-block",flexShrink:0}}/>{CE[cat]||"💳"} {cat}
                  </span>
                  <span style={{fontFamily:"DM Mono",color:over?"var(--re)":"var(--mu)",fontSize:11.5}}>{N(amt)}{over?" ⚠️":""}</span>
                </div>
                <Prog pct={pct} color={PAL[i]}/>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {d.expensesList.map((item,i)=>(
          <div key={item.id} className="row" style={{animation:`up .36s ${i*.06}s both`,borderRadius:14,border:"1px solid var(--bor)",background:"var(--sur)"}}>
            <div style={{display:"flex",alignItems:"center",gap:11}}>
              <div className="ibox" style={{background:"var(--re-bg)"}}>{CE[item.category]||"💳"}</div>
              <div>
                <div style={{fontWeight:700,fontSize:13.5}}>{item.category}</div>
                <div style={{fontSize:11.5,color:"var(--mu2)",marginTop:3}}>{item.place} · <span style={{fontFamily:"DM Mono"}}>{item.date}</span></div>
              </div>
            </div>
            <div style={{fontFamily:"DM Mono",fontWeight:600,fontSize:15,color:"var(--re)",whiteSpace:"nowrap"}}>−{N(item.amount)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Subscriptions */
function SubsTab(){
  const [m,setM]=useState(false);
  const tot=SUBSCRIPTIONS.reduce((s,sub)=>s+sub.amount,0);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <AddSubModal open={m} onClose={()=>setM(false)}/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div>
          <div className="sl" style={{marginBottom:5}}>الاشتراكات الشهرية</div>
          <div style={{fontFamily:"DM Mono",fontSize:28,fontWeight:500,color:"var(--pu)",lineHeight:1}}>{N(tot)}<span style={{fontSize:13,color:"var(--mu)",fontFamily:"Cairo",marginRight:5,fontWeight:600}}>جنيه</span></div>
        </div>
        <button className="btn ba bsm" onClick={()=>setM(true)}>+ إضافة</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {SUBSCRIPTIONS.map((sub,i)=>{
          const urg=sub.daysLeft<=5;
          return(
            <div key={sub.id} className="row" style={{animation:`up .36s ${i*.06}s both`,borderRadius:14,border:`1px solid ${urg?"var(--re-lt)":"var(--bor)"}`,background:urg?"var(--re-bg)":"var(--sur)"}}>
              <div style={{display:"flex",alignItems:"center",gap:11}}>
                <div className="ibox" style={{background:"var(--pu-bg)",fontFamily:"DM Mono",fontSize:12,fontWeight:700,color:"var(--pu)"}}>{sub.name.slice(0,2)}</div>
                <div>
                  <div style={{fontWeight:700,fontSize:13.5}}>{sub.name}</div>
                  <div style={{display:"flex",gap:6,marginTop:4,alignItems:"center",flexWrap:"wrap"}}>
                    {urg&&<span className="chip" style={{background:"var(--re-bg)",color:"var(--re)"}}>⚠️ {sub.daysLeft} أيام</span>}
                    <span style={{fontSize:11,color:"var(--mu2)",fontFamily:"DM Mono"}}>🔄 {sub.renewal}</span>
                  </div>
                </div>
              </div>
              <div style={{fontFamily:"DM Mono",fontWeight:600,fontSize:15,color:"var(--pu)",whiteSpace:"nowrap"}}>{N(sub.amount)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Commitments */
function CommitTab(){
  const [m,setM]=useState(false);
  const tot=COMMITMENTS.reduce((s,c)=>s+c.amount,0);
  const pend=COMMITMENTS.filter(c=>c.status!=="مدفوع").reduce((s,c)=>s+c.amount,0);
  const PC={"عالي":"var(--re)","متوسط":"var(--am)","منخفض":"var(--gr)"};
  const PCB={"عالي":"var(--re-bg)","متوسط":"var(--am-bg)","منخفض":"var(--gr-bg)"};
  const SF={"مدفوع":"var(--gr)","مستحق":"var(--am)","متأخر":"var(--re)"};
  const SFB={"مدفوع":"var(--gr-bg)","مستحق":"var(--am-bg)","متأخر":"var(--re-bg)"};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <AddCommitModal open={m} onClose={()=>setM(false)}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <div style={{background:"var(--am-bg)",borderRadius:14,padding:"11px 18px",border:"1px solid var(--am-lt)"}}>
            <div className="sl">إجمالي</div>
            <div style={{fontFamily:"DM Mono",fontSize:19,color:"var(--am)",marginTop:3}}>{N(tot)} جنيه</div>
          </div>
          <div style={{background:"var(--re-bg)",borderRadius:14,padding:"11px 18px",border:"1px solid var(--re-lt)"}}>
            <div className="sl">مستحق</div>
            <div style={{fontFamily:"DM Mono",fontSize:19,color:"var(--re)",marginTop:3}}>{N(pend)} جنيه</div>
          </div>
        </div>
        <button className="btn ba bsm" onClick={()=>setM(true)}>+ إضافة</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {COMMITMENTS.map((c,i)=>(
          <div key={c.id} className="row" style={{animation:`up .36s ${i*.07}s both`,borderRadius:14,border:"1px solid var(--bor)",background:"var(--sur)"}}>
            <div style={{display:"flex",alignItems:"center",gap:11}}>
              <div style={{width:5,height:44,borderRadius:4,background:PC[c.priority],flexShrink:0}}/>
              <div>
                <div style={{fontWeight:700,fontSize:13.5}}>{c.name}</div>
                <div style={{display:"flex",gap:6,marginTop:4,alignItems:"center"}}>
                  <span className="chip" style={{background:PCB[c.priority],color:PC[c.priority]}}>{c.priority}</span>
                  <span style={{fontSize:11,color:"var(--mu2)",fontFamily:"DM Mono"}}>📅 {c.dueDate}</span>
                </div>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
              <div style={{fontFamily:"DM Mono",fontSize:15,fontWeight:600,color:"var(--am)"}}>{N(c.amount)}</div>
              <span className="chip" style={{background:SFB[c.status],color:SF[c.status]}}>{c.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Jamiat */
function JamiatTab(){
  const [m,setM]=useState(false);
  const mTot=JAMIAT.reduce((s,j)=>s+j.monthlyPayment,0);
  const exp=JAMIAT.filter(j=>!j.received).reduce((s,j)=>s+j.totalAmount,0);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <AddJamiaModal open={m} onClose={()=>setM(false)}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:9}}>
        {[{l:"دفع شهري",v:N(mTot)+" جنيه",c:"var(--bl)",bg:"var(--bl-bg)",bo:"var(--bl-lt)"},
          {l:"جمعيات",v:String(JAMIAT.length),c:"var(--am)",bg:"var(--am-bg)",bo:"var(--am-lt)"},
          {l:"متوقع",v:N(exp)+" جنيه",c:"var(--gr)",bg:"var(--gr-bg)",bo:"var(--gr-lt)"}
        ].map((s,i)=>(
          <div key={i} style={{background:s.bg,borderRadius:14,padding:"12px 14px",border:`1px solid ${s.bo}`}}>
            <div className="sl" style={{marginBottom:5}}>{s.l}</div>
            <div style={{fontFamily:"DM Mono",fontSize:16,color:s.c,fontWeight:600}}>{s.v}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontWeight:800,fontSize:14}}>قائمة الجمعيات</div>
        <button className="btn ba bsm" onClick={()=>setM(true)}>+ إضافة</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {JAMIAT.map((j,idx)=>{
          const pct=Math.round((j.paidMonths/j.members)*100);
          const left=j.members-j.paidMonths;
          const til=j.myTurn-j.paidMonths;
          return(
            <div key={j.id} className="card" style={{overflow:"hidden",animation:`up .45s ${idx*.1}s both`}}>
              <div style={{background:j.color+"12",borderBottom:`1.5px solid ${j.color}25`,padding:"16px 18px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                  <div>
                    <div style={{fontWeight:800,fontSize:14}}>{j.name}</div>
                    <div style={{fontSize:11.5,color:"var(--mu)",marginTop:2}}>{j.startDate} ← {j.endDate}</div>
                  </div>
                  <span className="chip" style={{background:j.received?"var(--gr-bg)":"var(--am-bg)",color:j.received?"var(--gr)":"var(--am)",flexShrink:0}}>{j.received?"✅ استلمت":"⏳ لم أستلم"}</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginTop:12}}>
                  {[{l:"القسط",v:N(j.monthlyPayment)},{l:"الإجمالي",v:N(j.totalAmount)},{l:"دوري",v:`شهر ${j.myTurn}`}].map((s,si)=>(
                    <div key={si} style={{background:"rgba(255,255,255,.55)",borderRadius:9,padding:"8px 10px",textAlign:"center",border:`1px solid ${j.color}18`}}>
                      <div style={{fontSize:9.5,color:"var(--mu)",marginBottom:2}}>{s.l}</div>
                      <div style={{fontFamily:"DM Mono",fontSize:13,color:j.color,fontWeight:600}}>{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{padding:"14px 18px",display:"flex",flexDirection:"column",gap:12}}>
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6}}>
                    <span style={{color:"var(--mu)"}}>التقدم</span>
                    <span style={{fontFamily:"DM Mono",color:j.color,fontWeight:600}}>{j.paidMonths}/{j.members} · {pct}%</span>
                  </div>
                  <Prog pct={pct} color={j.color}/>
                  <div style={{fontSize:11,color:"var(--mu2)",marginTop:4,fontFamily:"DM Mono"}}>
                    متبقي {left} قسط{!j.received&&til>0?` · دورك بعد ${til} شهر`:""}
                  </div>
                </div>
                <div>
                  <div className="sl" style={{marginBottom:7}}>جدول الأقساط</div>
                  <div className="jg">
                    {Array.from({length:j.members}).map((_,mi)=>{
                      const mo=mi+1,paid=mo<=j.paidMonths,isTurn=mo===j.myTurn;
                      return(
                        <div key={mo} className="jc tt"
                          style={{background:isTurn?j.color:paid?j.color+"30":"var(--bg2)",color:isTurn?"#fff":paid?j.color:"var(--mu2)",fontWeight:isTurn?700:400,boxShadow:isTurn?`0 0 0 2px ${j.color}60`:"none"}}>
                          {mo}<span className="tip">{paid?"✅":isTurn?"⭐":"⬜"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Savings */
function SavingsTab(){
  const [m,setM]=useState(false);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <AddSavingModal open={m} onClose={()=>setM(false)}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontWeight:800,fontSize:14}}>أهداف الادخار</div>
        <button className="btn ba bsm" onClick={()=>setM(true)}>+ هدف</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {SAVINGS.map((s,i)=>{
          const pct=Math.round((s.current/s.target)*100);
          return(
            <div key={s.id} className="card" style={{padding:18,animation:`up .44s ${i*.08}s both`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div className="ibox" style={{background:"var(--te-bg)",fontSize:20}}>{s.emoji}</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:14}}>{s.name}</div>
                    <div style={{fontSize:11.5,color:"var(--mu2)",marginTop:2,fontFamily:"DM Mono"}}>📅 {s.deadline}</div>
                  </div>
                </div>
                <div style={{textAlign:"left"}}>
                  <div style={{fontFamily:"DM Mono",fontSize:18,color:"var(--te)",fontWeight:600}}>{N(s.current)}</div>
                  <div style={{fontSize:11,color:"var(--mu2)",fontFamily:"DM Mono"}}>من {N(s.target)}</div>
                </div>
              </div>
              <Prog pct={pct} color="var(--te)"/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:12}}>
                <span style={{color:"var(--te)",fontFamily:"DM Mono",fontWeight:600}}>{pct}%</span>
                <span style={{color:"var(--mu2)",fontFamily:"DM Mono"}}>متبقي {N(s.target-s.current)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Zakat */
function ZakatTab(){
  const pct=Math.round((CHARITY.paidThisMonth/CHARITY.monthlyGoal)*100);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div className="card" style={{padding:18}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>⭐<span style={{fontWeight:800,fontSize:14}}>الزكاة</span></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:12}}>
          <div style={{background:"var(--am-bg)",borderRadius:12,padding:"12px 14px",border:"1px solid var(--am-lt)"}}>
            <div className="sl">مطلوب</div>
            <div style={{fontFamily:"DM Mono",fontSize:20,color:"var(--am)",marginTop:3}}>{N(ZAKAT.required)}</div>
          </div>
          <div style={{background:"var(--gr-bg)",borderRadius:12,padding:"12px 14px",border:"1px solid var(--gr-lt)"}}>
            <div className="sl">مدفوع</div>
            <div style={{fontFamily:"DM Mono",fontSize:20,color:"var(--gr)",marginTop:3}}>{N(ZAKAT.paid)}</div>
          </div>
        </div>
        <div style={{background:"var(--gr-bg)",border:"1px solid var(--gr-lt)",borderRadius:10,padding:"10px 13px",fontSize:13,color:"var(--gr)",fontWeight:600}}>
          ✅ تم الدفع {ZAKAT.paidDate} · {ZAKAT.entity}
        </div>
      </div>
      <div className="card" style={{padding:18}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>🤲<span style={{fontWeight:800,fontSize:14}}>الصدقة</span></div>
          <span className="chip" style={{background:"var(--pk-bg)",color:"var(--pk)"}}>هدف: {N(CHARITY.monthlyGoal)}</span>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}>
            <span style={{color:"var(--mu)"}}>تم دفعه</span>
            <span style={{fontFamily:"DM Mono",color:"var(--pk)",fontWeight:600}}>{N(CHARITY.paidThisMonth)} / {N(CHARITY.monthlyGoal)}</span>
          </div>
          <Prog pct={pct} color="var(--pk)"/>
          <div style={{fontSize:11,color:"var(--mu2)",marginTop:4,fontFamily:"DM Mono"}}>{pct}% من الهدف</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {CHARITY.payments.map((p,i)=>(
            <div key={i} className="row" style={{background:"var(--sur2)",borderRadius:10}}>
              <div><div style={{fontSize:13,fontWeight:600}}>{p.notes}</div><div style={{fontSize:11,color:"var(--mu2)",fontFamily:"DM Mono",marginTop:1}}>{p.date}</div></div>
              <div style={{fontFamily:"DM Mono",color:"var(--pk)",fontWeight:600}}>{N(p.amount)}</div>
            </div>
          ))}
        </div>
        <button className="btn bg" style={{width:"100%",marginTop:12,justifyContent:"center"}}>+ تسجيل صدقة</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TABS CONFIG
══════════════════════════════════════════════════════════ */
const TABS=[
  {key:"preview",  label:"الشهور",      emoji:"📅",color:"#6030b0"},
  {key:"income",   label:"الدخل",       emoji:"💵",color:"#257a50"},
  {key:"expenses", label:"المصروفات",   emoji:"💸",color:"#b83224"},
  {key:"commit",   label:"الالتزامات",  emoji:"📋",color:"#b06010"},
  {key:"subs",     label:"الاشتراكات",  emoji:"🔄",color:"#6030b0"},
  {key:"jamiat",   label:"جمعياتي",     emoji:"👥",color:"#2450a8"},
  {key:"savings",  label:"الادخار",     emoji:"🎯",color:"#157068"},
  {key:"zakat",    label:"الزكاة",      emoji:"🤲",color:"#982050"},
];

/* ══════════════════════════════════════════════════════════
   NOTIF MODAL
══════════════════════════════════════════════════════════ */
function NotifModal({open,onClose}){
  const NB={warn:"var(--am-bg)",ok:"var(--gr-bg)",alert:"var(--re-bg)",info:"var(--bl-bg)"};
  const NF={warn:"var(--am)",ok:"var(--gr)",alert:"var(--re)",info:"var(--bl)"};
  const NI={warn:"⚠️",ok:"✅",alert:"🚨",info:"ℹ️"};
  return(
    <Modal open={open} onClose={onClose} title="🔔 التنبيهات">
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {NOTIFS.map(n=>(
          <div key={n.id} style={{display:"flex",gap:10,padding:"12px 13px",borderRadius:12,background:NB[n.type],border:`1px solid ${NF[n.type]}35`}}>
            <span style={{fontSize:18,flexShrink:0}}>{NI[n.type]}</span>
            <div><div style={{fontSize:13.5,fontWeight:600}}>{n.text}</div><div style={{fontSize:11,color:"var(--mu2)",marginTop:3,fontFamily:"DM Mono"}}>{n.time}</div></div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   ADD DROPDOWN
══════════════════════════════════════════════════════════ */
function AddDrop({onSelect}){
  const items=[
    {key:"income", e:"💵",l:"دخل جديد",    c:"var(--gr)"},
    {key:"expense",e:"💸",l:"مصروف جديد",  c:"var(--re)"},
    {key:"commit", e:"📋",l:"التزام جديد",  c:"var(--am)"},
    {key:"sub",    e:"🔄",l:"اشتراك جديد",  c:"var(--pu)"},
    {key:"jamia",  e:"👥",l:"جمعية جديدة",  c:"var(--bl)"},
    {key:"saving", e:"🎯",l:"هدف ادخار",    c:"var(--te)"},
  ];
  return(
    <div className="drop">
      <div style={{fontSize:10,color:"var(--mu2)",fontFamily:"DM Mono",padding:"2px 4px 7px",letterSpacing:".5px"}}>اختار نوع العملية</div>
      {items.map(it=>(
        <button key={it.key} className="di" onClick={()=>onSelect(it.key)}>
          <div style={{width:32,height:32,borderRadius:9,background:it.c+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{it.e}</div>
          <span style={{fontWeight:700,color:it.c,fontSize:13.5}}>{it.l}</span>
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════ */
export default function App(){
  const [tab,setTab]       = useState("preview");
  const [selMonth,setSelMonth] = useState("مارس");
  const [notif,setNotif]   = useState(false);
  const [dropOpen,setDrop] = useState(false);
  const [addModal,setAddModal] = useState(null);

  const curData = MONTH_DATA[selMonth]||BASE;
  const cfg     = TABS.find(t=>t.key===tab);

  function handleDropSelect(key){ setDrop(false); setAddModal(key); }

  const content={
    preview:  <MonthPreview selectedMonth={selMonth} onSelectMonth={setSelMonth}/>,
    income:   <IncomeTab   d={BASE}/>,
    expenses: <ExpensesTab d={BASE}/>,
    commit:   <CommitTab/>,
    subs:     <SubsTab/>,
    jamiat:   <JamiatTab/>,
    savings:  <SavingsTab/>,
    zakat:    <ZakatTab/>,
  };

  return(
    <>
      <style>{CSS}</style>

      {/* modals */}
      <NotifModal         open={notif}              onClose={()=>setNotif(false)}/>
      <AddIncomeModal     open={addModal==="income"} onClose={()=>setAddModal(null)}/>
      <AddExpenseModal    open={addModal==="expense"}onClose={()=>setAddModal(null)}/>
      <AddCommitModal     open={addModal==="commit"} onClose={()=>setAddModal(null)}/>
      <AddSubModal        open={addModal==="sub"}    onClose={()=>setAddModal(null)}/>
      <AddJamiaModal      open={addModal==="jamia"}  onClose={()=>setAddModal(null)}/>
      <AddSavingModal     open={addModal==="saving"} onClose={()=>setAddModal(null)}/>

      {/* header */}
      <header className="hdr">
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#c0882a,#8a5f18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,boxShadow:"0 3px 10px rgba(168,114,30,.22)",flexShrink:0}}>💰</div>
          <div>
            <div style={{fontWeight:900,fontSize:15,lineHeight:1.1,letterSpacing:"-.3px"}}>ملخص فلوسي</div>
            <div style={{fontSize:10,color:"var(--mu2)",fontFamily:"DM Mono",marginTop:1}}>مارس 2024</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {/* search — desktop only */}
          <div className="sb hm">
            <span style={{fontSize:13,color:"var(--mu2)"}}>🔍</span>
            <input placeholder="بحث…"/>
          </div>
          {/* notif */}
          <button className="btn bg bsm" style={{position:"relative",padding:"7px 11px",gap:0}} onClick={()=>setNotif(true)}>
            <span style={{fontSize:16}}>🔔</span>
            <span className="nd"/>
          </button>
          {/* add dropdown */}
          <div style={{position:"relative"}}>
            <button className="btn ba bsm" style={{gap:5,fontWeight:800}} onClick={()=>setDrop(p=>!p)}>
              <span style={{fontSize:15,fontWeight:900}}>+</span>
              <span className="hm" style={{display:"inline"}}>إضافة</span>
              <span style={{fontSize:9,opacity:.7}}>{dropOpen?"▲":"▼"}</span>
            </button>
            {dropOpen&&(
              <>
                <div style={{position:"fixed",inset:0,zIndex:299}} onClick={()=>setDrop(false)}/>
                <AddDrop onSelect={handleDropSelect}/>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="main">
        {/* stat cards */}
        <div className="u0" style={{marginBottom:20}}>
          <StatCards income={curData.income} expenses={curData.expenses}
            prevIncome={MONTH_DATA["فبراير"]?.income} prevExpenses={MONTH_DATA["فبراير"]?.expenses}/>
        </div>

        {/* tab bar */}
        <div className="u1" style={{marginBottom:12}}>
          <div className="tbar">
            {TABS.map(t=>(
              <button key={t.key} className={`tbtn${tab===t.key?" on":""}`}
                style={tab===t.key?{background:t.color}:{}}
                onClick={()=>setTab(t.key)}>
                <span>{t.emoji}</span><span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* content card */}
        <div className="u2 card" style={{padding:"20px 16px"}} key={tab}>
          <div className="sh2">
            <div style={{width:32,height:32,borderRadius:9,background:(cfg?.color||"var(--acc)")+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{cfg?.emoji}</div>
            <span style={{fontWeight:800,fontSize:14}}>{cfg?.label}</span>
            {tab==="preview"&&<span style={{fontSize:12.5,color:"var(--mu)",marginRight:"auto",fontFamily:"DM Mono",fontWeight:500}}>— {selMonth}</span>}
          </div>
          {content[tab]}
        </div>
      </main>

      {/* mobile bottom FAB row */}
      <div className="fab">
        <button className="btn bg" style={{gap:6,boxShadow:"var(--sh2)",borderRadius:14}} onClick={()=>setNotif(true)}>🔔</button>
        <button className="btn ba" style={{gap:6,boxShadow:"0 6px 20px rgba(168,114,30,.3)",borderRadius:14,paddingInline:28}} onClick={()=>setDrop(p=>!p)}>
          <span style={{fontSize:18,fontWeight:900}}>+</span> إضافة
        </button>
      </div>
      {/* mobile dropdown when open via FAB */}
      {dropOpen&&(
        <div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",zIndex:400,width:"calc(100vw - 32px)",maxWidth:340}}>
          <div className="drop" style={{position:"relative",top:0,left:0,transform:"none",width:"100%",maxWidth:"100%"}}>
            <div style={{fontSize:10,color:"var(--mu2)",fontFamily:"DM Mono",padding:"2px 4px 7px",letterSpacing:".5px"}}>اختار نوع العملية</div>
            {[{key:"income",e:"💵",l:"دخل جديد",c:"var(--gr)"},{key:"expense",e:"💸",l:"مصروف جديد",c:"var(--re)"},{key:"commit",e:"📋",l:"التزام جديد",c:"var(--am)"},{key:"sub",e:"🔄",l:"اشتراك جديد",c:"var(--pu)"},{key:"jamia",e:"👥",l:"جمعية جديدة",c:"var(--bl)"},{key:"saving",e:"🎯",l:"هدف ادخار",c:"var(--te)"}].map(it=>(
              <button key={it.key} className="di" onClick={()=>handleDropSelect(it.key)}>
                <div style={{width:32,height:32,borderRadius:9,background:it.c+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{it.e}</div>
                <span style={{fontWeight:700,color:it.c,fontSize:13.5}}>{it.l}</span>
              </button>
            ))}
          </div>
          <div style={{position:"fixed",inset:0,zIndex:-1}} onClick={()=>setDrop(false)}/>
        </div>
      )}
    </>
  );
}