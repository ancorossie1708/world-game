# Android shell — מסע בעולם

The KTC Android app packages the same Hebrew game used for the PC preview. It loads
`dist/` from a local HTTPS origin with AndroidX `WebViewAssetLoader`, with no external
website required for normal play. Target: KTC 24.5-inch landscape display, 16:9.
There is no separate Galaxy Fold layout. The app stays in landscape, supports touch,
uses an adaptive globe launcher icon, and hides Android system bars during play.

## Build

Pinned compatibility baseline: **JDK 17, Gradle 8.11.1, AGP 8.9.2, compile/target SDK 35,
minimum SDK 26**, WebKit 1.13.0, AndroidX Core 1.15.0. These intentionally pinned
dependencies support the target Android 14 KTC device. No fabricated Gradle wrapper
is included: GitHub Actions installs the specified Gradle distribution using the
official Gradle action.

From a Windows PC with JDK, SDK and Gradle installed:

```powershell
npm.cmd ci
powershell -ExecutionPolicy Bypass -File .\scripts\build-android.ps1
```

Set `ANDROID_HOME` to an SDK containing `platforms;android-35` and
`build-tools;35.0.0`. Pass `-GradleExecutable C:\path\gradle-8.11.1\bin\gradle.bat`
if Gradle is not on PATH. The script builds `dist/`; Gradle copies it into
`app/src/main/assets/www/` immediately before packaging. Generated assets/builds
and signing files are ignored by Git. The test APK is
`android/app/build/outputs/apk/debug/app-debug.apk`.

Alternatively, run **Android APK** in the repository's GitHub Actions tab after
uploading the source. It builds an installable debug APK and runs Android lint.
It also produces a signed release APK when all four repository secrets are present:

* `ANDROID_KEYSTORE_BASE64` — the release keystore encoded as base64.
* `ANDROID_KEYSTORE_PASSWORD`
* `ANDROID_KEY_ALIAS`
* `ANDROID_KEY_PASSWORD`

For a local signed build, set the latter three plus `ANDROID_KEYSTORE_PATH`, and run
the script with `-Configuration Release`. Keep this signing key backed up: every
update must retain the **same package ID and signing certificate**. CI debug builds
may use different temporary debug keys across runs and are intended for testing.
An APK signed with a production key cannot update an installation signed with a
different debug key. Start a lasting installation with the signed release APK.

The workflow only prepares downloadable build artifacts. It does **not** publish
or upload a GitHub Release automatically. After confirming the APK, attach the
signed `world-game.apk` to a public GitHub Release and send its direct download
link through WhatsApp. The first installation may require the caregiver to permit
installation from the browser. Android also asks for confirmation for app updates.

## Update configuration

Configure repository variable `WORLD_GAME_MANIFEST_URL` with the public HTTPS URL
of your versioned update manifest. CI embeds it into Android and the frontend.
For a local build pass `-ManifestUrl`, set `WORLD_GAME_MANIFEST_URL`, or use Gradle
`-PworldGameManifestUrl=...`. An empty value is supported: the packaged game works
offline, and update checks report `not-configured` until a repository is connected.

The shell checks a configured manifest at each cold launch without blocking the
local game. The frontend can also request a check. Only trusted GitHub HTTPS hosts
are accepted, including validated download redirects. No account tokens, private
repository credentials or API secrets are embedded in the app. The Android bridge
does not depend on browser CORS for GitHub requests.

Shared manifest format:

```typescript
{
  schemaVersion: 1,
  app?: {
    version: string,
    versionCode: number, // positive and increasing for new APKs
    apkUrl: string,      // trusted GitHub HTTPS URL
    sha256: string       // actual 64-character SHA-256
  },
  content?: {
    version: string,     // change when files change
    minAppVersionCode?: number,
    files: Array<{
      path: string,     // content/catalog.json, content/images/italy-1.jpg, etc.
      url: string,      // trusted GitHub HTTPS URL
      sha256: string,
      bytes?: number
    }>
  }
}
```

At least one of `app` or `content` is required. Accepted downloadable formats are
JSON, JPG/JPEG, PNG, WebP, WAV and MP3. Downloaded HTML, JavaScript and SVG cannot
replace packaged code. Paths are confined to `content/**` with no traversal.
Limits: 1000 files, 64 MiB per content file (2 MiB for JSON), 512 MiB per content batch, 2 MiB manifest,
256 MiB APK. The update manifest must list **every file needed by its catalog**;
the exporter should include the complete `public/content` tree, not a partial diff.

