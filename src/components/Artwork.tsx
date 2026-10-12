import type { CSSProperties } from 'react';

export type IconName = 'globe'|'arrow'|'album'|'help'|'close'|'home'|'music'|'pause'|'settings'|'check'|'download'|'volume'|'back'|'refresh'|'sparkle'|'fullscreen'|'heart';
export function Icon({name, size=24, className=''}:{name:IconName,size?:number,className?:string}) {
  const paths:Record<IconName, React.ReactNode> = {
    globe: <><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 7h14M5 17h14"/></>,
    arrow: <><path d="M19 12H5m6-6-6 6 6 6"/></>,
    back: <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
    album: <><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 3v18M12 8h4M12 12h4"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 .4c0 1.9-2.5 1.8-2.5 3.6M12 17h.01"/></>,
    close: <path d="m6 6 12 12M6 18 18 6"/>,
    home: <><path d="m3 11 9-8 9 8M5 10v10h5v-6h4v6h5V10"/></>,
    music: <><path d="M9 18V5l11-2v13M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/></>,
    pause: <><path d="M8 5v14M16 5v14" strokeWidth="4"/></>,
    settings: <><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m-12.8 0 2.1-2.1m8.6-8.6 2.1-2.1"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/></>,
    volume: <><path d="m11 4-6 5H2v6h3l6 5V4ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.2 7a8 8 0 0 1 13.6-1L20 8M4 16l1.2 2a8 8 0 0 0 13.6-1"/></>,
    sparkle: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/></>,
    fullscreen: <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>{paths[name]}</svg>;
}

export function JourneyGlobe({small=false}:{small?:boolean}) {
  return <svg className={`journey-globe ${small?'small':''}`} viewBox="0 0 500 360" fill="none" aria-hidden="true">
    <defs><linearGradient id="ocean" x1="170" y1="80" x2="350" y2="290" gradientUnits="userSpaceOnUse"><stop stopColor="#E3EDE5"/><stop offset="1" stopColor="#B7D1C8"/></linearGradient></defs>
    <circle cx="260" cy="175" r="143" fill="#EAE5D9" opacity=".7"/>
    <ellipse cx="260" cy="312" rx="124" ry="14" fill="#DADFD5"/>
    <g transform="rotate(-12 260 175)">
      <circle cx="260" cy="175" r="120" fill="url(#ocean)" stroke="#8EAFA3" strokeWidth="2"/>
      <ellipse cx="260" cy="175" rx="56" ry="120" stroke="#8EAFA3" strokeWidth="1.6" opacity=".55"/>
      <path d="M146 138h227M140 185h240M154 234h211" stroke="#8EAFA3" strokeWidth="1.6" opacity=".55"/>
      <path d="m180 83 18-9 29 4 13 19-11 14-3 25-27 1-4 25-19-4-5-25-17-12 8-23Z" fill="#6F9D87"/>
      <path d="m188 178 30-6 19 14 1 31-13 19-3 25-17 13-12-19 4-26-13-19Z" fill="#6F9D87"/>
      <path d="m263 101 23-17 35 10 18 13 13 26-16 13-21-7-13 20-19-10-13-14-20 4-6-15Z" fill="#6F9D87"/>
      <path d="m273 154 25 1 17 20-1 26-21 20-18-13-4-20-12-19Z" fill="#6F9D87"/>
      <path d="m319 229 26-9 16 15-4 20-27 4-16-15Z" fill="#6F9D87"/>
    </g>
    <path d="M117 209C57 190 99 66 269 51s201 96 103 170" stroke="#B5966B" strokeWidth="2" strokeDasharray="5 8" strokeLinecap="round"/>
    <g transform="translate(386 74) rotate(18)"><path d="m0 0-34 16 19 6 4 19 11-41Z" fill="#174B4A"/><path d="m-15 22 15-22" stroke="#F8F5EF" strokeWidth="2"/></g>
    <g transform="translate(73 190) rotate(-10)"><rect width="89" height="68" rx="12" fill="#FFFDF7" stroke="#E7DECD" strokeWidth="2"/><rect x="12" y="12" width="65" height="38" rx="4" fill="#D6E5DA"/><path d="m12 45 18-19 14 13 12-14 21 20" fill="#7EAD91"/><circle cx="61" cy="22" r="6" fill="#E8BD71"/><path d="M24 59h40" stroke="#D3C8B4" strokeWidth="2"/></g>
    <g transform="translate(360 227) rotate(12)"><rect width="85" height="66" rx="12" fill="#FFFDF7" stroke="#E7DECD" strokeWidth="2"/><rect x="12" y="12" width="61" height="33" rx="3" fill="#E9D7C4"/><path d="M33 45 40 16l7 29m-21-8h28M36 28h9" stroke="#9D8061" strokeWidth="3"/><path d="M25 54h36" stroke="#D3C8B4" strokeWidth="2"/></g>
    <path d="m108 65 3 10 10 3-10 3-3 10-3-10-10-3 10-3Z" fill="#D1AA6C"/>
    <path d="m418 185 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" fill="#D1AA6C"/>
    <circle cx="155" cy="295" r="5" fill="#C3916F"/><circle cx="353" cy="44" r="4" fill="#C3916F"/>
  </svg>;
}

const landPaths:Record<string,string> = {
  europe:'M60 40 76 23 98 24 111 40 98 52 120 60 116 75 98 79 95 98 80 84 63 91 48 76 34 72 42 55Z',
  asia:'M27 41 56 21 109 23 140 42 132 66 106 64 104 88 85 100 74 77 52 77 50 62 29 60Z',
  africa:'M61 22 98 25 116 49 105 70 94 85 83 107 69 92 59 67 39 51 45 33Z',
  'north-america':'M30 23 94 20 123 35 109 58 85 65 75 82 92 95 82 105 66 82 51 73 39 53 23 40Z',
  'south-america':'M56 19 96 31 118 55 103 74 94 94 82 110 71 99 72 78 61 61 43 42Z',
  oceania:'M49 54 79 41 112 46 128 66 112 85 80 88 52 74Z M131 87 141 78 147 91 138 105 129 101Z',
};
export function ContinentArt({id,accent}:{id:string,accent:string}) {
  return <svg viewBox="0 0 170 130" className="continent-art" aria-hidden="true" style={{'--art-color':accent} as CSSProperties}>
    <circle cx="86" cy="64" r="50" fill="currentColor" opacity=".09"/><path d={landPaths[id]||landPaths.asia} fill="currentColor" opacity=".8"/>
    <path d="M20 89c25 13 87 11 127-20" fill="none" stroke="currentColor" opacity=".4" strokeWidth="1.5" strokeDasharray="4 5"/><circle cx="113" cy="51" r="6" fill="#F8F5EF"/><circle cx="113" cy="51" r="3" fill="currentColor"/>
  </svg>;
}
