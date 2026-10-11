import { z } from 'zod';

export const sanctionDecisionSchema = z
  .object({
    action: z.enum(['APPROVE', 'REJECT'], {
      errorMap: () => ({ message: 'Action must be either APPROVE or REJECT' }),
    }),
    remarks: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (data.action === 'REJECT') {
        return Boolean(data.remarks && data.remarks.length >= 5);
      }
      return true;
    },
    {
      message: 'A detailed rejection reason (at least 5 characters) is required when rejecting a loan.',
      path: ['remarks'],
    }
  );

export const disburseLoanSchema = z.object({
  referenceNumber: z.string().min(3, 'Fund disbursement reference number is required (min 3 characters)'),
  notes: z.string().optional(),
});

export const recordPaymentSchema = z.object({
  utrNumber: z
    .string()
    .trim()
    .toUpperCase()
    .min(6, 'Valid UTR number must be at least 6 characters long'),
  amount: z
    .number()
    .positive('Payment amount must be greater than zero'),
  paymentDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid payment date is required',
  }),
  notes: z.string().optional(),
});

export type SanctionDecisionInput = z.infer<typeof sanctionDecisionSchema>;
export type DisburseLoanInput = z.infer<typeof disburseLoanSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
