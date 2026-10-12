import { useId, useState, useEffect, type MouseEvent } from 'react';
import { palette, type Country } from '../data/countries';
import { flagPalette } from '../lib/flag-colors';

export function FlagBoard({country,painted=[],selected=null,onPaint,complete=false,reduceMotion=false,wrongRegionId,feedbackSequence=0}:{country:Country,painted?:string[],selected?:number|null,onPaint?:(id:string,matching:boolean)=>void,complete?:boolean,reduceMotion?:boolean,wrongRegionId?:string,feedbackSequence?:number}) {
  const uid=useId().replace(/:/g,'');
  const [animation,setAnimation]=useState<{id:string,x:number,y:number,color:string}|null>(null);
  useEffect(()=>setAnimation(null),[country.id]);
  useEffect(()=>{if(animation){const timer=setTimeout(()=>setAnimation(null),420);return ()=>clearTimeout(timer);}},[animation]);
  const flag=country.flag;
  const colorNumbers=new Map(flagPalette(flag.regions).map(color=>[color.id,color.number]));
  const bounds=flag.bounds||{x:0,y:0,width:900,height:600};
  const touch=(event:MouseEvent<SVGPathElement>,id:string,colorId:number)=>{
    if(!onPaint||painted.includes(id))return;
    const matching=selected===colorId;
    if(matching&&!reduceMotion){
      const svg=event.currentTarget.ownerSVGElement;
      const matrix=svg?.getScreenCTM();
      const point=svg?.createSVGPoint();
      if(point&&matrix){point.x=event.clientX;point.y=event.clientY;const local=point.matrixTransform(matrix.inverse());setAnimation({id,x:local.x,y:local.y,color:palette.find(p=>p.id===colorId)!.hex});}
    }
    onPaint(id,matching);
  };
  return <svg className={`flag-svg ${complete?'complete':''}`} viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`} style={{aspectRatio:`${bounds.width}/${bounds.height}`}} aria-label={complete?`דגל ${country.name}`:'דגל לצביעה לפי מספרים'}>
    <defs>
      <pattern id={`checker-${uid}`} width="44" height="44" patternUnits="userSpaceOnUse"><rect width="44" height="44" fill="#F3F4F0"/><path d="M0 0h22v22H0ZM22 22h22v22H22Z" fill="#CFD6CF"/></pattern>
      {animation&&<clipPath id={`clip-${uid}`}><path d={flag.regions.find(r=>r.id===animation.id)?.path} clipRule={flag.regions.find(r=>r.id===animation.id)?.fillRule}/></clipPath>}
    </defs>
    {flag.regions.map(region=>{
      const isPainted=complete||painted.includes(region.id);
      const color=palette.find(p=>p.id===region.colorId)!;
      const isAnimating=animation?.id===region.id;
      const matching=selected===region.colorId&&!isPainted;
      const isWrong=wrongRegionId===region.id&&!reduceMotion;
      return <g key={region.id} className={isWrong?'wrong-region':undefined} style={isWrong?{animationName:feedbackSequence%2?'wrong-region-a':'wrong-region-b'}:undefined}>
        <path d={region.path} fillRule={region.fillRule} fill={isPainted&&!isAnimating?color.hex:matching||isAnimating?`url(#checker-${uid})`:'#F0F0EB'} stroke={complete?'none':'#BCC6BF'} strokeWidth={2.5} strokeLinejoin="round" className={onPaint?'paint-region':undefined} role={onPaint?'button':undefined} tabIndex={onPaint&&!isPainted?0:undefined} aria-label={onPaint?`משטח בצבע ${color.name}, מספר ${colorNumbers.get(region.colorId)}${isPainted?', נצבע':''}`:undefined} onClick={onPaint?event=>touch(event,region.id,region.colorId):undefined} onKeyDown={onPaint?event=>{if(!isPainted&&(event.key==='Enter'||event.key===' ')){event.preventDefault();onPaint(region.id,selected===region.colorId);}}:undefined}/>
        {isAnimating&&animation&&<g clipPath={`url(#clip-${uid})`} pointerEvents="none"><circle cx={animation.x} cy={animation.y} r="1200" fill={animation.color}><animate attributeName="r" from="0" to="1200" dur="0.38s" fill="freeze"/></circle></g>}
        {region.hitPath&&!isPainted&&onPaint&&<path d={region.hitPath} fill="transparent" aria-hidden="true" className="paint-region" onClick={event=>touch(event,region.id,region.colorId)}/>}
      </g>;
    })}
    {flag.prepaintedPaths?.map(({path,...attributes},index)=><path key={index} {...attributes} d={path} pointerEvents="none"/>)}
    {!complete&&flag.regions.filter(r=>!painted.includes(r.id)).map(region=>{
      const isWrong=wrongRegionId===region.id&&!reduceMotion;
      return <g key={`label-${region.id}`} pointerEvents="none" className={isWrong?'wrong-region':undefined} style={isWrong?{animationName:feedbackSequence%2?'wrong-region-a':'wrong-region-b'}:undefined}><rect x={region.labelX-29} y={region.labelY-29} width="58" height="58" rx="19" fill="#FFFDF8" stroke="#D7DDD5" strokeWidth="2"/><text x={region.labelX} y={region.labelY+1} textAnchor="middle" dominantBaseline="central" fill="#24413B" fontSize="38" fontWeight="700" fontFamily="Arial, sans-serif">{colorNumbers.get(region.colorId)}</text></g>;
    })}
  </svg>;
}
