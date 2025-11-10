import type * as React from 'react';

declare module 'react-hook-form' {
  export interface FieldError {
    message?: string;
    type?: string;
  }

  export interface FormState<TFieldValues> {
    errors: Partial<Record<keyof TFieldValues & string, FieldError>>;
  }

  export type SubmitHandler<TFieldValues> = (values: TFieldValues) => void | Promise<void>;

  export interface ControllerRenderProps<TFieldValues>
    extends Record<string, unknown> {
    value: TFieldValues[keyof TFieldValues & string];
    onChange: (value: any) => void;
  }

  export interface ControllerRenderParams<TFieldValues> {
    field: ControllerRenderProps<TFieldValues>;
  }

  export interface ControllerProps<TFieldValues> {
    control: Control<TFieldValues>;
    name: keyof TFieldValues & string;
    render: (props: ControllerRenderParams<TFieldValues>) => React.ReactElement | null;
  }

  export interface Control<TFieldValues> extends Record<string, unknown> {}

  export interface UseFormReturn<TFieldValues> {
    control: Control<TFieldValues>;
    handleSubmit: (handler: SubmitHandler<TFieldValues>) => (event?: unknown) => void;
    formState: FormState<TFieldValues>;
  }

  export interface UseFormOptions<TFieldValues> {
    defaultValues?: Partial<TFieldValues>;
    resolver?: unknown;
  }

  export function useForm<TFieldValues = Record<string, any>>(
    options?: UseFormOptions<TFieldValues>,
  ): UseFormReturn<TFieldValues>;

  export const Controller: <TFieldValues = Record<string, any>>(
    props: ControllerProps<TFieldValues>,
  ) => React.ReactElement | null;
}
