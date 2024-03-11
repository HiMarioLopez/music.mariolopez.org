import './footer.css';

const styleRoot = 'footer-component';

export function Footer(): HTMLElement {
    const links = [
        { href: 'https://github.com/HiMarioLopez/music.mariolopez.org/tree/main/src/frontend/music-vanilla', text: 'Site Source' },
        { href: 'https://music.mariolopez.org/', text: 'Randomize' },
        { href: 'https://www.typescriptlang.org/', text: 'TypeScript' },
    ];

    const footer = document.createElement('footer');
    const linkContainer = document.createElement('div');
    linkContainer.className = `${styleRoot}-link-container`;

    links.forEach(link => {
        const a = document.createElement('a');
        a.href = link.href;
        a.textContent = link.text;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        linkContainer.appendChild(a);
    });

    const copyright = document.createElement('div');
    copyright.textContent = `© 2024 Mario Lopez`;
    copyright.className = `${styleRoot}-copyright-container`;

    footer.appendChild(linkContainer);
    footer.appendChild(copyright);

    return footer;
}
