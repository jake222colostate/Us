import "./DistanceSlider.css";

interface DistanceSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}

export default function DistanceSlider({ value, min = 1, max = 100, step = 1, onChange }: DistanceSliderProps) {
  return (
    <div className="distance-slider">
      <div className="distance-slider__labels">
        <span>{min} km</span>
        <span>{max} km</span>
      </div>
      <input
        type="range"
        className="distance-slider__input"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="distance-slider__value">Preferred radius: {value.toFixed(0)} km</div>
    </div>
  );
}
