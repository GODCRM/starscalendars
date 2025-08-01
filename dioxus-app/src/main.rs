//! # StarsCalendars Dioxus Authentication App
//!
//! Fullstack Dioxus application for user authentication,
//! profile management, and admin features.

use dioxus::prelude::*;

fn main() {
    // Initialize tracing
    tracing_subscriber::fmt::init();
    
    println!("🌟 Starting StarsCalendars Dioxus App");
    
    // Launch Dioxus app
    #[cfg(feature = "web")]
    dioxus_web::launch(App);
    
    #[cfg(feature = "server")]
    {
        match tokio::runtime::Runtime::new() {
            Ok(runtime) => runtime.block_on(async {
                // TODO: Initialize server with Axum integration
                println!("⚠️  Server mode not implemented yet");
            }),
            Err(e) => {
                eprintln!("❌ Failed to create Tokio runtime: {}", e);
                std::process::exit(1);
            }
        }
    }
    
    #[cfg(not(any(feature = "web", feature = "server")))]
    {
        println!("⚠️  No feature enabled. Use --features web or --features server");
    }
}

#[component]
fn App() -> Element {
    rsx! {
        div {
            class: "app",
            h1 { "🌟 StarsCalendars Authentication" }
            p { "Dioxus fullstack app for user management" }
            
            AuthenticationFlow {}
        }
    }
}

#[component]
fn AuthenticationFlow() -> Element {
    rsx! {
        div {
            class: "auth-flow",
            h2 { "Authentication Flow" }
            p { "Integration with Telegram authentication coming soon..." }
            
            button {
                onclick: move |_| {
                    println!("Authentication button clicked");
                },
                "Connect with Telegram"
            }
        }
    }
}