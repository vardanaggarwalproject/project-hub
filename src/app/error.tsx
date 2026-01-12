"use client";

import { ErrorView } from "@/components/shared/error-view";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <ErrorView 
      error={error} 
      reset={reset} 
      title="Unexpected Error"
      message="We encountered an unexpected problem. Our team has been notified."
      fullScreen={true}
    />
  );
}
