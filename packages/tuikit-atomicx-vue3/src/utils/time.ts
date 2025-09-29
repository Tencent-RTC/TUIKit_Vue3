import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import {
  format,
  isSameWeek,
  isThisYear,
  isToday,
  isYesterday,
} from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';

interface GetTimeStampOptions {
  time: number;
  language?: 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP' | 'ko-KR' | string;
}

function getTimeStamp({ time, language = 'en-US' }: GetTimeStampOptions) {
  const { t } = useUIKit();
  const locales: Record<string, any> = {
    'zh-CN': zhCN,
    'en-US': enUS,
  };
  const timeFormat = 'HH:mm';
  const locale = locales[language] || locales['en-US'];

  const yesterdayText = t('MessageList.yesterday', {
    defaultValue: 'Yesterday',
  });

  if (!time) {
    return '';
  }

  if (isToday(time)) {
    return format(time, timeFormat, {
      locale,
    });
  }

  if (isYesterday(time)) {
    return `${yesterdayText} ${format(time, timeFormat, {
      locale,
    })}`;
  }

  if (isSameWeek(time, new Date(), { weekStartsOn: 1 })) {
    return `${format(time, 'EEEE', { locale })} ${format(time, timeFormat)}`;
  }

  if (isThisYear(time)) {
    if (language.startsWith('zh')) {
      return format(time, 'M月d日 HH:mm', {
        locale,
      });
    }
    return format(time, 'MMMM d HH:mm', {
      locale,
    });
  }

  return format(time, 'yyyy/MM/dd HH:mm', {
    locale,
  });
}

/**
 * Get formatted time string
 * 1. If today, only show time (HH:mm)
 * 2. If yesterday, show 'Yesterday' + time
 * 3. If within current week, show weekday + time
 * 4. If earlier than current week but within this year, show date format based on locale
 * 5. Otherwise show full date + time
 *
 * @param time Timestamp in milliseconds
 * @param language Language code, default is 'en-US'
 * @returns Formatted time string
 */
function getTimeStampAuto(time: number) {
  const { language } = useUIKit();
  return getTimeStamp({ time, language });
}

export {
  getTimeStamp,
  getTimeStampAuto,
};
