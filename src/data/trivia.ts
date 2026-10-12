export interface TriviaQuestion {
  id: string;
  question: string;
  answers: readonly [string, string, string, string];
  correctAnswerIndex: number;
}

// Short, familiar questions with one correct answer; sources are in docs/trivia-sources.md.
export const countryTrivia: Record<string, readonly TriviaQuestion[]> = {
  japan: [
    {
      id: 'japan-capital',
      question: 'מהי עיר הבירה של יפן?',
      answers: ['טוקיו', 'פריז', 'רומא', 'ברלין'],
      correctAnswerIndex: 0,
    },
    {
      id: 'japan-flag',
      question: 'איזו צורה מופיעה במרכז דגל יפן?',
      answers: ['כוכב כחול', 'עיגול אדום', 'משולש ירוק', 'ריבוע צהוב'],
      correctAnswerIndex: 1,
    },
    {
      id: 'japan-sushi',
      question: 'איזה מאכל יפני מוכר מכינים עם אורז?',
      answers: ['פיצה', 'פלאפל', 'סושי', 'קרואסון'],
      correctAnswerIndex: 2,
    },
    {
      id: 'japan-fuji',
      question: 'איזה הר מפורסם נמצא ביפן?',
      answers: ['הכרמל', 'החרמון', 'האוורסט', 'הר פוג׳י'],
      correctAnswerIndex: 3,
    },
    {
      id: 'japan-sakura',
      question: 'איזו פריחה נקראת ביפן סאקורה?',
      answers: ['פריחת הדובדבן', 'פריחת השקד', 'פריחת התפוז', 'פריחת הלימון'],
      correctAnswerIndex: 0,
    },
    {
      id: 'japan-kimono',
      question: 'איך נקרא הבגד היפני המסורתי?',
      answers: ['סארי', 'קימונו', 'קילט', 'פונצ׳ו'],
      correctAnswerIndex: 1,
    },
  ],
  france: [
    {
      id: 'france-capital',
      question: 'מהי עיר הבירה של צרפת?',
      answers: ['טוקיו', 'ברלין', 'פריז', 'רומא'],
      correctAnswerIndex: 2,
    },
    {
      id: 'france-eiffel',
      question: 'איזה מגדל מפורסם נמצא בפריז?',
      answers: ['מגדל פיזה', 'ביג בן', 'מגדל דוד', 'מגדל אייפל'],
      correctAnswerIndex: 3,
    },
    {
      id: 'france-baguette',
      question: 'איך נקרא הלחם הצרפתי הארוך?',
      answers: ['בגט', 'פיתה', 'חלה', 'לחמנייה'],
      correctAnswerIndex: 0,
    },
    {
      id: 'france-louvre',
      question: 'באיזה מוזיאון מוצגת המונה ליזה?',
      answers: ['מוזיאון ישראל', 'מוזיאון הלובר', 'המוזיאון הבריטי', 'מוזיאון ואן גוך'],
      correctAnswerIndex: 1,
    },
    {
      id: 'france-seine',
      question: 'איזה נהר זורם דרך פריז?',
      answers: ['הירדן', 'הנילוס', 'הסן', 'האמזונס'],
      correctAnswerIndex: 2,
    },
    {
      id: 'france-flag',
      question: 'מהם צבעי דגל צרפת?',
      answers: ['ירוק, לבן ואדום', 'שחור, אדום וצהוב', 'כחול וצהוב', 'כחול, לבן ואדום'],
      correctAnswerIndex: 3,
    },
  ],
  italy: [
    {
      id: 'italy-capital',
      question: 'מהי עיר הבירה של איטליה?',
      answers: ['רומא', 'טוקיו', 'פריז', 'ברלין'],
      correctAnswerIndex: 0,
    },
    {
      id: 'italy-venice',
      question: 'באיזו עיר באיטליה שטים בגונדולות?',
      answers: ['מילאנו', 'ונציה', 'רומא', 'פירנצה'],
      correctAnswerIndex: 1,
    },
    {
      id: 'italy-pisa',
      question: 'באיזו עיר באיטליה נמצא המגדל הנטוי?',
      answers: ['רומא', 'מילאנו', 'פיזה', 'ונציה'],
      correctAnswerIndex: 2,
    },
    {
      id: 'italy-pizza',
      question: 'איזה מאכל איטלקי עשוי מבצק, עגבניות וגבינה?',
      answers: ['סושי', 'פלאפל', 'שניצל', 'פיצה'],
      correctAnswerIndex: 3,
    },
    {
      id: 'italy-colosseum',
      question: 'איזה אתר עתיק ומפורסם נמצא ברומא?',
      answers: ['הקולוסיאום', 'מגדל אייפל', 'החומה הסינית', 'מצדה'],
      correctAnswerIndex: 0,
    },
    {
      id: 'italy-boot',
      question: 'למה דומה צורת איטליה על המפה?',
      answers: ['כדור', 'מגף', 'לב', 'משולש'],
      correctAnswerIndex: 1,
    },
  ],
  germany: [
    {
      id: 'germany-capital',
      question: 'מהי עיר הבירה של גרמניה?',
      answers: ['פריז', 'רומא', 'ברלין', 'טוקיו'],
      correctAnswerIndex: 2,
    },
    {
      id: 'germany-brandenburg',
      question: 'איזה שער מפורסם נמצא בברלין?',
      answers: ['שער יפו', 'שער הניצחון', 'שער האריות', 'שער ברנדנבורג'],
      correctAnswerIndex: 3,
    },
    {
      id: 'germany-rhine',
      question: 'איזה נהר גדול זורם בגרמניה?',
      answers: ['הריין', 'הנילוס', 'הירדן', 'האמזונס'],
      correctAnswerIndex: 0,
    },
    {
      id: 'germany-black-forest',
      question: 'איזה יער מפורסם נמצא בגרמניה?',
      answers: ['יער בן שמן', 'היער השחור', 'יער האמזונס', 'יער בירייה'],
      correctAnswerIndex: 1,
    },
    {
      id: 'germany-pretzel',
      question: 'איך נקרא המאפה הגרמני בצורת קשר?',
      answers: ['קרואסון', 'פיתה', 'בייגלה', 'בגט'],
      correctAnswerIndex: 2,
    },
    {
      id: 'germany-flag',
      question: 'מה צבע הפס האמצעי בדגל גרמניה?',
      answers: ['לבן', 'כחול', 'ירוק', 'אדום'],
      correctAnswerIndex: 3,
    },
  ],
  ukraine: [
    {
      id: 'ukraine-capital',
      question: 'מהי עיר הבירה של אוקראינה?',
      answers: ['קייב', 'פריז', 'רומא', 'ברלין'],
      correctAnswerIndex: 0,
    },
    {
      id: 'ukraine-flag',
      question: 'מהם צבעי דגל אוקראינה?',
      answers: ['אדום ולבן', 'כחול וצהוב', 'ירוק ולבן', 'שחור ואדום'],
      correctAnswerIndex: 1,
    },
    {
      id: 'ukraine-borscht',
      question: 'איזה ירק נותן לבורשט האדום את צבעו?',
      answers: ['מלפפון', 'תפוח אדמה', 'סלק', 'כרוב לבן'],
      correctAnswerIndex: 2,
    },
    {
      id: 'ukraine-carpathians',
      question: 'איזו שרשרת הרים נמצאת באוקראינה?',
      answers: ['הרי ההימלאיה', 'הרי האנדים', 'הרי האטלס', 'הרי הקרפטים'],
      correctAnswerIndex: 3,
    },
    {
      id: 'ukraine-odesa',
      question: 'על איזה ים נמצאת העיר אודסה?',
      answers: ['הים השחור', 'הים האדום', 'ים המלח', 'הים התיכון'],
      correctAnswerIndex: 0,
    },
    {
      id: 'ukraine-dnipro',
      question: 'איזה נהר זורם דרך קייב?',
      answers: ['הירדן', 'הדניפרו', 'הנילוס', 'האמזונס'],
      correctAnswerIndex: 1,
    },
  ],
  israel: [
    {
      id: 'israel-capital',
      question: 'מהי עיר הבירה של ישראל?',
      answers: ['תל אביב', 'חיפה', 'ירושלים', 'אילת'],
      correctAnswerIndex: 2,
    },
    {
      id: 'israel-flag',
      question: 'איזה סמל מופיע במרכז דגל ישראל?',
      answers: ['עיגול', 'עלה', 'לב', 'מגן דוד'],
      correctAnswerIndex: 3,
    },
    {
      id: 'israel-tel-aviv',
      question: 'על איזה ים נמצאת תל אביב?',
      answers: ['הים התיכון', 'הים האדום', 'ים המלח', 'הים השחור'],
      correctAnswerIndex: 0,
    },
    {
      id: 'israel-dead-sea',
      question: 'איזה ים מוכר במים המלוחים מאוד שלו?',
      answers: ['הים התיכון', 'ים המלח', 'ים סוף', 'הים השחור'],
      correctAnswerIndex: 1,
    },
    {
      id: 'israel-galilee',
      question: 'מה שמו של האגם הגדול בצפון ישראל?',
      answers: ['אגם ז׳נבה', 'אגם בייקל', 'הכנרת', 'אגם בלד'],
      correctAnswerIndex: 2,
    },
    {
      id: 'israel-negev',
      question: 'מה שמו של המדבר הגדול בדרום ישראל?',
      answers: ['מדבר סהרה', 'מדבר גובי', 'מדבר קלהרי', 'הנגב'],
      correctAnswerIndex: 3,
    },
  ],
  'egypt': [{"id":"egypt-capital","question":"מהי עיר הבירה של מצרים?","answers":["קהיר","רומא","פריז","טוקיו"],"correctAnswerIndex":0},{"id":"egypt-pyramids","question":"איזה אתר מפורסם נמצא במצרים?","answers":["הקולוסיאום","הפירמידות","מגדל אייפל","פסל החירות"],"correctAnswerIndex":1},{"id":"egypt-river","question":"איזה נהר גדול זורם במצרים?","answers":["הסן","התמזה","הנילוס","הירדן"],"correctAnswerIndex":2},{"id":"egypt-desert","question":"איזה נוף נפוץ במצרים?","answers":["שדות קרח","יערות מושלגים","גבעות מכוסות שלג","מדבר"],"correctAnswerIndex":3},{"id":"egypt-sphinx","question":"איזה פסל מפורסם נמצא ליד הפירמידות?","answers":["הספינקס","פסל החירות","בת הים הקטנה","פסל דוד"],"correctAnswerIndex":0},{"id":"egypt-continent","question":"באיזו יבשת נמצאת רוב מצרים?","answers":["דרום אמריקה","אפריקה","אירופה","אוקיאניה"],"correctAnswerIndex":1}],
  'morocco': [{"id":"morocco-capital","question":"מהי עיר הבירה של מרוקו?","answers":["רבאט","קהיר","פריז","טוקיו"],"correctAnswerIndex":0},{"id":"morocco-flag","question":"איזה סמל ירוק מופיע בדגל מרוקו?","answers":["לב","כוכב","עיגול","עץ"],"correctAnswerIndex":1},{"id":"morocco-couscous","question":"איזה מאכל מוכר מזוהה עם מרוקו?","answers":["פיצה","קרואסון","קוסקוס","סושי"],"correctAnswerIndex":2},{"id":"morocco-tea","question":"איזה תה מזוהה עם מרוקו?","answers":["תה עם קמומיל","תה עם זנגביל","תה עם פירות יער","תה עם נענע"],"correctAnswerIndex":3},{"id":"morocco-blue-city","question":"איזו עיר במרוקו ידועה בבתיה הכחולים?","answers":["שפשאוון","פריז","רומא","ברלין"],"correctAnswerIndex":0},{"id":"morocco-continent","question":"באיזו יבשת נמצאת מרוקו?","answers":["אוקיאניה","אפריקה","אסיה","אירופה"],"correctAnswerIndex":1}],
  'usa': [{"id":"usa-capital","question":"מהי עיר הבירה של ארצות הברית?","answers":["וושינגטון","פריז","רומא","לונדון"],"correctAnswerIndex":0},{"id":"usa-flag","question":"אילו צורות מופיעות בדגל ארצות הברית?","answers":["עצים והרים","כוכבים ופסים","עלים ופרחים","עיגולים וריבועים"],"correctAnswerIndex":1},{"id":"usa-liberty","question":"באיזו עיר נמצא פסל החירות?","answers":["רומא","קהיר","ניו יורק","טוקיו"],"correctAnswerIndex":2},{"id":"usa-white-house","question":"מהו הבית הלבן בארצות הברית?","answers":["תחנת רכבת","מוזיאון לצעצועים","בית אופרה","ביתו הרשמי של הנשיא"],"correctAnswerIndex":3},{"id":"usa-canyon","question":"איזה קניון מפורסם נמצא בארצות הברית?","answers":["הגרנד קניון","קניון ורדון","קניון טודרה","קניון עין עבדת"],"correctAnswerIndex":0},{"id":"usa-continent","question":"באיזו יבשת נמצאת ארצות הברית?","answers":["אירופה","צפון אמריקה","דרום אמריקה","אפריקה"],"correctAnswerIndex":1}],
  'canada': [{"id":"canada-capital","question":"מהי עיר הבירה של קנדה?","answers":["אוטווה","קהיר","רומא","טוקיו"],"correctAnswerIndex":0},{"id":"canada-maple","question":"איזה עלה מופיע בדגל קנדה?","answers":["עלה גפן","עלה אדר","עלה זית","עלה דקל"],"correctAnswerIndex":1},{"id":"canada-flag-color","question":"איזה צבע מופיע משני צדי דגל קנדה?","answers":["כחול","שחור","אדום","ירוק"],"correctAnswerIndex":2},{"id":"canada-falls","question":"אילו מפלים נמצאים בגבול קנדה וארצות הברית?","answers":["מפלי איגואסו","מפלי אוזוד","מפלי נאצ׳י","מפלי הניאגרה"],"correctAnswerIndex":3},{"id":"canada-tower","question":"באיזו עיר קנדית נמצא מגדל סי־אן?","answers":["טורונטו","פריז","רומא","טוקיו"],"correctAnswerIndex":0},{"id":"canada-continent","question":"באיזו יבשת נמצאת קנדה?","answers":["אוקיאניה","צפון אמריקה","אירופה","אפריקה"],"correctAnswerIndex":1}],
  'brazil': [{"id":"brazil-capital","question":"מהי עיר הבירה של ברזיל?","answers":["ברזיליה","בואנוס איירס","רומא","פריז"],"correctAnswerIndex":0},{"id":"brazil-flag","question":"איזה צבע מקיף את המעוין בדגל ברזיל?","answers":["שחור","ירוק","אדום","לבן"],"correctAnswerIndex":1},{"id":"brazil-dance","question":"איזה ריקוד מזוהה עם ברזיל?","answers":["טנגו","הורה","סמבה","ואלס"],"correctAnswerIndex":2},{"id":"brazil-forest","question":"איזה יער גדול נמצא בברזיל?","answers":["היער השחור","יער בן שמן","יער שרווד","יער האמזונס"],"correctAnswerIndex":3},{"id":"brazil-rio","question":"באיזו עיר נמצא פסל ישו הגואל?","answers":["ריו דה ז׳ניירו","קהיר","רומא","טוקיו"],"correctAnswerIndex":0},{"id":"brazil-continent","question":"באיזו יבשת נמצאת ברזיל?","answers":["אפריקה","דרום אמריקה","אירופה","אסיה"],"correctAnswerIndex":1}],
  'argentina': [{"id":"argentina-capital","question":"מהי עיר הבירה של ארגנטינה?","answers":["בואנוס איירס","ברזיליה","רבאט","טוקיו"],"correctAnswerIndex":0},{"id":"argentina-flag","question":"איזה סמל מופיע במרכז דגל ארגנטינה?","answers":["כוכב ירוק","שמש","עלה","עיגול אדום"],"correctAnswerIndex":1},{"id":"argentina-dance","question":"איזה ריקוד מזוהה עם ארגנטינה?","answers":["ואלס","סמבה","טנגו","הורה"],"correctAnswerIndex":2},{"id":"argentina-patagonia","question":"איזה אזור טבע מפורסם נמצא בדרום ארגנטינה?","answers":["הסהרה","הגליל","היער השחור","פטגוניה"],"correctAnswerIndex":3},{"id":"argentina-mate","question":"איך נקרא משקה צמחים מוכר בארגנטינה?","answers":["מאטה","אספרסו","לימונדה","שוקו"],"correctAnswerIndex":0},{"id":"argentina-continent","question":"באיזו יבשת נמצאת ארגנטינה?","answers":["אוקיאניה","דרום אמריקה","אסיה","אירופה"],"correctAnswerIndex":1}],
  'australia': [{"id":"australia-capital","question":"מהי עיר הבירה של אוסטרליה?","answers":["קנברה","סידני","פריז","טוקיו"],"correctAnswerIndex":0},{"id":"australia-kangaroo","question":"איזו חיה מזוהה עם אוסטרליה?","answers":["פיל","קנגורו","דוב קוטב","גמל"],"correctAnswerIndex":1},{"id":"australia-opera","question":"באיזו עיר נמצא בית האופרה האוסטרלי המפורסם?","answers":["קהיר","ברלין","סידני","רומא"],"correctAnswerIndex":2},{"id":"australia-koala","question":"איזו חיה אוסטרלית חיה על עצים ואוכלת עלי אקליפטוס?","answers":["זברה","כלב","סוס","קואלה"],"correctAnswerIndex":3},{"id":"australia-reef","question":"איזה אתר טבע נמצא מול חופי אוסטרליה?","answers":["שונית המחסום הגדולה","ים המלח","הגרנד קניון","מפל הבניאס"],"correctAnswerIndex":0},{"id":"australia-continent","question":"לאיזה אזור בעולם שייכת אוסטרליה?","answers":["דרום אמריקה","אוקיאניה","אירופה","אפריקה"],"correctAnswerIndex":1}],
  'new-zealand': [{"id":"new-zealand-capital","question":"מהי עיר הבירה של ניו זילנד?","answers":["ולינגטון","אוקלנד","קנברה","טוקיו"],"correctAnswerIndex":0},{"id":"new-zealand-kiwi","question":"איזו ציפור מזוהה עם ניו זילנד?","answers":["טווס","קיווי","יען","פלמינגו"],"correctAnswerIndex":1},{"id":"new-zealand-flag","question":"איזה צבע יש לכוכבים בדגל ניו זילנד?","answers":["צהוב","שחור","אדום","ירוק"],"correctAnswerIndex":2},{"id":"new-zealand-islands","question":"מהם שני האיים העיקריים של ניו זילנד?","answers":["כרתים וקפריסין","סיציליה וסרדיניה","הונשו והוקאידו","האי הצפוני והאי הדרומי"],"correctAnswerIndex":3},{"id":"new-zealand-hobbiton","question":"איזה כפר סרטים מפורסם נמצא בניו זילנד?","answers":["הוביטון","דיסנילנד","ונציה","הוליווד"],"correctAnswerIndex":0},{"id":"new-zealand-continent","question":"לאיזה אזור בעולם שייכת ניו זילנד?","answers":["דרום אמריקה","אוקיאניה","אפריקה","אירופה"],"correctAnswerIndex":1}],
};
