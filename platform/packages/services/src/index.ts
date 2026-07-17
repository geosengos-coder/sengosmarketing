/**
 * @operatoros/services — the use-case / service layer (ADR-0010).
 * Business logic lives here; routes and the gateway stay thin.
 */
export type { ServiceContext } from "./context";
export { validate } from "./validate";
export * as organizationService from "./organization.service";
export * as aiEmployeeService from "./ai-employee.service";
