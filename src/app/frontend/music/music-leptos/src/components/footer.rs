use leptos::prelude::*;

stylance::import_style!(style, "../styles/footer.module.scss");

#[component]
pub fn Footer() -> impl IntoView {
    view! {
        <footer>
            <div class=style::footerComponentLinkContainer>
                <a href="https://github.com/HiMarioLopez/music.mariolopez.org/tree/main/src/app/frontend/music/music-leptos" target="_blank" rel="noopener noreferrer">Site Source</a>
                <a href="https://music.mariolopez.org/" target="_blank" rel="noopener noreferrer">Randomize</a>
                <a href="https://leptos.dev/" target="_blank" rel="noopener noreferrer">Leptos</a>
            </div>
            <div class=style::footerComponentCopyrightContainer>"\u{00A9}" 2024 Mario Lopez</div>
        </footer>
    }
}
