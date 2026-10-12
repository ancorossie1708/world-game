import type { Country } from './data/countries';

export function chooseCountry(pool:Country[],previousId?:string,random=Math.random):Country|null {
  if(!pool.length)return null;
  const fresh=pool.length>1?pool.filter(c=>c.id!==previousId):pool;
  return fresh[Math.min(fresh.length-1,Math.floor(random()*fresh.length))];
}

function uniqueCountries<T extends {id:string}>(pool:readonly T[]):T[] {
  const unique=new Map<string,T>();
  for(const country of pool)if(!unique.has(country.id))unique.set(country.id,country);
  return [...unique.values()];
}

/** The album is the only history: clearing it makes every eligible country available again. */
export function getRemainingCountries<T extends {id:string}>(pool:readonly T[],visitedIds:Iterable<string>):T[] {
  const visited=new Set(visitedIds);
  return uniqueCountries(pool).filter(country=>!visited.has(country.id));
}

/** Never falls back to a visited country when this pool has been completed. */
export function chooseUnvisitedCountry<T extends {id:string}>(pool:readonly T[],visitedIds:Iterable<string>,random=Math.random):T|undefined {
  const remaining=getRemainingCountries(pool,visitedIds);
  if(!remaining.length)return undefined;
  const value=random();
  const index=Number.isFinite(value)?Math.min(remaining.length-1,Math.max(0,Math.floor(value*remaining.length))):0;
  return remaining[index];
}

/** Counts distinct country IDs in the supplied pool, regardless of repeat visits. */
export function continentProgress(pool:readonly {id:string}[],visitedIds:Iterable<string>):{total:number;visited:number;remaining:number;complete:boolean} {
  const unique=uniqueCountries(pool);
  const remaining=getRemainingCountries(unique,visitedIds).length;
  const total=unique.length;
  return {total,visited:total-remaining,remaining,complete:total>0&&remaining===0};
}

export function makeAnswers(country:Country,all:Country[],random=Math.random):Country[] {
  const alternatives=all.filter(c=>c.id!==country.id);
  for(let i=alternatives.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[alternatives[i],alternatives[j]]=[alternatives[j],alternatives[i]];}
  const result=[country,...alternatives.slice(0,3)];
  for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
export function acceptRegion(painted:string[],id:string,selected:number|null,regions:{id:string,colorId:number}[]):string[] {
  const region=regions.find(r=>r.id===id);
  if(!region||region.colorId!==selected||painted.includes(id))return painted;
  return [...painted,id];
}
