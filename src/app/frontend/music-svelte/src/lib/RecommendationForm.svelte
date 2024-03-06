<script lang="ts">
    // Prop passed from parent component
    export let onRecommend: (songTitle: string) => void;

    // Local state for the song title input
    let songTitle = "";

    // Handle form submission
    const handleSubmit = () => {
        onRecommend(songTitle);
        songTitle = ""; // Reset input field after submission
    };
</script>

<div class="recommendation-form-component styled-container">
    <h1>Recommend a Song</h1>
    <form on:submit|preventDefault={handleSubmit}>
        <input
            type="text"
            bind:value={songTitle}
            placeholder="Find a song on Apple Music..."
            required
        />
        <button type="submit">Recommend</button>
    </form>
</div>

<style>
    .recommendation-form-component h1 {
        width: 100%;
        text-align: left;
        margin: 0 0 var(--margin-medium);
    }

    .recommendation-form-component form {
        width: 100%;
        display: flex;
    }

    .recommendation-form-component input[type="text"] {
        padding: var(--padding-medium) 15px;
        width: calc(100% - 32px);
        border: var(--input-border);
        border-radius: var(--border-radius-medium);
        background-color: var(--input-bg-color);
        color: var(--font-color);
        margin-right: var(--margin-medium);
        outline: none;
        transition:
            border-color var(--transition-speed),
            box-shadow var(--transition-speed);
    }

    .recommendation-form-component input[type="text"]:focus,
    .recommendation-form-component input[type="text"]:hover {
        border-color: var(--focus-border-color);
        box-shadow: 0 0 8px rgba(252, 60, 68, 0.4);
    }

    .recommendation-form-component button {
        padding: var(--padding-medium) 15px;
        border: 2px solid transparent;
        border-radius: var(--border-radius-medium);
        background-color: var(--button-bg-color);
        color: white;
        cursor: pointer;
        transition:
            background-color var(--transition-speed),
            color var(--transition-speed),
            box-shadow var(--transition-speed),
            border-color var(--transition-speed);
    }

    .recommendation-form-component button:focus,
    .recommendation-form-component button:hover {
        background-color: var(--button-hover-bg-color);
        color: white;
        box-shadow: 0 0 8px rgba(252, 60, 68, 0.6);
        border-color: var(--focus-border-color);
    }

    .recommendation-form-component button:focus {
        outline: 4px auto -webkit-focus-ring-color;
    }

    @media (max-width: 680px) {
        .recommendation-form-component {
            width: var(--width-mobile);
        }

        .recommendation-form-component form {
            flex-direction: column;
        }

        .recommendation-form-component input[type="text"] {
            margin-right: 0;
            margin-bottom: var(--margin-medium);
        }
    }
</style>
