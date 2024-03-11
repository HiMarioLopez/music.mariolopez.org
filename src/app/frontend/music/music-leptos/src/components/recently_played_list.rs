use leptos::*;
use stylance::*;
use wasm_bindgen::prelude::*;

use crate::models::song::Song;

import_style!(style, "../styles/recently_played_list.module.scss");

#[component]
pub fn RecentlyPlayedList() -> impl IntoView {
    let recently_played: Vec<Song> = vec![
        Song {
            song_title: "Song One".into(),
            artist_name: "Artist One".into(),
            album_name: "Album One".into(),
            album_cover_url: "/images/50.png".into(),
        },
        Song {
            song_title: "Song Two".into(),
            artist_name: "Artist Two".into(),
            album_name: "Album Two".into(),
            album_cover_url: "/images/50.png".into(),
        },
        Song {
            song_title: "Song Three".into(),
            artist_name: "Artist Three".into(),
            album_name: "Album Three".into(),
            album_cover_url: "/images/50.png".into(),
        },
        Song {
            song_title: "Song Four".into(),
            artist_name: "Artist Four".into(),
            album_name: "Album Four".into(),
            album_cover_url: "/images/50.png".into(),
        },
        Song {
            song_title: "Song Five".into(),
            artist_name: "Artist Five".into(),
            album_name: "Album Five".into(),
            album_cover_url: "/images/50.png".into(),
        },
    ];

    create_effect(move |_prev_value| {
        autoScroll("recentlyPlayedListContainer");
    });

    view! {
        <div class=(style::recentlyPlayedListComponent, style::styledContainer).join_classes()>
            <h1>"Recently Played"</h1>
            <div id="recentlyPlayedListContainer" class=style::recentlyPlayedListComponentListContainer>
                {recently_played.iter().map(|track| view! {
                    <div class=style::recentlyPlayedListComponentTrack>

                        // PRODUCTION
                        <img src={"/leptos".to_owned() + &track.album_cover_url} alt="Album Cover" />
                        // DEVELOPMENT
                        // <img src={&track.album_cover_url} alt="Album Cover" />

                        <div class=style::recentlyPlayedListComponentTrackTextContainer>
                            <h3>{&track.song_title}</h3>
                            <p>{format!("{} - {}", &track.artist_name, &track.album_name)}</p>
                        </div>
                    </div>
                }).collect::<Vec<_>>()} // Collect into Vec to render
            </div>
        </div>
    }
}

#[wasm_bindgen(module = "/src/js/autoScroll.js")]
#[wasm_bindgen(start)]
extern "C" {
    // This is a JS function that will be called from Rust (via WebAssembly)
    fn autoScroll(elementId: &str);
}
