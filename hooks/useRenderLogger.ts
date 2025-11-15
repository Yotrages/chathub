"use client";
import { useEffect, useRef } from 'react';

/**
 * Hook to detect render loops and excessive re-renders
 * @param componentName - Name of the component for logging
 * @param props - Optional props to log (helps identify what's changing)
 */
export function useRenderLogger(componentName: string, props?: Record<string, any>) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  const renderTimes = useRef<number[]>([]);
  const propsHistory = useRef<any[]>([]);

  renderCount.current++;
  const now = Date.now();
  const timeSinceLastRender = now - lastRenderTime.current;
  
  renderTimes.current.push(timeSinceLastRender);
  if (renderTimes.current.length > 10) {
    renderTimes.current.shift();
  }

  if (props) {
    propsHistory.current.push(props);
    if (propsHistory.current.length > 5) {
      propsHistory.current.shift();
    }
  }
  
  lastRenderTime.current = now;

  const avgInterval = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;

  console.log(`🔄 ${componentName} render #${renderCount.current}`, {
    timeSinceLastRender: `${timeSinceLastRender}ms`,
    avgInterval: `${avgInterval.toFixed(0)}ms`,
    props: props ? JSON.stringify(props).slice(0, 100) : 'none'
  });

  if (renderCount.current > 5 && avgInterval < 100) {
    console.error(`🚨 FAST LOOP DETECTED in ${componentName}!`);
    console.error(`🚨 ${renderCount.current} renders, avg ${avgInterval.toFixed(0)}ms apart`);
    
    if (propsHistory.current.length > 1) {
      console.error('🚨 Props changes:', propsHistory.current);
    }
    
    console.trace('Stack trace:');
  }

  if (renderCount.current > 20) {
    console.error(`🚨 EXCESSIVE RENDERS in ${componentName}: ${renderCount.current} total renders`);
    console.trace('Stack trace:');
  }

  useEffect(() => {
    return () => {
      console.log(`✅ ${componentName} unmounted after ${renderCount.current} renders`);
      renderCount.current = 0;
      renderTimes.current = [];
      propsHistory.current = [];
    };
  }, [componentName]);
}

/**
 * Simpler version - just counts renders
 */
export function useRenderCount(componentName: string) {
  const renderCount = useRef(0);
  
  renderCount.current++;
  console.log(`🔄 ${componentName} rendered ${renderCount.current} times`);
  
  if (renderCount.current > 10) {
    console.warn(`⚠️ ${componentName} has rendered ${renderCount.current} times`);
  }

  useEffect(() => {
    return () => {
      renderCount.current = 0;
    };
  }, []);
}

/**
 * Track which props are causing re-renders
 */
export function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previousProps = useRef<Record<string, any>>(null);

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log(`🔍 ${name} - Props that changed:`, changedProps);
      }
    }

    previousProps.current = props;
  });
}