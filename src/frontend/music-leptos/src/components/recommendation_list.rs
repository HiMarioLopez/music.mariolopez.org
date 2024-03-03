use leptos::*;
use stylance::*;

use crate::models::song::Song;

import_style!(style, "../styles/recommendation_list.module.scss");

#[component]
pub fn RecommendationList() -> impl IntoView {
    let parent_recommendations = use_context::<ReadSignal<Vec<Song>>>()
        .expect("RecommendationList must be used within a context provider");

    view! {
        <div class=(style::recommendationListComponent, style::styledContainer).join_classes()>
            <h1>"Recommendation Backlog"</h1>
            <ul>
                {move || parent_recommendations.with(|recommendations| {recommendations.iter().map(|recommendation| view! {
                    <li>
                        <img src={&recommendation.album_cover_url} alt="Album Cover" />
                        <div class=style::recommendationListComponentTrackTextContainer>
                            <h3>{&recommendation.song_title}</h3>
                            <p>{format!("{} - {}", &recommendation.artist_name, &recommendation.album_name)}</p>
                        </div>
                    </li>
                }).collect::<Vec<_>>()})} // Collect into Vec to render
            </ul>
        </div>
    }
}
