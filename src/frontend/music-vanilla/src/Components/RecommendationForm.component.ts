import '../Assets/Styles/RecommendationForm.styles.css';

// Assuming an interface for the props similar to what's used in the React version
interface RecommendationFormProps {
    onRecommend: (songTitle: string) => void;
}

export function RecommendationForm(props: RecommendationFormProps): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'recommendation-form-modal';

    const title = document.createElement('h1');
    title.textContent = 'Recommend a Song';
    modal.appendChild(title);

    const form = document.createElement('form');
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Find a song on Apple Music...';
    input.required = true;

    const button = document.createElement('button');
    button.type = 'submit';
    button.textContent = 'Recommend';

    form.appendChild(input);
    form.appendChild(button);
    modal.appendChild(form);

    form.onsubmit = (event) => {
        event.preventDefault();
        props.onRecommend(input.value);
        input.value = ''; // Reset input after submission
    };

    return modal;
}
