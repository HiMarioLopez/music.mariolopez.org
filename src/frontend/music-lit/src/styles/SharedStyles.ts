import { css } from "lit";

export const styledContainer = css`
    .styled-container {
        background: var(--component-bg-color);
        color: var(--font-color);
        padding: var(--padding-large);
        border-radius: var(--border-radius-large);
        box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    @media (min-width: 1300px) {
        .styled-container {
            max-width: var(--max-width-large);
        }
    }

    @media (max-width: 1299px) {
        .styled-container {
            max-width: var(--max-width-medium);
        }
    }
`;