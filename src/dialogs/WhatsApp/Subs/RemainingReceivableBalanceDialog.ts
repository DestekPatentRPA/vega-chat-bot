// Node modules.
import {
	IDialog,
	ServiceWhatsappBaseDialog,
	TBaseDialogCtor,
} from 'cxperium-bot-engine';
import { getRemainingReceivableBalance } from '../../../helpers/SQLConnection';
import { TButton } from 'cxperium-bot-engine/lib/types/whatsapp/message';

export default class extends ServiceWhatsappBaseDialog implements IDialog {
	constructor(data: TBaseDialogCtor) {
		super(data);
	}

	async runDialog(): Promise<void> {
		const button: TButton[] = [
			{
				id: '#main_menu',
				title: '🏠 Ana Menü',
			},
		];
		const customerId = await this.conversation.getCache('customerId');
		const sqlResult = await getRemainingReceivableBalance(customerId);
		await this.sendMessage(
			`Sayın *${this.contact.userProfileName}*,` +
				sqlResult[0].BAKIYEDURUM,
		);

		await this.sendButtonMessage(
			'🍃 Bilgilendirme Mesajı',
			'🍃 Vega Gıda A.Ş.',
			`Sayın *${this.contact.userProfileName}*, ` +
				sqlResult[0].BAKIYEDURUM +
				' Ana menüye aşağıdaki butondan devam edebilirsiniz.',
			button,
		);
	}
}
