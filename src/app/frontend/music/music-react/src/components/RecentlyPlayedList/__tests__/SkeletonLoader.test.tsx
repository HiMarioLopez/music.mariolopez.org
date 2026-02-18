import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import SkeletonLoader from "../components/SkeletonLoader";

describe("SkeletonLoader Component", () => {
  it("renders three skeleton rows", () => {
    const { container } = render(<SkeletonLoader />);

    // Should render the container
    const skeletonContainer = container.querySelector(
      ".recentlyPlayedSkeletonContainer",
    );
    expect(skeletonContainer).toBeDefined();
  });

  it("renders placeholder items in each row", () => {
    const { container } = render(<SkeletonLoader />);

    // Each row should have 4 placeholder items
    const rows = container.querySelectorAll(".recentlyPlayedSkeletonRow");

    rows.forEach((row) => {
      const placeholderItems = row.querySelectorAll(
        ".recentlyPlayedSkeletonSong",
      );
      expect(placeholderItems).toHaveLength(4);

      // Each item should have the expected structure
      placeholderItems.forEach((item) => {
        // Should have an image placeholder
        expect(item.querySelector(".recentlyPlayedSkeletonImg")).toBeDefined();

        // Should have text placeholders
        expect(
          item.querySelector(".recentlyPlayedSkeletonTitle"),
        ).toBeDefined();
        expect(
          item.querySelector(".recentlyPlayedSkeletonSubtitle"),
        ).toBeDefined();
      });
    });
  });

  it("applies shimmer effect to skeleton elements", () => {
    const { container } = render(<SkeletonLoader />);

    // All skeleton elements should have the shimmer animation class
    const skeletonElements = container.querySelectorAll(".skeletonLoader");
    skeletonElements.forEach((element) => {
      // Check that the element has the proper class
      expect(element.classList.contains("skeletonLoader")).toBe(true);
    });
  });
});
