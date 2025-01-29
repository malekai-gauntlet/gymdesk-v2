import React from 'react';

const ThinkingSteps = ({ steps, activeIndex }) => {
  if (steps.length === 0) return null;

  return (
    <div className="my-2 pl-11">
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`
              text-sm 
              transition-all 
              duration-500 
              ease-in-out
              ${index > activeIndex 
                ? 'opacity-0 h-0 overflow-hidden translate-y-2' 
                : 'opacity-100 translate-y-0'
              }
              ${index === activeIndex ? 'animate-pulse-subtle' : ''}
            `}
            style={{
              transitionDelay: `${index * 150}ms`
            }}
          >
            <div className="flex items-center gap-2">
              <div className={`
                w-1.5 
                h-1.5 
                rounded-full 
                ${index === activeIndex ? 'bg-indigo-400' : 'bg-gray-500'}
                transition-colors 
                duration-300
              `} />
              <span className="text-gray-400">{step.text}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThinkingSteps; 