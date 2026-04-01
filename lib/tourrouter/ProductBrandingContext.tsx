"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const branding = useMemo(() => getProductContext(pathname), [pathname]);
  return (
    <ProductBrandingContext.Provider value={branding}>
      {children}
    </ProductBrandingContext.Provider>
  );
}

export function useProductBranding() {
  return useContext(ProductBrandingContext);
}
