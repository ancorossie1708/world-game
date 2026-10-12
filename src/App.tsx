import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { countries as bundledCountries, continents, type Country } from './data/countries';
import { flagPalette } from './lib/flag-colors';
import { FlagBoard } from './components/FlagBoard';
import { FeedbackOverlay } from './components/FeedbackOverlay';
import { FlagCelebration, FLAG_CELEBRATION_DURATION } from './components/FlagCelebration';
import { PhotoProgress } from './components/PhotoProgress';
import { JourneyAlbum } from './components/JourneyAlbum';
import { CountryTrivia } from './components/CountryTrivia';
import { countryTrivia } from './data/trivia';
import { ContinentArt, Icon, JourneyGlobe } from './components/Artwork';
import { chooseUnvisitedCountry, continentProgress, makeAnswers, acceptRegion } from './game';
import { parseCatalogue } from './catalog';
import { readSavedState, writeSavedState, clearAlbum, restoreAlbum, type AlbumRecord, type GameSettings } from './lib/storage';
import { playFeedback, stopFeedbackSounds } from './lib/feedback-sound';
import { playCompletionSound, stopCompletionSound } from './lib/completion-sound';
import { afterCountryIdentification, saveJourneyTrivia, startJourneyPhotos } from './lib/journey-session';
import type { TriviaRound } from './lib/trivia';
import { createVisitMusic, type VisitMusic } from './lib/visit-music';
import { initializeOfflineSupport, checkForUpdates, getUpdateStatus, subscribeToUpdateStatus, setRoundActive, requestAppUpdate, type UpdateStatus } from './lib/offline';

type Screen='home'|'paint'|'quiz'|'trivia'|'visit'|'finish'|'album'|'album-visit'|'settings';
type Feedback={kind:'correct'|'incorrect';target:'paint'|'quiz'|'trivia';id:string;sequence:number};
const phaseNames:Record<UpdateStatus['phase'],string>={
  'local-only':'תוכן מקומי מוכן · מקור עדכונים טרם הוגדר',idle:'מוכן',checking:'בודקים עדכונים…',downloading:'מורידים תוכן חדש…',ready:'תוכן חדש מוכן לסבב הבא',updated:'התוכן עודכן', 'up-to-date':'הגרסה מעודכנת',offline:'אין רשת · ממשיכים עם התוכן המקומי',error:'העדכון לא הושלם · התוכן הקיים זמין', 'requires-app-update':'התוכן החדש דורש עדכון של האפליקציה',
};

