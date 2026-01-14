import { useState, useEffect } from "react";
import { ChevronUpIcon } from "@heroicons/react/24/outline";

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Show button when page is scrolled down
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > (isMobile ? 200 : 300)) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, [isMobile]);

  // Scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className={`
            fixed z-40 flex items-center justify-center
            bg-gradient-to-r from-blue-600 to-purple-600 
            text-white 
            shadow-lg hover:shadow-xl 
            transform hover:scale-105 active:scale-95
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none
            transition-all duration-300 
            backdrop-blur-sm bg-opacity-90
            touch-manipulation
            group
            ${
              isMobile
                ? "w-14 h-14 rounded-2xl bottom-5 right-5"
                : "w-12 h-12 rounded-xl bottom-6 right-6"
            }
          `}
          aria-label="Back to top"
          style={{
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
          }}
        >
          {/* Icon with smooth animation */}
          <ChevronUpIcon
            className={`
            transition-transform duration-300
            ${isMobile ? "h-6 w-6" : "h-5 w-5"}
            group-hover:-translate-y-0.5
          `}
          />

          {/* Desktop tooltip - matches your modal design */}
          {!isMobile && (
            <div className="absolute bottom-full mb-3 hidden group-hover:flex items-center justify-center px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium rounded-lg whitespace-nowrap shadow-lg border border-gray-700 dark:border-gray-600">
              Back to top
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
            </div>
          )}

          {/* Subtle glow effect on hover */}
          <div className="absolute inset-0 rounded-inherit bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </button>
      )}
    </>
  );
};

export default BackToTop;
