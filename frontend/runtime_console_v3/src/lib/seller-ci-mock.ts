/** Em CI o backend Render costuma responder 200 com payload vazio — usar mocks do sprint. */
export function useSellerCiMocks(): boolean {
  return process.env.CI === "true";
}
