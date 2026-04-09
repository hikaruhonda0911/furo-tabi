import { Input } from '@base-ui/react/input';
import type { ComponentProps } from 'react';

type UiInputProps = ComponentProps<typeof Input> & {
  inputHeight?: 'sm' | 'md';
};

const heightClass = { sm: 'h-9', md: 'h-11' };

export function UiInput({
  inputHeight = 'sm',
  className,
  ...props
}: UiInputProps) {
  const cls = `w-full bg-transparent border-0 border-b border-border rounded-none px-0 text-sm leading-5 outline-none transition-colors focus:border-foreground ${heightClass[inputHeight]}${className ? ` ${className}` : ''}`;
  return <Input className={cls} {...props} />;
}
