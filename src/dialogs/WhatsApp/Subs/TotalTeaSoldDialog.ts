// Node modules.
import {
	IDialog,
	ServiceWhatsappBaseDialog,
	TBaseDialogCtor,
} from 'cxperium-bot-engine';
import { getTotalTeaSold } from '../../../helpers/SQLConnection';
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
		const a = await getTotalTeaSold(customerId);
		await this.sendButtonMessage(
			'🍃 Bilgilendirme Mesajı',
			'🍃 Vega Gıda A.Ş.',
			`Sayın *${this.conversation.getCache('userName')}*, ` +
				JSON.stringify(a[0]).split('"')[3] +
				' Ana menüye aşağıdaki butondan devam edebilirsiniz.',
			button,
		);
	}
}
