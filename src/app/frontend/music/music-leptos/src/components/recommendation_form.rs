use leptos::*;
use stylance::*;

import_style!(style, "../styles/recommendation_form.module.scss");

#[component]
pub fn RecommendationForm(on_recommend: Callback<String>) -> impl IntoView {
    let input_element: NodeRef<html::Input> = create_node_ref();

    let (song_title, set_song_title) = create_signal(String::new());

    let on_submit = move |ev: leptos::ev::SubmitEvent| {
        // stop the page from reloading!
        ev.prevent_default();

        // here, we'll extract the value from the input
        let title = input_element()
            // event handlers can only fire after the view
            // is mounted to the DOM, so the `NodeRef` will be `Some`
            .expect("<input> should be mounted")
            // `leptos::HtmlElement<html::Input>` implements `Deref`
            // to a `web_sys::HtmlInputElement`.
            // this means we can call`HtmlInputElement::value()`
            // to get the current value of the input
            .value();

        // Emit the song title to the parent component
        on_recommend(title);

        // Reset the song title to an empty string
        set_song_title.set(String::new());
    };

    view! {
        <div class=(style::recommendationFormComponent, style::styledContainer).join_classes()>
            <h1>"Recommend a Song"</h1>
            <form on:submit=on_submit>
                <input
                    type="text"
                    prop:value=song_title
                    placeholder="Find a song on Apple Music..."
                    required=true
                    node_ref=input_element
                />
                <button type="submit" value="Submit">Recommend</button>
            </form>
        </div>
    }
}
