"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import type { CartState } from "@/lib/cart/types";
import { CartSheet } from "./cart-sheet";

type CartContextValue = {
  open: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  cart,
  children,
}: {
  cart: CartState;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // The sheet stays open only while the user is on the path where it was
  // opened; navigating away hides it without needing a setState effect.
  const [openedAt, setOpenedAt] = useState(pathname);

  const openCart = useCallback(() => {
    setOpenedAt(pathname);
    setOpen(true);
  }, [pathname]);

  const closeCart = useCallback(() => setOpen(false), []);

  const value = useMemo(() => {
    const visible = open && pathname === openedAt;
    return { open: visible, openCart, closeCart };
  }, [open, pathname, openedAt, openCart, closeCart]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartSheet cart={cart} open={value.open} onClose={closeCart} />
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (value === null) {
    throw new Error("useCart must be used inside a CartProvider");
  }
  return value;
}