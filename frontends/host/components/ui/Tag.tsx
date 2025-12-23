import React, { useState, useEffect, useRef, useCallback } from 'react';

interface TagProps {
    children: React.ReactNode;
}

const Tag: React.FC<TagProps> = ({ children }) => {
    const tagRef = useRef<HTMLSpanElement>(null);
    const [isMultiLine, setIsMultiLine] = useState(false);

    const checkMultiLine = useCallback(() => {
        if (tagRef.current) {
            const style = window.getComputedStyle(tagRef.current);
            const lineHeight = parseFloat(style.lineHeight);
            // Consider it multi-line if its height is more than 1.5 times the line height
            const isWrapped = tagRef.current.scrollHeight > lineHeight * 1.5;
            setIsMultiLine(isWrapped);
        }
    }, []);

    useEffect(() => {
        // Run check on mount and whenever the content changes
        checkMultiLine();
        
        // Use ResizeObserver to re-check when the element's size changes (e.g., on window resize)
        const resizeObserver = new ResizeObserver(() => {
            checkMultiLine();
        });

        if (tagRef.current) {
            resizeObserver.observe(tagRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [checkMultiLine, children]);

    const baseClasses = "inline-block bg-blue-600 text-white text-sm font-medium px-4 py-2 transition-all";
    const cornerClasses = isMultiLine ? 'rounded-xl' : 'rounded-full';

    return (
        <span ref={tagRef} className={`${baseClasses} ${cornerClasses}`}>
            {children}
        </span>
    );
};

export default Tag;