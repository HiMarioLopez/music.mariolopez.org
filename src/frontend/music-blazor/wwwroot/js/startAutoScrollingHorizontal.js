function startAutoScrollingHorizontal(element) {
    let startLeft = 0;
    const step = () => {
        if (element.offsetWidth + startLeft >= element.scrollWidth) {
            startLeft = 0; // Reset to start if end reached
            element.scrollLeft = startLeft;
        } else {
            startLeft += 0.25; // Increment the scroll position
            element.scrollLeft = startLeft;
        }
        requestAnimationFrame(step);
    };

    step();
}
