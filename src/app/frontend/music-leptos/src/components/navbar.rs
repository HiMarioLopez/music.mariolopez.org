use leptos::*;
use wasm_bindgen::prelude::*;

stylance::import_style!(style, "../styles/navbar.module.scss");

#[component]
pub fn Navbar() -> impl IntoView {
    create_effect(move |_prev_value| {
        scrollToRight();
    });

    view! {
        // PRODUCTION
        <nav>
            <a href="https://music.mariolopez.org/vanilla" target="_self" rel="alternate">
                <img src="/leptos/images/typescript.svg" alt="TypeScript" />
            </a>
            <a href="https://music.mariolopez.org/lit" target="_self" rel="alternate">
                <img src="/leptos/images/lit.svg" alt="Lit" />
            </a>
            <a href="https://music.mariolopez.org/qwik" target="_self" rel="alternate">
                <img src="/leptos/images/qwik.svg" alt="Qwik" />
            </a>
            <a href="https://music.mariolopez.org/react" target="_self" rel="alternate">
                <img src="/leptos/images/react.svg" alt="React" />
            </a>
            <a href="https://music.mariolopez.org/solid" target="_self" rel="alternate">
                <img src="/leptos/images/solid.svg" alt="Solid" />
            </a>
            <a href="https://music.mariolopez.org/svelte" target="_self" rel="alternate">
                <img src="/leptos/images/svelte.svg" alt="Svelte" />
            </a>
            <a href="https://music.mariolopez.org/vue" target="_self" rel="alternate">
                <img src="/leptos/images/vue.svg" alt="Vue" />
            </a>
            <a href="https://music.mariolopez.org/preact" target="_self" rel="alternate">
                <img src="/leptos/images/preact.svg" alt="Preact" className="focused-icon" />
            </a>
            <a href="https://music.mariolopez.org/angular" target="_self" rel="alternate">
                <img src="/leptos/images/angular.svg" alt="Angular" />
            </a>
            <a href="https://music.mariolopez.org/next" target="_self" rel="alternate">
                <img src="/leptos/images/next.svg" alt="Next" />
            </a>
            <a href="https://music.mariolopez.org/blazor" target="_self" rel="alternate">
                <img src="/leptos/images/blazor.svg" alt="Blazor" />
            </a>
            <a href="https://music.mariolopez.org/leptos" target="_self" rel="alternate">
                <img src="/leptos/images/leptos.svg" alt="Leptos" class=style::focusedIcon />
            </a>
        </nav>

        // DEVELOPMENT
        // <nav>
        //     <a href="https://music.mariolopez.org/vanilla" target="_self" rel="alternate">
        //         <img src="/images/typescript.svg" alt="TypeScript" />
        //     </a>
        //     <a href="https://music.mariolopez.org/lit" target="_self" rel="alternate">
        //         <img src="/images/lit.svg" alt="Lit" />
        //     </a>
        //     <a href="https://music.mariolopez.org/qwik" target="_self" rel="alternate">
        //         <img src="/images/qwik.svg" alt="Qwik" />
        //     </a>
        //     <a href="https://music.mariolopez.org/react" target="_self" rel="alternate">
        //         <img src="/images/react.svg" alt="React" />
        //     </a>
        //     <a href="https://music.mariolopez.org/solid" target="_self" rel="alternate">
        //         <img src="/images/solid.svg" alt="Solid" />
        //     </a>
        //     <a href="https://music.mariolopez.org/svelte" target="_self" rel="alternate">
        //         <img src="/images/svelte.svg" alt="Svelte" />
        //     </a>
        //     <a href="https://music.mariolopez.org/vue" target="_self" rel="alternate">
        //         <img src="/images/vue.svg" alt="Vue" />
        //     </a>
        //     <a href="https://music.mariolopez.org/preact" target="_self" rel="alternate">
        //         <img src="/images/preact.svg" alt="Preact" className="focused-icon" />
        //     </a>
        //     <a href="https://music.mariolopez.org/angular" target="_self" rel="alternate">
        //         <img src="/images/angular.svg" alt="Angular" />
        //     </a>
        //     <a href="https://music.mariolopez.org/next" target="_self" rel="alternate">
        //         <img src="/images/next.svg" alt="Next" />
        //     </a>
        //     <a href="https://music.mariolopez.org/blazor" target="_self" rel="alternate">
        //         <img src="/images/blazor.svg" alt="Blazor" />
        //     </a>
        //     <a href="https://music.mariolopez.org/leptos" target="_self" rel="alternate">
        //         <img src="/images/leptos.svg" alt="Leptos" class=style::focusedIcon />
        //     </a>
        // </nav>
    }
}

#[wasm_bindgen(module = "/src/js/scrollToRight.js")]
#[wasm_bindgen(start)]
extern "C" {
    // This is a JS function that will be called from Rust (via WebAssembly)
    fn scrollToRight();
}
