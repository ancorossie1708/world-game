import { countryTrivia, type TriviaQuestion } from './trivia.ts';

export type ContinentId = 'europe' | 'asia' | 'africa' | 'north-america' | 'south-america' | 'oceania';
export type Familiarity = 'familiar' | 'explore';
export type ColorId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface PaletteColor { id: ColorId; name: string; hex: string; }
export interface Continent { id: ContinentId; name: string; subtitle: string; emoji: string; enabled: boolean; accent: string; }
export interface FlagRegion { id: string; path: string; colorId: ColorId; labelX: number; labelY: number; fillRule?: 'evenodd' | 'nonzero'; hitPath?: string; }
export interface FlagDecoration { path: string; fill: string; stroke?: string; strokeWidth?: number; fillRule?: 'evenodd' | 'nonzero'; }
export interface Flag {
  viewBox: string;
  bounds: { x: number; y: number; width: number; height: number };
  regions: FlagRegion[];
  prepaintedPaths?: FlagDecoration[];
}
export interface Photo {
  id: string;
  src: string;
  caption: string;
  category: 'landscape' | 'landmark' | 'capital' | 'city';
  sourceURL: string;
  creator: string;
  license: string;
  licenseURL: string;
  changes: string;
}
export interface Music {
  src: string;
  title: string;
  inspiration: string;
  creator: string;
  license: string;
}
export interface Country {
  id: string;
  name: string;
  capital: string;
  continentId: ContinentId;
  familiarity: Familiarity;
  accent: string;
  emoji: string;
  flag: Flag;
  photos: Photo[];
  music: Music;
  trivia?: readonly TriviaQuestion[];
}

// Color IDs stay stable; displayed numbers are assigned separately for each flag.
export const palette: PaletteColor[] = [
  { id: 1, name: 'אדום', hex: '#E74C4C' },
  { id: 2, name: 'כחול', hex: '#2674D9' },
  { id: 3, name: 'לבן', hex: '#FFFFFF' },
  { id: 4, name: 'ירוק', hex: '#279967' },
  { id: 5, name: 'צהוב', hex: '#F5C842' },
  { id: 6, name: 'שחור', hex: '#26313C' },
  { id: 7, name: 'כתום', hex: '#ED8B35' },
  { id: 8, name: 'חום', hex: '#996344' },
  { id: 9, name: 'סגול', hex: '#8F69B5' },
  { id: 10, name: 'ורוד', hex: '#EBA2B5' },
];

export const continents: Continent[] = [
  { id: 'europe', name: 'אירופה', subtitle: 'ערים יפות ונופים ירוקים', emoji: '🏰', enabled: true, accent: '#50798A' },
  { id: 'asia', name: 'אסיה', subtitle: 'גנים, הרים ומקומות מוכרים', emoji: '🌸', enabled: true, accent: '#AE6B67' },
  { id: 'africa', name: 'אפריקה', subtitle: 'מדינות נוספות יגיעו בהמשך', emoji: '🌿', enabled: false, accent: '#AD8651' },
  { id: 'north-america', name: 'צפון אמריקה', subtitle: 'מדינות נוספות יגיעו בהמשך', emoji: '🍁', enabled: false, accent: '#698778' },
  { id: 'south-america', name: 'דרום אמריקה', subtitle: 'מדינות נוספות יגיעו בהמשך', emoji: '☀️', enabled: false, accent: '#AE856A' },
  { id: 'oceania', name: 'אוקיאניה', subtitle: 'מדינות נוספות יגיעו בהמשך', emoji: '🌊', enabled: false, accent: '#62899C' },
];

const standardBounds = { x: 0, y: 0, width: 900, height: 600 };
const rectangle = (id: string, x: number, y: number, width: number, height: number, colorId: ColorId): FlagRegion => ({
  id, path: `M${x} ${y}h${width}v${height}h-${width}Z`, colorId,
  labelX: x + width / 2, labelY: y + height / 2,
});
const photo = (countryId: string, category: Photo['category'], caption: string, filename: string, creator: string, license: string, licenseURL: string, assetKey: string = category): Photo => ({
  id: `${countryId}-${assetKey}`,
  src: `./content/photos/${countryId}-${assetKey}.jpg`, caption, category,
  sourceURL: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename.replaceAll(' ', '_'))}`,
  creator, license, licenseURL,
  changes: 'Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively.',
});
const cc = (version: string) => `https://creativecommons.org/licenses/by-sa/${version}/`;
const ccBy = (version: string) => `https://creativecommons.org/licenses/by/${version}/`;
const cc0 = 'https://creativecommons.org/publicdomain/zero/1.0/';
const music = (id: string, title: string, inspiration: string): Music => ({
  src: `./content/audio/${id}.wav`, title, inspiration,
  creator: 'World Game — original procedural composition', license: 'CC0-1.0',
});

