import { addI18n } from '../../i18n';
import { enResource, zhResource } from './i18n';
import SearchComponent from './Search.vue';
import {
  default as SearchAdvancedComponent,
  MessageAdvanced as MessageAdvancedComponent,
  UserAdvanced as UserAdvancedComponent,
} from './SearchAdvanced';
import { default as SearchBarComponent } from './SearchBar';
import {
  default as SearchResultsComponent,
  SearchResultItem as SearchResultItemComponent,
} from './SearchResults';

const Search = SearchComponent;
const SearchAdvanced = SearchAdvancedComponent;
const SearchResults = SearchResultsComponent;
const SearchBar = SearchBarComponent;
const UserAdvanced = UserAdvancedComponent;
const MessageAdvanced = MessageAdvancedComponent;
const SearchResultItem = SearchResultItemComponent;

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });

export {
  Search,
  SearchAdvanced,
  UserAdvanced,
  MessageAdvanced,
  SearchResults,
  SearchResultItem,
  SearchBar,
};
