import './apple-music-tester.css';

async function invokeApi() {
    console.log('[🍎 AppleMusicKit] ⌛ Initializing Apple Music API Client Instance...');

    const appleMusicClient = window.MusicKit.getInstance();

    console.log('[🍎 AppleMusicKit] ⌛ Fetching Song information...');

    const { data: result } = await appleMusicClient.api.music('v1/catalog/us/songs/207192784');

    console.log('[🍎 AppleMusicKit] ✅ Fetch successful! Song :')
    console.log(result);
}

const styleRoot = "apple-music-tester-component";

export function AppleMusicTester(): HTMLElement {
    const modal = document.createElement('div');
    modal.classList.add(styleRoot);
    modal.classList.add('styled-container');

    const title = document.createElement('h1');
    title.textContent = 'Test Apple Music API';
    modal.appendChild(title);

    const form = document.createElement('form');
    const button = document.createElement('button');
    button.type = 'submit';
    button.textContent = 'Test';

    form.appendChild(button);
    modal.appendChild(form);

    form.onsubmit = async (event) => {
        event.preventDefault();
        await invokeApi();
    };

    return modal;
}