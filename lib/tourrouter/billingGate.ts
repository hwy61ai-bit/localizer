// TODO: Enable billing gate after Stripe products are created
// For now, always return true to allow access during development

export async function checkTourRouterAccess(_orgId: string): Promise<boolean> {
  // When ready to enforce:
  // 1. Query orgs table for tourrouter_plan_status === 'active'
  // 2. Check trial period
  // 3. Check admin override
  return true;
}
