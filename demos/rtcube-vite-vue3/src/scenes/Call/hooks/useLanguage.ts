import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';

export default function useLanguage(): any {
  const { t, setLanguage, language } = useUIKit();

  const changeLanguage = (value: string) => {
    setLanguage(value);
  }
  
  return {
    t,
    language,
    changeLanguage,
  }
}
