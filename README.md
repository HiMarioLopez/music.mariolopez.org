# music.mariolopez.org

A simple site to songs what I'm currently listening to on [Apple Music](https://www.apple.com/apple-music/) or [Spotify](https://www.spotify.com/). Why two streaming services? Because Jackie sends me song recommendations every morning and I'm too lazy to manually 'translate' them over to Apple Music.

## Inspiration

The idea for this project is not new, I think. I got my inspiration from my old Professor at Baylor University, [Dr. Pete Maurer](https://onlinecs.baylor.edu/faculty/dr-pete-maurer) and his collection of implementations of [The Sieve of Eratosthenes](https://en.wikipedia.org/wiki/Sieve_of_Eratosthenes) written in [several different programming languages](https://cs.baylor.edu/~maurer/SieveE/).

## Outline

The idea is to create a playground where I can test out new web technologies of all kinds. Front-end frameworks, new programming languages, cloud services, etc. I have a draft solution architecture that will be hosted on [AWS](https://aws.amazon.com/) to start, but I will eventually expand this solution to be deployed on different service providers (which will require re-architecture in some capacity, I'm sure).

Some cool ideas for the end product

- Users who navigate to the site will be taken to a random front-end implementation. (e.g. React, Next.js, Vue, etc.)
- Users who invoke the back-end services will invoke a random implementation of the same service. (e.g. a Recommendation Handler written in Go, written in Node.js, written in Rust, etc.)
- The user will know which implementation they are on, and be given the option to navigate to a specific implementation if they desire.
- Each implementation will include a few poorly shaped thoughts and reflections (What I liked, what I disliked, etc.) - am I committing to starting a blog? 🤔

This is meant to be a _very_ long-term project that will grow in many aspects, with many parts left defunct. Feature parity across the different implementations is the goal.

## (WIP) Solution Architecture

### Current State

#### Frontend

![Frontend Solution Architecture](./docs/[October%202025]%20Frontend%20Architecture.png)

#### Backend

![Backend Solution Architecture](./docs/[October%202025]%20Backend%20Architecture.png)

### Deprecated Components

#### Backend (Recommendation System)

![Deprecated Recommendation System Backend](<./docs/[October%202025]%20Backend%20Architecture%20(Deprecated%20Components).png>)

## References

I'll be leaving a few links to helpful documentation, blog posts, and samples I've found along the way, in no particular order.

- Getting Started with Vite: <https://vitejs.dev/guide/>
- Getting Started with CDK: <https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html>
- Git Hooks for Conventional Commits: <https://dev.to/ghacosta/definitive-guide-for-commitizen-commitlint-husky-3of9>
