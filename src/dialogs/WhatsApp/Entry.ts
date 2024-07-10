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
		//* if you want to finish entry throw this error.
		// throw new Error('end');
		const userId = await getUserIdData('5368876104');
		if (userId.length == 0 || userId.length > 1) {
			await this.sendMessage(
				'*‼️ Hata Mesajı* : Telefon numaranız sistemde kayıtlı değil veya birden fazla müşteri profili mevcut. Lütfen sistem yöneticisi ile görüşüp mevcut durumun düzeltilmesini talep ediniz.\n\n*🍃 Vega Gıda A.Ş. 🍃*',
			);
			throw new Error('end');
		} else {
			this.conversation.setCache('customerId', userId[0].CustomerId);
			const a = this.conversation.getCache('customerId');
			console.log(a + 'asdfasdf');
		}
	}
}
