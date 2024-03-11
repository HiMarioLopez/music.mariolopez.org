use leptos::*;
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
    let (current_recommendations, set_current_recommendations) = create_signal(Vec::from([
        Song {
            song_title: "Mock Song One".into(),
            artist_name: "Mock Artist One".into(),
            album_name: "Mock Album One".into(),
            album_cover_url: "/images/50.png".into(),
        },
        Song {
            song_title: "Mock Song Two".into(),
            artist_name: "Mock Artist Two".into(),
            album_name: "Mock Album Two".into(),
            album_cover_url: "/images/50.png".into(),
        },
    ]));

    provide_context(current_recommendations);

    let handle_recommend: Callback<String> = Callback::from({
        move |song_title: String| {
            let new_song = Song {
                song_title,
                artist_name: "New Artist".into(),
                album_name: "New Album".into(),
                album_cover_url: "/images/50.png".into(),
            };

            set_current_recommendations.update(move |vec| vec.push(new_song));
        }
    });

    view! {
        <ErrorBoundary fallback=|errors| {
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
        }>

            <div class=style::appBg />
            <div class=style::app>
                <Navbar />
                <div class=style::mainContent>
                    <div class=style::leftColumn>
                        <div class=style::nowPlayingContainer>
                            <NowPlaying />
                        </div>
                    <RecentlyPlayedList />
                    </div>
                    <div class=style::rightColumn>
                        <div class=style::recommendationFormContainer>
                            <RecommendationForm on_recommend=handle_recommend />
                        </div>
                        <div class=style::recommendationsListContainer>
                            <RecommendationList />
                        </div>
                    </div>
                </div>
                <Footer />
            </div>

        </ErrorBoundary>
    }
}
