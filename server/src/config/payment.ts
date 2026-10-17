/**
 * Bank-transfer minimum: orders below this total cannot be paid by bank
 * transfer (mirrors the 1.000đ floor of the transfer rails). Single source
 * for the threshold previously encoded in both `redemptionPlan` and the
 * create() `validate-minimum` step.
 */
export const BANK_TRANSFER_MIN_VND = 1000;
