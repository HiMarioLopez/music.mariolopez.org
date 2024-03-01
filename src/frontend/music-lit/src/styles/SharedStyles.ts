import { css } from "lit";

export const styledContainer = css`
    .styled-container {
        background: var(--component-bg-color);
        color: var(--font-color);
        padding: var(--padding-large);
        border-radius: var(--border-radius-large);
        max-width: var(--max-width-large);
        box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.1);
    }
`;