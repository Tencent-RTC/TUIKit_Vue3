import cs from 'classnames';

export function useMessageLayoutClasses({
  isMessageOwner,
  alignment,
  isAggregated,
}: {
  isMessageOwner: boolean;
  alignment: 'left' | 'right' | 'two-sided';
  isAggregated: boolean;
}) {
  const isRightAligned
    = (alignment === 'two-sided' && isMessageOwner)
      || alignment === 'right';

  const layoutClasses = cs(
    'message-layout',
    isRightAligned ? 'message-layout--right' : 'message-layout--left',
  );

  const wrapperClasses = cs(
    'message-layout__wrapper',
    isRightAligned ? 'message-layout__wrapper--right' : 'message-layout__wrapper--left',
    isAggregated ? 'message-layout__wrapper--aggregated' : '',
    alignment === 'two-sided' && isMessageOwner ? 'message-layout__wrapper--no-padding' : '',
  );

  const bubbleClasses = cs(
    'message-layout__bubble',
    isRightAligned ? 'message-layout__bubble--right' : 'message-layout__bubble--left',
    isAggregated ? 'message-layout__bubble--aggregated' : '',
  );

  const avatarClasses = cs(
    'message-layout__avatar',
  );

  const metaClasses = cs(
    'message-layout__meta',
    isRightAligned ? 'message-layout__meta--right' : 'message-layout__meta--left',
  );

  return {
    layoutClasses,
    wrapperClasses,
    bubbleClasses,
    avatarClasses,
    metaClasses,
  };
}
