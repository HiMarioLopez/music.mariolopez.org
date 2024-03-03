import Home from "./Pages/Home/Home";

document.addEventListener('musickitloaded', async function () {
  // Call configure() to configure an instance of MusicKit on the Web.
  try {
    await window.MusicKit.configure({
      developerToken: '',
      app: {
        name: 'music.mariolopez.org/vanilla',
        build: '0.3.0',
      },
    });

    // MusicKit global instance is now available
    console.log('[🍎 AppleMusicKit] 🎵✅ MusicKit global instance is now available for use.');
  } catch (err) {
    // Handle configuration error
    console.log('[🍎 AppleMusicKit] 🎵❌ Error configuring MusicKit global instance:', err);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById('App');
  if (root) {
    root.appendChild(Home());
  }
});
