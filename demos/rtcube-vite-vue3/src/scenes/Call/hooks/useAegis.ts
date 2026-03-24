// Aegis is used for performance analysis and can be deleted if you do not need it
import useUserInfo from './useUserInfo';
import { getLocalStorage, setLocalStorage } from '../utils/index';

interface IAegisReportParams {
  apiName?: string;
  content?: string;
}

export default function useAegis() {
  const userInfo = useUserInfo();
  
  const reportEvent = (params: IAegisReportParams): void => {
    const { apiName, content } = params;
    try {
      console.log('[Aegis Report]', apiName, content, userInfo?.SDKAppID);
    } catch (error) {
      console.log('aegis', error);
    }
  };
  
  function getUIN() {
    if (!getLocalStorage('call-uikit')) {
      setLocalStorage('call-uikit', JSON.stringify(window?.performance.now()));
    }
    return getLocalStorage('call-uikit') || '';
  }

  return {
    reportEvent,
  }
}