export const countries: Country[] = [
  {
    id: 'japan', name: 'יפן', capital: 'טוקיו', continentId: 'asia', familiarity: 'familiar', accent: '#BC726A', emoji: '🌸',
    trivia: countryTrivia.japan,
    flag: {
      viewBox: '0 0 900 600', bounds: standardBounds,
      regions: [
        { id: 'white-field', path: 'M0 0H900V600H0Z M630 300A180 180 0 1 0 270 300A180 180 0 1 0 630 300Z', colorId: 3, labelX: 160, labelY: 300, fillRule: 'evenodd' },
        { id: 'red-disc', path: 'M630 300A180 180 0 1 1 270 300A180 180 0 1 1 630 300Z', colorId: 1, labelX: 450, labelY: 300 },
      ],
    },
    photos: [
      photo('japan', 'landscape', 'הר פוג׳י מעל אגם מוטוסו', 'Mount Fuji from Lake Motosu.jpg', 'Alpsdake', 'CC BY-SA 4.0', cc('4.0')),
      photo('japan', 'landmark', 'שערים אדומים במקדש פושימי אינארי', '20181110 Fushimi Inari Torii 4.jpg', 'Balon Greyjoy', 'CC0 1.0', cc0),
      photo('japan', 'capital', 'טוקיו — עיר הבירה', '新宿のスカイライン.JPG', 'keusju', 'CC BY-SA 3.0', cc('3.0')),
      photo("japan", "landscape", "ביתן הזהב והאגם בקיוטו", "Kinkaku-ji, Kyōto.jpg", "Renate Hano", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "landscape-2"),
      photo("japan", "landmark", "טירת הימג׳י הלבנה", "Himeji Castle 01s2048.jpg", "663highland", "CC BY 2.5", "https://creativecommons.org/licenses/by/2.5/", "landmark-2"),
      photo("japan", "capital", "טוקיו — הגשר אל ארמון הקיסר", "Imperial Palace Tokyo Nijubashi Bridge.JPG", "Chris 73 / Wikimedia Commons", "CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/", "capital-2"),
      {"id":"japan-arashiyama-bamboo","src":"./content/photos/japan-arashiyama-bamboo.jpg","caption":"קיוטו — יער הבמבוק","category":"landscape","sourceURL":"https://commons.wikimedia.org/wiki/File:Arashiyama_Bamboo_Forest%2C_Kyoto%2C_Japan_(Unsplash).jpg","creator":"Ståle Grut stalebg","license":"CC0 1.0","licenseURL":"https://creativecommons.org/publicdomain/zero/1.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"japan-hiroshima-castle","src":"./content/photos/japan-hiroshima-castle.jpg","caption":"הירושימה — הטירה והגן","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Hiroshima_Castle_-_panoramio_(1).jpg","creator":"RAKKO_TAKASAKA","license":"CC BY-SA 3.0","licenseURL":"https://creativecommons.org/licenses/by-sa/3.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"japan-kanazawa-garden","src":"./content/photos/japan-kanazawa-garden.jpg","caption":"קנאזאווה — גן קנרוקואן","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Hisagoike_Pond_in_Kenroku_Garden.JPG","creator":"そらみみ","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"japan-kyoto-kiyomizu","src":"./content/photos/japan-kyoto-kiyomizu.jpg","caption":"קיוטו — מקדש קיומיזו־דרה","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Kiyomizu-dera_Temple.Kyoto._Japan_(50361443956).jpg","creator":"Bernard Spragg. NZ from Christchurch, New Zealand","license":"CC0 1.0","licenseURL":"https://creativecommons.org/publicdomain/zero/1.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"japan-miyajima-torii","src":"./content/photos/japan-miyajima-torii.jpg","caption":"מיאג׳ימה — השער האדום בים","category":"landmark","sourceURL":"https://commons.wikimedia.org/wiki/File:Itsukushima_Gate.jpg","creator":"JordyMeow","license":"CC BY-SA 3.0","licenseURL":"https://creativecommons.org/licenses/by-sa/3.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"japan-nachi-waterfall","src":"./content/photos/japan-nachi-waterfall.jpg","caption":"מפל נאצ׳י והמקדש","category":"landscape","sourceURL":"https://commons.wikimedia.org/wiki/File:Three-storied_Pagoda_of_Seiganto-ji_and_Nachi_Falls.jpg","creator":"Alpsdake","license":"CC0 1.0","licenseURL":"https://creativecommons.org/publicdomain/zero/1.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"japan-nara-temple","src":"./content/photos/japan-nara-temple.jpg","caption":"נארה — מקדש טודאי־ג׳י","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Daibutsu-den_in_Todaiji_Nara01bs3200.jpg","creator":"663highland","license":"CC BY 2.5","licenseURL":"https://creativecommons.org/licenses/by/2.5/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"japan-nikko-shrine","src":"./content/photos/japan-nikko-shrine.jpg","caption":"ניקו — שער מקדש טושוגו","category":"landmark","sourceURL":"https://commons.wikimedia.org/wiki/File:Nikko_Toshogu_Yomeimon_gate_(9411949884).jpg","creator":"Maarten Heerlien from Voorschoten, The Netherlands","license":"CC BY 2.0","licenseURL":"https://creativecommons.org/licenses/by/2.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"japan-okinawa-coast","src":"./content/photos/japan-okinawa-coast.jpg","caption":"אוקינאווה — חוף ומים כחולים","category":"landscape","sourceURL":"https://commons.wikimedia.org/wiki/File:Cape_Manzamo.JPG","creator":"そらみみ","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"japan-osaka-castle","src":"./content/photos/japan-osaka-castle.jpg","caption":"אוסקה — הטירה והפארק","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Osaka_Castle_01bs3200.jpg","creator":"663highland","license":"CC BY 2.5","licenseURL":"https://creativecommons.org/licenses/by/2.5/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"japan-sakurajima","src":"./content/photos/japan-sakurajima.jpg","caption":"סאקורג׳ימה — הר געש מול המפרץ","category":"landscape","sourceURL":"https://commons.wikimedia.org/wiki/File:Sakurajima_view_from_Yoshino_Park.JPG","creator":"Sakoppi","license":"CC BY 3.0","licenseURL":"https://creativecommons.org/licenses/by/3.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"japan-sapporo","src":"./content/photos/japan-sapporo.jpg","caption":"סאפורו — מגדל השעון","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Sapporo_Clock_Tower_20110719.jpg","creator":"Shift","license":"CC BY-SA 3.0","licenseURL":"https://creativecommons.org/licenses/by-sa/3.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"japan-tokyo-shibuya","src":"./content/photos/japan-tokyo-shibuya.jpg","caption":"טוקיו — שיבויה באורות הלילה","category":"capital","sourceURL":"https://commons.wikimedia.org/wiki/File:Shibuya_Crossing%2C_Aerial.jpg","creator":"David Kernan","license":"CC BY 4.0","licenseURL":"https://creativecommons.org/licenses/by/4.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"japan-yokohama-port","src":"./content/photos/japan-yokohama-port.jpg","caption":"יוקוהמה — העיר והנמל","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Minato_Mirai_21_From_Osambashi_202403.jpg","creator":"Sunwater~jawiki","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
    ],
    music: {"src":"./content/audio/japan.mp3","title":"מסע ביפן","inspiration":"קטע שנוצר ב-Suno עבור יפן","creator":"נוצר ב-Suno וסופק על ידי בעל הפרויקט","license":"פרטי רישיון והפצה טרם נמסרו"},
  },
  {
    id: 'france', name: 'צרפת', capital: 'פריז', continentId: 'europe', familiarity: 'familiar', accent: '#6A87AD', emoji: '🗼',
    trivia: countryTrivia.france,
    flag: { viewBox: '0 0 900 600', bounds: standardBounds, regions: [rectangle('blue-band', 0, 0, 300, 600, 2), rectangle('white-band', 300, 0, 300, 600, 3), rectangle('red-band', 600, 0, 300, 600, 1)] },
    photos: [
      photo('france', 'landscape', 'לבנדר בפרובאנס', 'Lavender, Provence, France (6053005452).jpg', 'Michal Osmenda', 'CC BY-SA 2.0', cc('2.0')),
      photo('france', 'landmark', 'מגדל אייפל בפריז', 'Tour Eiffel Wikimedia Commons.jpg', 'Benh LIEU SONG', 'CC BY-SA 3.0', cc('3.0')),
      photo('france', 'capital', 'פריז — נהר הסן בעיר הבירה', 'Seine from Pont de Sully, Paris.jpg', 'Gerda Arendt', 'CC0 1.0', cc0),
      photo("france", "landscape", "מון סן מישל באור הבוקר", "Mont St Michel at sunrise.jpg", "Lynx1211", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "landscape-2"),
      photo("france", "landmark", "טירת שנונסו מעל הנהר", "Chateau de Chenonceau 2008 NR1.jpg", "Ra-smit", "CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/", "landmark-2"),
      photo("france", "capital", "פריז — שער הניצחון", "Arc de Triomphe de l'Étoile Paris.jpg", "iankelsall1", "CC0 1.0", "https://creativecommons.org/publicdomain/zero/1.0/", "capital-2"),
      {"id":"france-paris-louvre","src":"./content/photos/france-paris-louvre.jpg","caption":"פריז — מוזיאון הלובר בעיר הבירה","category":"capital","sourceURL":"https://commons.wikimedia.org/wiki/File:Louvre_Courtyard,_Looking_West.jpg","creator":"Benh LIEU SONG (Flickr)","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"france-paris-notre-dame","src":"./content/photos/france-paris-notre-dame.jpg","caption":"פריז — קתדרלת נוטרדאם ליד הסן","category":"capital","sourceURL":"https://commons.wikimedia.org/wiki/File:Notre-Dame_de_Paris,_across_the_Seine,_before_reopening.jpg","creator":"Gerda Arendt","license":"CC0 1.0","licenseURL":"https://creativecommons.org/publicdomain/zero/1.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"france-marseille","src":"./content/photos/france-marseille.jpg","caption":"מרסיי — הנמל הישן","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:1_marseille_vieux_port_pano.jpg","creator":"Chensiyuan","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"france-lyon","src":"./content/photos/france-lyon.jpg","caption":"ליון — העיר ונהר הסון","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Lyon_Panorama_Saint-Jean_Part-Dieu_Fourvi%C3%A8re_Saone.JPG","creator":"Xavier Caré / Wikimedia Commons","license":"CC BY-SA 3.0","licenseURL":"https://creativecommons.org/licenses/by-sa/3.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"france-nice","src":"./content/photos/france-nice.jpg","caption":"ניס — הטיילת לחוף הים התיכון","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Nice_from_Castle_Hill_01.jpg","creator":"Spike","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"france-bordeaux","src":"./content/photos/france-bordeaux.jpg","caption":"בורדו — כיכר הבורסה","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Bordeaux_place_de_la_bourse_with_tram.JPG","creator":"Phillip Maiwald (Nikopol)","license":"CC BY-SA 3.0","licenseURL":"https://creativecommons.org/licenses/by-sa/3.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"france-strasbourg","src":"./content/photos/france-strasbourg.jpg","caption":"שטרסבורג — בתי העץ והתעלות","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:PetiteFranceStrasbourg_panorma1.jpg","creator":"Neuceu","license":"CC BY-SA 3.0","licenseURL":"https://creativecommons.org/licenses/by-sa/3.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"france-toulouse","src":"./content/photos/france-toulouse.jpg","caption":"טולוז — הגשר מעל נהר הגארון","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Panorama_from_pont_Saint-Pierre_in_Toulouse_-_2012-08-31.jpg","creator":"PierreSelim","license":"CC BY 3.0","licenseURL":"https://creativecommons.org/licenses/by/3.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"france-chamonix","src":"./content/photos/france-chamonix.jpg","caption":"שאמוני — פסגות האלפים","category":"landscape","sourceURL":"https://commons.wikimedia.org/wiki/File:Mont_Blanc_depuis_Chamonix.JPG","creator":"Aiguille","license":"CC0 1.0","licenseURL":"https://creativecommons.org/publicdomain/zero/1.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"france-verdon","src":"./content/photos/france-verdon.jpg","caption":"אגם סן־קרואה באזור ורדון","category":"landscape","sourceURL":"https://commons.wikimedia.org/wiki/File:Aerial_view_of_the_Lake_of_Sainte-Croix_05.jpg","creator":"Olivier Cleynen","license":"CC BY 4.0","licenseURL":"https://creativecommons.org/licenses/by/4.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"france-etretat","src":"./content/photos/france-etretat.jpg","caption":"אטְרֶטָה — מצוקי החוף בנורמנדי","category":"landscape","sourceURL":"https://commons.wikimedia.org/wiki/File:Etretat_Cliff_Panorama.JPG","creator":"Utha le","license":"CC BY 3.0","licenseURL":"https://creativecommons.org/licenses/by/3.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"france-versailles","src":"./content/photos/france-versailles.jpg","caption":"ארמון ורסאי והגנים","category":"landmark","sourceURL":"https://commons.wikimedia.org/wiki/File:Garden_facade_of_the_Palace_of_Versailles,_April_2011_(11).jpg","creator":"Cristian Bortes from Cluj-Napoca, Romania","license":"CC BY 2.0","licenseURL":"https://creativecommons.org/licenses/by/2.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"france-carcassonne","src":"./content/photos/france-carcassonne.jpg","caption":"קרקסון — העיר העתיקה המבוצרת","category":"landmark","sourceURL":"https://commons.wikimedia.org/wiki/File:Cit%C3%A9_de_Carcassonne-20190803.jpg","creator":"Daniel VILLAFRUELA.","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"france-corsica","src":"./content/photos/france-corsica.jpg","caption":"קורסיקה — חופי הים וההרים","category":"landscape","sourceURL":"https://commons.wikimedia.org/wiki/File:Sud_de_Bonifacio_Octobre_2012_-_panoramio.jpg","creator":"stephaneroche01","license":"CC BY 3.0","licenseURL":"https://creativecommons.org/licenses/by/3.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
    ],
    music: {"src":"./content/audio/france.mp3","title":"מסע בצרפת","inspiration":"קטע שנוצר ב-Suno עבור צרפת","creator":"נוצר ב-Suno וסופק על ידי בעל הפרויקט","license":"פרטי רישיון והפצה טרם נמסרו"},
  },
  {
    id: 'italy', name: 'איטליה', capital: 'רומא', continentId: 'europe', familiarity: 'familiar', accent: '#7F9C79', emoji: '🌿',
    trivia: countryTrivia.italy,
    flag: { viewBox: '0 0 900 600', bounds: standardBounds, regions: [rectangle('green-band', 0, 0, 300, 600, 4), rectangle('white-band', 300, 0, 300, 600, 3), rectangle('red-band', 600, 0, 300, 600, 1)] },
    photos: [
      photo('italy', 'landscape', 'חוף אמלפי והים הכחול', 'Amalfi Coast (6137331726).jpg', 'jimmyweee (James Gose)', 'CC BY 2.0', ccBy('2.0')),
      photo('italy', 'landmark', 'הקולוסיאום ברומא', 'Colosseum in Rome, Italy - April 2007.jpg', 'DAVID ILIFF', 'CC BY-SA 3.0', cc('3.0')),
      photo('italy', 'capital', 'רומא — עיר הבירה', 'Rome Skyline (8012016319).jpg', 'Bert Kaufmann', 'CC BY-SA 2.0', cc('2.0')),
      photo("italy", "landscape", "התעלה הגדולה וגשר ריאלטו בוונציה", "Panorama of Canal Grande and Ponte di Rialto, Venice - September 2017.jpg", "Martin Falbisoner", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "landscape-2"),
      photo("italy", "landmark", "המגדל הנטוי בפיזה", "The Leaning Tower of Pisa in Pisa, Italy.jpg", "Ricardo 6167", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "landmark-2"),
      photo("italy", "capital", "רומא — מזרקת טרווי", "Fontaine Trevi - Rome.jpg", "Wilfredor", "CC0 1.0", "https://creativecommons.org/publicdomain/zero/1.0/", "capital-2"),
      {"id":"italy-rome-forum","src":"./content/photos/italy-rome-forum.jpg","caption":"רומא — הפורום הרומי בעיר הבירה","category":"capital","sourceURL":"https://commons.wikimedia.org/wiki/File:Roman_Forum_east_end_panorama.jpg","creator":"Nhartmannphotos","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"italy-rome-pantheon","src":"./content/photos/italy-rome-pantheon.jpg","caption":"רומא — הפנתאון והכיכר","category":"capital","sourceURL":"https://commons.wikimedia.org/wiki/File:Pantheon_Rom_1_cropped.jpg","creator":"Rabax63","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"italy-milan","src":"./content/photos/italy-milan.jpg","caption":"מילאנו — הקתדרלה בכיכר המרכזית","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Piazza_Duomo_Milan_panorama.jpg","creator":"https://www.flickr.com/photos/belboo/","license":"CC BY-SA 2.0","licenseURL":"https://creativecommons.org/licenses/by-sa/2.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"italy-naples","src":"./content/photos/italy-naples.jpg","caption":"נאפולי — המפרץ והר וזוב","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:NapoliPanoramaDaSanMartino.jpg","creator":"MM","license":"Public domain","licenseURL":"https://commons.wikimedia.org/wiki/Template:PD-self","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"italy-florence","src":"./content/photos/italy-florence.jpg","caption":"פירנצה — העיר ונהר הארנו","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Florence_panorama_as_seen_from_The_Piazza_Michelangelo.jpg","creator":"Ray in Manila","license":"CC BY 2.0","licenseURL":"https://creativecommons.org/licenses/by/2.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"italy-venice-san-marco","src":"./content/photos/italy-venice-san-marco.jpg","caption":"ונציה — כיכר סן מרקו","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Panorama_Piazza_San_Marco_and_Venice_on_Easter_2013.jpg","creator":"Wolfgang Moroder","license":"CC BY-SA 3.0","licenseURL":"https://creativecommons.org/licenses/by-sa/3.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"italy-bologna","src":"./content/photos/italy-bologna.jpg","caption":"בולוניה — הכיכר המרכזית","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Piazza_maggiore_bologna.jpg","creator":"Fiorry","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"italy-turin","src":"./content/photos/italy-turin.jpg","caption":"טורינו — העיר והרי האלפים","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Turin_and_the_Alps.jpg","creator":"Chivista","license":"CC0 1.0","licenseURL":"https://creativecommons.org/publicdomain/zero/1.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"italy-lake-como","src":"./content/photos/italy-lake-como.jpg","caption":"אגם קומו והעיירות על שפתו","category":"landscape","sourceURL":"https://commons.wikimedia.org/wiki/File:Lago_di_Como_panorama.jpg","creator":"Fiorentino67","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"italy-dolomites","src":"./content/photos/italy-dolomites.jpg","caption":"הדולומיטים — פסגות ההרים","category":"landscape","sourceURL":"https://commons.wikimedia.org/wiki/File:Tre_cime_di_Lavaredo_e_cielo_azzurro.jpg","creator":"Rikmez","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"italy-tuscany","src":"./content/photos/italy-tuscany.jpg","caption":"טוסקנה — גבעות ודרכי ברושים","category":"landscape","sourceURL":"https://commons.wikimedia.org/wiki/File:Val-d%27Orcia-landscape-1.jpg","creator":"Hans A. Rosbach","license":"CC BY 2.5","licenseURL":"https://creativecommons.org/licenses/by/2.5","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"italy-cinque-terre","src":"./content/photos/italy-cinque-terre.jpg","caption":"צ׳ינקווה טרה — כפרים צבעוניים על החוף","category":"landscape","sourceURL":"https://commons.wikimedia.org/wiki/File:Panorama_of_Manarola.jpg","creator":"СССР","license":"CC BY-SA 2.5 ca","licenseURL":"https://creativecommons.org/licenses/by-sa/2.5/ca/deed.en","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"italy-taormina","src":"./content/photos/italy-taormina.jpg","caption":"סיציליה — טאורמינה והתיאטרון העתיק","category":"landmark","sourceURL":"https://commons.wikimedia.org/wiki/File:Taormina_Theater.jpg","creator":"Clemensfranz","license":"CC BY-SA 3.0","licenseURL":"https://creativecommons.org/licenses/by-sa/3.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"italy-alberobello","src":"./content/photos/italy-alberobello.jpg","caption":"אלברובלו — בתי הטרולי הלבנים","category":"landmark","sourceURL":"https://commons.wikimedia.org/wiki/File:DSC00521_Alberobello_panorama.jpg","creator":"FalantoTaras","license":"CC BY 4.0","licenseURL":"https://creativecommons.org/licenses/by/4.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
    ],
    music: {"src":"./content/audio/italy.mp3","title":"מסע באיטליה","inspiration":"קטע שנוצר ב-Suno עבור איטליה","creator":"נוצר ב-Suno וסופק על ידי בעל הפרויקט","license":"פרטי רישיון והפצה טרם נמסרו"},
  },
  {
    id: 'germany', name: 'גרמניה', capital: 'ברלין', continentId: 'europe', familiarity: 'familiar', accent: '#B09065', emoji: '🏰',
    trivia: countryTrivia.germany,
    flag: { viewBox: '0 0 900 600', bounds: { x: 0, y: 30, width: 900, height: 540 }, regions: [rectangle('black-band', 0, 30, 900, 180, 6), rectangle('red-band', 0, 210, 900, 180, 1), rectangle('gold-band', 0, 390, 900, 180, 5)] },
    photos: [
      photo('germany', 'landscape', 'אגם אייבזה למרגלות האלפים', 'Eibsee - panorama 2.jpg', 'Tiia Monto', 'CC BY-SA 4.0', cc('4.0')),
      photo('germany', 'landmark', 'שער ברנדנבורג', 'The Brandenburg Gate.jpg', 'Nirmal Dulal', 'CC BY-SA 4.0', cc('4.0')),
      photo('germany', 'capital', 'ברלין — עיר הבירה', 'Berlin skyline (6270204821) (3).jpg', 'Leandro Neumann Ciuffo', 'CC BY 2.0', ccBy('2.0')),
      photo("germany", "landscape", "נהר הריין בין הגבעות", "Loreleyblick Maria Ruh 2020.jpg", "Jörg Braukmann", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "landscape-2"),
      photo("germany", "landmark", "טירת נוישוונשטיין בבוואריה", "Neuschwanstein Castle, Swabia, Bavaria.jpg", "Unknown author (Piqsels)", "CC0 1.0", "https://creativecommons.org/publicdomain/zero/1.0/", "landmark-2"),
      photo("germany", "capital", "ברלין — בניין הרייכסטאג", "Reichstag building Berlin view from west before sunset.jpg", "Jürgen Matern", "CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/", "capital-2"),
      {"id":"germany-berlin-museum-island","src":"./content/photos/germany-berlin-museum-island.jpg","caption":"ברלין — אי המוזיאונים בעיר הבירה","category":"capital","sourceURL":"https://commons.wikimedia.org/wiki/File:Berlin_Museumsinsel_Fernsehturm.jpg","creator":"Thomas Wolf, www.foto-tw.de","license":"CC BY-SA 3.0","licenseURL":"https://creativecommons.org/licenses/by-sa/3.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"germany-hamburg","src":"./content/photos/germany-hamburg.jpg","caption":"המבורג — הנמל שליד נהר האלבה","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Hamburg,_Blick_von_Steinwerder_auf_die_St._Pauli-Landungsbr%C3%BCcken.jpg","creator":"Thoroe","license":"CC BY-SA 3.0 de","licenseURL":"https://creativecommons.org/licenses/by-sa/3.0/de/deed.en","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"germany-munich","src":"./content/photos/germany-munich.jpg","caption":"מינכן — כיכר מריאן ובניין העירייה","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Marienplatz_mit_Rathaus_M%C3%BCnchen_(Panorama)_mit_Frauenkirche_(2019).jpg","creator":"Guido Radig","license":"CC BY 4.0","licenseURL":"https://creativecommons.org/licenses/by/4.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"germany-cologne","src":"./content/photos/germany-cologne.jpg","caption":"קלן — הקתדרלה וגשר הריין","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Dom_(Deutzer_Br%C3%BCcke).jpg","creator":"Jörg Braukmann","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"germany-dresden","src":"./content/photos/germany-dresden.jpg","caption":"דרזדן — העיר העתיקה ונהר האלבה","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Dresden_-_Panorama_an_der_Elbe.JPG","creator":"Guido Radig","license":"CC BY 3.0","licenseURL":"https://creativecommons.org/licenses/by/3.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"germany-frankfurt","src":"./content/photos/germany-frankfurt.jpg","caption":"פרנקפורט — קו הרקיע מעל נהר המיין","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Frankfurt_Skyline_2022.jpg","creator":"Jörg Braukmann","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"germany-heidelberg","src":"./content/photos/germany-heidelberg.jpg","caption":"היידלברג — הגשר והטירה","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Heidelberg_Old_Bridge_%26_Castle_(9813115355).jpg","creator":"Gary Todd from Xinzheng, China","license":"CC0 1.0","licenseURL":"https://creativecommons.org/publicdomain/zero/1.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"germany-leipzig","src":"./content/photos/germany-leipzig.jpg","caption":"לייפציג — כיכר השוק ובית העירייה","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:20200912_Altes_Rathaus_Leipzig_01.jpg","creator":"Flocci Nivis","license":"CC BY 4.0","licenseURL":"https://creativecommons.org/licenses/by/4.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"germany-rothenburg","src":"./content/photos/germany-rothenburg.jpg","caption":"רוטנבורג — רחובות העיר העתיקה","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Pl%C3%B6nlein_Rothenburg.jpg","creator":"Einaz80","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"germany-black-forest","src":"./content/photos/germany-black-forest.jpg","caption":"היער השחור — גבעות ויערות","category":"landscape","sourceURL":"https://commons.wikimedia.org/wiki/File:Black_Forest_landscape_national_Parc.jpg","creator":"Smilla Heckel","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"germany-saxon-switzerland","src":"./content/photos/germany-saxon-switzerland.jpg","caption":"שוויץ הסקסונית — גשר הבסטאי","category":"landscape","sourceURL":"https://commons.wikimedia.org/wiki/File:Nationalpark_S%C3%A4chsische_Schweiz_Bastei_lub_2025-04-27_img02_Br%C3%BCcke.jpg","creator":"Lukas Beck","license":"CC BY 4.0","licenseURL":"https://creativecommons.org/licenses/by/4.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"germany-rugen","src":"./content/photos/germany-rugen.jpg","caption":"האי ריגן — מצוקים לבנים לחוף הים","category":"landscape","sourceURL":"https://commons.wikimedia.org/wiki/File:Chalk_cliffs_of_Jasmund_National_Park_on_R%C3%BCgen_island_in_autumn_16.jpg","creator":"Siarhei Besarab","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"germany-konigssee","src":"./content/photos/germany-konigssee.jpg","caption":"אגם קניגזה בין הרי בוואריה","category":"landscape","sourceURL":"https://commons.wikimedia.org/wiki/File:View_of_K%C3%B6nigssee_from_Malerwinkl.jpg","creator":"Mataksim","license":"CC0 1.0","licenseURL":"https://creativecommons.org/publicdomain/zero/1.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"germany-bremen","src":"./content/photos/germany-bremen.jpg","caption":"ברמן — הכיכר ובית העירייה","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Marktplatz_mit_Rathaus_-_Dom_-_B%C3%BCrgerschaft.jpg","creator":"Godewind (talk)","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
    ],
    music: {"src":"./content/audio/germany.mp3","title":"מסע בגרמניה","inspiration":"קטע שנוצר ב-Suno עבור גרמניה","creator":"נוצר ב-Suno וסופק על ידי בעל הפרויקט","license":"פרטי רישיון והפצה טרם נמסרו"},
  },
  {
    id: 'ukraine', name: 'אוקראינה', capital: 'קייב', continentId: 'europe', familiarity: 'explore', accent: '#B8A35F', emoji: '🌻',
    trivia: countryTrivia.ukraine,
    flag: { viewBox: '0 0 900 600', bounds: standardBounds, regions: [rectangle('blue-band', 0, 0, 900, 300, 2), rectangle('yellow-band', 0, 300, 900, 300, 5)] },
    photos: [
      photo('ukraine', 'landscape', 'הרי הקרפטים באוקראינה', 'На склонах Черногорского хребта.jpg', 'Nickolay Khoroshkov', 'CC BY-SA 4.0', cc('4.0')),
      photo('ukraine', 'landmark', 'קתדרלת סופיה הקדושה בקייב', '2019-07-21 Saint Sophia Cathedral in Kyiv, Ukraine.jpg', 'Maksym Kozlenko', 'CC BY-SA 4.0', cc('4.0')),
      photo('ukraine', 'capital', 'קייב — נהר הדניפרו בעיר הבירה', 'Dniepr river in Kyiv.jpg', 'Dmitry A. Mottl', 'CC BY-SA 3.0', cc('3.0')),
      photo("ukraine", "landscape", "שדה חמניות באוקראינה", "Sunflower field in Ukraine, 23 July 2013.jpg", "Eugenereed1984", "CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/", "landscape-2"),
      photo("ukraine", "landmark", "הכיכר ובתי העיר לביב", "Panorama Rynok Platz Blick NO Lemberg.JPG", "Herbert wie", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "landmark-2"),
      photo("ukraine", "capital", "קייב — כיכר העצמאות", "Maidan Nezalezhnosti view.jpg", "Juan Antonio Segal", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "capital-2"),
      {"id":"ukraine-bakota-bay","src":"./content/photos/ukraine-bakota-bay.jpg","caption":"מפרץ בקוטה בנהר הדניסטר","category":"landscape","sourceURL":"https://commons.wikimedia.org/wiki/File:Bakota_Bay-01.jpg","creator":"Kolyan ilia","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"ukraine-chernivtsi-university","src":"./content/photos/ukraine-chernivtsi-university.jpg","caption":"צ׳רניבצי — האוניברסיטה","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:1.%D0%A7%D0%B5%D1%80%D0%BD%D1%96%D0%B2%D1%86%D1%96.%D0%A0%D0%B5%D0%B7%D0%B8%D0%B4%D0%B5%D0%BD%D1%86%D1%96%D1%8F-%D1%83%D0%BD%D1%96%D0%B2%D0%B5%D1%80%D1%81%D0%B8%D1%82%D0%B5%D1%82.JPG","creator":"Neovitaha777","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"ukraine-dnipro-riverfront","src":"./content/photos/ukraine-dnipro-riverfront.jpg","caption":"דניפרו — העיר על גדת הנהר","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Dnieper_River_Dnipropetrovsk.JPG","creator":"Leonid Dzhepko","license":"CC BY-SA 2.5","licenseURL":"https://creativecommons.org/licenses/by-sa/2.5/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"ukraine-hoverla-mountain","src":"./content/photos/ukraine-hoverla-mountain.jpg","caption":"הר הוברלה — פסגת הקרפטים","category":"landscape","sourceURL":"https://commons.wikimedia.org/wiki/File:Hoverla.jpg","creator":"Dezidor","license":"CC BY 3.0","licenseURL":"https://creativecommons.org/licenses/by/3.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"ukraine-kamianets-castle","src":"./content/photos/ukraine-kamianets-castle.jpg","caption":"קמיאנץ פודילסקי — המבצר","category":"landmark","sourceURL":"https://commons.wikimedia.org/wiki/File:68-104-9007_Kamianets-Podilskyi_Fortress_RB_18_2.jpg","creator":"Rbrechko","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"ukraine-kharkiv-square","src":"./content/photos/ukraine-kharkiv-square.jpg","caption":"חרקיב — כיכר החירות","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:%D0%91%D1%83%D0%B4%D0%B8%D0%BD%D0%BE%D0%BA_%D0%B4%D0%B5%D1%80%D0%B6%D0%BF%D1%80%D0%BE%D0%BC%D0%B8%D1%81%D0%BB%D0%BE%D0%B2%D0%BE%D1%81%D1%82%D1%96%2C_%D0%A5%D0%B0%D1%80%D0%BA%D1%96%D0%B2_DJI_0068.jpg","creator":"Konstantin Brizhnichenko","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"ukraine-khotyn-fortress","src":"./content/photos/ukraine-khotyn-fortress.jpg","caption":"מבצר חוטין מעל נהר הדניסטר","category":"landmark","sourceURL":"https://commons.wikimedia.org/wiki/File:Khotin_fortress_-_view_from_hill.jpg","creator":"Курля Сергій","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"ukraine-kyiv-lavra","src":"./content/photos/ukraine-kyiv-lavra.jpg","caption":"קייב — מנזר לאוורת המערות","category":"capital","sourceURL":"https://commons.wikimedia.org/wiki/File:Kyiv_Pechersk_Lavra_-_panoramio.jpg","creator":"S. Karpenko","license":"CC BY 3.0","licenseURL":"https://creativecommons.org/licenses/by/3.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"ukraine-lviv-opera","src":"./content/photos/ukraine-lviv-opera.jpg","caption":"לביב — בית האופרה","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:LvivOperaHouse.JPG","creator":"Forestchild (Zavadskiy Nikolay)","license":"CC BY 3.0","licenseURL":"https://creativecommons.org/licenses/by/3.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"ukraine-mukachevo-castle","src":"./content/photos/ukraine-mukachevo-castle.jpg","caption":"מוקצ׳בו — טירת פלאנוק","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Palanok_Castle_in_Mukachevo_(Main_view).jpg","creator":"Sanya7901","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"ukraine-odesa-opera","src":"./content/photos/ukraine-odesa-opera.jpg","caption":"אודסה — בית האופרה","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Odessa_Opera_Theatre.jpg","creator":"Dezidor uploaded and derivative work: MrPanyGoff","license":"CC BY-SA 3.0","licenseURL":"https://creativecommons.org/licenses/by-sa/3.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"ukraine-sofiyivka-park","src":"./content/photos/ukraine-sofiyivka-park.jpg","caption":"אומן — פארק סופייבקה","category":"landmark","sourceURL":"https://commons.wikimedia.org/wiki/File:Sofiyivsky_Park.jpg","creator":"AlexanderVovck","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"ukraine-synevyr-lake","src":"./content/photos/ukraine-synevyr-lake.jpg","caption":"אגם סינביר בין הרי הקרפטים","category":"landscape","sourceURL":"https://commons.wikimedia.org/wiki/File:Synevyr_Lake_IMG_3125.jpg","creator":"ValeriySh","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"ukraine-uzhhorod-castle","src":"./content/photos/ukraine-uzhhorod-castle.jpg","caption":"אוז׳הורוד — הטירה","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Uzhhorod_castle_(01).jpg","creator":"Dmytro Petishkin","license":"CC BY 4.0","licenseURL":"https://creativecommons.org/licenses/by/4.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
    ],
    music: {"src":"./content/audio/ukraine.mp3","title":"מסע באוקראינה","inspiration":"קטע שנוצר ב-Suno עבור אוקראינה","creator":"נוצר ב-Suno וסופק על ידי בעל הפרויקט","license":"פרטי רישיון והפצה טרם נמסרו"},
  },
  {
    id: 'israel', name: 'ישראל', capital: 'ירושלים', continentId: 'asia', familiarity: 'familiar', accent: '#688FB4', emoji: '🕊️',
    trivia: countryTrivia.israel,
    flag: {
      viewBox: '0 0 900 600', bounds: { x: 37.5, y: 0, width: 825, height: 600 },
      regions: [
        rectangle('white-top', 37.5, 0, 825, 68.18, 3),
        rectangle('blue-top', 37.5, 68.18, 825, 102.27, 2),
        { ...rectangle('white-center', 37.5, 170.45, 825, 259.10, 3), labelX: 190 },
        rectangle('blue-bottom', 37.5, 429.55, 825, 102.27, 2),
        rectangle('white-bottom', 37.5, 531.82, 825, 68.18, 3),
        {
          id: 'blue-star', colorId: 2, labelX: 450, labelY: 300, fillRule: 'nonzero',
          // Opposite winding on the inner triangles leaves the seven white openings.
          path: 'M450 189.82L545.43 355.09H354.57Z M450 213.82L375.37 343.09H524.63Z M450 410.18L354.57 244.91H545.43Z M450 386.18L524.63 256.91H375.37Z',
          // A selected star accepts a touch throughout its silhouette, not only on a thin line.
          hitPath: 'M450 189.82L481.81 244.91H545.43L513.62 300L545.43 355.09H481.81L450 410.18L418.19 355.09H354.57L386.38 300L354.57 244.91H418.19Z',
        },
      ],
    },
    photos: [
      photo('israel', 'landscape', 'הכנרת וההרים סביבה', 'Sea of Galilee, Israel (Unsplash f9fJ6nxndoo).jpg', 'Chris Gallimore', 'CC0 1.0', cc0),
      photo('israel', 'landmark', 'הכותל המערבי בירושלים', 'Holy Land 2016 P0709 Western Wall.jpg', 'Fallaner', 'CC BY-SA 4.0', cc('4.0')),
      photo('israel', 'capital', 'ירושלים — מבט אל העיר', 'Jerusalem panorama from scottish church.jpg', 'Someone35', 'CC BY-SA 3.0', cc('3.0')),
      photo("israel", "landscape", "ים המלח וחופי המלח הלבנים", "Dead Sea shore.jpg", "Tiia Monto", "CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/", "landscape-2"),
      photo("israel", "landmark", "אמת המים העתיקה בקיסריה", "Ancient Roman aqueduct in north Caesarea.jpg", "Zicheng yee", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "landmark-2"),
      photo("israel", "capital", "ירושלים — טחנת הרוח במשכנות שאננים", "Moses Montefiore Windmill, Jerusalem 2005.jpg", "Almog", "Public domain", "https://commons.wikimedia.org/wiki/Template:PD-self", "capital-2"),
      {"id":"israel-acre-harbor","src":"./content/photos/israel-acre-harbor.jpg","caption":"עכו — העיר העתיקה והנמל","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Acre_-_Akko_6_-_the_fishing_port_(6658890981).jpg","creator":"israeltourism from Israel","license":"CC BY 2.0","licenseURL":"https://creativecommons.org/licenses/by/2.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"israel-bahai-gardens","src":"./content/photos/israel-bahai-gardens.jpg","caption":"חיפה — הגנים הבהאיים","category":"landmark","sourceURL":"https://commons.wikimedia.org/wiki/File:Haifa_Bahai_Gardens_-_landscape.jpg","creator":"Yuval Y","license":"CC BY-SA 3.0","licenseURL":"https://creativecommons.org/licenses/by-sa/3.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"israel-banias-waterfall","src":"./content/photos/israel-banias-waterfall.jpg","caption":"מפל הבניאס בצפון","category":"landscape","sourceURL":"https://commons.wikimedia.org/wiki/File:Banias-falls-wasserfall.jpg","creator":"Mboesch","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"israel-beer-sheva","src":"./content/photos/israel-beer-sheva.jpg","caption":"באר שבע — תחנת הרכבת העתיקה","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Beer-sheva-turkish-railway-station.jpg","creator":"Mboesch","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"israel-eilat","src":"./content/photos/israel-eilat.jpg","caption":"אילת — העיר והים האדום","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Eilat_VillageBeach_0031.JPG","creator":"Ludvig14","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"israel-ein-avdat","src":"./content/photos/israel-ein-avdat.jpg","caption":"עין עבדת — נחל בין מצוקים","category":"landscape","sourceURL":"https://commons.wikimedia.org/wiki/File:Israel-2013-Ein_Avdat_02.jpg","creator":"Andrew Shiva / Wikipedia","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"israel-haifa-panorama","src":"./content/photos/israel-haifa-panorama.jpg","caption":"חיפה — העיר והמפרץ","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Haifa_Israel_Panoramic_view_Panorama_(35061501866).jpg","creator":"FLASHPACKER TRAVELGUIDE","license":"CC BY-SA 2.0","licenseURL":"https://creativecommons.org/licenses/by-sa/2.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"israel-jaffa-port","src":"./content/photos/israel-jaffa-port.jpg","caption":"יפו — הנמל העתיק","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Jaffa_port_-_a_view_from_the_pier.jpg","creator":"Margalit","license":"CC BY-SA 3.0","licenseURL":"https://creativecommons.org/licenses/by-sa/3.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"israel-jerusalem-old-city","src":"./content/photos/israel-jerusalem-old-city.jpg","caption":"ירושלים — חומות העיר העתיקה","category":"capital","sourceURL":"https://commons.wikimedia.org/wiki/File:The_walls_of_the_old_city_of_jerusalem.JPG","creator":"Lipaphotography","license":"CC BY-SA 3.0","licenseURL":"https://creativecommons.org/licenses/by-sa/3.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"israel-masada","src":"./content/photos/israel-masada.jpg","caption":"מצדה מעל ים המלח","category":"landmark","sourceURL":"https://commons.wikimedia.org/wiki/File:Israel-2013-Aerial_13-Masada.jpg","creator":"Andrew Shiva / Wikipedia","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"israel-ramon-crater","src":"./content/photos/israel-ramon-crater.jpg","caption":"מכתש רמון בנגב","category":"landscape","sourceURL":"https://commons.wikimedia.org/wiki/File:Small_panorama_of_ramon_crater.jpg","creator":"Someone35","license":"CC BY-SA 3.0","licenseURL":"https://creativecommons.org/licenses/by-sa/3.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"israel-rosh-hanikra","src":"./content/photos/israel-rosh-hanikra.jpg","caption":"ראש הנקרה — המצוקים והים","category":"landscape","sourceURL":"https://commons.wikimedia.org/wiki/File:Rocks_and_water_by_Rosh_Hanikra.jpg","creator":"Limor Noah","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"israel-tel-aviv-skyline","src":"./content/photos/israel-tel-aviv-skyline.jpg","caption":"תל אביב — קו הרקיע","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Tel_Aviv_Skyline_02.jpg","creator":"Ynhockey","license":"CC BY-SA 4.0","licenseURL":"https://creativecommons.org/licenses/by-sa/4.0/","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
      {"id":"israel-tiberias","src":"./content/photos/israel-tiberias.jpg","caption":"טבריה על שפת הכנרת","category":"city","sourceURL":"https://commons.wikimedia.org/wiki/File:Tiberias_BW_1.JPG","creator":"Berthold Werner","license":"Public domain","licenseURL":"https://commons.wikimedia.org/wiki/Template:PD-self","changes":"Resized to a maximum of 1600 pixels and JPEG compressed; original framing retained. Display may crop responsively."},
    ],
    music: {"src":"./content/audio/israel.mp3","title":"מסע בישראל","inspiration":"קטע שנוצר ב-Suno עבור ישראל","creator":"נוצר ב-Suno וסופק על ידי בעל הפרויקט","license":"פרטי רישיון והפצה טרם נמסרו"},
  },
];

export const contentResourcePaths = [
  './content/catalog.json', './content/credits.json',
  './content/fonts/Heebo.ttf', './content/fonts/OFL.txt',
  ...countries.flatMap(country => [country.music.src, ...country.photos.map(item => item.src)]),
];
