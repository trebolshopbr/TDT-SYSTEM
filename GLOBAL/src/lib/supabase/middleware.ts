import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  let user = data?.claims?.sub ? data.claims : null;

  // Solo en local (npm run dev): entra solo con el usuario de .env.local. En producción
  // NODE_ENV no es "development" y estas variables no existen, así que el login sigue siendo real.
  if (
    !user &&
    process.env.NODE_ENV === "development" &&
    process.env.DEV_LOGIN_EMAIL &&
    process.env.DEV_LOGIN_PASSWORD
  ) {
    const { data: sesion } = await supabase.auth.signInWithPassword({
      email: process.env.DEV_LOGIN_EMAIL,
      password: process.env.DEV_LOGIN_PASSWORD,
    });
    if (sesion?.session) user = sesion.session.user as unknown as typeof user;
  }

  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");
  const isPublicAsset = request.nextUrl.pathname.startsWith("/_next");

  if (!user && !isAuthRoute && !isPublicAsset) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
