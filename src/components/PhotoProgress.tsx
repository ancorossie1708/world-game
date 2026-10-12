import './photo-progress.css';

export function PhotoProgress({index,total}:{index:number;total:number}) {
  return <div className="photo-progress" role="progressbar" aria-label="התקדמות בין התמונות" aria-valuemin={1} aria-valuemax={total} aria-valuenow={index+1}>
    <span style={{width:`${(index+1)/total*100}%`}}/>
  </div>;
}
