import { inject } from "vue";
import { UserInfoContextKey, UserInfoContextDefaultValue } from "../context";
import type { IUserInfoContext } from "../context";

export default function useUserInfo() {
  return inject<IUserInfoContext>(UserInfoContextKey) || UserInfoContextDefaultValue;
}
