// Mock for the Slider component from react-slick
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MockSlider = ({ children, ...props }: any) => {
  return (
    <div data-testid="mock-slider" {...props}>
      {children}
    </div>
  );
};

export default MockSlider;

// Mock for the CSS imports
export const slickCssMock = {};
export const slickThemeCssMock = {};
