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

  const contentClasses = cs(
    'message-layout__content',
    isRightAligned ? 'message-layout__content--right' : 'message-layout__content--left',
  );

  const headerClasses = cs(
    'message-layout__header',
    isRightAligned && 'message-layout__header--right',
  );

  const bodyClasses = cs(
    'message-layout__body',
    isRightAligned ? 'message-layout__body--right' : 'message-layout__body--left',
  );

  const bubbleClasses = cs(
    'message-layout__bubble',
    isRightAligned ? 'message-layout__bubble--right' : 'message-layout__bubble--left',
    isAggregated && 'message-layout__bubble--aggregated',
  );

  const avatarClasses = cs(
    'message-layout__avatar',
  );

  const statusClasses = cs(
    'message-layout__status',
  );

  return {
    layoutClasses,
    contentClasses,
    headerClasses,
    bodyClasses,
    bubbleClasses,
    avatarClasses,
    statusClasses,
  };
}
