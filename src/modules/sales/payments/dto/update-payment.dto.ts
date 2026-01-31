import { PartialType } from '@nestjs/swagger'; // Use swagger PartialType for correct reflection
import { CreatePaymentDto } from './create-payment.dto';

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) { }
