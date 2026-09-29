"use client";

import { useEffect } from "react";
import { takeReturnTo } from "@/lib/uniauth";

export default function AuthReturnPage() {
  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");
    const returnTo = takeReturnTo();
    if (!error || error === "login_required") {
      window.location.replace(returnTo);
    } else {
      window.location.replace(`/login?error=${encodeURIComponent(error)}`);
    }
  }, []);
  return null;
}
