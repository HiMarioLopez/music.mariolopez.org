use leptos::prelude::*;
use stylance::*;

use crate::{
    components::{
        footer::Footer, navbar::Navbar, now_playing::NowPlaying,
        recently_played_list::RecentlyPlayedList, recommendation_form::RecommendationForm,
        recommendation_list::RecommendationList,
    },
    models::song::Song,
};

import_style!(style, "../styles/home.module.scss");

#[component]
pub fn Home() -> impl IntoView {
    // Initialize recommendations with two mock songs
    let (current_recommendations, set_current_recommendations) = signal(Vec::from([
        Song {
            song_title: "Mock Song One".to_string(),
            artist_name: "Mock Artist One".to_string(),
            album_name: "Mock Album One".to_string(),
            album_cover_url: "/images/50.png".to_string(),
        },
        Song {
            song_title: "Mock Song Two".to_string(),
            artist_name: "Mock Artist Two".to_string(),
            album_name: "Mock Album Two".to_string(),
            album_cover_url: "/images/50.png".to_string(),
        },
    ]));

    provide_context(current_recommendations);

    let handle_recommend = Callback::new(move |song_title: String| {
        let new_song = Song {
            song_title,
            artist_name: "New Artist".to_string(),
            album_name: "New Album".to_string(),
            album_cover_url: "/images/50.png".to_string(),
        };

        set_current_recommendations.update(|vec| vec.push(new_song));
    });

    view! {
        <ErrorBoundary
            fallback=move |errors| {
                view! {
                    <h1>"Uh oh! Something went wrong!"</h1>
                    <p>"Errors: "</p>
                    <ul>
                        {move || {
                            errors
                                .get()
                                .into_iter()
                                .map(|(_, e)| view! { <li>{e.to_string()}</li> })
                                .collect_view()
                        }}
                    </ul>
                }
            }
        >
            <div class=style::appBg/>
            <div class=style::app>
                <Navbar/>
                <div class=style::mainContent>
                    <div class=style::leftColumn>
                        <div class=style::nowPlayingContainer>
                            <NowPlaying/>
                        </div>
                        <RecentlyPlayedList/>
                    </div>
                    <div class=style::rightColumn>
                        <div class=style::recommendationFormContainer>
                            <RecommendationForm on_recommend=handle_recommend/>
                        </div>
                        <div class=style::recommendationsListContainer>
                            <RecommendationList/>
                        </div>
                    </div>
                </div>
                <Footer/>
            </div>
        </ErrorBoundary>
    }
}
