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
};
