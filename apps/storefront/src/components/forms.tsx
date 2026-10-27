'use client';

import { Button, cn } from '@karcher/ui';
import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  useEffect,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { useFormStatus } from 'react-dom';

/** What a form's Server Action returns when it does not redirect. */
export type FormState = { error?: string; success?: string } | null;

export type FormAction = (state: FormState, formData: FormData) => Promise<FormState>;

const PendingContext = createContext(false);

/**
 * A form posting to a Server Action, showing the message it returns.
 * Works before hydration too: the browser submits it as a plain POST.
 * After hydration it submits from onSubmit, because React resets a form after its `action` runs:
 * a mistyped password would also clear the e-mail. Fields are cleared only after a success.
 */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);
  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className={cn('space-y-4', className)}
    >
      {state?.error ? (
        <p
          role="alert"
          className="rounded-card border border-danger/40 bg-danger/5 p-3 text-sm text-danger"
        >
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p
          role="status"
          className="rounded-card border border-success/40 bg-success/5 p-3 text-sm text-success"
        >
          {state.success}
        </p>
      ) : null}
      <PendingContext.Provider value={pending}>{children}</PendingContext.Provider>
    </form>
  );
}

export function SubmitButton({
  children,
  variant,
  className,
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}) {
  const formStatus = useFormStatus();
  const pending = useContext(PendingContext) || formStatus.pending;
  return (
    <Button
      type="submit"
      variant={variant}
      disabled={pending}
      aria-busy={pending}
      className={className}
    >
      {children}
    </Button>
  );
}

const inputClass = 'w-full rounded-card border border-line px-3 py-2';

export function Field({
  label,
  hint,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; hint?: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-semibold">
        {label}
        {input.required ? null : <span className="font-normal text-ink-muted"> (facultatif)</span>}
      </span>
      <input {...input} className={inputClass} />
      {hint ? <span className="block text-xs text-ink-muted">{hint}</span> : null}
    </label>
  );
}

export function TextArea({
  label,
  name,
  required,
  defaultValue,
  rows = 5,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  rows?: number;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-semibold">
        {label}
        {required ? null : <span className="font-normal text-ink-muted"> (facultatif)</span>}
      </span>
      <textarea
        name={name}
        required={required}
        defaultValue={defaultValue}
        rows={rows}
        className={inputClass}
      />
    </label>
  );
}
