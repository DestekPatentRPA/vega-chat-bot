// Node modules.
import {
	IDialog,
	ServiceWhatsappBaseDialog,
	TBaseDialogCtor,
} from 'cxperium-bot-engine';

import { getUserIdData, getUserInformation } from '../../helpers/SQLConnection';

export default class extends ServiceWhatsappBaseDialog implements IDialog {
	constructor(data: TBaseDialogCtor) {
		super(data);
	}
	// HASAN BEY TELEFON NUMARASI = 5305470851
	async runDialog(): Promise<void> {
		const userId = await getUserIdData(this.contact.phone.substring(2, 12));
		const userName = await getUserInformation(userId[0].CustomerId);
		this.conversation.setCache('userName', userName[0]['AD SOYAD']);

		if (userId.length == 0 || userId.length > 1) {
			await this.sendMessage(
				'*‼️ Hata Mesajı* : Telefon numaranız sistemde kayıtlı değil veya birden fazla müşteri profili mevcut. Lütfen sistem yöneticisi ile görüşüp mevcut durumun düzeltilmesini talep ediniz.\n\n*🍃 Vega Gıda A.Ş. 🍃*',
			);
			throw new Error('end');
		}

		this.conversation.setCache('customerId', userId[0].CustomerId);

		const getCustomerId = this.conversation.getCache('customerId');
		console.log('getCustomerId', getCustomerId);
	}
}
