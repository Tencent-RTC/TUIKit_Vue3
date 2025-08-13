import { ref, onMounted, onUnmounted } from 'vue';

/**
 * Vue3鼠标悬停检测hook
 * @param elementRef - 目标元素的ref
 * @returns 是否悬停的状态
 */
export function useMouseHover<T extends HTMLElement = HTMLElement>(
  elementRef: { value: T | null }
) {
  const isHovered = ref(false);

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

  return isHovered;
}

export default useMouseHover;