use leptos::prelude::*;
use stylance::*;

use crate::models::song::Song;

import_style!(style, "../styles/now_playing.module.scss");

// Define your component
#[component]
pub fn NowPlaying() -> impl IntoView {
    // Mock data for the currently playing song
    let current_song = Song {
        song_title: "Song Title".into(),
        artist_name: "Artist".into(),
        album_name: "Album".into(),
        album_cover_url: "/images/300.png".into(),
    };

    view! {
        <div class=(style::nowPlayingComponent, style::styledContainer).join_classes() >

            // PRODUCTION
            <img src={"/leptos".to_owned() + &current_song.album_cover_url} alt="Album Art" />
            // DEVELOPMENT
            // <img src={&current_song.album_cover_url} alt="Album Art" />

            <div class=style::nowPlayingComponentTextContainer>
                <h1>"Mario's Now Playing"</h1>
                <div class=style::nowPlayingComponentText>
                    <h2>{current_song.song_title}</h2>
                    <p>{current_song.artist_name}</p>
                    <p>{current_song.album_name}</p>
                </div>
            </div>
        </div>
    }
}
