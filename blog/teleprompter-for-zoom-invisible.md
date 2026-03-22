---
title: "Untitled"
description: "Read the latest blog post from VoicePrompter."
date: "Mar 16, 2026"
image: "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?auto=format&fit=crop&w=800&q=80"
keywords: ["teleprompter", "video production"]
---
Here's a situation I've been in more times than I'd like to admit.

You have a sales call in thirty minutes. You've written out exactly what you want to say — the opening, the demo flow, the pricing reveal, all of it. The script is good. You practiced it last night. But the moment you hit "Join Meeting," it all evaporates. You open a second window to glance at your notes, your eyes drift off-camera, and the person on the other end can tell immediately that you're not actually talking to them.

The obvious solution is a teleprompter. The obvious problem with that solution, until recently, is that teleprompter apps showed up in your screen share.

Here's what I mean. Most teleprompter software runs as a regular window on your desktop. When you share your screen in Zoom or Google Meet, that window is visible to everyone — either as an awkward floating text box in the corner of your video, or as a full overlay in your screenshare. Neither option is acceptable in a professional context.

## What "Invisible" Actually Means

[VoicePrompter for Mac](https://apps.apple.com/pl/app/voiceprompter/id6758573080) solves this with a specific macOS capability: the app window is excluded from screen capture entirely.

What that means in practice: the overlay is visible to you — it's sitting right there on your screen, floating over your Zoom window, your slides, everything. But from the perspective of your camera, your screen recording, and your Zoom participants, it simply doesn't exist. The screen share shows your slides or desktop. The video shows you looking directly ahead. Nobody sees the script.

This is different from just "having a small window" or "positioning it off-screen." The window is literally not captured by macOS's screen recording APIs. Zoom, Teams, OBS, QuickTime — none of them pick it up.

## Always-on-Top: The Other Half of the Problem

Invisibility is only useful if the teleprompter is actually visible to you while you're presenting. And this is where a lot of overlay tools fall apart.

If your teleprompter window can't stay on top of a full-screen Zoom meeting or a full-screen presentation, it disappears behind whatever app is in focus. You switch to Keynote to present your slides — your teleprompter is gone. You go full-screen in Zoom — your teleprompter is gone.

VoicePrompter for Mac stays on top of everything. Full-screen apps, multiple desktops, full-screen presentations. You can drag it wherever makes sense for your setup — right next to your camera, directly below it, off to the side if you're using a second monitor.

## How to Position It for Natural Eye Contact

Where you put the window matters a lot for how natural you look on camera.

If you're on a laptop, the camera is in the top bezel. Put the teleprompter window directly below the camera, as close to the top of your screen as it can sit while still being readable. This minimizes the angle between your eyes and the lens.

If you're on a desktop with an external monitor and a separate webcam, position the teleprompter window on the same monitor as the webcam. Even better, position it directly adjacent to the webcam itself.

I've found the sweet spot is: script window immediately below the camera, font large enough to read comfortably without squinting, scroll speed matched to a pace slightly slower than I'd naturally speak. Voice-activated scrolling handles the rest.

You can read more about positioning and delivery technique in [how to read a script without looking like you're reading](./how-to-read-script-without-looking-like-reading.md).

## Voice-Activated Scrolling in a Zoom Meeting

The voice scrolling on the Mac app uses Apple's native on-device speech recognition. This is important for a couple of reasons.

First, it's private — nothing is sent to a server. In a sales call or business meeting, that matters. Your script stays on your device.

Second, it works offline. If your internet drops for thirty seconds in the middle of a call (it happens), the teleprompter keeps working. Your voice recognition is not dependent on your connection quality.

Third, the recognition is fast. The Mac version uses the same underlying engine that Apple uses across the OS, which has had a lot of investment behind it. It handles natural speech patterns, doesn't require you to enunciate like a robot, and doesn't fall apart when you pause for emphasis.

If you speak English in a meeting but sometimes code-switch into another language, VoicePrompter supports 60+ languages and detects the language of your script automatically. More on that in [teleprompter with 60+ languages](./multilingual-teleprompter-60-languages.md).

## Who This Is For

The use cases I see most often:

**Sales calls.** You've written a tight pitch. You want to deliver it confidently without forgetting the key points, without visibly glancing at notes, without losing your train of thought when the prospect interrupts with a question.

**Webinars and online presentations.** You're presenting to a large group. You want to seem polished and prepared. You need the script to not appear in your screen share.

**Product demos.** You're walking someone through your product while narrating. The teleprompter sits alongside your demo, guiding your script while your screen share shows the product.

**Podcasts recorded over video call.** You have notes, talking points, or a full script. You want to be able to reference them without looking like you're reading from a teleprompter.

I wrote more specifically about each of these in [how to record product demos](./how-to-record-product-demo-video.md) and [zoom sales call tips](./zoom-presentation-tips-sales-calls.md).

## Getting Started

The app is on the Mac App Store: [VoicePrompter for Mac](https://apps.apple.com/pl/app/voiceprompter/id6758573080). It's $3.99/month or $39.99/year, with a free tier that includes unlimited use of the demo script and up to 3 custom scripts. If you want to test before committing, that's more than enough to run it through a real call.

The setup is minimal. Install, open, paste your script from clipboard, resize and position the window, start the voice recognition. That's it. The app lives in your menu bar so you can access it anytime without cluttering your dock.

---

**Related articles:**
- [Why All Teleprompter Apps Are Terrible (And What I Did About It)](./why-all-teleprompter-apps-suck.md)
- [Best Teleprompter App for Mac](./best-teleprompter-app-for-mac.md)
- [Zoom Sales Call Presentation Tips](./zoom-presentation-tips-sales-calls.md)
- [How to Look Confident on Camera](./how-to-look-confident-on-camera.md)
