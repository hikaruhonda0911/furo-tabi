import { Button } from '@base-ui/react/button';
import type { ComponentProps } from 'react';

type Variant = 'primary' | 'outline' | 'ghost';

type BaseProps = {
  variant?: Variant;
  className?: string;
  children?: React.ReactNode;
};

type ButtonAsButton = BaseProps &
  Omit<ComponentProps<'button'>, keyof BaseProps> & { href?: undefined };

type ButtonAsAnchor = BaseProps &
  Omit<ComponentProps<'a'>, keyof BaseProps> & { href: string };

export type UiButtonProps = ButtonAsButton | ButtonAsAnchor;

const variantClass: Record<Variant, string> = {
  primary:
    'inline-flex items-center justify-center rounded-lg border-0 bg-foreground px-4 py-2 text-sm font-medium text-white transition-all cursor-pointer hover:bg-gray-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
  outline:
    'inline-flex items-center justify-center rounded-lg border border-border bg-transparent px-4 py-2 text-sm text-muted transition-all cursor-pointer hover:border-foreground/20 hover:bg-slate-50 active:scale-[0.98]',
  ghost:
    'inline-flex items-center text-sm transition-colors cursor-pointer border-0 bg-transparent p-0 text-inherit min-h-0',
};

export function UiButton({
  variant = 'primary',
  className,
  ...props
}: UiButtonProps) {
  const cls = className
    ? `${variantClass[variant]} ${className}`
    : variantClass[variant];

  if ('href' in props && props.href) {
    return <a className={cls} {...(props as ComponentProps<'a'>)} />;
  }

  return (
    <Button
      className={cls}
      {...(props as Omit<ComponentProps<typeof Button>, 'className'>)}
    />
  );
}