export default function App() {
  const [saved,setSaved]=useState(readSavedState);
  const [catalog,setCatalog]=useState<Country[]>(bundledCountries);
  const active=bundledCountries.find(c=>c.id===saved.session.activeCountryId);
  const [country,setCountry]=useState<Country|null>(active||null);
  const [screen,setScreen]=useState<Screen>(active?(saved.session.stage||'paint'):'home');
  const [painted,setPainted]=useState<string[]>(saved.session.paintedRegionIds||[]);
  const [selected,setSelected]=useState<number|null>(null);
  const [message,setMessage]=useState('');
  const [answers,setAnswers]=useState<Country[]>(active?makeAnswers(active,bundledCountries):[]);
  const [feedback,setFeedback]=useState<Feedback|null>(null);
  const [flagCelebration,setFlagCelebration]=useState<number|null>(null);
  const [answerPending,setAnswerPending]=useState(false);
  const [resetAlbumPending,setResetAlbumPending]=useState(false);
  const [albumBackup,setAlbumBackup]=useState<AlbumRecord[]|null>(null);
  const [albumContinentId,setAlbumContinentId]=useState<string|null>(null);
  const [photoIndex,setPhotoIndex]=useState(saved.session.photoIndex||0);
  const [isPlaying,setIsPlaying]=useState(false);
  const [musicError,setMusicError]=useState(false);
  const [photoError,setPhotoError]=useState(false);
  const [triviaOpen,setTriviaOpen]=useState(false);
  const [updateStatus,setUpdateStatus]=useState(getUpdateStatus);
  const [scale,setScale]=useState(()=>Math.min(window.innerWidth/1600,window.innerHeight/900));
  const [storageWarning,setStorageWarning]=useState(false);
  const audio=useRef<HTMLAudioElement|null>(null);
  const visitMusic=useRef<VisitMusic|null>(null);
  const startMusicOnVisible=useRef(false);
  const feedbackTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const answerTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const celebrationTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const celebrationSequence=useRef(0);
  const feedbackSequence=useRef(0);
  const answerLocked=useRef(false);
  const savedRef=useRef(saved);savedRef.current=saved;
  const settings=saved.settings;
  const visitedIds=new Set(saved.album.map(record=>record.countryId));
  const flagColors=country?flagPalette(country.flag.regions):[];
  const selectedColor=flagColors.find(p=>p.id===selected);
  const completed=Boolean(country&&country.flag.regions.every(r=>painted.includes(r.id)));
  const inVisit=screen==='visit'||screen==='album-visit';

  useEffect(()=>{setStorageWarning(!writeSavedState(saved));},[saved]);
  useEffect(()=>{
    const resize=()=>setScale(Math.min(window.innerWidth/1600,window.innerHeight/900));
    window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);
  },[]);

  const loadCatalog=useCallback(async(restore=false)=>{
    try {
      const response=await fetch('./content/catalog.json',{cache:'no-store'});
      const data=await response.json();
      const valid=parseCatalogue(data);
      if(!valid)return;
      setCatalog(previous=>{const merged=new Map(previous.map(c=>[c.id,c]));for(const item of valid)merged.set(item.id,item);return [...merged.values()];});
      const session=savedRef.current.session;
      if(restore&&session.activeCountryId){
        const restored=valid.find(c=>c.id===session.activeCountryId)||bundledCountries.find(c=>c.id===session.activeCountryId);
        if(restored){setCountry(restored);setPainted(session.paintedRegionIds||[]);setPhotoIndex(session.photoIndex||0);setAnswers(makeAnswers(restored,[...valid,...bundledCountries.filter(c=>!valid.some(v=>v.id===c.id))]));setScreen(session.stage||'paint');}
      }else if(!session.activeCountryId)setCountry(current=>current?valid.find(c=>c.id===current.id)||current:null);
    } catch { /* The bundled catalogue always remains playable. */ }
  },[]);

  useEffect(()=>{
    let cancelled=false;
    void setRoundActive(Boolean(savedRef.current.session.activeCountryId));
    const unsubscribe=subscribeToUpdateStatus(status=>{if(!cancelled)setUpdateStatus(status);});
    const contentUpdated=()=>void loadCatalog();
    window.addEventListener('journey:content-updated',contentUpdated);
    void initializeOfflineSupport().then(()=>{if(!cancelled){void loadCatalog(true);void checkForUpdates();}});
    return()=>{cancelled=true;unsubscribe();window.removeEventListener('journey:content-updated',contentUpdated);};
  },[loadCatalog]);

  useEffect(()=>{void setRoundActive(Boolean(saved.session.activeCountryId)||screen==='album-visit');},[screen,saved.session.activeCountryId]);
  useEffect(()=>{
    setMessage('');setFeedback(null);setFlagCelebration(null);setAnswerPending(false);answerLocked.current=false;setResetAlbumPending(false);setTriviaOpen(false);
    return()=>{clearTimeout(feedbackTimer.current);clearTimeout(answerTimer.current);clearTimeout(celebrationTimer.current);stopFeedbackSounds();stopCompletionSound();};
  },[screen]);
  useEffect(()=>{
    setIsPlaying(false);setMusicError(false);startMusicOnVisible.current=false;
    if(!inVisit||!country)return;
    const player=new Audio(country.music.src);player.loop=true;player.volume=savedRef.current.settings.musicVolume;audio.current=player;
    const music=createVisitMusic(player,state=>{setIsPlaying(state.playing||state.pending);setMusicError(state.unavailable);});
    visitMusic.current=music;
    if(document.hidden)startMusicOnVisible.current=true;
    else music.start();
    const retry=(event:Event)=>{
      if(document.hidden||!event.isTrusted)return;
      // The music control handles its own gesture, so an unlock cannot turn its start into a stop.
      if(event.target instanceof Element&&event.target.closest('.music-button'))return;
      music.retryOnInteraction();
    };
    document.addEventListener('pointerdown',retry);
    document.addEventListener('keydown',retry);
    return()=>{
      document.removeEventListener('pointerdown',retry);document.removeEventListener('keydown',retry);
      music.dispose();player.src='';
      if(visitMusic.current===music){visitMusic.current=null;audio.current=null;startMusicOnVisible.current=false;}
    };
  },[screen,inVisit,country?.id,country?.music.src,updateStatus.contentVersion]);
  useEffect(()=>{if(audio.current)audio.current.volume=settings.musicVolume;},[settings.musicVolume]);
  useEffect(()=>{
    const pause=()=>{startMusicOnVisible.current=false;visitMusic.current?.stop();stopFeedbackSounds();clearCelebration();};
    const visibility=()=>{if(document.hidden)pause();else if(startMusicOnVisible.current){startMusicOnVisible.current=false;visitMusic.current?.start();}};
    document.addEventListener('visibilitychange',visibility);window.addEventListener('journey:pause',pause);
    return()=>{document.removeEventListener('visibilitychange',visibility);window.removeEventListener('journey:pause',pause);};
  },[]);
  useEffect(()=>{setPhotoError(false);},[country?.id]);
  useEffect(()=>{setTriviaOpen(false);},[country?.id]);
  useEffect(()=>{setPhotoError(false);},[photoIndex]);

  function showFeedback(kind:Feedback['kind'],target:Feedback['target'],id:string) {
    clearTimeout(feedbackTimer.current);
    const sequence=++feedbackSequence.current;
    setFeedback({kind,target,id,sequence});playFeedback(kind);
    feedbackTimer.current=setTimeout(()=>setFeedback(current=>current?.sequence===sequence?null:current),kind==='correct'?1000:450);
  }

  function clearCelebration() {
    clearTimeout(celebrationTimer.current);setFlagCelebration(null);stopCompletionSound();
  }
  function celebrateCompletion() {
    clearTimeout(celebrationTimer.current);
    clearTimeout(feedbackTimer.current);setFeedback(null);stopFeedbackSounds();
    const sequence=++celebrationSequence.current;
    setFlagCelebration(sequence);
    playCompletionSound();
    celebrationTimer.current=setTimeout(()=>setFlagCelebration(current=>current===sequence?null:current),FLAG_CELEBRATION_DURATION);
  }

  function filterCountries(continentId?:string) {
    return catalog.filter(c=>(!continentId||c.continentId===continentId)&&(settings.countryGroup==='all'||settings.countryGroup==='famous'&&c.familiarity==='familiar'||settings.countryGroup==='less-known'&&c.familiarity==='explore'||settings.countryGroup==='personal'&&settings.selectedCountryIds.includes(c.id)));
  }
  function startCountry(continentId:string) {
    const next=chooseUnvisitedCountry(filterCountries(continentId),visitedIds);
    if(!next){openAlbum(continentId);return;}
    beginCountry(next);
  }
  function beginCountry(next:Country) {
    setCountry(next);setPainted([]);setSelected(null);setAnswers(makeAnswers(next,catalog));setPhotoIndex(0);setScreen('paint');
    setSaved(state=>({...state,session:{...state.session,continentId:next.continentId,activeCountryId:next.id,stage:'paint',paintedRegionIds:[],photoIndex:0,triviaProgress:undefined}}));
  }
  function resumeRound() {
    const resume=catalog.find(c=>c.id===saved.session.activeCountryId);if(!resume)return;
    setCountry(resume);setPainted(saved.session.paintedRegionIds||[]);setSelected(null);setPhotoIndex(saved.session.photoIndex||0);setAnswers(makeAnswers(resume,catalog));setScreen(saved.session.stage||'paint');
  }
  function paintRegion(id:string,matching:boolean) {
    if(!country||painted.includes(id))return;
    if(!matching){setMessage(selected?'':'בחרו צבע');showFeedback('incorrect','paint',id);return;}
    const next=acceptRegion(painted,id,selected,country.flag.regions);
    if(next.length===painted.length)return;
    setPainted(next);setMessage('');showFeedback('correct','paint',id);
    // Only an accepted final touch earns this reward; restoring a finished flag does not.
    if(!completed&&country.flag.regions.every(region=>next.includes(region.id)))celebrateCompletion();
    setSaved(state=>({...state,session:{...state.session,paintedRegionIds:next}}));
  }
  function toQuiz(){clearCelebration();setScreen('quiz');setSaved(state=>({...state,session:{...state.session,stage:'quiz'}}));}
  function answer(id:string) {
    if(!country||answerLocked.current)return;
    if(id!==country.id){showFeedback('incorrect','quiz',id);return;}
    answerLocked.current=true;setAnswerPending(true);showFeedback('correct','quiz',id);
    const hasTrivia=Boolean((country.trivia??countryTrivia[country.id])?.length);
    setSaved(state=>afterCountryIdentification(state,hasTrivia));
    answerTimer.current=setTimeout(()=>{setPhotoIndex(0);setScreen(hasTrivia?'trivia':'visit');},1000);
  }
  function saveTriviaProgress(progress:TriviaRound){setSaved(state=>saveJourneyTrivia(state,progress));}
  function toPhotos(){
    if(!savedRef.current.session.triviaProgress?.complete)return;
    clearCelebration();clearTriviaFeedback();setPhotoIndex(0);
    setSaved(startJourneyPhotos);setScreen('visit');
  }
  function nextPhoto(){if(!country)return;const next=(photoIndex+1)%country.photos.length;setPhotoIndex(next);if(screen==='visit')setSaved(state=>({...state,session:{...state.session,photoIndex:next}}));}
  function toggleMusic(){startMusicOnVisible.current=false;visitMusic.current?.toggle();}
  function clearTriviaFeedback(){clearTimeout(feedbackTimer.current);setFeedback(null);}
  function toggleTrivia(){clearCelebration();clearTriviaFeedback();setTriviaOpen(current=>!current);}
  function finishVisit(){startMusicOnVisible.current=false;visitMusic.current?.stop();setSaved(state=>({...state,session:{continentId:country?.continentId,lastCountryId:country?.id,paintedRegionIds:[]}}));setScreen('finish');}
  function goHome(){clearCelebration();startMusicOnVisible.current=false;visitMusic.current?.stop();setScreen('home');}
  function openAlbum(continentId:string|null=null){setAlbumContinentId(continentId);setScreen('album');}
  function openAlbumCountry(item:Country){setCountry(item);setPhotoIndex(0);setScreen('album-visit');}
  function resetAlbum(){setAlbumBackup(structuredClone(saved.album));setSaved(clearAlbum);setResetAlbumPending(false);}
  function undoAlbumReset(){if(!albumBackup)return;setSaved(state=>restoreAlbum(state,albumBackup));setAlbumBackup(null);}
  function updateSettings(patch:Partial<GameSettings>){setSaved(state=>({...state,settings:{...state.settings,...patch}}));}
  useEffect(()=>{const back=()=>{clearCelebration();startMusicOnVisible.current=false;visitMusic.current?.stop();setScreen(current=>current==='album-visit'?'album':'home');};window.addEventListener('journey:back',back);return()=>window.removeEventListener('journey:back',back);},[]);
  async function fullScreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{/* The native host already uses a full screen. */}}
  const photo=country?.photos[photoIndex%Math.max(1,country.photos.length)];
  const triviaQuestions=country?(country.trivia??countryTrivia[country.id]??[]):[];
  const currentContinentComplete=country?continentProgress(filterCountries(country.continentId),visitedIds).complete:false;

  return <div className="device-viewport"><div className={`app-stage ${settings.reduceMotion?'reduce-motion':''}`} style={{transform:`translate(-50%, -50%) scale(${scale})`}} dir="rtl">
    <header className="app-header">
      <button className="brand" onClick={goHome} aria-label="מסע בעולם — למסך הראשי"><span className="brand-mark"><Icon name="globe" size={29}/></span><span>מסע בעולם</span></button>
      {['paint','quiz','trivia','visit'].includes(screen)&&<div className="steps" aria-label="שלבי המסע">{['צובעים','מגלים','טריוויה','מטיילים'].map((label,index)=><span key={label} className={index===(['paint','quiz','trivia','visit'].indexOf(triviaOpen?'trivia':screen))?'current':''}><b>{index+1}</b>{label}</span>)}</div>}
      <div className="header-actions">
        {screen==='home'&&<button className="quiet-button" onClick={()=>openAlbum()}><Icon name="album"/>האלבום שלי{saved.album.length>0&&<span className="count-badge">{saved.album.length}</span>}</button>}
        {screen!=='home'&&<button className="quiet-button" onClick={goHome}><Icon name="home"/>ליבשות</button>}
      </div>
    </header>

    <main className={`main-content screen-${screen}`}>
      {screen==='home'&&<>
        <div className="home-intro"><h1>לאן נטייל?</h1>{saved.session.activeCountryId&&<button className="resume-button" onClick={resumeRound}><Icon name="refresh" size={22}/>ממשיכים במשחק<Icon name="arrow" size={22}/></button>}</div>
        <section className="continent-grid" aria-label="בחירת יבשת">{continents.map(item=>{
          const progress=continentProgress(filterCountries(item.id),visitedIds);const available=progress.total>0;const hasContent=catalog.some(c=>c.continentId===item.id);
          return <button key={item.id} className={`continent-card ${available?'':'unavailable'} ${progress.complete?'completed':''}`} style={{'--continent-accent':item.accent} as CSSProperties} onClick={()=>progress.complete?openAlbum(item.id):startCountry(item.id)} disabled={!available} aria-label={`${item.name}, ביקרנו ב־${progress.visited} מתוך ${progress.total} מדינות${progress.complete?', היבשת הושלמה. לפתיחת האלבום':!available?hasContent?', אין מדינות בבחירה הנוכחית':', תוכן יתווסף בהמשך':''}`}><ContinentArt id={item.id} accent={item.accent}/><span className="continent-copy"><strong>{item.name}</strong><span className="continent-progress-count" dir="ltr">{progress.visited}/{progress.total}</span>{!available&&<small>{hasContent?'לא נבחרו מדינות':'בקרוב'}</small>}</span>{progress.complete?<span className="continent-complete-mark"><Icon name="check" size={112}/></span>:available&&<span className="card-arrow"><Icon name="arrow" size={22}/></span>}</button>;
        })}</section>
        {filterCountries().length===0&&<p className="empty-selection">בחרו מדינות בהגדרות</p>}
      </>}

      {screen==='paint'&&country&&<>
        <div className="screen-heading"><h1>{completed?'הדגל מוכן!':'צובעים את הדגל'}</h1>{!completed&&<p aria-live="polite">{message|| (selectedColor?`געו במשטח עם מספר ${selectedColor.number}`:'בחרו צבע')}</p>}</div>
        <section className="painting-layout"><div className="flag-card"><FlagBoard country={country} painted={painted} selected={selected} onPaint={paintRegion} complete={completed} reduceMotion={settings.reduceMotion} wrongRegionId={feedback?.kind==='incorrect'&&feedback.target==='paint'?feedback.id:undefined} feedbackSequence={feedback?.sequence}/></div></section>
        {completed?<div className="painting-continue"><button className="primary-button" onClick={toQuiz}>המשך<Icon name="arrow"/></button></div>:<div className={`palette-row ${flagColors.length>6?'many-colors':''}`} aria-label="בחירת צבע">{flagColors.map(color=><button key={color.id} className={`color-button ${selected===color.id?'selected':''}`} style={{background:color.hex,color:[3,5,7,10].includes(color.id)?'#243E38':'#FFFFFF'}} onClick={()=>{setSelected(color.id);setMessage('');}} aria-pressed={selected===color.id} aria-label={`${color.name}, מספר ${color.number}`}><b>{color.number}</b></button>)}</div>}
      </>}

      {screen==='quiz'&&country&&<>
        <div className="screen-heading quiz-heading"><h1>לאיזו מדינה שייך הדגל?</h1></div>
        <section className="quiz-layout"><div className="quiz-flag"><FlagBoard country={country} complete/></div><div className="answer-grid">{answers.map((option,index)=>{
          const wrong=feedback?.kind==='incorrect'&&feedback.target==='quiz'&&feedback.id===option.id;
          return <button key={option.id} className={`answer-button answer-${index} ${wrong?'wrong-answer':''}`} style={wrong&&!settings.reduceMotion?{animationName:feedback.sequence%2?'wrong-answer-a':'wrong-answer-b'}:undefined} disabled={answerPending} onClick={()=>answer(option.id)}><span className="answer-decoration"><Icon name="globe" size={28}/></span><strong>{option.name}</strong></button>;
        })}</div></section>
      </>}

      {screen==='trivia'&&country&&<>
        <div className="visit-heading"><h1>{country.name}</h1><span className="country-mini-flag"><FlagBoard country={country} complete/></span></div>
        <div className="trivia-journey-layout"><CountryTrivia key={`${country.id}-journey`} questions={triviaQuestions} reduceMotion={settings.reduceMotion} initialQuestionIndex={saved.session.triviaProgress?.questionIndex} initialCorrectAnswerId={saved.session.triviaProgress?.correctAnswerId} initialComplete={saved.session.triviaProgress?.complete} feedback={feedback?.target==='trivia'?feedback:null} onFeedback={(kind,id)=>showFeedback(kind,'trivia',id)} onProgress={saveTriviaProgress} onComplete={celebrateCompletion} onAdvance={clearTriviaFeedback} onClose={toPhotos} closeLabel="לתמונות ולמוזיקה"/></div>
      </>}

      {inVisit&&country&&photo&&<>
        <div className="visit-heading"><h1>{country.name}</h1><span className="country-mini-flag"><FlagBoard country={country} complete/></span></div>
        <section className="visit-layout">{triviaOpen?<CountryTrivia key={country.id} questions={triviaQuestions} reduceMotion={settings.reduceMotion} feedback={feedback?.target==='trivia'?feedback:null} onFeedback={(kind,id)=>showFeedback(kind,'trivia',id)} onComplete={celebrateCompletion} onAdvance={clearTriviaFeedback} onClose={toggleTrivia}/>:<button className="photo-card" onClick={nextPhoto} aria-label={`${photo.caption}. לתמונה הבאה`}>
          <span className="photo-backdrop" style={{backgroundImage:`url(${photo.src})`}}/>
          {!photoError?<img key={photo.src} src={photo.src} alt={photo.caption} onError={()=>setPhotoError(true)}/>:<span className="photo-fallback"><JourneyGlobe small/><strong>התמונה אינה זמינה כרגע</strong></span>}
          <span className="photo-caption"><strong>{photo.caption}</strong><Icon name="arrow" size={26}/></span>
        </button>}<aside className="visit-sidebar"><div className={`music-card ${isPlaying?'playing':''}`}><span className="music-art"><Icon name="music" size={44}/><i/><i/><i/></span><button className={`music-button ${isPlaying?'playing':''}`} onClick={()=>void toggleMusic()} aria-pressed={isPlaying}><Icon name={isPlaying?'pause':'music'} size={25}/>{isPlaying?'עצירת מוזיקה':'מוזיקה'}</button>{musicError&&<small role="status">המוזיקה אינה זמינה כרגע</small>}</div>
          {!triviaOpen&&<div className="gallery-controls"><span className="photo-count">תמונה {photoIndex%country.photos.length+1} מתוך {country.photos.length}</span><PhotoProgress index={photoIndex%country.photos.length} total={country.photos.length}/></div>}
          {triviaQuestions.length>0&&<button className="secondary-button visit-trivia" onClick={toggleTrivia} aria-expanded={triviaOpen}><Icon name={triviaOpen?'album':'sparkle'}/>{triviaOpen?'לתמונות':'טריוויה'}</button>}
          {screen==='album-visit'&&<button className="secondary-button" onClick={()=>beginCountry(country)}><Icon name="refresh"/>משחק חוזר</button>}
          <button className="primary-button visit-done" onClick={screen==='album-visit'?()=>setScreen('album'):finishVisit}><Icon name="album"/>{screen==='album-visit'?'לאלבום':'סיום הביקור'}</button>
        </aside></section>
      </>}

      {screen==='finish'&&country&&<section className="finish-screen"><span className="finish-check"><Icon name="check" size={48}/></span><h1>{country.name} באלבום!</h1><div className="finished-postcard"><FlagBoard country={country} complete/><strong>{country.name}</strong></div><div className="finish-actions"><button className="primary-button" onClick={()=>startCountry(country.continentId)}>{currentContinentComplete?'לאלבום':'עוד מדינה'}<Icon name={currentContinentComplete?'album':'arrow'}/></button><button className="secondary-button" onClick={goHome}>ליבשות<Icon name="home"/></button></div><button className="text-button" onClick={()=>openAlbum()}>האלבום שלי<Icon name="album" size={20}/></button></section>}

      {screen==='album'&&<>
        <div className="album-heading"><h1>האלבום שלי</h1><div className="album-heading-actions">{albumContinentId&&<button className="quiet-button" onClick={()=>setAlbumContinentId(null)}><Icon name="globe" size={21}/>כל היבשות</button>}{saved.album.length>0&&<button className="text-button reset-album-button" onClick={()=>setResetAlbumPending(true)}><Icon name="refresh" size={20}/>איפוס האלבום</button>}</div></div>
        {albumBackup&&<div className="album-reset-status" role="status"><span>האלבום אופס</span><button className="text-button" onClick={undoAlbumReset}>ביטול האיפוס</button></div>}
        <JourneyAlbum catalog={catalog} eligible={filterCountries()} visitedIds={visitedIds} continentId={albumContinentId} onOpen={openAlbumCountry} onReplay={beginCountry}/>
        {resetAlbumPending&&<div className="dialog-backdrop"><section className="album-reset-dialog" role="alertdialog" aria-modal="true" aria-labelledby="reset-album-title"><Icon name="album" size={48}/><h2 id="reset-album-title">לאפס את האלבום?</h2><div><button className="secondary-button" autoFocus onClick={()=>setResetAlbumPending(false)}>ביטול</button><button className="primary-button" onClick={resetAlbum}>איפוס האלבום</button></div></section></div>}
      </>}

      {screen==='settings'&&<>
        <div className="screen-heading compact"><h1>הגדרות</h1></div>
        <div className="settings-scroll"><section className="settings-section"><h2>אילו מדינות יופיעו?</h2><div className="group-options">{([['famous','מדינות מפורסמות'],['less-known','מדינות פחות מפורסמות'],['all','כל מדינות הבדיקה'],['personal','בחירה אישית']] as const).map(([value,label])=><button key={value} className={`setting-choice ${settings.countryGroup===value?'active':''}`} aria-pressed={settings.countryGroup===value} onClick={()=>updateSettings({countryGroup:value})}>{label}{settings.countryGroup===value&&<Icon name="check" size={20}/>}</button>)}</div>{settings.countryGroup==='personal'&&<div className="personal-countries">{catalog.map(item=><button key={item.id} className={`setting-choice ${settings.selectedCountryIds.includes(item.id)?'active':''}`} aria-pressed={settings.selectedCountryIds.includes(item.id)} onClick={()=>updateSettings({selectedCountryIds:settings.selectedCountryIds.includes(item.id)?settings.selectedCountryIds.filter(id=>id!==item.id):[...settings.selectedCountryIds,item.id]})}>{item.name}{settings.selectedCountryIds.includes(item.id)&&<Icon name="check" size={20}/>}</button>)}</div>}</section>
          <section className="settings-section settings-two-col"><div><h2>מוזיקה</h2><label className="range-setting">עוצמת המוזיקה <strong>{Math.round(settings.musicVolume*100)}%</strong><input aria-label="עוצמת מוזיקה" type="range" min={0} max={1} step={.05} value={settings.musicVolume} onChange={event=>updateSettings({musicVolume:Number(event.target.value)})}/></label></div><div><h2>תנועה</h2><label className="toggle-setting"><input type="checkbox" checked={settings.reduceMotion} onChange={event=>updateSettings({reduceMotion:event.target.checked})}/><span>תנועה מצומצמת</span></label></div></section>
          <section className="settings-section update-section"><div><h2>תוכן ועדכונים</h2><p className="update-message" role="status">{phaseNames[updateStatus.phase]}</p><p>אפליקציה {updateStatus.appVersion} · תוכן {updateStatus.contentVersion}<br/>{window.WorldGameNative?'התוכן הבסיסי שמור במכשיר':updateStatus.offlineReady?'מוכן לבדיקה במחשב ללא רשת':'להכנת בדיקה ללא רשת: הריצו את גרסת הבנייה במחשב'}</p>{updateStatus.totalFiles!==undefined&&updateStatus.phase==='downloading'&&<p>{updateStatus.downloadedFiles||0} מתוך {updateStatus.totalFiles} קבצים</p>}</div><div><button className="secondary-button" onClick={()=>void checkForUpdates(true)} disabled={['checking','downloading'].includes(updateStatus.phase)}><Icon name="refresh"/>בדיקת עדכונים</button>{updateStatus.appUpdateAvailable&&<button className="primary-button" onClick={()=>requestAppUpdate()}><Icon name="download"/>עדכון לגרסה {updateStatus.newAppVersion}</button>}<button className="text-button" onClick={()=>void fullScreen()}><Icon name="fullscreen" size={20}/>תצוגה במסך מלא</button></div></section>
          <section className="settings-section"><h2>על התמונות והמוזיקה</h2><p>המוזיקה נוצרה ב־Suno עבור המשחק.</p><details><summary>מקורות התמונות והצלילים</summary><div className="credits-list"><p>צליל הניצחון סופק על ידי בעל הפרויקט.</p>{catalog.map(item=><div key={item.id}><h3>{item.name}</h3>{item.photos.map(p=><p key={p.id}>{p.caption} — {p.creator} · <a href={p.sourceURL} target="_blank" rel="noreferrer">מקור</a> · {p.license}</p>)}</div>)}</div></details></section>
        </div><div className="settings-bottom"><button className="primary-button" onClick={goHome}><Icon name="check"/>חזרה למשחק</button></div>
      </>}
    </main>
    <footer className="app-footer"><div>{storageWarning&&<span className="storage-warning" role="status">השמירה אינה זמינה כרגע</span>}<button className="caregiver-button" onClick={()=>setScreen('settings')}><Icon name="settings" size={22}/>הגדרות</button></div></footer>
    <FlagCelebration active={flagCelebration!==null} sequence={flagCelebration||0} reduceMotion={settings.reduceMotion} label={screen==='paint'?'הדגל מוכן! זיקוקים וצליל ניצחון':'כל הכבוד! הטריוויה הושלמה. זיקוקים וצליל ניצחון'}/>
    <FeedbackOverlay active={feedback?.kind==='correct'&&(feedback.target!=='paint'||!completed)} sequence={feedback?.sequence||0} reduceMotion={settings.reduceMotion}/>
  </div></div>;
}
