import { cookies } from "next/headers";

import { NextRequest, NextResponse } from "next/server";

import { ACCESS_COOKIE, API_KEY_COOKIE } from "@/lib/auth-cookies";



const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "");



async function proxy(req: NextRequest, pathParts: string[]) {

  const path = `/${pathParts.join("/")}`;

  const url = new URL(req.url);

  const target = `${API_BASE}${path}${url.search}`;



  const jar = await cookies();

  const headers: Record<string, string> = {

    "Content-Type": req.headers.get("content-type") || "application/json",

  };

  const access = jar.get(ACCESS_COOKIE)?.value;

  const apiKey = jar.get(API_KEY_COOKIE)?.value;

  if (access) headers.Authorization = `Bearer ${access}`;

  if (apiKey) headers["X-API-Key"] = apiKey;



  const init: RequestInit = {

    method: req.method,

    headers,

    cache: "no-store",

  };

  if (req.method !== "GET" && req.method !== "HEAD") {

    init.body = await req.text();

  }



  const upstream = await fetch(target, init);

  const text = await upstream.text();

  return new NextResponse(text, {

    status: upstream.status,

    headers: { "Content-Type": upstream.headers.get("content-type") || "application/json" },

  });

}



export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {

  const { path } = await ctx.params;

  return proxy(req, path);

}



export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {

  const { path } = await ctx.params;

  return proxy(req, path);

}



export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {

  const { path } = await ctx.params;

  return proxy(req, path);

}



export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {

  const { path } = await ctx.params;

  return proxy(req, path);

}



export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {

  const { path } = await ctx.params;

  return proxy(req, path);

}


