import '../Assets/Styles/Footer.styles.css';

export function Footer(): HTMLElement {
    const links = [
        { href: 'https://github.com/HiMarioLopez/music.mariolopez.org/tree/main/src/frontend/music-vanilla', text: 'Site Source' },
        { href: 'https://music.mariolopez.org/', text: 'Randomize' },
        { href: 'https://github.com/HiMarioLopez/music.mariolopez.org', text: 'Repository' },
    ];

    const footer = document.createElement('footer');
    const linkContainer = document.createElement('div');

    links.forEach(link => {
        const a = document.createElement('a');
        a.href = link.href;
        a.textContent = link.text;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        linkContainer.appendChild(a);
    });

    footer.appendChild(linkContainer);

    return footer;
}
