import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  fullWidth?: boolean;
}

export function Input({ className = '', fullWidth = true, ...props }: InputProps) {
  const classes = [styles.input, fullWidth ? styles.fullWidth : '', className]
    .filter(Boolean)
    .join(' ');

  return <input className={classes} {...props} />;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  fullWidth?: boolean;
}

export function Select({
  className = '',
  fullWidth = true,
  children,
  ...props
}: SelectProps) {
  const classes = [styles.input, fullWidth ? styles.fullWidth : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <select className={classes} {...props}>
      {children}
    </select>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  fullWidth?: boolean;
}

export function Textarea({ className = '', fullWidth = true, ...props }: TextareaProps) {
  const classes = [styles.input, styles.textarea, fullWidth ? styles.fullWidth : '', className]
    .filter(Boolean)
    .join(' ');

  return <textarea className={classes} {...props} />;
}
