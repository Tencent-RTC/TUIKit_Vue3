type Translate = (key: string) => string;

export function getSendErrorMessage(t: Translate, error: unknown): string {
  const errorCode = (error as { code?: number })?.code;
  switch (errorCode) {
    case 10007:
      return t('MessageInput.you_are_not_in_group');
    case 20009:
      return t('MessageInput.you_are_not_friend');
    case 2351:
      return t('MessageInput.video_size_exceeded');
    default:
      return t('MessageInput.send_failed');
  }
}
