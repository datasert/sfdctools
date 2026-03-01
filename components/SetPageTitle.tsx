"use client";

import { useEffect } from "react";
import { useTitle } from "./TitleContext";

interface SetPageTitleProps {
  title: string;
}

export function SetPageTitle({ title }: SetPageTitleProps) {
  const { setTitle } = useTitle();

  useEffect(() => {
    setTitle(title);
    return () => setTitle(null);
  }, [title, setTitle]);

  return null;
}
