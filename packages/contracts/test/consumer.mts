import { moneySchema, moneyToCents, type Money, type SuccessEnvelope } from '@project/contracts';

const amount: Money = moneySchema.parse('0.10');
const cents: bigint = moneyToCents(amount);
const response: SuccessEnvelope<{ amount: Money }> = {
  data: { amount }, meta: { correlationId: 'consumer-esm' },
};

export { cents, response };
