import { DiscountValueTypeEnum, type MoneyFragment } from "@dashboard/graphql";
import { useCallback, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useIntl } from "react-intl";

import { messages } from "./messages";
import { type OrderDiscountCommonInput } from "./types";
import { toFixed } from "@dashboard/utils/toFixed";

const numbersRegex = /^[0-9]*\.?[0-9]+$/;

export interface DiscountFormData {
  value: string;
  reason: string;
  calculationMode: DiscountValueTypeEnum;
}

interface UseDiscountFormProps {
  maxPrice: MoneyFragment;
  existingDiscount?: OrderDiscountCommonInput;
  isOpen?: boolean;
  isLineDiscount: boolean;
}

const parseNumericValue = (value: string): number => parseFloat(value) || 0;

function convertValue(
  value: number,
  maxAmount: number,
  from: DiscountValueTypeEnum,
  to: DiscountValueTypeEnum,
  isLineDiscount: boolean,
): string {
  if (value === 0 || maxAmount === 0 || from === to) {
    return value.toString();
  }

  if (isLineDiscount) {
    const raw =
      from === DiscountValueTypeEnum.PERCENTAGE && to === DiscountValueTypeEnum.FIXED
        ? maxAmount - (value / 100) * maxAmount // % discount -> resulting price
        : (1 - value / maxAmount) * 100; // resulting price -> % discount

    return toFixed(raw.toString(), 2);
  }

  const percentageToFixed =
    from === DiscountValueTypeEnum.PERCENTAGE && to === DiscountValueTypeEnum.FIXED;
  const raw = percentageToFixed ? (value * maxAmount) / 100 : (value / maxAmount) * 100;

  return (Math.round(raw * 100) / 100).toString();
}

export const useDiscountForm = ({
  maxPrice,
  existingDiscount,
  isOpen,
  isLineDiscount,
}: UseDiscountFormProps) => {
  const intl = useIntl();
  const { currency, amount: maxAmount } = maxPrice;

  const previousCalculationMode = useRef<DiscountValueTypeEnum>(
    existingDiscount?.calculationMode || DiscountValueTypeEnum.PERCENTAGE,
  );

  const getDefaultValues = useCallback((): DiscountFormData => {
    const calculationMode = existingDiscount?.calculationMode || DiscountValueTypeEnum.PERCENTAGE;
    let value = "";

    if (existingDiscount?.value) {
      const stringifiedValue = existingDiscount.value.toString();

      if (isLineDiscount && calculationMode === DiscountValueTypeEnum.FIXED) {
        // stored value is the discount amount; display the resulting item price
        value = toFixed((maxAmount - parseFloat(stringifiedValue)).toString(), 2);
      } else if (calculationMode === DiscountValueTypeEnum.FIXED) {
        value = parseFloat(stringifiedValue).toString();
      } else {
        value = stringifiedValue;
      }
    }

    return {
      calculationMode,
      reason: existingDiscount?.reason || "",
      value,
    };
  }, [existingDiscount?.calculationMode, existingDiscount?.reason, existingDiscount?.value, isLineDiscount, maxAmount]);

  const { control, watch, setValue, reset, getValues } = useForm<DiscountFormData>({
    defaultValues: getDefaultValues(),
  });

  const calculationMode = watch("calculationMode");
  const value = watch("value");

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);

    const data = getDefaultValues();

    reset(data);
    previousCalculationMode.current = data.calculationMode;
  }

  const handleCalculationModeChange = useCallback(
    (newMode: DiscountValueTypeEnum) => {
      const rawValue = getValues("value");

      if (rawValue === "") {
        setValue("calculationMode", newMode);
        previousCalculationMode.current = newMode;

        return;
      }

      const currentValue = parseNumericValue(rawValue);
      const converted = convertValue(
        currentValue,
        maxAmount,
        previousCalculationMode.current,
        newMode,
        isLineDiscount,
      );

      setValue("value", converted);
      setValue("calculationMode", newMode);
      previousCalculationMode.current = newMode;
    },
    [getValues, maxAmount, setValue, isLineDiscount],
  );

  // Validation is derived rather than stored in formState.errors because
  // the error depends on both `value` and `calculationMode` (cross-field),
  // and using setError/clearErrors in an effect causes infinite re-renders
  // with react-hook-form's proxy-based formState subscriptions.
  const valueErrorMsg = useMemo(() => {
    if (value === "") {
      return null;
    }

    const isPercentage = calculationMode === DiscountValueTypeEnum.PERCENTAGE;
    // Note: for line discounts in FIXED mode, the field holds a resulting
    // price, but that's still capped by maxAmount, same as topAmount below.
    const topAmount = isPercentage ? 100 : maxAmount;
    const parsedValue = parseNumericValue(value);

    if (!numbersRegex.test(value)) {
      return intl.formatMessage(messages.invalidValue);
    }

    if (parsedValue > topAmount) {
      return isPercentage
        ? intl.formatMessage(messages.valueBiggerThan100)
        : intl.formatMessage(messages.valueBiggerThanPrice);
    }

    return null;
  }, [value, calculationMode, maxAmount, intl]);

  const parsedValue = parseNumericValue(value);
  const valueFieldSymbol = calculationMode === DiscountValueTypeEnum.FIXED ? currency : "%";
  const isSubmitDisabled = !parsedValue || !!valueErrorMsg;

  const getDiscountData = useCallback((): OrderDiscountCommonInput => {
    const currentCalculationMode = getValues("calculationMode");
    const currentValue = parseNumericValue(getValues("value"));

    const apiValue =
      isLineDiscount && currentCalculationMode === DiscountValueTypeEnum.FIXED
        ? Math.max(maxAmount - currentValue, 0)
        : currentValue;

    return {
      calculationMode: currentCalculationMode,
      reason: getValues("reason"),
      value: apiValue,
    };
  }, [getValues, isLineDiscount, maxAmount]);

  return {
    control,
    setValue,
    getValues,
    valueFieldSymbol,
    isSubmitDisabled,
    getDiscountData,
    valueErrorMsg,
    onCalculationModeChange: handleCalculationModeChange,
  };
};
