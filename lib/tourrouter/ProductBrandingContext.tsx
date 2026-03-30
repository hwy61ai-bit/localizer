"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { getProductContext } from "./productBranding";

type ProductBranding = ReturnType<typeof getProductContext>;

const defaultContext: ProductBranding = {
  name: "LOCALIZER",
  isLocalizer: true,
  isTourRouter: false,
  isDiy: false,
};

const ProductBrandingContext = createContext<ProductBranding>(defaultContext);

export function ProductBrandingProvider({ children }: { children: ReactNode }) {
  const branding = useMemo(() => getProductContext(), []);
  return (
    <ProductBrandingContext.Provider value={branding}>
      {children}
    </ProductBrandingContext.Provider>
  );
}

export function useProductBranding() {
  return useContext(ProductBrandingContext);
}
