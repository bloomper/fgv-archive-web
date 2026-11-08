"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/**
 * A form's submit button that shows a spinner while the form is pending, e.g. while a `next/form` GET loads the next
 * page client side.
 */
export function SubmitButton({ children, ...props }: Omit<ComponentProps<typeof Button>, "type">) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" aria-busy={pending || undefined} {...props}>
      {pending && <Spinner aria-hidden role={undefined} />}
      {children}
    </Button>
  );
}
