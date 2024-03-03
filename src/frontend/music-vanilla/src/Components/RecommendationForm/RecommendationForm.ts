import './recommendation-form.css';
import AppleMusicService from '../../Services/AppleMusicService';

// Instantiate the service
const appleMusicService = AppleMusicService.getInstance();

// Assuming an interface for the props similar to what's used in the React version
interface RecommendationFormProps {
    onRecommend: (songTitle: string) => void;
}

const styleRoot = "recommendation-form-component";

export function RecommendationForm(props: RecommendationFormProps): HTMLElement {
    const modal = document.createElement('div');
    modal.classList.add(styleRoot);
    modal.classList.add('styled-container');

    const title = document.createElement('h1');
    title.textContent = 'Recommend a Song';
    modal.appendChild(title);

    const form = document.createElement('form');
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Find a song on Apple Music...';
    input.required = true;

    // Add an event listener to the input to fetch search suggestions
    input.addEventListener('input', (event) => {
        const target = event.target as HTMLInputElement;
        debouncedFetchSuggestions(target.value);
    });

    const button = document.createElement('button');
    button.type = 'submit';
    button.textContent = 'Recommend';

    form.appendChild(input);
    form.appendChild(button);
    modal.appendChild(form);

    // Append the suggestions container to your modal/form
    const suggestionsContainer = document.createElement('ul');
    suggestionsContainer.classList.add('suggestions-list');
    modal.appendChild(suggestionsContainer);

    form.onsubmit = (event) => {
        event.preventDefault();
        props.onRecommend(input.value);
        input.value = ''; // Reset input after submission
    };

    return modal;
}

const debouncedFetchSuggestions = debounce((searchTerm: string) => {
    if (!searchTerm.trim()) {
        updateSuggestionsList([]);
        return;
    }

    appleMusicService.fetchSearchSuggestions(searchTerm)
        .then(suggestions => {
            updateSuggestionsList(suggestions); // Pass the suggestions array directly
        })
        .catch(error => console.error('Error fetching search suggestions:', error));
}, 500);


// Assuming the Suggestion type and related types are correctly defined and imported
function updateSuggestionsList(suggestions: Suggestion[]) {
    const suggestionsContainer = document.querySelector('.suggestions-list');

    if (!suggestionsContainer) {
        console.error('Suggestions container not found');
        return;
    }

    suggestionsContainer.innerHTML = ''; // Clear existing suggestions

    suggestions.forEach(suggestion => {
        const li = document.createElement('li');
        li.classList.add('suggestion-item');

        // Assuming 'suggestion.content.attributes' has the properties you want to display
        const { name, artistName, artwork } = suggestion.content.attributes;
        li.textContent = `${name} by ${artistName}`; // Customize this as needed

        // Display artwork if available
        if (artwork && artwork.url) {
            const img = document.createElement('img');
            const artworkUrl = artwork.url.replace('{w}x{h}', '50x50');
            img.src = artworkUrl;
            img.alt = `Album cover for ${name}`;
            li.appendChild(img);
        }

        li.addEventListener('click', () => {
            // Assuming you want to fill the input with the song name when a suggestion is clicked
            const input = document.querySelector('input[type="text"]') as HTMLInputElement;
            if (input) input.value = name;
            suggestionsContainer.innerHTML = ''; // Clear suggestions after selection
        });

        suggestionsContainer.appendChild(li);
    });
}


// Debounce function to limit the number of calls to the fetch function
function debounce(func: Function, wait: number) {
    let timeout: number | null = null;

    return function executedFunction(...args: any[]) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        clearTimeout(timeout as number);
        timeout = window.setTimeout(later, wait);
    };
}