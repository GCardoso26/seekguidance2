/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from "vitest";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { renderHook, act } from "@testing-library/react";
import {
  listingConditionToApi,
  parseSellerListingForm,
  sellerListingFormSchema,
  type SellerListingFormValues,
} from "@/lib/seller-listing-form";

describe("sellerListingFormSchema", () => {
  it("rejeita preço inválido", () => {
    const result = parseSellerListingForm({
      name: "Lightning Bolt",
      price: -1,
      quantity: 1,
      condition: "nm",
    });
    expect(result.success).toBe(false);
  });

  it("aceita valores válidos", () => {
    const result = parseSellerListingForm({
      name: "Counterspell",
      price: 49.9,
      quantity: 2,
      condition: "lp",
      description: "Carta em bom estado",
    });
    expect(result.success).toBe(true);
  });

  it("converte condição para API", () => {
    expect(listingConditionToApi("nm")).toBe("NM");
    expect(listingConditionToApi("hp")).toBe("HP");
  });
});

describe("react-hook-form + zod resolver", () => {
  it("integra resolver zod no formulário", async () => {
    const onValid = vi.fn();
    const onInvalid = vi.fn();

    const { result } = renderHook(() =>
      useForm<SellerListingFormValues>({
        resolver: zodResolver(sellerListingFormSchema),
        defaultValues: {
          name: "Test Card",
          price: 25,
          quantity: 2,
          condition: "nm",
        },
      }),
    );

    await act(async () => {
      await result.current.handleSubmit(onValid, onInvalid)();
    });
    expect(onValid).toHaveBeenCalledTimes(1);
    expect(onInvalid).not.toHaveBeenCalled();

    await act(async () => {
      result.current.reset({
        name: "X",
        price: -1,
        quantity: 0,
        condition: "nm",
      });
      await result.current.handleSubmit(onValid, onInvalid)();
    });
    expect(onInvalid).toHaveBeenCalledTimes(1);
  });
});
