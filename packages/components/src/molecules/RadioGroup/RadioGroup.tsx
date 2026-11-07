import { cx } from "@dbm-system/utils";
import { RadioGroupContext } from "../../atoms/Radio/RadioGroupContext";
import { RadioGroupSizeContext } from "../../atoms/Radio/RadioGroupSizeContext";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { forwardRef, useRef } from "react";
import styles from "./RadioGroup.module.css";
import type { RadioGroupOrientation, RadioGroupProps } from "./RadioGroup.types";
import { useProvidedDirection } from "../../internal/useProvidedDirection";

const orientationClass: Record<RadioGroupOrientation, string | undefined> = {
  vertical: styles.orientationVertical,
  horizontal: styles.orientationHorizontal,
};

/**
 * Manages a group of `Radio` options sharing one selection, built on Radix
 * UI's RadioGroup primitive. Provides the real shared Root every grouped
 * `Radio` participates in — pass a distinct `value` on each `Radio` child to
 * identify it. Accepts both controlled (`value`/`onValueChange`) and
 * uncontrolled (`defaultValue`) usage. `ref` forwards to the underlying
 * `<div role="radiogroup">`.
 *
 * @example
 * ```tsx
 * <RadioGroup aria-label="Contact method" defaultValue="email">
 *   <Radio value="email">Email</Radio>
 *   <Radio value="sms">SMS</Radio>
 *   <Radio value="phone">Phone call</Radio>
 * </RadioGroup>
 * <RadioGroup
 *   aria-label="Plan"
 *   value={plan}
 *   onValueChange={setPlan}
 *   orientation="horizontal"
 * >
 *   <Radio value="monthly">Monthly</Radio>
 *   <Radio value="annual">Annual</Radio>
 * </RadioGroup>
 * <RadioGroup aria-label="Plan" size="sm" defaultValue="monthly">
 *   <Radio value="monthly">Monthly</Radio>
 *   <Radio value="annual">Annual</Radio>
 * </RadioGroup>
 * ```
 */
export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      children,
      size,
      value,
      defaultValue,
      onValueChange,
      hasError = false,
      disabled,
      required,
      name,
      form,
      orientation = "vertical",
      dir: dirProp,
      loop = true,
      id,
      className,
      ...props
    },
    ref,
  ) => {
    const providedDir = useProvidedDirection();
    const dir = dirProp ?? providedDir;
    const hasWarnedNoAccessibleNameRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (
        !props["aria-label"] &&
        !props["aria-labelledby"] &&
        !hasWarnedNoAccessibleNameRef.current
      ) {
        hasWarnedNoAccessibleNameRef.current = true;
        console.warn(
          "RadioGroup: no accessible name — pass `aria-label`, or `aria-labelledby` pointing at a visible label, so assistive tech announces what this group of options represents. A radiogroup with no accessible name is confusing for screen reader users.",
        );
      }
    }

    return (
      <RadioGroupPrimitive.Root
        ref={ref}
        {...props}
        id={id}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        required={required}
        name={name}
        form={form}
        orientation={orientation}
        dir={dir}
        loop={loop}
        aria-invalid={hasError || undefined}
        className={cx(
          styles.root,
          orientationClass[orientation],
          hasError && styles.error,
          className,
        )}
      >
        <RadioGroupContext.Provider value={true}>
          <RadioGroupSizeContext.Provider value={size}>
            {children}
          </RadioGroupSizeContext.Provider>
        </RadioGroupContext.Provider>
      </RadioGroupPrimitive.Root>
    );
  },
);

RadioGroup.displayName = "RadioGroup";
