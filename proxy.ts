import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const rotasPublicas = ["/login", "/cadastro"];

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const path = request.nextUrl.pathname;

  if (path === "/login" && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!rotasPublicas.includes(path) && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Protege rotas /admin — só master pode acessar
  if (path.startsWith("/admin") && token?.role !== "master") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
