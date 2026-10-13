import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { CircleAlert } from "lucide-react";
import styles from "./field.module.css";

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  /** Visually hide the label (still read by screen readers). */
  hideLabel?: boolean;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
  className?: string;
};

export function Field({ label, hint, error, optional, hideLabel, children, className = "" }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`${styles.field} ${className}`}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : styles.label}>
        {label} {optional && <span className={styles.optional}>(optional)</span>}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error ? (
        <p id={errorId} className={styles.error}>
          <CircleAlert size={14} aria-hidden /> {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className = "", ...props },
  ref,
) {
  return <input ref={ref} className={`${styles.control} ${className}`} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className = "", ...props },
  ref,
) {
  return <textarea ref={ref} className={`${styles.control} ${className}`} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className = "", ...props },
  ref,
) {
  return <select ref={ref} className={`${styles.control} ${className}`} {...props} />;
});

/** Input with a fixed leading addon, e.g. "+63" or "₱". */
export const InputGroup = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { addon: ReactNode }>(
  function InputGroup({ addon, className = "", ...props }, ref) {
    return (
      <div className={`${styles.group} ${className}`}>
        <span className={styles.addon} aria-hidden>
          {addon}
        </span>
        <input ref={ref} className={styles.control} {...props} />
      </div>
    );
  },
);
