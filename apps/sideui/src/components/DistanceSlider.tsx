import * as React from "react";
import Slider from "@/shims/slider";

type Props = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (v: number) => void;
  onDone?: (v: number) => void;
};

const DistanceSlider: React.FC<Props> = ({ value, min = 1, max = 100, step = 1, onChange, onDone }) => {
  return (
    <div style={{ width: "100%", padding: "8px 0" }}>
      <Slider
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={step}
        minimumTrackTintColor="#111827"
        maximumTrackTintColor="rgba(0,0,0,0.15)"
        thumbTintColor="#111827"
        onValueChange={(v) => onChange?.(v)}
        onSlidingComplete={(v) => onDone?.(v)}
      />
    </div>
  );
};

export default DistanceSlider;