## JavaScript bridge

`window.WorldGameNative` is available only inside the Android app. All methods
that return values return **JSON strings**, so call `JSON.parse(...)`. The browser
preview handles its own offline storage and has no native bridge.

| Method | Result / purpose |
| --- | --- |
| `getStatus()` / `getAppInfo()` | `{platform:'android', appVersion, version, versionCode, contentVersion, readyContentVersion, updateManifestUrl, online}` |
| `readContentManifest()` | Active full update manifest, or JSON `null` for packaged content |
| `getUpdateStatus()` | Latest native update event, or `{status:'idle'}` |
| `checkUpdates(manifestUrl)` | `{jobId,status:'started'}`; empty argument uses embedded URL |
| `checkForUpdates()` | Alias for checking the embedded URL |
| `downloadContent(manifestUrl)` | Starts verified background batch download; returns `{jobId,status:'started'}` |
| `setRoundActive(boolean)` | Guards content activation while a round is active |
| `activateContent()` | Synchronous `{status:'active',contentVersion,changed}`; or `deferred` during a round |
| `openApkUpdate(apkUrl,sha256)` | Downloads/verifies APK, then opens Android's installation flow |

Supply explicit URL and hash to `openApkUpdate`. Empty strings can use the app
specification from the last successful native check. A missing or invalid hash is
rejected. APK package ID, increasing version code and matching signing certificate
are checked before the Android installer opens. There is no silent installation.

Long operations notify JavaScript with
`window.addEventListener('journey:native', event => { const detail = event.detail; })`.
Every event includes `{event,jobId,status}`:

* `event:'update-check', status:'checked'`: includes `manifest`,
  `appUpdateAvailable`, `contentUpdateAvailable`, `contentCompatible`,
  `readyContentVersion`.
* `event:'content-download', status:'progress'`: includes `completedFiles`,
  `totalFiles`, `downloadedBytes`, `contentVersion`.
* `event:'content-download', status:'ready'`: full batch verified, waiting for
  frontend to call `activateContent()` between rounds.
* `event:'content-activation', status:'active'`: includes `contentVersion` and
  `changed`. `status:'deferred'` means a round is active.
* `event:'apk-update'`: `downloading`, `permission-required`, `installer-opened`,
  `cancelled`. `installer-opened` is **not** a claim that installation succeeded.
* Failed operations use `status:'error'` and `error`; missing connection uses
  `status:'offline'`. Current game content remains usable.

Immediate method responses can also be `not-configured`, `busy`, `error` or
`deferred`. `getUpdateStatus()` lets a freshly mounted frontend recover an event
that arrived before its listener.

The native Activity dispatches `journey:pause` on backgrounding; the frontend should
stop audio/WebAudio in response. HTML media are additionally paused by the shell.
Android's Back button dispatches `journey:back` so the game can show its own simple
navigation. Service Worker registration should be skipped in native mode, because
native permanent storage already provides offline content.

## Offline storage and safe activation

Core UI, the initial catalog and bundled media are in the APK. The WebView origin
is always `https://appassets.androidplatform.net/assets/www/`, which preserves the
frontend's local album and settings across same-key APK upgrades.

Media batches live under app-private `files/journey-content/generations/`, outside
the disposable WebView/network cache. Files are downloaded into an inactive
generation, size checked and SHA-256 checked individually. Only after all files
are verified is a ready pointer saved atomically. `activateContent()` atomically
switches the active generation between rounds. An interrupted download leaves
the prior active batch untouched. A previous generation is retained for recovery;
abandoned staging files are cleaned on the next launch.

Downloaded JSON is parsed before activation. A downloaded country catalog must
have schema version 1, nonempty countries, unique valid IDs, and every referenced
picture/music file listed in the verified batch. Catalog and manifest version
labels do not have to match; the manifest version governs content activation.

Requests to the same `.../assets/www/content/**` paths use the active native files,
then packaged assets for paths outside that batch. Audio responses support byte
ranges. No album or setting records are inside these generations. Installing an
update preserves app-private files and WebView storage; uninstalling the app or
clearing its storage removes them.

