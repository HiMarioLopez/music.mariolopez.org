use leptos::prelude::*;
use leptos_meta::*;
use leptos_router::components::{Route, Router, Routes};
use leptos_router::*;

// Modules
mod components;
mod models;
mod pages;

// Top-Level pages
use crate::pages::home::Home;

/// An app router which renders the homepage and handles 404's
#[component]
pub fn App() -> impl IntoView {
    // Provides context that manages stylesheets, titles, meta tags, etc.
    provide_meta_context();

    view! {
        <html lang="en" dir="ltr" data-theme="light">

        // sets the document title
        <Title text="Music"/>

        // injects metadata in the <head> of the page
        <Meta charset="UTF-8"/>
        <Meta name="viewport" content="width=device-width, initial-scale=1.0"/>

        <Router>
            <Routes fallback=move || view! { <h1>"404 - Not Found"</h1> }>
                <Route path=path!() view=Home/>
                <Route path=path!("*") view=Home/>
            </Routes>
        </Router>
        </html>
    }
}
