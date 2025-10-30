import React from "react";

export type SliderProps = {
  value?: number;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  onValueChange?: (v: number) => void;
  style?: React.CSSProperties;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "min" | "max" | "step" | "value">;

export const Slider: React.FC<SliderProps> = ({
  value,
  minimumValue = 0,
  maximumValue = 1,
  step = 0.01,
  onValueChange,
  style,
  ...rest
}) => (
  <input
    type="range"
    min={minimumValue}
    max={maximumValue}
    step={step}
    value={value}
    onChange={(e) => onValueChange?.(parseFloat(e.currentTarget.value))}
    style={style}
    {...rest}
  />
);

export default Slider;
