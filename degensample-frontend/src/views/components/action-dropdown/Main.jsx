import React, { useState, useEffect, useRef } from 'react';

/**
 * ActionDropdown - A reusable dropdown menu component for action buttons
 * 
 * @param {Object} props
 * @param {string} props.buttonText - Text to display on the dropdown button
 * @param {React.ReactNode} props.children - Dropdown menu items as children
 * @param {boolean} props.disabled - Disable the dropdown button
 * @param {string} props.className - Additional CSS classes for container
 */
const ActionDropdown = ({
  buttonText = "Actions",
  children,
  disabled = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };
  
  // Track dropdown position
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Update dropdown position when it opens or on scroll/resize
  useEffect(() => {
    const updatePosition = () => {
      if (dropdownRef.current && isOpen) {
        const rect = dropdownRef.current.getBoundingClientRect();
        // Determine if we should show dropdown above or below button
        // Get viewport height
        const viewportHeight = window.innerHeight;
        // Space below the button
        const spaceBelow = viewportHeight - rect.bottom;
        // Space needed for dropdown (estimate based on children)
        const childrenCount = React.Children.count(children);
        const estimatedDropdownHeight = Math.min(childrenCount * 40, 300); // ~40px per item, max 300px
        
        // Decide if we should position above or below
        if (spaceBelow < estimatedDropdownHeight && rect.top > estimatedDropdownHeight) {
          // Not enough space below, position above
          setDropdownPosition({
            top: rect.top - estimatedDropdownHeight - 10,
            left: rect.right - 192 // Width of dropdown (48rem = 192px)
          });
        } else {
          // Enough space below or not enough space above, position below
          setDropdownPosition({
            top: rect.bottom + 10,
            left: rect.right - 192 // Width of dropdown (48rem = 192px)
          });
        }
      }
    };

    // Update position initially and on scroll/resize
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('click', handleOutsideClick);
    
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);
  
  return (
    <div className={`dropdown-container relative ${className}`} ref={dropdownRef}>
      <button
        className="px-3 py-1 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center"
        onClick={(e) => {
          e.stopPropagation();
          toggleDropdown();
        }}
        disabled={disabled}
        type="button"
      >
        {buttonText} <span className="ml-1">▼</span>
      </button>
      
      {/* Portal for dropdown to ensure it's always on top */}
      <div
        className={`fixed w-48 bg-white shadow-lg rounded-md py-1 z-[9999] border ${isOpen ? 'block' : 'hidden'}`}
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}>
        {React.Children.map(children, child => {
          // If it's a button, add click handler to close dropdown
          if (React.isValidElement(child) && child.type === 'button') {
            return React.cloneElement(child, {
              onClick: (e) => {
                // Call original onClick if it exists
                if (child.props.onClick) {
                  child.props.onClick(e);
                }
                
                // Close dropdown
                setIsOpen(false);
              }
            });
          }
          return child;
        })}
      </div>
    </div>
  );
};

export default ActionDropdown;