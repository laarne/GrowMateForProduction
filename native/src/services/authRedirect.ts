import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as Linking from "expo-linking";
import { supabase } from "./supabase";

export const authRedirectUrl = Linking.createURL("auth/callback", {
  scheme: "growmate",
});

export async function createSessionFromRedirectUrl(url: string) {
  if (!supabase) return null;

  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    throw new Error(errorCode);
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;

  if (typeof accessToken !== "string" || typeof refreshToken !== "string") {
    return null;
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    throw error;
  }

  return data.session;
}
