---
title: "How to Use a Teleprompter on Google Meet (Without Anyone Seeing It)"
description: "A step-by-step guide to using an invisible, voice-activated teleprompter on Google Meet. Stays on top during screen shares, scrolls automatically as you speak, runs natively on Mac."
date: "May 24, 2026"
image: "https://i.ytimg.com/vi/hflxTHcTDpE/maxresdefault.jpg"
keywords:
  - google meet teleprompter
  - teleprompter for google meet
  - how to use teleprompter on google meet
  - video calls
  - screen sharing
video:
  videoId: "hflxTHcTDpE"
  duration: "PT3M3S"
---

If you've ever wished you could see your script on a Google Meet call without making it obvious you were reading from it - this post is for you.

I built a tool that solves exactly this problem, and I want to walk through how it actually works. By the end you'll know how to set up an invisible teleprompter for Google Meet, why it doesn't appear in screen shares, and how it scrolls itself while you talk.

<div class="video-responsive"><iframe src="https://www.youtube.com/embed/hflxTHcTDpE" title="How to use a teleprompter on Google Meet" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>

## Why I built this in the first place

For about a year, I was recording podcasts and webinars over Google Meet almost every week. I had experience hosting. I had outlines. I rehearsed. And it was still stressful every single time.

The worry was always the same: forgetting a question I really wanted to ask, blanking on the name of a tool I meant to reference, fumbling the transition into the next segment. I tried the obvious workarounds - sticky notes on my monitor, a Google Doc open in another window, a printed page next to the camera. They all had the same problem: my eyes were visibly not on the camera, and guests could tell.

Eventually I got tired of it and built [VoicePrompter](/mac/google-meet/) - a native Mac app that puts your script in a floating window that's invisible to everyone except you. It took the stress out of recording, gave me back the time I was spending re-doing takes, and ended up being the thing I now use for every Google Meet call, not just podcasts.

## What "invisible during screen sharing" actually means

This is the part that surprises most people, so I want to be precise about it.

Most teleprompter apps run as regular desktop windows. The moment you share your screen on Google Meet, that window is visible to everyone on the call - either floating awkwardly in the corner of your camera tile, or right there in the middle of your screen share. Not acceptable in a sales call, a job interview, or a webinar.

VoicePrompter uses a specific macOS capability: the app's window is excluded from screen capture at the OS level. What that means in practice:

- **You see it.** It's floating right there on your screen, sitting on top of Google Meet, your slides, your demo - wherever you place it.
- **Nobody else sees it.** Not on your shared screen, not on a recording, not on a screenshot. Google Meet, OBS, QuickTime, Loom - none of them pick the window up.

It's not "small" or "off-screen" or "hidden behind another window." The window is literally not captured by the screen recording APIs. This is the core feature, and it's the reason the rest of the app works.

## How the voice scrolling works

The second thing people ask is how the script keeps up with you while you're talking on a Google Meet call.

VoicePrompter uses Apple's on-device speech recognition. As you speak, the app matches what you're saying to the next chunk of your script and scrolls forward at exactly your pace. When you pause to listen to someone, the scrolling pauses. When you pick back up, it picks back up. If you skip a line or improvise, it figures out where you are within a second or two and continues from there.

Three things matter about doing this on-device:

1. **It's private.** Your script never leaves your Mac. Your audio never leaves your Mac. Nothing is sent to a server, ever. For sales calls, recruiter interviews, or anything covered by NDA, this is the only acceptable answer.
2. **It works offline.** If your internet drops mid-call (it happens), the teleprompter keeps scrolling because the recognition is local.
3. **It's fast and forgiving.** The recognition is the same engine Apple uses across macOS. It handles natural speech, pauses for emphasis, filler words, and conversational pacing - you don't need to enunciate like you're testing a robot.

The other detail worth mentioning: it supports 60+ languages and auto-detects your script's language. So if you're presenting in French to a French client, just paste a French script and start talking. No settings to change.

## Step-by-step: setting it up for your next Google Meet call

Here's the actual flow, start to finish, the first time you use it:

1. **Install VoicePrompter from the Mac App Store.** It lives in your menu bar - no dock icon, no clutter.
2. **Click the menu bar icon and paste your script.** You can have multiple scripts saved; switch between them with a keyboard shortcut.
3. **Position the floating window near your camera.** On a laptop, drag it just below the camera bezel and as wide as feels comfortable. On a desktop with an external webcam, put it on the same screen as the webcam, ideally right next to it. The closer the script is to the camera lens, the more natural your eye line looks.
4. **Set the font size and scroll behavior.** Bigger font = less eye movement = more natural. Pick a scroll speed slightly slower than you'd naturally speak.
5. **Start the voice recognition.** The window starts following your voice. Test it by reading a few lines.
6. **Join your Google Meet.** Share your screen if you need to. The teleprompter window is not visible to anyone else on the call - verified by Apple as part of the App Store review process.

That's the whole setup. Once you've done it once, opening a new script for your next call takes about 15 seconds.

## Does it work outside Google Meet?

Yes. Anything you can run on a Mac - Zoom, Microsoft Teams, FaceTime, Loom, Riverside, OBS, Descript, Streamlabs, even a Keynote presentation in full-screen mode - VoicePrompter floats on top of it and stays invisible to the capture. We have [dedicated guides for Zoom](./how-to-use-teleprompter-on-zoom.md), [Microsoft Teams](/mac/microsoft-teams/), [Loom](/mac/loom/), and [Riverside](/mac/riverside/) if you want the specifics for those platforms.

## Who tends to use this on Google Meet specifically

The use cases I hear about most often:

- **Sales reps** running product demos on Google Meet who want their talking points and pricing details visible without obviously looking at notes.
- **Recruiters and HR teams** conducting structured interviews where every question needs to be asked consistently across candidates.
- **Educators** running online lessons and office hours on Google Meet, where a structured outline keeps the session on track.
- **Webinar hosts** giving polished, prepared presentations to large groups.
- **Non-native English speakers** presenting in English (or any other language) and wanting the words right there in case they need them.
- **Podcast hosts** recording over Google Meet with planned questions and segments.

If you fall into any of these and the idea of having your script visible but invisible sounds appealing, the app is worth the 10 minutes it takes to set up.

## Try it free

VoicePrompter has a free tier that includes the demo script plus three custom scripts of unlimited length - enough to test it through a few real calls before deciding. If you want more scripts, there's a one-time purchase and a subscription option in the Mac App Store.

You can grab it on the [VoicePrompter for Google Meet](/mac/google-meet/) page, or jump straight to the [Mac App Store](https://apps.apple.com/app/apple-store/id6758573080?pt=128503212&ct=blog-google-meet&mt=8).

---

**Related articles:**
- [How to Use a Teleprompter on Zoom (Without Anyone Seeing It)](./how-to-use-teleprompter-on-zoom.md)
- [Best Teleprompter App for Mac](./best-teleprompter-app-for-mac.md)
- [How to Read a Script Without Looking Like You're Reading](./how-to-read-script-without-looking-like-reading.md)
- [How to Record Webinars and Podcasts](./how-to-record-webinars-and-podcasts.md)
