import { ref, onMounted, onUnmounted } from 'vue';

/**
 * Vue3 mouse hover hook
 * @param elementRef - ref of the target element to monitor hover state
 * @returns isHovered - reactive state indicating whether the mouse is hovering over the element
 */
export function useMouseHover<T extends HTMLElement = HTMLElement>(
  elementRef: { value: T | undefined },
) {
  const isHovered = ref<boolean>(false);

  const handleMouseEnter = () => {
    isHovered.value = true;
  };

  const handleMouseLeave = () => {
    isHovered.value = false;
  };

  onMounted(() => {
    const element = elementRef.value;
    if (element) {
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
    }
  });

  onUnmounted(() => {
    const element = elementRef.value;
    if (element) {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    }
  });

  return {
    isHovered,
  };
}

export default useMouseHover;
