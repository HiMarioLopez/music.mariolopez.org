import angularLogo from '../Assets/Images/angular.svg';
import blazorLogo from '../Assets/Images/blazor.svg';
import litLogo from '../Assets/Images/lit.svg';
import nextLogo from '../Assets/Images/next.svg';
import preactLogo from '../Assets/Images/preact.svg';
import qwikLogo from '../Assets/Images/qwik.svg';
import reactLogo from '../Assets/Images/react.svg';
import solidLogo from '../Assets/Images/solid.svg';
import svelteLogo from '../Assets/Images/svelte.svg';
import tsLogo from '../Assets/Images/typescript.svg';
import vueLogo from '../Assets/Images/vue.svg';
import '../Assets/Styles/Navbar.styles.css';

export function Navbar(): HTMLElement {
    const navbar = document.createElement('nav');
    navbar.className = 'navbar';

    // Define your logo URLs. You would need these logos to be accessible from your public directory.
    const logos = [
        { href: 'https://music.mariolopez.org/vanilla', src: tsLogo, alt: 'TypeScript', additionalClass: 'ts-icon' },
        { href: 'https://music.mariolopez.org/lit', src: litLogo, alt: 'Lit' },
        { href: 'https://music.mariolopez.org/qwik', src: qwikLogo, alt: 'Qwik' },
        { href: 'https://music.mariolopez.org/react', src: reactLogo, alt: 'React' },
        { href: 'https://music.mariolopez.org/solid', src: solidLogo, alt: 'Solid' },
        { href: 'https://music.mariolopez.org/svelte', src: svelteLogo, alt: 'Svelte' },
        { href: 'https://music.mariolopez.org/vue', src: vueLogo, alt: 'Vue' },
        { href: 'https://music.mariolopez.org/preact', src: preactLogo, alt: 'Preact' },
        { href: 'https://music.mariolopez.org/angular', src: angularLogo, alt: 'Angular' },
        { href: 'https://music.mariolopez.org/next', src: nextLogo, alt: 'Next' },
        { href: 'https://music.mariolopez.org/blazor', src: blazorLogo, alt: 'Blazor' },
    ];

    logos.forEach(logo => {
        const link = document.createElement('a');
        link.href = logo.href;
        link.target = '_self';
        link.rel = 'alternate';

        const img = document.createElement('img');
        img.src = logo.src;
        img.alt = logo.alt;
        img.className = 'nav-icon' + (logo.additionalClass ? ` ${logo.additionalClass}` : '');

        link.appendChild(img);
        navbar.appendChild(link);
    });

    return navbar;
}
