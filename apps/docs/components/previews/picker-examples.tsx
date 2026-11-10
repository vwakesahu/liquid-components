"use client";

import { useState } from "react";
import { LiquidStepper, LiquidWheel, LiquidWheelPicker } from "@liquid-ui/core";

const range = (from: number, to: number, pad = 0) =>
  Array.from({ length: to - from + 1 }, (_, index) => String(from + index).padStart(pad, "0"));

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function WheelDatePreview() {
  const [month, setMonth] = useState("November");
  const [year, setYear] = useState("2026");
  const days = new Date(Number(year), MONTHS.indexOf(month) + 1, 0).getDate();
  return (
    <LiquidWheelPicker aria-label="Date" className="picker-demo picker-demo--date">
      <LiquidWheel aria-label="Month" options={MONTHS} value={month} onValueChange={setMonth} className="picker-demo__month" />
      <LiquidWheel aria-label="Day" options={range(1, days)} defaultValue="11" />
      <LiquidWheel aria-label="Year" options={range(2020, 2032)} value={year} onValueChange={setYear} />
    </LiquidWheelPicker>
  );
}

export function WheelTimerPreview() {
  return (
    <LiquidWheelPicker aria-label="Timer" className="picker-demo">
      <LiquidWheel aria-label="Hours" options={range(0, 23)} defaultValue="0" unit="hours" />
      <LiquidWheel aria-label="Minutes" options={range(0, 59)} defaultValue="15" unit="min" />
      <LiquidWheel aria-label="Seconds" options={range(0, 59)} defaultValue="0" unit="sec" />
    </LiquidWheelPicker>
  );
}

export function WheelRepeatPreview() {
  return (
    <LiquidWheelPicker aria-label="Repeat" className="picker-demo picker-demo--single">
      <LiquidWheel
        aria-label="Repeat"
        options={["Never", "Every day", "Weekdays", "Weekends", "Every week", "Every month"]}
        defaultValue="Weekdays"
      />
    </LiquidWheelPicker>
  );
}

export function WheelControlledPreview() {
  const [hour, setHour] = useState("7");
  const [minute, setMinute] = useState("30");
  const [period, setPeriod] = useState("AM");
  return (
    <div className="picker-demo__stack">
      <LiquidWheelPicker aria-label="Alarm time" className="picker-demo">
        <LiquidWheel aria-label="Hour" options={range(1, 12)} value={hour} onValueChange={setHour} />
        <LiquidWheel aria-label="Minute" options={range(0, 59, 2)} value={minute} onValueChange={setMinute} />
        <LiquidWheel aria-label="Period" options={["AM", "PM"]} value={period} onValueChange={setPeriod} />
      </LiquidWheelPicker>
      <p className="picker-demo__readout" aria-live="polite">
        Alarm {hour}:{minute} {period}
      </p>
    </div>
  );
}

export function StepperCartPreview() {
  const [quantity, setQuantity] = useState(1);
  const price = 129;
  return (
    <div className="picker-demo__card">
      <div className="picker-demo__item">
        <span>
          <strong>AirPods Pro</strong>
          <small>${price} each</small>
        </span>
        <LiquidStepper value={quantity} onValueChange={setQuantity} min={1} max={9} aria-label="Quantity" />
      </div>
      <div className="picker-demo__total">
        <span>Total</span>
        <strong>${(price * quantity).toLocaleString()}</strong>
      </div>
    </div>
  );
}

export function StepperSettingsPreview() {
  return (
    <div className="picker-demo__card">
      <div className="picker-demo__item">
        <span>
          <strong>Font size</strong>
          <small>Applies to reading view</small>
        </span>
        <LiquidStepper defaultValue={17} min={12} max={28} format={(value) => `${value} pt`} aria-label="Font size" />
      </div>
      <div className="picker-demo__item">
        <span>
          <strong>Snooze</strong>
          <small>Minutes between alarms</small>
        </span>
        <LiquidStepper defaultValue={9} min={1} max={30} aria-label="Snooze minutes" />
      </div>
      <div className="picker-demo__item">
        <span>
          <strong>Zoom</strong>
          <small>Compact, no value</small>
        </span>
        <LiquidStepper defaultValue={1} min={0} showValue={false} aria-label="Zoom" />
      </div>
    </div>
  );
}
