export interface SupportArticle {
 id: string; question: string; category: string; platforms: string[]; answer: string; keywords: string; videoUrl: string | null;
}
// Add a YouTube URL to videoUrl when a tutorial is ready.
export const articles: SupportArticle[] = [
  {
    "id": "start-script",
    "question": "How do I start a script?",
    "category": "Getting started",
    "platforms": [
      "android",
      "iOS",
      "iPadOS",
      "macOS"
    ],
    "answer": "<ol><li>Copy your script from anywhere: Notes, Google Docs, Word, an email, or any other app.</li><li>Open VoicePrompter and select <strong>Start from clipboard</strong>.</li><li>Choose Voice scrolling, start listening, and read your script aloud.</li></ol><p>Want to film yourself too? Switch to Video mode using the steps below.</p>",
    "keywords": "paste load upload text begin",
    "videoUrl": null
  },
  {
    "id": "video-mode",
    "question": "How do I switch to Video mode and record myself?",
    "category": "Getting started",
    "platforms": [
      "android",
      "iOS",
      "iPadOS"
    ],
    "answer": "<ol><li>Start your script in VoicePrompter.</li><li>Open Settings or the quick settings dock and change the <strong>prompter mode to Video</strong>.</li><li>Allow camera and microphone access if asked.</li><li>Choose Voice scrolling, then start recording and read your script.</li></ol><p>You can also use the floating window to read while recording in another camera app. Some Android devices have a microphone-sharing limitation - see the Android recording answer below.</p>",
    "keywords": "camera film selfie recording android iphone ipad",
    "videoUrl": null
  },
  {
    "id": "import-script",
    "question": "How do I import a script from a document or PDF?",
    "category": "Getting started",
    "platforms": [
      "android",
      "iOS",
      "iPadOS",
      "macOS"
    ],
    "answer": "<p>Copy the text from your document, then choose <strong>Start from clipboard</strong> in VoicePrompter.</p><p>For a PDF, you can use a tool such as <a href=\"https://www.ihatepdf.cv/extract-text\" target=\"_blank\" rel=\"noopener noreferrer\">ihatepdf Extract Text ↗</a>, copy the extracted text, and start it from your clipboard. Scanned PDFs may need text recognition (OCR) first.</p>",
    "keywords": "word google docs pdf import upload paste document",
    "videoUrl": null
  },
  {
    "id": "not-scrolling",
    "question": "Why aren’t the words scrolling with my voice?",
    "category": "Voice scrolling",
    "platforms": [
      "android",
      "iOS",
      "iPadOS",
      "macOS"
    ],
    "answer": "<p>First, make sure you selected <strong>Voice scrolling</strong> and started listening. Then check these common causes:</p><ul><li><strong>On iPhone, iPad, or Mac:</strong> enable Siri and Dictation in your system settings. Make sure the speech-recognition language you need is downloaded in Dictation settings where available.</li><li><strong>Check microphone access:</strong> allow VoicePrompter to use the mic and make sure the intended microphone is connected.</li><li><strong>Check your place in the script:</strong> if you scrolled manually, tap or click the word you want to read from. Moving the view alone can leave the active word much earlier in the script.</li><li><strong>Check the recognition language:</strong> it should match the language you are reading.</li></ul><p>If it still does not move, send me a short recording showing the script and what happens when you speak.</p>",
    "keywords": "stuck frozen no movement siri dictation language permission active line listening",
    "videoUrl": null
  },
  {
    "id": "slow-scrolling",
    "question": "Voice scrolling isn’t keeping up. How can I make it faster?",
    "category": "Voice scrolling",
    "platforms": [
      "android",
      "iOS",
      "iPadOS",
      "macOS"
    ],
    "answer": "<p>Voice scrolling follows the words it recognizes, so the first thing to check is how clearly your device can hear you.</p><ul><li>Try reading with the device closer to you. If it keeps up, distance is likely part of the problem.</li><li>Reduce background noise. Strong accents can also make recognition take longer.</li><li>Enable <strong>Show recognized words</strong> to see what the app is hearing.</li><li>For recording at a distance, use an external microphone connected through your device’s port. A wireless mic with its receiver plugged into the port works differently from a Bluetooth-only mic.</li></ul><p>A fixed scrolling-speed control will not make speech recognition faster.</p>",
    "keywords": "lag delay speed faster accent noise distance slow",
    "videoUrl": null
  },
  {
    "id": "external-microphone",
    "question": "Can I use an external microphone?",
    "category": "Voice scrolling",
    "platforms": [
      "android",
      "iOS",
      "iPadOS",
      "macOS"
    ],
    "answer": "<p>Yes. Use a wired microphone or a wireless microphone with its <strong>receiver connected through your device’s port</strong>, using a compatible adapter if needed.</p><p><strong>On iOS and Android, use a port-connected mic, not a Bluetooth-only connection.</strong> Bluetooth microphones are not supported for this VoicePrompter recording and voice-scrolling setup because of platform audio restrictions.</p><p>Before a full recording, make a short test to check that the intended microphone is being used. On Mac, also check your selected audio input.</p>",
    "keywords": "bluetooth usb usb-c lightning wireless rode dji receiver headset airpods audio input",
    "videoUrl": null
  },
  {
    "id": "rotate-pip",
    "question": "How do I rotate Picture in Picture for landscape recording on iPhone?",
    "category": "Floating window",
    "platforms": [
      "iOS",
      "iPadOS"
    ],
    "answer": "<p>The native Camera app does not rotate its entire interface when you turn your device, so the floating text can stay in portrait.</p><ol><li>Open <strong>VoicePrompter → Settings → Picture in Picture</strong>.</li><li>Use the option to <strong>force rotate the content</strong> of the floating window.</li><li>Return to the Camera app and check that the text faces the right way for your landscape recording.</li></ol><p>This rotates the text inside Picture in Picture.</p>",
    "keywords": "pip sideways horizontal landscape native camera rotation orientation",
    "videoUrl": null
  },
  {
    "id": "transparent-pip",
    "question": "Can I make the floating Picture in Picture window transparent?",
    "category": "Floating window",
    "platforms": [
      "android",
      "iOS",
      "iPadOS"
    ],
    "answer": "<p>No. Making the floating Picture in Picture window transparent is not technically supported on iOS or Android.</p><p>This is different from the script background inside VoicePrompter’s built-in Video mode. The background controls there do not make the external floating window transparent.</p>",
    "keywords": "opacity background see through bubble overlay transparent",
    "videoUrl": null
  },
  {
    "id": "android-recording",
    "question": "Why does voice scrolling stop when I start recording on Android?",
    "category": "Recording",
    "platforms": [
      "android"
    ],
    "answer": "<p>On some Android devices, the camera takes over microphone access when recording starts. VoicePrompter then cannot hear you, even though the floating script is still visible.</p><p class=\"notice\"><strong>An update is in review.</strong> I have submitted a new version designed to resolve this issue. It is not available to everyone yet.</p><p>Until it is available, try the built-in Video mode if you were using another camera app. If your device still blocks voice scrolling, use Constant scrolling or record on a separate device.</p>",
    "keywords": "samsung pixel microphone sharing simultaneous camera freeze accessibility",
    "videoUrl": null
  },
  {
    "id": "natural-reading",
    "question": "How can I look more natural while reading?",
    "category": "Recording",
    "platforms": [
      "android",
      "iOS",
      "iPadOS",
      "macOS"
    ],
    "answer": "<p>Keep your active reading line as close to the camera lens as possible, so your eyes do not keep looking away from it.</p><ul><li>Adjust <strong>Active line position</strong> to bring the line you are reading closer to the lens.</li><li>Adjust the margins and text size until you have a comfortable reading area near the camera. Reduce unnecessary space between the text and lens, and avoid lines so wide that your eyes travel across the screen.</li><li>Speak naturally and let Voice scrolling follow you.</li></ul><p>Record a short test and watch your eye movement before filming the full script.</p>",
    "keywords": "eye contact margins active line natural camera reading gaze",
    "videoUrl": null
  },
  {
    "id": "4k-recording",
    "question": "Does VoicePrompter support 4K recording?",
    "category": "Recording",
    "platforms": [
      "android",
      "iOS",
      "iPadOS"
    ],
    "answer": "<p>Yes. The native Android, iPhone, and iPad apps support recording <strong>up to 4K</strong>, depending on your device and selected camera.</p><p>Switch to Video mode and choose 4K in the recording-quality settings if your camera supports it. Available quality can differ between front and rear cameras.</p><p>The Mac app is a prompter for use alongside a separate recording app.</p>",
    "keywords": "resolution video quality hd uhd camera grainy",
    "videoUrl": null
  },
  {
    "id": "hidden-mac",
    "question": "How do I hide my script from screen sharing and recordings on Mac?",
    "category": "Mac setup",
    "platforms": [
      "macOS"
    ],
    "answer": "<p>Enable <strong>Hidden from screen sharing and recordings</strong> in VoicePrompter’s settings. You will still see your script while the window is excluded from screen capture.</p><p>Make a short test with your meeting or recording app before your session.</p><p>If you are sending me a screen recording to troubleshoot the prompter, temporarily turn this setting off so I can see the issue.</p>",
    "keywords": "invisible hidden zoom teams obs screen share capture",
    "videoUrl": null
  },
  {
    "id": "external-monitor",
    "question": "Why does the prompter disappear on my Elgato or external monitor?",
    "category": "Mac setup",
    "platforms": [
      "macOS"
    ],
    "answer": "<p>Some external-display setups can conflict with the setting that hides VoicePrompter from screen capture.</p><ol><li>Turn off <strong>Hidden from screen sharing and recordings</strong> in VoicePrompter’s settings.</li><li>Move the prompter to the external screen again.</li><li>If needed, check VoicePrompter’s permission under <strong>System Settings → Privacy &amp; Security → Screen &amp; System Audio Recording</strong>.</li></ol><p>Turning off the hiding setting can make your script visible in screen shares and recordings. Test your setup before going live.</p>",
    "keywords": "elgato display monitor disappears invisible screen permission",
    "videoUrl": null
  },
  {
    "id": "android-purchase",
    "question": "My purchase isn’t syncing to another Android device. What should I do?",
    "category": "License & billing",
    "platforms": [
      "android"
    ],
    "answer": "<ol><li>Make sure Google Play uses the <strong>same Google account that made the purchase</strong> on both devices.</li><li>In Android Settings, open <strong>Apps → Google Play Store → Storage &amp; cache → Clear cache</strong>. If needed, do the same for Google Play services.</li><li>Choose <strong>Clear cache only</strong>, not Clear storage or Clear data.</li><li>Restart the device, open the Play Store, then return to VoicePrompter and tap <strong>Restore Purchases</strong>.</li></ol><p>Google Play sometimes takes time to recognize a purchase on another device. If it still does not appear, email me your Google receipt or order number and the models of both devices.</p>",
    "keywords": "restore purchases pro free paid tablet sync license google account",
    "videoUrl": null
  },
  {
    "id": "license-devices",
    "question": "Does one license cover all my devices?",
    "category": "License & billing",
    "platforms": [
      "android",
      "iOS",
      "iPadOS",
      "macOS"
    ],
    "answer": "<p><strong>Apple:</strong> one purchase works across your Mac, iPhone, and iPad when they use the same App Store account.</p><p><strong>Android:</strong> one purchase works across your Android phones and tablets using the same Google Play account.</p><p>Apple and Android licenses are separate. A purchase from one store cannot be restored through the other. VoicePrompter does not have a separate account to sign into.</p>",
    "keywords": "cross platform transfer lifetime subscription account devices license",
    "videoUrl": null
  },
  {
    "id": "free-vs-pro",
    "question": "Your video showed a free app. Why am I being asked to pay?",
    "category": "License & billing",
    "platforms": [
      "android",
      "iOS",
      "iPadOS",
      "macOS"
    ],
    "answer": "<p>The <a href=\"/app/\">free web app</a> and the native apps downloaded from the App Store or Google Play are separate products.</p><p>The web app is free to use in your browser. The native apps are free to try with a demo and <strong>three custom scripts</strong>. A Pro license unlocks unlimited scripts.</p><p>If you watched my video about the free browser app, you can still <a href=\"/app/\">open and use it here</a>.</p>",
    "keywords": "youtube free paid paywall web browser video subscription",
    "videoUrl": null
  },
  {
    "id": "pro-benefits",
    "question": "What do I get with a Pro license?",
    "category": "License & billing",
    "platforms": [
      "android",
      "iOS",
      "iPadOS",
      "macOS"
    ],
    "answer": "<p>Pro unlocks <strong>unlimited scripts</strong>, including creating and editing scripts beyond the free allowance.</p><p>You can test the native app with the demo and three free custom scripts before purchasing. Those three scripts remain available to read; Pro is needed to keep adding or editing your content.</p><p>Pro does not use a different voice-scrolling engine. If scrolling is not working, check the troubleshooting answers above.</p>",
    "keywords": "benefits unlimited scripts premium paid features three limit",
    "videoUrl": null
  },
  {
    "id": "invoice",
    "question": "How can I get an invoice for my purchase?",
    "category": "License & billing",
    "platforms": [
      "android",
      "iOS",
      "iPadOS",
      "macOS"
    ],
    "answer": "<p>Your purchase is handled by the store you bought it from:</p><ul><li><strong>iPhone, iPad, or Mac:</strong> Apple sends the receipt or invoice to the email associated with your purchase.</li><li><strong>Android:</strong> Google sends it to the Google account used for the purchase.</li></ul><p>Check that inbox and your spam folder. You can also check the purchase history in your Apple or Google account. I do not issue a separate invoice for store purchases.</p>",
    "keywords": "receipt invoice billing tax payment order",
    "videoUrl": null
  }
];
