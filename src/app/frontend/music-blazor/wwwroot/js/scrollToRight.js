function scrollToRight() {
    const navbar = document.querySelector("nav");

    if (navbar) {
        // Scroll the navbar to the rightmost side
        navbar.scrollLeft = navbar.scrollWidth + navbar.clientWidth;
    }
}