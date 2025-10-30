import * as React from "react";

type Props = {
  value?: number;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  disabled?: boolean;
  style?: React.CSSProperties;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  onValueChange?: (v: number) => void;
  onSlidingComplete?: (v: number) => void;
};

const Slider: React.FC<Props> = ({
  value = 0,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  disabled,
  style,
  minimumTrackTintColor,
  maximumTrackTintColor,
  thumbTintColor,
  onValueChange,
  onSlidingComplete,
}) => {
  const [v, setV] = React.useState(value);
  React.useEffect(() => setV(value), [value]);

  const pct =
    maximumValue !== minimumValue
      ? ((v - minimumValue) / (maximumValue - minimumValue)) * 100
      : 0;

  return (
    <div style={{ position: "relative", width: "100%", ...style }}>
      <input
        type="range"
        min={minimumValue}
        max={maximumValue}
        step={step}
        value={v}
        disabled={disabled}
        onChange={(e) => {
          const nv = Number(e.target.value);
          setV(nv);
          onValueChange?.(nv);
        }}
        onMouseUp={() => onSlidingComplete?.(v)}
        onTouchEnd={() => onSlidingComplete?.(v)}
        style={{
          width: "100%",
          WebkitAppearance: "none",
          background: "transparent",
          height: 24,
          margin: 0,
          position: "relative",
          zIndex: 3,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          height: 4,
          borderRadius: 999,
          background: maximumTrackTintColor ?? "rgba(0,0,0,0.15)",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          width: `${pct}%`,
          top: "50%",
          transform: "translateY(-50%)",
          height: 4,
          borderRadius: 999,
          background: minimumTrackTintColor ?? "currentColor",
          zIndex: 2,
        }}
      />
      <style>{`
        input[type="range"]::-webkit-slider-thumb{
          -webkit-appearance: none; appearance: none;
          width: 18px; height: 18px; border-radius: 50%;
          background: ${thumbTintColor ?? "#111827"}; border: 0; cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb{
          width: 18px; height: 18px; border-radius: 50%;
          background: ${thumbTintColor ?? "#111827"}; border: 0; cursor: pointer;
        }
        input[type="range"]::-webkit-slider-runnable-track{ height: 24px; background: transparent; }
        input[type="range"]::-moz-range-track{ height: 24px; background: transparent; }
      `}</style>
    </div>
  );
};

export default Slider;
