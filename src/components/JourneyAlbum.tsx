import { continents, type Country } from '../data/countries';
import { continentProgress } from '../game';
import { FlagBoard } from './FlagBoard';
import { Icon } from './Artwork';
import './journey-album.css';

type JourneyAlbumProps={catalog:Country[];eligible:Country[];visitedIds:Set<string>;continentId:string|null;onOpen:(country:Country)=>void;onReplay:(country:Country)=>void};

export function JourneyAlbum({catalog,eligible,visitedIds,continentId,onOpen,onReplay}:JourneyAlbumProps) {
  const enabledIds=new Set(eligible.map(country=>country.id));
  const groups=continents.filter(continent=>!continentId||continent.id===continentId).map(continent=>({
    continent,
    progress:continentProgress(eligible.filter(country=>country.continentId===continent.id),visitedIds),
    countries:catalog.filter(country=>country.continentId===continent.id&&(enabledIds.has(country.id)||visitedIds.has(country.id))).sort((a,b)=>Number(visitedIds.has(b.id))-Number(visitedIds.has(a.id))),
  })).filter(group=>group.countries.length>0);

  return <div className="journey-album-scroll">
    {groups.map(({continent,progress,countries})=><section className="journey-album-section" key={continent.id} aria-label={continent.name}>
      <div className="journey-album-section-heading"><h2>{continent.name}</h2><span className="journey-count" dir="ltr" aria-label={`ביקרנו ב־${progress.visited} מתוך ${progress.total} מדינות`}>{progress.visited}/{progress.total}</span></div>
      <div className="journey-passport-grid">{countries.map(country=>visitedIds.has(country.id)?<article className="country-passport" key={country.id}>
        <button className="passport-open" onClick={()=>onOpen(country)} aria-label={`תמונות ומוזיקה של ${country.name}`}><div className="passport-flag"><FlagBoard country={country} complete/></div><strong>{country.name}</strong><span className="passport-visited-mark"><Icon name="check" size={19}/></span></button>
        <button className="passport-replay" onClick={()=>onReplay(country)} aria-label={`משחק חוזר ב${country.name}`}><Icon name="refresh" size={21}/>משחק חוזר</button>
      </article>:<div className="country-passport passport-empty" key={country.id} role="img" aria-label={`טרם ביקרנו ב${country.name}`}><span aria-hidden="true">?</span></div>)}</div>
    </section>)}
    {!groups.length&&<div className="journey-album-no-countries">בחרו מדינות בהגדרות</div>}
  </div>;
}
