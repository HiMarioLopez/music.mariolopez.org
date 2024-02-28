function scrollToIcon() {
    var navbar = document.querySelector('.navbar');
    var blazorIcon = document.querySelector('.blazor-icon');
    if (navbar && blazorIcon) {
        // Scroll the navbar to the Blazor icon
        navbar.scrollLeft = blazorIcon.offsetLeft - navbar.offsetLeft - (navbar.offsetWidth / 2) + (blazorIcon.offsetWidth / 2);
    }
}