## Verification status and device checks

No JDK/Android SDK was installed on the implementation PC. The Java/Gradle source,
build script and workflow are prepared, but an APK build and Android device run
are still required; the workflow is not evidence that a build has already passed.

Before sharing a release, verify on KTC:

1. First installation, Hebrew text, launcher icon and full-screen 16:9 touch layout.
2. Finish a round; restart in airplane mode; confirm album, pictures and music.
3. Complete a media update and apply it between rounds.
4. Interrupt a download; confirm the prior game remains available.
5. Try an incorrect hash and an incompatible content version; confirm rejection.
6. Install a higher-version APK signed with the same key; confirm saved album.
7. Return from Android installation settings; confirm the installer appears only
   when the caregiver granted permission.

Implementation references:
[AGP 8.9 compatibility](https://developer.android.com/build/releases/agp-8-9-0-release-notes),
[local HTTPS content](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content),
[AndroidX WebKit releases](https://developer.android.com/jetpack/androidx/releases/webkit),
[FileProvider](https://developer.android.com/reference/androidx/core/content/FileProvider),
[Gradle setup](https://github.com/gradle/actions/blob/main/docs/setup-gradle.md).

## הוראות פרסום והתקנה בעברית

הדוגמאות משתמשות בשם המאגר `world-game`. החליפו `YOUR_USER` בשם המשתמש שלכם ב־GitHub. תהליך הבנייה קיים, אך APK חתום עדיין צריך להיבנות ולהיבדק על מכשיר.

### 1. העלאת הפרויקט

ב־GitHub Desktop בחרו File → Add local repository ואת התיקייה `E:\Apps\World Game`. אם אין בה מאגר Git, בחרו יצירת מאגר בתיקייה הזו. לאחר מכן בחרו Publish repository, שם `world-game` וענף `main`. מאגר Public מאפשר להוריד את קובץ ההתקנה ללא חשבון GitHub ומפרסם גם את קוד המקור והמשאבים. קובץ `.gitignore` שבפרויקט מוציא מההעלאה את `node_modules`, תוצרי הבנייה, קובצי חתימה וקובצי עבודה זמניים.

### 2. חתימה קבועה, פעם אחת

התקינו [Temurin JDK 17](https://adoptium.net/temurin/releases/?version=17). פתחו PowerShell בתיקיית הפרויקט והפעילו:

```powershell
keytool -genkeypair -keystore world-game-release.jks -storetype JKS -alias world-game -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=World Game"
```

בחרו סיסמת מאגר; כשנשאלים על סיסמת המפתח אפשר ללחוץ Enter כדי להשתמש באותה סיסמה. שמרו גיבוי של קובץ החתימה ושל הסיסמה. קובץ החתימה נשאר מחוץ לקוד המפורסם. אותו מפתח ישמש לכל העדכונים.

במאגר ב־GitHub, תחת Settings → Secrets and variables → Actions → Secrets, הוסיפו:

| שם | ערך |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | הקובץ מקודד ל־Base64, באמצעות הפקודה הבאה |
| `ANDROID_KEYSTORE_PASSWORD` | הסיסמה שבחרתם |
| `ANDROID_KEY_ALIAS` | `world-game` |
| `ANDROID_KEY_PASSWORD` | אותה סיסמה, אם בחרתם כך |

העתקה ללוח כדי להדביק ישירות בשדה הסוד הראשון:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path -LiteralPath '.\world-game-release.jks').Path)) | Set-Clipboard
```

### 3. כתובת העדכונים

באותו מסך עברו ללשונית Variables. הוסיפו משתנה `WORLD_GAME_MANIFEST_URL` בערך:

```text
https://raw.githubusercontent.com/YOUR_USER/world-game/main/release-manifest.json
```

הכתובת תיכלל בקובץ ההתקנה. קובץ העדכונים יפורסם בשלב 6; עד שהוא זמין המשחק ממשיך לעבוד עם התוכן הארוז.

### 4. הפקת קובץ התקנה

ב־GitHub בחרו Actions → Android APK → Run workflow. בחרו `main`, גרסה `0.1.0` ומספר גרסה `1`. לאחר הצלחת הבנייה, הורידו את התוצר `world-game-signed-release-apk`. חלצו ממנו את `world-game.apk` ושמרו עותק מקומי, למשל בתיקיית `.work/release` שבפרויקט. אם הופק רק תוצר debug, ארבע הגדרות החתימה עדיין לא הוגדרו במלואן.

### 5. פרסום ושליחה בוואטסאפ

לאחר התקנה ובדיקה ראשונה בטאבלט, פתחו Releases → Draft a new release. צרו תג `v0.1.0`, צרפו את `world-game.apk` ופרסמו. אפשר לשלוח קישור קבוע לגרסה האחרונה:

```text
https://github.com/YOUR_USER/world-game/releases/latest/download/world-game.apk
```

בטאבלט פותחים את הקישור, מורידים את ה־APK ופותחים אותו. Android עשוי לבקש לאפשר התקנה מהדפדפן ואז לאשר התקנה. לאחר מכן מופיע אייקון „מסע בעולם”. התמונות, המוזיקה וצליל הניצחון כלולים בהתקנה.

### 6. פרסום קובץ העדכונים

לאחר פרסום התג וה־APK, הפיקו מתיקיית הפרויקט את רשימת העדכונים. הדוגמה מניחה שה־APK נמצא ב־`.work/release/world-game.apk`:

```powershell
node scripts/prepare-updates.mjs --base-url=https://raw.githubusercontent.com/YOUR_USER/world-game/v0.1.0/public/content/ --content-version=0.1.0 --app-version=0.1.0 --app-version-code=1 --apk=.work/release/world-game.apk --apk-url=https://github.com/YOUR_USER/world-game/releases/download/v0.1.0/world-game.apk --output=release-manifest.json
```

העלו את `release-manifest.json` לענף `main` באמצעות Commit ו־Push ב־GitHub Desktop. הפרסום של הקובץ הזה נעשה בסוף, לאחר שקובץ ההתקנה וכל משאבי התוכן זמינים. הכלי מחשב את בדיקות השלמות מתוך הקבצים עצמם.

### 7. עדכונים ותוכן חדש

שינוי בעיצוב או בהתנהגות המשחק מצריך APK חדש: שומרים את אותו מפתח חתימה, מגדילים את מספר הגרסה ל־`2`, `3` וכן הלאה, ובונים ומפרסמים גרסה חדשה. המשתמש מאשר את עדכון האפליקציה ב־Android. התקנת עדכון על גבי האפליקציה הקיימת שומרת את נתוני האלבום; אין צורך להסיר אותה.

תמונות חדשות נשמרות ב־`public/content/photos`, מוזיקה ב־`public/content/audio`, ומדינות, דגלים ושאלות מתעדכנים ב־`public/content/catalog.json`. מדינה חדשה כוללת שיוך ליבשת, נתוני דגל, מוזיקה, עשרים תמונות ושש שאלות עם ארבע תשובות לכל שאלה. עדכון תוכן במסגרת המבנה הנתמך אינו דורש התקנת APK חדש.

העלו את התוכן, צרו עבורו תג קבוע כגון `content-0.1.1`, והפיקו מחדש את קובץ העדכונים עם כתובת הבסיס `https://raw.githubusercontent.com/YOUR_USER/world-game/content-0.1.1/public/content/` ו־`--content-version=0.1.1`. כללו שוב גם את פרטי ה־APK האחרון באפשרויות `--app-*`, כדי שהודעת עדכון האפליקציה תישאר זמינה למי שטרם התקין אותו. עדכנו את קובץ הרשימה ב־`main` רק לאחר שהקבצים זמינים.

הרשימה כוללת את חבילת התוכן המלאה. במשחק מופעלת בדיקה ברקע בכל פתיחה עם רשת; תוכן חדש מופעל בין סבבים. הורדה שנקטעה משאירה את התוכן הקודם זמין. בדיקת תוכן, התקנת APK ובדיקה ללא רשת על KTC נדרשות לפני הפצה רחבה.

מקורות: [GitHub Desktop](https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-a-repository-from-your-local-computer-to-github-desktop), [קישורי הורדה לגרסאות](https://docs.github.com/en/repositories/releasing-projects-on-github/linking-to-releases), [חתימת Android](https://developer.android.com/studio/publish/app-signing), [התקנה מקישור](https://developer.android.com/distribute/marketing-tools/alternative-distribution).
