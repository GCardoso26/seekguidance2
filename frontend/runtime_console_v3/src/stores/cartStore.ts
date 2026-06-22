"use client";

import { create } from "zustand";

interface CartUiState {
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

/** Estado UI do drawer do carrinho (dados vêm do shop API server-side). */
export const useCartStore = create<CartUiState>((set, get) => ({
  isOpen: false,
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set({ isOpen: !get().isOpen }),
}));
