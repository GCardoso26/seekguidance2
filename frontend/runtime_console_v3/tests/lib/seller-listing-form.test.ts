/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from "vitest";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { renderHook, act } from "@testing-library/react";
import {
  parseSellerListingForm,
  sellerListingFormSchema,
  type SellerListingFormValues,
} from "@/lib/seller-listing-form";

describe("sellerListingFormSchema", () => {
  it("rejeita preço inválido", () => {
    const result = parseSellerListingForm({
      price: -1,
      quantity: 1,
      condition: "NM",
    });
    expect(result.success).toBe(false);
  });

  it("aceita valores válidos", () => {
    const result = parseSellerListingForm({
      price: 49.9,
      quantity: 2,
      condition: "LP",
    });
    expect(result.success).toBe(true);
  });
});

describe("react-hook-form + zod resolver", () => {
  it("integra resolver zod no formulário", async () => {
    const onValid = vi.fn();
    const onInvalid = vi.fn();

    const { result } = renderHook(() =>
      useForm<SellerListingFormValues>({
        resolver: zodResolver(sellerListingFormSchema),
        defaultValues: { price: 25, quantity: 2, condition: "NM" },
      }),
    );

    await act(async () => {
      await result.current.handleSubmit(onValid, onInvalid)();
    });
    expect(onValid).toHaveBeenCalledTimes(1);
    expect(onInvalid).not.toHaveBeenCalled();

    await act(async () => {
      result.current.reset({ price: -1, quantity: 0, condition: "NM" });
      await result.current.handleSubmit(onValid, onInvalid)();
    });
    expect(onInvalid).toHaveBeenCalledTimes(1);
  });
});
