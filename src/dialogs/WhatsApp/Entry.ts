// Node modules.
import {
	IDialog,
	ServiceWhatsappBaseDialog,
	TBaseDialogCtor,
} from 'cxperium-bot-engine';

import { getUserIdData } from '../../helpers/SQLConnection';

export default class extends ServiceWhatsappBaseDialog implements IDialog {
	constructor(data: TBaseDialogCtor) {
		super(data);
	}

	async runDialog(): Promise<void> {

		const userId = await getUserIdData(this.contact.phone.substring(2,12));

		console.log("userId", userId)

		if (userId.length == 0 || userId.length > 1) {
			console.log("user.lenght")
			await this.sendMessage(
				'*‼️ Hata Mesajı* : Telefon numaranız sistemde kayıtlı değil veya birden fazla müşteri profili mevcut. Lütfen sistem yöneticisi ile görüşüp mevcut durumun düzeltilmesini talep ediniz.\n\n*🍃 Vega Gıda A.Ş. 🍃*',
			);
			throw new Error('end');
		}

		this.conversation.setCache('customerId', userId[0].CustomerId);

		const getCustomerId = this.conversation.getCache('customerId');
		console.log("getCustomerId", getCustomerId);
	}
}
