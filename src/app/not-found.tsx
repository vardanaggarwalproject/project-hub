"use client";

import { ErrorView } from "@/components/shared/error-view";

export default function NotFound() {
  return (
    <ErrorView 
      type="404"
      title="Page Not Found"
      message="Oops! The page you're looking for seems to have wandered off."
      fullScreen={true}
    />
  );
}
