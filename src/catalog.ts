import type { Country } from './data/countries';

const continents=new Set(['europe','asia','africa','north-america','south-america','oceania']);
const id=(value:unknown)=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(value);
const text=(value:unknown,max=240)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
const point=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)&&Math.abs(value)<=10000;
const path=(value:unknown)=>text(value,100000)&&/^[Mm]/.test((value as string).trim())&&/^[-\d\s.,MmLlHhVvCcSsQqTtAaZzEe+]+$/.test(value as string);
const local=(value:unknown,kind:'photos'|'audio')=>typeof value==='string'&&new RegExp(`^\\./content/${kind}/[a-zA-Z0-9_-]+\\.(?:${kind==='photos'?'jpg|jpeg|png|webp':'wav|mp3'})$`,'i').test(value);
const https=(value:unknown)=>{
  if(typeof value!=='string')return false;
  try{const url=new URL(value);return url.protocol==='https:'&&Boolean(url.hostname)&&!url.username&&!url.password;}catch{return false;}
};
const hex=(value:unknown)=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);
const viewBox=(value:unknown)=>{
  if(!text(value,80))return false;
  const values=(value as string).trim().split(/[\s,]+/).map(Number);
  return values.length===4&&values.every(point)&&values[2]>0&&values[3]>0;
};

/** A damaged downloaded catalogue must never replace a working local game. */
export function parseCatalogue(value:unknown):Country[]|null {
  if(!value||typeof value!=='object')return null;
  const catalog=value as {schemaVersion?:unknown,countries?:unknown};
  if(catalog.schemaVersion!==1||!Array.isArray(catalog.countries)||!catalog.countries.length||catalog.countries.length>500)return null;
  const seen=new Set<string>();
  for(const candidate of catalog.countries){
    const c=candidate as Country;
    if(!c||!id(c.id)||seen.has(c.id)||!text(c.name,80)||!text(c.capital,80)||!continents.has(c.continentId)||!['familiar','explore'].includes(c.familiarity)||!hex(c.accent))return null;
    seen.add(c.id);
    if(!c.flag||!viewBox(c.flag.viewBox)||!c.flag.bounds||!Array.isArray(c.flag.regions)||!c.flag.regions.length||c.flag.regions.length>60)return null;
    const b=c.flag.bounds;
    if(![b.x,b.y,b.width,b.height].every(point)||b.width<=0||b.height<=0)return null;
    const regionIds=new Set<string>();
    for(const r of c.flag.regions){
      if(!r||!id(r.id)||regionIds.has(r.id)||!path(r.path)||!Number.isInteger(r.colorId)||r.colorId<1||r.colorId>10||!point(r.labelX)||!point(r.labelY)||r.fillRule!==undefined&&!['evenodd','nonzero'].includes(r.fillRule))return null;
      if(r.hitPath!==undefined&&!path(r.hitPath))return null;
      regionIds.add(r.id);
    }
    if(c.flag.prepaintedPaths!==undefined){
      if(!Array.isArray(c.flag.prepaintedPaths)||c.flag.prepaintedPaths.length>50)return null;
      for(const d of c.flag.prepaintedPaths)if(!d||!path(d.path)||!(d.fill==='none'||hex(d.fill))||d.stroke!==undefined&&!hex(d.stroke)||d.strokeWidth!==undefined&&(!point(d.strokeWidth)||d.strokeWidth<0)||d.fillRule!==undefined&&!['evenodd','nonzero'].includes(d.fillRule))return null;
    }
    if(!Array.isArray(c.photos)||!c.photos.length||c.photos.length>60)return null;
    const photoIds=new Set<string>();
    for(const p of c.photos){
      if(!p||!id(p.id)||photoIds.has(p.id)||!local(p.src,'photos')||!text(p.caption)||!['landscape','landmark','capital','city'].includes(p.category)||!https(p.sourceURL)||!text(p.creator)||!text(p.license)||!https(p.licenseURL))return null;
      photoIds.add(p.id);
    }
    if(!c.music||!local(c.music.src,'audio')||!text(c.music.title)||!text(c.music.inspiration)||!text(c.music.creator)||!text(c.music.license))return null;
    if(c.trivia!==undefined){
      if(!Array.isArray(c.trivia)||c.trivia.length!==6)return null;
      const questionIds=new Set<string>();
      for(const q of c.trivia){
        if(!q||!id(q.id)||questionIds.has(q.id)||!text(q.question,200)||!Array.isArray(q.answers)||q.answers.length!==4||!Number.isInteger(q.correctAnswerIndex)||q.correctAnswerIndex<0||q.correctAnswerIndex>3)return null;
        for(const answer of q.answers)if(!text(answer,80)||answer!==answer.trim())return null;
        if(new Set(q.answers).size!==4)return null;
        questionIds.add(q.id);
      }
    }
  }
  return catalog.countries as Country[];
}
