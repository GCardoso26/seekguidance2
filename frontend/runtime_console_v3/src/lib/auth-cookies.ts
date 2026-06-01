export const ACCESS_COOKIE = "tcg_access";

export const REFRESH_COOKIE = "tcg_refresh";

export const API_KEY_COOKIE = "tcg_api_key";



export function cookieOptions(maxAge: number) {

  return {

    httpOnly: true,

    secure: process.env.NODE_ENV === "production",

    sameSite: "strict" as const,

    path: "/",

    maxAge,

  };

}


