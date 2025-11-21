import { addI18n } from '../../i18n';

import { ConversationActions as ConversationActionsComponent } from './ConversationActions';
import { ConversationCreate as ConversationCreateComponent } from './ConversationCreate';
import { default as ConversationListComponent } from './ConversationList.vue';
import { ConversationListContent as ConversationListContentComponent } from './ConversationListContent';
import { ConversationListHeader as ConversationListHeaderComponent } from './ConversationListHeader';
import { default as ConversationPlaceHolderComponent } from './ConversationPlaceHolder';
import { ConversationPreview as ConversationPreviewComponent, ConversationPreviewUI as ConversationPreviewUIComponent } from './ConversationPreview';
import { ConversationSearch as ConversationSearchComponent } from './ConversationSearch';
import { enResource, zhResource } from './i18n';

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });

const ConversationList = ConversationListComponent;
const ConversationActions = ConversationActionsComponent;
const ConversationCreate = ConversationCreateComponent;
const ConversationListHeader = ConversationListHeaderComponent;
const ConversationListContent = ConversationListContentComponent;
const ConversationPlaceHolder = ConversationPlaceHolderComponent;
const ConversationPreview = ConversationPreviewComponent;
const ConversationPreviewUI = ConversationPreviewUIComponent;
const ConversationSearch = ConversationSearchComponent;

export {
  ConversationList,
  ConversationActions,
  ConversationCreate,
  ConversationListHeader,
  ConversationListContent,
  ConversationPreview,
  ConversationPreviewUI,
  ConversationPlaceHolder,
  ConversationSearch,
};
